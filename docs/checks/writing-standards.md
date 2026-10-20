# Writing standards (everything the user reads)

Covers answers, guides, reports, READMEs, docs, HTML pages and UI text. The Stop hook checks answers and every changed
user-facing file (REQ: plain-writing), and the pretool hook rejects em dashes before they are written. Check a file
with `node tools/writing-check.mjs <file>`.

## Mechanically enforced
- **No em dashes ("—")**, and no spaced en dashes (" – ") used as dashes. Use a period, comma, colon or parentheses.
- **No filler.** Banned phrases include "I hope this helps", "great question", "it's important to note", "delve",
  "feel free to", "in conclusion", "let me know if you have any questions", "seamlessly", "game-changer",
  "in today's fast-paced". The full list is `fluff` in `tools/hooks/hooks.mjs` DEFAULTS. A project can extend it in
  `tools/hooks/config.json`.
- **No walls of text.** Paragraphs stay at or under 150 words and sentences at or under 45 words
  (`maxParagraphWords`, `maxSentenceWords`). Use lists and tables. An answer under 40 words of prose is never too long.

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

## In the terminal: show what kind of message it is
Most answers are read in a terminal, where bold, lists, inline code, code blocks and short tables come through but
colors and HTML do not. So each block starts with a bold word that says what kind it is, and the user sees at a
glance whether it asks, reports, warns or says something broke.

| Kind | Starts with | What follows |
|---|---|---|
| Question that needs an answer | `**Question for you:**` | What is being decided and why, then numbered options (see "Questions with choices"). The user replies with a number. |
| Result | `**Done:**` (short answers) or a `**Finished**` section (real work, rule 7) | The outcome first, then the paths in `code`, then what was not done or not checked. |
| Heads-up | `**Heads-up:**` | Something the user should know but does not need to act on: an assumption made, a side effect, a risk. |
| Problem | `**Problem:**` | What failed, in one line. Then the likely cause, and what happens next or what the user can do. |
| Working | nothing, plain text, or an activity line | One short line while a long task runs: "Checking the 3 hook files next." (see "Activity lines") |

Rules:
1. **Lead each block with its kind.** One kind per block. A warning inside a result paragraph gets missed, so give it
   its own `**Heads-up:**` line.
2. **Questions go last, and never in the middle of a paragraph.** Anything that needs the user's answer sits at the
   end, under `**Question for you:**`, so it is the last thing they read. A message asks one question.
3. **Number the options** and mark the recommended one. Put the recommended option first, and say the user can also
   reply in their own words.
4. **Keep lines short.** Short paragraphs, lists and tables of 2 to 4 narrow columns. A wide table wraps into a mess
   in a narrow window. Use a list instead.
5. **Paths, commands and names of files go in `code`.** Commands the user should run go in a code block on their own.
6. **Don't rely on color or emoji.** The bold word carries the meaning. Plain text survives every terminal, log and
   screen reader.
7. **The check markers go together on one final line** (rule 7), after the question if there is one.

Scripts in `tools/` print plain text and can add color. They follow the same idea: the status word comes first on
each line (`PASS`, `FAIL`, `WARN`, `added`, `kept`), the result line comes last (`audit: PASS (...)`), and a `Next:`
line says what to run next. Color is only added when the output goes to a terminal and `NO_COLOR` is not set, so
logs and other tools that read the output get plain text.

Before (the question is buried, the warning hides in the middle, the files come last):
```
I updated the config and the tests pass, though I wasn't sure whether you wanted the old
setting kept so I removed it, which might break the nightly job, should I put it back?
Also I changed two files.
```
After:
```
**Done:** the config uses the new format and all 41 tests pass.
Changed `config.json` and `tests/config.test.mjs`.

**Heads-up:** I removed the old `retry` setting. The nightly job still reads it.

**Question for you:** keep the old setting so the nightly job keeps working?
1. Put it back (recommended): nothing else changes.
2. Leave it out, and I update the nightly job too.
Or reply in your own words.
```
A bare `Error: ENOENT` becomes: "**Problem:** `docs/BRIEF.md` is missing, so setup can't read the project's
purpose. Run `node tools/new-project.mjs` again, or tell me what the project is for and I'll write it."

### Answers with sources
An answer built on facts (research, the knowledge base, a lookup) follows the research skill's answer format
(`skills/research/SKILL.md`, "Answer format"). In short:
1. The answer first, then at most one short context line, and only when it changes how to read the answer.
2. Each fact ends with a numbered citation: `[1]`, `[2]`.
3. The answer ends with `Sources:` and one line per number: `[1] https://...` or `[2] docs/knowledge/x.md`. Every
   number points to a source read this turn.
4. Nothing the user didn't ask for, and nothing they asked left out.

### Activity lines
During a longer research or multi-step turn, each step gets one short working line: an emoji, then a word for the
step, a colon and what it acts on. Quick answers get none.

| Step | Line |
|---|---|
| Web search | `🔍 search: <query>` |
| Reading a page or file | `📖 read: <link or path>` |
| Working out a number | `🧮 compute: <what>` |
| Using a skill | `🧩 skill: <name>` |

The emoji is decoration and the word carries the meaning ("Don't rely on color or emoji" above), so a terminal
without emoji still reads "search:" or "read:". Never write an emoji alone.

Credits: the idea of giving each kind of output its own look, the numbered sources and the activity lines come from
Nous Research's Hermes Agent (MIT). The script conventions (important line last, `NO_COLOR`, suggest the next
command) come from the Command Line Interface Guidelines at clig.dev. Written here in our own words.

## Before and after
| Before | After |
|---|---|
| "Great question! It's important to note that there are several factors to consider — let's dive in." | "Three things decide it: price, size and warranty." |
| "This solution seamlessly leverages the data to unlock insights." | "The report compares 12 desks by price and height range." |
