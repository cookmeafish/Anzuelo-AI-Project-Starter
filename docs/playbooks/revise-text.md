---
name: revise-text
summary: Edit, proofread, shorten, change the tone of or translate text the user already has, keeping every fact, with the original left untouched
triggers: proofread this, proofread my, edit this text, edit this paragraph, make this shorter, make it shorter, shorten this, tighten this up, fix the grammar, fix the spelling, rewrite this more formally, make it more formal, make it more casual, change the tone, rewrite this paragraph, reword this, rephrase this, translate this text, translate this to english, translate this to spanish, translate this to french, translate this to german, translate this to portuguese, translate this to italian, translate this into english, translate this into spanish, translate this into french, translate this into german, translate this into portuguese, translate this into italian, translate it to english, translate it to spanish, translate it to french, translate it to german, translate it to portuguese, translate it to italian, translate it into english, translate it into spanish, translate it into french, translate it into german, translate it into portuguese, translate it into italian, cut this down to, corrige este texto, traduce esto
trigger_regex: \btranslate (this|it|my [a-z]+|the [a-z]+) (in)?to (?!(typescript|javascript|python|rust|golang|go\b|java|kotlin|swift|c\b|sql|php|ruby|code|json|yaml|csv))[a-z]
menu:
checks:
---
# Playbook: revise text the user already has

**Use when:** the user hands over their own text (pasted, or a file) and wants it proofread, edited, shortened,
lengthened, put in another tone, or translated. **Not when:** a new document from the project's facts (deliverable,
knowledge pack); a summary of a source (summarize); code, comments or code translation ("clean up the code" is
feature, app pack); a reply drafted from scratch (correspondence, when enabled).

## Inputs
- The text, and its goal in one line: audience, purpose, target length, tone, target language.
- Ask ONE question only when a missing goal would change the result (the audience, the target language, or how much
  to cut). Defaults otherwise: "shorter" with no target means about half the words; the user's voice, length and
  language stay except for what was asked. With `"autonomy": "auto"`: use the defaults and write an `Assumed:` line.

## Steps
1. **Keep the original.** Never write over the user's file. A file gets a new version next to it:
   `<name> v2.<ext>` (or the next free number). Pasted text gets the revision in the answer.
2. **List what must survive:** every number, name, date, link, quote, unit and "not" in the original.
3. **Revise for the reader** (`docs/checks/writing-standards.md`): answer first, plain words, short sentences, one
   idea per sentence, every heading says what is under it, no em dashes. Keep the user's voice unless asked to change it.
   - Proofread only: fix spelling, grammar and punctuation, one pass per kind of error; change nothing else.
   - Shorten: cut repetition and filler first, then detail; stop at the target length (count the words before and
     after).
   - Tone: change wording and register, not content.
   - Translate: keep a short term list (names, product terms, units), keep formatting and numbers as written, and
     reread the translation against the original sentence by sentence. Translating the riskiest 2 or 3 sentences
     back is a quick extra check, not proof.
4. **Check the facts:** tick each item from step 2 in the revision. Anything cut on purpose goes in the change note.
5. **Writing check** on a new file: `node tools/writing-check.mjs "<name> v2.<ext>"`. Fix what it lists (in a
   letter, courtesy lines stay).
6. **Answer** with the revision or its path, then a note headed "What changed" of 3 to 5 lines: what was changed, what
   was cut, `Shortened: <before> to <after> words` when length was a goal, and any `Assumed:` line.

## Done when
- [ ] The user's original is unchanged and the revision is a new version or in the answer (hook: no-overwrite)
      (judgment: the user's file can sit anywhere, so no glob names it).
- [ ] Every number, name, date, link, quote and "not" of the original is in the revision, or the change note lists it
      as cut (judgment: meaning, not spelling, decides whether a fact survived a rewrite or translation).
- [ ] The writing check ran on the new version (judgment: the new version sits next to the user's file, anywhere, and
      pasted text has no file, so no glob names it).
- [ ] When length was the goal, the answer gives the word count before and after (when answer: Shortened:|Acortado:) (answer: Shortened: \d+ to \d+ words|Acortado: \d+ a \d+ palabras)
- [ ] The answer has its "What changed" note (answer: What changed|Qué cambió|Que cambio)

## Pitfalls
- A rewrite that drops a number or a "not" reads better and says something else: step 4 exists for this.
- Proofreading that turns into a rewrite: when asked only to proofread, the user's wording stays.

Sources: https://www.nber.org/papers/w34255,
https://assets.publishing.service.gov.uk/media/68adbe409e1cebdd2c96a19d/dbt-microsoft-365-copilot-evaluation.pdf,
https://www.anthropic.com/research/anthropic-economic-index-september-2025-report, https://digital.gov/guides/plain-language
