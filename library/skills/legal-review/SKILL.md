---
name: legal-review
description: Helps with everyday legal paperwork and questions without pretending to be a lawyer. It reviews contracts clause by clause against the user's own positions, screens NDAs, checks a plan against privacy and other rules, rates legal risk, drafts replies to common legal requests, checks what is signed with a vendor, prepares legal briefs and meeting notes, and checks a document is ready to sign. Every result is marked as not legal advice and says plainly when a qualified lawyer is needed. Use when the user shares a contract, NDA, DPA or terms, asks if something is compliant or risky, needs a legal reply drafted, wants a letter with legal effect (a rent increase, a notice, an eviction, deposit deductions, a dismissal), or is about to sign.
triggers: review this contract, contract review, review the contract, redline, redlines, nda, review this nda, non-disclosure, compliance check, is this compliant, is this legal, gdpr, ccpa, privacy law, dpa, data processing agreement, data subject request, legal risk, risk assessment, legal hold, litigation hold, subpoena, vendor agreement, vendor check, what have we signed, legal brief, legal briefing, legal meeting prep, ready to sign, send for signature, signing checklist, terms and conditions, terms of service, gdpr compliant, use it commercially, use commercially, rent increase, raise the rent, notice to quit, eviction, security deposit, terminate the lease, termination letter, dismissal letter, notice period, subida del alquiler, aumento del alquiler, desahucio, fianza, preaviso, carta de despido
---
# Legal review: careful paperwork, honest limits

**This is not legal advice.** The agent is not a lawyer. It reads documents, compares them with the user's chosen
positions, spots common traps, and drafts. A qualified lawyer decides anything that matters. A result that reads a
legal document or says what the law allows ends with this line, once, in the user's language:

`Not legal advice: an organized first read for a qualified lawyer to check.`

It goes at the end, after the answer, never as a banner on top and never inside a letter, reply or other draft meant
for someone else. A plain letter that only applies facts already settled (an amount, a date, a notice period the user
gave) needs no review and no line. Lesson: the line headed a rent letter and an answer about a letter's tone, where it
told the user nothing. Name the skill only on the answer's last markers line (`Skill: legal-review`), not in the text.

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
| wants a letter or notice that changes a legal relationship: a rent increase, a notice to end a tenancy or a job, an eviction, deposit deductions, a dismissal | **I** |

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

## The sections
Read only the section the situation needs (the table above), not all of them: each file read stays in the
conversation and is sent again with every later step.

- **A. Review a contract:** [sections/a.md](sections/a.md)
- **B. Screen an NDA:** [sections/b.md](sections/b.md)
- **C. Check compliance:** [sections/c.md](sections/c.md)
- **D. Rate a legal risk:** [sections/d.md](sections/d.md)
- **E. Draft a reply to a legal request:** [sections/e.md](sections/e.md)
- **F. Check what is signed with a vendor:** [sections/f.md](sections/f.md)
- **G. Briefs and meeting prep:** [sections/g.md](sections/g.md)
- **H. Ready to sign:** [sections/h.md](sections/h.md)
- **I. A letter with legal effect:** [sections/i.md](sections/i.md)

## Done when
- [ ] The answer ends with the "Not legal advice" line, once, and no draft for someone else carries it (hook: legal-disclaimer).
- [ ] It says what it was judged against: the user's positions file or general norms (judgment: no check reads this line yet).
- [ ] Every lawyer trigger that applies is named, with a recommendation to involve a qualified lawyer (judgment: which lawyer triggers apply needs a reader).
- [ ] Every law, deadline or threshold cited went through the research skill, with the jurisdiction named (judgment: which facts were cited needs a reader).
- [ ] Redlines quote the current text and give replacement text ready to paste (judgment: redline quality needs a reader).
- [ ] Sources checked and not checked are listed (judgment: no check reads the list yet).
- [ ] Nothing was sent, signed or submitted without the user's explicit OK (judgment: the user's OK is in the conversation).
- [ ] Followed unasked whenever the turn writes a privacy policy, terms or a contract, or the request is a step with legal effect (rent increase, notice, eviction, deposit, dismissal) (hook: legal-trigger).

## Pitfalls
- Sounding certain. A confident wrong answer about a contract can cost the user far more than "ask a lawyer".
- Judging one clause alone, when another clause caps, widens or cancels it.
- Treating general market norms as the user's own policy.
- Quoting a deadline from memory. Laws change and differ by place.
- Using a routine template for a regulator, a lawsuit or a subpoena.
- Missing what is absent: no liability cap, no DPA, no exit right.

Inspired by the Legal plugin by Anthropic (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
