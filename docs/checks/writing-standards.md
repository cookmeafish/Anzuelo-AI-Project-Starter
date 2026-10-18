# Writing standards (everything the user reads)

This covers answers, guides, reports, READMEs, docs, HTML pages and UI text. The Stop hook checks answers and every
changed user-facing file (REQ: plain-writing). The pretool hook rejects em dashes before they are written. Check a file
any time with `node tools/writing-check.mjs <file>`.

## Mechanically enforced
- **No em dashes ("—")**, and no spaced en dashes (" – ") used as dashes. Use a period, comma, colon or parentheses.
- **No filler.** Banned phrases include "I hope this helps", "great question", "it's important to note", "delve",
  "feel free to", "in conclusion", "let me know if you have any questions", "seamlessly", "game-changer",
  "in today's fast-paced". The full list is `fluff` in `tools/hooks/hooks.mjs` DEFAULTS. A project can extend it in
  `tools/hooks/config.json`.
- **No walls of text.** Paragraphs stay under 150 words and sentences under 45 words. Use lists and tables.

## Judgment (finish checklist)
- **Lead with the answer.** The result or decision comes in the first line, followed by the reasons. The process goes
  last, or is left out.
- **Plain words.** Use short, common words and active voice. Say "use", not "utilize". Explain jargon the first time,
  or avoid it.
- **One idea per sentence and one topic per paragraph.** Cut every sentence the reader wouldn't miss.
- **Accurate.** Give specific numbers, names and dates. Label uncertain claims (knowledge pack: `evidence-standards.md`). Don't
  overstate: no "always", "guaranteed" or "best" without support.
- **Formatted to scan.**
  - Use headings for documents longer than about 300 words.
  - Use numbered lists for steps, bullets for options, and tables for comparisons.
  - Use bold sparingly, for the few words the eye should land on.
  - Keep files and paths in `code`.
- **Consistent.** Use the same name for the same thing throughout. Dates are YYYY-MM-DD. Units are always given.
- **Right length.** A chat answer is as short as it can be while staying complete. A guide covers what the reader needs
  to act, and nothing more.

## Before and after
| Before | After |
|---|---|
| "Great question! It's important to note that there are several factors to consider — let's dive in." | "Three things decide it: price, size and warranty." |
| "This solution seamlessly leverages the data to unlock insights." | "The report compares 12 desks by price and height range." |
