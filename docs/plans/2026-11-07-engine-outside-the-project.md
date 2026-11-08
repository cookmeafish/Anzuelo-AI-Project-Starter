# Engine outside the project: plan

status: open

Related: [[2026-11-07-only-the-simple-engine]]

**Goal:** the engine lives in one git-ignored folder inside a project, so the project's pushes carry only the project,
an AI agent upgrades the engine with a git pull, and nothing made for the project is ever touched by an upgrade.
**Done when:**
- In a test project, `git status` after install, setup and a work turn shows only project files plus the one
  `.gitignore` line; every hook, reminder, check and skill still works (selfcheck, trial and audit pass against it).
- An engine upgrade (git pull in `.anzuelo/engine/`) changes no file in `.anzuelo/local/` and no project file (a test
  hashes both before and after).
- Install and setup ask once whether `.anzuelo/local/` gets its own private git repository; both answers work.
- Both existing projects run on the new layout, moved by hand from their own sessions (no migration command).
**Approach:** first separate "where the engine is" from "where the project is" in code, behind one paths module, with
the starter itself as the case where both are the same folder. Then move the files, wire Claude Code and Codex
through their local (git-ignored) settings, and move the two projects.
**Built with:** Node (the engine's existing code), Claude Code local settings (`.claude/settings.local.json`,
`CLAUDE.local.md`, `.claude/skills/`), Codex hooks, git.
**Spec:** the user's requests of 2026-11-07 (separation design, "nothing the user made gets broken by an upgrade",
local/ optional with the question asked at install, no migration command, the records split below).
**Assumptions:**
- Records split (user approved the idea): `docs/CHANGELOG.md`, `docs/BRIEF.md` and `docs/DECISIONS.md` stay in the
  project's git, since they describe the project. The engine's working notes (`docs/STATUS.md`, plans, glossary,
  reviews, user-requirements rows, turn notes, runbooks, skills and rules made for the project) go to `.anzuelo/local/`.
  Cost if wrong: moving a file back is one `git mv` plus a path entry.
- When the user says no to the private repository, `local/` is a plain git-ignored folder and setup says plainly it
  has no history or backup. Cost if wrong: one question at setup.
**Confidence:** 5/10. Main risk: about 550 places build file paths and about 290 files move; a missed path fails
only in the layout it was not tested in, so every test runs in both layouts.
**How to resume:** any session or agent: run `node skills/plan/scripts/plan-tasks.mjs next <this file>`, or find the
first unticked box by hand. Read the dated notes first. Ticked boxes are done; never redo them. When every box is
ticked and the checks pass, change the status line to `status: done`; to stop for good, `status: dropped - <why>`.
A run that is stuck sets `status: blocked - <reason>` with `Tried:` and `Options:` notes; read those first.

## Context
- Layout in a project:
  - `.anzuelo/engine/`: a clone of the starter repository (hooks, tools, core runbooks and skills, packs, library).
  - `.anzuelo/local/`: everything made for this project; optionally its own private git repository.
  - Wiring, all git-ignored: `.claude/settings.local.json` (hooks), `CLAUDE.local.md` (imports the engine's rules
    and the local ones), `.claude/skills/` (generated mirror of engine plus local skills), `.codex/hooks.json`.
  - The project's `.gitignore` gets one block: `.anzuelo/`, `CLAUDE.local.md`, `.claude/settings.local.json`,
    `.claude/skills/`.
- Claude Code facts (checked 2026-11-07 against its docs): `CLAUDE.local.md` is supported and meant to be
  git-ignored; `@imports` work (a path outside the project asks for approval once, so everything stays inside it);
  `settings.local.json` takes hooks; skills load only from `.claude/skills`, `~/.claude/skills`, plugins or
  `--add-dir`. Not documented: hook scripts outside the project, so they stay inside it.
- Where paths are built today: `tools/hooks/hooks.mjs` (`abs()`, `stateFile()`), `tools/hooks/v2/lib.mjs`,
  `tools/audit.mjs`, `tools/starter.mjs`, `tools/packs.mjs`, `tools/skills.mjs`, `tools/hooks/wire.mjs`.
  Find them all with `grep -rn "path.join\|resolve(\|ROOT\|abs(" tools skills library packs`.
- Upgrades today: `starter.mjs upgrade` copies engine files over the project. After this plan an upgrade is a
  git pull inside `.anzuelo/engine/`, followed by regenerating the wiring.
- The starter repository itself stays a working project: engine root and project root are the same folder there.
- Trap: never edit the projects' files from the starter's session; their own sessions move them (rule from the
  watch job).
- Trap: Windows paths; every new path goes through the paths module, never string joins with `/`.

