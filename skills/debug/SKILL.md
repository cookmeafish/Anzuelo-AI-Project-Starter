---
name: debug
description: Finds the root cause of a bug, failing test, broken build, wrong output or unexpected behavior before any fix, in four phases (investigate, compare, test one hypothesis, fix at the source with a failing test first), and stops to rethink the design after 3 failed fixes. Use for any technical problem, especially under time pressure, when a quick fix looks obvious, or when an earlier fix didn't work.
triggers: debug, debugging, root cause, failing test, tests fail, test failure, build fails, build failed, stack trace, exception, flaky, keeps failing, why does it fail, why is it failing, tests are red, red tests, keeps breaking, works on my machine, figure out why, typeerror, depura, depurar, depuralo, causa raiz, causa raíz, por qué falla, por que falla, sigue fallando, falla la prueba, fallan las pruebas, las pruebas fallan, no compila, el build falla, traza de pila, excepción
---
# Debug: root cause first

**No fix without a root cause.** A symptom fix hides the bug and it comes back elsewhere. This is faster than
guessing, even for simple bugs and in a hurry. Propose no fix until Phase 1 is done. Skipping a step "in spirit" is
skipping it.

Use it for any technical problem: failing tests, bugs, wrong output, slowness, build or install failures, broken hooks
or scripts, parts that don't work together. Finish each phase before the next.

**Most needed when it feels least needed:** a deadline, an obvious-looking fix, someone senior wanting a fix now, a
problem you don't fully understand, or a fix that already failed once.

