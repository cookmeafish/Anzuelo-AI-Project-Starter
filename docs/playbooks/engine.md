---
name: engine
summary: Install, upgrade or remove the <!--name:STARTER_NAME-->Anzuelo<!--/name--> engine, and change its hook settings, including when the agent host refuses the change
triggers: upgrade the engine, upgrade the starter, update the starter, newest starter, new starter release, starter update, install the engine, install the starter, add the starter to, remove the engine, uninstall the engine, take the engine out, uninstall the starter, remove the starter from, hook setting, hook settings, engine setting, engine settings, change a setting, turn on the setting, turn off the setting
menu: E6
checks: core: upgrade-review, permission-respected
reuse: none - project-specific: the engine's own install, upgrade and removal tools
---
# Playbook: install, upgrade or remove the engine

**Use when:** the engine goes into a folder, gets a newer version, comes out, or one of its settings
(`tools/hooks/config.json`) changes. **Not when:** a first-session setup interview (project-bootstrap skill), a pack or
library skill (`project.md` §8 and §10).

## Steps
### 1. Before any of them
- Commit the project's own work first (`git status` shows nothing to commit), so the engine change is its own commit
  and can be undone alone. Not a git repository: say so, and go on (each tool keeps a backup).
- Each tool takes `--dry-run`: run it first and read the list.

### 2. Install
From the starter's folder (a project without the engine has no tools for this):
`node "<starter>/tools/new-project.mjs" "<folder>"`. An empty folder becomes a new project; a folder with files is
adopted (no file of it is overwritten); a folder that has the engine is upgraded (§3). Then follow the
project-bootstrap skill in that folder.

### 3. Upgrade
`node tools/starter.mjs update` pulls the newest starter into the linked copy (it stops if that copy has local
changes or is a development copy), then upgrades. To upgrade from the linked copy as it is: `node tools/starter.mjs
upgrade`. No link: `node tools/starter.mjs link "<starter folder>"` first.
- Only engine files are replaced (hooks, tests, audit, tools, core skills, core runbooks and checklists). The
  project's content is never touched, and an engine skill or runbook keeps the triggers and "## Project lessons" it
  added. Pack and library files are refreshed only where this project never edited them.
- It audits and times the hooks before and after; a check that passed before and fails after rolls the whole upgrade
  back (`--accept-findings` keeps it and lists those checks to fix).
- It writes `## Upgrade review (date)` into `docs/DECISIONS.md`. **You decide; the user only sees a summary.** Decide
  the new fit rows from the survey, the brief and the code (add, skip, or `later - when: <condition>`, each with its
  reason) until `node tools/fit.mjs check` passes, then write `decided` on the fit line. Ask the user only about what
  is truly theirs (money, privacy, outward actions), in one question with choices. Adopt other lines only when they
  make this project better (`adopted - Worth it: <gain> / <cost>`, then really add it), decline the rest with the
  reason (`declined - <why>`). Run `node tools/hooks/selfcheck.mjs` and write `passed`. Tell the user in one line
  (`node tools/fit.mjs summary`). The hooks hold work until every line is decided.
- Commit the upgrade (§1) and say in the answer what changed for the user (the starter's changelog lines it printed).

### 4. Remove
`node tools/starter.mjs uninstall --dry-run`, then without `--dry-run`. It unwires the engine's hooks (other agent
settings stay), removes the engine's files, core skills, the skills made from its runbooks and their mirrors, and backs
all of it up in `.cache/engine-removed/<time>/`. The project's own files stay: AGENTS.md, docs, its runbooks, checks
and code. Then tell the user that AGENTS.md (and CLAUDE.md) still describe the engine's rules and offer to trim them,
and how to put the engine back (the command it printed). Ask before removing: it changes how every later session works.

### 5. A setting
- Read it: `node tools/hooks/hooks.mjs setting <key>`. The keys and their defaults are `DEFAULTS` in
  `tools/hooks/hooks.mjs`.
- Change it: edit `tools/hooks/config.json` yourself, then record the choice in `docs/DECISIONS.md`.
- **The agent host refuses the edit** (Claude Code's safety check stops an agent from changing its own hooks' settings):
  don't write it any other way. End the answer with one line per setting for the user to paste, and nothing else to do:
  `! node tools/hooks/hooks.mjs setting <key> <value>` (in Claude Code the `!` runs it in this session; in another agent,
  in a terminal). Name what it turns on in plain words. On the next turn, read it back and record the choice.

## Done when
- [ ] An upgrade's review lines are each decided (hook: upgrade-review).
- [ ] A setting the host refused went to the user as the one line to paste, never written another way (hook: permission-respected).
- [ ] The engine change is its own commit, or the answer says why not (judgment: whether the project wanted a commit).
- [ ] After a removal, the answer says where the backup is and how to put the engine back (judgment: plain wording).
- [ ] The answer ends with a Finished section (hook: finished-summary).

## Pitfalls
- 2026-10-27: an upgrade ran on top of a session's 27 uncommitted files, so the two could only be committed together.
- 2026-10-27: the host refused a settings edit, and the agent told the user to open config.json and add a line by
  hand; the user had to take it to another session. The one line to paste (§5) is the whole fix for the user.
