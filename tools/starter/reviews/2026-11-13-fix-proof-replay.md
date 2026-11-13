# Fix-proof replay (2026-11-13)

What: the fix-proof end checks (`fixGaps` in tools/hooks/v2/lib.mjs) replayed read-only on real past turns of two
projects with `node tools/starter/replay-fixes.mjs <project> <transcripts>`. 23 candidate fix turns (a code change
plus a complaint taken on, the debug skill opened, or a request routed to a fix runbook), each judged by hand. Raw
output stayed outside the starter (it holds project content). Fix-proof plan, Task 5.

## False holds found, and fixed at the source

| Source | Seen on the first replay | Fix |
|---|---|---|
| Example taken from the agent's own text, which quotes its own code | patch flag on 12 of 18 turns | examples only from what the user typed |
| Quote marks of different kinds paired (an apostrophe with a later double quote) | blank and half-sentence "examples" | only matching marks: `"..."`, `“...”`, backticks |
| A bare word, a regex or code from pasted text taken as the example | `max_tokens`, `if not re.search(r` and the like | an example is a value: a space and a digit or dot, no code characters |
| One-off helper scripts in the temp folder counted as the code change | most "continue" turns | only files inside the project count |
| The project's own check scripts (verify, `*_tests.py`, scenarios) counted as the code change | 3 turns held for editing only their checks | check and test scripts are not the fix |
| The same command compared as a whole string | a test run with `> file` before and `| tail` after read as two commands | the command is compared without its `cd`, pipes and redirects |
| A broken edit of the check itself: `.find()` fell into a trailing comment | every turn flagged, with blank examples | caught by this replay before release; fixed |
| The replay's own route: the reminder's "closest runbook" hint read as the route | "continue" turns read as bug fixes | the replay calls `route()` on the request, as the live engine does |

## After the fixes

- Patch flag (example): 0 of 23. The unit test's case (a file name with a space and a dot) still fires.
- Patch flag (only a catch, retry or longer timeout): 0 of 23.
- Not shown failing before and passing after: 18 of 23. Judged right holds: in each, the test or reproduction that
  passed after the fix never ran failing before it (often the test was added and only run once the fix was in).
- No debug skill opened: 20 of 23, every complaint turn that went through learn-from-upset instead. This follows the
  spec as written (every fix turn goes through debug); whether learn-from-upset should count is open for oversight.
- Not held: 3 (their only code changes were check scripts or scratch files).

## Open

- Whether opening learn-from-upset meets "goes through debug" (20 of 23 turns depend on it).
- A replay of more projects once they have more fix turns (one project had none).
