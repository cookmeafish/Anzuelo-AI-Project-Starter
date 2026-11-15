---
name: plan
summary: Plan multi-step work before starting it, as checkable tasks saved in docs/plans/
triggers: make a plan, write a plan, plan this, plan it out, plan first, implementation plan, step by step plan, break this down, how should we build, resume the plan, continue the plan, carry out the plan, execute the plan, open plans, product requirements prompt, implementation blueprint, plan the, roadmap, lay out the steps, into tasks
trigger_regex: \bwhat order (should|do|shall|can) we\b|\bin (what|which) order\b.*\b(plan|tasks)\b|\bmap out (how|what|the|a)\b|\bpick up where\b
menu: E8
skill: skills/plan/SKILL.md
---
# Playbook: plan before multi-step work

**Use when:** the user asks for a plan, or the work needs several steps, files or sub-agents. Also when a turn
will add 5 or more new files, an open plan waits to be resumed or closed, or the user wants the work run without
check-ins (plan skill, step 9). **Not when:** a one-step change or a quick question: do it by its own runbook.

## Inputs
- The spec or request, earlier decisions (`docs/DECISIONS.md`) and preferences (AGENTS.md).
- The files involved, the patterns already there, and the project's check commands (`docs/plans/README.md`).

## Steps
1. Follow the **plan** skill (`skills/plan/SKILL.md`): check scope, settle open questions first (one question at a
   time, or a throwaway spike), gather the context and the check commands, map the files, size the tasks, write the
   plan with its status line and "How to resume" line, review it and score it. **A new feature** (screen, mode,
   flow, setting or integration; not a bug fix) gets a `## User journey` section before its tasks: run fresh
   sub-agents in parallel (parallel-agents skill), none shown the code or each other, each given the request, the
   brief and the current screens and one angle: first-time user, returning user with real and old saved data, what
   can go wrong (errors, empty, offline, slow, a missing provider, a mistaken click, undo, cost); for a new mode or
   flow also phone/touch, keyboard/accessibility, and a power user switching modes daily. Merge their lists into one,
   deduped, each item tagged with its angle. The tasks follow that list, and the build ends with a fresh agent walking
   the app against every item (`# Journey walk` in `docs/reviews/`, each pass, fail or missing; fails fixed).
2. Save it to `docs/plans/YYYY-MM-DD-<topic>.md` ([how plans are kept](../plans/README.md)) and run
   `node skills/plan/scripts/plan-tasks.mjs check <plan>`.
3. Link it and ask the user to review it before any work starts. Offer the two ways to run it (supervised task by
   task, or straight through), with a recommendation. With `"autonomy": "auto"` (or "keep going, don't ask me") skip
   the review: run it straight through and record each choice as `Assumed: <choice> - <why> - <cost if wrong>`.
4. Once approved, do the work by its own runbook (feature, bugfix, research...), ticking the plan's checkboxes as
   steps finish (`plan-tasks.mjs next <plan>` shows where to continue).
5. Keep the plan's `status:` line true (values in `docs/plans/README.md`): `open` while work remains, `blocked - <reason>`
   when stuck on the user, and when every box is ticked and every check passes, `done` (or `dropped - <why>`).

## Done when
- [ ] The plan is saved in `docs/plans/` and linked in the answer (hook: plan-saved) (file: docs/plans/*.md).
- [ ] Every requirement in the spec maps to a task, and every task ends with a check (hook: plan-checked for the checks; judgment: whether every spec item is covered).
- [ ] A new feature's plan has a `## User journey` section merged from 3 or more named angles, and its build a `# Journey walk` report (judgment: whether the work is a new feature; the end check holds a new one without both).
- [ ] `plan-tasks.mjs check` passed on the saved plan (ran: plan-tasks\.mjs check) (when file: docs/plans/*.md).
- [ ] A finished or abandoned plan carries `status: done` or `status: dropped - <why>` (hook: plan-open announces it at each session start until closed; judgment: only the person running it knows it is finished or dropped).

## Pitfalls
- A plan longer than the work it describes: it has written the work instead of deciding it.
- Starting the work before the user has reviewed the plan.
- A finished plan left open, so every new session reports it again.
