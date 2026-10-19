---
name: skill-curate
description: Keeps the project's skills and runbooks lean - reviews the ones nobody has used for a while and keeps each with a reason, merges it into a better one, or retires it with the user's OK - and packages a set of skills as a plain, agent-neutral bundle another project, person or AI agent can install. Use when the hooks say SKILL CLEANUP DUE, when the user asks to clean up, prune or tidy skills or runbooks, during sweeps, for menu code E9, and when the user wants to share, package or export skills, or make or customize a plugin.
runbook: docs/playbooks/project.md
---
# Curate skills and runbooks

The project grows skills by itself (runbook-create after new work, skill-harden after 3 uses, skill-learn after a
miss). Curating is the other half: a skill nobody uses costs reading time and can route requests the wrong way.

## 1. List what is due
The SKILL CLEANUP DUE notice names each runbook or skill unused for `pruneAfterDays` days (default 60; override it
in `tools/hooks/config.json`). Usage is in `tools/hooks/state/runbook-usage.json`. Core skills and runbooks are never
due (REQ: skill-prune). For each one, read it, its checks (DIRECTORY.md), and which requests its triggers catch
(`node tools/hooks/selfcheck.mjs --route "<a typical request>"`).

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
Run `node tools/hooks/selfcheck.mjs` and `node tools/audit.mjs`. Both must pass. Log each retirement or merge in
`docs/CHANGELOG.md`, and a merge that changes how requests route in `docs/DECISIONS.md`.

## 4. Share skills as a bundle
When the user wants to hand skills to another project, a teammate or another AI agent, package them as a **bundle**:
a plain folder that any agent able to read SKILL.md files can use.
1. **Pick the set.** Only skills that work together and that the receiver will use. One sound skill beats five rough
   ones.
2. **Lay it out** in `.cache/bundles/<bundle-name>/` (lowercase words joined by hyphens):
   - `skills/<name>/` for each skill, copied whole (SKILL.md, `references`, `scripts`, LICENSE, SOURCE.md);
   - `README.md`: what each skill does, the phrases that start it, what it needs (tools, environment variables,
     connections), a version number starting at 0.1.0, and how to install it (copy the folders into the agent's
     skills folder, or `npx skills add <owner/repo>` once it is in a repository);
   - `LICENSE` for the bundle, chosen by the user. Each third-party skill keeps its own license and SOURCE.md.
3. **Make the copies generic.** Remove this project's paths, people, private facts and rules (AGENTS.md rule 14).
   Name outside tools by their kind ("the issue tracker", "the team chat") and list every such blank in a "Setup"
   table in the README: the blank, what fills it, an example. Paths inside a skill are relative to its own folder.
   Secrets are read from environment variables named in the README, never written in files.
4. **Extras for one agent are optional.** If the user names an agent with its own packaging format (a manifest file,
   a plugin folder), add that on top of the plain layout; never make the bundle depend on it.
5. **Check it:** `node skills/skill-curate/scripts/bundle-check.mjs .cache/bundles/<bundle-name>` must print
   `RESULT: PASS`, with each warning fixed or explained. Run `node tools/writing-check.mjs` on the README and the
   **security-review** skill before it leaves the machine.
6. **Hand it over:** a zip of the folder in `.cache/bundles/`, or a folder the user picks. Uploading, publishing or
   sending it anywhere is an outward action and needs the user's OK in this conversation (AGENTS.md rule 6).

**Receiving a bundle** someone else made is bringing in third-party skills: vet and adopt each with the
**skill-finder** skill. Fill its Setup blanks from what the project already knows (`docs/BRIEF.md`,
`docs/names.json`, `docs/recommended-tools.md`) and ask for the rest in one question. Keep its skill names, so later
versions of the bundle still line up.

## Done when
- [ ] Every item in the notice is kept with a reason, merged, or retired with the user's OK (hook: skill-prune).
- [ ] No trigger was lost in a merge: the requests the old one caught still route (judgment: which requests the old one caught needs a person to list).
- [ ] Tests and audit pass (hooks: audit-run, hooks-tested).
- [ ] A shared bundle passes `bundle-check.mjs` and the security-review skill (judgment: no check sees bundle-check run yet; the OK is in the conversation), and leaves the machine only with
      the user's OK.

## Scripts
- `node skills/skill-curate/scripts/bundle-check.mjs <bundle folder>`: checks a bundle before it is shared (README and
  LICENSE present, each SKILL.md named after its folder with a description, no absolute paths, no likely secrets, no
  broken links, licenses kept for credited skills). Read-only.

The bundle steps in §4 draw on Anthropic's Plugin Management plugin (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
