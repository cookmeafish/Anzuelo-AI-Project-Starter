---
name: research
description: Get facts right, from the project's own files or from the web. Every fact traces to a source read this turn, research uses several independent sources with sponsored and biased ones screened out and weighs them together into one verdict, and a check catches anything made up. Use when answering from the knowledge base, looking something up, researching, comparing or fact-checking, and for every web search.
triggers: research, research online, look up, look into, look online, find out, compare, comparison, what are the options, best option, which is better, latest version, current version, up to date, is it true, is this true, is that real, verify this, verify the claim, fact check, fact-check, check online, search the web, web search, search online, google it, duckduckgo, find sources, what do we know, what do i know, what did we decide, what was decided, what is our policy, look in the project, according to, summarize what we know, is it safe, how much should, what dose, evidence for, studies show, what do studies, investiga, busca, averigua, que dicen, qué dicen, compara, fuentes, what is the best, best budget, how much does it cost, go for these days, these days, dig up, is it true that, which is cheaper, is it cheaper, price of, what do sources say, sources say, current prices
---
# Research: facts that are real

One rule covers every situation: **every fact in the answer traces to a source read this turn.** Memory doesn't
count. Find it and cite it, leave it out, or mark it "(not verified)".

## Pick the situation
| Situation | Do |
|---|---|
| The answer should come from the project's own files (knowledge base, sources, decisions) | **A** |
| One quick fact for the work at hand, like a library's docs or a command's flags. Not in a knowledge project | **B** |
| Research, comparisons, "is it true", anything the user will rely on or the project will record. Every web lookup in a knowledge project | **C** |
| No built-in web search, or a second engine to cross-check | [search-tool.md](search-tool.md) |
| Learning from people: interviews, surveys, usability tests, or turning their notes and feedback into findings | The **user-research** library skill (it uses **D** and **E** below) |

Then always **D** (did I make that up?), and in a knowledge project, **E** (record it).

## Answer format (every situation, A to E)
1. **The answer first.** No preamble, restating or filler. Answer everything asked and nothing more.
2. **Numbered citations.** Each fact ends with `[1]`, `[2]`, placed after the punctuation. One number per source, in
   order of first use. A source cited twice keeps its number.
3. **One short context line, only when it changes how to read the answer** (a definition, a scope limit, a caveat). It
   is cited too.
4. **`Sources:` last**, one line per number: `[n] <link or project file>`, optionally followed by ` - <title>, <date>`.
   The link or path comes right after the number and is clickable as written. Every number points to a source read
   this turn, and every number used in the text has its line.
5. After `Sources:`, only the Verified line (situation **C**). The markers (`Skill: research`) go into
   `.cache/turn-notes.md`, not the answer.

Shape (sample values):
```
Of the desks tested, three hold 100 kg or more:[1]
1. Desk A - 120 kg
2. Desk B - 110 kg
3. Desk C - 100 kg
These are the makers' rated loads. Only Desk A was load-tested independently.[2]

Sources:
[1] https://example.org/desk-specs
[2] docs/knowledge/desks.md
```

**Activity lines** while a longer research turn runs: one short line per step, an emoji and then the words, never an
emoji alone: `🔍 search: <query>`, `📖 read: <page or file>`, `🧮 compute: <what>`, `🧩 skill: research`. Skip them for
a quick answer. Details in `docs/checks/writing-standards.md`, "Activity lines".

## Sections A to C
Read only the one the situation needs (the table above): each file read stays in the conversation and is sent
again with every later step. D and E below apply to every situation.

- **A. From the project:** [sections/a.md](sections/a.md)
- **B. A quick lookup:** [sections/b.md](sections/b.md)
- **C. Research and fact checks:** [sections/c.md](sections/c.md)

## D. Did I make that up? (every situation)
Before answering, read the draft sentence by sentence:
1. Every factual sentence points to a source read this turn: a ledger row, a project file, or an opened page. No
   source: delete it, or mark it "(not verified)" or "(my inference from ...)".
2. Every number, name, date, unit and quote matches its source character by character.
3. A number you worked out yourself says so on its line: "(calculated: ...)" or "(estimate)".

The Stop hook checks this too (REQ: answer-traced): in a knowledge project, and after a ledger check, every number in
the answer and every number written into `docs/knowledge/` must appear in something read this turn, and every cited
project file must have been opened.

## E. Record it (knowledge projects)
Record what was confirmed with the knowledge-capture skill: each fact with its label, source and date (`volatile: yes`
for anything that changes), the sources in `docs/knowledge/SOURCES.md`. A deliverable is next: `deliverable.md`.

## Done when
- [ ] Every fact has a numbered citation, and `Sources:` has a `[n] <link or project file>` line for each number used,
      or the answer says "nothing recorded in the project" (hook: research-cited).
- [ ] The answer comes first, with no preamble or filler, answers everything asked and adds nothing unasked (judgment:
      only a reader can tell what was asked and what is padding).
- [ ] **C:** the ledger passes `claims.mjs check`, with at least three independent evidence sources or a
      `Sources limit:` line, and the answer ends with the Verified line (hooks: research-ledger, research-verified).
- [ ] **D:** every number and cited file is traced (hook: answer-traced).
- [ ] **E**, in a knowledge project: the findings are recorded (hook: research-recorded).
- [ ] Facts written into docs/knowledge come through this skill, knowledge-capture or ingest (or, read from the project's own files, each carries its label, date and source file), and their numbers trace to a source read this turn (hook: knowledge-source-trigger, answer-traced).

## Pitfalls
- Answering from general knowledge while implying it came from the project or a source. Say which is which.
- Counting copies as confirmation: ten sites repeating one press release are one source.
- "Studies show" without the study. A vendor's comparison with its rivals used as evidence.
- Snippets and AI overviews treated as the page. Old pages for facts that change.
- Scope mix-ups: another country, model year or version.
- Stopping at the first answer that sounds right. Search for the opposite before deciding.
- A bare list of links at the end with no numbers in the text: the reader can't tell which fact came from which page.

The search tool part is inspired by "duckduckgo-search" in NousResearch/hermes-agent (MIT, see LICENSE). Details in
[SOURCE.md](SOURCE.md). The rest is our own.
