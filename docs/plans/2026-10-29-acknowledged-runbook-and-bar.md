---
status: done
created: 2026-10-29
---
# Plan: "acknowledged" that leads to a followed runbook, and a status bar that adds to the user's own

Related: [[2026-10-28-status-bar-and-acknowledged]], [learn-from-upset](../../skills/learn-from-upset/SKILL.md),
[debug](../../skills/debug/SKILL.md), [status-lines](../playbooks/status-lines.md).

## Everything wrong (every message of this round)
- [x] 1. The bar kept "checks passed" after a finished turn. Root cause: the table had a state for "ended", and the
      user wants the bar only while there is something to watch. Fix: a finished turn shows nothing; working, steps
      left, background tasks and "ended with steps not done" still show. Test: status-bar.
- [x] 2. The model, context and folder vanished from the bar. Root cause: the project's statusLine setting replaces
      the user's own (installed by another app); the bar never ran it. Fix: the bar runs the user's own command first,
      unchanged, and adds its line below. Test: status-bar (own bar first, alone when finished). Debug skill: "nothing
      the user already had is broken".
- [x] 3. No "acknowledged" was shown. Root cause: it depended on the agent writing its Issue line, and nothing held the
      work until it did; the hint was only a reminder. Fix: a guard refuses changes and commands until the line exists
      (REQ upset-acknowledged). Test: upset-acknowledged.
- [x] 4. Upset questions ("WHY DID YOU ...???") got no upset handling. Root cause: the question route replaced the
      upset hint. Fix: an upset question still answers first, and gets the acknowledge line. Test: question-answered.
- [x] 5. "Acknowledged" named no runbook, so nothing tied it to a fix. Fix: the Issue line is
      `Issue: <problem> | runbook: <name> | fixed when: <outcome>`; the guard accepts it only with an existing runbook
      and an outcome; "acknowledged" shows all three; the agent gets the runbook's checklist. Test: upset-acknowledged.
- [x] 6. The user can't see which runbook is being followed. Fix: every runbook or skill the agent opens (Read, a
      command, the Skill tool) shows "running the X runbook" once per turn. Skill added to the hook matcher (wire.mjs,
      both settings files). Test: upset-acknowledged.
- [x] 7. A runbook could be named and then not finished. Fix: at the end of the turn the named runbook must have been
      opened, every "Done when" item recorded (`Done N:` / `Skip N: <why>`), and the outcome checked (`Verified:`).
      Test: three Stop scenarios.
- [x] 8. The root-cause runbook (debug) did not cover today's failure modes. Fix: list everything wrong first, the
      rule and the table of states, a sweep over all the real data, nothing the user had broken, the promised outcome
      verified; matching Done-when items and pitfalls.
- [x] 9. The user's other project ran the engine from the last commit, so none of yesterday's fixes reached it. Fix:
      the tested hooks.mjs, selfcheck.mjs, statusline.mjs and the two skills copied there; its own self-test passes.

- [x] 10. The user wants to see the checklist every time a runbook runs, not only when upset. Fix: the runbook ledger
      is on by default; "running the X runbook (✅ N items to check off)"; judgment items need a record. Tests:
      upset-acknowledged, permission-respected (setting default).
- [x] 11. The bar must never override or disable any other status line. Fix: it chains the project's shared status
      line, else the user's. Test: status-bar (a project's own line kept).
- [x] 12. A sweep found a finished turn showing "🚨 fixed: ... steps left ...". Root cause: the result line was found
      anywhere in a line, so an issue mentioning "steps left" counted. Fix: the result line must start the line.
      Test: status-bar.

## Rule
The user always sees "acknowledged" when upset (questions and mid-turn messages too), naming the problem, the runbook
that will fix it and what fixed means; the work is held until then, and the turn can't end until that runbook's
checklist is recorded to the end and the outcome verified. The status bar adds to the user's own and shows nothing once
a turn is finished.

## Not done
- wire.mjs only adds hooks that are missing, so other existing projects keep their old matcher (no Skill) until the
  engine runbook rewires them.
- Nothing committed.

Assumed: "ended with steps not done" stays on the bar - it is not a completion - wrong if the user wants every end blank.
