# Parallel agents: examples and details

## A filled-in brief
For one of three unrelated groups of failing tests. Placeholders in angle brackets.

```markdown
Read AGENTS.md first and follow its rules. Runbook: docs/playbooks/bugfix.md (debug skill).

Scope: the 3 failing tests in tests/export/csv-export.test.js, and the code they cover in src/export/.
Nothing else is yours. Other agents are working on tests/import/ and tests/auth/ at the same time.

Failing now (from `npm test -- tests/export`):
1. "quotes fields that contain commas": expected `"a,b"`, got `a,b`
2. "keeps leading zeros": expected `007`, got `7`
3. "writes a header row once": header appears twice when the export has more than 500 rows

Goal: all tests in tests/export/ pass, and nothing else in the suite breaks.
Hints: 1 and 2 look like a formatting step that runs too early. 3 appeared after export started writing in batches.
Don't skip or loosen the tests; find the cause.
Limits: change only src/export/ and tests/export/. No new dependencies, no commits, no sub-agents.

Return, in under 15 lines: status (done / done with concerns / needs information / blocked), the root cause of each
failure, the files changed, the test command you ran and its result, and anything still open.
```

## A worked example
**Situation:** after a large refactor, a suite has 7 failures in 3 files: the CSV export (3), the import parser (3)
and the login rate limit (1).

**Decision:** the three areas share no code paths and no files. The export failures are about formatting, the import
failures about parsing dates, the rate limit about a counter. Fixing one can't fix the others. Three agents.

**Briefs:** one per file, each with its own failing test names and messages, its own folder as scope, and "no
changes outside your folder".

**Results:**
- Export: a value was converted to a number before quoting. Fixed at the conversion.
- Import: a date format changed during the refactor. Restored and covered by a new test.
- Rate limit: the test used a fixed delay. Replaced with a wait for the counter to reset.

**Merge:** the three change sets touched separate files. The full suite passed on the combined result. A spot-check
found nothing the reports didn't mention.

## The return statuses
| Status | What you do |
|---|---|
| Done | Check the evidence, then merge |
| Done with concerns | Read the concerns. Correctness or scope doubts get resolved before merging; observations get noted |
| Needs information | Give it what is missing and send it back to work |
| Blocked | Find out why: missing context (give it), too hard (a stronger model), too big (split it), or the plan is wrong (fix the plan first) |

Never send an agent back to retry the same thing unchanged. If it says it is stuck, change something.

## Choosing models
Where your agent lets you choose a model per sub-agent:
- **Mechanical** (one or two files, clear instructions, the change is spelled out): the cheapest capable model.
- **Integration and judgment** (several files, debugging, reading unfamiliar code): a standard model.
- **Design and final reviews:** the strongest model available.

The cheapest models often take more turns on multi-step work, so they can end up costing more. Use a mid-level model
as the floor for anything that has to find its own way.

## Keeping your own context clean
- Ask for short reports and have the detail written to a file you can open when needed.
- Hand over large inputs (a diff, a log, a long spec) as file paths, not pasted text.
- Don't forward one agent's full report to another. Pass only the facts the next one needs.

## When parts share a working copy
Agents that change code in the same repository can still disturb each other through a shared build folder, lock
files, a dev server port or a test database. If the tool supports it, give each one its own copy (a separate git
worktree or a temp clone), and merge the changes afterward. Otherwise, run those parts one after another.
