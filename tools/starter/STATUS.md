# Starter status

Where work on the starter itself stands, for the next session. Projects never get this file (their own is
docs/STATUS.md, which here is the template new projects start from).

## Queue (oversight, for the user, 2026-11-12; in order, tick as done)
- [x] 1. The work log (released in c2f1528, 2026-11-12; follow-up fixes from its first live day in the next release).
- [ ] 1b. No-leaks Task 3, right after the three upgrades: the paged pool stayed +507 MB after the two chains of
  4680b8a (2573 -> 3080 MB); top tag Key (registry key blocks, 317 MB, 1.22M live), then MmSt, FMfn, Ntff, Toke. Find
  what opens a registry path per test copy or process by a tag diff around one shard; save a tag baseline
  (pooltags.ps1, into tools/starter/) right before the next chain. Fixed only after the multi-chain soak.
- [ ] 1c. Live false holds from c2f1528 (oversight, 2026-11-12), each a test: an item the final answer delivers closes
  (a "wait" item too); a promise in a sentence that defers it ("once they've upgraded") is waiting; a report, plan or
  STATUS under tools/starter/ is no engine change (no self-test or starter-changelog ask); `hooks.mjs waive <tag>`
  refuses an unknown tag and names the item's real one, a waiver holds in later rounds, and each held item shows its tag
  in the details file (the last two done in de58b8a). From a project: hook timings up 15-20% after c2f1528 (prompt 146
  -> 175 ms), with item 13. The audit's REQ-tag sweep reads plain names in a requirements row's enforcement cell as
  tags (a project's false alarm): only REQ-style tags count.
- [ ] 1d. Upgrades (oversight, 2026-11-12), with no-leaks Task 3: a project's post-upgrade check runs the v2 selftest
  and the parity tags only, never the full old suite or its shards (the release chain proved that commit; a project's
  upgrade ran the full suite and the churn reached the machine); the engine runbook's "self-test ran" item accepts it.
  `starter.mjs upgrade` on a dirty tree stops before changing anything and names what is uncommitted; with
  --allow-dirty it goes ahead and lists the engine's files for a separate commit. Tests for both.
- [ ] 2. A release with rewrite part 1 + routing + the log, then upgrade all 3 projects the same day.
- [ ] 2a. (oversight, 2026-11-12, for a fourth project, a large established app) The .anzuelo layout from day one: a
  fresh install of an established project puts everything under .anzuelo/ (the engine-outside plan's remaining steps,
  plus the audit check); then migrate projects one and two. Confirm the adoption review (surgery mode) works on v2 with
  the .anzuelo layout by a trial on a copy of a large public repository.
- [ ] 2b. Fix proof (item 3's first part), then the rest as queued. Includes: the health check says "fails after this
  change" for audit failures that were there before the turn (found 2026-11-12 once a test fixture really had a turn):
  hold only what the turn's change broke, or name the rest as already there.
- [ ] 3. The rewrite's remaining parts:
  - [ ] fix proof;
  - [x] the subagent guard; (ef7b085: never refuses)
  - [ ] format items never hold;
  - [ ] bookkeeping turns;
  - [x] drop the 💬 lines; (ef7b085)
  - [x] deleting the turn's own files; (ef7b085)
  - [x] sed -i; (ef7b085)
  - [x] path checks against the own folder; (65b0057: a path the turn's own calls touched is not "missing")
  - [ ] the replay of the 2,309 lines;
  - [ ] the deleted-code diff.
- [ ] 4. The root-cause rule in the engine.
- [ ] 5. GUI testing gaps.
- [ ] 6. The orchestrator feature (my plan is coming).
- [ ] 7. The .anzuelo migration of every project but the starter, with its audit check.
- [ ] 8. No-leaks 3-6 and the soak.
- [ ] 9. Upgrade project three.
- [ ] 10. Phase B.
- [ ] 11. Text audit 3-5.
- [ ] 12. The asyncRewake experiment for Stop feedback. And (oversight, 2026-11-12): the pass line (✅ 📖 🧠 🌱) never
  goes through the Stop hook ("Stop says" reads as a stop): it shows in the status bar from the session's state file,
  on by default where the project uses the starter's status line (chained to a project's own, never replacing it), and
  nowhere else; Stop's systemMessage only for a real problem, "Waiting on you", or the upset acknowledgement.
- [ ] 13. Hook speed under 300 ms on real-size transcripts.

## Queue to the finish (oversight's plan, 2026-11-10; tick as done)
Phase A, open v2 tests to 0, in batches of about 15 (one chain per batch, released when it passes):
- [x] Batch 1: name-var, note-linked, the "must pass" false hold, stop:a, check-proven (retired: record lines), waive,
  runEach (the user's rule), runbook-exists. Open in it: 2 "15+ calls" tests (rule ported with a v2 self-test; the
  harness turn lacks the prompt's route)
- [x] Batch 2: check-preview, menu, paste-routing (retired), recall, rule hint. Moved to Phase B: fit-checklist (the fit
  code is all in hooks.mjs). Left: the rules digest (2 tests, harness work for v2's session start)
- [ ] Batch 3: answer-noise (retired, rows 44/42), begin-keeps-turn, notice-answer and notice replies (another way),
  session-checklist, engine-bypassed done. Left: maintaining (always.md's "runbook read" marker can't tell maintenance
  from use), manual path, agent-neutral
- Release: chains pass but the speed limits can't be judged under the machine's load (a game); one chain for the newest
  head once the budget passes.
- [ ] Batch 4 on: the single-test tail (codex, engine-cache, host-fixtures, own-scenarios-run, overlap...), by file.
  2026-11-12: every open name is ported, fixed or triaged; the last fixes (stop rounds, other session, fit-checklist x3,
  stop-budget x2, engine-cache, own-scenarios-run, host-fixtures) wait for the post-restart sweep to leave the list.
  After the restart: v2 selftest (speed must pass), two chains with the 5-minute pool log, release, notices, prune.
- [ ] Phase B, plan step 1b (2026-11-12): the guard takes nothing from hooks-main through use() (state, shell, runs,
  transcript, setupinfo, setup modules). Next: the user lines (one visible() filter, v2's), then the CLI.
- [ ] Oversight decisions to carry out (2026-11-12): the held message shows the accepted not-fit wording
  ("<runbook> doesn't fit this task: <why>") with a test that it clears the items; the knowledge pack's deliverable.md
  one-word triggers (guide, proposal, checklist) become phrases, after a read-only router diff over the knowledge-pack
  projects' typical requests and recent prompts; one line in the upgrade notice.
- A test that needs a user decision goes on one "for the user" list, sent to oversight; work goes on.
- [ ] Field report (a project, 2026-11-10): a turn that changed no project file was held for 7 items because a peer
  session edited a project file mid-turn. Likely path: the end check's walk of files changed since the turn began (on a
  turn that ran shell commands) cannot tell another session's edit from this one's. Fix idea: each session's edit hook
  logs the files it wrote; the walk leaves out a file another live session logged in the same window. Not reproduced.
- [ ] Idea (a project, 2026-11-11, low): the "whose folder" reminder line without the engine's scope guard, for a project
  whose own hooks already guard people's data (its people folder is not profiles/). Weigh first (rule 16): one reminder
  line against a new setting; check whether switching off the scope-separate check already leaves the hint on.
Phase B: engine-v2-only 1b to 1e (rest of hooks.mjs into modules, one v2 entry point, tests unpinned, hooks.mjs
deleted). Done when git grep for hooks/hooks.mjs and STARTER_ENGINE finds nothing outside the changelog, and every
project passes after upgrading.
Phase C: clean-exit Tasks 4 and 5. Phase D: hybrid-db-mcp with its ship bars.
Every batch: the pre-chain quick runs; the next batch starts while a chain runs; after each release, one line to
oversight (commit, open count, next batch).

## Now
- 2026-11-12 (afternoon): app-port at 26b902d, not released. Order set by oversight: (1) docs/plans/2026-11-12-no-leaks.md
  (Tasks 2-6, then a 4-chain soak on a freshly restarted machine; nobody says fixed before it), (2) the release,
  (3) docs/plans/2026-11-12-evidence-model.md (plus oversight's queued real-turn cases: per-session notes, a quiet
  acknowledgement, whole short lines, the runbook pick, false Stop rounds, one routing path, the subagent-brief guard),
  (4) the .anzuelo migration of the two old-layout projects, (5) the rest of 1b. Done today: stop-tests, the audit
  reads every module, the compile cache gated and pruned, tools/starter/leaks.mjs in both chain scripts, the audit's
  "engine lives under .anzuelo/" sweep. Left for the user to decide: Node's old compile cache (about 22.6 GB), about
  3,800 old bgmoved-*.output files in TEMP, 714 test transcript folders.
- 2026-11-11 (evening, paused for a restart): main and GitHub at 2c59015 (15 open). app-port ahead (37efbf1): other-
  session security review, session ports, the routing-only Stop speed fix (two projects measured Stop +17 to +20 ms),
  audit-run mapping, the no-hooks follow-on guard; its chain (9ca792b) passed the timed steps and was stopped for the
  restart: run a new chain on the app-port head. First after the restart: docs/plans/2026-11-11-temp-hygiene.md (test
  fixtures under one temp root, removed at exit; child processes hidden). Before it: kernel paged pool 12.95 GB,
  nonpaged 5.58 GB, 15,488 top-level entries in the temp folder (measured before the restart, so compare after one chain).
- 2026-11-11 (later): main and GitHub at ff46f04 (27 open). app-port: hooks.mjs is a small entry with Node's compile
  cache, the body in hooks-main.mjs; prompt ~68 ms and pretool ~53 ms over bare against 75/60, measured. The Phase B
  module split stays planned as the real speedup.
- 2026-11-11: main and GitHub at d02602b (proof for 5021077). v2 list after its sweep: 33 open, 69 retired or
  proven another way (was 118 open on 2026-11-10). Released today: 67acac3, f134ecc, 234cdd3, d02602b; both upgraded
  projects reported 0 regressions each time. app-port ahead: selfcheck --explain under v2. Left: sessions and stop rounds,
  state hygiene with made-up sessions (touches begin and many self-tests: plan it), fit-checklist (Phase B), stop
  budget, own-scenarios/host-fixtures tooling, the upset-learned acknowledged lines. Chains: keep the machine quiet
  through the self-test AND selfcheck steps (both judge time limits).
- 2026-11-10 (night): main and GitHub at 2648dc1 (proof for 63c2888: rule 2's runbook ask, the shortened-id guard,
  read-only turns skip the file scans). Notices sent to all 3 projects. v2 list after its sweep: 118 open, 43 retired.
  app-port ahead: note-linked, name-var (via tools/hooks/names.mjs), the requirement filter. Next: the rest of batch 1.
- 2026-11-10 (late): main and GitHub at 44c6b0c (field fixes: background runs dated by their end, plan check outside
  the project, audit skills in .anzuelo, self-test fixes for that layout). All 3 projects notified; one's upgrade waits
  on the user's permission. app-port ahead, not released: check-preview (9 tests off the list), v2-retired.txt and the
  sweep keeping it in step. v2 list: 161 listed, 122 open, 37 retired, 2 another way. Next: the release of those, then
  the open groups (route, check-proven, upset-acknowledged/learned, fit-checklist, name-var, note-linked, runbook-exists).
  Not verified: agents finishing items past the first 3 of the short Stop text (baseline: 47% of holds with more than 3
  items needed a 2nd round).
- 2026-11-10 (after the restart): all 4 items below done on app-port, each with a failing-first test, plus the short
  held-answer text (a heading and at most 3 items; the full steps in tools/hooks/state/stop-details.md), the wakeup
  check accepting "stays on, every N minutes, next run", runs cut off by a restart not counted as failures (both
  engines), and the commit gate. Chain on 40c87d3 running. Next: release it, the notice from git log a8a0575..<proof>
  to every engine project (rebuild the list first), and tell the two projects whose field reports were fixed which
  commit has them. Then the remaining v2 list in triage order. Not proven: agents finishing every item from the short
  text in live turns (the details file holds items past the first 2-3). Open: answer-traced intermittent; branches
  app-port-head and rel-* (deleting needs the user's OK).
- 2026-11-10 (pause for a restart): main and GitHub at a8a0575 (release of e30446c: Stop as non-error feedback on
  Claude Code, the changelog rule with dataDirs, friction reported, the new end checks). All 3 engine projects notified
  (the list is now rebuilt per notice: scan the projects folder plus ListAgents; tools/starter/watch.local.json). Two upgraded
  with 0 regressions; their full self-tests were cut by the restart and they rerun them. Branch app-port at 7d4dd38,
  not released, its chain stopped for the restart (rerun: frozen-chain.sh 7d4dd38; the script now stops on any
  pre-audit FAIL): the commit gate for REQ tags with no test (req-tested), Stop speed (AI-credit scan skipped by the
  reflog, runbook list parsed once; ANZUELO_V2_TIMING), the false "pushed" claim held while helpers run, the count check
  skipping described numbers. Next, in order:
  1. Field report, high: in the .anzuelo/engine layout `starter.mjs upgrade --dry-run` ignored the flag and upgraded
     for real. Reproduce, fix, failing-first test that a dry run writes nothing in both layouts; then that project runs
     its post-upgrade checks (selfcheck, audit, tests, own checks, fit, upgrade review).
  2. AI-credit skip: use the newest time under the git folder's logs/ (HEAD and refs/heads/*), not logs/HEAD alone, and
     scan all branches (git log --all --since); test a commit to a branch that is not HEAD's (oversight).
  3. Chain on the head, release, notice from git log a8a0575..<sha> to every engine project.
  4. Data-dirs guess: a folder full of per-item CHANGELOG.md files, or one in newVersionOnly/protectedOriginals, is a
     data signal (a project's field note: its main content folder was missed).
  5. Remaining v2 list in triage order. Open: answer-traced intermittent; stray branch app-port-head and the rel-*
     branches (deleting needs the user's OK).
- 2026-11-10 (night): main and GitHub at 1241407 (release of 248cd38: autonomy hint, worth-it, autonomy-decide,
  event-hint with "Likely fits" for word-only checks, AI-credit commits at the end, upset read on a long message's
  ends, scope-general, the gui pack by packs). Both projects upgraded, 0 regressions. Branch app-port at 4cd95e7, its
  chain running: externalStop, review-excuse, watcher-left, shared steps, plain writing, waitsForAgents, word-only
  anyOf branches, moved files as changes, rule 12's changelog in any folder ("dataDirs", setup and upgrade offer it),
  friction reported not suspended (auto-suspend retired), temp cleanup retries. v2 list 192. Next: after the chain,
  release and a notice built from git log of the range; bench Stop on a quiet machine (433a5f7 vs 1241407) for one
  project's timing question; then the remaining single tests in triage order. Guard is at 598 of 600 lines: raise to
  800 once when a port needs it (oversight). Open: answer-traced intermittent; the stray branch app-port-head (deleting
  needs the user's OK).
- 2026-11-10 (evening): main and GitHub at 433a5f7 (answer figures traced on the answer itself, research-verified,
  toolPassed, answer-resent, praise, relay, plan-required, check-preview guard, self-check session fix). Both projects
  sent the upgrade notice. Branch app-port at eae6e3e (plan-open, the v2-test counter as a record the audit lowers
  itself, covers citing v2 tests); its chain is running. v2 list 266. Next, in triage order: covers ports (changelog,
  dev-new-project, agent-neutral), then the largest remaining harm-3 groups. Open: answer-traced intermittent; the
  stray branch app-port-head (deleting needs the user's OK); status-handoff is never named in the reminder (the
  guard's cases are small changes, which skip it). A project's self-test timed hooks with 14 test processes running and
  printed no "shared the machine" note: the trial did not register as a running suite (fixed on app-port, 2026-11-10;
  the sweep's driver needs none, its child self-test registers). Not yet confirmed that this was the whole cause.
- 2026-11-10 (later): main and GitHub at 77e164d (release of 69df17f: check preview line, v2 plan-required, skill
  hint on the user's own words; chain passed with time limits judged). Both projects sent the upgrade notice. Branch
  app-port at 883fb67, not released: the plan rule in the preview line, v2 honoring switched-off checks, praise hint
  (praise.mjs), relayed messages routed on what they ask (relay.mjs). Next: the v2 sweep on 883fb67 to shorten the
  list, then a chain when quiet; then the skill check preview (a routed skill shows no "Done when" list under v2:
  5 note-skill tests), route, answer-resent. The old count-honored switched-off test passes vacuously under v2 (v2 runs
  no count check). Open: answer-traced intermittent; the stray branch app-port-head (deleting needs the user's OK).
- 2026-11-10: main and GitHub at 52f2f42 (no-transcript check, stop-follow-on, honest v2 judging, release speed rule,
  plans as records, hooks-tested). Both projects upgraded, 0 regressions. Branch app-port (~/.anzuelo-work/app) at
  d679a28, not pushed: skill-learn (lesson named in round 1), the shrink-only v2 list rule, and v2 routing as the old
  engine (near.mjs). Its release run waits for a quiet machine (5a7d341's proof was "time limits NOT judged" under my
  own load, so it was not pushed); hold until the larger project's quiet full run reports. Next: check-preview (e)/(f) as approved by
  oversight 2026-11-10 (one "Also checked at the end if files change" line, last, labels from the checks, dropped
  first under the cap; the round-1 test as proposed); take (d) off the list as a deliberate difference (the self-check
  shown in every session, per the rule "run it on your draft first"); run the new check-preview v2 tests (uncommitted
  in selfcheck.mjs). Open: the answer-traced intermittent (now logs v2's decision when it passes wrongly); the larger
  project's quiet old-engine Stop reading (sync is size, about 180 ms at 54 skills; make sync skip unchanged inputs if over
  about 450 ms).
- 2026-11-09 (night): chain on 8369080 (list 390) in trial and audit; push it when it passes, committing the list with
  the proof. Then one chain on a99dc31 (the sweep now shortens the list itself and fails only on a new failure; the
  copied-words false hold fixed, bba3057), push, and one batched upgrade request. Next: hooks-tested, by extending the
  turn-start snapshot (lib.mjs snapshotDirty) to save requirements.json, config.json and always.md as they were, and
  comparing them at Stop (oversight's design).
- 2026-11-09 (evening): branch app-port at bc5acb3, not pushed. It has app-test-pass (gates.mjs, 7 of 9), the
  instructions-run false hold on "engines run", the lazy test-file walk (a question's end check back under 60 ms), the
  lazy trace history (Stop 7-10 ms on long sessions), and done-when-labeled (donewhen.mjs, 3 of 6). List 394. Chain on
  c647cd8 is running; then push it, run the chain on bc5acb3, push, and send one batched upgrade request to both
  projects (their 7f3ed03 timing reports are answered). Next: fix the copied-words false hold (the end check's own
  feedback, arriving as a user message, is read as the user's words, so engine message strings in files are flagged);
  then hooks-tested; stop-follow-on only after checking it against row 42 and the open display question.
- 2026-11-09 (later): pushed 7f3ed03 (chain 5/5 on 69b8201): the old-suite list 434 to 403. proof.mjs (check-proven,
  never-again and enforced claims, complaint turns only, as the old engine), trace.mjs (answer-traced) and
  launchers.mjs (instructions-run) moved whole out of hooks.mjs and run in both engines. Upgrade request sent to both
  projects. Branch app-port (~/.anzuelo-work/app, a8d548c + merges): gates.mjs (the gate judgment) and app-test-pass
  parity, 7 of 9 off the list (to 397); ships after the size ceilings are set (base 2,600, all 6,000, oversight
  2026-11-09) and its chain passes. Next groups: stop-follow-on (7, needs a design: v2 items are messages, not tags
  with fix files), hooks-tested, done-when-labeled. Open: the user's two display questions; whether this session may
  schedule its own wakeups. Known false hold: the old engine's instructions-run read "modules both engines run:
  `x.mjs`" as telling the user to run those files.
- 2026-11-09: on main, not pushed: eb0dac1 (Spanish patterns built on first use), 8b54ab8 (old-suite list 460, four
  "passes that check" tests kept with their BLOCK until skill-reuse, runbook-complete, cold-read are ported), b7289ef
  (touched-only files meet no file marker; converter count by tag), 9277522 (config read once per Stop). Chain
  bi1wtxha3 runs on 8b54ab8; b7289ef and 9277522 need one more chain, then push and one batched upgrade request to
  both projects. Open: the user's two display questions (Stop-block style; start-of-turn runbook line).
- 2026-11-08 (late): release e672379 (4b3be1d + proof + the reworded v2 list) passed the full chain, v2 sweep
  included, in ~/.anzuelo-frozen/rel-4b3be1d; waiting for the user's OK to push it to main (the guard needs it in the
  request). The 8 known items were checked failing by name on b8ca1db. Not in it yet, need their own chain: 6225c6d (a
  clone inside the project folder installs into its .anzuelo), 222c5fb (security check skips skill mirrors), 89001bc
  (security check skips the starter's own tooling). Open: the 8 known v2 regressions on the v2 list (runbook-edit routing
  x3, stop-log, answer-resent draft, app-test-pass npm --prefix x2, upgrade-review "later - when"); the end check
  asking for Finished again after the short "what changed" note, and calling a follow-up a redo; files outside the
  project counted by the copied-words check; the user's question on showing blocks as "Stop hook feedback"; the second
  project's upgrade report; the Stop re-profile.
- 2026-11-07: runbook use measured on real project sessions since 2026-11-05 (totals): 34 work turns. 6 were routed: 2
  opened the runbook that turn, 3 earlier in the session, 1 never. 28 were not routed: 25 opened a runbook that turn,
  3 earlier in the session. Turns that worked with no runbook at all: 1 of 34 (3%), under the 10% bar, so no end ask
  is added. Measure again after the next batch upgrade.
- 2026-11-05: Quiet work shipped (45a94c2, local, not pushed): during work only safety guards refuse, helpers are
  never held, no done/skip lines. Both projects upgraded to 299f45a (all tests pass). Engine v2 is in
  tools/hooks/v2 and off by default. It has the start reminder and end checks 1 (runbook Done-when) and 2 (tests),
  and was replayed on real sessions: 0.05 blocks per turn against v1's 0.68.
  Later (451d669, local): v2 runs in shadow beside v1 and logs to tools/hooks/state/v2-shadow.jsonl. Its tests check
  honors the project's declared commands. Upset messages go to learn-from-upset, and unrouted work picks its runbook.
  The routing sample is done (in the plan). v2 end checks 3 to 7 are built (screens, health check, knowledge sources,
  security review, claims backed; last d415138). Their replay recall is under target, so they wait on the shadow logs.
  Decision 2026-11-08: a check under 50% blocks-found in shadow is dropped. Full self-test at 66de043: all pass; the
  run at d415138 is in ~/.anzuelo-frozen. Next: Done-when items checkable or dropped, size-budget test,
  AGENTS/README draft, then the 2026-11-06 batched upgrade.
  Next (docs/plans/2026-11-05-engine-v2.md):
  - tomorrow's batched upgrade of both projects (they were already upgraded once today), then read their shadow logs
    for live recall and precision;
  - end checks 3 to 7;
  - make the Done-when items checkable;
  - one engine-off round.
  Trial rounds and v1 micro-fixes stay paused until v2 lands. Open question for the user: replace the two scheduled
  prompts with "continue the v2 plan".
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
- 2026-11-05 UTC: v29 findings fixed in b367ad9 (proof d783e2d): knowledge computed figures, one-word names, security
  open-count wording, bulleted verification label, plan check in the repeat guard, no-polling guard, trial wording out
  of the engine (keepOut in scenarios.json). Chain green. Sent to both projects. Next: round v30 once both upgrades end.
- 2026-11-05 UTC: trial v30 (engine 9e5e6bd) WORSE: 1 high (the model's own scope slip), 21 mediums; repeats 0.18 -> 0.04
  per turn. Fixed in a0a6b7f and 0a942ef: description and decisions not copied examples, read-only loops as reads, rule
  hint asks for --tags, screenshot warnings per address, clearer Stop steps, turn notes after inserted lines. Sent to
  both projects. Next: round v31 once both upgrades end.
- 2026-11-05 07:45 UTC: quiet round v29 (12 projects, engine a24faf4) running; nothing heavy beside it. Quiet project
  self-test 113 s vs 213 s loaded; test counts equal across v26-v28q, so the setup slowdown was load. Uncommitted, waits
  for the chain after v29: usage-quiet (runbook-usage.json changes only on a use under the hardening count, a new day
  or a new session; field report: 15 commits of that file in one project). Helper noise: hook text about 1.1k chars per
  helper; the bulk is the host loading CLAUDE.md (about 15k chars) into each helper.
- 2026-11-05 07:00 UTC: v28q (4 projects) VERDICT WORSE on setup time and cost, traced to 2-3 waits over 5 minutes per setup
  (cache expiry, 150k-205k extra cache tokens), during my own chains and the projects' upgrade runs. Seven false alarms
  from v28/v28q fixed in 3e070fe (proof a24faf4), upgrades handed out. Next: quiet timing of a project self-test, then
  a quiet round (nothing else running) to settle the setup verdict.
- 2026-11-05 05:50 UTC: v28 (15405e0, 12 projects, 6 judges): high 2 -> 0, medium 23 -> 12 vs v27, but VERDICT WORSE on setup
  median 27.5 vs 18.1 min. Confounded: 4 full chains and probes ran alongside (self-test median 45 s vs 17 s, audit runs
  37 vs 16). Quiet rerun v28q (4 projects) running. Open v28 findings: wording checks that do not show the accepted
  form (skill-reuse "Existing skills checked first:", runbook-ledger "Done project 2:", research-verified run alone),
  instructions-run false alarm, audit prints nothing while it runs, unsourced legal rule, guard false alarms.
- 2026-11-05 03:30 UTC: FIXED (this commit), high: work the user asks for inside a helper agent gets no prompt routing and no final
  check (only PreToolUse/SessionStart fire; SubagentHandback ends it unchecked). Seen in a project: an upgrade skipped its
  runbook research step. Fix after v28: hold SubagentHandback until the checklist and Stop checks pass; route user
  messages that reach a helper.
- 2026-11-04 21:50 UTC: engine 15405e0 (all v27 findings fixed but the flask design check) handed to both projects; trial v28 running on it
  (12 projects, then 6 blind judges and compare). Do not edit the starter until it ends.
- 2026-11-04 20:40 UTC: v27 findings fixed: one-line reply on a checklist-only round (4e192f1), honest app-not-run line
  (4ccf96d), Vetted license by id + form shown (5e761a8), quoted grant decision not a copied example (39cd664), security-checklist line (8882415), "security check" wording (fcee2ba), same-reply Issue line wording (2c17818), upset-learned labels (this commit).
  Open from v27: flask design check (grant-decided looks at wording only),
  (same-reply Issue line: a hook cannot see it; the refusal now says so). Then a new trial round.
- 2026-11-04 19:10 UTC: both projects on d508c62 (885f472, c94adf6). fb471cc: trial gate needs a node run. The high
  after-upgrade Stop readings did not reproduce on a sample project (load from the starter chain). Next: a new trial
  round on the current engine; setup cost for small projects is still open.
- 2026-11-04 18:30 UTC: also fixed: the carry-over check missed background runs from before the turn it re-checks (692255d);
  the upgrade dry run labelled refreshed checks "(root) 1" (7233f98, from both projects); the trial gate took a
  "git add tools/trial.mjs" for its last run (this commit). Both projects on 774a2eb; d508c62 handed out, reports pending.
  Next: the projects' d508c62 reports, then a new trial round on the current engine.
- 2026-11-04 16:30 UTC: ablation goldens fixed (fe2297c, 35/35). Trial v26 (12 trials on fe2297c, 6 blind judges): NOT WORSE, 0 high,
  setup median 18.3 min. Fixed from it: claim check quotes its claim, colon lead-in pastes, Issue line in the chat (228f615),
  piped gate runs say why (08f09e7), background runs carried across turns (this commit). Both projects on 08f09e7.
  Open from v26: setup heavy for small projects; Stop rounds that only ask for a set wording (security sentence).
- 2026-11-04 12:30 UTC: obedience round o4 (4 projects on 808ceac): 1 rule broken (a user's example name in two test
  files). Fixed in 5af19dd (proof 5b30ff7) with the git guard gap the same round showed (a forbidden name could enter a
  commit message or staged line). Stop timing in both projects is 345 ms on a quiet machine: the high readings were load.
  Live probe of "do not ask me anything" passed. Sent 5b30ff7 to both.
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
