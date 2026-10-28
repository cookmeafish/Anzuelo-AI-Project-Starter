---
name: engine
description: Install, upgrade or remove the <!--name:STARTER_NAME-->Anzuelo<!--/name--> engine, and change its hook settings, including when the agent host refuses the change. Use when this runbook's situation comes up (docs/playbooks/engine.md), e.g. the user says: upgrade the engine, upgrade the starter, update the starter, newest starter, new starter release, starter update, install the engine, install the starter, add the starter to, remove the engine, uninstall the engine, take the engine out, uninstall the starter, remove the starter from.
runbook: docs/playbooks/engine.md
generated: true
---
<!-- generated:start from docs/playbooks/engine.md by tools/hooks/hooks.mjs: edit the runbook, not this block -->
# install, upgrade or remove the engine

Open `docs/playbooks/engine.md` and follow every step in order. It is the procedure, and the hooks check its "Done when" list.

## Done when
- [ ] The project's own work was committed before the engine change, and the change is its own commit, or the answer
      says why not (judgment: whether the project keeps git history is the user's call).
- [ ] An install ended with the project-bootstrap skill started in that folder (judgment: setup is its own interview).
- [ ] An upgrade's review lines each end with a decision (hook: upgrade-review).
- [ ] A removal was asked first, and the answer says where the backup is and how to put the engine back (judgment:
      plain wording for the user).
- [ ] A changed setting has its DECISIONS line; one the host refused went to the user as the line to paste, never
      written another way (hook: permission-respected).
- [ ] The answer ends with a Finished section: what changed, each file's path, what was not verified (hook: finished-summary).
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
