---
status: open
---
# Plan: the engine is a guest in the project, never a co-owner of the app

**Goal:** a hard boundary between the engine and the project. `.anzuelo/` is solely for the AI agent that codes the
app. The engine never moves, renames, replaces or deletes anything the project owns. Nothing the app needs to run,
build, test or ship lives in `.anzuelo/` or depends on it. The app's own runtime AI is app code, not engine material.
What friends or customers download never carries the engine.

**Approach:** one boundary, defined once and used by every engine operation:
- an ownership record (what the engine created);
- a guard every engine write path goes through;
- before/after fingerprints on install, upgrade and migration;
- a classification of the project's AI files at adoption;
- three proofs: delete the engine and the app still works, a fresh clone has no trace of the engine, and the build
  never packs it.

**Spec (user, 2026-11-13, a top rule):**
- The engine's folder is solely for the AI agent coding the app.
- Nothing the app needs to operate moves there.
- The engine doesn't break the app.
- People who download the app never get the engine.

**Confidence:** 7/10. Main risk: older installs whose engine files were never recorded. Their ownership is rebuilt from
the shipped file list plus the git history of the install commit, and anything unproven is treated as the project's.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-13-project-boundary.md`, or find
the first unticked box.

## Context
- The engine records some of its writes (`engine-writes.json`), but the install, upgrade, sync, clean-up and migration
  paths don't all check ownership before they write, move or delete.
- Upcoming: a large established AI app, distributed to other people, with its own AI setup, a tracked project skill,
  existing local settings, uncommitted work, and runtime AI features (prompts, models, key handling).
- Recent near-misses: a skill folder hidden from git whole; a local settings file that could be overwritten; project
  records the engine wanted to keep in its own place; full test suites run inside projects.

## Constraints for every task
- When in doubt, a file is the project's.
- No engine operation needs the project's files to change, except the wiring the user agreed to at install (named in
  one list).
- Safety guards and the user's other rules stay as they are.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- An app's runtime AI files can look like engine material (skills, prompts, agent configs). The adoption review asks;
  it never guesses.

## Task 1: the rule, at the top
**Files:** the rules template (AGENTS.md / CLAUDE.md), docs/checks/user-requirements.md, docs/checks/rule-enforcement.md
**Uses / provides:** none.
- [ ] A top hard rule, worded generally: the engine is a guest; its folder is for the coding agent only; it never moves,
      renames, replaces or deletes the project's files; the app never depends on it; distributed copies never contain
      it. Dated, with a requirements row naming Tasks 2-6 as its checks.
- [ ] Run `node tools/audit.mjs`. Expected: PASS, and the rule's row names real checks.

## Task 2: one ownership record and one guard
**Files:** a new boundary module, every engine write path (install, upgrade, sync, clean-up, migration, skill mirror,
settings merge)
**Uses / provides:** provides `owned(path)` and `guardWrite(op, path)` to Tasks 3-5.
- [ ] Every engine write is recorded (path, hash, time) in one manifest under `.anzuelo/local/`. `guardWrite` refuses
      move, rename, delete or overwrite of any path outside `.anzuelo/` that isn't engine-owned or on the agreed wiring
      list.
- [ ] Settings files the project already has are merged by key, never replaced. Excludes are per engine item, never a
      whole folder.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a test per write path tries to touch a project file and is
      refused; a project skill added later shows in git status; ALL PASS.

## Task 3: fingerprints around every engine operation
**Files:** tools/starter.mjs (install, upgrade, migrate)
**Uses / provides:** uses Task 2.
- [ ] Each operation hashes every file outside `.anzuelo/` before and after. Any change that isn't on the manifest or the
      wiring list rolls the operation back and reports the path.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a deliberate stray write in a test copy rolls back and names the
      path; a clean install reports "0 project files changed"; ALL PASS.

## Task 4: the project's AI files are classified, not guessed
**Files:** the adoption review (project-bootstrap, setup), `.anzuelo/local/boundary.json`
**Uses / provides:** uses Task 2.
- [ ] At adoption, the project's session lists its AI-related files as app runtime (prompts, model config, key
      handling, agent code the app ships) or coding-agent tooling. App-runtime paths are recorded, and the engine never
      reads them as rules, never mirrors over them, never guards them as its own.
- [ ] Engine skill names can't collide with project skills: a clash gets a prefixed engine name.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a sample app with a runtime prompts folder and a project skill
      keeps both untouched through install and upgrade; ALL PASS.

## Task 5: three proofs in the adoption trial
**Files:** tools/starter/trials/adopt-large.mjs
**Uses / provides:** uses Tasks 2-4.
- [ ] Remove the engine (`.anzuelo/` plus the wiring), then the app's own build and test commands pass unchanged.
- [ ] A fresh clone (what someone downloading the app gets) has no tracked engine file, no engine reference, no hooks
      path.
