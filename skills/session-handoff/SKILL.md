---
name: session-handoff
description: Keeps docs/STATUS.md (Now / Next / Open questions / Blocked) and docs/CHANGELOG.md current so a brand-new session or another AI agent can continue the work cold, tracks the to-dos and commitments the user mentions, drafts a daily summary or standup update, keeps docs/glossary.md of the user's shorthand, and answers "where are we" questions. Use when substantial work ends, before stopping for the day, when the hooks ask for status-handoff, or when the user asks "where are we", "what's next for the project", "project status", "what's on my plate", "what am I waiting on", "add a to-do", "daily summary", "standup", "what does X mean", or menu code E5.
runbook: docs/playbooks/project.md
---
# Session handoff

Three files carry the work from one session, or one AI agent, to the next: `docs/STATUS.md` (where things stand),
`docs/CHANGELOG.md` (what changed) and the open plans in `docs/plans/` (multi-step work, box by box). Kept true and
short, they are all a new session needs.

## 1. Update `docs/STATUS.md`
Only the top 40 lines reach a new session. The hooks require an update after a work turn with 15+ tool calls (hook:
status-handoff).
```markdown
# Status
Updated: YYYY-MM-DD.
## Now
- What is in progress, and its state (1 to 5 bullets). Link the open plan, if there is one.
## Next
1. The next concrete actions, in order, each one startable without context. Add "for <who>" and "due YYYY-MM-DD"
   when known.
## Open questions
- Questions for the user, or unknowns blocking good answers.
## Blocked / waiting on the user
- What only someone else can do (decisions, files, logins, approvals), "since YYYY-MM-DD", and who can unblock it.
## Later
- Ideas and wishes with no date yet. This section sits last, below the 40 lines that are injected.
```
- Replace what is no longer true; don't append forever. Finished items go to CHANGELOG, not STATUS.
- Link files rather than repeating their contents.
- Multi-step work lives in its plan. STATUS links it under "Now" and doesn't copy its boxes.

## 2. Update `docs/CHANGELOG.md`
One line per change, newest first: `- YYYY-MM-DD: what changed (paths), and why`. A decision made goes in
`docs/DECISIONS.md` (AGENTS.md rule 12).

## 3. To-dos the user mentions
- **"Add / remind me / I need to":** a line under "Next" (or "Later" if it has no date), with who it is for and the due
  date if given. Something that waits on another person goes under "Blocked" with today's date as "since".
- **"Done with X":** take it out of STATUS and add the CHANGELOG line.
- **Commitments spotted in passing** (in meeting notes, a conversation, a document): list them and ask which to add.
  Never add them on your own.
- **Bigger than a few steps:** it gets a plan (plan skill), and STATUS links the plan.

## 4. Refresh a stale status
When STATUS is older than the newest CHANGELOG entry, before answering from it, or when asked to tidy it: follow
[references.md](references.md), "Refresh a stale status".

## 5. Answering "where are we"
Lead with Now and Next from STATUS, then open plans with their progress. If STATUS is stale, refresh it first (§4).
"What's on my plate": Now and Next, overdue items first. "What am I waiting on": Blocked, with how long each has waited.

## 6. Daily summary or standup update
A short draft the user can paste anywhere (never posted without the user's OK, AGENTS.md rule 6): the template and
sources are in [references.md](references.md), "Daily summary or standup update".

## 7. The user's shorthand: `docs/glossary.md`
When a request uses a term you can't place (an abbreviation, a nickname, a project codename, a team's own word):
1. Look it up: AGENTS.md preferences, `docs/BRIEF.md`, `docs/glossary.md`, then `node tools/recall.mjs "<term>"`.
2. Still unknown: ask once ("What does X mean here? I'll note it."), then record the answer.
3. Record it as a row of the table in `docs/glossary.md` (create the file with that table if it is missing):
   `| term | what it stands for | where it comes up, other names for it |`. Other names for the same thing (short
   forms, nicknames, old names) go in the same row, so any of them finds it.
4. People: the name they go by and their role in the project, nothing more. No contact details, opinions or private
   facts (AGENTS.md rules 11, 14 and 15). Names of products, brands and companies that may change belong in
   `docs/names.json`, not here.
5. A term that no longer applies is removed. Review the glossary before anything is shared or published.

## Done when
- [ ] STATUS has today's date, true Now / Next / Blocked sections, and links to every open plan (hook: status-handoff; judgment: whether the sections are true).
- [ ] Each change this session has its CHANGELOG line (hook: changelog for project files; judgment: other changes).
- [ ] Nothing was added to the to-dos, the tracker or a chat without the user's OK (judgment: the user's OK is in the conversation).
- [ ] Every term the user had to explain is in `docs/glossary.md` (judgment: which terms needed explaining shows only in the conversation).

## Pitfalls
- A STATUS that grows by appending. A new session reads only the top 40 lines, so old items hide the current ones.
- Copying a plan's checklist into STATUS. Two copies drift; link the plan instead.
- Asking the user the same shorthand question twice because the first answer wasn't written down.
- A standup draft posted without asking. Drafting is fine; sending is an outward action.

Inspired by the "task-management", "start", "update" and "memory-management" skills of the Productivity plugin and the
"standup" skill of the Engineering plugin, both in anthropics/knowledge-work-plugins (Apache-2.0, see LICENSE and
[SOURCE.md](SOURCE.md)).
