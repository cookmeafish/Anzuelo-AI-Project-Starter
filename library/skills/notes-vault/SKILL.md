---
name: notes-vault
description: Makes a notes folder the user already keeps (an Obsidian vault or any folder of Markdown notes) the project's knowledge base without moving a single note. Registers the note folders in "knowledgeDirs" so the knowledge checks cover them, keeps one note per topic, gives each new fact its source and date inside the note, links new notes to related ones in the vault's own link style, and runs the link check after every change. Use when adopting a folder that already has notes, when the user keeps notes outside docs/knowledge, or talks about their vault or their notes folder.
triggers: my vault, my notes, links in my vault, check my vault, my notes say, obsidian vault, notes vault, my notes folder, notes folder, from my notes, in my notes, use my notes, existing notes, update the note on, extend the note, markdown notes, adopt my notes, mis notas, en mis notas, nota nueva, mi bóveda
---
# Notes vault: the user's notes as the knowledge base

The user's notes stay where they are. Moving or renaming them breaks their links, habits and sync (Obsidian Sync,
iCloud, Dropbox, git). The project adapts to the vault.

Say at the start: "Working in your notes (notes-vault skill)."

## What the other skills already cover
- **Links, suggestions, orphans, broken links:** the obsidian skill's `skills/obsidian/scripts/notes.mjs` (`suggest`,
  `links`, `orphans`, `check`, `open`).
- **How a fact is written** (label, source, date, conflicts, superseded facts): the knowledge-capture skill (knowledge
  pack), applied in the notes' own format.
- **Answering from the notes:** the **research** skill, situation A.
- **Files the user drops in to be read:** the ingest runbook (knowledge pack).

This skill adds: registering the note folders, one note per topic, the vault's own style, and the link check on every
change. Helper: `skills/notes-vault/scripts/vault.mjs` (Node only, read-only).

## Pick the situation
| Situation | Do |
|---|---|
| First time with this folder, or new top-level note folders appeared | **A** |
| A fact, finding or decision to record | **B**, then **C** |
| A new note | **B** (search first), then **C** and **D** |
| A question answered from the notes | **E** |
| Notes about different people | **F** |

## A. Register the note folders
1. Run `node skills/notes-vault/scripts/vault.mjs scan`. For each top-level folder outside the starter's own that holds
   Markdown notes it shows the note count, link style, subfolders to leave out (attachments, templates, dot folders)
   and whether it is registered, then prints the `knowledgeDirs` value to use.
2. Add the note folders to `"knowledgeDirs"` in `tools/hooks/config.json`, e.g. `"knowledgeDirs": ["Notes", "Journal"]`.
   The list extends the default (`docs/knowledge`); don't repeat it. The knowledge checks, citations and stale-fact
   sweeps then cover these folders, and `DIRECTORY.md` lists them.
3. Leave out what is not knowledge: private journals, templates, attachments, an archive. Ask once when unsure and
   record the answer in `docs/glossary.md`.
4. Run the scan again. It must end with `RESULT: PASS`.
5. Never copy the notes into `docs/knowledge/`. Two homes for the same facts drift apart.

## B. One note per topic
1. Search before writing: `node skills/notes-vault/scripts/vault.mjs find "<topic>"`. It matches titles, `aliases:` in
   the frontmatter, the first heading and the text.
2. A note on the topic exists: extend it, and add any new name the user uses to its `aliases:`.
3. Two notes cover one topic: propose a merge. Merge only with the user's OK, and keep the old title as an alias so
   links and searches still land.
4. A new topic: create the note where the closest notes live, named like them (language, capitalization, spaces or
   hyphens).

## C. Facts carry their source and date
1. Read three or four existing notes and copy their format: frontmatter keys, headings, bullets or prose, where sources
   go (footnote, "Source:" line, link at line end).
2. Every new fact names its source (a file in `sources/`, a link, "the user, YYYY-MM-DD") and the date it was checked.
   With no source, label it as knowledge-capture says (unverified, user-reported).
3. A fact that replaces an older one: keep the old one under a "History" heading with its date. Never delete silently.
4. Change only the lines that need it. Keep the user's wording, order and formatting.

## D. Link it, then check the links
1. Find related notes: `node skills/obsidian/scripts/notes.mjs suggest "<note>"`. Read the likely ones; link only real
   relations.
2. Use the vault's link style from the scan: `[[Note]]` for wikilinks, relative Markdown links otherwise. Don't convert
   existing links.
3. A new note links to at least one related note, and the closest one links back.
4. After any note changed, run `node skills/obsidian/scripts/notes.mjs check --all` (`--all` also reads note folders
   outside `docs/` that are not registered yet). Fix every broken link this turn caused. Report older broken links and
   leave them unless the user asks.

## E. Answer from the notes
Follow the research skill, situation A: read each note you cite this turn, end each fact with `[n]`, and close with
`Sources:` and one line per note (`[1] Notes/Topic.md`). Flag facts older than 90 days on things that change as
possibly stale.

## F. People stay apart
A fact about one person goes in that person's note or folder (`profiles/<name>/` when the project has profiles), never
in a shared note. Keep health, money and family details out of any shared or published file.

## Done when
- [ ] Every note folder is in `knowledgeDirs` and `vault.mjs scan` ends with `RESULT: PASS` (judgment: the folder list needs the user's view on what is private).
- [ ] The link check ran after notes changed (hook: vault-links-checked).
- [ ] Every new fact has a source and a date in the note's own style (judgment: a script can't tell a fact line from prose).
- [ ] No note was moved, renamed or merged without the user's OK (judgment: a rename can be legitimate).

## Pitfalls
- Running `notes.mjs check` without `--all` on a vault outside `docs/` that is not in `knowledgeDirs`: it reports
  "every link resolves" while the vault's links are never read.
- Converting `[[wikilinks]]` to Markdown links "to be consistent". It rewrites hundreds of the user's notes.
- Renaming a note to fit a naming rule. Obsidian may update links, but other tools and synced copies won't.
- Writing into `.obsidian/` or a templates folder. Those are settings and blueprints, not notes.
- A second note on a topic because the first one used another word: search aliases, then add the new word as one.
