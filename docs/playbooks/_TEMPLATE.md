---
name: <kebab-case-name>
summary: <one line: what this runbook does>
triggers: <phrase the user says>, <another phrase>, <a third>
trigger_regex:
menu:
checks:
---
# Playbook: <Title>

**Use when:** <the situations this covers>. **Not when:** <neighbouring cases → which runbook instead>.

## Inputs
- What to gather first (files, facts from docs/knowledge, the user's constraints from docs/BRIEF.md).
- What to ask the user ONLY if it is missing and matters (one focused question).

## Steps
1. <First step: exact files, tools and commands.>
2. <Next step.>
   - If <branch condition>: <what to do instead>.
3. Record what was learned (knowledge pack: knowledge-capture skill) and anything decided (docs/DECISIONS.md).
4. Run the finish checklist (`docs/checks/finish-checklist.md`).

## Done when
- [ ] <Observable check. Add it to tools/hooks/requirements.json when it can be checked automatically.>
- [ ] The answer names this playbook and ends with a Finished section.

## Pitfalls
<!-- Mistakes made before: date, what went wrong and why, in general terms. -->
- (none yet)
