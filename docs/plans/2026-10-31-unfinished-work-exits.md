---
status: done
created: 2026-10-31
---
# Plan: no answer ends with required work unfinished or unproven

Related: [[2026-10-29-acknowledged-runbook-and-bar]], [debug](../../skills/debug/SKILL.md),
[learn-from-upset](../../skills/learn-from-upset/SKILL.md), gap review `tools/starter/reviews/2026-10-31-engine-gaps.md`.

**The rule the engine must follow:** an answer reaches the user only after every required step is done and proven.
Otherwise the user is told plainly which step is still owed. That step is then held at the very next turn, whatever
the next message is.

**Root cause:** the Stop check has exits that bypass every individual check. Steps called "records" are deferred after
one block. A turn that ends while background work runs gets only the truth checks. A deferred step comes back only if
the next request "looks related". Fixing single checks (as earlier rounds did) never closed these exits. Real data: in
the first project 21 of 95 requests ended "waiting" and 10 ended unresolved, so 31 answers went out without the full
check.

## States the Stop check has to handle
| State | Before | Now |
|---|---|---|
| All steps pass | passes | passes |
| Steps fail, round 1 to 3 | blocks | blocks |
| Lesson, rule or requirement step still failing in round 2+ | deferred, answer goes out | blocks until the cap |
| The project's own Stop check failing in round 2+ | deferred | blocks until the cap |
| Background work still running | only truth checks; full check never runs later | truth checks now; the full check runs at the next Stop, whatever the request |
| A block made while background work runs | uses one of the 3 rounds | does not use a round (own cap) |
| Cap reached with a lesson, rule, requirement or project step failing | carried only to a "related" request | carried to the next turn always, named first in the next prompt |
| Cap reached with only record steps failing (changelog and the like) | carried to a related request | unchanged |
| A waiver the waive command refused | counts | does not count |
| "Skip N" on an item whose check is failing | drops it with 8 characters of reason | needs a reason of 3+ words |

## Checklist
- [x] 1. Lesson, rule-request and requirement steps, and project Stop checks, keep blocking after round 1.
      Tests: "records-once: the lesson from an upset user is still asked for in round 2", "external-stop: in round 2
      the project's own steps still block".
- [x] 2. Owed steps (lesson, rule, requirement, project) carry to the next turn whether or not the request looks
      related; the next prompt says they come first. Record steps still carry only to related work. Test: "an owed
      lesson is held even on an unrelated request".
- [x] 3. A turn that ended while background work ran gets its full check at the next Stop. Tests: "waiting end: what
      the full check would ask stays on record", "a turn that ended while background work ran gets its full check".
- [x] 4. A block made while background work runs does not use a round (own counter, same cap). No test of its own:
      the waiting tests run through it.
- [x] 5. A waiver counts only if the waive command printed "waived for this turn". Test: "a waiver the waive command
      refused does not count".
- [x] 6. "Skip N" cannot drop a failing check without a reason of at least 3 words. Test: "a skip without a real
      reason does not drop a failing check".
- [x] 7. Helpers: the brief carries the runbook checklists handed over this turn and asks for one evidence line per
      item; the report is a claim to check. Test: "a helper launched after a runbook checklist was handed over gets it".
- [ ] 8. Per-item proof `(each: <glob>)`: moved to the next round; item 7 asks helpers for per-item evidence meanwhile.
- [x] 9. Sweep over both projects' Stop logs: 25 waiting endings (21 + 4) now get the full check at the next Stop. Of
      12 unresolved endings (10 + 2), 8 had an owed lesson or rule step, which now keeps blocking and carries over.
- [x] 10. Full chain, commit, both projects upgraded.
