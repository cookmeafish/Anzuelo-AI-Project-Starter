# Running a plan

How to carry out a plan written with the plan skill, in either of the two ways offered at hand-off. The task's own
runbook (feature, bugfix, research...) still applies to the work inside each task.

## Before task 1 (both ways)
1. **Read the plan once, and the spec it names.** The spec is the authority; the plan is the argument for how to meet
   it. Where they disagree, the spec wins. If the spec can't be found, add a dated note to the plan saying so, and
   treat your own decisions as provisional.
2. **Find your place.** Run `node skills/plan/scripts/plan-tasks.mjs next <plan>` (or `status` for the whole list).
   Ticked steps are done, even if you don't remember doing them (after a break, a context reset or a hand-over). Trust
   the ticks, the dated notes and the version history over your memory. Never redo a finished task. A plan whose
   status line says `done` or `dropped` is closed: don't resume it without the user's OK.
3. **Fill gaps in the context.** Open the files and pages the plan's "Context" names. If a step needs something the
   plan doesn't say and the project can answer it, look it up, then add a line to "Context" so the next reader has it.
4. **Check the seams.** For each task that uses something an earlier task provides, compare the two "Uses / provides"
   lines: same names, same types, same files. Also check that each task agrees with itself (do its tests fit its code,
   and does it change only files that exist by then). Settle each mismatch now, by the spec, and write the decision
   as a dated note in the plan.

## Decide, don't stall
Once the user has approved the plan and the way to run it, keep going from task to task without asking "shall I
continue?". When the plan is unclear or wrong, make the call yourself and record it in the plan:
`YYYY-MM-DD Ruling (task N): <what you decided> - <why> - <cost if wrong>`. This is the one format for decisions in
a plan; the orchestrate skill uses it too.

Stop and ask only for:
- something destructive or impossible to undo;
- something with security impact;
- an outward action that needs the user's OK (AGENTS.md rule 6: publishing, pushing, sending, buying);
- a plan so broken that every way forward is a guess.

## Each task
1. **Read the task's own text,** even if you remember it. Memory keeps a summary; the plan keeps the exact values.
   `node skills/plan/scripts/plan-tasks.mjs task <plan> <N>` prints it with the constraints.
2. **Work the steps in order.** Write the test, run it, and watch it fail. A test that passes before the code exists
   is testing the wrong thing.
