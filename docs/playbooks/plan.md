---
name: plan
summary: Plan multi-step work before starting it, as checkable tasks saved in docs/plans/
triggers: make a plan, write a plan, plan this, plan it out, plan first, implementation plan, step by step plan, break this down, how should we build
menu: E8
skill: skills/plan/SKILL.md
---
# Playbook: plan before multi-step work

**Use when:** the user asks for a plan, or the work needs several steps, several files or several sub-agents. **Not
when:** a one-step change or a quick question. Then just do it by its own runbook.

## Inputs
- The spec or request, earlier decisions (`docs/DECISIONS.md`) and preferences (AGENTS.md).
- The files involved and the patterns already there.

## Steps
1. Follow the **plan** skill (`skills/plan/SKILL.md`): check scope, map the files, size the tasks, write the plan,
   review it yourself.
2. Save it to `docs/plans/YYYY-MM-DD-<topic>.md` ([how plans are kept](../plans/README.md)).
3. Link it and ask the user to review it before any work starts. Offer the two ways to run it (supervised task by
   task, or straight through), with a recommendation.
4. Once approved, do the work by its own runbook (feature, bugfix, research...), ticking the plan's checkboxes as
   tasks finish.

## Done when
- [ ] The plan is saved in `docs/plans/` and linked in the answer (hook: plan-saved).
- [ ] Every requirement in the spec maps to a task, and every task ends with a check.

## Pitfalls
- A plan longer than the work it describes: it has written the work instead of deciding it.
- Starting the work before the user has reviewed the plan.
