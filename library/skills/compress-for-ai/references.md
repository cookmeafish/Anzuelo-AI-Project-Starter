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
Everything in "What the protect check guards" below, plus names of tools, libraries, APIs, protocols, people,
projects and companies, menu codes and rule numbers, and XML-like tags in prompts (such as `<example>`), which never
become headings.

### Keep the shape
- List nesting and numbering, and every checklist item (`- [ ]`).
- Tables: same rows and columns. Cell text may get shorter, except in `docs/checks/` where tools read the cells.
- Paragraph breaks where the topic changes. Merging two paragraphs makes the negation check compare per section.

### Shorten
- Short common words: "use" for "utilize", "start" for "commence", "fix" for "put a remedy in place for".
- One idea per sentence, about 20 words at most, active voice, imperative for steps.
- One term per thing, the same term everywhere.
- Common acronyms are fine (API, CLI, URL, PR). Don't invent short forms.
- Keep one example when several show the same pattern.

### Levels
| Level | What changes | Where it is allowed |
|---|---|---|
| light | Filler and wordy phrases go. Full sentences and normal grammar stay. | Every mode; the only level for sub-agent briefs; the default for opted-in replies |
| full | Also fragments and dropped articles, if a reader gets it on the first try | AI-facing files no person reads in normal use, reports and notes between agents, replies on request |
| ultra | Also each fact said once, a single word where it is enough, no linking words when the order stays clear | Reports back from sub-agents, scratch notes, replies only when the user asks for ultra |

Word order keeps steps in order at every level. "Take a backup, then run the migration, which drops the column"
can shorten to "Backup first. Migration then drops column", never to "migration drops column, backup".

### Example (a runbook step)
Original:
> Before you go ahead and push any of your changes to the main branch, it is really important that the full test
> suite gets run first, because this helps to catch problems early and stops broken builds from reaching users.

light:
> Run the full test suite before pushing to main. It catches problems early and keeps broken builds from users.

full:
> Before push to main: run full test suite. Catches problems early, keeps broken builds from users.

