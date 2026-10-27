# Directory

**Every agent reads this first.** When something happens or needs doing, find it here and use that runbook or skill.
The numbered sections are generated from the runbooks, skills, checks and knowledge files, so they are always current.
To change a row, edit the file it comes from. The prompt hook routes each message with the same data (`triggers:`).

<!-- generated:start: rebuilt by tools/hooks/hooks.mjs from runbook, skill, check and knowledge files. Edit those, not this block -->
## 1. When this happens or is asked → use this
Open the runbook; its triggers and steps are in the file.

| Runbook | When | Checks | Menu |
|---|---|---|---|
| [plan](docs/playbooks/plan.md) ([skill](skills/plan/SKILL.md)) | Plan multi-step work before starting it, as checkable tasks... | plan-saved, plan-checked | E8 |
| [project](docs/playbooks/project.md) ([skill](skills/project/SKILL.md)) | The project itself - new rules, complaints about misses,... | rule-request, rule-memory, hooks-tested, runbook-complete | E1, E2, E3, E4, E5, E6, E7, E9 |
| [status-lines](docs/playbooks/status-lines.md) ([skill](skills/status-lines/SKILL.md)) | Turn the "⚓ Anzuelo" lines the user sees on or off, all of... | (none) |  |
| [_fallback](docs/playbooks/_fallback.md) | Anything else: do it, then create a runbook (runbook-create) | runbook-exists | |

## 2. Skills
Skills marked "own route" are matched directly by what the request says (the prompt hook prints `SKILL:`); the
others are the skill side of a runbook in §1. What each does and when: its SKILL.md.

