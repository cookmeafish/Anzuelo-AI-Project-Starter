---
name: status-lines
description: Turn the "⚓ Anzuelo" lines the user sees on or off, all of them or one kind at a time. Use when this runbook's situation comes up (docs/playbooks/status-lines.md), e.g. the user says: turn off the icons, hide the icons, disable the icons, turn on the icons, show the icons again, too many icons, stop showing the anchor lines, hide the anzuelo lines, turn off the anzuelo lines, show the anzuelo lines, hide the praise line, hide the skill line, quitar los iconos, ocultar los iconos.
runbook: docs/playbooks/status-lines.md
generated: true
---
<!-- generated:start from docs/playbooks/status-lines.md by tools/hooks/hooks.mjs: edit the runbook, not this block -->
# Turn the status lines on or off

Open `docs/playbooks/status-lines.md` and follow every step in order. It is the procedure, and the hooks check its "Done when" list.

## Done when
- [ ] `"userLines"` in tools/hooks/config.json hides exactly the kinds the user named, and keeps the rest as they were
      (judgment: which kinds the user meant needs a reader).
- [ ] The answer says which lines are hidden now and how to bring them back (judgment: plain wording for the user).
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
