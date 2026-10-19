---
name: obsidian
description: Keeps the project's notes linked to each other so Obsidian's graph shows what is related and what isn't, and the agent can follow the same links. Every note links to its related notes, orphans get connected, likely relations are suggested from shared words, and a note opens in Obsidian with one command. Use when writing or reorganizing notes, when the user asks what is related to something, about Obsidian, the graph, backlinks or orphans.
checks: core note-linked
triggers: obsidian, open in obsidian, graph view, graph, backlinks, what is related, related notes, how is this connected, orphan notes, link the notes, cross reference, cross-reference, connect the notes
---
# Linked notes (Obsidian)

The project folder is an Obsidian vault as it is: open it with "Open folder as vault". Obsidian draws a line in the
graph for every link between two notes, so the links are the relationships. The same links help the agent: from one
note it can follow them to everything related.

## Links that work everywhere
- Write ordinary relative markdown links, `[Desk prices](desk-prices.md)`, not `[[wikilinks]]`. Obsidian, GitHub, editors
  and every agent all follow them. A new project's local `.obsidian/app.json` is already set to create links this
  way (`useMarkdownLinks`, `newLinkFormat: relative`) and to update them when a note moves.
- Link a word where it appears in the text when the relation matters there. Put the rest in a `## Related` section at
  the end, one line each with what connects them: `- [Desk prices](desk-prices.md): the budget this choice must fit`.
- Link both ways when both sides benefit. Obsidian shows backlinks anyway, but other readers only see written links.
- Tags go in the frontmatter (`tags: [desks, budget]`), for groups without one note at the center.

## When writing or changing a note
1. Before writing, find what it relates to: `node skills/obsidian/scripts/notes.mjs suggest <note>` lists notes that
   share the most key words and aren't linked yet. Read the likely ones; link only real relations.
2. Add the links (in the text, or under `## Related`). A new note must link to at least one other note (hook:
   note-linked); a note that is truly on its own says why under `## Related`.
3. Moved or renamed a note: `notes.mjs check` lists links that no longer resolve (the audit fails on them too).

## Answering "what is related to X?"
`node skills/obsidian/scripts/notes.mjs links <note>` lists its links out, its backlinks, and suggestions. Answer from
the links first (they are recorded relations), then the suggestions, labeled as suggested.

## Keeping the graph useful
- `notes.mjs orphans`: notes with no links in or out. Connect each one, merge it into a related note, or leave it
  with the reason under `## Related`. The audit warns about orphans.
- Don't link everything to everything. A link means "read this too when working on that". A graph where every node
  touches every other shows nothing.
- `notes.mjs open <note>` opens it in Obsidian (through the `obsidian://` link). It needs Obsidian installed and the
  folder opened as a vault once.

## Done when
- [ ] Every new note links to a related note, or says under `## Related` why it stands alone (hook: note-linked).
- [ ] Links are relative markdown links that resolve (judgment: the audit's link sweep checks it, but no hook runs it for notes yet).
- [ ] "What is related" answers separate recorded links from suggestions (judgment: telling recorded links from suggestions needs reading the answer).

## Pitfalls
- `[[wikilinks]]`: Obsidian follows them but GitHub and most tools don't. Use markdown links.
- Absolute paths (`C:\...`, `/home/...`) in links: they break on every other machine.
- A "Related" list copied from search results without reading the notes: it fills the graph with false relations.
