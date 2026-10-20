---
name: research
description: Get facts right, from the project's own files or from the web. Every fact traces to a source read this turn, research uses several independent sources with sponsored and biased ones screened out and weighs them together into one verdict, and a check catches anything made up. Use when answering from the knowledge base, looking something up, researching, comparing or fact-checking, and for every web search.
triggers: research, research online, look up, look into, look online, find out, compare, comparison, what are the options, best option, which is better, latest version, current version, up to date, is it true, is this true, is that real, verify this, verify the claim, fact check, fact-check, check online, search the web, web search, search online, google it, duckduckgo, find sources, what do we know, what do i know, what did we decide, what was decided, what is our policy, look in the project, according to, summarize what we know, is it safe, how much should, what dose, evidence for, studies show, what do studies, investiga, busca, averigua, que dicen, qué dicen, compara, fuentes
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
5. After `Sources:`, only the Verified line (situation **C**) and the one-line markers (`Skill: research`).

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

## A. From the project
1. Find the files: the knowledge table in `DIRECTORY.md`, then search `docs/knowledge/`, `sources/`,
   `docs/DECISIONS.md` and `docs/STATUS.md` for the key terms.
2. Open and read every file you will cite. Citing a file you didn't open this turn is blocked (REQ: answer-traced).
3. Answer in the answer format: each fact cites its file by number, and `Sources:` lists the paths
   (`[1] docs/knowledge/x.md`). Keep verified facts apart from inferred, user-reported and unresolved ones.
4. Flag stale facts (`volatile: yes` and older than 90 days), conflicts and gaps. Offer **C** instead of guessing.
5. Nothing recorded: say "nothing recorded in the project", then offer **C**.

## B. A quick lookup
Go to the official docs or other primary source, open the page, and use it. Start the line with `Quick lookup:`, cite
the page as `[1]`, and list it under `Sources:` (answer format). Anything the user will rely on, will be recorded, or
has high stakes is **C**.

## C. Research and fact checks
Work in a ledger: `node skills/research/scripts/claims.mjs new "<question>" --slug <topic>` creates
`.cache/research/<topic>.md` (format in [references.md](references.md)), or reuses the ledger with that slug, so
helpers on the same topic share one. Give every helper the same `--slug`.
1. **Frame it:** the question in one line, its scope (place, version, dates, audience), and the claims a full answer
   needs. Check what the project already has (**A**). A project file is a source too.
2. **Search wide:** at least three searches at once, worded differently. One for the primary source ("official",
   "specification", "study", "regulation"), one for the opposite view ("problems", "criticism", "recall", "<x> vs
   <y>"), and one for independent tests or reporting. Never put the user's private details in a query.
3. **Screen every source** before using it: owner, type, incentive, date, and use (`evidence`, `lead only` or
   `excluded`). The red flags are in [references.md](references.md).

   | Kind | Use |
   |---|---|
   | Primary: the maker's own specs, the law text, the study, the dataset, the official statement | Evidence for what the owner can know about itself; never for "we are the best" |
   | Independent: standards bodies, testing labs, peer-reviewed work, newsrooms with named authors | Evidence |
   | Forums, social posts, Q&A sites, wikis, AI summaries, aggregators, search snippets | Lead only |
   | Sponsored, affiliate, paid or partner content; press releases presented as news; "best of" lists full of shop links; content farms; copies | Excluded |

   Pages that copy or cite the same origin are **one** source: count owners, not pages.
4. **Read and extract:** open every evidence page and copy the exact words or numbers with the page's date. A claim
   that isn't on the page doesn't go in.
5. **Weigh all the sources together**, side by side. Each claim's status:
   - `confirmed`: two or more evidence sources with different owners agree;
   - `primary`: the owner states it about itself in its own primary source, and nothing credible contradicts it;
   - `single source`: say so in the answer;
   - `conflict`: find out why (date, scope, method, definition). Resolve it only by these rules: primary over
     secondary, measured over claimed, newer over older for things that change, and independent agreement over one
     voice. Still open: report both, never an average;
   - `unverified`: only as "not verified", or not at all.

   Then write the verdict: the one answer the evidence supports, its confidence (high, medium, low), and what would
   change it.
6. Run `node skills/research/scripts/claims.mjs check .cache/research/<slug>.md` and fix every ERROR.
7. **Answer** in the answer format: the verdict and its confidence first; the key facts with numbered citations
   (renumber the ledger's S-IDs as `[1]`, `[2]` in order of use); conflicts and unknowns only if there are any;
   `Sources:` with one line per number; and last, with the excluded count if any:
   `Verified: <n> claims traced to <m> independent sources; <k> cut or marked not verified; <e> excluded (<why>).`

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
- [ ] Facts written into docs/knowledge come through this skill, knowledge-capture or ingest, and their numbers trace to a source read this turn (hook: knowledge-source-trigger, answer-traced).

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
