# One engine, the agent picks the runbook: plan

status: open

Related: [[2026-11-07-only-the-simple-engine]], [[2026-11-05-engine-v2]], [[2026-11-07-engine-outside-the-project]],
[[2026-11-07-questions-follow-runbooks]]

**Goal:** the old engine is retired for good; everything lives in the new engine's own small modules, each rule lives
in one place, the agent chooses its runbook from a short menu, the engine stops growing, and tests are fast.
**Done when:**
- `git grep -n "STARTER_ENGINE\|hooks/hooks.mjs"` finds nothing outside the changelog, and both real projects pass
  their own tests after the upgrade.
- Every user requirement has at least one test on the one engine (an audit check enforces it).
- A replay over real sessions shows the agent-picked runbook share and a false-ask rate no higher than the keyword
  router's on the same turns.
- A fast test set runs in under 1 minute; the engine code stays under its line budget (a test).
**Approach:** inventory what the old file still does, move each kept part into a v2 module and point every importer at
it, port the tests off the old-engine pin, then delete the old file and the switch. Then one source per rule, the
runbook menu, the line budget and the fast test set.
**Built with:** Node, tools/hooks/v2.
**Spec:** the user's requests of 2026-11-07, drafted with the oversight terminal and approved as a whole: "full engine
migration, no old engine, only an expanded new engine"; "the AI agent decides what runbook to use rather than being
forced by a keyword". Folds in the old plan's Task 4 (retire v1) from docs/plans/2026-11-05-engine-v2.md.
**Assumptions:** the CLI keeps the same command names (begin, check, sync, why, ...) under one new entry file, so the
29 docs that name `tools/hooks/hooks.mjs` change only the path. Cost if wrong: one more doc sweep.
**Confidence:** 5/10. Main risk: hooks.mjs is 9,779 lines and the old suite pins the old engine; a behavior only the
old tests covered could be lost. The requirement-to-test audit check is the net.
**How to resume:** any session or agent: run `node skills/plan/scripts/plan-tasks.mjs next <this file>`, or find the
first unticked box by hand. Read the dated notes first. Ticked boxes are done; never redo them. When every box is
ticked and the checks pass, change the status line to `status: done`; to stop for good, `status: dropped - <why>`.
A run that is stuck sets `status: blocked - <reason>` with `Tried:` and `Options:` notes; read those first.

Order: starts after the current release (push and project upgrades), the engine-outside-the-project move and the
questions-follow-runbooks batch, and goes ahead of any new feature or trial round. Task 1, then 2 and 3 together (both
change the start and end hooks), then 4 and 5. Each ships with pre-flight, frozen chain, replay (totals only, no
project names), proof and a batched upgrade; the user sees one line per finished task.

## Context
Measured 2026-11-07 on HEAD (corrections to the draft are marked):
- `tools/hooks/hooks.mjs`: 9,779 lines, 753 "Lesson" comments. Under v2 it still runs the session, pretool and
  posttool hooks, the guards (`v2/guard.mjs` is a 4-line re-export), the user's lines (visibleLines, runningLine,
  acknowledgedLine), the CLI (begin, check, ignore-word, notices, prove, setting, sync, waive, why, ...) and the
  upgrade probe.
- Importers of hooks.mjs (corrected: 14 tools, not 12): tools/audit.mjs, dedupe.mjs, fit.mjs, integrity-check.mjs,
  new-project.mjs, packs.mjs, recall.mjs, skills.mjs, starter.mjs, survey.mjs, trial.mjs, writing-check.mjs,
  hooks/git-guard.mjs, hooks/v2/guard.mjs; plus the tests selfcheck.mjs and v2/selftest.mjs, and the starter-only
  tools/starter/trials/secjudge.mjs.
- `tools/hooks/selfcheck.mjs`: 9,119 lines; line 14 pins `STARTER_ENGINE ||= 'v1'`. v2 code (corrected): start 112,
  end 123, lib 673, guard 4, shadow 23 = 935 lines; v2 selftest 1,134 lines.
- 29 markdown files name `tools/hooks/hooks.mjs` 72 times (AGENTS.md, runbooks, skills); `.claude/settings.json` and
  `.codex/hooks.json` name it 11 times.
- A rule can live in up to 7 places (AGENTS.md, CLAUDE.md, user-requirements.md, requirements.json, a runbook's Done
  when, a skill, memory); they drifted at least once this week.
- Keyword routing misfired on ordinary words and on scheduled or relayed prompts.

## Checks for this project
- Fast: `node tools/hooks/v2/selftest.mjs`; all: `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs`,
  `node tools/audit.mjs` on a frozen copy.

## Watch for
- Safety guards must keep working through every step (secrets, AI credit, protected files, outward actions).
- The projects' own hooks (`externalHooks`) read the engine's output contract: keep it, or bump the contract version.
- Projects lose deleted engine files only through the upgrade, after a backup.

