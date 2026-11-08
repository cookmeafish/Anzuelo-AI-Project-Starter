---
name: improvement-loop
summary: Prove a starter change makes new projects better and never worse - trial rounds, blind judges, verdict, fix, repeat
triggers: improvement loop, only improvements, only improve, not worse, nothing worse, make anything worse, makes it worse, multiple tests, test it multiple times, test with yourself, tests with yourself, new projects in your scratchpad, trial round, run the trials, judge the round, feedback loop, loop the feedback, give yourself feedback, ton of tests, lots of tests, tests for hours, hours of tests, test for hours, did good or bad, kept it on track, keeps it on track, forgot things, forgets things, feed it back into yourself, fed back into yourself
---
# Improvement loop (starter only)

How the starter proves a change makes new projects better and never worse: real new projects, real headless agent
sessions, blind judges, a verdict against the history, then fixes and another round, until a round finds nothing
worth fixing. New projects never get this file or `tools/starter/trials/`.

Use it for any engine change meant to make projects better, a field report from a real project, or "test that it only
improves". A round costs about an hour and a fair share of the account's usage; rounds and judges stop at the usage
limit, so check that a headless session runs (`claude -p "ok"`) before starting one.

**Started by events, never by a clock (2026-11-07).** Off by default, and off again in every new chat: it runs only
in a chat where the user started it by hand. There, a round starts only from something real: a
project reports a problem, the end check keeps sending work back in a project, the user is upset, or the user asks.
No timer runs it. The full chain and one trial round run once per batch of changes, never after each small fix.

**Simpler, never busier (2026-11-05).** A round may not add an interruption during work or raise the number of
checks. Prefer deleting: fix a miss in the start reminder or the end check, or record it and leave it. A fix must
hold in two unrelated kinds of project; one that would add a gate is recorded and left. Fixes ship in the next
frozen batch, not one upgrade per fix. Engine text is paid on every turn: before adding a hint, notice or Stop line,
see whether a shorter one, one per session, or none would do; a denial the engine could fix itself (the host's
updatedInput) is fixed in place.

## Steps

