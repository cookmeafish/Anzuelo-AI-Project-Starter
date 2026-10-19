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
- **Specific, not vague.** Replace "many", "often", "significantly" or "fast" with the figure, or cut the claim.
  Don't call the reader's task "easy" or "simple".
- **Read it once at speaking pace.** Rewrite any sentence you had to read twice. Headings and link text say what
  they lead to. Paragraphs don't open by recapping the one before.
- **Right length.** A chat answer is as short as it can be while staying complete. A guide covers what the reader needs
  to act, and nothing more.

## Questions with choices
Any question that offers the user choices (setup, upgrade reviews, packs, skills, tools, foundation defaults, git)
must let someone who is not technical choose well:
1. **Say what is being decided and why it matters**, in one plain sentence, before the options.
2. **Give each option a plain name.** A technical name may follow in brackets: "Team tracker for big jobs
   (orchestrate)". Never a bare name like "orchestrate" or "app pack".
3. **For each option say:** what it does, why it is good for THIS project, why it may be bad or what it costs, and
   what the user will notice afterwards. Base it on what you found in the project, not a generic description.
4. **Judge by where the project is heading, not only today.** "Not useful yet" is not a reason when the project will
   grow into it. Say when it starts to pay off ("useful once the project has a few weeks of history").
5. **Explain every technical word the first time**, in brackets: "local git repository (a history of every change,
   kept only on this computer; nothing goes to GitHub unless you later ask)". Say where things go and who can see them.
6. **Put numbers in everyday terms:** "under 2 MB (loads in about a second on a phone)", not "2 MB budget".
7. **Mark the recommended option** and say why, in one line.
8. **Always offer "Let the AI decide"**, saying what it would pick.
9. **One decision per question.** Don't bundle several defaults into one "OK as is?". List each with what it means.

| Before | After |
|---|---|
| "commit-archaeologist: explains code from git history. Only useful once there is history." | "Why is this code here? (commit-archaeologist): reads the change history of a file to explain why code exists before you change it. Good here: the field guide will keep growing, and this stops old fixes from being undone by accident. Cost: none until used; it pays off after a few weeks of history." |
| "Make this a local git repo?" | "Keep a history of every change? A local git repository saves every version on this computer, so any change can be undone. Nothing is uploaded to GitHub or anywhere else unless you ask later." |

## Before and after
| Before | After |
|---|---|
| "Great question! It's important to note that there are several factors to consider — let's dive in." | "Three things decide it: price, size and warranty." |
| "This solution seamlessly leverages the data to unlock insights." | "The report compares 12 desks by price and height range." |