**Live users hurt right now?** Stop the harm first (the **incident-response** skill when enabled, or a rollback with
the user's OK), then come back here. The mitigation is never the fix.

## Phase 1: Investigate
0. **List everything wrong first**, as a checklist: every symptom the user reported, in every message of the
   conversation (also the ones typed while you worked), plus any you find. Each one is fixed and checked off before the
   answer says "fixed". Then write **the rule** the behavior must follow, and the table of every state or input kind it
   has to handle (empty, one, many, in progress, finished, interrupted, from another source). A state missing from the
   table is usually the bug.
1. **Read the error completely:** the whole message and stack trace, line numbers, paths, codes and warnings. The
   answer is often there. When the user reports it, ask for the exact text pasted, not retold.
2. **Reproduce it reliably.** Write down the exact steps. If it doesn't happen every time, gather more data; don't
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
2. When following a pattern or reference, read all of it. A half-read pattern gets applied wrongly.
3. List every difference between working and broken, however small. Rule nothing out as "can't matter".
4. Note what it depends on: other parts, settings, config, environment, and the assumptions it makes.

Leave Phase 2 with the list of differences.

## Phase 3: One hypothesis at a time
1. Write it down: "I think X is the cause because Y." Be specific. Before that, list every code path that ends in the
   reported symptom exactly ("the page just sat there": a slow request, a silent reject, a spam trap, a swallowed
   error) and rule each out by reading or trying it. A cause that only fits part of the symptom is not the cause.
   Until the cause is proven by a reproduction, the answer says "likely cause", not "fixed".
2. Test it with the smallest possible change, one variable at a time.
3. It held: go to Phase 4. It didn't: form a new hypothesis. Never stack another fix on top.
4. If you don't understand something, say so. Read more or ask the user.

## Phase 4: Fix
1. **A failing test first:** the smallest reproduction, automated if possible, a one-off script if not. It must fail
   before the fix, for the reason you expect.
2. **One fix, at the root cause, and the simplest one that removes it.** Change one thing in the right place rather
   than add layers or special cases. No "while I'm here" changes and no bundled refactoring.
3. **Verify:** the new test passes, every other test still passes, and the original problem is gone in the real app
   (app pack: `docs/checks/qa-standards.md`).
   - **Over all the real data, not the one case:** run the fixed code over every case there is (every line of the
     real log, every file, every state in the table from Phase 1) against facts read independently, and say in the
     answer what ran over what, how many were checked and how many were wrong. 0 wrong, or it isn't fixed. Sweep more
     than one data set when there are several.
   - **Nothing the user already had is broken:** list what the change touches that the user or other tools rely on
     (their settings, things another app installed, files they edit, outputs they open) and check each still works.
     Add to the user's setup, never replace it.
   - **The promised outcome:** check the "fixed when" from the Issue line exactly as the user would see it, and say
     in the answer what you ran or opened and what it showed.
4. **Make it impossible, not just fixed:** where bad data caused it, add checks at the layers it passes through
   ([references.md](references.md), defense in depth). Flaky timing in tests: wait for the condition, not a fixed
   delay ([references.md](references.md), waiting on a condition).
5. **The fix didn't work?** Stop and count. Fewer than 3 attempts: back to Phase 1 with what you learned. **3 or more:
   stop fixing.** See below.

State the root cause in the answer: `Root cause: <what and why>`, then the fix and how it was verified. A one-line
fix whose cause the error message names needs only Phases 1 and 4.

## After 3 failed fixes: question the design
Signs that the design is wrong, not the latest hypothesis:
- each fix uncovers new shared state, coupling or a new problem in another place;
- each fix creates a new symptom somewhere else;
- the next fix would need a large restructuring to work at all.

Then ask: is this approach sound at all, or are we keeping it out of habit? Would changing the design cost less than
more patches? Explain it to the user and agree on the way forward before a fourth attempt.

## Stop and go back to Phase 1 when you catch yourself:
(Excuses that lead here, and the answers to them: [references.md](references.md), "Excuses".)
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

## When there really is no code cause
If careful investigation shows the cause is outside (timing, the environment, another service): write down what you
checked, add handling (a retry, a timeout, a clear error message) and logging for next time. Most "no root cause"
findings are unfinished investigations, so be sure first.

## Done when
- [ ] Everything wrong is listed (every message), with the rule and the table of states, and each item is fixed (judgment: whether the list is complete needs a reader).
- [ ] The answer states `Root cause: <what and why>`, with the evidence that shows it (hook: debug-root-cause) (when ran: test|build|spec|jest|pytest|vitest) (answer: Root cause:).
- [ ] A test that failed before the fix now passes, and the rest of the suite still passes (hook: debug-test-added sees a test change with the code; judgment: that it failed before the fix).
- [ ] The original problem is gone where it was seen (the real app, the build, the script) (judgment: where the problem showed differs per bug).
- [ ] A sweep over all the real data shows 0 wrong, and the answer gives the count (judgment: the data differs per bug).
- [ ] Everything the change touches that the user already had still works, and nothing of theirs was replaced (judgment: what they rely on differs per project).
- [ ] When the user was upset: the "fixed when" outcome is checked, and the answer says how (hook: upset-acknowledged).
- [ ] Layers that let bad data through now reject it, or the answer says why that wasn't needed (judgment: which layers matter depends on the data flow).
- [ ] Also unasked: a test or build that failed this turn and was then fixed has its root cause stated (hook: debug-trigger).

## Pitfalls
- Fixing where the error surfaced because the true source is several calls away.
- Fixing the case the user showed (one screenshot, one input) and calling it fixed: the next moment breaks. The sweep
  over all the real data is what proves it.
- Replacing a setting or file the user already had (their own status bar, a config another app wrote) instead of
  adding to it.
- A test that fails for a different reason than the bug, so it "passes" after an unrelated change.
- Adding a longer delay to a flaky test instead of waiting for the real condition.
- Debug logging that hides in a quiet logger: write it to stderr so it shows.

## Scripts
- `node skills/debug/scripts/find-polluter.mjs`: runs your test command once per test file and reports the first file
  that leaves a given file or folder behind. Never deletes anything. Its options are listed at the top of the file.

Inspired by "systematic-debugging" in obra/superpowers (MIT, see LICENSE and [SOURCE.md](SOURCE.md)), with a few
steps from the debug skill of anthropics/knowledge-work-plugins (Apache-2.0, see LICENSE-engineering-plugin).
