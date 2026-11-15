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
REPO=$(cd "$(git -C "$HERE" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)
WORK=$(cd "$HERE/../../.." && pwd)
L="$HOME/.anzuelo-frozen/logs"; mkdir -p "$L"
SHA=$1; KEY=$1${2:+-$2}; OUT=$L/two-chains-$KEY.txt
pool() { powershell.exe -NoProfile -Command '$m = Get-CimInstance Win32_PerfRawData_PerfOS_Memory; $n = [System.IO.Directory]::EnumerateFileSystemEntries($env:TEMP) | Measure-Object | Select-Object -ExpandProperty Count; $r = if (Test-Path "$env:TEMP\anzuelo-tests") { (Get-ChildItem -Force "$env:TEMP\anzuelo-tests" | Measure-Object).Count } else { 0 }; "{0} paged {1} MB nonpaged {2} MB temp {3} root {4}" -f (Get-Date -Format HH:mm:ss), [math]::Round($m.PoolPagedBytes/1MB), [math]::Round($m.PoolNonpagedBytes/1MB), $n, $r' 2>/dev/null | tr -d '\r'; }
# (no leaks: chain B's copy goes on any exit, passed, failed or stopped; only the newest 3 frozen copies stay)
trap 'git -C "$REPO" worktree remove --force "$HOME/.anzuelo-frozen/rel-$KEY-r2" 2>/dev/null; git -C "$REPO" worktree prune' EXIT
for old in $(ls -dt "$HOME"/.anzuelo-frozen/rel-* 2>/dev/null | tail -n +4); do git -C "$REPO" worktree remove --force "$old" 2>/dev/null || rm -rf "$old"; done; git -C "$REPO" worktree prune
echo "before A: $(pool)" >> "$OUT"
# (the pool every 5 minutes into the same log while the chains run, so each step's share shows without separate runs)
( while [ ! -f "$L/two-chains-$KEY.done" ]; do sleep 300; [ -f "$L/two-chains-$KEY.done" ] || echo "tick: $(pool) | $(grep -hE '^(PASS|FAIL)' "$L/chain-$KEY.log" 2>/dev/null | tail -1 | cut -c1-40)" >> "$OUT"; done ) &
rm -f "$L/two-chains-$KEY.done"
cd "$WORK" && sh "$HERE/frozen-chain.sh" "$SHA" $2 > "$L/chain-$KEY.log" 2>&1; echo "chain A exit $?: $(grep -E '^CHAIN' "$L/chain-$KEY.log" | tail -1)" >> "$OUT"
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
node tools/starter/leaks.mjs --compare "$HOME/.anzuelo-frozen/rel-$KEY/.cache/leaks-before.json" >> "$OUT" 2>&1 || { echo "chain B: LEAKS (both chains together)" >> "$OUT"; fail=1; }
echo "after B: $(pool)" >> "$OUT"
cd "$REPO" && git worktree remove --force "$HOME/.anzuelo-frozen/rel-$KEY-r2" && git worktree prune
touch "$L/two-chains-$KEY.done"
echo "TWO-CHAINS DONE" >> "$OUT"
[ "$fail" = 0 ] && echo "BOTH PASS: push with push-release.sh $SHA" >> "$OUT"
exit $fail
}
