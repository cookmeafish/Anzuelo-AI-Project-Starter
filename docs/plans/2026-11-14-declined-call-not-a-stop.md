---
status: dropped - an engine rule letting agents continue past a declined call undermines the user's own "no" (refused by the permission system, rightly); the fix is a clear one-word question to the user instead, kept in oversight's memory
---
# Plan: a declined harmless step never parks the work on the user

**Goal:** when one non-destructive tool call is declined with no message from the user, work goes on the same round:
the agent re-plans around it and says so in one line, and oversight never leaves a session waiting.

**Approach:** a rule in oversight's memory now, and an engine rule plus an end-check test from the real transcript.

**Spec (user, 2026-11-14, upset):** work must not wait on the user after a decline the user did not explain.

**Confidence:** 8/10. Main risk: treating a deliberate stop as an accident. Hence the limits below.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-14-declined-call-not-a-stop.md`.

## Context
- **What went wrong:** one test run in the coding session was declined at 16:58 UTC. Claude Code told the session to
  stop and wait, and it did. Oversight then asked the user each round for 2 hours instead of getting it going again.
- **Root cause:** neither the engine rules nor oversight's notes said what a declined harmless call means. The
  default ("stop and wait") won.
- **Sweep (all sessions in all project folders, the last 3 transcripts each):** 1 real decline (that one). The other
  hits were oversight's own reads of it.

## Constraints for every task
- Wait for the user only when the declined call was destructive, outward (push, send, publish, delete the user's
  data), or the user wrote a reason.
- Never retry the identical declined command. Use another way, or move to the next item.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- A decline the user meant: keep the destructive or outward limit and the "user wrote a reason" limit exact.

## Task 1: oversight's own rule
**Files:** oversight memory (never-park-on-user)
**Uses / provides:** none.
- [x] The memory says to get a declined session working again the same round, with a one-line note to the user.
- [x] Run `node tools/audit.mjs`. Expected: PASS (memory only, nothing in the project changes).

## Task 2: the engine rule (coding session)
**Files:** the rules text (AGENTS.md), tools/hooks/v2/end.mjs
**Uses / provides:** none.
- [ ] The rules say a declined non-destructive call with no user message means re-plan and continue. The end check
      holds a turn that ends idle on "waiting for the user" after such a decline.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a transcript with one declined test run and an answer that
      only waits is held once; the same with a declined push is not held; ALL PASS.
