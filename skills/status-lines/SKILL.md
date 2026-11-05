---
name: status-lines
description: Turn the "⚓" status lines the user sees on or off, all of them or one kind at a time. Use when this runbook's situation comes up (docs/playbooks/status-lines.md), e.g. the user says: status bar, the bar says, statusline, turn off the icons, hide the icons, disable the icons, turn on the icons, show the icons again, too many icons, stop showing the anchor lines, hide the anzuelo lines, turn off the anzuelo lines, show the anzuelo lines, hide the praise line.
runbook: docs/playbooks/status-lines.md
generated: true
---
<!-- generated:start from docs/playbooks/status-lines.md by tools/hooks/hooks.mjs: edit the runbook, not this block -->
# Turn the status lines on or off

Open `docs/playbooks/status-lines.md` and follow every step in order. It is the procedure, and the hooks check its "Done when" list.

## Done when
- [ ] `"userLines"` in tools/hooks/config.json changed from its old value (git diff shows both) only by what the user
      asked: `false` for all off, `true` for all on, otherwise a `hide` list with exactly the named kinds added or
      removed (judgment: which kinds the user meant needs a reader).
- [ ] The answer says which lines are hidden now and how to bring them back (judgment: plain wording for the user).
- [ ] A change to the status bar (below): its self-test passes and failed before the fix (hook: hooks-tested).
- [ ] A change to the status bar: a sweep over real session logs shows 0 wrong, and the answer gives the count (judgment: the log is the user's, outside the project).
- [ ] A change to the status bar: every other status line (the project's, the user's) still shows first and unchanged, in the status-bar self-test (hook: hooks-tested).
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
