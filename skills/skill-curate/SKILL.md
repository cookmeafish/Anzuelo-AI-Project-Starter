---
name: skill-curate
description: Keeps the project's skills and runbooks lean - reviews the ones nobody has used for a while and keeps each with a reason, merges it into a better one, or retires it with the user's OK - and packages a set of skills as a plain, agent-neutral bundle another project, person or AI agent can install. Use when the hooks say SKILL CLEANUP DUE, when the user asks to clean up, prune or tidy skills or runbooks, during sweeps, for menu code E9, and when the user wants to share, package or export skills, or make or customize a plugin.
runbook: docs/playbooks/project.md
---
# Curate skills and runbooks

A skill nobody uses costs reading time and can route requests the wrong way, so unused ones get reviewed.

## 1. List what is due
The SKILL CLEANUP DUE notice names each runbook or skill unused for `pruneAfterDays` days (default 60; override it
in `tools/hooks/config.json`). Usage is in `tools/hooks/state/runbook-usage.json`. Core skills and runbooks are never
due (REQ: skill-prune). For each one, read it, its checks (DIRECTORY.md), and which requests its triggers catch
(`node tools/hooks/selfcheck.mjs --route "<a typical request>"`).

## 2. Decide each one
| Decision | When | Do |
|---|---|---|
| **Keep** | None of the two rows below applies (seasonal or rare work) | Add `keep: YYYY-MM-DD - <reason>` to its frontmatter. The clock restarts |
| **Merge** | `selfcheck.mjs --route` sends most of its typical requests to another runbook or skill | Move its useful steps, pitfalls, triggers and checks into the other one (retiring deletes the checks still tied to it), then retire it |
| **Retire** | Last use older than 2 x `pruneAfterDays`, and no request in `docs/BRIEF.md` matches it | `node tools/skills.mjs retire <name>` |

Show the user the list with a recommendation for each, in one message, and act only on what they confirm. Retiring
deletes the runbook or skill, its generated files, its checks (in `tools/hooks/requirements.json` and the tags in
`docs/checks/rule-enforcement.md`) and its menu codes. Git history keeps the old version, and a library or pack skill
can be enabled again later.

## 3. Verify
Run `node tools/hooks/selfcheck.mjs` and `node tools/audit.mjs`. Both must pass. Log each retirement or merge in
`docs/CHANGELOG.md`, and a merge that changes how requests route in `docs/DECISIONS.md`.

## 4. Share skills as a bundle
To hand skills to another project, a teammate or another AI agent (or to receive a bundle), follow
[bundles.md](bundles.md). `bundle-check.mjs` must print `RESULT: PASS` before a bundle leaves the machine.

## Done when
- [ ] Every item in the notice is kept with a reason, merged, or retired with the user's OK (hook: skill-prune).
- [ ] No trigger was lost in a merge: the requests the old one caught still route (judgment: which requests the old one caught needs a person to list).
- [ ] Tests and audit pass (hooks: audit-run, hooks-tested) (ran: audit.mjs).
- [ ] A shared bundle passes `bundle-check.mjs` (when file: .cache/bundles/**) (ran: bundle-check.mjs).
- [ ] A shared bundle passed the security-review skill and leaves the machine only with the user's OK (judgment: the OK is in the conversation).

## Scripts
- `node skills/skill-curate/scripts/bundle-check.mjs <bundle folder>`: checks a bundle before it is shared (README and
  LICENSE present, each SKILL.md named after its folder with a description, no absolute paths, no likely secrets, no
  broken links, licenses kept for credited skills). Read-only.

The bundle steps (bundles.md) draw on Anthropic's Plugin Management plugin (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
