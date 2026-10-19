---
name: notes-vault
description: Makes a notes folder the user already keeps (an Obsidian vault or any folder of Markdown notes) the project's knowledge base without moving a single note. Registers the note folders in "knowledgeDirs" so the knowledge checks cover them, keeps one note per topic, gives each new fact its source and date inside the note, links new notes to related ones in the vault's own link style, and runs the link check after every change. Use when adopting a folder that already has notes, when the user keeps notes outside docs/knowledge, or talks about their vault or their notes folder.
triggers: my vault, my notes, links in my vault, check my vault, my notes say, obsidian vault, notes vault, my notes folder, notes folder, from my notes, in my notes, use my notes, existing notes, update the note on, extend the note, markdown notes, adopt my notes, mis notas, en mis notas, nota nueva, mi bóveda
---
# Notes vault: the user's notes as the knowledge base

The user's notes stay where they are. Moving or renaming them breaks their links, their habits and their sync (Obsidian
Sync, iCloud, Dropbox, git). The project adapts to the vault, not the other way round.

Say at the start: "Working in your notes (notes-vault skill)."

## What the other skills already cover
- **Links, suggestions, orphans and broken links:** the obsidian skill and its script
  `skills/obsidian/scripts/notes.mjs` (`suggest`, `links`, `orphans`, `check`, `open`). This skill calls it; it does
  not repeat it.
- **How a fact is written** (label, source, date, conflicts, superseded facts): the knowledge-capture skill (knowledge
  pack). Here the same rules apply inside the user's notes, in the notes' own format.
- **Answering from the notes:** the **research** skill, situation A, with numbered citations to the note files.
- **Files the user drops in to be read:** the ingest runbook (knowledge pack).

This skill adds: finding and registering the note folders, one note per topic, the vault's own style, and the link
check on every change. The helper is `skills/notes-vault/scripts/vault.mjs` (Node only, read-only).

## Pick the situation
| Situation | Do |
|---|---|
| First time with this folder, or new top-level note folders appeared | **A** |
| A fact, finding or decision to record | **B**, then **C** |
| A new note | **B** (search first), then **C** and **D** |
| A question answered from the notes | **E** |
| Notes about different people | **F** |

## A. Register the note folders
1. Run `node skills/notes-vault/scripts/vault.mjs scan`. It lists every folder outside the starter's own that holds
   Markdown notes, its link style, the subfolders to leave out (`.obsidian`, attachments, templates) and whether it is
   registered. It prints the `knowledgeDirs` value to use.
2. Add the note folders to `"knowledgeDirs"` in `tools/hooks/config.json`, for example
   `"knowledgeDirs": ["Notes", "Journal"]`. The list extends the default (`docs/knowledge`), so don't repeat it. The
   knowledge checks, citations and stale-fact sweeps now cover these folders, and `DIRECTORY.md` lists them.
3. Leave out what is not knowledge: daily journals the user wants private, templates, attachments, an archive folder.
   Ask once when unsure, and record the answer in `docs/glossary.md`.
4. Run the scan again. It must end with `RESULT: PASS`.
5. Never copy the notes into `docs/knowledge/`. Two homes for the same facts drift apart.

## B. One note per topic
1. Before writing, search for the topic: `node skills/notes-vault/scripts/vault.mjs find "<topic>"`. It matches
   titles, `aliases:` in the frontmatter, the first heading and the text.
2. A note on the topic exists: extend it. Add a new name the user uses to its `aliases:` so the next search finds it.
3. Two notes cover one topic: say so and propose a merge. Merge only with the user's OK, and keep the old title as an
   alias so links and searches still land.
4. A genuinely new topic: create the note in the folder where the closest notes live, named the way they are named
   (same language, same capitalization, spaces or hyphens).

## C. Facts carry their source and date
1. Read three or four existing notes first and copy their format: frontmatter keys, headings, bullet or prose, where
   sources go (a footnote, a "Source:" line, a link at the end of the line).
2. Every new fact names its source (a file in `sources/`, a link, "the user, YYYY-MM-DD") and the date it was checked.
   With no source, label it as the knowledge-capture skill says (unverified, user-reported).
3. A fact that replaces an older one: keep the old one under a "History" heading with its date. Never delete it
   silently.
4. Change only the lines that need it. The user's own wording, order and formatting stay as they are.

## D. Link it, then check the links
1. Find the related notes: `node skills/obsidian/scripts/notes.mjs suggest "<note>"`. Read the likely ones and link
   only real relations.
2. Use the vault's link style, as the scan reported: `[[Note]]` in a vault that uses wikilinks, relative Markdown
   links in one that uses those. Don't convert the user's existing links.
3. A new note links to at least one related note, and the closest related note links back.
4. After any note changed, run `node skills/obsidian/scripts/notes.mjs check --all`. Note folders outside `docs/` are
   only covered with `--all`; read the lines for the vault folders. Fix every broken link this turn caused. Report
   broken links that were already there, and leave them unless the user asks.

## E. Answer from the notes
Follow the research skill, situation A: read each note you cite this turn, end each fact with `[n]`, and close with
`Sources:` and one line per note (`[1] Notes/Topic.md`). Facts older than 90 days on things that change get flagged as
possibly stale.

## F. People stay apart
A fact about one person goes in that person's note or folder (`profiles/<name>/` when the project has profiles), never
in a shared note. Health, money and family details stay out of any file that is shared or published.

## Done when
- [ ] Every note folder is in `knowledgeDirs` and `vault.mjs scan` ends with `RESULT: PASS` (judgment: the folder list needs the user's view on what is private).
- [ ] The link check ran after notes changed (hook: vault-links-checked).
- [ ] Every new fact has a source and a date in the note's own style (judgment: a script can't tell a fact line from prose).
- [ ] No note was moved, renamed or merged without the user's OK (judgment: a rename can be legitimate).

## Pitfalls
- Running `notes.mjs check` without `--all` on a vault outside `docs/`: it reports "every link resolves" while the
  vault's links are never read.
- Converting `[[wikilinks]]` to Markdown links "to be consistent". It rewrites hundreds of the user's notes.
- Renaming a note to fit a naming rule. Obsidian may update links, but other tools and synced copies won't.
- Writing into `.obsidian/` or a templates folder. Those are settings and blueprints, not notes.
- A second note on a topic because the first one used another word: search aliases, then add the new word as one.
