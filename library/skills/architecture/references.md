# Architecture references

## Comparison table (part A)
One column per option, same rows for each, so they read across.

| | Option 1: <name> | Option 2: <name> | Keep as is |
|---|---|---|---|
| Effort to build | | | |
| Running cost per month | | | |
| Fit for the expected load (numbers) | | | |
| Familiar to the people maintaining it | | | |
| How hard to undo later | | | |
| Main risk | | | |
| Recommendation | | | |

Below the table: the deciding trade-off, what gets easier, what gets harder, and the condition that would reopen it.

## Decision row (part A)
```
| 2026-03-02 | Store uploads in object storage, not the database | Files reach 40 GB a year; database backups would grow 10 times | Files in database rows; files on the server disk | Upload volume stays under 1 GB a year, or the host drops object storage |
```

## Design checklist (part B)
For each line write a decision or "not needed, because...".

| Area | Questions |
|---|---|
| Data model | The main records and their keys. Which queries run most, and which index serves each one? What must never be lost? |
| Contracts | Request and response shape per endpoint or message. Versioning, and what happens to old callers. Error format. |
| Caching | What is cached, where, for how long, and what clears it when the data changes? What happens when the cache is empty? |
| Background work | What runs outside the request? Retries with growing waits, a limit, and a place for jobs that keep failing. Is it safe to run twice? |
| Calls to other services | A timeout on each call. What the user sees when the other side is down. Limits on how often we call them. |
| Growth | What breaks first at 10 times the load: the database, one slow endpoint, memory, cost? |
| Failure | Single parts whose failure stops everything. How each one recovers. Backups and a tested restore. |
| Watching it | The few numbers that show health (errors, response time, queue length), and when they alert someone. |

## Design file outline (part B)
```
# Design: <feature or system>   (date, status: draft | agreed)
## Requirements          what it does; numbers for load, data, response time, uptime, cost (estimates labelled)
## Load math             the arithmetic, so anyone can check it
## Shape                 diagram; parts and what each owns; main flows
## Contracts             endpoints or messages with shapes
## Data                  stores, records, keys, indexes
## Risky areas           the deep dives from the checklist
## Growth and failure    what breaks first, recovery, alerts
## Decisions             links to the DECISIONS.md rows this design created
## Assumptions           what we took as true without proof
## Revisit when          observable conditions that would change the design
```

## Debt kinds (part C)
| Kind | What it looks like | What it costs |
|---|---|---|
| Code | Copied logic, functions doing several jobs, unexplained constants | Slow, risky changes; bugs fixed in one copy only |
| Design | Boundaries in the wrong place, a store that doesn't fit the data | Limits on growth; every feature fights the structure |
| Tests | Untested risky code, flaky tests, tests that never fail | Regressions reach users; people stop trusting the suite |
| Dependencies | Old, unmaintained or vulnerable packages | Security holes; painful upgrades later |
| Docs | No runbook, stale README, knowledge in one head | Slow onboarding; mistakes during incidents |
| Operations | Manual deploys, no monitoring, untested backups | Long outages; releases people avoid |

## Debt table (part C)
`docs/tech-debt.md`:
```
# Tech debt (updated YYYY-MM-DD)
| # | Item | Kind | Evidence | Pain | Risk | Effort | Priority | Plan |
|---|---|---|---|---|---|---|---|---|
| 1 | Price rules copied in 3 files | Code | 6 of the last 10 fix commits touch them | 4 | 4 | 2 | 4.0 | Merge into one module with the next pricing feature |
## Paid
| Date | Item | What changed |
```
