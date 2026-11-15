#!/bin/bash
# Push a release that passed both chains (two-chains.sh): commit its proof in the frozen copy, bring it into main, push,
# then merge main into the working branch. Stops at the first failed step and pushes nothing then. Lesson (2026-11-14):
# a pipe hid a refused fast-forward and the push went on. When main moved since the copy was made, the release comes
# in as a merge, allowed only when main's own extra commits touch nothing outside docs/plans/.
# Usage: bash tools/starter/release/push-release.sh <commit> "<proof commit message>" [main checkout] [working checkout] [remote]
# Starter-only; its test: tools/starter/release/push-release-check.sh (run by the v2 self-test; not named *.test.*, which
# an installed app's test runner would collect from the engine folder).
set -euo pipefail
# (the whole body in braces, parsed before it runs: an edit during a run cannot change it. Lesson (2026-11-15))
{
HERE=$(cd "$(dirname "$0")" && pwd)
SHA="$1"; MSG="$2"
MAIN="${3:-$(cd "$(git -C "$HERE" rev-parse --path-format=absolute --git-common-dir)/.." && pwd)}"; WORK="${4:-$(cd "$HERE/../../.." && pwd)}"; REMOTE="${5:-origin}"
F="$HOME/.anzuelo-frozen/rel-$SHA"
[ -d "$F" ] || { echo "no frozen copy $F"; exit 1; }
cd "$F"
if [ -n "$(git status --porcelain -- tools/hooks/engine-proof.json)" ]; then
  git add tools/hooks/engine-proof.json tools/starter/reviews/v2-failing.txt tools/starter/reviews/v2-untested.txt tools/starter/reviews/v2-retired.txt
  git commit -q -m "$MSG"
fi
if git log -1 --format=%B | grep -qiE 'co-authored|generated with|claude'; then echo "AI credit in the proof commit: stopped"; exit 1; fi
B=$(git rev-parse --abbrev-ref HEAD)
cd "$MAIN"
git fetch -q "$F" "$B"
if ! git merge --ff-only -q FETCH_HEAD; then
  other=$(git diff --name-only FETCH_HEAD...HEAD)
  if [ -n "$(printf '%s\n' "$other" | grep -v '^docs/plans/' | grep -v '^$' || true)" ]; then echo "main has changes outside docs/plans/ the release lacks: stopped, nothing pushed"; printf '%s\n' "$other"; exit 1; fi
  git merge --no-ff --no-edit -q -m "Merge release $SHA (proof committed in the frozen copy)" FETCH_HEAD
fi
git push "$REMOTE" main
git log --oneline -1
if [ "$WORK" != "$MAIN" ]; then cd "$WORK"; git merge --no-edit -q main; git log --oneline -1; fi
}
