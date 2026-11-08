---
name: project
description: The project itself - new rules, complaints about misses, praise to repeat, sweeps, gaps, runbooks, skills, hooks, packs, status. Use when this runbook's situation comes up (docs/playbooks/project.md), e.g. the user says: clean up skills, prune skills, unused skills, retire a skill, show me the menu, menu codes, set up this project, enable a skill, remove a skill, library skills, update the project, update this project, from now on, new rule.
runbook: docs/playbooks/project.md
generated: true
---
<!-- generated:start from docs/playbooks/project.md by tools/hooks/hooks.mjs: edit the runbook, not this block -->
# the project itself

Open `docs/playbooks/project.md` and follow every step in order. It is the procedure, and the hooks check its "Done when" list.

## Done when
- [ ] Rule requests: AGENTS/CLAUDE + user-requirements + rule-enforcement + a check (or hook: N/A) + memory; tests and audit PASS (hook: rule-request, rule-memory, hooks-tested, audit-run) (when file: docs/checks/user-requirements.md).
- [ ] The original miss behind a complaint is fixed, not just prevented (judgment: whether the miss itself is fixed needs a look at the result).
- [ ] Rule requests: every file was searched for wording or behavior that says the opposite, each hit fixed or kept with a reason, and the answer says how many (judgment: what counts as the opposite needs a reader).
- [ ] Skills added or removed: each one belongs to a runbook or has its own triggers and a check (hook: skill-complete).
- [ ] Skills due for cleanup: each kept with a reason, merged, or retired with the user's OK (skill-curate; hook: skill-prune).
- [ ] CHANGELOG updated; Finished section (hooks: changelog, finished-summary) (file: docs/CHANGELOG.md).
- [ ] The audit ran after a pack or skill was installed, enabled, added or disabled (ran: audit\.mjs) (when ran: packs\.mjs install|skills\.mjs enable|skills\.mjs disable|skills\.mjs add).
- [ ] A skill decision is recorded in the fit checklist (file: docs/fit-checklist.md) (when ran: fit\.mjs decide).
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
