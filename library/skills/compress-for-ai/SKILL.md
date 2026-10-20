---
name: compress-for-ai
description: Shortens text that AI agents read so it costs less context, in three modes - AI-facing files (agent rules, skills, runbooks, references, memory notes), notes passed between agents (sub-agent briefs, reports, handoff notes), and terse replies to the user only when the user asks - at three levels (light, full, ultra). User-facing text stays plain English by default. A zero-install protect check proves that no file path, file name, URL, command, flag, code, identifier, number, date, version, quote, name marker, check tag, heading, frontmatter, table, list numbering or negation changed; files also get a verified backup in .cache/ and never include originals, deliverables, generated files, code or config. Use when the user asks to compress, shorten, slim down or make AI-facing text more token-efficient, asks for terse or caveman-style answers, or when a rules file, skill or runbook has grown long and wordy.
triggers: compress the skills, compress this file, compress the rules, compress agents.md, compress claude.md, shorten the runbooks, shorten for the ai, slim down the skills, make it token efficient, token efficient, fewer tokens, too long for the agent, terse answers, terse mode, caveman, caveman mode, talk like a caveman, shorter answers, compress the handoff
---
# Compress for AI: shorter text for agents, nothing lost

Agents reread rules, skills and runbooks and pass notes to each other; every spare word costs context. This skill
changes the wording, never the content. Paths, names, commands, numbers and every "not" survive character for
character, and a script proves it.

Say at the start: "Compressing (compress-for-ai skill, mode A, B or C, level light, full or ultra)." The rewrite
happens in this session; nothing is sent to another model or service.

## Never change, in any mode
These are copied exactly, or the result fails:
- File paths, file and folder names, URLs, link targets, commands and their flags.
- Code, inline and in blocks. Identifiers, config keys, environment variables, error messages.
- Numbers with their units, dates, versions, money, limits and counts.
- Quoted text, names from `docs/names.json` and every `<!--name:KEY-->value<!--/name-->` marker.
- Check tags and markers: `Playbook:`, `Skill:`, `Worth it:`, `REQ:`, `N/A(...)`, `<!-- keep -->` regions.
- Headings (other files link to them), YAML frontmatter, table shape, and list numbering other text refers to.
- Negations ("not", "never", "no", "without") and conditions ("only if", "unless", "except", "until").

Full list and detection: [references.md](references.md), "What the protect check guards".

## Pick the mode
| Mode | What gets shortened | Allowed levels | Proof |
|---|---|---|---|
| **A. AI-facing files** | Rules, runbooks, skills, references, memory notes for agents | light, full | `compress-guard.mjs check` (runs the protect check) |
| **B. Agent-to-agent text** | Sub-agent briefs, reports back, handoff notes and scratch only agents read | briefs: light; reports and notes: full or ultra | `protect-check.mjs` on saved notes, the pre-send check for the rest |
| **C. Replies to the user** | Chat answers, only when the user asks for it | light (default), full, ultra on request | The pre-send check |

Mode C is off by default. Until the user asks for terse answers, everything the user reads follows the plain-writing
rules in `docs/checks/writing-standards.md`.

## Pick the level
Same sentence at each level:
- **Original:** "Before you go ahead and deploy, it's a good idea to make sure that you have run `npm test`, since it will not catch every problem but it will catch most of them."
- **light:** "Run `npm test` before you deploy. It will not catch every problem, but it catches most."
  Full sentences, no filler. Fits any reader.
- **full:** "Run `npm test` before deploy. Will not catch every problem, catches most."
  Fragments and dropped articles, if the order of steps and every negation stay clear.
- **ultra:** "Before deploy: `npm test`. Not every problem, most."
  Each fact once, a word where a word will do. Only for text a person won't read in normal use.

If a shorter version can be read two ways, use the longer one. A misread rule costs more than the words saved.

