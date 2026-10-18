# Directory

**Every agent reads this first.** When something happens or needs doing, find it here and use that runbook or skill.
The numbered sections are generated from the runbooks, skills, checks and knowledge files, so they are always current.
To change a row, edit the file it comes from. The prompt hook routes each message with the same data (`triggers:`).

<!-- generated:start: rebuilt by tools/hooks/hooks.mjs from runbook, skill, check and knowledge files. Edit those, not this block -->
## 1. When this happens or is asked → use this
| When | Runbook (the procedure) | Skill | Checks | Menu |
|---|---|---|---|---|
| Plan multi-step work before starting it, as checkable tasks saved in docs/plans/. Says: make a plan, write a plan, plan this, plan it out, plan first, implementation plan | [plan.md](docs/playbooks/plan.md) | plan | plan-saved, plan-checked | E8 |
| The project itself - new rules, complaints about misses, praise to repeat, sweeps, gaps, runbooks, skills, hooks, packs, status, engine upgrades. Says: clean up skills, prune skills, unused skills, retire a skill, show me the menu, menu codes | [project.md](docs/playbooks/project.md) | project | rule-request, rule-memory, hooks-tested, runbook-complete | E1, E2, E3, E4, E5, E6, E7, E9 |
| Anything else | [_fallback.md](docs/playbooks/_fallback.md), then create a runbook | runbook-create | runbook-exists | |

## 2. Skills
Skills marked "own route" are matched directly by what the request says (the prompt hook prints `SKILL:`); the
others are the skill side of a runbook in §1.

