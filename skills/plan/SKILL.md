---
name: plan
description: Writes a step-by-step plan for multi-step work before starting it, as small tasks with exact files, interfaces, checks and expected results, plus the project context a newcomer needs and a confidence score, so any agent or sub-agent can carry it out without guessing, and then carries it out box by box. The plan is a checklist file in docs/plans/ that any later session or other AI agent can resume. Use when a spec or request needs several steps, touches several files, adds several new files, or will be handed to sub-agents, and when asked to carry out, resume or close an existing plan.
---
# Plan before multi-step work

A plan is a record of decisions. Picture the reader as a capable stranger: they know the language and the tools, and
they'll make good calls on anything left open. They can't read your mind, though. They don't know which files you
chose, what things are called, which numbers came from the spec, or how to tell that a task is finished. Write those
down. Leave out everything they would get right anyway.

Three habits run through every plan: build only what the spec asks for, keep one copy of each piece of logic, and
prove each step with a test before moving on.

Open with "Planning first (plan skill)." Save the plan as `docs/plans/YYYY-MM-DD-<topic>.md` (hook: plan-saved), or
where the user has asked plans to go. It stays a working document: tick each box as the work lands, and add a dated
note when the plan changes. The file is the only memory that survives: a new session, a context reset or a different
AI agent continues from the boxes, not from anyone's recollection ([how plans are kept](../../docs/plans/README.md)).

## 0. Settle the request before planning
A plan built on a guess gets carried out faithfully, guess and all. When the request is vague or large, close the
open questions first.
1. **Interview, one question at a time.** List the decisions the plan depends on (scope, users, data, limits, what
   "done" looks like), then ask about the one that blocks the most. Wait for the answer, then ask the next. Keep going
   until no branch of the work is left open. Each question follows "Questions with choices" in
   `docs/checks/writing-standards.md`: what is decided and why, plain options with costs, a recommendation, and "Let
   the AI decide". Answer from the project's own files first and ask only what they don't settle.
2. **Skip the interview** when the request is already specific (it names the result, the scope and how to check it),
   or when `"autonomy": "auto"` is set in `tools/hooks/config.json`. Then write each decision you made under an
   **Assumptions:** line in the plan header, so the user can correct it at review.
3. **Spike when one design question can't be settled by talking.** Build the smallest throwaway prototype that
   answers it (does the library do X, is this fast enough, which layout reads better), in `.cache/spikes/<topic>/`,
   never in the real code. Record the question, the answer and the evidence in the plan's "Context", then delete the
   spike. The real work starts from the plan, never by copying spike code.

## 1. One plan per deliverable
Several unrelated parts get several plans. Each plan should end in something that runs, or reads, and can be checked
by itself. Plans that share nothing are candidates for the parallel-agents skill later.

## 2. Gather what the builder will need
Collect it now, while you have the project open, so the builder doesn't have to rediscover it. It goes in the plan's
"Context" and "Checks" sections.
1. **Look for the nearest example.** Search the project for a feature that already does something similar, and for the
   tests that cover it. Note each file with one line on why it matters. Copying an existing pattern beats inventing one.
2. **Collect the traps.** Rules in AGENTS.md and the docs the spec touches, library quirks, limits, versions. For an
   outside library or service, note the documentation page and the exact section, not just the site.
3. **Find the real check commands.** Look in this order: the CI workflow, task-runner targets (Makefile and the like),
   package scripts, then the README. Prefer the commands the project already declares: then the plan and the build
   server test the same things. A kind of check the project lacks is left out, never made up. Projects without tests (documents, content,
   config) use the checks they do have: a format or schema validator, a build, a link check,
   `node tools/writing-check.mjs`, and a review against the plan's "Done when". Ask the user only when nothing in the
   project names a command.
4. **Reuse what earlier plans found.** `docs/plans/README.md` keeps the project's check commands under "Checks for
   this project". Copy them; if the list is empty or wrong, fix it there once.

## 3. Decide the shape before the steps
List the files to create or change, each with a one-line job. Most structural mistakes are cheapest to fix here.
- A file does one job behind a clear interface. Prefer several small files to one that keeps growing: an agent can
  hold a small file in view at once, and its edits there go wrong less often.
- Group files by the feature they serve. Code that changes together sits together; a folder per technical layer
  scatters one change across the tree.
- Name the places the work plugs in: settings or config, entry points (routes, commands, menus, an index file), and
  any stored data that changes shape (a migration). These are the edits most often forgotten.
