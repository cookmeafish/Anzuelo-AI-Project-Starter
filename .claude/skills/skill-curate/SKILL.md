---
name: skill-curate
description: Keeps the project's skills and runbooks lean - reviews the ones nobody has used for a while and keeps each with a reason, merges it into a better one, or retires it with the user's OK. Use when the hooks say SKILL CLEANUP DUE, when the user asks to clean up, prune or tidy skills or runbooks, during sweeps, or for menu code E9.
runbook: docs/playbooks/project.md
---
# Curate skills and runbooks

The project grows skills by itself (runbook-create after new work, skill-harden after 3 uses, skill-learn after a
miss). Curating is the other half: a skill nobody uses costs reading time and can route requests the wrong way.

## 1. List what is due
The SKILL CLEANUP DUE notice names each runbook or skill unused for `pruneAfterDays` days (default 60; override it
in `tools/hooks/config.json`). Usage is in `tools/hooks/state/runbook-usage.json`. Core skills and runbooks are never
due (REQ: skill-prune). For each one, read it, its checks (DIRECTORY.md), and which requests its triggers catch
(`node tools/hooks/test-hooks.mjs --route "<a typical request>"`).

## 2. Decide each one
| Decision | When | Do |
|---|---|---|
| **Keep** | Still fits the brief, just seasonal or rare | Add `keep: YYYY-MM-DD - <reason>` to its frontmatter. The clock restarts |
| **Merge** | Another runbook or skill covers most of it | Move its useful steps, pitfalls, triggers and checks into the other one (retiring deletes the checks still tied to it), then retire it |
| **Retire** | The work no longer happens, or it never fit | `node tools/skills.mjs retire <name>` |

Show the user the list with a recommendation for each, in one message, and act only on what they confirm. Retiring
deletes the runbook or skill, its generated files, its checks (in `tools/hooks/requirements.json` and the tags in
`docs/checks/rule-enforcement.md`) and its menu codes. Git history keeps the old version, and a library or pack skill
can be enabled again later.

## 3. Verify
Run `node tools/hooks/test-hooks.mjs` and `node tools/audit.mjs`. Both must pass. Log each retirement or merge in
`docs/CHANGELOG.md`, and a merge that changes how requests route in `docs/DECISIONS.md`.

## Done when
- [ ] Every item in the notice is kept with a reason, merged, or retired with the user's OK.
- [ ] No trigger was lost in a merge: the requests the old one caught still route.
- [ ] Tests and audit pass.