0. **Work under the engine.** `node tools/hooks/hooks.mjs begin "<the request>"` in the starter first; what it gets wrong
   on this work goes in `tools/starter/dogfood-log.md` (the inside view, alongside the trial rounds' outside view).
1. **Green first.** Everything committed. Pre-flight in the main folder: a scratch upgrade, `node tools/audit.mjs`,
   `node tools/hooks/v2/selftest.mjs`, and `node tools/hooks/selfcheck.mjs --tags <each check the batch touched>`. A
   change to a check's message, a pack's checks or test fixtures needs the whole self-check there first (`--tags` runs
   only scenarios, not cross-checks such as message-example); two chains in a row failed on the batch's own edits (a
   test's sample path the reference sweep read, a quoted example a message check rejected): 40 minutes lost. Then
   `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs` and `node tools/audit.mjs` pass, each gated on its exit
   code (never `| tail`). Run the long ones on a frozen copy of the commit, so work in the main folder goes on during
   the 20 minutes: `git worktree add --detach ~/.anzuelo-frozen/<commit> <commit>`, then `node tools/hooks/wire.mjs`
   in it, then run there. Not in a temp folder (the link tests refuse one) and not without wire.mjs (the generated
   hook settings are not in git): each cost a failed run. A new worktree has no `.cache/`: create it before sending
   any output there (2026-11-06: every step's redirect failed and the chain did not run). To release a tested commit
   while newer work sits in the main folder, push from its frozen copy (`git push origin HEAD:main` there): the push
   hook checks the proof against the folder it runs in (2026-11-07). Copy its
   `tools/hooks/engine-proof.json` back only when no engine file changed since that commit, and remove the copy
   afterwards (`git worktree remove <dir>`).
2. **Run the round on a frozen copy.** `node tools/starter/trials/run.mjs --round <name> --freeze` (names go up:
   v9, v10, ...). Eight standard projects, four at a time: code in three languages, a Spanish-speaking user, letters,
   spreadsheets, a notes vault, a manuscript (`run.mjs --list` marks them). The frozen copy is this commit, so
   fixes made while it runs never reach it. Before any long job (a round, a frozen chain), print the commit and proof
   it will test (`git -C <copy> log -1 --format='%h %s'`): a starter copy without its proof makes every trial setup
   rerun the whole self-test, and the round measures nothing (2026-11-06; `run.mjs` now refuses such a copy).
   Records: `.cache/trials/results-<name>/`. Nothing heavy runs beside a round (no full chain, no project upgrade):
   load stretches each setup self-test past 5 minutes and the prompt cache expires, so rounds v28 and v28q read WORSE
   on setup time and cost (150k to 205k extra cache tokens per setup) from load alone. Fixes made during a round wait
   to be tested until it ends; hand upgrades out after it. A round's projects live in the temp folder
   (`anzuelo-new/<id>-<round>`); a name used once cannot be reused. Never edit the frozen copy.
3. **Judge blind.** `node tools/starter/trials/judge.mjs <name>` writes four prompts, two projects each, to
   `.cache/trials/judge/`. Run each with its own sub-agent that has not seen the engine work (never one that wrote the
   fixes), in parallel. The prompt is the same every round; never soften it. Each judge writes `<name>-<k>.json`.
4. **Verdict.** `node tools/starter/trials/compare.mjs <name> --record` compares the round with each project's
   baseline (its first recorded round) and with the previous round, and keeps it in `tools/starter/trials/rounds.json`
   (committed). WORSE means any of: more high findings; more than 3 more medium findings; median setup more than
   1.25x slower; more failed or timed-out turns; a share of Stop-blocked turns 15 points higher. And, for efficiency
   (the user pays for every step and waits through every pause): cost per work turn or median setup cost more than
   1.3x; more than 0.25 more denied tool calls per turn (each one a full extra round); more than 1.2x the hook text
   per turn. The judges also report waste with no benefit as area "efficiency", counted on its own. Findings in a
   skill's, pack's or library's own check or script (the judge's "layer": "skill") are left out of the verdict and get
   their own SKILLS line and verdict, so one skill's check never decides whether the engine got better (2026-11-06:
   one such high made a round WORSE while the engine's numbers improved). The user's summary gives the engine verdict
   and one line counting the skills' findings. Judge counts swing by about 3 mediums between rounds from noise alone:
   compare highs, failed turns, setup minutes and blocked turns first. Count Stop blocks from the trial records, not
   the judges (early judges did not count them). The usage limit voids a trial (exit 3, `"void"` in the record):
   `compare.mjs` and `judge.mjs` skip void records; rerun them under a new round name after the reset, never judge them.
   - **4a. Measure the real projects** (live data comes before trial findings; v2 has been the default engine since
     2026-11-05, and trial rounds run on it from v32):
     `node tools/starter/interrupts.mjs <transcripts> --since <date>` (any refusal or notice during work that isn't
     for safety is a finding), `node tools/starter/stop-value.mjs` (which end checks led to real work) and
     `node tools/starter/stop-found.mjs` (v2's blocks). Report v2's numbers: blocks per turn, how often the verify
     list led to a real fix, and false alarms.
5. **Feedback to fixes.** Read every high and medium finding (and lows that repeat across projects). For each one the
   starter caused or could prevent: confirm it in the transcript first, fix the cause in the engine (not the
   symptom), add a self-test that fails without the fix, and add a line to `tools/starter/STARTER-CHANGELOG.md`.
   A finding that is the model's own slip, with nothing the starter could do, is noted as such, not "fixed".
6. **Green again, then commit.** Step 1's chain passes; commit the fix, then the engine proof
   (`tools/hooks/engine-proof.json`, subject "Engine proof") and `rounds.json`, with the user as the only author.
   Push only with the user's OK in this session. After the push, fast-forward each project's linked starter copy
   (the folder its `tools/starter.local.json` names) to the pushed proof commit before telling the project to upgrade
   (2026-11-07: a project found its copy behind and could not upgrade).
7. **Loop.** Start the next round on the fixed engine (step 2). Stop when a round is NOT WORSE against both the
   baseline and the previous round and has no high finding and no new medium finding the starter could prevent; or
   when the usage limit stops it, then say so and resume after the reset.

## A testing session with a time budget ("test it for 5 hours")

One session of steps 1 to 7, run back to back:
1. Write the start and end time in `tools/starter/STATUS.md`, so a later session knows when the budget ends.
2. Each round is the standard eight plus the drift probes (`run.mjs --list` has their ids; today `np-reading-rule`,
   `np-garden-parts`, `np-meals-upset`): `node tools/starter/trials/run.mjs --round <name> --freeze <the ids>`. They
   check what the standard set does not: a rule or fact the user gave earlier still holds turns later, every part of
   a several-part request is done and truly reported, a change reaches every file that depends on it, and the
   project's notes are used. Their judges (groups i and j in `judge.mjs`) say what to check in each.
3. While a round runs, look at the real projects (the project-watch runbook): their Stop logs, upsets and false
   alarms are evidence the trials don't have. Each problem found goes through step 5 like a finding. Include their
   helper agents (`<session>/subagents/*.jsonl`): every user message that reached a helper was routed and its
   hand-back held to the checklist (the trials never talk to a helper, so only this finds a miss there). Lesson (a
   field report, 2026-11-05): a helper did user work with no routing and no final check, and no test kind looked.
4. Every finding the starter caused or could prevent is fixed with a test that fails without the fix, the chain
   passes, and the next round runs on the fixed engine (the user, 2026-11-01: any issue found is fed back in, fixed
   and retested). A round started on an older commit still counts; its findings are checked against the newest
   engine before fixing.
5. Stop at the end time or when a round meets step 7's bar, whichever is first. The answer lists each round with
   its verdict, each fix with its commit and test, and what is still open; the open items go in `STATUS.md`.

## Done when

- [ ] This session's work went through the starter's own engine: `node tools/hooks/hooks.mjs begin "<request>"` recorded it, or its hooks did (hook: engine-bypassed)
- [ ] The last round's verdict is NOT WORSE in `tools/starter/trials/rounds.json` (hook: claim-checked, improvement
      claims need a compare.mjs run this turn) (when file: tools/starter/trials/rounds.json) (ran: compare\.mjs)
- [ ] No engine file changed since the last judged round, or the next round is running (hook: audit sweep "improvement
      loop is current")
- [ ] Every high and medium finding of the last round is fixed with a test or noted as the model's own slip (judgment)
- [ ] A testing session with a time budget ran rounds until its end time or a clean round, and the answer lists rounds, verdicts, fixes and what is open (judgment: the budget and the rounds differ each time)

## Pitfalls

- Edit code with the Edit tool, or for bulk edits a Node string-replace script written with the Write tool. Never use
  sed, echo, a heredoc or `node -e` with regexes or backslashes: the shell eats the escapes, and the edit fails or
  changes the wrong text (at least six times in one session).
- A decision for the user is written for someone who has never seen the engine's insides: what happens today, what the
  change would do, what it costs, then the question. Never copy it from the plan's notes; every internal name (end
  check, setup, Stop checks, sweep numbers, file names) gets a plain description or is left out. Lesson (2026-11-07):
  a decision copied from the plan in engine words meant nothing to the user.
- Never tell the user they did, chose or added something without a record that shows it. Look it up first (the
  session transcripts under `~/.claude/projects/`), and say who did it and when. Lesson (2026-11-07): a private-word list
  an AI session had written was called the user's own list, and a word on it the user's choice.
- After a safety refusal, change the content before trying again; never send the same edit twice, in sequence or in
  parallel. Real projects are test data, not the subject: the starter's plans, commits, tests and messages give totals
  over "real sessions" and never name a project (2026-11-07).