- Respect what the project already does and `docs/checks/layout-standards.md`. Don't restructure in passing. When a
  file you must touch has become hard to work in, splitting it is a separate, named task.

## 4. Cut the work into tasks
Make each task small enough that a reviewer can approve it or send it back on its own merits, and complete enough
that it carries its own proof. Draw a line between two tasks only where a reviewer could accept one and reject the
other. Setup, config and docs ride along with the task that needs them, not as tasks of their own.

Inside a task, every step does one thing and says how you'll know it worked. For code the rhythm is test first:
the test, a run that fails, the code, a run that passes, then the record. Every task ends with a step that runs one
of the project's checks by its exact command.

## 5. Write it
```markdown
# <Topic>: plan

status: open
**Goal:** one sentence.
**Done when:** 2 to 4 results a person can see or a command can show.
**Approach:** 2 or 3 sentences.
**Built with:** key tools and libraries (apps) or main sources (knowledge work).
**Spec:** the spec or request this carries out (docs/specs/..., or "request of YYYY-MM-DD"). Read it with the plan.
**Assumptions:** decisions made without asking (only when step 0 skipped the interview), or "none".
**Confidence:** N/10 that a newcomer finishes this in one pass from this file and the repository alone. Main risk: ...
**How to resume:** any session or agent: run `node skills/plan/scripts/plan-tasks.mjs next <this file>`, or find the
first unticked box by hand. Read the dated notes first. Ticked boxes are done; never redo them. When every box is
ticked and the checks pass, change the status line to `status: done`; to stop for good, `status: dropped - <why>`.

## Context
- `path/to/similar/feature`: the pattern to copy, and what to change in it.
- `path/to/tests`: how tests are written here.
- Documentation URL, section: the part that matters.
- Trap: a quirk, limit or project rule a newcomer would trip on.

## Checks for this project
- Style: `<command>`
- Tests, one file: `<command>`; all: `<command>`
- Run it: `<command>`, then what to look at.

## Constraints for every task
One line each, with the exact values copied from the spec: versions, limits, names, wording, platforms, budgets from
docs/foundation.md. Every task must meet them, even where it doesn't repeat them.

## Watch for
Up to five inputs or situations a real user will hit that the spec implies but no task covers yet, most likely
first, each with the behavior a reasonable person expects. Each gets a test in the task that owns that code.
Write "none found" only after looking.

### Task 1: <part>
**Files:** create `path`; change `path` (lines); test `path`.
**Uses / provides:** exact names and signatures taken from earlier tasks and offered to later ones.
- [ ] 1. Test `<name>` asserts <the spec's exact values>.
- [ ] 2. Run `<command>`: fails with "<message>".
- [ ] 3. Implement `<signature>` in `<file>`. Add one line on approach only where the test leaves a real choice.
- [ ] 4. Run `<command>`: passes. Run the style check: no errors.
- [ ] 5. CHANGELOG line (commit only if the user asked for commits).
```
**Why the status line:** it sits at the start of a line, unformatted, so the hooks and any agent can read it. The
session-start hook lists every plan that still has unticked boxes and no `status: done` or `status: dropped` line as
an OPEN PLAN.

**Why "Context":** the builder may be a fresh sub-agent, a different AI agent, or you after a reset. Pointing at the
file to copy and the trap to avoid saves them the search you already did.

**Why "Watch for":** a spec describes what the work should do, not every input it will meet. A case the spec doesn't
mention still shouldn't break it. The final review checks each line.

**Why "Uses / provides":** whoever carries out a task may see only that task. This line tells them the exact names
and types the other tasks expect.

**Knowledge work** fits the same frame. The "test" is the bar the result must clear: every claim sourced, the
question actually answered, the file saved in `outputs/`. The steps become gather, record, write, verify, and the
checks are the writing check, the research skill's checks and a review against "Done when".

## 6. How much detail
Aim for steps with exactly one sensible reading. Clarity is the bar, not completeness.
- **Tests** carry their name and assertions with the real values from the spec.
- **Code steps** carry the signature, the file and any value the spec pins down. The body is left to the
  implementer, unless the algorithm isn't implied by the signature and test, or the spec dictates exact wording.
- **Checks** carry the command and what a passing run prints.
- **Cross-task references** point at the other task's "uses / provides" line rather than repeating it.

The plan has gone wrong in one of two ways when:
- **It decides nothing:** placeholders, "deal with edge cases", "validate input", "add tests", or a name that no
  task defines.
- **It does the work:** it is longer than the code would be. Strip the bodies back to signatures and assertions.

