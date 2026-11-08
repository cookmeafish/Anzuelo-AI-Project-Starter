---
status: active
---
# Plan: every behavior of the old engine moves into v2, none is just removed

Goal: everything the old engine (v1) did that the user could see or rely on works under v2, rewritten small. A
behavior leaves only with the user's OK, recorded with why. Each one is proven by a test that runs under v2.

Related: [engine v2 only](2026-11-07-engine-v2-only.md) (its step 1d said "delete v1-only scenarios"; this plan
replaces that with "port each one, or ask"), [clean exit](2026-11-08-clean-exit.md).

## Everything wrong this session (the checklist)
1. The end-of-turn line ("🚨 fixed", "✅ checks passed") was gone under v2 for three days; the engine looked off.
   Root cause: v2 was built as a new, smaller engine and v1's user lines were not on its list. Done: v2/lines.mjs.
2. A message typed while the agent worked waited minutes for an answer. Root cause: v1's "a question is answered
   first" was dropped with v1's in-work notices. Done: v2/midturn.mjs.
3. Pictures pasted into a busy helper's chat were lost to it. Root cause: the host passes text only; nothing told the
   agent where the pictures are saved. Done: v2/midturn.mjs.
4. A project did not know its engine had been upgraded. Done: the dated DECISIONS line (f6fe881).
5. An agent ran a 10-minute sweep as one foreground command, so it could not answer the user until it ended: the
   "answer first" note only arrives at the next tool call. To do: a long run (a full sweep, a whole test suite) goes in
   the background, so the agent stays reachable; and the starter's own test runs never pile up on the user's machine
   (three full runs at once slowed a project's work).
6. The status bar said "working" for good after a helper's "finished" notice that no turn picked up. Done (status
   bar: no model call after it, and idle or a minute old, is not work).
7. A project's helper reported two more costs (to confirm against its log): a written answer was held until it wrote
   six "skip" lines for a runbook checklist that did not fit a text answer; and it writes record lines into a notes file
   every turn. Both are retired kinds (forced checklists, record lines): find what still asks for them under v2 and
   remove that.
8. The cause behind all of these: "v2 only" was planned as keep, replace or delete per code name, and no step compared
   what the user gets under each engine. Rule 16 now says an upgrade never quietly takes away what the user saw
   working (REQ: engine-parity).

## Task 1: the complete list of what v2 lacks (the sweep)
- [x] Run v1's own self-test (1,700 checks, each a behavior) with `STARTER_ENGINE=v2` on a copy of the last commit.
      Every failing check is a behavior v2 lacks or does differently. Save the list in `docs/reviews/`.
      (2026-11-08, e67fa96: 750 passed, 630 failed, 9 skipped. The starter keeps its own reviews in
      `tools/starter/reviews/`: [the list](../../tools/starter/reviews/2026-11-08-v2-sweep.md).)
- [x] Group the failures by behavior (one behavior often has several checks) and count them.
      (261 groups by hook and tag: stop 426, prompt 141, other 57, pretool 3, session 3. The biggest: claim-checked
      16, check-preview 15 + 7, own-question 14, answer-traced 13, answer-resent 12, upset-learned 11, app-test-pass
      11, route 10, route-precision 10, praise 9. Many fall in the retired categories, which Task 2 marks first.)

## Task 2: each behavior gets a decision
- [ ] For each group: port it (the v2 module it goes in, rewritten small), "v2 does it another way" (the v2 test that
      shows it), "retired by the user, <date>" (with the source line), or "ask the user" (what it did, why it might
      go). Nothing is marked delete without a user decision.
- [ ] Already retired by the user, never ported or asked again (each with its source line in the list):
      notices and refusals during work that are not hard-to-undo safety (2026-11-05, 2026-11-07); record lines the
      agent had to write; more than one block per request beyond the 3-round re-check; runbooks, skills and upset or
      rule handling forced by keywords (2026-11-07: the agent picks). One exception the user asked for on 2026-11-08:
      a message the user types while the agent works is handed to it once, to answer first (v2/midturn.mjs).
- [ ] Ask the user once, in one list, about every "ask" item.

## Task 3: port, smallest first
- [ ] Port each group into its v2 module, with its test run under v2. The size budget (2,000 lines) still holds:
      when it does not fit, the overrun is reported, never solved by dropping behavior.
- [ ] `V2_SHOWS` in `tools/hooks/v2/lines.mjs` has no "open" kind left.

## Task 4: prove it on real data
- [ ] Replay the real sessions of the linked projects (their transcripts, read-only) through v2's hooks and compare
      with what v1 showed in them: every line kind v1 showed, v2 shows on the same turn.
- [ ] Turn the replay into a self-test on saved samples, so the next change cannot drop a behavior again.

## Task 5: release
- [ ] Full self-test, trial and audit pass in the main folder, then on a frozen copy; push; upgrade the linked
      projects; tell each project what changed.
