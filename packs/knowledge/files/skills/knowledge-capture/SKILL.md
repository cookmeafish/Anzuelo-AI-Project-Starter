---
name: knowledge-capture
description: Records facts, findings, preferences and decisions into the project's knowledge base (docs/knowledge, SOURCES.md, DECISIONS.md, BRIEF.md) with evidence labels, sources and dates, extending existing topic files instead of duplicating them. Use after research or ingesting files, whenever the user states a fact or preference worth keeping, or when the user says "remember this", "note that", "save this", or "add this to the project".
triggers: note that, write this down, add this to the knowledge base, save this fact, record this, keep track of this, for future reference, remember this, remember that, add a note, note down, jot down, add to my notes, save a note
---
# Capture knowledge

## Where it goes
| What | Where |
|---|---|
| A fact about the subject | `docs/knowledge/<topic>.md` (format in `docs/knowledge/README.md`) |
| A source used | `docs/knowledge/SOURCES.md` |
| A choice the user made | `docs/DECISIONS.md` |
| A preference about how the user wants answers or work done | `docs/BRIEF.md` Preferences (an always/never becomes a rule via the project-rule skill) |
| Where the work stands | `docs/STATUS.md` (session-handoff) |

## Steps
1. **Find the home.** Grep `docs/knowledge/` for the topic. Extend the existing file if there is one. Create
   `<topic>.md` only for a genuinely new topic. It is listed in `DIRECTORY.md` §4 automatically.
2. **Write each fact** as a row: fact | label | source | date. Use the labels from
   `docs/checks/evidence-standards.md` exactly. One fact per row, and specific (numbers, names, scope: where, which
   version, for whom).
3. **Set `checked:`** to today and `volatile: yes` if the facts change over time.
4. **Superseded facts** move to the file's History section with the date. Don't delete them.
5. **Conflicts:** keep both, label unresolved, and add an Open question.
6. **Update the Summary** (2–5 lines) so the file can be understood at a glance.
7. Register new sources in SOURCES.md, and add a CHANGELOG line.

## Never
- Record a guess as a fact, or omit the label because it "seems obvious".
- Copy a private detail into a file that is shared or published without the user's OK.
