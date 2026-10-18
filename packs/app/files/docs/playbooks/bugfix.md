---
name: bugfix
summary: Fix a bug - reproduce it, write a failing test, fix the cause, prove the test passes, check for siblings of the bug
triggers: bug, broken, doesn't work, does not work, not working, crash, crashes, error, fix this, fix it, regression, wrong result, stopped working, it breaks, glitch
menu: A2
---
# Playbook: fix a bug

**Use when:** something behaves wrongly. **Not when:** the behaviour is right but unwanted (`feature.md`).

## Steps
Follow the **debug** skill (`skills/debug/SKILL.md`): root cause before any fix, one hypothesis at a time, and stop to
rethink the design after 3 failed fixes. The steps below are its checkpoints.
1. **Reproduce it** in an isolated instance, with exact steps, input and observed vs expected result. If it can't be
   reproduced, say so and gather more evidence instead of guessing a fix.
2. **Write a failing test** that captures it: a unit test for logic, or for UI a scripted run (`tools/screenshot.mjs --steps`, gui pack). Run it and
   see it fail.
3. **Find the root cause, not the symptom** (debug skill, phases 1 to 3). Write it as `Root cause: <what and why>`.
4. **Fix it.** Run the new test (now passing) and the whole suite.
5. **Look for siblings:** the same mistake elsewhere (search for the pattern), and fix or list them.
6. **Triple check** as in `docs/checks/qa-standards.md`, scaled to the risk. A one-line logic fix still needs (1);
   anything visible needs (2).
7. **Lesson:** if the bug escaped QA, add a line to `docs/lessons.md` and a check that would have caught it.

## Done when
- [ ] A regression test exists and passes (hook: bugfix-regression-test).
- [ ] The answer states the root cause (hook: root-cause-stated), the fix, the test, and the siblings checked (hook:
  verification-report).

## Pitfalls
- Fixing what the error message points at instead of why it happened.
- "Fixed" without re-running the reproduction.