ultra (a sub-agent's report, not a rule file):
> Push to main: full tests first. Early catch, no broken builds to users.

### Never
- Change, move, merge or drop a code block, or wrap the whole file in a fence.
- Add new facts, headings, formatting, or reorganize sections.
- Leave notes about the rewrite inside the file ("Here is the shortened version...").
- Translate. Keep the file's language.
- Touch a backup in `.cache/compress/`.

## What the protect check guards
`node skills/compress-for-ai/scripts/protect-check.mjs <before> <after>` compares the two texts and prints
`PROTECT: PASS` or `PROTECT: FAIL` with one `CHANGED` line per token that changed or disappeared. Add `--tokens <file>`
to see what it protects in a file. `compress-guard.mjs check` runs the same check on every backed-up file.

| Category | What it finds | A change fails when |
|---|---|---|
| Frontmatter | The YAML block at the top | Any byte changes |
| Code | Fenced and indented blocks, `<!-- keep -->` regions | A block changes, moves or goes missing |
| Inline code | Everything in backticks | A span is lost |
| Paths and file names | `C:\x`, `/x`, `./x`, `~/x`, `folder/`, `a/b/c`, `name.ext` | One is lost or spelled differently |
| URLs and link targets | `https://...`, `www...`, `](target)` | One is lost or added |
| Commands and flags | `--flag`, `-f`, and `node`, `npm`, `git` and similar with their first argument | One is lost |
| Dates, versions | `2026-10-18`, `14:30`, `v2.4.1`, `3.1.0` | One is lost |
| Numbers and units | `90 seconds`, `100 MB`, `25%`, `$40`, plain numbers | A number or its unit changes |
| Identifiers | `snake_case`, `camelCase`, `PascalCase`, `$VAR`, `%VAR%`, `obj.key`, `kebab-with-1` | One is lost |
| Quotes | Text in double quotes, blockquote lines | The quoted text changes |
| Markers | `<!--name:KEY-->...<!--/name-->`, other HTML comments, `Playbook:`, `Skill:`, `REQ:`, `Worth it:`, `N/A(...)` | One is lost or added |
| Names | Each value in `docs/names.json` (when the file exists) | It appears fewer times |
| Headings | Heading text in order | Text, count or order changes |
| List numbering | The numbers of each ordered list | A step is merged, dropped or renumbered |
| Tables | Rows per table and cells per row | The shape changes |
| Negations | not, never, no, none, nothing, without, nor, cannot and "n't" forms, per paragraph | A paragraph has fewer than before |
| Conditions | only, unless, except, until, per paragraph | A paragraph has fewer than before |

New tokens are notes, not failures, except new URLs, link targets, markers and frontmatter keys. Read every note: a new
"not" can invert a rule as surely as a lost one.

`compress-guard.mjs check` adds these file checks: checklist count, em dashes added, commentary leaked, the file
wrapped in a fence, not valid UTF-8, not shorter. It warns on list items down by more than 15% and changed line
endings.

`compress-guard.mjs plan` refuses:
- anything outside the project, and files in `sources/`, `outputs/`, `inbox/`, `profiles/` and `.cache/`
- the project's `protectedOriginals` and `noOverwrite` globs, licenses and `SOURCE.md` credits
- generated files, user-facing files, and non-prose files (code, config, data)
- files whose names suggest secrets, empty files, and files that are not valid UTF-8

The check works on text patterns, not meaning. A PASS proves that the listed tokens survived. It does not prove that
the meaning did, so read the changed spots too. Some things it can't see: a bare `kebab-case` word without a digit, a
two-part folder path such as docs/plans without a trailing slash or extension, and a command written without a path
or flag. Put those in backticks and they are protected as inline code.

## Honest numbers
The script reports bytes and words before and after. That is a size measure. Token counts depend on the model's
tokenizer, and cost depends on caching and pricing, so neither is measured here. Say "the file is 31% smaller by
size", not "this saves 31% of tokens".

## Evidence
What others measured, checked 2026-10-18. Use it to set expectations, not as a promise.
- **The caveman project's own numbers** (github.com/JuliusBrussee/caveman, README): over 10 developer questions,
  6,983 output tokens with no instruction, 4,334 with "Answer concisely", 4,119 with its standard voice and 2,693 with
  its ultra voice. Its file compressor took five memory files from 6,198 to 4,138 tokens, 22.8% to 49.1% per file.
  Its voice rules themselves cost about 1,160 input tokens per request.
- **JetBrains** (86 paired Claude Code tasks, reported by InfoWorld): about 8.5% fewer output tokens, against a
  headline claim of 65%, and no detectable change in task success, code quality or run time. A first sample of 10 tasks
  had suggested about 30%. Most tokens in agent work go to reading files, reasoning and tool calls, which a reply
  style does not touch.
- **CAVEWOMAN paper** (Adobe Research and others, arXiv 2606.24083, 8 models, 5 datasets): shortening the model's
  output cut cost about 1.4 to 2.4 times per model. Compressing the input prompt raised net cost about 1.15 times on
  average, hurt accuracy at stronger levels, and about half the answers no longer matched the uncompressed answer in
  meaning. This is why sub-agent briefs stay at light, and rules and runbooks stay at light or full.
- No public report was found of the caveman tools breaking a path or dropping a negation. Their safety rests on
  instructions plus a validator, the same approach as the protect check here.

## Terse replies
Only when the user opts in (mode C). The writing standards (`docs/checks/writing-standards.md`) already ask for
answers that lead with the result, use plain words and have no filler. Terse replies keep that and add:
1. No opening line about what you are going to do, and no closing recap or offer of more help.
2. During tool work, say little: a line when a longer run starts, a line when its phase changes, and a line with the
   result. Routine calls get no text in between.
3. Code changes shown as the changed lines plus a line or two of context, unless the user asks for the whole file or
   the file is new.
4. Commands, paths, code and error messages exact. Quote only the decisive line of an error.
5. light keeps normal grammar. full allows fragments. ultra only when the user asks for it by name.

Example, a question about a failing build:
- Plain (the default): "The build fails because `config.json` is missing the `port` key. Add `"port": 8080` and run
  `npm run build` again. It does not need a restart."
- light: "`config.json` is missing the `port` key. Add `"port": 8080` and rerun `npm run build`. No restart needed."
- full: "`config.json` lacks `port` key. Add `"port": 8080`, rerun `npm run build`. No restart."
- ultra: "Missing `port` in `config.json`. Add `"port": 8080`, `npm run build`. No restart."

The switch-back cases, the never-terse list and the pre-send check are in SKILL.md, mode C.
