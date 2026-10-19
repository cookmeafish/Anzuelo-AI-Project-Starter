# Plans

A plan is a checklist for work too big to finish, or to keep in mind, in one go. Each one is a plain markdown file
here, so it outlives the session that wrote it and works with any AI agent, or a person, without special tools.
Written with the plan skill (`skills/plan/SKILL.md`).

## The files
- One file per plan: `YYYY-MM-DD-<topic>.md`.
- Each task has checkbox steps. A ticked box (`- [x]`) is done; an empty one (`- [ ]`) is not.
- Changes of course are dated notes inside the plan, so a later reader knows why the result differs from the plan.

## Open or closed: the status line
Right under the title, on a line of its own and without formatting:

| Line | Meaning |
|---|---|
| `status: open` | Work in progress, or not started |
| `status: done` | Every box ticked and every check passed |
| `status: dropped - <why>` | Given up for good, with the reason |

A plan with unticked boxes and no `done` or `dropped` line is open. At the start of every session the hooks list open
plans as OPEN PLANS, so they are resumed or closed instead of forgotten. A work turn that adds 5 or more new files
needs a plan here (REQ: plan-required).

## Resuming a plan (any session, any agent)
1. Read the plan's header, its "Context" section and every dated note.
2. Find the first unticked box: `node skills/plan/scripts/plan-tasks.mjs next <plan>` prints it with the brief for its
   task. Without Node, read down the file to the first `- [ ]`.
3. Trust the ticks. Never redo a ticked step, even if you don't remember it.
4. Tick each box in the same edit that finishes it. Before stopping, add a dated note for anything half done.
5. When every box is ticked, run the checks below, then set `status: done`.

Other commands: `status <plan>` lists every task with its progress, `task <plan> <N>` prints one task's brief for a
sub-agent, and `check <plan>` runs the mechanical review.

## Checks for this project
The commands every plan's "Checks for this project" section copies. The first plan fills this in from the project's
own files (CI workflow, task-runner targets, package scripts, README); never from guesses. Delete a line the project
has no tool for.
- Style or lint: (not set yet)
- Types: (not set yet)
- Tests, one file / all: (not set yet)
- Run it: (not set yet)
- Always: `node tools/writing-check.mjs <changed .md file>` for documents the user reads