## Mode A: AI-facing files
### Which files qualify
| AI-facing: may be compressed | User-facing: stays plain English | Never touched |
|---|---|---|
| `AGENTS.md` or `CLAUDE.md` (one of the twins; the hooks copy it to the other) | `README.md`, `HOW-TO-USE.md`, `SETUP-PROMPT.md`, `docs/BRIEF.md`, `docs/MENU.md` | `sources/`, `outputs/`, `inbox/`, `profiles/` |
| `skills/<name>/SKILL.md` and `references.md` (body only) | `docs/STATUS.md`, `docs/CHANGELOG.md`, `docs/DECISIONS.md` | Protected and versioned files from `tools/hooks/config.json` |
| Runbooks in `docs/playbooks/` (their skills are generated from them) | `docs/knowledge/`, `docs/plans/`, reviews, releases | Generated files: `.claude/skills/`, `.agents/`, `.codex/`, `DIRECTORY.md`, `generated: true` skills |
| Prose in `docs/checks/` (tables stay as they are) | Answers, deliverables, HTML pages | `LICENSE`, `SOURCE.md`, code, config, data |
| Memory notes and brief templates for agents | | Files whose names suggest secrets; backups in `.cache/` |

A user-facing file that is too long gets the writing standards: tighter plain English, never the levels above.

### 1. Plan
1. Get the exact files. If the user pastes text instead of naming a file, ask for the file, or offer to save the text
   to a file first. Never answer with a compressed copy plus remarks about it.
2. Run `node skills/compress-for-ai/scripts/compress-guard.mjs plan <files>`. Tell the user which files are skipped
   and why, in one line each.
3. Pick the level per file: **light** by default; **full** only for files no person reads in normal use (skills,
   runbooks, references, memory notes).

### 2. Back up
Run `node skills/compress-for-ai/scripts/compress-guard.mjs backup <files>`. It copies each file byte for byte to
`.cache/compress/<stamp>/` with a `.orig` suffix (so no tool loads it as a live skill), verifies each copy, and prints
the folder. If it refuses or the copy check fails, stop: nothing has changed yet.

### 3. Rewrite the prose
Work file by file; for a file over about 100 KB, one section at a time. The rules are in
[references.md](references.md), "Rewrite rules". In short:
1. **Cut** filler, pleasantries, hedges, wordy phrases ("in order to" becomes "to"), "you should" and "make sure
   to", repeated points, and sentences that only announce or recap.
2. **Keep exactly** everything on the never-change list above.
3. **Keep the shape:** headings and their order, list nesting and numbering, checklist items, table rows and cells.
   Merge bullets only when they state the same fact.
4. **Never add** a heading, a fence, a new fact, an abbreviation of your own, or a comment about the rewrite.
5. Leave any region between `<!-- keep -->` and `<!-- /keep -->` alone.

### 4. Prove nothing was lost
1. Run `node skills/compress-for-ai/scripts/compress-guard.mjs check .cache/compress/<stamp>`. It runs the protect
   check on each file, then also fails on a changed checklist count, leaked commentary, new em dashes, or a file that
   did not get shorter.
2. **On FAIL,** fix only the listed problems, copying the lost text back from the backup. Don't compress again. After
   2 failed repair rounds, run `node skills/compress-for-ai/scripts/compress-guard.mjs restore .cache/compress/<stamp> <file>`
   and report that file as not compressed.
3. **Read every WARN and NOTE.** A new "not", merged list items and changed line endings can be fine or can change
   meaning. Re-read those spots against the backup.

### 5. Run the project checks
1. `node tools/writing-check.mjs <each changed file>`: files under `docs/` are user-facing to the hooks and must pass.
2. `node tools/audit.mjs`: every path, command and skill name the files mention must still resolve.
3. A compressed runbook regenerates its skill, and a compressed `AGENTS.md` or `CLAUDE.md` syncs its twin. Check both
   happened.
4. Add a line to `docs/CHANGELOG.md`.

### 6. Report
Lead with the result per file: bytes and words before and after, from the check output. These are sizes; token and
cost savings are not measured, so don't claim them. Give the backup folder and the restore command. List skipped
files with the reason.

