---
name: install-update
summary: Change or verify how the app is installed, launched or updated - one entry file, idempotent steps, safe updates, a test matrix the user runs
triggers: installer, install script, setup script, launcher, shortcut, auto update, self update, updater, first run, install fails, launch fails, packaging
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