## Constraints for every task
- Nothing during work but safety refusals; the end check asks at most 3 times a turn.
- No v1 file, wrapper or compatibility layer survives; nothing can switch the old engine back on.
- Starter files stay neutral: no real project names.

---

### Task 1: retire the old engine, permanently
**Files:** `tools/hooks/hooks.mjs` (deleted), `tools/hooks/v2/*.mjs` (new modules), the 14 importers, `.claude/settings.json`, `.codex/hooks.json`, `tools/hooks/selfcheck.mjs`
**Uses / provides:** provides the v2 modules Tasks 2 to 5 build on
- [ ] 1a Inventory: every function in hooks.mjs that runs under v2 or that a tool imports, each marked keep (move),
      replace or delete, written into this plan. Nothing left unmarked.
- [ ] 1b Modules: config and names, paths and host, the guards (code, not a re-export), user lines (status-lines
      toggle), the CLI. Point the 14 importers and secjudge.mjs at them; no module imports hooks.mjs.
- [ ] 1c One entry: hook settings and the no-hooks CLI call one v2 entry for session, prompt, pretool, posttool and
      stop. A test pipes every event through it as the claude-code host and checks the agent output and user line.
- [ ] 1d Tests: port each scenario for behavior v2 keeps, unpinned; delete v1-only ones. Every user-requirements row
      keeps a v2 test (audit check). The `engine` key and STARTER_ENGINE are gone; the suite runs under 5 minutes.
- [ ] 1e Delete hooks.mjs, the shadow, the switch, v1 docs and trial paths; update the 29 docs' paths. The upgrade
      removes files the starter no longer ships, after a backup.
- [ ] Run `node tools/hooks/v2/selftest.mjs` and the full chain. Expected: 0 failed, and the grep in "Done when" empty.

### Task 2: one place for each rule
**Files:** `AGENTS.md`, `docs/checks/user-requirements.md` (generated), `tools/hooks/requirements.json` (retired), `skills/project-rule/SKILL.md`, `tools/audit.mjs`
**Uses / provides:** uses Task 1
- [ ] A rule's text lives in AGENTS.md only (CLAUDE.md stays generated); its check is a Done when marker or a test.
- [ ] user-requirements.md becomes a generated index (rule, date, where checked); requirements.json's safety items
      move into the v2 guard config; memory notes point to the rule instead of restating it.
- [ ] Audit fails on a rule with no check, or a check whose rule text says otherwise; project-rule writes two sources.
- [ ] Run `node tools/audit.mjs`. Expected: PASS.

### Task 3: the agent picks the runbook
**Files:** `tools/hooks/v2/start.mjs`, `tools/hooks/v2/end.mjs`, runbook front matter
**Uses / provides:** uses Task 1; merges with the questions-follow-runbooks end check
- [ ] Start: no keyword-forced runbook; a menu of the 3 closest by description with one-line purposes and "pick the
      one that fits, or none". Upset and question hints stay; safety reminders unchanged.
- [ ] End: held to the runbook(s) opened; a work turn, or a knowledge question, that opened none is asked once to
      open the closest (listed) or say in one line why none fits. Triggers shrink to a few phrases that rank the menu.
- [ ] Ease off trigger words (user, 2026-11-07): word matches force behavior only in the safety guards (private and
      forbidden terms, the user's own words kept out of shared files, secrets, AI credit). They never force a runbook,
      a skill, the upset or the rule handling; those become hints the agent may ignore. Case to cover: a message that
      only mentions "trigger words" was routed to the trigger-words runbook twice.
- [ ] Replay over real sessions (totals): picked-and-opened share, "why none" asks, false asks, against the keyword
      router on the same turns.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS, menu and ask cases included.

### Task 4: stop the pile-up
**Files:** `tools/hooks/v2/selftest.mjs`, `tools/starter/runbooks/improvement-loop.md`
**Uses / provides:** uses Task 1
- [ ] One lesson line per fix (runbook Pitfalls or the commit), not a paragraph in code; a fix tries delete or
      simplify first; a new special case gives a one-line reason in the commit.
- [ ] A line-budget test: v2 engine code without tests under 2,000 lines; crossing it means removing code first.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the budget test passes.

### Task 5: faster tests
**Files:** `tools/hooks/v2/selftest.mjs`, `tools/starter/runbooks/release.md` or the improvement-loop runbook
**Uses / provides:** uses Tasks 1 and 4
- [ ] A fast set (v2 selftest, guard and routing scenarios) under 1 minute on every commit; the full chain before a
      release only; trial rounds only when the user starts them.
- [ ] Both commands and their times written in the runbook the release uses.
- [ ] Run `node tools/hooks/v2/selftest.mjs` (the fast set) and time it. Expected: under 60 seconds.
