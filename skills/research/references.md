# Research: the ledger, red flags and conflicts

## The ledger
`node skills/research/scripts/claims.mjs new "<question>"` writes this to `.cache/research/<slug>.md`.
`claims.mjs check <ledger>` validates it (exit 0 = pass, 1 = errors, 2 = usage or read error).

```markdown
# Research: <the question in one line>
date: YYYY-MM-DD
scope: <place, version, date range, audience>
<!-- Optional, only when fewer than 3 independent sources exist: -->
<!-- Sources limit: <why no more exist> -->

## Sources
| ID | Link | Owner | Type | Incentive | Date | Use |
|---|---|---|---|---|---|---|
| S1 | https://example.org/spec | Example Corp | primary | sells it | 2026-05-01 | evidence |
| S2 | https://lab.example/test | Example Lab | secondary | none found | 2026-06-12 | evidence |
| S3 | https://deals.example/best | Deals Site | secondary | affiliate links | 2026-02-01 | excluded |

## Claims
| Claim | Sources | Quote or data | Status |
|---|---|---|---|
| The desk holds 120 kg | S1, S2 | S1: "rated load 120 kg"; S2: "held 120 kg in our test" | confirmed |

## Verdict
<the one answer the evidence supports, its confidence, and what would change it>
```

Column values:
- **Link:** a web address, or a project file (`docs/knowledge/x.md`, `sources/x.pdf`).
- **Owner:** who publishes it (company, agency, outlet, person). Different pages of one owner are one source.
- **Type:** `primary`, `secondary`, `forum`, `social`, `wiki`, `aggregator`, `ai` or `project`.
- **Incentive:** what the owner gains if you believe it: `none found`, `sells it`, `affiliate links`, `sponsored`,
  `paid placement`, `press release`, `advocacy`, `competitor`. Never leave it empty: looking is the point.
- **Use:** `evidence`, `lead only` or `excluded`.
- **Status:** `confirmed`, `primary`, `single source`, `conflict` or `unverified`.

What the check rejects:
- a source without a link, owner, type, incentive or use;
- forum, social, wiki, aggregator or AI pages used as evidence;
- sponsored, affiliate, paid or press-release sources used as evidence, unless they are the owner's own primary source;
- a claim citing a source that is not evidence, or with no quote or data;
- `confirmed` without two different owners, `primary` without a primary (or project) source;
- fewer than three evidence owners without a `Sources limit:` line;
- no text under `## Verdict`.

## Red flags: sponsored, paid or biased
- Words on the page: "sponsored", "partner content", "paid post", "#ad", "in collaboration with", "we may earn a
  commission", "affiliate", "presented by", "brand studio".
- Links that go through tracking or shop redirects, or "buy" buttons next to every pick.
- A "best of" list where every pick links to one shop, or the top pick is the publisher's own product.
- No author, no date, generic wording, or a site covering hundreds of unrelated topics (content farm).
- The same sentences on several sites: find the original and count it once.
- A press release, or a news story that only repeats one.
- A study paid for by the company it praises, or published only on that company's site.
- Reviews posted in a burst, all five stars, all vague.
- Advocacy or lobbying groups on their own cause: a lead for their primary data, not a neutral voice.

## Signs a source is solid
- A named author or body with a track record on the subject, a date, and a stated method.
- Raw data, test conditions or the full document, not just conclusions.
- Corrections published when it was wrong.
- Independent sources reach the same result by different means.

## Resolving conflicts
1. Same thing? Check the scope (country, model, version), the date and the definitions first. Many conflicts are two
   different questions.
2. Primary over secondary. Measured over claimed. Newer over older for things that change.
3. Agreement between independent sources over a single one, however confident it sounds.
4. Still open: report both, with what each is based on, and say what would settle it.