| Skill | What it does and when | Route | Checks |
|---|---|---|---|
| [debug](skills/debug/SKILL.md) | Finds the root cause of a bug, failing test, broken build, wrong output or unexpected behavior before any fix, in four phases (investigate, compare, test one hypothesis, fix at the source with a faili... | own route. Says: debug, debugging, root cause, failing test, tests fail | debug-root-cause |
| [obsidian](skills/obsidian/SKILL.md) | Keeps the project's notes linked to each other so Obsidian's graph shows what is related and what isn't, and the agent can follow the same links. Every note links to its related notes, orphans get con... | own route. Says: obsidian, open in obsidian, graph view, graph, backlinks | note-linked |
| [parallel-agents](skills/parallel-agents/SKILL.md) | Splits work into independent parts and runs one sub-agent per part at the same time, each with a focused, self-contained brief, then checks and merges the results. Use when there are 2 or more tasks t... | own route. Says: in parallel, parallel agents, sub-agents, subagents, fan out | parallel-merged |
| [plan](skills/plan/SKILL.md) | Writes a step-by-step plan for multi-step work before starting it, as small tasks with exact files, interfaces, checks and expected results, so any agent or sub-agent can carry it out without guessing... | via [plan.md](docs/playbooks/plan.md) | see §1 |
| [project](skills/project/SKILL.md) | The project itself - new rules, complaints about misses, praise to repeat, sweeps, gaps, runbooks, skills, hooks, packs, status, engine upgrades. Use when this runbook's situation comes up (docs/playb... | via [project.md](docs/playbooks/project.md) | see §1 |
| [project-bootstrap](skills/project-bootstrap/SKILL.md) | Sets up or re-scopes a project made from the starter - interviews the user about what the project should focus on, installs everything that fits the answers (the knowledge, app and gui packs and the l... | via [project.md](docs/playbooks/project.md) | see §1 |
| [project-rule](skills/project-rule/SKILL.md) | Turns a standing instruction, a complaint, or praise for something to repeat into an enforced project rule - AGENTS.md / CLAUDE.md, a dated user-requirements row, a check in tools/hooks/requirements.j... | via [project.md](docs/playbooks/project.md) | see §1 |
| [project-sweeps](skills/project-sweeps/SKILL.md) | Runs the project's quality sweeps (tools/audit.mjs structure, routing, rules, skills, packs, publish safety, plus the hook self-tests and ablation tests), reports each result, fixes every failure, and... | via [project.md](docs/playbooks/project.md) | see §1 |
| [research](skills/research/SKILL.md) | Get facts right, from the project's own files or from the web. Every fact traces to a source read this turn, research uses several independent sources with sponsored and biased ones screened out and w... | own route. Says: research, research online, look up, look into, look online | research-cited, research-ledger |
| [runbook-create](skills/runbook-create/SKILL.md) | Creates a new runbook in docs/playbooks (or extends the closest one) plus the check that proves it was followed, so a new kind of task becomes a known procedure with its own generated skill and DIRECT... | via [project.md](docs/playbooks/project.md) | see §1 |
| [security-review](skills/security-review/SKILL.md) | Reviews any project, a change or a whole app for security problems (secrets, private data and what is shared, untrusted files and web content, downloads and third-party skills, and for software also i... | own route. Says: security review, security audit, security check, is it secure, is it safe | security-report |
| [session-handoff](skills/session-handoff/SKILL.md) | Updates docs/STATUS.md (Now / Next / Open questions / Blocked) and docs/CHANGELOG.md so a brand-new session can continue the work cold, and answers "where are we" questions from them. Use when substan... | via [project.md](docs/playbooks/project.md) | see §1 |
| [skill-curate](skills/skill-curate/SKILL.md) | Keeps the project's skills and runbooks lean - reviews the ones nobody has used for a while and keeps each with a reason, merges it into a better one, or retires it with the user's OK. Use when the ho... | via [project.md](docs/playbooks/project.md) | see §1 |
| [skill-finder](skills/skill-finder/SKILL.md) | Searches for an existing agent skill that already does a job before a new runbook or skill gets written (installed skills, official skill repos and plugin marketplaces, the open skills CLI and its dir... | own route. Says: find a skill, existing skill, existing skills, is there a skill, install a skill | skill-finder-report |
| [skill-harden](skills/skill-harden/SKILL.md) | Hardens a much-used runbook and its skill - repeated steps become scripts in skills/<name>/scripts, judgment-only "Done when" items become checks, and pitfalls seen so far are written down - then mark... | via [project.md](docs/playbooks/project.md) | see §1 |

## 3. Checks and standards
| File | What it is |
|---|---|
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
| app pack | [checks/app-standards.md](packs/app/files/docs/checks/app-standards.md), [checks/qa-standards.md](packs/app/files/docs/checks/qa-standards.md), [docs/foundation.md](packs/app/files/docs/foundation.md), [docs/lessons.md](packs/app/files/docs/lessons.md), [playbooks/app-foundation.md](packs/app/files/docs/playbooks/app-foundation.md), [playbooks/bugfix.md](packs/app/files/docs/playbooks/bugfix.md), [playbooks/data-change.md](packs/app/files/docs/playbooks/data-change.md), [playbooks/feature.md](packs/app/files/docs/playbooks/feature.md), [playbooks/install-update.md](packs/app/files/docs/playbooks/install-update.md), [playbooks/perf.md](packs/app/files/docs/playbooks/perf.md), [playbooks/qa.md](packs/app/files/docs/playbooks/qa.md), [playbooks/release.md](packs/app/files/docs/playbooks/release.md), [playbooks/security-review.md](packs/app/files/docs/playbooks/security-review.md), [releases/_TEMPLATE.md](packs/app/files/docs/releases/_TEMPLATE.md), [specs/_TEMPLATE.md](packs/app/files/docs/specs/_TEMPLATE.md) |
| gui pack | [checks/visual-review.md](packs/gui/files/docs/checks/visual-review.md), [playbooks/gui.md](packs/gui/files/docs/playbooks/gui.md), [gui-review-loop/SKILL.md](packs/gui/files/skills/gui-review-loop/SKILL.md) |
| knowledge pack | [checks/evidence-standards.md](packs/knowledge/files/docs/checks/evidence-standards.md), [knowledge/README.md](packs/knowledge/files/docs/knowledge/README.md), [knowledge/SOURCES.md](packs/knowledge/files/docs/knowledge/SOURCES.md), [playbooks/deliverable.md](packs/knowledge/files/docs/playbooks/deliverable.md), [playbooks/ingest.md](packs/knowledge/files/docs/playbooks/ingest.md), [inbox/README.md](packs/knowledge/files/inbox/README.md), [outputs/README.md](packs/knowledge/files/outputs/README.md), [knowledge-capture/SKILL.md](packs/knowledge/files/skills/knowledge-capture/SKILL.md), [sources/README.md](packs/knowledge/files/sources/README.md) |
| backend-patterns (library) | [backend-patterns/SKILL.md](library/skills/backend-patterns/SKILL.md), [backend-patterns/SOURCE.md](library/skills/backend-patterns/SOURCE.md), [backend-patterns/references.md](library/skills/backend-patterns/references.md) |
| codebase-map (library) | [codebase-map/SKILL.md](library/skills/codebase-map/SKILL.md), [codebase-map/SOURCE.md](library/skills/codebase-map/SOURCE.md), [codebase-map/references.md](library/skills/codebase-map/references.md) |
| commit-archaeologist (library) | [commit-archaeologist/SKILL.md](library/skills/commit-archaeologist/SKILL.md), [commit-archaeologist/SOURCE.md](library/skills/commit-archaeologist/SOURCE.md), [commit-archaeologist/references.md](library/skills/commit-archaeologist/references.md) |
| compress-for-ai (library) | [compress-for-ai/SKILL.md](library/skills/compress-for-ai/SKILL.md), [compress-for-ai/SOURCE.md](library/skills/compress-for-ai/SOURCE.md), [compress-for-ai/references.md](library/skills/compress-for-ai/references.md) |
| frontend-design (library) | [frontend-design/SKILL.md](library/skills/frontend-design/SKILL.md), [frontend-design/SOURCE.md](library/skills/frontend-design/SOURCE.md), [frontend-design/references.md](library/skills/frontend-design/references.md) |
| mcp-builder (library) | [mcp-builder/SKILL.md](library/skills/mcp-builder/SKILL.md), [mcp-builder/SOURCE.md](library/skills/mcp-builder/SOURCE.md), [mcp-builder/references.md](library/skills/mcp-builder/references.md) |
| orchestrate (library) | [orchestrate/SKILL.md](library/skills/orchestrate/SKILL.md), [orchestrate/SOURCE.md](library/skills/orchestrate/SOURCE.md), [orchestrate/references.md](library/skills/orchestrate/references.md) |
| repo-setup (library) | [repo-setup/SKILL.md](library/skills/repo-setup/SKILL.md), [repo-setup/SOURCE.md](library/skills/repo-setup/SOURCE.md), [repo-setup/references.md](library/skills/repo-setup/references.md) |
| security-hardening (library) | [security-hardening/SKILL.md](library/skills/security-hardening/SKILL.md), [security-hardening/SOURCE.md](library/skills/security-hardening/SOURCE.md), [security-hardening/references.md](library/skills/security-hardening/references.md) |
| teach (library) | [teach/SKILL.md](library/skills/teach/SKILL.md), [teach/references.md](library/skills/teach/references.md) |
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
| `tools/hooks/` | `hooks.mjs` (engine), `requirements.json` (project checks), `config.json`, `test-hooks.mjs`, `git-guard.mjs` | Run the tests after any change |
| `tools/audit.mjs` | Project sweeps | Run after structural changes |
| `tools/writing-check.mjs` | Plain-writing check for any file | Same rules as the hooks |
| `tools/packs.mjs`, `tools/skills.mjs`, `tools/starter.mjs` | Add packs, enable or retire skills, link or upgrade from the starter | See `docs/playbooks/project.md` §7, §8, §10 |
| `.githooks/` | Git hooks: no AI attribution | `git config core.hooksPath .githooks` |
| `.cache/` | Scratch space: screenshots, drafts, temporary output | Never committed. Safe to delete |