## Checks for this project
- Hook self-tests: `node tools/hooks/selfcheck.mjs`; v2 only: `node tools/hooks/v2/selftest.mjs`
- Trial round: `node tools/trial.mjs`
- Audit: `node tools/audit.mjs`
- Always: `node tools/writing-check.mjs <changed .md file>` for documents the user reads

## Watch for
- A path missed in Task 2 fails only in the layout it was not tested in: run every test in both layouts.
- Claude Code may ask the user to approve `CLAUDE.local.md` imports once; say so at install.
- A project's own `.claude/settings.json` hooks run alongside ours; never remove them.
- The projects may have local edits to engine files: their sessions keep those as local overrides before moving.

## Constraints for every task
- Every test runs in both layouts: starter (one root) and project (engine in `.anzuelo/engine/`).
- An upgrade never writes inside `.anzuelo/local/` or outside `.anzuelo/` except the generated wiring files.
- Project files that already exist (their own hooks, runbooks, skills, rules) are kept and win (rule 16, surgery).
- Hooks stay within their speed budget.
- Starter files stay neutral: never name the real projects.

---

### Task 1: one paths module
**Files:** tools/hooks/paths.mjs (new), `tools/hooks/selfcheck.mjs`
**Uses / provides:** provides ENGINE, PROJECT, LOCAL to every later task
- [x] Add a new tools/hooks/paths.mjs exporting `ENGINE` (where the engine code is), `PROJECT` (the project root) and
      `LOCAL` (where project-made engine files live), found from the script's own location and the session's
      working folder. In the starter all three are the repository root, except `LOCAL`, which is the root too.
      (2026-11-08: also `roots(hooksDir, env)` for tests and `split`; `ANZUELO_ROOT` names the project outright.
      Added to the engine file list in tools/new-project.mjs so upgrades copy it.)
- [x] Test first: a self-test builds a temp project with the engine in `.anzuelo/engine/` and asserts the three roots;
      it fails before the module exists. (In tools/hooks/v2/selftest.mjs, which the chain runs first.)
