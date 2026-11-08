---
name: write-tests
summary: Add tests to code that already exists, or fix a flaky test - riskiest behaviour first, through the public interface, each test seen failing before it counts, flaky causes fixed instead of retried
triggers: write tests for, add tests, add unit tests, unit tests for, missing tests, increase coverage, improve test coverage, test coverage, flaky test, flaky tests, test is flaky, tests are flaky, test fails sometimes, tests fail randomly, characterization tests
trigger_regex:
menu:
---
# Playbook: write tests for existing code

**Use when:** existing code needs tests, or a test passes and fails on the same code (flaky). **Not when:** the tests
belong to new behaviour being built (`feature.md` step 3), to a bug being fixed (`bugfix.md`), the question is what to
test across the app (`qa.md` §4), or a test fails every time because the code is wrong (`bugfix.md`).

## Steps
0. **Checkpoint first,** so every change can be undone: `git branch backup/<yyyymmdd-hhmm>`, and with uncommitted
   work also `git stash push -u -m "checkpoint <stamp>"` then `git stash apply` (the work stays, the stash keeps a
   copy). Undo: `git restore <file>` for one file, or `git restore .` then `git stash apply` for all. No git: copy
   the files you will touch into `.cache/backups/<stamp>/` first. Find the test command in `docs/foundation.md`, the
   package file (`scripts.test` in package.json, pyproject.toml) or the README. No test framework at all: say so and
   ask before adding one.
1. **List the behaviours worth protecting,** riskiest first, in the `qa.md` §4 order (money, data, security, main
   flows, error handling). Read the existing tests first and skip what they already cover.
2. **Write each test through the public interface:** call what callers call and check the resulting state or output,
   not which private methods ran or in what order. One behaviour per test.
3. **Keep each test plain:** no loops or branching logic in the test, the inputs and the expected value written out,
   and a name that says the behaviour and its outcome (`rejects_empty_email`, not `test_validate_2`).
4. **Prove each test can fail:** break the code under test briefly (or flip the expected value), run the test, see it
   fail for the expected reason, then restore the code (`git restore <file>`). Note it as `Seen failing: <test> - <how it was broken>`. A test
   that never failed proves nothing.
5. **Flaky test:** run it in a loop (20 runs, or until it fails twice) to reproduce it, then find the cause with the
   debug skill: shared state between tests, timing, test order, real clock or network, random data. Fix the cause
   (isolate the state, wait on a condition, inject the clock, seed the randomness). Never add a retry, a sleep or a
   skip. Then run it the same number of times again and state the count.
6. **UI flows:** script the real page (`tools/screenshot.mjs --steps`, gui pack, or Playwright) instead of testing
   markup strings.
7. **Run the whole suite** after the last edit. Report coverage as a hint, never as the goal.

## Done when
- [ ] Each new test was seen failing against broken code before it passed, and the answer lists them (when file: **/*.test.*|**/*.spec.*|**/test_*.py|**/*_test.*|tests/**|__tests__/**) (answer: Seen failing:).
- [ ] The whole suite passes after the last edit (when file: **/*.test.*|**/*.spec.*|**/test_*.py|**/*_test.*|tests/**|__tests__/**) (ran: npm test|npm run test|npx jest|npx vitest|pytest|go test|cargo test|node --test|dotnet test|yarn test|pnpm test|make test).
- [ ] A checkpoint existed before the first edit (when file: **/*.test.*|**/*.spec.*|**/test_*.py|**/*_test.*|tests/**|__tests__/**) (ran: git branch backup/|git stash push|\.cache/backups/).
- [ ] Tests use only the public interface and hold no logic (judgment: needs reading the tests; a grep for private names helps).
- [ ] A flaky test passes N runs in a row after the fix, N stated, with no retry, sleep or skip added (when answer: flaky) (answer: \d+ runs in a row).
- [ ] The answer ends with a Finished section (hook: finished-summary).

## Pitfalls
- A test that mirrors the code line by line: it passes whatever the code does. Check outcomes a user would notice.
- "Fixed" a flaky test by adding a retry: the race is still there and now hidden.

Sources: https://survey.stackoverflow.co/2025/ai, https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic,
https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/SKILL.md,
https://abseil.io/resources/swe-book/html/ch12.html
