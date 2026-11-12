---
status: open
---
# Plan: every line <!--name:STARTER_NAME-->Anzuelo<!--/name--> shows the user is true, readable and worth showing

**Goal:** each item the engine shows the user is true, whole, plain, short and useful.

**Approach:**
- Oversight collects every shown line from the real transcripts and judges each one.
- The coding session fixes each failing group at its source, with a test built from real examples.
- It replays the engine over the same turns, then releases.

**Spec (user, 2026-11-12):**
- Check all user-facing engine text for correctness and usefulness.
- Show an item only when what it names really happened. An unproven item is dropped, not shown.

**Confidence:** 7/10. Main risk: judging "proven" needs the turn's evidence, and a transcript may not hold all of it.
Such items are marked unknown, not counted as passes.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-12-user-facing-text-audit.md`,
or find the first unticked box. Ticked boxes are done; never redo them.

## Context
- Shown text comes from: the ⚓ systemMessage lines (tools/hooks/v2/lines.mjs and the hook entries), Stop feedback
  (tools/hooks/v2/end.mjs and its details file), guard refusals (tools/hooks/v2/guard.mjs), and the upgrade report and
  notices (tools/starter.mjs).
- Transcripts: the session folders under ~/.claude/projects for the starter and each linked project (listed in
  tools/starter/watch.local.json, which git ignores). Shown lines are the `hook_system_message` attachments; Stop feedback is in
  `stop_hook_summary.hookAdditionalContext`.
- Known failures so far (oversight, 2026-11-12): "fixed" said for unfixed issues (lines.mjs:65); a lesson credited to
  files nobody touched (old notes read as new); lines cut mid-word; jargon ("Finished section", "open plans",
  "wakeup"); 3 to 4 Stop rounds after one answer; holds chosen from test output text.
- Trap: never name the user's projects in starter files (rule 14). Use "project one", "project two".

## Constraints for every task
- Writing standards: docs/checks/writing-standards.md.
- Oversight writes no engine code; the coding session makes every fix.
- Every fix has a test that fails without it.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- An item that is correct but shown in a turn the user never saw (a helper's turn): judge by what reached the user.
- Old-engine projects: their text is judged too, but fixed by upgrading, not by patching the old engine.

## Task 1: collect every shown line (oversight)
**Files:** the oversight reader (scratchpad, not in the repo); output `tools/starter/reviews/2026-11-12-shown-lines.jsonl`
**Uses / provides:** provides the item list for Task 2.
- [ ] Run the reader over the full history of the four transcript folders and write one row per shown item: time,
      project ("one", "two"...), hook event, exact text, and the turn's evidence (prompt, files changed, commands, answer).
- [ ] Run `grep -c hook_system_message <transcript>` per project and compare with the rows for that project.
      Expected: equal (plus the Stop feedback rows, counted the same way with `grep -c hookAdditionalContext`).

## Task 2: judge each item (oversight)
**Files:** `tools/starter/reviews/2026-11-12-user-facing-text-audit.md`
**Uses / provides:** uses Task 1's rows; provides the failing groups for Task 3.
- [ ] For each item record five marks: proven (cite the evidence, or unknown), whole, plain, useful, once per turn.
- [ ] Group failures by the code that made them, with counts and two real examples each.
- [ ] Run `node skills/plan/scripts/plan-tasks.mjs check docs/plans/2026-11-12-user-facing-text-audit.md` after
      linking the report, then re-judge 20 random items with a second reviewer agent. Expected: PASS, and at least 18
      of 20 agree.

## Task 3: fix by group, largest first (coding session)
**Files:** tools/hooks/v2/lines.mjs, tools/hooks/v2/end.mjs, tools/hooks/v2/guard.mjs, tools/starter.mjs, their tests
**Uses / provides:** uses Task 2's groups; provides the fixed engine for Task 4.
- [ ] For each group, fix it at the source with a test from its real examples. Unproven items are dropped from view
      and logged to a private file.
- [ ] Apply the wording rules in one place: whole sentences, never cut mid-word, no agent file paths on screen, no
      jargon, at most one extra Stop round when the answer already covered the item.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS, with each group's test named.

## Task 4: replay and release (coding session; oversight checks)
**Files:** a replay script in tools/starter/; the release chain
**Uses / provides:** uses Task 1's turns.
- [ ] Replay the engine over the collected turns and count shown items per kind, before and after.
- [ ] Run the replay script, then `node tools/audit.mjs`. Expected: 0 unproven items shown, 0 cut lines, no turn with
      more than 2 Stop rounds after an answer that covered the items, audit PASS. Oversight re-judges 20 random
      replayed items.
- [ ] Release through the usual release chain; the upgrade notice says in one line what changes on screen.

## Task 5: keep it true (both)
**Files:** none
**Uses / provides:** uses the oversight reader.
- [ ] Oversight's 15-minute round runs the reader and applies the five marks to every new shown line, sending each
      failure to the coding session with its evidence.
- [ ] One week after the release, run `node feed.js --tally` (the oversight reader). Expected: the count of failing
      items, reported to the user.
