---
name: project-bootstrap
description: Sets up or re-scopes a project made from the starter - interviews the user about what the project should focus on, installs everything that fits the answers (the knowledge, app and gui packs and the library skills), fills the brief and the security baseline, and creates runbooks with checks for the typical requests. Use in the first session, when SETUP-PROMPT.md exists, when the hooks say SETUP IN PROGRESS or BOOTSTRAP NEEDED, or when the user says "set up this project", "bootstrap", "adopt this folder", or wants to change what the project focuses on.
runbook: docs/playbooks/project.md
---
# Bootstrap or re-scope a project

With `"autonomy": "auto"`: decide, record `Assumed:` lines, and still stop before installing software.

1. **`SETUP-PROMPT.md` exists:** follow it. It is the full procedure, from the interview to verification, including
   an existing project. Delete it only after `node tools/audit.mjs --setup` passes; the hooks deny it earlier
   (REQ: setup-gate).
   With the engine in `.anzuelo/engine/`, setup holds until the user's answer about a private repository for
   `.anzuelo/local/` is recorded (`node .anzuelo/engine/tools/starter.mjs local-repo yes|no`; question 12).
2. **It is gone and the focus changes:**
   - Ask the setup questions again, only for what changed, and wait for the answers before installing anything. The
     questions are in Phase 2 of `SETUP-PROMPT.md`; if it is deleted, restore it from git history (`git log --diff-filter=D
     -- SETUP-PROMPT.md`) or ask what the project is for, what data is sensitive, and which tools it uses.
     Update `docs/BRIEF.md` and the "## Setup interview" section of `docs/DECISIONS.md`, with the date.
   - Install what the new answers call for (project.md §8): knowledge work → `knowledge`, software → `app`, a visual
     interface → `gui`. Never add the app pack to a pure knowledge project.
   - Decide every candidate yourself in the fit checklist (`node tools/fit.mjs`, then `node tools/fit.mjs check` until
     FIT: PASS): each pack, library skill, tool and feature is added, skipped or left for later, with a reason. Show
     the user the one-line summary (`node tools/fit.mjs summary`); ask only about money, privacy or outward actions.
   - Weigh every addition: its gain against its cost, in one plain line of the setup summary (REQ: worth-it).
   - Update `docs/security.md` if the sensitive data or the inputs changed.
   - Route every new typical request to a runbook with a check (runbook-create), and log the change in
     `docs/DECISIONS.md`.
   - Run `node tools/hooks/selfcheck.mjs` and `node tools/audit.mjs`.
3. **Adopting a folder that already had files** (`*.starter.md` exist):
   - Merge the old CLAUDE.md / AGENTS.md rules into the starter's, as dated principles with the reason, each with a
     user-requirements row.
   - Keep the originals as `sources/YYYY-MM-DD original CLAUDE.md` (without the knowledge pack: `docs/sources/YYYY-MM-DD original CLAUDE.md`).
   - Write the merged text to BOTH AGENTS.md and CLAUDE.md, keeping the line that says to "keep the two identical"
     (the hooks only sync files that carry it), then delete the `*.starter.md` files.

## Done when
- [ ] BRIEF and DECISIONS are updated (when file: docs/BRIEF.md) (file: docs/DECISIONS.md)
- [ ] `fit.mjs check` printed FIT: PASS (when file: docs/BRIEF.md) (ran: fit.mjs check)
- [ ] The audit ran after the last change (when file: docs/BRIEF.md) (ran: audit.mjs)
- [ ] An adopted folder has AGENTS.md and CLAUDE.md identical and no `*.starter.md` left (judgment: needs a look at the files)
