---
name: plan
description: Writes a step-by-step plan for multi-step work before starting it, as small tasks with exact files, interfaces, checks and expected results, so any agent or sub-agent can carry it out without guessing. Use when a spec or request needs several steps, touches several files, or will be handed to sub-agents. Saves to docs/plans/.
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
note when the plan changes.

## 1. One plan per deliverable
Several unrelated parts get several plans. Each plan should end in something that runs, or reads, and can be checked
by itself. Plans that share nothing are candidates for the parallel-agents skill later.

## 2. Decide the shape before the steps
List the files to create or change, each with a one-line job. Most structural mistakes are cheapest to fix here.
- A file does one job behind a clear interface. Prefer several small files to one that keeps growing: an agent can
  hold a small file in view at once, and its edits there go wrong less often.
- Group files by the feature they serve. Code that changes together sits together; a folder per technical layer
  scatters one change across the tree.
- Respect what the project already does and `docs/checks/layout-standards.md`. Don't restructure in passing. When a
  file you must touch has become hard to work in, splitting it is a separate, named task.

## 3. Cut the work into tasks
Make each task small enough that a reviewer can approve it or send it back on its own merits, and complete enough
that it carries its own proof. Draw a line between two tasks only where a reviewer could accept one and reject the
other. Setup, config and docs ride along with the task that needs them, not as tasks of their own.

Inside a task, every step does one thing and says how you'll know it worked. For code the rhythm is test first:
the test, a run that fails, the code, a run that passes, then the record.

## 4. Write it
```markdown
# <Topic>: plan

**Goal:** one sentence.
**Approach:** 2 or 3 sentences.
**Built with:** key tools and libraries (apps) or main sources (knowledge work).
**Spec:** the spec or request this carries out (docs/specs/..., or "request of YYYY-MM-DD"). Read it with the plan.
**How to run:** task by task, ticking each box when its check passes; see the plan skill's references.md.

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
- [ ] 4. Run `<command>`: passes.
- [ ] 5. CHANGELOG line (commit only if the user asked for commits).
```
**Why "Watch for":** a spec describes what the work should do, not every input it will meet. A case the spec doesn't
mention still shouldn't break it. The final review checks each line.

**Why "Uses / provides":** whoever carries out a task may see only that task. This line tells them the exact names
and types the other tasks expect.

**Knowledge work** fits the same frame. The "test" is the bar the result must clear: every claim sourced, the
question actually answered, the file saved in `outputs/`. The steps become gather, record, write, verify.

## 5. How much detail
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

## 6. Check it against the spec
Do this yourself, right after writing, with the spec open as if seeing it for the first time. Fix what you find
directly in the plan; no second round is needed. `node skills/plan/scripts/plan-tasks.mjs check <plan>` catches the
mechanical part (missing sections, steps without a command, placeholders; hook: plan-checked).
1. Every requirement maps to a task. Add a task for any orphan.
2. Every step has one sensible reading, and none carries more than it needs.
3. Names agree everywhere: a function, field or file is spelled the same in every task.
4. Every "Watch for" line has its test in the right task.
5. Proportion: a plan several times longer than its spec, or one that is mostly code, is doing the work.

## 7. Get it approved, then run it
Link the plan and ask the user to look it over before any work starts. If they already said how to run it, just ask
whether the plan captures what they want. Otherwise offer two ways, and recommend one in a sentence (how tangled the
tasks are, how many there are, what a mistake would cost):
- **Supervised, task by task:** a fresh sub-agent per task, an independent check before the next one begins, and one
  review of the whole result at the end. Tasks that share nothing can run side by side (parallel-agents skill).
  Slower and costlier, but safest.
- **Straight through:** you do every task in this session, with one independent review at the end. Quicker and
  cheaper. A detailed plan carries the design, so a mid-level model can do this well.

Then do the work by its own runbook (feature, bugfix, research...), ticking the plan as you go. How to carry out a
plan either way, resume after a break, handle a plan that turns out wrong, and review the result:
[references.md](references.md).

## Done when
- [ ] The plan is saved and linked, and `node skills/plan/scripts/plan-tasks.mjs check` passes or each warning has a
  reason.
- [ ] Every spec requirement maps to a task, and every task ends with a check that has an expected result.
- [ ] The user has reviewed the plan, and the way to run it is agreed, before any work starts.

## Pitfalls
- A plan longer than the work it describes: it has written the work instead of deciding it.
- A name that changes between tasks, so the later task builds against something that doesn't exist.
- Starting the work before the user has reviewed the plan.
- Changing course during the work without a dated note in the plan, so nobody can tell later why the result differs.

## Scripts
- `node skills/plan/scripts/plan-tasks.mjs status <plan>`: each task with its ticked steps, and the first one not
  finished.
- `node skills/plan/scripts/plan-tasks.mjs task <plan> <N>`: the brief for one task (header, constraints, watch-for,
  the task itself), ready to hand to a sub-agent.
- `node skills/plan/scripts/plan-tasks.mjs check <plan>`: the mechanical self-review checks. Read-only.

Inspired by "writing-plans" in obra/superpowers (MIT, see LICENSE and [SOURCE.md](SOURCE.md)).
