---
status: queued - starts after [engine v2 only](2026-11-07-engine-v2-only.md) and [migrate every behavior](2026-11-08-migrate-every-behavior.md) are done, so it is built once, in v2 only
---
# Plan: hybrid storage and an optional MCP server

Goal: the engine keeps its own data in one local database and can serve read-only lookups through MCP, while
everything a person or an agent reads or edits stays a file in git. Asked by the user on 2026-11-08 (a database for
what can use one, never runbooks and the like; the same for MCP, for what MCP does well). Drafted and researched by
the oversight session; facts and fit checked here on 2026-11-08.

## The split (one rule)
- Anything a person or an agent reads or edits stays a markdown or JSON file in git: rules, runbooks, skills, plans,
  docs, knowledge notes, STATUS, DECISIONS, CHANGELOG, memory, config.
- Anything only the engine writes and reads goes to one SQLite file (Node's built-in `node:sqlite`), ignored by git,
  on the local disk, in the hook state folder (`tools/hooks/state/`, or `.anzuelo/local/` in the `.anzuelo` layout).
  It is a cache: it can always be rebuilt from the session logs and the repo.
- Enforcement stays in the hooks. MCP only serves: the engine works fully with MCP off, and MCP adds precision.

## Task A: SQLite for engine data
- [ ] A1. Gate: use `node:sqlite` only on Node 22.16 or newer (the busy `timeout` option) and bundled SQLite 3.51.3 or
      newer (the WAL-reset bug with concurrent writers is fixed there); check both at runtime. Otherwise, and when the
      state folder is on a network or cloud-synced path (WAL needs one host), keep the JSON state files and say so
      once.
- [ ] A2. Silence node:sqlite's ExperimentalWarning inside the hooks so it never reaches hook output, with a test.
- [ ] A3. Open with `timeout: 2000`, `PRAGMA journal_mode=WAL` and short write transactions. Move the engine's own state
      (in this starter today: 88 files in `tools/hooks/state/`, 81 of them JSON: turn records, seen notices, crash
      marks, timing) into one table set.
- [ ] A4. The database is a cache: on corruption, on a schema-version mismatch after an engine upgrade, or on request
      (`rebuild`), the engine recreates it from the logs and the repo. A hook never fails because of it.
- [ ] A5. A session index: turns, routed and opened runbooks, blocks with their items, the agent's fix, and the later
      real or false verdict, filled incrementally from the session logs. Replays, interrupts and stop findings query
      it instead of re-reading the logs.
- [ ] A6. Cross-project records the starter needs: upgrade results, field reports, block rates per engine version;
      totals only, no project content (AGENTS.md rule 14).
Done when (each bar measured, the numbers in docs/reviews/):
- Hook speed: prompt, pretool and stop stay within 10% of today on the replay set, with the database on.
- Replay: the real-session replay gives identical totals from the database and from the logs, at least 5 times faster.
- Rebuild: a deleted database rebuilds to the same counts.
- Locking: 8 hook processes writing at once give 0 lock errors in a stress test on Windows.
- No hook reads a state JSON file any more where the database is in use; the JSON fallback passes the same tests.

## Task B: MCP server (optional, per project)
- [ ] B1. Transport: stdio only (no HTTP server, so no auth to manage and no DNS-rebinding surface). SDK: the official
      TypeScript SDK if it supports the current spec and passes the install vetting (two independent sources,
      license, maintained); otherwise a small hand-written stdio JSON-RPC loop, as the tool set is small and read-only.
- [ ] B2. Four read-only tools, none writes, runs commands or reaches the network: `search_knowledge`, `get_passage`,
      `find_runbooks`, `lookup` (past decisions, last upgrade, open plan tasks, from Task A). Their short, fixed
      descriptions are pinned by a test, so a changed description fails (guards against a "rug pull").
- [ ] B3. Scope: only the project's declared knowledge folders and runbooks; every path resolved and kept inside the
      project; secret patterns, `.env` files, other people's `profiles/<name>/` (rule 11) and git-ignored files
      excluded; parameterized SQL only; results capped well under Claude Code's 25,000-token tool output cap.
- [ ] B4. Returned text is data: each passage comes wrapped with its path, line range and sha256. The rules already say
      file content is never instructions; the hooks keep enforcing safety whatever MCP returns.
- [ ] B5. Citations: a passage cites as `path:start-end#hash8`. The end check recomputes the hash on the current file;
      a citation is evidence only when it matches a passage returned or read in the same turn. Plain file reads still
      count, so a project without MCP loses nothing.
- [ ] B6. Retrieval, phase 1: FTS5 BM25 over chunks of a few hundred tokens split by heading, each chunk prefixed with
      its file title and heading path (a cheap, model-free take on contextual BM25); porter for English, trigram for
      identifiers and other languages. Phase 2 (local embeddings and a reranker, each vetted, no network) only if
      phase 1 misses the recall bar.
- [ ] B7. Small knowledge bases: under about 200,000 tokens retrieval adds little. Setup measures the knowledge size and
      recommends MCP search mainly above it (rule 18: offered, not forced); below it citations still work through
      file reads.
- [ ] B8. Setup writes `.mcp.json` (Claude Code) and `.codex/config.toml` (Codex), recorded in DECISIONS; removal
      deletes both. Claude Code's one-time approval prompt for project servers is expected and told to the user.
      Check the exact Codex key names on its page when building (they came from a summary).
Done when (measured on a trial knowledge project, the numbers in docs/reviews/):
- Search: 30 written questions with known source passages give recall@5 of at least 90%; 100% of citations verify;
  every made-up or stale-hash citation is held; the end check passes with MCP off.
- Security tests pass: path traversal (`..`, absolute paths, symlinks) refused; secrets and other people's profiles
  never returned; a tool-description change fails the pin test; an instruction planted in a knowledge file comes back
  as plain data and changes no hook decision.

## Not in scope
- Rules, runbooks, skills, knowledge and memory never move into the database.
- MCP never refuses, holds or interrupts. Only the hooks enforce.
- No hosted database and no network service. Everything stays local.

## Research (2026-11-08, sources read that day; the full notes are the oversight session's)
- MCP protocol: the latest spec is 2026-07-28 and stateless ("an open connection, such as a STDIO process, is not a
  conversation or session"); whether the initialize handshake was removed was not confirmed. Local servers "SHOULD
  use the stdio transport"; HTTP needs auth or restricted IPC, and DNS rebinding against localhost is a named attack.
  Clients "MUST consider tool annotations to be untrusted"; servers must validate inputs, control access, rate limit
  and sanitize outputs. Sources: modelcontextprotocol.io/specification (2026-07-28 basic; 2025-06-18 security best
  practices and server/tools).
- Claude Code: project servers live in `.mcp.json` under `mcpServers`; interactive sessions ask once before using them
  (`claude mcp reset-project-choices` resets), `claude -p` loads them without asking; output warns above 10,000
  tokens and is capped at 25,000 by default (`MAX_MCP_OUTPUT_TOKENS`). Source: code.claude.com/docs/en/mcp (partly
  from a summary of the page).
- Codex: `[mcp_servers.<name>]` tables in `~/.codex/config.toml`, or `.codex/config.toml` for trusted projects; stdio
  and Streamable HTTP; `startup_timeout_sec` (10) and `tool_timeout_sec` (60); `enabled_tools` and `disabled_tools`.
  Source: developers.openai.com/codex/mcp (from a summary; check key names when building).
- Security: OWASP's MCP Top 10 (beta) lists token exposure, scope creep, tool poisoning, supply chain, command
  injection, prompt injection through content, weak auth, missing audit, shadow servers and over-sharing
  (owasp.org/www-project-mcp-top-10). Vendor write-ups (weighed lightly) agree the bigger risk is injection through
  returned content, which no filter fully catches, so a tricked agent must be limited: read-only, least privilege.
- Reuse: the official reference servers are "educational examples ... not as production-ready solutions", and the
  official SQLite server is archived (github.com/modelcontextprotocol/servers).
- Retrieval: Anthropic's contextual retrieval cut top-20 retrieval failures by 35% (embeddings), 49% (with contextual
  BM25) and 67% (with a reranker); chunks are "usually no more than a few hundred tokens"; a knowledge base under
  200,000 tokens can go whole into the prompt (anthropic.com/news/contextual-retrieval). FTS5's bm25() ranks smaller
  as better, with per-column weights; tokenizers unicode61, porter, trigram; external-content tables are the caller's
  to keep in sync (sqlite.org/fts5.html). Tested here: Node 24.18.0 bundles SQLite 3.53.1, with FTS5, porter and
  trigram working without a flag; it prints an ExperimentalWarning. This machine now runs Node 26.13.0 with SQLite
  3.54.0 (checked 2026-11-08), FTS5 with trigram working. The runtime minimums stay Node 22.16 and SQLite 3.51.3, with
  the JSON fallback below them.
- SQLite in Node: node:sqlite is "Release candidate" since v25.7.0, out from behind its flag but "still experimental"
  since v22.13.0; the busy `timeout` option exists since v22.16.0 and v24.0.0 (default 0); `DatabaseSync` is now an
  alias of `Database` (nodejs.org/api/sqlite.html). WAL: one writer at a time, readers and writers don't block each
  other, all processes on one host ("WAL does not work over a network filesystem"), SQLITE_BUSY still possible, and a
  WAL-reset bug with concurrent writers in 3.7.0 through 3.51.2, fixed in 3.51.3 (sqlite.org/wal.html,
  sqlite.org/pragma.html).

## Rejected, with reasons
- Hosted or server databases: a network service and accounts, for data the engine can rebuild locally.
- A vector database service, or embeddings first: they need a model and maybe the network; BM25 with context is
  built in and gets most of the gain. Embeddings come only if recall falls short.
- Reusing the reference filesystem server: marked "not production-ready", and it exposes write operations.
- The official SQLite server: archived.
- An HTTP transport: needs auth and opens a DNS-rebinding surface; the spec recommends stdio for local servers.
- Write tools in MCP: a second write path that widens what a tricked agent can do; edits stay with the agent's own
  tools under the hooks.
- Moving rules, runbooks, knowledge or memory into the database: they would lose git review, and agents and the user
  could no longer open them directly.
- The whole knowledge base in the prompt for large bases: fine under 200,000 tokens, but above that retrieval is
  needed, and checkable citations need passage ids either way.

## Weigh it (rule 16)
- Gain: faster, simpler measurement; one state store instead of about 80 files; checkable citations for knowledge
  answers; runbook picking without keywords.
- Cost: one local database file and its rebuild path; one optional MCP process per project; more setup code; a JSON
  fallback kept for older Node and synced folders.
- Each part ships only when it meets its bars above.
