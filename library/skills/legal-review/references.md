# Legal review: checklists and templates

Deeper material for [SKILL.md](SKILL.md). These are starting points, not current law. Check every legal fact, deadline
and threshold with the research skill before relying on it, and name the jurisdiction.

## Positions file
Save as `legal-positions.md` in `docs/` once the user agrees. One block per topic, in the user's own words.

```markdown
# Our legal positions
Jurisdiction we work under: <country or state>
Who may sign what without a lawyer: <roles and limits>

## <Topic, e.g. liability cap>
- We prefer: <term>
- We can accept: <range>
- Send to a lawyer when: <trigger>

## NDA
- Mutual or one-way: <rule>
- Term and how long secrecy lasts: <years, longer for trade secrets?>
- Must have: <exclusions>
- Never accept: <clauses>

## Risk thresholds (optional)
- Severity 2 / 3 / 4 / 5 starts at: <money amounts or share of deal value>

## Reply templates
- <type>: <path to template>
```

## Clause checklist (section A)
| Clause | Look at | Common traps |
|---|---|---|
| Liability cap | Amount (fixed, a multiple of fees, none); same for both sides?; per claim, per year or total; which claims sit outside the cap; exclusion of indirect and lost-profit damages, and whether both sides get it | A cap so low it means nothing; carve-outs so wide the cap disappears; only one side protected from indirect damages |
| Indemnity | Who covers whom; what triggers it (IP claims, data breach, injury, breach of promises); capped or not; notice, who runs the defense, who may settle | Cover for "any breach", which quietly removes the cap; one-way IP cover when both sides bring IP; no control of the defense |
| IP ownership | Who keeps what each side owned before; who owns what is made during the work; work-for-hire scope; license scope, territory, sublicensing; feedback rights | Assignment wide enough to catch the user's existing IP; perpetual rights over any suggestion the user makes |
| Data protection | Is a DPA needed?; who is controller and who is processor; subprocessors; breach notice timing; transfers abroad; deletion at the end; security and audit rights | Personal data handled with no DPA; subprocessors added with no notice; breach notice slower than the law requires |
| Confidentiality | What counts; how long; exclusions; return or destruction | No end date; no exclusions; duties far heavier than the NDA standard |
| Warranties | What is promised; disclaimers; how long promises last | Every promise disclaimed; promises that end before problems can show |
| Term and termination | Length; renewal; exit for convenience and its notice; exit for cause and the cure period; what happens at the end (data return, handover) | Long lock-in with no exit; auto-renewal with a short, easy-to-miss notice window; no cure period |
| Governing law and disputes | Which law; courts or arbitration; where; jury and class-action waivers; who pays legal fees | A far-away or odd venue; arbitration rules that favor the drafter; no step to talk before suing |
| Insurance | Types and minimum cover; proof | Cover required that the user can't buy |
| Assignment | Consent needed?; change of control | The other side can hand the contract to anyone, the user can't |
| Force majeure | What counts; notice; right to exit if it lasts | So wide it excuses ordinary failures |
| Payment | Due date; late fees; taxes; price increases | Uncapped yearly price increases |

**Redline block:**
```
Clause: <section number and name>
Now: "<exact quote>"
Change to: "<replacement text ready to paste>"
Reason (shareable): <one or two sentences>
Priority: must have | should have | could give up
Fallback: <what to accept if refused>
```

**Contract review report:**
```
Not legal advice: an organized first read for a qualified lawyer to check.
Document: <name> | Parties and roles: <..> | Our side: <..> | Deadline: <..>
Basis: your positions file | general norms, not your positions

Top issues (3 to 5, each with its rating)
Clause by clause: <clause> - OK | Negotiate | Escalate
  Says: <summary> | Our position: <..> | Gap: <..> | Effect on the business: <..> | Redline: <block>
Negotiation order: must haves first, then trades
Lawyer needed for: <triggers that apply, or "none found">
Next steps
```

