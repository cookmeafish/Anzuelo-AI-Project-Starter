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

Words used here: the **starter** is the folder the engine comes from; the **linked copy** is the starter folder this
project upgrades from (`node tools/starter.mjs status` prints it); a **development copy** is a starter folder with a
`.starter-dev` file, which projects never upgrade from.

## Steps
### 1. Before any of them
- Commit the project's own work first (`git status` shows nothing to commit), so the engine change is its own commit
  and can be undone alone. Not a git repository: say so in the answer and go on; upgrade and removal back up every file
  they replace or remove under `.cache/`.
- Run the command with `--dry-run` first. Stop and ask the user if the list names a file the project wrote itself
  (anything outside `tools/`, `skills/`, `docs/checks/`, `docs/playbooks/` and the agent folders).

### 2. Install
From the starter's folder (a project without the engine has no tools for this):
`node "<starter>/tools/new-project.mjs" "<folder>"`. An empty folder becomes a new project; a folder with files is
adopted (no file of it is overwritten); a folder that has the engine is upgraded (§3). Then follow
`skills/project-bootstrap/SKILL.md` in that folder.

### 3. Upgrade
`node tools/starter.mjs update` pulls the newest starter into the linked copy, then upgrades. It stops when that copy
has local changes: rerun with `--keep-local` to keep them on top, or ask the user. To upgrade from the linked copy as it
is: `node tools/starter.mjs upgrade`. No link: `node tools/starter.mjs link "<starter folder>"` first.
- Only engine files are replaced (hooks, tests, audit, tools, core skills, core runbooks and checklists). The
  project's content is never touched, and an engine skill or runbook keeps the triggers and "## Project lessons" it
  added. Pack and library files are refreshed only where this project never edited them.
- A check that passed before and fails after rolls the whole upgrade back. Fix what the listed checks report and
  upgrade again; use `--accept-findings` only when each listed check is a new, stricter check the project should meet
  (then fix them next).
- It writes `## Upgrade review (date)` into `docs/DECISIONS.md`, one line per item. **You decide; the user only sees a
  summary.** End each line with the decision: `adopted - Worth it: <gain> / <cost>` (then really add it), or
  `declined - <why>`. The `fit:` line: decide each new `?` row in `docs/fit-checklist.md` (add, skip, or `later - when:
  <condition>`, with its reason) until `node tools/fit.mjs check` passes, then end the line with `decided`. The
  self-test line: run `node tools/hooks/selfcheck.mjs` and end it with `passed`. Ask the user only about what is truly
  theirs (money, privacy, outward actions), in one question with choices. Tell the user in one line
  (`node tools/fit.mjs summary`).
- Commit the upgrade (§1) and say in the answer what changed for the user (the starter's changelog lines it printed).

### 4. Remove
1. Ask the user first, in one line: removing changes how every later session works. No → stop.
2. `node tools/starter.mjs uninstall --dry-run`, check the list (§1), then `node tools/starter.mjs uninstall`. It
   unwires the engine's hooks (other agent settings stay), removes the engine's files, core skills, the skills made from
   its runbooks and their mirrors, and backs all of it up in `.cache/engine-removed/<time>/`. The project's own files
   stay: AGENTS.md, docs, its runbooks, checks and code.
3. Tell the user where the backup is and the command it printed to put the engine back, and offer to trim AGENTS.md
   (and CLAUDE.md), which still describe the engine's rules.

### 5. A setting
- Read it: `node tools/hooks/hooks.mjs setting <key>`. Each key, its default and what it does are in `DEFAULTS` in
  `tools/hooks/hooks.mjs` (the comment beside it). Values are JSON: `true`, `3`, `"text"`, `["a", "b"]`.
- Change it: edit `tools/hooks/config.json` yourself, then add a line to `docs/DECISIONS.md`:
  `<date>: setting <key> = <value> - <why>`.
- **The agent host refuses the edit** (the edit tool returns a denial instead of a change, such as Claude Code's
  safety check on an agent changing its own hooks' settings): don't write it any other way. The `setting` command with
  a value is the user's, never yours. End the answer with what it does in plain words and one line per setting for the
  user to paste: `! node tools/hooks/hooks.mjs setting <key> <value>` (in Claude Code the `!` runs it in this session;
  in another agent, in a terminal). On the next turn, read it back and add the DECISIONS line.

## Done when
- [ ] The project's own work was committed before the engine change, and the change is its own commit, or the answer
      says why not (judgment: whether the project keeps git history is the user's call).
- [ ] An install ended with the project-bootstrap skill started in that folder (judgment: setup is its own interview).
- [ ] An upgrade's review lines each end with a decision (hook: upgrade-review).
- [ ] A removal was asked first, and the answer says where the backup is and how to put the engine back (judgment:
      plain wording for the user).
- [ ] A changed setting has its DECISIONS line; one the host refused went to the user as the line to paste, never
      written another way (hook: permission-respected).
- [ ] The answer ends with a Finished section: what changed, each file's path, what was not verified (hook: finished-summary).

## Pitfalls
- 2026-10-27: an upgrade ran on top of a session's 27 uncommitted files, so the two could only be committed together.
- 2026-10-27: the host refused a settings edit, and the agent told the user to open config.json and add a line by
  hand; the user had to take it to another session. The one line to paste (§5) is the whole fix for the user.
