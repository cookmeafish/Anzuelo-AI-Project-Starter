---
name: routines
description: Turns requests for recurring work ("every Monday", "each month", "every morning") into a routine the project really keeps - a runbook for the job, a row in docs/routines.md that the session hook announces when it is due, and a script that lists, checks and marks routines done - and says honestly what starts each run (a session being opened, or an operating system scheduler the user agrees to). Use when the user asks for something to happen regularly or on a schedule, asks which routines exist or are due, or a routine was just run.
triggers: every monday, every tuesday, every wednesday, every thursday, every friday, every saturday, every sunday, every morning, every evening, every weekday, every week, every month, each week, each month, once a week, once a month, first of the month, run weekly, run daily, run monthly, recurring task, recurring job, on a schedule, remind me every, routines due, due routines, overdue routines, what routines, mark the routine done
---
# Routines: recurring work that really recurs

An agent does nothing between sessions. "I'll make the plan every Monday" is only true if something brings the job up
on Monday. This skill writes the job where the session hook reads it, and tells the user plainly what brings it up.

Say at the start: "Setting up a routine (routines skill)."

## What the other skills already cover
- **The job itself:** a runbook with its own check, made with the runbook-create skill
  (`skills/runbook-create/SKILL.md`). This skill only adds the schedule.
- **Running a due routine:** its runbook, followed like any other (AGENTS.md step 0).
- **A one-time "remind me", a to-do or status:** the session-handoff skill (docs/STATUS.md), not a routine.
- **Outward steps inside a routine** (sending, posting, publishing): still need the user's OK each time (AGENTS.md
  rule 6). A routine may prepare a draft; it never sends on its own.

Script: `skills/routines/scripts/routines.mjs` (Node only). Run it from the project root; runbook paths resolve
from there. `--file <path>` and `--today YYYY-MM-DD` override the defaults.

## How it works
The schedule lives in docs/routines.md. The format is fixed because the session hook reads the same table:
```
# Routines
| Routine | Every | Runbook | Last run |
|---|---|---|---|
| Weekly report | monday | docs/playbooks/weekly-report.md | never |
```
- **Every:** `day`, `week`, `month`, `weekday` (Monday to Friday), `monday` to `sunday`, `N days` (for example
  `3 days`), or `month day N` (for example `month day 1`, N from 1 to 28).
- **Last run:** a date (YYYY-MM-DD) or `never`.
- **Due:** the next date after Last run is today or earlier. `never` is due at once. `month` means the same day of
  the month as the last run.
- When a session opens, the hook prints one `ROUTINES DUE: ...` line listing the due routines. Nothing runs between
  sessions.

## Pick the situation
| Situation | Section |
|---|---|
| The user wants something done regularly | **A** |
| The hook announced ROUTINES DUE, or the user asks what is due | **B** |
| The user wants it to run with nobody opening a session | **C** |
| Change, pause or remove a routine | **D** |

## A. Set up a routine
1. **Pin down the schedule** as an allowed Every value. "Every two weeks" is `14 days`; "the first of each month" is
   `month day 1`; "weekday mornings" is `weekday`. Time of day is not stored: a routine is due for the whole day. If
   the wording fits none, ask one question.
2. **The job needs a runbook.** Route to an existing one, or create it with the runbook-create skill, including its
   check (e.g. a new dated file in outputs/).
3. **Add the row:** `node skills/routines/scripts/routines.mjs add "<Routine>" "<Every>" "<runbook path>"`. It
   creates docs/routines.md if missing, refuses an unknown Every, a missing runbook or a duplicate name, and runs the
   check. Hand edits are fine; then run `node skills/routines/scripts/routines.mjs check`.
4. **Say what starts it, in plain words**, e.g.: "It comes up the first time you open a session on or after a Monday.
   If no session opens, it waits; nothing runs on its own." Offer **C** in one line if the user may want it unattended.

## B. Run what is due
1. `node skills/routines/scripts/routines.mjs due` lists the due routines (exit 0 either way).
2. Tell the user in one line and offer to run them now. The user's own request comes first.
3. Run each by its runbook, in full, with its check.
4. Right after a run: `node skills/routines/scripts/routines.mjs done "<Routine>"`. It sets Last run to today and
   checks the file. Don't mark a skipped or failed run done; say why it was skipped.
5. Several missed periods (a weekly job last run a month ago) run once, unless the runbook says each period needs its
   own output. Say which periods were missed.

## C. Unattended runs (only with the user's OK)
A routine runs with nobody present only if an operating system scheduler starts the agent. Describe it with its
costs, and set it up only after the user agrees.
1. **What it needs:** the computer on and the user signed in at that time, the agent's non-interactive command (e.g.
   `claude -p "<prompt>"` or `codex exec "<prompt>"`), and permission settings that let it work without prompts. Each
   run costs usage like any session.
2. **What it cannot do:** ask questions or get an OK. An unattended run prepares and saves (drafts, reports); it
   never sends, posts, pays or deletes.
3. **The prompt it runs:** "Run the due routines in docs/routines.md, following each runbook, then mark each one done."
4. **Commands, per system** (show them to the user; the project path and time are theirs to fill in):
   - Windows Task Scheduler: `schtasks /Create /SC WEEKLY /D MON /ST 08:00 /TN "<Routine>" /TR "<command>"`
     (`/SC DAILY` for daily, `/SC MONTHLY /D 1` for the first of the month). Remove: `schtasks /Delete /TN "<Routine>"`.
   - cron (Linux, macOS): `crontab -e`, then a line like `0 8 * * 1 cd <project> && <command>` (minute, hour,
     day of month, month, weekday). Remove the line to stop it.
   - launchd (macOS): a plist in `~/Library/LaunchAgents/` with `StartCalendarInterval` (Weekday 1, Hour 8), loaded
     with `launchctl load <plist>`; `launchctl unload <plist>` stops it.
5. Write in the routine's runbook that it is scheduled, where, and how to remove it.
6. The row in docs/routines.md stays: the session announcement is the backup when the computer was off.

## D. Change, pause or remove
1. Change Every or the runbook in the row, then run `check`.
2. To pause, set Last run to a recent date (not a future one: `check` fails on that) and tell the user when it comes
   up next (`list` shows the next date).
3. To remove, delete the row and run `check`. If a scheduler was set up (**C**), remove that too, with the user's
   OK, and say so.

## Done when
- [ ] docs/routines.md passes `node skills/routines/scripts/routines.mjs check` after every change to it (hook: routines-checked).
- [ ] The routine's runbook exists with its check (hook: routines-checked: check fails on a missing runbook; runbook-complete for the check).
- [ ] The answer says what starts the routine: a session being opened, or a scheduler the user agreed to (judgment: the wording).
- [ ] After a run, Last run was set with `done` in the same turn (hook: routines-checked).

## Pitfalls
- Promising "I'll do it every Monday" with no row in docs/routines.md: a promise nothing will keep.
- Saying a routine "runs automatically" when only a session start brings it up.
- Marking a routine done when its run failed or was skipped, so the next due date hides the miss.
- `month day 31`: shorter months have no such day; use `month` (same day as the last run) or a day up to 28.
- An unattended run that needed an OK for a send, so it stopped halfway or, worse, sent without one.
