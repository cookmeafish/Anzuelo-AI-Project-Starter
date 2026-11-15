#!/bin/sh
# Frozen release chain for one commit: a worktree on a branch, wire, begin, then v2 selftest, selfcheck, v2-sweep, trial
# and audit, each gated on its exit code, then the leak check. Prints PASS/FAIL per step; stops at the first failure.
# Usage (from a checkout of the starter): sh tools/starter/release/frozen-chain.sh <commit> [rerun name]
# Starter-only. The release steps: tools/starter/runbooks/improvement-loop.md, step 1.
set -u
# (the whole body in braces: the shell parses it before running any of it, so an edit to this file during a run cannot
# change what the run does. Lesson (2026-11-15): an edit mid-run shifted the text and the chain died on a syntax error)
{
HERE=$(cd "$(dirname "$0")" && pwd)
# (the starter's repository: the one this checkout belongs to, a worktree's included)
REPO=$(cd "$(git -C "$HERE" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)
SHA=$(git -C "$REPO" rev-parse --short "${1:-HEAD}")
# (an optional second argument names a rerun, so a rerun needs no branch deleted: rel-<sha>-<run>)
RUN="${2:+-$2}"
DIR="$HOME/.anzuelo-frozen/rel-$SHA$RUN"
git -C "$REPO" worktree add -q -b "rel-$SHA$RUN" "$DIR" "$SHA" || exit 1
cd "$DIR" || exit 1
mkdir -p .cache
# (no leaks: what the chain leaves is counted before and after; a rise past the budget fails it. User rule, 2026-11-12)
node "$DIR/tools/starter/leaks.mjs" --save .cache/leaks-before.json > /dev/null 2>&1
echo "testing $(git log -1 --format='%h %s')"
node "$DIR/tools/hooks/wire.mjs" > .cache/wire.txt 2>&1 || { echo "FAIL wire"; exit 1; }
node "$DIR/tools/hooks/hooks.mjs" begin "release chain for $SHA" > /dev/null 2>&1
# (the whole audit first: any FAIL stops the chain before the long steps. Lesson (2026-11-10): a run lost about 35
# minutes to a REQ tag with no test scenario)
if node "$DIR/tools/audit.mjs" > .cache/chain-preaudit.txt 2>&1; then :; else echo "FAIL pre-audit"; grep -E "^FAIL|^ +- " .cache/chain-preaudit.txt | grep -v "links to nothing\|engine files changed since round" | head -20; tail -1 .cache/chain-preaudit.txt; exit 1; fi
# (a tracked file the setup changed, other than the proof records, makes the speed record name no commit: stop now.
# Lesson: the pre-audit lowered v2-untested.txt, and the hour-long run's time limits read as never judged)
dirty=$(git status --porcelain | cut -c4- | grep -vE '^(tools/hooks/engine-proof.json|tools/starter/(STATUS|dogfood-log|STARTER-CHANGELOG)\.md|tools/starter/trials/rounds.json|docs/plans/[^/]+\.md)$')
if [ -n "$dirty" ]; then echo "FAIL setup changed tracked files (commit what the audit writes first): $dirty"; exit 1; fi
# (warm the fresh copy once, untimed: the first loads of newly checked-out files are slower (likely the virus scan of new
# files). Lesson (2026-11-10): two chains failed the speed test at 86 and 62 ms; the same copy, warm, passed)
node "$DIR/tools/hooks/v2/selftest.mjs" > .cache/chain-warmup.txt 2>&1 || :
for step in "tools/hooks/v2/selftest.mjs" "tools/hooks/selfcheck.mjs" "tools/starter/v2-sweep.mjs" "tools/trial.mjs" "tools/audit.mjs"; do
  name=$(basename "$step" .mjs)
  # (a STOP written since the chain began ends it between steps: node "$DIR/tools/starter.mjs" stop-tests)
  if [ -f "$TEMP/anzuelo-tests/STOP" ] && [ "$TEMP/anzuelo-tests/STOP" -nt .cache/wire.txt ]; then echo "FAIL stopped (stop-tests)"; exit 1; fi
  rel=""; [ "$name" = "selftest" ] && rel=1
  if ANZUELO_RELEASE=$rel node "$DIR/$step" > ".cache/chain-$name.txt" 2>&1; then echo "PASS $name: $(tail -1 .cache/chain-$name.txt)"; else echo "FAIL $name"; grep -E "^FAIL" ".cache/chain-$name.txt" | head -30; tail -3 ".cache/chain-$name.txt"; exit 1; fi
done
if ! node "$DIR/tools/starter/leaks.mjs" --compare .cache/leaks-before.json > .cache/chain-leaks.txt 2>&1; then echo "FAIL leaks"; cat .cache/chain-leaks.txt; exit 1; fi
echo "PASS leaks: $(tail -1 .cache/chain-leaks.txt)"
echo "CHAIN PASS $SHA in $DIR"
# (the push guard refuses a proof whose time limits were only noted; say it here, before any push is tried)
grep -q '"speed"' tools/hooks/engine-proof.json && node -e "const p=require('./tools/hooks/engine-proof.json');process.exit(p.speed&&p.speed.stop&&p.speed.v2?0:1)" \
  && echo "speed: judged, push allowed" || { echo "SPEED NOT JUDGED: no push. $(grep -h '^speed:\|NOTE  release' .cache/chain-selftest.txt | head -2)"; }
exit 0
}
