---
name: goal-loop
description: Works toward a goal the user sets for this project in measured rounds - try one change, measure the real result, keep it only if it helped and nothing got worse, repeat - until the goal is met, the round limit is reached or progress stalls, with a log a later session can resume. Suggests goals that fit the project (from its brief and packs) and ones any project gains from. Use when the user wants the project to improve itself toward a goal, keep improving until something is true, iterate until it is good enough, or asks what the project could get better at.
checks: the log's form is checked by its script (ran marker); whether a measure fits the goal is judgment
triggers: goal loop, improve until, keep improving until, iterate until, loop until, until it is good enough, until it's good enough, until the goal is met, improve itself, self improve, self-improve, self improvement, get better at, make the project better at, keep going until, mejorar hasta, sigue mejorando hasta, itera hasta, hasta que este bien, hasta que esté bien
---
# Goal loop: measured rounds toward the user's goal

A goal is only reachable when its result can be measured the same way every round. Each round makes one change,
measures the real result (not a stand-in for it), and keeps the change only if the measure improved and nothing that
passed before fails. The log in `docs/plans/` lets any later session pick up where the last one stopped.

## Steps
1. **Set the goal with the user, in one message.** Take it from the request. If the request has no goal ("make the
   project better"), suggest at most 4, then wait for the choice:
   - **Fitted to this project:** read `docs/BRIEF.md` and the installed packs (`docs/playbooks/`). Software: a failing
     or flaky test suite made green, a slow page or command made faster, a bug class removed. Knowledge work: reports
     that a reader rates higher on a fixed rubric, facts with sources. Screens: a review loop round with no findings.
   - **Any project:** fewer wasted steps per turn (`node skills/efficiency-review/scripts/efficiency.mjs`), fewer
     end-check send-backs, the project's full checks passing (`node tools/audit.mjs`).
2. **Write the log** with `node skills/goal-loop/scripts/goal.mjs new "<goal>"`. It creates
   `docs/plans/YYYY-MM-DD-goal-<slug>.md`. Fill its five lines:
   - `Goal:` the result in the user's words.
   - `Measure:` a command that prints the number (preferred), or a fixed rubric of 3 to 5 questions that a fresh helper
     scores 1 to 5. The helper gets only the result and the rubric, never the change or your reasoning, and uses the
     same rubric every round.
   - `Bar:` the value that means done (for example "0 failing tests", "median under 2 s", "every rubric score 4+").
   - `Limit:` the number of rounds, 5 unless the user says otherwise.
   - `Guard:` the commands that must keep passing: the project's tests (`docs/foundation.md` or the package file) and
     `node tools/audit.mjs`.
3. **Baseline.** Run the measure and the guard before any change. Write `- Baseline: <value> | guard: pass` (or
   `fail - <what>`: fix or note that first, since a red guard hides what a change breaks).
4. **One round.** Pick the change most likely to close the biggest gap, smallest first. Make it, run the measure, then
   the guard. Write `- Round N: <the change> | <value> | guard: pass|fail | kept|undone`. Keep it only if the value moved
   toward the bar and the guard passes; otherwise undo it (`git checkout -- <files>` or reverse the edit) and write why.
5. **Repeat step 4** until the bar is met, the limit is reached, or two rounds in a row brought no gain (stalled: the
   next change needs a different approach or the user's input).
6. **Close the log:** a `## Result` section with `status: done - met <value>`, `status: done - limit`, or
   `status: done - stalled: <why>`, and tick the box. Check it: `node skills/goal-loop/scripts/goal.mjs check <log>`.
7. **Answer** with the goal, the baseline and final values, each kept change in one line, what was undone and why,
   and the log's path. A goal not met says so plainly and names the next approach.

## Done when
- [ ] The goal, measure, bar, limit and guard are written in the log before the first change, and the log passes its check (when file: docs/plans/*goal-*.md) (ran: goal\.mjs check)
- [ ] Every kept change improved the measure and left the guard passing; every other change was undone (judgment: the log's lines are the record, the script checks their form)
- [ ] The answer gives the baseline and final values and says plainly whether the bar was met (judgment: the numbers differ per goal)

## Pitfalls
- A measure that is easy to move without helping the goal (counting lines, a score you give yourself). Measure the real
  result, the way the user would judge it.
- Several changes in one round: when the value moves, nobody knows which change did it. One change per round.
- A long loop beside other heavy work: measures that time things read slower under load. Run timing measures alone.
- Don't use it for one fix with a known cause: that is the debug skill. A loop is for goals that take several tries.
