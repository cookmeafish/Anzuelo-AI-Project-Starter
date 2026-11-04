# Starter status

Where work on the starter itself stands, for the next session. Projects never get this file (their own is
docs/STATUS.md, which here is the template new projects start from).

## Now
- 2026-10-28: Examples, tests and lessons rewritten in neutral subjects (0793661, local, not pushed; trial not run).
  The user must remove the starter hooks from the local Claude settings of the folder that holds the projects (the
  host blocked the edit).
- 2026-10-27: Round v20 (on 4e83937) judged: WORSE, 2 high findings. Both are fixed in this batch: an invented
  permission grant, and a false "made up" flag whose forced rewrite added an error. Also in this batch: the upset hint
  as a pointer, starter-only false alarms, a setup helper that checks its own answer, and no re-tests of checks
  installed as shipped.

## Watched projects
- Standing job from the user (2026-10-29): watch every project that runs the engine, fix the engine here, upgrade them
  (tools/starter/runbooks/project-watch.md; the list is in tools/starter/watch.local.json, local only).
- 2026-10-30: both projects run 9399cdb, committed, with every test passing; upgrade timings now read warm (one
  project: Stop 314 to 328 ms, prompt 295 to 235). Audit sweep 21 still fails on a short private-list entry matching
  3 library skills (the user's list).
- 2026-10-30 evening: 1970c72 and 02c6c3b fix 6 field-report and dogfood items (per-folder helpers, identical page
  rewrites, plain accessibility lines, shell runbook edits, false still-running notices, "by hand" about data).
  Both upgraded and committed. Then 332af2b (rule kept after a mid-turn snapshot; quoted phrases): both on it, full
  self-tests 1500 and 1484 passed, 0 failed, hook times flat. Then fc6dcbb (plural root-cause heading): both on it
  (1501 and 1485 passed, 0 failed).
- 2026-10-31: 5406d5f (news plus a queued question is no question-only turn). Both linked copies on it; both sessions
  were mid-work with uncommitted files, so each was sent the upgrade. Open: confirm each upgraded and passed --full.

- 2026-10-31 morning: both projects on dc4ca3c, committed, full self-tests passing. Then 9127ea3 (a recurring job
  that has run is a standing schedule) and a36843a (a rewritten notes file keeps this turn's records), chain green.
  Both sessions were sent the a36843a upgrade; open: confirm each upgraded and passed --full. Open from the gap review:
  per-item proof (plan item 8) and the safety holes.
- 2026-11-01: 03dc06f, e29973c, fc549dd (proof runs with failure counts, file entries, relayed labels): both projects on fc549dd, committed. bf1c8e1 (failed self-tests say how the hook run ended) sent to both. Open: the first --full run after the fc549dd upgrade failed in both projects (11 and 20 Stop tests passed that should block, no error output), each overlapping the other project's upgrade; a rerun passed; two full runs at once in the starter passed. Cause not found; next: reproduce a full run while an upgrade runs in another project.
- 2026-11-01 night: the user asked for 5 hours of trial testing (drift and memory probes added), every issue fixed
  and retested. Testing session: started 2026-11-01 11:57 PST (19:57 UTC), ends 16:57 PST (00:57 UTC 2026-11-02)
  (improvement-loop runbook, "A testing session with a time budget"). Round v22 is the first (v21's name was used
  by an old run; run.mjs now refuses a used name up front, e678ebf), started 12:47 PST on e678ebf. At about 13:10 the
  account's 5-hour limit stopped it (resets 16:40 PST); v22 is void but np-photo-cli. The limit message was not
  recognized (fixed: one shared pattern). Next: after the reset, round v23 (all 11), then judge, fix, repeat, until
  5 hours of testing have run. Fixes to the new group-verdict check (test counts, dates, the user's own words) in the chain now.
  Open: the stop-budget self-test fails under unrelated machine load (an A/B in one worktree showed no slowdown).
  The projects' "ended-unresolved" turns are the 3-block cap (by design, announced next prompt), plus older ones from
  before 69f3084.
- 2026-11-01 evening, testing session (improvement loop): round v23 (all 11, on 4ad058c's engine) judged WORSE on
  1 high (a headless setup ended on "still running" while a helper it resumed by message was stopped with the run).
  Fixed with 4 more in ffbea95 (proof 34e21e8, check list 66f3b04): headless-resume, destination triggers, the
  security line wording, the short cited-claim step, names in shipped docs (new audit sweep). Both projects on
  66f3b04: ed4a6ae (1537 passed, stop 354 ms) and 1bc4fc1 (1553 passed, stop 358 ms). Round v24 ran 19:55-22:03:
  WORSE on 1 high (the same headless case: the new step fired, but its short line said only "This run is headless",
  and a headless run sees only short lines). Fixed with 3 more in 013adfd (proof 23a9e6f): headless-resume short line
  says what to do, read-only shell chains while an Issue line is owed (and writes in a chain now held), the writing
  step names its files; the meal-plan trial now seeds the notes its complaint relies on. Chain green (1558 passed,
  stop 342 ms, trial 132/132). Both projects on 71f74fc: ba741b2 (1539 passed, stop 353 ms) and 23733f7 (1555 passed, stop 343 ms). Testing session ended 22:32
  (budget spent). Next: round v25 to confirm the headless high is gone. Open (medium): `audit.mjs --setup` can run
  past the 600 s single-command limit (the root of the headless case); setup spends about half its time on the
  starter's own audit and self-tests; full self-test after one-line rule changes; heavy research for low-stakes
  facts; sources cited from search snippets; a claim check the agent cannot clear when `prove` refuses new files;
  ingest checks firing on an empty inbox; a setup helper's computations not counted by data-computed; the
  skill-finder-report check needs exact wording; a project granted delete to staff against its own owner-only
  decision.
- 2026-11-02 afternoon: 7319e17 (three Stop rounds wasted on finished turns in one project: corrections whose quote held
  quotes, earlier turns' notes lines read as this turn's, Added plus Corrected in one reply). Chain green (1561, stop
  342 ms). Both linked copies on it; both upgraded and committed: 1415d41 (1542 passed, stop 350 ms) and 26e8ba1 (1558 passed, stop 372 ms).
- 2026-11-03: 3be825d (a turn naming a runbook it never opened was told to write a new one, plus three follow-on steps;
  now it is asked to open the named runbook). Chain green (1562 passed, trial 132/132; audit sweep 21 as before). Both
  linked copies on it; both upgraded and committed: e72c356 (one project, 251 passed) and 7d7c226 (1559 passed, stop 367 ms).
- 2026-11-03 night: 0f6e4b5 (trigger words match within one clause: a handoff's "first; run" routed a project's own
  runbook) and 7e305cc (plain wording for a full rerun after helpers; "I ran every check myself" says who judged: one
  turn ended unresolved on both). Chain green (1565 passed, trial 132/132; sweep 21 as before). Both on 059847b,
  committed: a522631 (1546 passed, stop 363 ms) and 413a720 (1562 passed, stop 340 ms). Full runs took 10+ min each.
- 2026-11-03 afternoon: 9724d9b (one project's unrelated requests were stopped twice to resume open plans sharing one everyday word; a
  shouted "you don't understand" was not flagged as upset). Chain green (1568 passed, trial 132/132; sweep 21 as before).
  Both on 950754e, committed: 4fa1875 (1549 passed, stop 341 ms) and 5c1b07d (1565 passed, stop 334 ms). Noted to one project: its own Stop command
  takes 5 to 23 s on its heavier turns.
- 2026-11-04 04:50 UTC: b4c8d15 from the owner's review of one project's 12 changes: negated verbs route nothing; calm requests naming
  examples of a wider point get an EXAMPLES hint and the scope-general Stop step; learn-from-upset step 2 checks earlier lessons.
  Chain green (1580 passed, trial 132/132; sweep 21 as before). Both projects took 5c847ba (f62e9b5 1557, f98df09 1573);
  ff4c0c7 sent to both, open: their --full runs and a Stop timing on a quiet machine (655 ms under load, 384 ms quiet).
  The project's own focus test (passes generic cards that fill a basic job) is its session's to change: told.
- 2026-11-04 08:30 UTC: trial v25 (12 trials on e341b18, 6 blind judges): 0 high in 11 projects, 1 high (an endpoint design
  the agent got wrong), verdict WORSE on setup cost ($6.57 median vs $5). Fixed in 4dd7d54 (proof 28648cb): waiting blocks
  count toward the 3 rounds, a question after Finished counts under autonomy, upgrades route to engine.md, checklist asks
  name their runbook, warm-letter example. Sent to both projects. Next: setup time (audit --setup reruns, 6 to 10 min each).
- 2026-11-04 09:50 UTC: c6979aa (proof 808ceac): a --tags self-test run reuses proven engine results (28 s to 4 s); sent to
  both. 21998f3 (proof a14d856): quoted text is no command in the upset gate's read check; a disproved complaint owes no
  runbook checklist; sent to both. Obedience round o4 (4 projects, frozen 808ceac) running. Stop timing near 500 ms in both
  projects under load: recheck asked for on a quiet machine.
- 2026-11-04 06:40 UTC: 247f74d from a replay of every real user message of both projects: contractions are no quotes, idioms
  and everyday phrases route nothing, missed and false upsets fixed, an echo naming a gate tool is no run of it. Chain green
  (1590 passed, trial 132/132; sweep 21 as before), proof 84047bf, sent to both; open: their --full runs. Trial round v25
  (12 trials, frozen e341b18) running, then blind judging.
- 2026-11-04 03:30 UTC: b15445e (two false Stop steps from one project: notes rewritten with CRLF mid-turn lost the turn start, so
  earlier turns' lessons were asked for; a verdict whose next sentence said who judged it was still flagged). Chain green (1576
  passed, trial 132/132; sweep 21 as before). Both linked copies on 5c847ba; upgrade sent to both, open: their --full runs.
  That project's 8 to 9 s Stops: its own externalStop command, and one waiting Stop during its heavy format sweep (load).
- 2026-11-03 evening: (question-no-file under autonomy auto: "what do you think we should do?" about a problem asks for the fix; one
  project's fix was flagged as unasked). Chain green (1570 passed, trial 132/132; sweep 21 as before). Sent to both projects.
  Both on 59691c8, committed: 8f0572d (1551 passed, stop 453 ms, machine loaded) and 476eea4 (1567 passed, stop 445 ms).
  Then 627fd05 (a same-day upgrade review kept the earlier commit only in git) and the open-plan task-word fix (one
  common word of a task line held an unrelated request): chain green (1573 passed, trial 132/132). Both on c78e6eb, committed:
  b1c3a4b (1554 passed, stop 448 ms) and d9e99ee (1570 passed, stop 453 ms). Stop rose from about 335 to 450 ms over the day
  on the old engine too (same-run A/B: 523 to 536 and 455 to 455 ms), so machine load, not the changes; watch the headroom.
- 2026-11-01 14:54 PST: aed606f (a yes/no question typed mid-turn counts as answered by a reply that opens with
  yes or no; a false Stop step in one project). Chain green (1548 passed, stop 385 ms, trial 132/132). Both linked
  copies on 4ad058c. Both upgraded and committed: faaa612 (1529 passed, stop 394 ms) and 4863a10 (1545 passed,
  stop 355 ms).
- 2026-11-01 evening: helpers' verdicts reported as items passing (claim-checked), from a project's complaint, and
  a project Stop command's time limit (externalStopTimeoutMs, 180 s): e71fcba. Both projects on it, committed, full
  self-tests passing (1522 and 1538). Watch: Stop timings drift up under load (here 389 to 622 ms in full runs while
  a project ran heavy helpers, 465 ms on the commit run; projects 355 and 385 ms).
- 2026-11-01: 55586fa (after cd83096: grouped gate run into a file, commit names in cited claims, and a gate command's own file first). Both projects on it, committed: 3835269 (1513 passed, stop 334 ms) and b0fa5bf (1529 passed, stop 329 ms).
- 2026-11-01: 9e99c3a and 54b85b7 (four false blocks from one field report: layout numbers, helper run order, debug shots, data named like tests), chain green. Both linked copies fast-forwarded; both upgraded and committed: 1415d41 (1542 passed, stop 350 ms) and 26e8ba1 (1558 passed, stop 372 ms).
- 2026-10-31 night: the unfinished-work exits closed (plan docs/plans/2026-10-31-unfinished-work-exits.md, done but item 8, per-item proof). Upgrade sent to both projects; open: confirm each passed --full.

## Next
0. Run the trial on 0793661, then push when the user names main. Open close calls: the zorbel-tune test shape and
   the gaming-heavy media-group list in skills/research/scripts/claims.mjs.
1. Push this batch, then run round v21 to confirm v20's highs are gone. Then run an obedience round.
2. Open from v20 (medium):
   - Every Stop round asks for the whole answer again, so users read it 2 to 3 times.
   - Stop rounds are spent while background helpers are still working.
   - A check run while a helper is still testing reads the helper's red test run.
3. no-verbatim-examples flags single common words as the user's examples ("can't", "HEAD", "yes" in engine code):
   it should need a run of several words. Seen 2026-10-27 in this session.
4. A runbook for false alarms in the starter only: fix a check that misfires only here, never the critical guards.
4b. From the status-line probes (2026-10-27), still open: "checks passed" doesn't say when checks were waived; the
   checklist count uses the runbook as edited mid-turn (3/4 after a 3-item start); a printable HTML handout set off the
   gui-pack step, and a plain request got a hardening chore; 🟢 missing in 2 of 6 fresh headless sessions; "fixed"
   never shows when a turn ends with steps left.
4c. Status bar and repeat complaints (plan docs/plans/2026-10-28-status-bar-and-acknowledged.md): the bar is in the
   starter now with its self-test. Still open: wire.mjs does not write the statusLine setting yet (a project gets the
   bar only by hand, in .claude/settings.local.json). The selfcheck case "stop-follow-on guard: a new rule written into
   CLAUDE.md" fails on the last commit too (forbidden-terms from the private-term list), like audit sweeps 1 and 21.
4d. Acknowledged and runbooks (plan docs/plans/2026-10-29-acknowledged-runbook-and-bar.md): done and tested; the bar
   chains every other status line. Still open: wire.mjs only adds missing hooks, so existing projects keep a
   PreToolUse matcher without "Skill" until rewired by hand; projects get these changes only by an engine upgrade
   (one project got the files by hand copy). Committed 2026-10-29.
4e. (fixed in 2e95e12: the test now waits for other self-test runs) 2026-10-29: the stop-budget self-test failed twice in full runs (540 and 580 ms against 500), passed in another;
   timed alone, old and new engine both take about 110-125 ms, so it is the load of the parallel run. Watch it; if it
   keeps failing, look at "sync (generated files)", the slowest part (about 250-320 ms in those runs). A third run
   (726 ms) ran beside 33 busy node/python processes; alone, this engine takes 156-164 ms against 134-145 ms for
   73dec47.
5. The runbook checklist is now on by default (was a trial): watch a day of real turns for friction.
6. (found 2026-10-30) The 2.4 s prompt hook was a cold-cache timing: bench never kept its caches; fixed with the bench-caches change.

## Open questions
- (none)
