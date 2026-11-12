---
status: open
---
# Plan: the end check and every ⚓ line show only what this turn's own evidence proves

**Goal:** an item reaches the user only when something this turn really did proves it. Every false hold and false line
seen on 2026-11-12 came from one root: the to-do list was built from guesses, not from the turn's evidence.

**Spec (user and oversight, 2026-11-12):**
1. One evidence model, shared by every end-check item and every ⚓ line (prompt, pretool, posttool, Stop, notices).
2. Default for every shown item: verify first. Proven true: show it. False or unproven: drop it silently, to a private
   log only.
3. Exceptions, shown at once because they interrupt on purpose: (a) safety guards refusing an unsafe action as it
   happens; (b) the quick 🚨 acknowledged line when the user is clearly upset; (c) a clear mess-up by the agent (a claim
   the turn's own output contradicts, a deleted or broken file). Even these are accurate: "acknowledged" is never
   "fixed" until the fix is verified.
4. Evidence is this turn's only: the runbook routed from the user's own prompt, or the one the answer says it followed;
   files this turn's own tool calls wrote; checks this turn really ran or skipped; notes this turn added.
5. A guess never makes an item: a file merely read for reference, text in a test's output or a command, notes from an
   earlier turn, words in the agent's own answer, one round judged without the earlier answers of the same turn.
6. Bookkeeping writes (.cache/, the agent's memory, a scratchpad, the engine's state) are not work.
7. The per-check heuristics this replaces are deleted, not guarded.
8. Stop reads only from the turn's start, so its cost does not grow with the session: under 300 ms on a real-size
   transcript.
9. Proven by replay: the 2,309 shown items (docs/plans/2026-11-12-user-facing-text-audit.md, Tasks 1-2) and the replay
   set give 0 holds or lines a reader would call false, with every true hold kept.

**Approach:** build the evidence record once per hook call, make each item a predicate over it, route every shown
item through one gate (show if proven or an exception, else log), then delete what the record replaces. Replay before
and after, on real turns.

**Confidence:** 6/10. Risks: "the one the answer says it followed" needs one plain form the agent writes anyway (the
answer's runbook line); real transcripts may lack some evidence (marked unknown, never shown); the end budget (3,200
lines) must absorb the record before the deletions pay it back.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-12-evidence-model.md`, or find
the first unticked box. Ticked boxes are done; never redo them.

## Context
- The end check: tools/hooks/v2/end.mjs (judge, chosen/picked, the item lists); tools/hooks/v2/lib.mjs (turnActs,
  changedOf, opened, notesOf, the requirement evaluator); the ⚓ lines: tools/hooks/v2/lines.mjs (passText: fixed,
  lesson saved, running); the reminder's routing: tools/hooks/v2/start.mjs (saveTurn: runbook, notesAt); the guard:
  tools/hooks/v2/guard.mjs (exception a).
- Guesses found so far (oversight's reports, 2026-11-12): chosen() falling back to any runbook "opened" (a read for
  reference, a grep); routing from text inside a test command or its output; lines.mjs saying "fixed" whenever the turn
  did any work; LEARNED read from old notes; a round judged on its short note only; a turn whose only write was the
  notes file asked for a Finished section and the open plans.

## Constraints for every task
- Each change has a v2 test built from a real case, and the test fails without the change.
- No new interruption during work; the guard's refusals are unchanged (exception a).
- The size budgets hold: end at most 3,200 lines; trim before any raise, a raise only with its reason.
- Light runs only while a release chain is timed; every run counts toward the kernel pool.

## Watch for
- A true hold lost while removing guesses: every task keeps the existing true-hold tests passing.
- Projects that write no runbook line in their answer: "followed" then falls back to the routed runbook only.
- The old engine (hooks-main.mjs) still shows some ⚓ lines until step 1e; its lines go through the same gate or are
  listed as open.

## Task 1: the evidence record
**Files:** tools/hooks/v2/lib.mjs (new `evidence(acts, turn)`), tools/hooks/v2/start.mjs.
**Uses / provides:** provides the record every later task reads.
- [ ] start.mjs records the routed runbook from the user's own prompt only (a relayed or quoted prompt routes nothing)
      and the transcript size at the prompt.
- [ ] `evidence()` returns routed, followed (the runbook the answer names in its runbook line, or a skill the turn
      ran), written (files this turn's own calls wrote, bookkeeping left out), ran (this turn's commands with exit
      status), notes (notesOf).
- [ ] v2 test: each field from a fixture turn, and each guess from spec item 5 leaves its field empty.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS.

## Task 2: items only from the record
**Files:** tools/hooks/v2/end.mjs.
**Uses / provides:** uses Task 1.
- [ ] The runbook a turn is held to is routed or followed, nothing else; a runbook only read adds no items.
- [ ] Engine checks key on written and ran, not on the whole changed-file list or the answer's words.
- [ ] v2 tests from the real cases: a 14-item runbook read for context beside the followed one adds nothing; a routing
      fix that grepped another runbook is held to nothing; test output matching a runbook's triggers routes nothing.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS.

## Task 3: bookkeeping is not work
**Files:** tools/hooks/v2/lib.mjs (worked), tools/hooks/v2/end.mjs.
**Uses / provides:** uses Task 1 (written).
- [ ] A turn whose only writes are .cache/, memory, a scratchpad or engine state is no work turn: no Finished section,
      no open-plans ask, no runbook items.
- [ ] v2 test: a turn that only writes its Issue line passes; one that also edits a source file is held as before.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS.

## Task 4: one turn, all its answers
**Files:** tools/hooks/v2/end.mjs.
**Uses / provides:** none.
- [ ] Each round is judged with every answer the turn already gave (its Finished section, its "stays on" line), not only
      the newest note.
- [ ] v2 test: the 4-round transcript oversight sent (Finished plus open plans, the wakeup, Finished again) ends after
      round 1.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS.

## Task 5: one gate for every shown item
**Files:** tools/hooks/v2/lib.mjs (new `shown(item, evidence)`), tools/hooks/v2/end.mjs, tools/hooks/v2/lines.mjs.
**Uses / provides:** uses Task 1; provides the gate Task 6 and 7 rely on.
- [ ] Every Stop item and ⚓ line passes the gate: shown when proven or an exception (spec item 3), else written to
      tools/hooks/state/dropped.jsonl (check, why, turn; capped) and not shown.
- [ ] "fixed" only when the turn says its fixed-when outcome was verified; otherwise "acknowledged", or "being fixed"
      when work toward it was done. "lesson saved" only for a file this turn wrote, named in a learned line this turn
      added. "running" only for routed or followed. Every line cut at a word boundary with "…", brackets closed.
- [ ] v2 tests, one per branch: a proven item shown; an unproven one dropped and logged; a guard refusal, an upset
      acknowledgement and a contradicted claim each shown at once; an Issue line alone, or a delegated fix, not
      "fixed"; an old learned line shows no 🧠; a cat of a runbook shows no 📖; a long issue ends on a whole word.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS.

## Task 6: delete what the record replaces
**Files:** tools/hooks/v2/end.mjs, tools/hooks/v2/lib.mjs, tools/hooks/v2/lines.mjs.
**Uses / provides:** uses Tasks 1-5.
- [ ] Each heuristic the record makes unneeded is removed (picked, opened-by-command, the per-reader notes gates, the
      answer-word triggers), each named in the commit.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS, and the sizes line shows end lower than before Task 1.

## Task 7: Stop reads from the turn's start
**Files:** tools/hooks/v2/start.mjs (the offset), tools/hooks/v2/end.mjs (reads from it).
**Uses / provides:** uses Task 1 (the transcript size at the prompt).
- [ ] Stop reads the transcript from the turn's recorded offset (earlier prompts it needs come from the record), so its
      time does not grow with the session.
- [ ] v2 test with a large synthetic transcript holds the 300 ms budget.
- [ ] Run Stop on a read-only copy of a project's real-size transcript, before and after, with `STARTER_TIMING=1`.
      Expected: under 300 ms after.

## Task 8: replay and release
**Files:** tools/starter/reviews/ (the replay report).
**Uses / provides:** uses everything above.
- [ ] Replay the engine before and after over the 2,309 shown items and the replay set; a reader judges each shown
      item. Expected: 0 false holds or lines after, every true hold kept; counts in the report.
- [ ] Run the release chain (`bash frozen-chain.sh <commit>` from the improvement-loop runbook). Expected: CHAIN PASS;
      the upgrade notice says the change in one line.
