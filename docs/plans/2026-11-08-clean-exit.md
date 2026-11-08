---
status: active
---
# Plan: leaving the engine is easy, and moving into .anzuelo/ works

Goal: a project can take the engine out with one command and a runbook that tells its agent exactly what to keep, in
both layouts, and its own hooks, skills and scripts keep working. Then the field report on a failed move into
`.anzuelo/` is fixed cause by cause.

Related: [engine outside the project](2026-11-07-engine-outside-the-project.md), [engine runbook](../playbooks/engine.md).

## Task 1: removal keeps what the project uses (engine in the project)
**Files:** `tools/new-project.mjs` (`--remove`), `tools/hooks/v2/selftest.mjs`
- [x] An engine file that the project's own code or hook settings name (a script importing `tools/hooks/paths.mjs`,
      a hook running `hooks.mjs jobs`) stays, with the engine files it loads; the output names who uses it.
- [x] An engine runbook or core skill the project changed (a "## Project lessons" section, or text no shipped version
      has) stays, named as kept.
- [x] Test: both cases, and a plain project still loses every engine file.

## Task 2: removal with the engine in .anzuelo/
**Files:** `tools/starter.mjs` (`uninstall`), `tools/hooks/v2/selftest.mjs`
- [x] `node .anzuelo/engine/tools/starter.mjs uninstall [--dry-run]` works with no starter link: it unwires
      `.claude/settings.local.json`, `.codex/hooks.json`, `CLAUDE.local.md`, git's hooks path and the `.gitignore` block
      (the project's own entries stay), brings the project's own files in `.anzuelo/local/` back to their paths (a path
      the project already has is kept and the other copy goes to the backup), backs up `.anzuelo/local/`, records the
      engine's commit, and removes `.anzuelo/`.
- [x] It names the project's files that still mention `.anzuelo/` (they break after removal).
- [x] Test: a split project with its own hook, skill and script keeps all three working after removal.

## Task 3: the runbook says exactly what to do
**Files:** `docs/playbooks/engine.md`
- [x] §4 for both layouts: before (commit, dry run, read what is kept and why), after (trim AGENTS.md to the project's
      own rules, CLAUDE.md made a copy of it, run the project's own tests and hooks once, list the skills).
- [x] Done when items a removal can be held to.

## Task 4: the failed move (field report)
Each item gets a confirmed cause, a fix and a test; the reply names the commit.
- [x] Safety first: a rollback left git's hooks path at the deleted `.anzuelo/engine/.githooks`, so commits ran with no
      AI-credit or secret checks. (1) The install saves the old `core.hooksPath` and the wiring files
      (`.claude/settings.json`, `.codex/hooks.json`), and uninstall puts them back. (2) Wiring sets the hooks path only
      to a folder that exists and holds the hook files. (3) The upgrade probe and every session start check that the
      hooks path points at an existing folder with the hook scripts, and tell the user once if not. (4) A test each.
- [x] .codex/hooks.json kept empty after the move; the rollback does not restore untracked wiring files. (The empty
  file does not reproduce at f6fe881: an install over a Codex file with the old engine's commands and a project hook
  keeps the project hook and adds the new engine's. The restore is in uninstall, tested in the v2 removal test.)
- [ ] Runbooks removed as engine copies still named by the menu and by relative links.
- [ ] Audit resolves project scripts against the wrong folder.
- [ ] The project's own scenarios file moved to local, so its REQ tags had no test.
- [x] Git hygiene crashed on a missing `.anzuelo/local/.cache`. (Does not reproduce at f6fe881: a fresh install with
  that folder deleted runs the whole audit, git hygiene included. Most likely fixed by the split-layout audit change.)
- [ ] Unclear engine files: the project's scenarios file and an edited `new-project.mjs`; step 4 names the version to
      compare against (the project's own engine version, not the newest).
- [ ] A "does not fit" line for a routed runbook in a peer-message work turn did not clear its items.
- [ ] Second project's report: the split audit misses a project's own hook engine (externalHooks) tags (sweeps 6 and
      15) and resolves the project's tools/ against the engine (sweep 10).
- [ ] An engine runbook can't be turned off in a split project (an install added default runbooks into a kept
      runbooks folder; deleting them leaves the engine's copy routing).
- [ ] The engine's AGENTS.md and runbooks name `tools/audit.mjs` and `tools/hooks/hooks.mjs`, which a split project
      does not have at those paths.
- [ ] A project's code that calls engine scripts by path (its own hook setup, audit, allow-lists) is named by the
      install's dry run, so it is fixed before the move.
- [x] Wiring leaves an existing `statusLine` on the old `tools/hooks/statusline.mjs` path.
- [x] A `build/` ignore line shipped by an upgrade hides a project skill named build. (New projects get `/build/` since
  2026-11-06; an upgrade now anchors an old bare `build/` or `dist/` line that hides a deeper folder. Test: selfcheck
  upgrade test.)
- [x] The rollback steps run into the engine's own git-safety guard; the uninstall replaces them.
- [x] A move and its rollback left no trace in the project, so its next session did not know the engine changed. Every
  install, move, upgrade, rollback and removal now writes a dated `docs/DECISIONS.md` line, and the next session start
  says it once (tests: v2 selftest removal test, selfcheck upgrade-review test).
- [ ] End check: "a screen changed" held a turn whose screen edits a reset had undone; judge by the net change against
      the turn's start, not by edits seen during the turn.

## Task 5: verify
- [ ] v2 selftest, selfcheck, trial and audit pass; changelog lines; push.
