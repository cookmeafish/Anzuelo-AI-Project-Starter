---
name: deliverable
summary: Produce a document the user will use or share (report, plan, brief, guide, checklist, draft) as a new versioned file in outputs/
triggers: write me, write a, draft, make me a, create a, report, plan, brief, proposal, guide, checklist, cheat sheet, summary for, one-pager, email draft, letter, outline, document, save it, put it in a file
menu: K4
---
# Playbook: make a deliverable

**Use when:** the result is a file to use, keep or share. **Not when:** a short chat answer is enough. Don't create files
nobody asked for. If the user asks for a specific format (Word, PDF, slides, spreadsheet), use that format's skill.

## Inputs
- Audience, purpose, length and format. Take them from the request and `docs/BRIEF.md`; ask only if it's unclear and it
  matters.
- The facts, from `docs/knowledge/`. If key facts are missing, use the research skill first or label the gaps in the document.

## Steps
1. **Outline** the sections around the reader's decision or task, not around the research process.
2. **Write** from the knowledge base. Label uncertain facts in the text ("estimated", "unverified") and cite sources
   where a reader would want them.
3. **Save** as a NEW file: `outputs/<name>.md`, or `outputs/<name> v2.md` for a revision. Never overwrite a delivered
   file (the hook denies it) unless the user explicitly asks for an in-place edit.
4. **Check** it against the brief's quality bar: does it answer what was asked, for this audience, at this length? Read
   it once as the reader would.
5. **Answer** with a two- or three-line summary of the document and its path. Mention the key assumptions and anything
   the user must fill in or verify.
6. Drafts meant for other people (emails, letters, posts) stay drafts. Sending is the user's call (rule 6).

## Done when
- [ ] A new file in outputs/, with earlier versions untouched (hook: no-overwrite).
- [ ] Uncertain facts are labeled in the document, and the answer gives the path in a Finished section (hook: finished-summary).

## Pitfalls
- Padding: process narration, restating the question, generic advice. Keep only what the reader needs.
