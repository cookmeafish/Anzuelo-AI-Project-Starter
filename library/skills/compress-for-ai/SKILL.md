---
name: compress-for-ai
description: Shortens the files that AI agents read every session (agent rules, skills, runbooks, references, memory notes) so they cost less context, while user-facing text stays plain English. It plans which files qualify, keeps a byte-exact backup in .cache/, rewrites only the prose, and proves with a zero-install script that no path, command, number, code block, frontmatter, trigger, REQ tag, link, heading or checklist item was lost. It never touches originals, deliverables, generated files, code or config. Use when the user asks to compress, shorten, slim down or make AI-facing files more token-efficient, or when a rules file, skill or runbook has grown long and wordy. Also covers a terse-answers option.
triggers: compress the skills, compress this file, compress the rules, compress agents.md, compress claude.md, shorten the runbooks, shorten for the ai, slim down the skills, make it token efficient, token efficient, fewer tokens, save tokens, too long for the agent, terse answers
---
# Compress for AI: shorter files for agents, nothing lost

Agents read the rules, skills and runbooks again and again, so every spare word costs context in every session. This
skill cuts that cost. It changes the wording, never the content: what a file says must survive, character for
character where it matters.

Say at the start: "Compressing AI-facing files (compress-for-ai skill)." The rewrite happens here, in this session.
Nothing is sent to another model or service.

## Which files qualify
| AI-facing: may be compressed | User-facing: stays plain English | Never touched |
|---|---|---|
| `AGENTS.md` or `CLAUDE.md` (one of the twins; the hooks copy it to the other) | `README.md`, `HOW-TO-USE.md`, `docs/BRIEF.md` | `sources/`, `outputs/`, `inbox/`, `profiles/` |
| `skills/<name>/SKILL.md` and `references.md` (body only) | `docs/STATUS.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md` | Protected and versioned files from `tools/hooks/config.json` |
| Runbooks in `docs/playbooks/` (their skills are generated from them) | `docs/knowledge/`, `docs/plans/`, reviews, releases | Generated files: `.claude/skills/`, `DIRECTORY.md`, `generated: true` skills |
| Prose in `docs/checks/` (tables stay as they are) | Answers, deliverables, HTML pages | `LICENSE`, `SOURCE.md`, code, config, data |
| Memory notes and brief templates for agents | | Files whose names suggest secrets; backups in `.cache/` |

A user-facing file that is too long gets the writing standards (`docs/checks/writing-standards.md`): tighter plain
English, never the dense style below.

## 1. Plan
1. Get the exact files. If the user pastes text instead of naming a file, ask for the file, or offer to save the text
   to a file first. Never answer with a compressed copy plus remarks about it.
2. Run `node skills/compress-for-ai/scripts/compress-guard.mjs plan <files>`. Tell the user which files are skipped
   and why, in one line each.
3. Pick the level per file:
   - **tight** (default): full sentences, no filler. Fits every AI-facing file.
   - **dense**: fragments allowed, articles dropped. Only for files no person reads in normal use (skills, runbooks,
     references, memory notes).

## 2. Back up
Run `node skills/compress-for-ai/scripts/compress-guard.mjs backup <files>`. It copies each file byte for byte to
`.cache/compress/<stamp>/` with a `.orig` suffix (so no tool loads the copy as a live skill), checks each copy, and
prints the folder. If it refuses or the copy check fails, stop: nothing has changed yet.

## 3. Rewrite the prose
Work file by file; for a file over about 100 KB, one section at a time. The rules are in
[references.md](references.md), "Rewrite rules". In short:
1. **Cut** filler words, pleasantries, hedges, wordy phrases ("in order to" becomes "to"), "you should" and "make sure
   to", repeated points, and sentences that only announce or recap.
2. **Keep exactly** the frontmatter, code blocks, inline code, commands, paths, URLs and link targets, numbers with
   their units, dates, versions, names, REQ tags and `N/A(...)` waivers, heading text, and every negation.
3. **Keep the shape:** headings and their order, list nesting and numbering, checklist items, table rows and cells.
   Merge bullets only when they state the same fact.
4. **Never add** a heading, a fence, a new fact, an abbreviation of your own, or a comment about the rewrite.
5. Leave any region between `<!-- keep -->` and `<!-- /keep -->` alone.

## 4. Prove nothing was lost
1. Run `node skills/compress-for-ai/scripts/compress-guard.mjs check .cache/compress/<stamp>`. It compares each file
   with its backup and fails on any lost token, a changed code block, frontmatter, heading or table, a changed
   checklist count, leaked commentary, new em dashes, or a file that did not get shorter.
2. **On FAIL,** fix only the listed problems, copying the lost text back from the backup. Don't compress again. After
   2 failed repair rounds, run `node skills/compress-for-ai/scripts/compress-guard.mjs restore .cache/compress/<stamp> <file>`
   and report that file as not compressed.
3. **Read every WARN.** Fewer negations, merged list items and changed line endings can be fine or can change meaning.
   Re-read those spots against the backup. A sentence that now has two readings goes back to a full sentence.

## 5. Run the project checks
1. `node tools/writing-check.mjs <each changed file>`: files under `docs/` are user-facing to the hooks and must pass.
2. `node tools/audit.mjs`: every path, command and skill name the files mention must still resolve.
3. A compressed runbook regenerates its skill, and a compressed `AGENTS.md` or `CLAUDE.md` syncs its twin. Check both
   happened.
4. Add a line to `docs/CHANGELOG.md`.

## 6. Report
Lead with the result per file: bytes and words before and after, from the check output. Say these are size
measurements: token or cost savings are not measured, so don't claim them. Give the backup folder and the restore
command. List skipped files with the reason.

## Terse answers (option)
When the user asks for shorter or terser answers, the writing standards already apply: answer first, no filler,
nothing the reader would not miss. Terse goes one step further for chat answers only, in plain English with normal
grammar. See [references.md](references.md), "Terse answers". To make it permanent, use the project-rule skill.

## Done when
- [ ] The plan ran, and every skipped file was named with its reason.
- [ ] No file in `sources/`, `outputs/`, a protected or versioned file, a generated file or a user-facing file was
  compressed.
- [ ] A verified backup exists in `.cache/compress/<stamp>/`.
- [ ] `compress-guard.mjs check` passed on that backup folder, and every warning was reviewed.
- [ ] `node tools/writing-check.mjs` passes on each changed file, and `node tools/audit.mjs` passes.
- [ ] The answer gives measured sizes, the backup folder and the restore command, and claims no unmeasured savings.

## Pitfalls
- **A lost "not".** Dropping one negation inverts a rule and saves one word. Clarity always beats length.
- **Frontmatter is routing.** The description and triggers decide when a skill is used. Change them only on purpose,
  as a separate edit, never as part of a compression.
- **Generated copies.** Compressing a generated skill or mirror is undone at the next sync. Compress the source.
- **Tables read by tools.** `docs/checks/` tables carry tags that the audit parses. Leave the cells alone.
- **Invented short forms.** "cfg" or "impl" saves almost nothing and slows reading. Common acronyms (API, URL) are fine.
- **Over-dense rules.** A rule an agent misreads costs more than the words saved. If a fragment can be read two ways,
  write the sentence.
- **Merged examples.** Keep one example where several show the same thing, but keep each one that shows a different
  case.
- **Mixed files.** A file with code and prose: only the prose changes. When unsure whether something is code, leave it.
- **Claims about savings.** Byte counts are not tokens or money. Report what was measured.

Inspired by "caveman-compress" and the related skills in JuliusBrussee/caveman (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
