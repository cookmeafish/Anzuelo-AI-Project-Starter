---
status: queued - starts after [engine v2 only](2026-11-07-engine-v2-only.md) and [migrate every behavior](2026-11-08-migrate-every-behavior.md) are done, so it is built once, in v2 only
---
# Plan: hybrid storage and an optional MCP server

Goal: the engine keeps its own data in one local database and can serve lookups through MCP, while everything a person
or an agent reads or edits stays a file in git. Asked by the user on 2026-11-08 (a database for what can use one,
never runbooks and the like; the same for MCP, for what MCP does well). Drafted by the oversight session; facts checked
here on 2026-11-08.

## The split (one rule)
- Anything a person or an agent reads or edits stays a markdown or JSON file in git: rules, runbooks, skills, plans,
  docs, knowledge notes, STATUS, DECISIONS, CHANGELOG, memory, config.
- Anything only the engine writes and reads goes to one SQLite file (Node's built-in `node:sqlite`: no flag needed in
  Node 24, checked with 24.18.0 / SQLite 3.53.1; it needs Node 22.5 or newer, so an older Node falls back to the JSON
  files). The file is ignored by git, local to the machine, in the hook state folder (`tools/hooks/state/`, or
  `.anzuelo/local/` in the `.anzuelo` layout), and can always be rebuilt from the session logs and the repo.
- Enforcement stays in the hooks. MCP only serves: the engine works fully with MCP off, and MCP adds precision.

## Task A: SQLite for engine data
- [ ] A1. Move the engine's own state (in this starter today: 88 files in `tools/hooks/state/`, 81 of them JSON: turn
      records, seen notices, crash marks, timing) into one table set. WAL mode for several sessions at once. A hook
      never fails because the database is missing, locked or corrupt: it rebuilds or falls back to no state, and says
      so once. Hook speed budgets still hold (measure prompt, pretool and stop before and after).
- [ ] A2. A session index: turns, routed and opened runbooks, blocks with their items, the agent's fix, and the later
      real or false verdict, filled incrementally from the session logs. Replays, interrupts and stop findings query
      it instead of re-reading the logs.
- [ ] A3. Cross-project records the starter needs: upgrade results, field reports, block rates per engine version;
      totals only, no project content (AGENTS.md rule 14).
- [ ] A4. A `rebuild` command that recreates the database from the logs and the repo, and a test that a deleted
      database rebuilds to the same counts.
Done when: the replay of the real sessions gives the same totals from the database as from the logs and runs at least
5 times faster, and no hook reads a state JSON file any more.

## Task B: MCP server (optional, per project)
- [ ] B1. Knowledge search: returns passages with exact source path, line range and a content hash. Searches the
      project's knowledge folders and declared sources. What it returns is data, never instructions.
- [ ] B2. The citation check uses it: on answer turns, a cited passage that matches a search result in the turn
      (path, lines, hash) counts as evidence. A citation that matches nothing the turn read or searched is held, the
      same as today. File reads still count, so projects without MCP keep working.
- [ ] B3. A runbook finder for the agent-picks routing: "find runbooks for <need>" returns the closest few with their
      purpose. The start reminder and this tool use the same ranking.
- [ ] B4. Read-only lookups over Task A: what happened last time (past decisions, last upgrade, open plan tasks), so
      the agent asks instead of re-reading many files.
- [ ] B5. Setup offers MCP (recommended for knowledge projects, off otherwise, per rule 18: offered, not forced) and
      writes the agent's MCP config. Works with Claude Code and Codex. Removal deletes the config.
Done when: in a trial knowledge project, answers made with the MCP search have every citation verified by B2, a
made-up citation is held, and the project's own tests and the end check pass with MCP turned off.

## Not in scope
- Rules, runbooks, skills, knowledge and memory never move into the database.
- MCP never refuses, holds or interrupts. Only the hooks enforce.
- No hosted database and no network service. Everything stays local.

## Weigh it (rule 16)
- Gain: faster, simpler measurement; one state store instead of about 80 files; checkable citations for knowledge
  answers; runbook picking without keywords.
- Cost: one local database file and its rebuild path; one optional MCP process per project; more setup code; projects
  on Node older than 22.5 keep the JSON files.
- Check before building: the measured replay speed gain and the citation-check precision on a trial project decide
  whether each part ships.