- [ ] The app's packager never includes `.anzuelo/`, the local rules file, the skill copies or the agent configs. If it
      would, the trial stops and the install asks the owner before adding an ignore entry.
- [ ] Run `node tools/audit.mjs`, then the trial. Expected: audit PASS and all three proofs passing on the large-app
      sample.

## Task 5b: during everyday coding, app work always lands in the app
**Files:** tools/hooks/v2/guard.mjs, the session-start text
**Uses / provides:** uses Task 2.
- [ ] The guard refuses a write by the coding agent into the engine's folder unless the path is one the engine
      defines for the agent (its records, notes, plans, state). App code, assets, app docs and configs written there
      are refused with one plain line: app changes go in the app's own folders so the people who use the app get them.
- [ ] The session-start text for an installed project says it in one line: the engine's folder is only for the coding
      agent's own rules and notes, and everything the app or its users need goes in the app.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: writing a source file, an asset or an app doc under the engine's
      folder is refused; writing an engine record there passes; ALL PASS.

## Task 5c: the shapes of a real large app (oversight's read-only profile, 2026-11-13)
**Files:** tools/starter.mjs (install), tools/hooks/wire.mjs, tools/hooks/hooks-main.mjs (mirror sync, walks),
tools/hooks/v2/lib.mjs (walks), tools/starter/trials/adopt-large.mjs (the sample)
**Uses / provides:** uses Tasks 2-3.
- [ ] Engine files never match common test globs (`*.test.*`, `*.spec.*`, `__tests__/`), so an app runner that collects
      dot-folders finds none. Proof: the app's test-file count is the same before and after install.
- [ ] Every engine walk, glob, copy and fingerprint skips nested checkouts (a folder with its own `.git` file) and
      reserved device names (`nul`, `con`, `prn`, `aux`, `com1`-`com9`, `lpt1`-`lpt9`) without failing.
- [ ] The install changes zero tracked files: wiring only through `.git/info/exclude` (appended to, never rewritten,
      after any block the project already has) and `CLAUDE.local.md`; never a `.gitignore` edit or an append to a
      tracked `CLAUDE.md`; never writes an `AGENTS.md` it doesn't own.
- [ ] The skill mirror writes and deletes only engine-owned names; a project's skill, or its drifted copy in another
      mirror folder, is never synced or pruned, and an engine name never shadows it. (Done for the copy and the
      exclude in c9c25d5; prune and drifted copies still to test.)
- [ ] With git LFS configured or worktrees present, the install doesn't set `core.hooksPath`; the in-session commit
      guard covers the agent's commits, and the audit says so.
- [ ] For a project whose app watches its root (a dev server polling the folder), the engine's high-churn state (hook
      state, caches, notes, answer drafts) lives outside the project, in a per-project folder in the user profile;
      only engine code stays in `.anzuelo/`. Proof: engine state written while a watcher runs makes 0 change events.
- [ ] The engine ships its own `.gitattributes` inside `.anzuelo/` (LF for its shell and hook files), so a machine with
      `core.autocrlf=true` keeps them runnable.
- [ ] Never touched: `.claude/scheduled_tasks.lock`, `.claude/worktrees/`, the app's runtime data folders and backups.
- [ ] Found by the trial (2026-11-13): the agent's answer draft for `check --answer-file` went to the project's own
      `.cache/answer.md`. The documented draft path, and every engine scratch file, goes under the engine's state.
- [ ] Run `node tools/starter/trials/adopt-large.mjs <clone>` on a sample with every shape above. Expected: ADOPT-LARGE:
      PASS.

## Task 5d: the move into .anzuelo/ for older installs (projects one and two)
**Files:** tools/starter.mjs (migrate)
**Uses / provides:** uses Tasks 2-3 and 5.
- [ ] Only files on the engine's ownership record move. Anything the app's code reads or runs is the app's and stays,
      even if the engine first made it (the engine then reads it in place); an app that reads an engine-generated file
      gets that file handed over first (no more regeneration, or a stable copy at the old path).
- [ ] After the move, the same proofs as an install: remove `.anzuelo/` and the app still runs its own tests and
      starts; a fresh clone works.
- [ ] Run `node tools/trial.mjs` with two more shapes (an app reading an engine-made doc; app content in a folder a
      pack made). Expected: TRIAL: PASS.

## Task 6: the audit keeps it true
**Files:** tools/audit.mjs
**Uses / provides:** uses Tasks 2 and 4.
- [ ] The audit fails if tracked project code, build config or scripts reference `.anzuelo/`; if the manifest names a
      file outside `.anzuelo/` that isn't wiring; or if an engine skill shadows a project skill.
- [ ] Run `node tools/audit.mjs`. Expected: each failure case in a test copy fails the audit; a clean project passes.
