# <!--name:STARTER_NAME-->Anzuelo<!--/name-->: <!--name:STARTER_TAGLINE-->A project starter for AI agents<!--/name-->

Its hooks catch the agent whenever it skips a step, cuts a corner or makes something up.

It works with any agent (Claude Code, Codex, Cursor, Copilot, Gemini and others). Each project enforces its own way
of working with hooks and checks, so you don't have to keep reminding the agent. The rules live in `AGENTS.md`, the
shared standard. `node tools/hooks/wire.mjs` makes each agent's own files on your machine, so the repository favors
no vendor.

> **For AI agents: you were pointed here to set up a project.** Do exactly this:
> 1. Run `node "<this starter folder>/tools/new-project.mjs" "<the project folder>"`. An empty folder becomes a new
>    project. A folder with existing work is adopted, and nothing existing is overwritten. A project made from this
>    starter gets its engine upgraded. Add `--dry-run` first to show the user what will happen.
> 2. Never copy files by hand, and never put the project inside this folder.
> 3. Continue in the project folder: open its [SETUP-PROMPT.md](SETUP-PROMPT.md) and follow it from Phase 1. After an
>    upgrade there is no setup prompt: decide the upgrade review it wrote into `docs/DECISIONS.md`, asking the user
>    only about money, privacy or outward actions.

## What a project gets
- **Setup that asks first, then gives the project everything that fits.** The agent asks about the project, records
  your answers, and installs every pack and skill they call for. Nothing is installed before you answer, and each
  item left out has a recorded reason you can override. Hooks enforce each step.
- **Every request is routed** to a runbook or skill, and the agent must follow it. `DIRECTORY.md` maps what to use
  when.
- **It improves itself.**
  - New kinds of work leave a runbook, a skill and a check behind.
  - A miss while following a skill writes the lesson into that skill.
  - A skill used often gets hardened with scripts.
  - Skills nobody uses get reviewed and retired, with your OK.
- **"Always" and "never" become rules with automatic checks,** not promises.
- **An upset user teaches the project.** When you are annoyed, the agent fixes the miss, weighs the lesson, and stores
  it where it stops the next one (the skill that missed it, a rule, a check, or a new skill), telling you where.
  Lessons about the engine itself go back to the starter, and its next upgrade fixes every project.
- **Only what makes it better.** Every added skill, pack or dependency comes with its gain and cost, weighed.
  Upgrades roll back if a passing check breaks. The agent weighs each new item and tells you what it added or skipped,
  asking only about money, privacy or outward actions. The audit enforces a speed budget for the hooks.
- **Only improvements, never friction.** A skill, runbook or check that keeps frustrating you is suspended and
  announced. Safety and honesty checks stay, and get made less annoying instead. No check can stall the work.
- **Facts that are real.** One research skill covers answers from the project's own files, quick lookups, and full
  research across independent sources with sponsored and biased ones screened out. A check traces every number in an
  answer to something read that turn and catches cited files that were never opened.
- **Linked notes for Obsidian.** Notes link to what they relate to, so the graph shows how the project connects. The
  folder opens as a vault with the right link settings.
- **It remembers how it solved things.** A request like an earlier one starts from how that one was done
  (`node tools/recall.mjs` searches it all).
- **Runs without questions if you want.** With `"autonomy": "auto"` (or `--auto` when creating a project) the agent
  assumes and records answers instead of asking. Outward actions and third-party installs still need your OK.
- **Apps built to grow.** The app pack's modular-code skill keeps each feature in its own module with one public
  entry, settings in config, and extension points for what will multiply. A check runs on every changed code file.
- **Every name is a variable.** The project's name and every other name live in `docs/names.json`, so a rename is one
  edit. A check catches names typed out anywhere else.
- **Secure by default,** whatever the project is: a security baseline, a security-review skill, no secrets in
  commits or in the conversation, untrusted files treated as data, and the installed browser is never automated.
- **Nothing leaves the project without your OK.** Sending mail, posting, opening issues or pull requests, pushing,
  publishing, and connected services that send or create things wait for your OK in the request. An answer that
  claims something happened when it was refused or failed is caught. Skipping the git hooks needs your own words.
- **Recurring work that really recurs.** "Every Monday" becomes a routine in `docs/routines.md` with its runbook, and
  a due routine is announced when a session opens (routines library skill).
- **Your notes stay where they are.** An existing vault or notes folder becomes the knowledge base in place
  (`"knowledgeDirs"` in `tools/hooks/config.json`).
- **Packs that fit the project:**

  | Pack | For | Brings |
  |---|---|---|
  | knowledge | Knowing things and answering from them | Research, sources, evidence labels, ingest, deliverables |
  | app | Building software | Specs, triple-check QA, gates, a security, speed and usability foundation, release safety |
  | gui | Anything people look at | The GUI runbook, the screenshot review loop and tool, a visual checklist; the frontend-design library skill fits it |

- **A skill library** chosen per project: security hardening, backend patterns, frontend design, web app patterns,
  mobile apps, games, ML experiments, data pipelines, dependency updates, package releases, codebase maps, repo setup,
  orchestration, MCP servers, user research, correspondence, routines, notes vaults, manuscripts and more.
- **Core skills in every project:** planning, debugging, parallel sub-agents, research, linked notes, session handoff,
  finding existing skills, security review, learning from misses, and skill hardening and cleanup.
- **Quality by default:** plain writing with no filler or em dashes, verified claims, a tidy folder layout, and
  nothing in git that credits an AI agent.

## Start a project
**After cloning this repository**, run `node tools/hooks/wire.mjs` once. It connects the folder to your agent
(Claude Code, Codex and others) and switches on the git checks.

