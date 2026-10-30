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
3. no-verbatim-examples flags single common words as the user's examples ("can't", "HEAD", "yes" in engine code):
   it should need a run of several words. Seen 2026-10-27 in this session.
4. A runbook for false alarms in the starter only: fix a check that misfires only here, never the critical guards.
4b. From the status-line probes (2026-10-27), still open: "checks passed" doesn't say when checks were waived; the
   checklist count uses the runbook as edited mid-turn (3/4 after a 3-item start); a printable HTML card set off the
   gui-pack step, and a plain request got a hardening chore; 🟢 missing in 2 of 6 fresh headless sessions; "fixed"
   never shows when a turn ends with steps left.
4c. Status bar and repeat complaints (plan docs/plans/2026-10-28-status-bar-and-acknowledged.md): the bar is in the
   starter now with its self-test. Still open: wire.mjs does not write the statusLine setting yet (a project gets the
   bar only by hand, in .claude/settings.local.json). The selfcheck case "stop-follow-on guard: a new rule written into
   CLAUDE.md" fails on the last commit too (forbidden-terms from the private-term list), like audit sweeps 1 and 21.
4d. Acknowledged and runbooks (plan docs/plans/2026-10-29-acknowledged-runbook-and-bar.md): done and tested; the bar
   chains every other status line. Still open: wire.mjs only adds missing hooks, so existing projects keep a
   PreToolUse matcher without "Skill" until rewired by hand; projects get these changes only by an engine upgrade
   (one project got the files by hand copy). Nothing committed.
5. The runbook checklist is now on by default (was a trial): watch a day of real turns for friction.
6. One project's prompt hook takes about 2.4 s (budget 1 s): find out why.

## Open questions
- (none)
