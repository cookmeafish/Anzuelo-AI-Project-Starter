---
name: goal-loop
description: Works toward a goal the user sets for this project in measured rounds - try one change, measure the real result, keep it only if it helped and nothing got worse, repeat - until the goal is met, the round limit is reached or progress stalls, with a log a later session can resume. Suggests goals that fit the project (from its brief and packs) and ones any project gains from. Use when the user wants the project to improve itself toward a goal, keep improving until something is true, iterate until it is good enough, or asks what the project could get better at.
checks: the log's form is checked by its script (ran marker); whether a measure fits the goal is judgment
triggers: goal loop, improve until, keep improving until, iterate until, loop until, until it is good enough, until it's good enough, until the goal is met, improve itself, self improve, self-improve, self improvement, get better at, make the project better at, keep going until, mejorar hasta, sigue mejorando hasta, itera hasta, hasta que este bien, hasta que esté bien
---
# Goal loop: measured rounds toward the user's goal

Each round makes one change, measures the real result (not a stand-in), and keeps the change only if the measure
improved and nothing that passed before fails. The log in `docs/plans/` lets a later session resume.

## Steps
1. **Set the goal with the user, in one message.** Take it from the request. A goal with no number ("until it loads
   fast") gets a proposed bar and measure in that message ("median load under 1 s, timed with ..."); with
   `"autonomy": "auto"`, use the proposal and record it as `Assumed:`. If the request has no goal ("make the project
   better"), suggest at most 4, then wait for the choice:
   - **Fitted to this project:** read `docs/BRIEF.md` and the installed packs (`docs/playbooks/`). Software: a failing
     or flaky test suite made green, a slow page or command made faster, a bug class removed. Knowledge work: reports
     that a reader rates higher on a fixed rubric, facts with sources. Screens: a review loop round with no findings.
   - **Any project:** fewer wasted steps per turn (`node skills/efficiency-review/scripts/efficiency.mjs`), fewer
     end-check send-backs, the project's full checks passing (`node tools/audit.mjs`).
2. **Write the log** with `node skills/goal-loop/scripts/goal.mjs new "<goal>"`. It creates
   `docs/plans/YYYY-MM-DD-goal-<slug>.md` with these lines to fill (`Limit:` starts at 5):
   - `Goal:` the result in the user's words.
   - `Measure:` a command that prints the number (preferred: a test run, a timing script, a count), run 3 times for
     anything timed, the median counted. Without one, a fixed rubric of 3 to 5 questions, written in the log's
     `Rubric:` line, that a fresh helper agent (the Agent tool, a cheaper model) scores 1 to 5. The helper gets only the
     result and the rubric, never the change or your reasoning.
   - `Bar:` the value that means done (for example "0 failing tests", "median under 1 s", "every rubric score 4+").
   - `Limit:` the number of rounds: 5 unless the user gives one.
   - `Guard:` the commands that must keep passing: the project's test command (from `docs/foundation.md` (app pack), the
     package file or the README) and `node tools/audit.mjs`. A project with no tests has the audit alone; say so in the line.
3. **Baseline.** Commit or stash any open work first, so each round can be undone cleanly. Run the measure and the
   guard. Write `- Baseline: <value> | guard: pass` (or `guard: fail - <what>`: fix that first, or note it, since a red
   guard hides what a change breaks).
4. **One round.** Pick the change most likely to close the biggest gap, smallest first. Make it, run the measure, then
   the guard. Write `- Round N: <the change> | <value> | guard: pass|fail | kept|undone`. A gain counts when it beats
   the baseline (or the last kept round) by more than the spread of its 3 timed runs, or by at least 1 rubric point.
   Keep it only with a gain and the guard passing, and commit it; otherwise undo it (`git checkout -- <files>`, and
   delete new files) and write why.
5. **Repeat step 4** until the bar is met, the limit is reached, or two rounds in a row brought no gain (stalled: the
   next change needs a different approach or the user's input).
6. **Close the log:** under `## Result`, one line `status: done - met <value>`, `status: done - limit`, or
   `status: done - stalled: <why>` (`status: dropped - <why>` if the user stops it), and tick the box at the top of the
   log. Check it: `node skills/goal-loop/scripts/goal.mjs check <log>`.
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
- Timing measures beside other heavy work read slower: run them alone.
- Don't use it for one fix with a known cause: that is the debug skill. A loop is for goals that take several tries.
