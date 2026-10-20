# Runbook, skill and check standards

Every kind of task the project handles has three parts:

| Part | Where | Who writes it | Job |
|---|---|---|---|
| Runbook | `docs/playbooks/<name>.md` | the agent (runbook-create) | The procedure, in plain markdown any agent can follow |
| Skill | `skills/<name>/SKILL.md` | generated from the runbook (scripts added by skill-harden) | The entry point skill-capable agents trigger automatically. Holds scripts and assets |
| Check | `tools/hooks/requirements.json` | the agent (runbook-create, project-rule) | Proves the runbook was followed. The hooks enforce it |

`DIRECTORY.md` lists all three, generated from the runbook files.

## A good runbook (start from [_TEMPLATE.md](../playbooks/_TEMPLATE.md))
- **Frontmatter:**
  - `name`
  - `summary`: one line
  - `triggers`: short comma-separated phrases people use for this task. Add new phrasings whenever a request was
    missed.
  - `trigger_regex`: optional
  - `menu`: optional code
  - `checks`: only when the checks are not in requirements.json, as `core: <tags>` or `none - <reason>`
  - `hardened`: date, or `harden: never - <reason>`
  - `skill`: only to point at a hand-written skill instead of the generated one
  - `owns`: optional folders this runbook fills itself, as comma-separated globs (`sources/raids/**`). In a turn that
    follows it, another runbook's trigger skips files there (research downloads don't call for ingest); in any other
    turn the trigger still fires
  - `reuse`: only for a procedure no other project could have, as `none - project-specific: <why>` (its own data
    layout, people or tools). It replaces the search for an existing skill (REQ: skill-reuse); anything general still
    gets the search (skill-finder skill).
- **Use when / Not when**, naming which neighbouring runbook takes the other cases.
- **Inputs:** what to gather or ask first. Ask only for what is really needed.
- **## Steps:** numbered, in order, each one checkable. Name the exact files, tools and commands. Branches go inline as
  sub-steps.
- **## Done when:** observable results. Each one that can be checked becomes a requirements.json entry with
  `"when": {"playbookUsed": "<name>"}`. Every item ends with `(hook: <tags>)` or `(judgment: <why no check can tell>)`
  (REQ: done-when-labeled).
- **## Pitfalls:** mistakes made before, dated, each as what went wrong and why, in general terms.
- Short and scannable. Long reference material goes in `docs/checks/` or the skill's `references/` folder, linked.

## Skills that are not a runbook's
Most skills are the skill side of a runbook: generated from it, or a helper that names it with
`runbook: docs/playbooks/<name>.md` in its frontmatter. A skill that stands on its own (debug, research, an enabled
library skill) is a procedure in its own right and follows the same rules:
- `triggers:` in its frontmatter, so the prompt hook can route to it (`SKILL:` hint, REQ: skill-read);
- a check that proves its "Done when": a requirements.json entry with `"when": {"skillUsed": "<name>"}`
  (REQ: skill-complete);
- "Done when" and "Pitfalls" sections, and a test for its check (see "A good check" below).

## Extend or create?
Extend when the new task is a variant of an existing one (same goal, different inputs). Add a branch and the new
trigger phrases. Create when the goal, steps or "Done when" differ. Never leave two runbooks covering the same task.

## A good check (`tools/hooks/requirements.json`)
- `when` is specific: it names the runbook (`playbookUsed`) or a precise prompt pattern. A check that fires on
  unrelated turns teaches everyone to waive it.
- `require` asks for evidence, not promises: a file changed (`filesChanged`), a validator that PASSED (`toolPassed`,
  with `selfRun` so agents without tool history can still be checked), the hook re-running a validator on each
  changed file (`runEach`), or a required answer section (`answerMatches`).
- `message` tells the agent exactly what to do.
- Every new tag gets a test scenario (skipped → blocked, followed → passes) and a row in
  `docs/checks/rule-enforcement.md`. Project tests go in `tools/hooks/project-scenarios.mjs`, which upgrades keep; the
  starter's own go in `tools/hooks/selfcheck.mjs`.

## Event triggers: when what happened makes a runbook or skill mandatory
Some procedures are needed because of what the work did, not what the request said: sign-in code needs the security
review, a fixed test failure needs its root cause, a migration needs a backup plan. Such a check:
- `when` describes the event: `filesChanged` (with `filesIgnore`), `changedContentMatches` (`{files, ignore, pattern}`:
  what this turn added to those files), `toolRan`, `ranFailing` (a matching command failed), `toolCount`, `guiChanged`,
  `promptMatches`, or several of them in `anyOf`.
- `require` is the runbook or skill being followed (`playbookUsed`, `skillUsed`), or its one proof line; `anyOf` lists
  the alternatives.
- `forces: "<runbook or skill>"` names what it makes mandatory, and `hint: "<prompt regex>"` lets the prompt hook say
  `MUST FOLLOW` as soon as the request shows the event coming. Safeguards add `"waiver": "specific"`: a waiver then
  needs a real reason.
- Keep it quiet (hard rule 18): match code constructs, not common words, and ignore engine files and tests.
- Every event trigger gets a row in the matrix in `docs/checks/rule-enforcement.md` ("Event triggers").

## Hardening (skill-harden, due after 3 uses)
- Steps that are the same every time become a script in `skills/<name>/scripts/` (Node, no dependencies, prints
  `RESULT: PASS` or `FAIL`), and the runbook calls it.
- Each "Done when" item that is still judgment-only gets a check if one can be written now.
- Pitfalls seen in the uses so far are written down.
- Generic skills (no project paths, people or facts) are offered as global skills, only with the user's OK.
- When done, set `hardened: YYYY-MM-DD` in the runbook.
