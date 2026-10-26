---
name: deliverable
summary: Produce a document the user will use or share (report, plan, brief, guide, checklist, draft) as a new versioned file in outputs/
triggers: write a report, write a document, write up, draft, make me a, create a document, a report on, proposal, guide, checklist, cheat sheet, summary for, one-pager, email draft, a letter, letter to, outline, put it in a file, export as, as a pdf, as a word document, write a post, instagram post, insta post, social post, social media post, newsletter, blog post, caption, flyer, menu card, handout, printable, to print, i can print, proper report, write up the meeting, pdf of, make a pdf, one page summary
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
   with numbered citations and a closing `Sources:` list, as in the research skill's "Answer format"
   (`skills/research/SKILL.md`).
3. **Save** as a NEW file: `outputs/<name>.md`, or `outputs/<name> v2.md` for a revision. Never overwrite a delivered
   file (the hook denies it) unless the user explicitly asks for an in-place edit. A deliverable about one person (the
   project has `profiles/<name>/`) goes in `profiles/<name>/outputs/` and uses only that person's data.
4. **Check** it against the brief's quality bar: does it answer what was asked, for this audience, at this length? Read
   it once as the reader would.
5. **Prose review.** Run `node tools/writing-check.mjs outputs/<name>.md`, then read it once more for what the check
   can't see:
   - [ ] The title says what the reader gets or can do, in their words, not an internal project name.
   - [ ] The document does one job (explain, instruct or look up), and the first paragraph says what it covers.
   - [ ] Every heading tells the reader what is under it. No bare "Overview", "Notes" or "Misc".
   - [ ] Steps are commands addressed to the reader ("Open the form"), one action each.
   - [ ] Vague amounts ("many", "often", "significantly", "fast") are replaced by the figure, or cut.
   - [ ] No words that judge the reader's task for them ("easy", "simple", "just", "obviously").
   - [ ] No paragraph opens by recapping the last one, and no stock framing that would fit any document.
   - [ ] One idea stays in one sentence instead of being chopped into fragments.
   - [ ] Every sentence reads clearly the first time at speaking pace. Rewrite any you had to read twice.
   - [ ] Abbreviations are spelled out on first use, and link text names where the link goes (never "here").
   - [ ] Examples and sample values are real or clearly marked as samples, and any steps or commands were tried.
6. **Answer** with a two- or three-line summary of the document and its path, in the same answer format (answer first,
   no filler). Mention the key assumptions and anything the user must fill in or verify.
7. Drafts meant for other people (emails, letters, posts) stay drafts. Sending is the user's call (rule 6).

## Done when
- [ ] A new file in outputs/, with earlier versions untouched (hook: no-overwrite).
- [ ] Uncertain facts are labeled in the document, and the answer gives the path in a Finished section (hook: finished-summary).
- [ ] Facts in the document carry numbered citations with a matching `Sources:` list (judgment: no check reads the
      file's citations; research-cited only reads the chat answer).
- [ ] Followed whenever a file is written to outputs/, even unasked (hook: deliverable-trigger).

## Pitfalls
- Padding: process narration, restating the question, generic advice. Keep only what the reader needs.

Credits: some prose review items were inspired by "writing-guidelines" in vercel-labs/agent-skills and its rules in
vercel-labs/writing-guidelines (MIT License, Copyright (c) 2026 Vercel Labs); the wording is our own.
