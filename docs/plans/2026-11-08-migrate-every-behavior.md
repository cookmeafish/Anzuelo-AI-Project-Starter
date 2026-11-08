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
6. The cause behind all five: "v2 only" was planned as keep, replace or delete per code name, and no step compared
   what the user gets under each engine. Rule 16 now says an upgrade never quietly takes away what the user saw
   working (REQ: engine-parity).

## Task 1: the complete list of what v2 lacks (the sweep)
- [ ] Run v1's own self-test (1,700 checks, each a behavior) with `STARTER_ENGINE=v2` on a copy of the last commit.
      Every failing check is a behavior v2 lacks or does differently. Save the list in `docs/reviews/`.
- [ ] Group the failures by behavior (one behavior often has several checks) and count them.

## Task 2: each behavior gets a decision
- [ ] For each group: port it (the v2 module it goes in, rewritten small), "v2 does it another way" (the v2 test that
      shows it), or "ask the user" (what it did, why it might go). Nothing is marked delete without the user.
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