## Mode B: text only agents read
1. **Briefs to a sub-agent stay at light.** A brief is the other model's input, and research on compressed input
   found worse answers and higher total cost (see [references.md](references.md), "Evidence"). Cut filler, keep
   full sentences, and keep the brief self-contained.
2. **Reports back and handoff notes** may use full or ultra. Ask sub-agents for lines like `path:line: finding` with
   a totals line at the end, and no story of how it was found.
3. **A note saved to a file** (handoff, scratch, a plan only agents use): write it, keep the first draft as
   `<note>.draft` in `.cache/compress/notes/`, shorten it, then run
   `node skills/compress-for-ai/scripts/protect-check.mjs <draft> <note>`. Fix every CHANGED line.
4. **Text that is never saved** (a brief in a tool call): run the pre-send check below before sending.
5. The coordinator's answer to the user follows mode C: plain English unless the user opted in.

## Mode C: terse replies (only when the user asks)
1. **Turn on** only when the user asks for shorter, terser or "caveman" answers. Use light unless the user names full
   or ultra. Say once that it is on, then stop mentioning it.
2. **Stays on** until the user says "normal answers", "stop terse" or similar. To make it the default, use the
   project-rule skill.
3. **Switch to full sentences, then back,** for: a security warning, an irreversible action (confirm it first), steps
   whose order matters, a confused user or a repeated question, and any question you ask the user.
4. **Never terse:** files, commits, PRs, issues, messages to other people, and the **Finished** section, which still
   lists every file changed. The markers line (`Playbook:`, `Skill:`, `Worth it:`) stays exactly as the checks need it.
5. Details and examples: [references.md](references.md), "Terse replies".

## Pre-send check (modes B and C)
1. Every path, name, command, flag, number, version and code span is exactly as in the source.
2. Every "not", "never", "no", "only", "unless" from the long version is still there.
3. No sentence can be read two ways. If one can, write it in full.
4. No opening line about what comes next, no closing recap, no offer of more help.

## Done when
- [ ] The mode and level were named, and mode C was used only because the user asked for it (judgment: no check reads the mode line yet).
- [ ] Mode A: the plan ran, and every skipped file was named with its reason (judgment: whether every skip was named needs the plan output).
- [ ] Mode A: no file in `sources/`, `outputs/`, a protected or versioned file, a generated file or a user-facing file
  was compressed, and a verified backup exists in `.cache/compress/<stamp>/` (hook: compress-verified).
- [ ] The protect check passed for every file compressed (`compress-guard.mjs check` for mode A, `protect-check.mjs`
  for saved mode B notes), and every warning and note was reviewed (hook: compress-verified).
- [ ] Mode A: `node tools/writing-check.mjs` passes on each changed file, and `node tools/audit.mjs` passes (hook: audit-run; judgment: no hook runs writing-check on AI-facing files yet).
- [ ] The answer gives measured sizes, the backup folder and the restore command, and claims no unmeasured savings (judgment: whether a saving was measured needs the run output).

## Pitfalls
- **A lost "not".** Dropping one negation inverts a rule and saves one word. The check counts them per paragraph.
- **A changed path or name.** One wrong character breaks a link, a command or a rename. Never shorten one, not even
  to make a sentence flow.
- **Frontmatter is routing.** The description and triggers decide when a skill is used. Change them only on purpose,
  as a separate edit, never as part of a compression.
- **Generated copies.** Compressing a generated skill or mirror is undone at the next sync. Compress the source.
- **Tables read by tools.** `docs/checks/` tables carry tags that the audit parses. Leave the cells alone.
- **Invented short forms.** "cfg" or "impl" saves almost nothing and slows reading. Common acronyms (API, URL) are fine.
- **Compressed input.** Briefs, prompts and rules are another model's input. Keep them at light or full, never ultra.
- **A PASS is not proof of meaning.** The check matches text patterns. Read the changed spots against the original.
- **Claims about savings.** Byte counts are not tokens or money. Report what was measured.

Inspired by the caveman skills in JuliusBrussee/caveman (Apache-2.0, see LICENSE-caveman and [SOURCE.md](SOURCE.md)).
