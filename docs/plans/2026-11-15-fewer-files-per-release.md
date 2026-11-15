# Fewer distinct files per release

status: open
Approved by oversight 2026-11-15. Related: [[2026-11-12-no-leaks]], [[2026-11-14-fewer-process-starts]].

## Context
After a fresh boot, kernel paged memory grew by about 1.1 GB during one release run. The pool tags were file-system
bookkeeping: the Filter Manager's name cache (FMfn), cached file mappings (MmSt), NTFS file records (Ntff, NtfF) and
Defender's scan records (MPsc, MPhc). They fell once the release's copies were deleted and rose again with any file
activity, so it is the file cache, not a pinned leak: it grows with how many distinct files a release touches. Each
release makes two full fresh copies of the starter (chain A and chain B) and the suites make many throwaway projects.
The paged budget is now judged after chain B's copy is removed (b2105a8); chain A's copy stays because the proof is
committed there.

## Constraints for every task
- Chain B still tests the same commit independently of chain A's results (a second run, not a reused result).
- Nothing in the user's projects changes; this is the starter's own release path and test suites.
- Tests first on the old code; the release runs through tools/starter/release/.

## Task 1: chain B reuses chain A's copy
- [ ] two-chains.sh runs chain B in chain A's frozen copy after a `git clean -fdx` (keeping the proof records), not in
      a second fresh worktree. Test: the release check counts worktrees during a dry run: one, not two.
- [ ] The proof commit moves out of the copy (two-chains.sh records the proof on the release branch, push-release.sh
      fetches the branch), so the copy can be removed before the after-cleanup reading. Test: after a dry run no
      frozen copy is left, and push-release.sh still finds the proof.

## Task 2: throwaway projects reused within a suite
- [ ] The suites' temp projects come from one template per suite run, reset between tests (git clean or a copy-on-
      reset), instead of a fresh tree per test. Measure the distinct files created per suite before and after.
- [ ] Test: a suite run leaves the same pass count, and the file count it creates drops (number recorded here).

## Task 3: prove it
- [ ] Two release runs with pool-tag snapshots (tools/starter/pooltags.ps1 -Csv) before and after each step: FMfn,
      MmSt, Ntff and NtfF growth per release recorded here, before and after Tasks 1-2.
- [ ] Fix pooltags.ps1 -Diff: it prints the after-values as growth (the tag lookup between the two CSVs fails).
