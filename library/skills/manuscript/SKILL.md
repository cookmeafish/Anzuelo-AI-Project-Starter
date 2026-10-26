---
name: manuscript
description: Keeps a book, script, memoir or long non-fiction work consistent while it is written. Checks chapters against the character, place and timeline notes, keeps a style sheet (spelling, tense, point of view, names), flags names spelled two ways with a script, turns editor or reader feedback into a revision plan, and writes chapter summaries. Everything is a suggestion: the author's prose is never rewritten unasked. Use when the user asks to check continuity or consistency, a character's details, the timeline, pacing, the style sheet, chapter summaries, or how to work in feedback on a manuscript.
triggers: continuity check, check continuity, consistency check, does this match the notes, match the character notes, character notes, character sheet, character bible, series bible, story bible, timeline check, check the timeline, style sheet, chapter summary, chapter summaries, summarize the chapters, pacing notes, editor's feedback, editor notes, beta reader feedback, beta readers, revision plan, manuscript, my novel, my book, my screenplay, my memoir, revisa la continuidad, mi novela, mi libro
---
# Manuscript: a long work that stays consistent

Long works break in small ways: an eye color changes, a week has eight days, a name gains an accent in chapter 12.
This skill finds those problems and proposes fixes. The words are the author's: it changes a chapter only when the
author asks for that exact change.

Say at the start: "Working on the manuscript (manuscript skill)."

## What the other skills already cover
- **Facts the book relies on** (history, places, science, law): the **research** skill, which cites every fact it
  confirms.
- **Character, place and timeline notes as linked notes:** the obsidian skill. Each character note links to the places
  and other characters it touches, so the graph shows who meets whom.
- **Saving a report or plan as a file:** the **deliverable** runbook (knowledge pack). This skill says what goes in it.
- **A pitch, a blurb or a query letter:** the deliverable runbook, or the marketing skill when enabled.

The names script is `skills/manuscript/scripts/continuity.mjs` (Node only, nothing to install, read-only).

## Pick the situation
| Situation | Do |
|---|---|
| "Does chapter N match?", a new chapter is done, a character's detail is in doubt | **A**, then **B** |
| Names, spellings, tense or point of view drift | **B** |
| An editor, agent or beta readers sent notes | **C** |
| Chapter summaries, "where does it drag", structure | **D** |
| The author asks for a rewrite of a passage | **E** |
| Every answer | the `Continuity:` line (**F**) |

## Where things live
Find what the project already has before making anything: search for folders such as `characters/`, `world/`,
`notes/` and a timeline file. Use those. Only when there are none, start these:
- Character, place and timeline notes: `docs/knowledge/` (one note per character or place, one `timeline.md`).
- Style sheet: `docs/knowledge/style-sheet.md`. Chapter summaries: `docs/knowledge/chapter-summaries.md`.
- Reports and plans for the author: `outputs/continuity-<chapter>.md`, `outputs/revision-<round>.md`.

## A. Continuity check
1. Read the chapter (or chapters) in full. Then read every character, place and timeline note they touch.
2. Run the names script on the chapters checked and the ones before them:
   `node skills/manuscript/scripts/continuity.mjs <chapters folder> --style docs/knowledge/style-sheet.md`.
   It lists the names and capitalized terms per chapter and flags spellings that differ (accents, one or two
   letters, a spelling the style sheet marks wrong), ending with `RESULT: PASS` or `RESULT: FAIL <count>`. `--min N`
   lists only terms used at least N times. It cannot judge facts; steps 3 and 4 do that.
3. List each fact the text states: names, ages, looks, family ties, jobs, places, distances, dates, days of the week,
   seasons, weather, injuries, objects someone carries, and who knows what at this point.
4. Compare each one with the notes and with earlier chapters. Check the timeline arithmetic (ages against birth
   years, travel time against distance, how many days have passed).
5. Write `outputs/continuity-<chapter>.md`: one row per problem with the place (chapter, scene or first words of the
   paragraph), what the text says, what the note or earlier chapter says, and one or two suggested fixes.
6. When the note may be the outdated side, ask which is right. Update the note the author picks, with the date.

## B. Style sheet
1. Keep names in the format the script reads, under a `## Names` heading: one line per name, wrong spellings in
   brackets: `- Name (not: Variant, Other)`. A table with the name in the first column and wrong spellings in the
   second works too.
2. Also record: spelling variety (for example US or UK), tense, point of view and whose, number style, invented words,
   capitalization of titles and places, how dialogue and thoughts are set.
3. Check each new chapter against it (step A.2 for names; reading for tense and point of view). List deviations in the
   report. Never silently "fix" them in the chapter.
4. A new name the author confirms goes into the style sheet the same turn.

## C. Feedback into a revision plan
1. Read every note from the editor or readers. Keep the original messages as they are.
2. Write `outputs/revision-<round>.md`: one row per note with the chapter, the note in short, what it means for the
   book, two or three ways to address it, and an empty column for the author's decision.
3. Group notes that point at the same problem. When several readers name the same spot, say how many.
4. Notes that contradict each other are flagged side by side, not resolved. The author decides.
5. Once the author decides, record the decision in the plan and work through it chapter by chapter, only as asked.

## D. Summaries, structure and pacing
1. Chapter summaries: one short paragraph per chapter (who, where, when, what changes), plus its open threads
   (questions raised, objects or promises set up). Keep them in the summaries file, in chapter order.
2. Threads: list each open thread with the chapter that opens it and the one that closes it. A thread with no close
   goes in the answer.
3. Pacing: name the scenes that slow down and why (repeated information, no change in the scene, long backstory),
   with options. Word counts per chapter help: `wc -w chapters/*` (macOS, Linux, Git Bash) or
   `Get-ChildItem chapters | ForEach-Object { "$($_.Name) $((Get-Content $_.FullName -Raw).Split().Count)" }`
   (PowerShell).
4. Word files: ask the author to export chapters as plain text or Markdown, or convert a copy with
   `pandoc chapter.docx -t markdown -o .cache/chapter.md` when pandoc is installed. Never write back into the .docx.

## E. When the author asks for a change
1. Change only the passage named, in the author's voice, and show the before and after.
2. Anything wider (a name changed everywhere, a scene moved) gets a list of the places first, and the author's OK.
3. If the chapters are versioned files, save the change as a new version instead of overwriting.

## F. The Continuity line
End every manuscript answer with one line, `Continuity: <what was checked and what was found>`, for example
"Continuity: chapters 1 to 4 checked against the style sheet, 2 name variants and 1 timeline gap" or "Continuity: not
checked this turn (summaries only)".

## Done when
- [ ] The names script ran on the chapters, or the answer has a `Continuity:` line saying what was and was not checked (hook: continuity-checked).
- [ ] Every mismatch has a row with its place, both versions and a suggested fix (judgment: needs reading the text).
- [ ] No chapter text changed unless the author asked for that change (judgment: a requested edit is legitimate).
- [ ] Every editor or reader note has a row in the revision plan (judgment: matching notes to rows needs reading).

## Pitfalls
- Trusting the notes over the text. Notes go stale too: ask which side is right.
- "Fixing" a variant the author chose on purpose (a nickname, a dialect spelling). Flag it, then add it to the style
  sheet once confirmed.
- The script's flags are candidates. Two different people can have similar names; say so instead of merging them.
- Summaries that judge the writing. A summary says what happens; opinions go in the pacing notes, labeled.
- Pasting long passages of the manuscript into answers or other files. Quote a few words to locate the spot.
