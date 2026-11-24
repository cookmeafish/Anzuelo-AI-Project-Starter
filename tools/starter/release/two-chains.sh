#!/usr/bin/env bash
# Two release chains back to back on one commit ($1, optional rerun name $2), the kernel pool and the temp folder's
# top-level count read before, between, during (every 5 minutes) and after. Chain A: frozen-chain.sh in its own frozen
# copy; chain B: the same steps in a second copy (<commit>-r2), then the leak check of both together. A failed chain A
# ends the pair. Logs: ~/.anzuelo-frozen/logs/ (two-chains-<key>.txt, chain-<key>.log).
# Usage (from a checkout of the starter): bash tools/starter/release/two-chains.sh <commit> [rerun name]
# Then, when both pass: bash tools/starter/release/push-release.sh <commit> "<proof message>". Starter-only.
# (the whole body in braces, parsed before it runs: an edit during the hour-long run cannot change it. Lesson (2026-11-15))
{
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=${ANZUELO_RELEASE_REPO:-$(cd "$(git -C "$HERE" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)}
WORK=${ANZUELO_RELEASE_WORK:-$(cd "$HERE/../../.." && pwd)}
L="$HOME/.anzuelo-frozen/logs"; mkdir -p "$L"
SHA=$1; KEY=$1${2:+-$2}; OUT=$L/two-chains-$KEY.txt
# (the release scripts run as committed in the commit under test, copied out first, never from the working checkout: an
# edit there during the run cannot change it. Lesson (2026-11-15): a mid-run edit to frozen-chain.sh killed a chain. A
# commit older than these scripts runs the working ones)
if [ -z "${ANZUELO_RELEASE_REPO:-}" ]; then
  C="$L/scripts-$KEY"; rm -rf "$C"; mkdir -p "$C"
  for f in two-chains.sh frozen-chain.sh; do git -C "$REPO" show "$SHA:tools/starter/release/$f" > "$C/$f" 2>/dev/null || cp "$HERE/$f" "$C/$f"; done
  ANZUELO_RELEASE_REPO="$REPO" ANZUELO_RELEASE_WORK="$WORK" exec bash "$C/two-chains.sh" "$@"
fi
# (the flag is read, then cleared: a step that inherits it skips the copy in any release script it starts. Lesson
# (2026-11-15): the release test ran inside a chain's self-test and failed only there)
unset ANZUELO_RELEASE_REPO ANZUELO_RELEASE_WORK
# (a dry run names the chain script it would run and what its steps inherit, for the release test)
if [ -n "${ANZUELO_RELEASE_DRY:-}" ]; then cat "$HERE/frozen-chain.sh"; echo "steps see: $(env | grep -c '^ANZUELO_RELEASE_\(REPO\|WORK\)=')"; exit 0; fi
# (the release runs with its own temp folder, and the leak check judges that folder (and Node's default compile cache,
# which lives in it): other projects' sessions write to the machine's temp folder while a release runs, and their files
# failed a chain whose own tests had all passed. The machine's folder is still read, reported only. Oversight, 2026-11-15)
TT="$HOME/.anzuelo-frozen/tmp-$KEY"; rm -rf "$TT"; mkdir -p "$TT"
export ANZUELO_SYSTEM_TEMP="$(cygpath -w "${TEMP:-/tmp}" 2>/dev/null || echo "${TEMP:-/tmp}")"
TW="$(cygpath -w "$TT" 2>/dev/null || echo "$TT")"; export TEMP="$TW" TMP="$TW" TMPDIR="$TT"
# (off Windows: the kernel's unreclaimable slab stands for the pool, as in leaks.mjs. The move to Linux, 2026-11-23)
pool() { if ! command -v powershell.exe > /dev/null 2>&1; then echo "$(date +%H:%M:%S) slab-unreclaim $(awk '/^SUnreclaim:/ { print int($2 / 1024) }' /proc/meminfo 2>/dev/null) MB temp $(ls -A "$TMPDIR" 2>/dev/null | wc -l) root $(ls -A "$TMPDIR/anzuelo-tests" 2>/dev/null | wc -l)"; return; fi; powershell.exe -NoProfile -Command '$m = Get-CimInstance Win32_PerfRawData_PerfOS_Memory; $n = [System.IO.Directory]::EnumerateFileSystemEntries($env:TEMP) | Measure-Object | Select-Object -ExpandProperty Count; $r = if (Test-Path "$env:TEMP\anzuelo-tests") { (Get-ChildItem -Force "$env:TEMP\anzuelo-tests" | Measure-Object).Count } else { 0 }; "{0} paged {1} MB nonpaged {2} MB temp {3} root {4}" -f (Get-Date -Format HH:mm:ss), [math]::Round($m.PoolPagedBytes/1MB), [math]::Round($m.PoolNonpagedBytes/1MB), $n, $r' 2>/dev/null | tr -d '\r'; }
# (no leaks: chain B's copy goes on any exit, passed, failed or stopped; only the newest 3 frozen copies stay)
trap 'git -C "$REPO" worktree remove --force "$HOME/.anzuelo-frozen/rel-$KEY-r2" 2>/dev/null; git -C "$REPO" worktree prune; rm -rf "$TT"' EXIT
for old in $(ls -dt "$HOME"/.anzuelo-frozen/rel-* 2>/dev/null | tail -n +4); do git -C "$REPO" worktree remove --force "$old" 2>/dev/null || rm -rf "$old"; done; git -C "$REPO" worktree prune
echo "before A: $(pool)" >> "$OUT"
# (the pool every 5 minutes into the same log while the chains run, so each step's share shows without separate runs)
( while [ ! -f "$L/two-chains-$KEY.done" ]; do sleep 300; [ -f "$L/two-chains-$KEY.done" ] || echo "tick: $(pool) | $(grep -hE '^(PASS|FAIL)' "$L/chain-$KEY.log" 2>/dev/null | tail -1 | cut -c1-40)" >> "$OUT"; done ) &
rm -f "$L/two-chains-$KEY.done"
cd "$WORK" && ANZUELO_RELEASE_REPO="$REPO" sh "$HERE/frozen-chain.sh" "$SHA" $2 > "$L/chain-$KEY.log" 2>&1; echo "chain A exit $?: $(grep -E '^CHAIN' "$L/chain-$KEY.log" | tail -1)" >> "$OUT"
echo "after A: $(pool)" >> "$OUT"
# (a failed chain A ends the pair: chain B on a commit that already failed only loads the machine. Lesson (2026-11-12):
# A failed its pre-audit in 8 s and B ran the whole suite on the same commit)
if ! grep -q '^CHAIN PASS' "$L/chain-$KEY.log"; then echo "chain A failed: chain B not started" >> "$OUT"; touch "$L/two-chains-$KEY.done"; echo "TWO-CHAINS DONE" >> "$OUT"; exit 1; fi
git -C "$REPO" worktree add -q --detach "$HOME/.anzuelo-frozen/rel-$KEY-r2" "$SHA" 2>> "$OUT"
cd "$HOME/.anzuelo-frozen/rel-$KEY-r2" && node tools/hooks/wire.mjs > /dev/null 2>&1; mkdir -p .cache
fail=0; for step in tools/hooks/v2/selftest.mjs tools/hooks/selfcheck.mjs tools/starter/v2-sweep.mjs tools/trial.mjs tools/audit.mjs; do [ -f "$TEMP/anzuelo-tests/STOP" ] && [ "$TEMP/anzuelo-tests/STOP" -nt "$OUT" ] && { echo "chain B stopped (stop-tests)" >> "$OUT"; fail=1; break; }; node "$PWD/$step" > ".cache/chainB-$(basename $step).txt" 2>&1 || { fail=1; echo "chain B FAIL $step" >> "$OUT"; cp ".cache/chainB-$(basename $step).txt" "$L/chainB-$SHA-$(basename $step).txt"; grep -m5 '^FAIL' ".cache/chainB-$(basename $step).txt" >> "$OUT"; }; done
echo "chain B done (fail=$fail)" >> "$OUT"
# (both chains together against the snapshot chain A took before it began; nothing else may run beside them: a suite
# run alongside once left its test folders and failed this check, 2026-11-14)
A="$HOME/.anzuelo-frozen/rel-$KEY"
node tools/starter/leaks.mjs --compare "$A/.cache/leaks-before.json" --skip-paged --record "$A/tools/hooks/engine-proof.json" beforeCleanup >> "$OUT" 2>&1 || { echo "chain B: LEAKS (both chains together)" >> "$OUT"; fail=1; }
echo "after B: $(pool)" >> "$OUT"
cd "$REPO" && git worktree remove --force "$HOME/.anzuelo-frozen/rel-$KEY-r2" && git worktree prune
# (the paged pool judged after chain B's copy is gone and 60 s of settling: the copies' file cache is not a leak, and
# growth that survives cleanup is. Chain A's copy stays for the proof commit. Oversight, 2026-11-15)
sleep 60; node "$A/tools/starter/leaks.mjs" --compare "$A/.cache/leaks-before.json" --record "$A/tools/hooks/engine-proof.json" afterCleanup >> "$OUT" 2>&1 || { echo "LEAKS after cleanup" >> "$OUT"; fail=1; }
touch "$L/two-chains-$KEY.done"
echo "TWO-CHAINS DONE" >> "$OUT"
[ "$fail" = 0 ] && echo "BOTH PASS: push with push-release.sh $SHA" >> "$OUT"
exit $fail
}
