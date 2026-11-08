---
name: project-rule
description: Turns a standing instruction, a complaint, or praise for something to repeat into an enforced project rule - AGENTS.md / CLAUDE.md, a dated user-requirements row, and enforcement at the cheapest level that holds (an existing test or check extended, a test in the project's suite, a guard, or a checkable line on its runbook's "Done when" list). Use whenever the user says always, never, remember to always, from now on, going forward, make it a rule, update the project, "I shouldn't have to tell you", "keep doing this", or complains that something was missed or done wrong.
runbook: docs/playbooks/project.md
---
# Make a rule stick

A rule that only lives in the docs gets forgotten: the docs state it and something checks it. Enforce it once, at the
cheapest level that holds; every extra file and run costs the user time now and context on every later turn.

## Steps
1. **Capture.** Restate the request as one testable principle in your own words, with today's date and why: "When X,
   always Y" or "Never Z". Never paste the user's message, examples, names or private details (hook:
   no-verbatim-examples). For a complaint, also note which step was missing; for praise, what worked.
2. **Fix the miss first** if there is one, by its runbook.
3. **Check for conflicts** with AGENTS.md, the runbooks and `docs/BRIEF.md`; if one conflicts, ask which wins. Write the
   user's actual point, not a stricter rule. Then **search every file** (docs, skills, scripts, help text, defaults,
   memory) for wording or behavior that still says the opposite: at least 3 Grep searches (the old behavior's words,
   its synonyms, the settings and flags behind it) over docs/, skills/, tools/ and memory. Fix each hit or keep it with
   a reason. Report "searched N terms, found M, fixed K". Never say the rule is already in place before this search.
4. **Decide how it is enforced** at the cheapest level that holds, first match wins:
   1. **An existing test or check already runs what the rule is about:** add the new case to it, and name it in the
      answer as `hook: <its tag>`. Nothing new to wire.
   2. **The project has a test suite its checks run** (the rule is about what its code or scripts produce): a
      regression test there.
   3. **It blocks an action:** a guard in `tools/hooks/config.json` (`forbiddenCommands`, `codeRules`, `commitGate`,
      `protectedOriginals`, `noOverwrite`, `newVersionOnly`, `writeOnlyVia`, `protectedBranches`).
   4. **Otherwise a "Done when" line** in the runbook of the task the rule is about (the end check reads it on every
      turn that runbook covers, and blocks until it is met). Give the line one marker; the grammar is in
      `docs/checks/runbook-standards.md` and runbook-create step 3: `(file: ...)`, `(ran: ...)`, `(answer: ...)`, with
      `(when ...)` when the rule fits only some turns. A regex may not contain `)`. Example:
      `- [ ] Each new chart names its data source (when file: charts/**) (answer: Source:)`. Never write a new check in
      `tools/hooks/requirements.json`: the end check does not run those (2026-11-07, the user chose the "Done when"
      lists, so the engine stays a reminder, quiet work and one end check).
   5. **Pure judgment:** `--enforced "N/A <reason>"`, and `hook: N/A <reason>` in the answer.
5. **Write it down in one command**, without opening those files:
   `node tools/hooks/hooks.mjs rule "<the principle>" --why "<why>" --enforced "<how>"` writes the AGENTS.md line
   (CLAUDE.md synced) and the dated `docs/checks/user-requirements.md` row. For a "Done when" line (4.4), pass
   `--enforced "<runbook> item <n>"`. A runbook or skill that was followed and missed it also gets the step fixed or a
   `## Pitfalls` line (engine skills: `## Project lessons`).
   **A name or word that must never appear** in the project (a client, a person, another project, the user's own
   examples): add `--forbid "<name>, <name>"`, and `--private` when the name itself is private (the list then lives
   outside the repository). Writing it is denied from then on, and the audit sweeps every file (REQ: forbidden-terms).
   The rule's own wording never names it: "never name the former client", not the client.
6. **Prove what you added**, once, in one command: `node tools/hooks/hooks.mjs prove "<the test or check command>"
   --edge "<an edge case from this project's own words>"`. It runs it on git's version before your fix (it must fail),
   then on the fix (it must pass) (hook: check-proven). A "Done when" line needs no prove run: its marker is the
   check. Test the result, not a word list, and describe the rule exactly as it is enforced: an exception you promise
   must be in the check. When the problem is not in the project's files (nothing to put back), prove it on a sample of
   the problem written to `.cache/` (it fails) and the real files (they pass).
7. **Report** the rule in one line: where it lives and how it is enforced (or why it can't be), with a Finished
   section and a CHANGELOG line.

## Done when
- [ ] The rule is in AGENTS.md and has a dated row in the requirements list (when ran: hooks.mjs rule) (file: docs/checks/user-requirements.md)
- [ ] The answer says what was searched and how many were found and fixed (answer: searched)
- [ ] The enforcement is named (answer: hook:|Done when|N/A)
- [ ] A new test or check was proved (when ran: hooks.mjs prove) (ran: hooks.mjs prove)

## Pitfalls
- Calling a rule "already enforced" before searching: the search later found files that said the opposite.
- Copying the user's wording or examples into the rule instead of the principle (AGENTS.md rule 14).
