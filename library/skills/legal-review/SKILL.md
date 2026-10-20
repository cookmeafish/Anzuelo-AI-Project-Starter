---
name: legal-review
description: Helps with everyday legal paperwork and questions without pretending to be a lawyer. It reviews contracts clause by clause against the user's own positions, screens NDAs, checks a plan against privacy and other rules, rates legal risk, drafts replies to common legal requests, checks what is signed with a vendor, prepares legal briefs and meeting notes, and checks a document is ready to sign. Every result is marked as not legal advice and says plainly when a qualified lawyer is needed. Use when the user shares a contract, NDA, DPA or terms, asks if something is compliant or risky, needs a legal reply drafted, or is about to sign.
triggers: review this contract, contract review, review the contract, redline, redlines, nda, review this nda, non-disclosure, compliance check, is this compliant, is this legal, gdpr, ccpa, privacy law, dpa, data processing agreement, data subject request, legal risk, risk assessment, legal hold, litigation hold, subpoena, vendor agreement, vendor check, what have we signed, legal brief, legal briefing, legal meeting prep, ready to sign, send for signature, signing checklist, terms and conditions, terms of service
---
# Legal review: careful paperwork, honest limits

**This is not legal advice.** The agent is not a lawyer. It reads documents, compares them with the user's chosen
positions, spots common traps, and drafts. A qualified lawyer decides anything that matters. Every result starts with
this line:

`Not legal advice: an organized first read for a qualified lawyer to check.`

Say at the start: "Working on this with the legal-review skill."

## Pick the situation
| The user... | Section |
|---|---|
| shares a contract, order form, terms or an amendment to review | **A** |
| shares an NDA or confidentiality agreement | **B** |
| asks if a plan, feature or campaign is allowed, or shares a DPA or a privacy request | **C** |
| asks how risky something is, or whether it needs a senior person or outside counsel | **D** |
| needs a reply to a legal request (privacy request, hold notice, vendor question, NDA request, subpoena) | **E** |
| asks what is already signed with a company, or what is missing or expiring | **F** |
| wants a daily legal summary, a topic brief, an incident brief or prep for a meeting | **G** |
| says a document is final and ready to sign | **H** |

Several can apply. A new vendor deal is often F, then A, then H.

## Before any section
1. **Get the document itself.** A file, a link the agent can open, or pasted text. Read all of it before judging any
   part, because clauses change each other's meaning (a cap elsewhere can shrink a scary indemnity).
2. **Ask what you need, in one message:** which side the user is on, the deadline, what worries them most, and the
   deal context (size, how important, existing relationship). Missing answers: go on and list the assumptions.
3. **Load the user's positions.** Look for `legal-positions.md` in `docs/` (template in [references.md](references.md),
   "Positions file"). It holds the user's preferred terms, what they can accept, and what must go to a lawyer.
   - Found: judge against it and say "Basis: your positions file".
   - Not found: offer to set one up, or use common commercial norms and say "Basis: general norms, not your
     positions". Never present general norms as the user's policy.
4. **Laws change.** Deadlines, thresholds and which law applies go through the **research** skill (section C, with
   the law text or the regulator as the primary source). The checklists in references.md are starting points, not
   current law. Name the jurisdiction every time; the defaults lean on US and EU rules.
5. **Optional connections.** If the project can reach the user's document storage, email, calendar, contract system,
   CRM or e-signature tool, use it to find documents. Never depend on it: list the places searched and the places
   out of reach.

## When a lawyer is needed (stop and say so)
Stop the routine path, name the reason, and recommend a qualified lawyer when any of these is true:
- a lawsuit is filed or threatened, or a regulator, government body or the police is involved;
- possible criminal exposure, a data breach, or a securities or board-level matter;
- the reply would bind the user, waive a right, or admit fault;
- a subpoena or court order of any kind;
- the counterparty is a competitor, or the deal looks like a merger or acquisition;
- several countries' laws conflict, the law is unsettled, or nothing like it has been handled before;
- the risk rating in **D** comes out high or critical;
- the user is unsure and the stakes are real.

The agent may still prepare a draft for the lawyer, marked `DRAFT FOR COUNSEL REVIEW`.

## A. Review a contract
1. Name the contract type (software subscription, services, license, partnership, purchase); it decides which clauses
   matter most.
2. Check each material clause against the clause checklist in references.md: liability cap, indemnity, IP
   ownership, data protection, confidentiality, warranties, term and termination, governing law and disputes,
   insurance, assignment, force majeure, payment. Note clauses that are missing, not only bad ones.
3. Rate each clause:

   | Rating | Meaning | What to give |
   |---|---|---|
   | OK | Matches or beats the user's position | A one-line note |
   | Negotiate | Outside the preferred position but within what they can accept, or common in the market | Proposed wording, a fallback, and the cost of accepting it as is |
   | Escalate | Outside what they can accept, hits a lawyer trigger, or carries serious risk | Why, what a fair version looks like, the exposure, and who should decide |

4. For each Negotiate or Escalate item, write a redline: the quoted current text, the replacement text ready to paste,
   a short reason the other side can read, and a priority (must have, should have, could give up).
5. Close with the deal view: overall risk, the top three issues, and the order to negotiate in. Lead with must-haves,
   trade could-give-ups for should-haves, and never drop a must-have without the lawyer's say.
6. Long contracts (about 50 pages or more): offer the most material clauses first. A foreign-language contract: ask
   whether to work in the original or a translation.

## B. Screen an NDA
1. Check the ten areas in references.md ("NDA screen"): structure, the definition of confidential information, the
   receiving party's duties, the standard exclusions, who may be told, term, return or destruction, remedies, clauses
   that don't belong in an NDA, and governing law.