## NDA screen (section B)
| Area | Passes when |
|---|---|
| 1. Structure | Mutual or one-way fits the relationship; it is a standalone NDA |
| 2. Definition | Limited to non-public information shared for the stated purpose; marking rules, if any, are workable (for example, written confirmation of spoken disclosures within a set number of days) |
| 3. Duties | Reasonable care (at least the care used for one's own secrets); use only for the purpose; shared only with people who need it and are bound too; nothing impractical |
| 4. Exclusions | All five present: already public through no fault; already known; built independently; received lawfully from someone else; disclosure the law requires, with notice where allowed |
| 5. Who may be told | Staff, contractors and advisers under similar duties; affiliates if needed; regulators and courts when required |
| 6. Term | Agreement about 1 to 3 years; secrecy about 2 to 5 years after; longer only for trade secrets; nothing perpetual otherwise |
| 7. Return or destroy | On request or at the end; copies kept for legal or backup reasons allowed; a simple confirmation, not a sworn statement |
| 8. Remedies | Court orders to stop a breach acknowledged; no fixed penalty amounts; the same for both sides in a mutual NDA |
| 9. Doesn't belong | No non-solicit, non-compete, exclusivity, standstill (outside a merger context), IP grant or audit right; a residuals clause only if limited to unaided memory and excluding trade secrets and patents |
| 10. Law and venue | A well-known commercial jurisdiction; law and courts match; courts rather than forced arbitration |

**Fixes for frequent problems:**
- *Definition too wide:* limit it to information marked confidential, or that a reasonable person would see as
  confidential from its nature and the context.
- *No independent-development exclusion:* add it. Without it, the user's own later work can be claimed as copied.
- *Non-solicit inside an NDA:* delete it. If the other side insists, limit it to active targeting of staff (not job
  ads) for about 12 months.
- *Wide residuals clause:* resist. If unavoidable, limit to general know-how kept in unaided memory, exclude trade
  secrets and patentable material, and grant no license.
- *Perpetual secrecy:* replace with a fixed term, with longer protection only for real trade secrets.

**NDA report:**
- Verdict (green, yellow, red), then parties, type, term, law and basis.
- A table of the ten areas, each marked pass, flag or fail, with a note.
- Each issue: what it is, the risk, the fix.
- Next steps. Green: route to the authorized signer. Yellow: one review pass with the issues listed. Red: a lawyer,
  plus the user's own NDA as a counteroffer.

## Compliance (section C)
**Laws that often come up** (confirm scope, thresholds and deadlines with the research skill):
| Law | Where | Usually matters when |
|---|---|---|
| GDPR | EU and EEA | Handling personal data of people there, wherever the business sits |
| UK GDPR | United Kingdom | The same for people in the UK |
| CCPA as amended by CPRA | California | A business above the size or data thresholds handles California residents' data |
| LGPD | Brazil | Personal data of people in Brazil |
| PIPEDA | Canada (federal) | Commercial handling of personal data |
| PIPL | China | Personal data of people in China, especially transfers out |
| Privacy Act and APPs | Australia | Businesses covered by the Act |
| Sector rules (health, finance, children, marketing consent) | Varies | Health data, payments, children's data, emails and calls to consumers |

Starting points to verify, never to quote as settled:
- GDPR: a reply to a person's request within one month, extendable for complex cases. Breach notice to the regulator
  within 72 hours of becoming aware.
- CCPA rules: a confirmation within 10 business days and a reply within 45 calendar days, extendable once.

**Compliance report:**
```
Not legal advice: an organized first read for a qualified lawyer to check.
Plan: <..> | Places: <..> | Personal data: <..>
Verdict: go ahead | go ahead with conditions | needs a lawyer first
Laws and policies: <law> - why it applies - what it asks [source]
Requirements: <#> <requirement> - met | not met | unknown - action
Risks: <risk> - high | medium | low - how to reduce it
Approvals: <who> - why - status
Lawyer needed for: <..>
```

**DPA checklist:**
- Basics: subject, length, nature and purpose of processing, kinds of data, whose data, the controller's instructions.
- Processor duties: acts only on written instructions; staff bound to secrecy; security measures described;
  subprocessors only with permission, with notice of changes and a right to object, bound by the same terms, with the
  processor liable for them; helps with people's requests, security, breach notices and impact assessments; deletes
  or returns data at the end; allows audits or accepts independent audit reports; tells the controller of a breach
  fast enough for the controller to meet its own legal deadline.
- Transfers abroad: a valid transfer basis named (for EU data, an adequacy decision, the current standard contractual
  clauses with the right module, or binding corporate rules); a transfer assessment where needed; the UK addendum
  when UK data is in scope.
- Fit with the main contract: liability and term line up; processing locations listed; required certifications named.

**A person's privacy request:**
1. Type: access, correction, deletion, restriction, portability, objection, opt-out of sale or sharing, or limiting
   sensitive data.
2. Which law applies.
3. An identity check in proportion to the data, without demanding excessive documents.
4. Log it: date, type, requester, law, deadline, owner.
5. Exemptions: legal hold, required retention, legal claims, other people's rights.
6. Reply with what was done, or the legal basis for refusing, plus the right to complain to the regulator.
7. Keep the record.

## Risk bands (section D)
| Score | Band | Actions |
|---|---|---|
| 1 to 4 | Low | Accept with normal controls, record it, review it now and then |
| 5 to 9 | Medium | Reduce it (controls or negotiation), name an owner, tell the people affected, set what would raise it |
| 10 to 15 | High | Senior lawyer or outside counsel; a written plan and a fallback; leadership told; review weekly or at milestones |
| 16 to 25 | Critical | Immediate escalation to top leadership and outside counsel; response team; preserve evidence; notify insurers and regulators where required; review daily |

**Risk memo:**
- Header: date, author, matter, privileged (yes or no).
- The risk and its background.
- Severity and likelihood, each with its reason, then the score and band.
- What raises it and what lowers it.
- Options (effect, effort, chosen?), the recommendation, and the risk left after it.
- Monitoring and what would trigger a new look. Next steps (action, owner, date).

**Risk log row:** ID, date found, description, category (contract, regulatory, dispute, IP, privacy, employment,
corporate, other), severity, likelihood, score, band, owner, controls, status (open, reduced, accepted, closed), next
review, notes.

**When to bring in outside counsel:** always for lawsuits, government inquiries, possible criminal exposure,
securities or board matters. Strongly advised for unsettled law, unfamiliar or conflicting jurisdictions, exposure
above the user's tolerance, specialist fields (competition, anti-bribery, patents), major new rules, and acquisitions.
Worth considering for serious contract disputes, employment claims, possible data incidents, IP disputes and
insurance coverage fights. When choosing, weigh expertise, jurisdiction, industry knowledge, conflict checks, fees and
existing relationships.

## Reply types (section E)
| Type | Reply needs | Extra lawyer triggers |
|---|---|---|
| Person's privacy request | Acknowledge; ask for identity proof if needed; fulfil, partly refuse or refuse with the legal basis; the deadline; the right to complain; contact | A child's data; sent by a regulator; data under a legal hold; an employee in a dispute; very broad scope; health, biometric or genetic data |
| Legal hold notice | Matter name; what to keep (topics, dates, kinds of files, systems); a clear "do not delete or change"; how to confirm receipt and by when; contact. Also reminders, scope changes and release | Possible criminal matter; unclear or disputed scope; clashes with a legal duty to delete; a custodian objects |
| Vendor question | The agreement it refers to; the answer; limits; next steps | A dispute or breach; threats to sue or terminate; regulatory questions; anything that would bind the user |
| NDA request from a business team | Purpose; send the standard NDA, accept theirs with edits, or decline; how to sign; timing | Competitor; classified information; a possible acquisition; unusual subject matter (biometric data, data for training AI) |
| Privacy question | The relevant part of the privacy notice; the actual practice; links; contact | Children's data; transfers abroad with no basis |
| Subpoena or court order | Always a lawyer. Draft only: acknowledgment, objections, extension request or cover letter | Every case |
| Insurance notice | Policy number and period; what happened; timeline; request to confirm cover | Coverage disputes |

**Template format:** name and category; version and last reviewed date; approved by; use when; do not use when (the
triggers); variables (`{{requester_name}}`, `{{deadline}}`, and so on); subject line; body; follow-up steps (log it,
set a reminder for the deadline). Review templates when laws or policies change, and improve one whenever the user
edits it heavily before sending.

## Vendor status report (section F)
```
Vendor: <legal entity> | Relationship: <..> | Searched: <date>
Sources checked: <..> | Not checked: <..>
<Agreement type> - active | expired | in negotiation | awaiting signature
  Start <date>, ends <date>, auto-renews: <yes, notice by date | no>
  Key terms: <cap, law, exit> | Amendments: <..> | Signed copy: <where>
Coverage: NDA <found | missing> · MSA · DPA · SOWs · SLA · insurance certificate
Act soon: <ending within 90 days, notice windows, duties that survive>
```

## Brief templates (section G)
- **Daily:** urgent items; contracts waiting on the user, waiting on others, due this week; new requests; today's
  meetings and the prep each needs; deadlines this week; sources not checked.
- **Topic:** summary (two or three sentences); background; the current position in the project's files; key
  considerations; past decisions found; gaps; next steps; sources not checked.
- **Incident:** prepared at (time); severity if known; what is known; timeline; legal points (notice deadlines,
  evidence to keep, privilege); agreements and insurance involved; response so far; contacts; first actions in order;
  unknowns; sources checked.
- **Meeting:** title, date and time with time zone, length, place or link, the user's role; attendees (organization,
  role, what they want); agenda; background; key documents; open issues (status, owner, priority); legal points;
  talking points; questions to ask; decisions needed; lines not to cross; follow-ups from last time; gaps.
  Extra for deal reviews: deal summary, contract status, approvals, the other side's likely stance. Extra for board
  meetings: matters update, top risks and changes, rule changes, approvals needed, disputes. Extra for regulator
  meetings: the regulator's priorities, history with it, compliance status, counsel's advice, what not to discuss.
- **Action items:** one row each with the task (specific), one owner (a person, not a team), a date, priority,
  status. Check high-priority items daily, others at the next sync. Overdue items go to the owner and their manager.

## Signing checklist (section H)
- [ ] Final agreed version, no open edits or comments
- [ ] Every exhibit and schedule attached
- [ ] Exact legal entity names in the signature blocks (the most common mistake)
- [ ] Dates correct, or blank for the signing date
- [ ] Each signer has authority to bind their side
- [ ] Internal approvals done
- [ ] Reviewed by the right person or lawyer

Then: signers (name, email, title), order, who gets a copy, and where the signed copy will be filed. Without an
e-signature tool, prepare signing instructions and a print-ready copy. Sending needs the user's explicit OK.
