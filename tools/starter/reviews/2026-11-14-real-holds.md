# Real end-check holds, 2026-11-13 and 14: what they asked and whether they changed the work

For plan [quiet-screen](../../../docs/plans/2026-11-13-quiet-screen.md), Tasks 2 to 5: build the fixes from the real
holds and prove them by replaying these.

## Method
- **Source:** every Claude Code transcript changed since 2026-11-13 on this machine, read-only. A hold is the Stop
  hook's own output (`hook_success`, event Stop, items listed), never a message quoting one. A first count from any
  line containing "left before this is done" gave 193 holds and 785 items, inflated by duplicates and by peer messages
  that quoted holds; the numbers below are the hook's own outputs only.
- **Items:** a hold shows its first two items and "and N more"; the full list goes to `stop-details.<session>.md`,
  which the next hold overwrites. So each hold's total is known, but only its visible items can be read.
- **Real or false (a proxy):** after a hold, did the agent change work before the next message (write a file other
  than memory or notes, or run a command other than the engine's own log, why, waive and check)? Changed work: the
  hold probably found something. Only a reply ("done already", "doesn't apply", "waits on", "false"): probably not.
  A hold with several items counts for each kind of item it showed. Samples were read by hand for the largest kinds.
- **Scripts:** a scratch extractor and grouper (not kept in the starter); the data stays on the machine.

## Totals
- 149 holds in 7 sessions across 4 projects and this starter; 599 items announced, 262 of them visible.
- Holds per session: 47, 35, 31, 28, 4, 3, 1. Holds that reached the last round ("say plainly what is not done"): 35.
- The agent changed work after 54 holds (36%) and only replied after 95 (64%).

## By kind (visible items; holds where the agent changed work after, against only replying)

| Kind | Holds | Changed work | Only replied | Projects |
|---|---|---|---|---|
| Runbook steps and other checks (see below) | 62 | 23 | 39 | 3 |
| Work log: the agent's own promise | 32 | 9 | 23 | 4 |
| Work log: a user ask | 37 | 19 | 18 | 5 |
| Screens and screenshots | 19 | 8 | 11 | 2 |
| Changelog line | 14 | 6 | 8 | 3 |
| Complaint: say whether it holds | 10 | 3 | 7 | 2 |
| Redo: say what changed | 6 | 0 | 6 | 1 |
| Security review | 6 | 1 | 5 | 1 |
| Declared check or self-test | 5 | 1 | 4 | 2 |
| A wakeup still pending | 4 | 0 | 4 | 1 |
| Open plans | 3 | 0 | 3 | 1 |
| Status handoff | 6 | 4 | 2 | 2 |
| Tests run or claimed | 5 | 3 | 2 | 2 |
| Knowledge sources | 6 | 4 | 2 | 2 |
| Fresh reviewer | 5 | 4 | 1 | 2 |

The "other" group is mostly runbook items: "end with a Finished section" (7), "the runbook your Issue line names was
not opened" (7), "a Done when item names a check that doesn't exist" (6), "every Done when item needs its proof" (6),
"no runbook was opened" (4), "open docs/playbooks/<name>.md and check the work against its steps" (12 across six
runbooks), a watcher still armed (3).

## The causes of the false holds, from the samples
1. **Narration taken for promises.** "I'll …" between tool calls, carried out by the same turn, held as open
   (quiet-screen Task 4 box). A promise restated in the answer after it was set to wait made a new item (Task 4 box).
2. **Asks the turn already answered.** A user ask closed by the answer is still listed: the work log closes on `log
   done` or a matched action, not on the answer's own words. Venting split into items ("IM A BUSY GUY") (Task 4).
3. **Record asks on turns that changed no file of that kind.** Changelog and status asks after a turn that wrote only
   a report, a plan or a memory note (Task 3, third box).
4. **Waiting taken for missing.** A pending wakeup or watcher, a background run still going: held although the turn
   ends on purpose to wait (Task 3, background helpers box).
5. **Runbook steps met by evidence.** "Open the runbook and check the work against its steps" after the steps were
   done and proven (Task 3, fourth box).
6. **Count asks from text that isn't the user's request** (Task 4 box).
7. **A list that reads stale.** `hooks.mjs why` printed the list saved at the last Stop, so items closed since showed
   as open (Task 3 box).

Real holds seen in the samples: a skill item left without its label, a changelog entry missing for a release, fresh
screenshots not taken after a screen change, tests not run after the last change, sources missing for new facts.

## What this changes in the plan
- Task 3 rounds: 35 holds reached the last round; most last rounds were only replies. Rounds 2 and 3 only for a safety
  item or real work not done (first box) would have ended most of them at round 1.
- New box (Task 3): keep each hold's full item list in a per-session history, so a later replay reads all items, not
  the first two.
- Replay set: these 149 holds; a fix passes when the replay drops the false kinds above and keeps every hold whose
  agent changed work after.
