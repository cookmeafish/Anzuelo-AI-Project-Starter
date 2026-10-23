# Improvement loop (starter only)

How the starter proves a change makes new projects better and never worse: real new projects, real headless agent
sessions, blind judges, a verdict against the history, then fixes and another round, until a round finds nothing
worth fixing. New projects never get this file or `tools/starter/trials/`.

Trigger: any engine change meant to make projects better, a field report from a real project, or "test that it only
improves". Each round costs about an hour of wall time and a fair share of the account's usage: rounds and judges
stop at the usage limit, so check that a headless session runs (`claude -p "ok"`) before starting one.

## Steps

1. **Green first.** Everything committed; `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs` and
   `node tools/audit.mjs` pass, each gated on its exit code (never `| tail`).
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
   per turn. The judges also report waste with no benefit as area "efficiency", counted on its own.
5. **Feedback to fixes.** Read every high and medium finding (and lows that repeat across projects). For each one the
   starter caused or could prevent: confirm it in the transcript first, fix the cause in the engine (not the
   symptom), add a self-test that fails without the fix, and add a line to `tools/starter/STARTER-CHANGELOG.md`.
   A finding that is the model's own slip, with nothing the starter could do, is noted as such, not "fixed".
6. **Green again, then push.** Step 1's chain passes; commit the engine proof (`tools/hooks/engine-proof.json`) and
   `rounds.json`; push with the user as the only author.
7. **Loop.** Start the next round on the fixed engine (step 2). Stop when a round is NOT WORSE against both the
   baseline and the previous round and has no high finding and no new medium finding the starter could prevent; or
   when the usage limit stops it, then say so and resume after the reset.

## Done when

- [ ] The last round's verdict is NOT WORSE in `tools/starter/trials/rounds.json` (hook: claim-checked, improvement
      claims need a compare.mjs run this turn)
- [ ] No engine file changed since the last judged round, or the next round is running (hook: audit sweep "improvement
      loop is current")
- [ ] Every high and medium finding of the last round is fixed with a test or noted as the model's own slip (judgment)

## Pitfalls

- Judge counts swing by about 3 mediums between rounds from judge noise alone: compare highs, failed turns, setup
  minutes and blocked turns first.
- Count Stop blocks from the trial records, not the judges: early judges did not count them.
- Engine text is paid on every turn: before adding a hint, notice or Stop line, see whether a shorter one, one per
  session, or none would do. A denial the engine could fix itself (the host's updatedInput) should be fixed in place.
- A round's projects live in the temp folder (`anzuelo-new/<id>-<round>`); a name used once cannot be reused.
- Never edit the frozen copy, and never judge a round with an agent that wrote its fixes.
