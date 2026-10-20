---
name: bugfix
summary: Fix a bug - reproduce it, write a failing test, fix the cause, prove the test passes, check for siblings of the bug
triggers: bug, broken, doesn't work, does not work, not working, crash, crashes, error, fix this, fix it, regression, wrong result, stopped working, it breaks, glitch, wrong, fails, failing, build broke, build failed, ci failing, ci is red, pipeline failed, exception, traceback, stack trace
trigger_regex: \b(sometimes|randomly|keeps?|still)\s+(fall(s|ing)?|crash(es|ing)?|freez(es|ing)|break(s|ing)?|disappear(s|ing)?|glitch(es|ing)?|jump(s|ing)?|reset(s|ting)?|duplicat(es|ing)|fail(s|ing)?)\b|\bfeels?\s+(floaty|laggy|off|wrong|broken|janky|sluggish)\b|\b(doesn'?t|does not|won'?t|can'?t|cannot)\s+(show|load|save|open|start|connect|log ?in|sync|update|work)\b|\bfalls? through\b|\b(does|did) nothing\b|\bnothing happens\b|\b(blank|white|empty) (screen|page)\b|\bthrows\b|\bthrew (an? )?(error|exception)\b|\boff by\b|\bchokes?\b|\b(is|are|went) (gone|missing)\b|\bnot working\b|\bmessed up\b|\bborken\b|\bcrashs\b|\bkeeps? (logging|signing|kicking) (me )?out\b|\b(do|does)n'?t (match|add up|load)\b|\b(freezes|hangs|crashes) (when|whenever|every time) (i|you|we|someone|people|users)\b
menu: A2
---
# Playbook: fix a bug

**Use when:** something behaves wrongly. **Not when:** the behaviour is right but unwanted (`feature.md`).

## Steps
1. **Find and fix the cause with the debug skill** (`skills/debug/SKILL.md`): reproduce it, find the root cause and
   write it as `Root cause: <what and why>`, write a failing test (for UI, a scripted run with
   `tools/screenshot.mjs --steps`, gui pack), fix at the source, then run the new test and the whole suite.
2. **Look for siblings:** the same mistake elsewhere (search for the pattern), and fix or list them.
3. **Triple check** as in `docs/checks/qa-standards.md`, scaled to the risk. A one-line logic fix still needs (1);
   anything visible needs (2).
4. **Lesson:** if the bug escaped QA, add a line to `docs/lessons.md` and a check that would have caught it.

## Done when
- [ ] A regression test exists and passes (hook: bugfix-regression-test).
- [ ] The answer states the root cause (hook: root-cause-stated), the fix, the test, and the siblings checked (hook:
  verification-report).

## Pitfalls
- Fixing what the error message points at instead of why it happened.
- "Fixed" without re-running the reproduction.