- [x] Run `node tools/hooks/selfcheck.mjs`. (Tags v2, engine, upgrade, new-project: all pass; the full run goes with
      the next batch's frozen chain.)

### Task 2: every path through the module
**Files:** `tools/hooks/hooks.mjs`, `tools/hooks/v2/*.mjs`, `tools/audit.mjs`, `tools/packs.mjs`, `tools/skills.mjs`, `tools/starter.mjs`, `tools/hooks/wire.mjs`, `skills/*/scripts/*.mjs`
**Uses / provides:** uses Task 1
- [x] List every path builder (Context grep) into `.cache/paths-inventory.txt`, tagged engine, project or local.
      (2026-11-08: 457 sites; they hang off 14 roots, tagged in `.cache/paths-roots.md`. The bulk is hooks.mjs `abs()`,
      260 sites, used for both engine and project files: each needs its own tag when converted.)
- [x] Convert `hooks.mjs` and `v2/` (state files, runbooks, skills, config, records).
      (2026-11-08: one classifier in paths.mjs, `kind(path)`, instead of 260 hand tags: `abs()` asks it, so each call
      site kept its project-relative name. engine = tools, packs, library, .githooks; project = changelog, brief,
      decisions and anything unknown; local = the rest of docs, state, config, .cache, .starter, DIRECTORY.md,
      SETUP-PROMPT.md, the pack's screenshot tool; both = skills, playbooks, checks, starter runbooks, AGENTS.md,
      requirements.json, packs-registry.json. Writes go through `absw()` (local). `rel()` maps any root back to the
      project-relative name. v2 lib uses the same resolver only in the split layout, so replay tools aimed at another
      folder behave as before. The engine's scripts ignore an inherited ANZUELO_ROOT.)
- [x] Convert `audit.mjs`, `packs.mjs`, `skills.mjs`, `starter.mjs`, `wire.mjs`, skill scripts.
      (audit goes through hooks `abs()`; wire.mjs only finds engine files here, its new wiring is Task 3; the pack
      prune and restore of `packs/` and `library/` do nothing in the split layout, where they are the engine's.)
- [x] Runbook and skill lookups read engine and local both, local winning on a name clash.
      (v2 selftest: a resolver test, and a project with the engine in `.anzuelo/engine/` where the reminder names a
      local runbook and an engine one and the turn record lands in `.anzuelo/local/`. Both fail on the old code.)
- [ ] Selfcheck runs its scenarios in both layouts; both pass. Trial and audit pass in the starter.
- [ ] Run `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs` and `node tools/audit.mjs`. Expected: 0 failed in each.

### Task 3: wiring through local settings
**Files:** `tools/hooks/wire.mjs`, `tools/starter/gitignore.project`, `tools/hooks/selfcheck.mjs`
**Uses / provides:** uses Task 2; provides the wiring Task 4 calls
- [ ] `wire.mjs` writes `.claude/settings.local.json` hooks pointing at `.anzuelo/engine/tools/hooks/hooks.mjs`,
      `CLAUDE.local.md` importing `@.anzuelo/engine/AGENTS.md` and the local rules file, the `.claude/skills/` mirror,
      and `.codex/hooks.json`; it adds the `.gitignore` block once. A project's own `.claude/settings.json` hooks are
      left alone.
- [ ] Test: in a temp project, `git status --porcelain` after wiring lists only `.gitignore`.
- [ ] Run `node tools/hooks/selfcheck.mjs`. Expected: 0 failed, the wiring test included.

### Task 4: install, setup and the private-repository question
**Files:** `tools/starter.mjs`, `SETUP-PROMPT.md`, `skills/project-bootstrap/SKILL.md`, `tools/hooks/hooks.mjs` (setup gate)
**Uses / provides:** uses Task 3
- [ ] `starter.mjs install` clones the engine into `.anzuelo/engine/` and wires it.
- [ ] Setup (SETUP-PROMPT.md, project-bootstrap) and install ask once: keep the files made for this project in a
      private git repository of their own (history and backup, never in the project's pushes)? Yes runs `git init`
      in `.anzuelo/local/`; no leaves a plain folder and says it has no backup. The answer is recorded in
      `.anzuelo/local/config.json`. Creating a remote for it is an outward action and needs its own OK.
- [ ] Test: the setup gate fails until the answer is recorded; both answers pass.
- [ ] Run `node tools/hooks/selfcheck.mjs`. Expected: 0 failed, both answers tested.

### Task 5: upgrades never touch what the project made
**Files:** `tools/starter.mjs`, `docs/playbooks/engine.md`, `tools/hooks/selfcheck.mjs`
**Uses / provides:** uses Tasks 3 and 4
- [ ] The engine runbook and `starter.mjs upgrade` become: git pull in `.anzuelo/engine/` (an AI agent merges any
      conflict), then rewire. The upgrade review stays.
- [ ] Test: hash `.anzuelo/local/` and the project's files, upgrade, hash again: identical, except the wiring files.
- [ ] Changing a default runbook or skill (user-approved 2026-11-07): the engine keeps the defaults. Editing
      one for this project saves a copy in `.anzuelo/local/` with a `based_on: <engine commit>` line; the copy wins
      over the default. A change useful to every project also goes to the starter (`docs/starter-feedback.md`).
- [ ] After a pull, for each local copy whose default changed since `based_on`, the upgrade shows a three-way diff
      (old default, new default, the project's copy). Small improvements are merged into the copy and listed; a
      clash with the project's own change is the user's call. `based_on` is then moved forward.
- [ ] Test: a local copy of a default runbook survives an upgrade that changes the default, the upgrade lists it for
      a merge, and the copy is used until merged. Run `node tools/hooks/selfcheck.mjs`. Expected: 0 failed.
- [ ] Run `node tools/hooks/selfcheck.mjs`. Expected: 0 failed, the hash test included.

### Task 6: records split and docs
**Files:** `AGENTS.md`, `README.md`, `SETUP-PROMPT.md`, `DIRECTORY.md`, `docs/checks/layout-standards.md`, `docs/playbooks/engine.md`
**Uses / provides:** uses Tasks 1 to 5
- [ ] Move the engine's working notes to `.anzuelo/local/` per the Assumptions; CHANGELOG, BRIEF and DECISIONS stay.
- [ ] Update AGENTS.md, README, SETUP-PROMPT.md, DIRECTORY.md (generated), the engine runbook, layout standards.
- [ ] Full chain on a frozen copy: selfcheck, trial, audit.
- [ ] Run `node tools/audit.mjs` and `node tools/writing-check.mjs AGENTS.md`. Expected: 0 failed, writing PASS.

### Task 7: move the two projects (no migration command)
**Files:** none in the starter; each project moves its own files
**Uses / provides:** uses Task 6
- [ ] Commit and push the engine (push needs the user's OK at that time).
- [ ] Send each project's session the exact move steps; each moves its own files, keeps its own hooks, runbooks and
      skills, runs its checks and reports totals.
- [ ] Confirm in each: `git status` shows no engine files, and a work turn gets the reminder and the end check.
- [ ] In each project, run `git status --porcelain` and its own selfcheck. Expected: no engine files listed, 0 failed.
