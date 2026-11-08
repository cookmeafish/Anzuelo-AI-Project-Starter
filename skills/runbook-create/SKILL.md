---
name: runbook-create
description: Creates a new runbook in docs/playbooks (or extends the closest one) plus the check that proves it was followed, so a new kind of task becomes a known procedure with its own generated skill and DIRECTORY.md row. Use when the hooks say NO RUNBOOK, runbook-exists or runbook-complete, when a task was done that no runbook covers, or when the user asks for a runbook, playbook, procedure or checklist.
runbook: docs/playbooks/project.md
---
# Create or extend a runbook

## 0. Look for an existing skill first
Follow the **skill-finder** skill, including its report line (hook: skill-reuse): `Existing skills checked: <where you
looked> - <what you found and used, or none fit>`. Write the runbook around the skill it finds (the runbook keeps the
routing and "Done when"; its `skill:` points at the skill). A procedure only this project can have skips the search:
put `reuse: none - project-specific: <why>` in its frontmatter.

## 1. Extend or create?
Read `DIRECTORY.md` §1 and the frontmatter of every runbook in `docs/playbooks/`.
- **Extend** when the task is a variant of an existing one (same goal, different inputs). Add the new trigger phrases,
  a branch in the steps ("If <case>: ..."), and a Pitfalls line if a miss prompted it (REQ: skill-learn).
- **Create** when the goal, steps or "Done when" differ. Never leave two runbooks covering the same task.

## 2. Write the runbook
Copy `docs/playbooks/_TEMPLATE.md` to `docs/playbooks/<kebab-name>.md` (standards: `docs/checks/runbook-standards.md`).
- `triggers`: the phrases the user actually used (copy them from the conversation) plus 3 to 8 likely variants. Only
  words whose meaning you checked (`docs/glossary.md`, the project's sources): a trigger built on a misread word routes
  the wrong job every time.
  Lowercase, comma-separated. After the sync in step 5, run `selfcheck.mjs --route` on three unrelated past requests;
  none may route to the new runbook.
- `## Steps`: the steps that worked in this conversation, in order, with exact files, tools and commands.
- `## Done when`: observable results. This list is the agent's checklist for the task: it is shown when the request
  arrives, the agent records each item as done or skipped, and the final check holds each record to its proof. So:
  one outcome per item, worded so a stranger could tell whether it happened; every item ends with its proof, a
  marker the end check tests (section 3), or `(judgment: <why no check can tell>)`, used sparingly; and every
  step whose result matters has an item. A missing item is work the final check never asks about; a wrong check
  name is an item that passes with no evidence (the audit names both).
- `## Pitfalls`: what went wrong or nearly did, dated.

## 3. Write its check (mandatory)
The check is a marker on at least one "Done when" item; the end check tests it on every turn this runbook covers and
blocks until it is met: `(file: <path or glob>)` the turn changed that file, `(ran: <regex>)` a command matching it
ran and passed (a validator script you write counts), `(answer: <regex>)` the final answer matches it. Make it fire on
the work itself, not on the runbook being opened: add `(when ran: <the command that makes the result>)` or
`(when file: <its inputs>)`, so a request that reuses a result already made, a related request and the setup turn that
writes the runbook pass. A regex may not contain `)`. Example:
`- [ ] The weekly summary is saved (when ran: make_summary) (file: reports/summary-*.md)`.
If nothing can be checked, set `checks: none - <reason>` in the runbook. Never add an entry to
`tools/hooks/requirements.json`: the end check does not run those (2026-11-07).

Run a validator script you write on real samples before you rely on it: it fails on a real bad case and passes on
every existing file it governs (from the last commit) and on realistic good samples, one an edge case made from the
project's own words (names, addresses, headings, quoted text). Made-up junk alone proves little (hook: check-proven,
when it answers a complaint or a rule). Its tests keep their samples in their own files (copied from the real ones)
and never read the project's live data, so a later turn that edits that data as asked doesn't break them.

## 4. Read it cold (mandatory for a new runbook or skill; before step 5, which then runs once)
The next agent has only the text. Give one helper agent, launched in the foreground, only the new file and the
request it is for (no conversation, no hints), and ask it for:
- every step it could not do exactly as written: a file, command or tool that is missing or unnamed, a word the
  project never defines, a choice the step leaves open ("pick a good one": by what measure?);
- every "Done when" item it could not tell how to prove;
- every step whose result has no "Done when" item.
Fix each gap in the file (or say in one line why it is not one) (hook: runbook-cold-read). A rewrite of most of a
runbook gets the same read. If no helper can be started, reread the file alone, list what you assumed, and say so in
the answer.

## 5. Route and verify
- The skill (`skills/<name>/SKILL.md`) and the `DIRECTORY.md` row are generated. Run `node tools/hooks/hooks.mjs sync`.
- Add a menu code in `docs/MENU.md` if the task will be common, and a precedence line in `DIRECTORY.md` if it overlaps
  another runbook.
- Test the routing: `node tools/hooks/selfcheck.mjs --route "<the user's original message>"` must show the runbook.
- Run `node tools/hooks/selfcheck.mjs --tags <its checks>` (only the scenarios for what changed; the Stop hook names the
  tags) and `node tools/audit.mjs`. Add a CHANGELOG line. Name the runbook in the answer.

## Done when
- [ ] The runbook is written (when file: docs/playbooks/*.md) (file: docs/playbooks/*.md)
- [ ] A new runbook or skill was read cold and each gap fixed (hook: runbook-cold-read).
- [ ] The sync ran, and the route test shows the runbook for the user's original message (when file: docs/playbooks/*.md) (ran: hooks.mjs sync)
- [ ] The audit passed after the last edit (when file: docs/playbooks/*.md) (ran: audit.mjs)
- [ ] The CHANGELOG has a line for it (when file: docs/playbooks/*.md) (file: docs/CHANGELOG.md)

## Pitfalls
- A check that fails every fixture yet passes the real miss, or blocks good work: test it on real samples (step 3).
- Steps the agent would do anyway, or a measure-less verb ("pick a good one"): name the measure or cut the step.
- A step whose result matters but has no "Done when" item: the end check never asks about it.
- A new "Done when" item inserted mid-list renumbers the rest, and notes and tests that cite items by number then
  point at the wrong one: add new items at the end (2026-11-07).

What makes a runbook good (exact, decided, complete, short, proven): `docs/checks/runbook-standards.md`.
