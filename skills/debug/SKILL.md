---
name: debug
description: Finds the root cause of a bug, failing test, broken build, wrong output or unexpected behavior before any fix, in four phases (investigate, compare, test one hypothesis, fix at the source with a failing test first), and stops to rethink the design after 3 failed fixes. Use for any technical problem, especially under time pressure, when a quick fix looks obvious, or when an earlier fix didn't work.
triggers: debug, debugging, root cause, failing test, tests fail, test failure, build fails, build failed, stack trace, exception, flaky, keeps failing, why does it fail, why is it failing
---
# Debug: root cause first

**No fix without a root cause.** A fix for the symptom hides the bug, and the next one shows up somewhere else. This
process is faster than guessing, even for simple bugs and in a hurry, because guessing means doing it twice. Until
Phase 1 is done, don't propose a fix at all. Following the "spirit" of the steps while skipping one is skipping it.

Use it for any technical problem: failing tests, bugs, wrong output, slowness, build or install failures, broken hooks
or scripts, two parts that don't work together. Finish each phase before starting the next.

**Most needed when it feels least needed:** a deadline, a fix that looks obvious, someone senior or in charge asking
for a fix right now, a problem you don't fully understand, or a fix that already failed once. Simple bugs have root
causes too, and the process is short for them.

**Live users hurt right now?** Stop the harm first (the **incident-response** skill when enabled, or a rollback with
the user's OK), then come back here. The mitigation is never the fix.

## Phase 1: Investigate
1. **Read the error completely.** The whole message and stack trace, with the line numbers, paths and codes. Warnings
   too. The answer is often written there. When the user reports it, ask for the exact text pasted, not retold.
2. **Reproduce it reliably.** Write down the exact steps. If it doesn't happen every time, gather more data. Don't
   guess.
3. **Pin down when and where:** when it started, and what is affected (every user or some, every input or certain
   ones, one environment or all). Works in one place but not another: list every difference between the two
   (versions, config, data, traffic, permissions).
4. **Check what changed** around that start time: the diff, recent commits and merges that touched the failing path,
   new dependencies, config, environment, and how this machine differs from one where it works. If log, metrics or
   error-tracking tools are connected, read them from just before the start.
5. **Find where it breaks** when several parts are involved (UI → API → database, build → package → install): log
   what goes into and out of each boundary, and whether each setting and environment value actually arrives there.
   Run once, see which boundary has bad data, then look only there ([references.md](references.md), boundary
   logging).
6. **Trace the bad value back** to where it started ([references.md](references.md), root-cause tracing). Fix at the
   source, not where it surfaced. A stray file or changed state that appears during a test run: find the test that
   causes it with `node skills/debug/scripts/find-polluter.mjs`.

Leave Phase 1 when you can say what goes wrong and why, with evidence.

## Phase 2: Compare
1. Find similar code in the project that works.
2. When following a pattern or a reference, read all of it, not a skim. A pattern you only half read gets applied
   wrongly.
3. List every difference between working and broken, however small. Don't rule anything out as "can't matter".
4. Note what it depends on: other parts, settings, config, environment, and the assumptions it makes.

Leave Phase 2 with the list of differences.

## Phase 3: One hypothesis at a time
1. Write it down: "I think X is the cause because Y." Be specific.
2. Test it with the smallest possible change, one variable at a time.
3. It held: go to Phase 4. It didn't: form a new hypothesis. Never stack another fix on top.
4. If you don't understand something, say so plainly. Read more, or ask the user. Don't pretend.

## Phase 4: Fix
1. **A failing test first:** the smallest reproduction, automated if possible, a one-off script if not. It must fail
   before the fix, for the reason you expect.
2. **One fix, at the root cause.** No "while I'm here" changes and no bundled refactoring.
3. **Verify:** the new test passes, every other test still passes, and the original problem is gone in the real app
   (app projects: `docs/checks/qa-standards.md`).
4. **Make it impossible, not just fixed:** where bad data caused it, add checks at the layers it passes through
   ([references.md](references.md), defense in depth). Flaky timing in tests: wait for the condition, not a fixed
   delay ([references.md](references.md), waiting on a condition).
5. **The fix didn't work?** Stop and count. Fewer than 3 attempts: back to Phase 1 with what you learned. **3 or more:
   stop fixing.** See below.

State the root cause in the answer: `Root cause: <what and why>`, then the fix and how it was verified.

## After 3 failed fixes: question the design
Signs that the design is wrong, not the latest hypothesis:
- each fix uncovers new shared state, coupling or a new problem in another place;
- each fix creates a new symptom somewhere else;
- the next fix would need a large restructuring to work at all.

Then ask: is this approach sound at all, or are we keeping it out of habit? Would changing the design cost less than
more patches? Explain it to the user and agree on the way forward before a fourth attempt.

## Stop and go back to Phase 1 when you catch yourself:
- planning a "quick fix for now, investigate later";
- trying a change "to see if it works", or several changes at once;
- skipping the test to "check by hand";
- saying "it's probably X" without evidence, or listing fixes before tracing the data;
- trying something you admit you don't fully understand, hoping it works;
- applying a reference pattern "my own way" without having read all of it;
- about to make one more attempt after 2 failed ones.

The user's reactions are signals too:
| The user... | It means |
|---|---|
| asks whether something actually happened | you assumed it instead of checking |
| asks whether a step would have shown the problem | you should have gathered evidence first |
| tells you to stop guessing | you are fixing without understanding |
| asks you to think harder about it | question the basics, not just the symptom |
| sounds stuck or frustrated | the approach isn't working |

## Excuses and answers
| The thought | Why it is wrong |
|---|---|
| "Too simple to need the process." | Simple bugs have causes too, and the process is quick for them. |
| "No time, it's urgent." | Guessing and re-guessing takes longer than finding the cause once. |
| "I'll try this one thing, then investigate." | The first change sets the habit for the rest. Start right. |
| "I'll add the test once the fix works." | A fix that was never seen failing proves nothing. |
| "Several changes at once saves time." | You can't tell which one worked, and the others add new bugs. |
| "The reference is long, I'll adapt the idea." | Half-understood patterns produce bugs. Read all of it. |
| "I can see the problem." | You can see a symptom. The cause is still to be found. |
| "An expert says the fix is obvious." | Experience suggests where to look. It isn't evidence. Check it the same way. |
| "Just one more try." (after 2 failures) | Three failures point at the design. Stop and rethink. |

## When there really is no code cause
If careful investigation shows the cause is outside (timing, the environment, another service): write down what you
checked, add sensible handling (a retry, a timeout, a clear error message), and add logging for next time. Most "no
root cause" findings are unfinished investigations, so be sure before landing here.

## Done when
- [ ] The answer states `Root cause: <what and why>`, with the evidence that shows it (hook: debug-root-cause).
- [ ] A test that failed before the fix now passes, and the rest of the suite still passes (hook: debug-test-added sees a test change with the code; judgment: that it failed before the fix).
- [ ] The original problem is gone where it was seen (the real app, the build, the script) (judgment: where the problem showed differs per bug).
- [ ] Layers that let bad data through now reject it, or the answer says why that wasn't needed (judgment: which layers matter depends on the data flow).
- [ ] Also unasked: a test or build that failed this turn and was then fixed has its root cause stated (hook: debug-trigger).

## Pitfalls
- Fixing where the error surfaced because the true source is several calls away.
- A test that fails for a different reason than the bug, so it "passes" after an unrelated change.
- Adding a longer delay to a flaky test instead of waiting for the real condition.
- Debug logging that hides in a quiet logger: write it to stderr so it shows.

## Scripts
- `node skills/debug/scripts/find-polluter.mjs`: runs your test command once per test file and reports the first file
  that leaves a given file or folder behind. Never deletes anything. Its options are listed at the top of the file.

Inspired by "systematic-debugging" in obra/superpowers (MIT, see LICENSE and [SOURCE.md](SOURCE.md)), with a few
steps from the debug skill of anthropics/knowledge-work-plugins (Apache-2.0, see LICENSE-engineering-plugin).
