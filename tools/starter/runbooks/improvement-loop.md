---
name: improvement-loop
summary: Prove a starter change makes new projects better and never worse - trial rounds, blind judges, verdict, fix, repeat
triggers: improvement loop, only improvements, only improve, not worse, nothing worse, make anything worse, makes it worse, multiple tests, test it multiple times, test with yourself, tests with yourself, new projects in your scratchpad, trial round, run the trials, judge the round, feedback loop, loop the feedback, give yourself feedback, efficiency, more efficient, use more tokens, wasted tokens, pause or stop, ton of tests, lots of tests, tests for hours, hours of tests, test for hours, did good or bad, kept it on track, keeps it on track, forgot things, forgets things, feed it back into yourself, fed back into yourself
---
# Improvement loop (starter only)

How the starter proves a change makes new projects better and never worse: real new projects, real headless agent
sessions, blind judges, a verdict against the history, then fixes and another round, until a round finds nothing
worth fixing. New projects never get this file or `tools/starter/trials/`.

Trigger: any engine change meant to make projects better, a field report from a real project, or "test that it only
improves". Each round costs about an hour of wall time and a fair share of the account's usage: rounds and judges
stop at the usage limit, so check that a headless session runs (`claude -p "ok"`) before starting one.

## Steps

**Simpler, never busier (2026-11-05).** A round may not add an interruption during work or raise the number of
checks. Prefer deleting: fix a miss in the start reminder or the end check, or record it and leave it. Each round
measures the real projects with `node tools/starter/interrupts.mjs <transcripts> --since <date>`, and any refusal or
notice during work that isn't for safety counts as a finding. `node tools/starter/stop-value.mjs` shows which end
checks led to real work, and `node tools/starter/stop-found.mjs` reads v2's blocks. Engine v2 is the default since
2026-11-05, and trial rounds run on it again (from v32). Live data from the real projects comes before trial
findings. A fix must hold in two unrelated kinds of project; one that would add a gate is recorded and left. Each round
reports v2's numbers: blocks per turn, how often the verify list led to a real fix, and false alarms. Fixes ship
in the next frozen batch, not one upgrade per fix.

0. **Work under the engine.** `node tools/hooks/hooks.mjs begin "<the request>"` in the starter first; what it gets wrong
   on this work goes in `tools/starter/dogfood-log.md` (the inside view, alongside the trial rounds' outside view).
1. **Green first.** Everything committed; `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs` and
   `node tools/audit.mjs` pass, each gated on its exit code (never `| tail`). Run the long ones on a frozen copy of
   the commit, so work in the main folder goes on during the 20 minutes: `git worktree add --detach
   ~/.anzuelo-frozen/<commit> <commit>`, then `node tools/hooks/wire.mjs` in it, then run there. Not in a temp folder
   (the link tests refuse one) and not without wire.mjs (the generated hook settings are not in git): each cost a
   failed run. A new worktree has no `.cache/`: create it before sending any output there (2026-11-06: every step's
   redirect failed and the chain did not run). Copy its `tools/hooks/engine-proof.json` back only when no engine file changed since that
   commit, and remove the copy afterwards (`git worktree remove <dir>`).
2. **Run the round on a frozen copy.** `node tools/starter/trials/run.mjs --round <name> --freeze` (names go up:
   v9, v10, ...). Eight standard projects, four at a time: code in three languages, a Spanish-speaking user, letters,
   spreadsheets, a notes vault, a manuscript (`run.mjs --list` marks them). The frozen copy is this commit, so
   fixes made while it runs never reach it. Records: `.cache/trials/results-<name>/`.
3. **Judge blind.** `node tools/starter/trials/judge.mjs <name>` writes four prompts, two projects each, to
   `.cache/trials/judge/`. Run each with its own sub-agent that has not seen the engine work, in parallel. The prompt
   is the same every round; never soften it for a round. Each judge writes `<name>-<k>.json`.
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
   and one line counting the skills' findings.
5. **Feedback to fixes.** Read every high and medium finding (and lows that repeat across projects). For each one the
   starter caused or could prevent: confirm it in the transcript first, fix the cause in the engine (not the
   symptom), add a self-test that fails without the fix, and add a line to `tools/starter/STARTER-CHANGELOG.md`.
   A finding that is the model's own slip, with nothing the starter could do, is noted as such, not "fixed".
6. **Green again, then commit.** Step 1's chain passes; commit the fix, then the engine proof
   (`tools/hooks/engine-proof.json`, subject "Engine proof") and `rounds.json`, with the user as the only author.
   Push only with the user's OK in this session.
7. **Loop.** Start the next round on the fixed engine (step 2). Stop when a round is NOT WORSE against both the
   baseline and the previous round and has no high finding and no new medium finding the starter could prevent; or
   when the usage limit stops it, then say so and resume after the reset.

## A testing session with a time budget ("test it for 5 hours")

When the user gives a time budget for testing, it is one session of steps 1 to 7, run back to back:
1. Write the start and end time in `tools/starter/STATUS.md`, so a later session knows when the budget ends.
2. Each round is the standard eight plus the drift probes (`np-reading-rule`, `np-garden-parts`, `np-meals-upset`):
   `node tools/starter/trials/run.mjs --round <name> --freeze <the ids>`. The drift probes check what the standard
   set does not: a rule or a fact the user gave earlier still holds turns later, every part of a several-part request
   is done and truly reported, a change reaches every file that depends on it, and the project's notes are used.
   Their judges (groups i and j in `judge.mjs`) say what to check in each.
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
      claims need a compare.mjs run this turn)
- [ ] No engine file changed since the last judged round, or the next round is running (hook: audit sweep "improvement
      loop is current")
- [ ] Every high and medium finding of the last round is fixed with a test or noted as the model's own slip (judgment)
- [ ] A testing session with a time budget ran rounds until its end time or a clean round, and the answer lists rounds, verdicts, fixes and what is open (judgment: the budget and the rounds differ each time)

## Pitfalls

- Code edits use the Edit tool, or a Node string-replace script written with the Write tool for bulk edits. Never use
  sed, echo, a heredoc or `node -e` with regexes or backslashes in them: the shell eats the escapes, and the edit fails
  or changes the wrong text. This went wrong at least six times in one session.
- Judge counts swing by about 3 mediums between rounds from judge noise alone: compare highs, failed turns, setup
  minutes and blocked turns first.
- Count Stop blocks from the trial records, not the judges: early judges did not count them.
- Engine text is paid on every turn: before adding a hint, notice or Stop line, see whether a shorter one, one per
  session, or none would do. A denial the engine could fix itself (the host's updatedInput) should be fixed in place.
- The account's usage limit voids a trial: `run.mjs` stops the project and the round at the first turn the limit
  answers (exit 3, `"void"` in the record), and `compare.mjs` and `judge.mjs` skip void records. Rerun the void
  projects under a new round name after the reset; never judge them.
- A round's projects live in the temp folder (`anzuelo-new/<id>-<round>`); a name used once cannot be reused.
- Never edit the frozen copy, and never judge a round with an agent that wrote its fixes.
- Nothing heavy runs beside a round: no full chain here and no project upgrade (their `selfcheck --full`). Load
  stretches each setup self-test past 5 minutes, the prompt cache expires during the wait, and the context is written
  again: rounds v28 and v28q read WORSE on setup time and cost (150k to 205k extra cache tokens per setup) from load
  alone. Fixes made during a round wait to be tested until it ends; hand upgrades out after it.
