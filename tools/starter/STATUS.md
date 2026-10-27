# Starter status

Where work on the starter itself stands, for the next session. Projects never get this file (their own is
docs/STATUS.md, which here is the template new projects start from).

## Now
- 2026-10-27: Round v20 (on 4e83937) judged: WORSE, 2 high findings. Both are fixed in this batch: an invented
  permission grant, and a false "made up" flag whose forced rewrite added an error. Also in this batch: the upset hint
  as a pointer, starter-only false alarms, a setup helper that checks its own answer, and no re-tests of checks
  installed as shipped.

## Next
1. Push this batch, then run round v21 to confirm v20's highs are gone. Then run an obedience round.
2. Open from v20 (medium):
   - Every Stop round asks for the whole answer again, so users read it 2 to 3 times.
   - Stop rounds are spent while background helpers are still working.
   - A check run while a helper is still testing reads the helper's red test run.
3. A runbook for false alarms in the starter only: fix a check that misfires only here, never the critical guards.
4. The runbook-checklist trial in a real project: compare a day of turns before and after.
5. One project's prompt hook takes about 2.4 s (budget 1 s): find out why.

## Open questions
- (none)
