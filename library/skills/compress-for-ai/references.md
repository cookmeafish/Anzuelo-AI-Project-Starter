# Compress for AI: reference

## Rewrite rules
### Cut
- Filler words: just, really, basically, actually, simply, essentially, generally, very, quite.
- Pleasantries and hedges: "sure", "of course", "happy to", "I'd recommend", "perhaps consider", "it may help to",
  "worth thinking about".
- Wordy phrases: "in order to" becomes "to", "make sure to" becomes "ensure" or just the verb, "the reason is because"
  becomes "because", "at this point in time" becomes "now", "is able to" becomes "can".
- Stock links between sentences: however, furthermore, additionally, moreover, in addition. Keep the ones that carry
  logic (because, so, unless, until, only if).
- "You should", "remember to", "it is important to": state the action.
- Sentences that announce what follows or recap what came before. Duplicate points in two places: keep the better
  place and leave a pointer only if the other place needs one.

### Keep exactly
- The frontmatter block, byte for byte.
- Fenced and indented code blocks, including comments, spacing and line order inside them.
- Everything in backticks: commands, paths, flags, names, values.
- URLs, link targets and anchors. Link text may get shorter.
- Paths in plain text, numbers with units, dates, versions, money, limits and counts.
- Names of tools, libraries, APIs, protocols, people, projects and companies.
- Environment variables, config keys and error messages.
- REQ tags, `N/A(<tag>)` waivers, menu codes and rule numbers.
- Every negation and restriction: not, never, no, only, except, unless, without, until.
- Heading text and order. Links point at headings, so a renamed heading breaks them.
- XML-like tags in prompts (such as `<example>`): leave them as they are, never turn them into headings.

### Keep the shape
- List nesting and numbering, and every checklist item (`- [ ]`).
- Tables: same rows and columns. Cell text may get shorter, except in `docs/checks/` where tools read the cells.
- Paragraph breaks where the topic changes.

### Shorten
- Short common words: "use" for "utilize", "start" for "commence", "fix" for "put a remedy in place for".
- One idea per sentence, about 20 words at most, active voice, imperative for steps.
- One term per thing, the same term everywhere.
- Common acronyms are fine (API, CLI, URL, PR). Don't invent short forms.
- Keep one example when several show the same pattern.
- **dense** level only: fragments and dropped articles are fine if a reader gets it on the first try. Word
  order must keep the steps in order: "Back up first. Then run the migration: it drops the column", never "migration
  drop column backup first".

### Example
Before (tight level, a runbook step):
> Before you go ahead and push any of your changes to the main branch, it is really important that the full test
> suite gets run first, because this helps to catch problems early and stops broken builds from reaching users.

After:
> Run the full test suite before pushing to main. It catches problems early and keeps broken builds from users.

Dense level, same step:
> Before push to main: run full test suite. Catches problems early, keeps broken builds from users.

### Never
- Change, move, merge or drop a code block, or wrap the whole file in a fence.
- Add new facts, headings, formatting, or reorganize sections.
- Leave notes about the rewrite inside the file ("Here is the shortened version...").
- Translate. Keep the file's language.
- Touch a backup in `.cache/compress/`.

## What the check verifies
`node skills/compress-for-ai/scripts/compress-guard.mjs check <backup folder>` (or `check <before> <after>`).

| Errors (the file fails) | Warnings (read and judge) |
|---|---|
| Frontmatter changed | Heading levels changed (text the same) |
| A code block or `<!-- keep -->` region changed, moved or went missing | Inline code or paths added |
| Inline code, paths or numbers lost | Numbers added (for example "three" became "3") |
| URLs, link targets, REQ tags or waivers lost or added | List items down by more than 15% |
| Heading text, count or order changed | Fewer negations than before |
| Checklist count or table shape changed | Line endings changed |
| Em dashes added, commentary leaked, file wrapped in a fence | |
| Not valid UTF-8, or not shorter than before | |

`plan` refuses these:
- anything outside the project, and files in `sources/`, `outputs/`, `inbox/`, `profiles/` and `.cache/`
- the project's `protectedOriginals` and `noOverwrite` globs, licenses and `SOURCE.md` credits
- generated files, user-facing files, and non-prose files (code, config, data)
- files whose names suggest secrets, empty files, and files that are not valid UTF-8

It warns about large files, tool-read tables and the twin files.

The check works on text patterns, not meaning. A PASS proves that the listed tokens survived. It does not prove that
the meaning did, which is why step 4 includes reading the warnings and the changed spots.

## Honest numbers
The script reports bytes and words before and after. That is a size measure. Token counts depend on the model's
tokenizer, and cost depends on caching and pricing, so neither is measured here. Say "the file is 31% smaller by
size", not "this saves 31% of tokens".

## Terse answers
The writing standards (`docs/checks/writing-standards.md`) already ask for answers that lead with the result, use plain
words, have no filler and are as short as they can be while complete. Terse answers keep all of that and add, for chat
answers only:
1. No opening line about what you are going to do, and no closing recap or offer of more help.
2. During tool work, say little: a line when a longer run starts, a line when its phase changes, and a line with the
   result. Routine calls get no text in between.
3. Code changes shown as the changed lines plus a line or two of context, unless the user asks for the whole file or
   the file is new.
4. Commands, paths, code and error messages exact. Quote only the decisive line of an error.
5. Full words and normal grammar stay. The user reads these answers, so no fragments, no dropped articles, no
   invented short forms.

Switch back to full sentences, then return to terse, for: a security warning, an irreversible action (confirm it in
full sentences first), steps whose order matters, a confused user or a repeated question, and any question you ask
the user. Files, commits, PRs and messages to other people follow their own standards, not terse mode. The
**Finished** section that real work ends with still lists every file changed. Terse lasts until the user says
otherwise; to make it the default, add it as a rule with the project-rule skill.

## Compact reports from sub-agents
A sub-agent's report goes straight into the coordinator's context. When briefing one through the parallel-agents
skill, ask for results as lines like `path:line: finding` with a totals line at the end, and no story of how it was
found. The coordinator's answer to the user is still plain English.
