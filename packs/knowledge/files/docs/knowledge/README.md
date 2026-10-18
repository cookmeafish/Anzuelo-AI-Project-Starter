# How knowledge is written

`docs/knowledge/` holds what the project knows: the long-term memory answers come from. Labels and rules are in
[../checks/evidence-standards.md](../checks/evidence-standards.md). The Stop hook (REQ: knowledge-labels) blocks a
knowledge file that has no evidence label, no source, or no date.

## One topic per file
- Name files by topic, not by date: `pricing.md`, `vendor-acme.md`, `zoning-rules.md`. Use subfolders when a topic
  grows (`people/`, `products/`).
- Before creating a file, search for an existing one (`Grep`) and extend it. Two files on one topic drift apart.
- Every file is listed automatically in `DIRECTORY.md` §4 with its topic and the date it was checked.

## File shape
```markdown
---
topic: <what this file covers>
checked: YYYY-MM-DD          # when the facts were last verified
volatile: yes|no             # yes = changes often (prices, laws, versions, schedules): re-check before relying on it
next_check: YYYY-MM-DD       # optional: the audit flags the file as stale after this date
---
# <Topic>

## Summary
Two to five lines: the current best understanding.

## Facts
| Fact | Label | Source | Date |
|---|---|---|---|
| The office opens at 9am | source verified | https://example.com/hours | 2026-10-17 |
| The user prefers morning meetings | user reported | conversation | 2026-10-17 |
| Demand probably peaks in May | inferred | from sales.csv (sources/sales.csv) | 2026-10-17 |

## Open questions
- What is still unknown, and what would settle it.

## History
- YYYY-MM-DD: what changed and why (a superseded fact moves here; it is not deleted)
```

Labels (use these exact words): observed, user reported, source verified, document verified, measured, inferred,
hypothesis, assumption, unresolved. What each means and needs is in `evidence-standards.md`.
