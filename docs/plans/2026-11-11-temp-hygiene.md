---
status: active
---
# Plan: tests leave no temp files behind, and no console windows flash

Goal: the machine stays fast through a day of release chains. Every test fixture lives under one temp root and is
removed when its run ends, pass or fail; every child process starts hidden. Measured before and after one chain:
the kernel's paged and nonpaged pool, and the number of entries under the temp folder.

Why: oversight measured, after a day of chains, about 13 GB paged and 5.4 GB nonpaged kernel pool (normal is 1-2 GB),
the top pool tags each holding about 1.7M live per-file entries (file system, malware scanner, filter manager), and
about 1.93M files in about 11,000 leftover fixture folders in the temp folder. The user also sees console windows flash.

Related: [improvement loop](../../tools/starter/runbooks/improvement-loop.md).

## Task 1: one temp root, removed at exit
**Files:** `tools/hooks/testtmp.mjs` (new), `tools/hooks/selfcheck.mjs`, `tools/hooks/v2/selftest.mjs`, `tools/trial.mjs`,
`tools/starter/v2-sweep.mjs`, `tools/new-project.mjs`, `tools/starter.mjs`, `tools/skills.mjs`
- [ ] `testtmp.mjs`: `TEST_ROOT` is `<temp>/anzuelo-tests`; `testDir(prefix)` makes a folder there and remembers it;
      every remembered folder is removed when the process exits (normal end, an error, Ctrl+C, a shard's exit).
- [ ] Every fixture folder the tests make goes through `testDir` (a script replaces `fs.mkdtempSync(path.join(os.tmpdir(),
      ...))`); temp files the tools write for themselves are removed when they finish.
- [ ] `node tools/starter.mjs clean-tests` removes leftovers older than 1 hour under `TEST_ROOT` only.
- [ ] Test: a run of the v2 self-test leaves no new entry in the temp folder and nothing under `TEST_ROOT`; a process
      that makes a folder and then fails still removes it.

## Task 2: child processes start hidden
**Files:** `tools/hooks/hidewin.mjs` (new), each entry script (hooks.mjs, selfcheck, selftest, tools/*.mjs)
- [ ] `hidewin.mjs` makes `windowsHide: true` the default for every `child_process` call (spawn, spawnSync, exec,
      execSync, execFile, execFileSync, fork) and syncs the module's named exports, so every module gets it.
- [ ] Every entry script imports it first.
- [ ] Test: a spawn through the patched module gets `windowsHide: true` unless the call says otherwise; a grep-style
      test fails when an entry script that spawns does not import `hidewin.mjs` first.

## Task 3: measure
- [ ] Kernel paged and nonpaged pool, and the temp folder's entry count, before and after one chain; numbers in the
      report to oversight. The user's existing temp files are not touched (the user decides about those).
</content>
</invoke>
<invoke name="Bash">
<parameter name="command">grep -E "^(PASS|FAIL|CHAIN)" /c/Users/User/AppData/Local/Temp/claude/5a46d0e67b1c7e6f/a87eadd2-a2fe-42ee-9104-29d74881efde/scratchpad/chain-9ca792b.txt | cut -c1-180