# Research, section C: Research and fact checks

Part of the research skill (SKILL.md): its answer format, section D and Done when apply.

Work in a ledger: `node skills/research/scripts/claims.mjs new "<question>" --slug <topic>` creates
`.cache/research/<topic>.md` (format in [references.md](../references.md)), or reuses the ledger with that slug, so
helpers on the same topic share one. Give every helper the same `--slug`.
1. **Frame it:** the question in one line, its scope (place, version, dates, audience), and the claims a full answer
   needs. Check what the project already has (**A**). A project file is a source too.
2. **Search wide:** at least three searches at once, worded differently. One for the primary source ("official",
   "specification", "study", "regulation"), one for the opposite view ("problems", "criticism", "recall", "<x> vs
   <y>"), and one for independent tests or reporting. Never put the user's private details in a query.
3. **Screen every source** before using it: owner, type, incentive, date, and use (`evidence`, `lead only` or
   `excluded`). The red flags are in [references.md](../references.md).

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
