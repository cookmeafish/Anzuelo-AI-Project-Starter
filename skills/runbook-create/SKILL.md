---
name: runbook-create
description: Creates a new runbook in docs/playbooks (or extends the closest one) plus the check that proves it was followed, so a new kind of task becomes a known procedure with its own generated skill and DIRECTORY.md row. Use when the hooks say NO RUNBOOK, runbook-exists or runbook-complete, when a task was done that no runbook covers, or when the user asks for a runbook, playbook, procedure or checklist.
runbook: docs/playbooks/project.md
---
# Create or extend a runbook

## 0. Look for an existing skill first
Follow the **skill-finder** skill: search the project's own skills and library (`node tools/skills.mjs library`), the
agent's installed skills, official repositories and marketplaces, and reputable community collections. A
downloaded skill is third-party code: read every file, check it doesn't drive the installed browser, phone home or
touch files outside the project, and install it only with the user's OK (`node tools/skills.mjs add <owner/repo>
<skill>`). Then make it ours: rewrite it in the project's style, keep its LICENSE, credit the source in SOURCE.md, and
add `Worth it: <gain> / <cost>` (REQ: worth-it). Never ship it unchanged.

Write the runbook around it (the runbook keeps the routing and "Done when"; its `skill:` points at the skill). Report
it in the answer: `Existing skills checked: <where you looked> - <what you found and used, or none fit>` (hook:
skill-reuse). A procedure only this project can have skips the search: put `reuse: none - project-specific: <why>`
in its frontmatter.

## 1. Extend or create?
Read `DIRECTORY.md` §1 and the frontmatter of every runbook in `docs/playbooks/`.
- **Extend** when the task is a variant of an existing one (same goal, different inputs). Add the new trigger phrases,
  a branch in the steps ("If <case>: ..."), and a Pitfalls line if a miss prompted it (REQ: skill-learn).
- **Create** when the goal, steps or "Done when" differ. Never leave two runbooks covering the same task.

## 2. Write the runbook
Copy `docs/playbooks/_TEMPLATE.md` to `docs/playbooks/<kebab-name>.md` (standards: `docs/checks/runbook-standards.md`).
- `triggers`: the phrases the user actually used (copy them from the conversation) plus 3 to 8 likely variants.
  Lowercase, comma-separated. Avoid single common words that would match everything.
- `## Steps`: the steps that worked in this conversation, in order, with exact files, tools and commands.
- `## Done when`: observable results.
- `## Pitfalls`: what went wrong or nearly did, dated.

## 3. Write its check (mandatory)
Add at least one entry to `tools/hooks/requirements.json` that tests a "Done when" item:
```json
{ "tag": "<name>-done", "rule": "2", "when": { "playbookUsed": "<name>", "toolRan": "<the command that makes the result>" },
  "require": { "filesChanged": ["<where the result lands>"] },
  "message": "What to do so this passes." }
```
Other evidence: `answerMatches` (a required answer section), `toolPassed` (a validator that must PASS; add `selfRun`),
`runEach` (the hook re-runs a validator on each changed file). Make `when` fire on the work itself, not on the
runbook being opened: a check that asks for a result file applies when the script that makes it ran (`toolRan`) or
its inputs changed (`filesChanged`), so a request that reuses a result already made (this week's summary exists), a
related request (an email about the summary) and the setup turn that writes the runbook pass without a waiver. Lesson:
a "summary saved" check on `playbookUsed` needed waivers in setup and on a partner email. If nothing can be checked, set
`checks: none - <reason>` in the runbook. Add test scenarios for the tag in `tools/hooks/project-scenarios.mjs` (upgrades keep it; in the starter itself: `tools/hooks/selfcheck.mjs`), one blocked and one realistic good sample that passes (hook: check-sampled), and a row in
`docs/checks/rule-enforcement.md`.

A validator script you write for the check is run on real samples before you rely on it: it fails on a real bad
case and passes on every existing file it governs (from the last commit) and on realistic good samples, one an edge
case made from the project's own words (names, addresses, headings, quoted text). Made-up junk alone proves
little: a check can fail every fixture and still pass the real miss, or block good work (hook: check-proven, when it
answers a complaint or a rule).

## 4. Route and verify
- The skill (`skills/<name>/SKILL.md`) and the `DIRECTORY.md` row are generated. Run `node tools/hooks/hooks.mjs sync`.
- Add a menu code in `docs/MENU.md` if the task will be common, and a precedence line in `DIRECTORY.md` if it overlaps
  another runbook.
- Test the routing: `node tools/hooks/selfcheck.mjs --route "<the user's original message>"` must show the runbook.
- Run `node tools/hooks/selfcheck.mjs --tags <its checks>` (only the scenarios for what changed; the Stop hook names the
  tags) and `node tools/audit.mjs`. Add a CHANGELOG line. Name the runbook in the answer.