| Agent | What wire sets up |
|---|---|
| Claude Code | `CLAUDE.md` (a copy of `AGENTS.md`), the hooks in `.claude/settings.json`, the skills in `.claude/skills/` |
| Codex | The hooks in `.codex/hooks.json` (run `/hooks` in Codex once to trust them; it asks again after a change), the skills in `.agents/skills/`. The checks read Codex's transcript too |
| Gemini CLI | `.gemini/settings.json`, so it reads `AGENTS.md`. It has no hooks here: the agent runs `node tools/hooks/hooks.mjs begin "<request>"` and `check` itself |
| Any other | It reads `AGENTS.md`, and the git checks apply to every commit and push |

`"wireAgents"` in `tools/hooks/config.json` (for example `["codex"]`) limits the wiring to the agents you use. Two
sessions can work in one folder at once: each keeps its own record of its turn.

**The easy way:** open your project folder (new or existing) with your AI agent and say:
**"Set up this project with the starter at `<this starter folder>`."** The agent follows the box above, then the
setup prompt.

**Or by hand:** double-click **`New Project.bat`** (Windows), or run
`node tools/new-project.mjs "<folder>" --name "<Name>" --git`. Then open the new folder with your agent and say
**"set up this project"**.

Once a project is set up, [HOW-TO-USE.md](HOW-TO-USE.md) explains the day-to-day.

**The starter stays outside your projects.** The generator refuses to nest them. At the end of setup the agent asks
what to do with the starter's leftovers:
- **link** (recommended): the project remembers where the starter is, so packs, skills and upgrades can be added later;
- **keep a copy** in `.starter/`, so it can grow even without the starter folder;
- **remove** everything.

The link and the copy are both ignored by git.

| Situation | Command |
|---|---|
| New project | `node tools/new-project.mjs "<folder>" --name "<Name>" [--desc "..."] [--git]` |
| Existing project | `node tools/new-project.mjs "<folder>"`, then "set up this project". Nothing existing is overwritten |
| Add a pack or library skill later | In the project: `node tools/packs.mjs install <name>` or `node tools/skills.mjs enable <name>` |
| Update a project to the newest release | In the project: `node tools/starter.mjs update`. It gets the newest starter from its git origin (into the linked copy), then upgrades the project the safe way below. `node tools/starter.mjs status` says whether a newer release exists |
| Upgrade a project's engine | In the project: `node tools/starter.mjs upgrade` (or from here: `node tools/new-project.mjs "<folder>" --upgrade`). Rolls back if a passing check breaks; lists what is new and fits, to weigh with you |
| Preview any of these | add `--dry-run` (for `update`, the linked starter is still pulled; only the project's upgrade is previewed) |

## How it works
| Piece | Where | Role |
|---|---|---|
| Rules | `AGENTS.md` (a local copy, `CLAUDE.md`, is made for Claude Code) | 18 hard rules, each mapped to a check (`docs/checks/rule-enforcement.md`) |
| Names | `docs/names.json` | Every name that may change, written once; docs show it in a marker, code reads the file |
| Directory | `DIRECTORY.md` | "When this happens, use this runbook or skill", generated from the runbooks and skills |
| Runbooks | `docs/playbooks/` | Procedures in plain markdown that any agent can follow |
| Skills | `skills/` | Open SKILL.md format, mirrored locally where an agent looks for them |
| Checks | `tools/hooks/requirements.json` + the engine's baseline | "When X, require Y", checked at the end of every turn |
| Engine | `tools/hooks/hooks.mjs` | Session start, every prompt, before and after tool calls, and stop. Agents without hooks run `begin` / `check` |
| Packs | `packs/` | Installed during setup with `tools/packs.mjs` |
| Skill library | `library/` | Optional skills, enabled during setup with `tools/skills.mjs`; credits and licenses in each folder |
| Sweeps | `tools/audit.mjs [--full\|--setup]` | Structure, routing, references, publish safety, git hygiene, plus hook self-tests and ablation tests |
| Git guard | `.githooks/` | Commit and push checks that work for every agent and for manual commits |

Requires Node.js 18 or newer. No dependencies. The GUI screenshot tool uses Playwright's bundled Chromium
(`npx playwright install chromium-headless-shell`), never the installed browser.

## Improving the starter itself
Open this folder with an agent and work on it like any project. The hooks run here too, and `.starter-template`
keeps the setup prompt from triggering.
- Add a test for every new check, run `node tools/audit.mjs --full`, and record changes in
  [tools/starter/STARTER-CHANGELOG.md](tools/starter/STARTER-CHANGELOG.md).
- The self-tests and the audit record their results in `tools/hooks/state/runs.jsonl`, so the Stop hook never reruns
  them. `node tools/hooks/hooks.mjs run "<command>"` records any other check the same way.
- `node tools/trial.mjs` (starter only) proves on sample projects that creating, adopting and upgrading never leave a
  project worse. `--deep` also runs the self-tests inside a project mid-setup.
- A development copy carries a `.starter-dev` file (ignored by git). Projects are never made from it or linked to it
  (`--dev` allows throwaway tests), and the app pack's gates apply to the starter itself there.
- Projects send engine lessons back with `node tools/starter.mjs feedback "<text>"` and `report`. They land in
  `docs/feedback-inbox/` here, and the audit warns until each is reviewed.
- Before publishing, list any private words (names, project names) in `.private-terms` (ignored by git). The
  publish-safety sweep fails if any of them appear.

## License
MIT: use it, change it and sell what you build with it ([LICENSE](LICENSE)). Each skill folder keeps the license of the
work it was inspired by, all of them MIT or Apache-2.0, which allow commercial use. Projects made from the starter
don't inherit this license: each one chooses its own.