| Skill | What it does | Route | Checks |
|---|---|---|---|
| [debug](skills/debug/SKILL.md) | Finds the root cause of a bug, failing test, broken build, wrong... | own route | debug-root-cause, debug-test-added, debug-trigger |
| [efficiency-review](skills/efficiency-review/SKILL.md) | Finds where this project's turns spend time and tokens, from its... | own route | (none) |
| [learn-from-upset](skills/learn-from-upset/SKILL.md) | When the user is upset, annoyed or complains, fixes the miss, says... | via [project.md](docs/playbooks/project.md) | see §1 |
| [obsidian](skills/obsidian/SKILL.md) | Keeps the project's notes linked to each other so Obsidian's graph... | own route | note-linked |
| [parallel-agents](skills/parallel-agents/SKILL.md) | Splits work into independent parts and runs one sub-agent per part... | own route | parallel-merged, parallel-trigger |
| [plan](skills/plan/SKILL.md) | Writes a step-by-step plan for multi-step work before starting it,... | via [plan.md](docs/playbooks/plan.md) | see §1 |
| [project-bootstrap](skills/project-bootstrap/SKILL.md) | Sets up or re-scopes a project made from the starter - interviews... | via [project.md](docs/playbooks/project.md) | see §1 |
| [project-rule](skills/project-rule/SKILL.md) | Turns a standing instruction, a complaint, or praise for something... | via [project.md](docs/playbooks/project.md) | see §1 |
| [project-sweeps](skills/project-sweeps/SKILL.md) | Runs the project's quality sweeps (tools/audit.mjs structure,... | via [project.md](docs/playbooks/project.md) | see §1 |
| [research](skills/research/SKILL.md) | Get facts right, from the project's own files or from the web | own route | research-cited, research-ledger |
| [runbook-create](skills/runbook-create/SKILL.md) | Creates a new runbook in docs/playbooks (or extends the closest... | via [project.md](docs/playbooks/project.md) | see §1 |
| [security-review](skills/security-review/SKILL.md) | Reviews any project, a change or a whole app for security problems... | own route | security-report, security-logged, security-code, security-config, security-publish |
| [session-handoff](skills/session-handoff/SKILL.md) | Keeps docs/STATUS.md (Now / Next / Open questions / Blocked) and... | via [project.md](docs/playbooks/project.md) | see §1 |
| [skill-curate](skills/skill-curate/SKILL.md) | Keeps the project's skills and runbooks lean - reviews the ones... | via [project.md](docs/playbooks/project.md) | see §1 |
| [skill-finder](skills/skill-finder/SKILL.md) | Searches for an existing agent skill that already does a job before... | own route | skill-finder-report, skill-compared |
| [skill-harden](skills/skill-harden/SKILL.md) | Hardens a much-used runbook and its skill - repeated steps become... | via [project.md](docs/playbooks/project.md) | see §1 |

## 3. Checks and standards
| File | What it is |
|---|---|
| [better-or-worse.md](docs/checks/better-or-worse.md) | Better or worse? |
| [finish-checklist.md](docs/checks/finish-checklist.md) | Finish checklist (before every answer that did real work) |
| [layout-standards.md](docs/checks/layout-standards.md) | Layout standards (where things go) |
| [rule-enforcement.md](docs/checks/rule-enforcement.md) | Rule → check → enforcement (keep this complete) |
| [runbook-standards.md](docs/checks/runbook-standards.md) | Runbook, skill and check standards |
| [session-checklist.md](docs/checks/session-checklist.md) | Session checklist (injected at session start and after compaction; full rules in AGENTS.md / CLAUDE.md) |
| [user-requirements.md](docs/checks/user-requirements.md) | The user's requirements → where each is enforced (keep this complete) |
| [writing-standards.md](docs/checks/writing-standards.md) | Writing standards (everything the user reads) |

## 5. What this starter can add (packs and library skills)
| Pack or skill | Files |
|---|---|
| app pack | [checks/app-standards.md](packs/app/files/docs/checks/app-standards.md), [checks/qa-standards.md](packs/app/files/docs/checks/qa-standards.md), [docs/foundation.md](packs/app/files/docs/foundation.md), [docs/lessons.md](packs/app/files/docs/lessons.md), [playbooks/app-foundation.md](packs/app/files/docs/playbooks/app-foundation.md), [playbooks/bugfix.md](packs/app/files/docs/playbooks/bugfix.md), [playbooks/data-change.md](packs/app/files/docs/playbooks/data-change.md), [playbooks/feature.md](packs/app/files/docs/playbooks/feature.md), [playbooks/install-update.md](packs/app/files/docs/playbooks/install-update.md), [playbooks/perf.md](packs/app/files/docs/playbooks/perf.md), [playbooks/qa.md](packs/app/files/docs/playbooks/qa.md), [playbooks/release.md](packs/app/files/docs/playbooks/release.md), [playbooks/security-review.md](packs/app/files/docs/playbooks/security-review.md), [releases/_TEMPLATE.md](packs/app/files/docs/releases/_TEMPLATE.md), [specs/_TEMPLATE.md](packs/app/files/docs/specs/_TEMPLATE.md), [modular-code/SKILL.md](packs/app/files/skills/modular-code/SKILL.md) |
| gui pack | [checks/visual-review.md](packs/gui/files/docs/checks/visual-review.md), [playbooks/gui.md](packs/gui/files/docs/playbooks/gui.md), [gui-review-loop/SKILL.md](packs/gui/files/skills/gui-review-loop/SKILL.md) |
| knowledge pack | [checks/evidence-standards.md](packs/knowledge/files/docs/checks/evidence-standards.md), [knowledge/README.md](packs/knowledge/files/docs/knowledge/README.md), [knowledge/SOURCES.md](packs/knowledge/files/docs/knowledge/SOURCES.md), [playbooks/deliverable.md](packs/knowledge/files/docs/playbooks/deliverable.md), [playbooks/ingest.md](packs/knowledge/files/docs/playbooks/ingest.md), [inbox/README.md](packs/knowledge/files/inbox/README.md), [outputs/README.md](packs/knowledge/files/outputs/README.md), [knowledge-capture/SKILL.md](packs/knowledge/files/skills/knowledge-capture/SKILL.md), [sources/README.md](packs/knowledge/files/sources/README.md) |
| architecture (library) | [architecture/SKILL.md](library/skills/architecture/SKILL.md), [architecture/SOURCE.md](library/skills/architecture/SOURCE.md), [architecture/references.md](library/skills/architecture/references.md) |
| backend-patterns (library) | [backend-patterns/SKILL.md](library/skills/backend-patterns/SKILL.md), [backend-patterns/SOURCE.md](library/skills/backend-patterns/SOURCE.md), [backend-patterns/references.md](library/skills/backend-patterns/references.md) |
| codebase-map (library) | [codebase-map/SKILL.md](library/skills/codebase-map/SKILL.md), [codebase-map/SOURCE.md](library/skills/codebase-map/SOURCE.md), [codebase-map/references.md](library/skills/codebase-map/references.md) |
| commit-archaeologist (library) | [commit-archaeologist/SKILL.md](library/skills/commit-archaeologist/SKILL.md), [commit-archaeologist/SOURCE.md](library/skills/commit-archaeologist/SOURCE.md), [commit-archaeologist/references.md](library/skills/commit-archaeologist/references.md) |
| compress-for-ai (library) | [compress-for-ai/SKILL.md](library/skills/compress-for-ai/SKILL.md), [compress-for-ai/SOURCE.md](library/skills/compress-for-ai/SOURCE.md), [compress-for-ai/references.md](library/skills/compress-for-ai/references.md) |
| correspondence (library) | [correspondence/SKILL.md](library/skills/correspondence/SKILL.md) |
| data-analysis (library) | [data-analysis/SKILL.md](library/skills/data-analysis/SKILL.md), [data-analysis/SOURCE.md](library/skills/data-analysis/SOURCE.md), [data-analysis/references.md](library/skills/data-analysis/references.md) |
| data-pipeline (library) | [data-pipeline/SKILL.md](library/skills/data-pipeline/SKILL.md) |
| dependency-update (library) | [dependency-update/SKILL.md](library/skills/dependency-update/SKILL.md), [dependency-update/references.md](library/skills/dependency-update/references.md) |
| frontend-design (library) | [frontend-design/SKILL.md](library/skills/frontend-design/SKILL.md), [frontend-design/SOURCE.md](library/skills/frontend-design/SOURCE.md), [frontend-design/references.md](library/skills/frontend-design/references.md), [frontend-design/templates.md](library/skills/frontend-design/templates.md) |
| game-dev (library) | [game-dev/SKILL.md](library/skills/game-dev/SKILL.md), [game-dev/references.md](library/skills/game-dev/references.md) |
| incident-response (library) | [incident-response/SKILL.md](library/skills/incident-response/SKILL.md), [incident-response/SOURCE.md](library/skills/incident-response/SOURCE.md), [incident-response/references.md](library/skills/incident-response/references.md) |
| legal-review (library) | [legal-review/SKILL.md](library/skills/legal-review/SKILL.md), [legal-review/SOURCE.md](library/skills/legal-review/SOURCE.md), [legal-review/references.md](library/skills/legal-review/references.md), [sections/a.md](library/skills/legal-review/sections/a.md), [sections/b.md](library/skills/legal-review/sections/b.md), [sections/c.md](library/skills/legal-review/sections/c.md), [sections/d.md](library/skills/legal-review/sections/d.md), [sections/e.md](library/skills/legal-review/sections/e.md), [sections/f.md](library/skills/legal-review/sections/f.md), [sections/g.md](library/skills/legal-review/sections/g.md), [sections/h.md](library/skills/legal-review/sections/h.md), [sections/i.md](library/skills/legal-review/sections/i.md) |
| manuscript (library) | [manuscript/SKILL.md](library/skills/manuscript/SKILL.md) |
| marketing (library) | [marketing/SKILL.md](library/skills/marketing/SKILL.md), [marketing/SOURCE.md](library/skills/marketing/SOURCE.md), [marketing/references.md](library/skills/marketing/references.md) |
| mcp-builder (library) | [mcp-builder/SKILL.md](library/skills/mcp-builder/SKILL.md), [mcp-builder/SOURCE.md](library/skills/mcp-builder/SOURCE.md), [mcp-builder/references.md](library/skills/mcp-builder/references.md) |
| ml-experiments (library) | [ml-experiments/SKILL.md](library/skills/ml-experiments/SKILL.md), [ml-experiments/references.md](library/skills/ml-experiments/references.md) |
| mobile-app (library) | [mobile-app/SKILL.md](library/skills/mobile-app/SKILL.md), [mobile-app/references.md](library/skills/mobile-app/references.md) |
| notes-vault (library) | [notes-vault/SKILL.md](library/skills/notes-vault/SKILL.md) |
| orchestrate (library) | [orchestrate/SKILL.md](library/skills/orchestrate/SKILL.md), [orchestrate/SOURCE.md](library/skills/orchestrate/SOURCE.md), [orchestrate/references.md](library/skills/orchestrate/references.md) |
| package-release (library) | [package-release/SKILL.md](library/skills/package-release/SKILL.md) |
| repo-setup (library) | [repo-setup/SKILL.md](library/skills/repo-setup/SKILL.md), [repo-setup/SOURCE.md](library/skills/repo-setup/SOURCE.md), [repo-setup/references.md](library/skills/repo-setup/references.md) |
| routines (library) | [routines/SKILL.md](library/skills/routines/SKILL.md) |
| security-hardening (library) | [security-hardening/SKILL.md](library/skills/security-hardening/SKILL.md), [security-hardening/SOURCE.md](library/skills/security-hardening/SOURCE.md), [security-hardening/references.md](library/skills/security-hardening/references.md) |
| teach (library) | [teach/SKILL.md](library/skills/teach/SKILL.md), [teach/references.md](library/skills/teach/references.md) |
| user-research (library) | [user-research/SKILL.md](library/skills/user-research/SKILL.md), [user-research/SOURCE.md](library/skills/user-research/SOURCE.md), [user-research/references.md](library/skills/user-research/references.md) |
| web-app-patterns (library) | [web-app-patterns/SKILL.md](library/skills/web-app-patterns/SKILL.md), [web-app-patterns/references.md](library/skills/web-app-patterns/references.md) |
<!-- generated:end -->

## Precedence when several runbooks fit
<!-- One line each. Add a line whenever two runbooks overlap. -->
- The project itself (a rule, a complaint, hooks, sweeps) → `project.md` first, then redo the original task by its own runbook.
- Files handed over with a question → ingest them first (if the project has `ingest.md`), then answer.
- The result becomes a file someone will use or share → finish with the runbook that makes deliverables.

## Where things live
| Path | What | Rule |
|---|---|---|
| `AGENTS.md` = `CLAUDE.md` | The rules for every agent | Twins, kept identical by the hooks |
| `README.md`, `HOW-TO-USE.md` | What the project is, and how to use it | For people |
| `DIRECTORY.md` | This map | The numbered sections are generated |
| `SETUP-PROMPT.md` | Builds the project from the ground up | Deleted only when setup is verified (hook-gated) |
| `docs/BRIEF.md` | Purpose, scope, audience, constraints, preferences | Changed only with the user |
| `docs/STATUS.md` | Now / Next / Open questions / Blocked | Updated after real work |
| `docs/DECISIONS.md` | Decision log, and the setup interview answers | Date, decision, why, what would reopen it |
| `docs/security.md` | Security baseline: what is protected, from whom, and the rules | Set during setup, changed only with the user |
| `docs/CHANGELOG.md` | What changed in the project | One dated line per change |
| [docs/MENU.md](docs/MENU.md) | Optional short codes for common requests | A code means exactly its "Means" column |
| `docs/playbooks/` | Runbooks: the procedures | Each one has a skill and a check |
| `docs/checks/` | Checklists and standards | `rule-enforcement.md` maps rules to checks |
| `docs/plans/` | Plans for multi-step work | One file per plan, written with the plan skill |
| `skills/` | Skills in the open SKILL.md format, for any agent | Mirrored to `.claude/skills/` automatically. Edit here, never in the mirror |
| `tools/hooks/` | `hooks.mjs` (engine), `requirements.json` (project checks), `config.json`, `selfcheck.mjs`, `git-guard.mjs` | Run the tests after any change |
| `tools/audit.mjs` | Project sweeps | Run after structural changes |
| `tools/writing-check.mjs` | Plain-writing check for any file | Same rules as the hooks |
| `tools/packs.mjs`, `tools/skills.mjs`, `tools/starter.mjs` | Add packs, enable or retire skills, link or upgrade from the starter | See `docs/playbooks/project.md` §7, §8, §10 |
| `.githooks/` | Git hooks: no AI attribution | `git config core.hooksPath .githooks` |
| `.cache/` | Scratch space: screenshots, drafts, temporary output | Never committed. Safe to delete |
