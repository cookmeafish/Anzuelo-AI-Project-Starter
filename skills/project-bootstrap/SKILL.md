---
name: project-bootstrap
description: Sets up or re-scopes a project made from the starter - interviews the user about what the project should focus on, installs everything that fits the answers (the knowledge, app and gui packs and the library skills), fills the brief and the security baseline, and creates runbooks with checks for the typical requests. Use in the first session, when SETUP-PROMPT.md exists, when the hooks say SETUP IN PROGRESS or BOOTSTRAP NEEDED, or when the user says "set up this project", "bootstrap", "adopt this folder", or wants to change what the project focuses on.
runbook: docs/playbooks/project.md
---
# Bootstrap or re-scope a project

1. **`SETUP-PROMPT.md` exists:** follow it. It is the full procedure, from the interview to verification, including
   an existing project. Delete it only after `node tools/audit.mjs --setup` passes; the hooks deny it earlier
   (REQ: setup-gate).
2. **It is gone and the focus changes:**
   - Ask the setup questions again, only for what changed, and wait for the answers before installing anything.
     Update `docs/BRIEF.md` and the "## Setup interview" section of `docs/DECISIONS.md`, with the date.
   - Install what the new answers call for (project.md §8): knowledge work → `knowledge`, software → `app`, a visual
     interface → `gui`. Never add the app pack to a pure knowledge project.
   - List the library skills (`node tools/skills.mjs library`). Enable each one that fits, or record the user's reason
     for leaving it out in the Setup interview section.
   - Give every addition a `Worth it: <gain> / <cost>` line (REQ: worth-it).
   - Update `docs/security.md` if the sensitive data or the inputs changed.
   - Route every new typical request to a runbook with a check (runbook-create), and log the change in
     `docs/DECISIONS.md`.
   - Run `node tools/hooks/test-hooks.mjs` and `node tools/audit.mjs`.
3. **Adopting a folder that already had files** (`*.starter.md` exist):
   - Merge the old CLAUDE.md / AGENTS.md rules into the starter's, as dated principles with the reason, each with a
     user-requirements row.
   - Keep the originals as `sources/YYYY-MM-DD original CLAUDE.md` (or in `docs/` without the knowledge pack).
   - Write the merged text to BOTH AGENTS.md and CLAUDE.md, keeping the line that says they "are twins" (the hooks only
     sync files that carry it), then delete the `*.starter.md` files.
