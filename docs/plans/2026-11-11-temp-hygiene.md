---
status: active
---
# Plan: tests leave no temp files behind, and no console windows flash

Goal: the machine stays fast through a day of release chains. Every test fixture lives under one temp root and is
removed when its run ends, pass or fail; every child process starts hidden. Measured before and after one chain:
the kernel's paged and nonpaged pool, and the number of entries under the temp folder.

Why: after a day of chains, oversight measured about 13 GB paged and 5.4 GB nonpaged kernel pool (normal is 1-2 GB).
The top pool tags each held about 1.7M live per-file entries (file system, malware scanner, filter manager). The temp
folder held about 1.93M files in about 11,000 leftover fixture folders. The user also sees console windows flash.

Related: [improvement loop](../../tools/starter/runbooks/improvement-loop.md).

## Task 1: one temp root, removed at exit
**Files:** `tools/hooks/testtmp.mjs` (new), `tools/hooks/selfcheck.mjs`, `tools/hooks/v2/selftest.mjs`, `tools/trial.mjs`,
`tools/starter/v2-sweep.mjs`, `tools/new-project.mjs`, `tools/starter.mjs`, `tools/skills.mjs`
- [x] `testtmp.mjs`: `TEST_ROOT` is `<temp>/anzuelo-tests`; `testDir(prefix)` makes a folder there and remembers it;
      every remembered folder is removed when the process exits (normal end, an error, Ctrl+C, a shard's exit).
- [x] Every fixture folder the tests make goes through `testDir` (a script replaces `fs.mkdtempSync(path.join(os.tmpdir(),
      ...))`); temp files the tools write for themselves are removed when they finish. The shared folder running
      self-tests register in is removed by the last run out.
- [x] `node tools/starter.mjs clean-tests` removes leftovers older than 1 hour under `TEST_ROOT` only.
- [x] Test: a run of the v2 self-test leaves no new entry in the temp folder and nothing under `TEST_ROOT`; a process
      that makes a folder and then fails still removes it.

## Task 2: child processes start hidden
**Files:** `tools/hooks/hidewin.mjs` (new), each entry script (hooks.mjs, selfcheck, selftest, tools/*.mjs)
- [x] `hidewin.mjs` makes `windowsHide: true` the default for every `child_process` call (spawn, spawnSync, exec,
      execSync, execFile, execFileSync, fork) and syncs the module's named exports, so every module gets it.
- [x] Every entry script imports it first.
- [x] Test: a spawn through the patched module gets `windowsHide: true` unless the call says otherwise; a grep-style
      test fails when an entry script that spawns does not import `hidewin.mjs` first.

## Task 3: measure
- [ ] Kernel paged and nonpaged pool, and the temp folder's entry count, before and after one chain; numbers in the
      report to oversight. The user's existing temp files are not touched (the user decides about those).
- [x] The speed baseline is checked on a quiet machine (hidewin adds about 3.5 ms; the chain's timed v2 self-test passed
      its speed test on a quiet machine).
- Measured, chain 1 (5de8737): TEMP 15,179 entries before and after, 0 new; paged pool 772 -> 2,489 MB, nonpaged
  1,173 -> 1,660 MB, not decaying after 5 minutes. Top paged tags: FMfn, Ntff, MmSt, MPsc (per-file records).

## Task 4: find what leaves the paged pool behind
Done when: two chains back to back leave the paged pool within about 300 MB of where it started.
- [x] Chain 2 tells a leak from a cache that fills once: paged 2,477 -> 3,935 MB, then flat for 20 idle minutes. It
      accumulates and is held.
- [x] Bisect, one step at a time: v2 self-test +305 MB paged in 224 s; `selfcheck --shard 1/12` +438 MB in 713 s.
      20,000 files made and deleted: node leaves about 1-4 KB each; git, bash cp/rm and files open while deleted no more.
- [x] Frozen release copies pruned to the last 3; the improvement-loop runbook says to check after each release.
- [x] Cut the churn at its source: on Windows every scenario made a fresh whole copy of the fixture base (about 1,700 a
      run). Now up to 16 copies per base take turns, each reused only after resting 16 s (past NTFS tunnelling).
      Shard 1/12: 205 s and +28 MB paged (was 713 s, +438 MB). Test: a tagged run makes at most a third as many copies as
      scenarios (18 for 24 with the old rule).
- [x] The full selfcheck and the v2 self-test measured with the fix: full selfcheck +456 MB paged (430 copies, 45 bases),
      v2 self-test +3 MB. Two chains back to back (7a54337): +720 and +435 MB paged. Not yet within the bar.
- [x] A late turn-start snapshot (busy machine) read the agent's first edit as the start: files changed after the turn
      began are left out of it (found by the two chains' sweep).

## Task 5: projects' own tests leave nothing in the temp folder
About 15,000 folders in the temp folder came from projects' own suites and the browsers they start.
- [x] `node tools/starter.mjs test-run [--strict] -- <cmd>`: the tests' temp folder under
      `<temp>/anzuelo-tests/projects/<name>`, removed when they end; what they still left is listed.
- [x] The commands the engine runs for a project (declared self-tests, check commands, both engines) get a temp folder
      of their own (`withOwnTemp`).
- [ ] Released; a notice asks each project session to run its suite through test-run and prove no new temp entries.
      The existing folders stay (the user decides).

## Task 6: a smaller fixture base
Done when: two chains back to back leave the paged pool within about 300 MB of where it started.
- [ ] Find which base files the scenarios read (809 files a copy now); build the base from only those.
- [ ] Only if still over the bar: a borrow/return helper for the direct copies, as its own plan item with tests.