3. **Compare every run with the expected result** in the step:
   - same as expected: go on to the following step;
   - a bug in the code: use the debug skill. Never bend the code only so the output looks right;
   - a fault in the plan (it conflicts with the spec, two tasks disagree on an interface, a command can't work):
     make the smallest change that meets the spec and add a dated decision note.
4. **Run the cheap checks early.** The style or type check from "Checks for this project" runs after each file you
   change, the task's tests after its last step. A failure gets fixed and the check run again until it passes; never
   skip a check because the change "should work".
5. **A task is finished** only when every test it names ran in this session and you read the output, every expected
   result was compared with a real one, the task's last full test run passed, and every change from the plan has a
   decision note. Then tick its boxes.

Keep long command output out of your context: write it to a file and read the end. Update the plan in the same step
as the work it records, not in a batch later.

## Supervised: one sub-agent per task
You coordinate; sub-agents build and review. Run tasks one at a time unless they share nothing (then the
parallel-agents skill applies). Never let two builders edit the same files at once.

**The builder's brief** (in addition to the parallel-agents brief rules):
- one line on where the task fits in the whole;
- the task text itself, from `plan-tasks.mjs task`, as its requirements: not the whole plan, and not a summary of
  earlier tasks;
- names and decisions from earlier tasks that the task text can't know, and how you settled any unclear point;
- a report file to write, and a short reply: status (done / done with concerns / needs information / blocked),
  changes, a one-line test result, concerns;
- ask questions before starting rather than guessing; stop and say so when the task needs a design choice the plan
  didn't make;
- before reporting, read its own changes once: everything asked for, nothing extra, names that say what things do,
  tests that check real behavior, clean test output;
- no sub-agents of its own, and no reviewers of its own. Review comes from you.

**Small edits of the same kind** across several tasks (one constant changed in many files) go to one builder as a
single list, reviewed as one change.

**The reviewer's brief:** the task text, the builder's report, the constraints copied word for word, and the change
as one file (for git: the commit list, a per-file summary and the full diff with ten lines of context for the task's
range). Record where the task started before the builder begins, so the range covers every commit of the task. Ask
for two verdicts:
- **Matches the task:** anything missing, anything extra, anything misunderstood.
- **Well built:** clear structure, error handling, no duplicated logic, tests that test behavior.

The reviewer treats the report as claims to check, not as facts, and doesn't rerun the whole suite. It may list
points it couldn't judge from the change alone; settle each of those yourself. Never tell a reviewer what not to
flag. If you think a finding will be wrong, let it be raised and decide then.

**Fix rounds:** important findings go back to the same builder with the findings word for word. After each fix, a
review of only the fix. At most 5 rounds per task; from round 4, use a fresh builder on a stronger model, told what
was already tried. After round 5, decide each open finding yourself: wrong, or real but nothing depends on it (note it
and move on), or real and later tasks depend on it (make the smallest change that unblocks them, and note it).
Small findings never start a round; list them in the plan as deferred.

**Models:** the cheapest model that can do the job for mechanical tasks, a standard one for tasks that need judgment
across files, the strongest one for design work and the final review. Name the model each time, or every sub-agent
runs on the most expensive default.

## Straight through: you do every task
Same rules for each task as above. Your own tests are the check after each task; the review at the end is the second
pair of eyes.

## The final review (both ways)
1. Give a fresh reviewer, on the strongest model available, the whole change, the plan, the spec, the plan's
   "Watch for" list (to check each case on purpose) and the decision notes (to weigh your calls). With no sub-agent
   available, do the review yourself as a separate pass, and say in the answer that it was a self-review.
2. Grade each finding by what a person using the result would get if it shipped, not by whether the spec mentions the
   case.
3. Fix the serious ones in one pass. Each fix gets a test that fails first, then passes, then the whole suite runs
   again. A finding you decide not to fix gets a decision note.
4. Small findings go to a "deferred" list in the answer for the user to decide on.

## Without check-ins
The plan skill's step 9 in detail. It applies when `"autonomy": "auto"` is set, or the user has said to keep going
without asking. Nobody is watching each step, so the plan file and the checks have to do the watching.

**Why each rule exists**
- *Same start every session.* A new session has no memory of the last one. Reading the status line and the notes,
  then running the checks, shows the real state before anything is built on top of it. If a check fails at the start,
  the last session left something broken; fix that first, or every result after it is in doubt.
- *Tick only after a matching run.* A ticked box tells the next session "never redo this". A box ticked on hope sends
  the next session past a hole.
- *Never move the goalposts.* Loosening a test, skipping a check or rewriting an expected result turns a failure into
  a false pass. A plan that is truly wrong gets a dated note next to the old text, so the user sees both.
- *Rulings in writing.* The user reads them afterwards to learn what was chosen for them, and to undo a bad call.
- *Stop after 3 failures, or a session with no box ticked.* Past that point, retries mostly burn time and money. A
  blocked plan with clear options costs the user a minute to unblock.

**A ruling**
```
2026-10-18 Ruling (task 3): kept dates as UTC strings - the spec shows UTC in every example - if local time was
meant, the display and two tests change.
```

**A blocked plan**
```
status: blocked - the payment sandbox rejects every test card since 2026-10-18
...
2026-10-18 Tried: three test cards from the provider's docs, a fresh sandbox key, and the request copied from their
example. Each returns "card declined".
2026-10-18 Options: (1) recommended: the user checks the sandbox account, likely a setting; (2) mock the provider in
tests and come back to it; (3) drop card payments from this plan.
```
Then move to the next task that doesn't need the blocked one. When nothing independent is left, end the session with
a report: what was ticked, what is blocked and why, the options, and every ruling so far.

**Unblocking.** The user picks an option, or fixes the cause. Set the status line back to `status: open`, add a dated
note with the choice, and resume with `plan-tasks.mjs next <plan>`.

**Counting failures.** A failure is a run of the task's check that does not match the expected result after you
changed something to fix it. Three in a row on the same task means blocked. Running the same command again without a
change is not a new attempt.

## Stopping partway, or handing over
The plan file is the hand-over. Before you stop (end of session, a limit reached, the user switching to another AI
agent):
1. Tick every box that is truly finished, and only those.
2. Add a dated note for anything half done: what exists, what is missing, and the next command to run.
3. Leave the status line at `status: open`. The next session's start hook lists the plan as OPEN, and any agent can
   continue with `plan-tasks.mjs next <plan>` or, without Node, by reading down to the first unticked box.
4. Add a line under "Now" in `docs/STATUS.md` linking the plan (session-handoff skill).

## Closing the plan
1. Run every command under "Checks for this project" and read the output. All pass.
2. Re-read the plan's "Done when" and the spec, and confirm each item against the real result.
3. Change the status line to `status: done`. A plan given up for good gets `status: dropped - <why>` instead, with
   unticked boxes left as they are. Either line stops the hooks reporting it.
4. Move it out of "Now" in `docs/STATUS.md` and add the CHANGELOG line.

## Finish
In the answer, list every decision you made on the user's behalf (the plan's `Ruling:` lines), with the cost of
each if it was the wrong call, plus all deferred findings. That list is how the user learns what you chose for them.
Report the result in three lines: tasks done (N of N), checks run with their results, and the plan's status line.
