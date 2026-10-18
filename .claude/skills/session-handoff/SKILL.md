---
name: session-handoff
description: Updates docs/STATUS.md (Now / Next / Open questions / Blocked) and docs/CHANGELOG.md so a brand-new session can continue the work cold, and answers "where are we" questions from them. Use when substantial work ends, before stopping for the day, when the hooks ask for status-handoff, or when the user asks "where are we", "what's next", "status", or menu code E5.
runbook: docs/playbooks/project.md
---
# Session handoff

## Update `docs/STATUS.md`
Only the top 40 lines reach a new session, so keep it tight. The hooks require it after a substantial work turn (15+
tool calls, hook: status-handoff).
```markdown
# Status
Updated: YYYY-MM-DD.
## Now
- What is in progress, and its state (1–5 bullets).
## Next
1. The next concrete actions, in order, each one startable without context.
## Open questions
- Questions for the user, or unknowns blocking good answers.
## Blocked / waiting on the user
- Things only the user can do (decisions, files, logins, approvals).
```
- Replace what is no longer true; don't append forever. Finished items go to CHANGELOG, not STATUS.
- Use links to files rather than repeating their contents.

## Update `docs/CHANGELOG.md`
One line per change, newest first: `- YYYY-MM-DD: what changed (paths), and why`.

## Answering "where are we"
Lead with Now and Next from STATUS. If STATUS is older than the latest CHANGELOG entries or recent files, rebuild it
first (from CHANGELOG, DECISIONS and recently modified files), then answer.
