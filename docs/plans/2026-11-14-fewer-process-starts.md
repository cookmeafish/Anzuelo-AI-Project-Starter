---
status: open
---
# Plan: fewer process starts (leak 1b)

**Goal:** the release chain and everyday hooks start as few programs as they can, so the kernel pool stops growing
with each chain.

**Why:** on this machine every start of a program from outside System32 (node.exe, git.exe) leaves one File object
and one D2d allocation in the kernel that only a restart frees (measured 2026-11-14, tools/starter/STATUS.md 1b).
A chain started about 40,000 counted programs; the pool held 6.2M File objects (2.37 GB nonpaged) two days after
boot. Which kernel component keeps them (the anti-cheat driver or Defender's scan) is the user's to test; this plan
cuts what is ours.

**Confidence:** 8/10. Risk: running hooks in the test process instead of a child changes what the tests prove, so a
few tests keep the real entry path.

**How to resume:** `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-14-fewer-process-starts.md`.

## Context
Counted with a `--require` preload that logs every child process (scratch count-spawns.cjs), per suite, one pass:

| Suite | node processes | spawn calls | top commands |
|---|---|---|---|
| v2 selftest | 414 | 1,889 | git show 629, git log 245, node (test copies) 208 |
| v2-sweep | 18,610 | 26,071 | node --check 13,811, node (test copies) 3,794, git log 1,377, git check-ignore 1,350 |
| old suite | 8,349 | 12,319 | node --check 4,339, node (test copies) 3,012, git check-ignore 1,349 |

Hooks per event in a fresh project (engine in .anzuelo/): session 2 git, prompt 0, pretool 0, posttool 0, stop 0.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS), `node tools/hooks/selfcheck.mjs` (ALL PASS), `node tools/audit.mjs`.

## Task 1: the audit's syntax check in one process
**Files:** tools/audit.mjs
- [x] "tools compile" parses every script in one child (vm.SourceTextModule for modules, vm.Script for .cjs), never
      one `node --check` per file (122 starts per audit, about 18,000 per chain). It catches the same errors.
- [x] Test: the audit fails on a broken module and a broken .cjs, passes on clean ones, and starts no `node --check`
      (selfcheck, audit-compile: the old code started 143 for one audit; 1735/1735 with the fix).

## Task 2: a process budget per hook event, enforced
**Files:** tools/hooks/v2/selftest.mjs
- [x] A test counts the programs each hook event starts (descendants too) and fails over budget: pretool and posttool
      0, prompt 1 (its detached turn-start snapshot), session 2, stop 4 (selfcheck, process-budget). Measured in a
      starter copy: session 1 git, prompt 1 node, pretool/posttool 0, stop 4 git (ls-files, status, log, ls-tree).
- [ ] Stop down to 2 git calls: one `git ls-tree HEAD` and one status read shared by every check in the turn (end.mjs
      calls ls-tree in three places, lib.mjs ls-files, diff and log per file); then the budget goes to 2.
- [ ] The turn-start snapshot's 3 git calls (diff, ls-files, hash-object) become 1 (`git status --porcelain=v2`
      gives changed and untracked files with their index hashes).

## Task 3: the suites start fewer programs
**Files:** tools/starter/v2-sweep.mjs, tools/hooks/selfcheck.mjs, tools/hooks/v2/selftest.mjs
- [ ] Recount after Task 1, then cut the largest remaining source: hooks run in-process per test file where the
      test does not need a real start, with a few tests that keep the real entry path (a node start per hook).
- [ ] git calls repeated with the same arguments in one process are cached (check-ignore, rev-parse, ls-files).

## Task 4: proof
- [ ] Recount per suite. Expected: total starts per chain down by at least two thirds.
- [ ] Multi-chain soak: pool tags before and after each of 3 chains; nonpaged File growth per chain down in
      proportion, and the pool otherwise flat.
