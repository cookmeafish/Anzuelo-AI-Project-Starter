# Session handoff: reference

## Refresh a stale status
Do this when STATUS is older than the newest CHANGELOG entry, before answering from it, or when asked to tidy it.
1. Rebuild from CHANGELOG, DECISIONS, recently changed files and `node skills/plan/scripts/plan-tasks.mjs status
   <plan>` for each open plan.
2. Flag, and ask about each: due dates that have passed, items with no owner or no clear next step, things blocked
   for more than 2 weeks, and plans with no ticks for a long time (resume, or `status: dropped - <why>`).
3. If the project uses an issue tracker the agent can read (for example `gh issue list --assignee @me` in a git
   repository), compare it with STATUS and offer to add what is missing or close what is finished. Changing the tracker
   itself (comments, closing issues) is an outward action: only with the user's OK (AGENTS.md rule 6).

## Daily summary or standup update
A short draft the user can paste anywhere:
```markdown
## Update, YYYY-MM-DD
**Done:** finished items since the last update, one line each, with the file or issue they touched.
**Next:** the top items from Next, in order.
**Blocked:** each blocker, since when, and who can help.
```
- Take "Done" from CHANGELOG lines since the last update and, in a git repository, `git log --since=<date> --oneline`.
  Take "Next" and "Blocked" from STATUS. If the user describes their day in their own words, shape that instead.
- Keep it to what a teammate needs: results, not process. Mention numbers and names that matter.
- It is a draft. Posting it to a chat, email or tracker needs the user's OK (AGENTS.md rule 6). Reformat it for a
  specific place when asked.