## 7. Check it against the spec
Do this yourself, right after writing, with the spec open as if seeing it for the first time. Fix what you find
directly in the plan; no second round is needed. `node skills/plan/scripts/plan-tasks.mjs check <plan>` catches the
mechanical part (missing sections, steps without a command, placeholders, no status line; hook: plan-checked).
1. Every requirement maps to a task. Add a task for any orphan.
2. Every step has one sensible reading, and none carries more than it needs.
3. Names agree everywhere: a function, field or file is spelled the same in every task.
4. Every "Watch for" line has its test in the right task.
5. Every check command came from the project, and every task runs at least one.
6. Proportion: a plan several times longer than its spec, or one that is mostly code, is doing the work.
7. **Score it.** Could someone with only this file and the repository finish it in one pass? Write the score and the
   main risk on the **Confidence:** line. Below 7, name what is missing, add it to "Context", or ask the user, then
   score again.

## 8. Get it approved, then run it
Link the plan and ask the user to look it over before any work starts. If they already said how to run it, just ask
whether the plan captures what they want. Otherwise offer two ways, and recommend one in a sentence (how tangled the
tasks are, how many there are, what a mistake would cost):
- **Supervised, task by task:** a fresh sub-agent per task, an independent check before the next one begins, and one
  review of the whole result at the end. Tasks that share nothing can run side by side (parallel-agents skill).
  Slower and costlier, but safest.
- **Straight through:** you do every task in this session, with one independent review at the end. Quicker and
  cheaper. A detailed plan carries the design, so a mid-level model can do this well.

Then do the work by its own runbook (feature, bugfix, research...), ticking the plan as you go. In short:
1. `plan-tasks.mjs next <plan>` shows where to start and the brief for that task.
2. Work its steps in order and compare every run with the expected result.
3. Tick each box in the same edit that finishes it, and record any change of course as a dated note.
4. After the last task, run every command under "Checks for this project", re-read "Done when", and set
   `status: done`.

The full procedure (each way of running it, resuming after a break, a plan that turns out wrong, the final review,
closing the plan): [references.md](references.md).

## Done when
- [ ] Open questions were settled before writing: asked one at a time, or written as assumptions (step 0). Any spike
  is deleted and its answer is in "Context".
- [ ] The plan is saved and linked, and `node skills/plan/scripts/plan-tasks.mjs check` passes or each warning has a
  reason.
- [ ] It has a status line, a "How to resume" line, "Context", the project's real check commands and a confidence score.
- [ ] Every spec requirement maps to a task, and every task ends with a check that has an expected result.
- [ ] The user has reviewed the plan, and the way to run it is agreed, before any work starts.
- [ ] Once carried out: every box is ticked, every check passed, and the status line says `status: done` (or
  `status: dropped - <why>`).

## Pitfalls
- A batch of ten questions at once. The user answers the easy ones and the hard ones stay open. Ask one at a time.
- A spike that quietly becomes the product. Spike code skips tests and error handling; delete it.
- A plan longer than the work it describes: it has written the work instead of deciding it.
- A name that changes between tasks, so the later task builds against something that doesn't exist.
- A check command guessed from the stack instead of read from the project. It fails, or worse, passes for the wrong
  reason.
- Starting the work before the user has reviewed the plan.
- Changing course during the work without a dated note in the plan, so nobody can tell later why the result differs.
- Ticking boxes in a batch at the end. A reset in between loses the record, and the next agent redoes finished work.
- A finished plan left without `status: done`, so every new session reports it as open.

## Scripts
- `node skills/plan/scripts/plan-tasks.mjs status <plan>`: each task with its ticked steps, and the first one not
  finished.
- `node skills/plan/scripts/plan-tasks.mjs next <plan>`: the first unticked step and the brief for its task, or how to
  close the plan when nothing is left.
- `node skills/plan/scripts/plan-tasks.mjs task <plan> <N>`: the brief for one task (header, context, checks,
  constraints, watch-for, the task itself), ready to hand to a sub-agent.
- `node skills/plan/scripts/plan-tasks.mjs check <plan>`: the mechanical self-review checks. Read-only.

Inspired by "writing-plans" in obra/superpowers (MIT, see LICENSE) and by PRP Manager by William Wong Garay (MIT, see
LICENSE-prp-manager). Details in [SOURCE.md](SOURCE.md).

Credits: step 0 draws on ideas from "grill-me", "grilling" and "prototype" in mattpocock/skills (MIT) and
"brainstorming" in obra/superpowers (MIT).
