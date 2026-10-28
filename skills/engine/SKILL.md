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
- [ ] An upgrade's review lines are each decided (hook: upgrade-review).
- [ ] A setting the host refused went to the user as the one line to paste, never written another way (hook: permission-respected).
- [ ] The engine change is its own commit, or the answer says why not (judgment: whether the project wanted a commit).
- [ ] After a removal, the answer says where the backup is and how to put the engine back (judgment: plain wording).
- [ ] The answer ends with a Finished section (hook: finished-summary).
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
