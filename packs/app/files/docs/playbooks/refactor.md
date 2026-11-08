---
name: refactor
summary: Clean up code without changing what it does - name the measure, tests green before, small steps with the tests after each, the same results and a better number after
triggers: refactor, restructure, clean up the code, tidy up the code, simplify the code, make the code cleaner, remove duplication, duplicated code, rename the function, rename the variable, rename across the codebase, extract a function, tech debt, technical debt, code smell
trigger_regex:
menu:
---
# Playbook: refactor (no behaviour change)

**Use when:** the code should get easier to read or change while doing exactly what it does now. **Not when:** the
behaviour should change (`feature.md`), something is broken (`bugfix.md`), it should get faster (`perf.md`), stored
data changes shape (`data-change.md`), or only the look changes (`gui.md`, gui pack). No spec, release notes or
version bump: users see nothing.

## Steps
0. **Checkpoint first,** so every step can be undone: `git branch backup/<yyyymmdd-hhmm>`, and with uncommitted work
   also `git stash push -u -m "checkpoint <stamp>"` then `git stash apply --index` (the work stays, staged parts
   stay staged, the stash keeps a copy). Then `git add -A`, and again after each green step, so the index is the last
   green state (say so in the answer). Undo a red step: `git restore <file>` (restores from the index, so only that
   step goes). Undo all: `git stash push -u -m "discarded attempt <stamp>"` (keeps the attempt), then, if a
   checkpoint stash was made, `git stash apply --index stash@{1}` (check `git stash list` first). Never
   `git restore .` or `reset --hard` for this. No git: copy the files you will touch into `.cache/backups/<stamp>/`
   first.
1. **Name the measure and the boundary:** what gets better, as a number you can count now (lines in the file,
   duplicate blocks, function length, files over the modular-code limits of 400 lines a file or 60 a function), and what must not change (the public
   interface, outputs, stored data). Write both in one line each in the answer.
2. **Tests green first:** run the whole suite (the test command from `docs/foundation.md`, the package file or the
   README) and note the result (`Before: <n> passed`). Where the code to change has
   no tests, add characterization tests that pin what it does today (`write-tests.md`), even if today's output looks
   odd. A suite that is red before you start: stop and report it (`bugfix.md`), do not refactor on red.
3. **Change in small steps,** one move at a time (rename, extract, move, inline, delete dead code), and run the tests
   after each. A step that turns a test red is undone, not patched. For a file that grew too big, follow
   **modular-code** section C (old entry point re-exports until every caller moved).
4. **Renames and moved interfaces:** search every caller (`git grep -n "<old name>"`) and update them all in the same
   change, including docs, configs and string references.
5. **No behaviour change mixed in.** Anything found wrong along the way is listed in the answer as a separate task, not
   fixed here (`docs/checks/app-standards.md`: no drive-by changes).
6. **Compare:** run the same suite again (`After: <n> passed`, the same tests as before plus any characterization
   tests) and count the measure from step 1 again, written as `Measure: <before> to <after>`.

## Done when
- [ ] The same test suite ran and passed before and after, both results in the answer (ran: npm test|npm run test|npx jest|npx vitest|pytest|go test|cargo test|node --test|dotnet test|yarn test|pnpm test|make test) (answer: Before:[\s\S]*After:).
- [ ] The measure from step 1 is shown as a number before and after (answer: Measure: \d+ to \d+).
- [ ] A checkpoint existed before the first edit (ran: git branch backup/|git stash push|\.cache/backups/).
- [ ] No behaviour change: public interfaces unchanged, or each change listed with every caller updated (judgment: needs reading the diff; `git grep` for old names helps).
- [ ] No release notes or version bump claim a user-visible change (judgment: depends on what the diff touched).
- [ ] Problems found but not fixed are listed as separate tasks, or the answer says none (judgment: needs the review).
- [ ] The answer ends with a Finished section (hook: finished-summary).

## Pitfalls
- Refactoring code with no tests "carefully": nothing shows what broke. Pin it with characterization tests first.
- One big rewrite instead of small steps: when a test turns red, no one knows which move broke it.

Sources: https://martinfowler.com/bliki/DefinitionOfRefactoring.html,
https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic,
https://abseil.io/resources/swe-book/html/ch12.html