2. Give one verdict:
   - **Sign as is (green):** every area passes. It can go to the person allowed to sign.
   - **Quick fixes (yellow):** small gaps one review pass can fix. List each with suggested wording.
   - **Do not sign (red):** a serious problem, such as a hidden non-compete, non-solicit, IP grant, penalty clause,
     missing independent-development or legal-compulsion exclusion, or a "confidentiality" deal that is really a
     commercial contract. Recommend the user's own standard NDA as a counteroffer, and a lawyer.
3. A document that is called an NDA but carries business terms goes to **A** instead.

## C. Check compliance
1. Get the plan in concrete terms: what will happen, which countries or states, and what personal data is involved.
   Vague plans get one question back.
2. List the laws and policies that may apply and why (research skill for each). Common ones are in references.md.
3. For each requirement, mark met, not met or unknown, with the action needed.
4. Give one verdict: go ahead, go ahead with conditions, or needs a lawyer first. List approvals needed and from whom.
5. **A DPA** (data processing agreement): use the DPA checklist in references.md.
6. **A privacy request from a person** (access, deletion, correction, opt-out): identify the type and the law, verify
   identity in proportion to the data, log the date and the deadline, check exemptions such as a legal hold, then
   draft the reply in **E**.

## D. Rate a legal risk
1. Describe the risk in one or two sentences, with the facts it rests on.
2. Score **severity** (1 negligible to 5 critical) and **likelihood** (1 remote to 5 almost certain), each with a
   reason. Risk score = severity x likelihood.
3. Band it: 1 to 4 low, 5 to 9 medium, 10 to 15 high, 16 to 25 critical. The actions for each band are in
   references.md. High and critical go to a lawyer.
4. List what raises and lowers the risk, the options to reduce it (effect and effort), the risk left after the chosen
   option, and who watches it and how often.
5. The user can set their own money thresholds for each severity level in the positions file. Use them when present.

## E. Draft a reply to a legal request
1. Identify the request type. The types and what each reply needs are in references.md ("Reply types").
2. Check the lawyer triggers above and the extra triggers for that type. Any match: no routine reply; prepare a draft
   for counsel instead.
3. Use the user's saved template when the project has one; otherwise build from the structure in references.md and
   offer to save it as a template once the user approves it.
4. Fill in the real names, dates, reference numbers, the law that applies and the deadline worked out from the date
   received. Match the tone to the reader (an individual, a business team, a regulator).
5. Show the draft. Sending it is an outward action: only with the user's explicit OK (AGENTS.md rule 6).

## F. Check what is signed with a vendor
1. Pin down the exact legal entity (trade names, parent and subsidiary companies). Ask when unclear.
2. Search the places the project can reach, and list each agreement: type, status, start, end, auto-renewal and its
   notice window, key terms, amendments, and where the signed copy is.
3. Show what is in place and what may be missing for this kind of relationship (an MSA but no DPA while the vendor
   handles personal data is the classic gap).
4. Put first anything ending within 90 days, auto-renewals with an open notice window, and expired agreements whose
   duties live on (confidentiality, indemnity).
5. List the places searched and the ones out of reach, and ask where else agreements might be kept.

## G. Briefs and meeting prep
- **Daily brief:** new requests, items waiting on the user, deadlines this week, and meetings today that need legal
  prep, each with a next step.
- **Topic brief:** what the project's own files and past decisions say on a question (research skill, section A). For
  current law, research section C or a lawyer. Say where the brief stops.
- **Incident brief:** speed over completeness. Facts so far, timeline, notice deadlines, evidence to preserve,
  agreements and insurance involved, contacts, and the first actions. A possible breach or lawsuit is a lawyer trigger.
- **Meeting prep:** who attends and what they want, the agenda, background, open issues, talking points, questions,
  decisions needed, and lines not to cross. Afterwards, list action items with one owner and one date each.
- Templates for each are in references.md. Always end with "Sources not checked".

## H. Ready to sign
1. Run the signing checklist in references.md: final agreed version with no open edits, all exhibits attached,
   exact legal entity names, dates right or left blank, signers with authority, internal approvals done, review done.
2. Set the signers, the order (one after another or all at once) and who gets a copy.
3. Any check fails: say what to fix first. Sending for signature, with or without an e-signature tool, is an outward
   action: only with the user's explicit OK (AGENTS.md rule 6).

## Done when
- [ ] The answer starts with the "Not legal advice" line (hook: legal-disclaimer).
- [ ] It says what it was judged against: the user's positions file or general norms (judgment: no check reads this line yet).
- [ ] Every lawyer trigger that applies is named, with a recommendation to involve a qualified lawyer (judgment: which lawyer triggers apply needs a reader).
- [ ] Every law, deadline or threshold cited went through the research skill, with the jurisdiction named (judgment: which facts were cited needs a reader).
- [ ] Redlines quote the current text and give replacement text ready to paste (judgment: redline quality needs a reader).
- [ ] Sources checked and not checked are listed (judgment: no check reads the list yet).
- [ ] Nothing was sent, signed or submitted without the user's explicit OK (judgment: the user's OK is in the conversation).
- [ ] Followed unasked whenever the turn writes a privacy policy, terms or a contract (hook: legal-trigger).

## Pitfalls
- Sounding certain. A confident wrong answer about a contract can cost the user far more than "ask a lawyer".
- Judging one clause alone, when another clause caps, widens or cancels it.
- Treating general market norms as the user's own policy.
- Quoting a deadline from memory. Laws change and differ by place.
- Using a routine template for a regulator, a lawsuit or a subpoena.
- Missing what is absent: no liability cap, no DPA, no exit right.

Inspired by the Legal plugin by Anthropic (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
