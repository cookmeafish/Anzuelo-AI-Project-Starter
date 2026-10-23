---
name: install-update
summary: Change or verify how the app is installed, launched or updated - one entry file, idempotent steps, safe updates, a test matrix the user runs
triggers: installer, one command, single command, new machine, fresh machine, new computer, fresh install, install script, setup script, launcher, shortcut, auto update, self update, updater, first run, install fails, launch fails, packaging, update itself, start.bat, first time someone
menu: A8
---
# Playbook: install, launch and update

## Rules
- One file the user runs. Every step is idempotent (safe to re-run) and fails soft, with a clear message.
- Paths are relative to the app, and survive spaces and accented characters.
- Updates come only from the release branch or channel, never over local changes or unpublished commits, and must
  survive a retracted release.
- Updates never prompt for credentials (non-interactive), never block when offline, and log every decision to a file.
- A dependency fingerprint at launch decides whether dependencies need reinstalling. A pending-install marker makes an
  interrupted install resume.
- The agent never runs the installer or the real app on the user's machine. The user runs the test matrix.
- On Windows, a script the user is told to run with `powershell` works in Windows PowerShell 5.1, the version every
  Windows has; otherwise the instruction says `pwsh` and the script starts with `#Requires -Version 7`. 5.1 has none
  of these: `-Encoding utf8NoBOM` (use `[IO.File]::WriteAllText(path, text)` for UTF-8 without a BOM), the `??` and
  `?.` operators, the ternary `a ? b : c`, and `&&` / `||` between commands. Lesson: a setup script wrote `.env` with
  `-Encoding utf8NoBOM`, the answer said to run it with `powershell`, and 5.1 stopped there, so no `.env` was made.
- Every script, launcher or command the answer tells the user to run, made or changed this turn, runs here the way
  the user is told to (the same shell), or the answer says "NOT VERIFIED: <what> - <why>" for it (hook:
  instructions-run). The installing steps can be skipped by a dry-run flag; the lines after them still run.

## Steps
1. Change the scripts. Unit-test the pure decision logic (what to do in each state).
2. Write the test matrix into the release notes, for the user to run:
   - fresh install;
   - update from the previous version;
   - offline;
   - already running;
   - double launch;
   - folder with spaces or accents;
   - interrupted install.
3. Verify what the agent can verify safely: script syntax, decision tests, logs from a sandbox run if one exists.

## Done when
- [ ] Decision logic tested; the test matrix is in the release notes, with each case marked tested, or to be run by the user (hook: install-matrix).
- [ ] Followed whenever installer, launcher or updater files change, even unasked (hook: install-trigger).
