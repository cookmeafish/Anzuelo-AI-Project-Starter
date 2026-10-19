---
name: ingest
summary: Process files the user provides - preserve originals in sources/, extract facts into docs/knowledge, register sources
triggers: inbox, i dropped, i added, here's a file, here is a file, attached, i uploaded, new files, process these, import this, read this document, here is a screenshot, this screenshot, here is an export, this export, exported file, spreadsheet
trigger_regex: \.(pdf|docx?|xlsx?|csv|txt|png|jpe?g|json|md)\b
menu: K3
---
# Playbook: ingest files

**Use when:** files are in `inbox/` or the user hands over a document, export, screenshot or pasted text to keep.
**Then:** continue with the request that came with the files (answer, research, deliverable).

## Steps
1. **List** what arrived (`inbox/`, attachments, pasted text). Read each one fully (PDF: the pdf skill; spreadsheets:
   the xlsx skill; images: look at them).
2. **Preserve.** Move each file from `inbox/` to `sources/` named `YYYY-MM-DD <short description>.<ext>`. Never alter the
   content. Pasted text worth keeping goes in `sources/YYYY-MM-DD <description>.md` verbatim. If a file with that name
   already exists, add ` (2)`; never overwrite.
3. **Extract** the facts into the right `docs/knowledge/` topic files (knowledge-capture skill). Label them `observed`
   or `document verified`, link back to `sources/<file>`, and date them. Keep what the file shows separate from what
   it might mean.
4. **Register** each file in `docs/knowledge/SOURCES.md`.
5. **Reconcile.** If new facts contradict existing ones, keep both, mark them unresolved, and tell the user.
6. **Report** what was in each file in a line or two, what changed in the knowledge base, and any questions the files
   raised. Then do the request that came with the files.

## Done when
- [ ] `inbox/` holds only README.md; originals are in `sources/`, unchanged.
- [ ] Facts are in docs/knowledge with labels, sources and dates; SOURCES.md is updated (hook: knowledge-labels).

## Pitfalls
- Summarizing a file without recording its facts, so the next session has to re-read it.
- Editing an original to "fix" it. Corrections belong in docs/knowledge.
