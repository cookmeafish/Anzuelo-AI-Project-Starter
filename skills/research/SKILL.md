---
name: research
description: Get facts right, from the project's own files or from the web. Every fact traces to a source read this turn, research uses several independent sources with sponsored and biased ones screened out and weighs them together into one verdict, and a check catches anything made up. Use when answering from the knowledge base, looking something up, researching, comparing or fact-checking, and for every web search.
triggers: research, research online, look up, look into, look online, find out, investigate, compare, comparison, what are the options, best option, which is better, latest, current, up to date, is it true, is this true, is that real, verify, fact check, fact-check, check online, search the web, web search, search online, google it, duckduckgo, find sources, what do we know, what do i know, remind me, what did we decide, what was, what is our, look in the project, according to, based on what we have, summarize what we know
---
# Research: facts that are real

One rule covers every situation: **every fact in the answer traces to a source read this turn.** Knowing something
"from memory" doesn't count. Find it and cite it, or leave it out, or mark it "(not verified)".

## Pick the situation
| Situation | Do |
|---|---|
| The answer should come from the project's own files (knowledge base, sources, decisions) | **A** |
| One quick fact for the work at hand, like a library's docs or a command's flags. Not in a knowledge project | **B** |
| Research, comparisons, "is it true", anything the user will rely on or the project will record. Every web lookup in a knowledge project | **C** |
| No built-in web search, or a second engine to cross-check | [search-tool.md](search-tool.md) |

Then always **D** (did I make that up?), and in a knowledge project, **E** (record it).

## A. From the project
1. Find the files: the knowledge table in `DIRECTORY.md`, then search `docs/knowledge/`, `sources/`,
   `docs/DECISIONS.md` and `docs/STATUS.md` for the key terms.
2. Open and read every file you will cite. Citing a file you didn't open this turn is blocked (REQ: answer-traced).
3. Answer with the result first. Give each fact its file (`docs/knowledge/x.md`). Keep verified facts apart from
   inferred, user-reported and unresolved ones.
4. Flag stale facts (`volatile: yes` and older than 90 days), conflicts and gaps. Offer **C** instead of guessing.
5. Nothing recorded: say "nothing recorded in the project", then offer **C**.

## B. A quick lookup
Go to the official docs or other primary source, open the page, and use it. Put the link in the answer and start that
line with `Quick lookup:`. Anything the user will rely on, anything to be recorded, and anything with high stakes is
**C**.

## C. Research and fact checks
Work in a ledger: `node skills/research/scripts/claims.mjs new "<question>"` creates `.cache/research/<slug>.md`
(format in [references.md](references.md)).
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
7. **Answer:** the verdict and its confidence first; then the key facts with source IDs (`[S1, S3]`); conflicts and
   unknowns; Sources (ID, title, link, date, and how many were excluded and why); and last:
   `Verified: <n> claims traced to <m> independent sources; <k> cut or marked not verified.`

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
- [ ] Every fact has its source in the answer: a link or a project file, or "nothing recorded in the project" (hook:
      research-cited).
- [ ] **C:** the ledger passes `claims.mjs check`, with at least three independent evidence sources or a
      `Sources limit:` line, and the answer ends with the Verified line (hooks: research-ledger, research-verified).
- [ ] **D:** every number and cited file is traced (hook: answer-traced).
- [ ] **E**, in a knowledge project: the findings are recorded (hook: research-recorded).

## Pitfalls
- Answering from general knowledge while implying it came from the project or a source. Say which is which.
- Counting copies as confirmation: ten sites repeating one press release are one source.
- "Studies show" without the study. A vendor's comparison with its rivals used as evidence.
- Snippets and AI overviews treated as the page. Old pages for facts that change.
- Scope mix-ups: another country, model year or version.
- Stopping at the first answer that sounds right. Search for the opposite before deciding.

The search tool part is inspired by "duckduckgo-search" in NousResearch/hermes-agent (MIT, see LICENSE and [SOURCE.md](SOURCE.md)); the rest is our own.
