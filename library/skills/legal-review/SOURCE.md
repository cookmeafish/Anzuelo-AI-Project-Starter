Inspired by the Legal plugin by Anthropic (Apache-2.0, see LICENSE), skills: brief, compliance-check,
legal-response, legal-risk-assessment, meeting-briefing, review-contract, signature-request, triage-nda and
vendor-check. Version used: 1.3.0. The plugin's README.md and CONNECTORS.md were read for context.

The original is nine separate skills for in-house legal teams, wired to specific connectors (chat, cloud storage,
contract systems, CRM, email, calendar, e-signature) and a local playbook file.

Ours merges them into one skill with one section per situation:

| Section | Covers the original skills |
|---|---|
| A. Review a contract | review-contract |
| B. Screen an NDA | triage-nda |
| C. Check compliance (incl. DPAs and personal privacy requests) | compliance-check |
| D. Rate a legal risk | legal-risk-assessment |
| E. Draft a reply to a legal request | legal-response |
| F. Check what is signed with a vendor | vendor-check |
| G. Briefs and meeting prep | brief, meeting-briefing |
| H. Ready to sign | signature-request |

What ours keeps:
- the clause-by-clause method against the user's own positions, with three ratings, ready-to-paste redlines and a
  negotiation order;
- the NDA screen and its green, yellow and red verdicts;
- the severity x likelihood score and its four bands;
- the escalation triggers per reply type;
- the DPA and signing checklists, the agreement gap check, and the brief and meeting templates.

What ours changes:
- One shared "when a lawyer is needed" list and a "Not legal advice" line on every result, instead of a disclaimer
  repeated per skill.
- Laws, deadlines and thresholds are treated as facts that change and go through the project's research skill. The
  original's regulation tables are kept only as starting points to verify.
- No dependency on any connector, MCP server, chat tool or CRM. Connections are optional and the answer lists which
  sources were and were not checked.
- The playbook moves to `docs/legal-positions.md` in the project. Sending replies and documents for signature follows
  AGENTS.md rule 6 (explicit OK first).
- Written fresh in the project's plain style, agent-neutral. Dropped: slash-command syntax, product-specific
  examples, the routine for monitoring regulatory news (the research skill covers looking things up), and
  the outside-counsel diversity and panel notes (left to the user's own policy).

Edit freely; this is our version now.
