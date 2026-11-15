#!/bin/bash
# push-release.sh on throwaway repos: a refused merge pushes nothing and exits non-zero; a plans-only divergence merges
# and pushes; a fast-forward pushes. Prints PASS/FAIL per case.
S="$(cd "$(dirname "$0")" && pwd)"; T=$(mktemp -d); export HOME="$T/home"; mkdir -p "$HOME/.anzuelo-frozen"
export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@example.com GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@example.com
g() { git -c user.name=t -c user.email=t@example.com "$@"; }
setup() { rm -rf "$T/remote.git" "$T/main" "$T/work" "$HOME/.anzuelo-frozen/rel-$1"
  git init -q --bare "$T/remote.git"; g clone -q "$T/remote.git" "$T/main" 2>/dev/null; cd "$T/main"; mkdir -p tools/hooks tools/starter/reviews docs/plans
  echo '{}' > tools/hooks/engine-proof.json; for f in v2-failing v2-untested v2-retired; do echo x > tools/starter/reviews/$f.txt; done; echo a > code.mjs
  g add -A; g commit -qm start; git push -q origin HEAD:main 2>/dev/null; git branch -q -M main
  g clone -q "$T/main" "$T/work" 2>/dev/null; g clone -q "$T/main" "$HOME/.anzuelo-frozen/rel-$1" 2>/dev/null
  cd "$HOME/.anzuelo-frozen/rel-$1"; echo b > code.mjs; g commit -qam "engine change"; echo '{"commit":"x"}' > tools/hooks/engine-proof.json; }
head_of() { git --git-dir="$T/remote.git" rev-parse main; }
run() { bash "$S/push-release.sh" "$1" "Proof: test" "$T/main" "$T/work" origin > "$T/out.txt" 2>&1; echo $?; }
# 1. main has a code change the release lacks: stop, nothing pushed
setup r1; cd "$T/main"; echo c > other.mjs; g add -A; g commit -qm "code on main"; before=$(head_of); rc=$(run r1)
# (stopped by its own check, not by any error: a syntax error also exits non-zero and once passed this case)
[ "$rc" = 1 ] && grep -q "stopped, nothing pushed" "$T/out.txt" && [ "$(head_of)" = "$before" ] && echo "PASS refused merge: exit $rc, nothing pushed" || { echo "FAIL refused merge: exit $rc"; cat "$T/out.txt"; }
# 2. main has only a plan change: merged and pushed
setup r2; cd "$T/main"; echo p > docs/plans/p.md; g add -A; g commit -qm "plan"; rc=$(run r2)
[ "$rc" = 0 ] && git --git-dir="$T/remote.git" show main:code.mjs | grep -q b && git --git-dir="$T/remote.git" show main:docs/plans/p.md >/dev/null 2>&1 && echo "PASS plans-only divergence merged and pushed" || { echo "FAIL plans-only: exit $rc"; cat "$T/out.txt"; }
# 3. fast-forward: pushed
setup r3; rc=$(run r3)
[ "$rc" = 0 ] && git --git-dir="$T/remote.git" show main:code.mjs | grep -q b && echo "PASS fast-forward pushed" || { echo "FAIL fast-forward: exit $rc"; cat "$T/out.txt"; }
cd /; rm -rf "$T"
# 4. each release script's body sits in braces, parsed before it runs, so an edit during a run cannot change it
bad=""; for f in push-release.sh two-chains.sh frozen-chain.sh; do grep -qx '{' "$S/$f" && [ "$(grep -v '^$' "$S/$f" | tail -1)" = "}" ] || bad="$bad $f"; done
[ -z "$bad" ] && echo "PASS release scripts parse whole before running" || echo "FAIL release scripts not wrapped in braces:$bad"
