---
name: project-rule
description: Turns a standing instruction, a complaint, or praise for something to repeat into an enforced project rule - AGENTS.md / CLAUDE.md, a dated user-requirements row, a check in tools/hooks/requirements.json, a test, a memory note, and the audit. Use whenever the user says always, never, remember to always, from now on, going forward, make it a rule, update the project, "I shouldn't have to tell you", "keep doing this", or complains that something was missed or done wrong.
runbook: docs/playbooks/project.md
---
# Make a rule stick

A rule that only lives in the docs gets forgotten. The docs state it and a hook checks it.

## Steps
1. **Capture.** Write what the user asked as a principle in your own words, with today's date and why it matters.
   Never paste their message, examples, names or private details (hook: no-verbatim-examples). Restate it as one
   testable rule: "When X, always Y" or "Never Z". For a complaint, also write what went wrong and which step was
   missing or vague. For praise, write exactly what worked.
2. **Fix the miss first** if there is one: redo the work by its runbook.
3. **Check for conflicts** with AGENTS.md, the runbooks and `docs/BRIEF.md`. If the new rule conflicts with an old one,
   ask which wins. Write the user's actual point, not a stricter rule.
4. **Write it down.**
   - AGENTS.md / CLAUDE.md: a hard rule if it applies everywhere, otherwise a line under "standing preferences", with
     the principle, why it matters, and the date. The twin syncs automatically.
   - The runbooks or skills it affects: a step and/or a "Pitfalls" line. A miss while following one always gets its
     lesson written there (REQ: skill-learn). In an engine skill, use a "## Project lessons" section at the end: upgrades
     keep it.
   - `docs/checks/user-requirements.md`: number / date / what was asked (as a principle) / rule / REQ tag.
   - `docs/checks/rule-enforcement.md`: a row, or the tag added to an existing row.
   - A memory note in the agent's memory folder for this project (the Stop hook prints the path): the rule, **Why:**,
     **How to apply:**, and a line in its index.
5. **Enforce it** with an entry in `tools/hooks/requirements.json`:
   ```json
   { "tag": "kebab-tag", "rule": "N", "when": { ... }, "require": { ... }, "message": "What to do to satisfy it." }
   ```
   Conditions for `when` and `require`:
   - promptMatches / promptNotMatches, answerMatches / answerNotMatches (regex)
   - minToolCalls, workTurn
   - filesChanged / allFilesChanged (globs)
   - toolRan, toolUsed, resultMatches, fileRead
   - toolPassed `{ "cmd", "pass", "selfRun" }`: a validator ran AND passed
   - runEach `{ "files", "cmd" }`: the hook re-runs a validator on each changed file (`{file}` in cmd)
   - playbookRouted / playbookUsed / skillUsed

   Rules that block an action belong in `tools/hooks/config.json`: `forbiddenCommands`, `codeRules`, `commitGate`,
   `protectedOriginals`, `noOverwrite`, `writeOnlyVia`, `protectedBranches`. Logic beyond these goes into
   `coreChecks()` or `pretoolDecision()` in `tools/hooks/hooks.mjs`, with a `// REQ: <tag>` comment. Pure judgment:
   write "hook: N/A <reason>" in the answer and mark the row `doc`. Keep `when` specific: a check that fires on
   unrelated turns teaches everyone to waive it.
6. **Prove it.** Add scenarios to `tools/hooks/project-scenarios.mjs` (upgrades keep it; in the starter itself: `tools/hooks/selfcheck.mjs`): skipped → blocked with the tag, and a realistic good sample → passes (`expect: { not: ['<tag>'] }`; for a no-overwrite guard, a plain request to change an existing guarded file, `deny: false`) (hook: check-sampled).
   Run `node tools/hooks/selfcheck.mjs --tags <the new tag>`, then `node tools/audit.mjs`. Both must PASS.
   A check script or test is also run on real samples (hook: check-proven): it fails on the real bad case (what the
   user complained about, or its earlier version: `git show HEAD:<file>`) and passes on at least 2 realistic good
   samples, one a valid edge case of the project (a word the user's language shares with a banned list, a legitimate
   text that must use a flagged term). Say it on one line: `Proven: fails on <bad>; passes on <good 1>, <good 2>`.
   A check that bans words is the last resort: test the result itself where you can.
7. **Report** the rule in one line, where it lives, and how it is enforced (or why it can't be), with a Finished
   section and a CHANGELOG line.
