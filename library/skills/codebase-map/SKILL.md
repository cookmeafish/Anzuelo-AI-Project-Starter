---
name: codebase-map
description: Builds a map of an unfamiliar or large codebase (entry points, modules and how they depend on each other, functional areas, data flow, key call paths, hot spots from git history, and where to change what) with whatever tools are at hand, including two zero-install scripts for the import graph and git hot spots, and saves it to docs/codebase-map.md so later sessions start from the map instead of re-reading the code. Use when joining an existing project, before a change that crosses several modules (to see what it can break), when nobody can say where something lives, or when the saved map is older than the code.
triggers: map the codebase, codebase map, architecture overview, find my way around, explain the code structure, dependency graph, how is this codebase organized
---
# Codebase map: understand the code once, reuse it every session

Reading a large codebase file by file costs the same every session and still misses how the parts connect. Build the
map once, from evidence, save it, and keep it current. The map answers three questions: how does a request or a run
flow through the code, which parts depend on which, and where do I change X.

Say at the start: "Mapping the codebase (codebase-map skill)." If `docs/codebase-map.md` exists, read it first, check
its date and commit against `git log`, and update only what changed.

## 1. Pick the tools
Use the best tool available, in this order, and say which one was used:
1. **A code-graph or code-intelligence tool**, if one is installed (a knowledge-graph indexer, an LSP server, a
   language's own dependency tool). It gives symbols, call chains, clusters and impact queries directly. Optional,
   never required.
2. **This skill's scripts** (Node, nothing to install, read-only, usage in [references.md](references.md)):
   `skills/codebase-map/scripts/import-graph.mjs` for the import graph, most-depended-on files, module cycles and a
   Mermaid diagram (JavaScript/TypeScript, Python, Go); `skills/codebase-map/scripts/hotspots.mjs` for git churn,
   fix-heavy files and files that change together.
3. **Language tooling:** the build file and package manifest, the compiler or type checker's import graph, "go to
   definition" and "find references".
4. **Plain search:** `rg` (ripgrep) or `grep` for imports, exports, routes, handlers and config keys.
5. **Git history:** `git log` for what changes often, together, and recently.

Rules for outside tools:
- Don't install anything or start a server without the user's OK. Stop any server you started when done.
- Run `git status` after an indexer runs. Some write their own agent instruction files, skills or config into the
  repo; remove what was not asked for, and never let one overwrite `AGENTS.md`, `CLAUDE.md` or `skills/`. Index
  folders stay out of git. Remove them at the end unless the user wants to keep them.
- Keep the code on the machine. Don't upload it to a web viewer, a hosted graph service or a model API, and don't
  expose a local viewer to the internet, without the user's explicit OK.
- Optional extras such as semantic or embedding search cost much more time on large repos. Skip them for a first
  map.

## 2. Size it up
1. List the top-level folders and count files and lines per language. Note what is generated, vendored or built
   output, and leave it out of the map.
2. Read the README, the build and package files, the CI config and any architecture notes. Note the languages,
   frameworks, and how to build, test and run it.
3. For very large repos, map one area at a time (the part the current task touches first) and say which areas are
   not mapped yet.

## 3. Find the entry points
Every way the code starts running: `main` functions, CLI commands, server startup, route and handler tables, scheduled
jobs, queue consumers, UI roots, exported library APIs, test setup. Record file and symbol for each.

## 4. Map the modules
1. Name each module or package in one line: its job, its main files, and its public surface.
2. Draw who imports whom, from the actual imports, not from folder names. Flag cycles and modules that everything
   depends on.
3. Note the boundaries: database, network calls, file system, other services, environment and config. That is where
   bugs and security issues gather. For apps with an API, add a route map: each route, its handler, and the client
   code that calls it.
4. **Group into functional areas** by how tightly the code connects (files that import each other and change
   together), not only by folder. Name each area by what it does ("billing", "sign-in"). For a large repo, give each
   area its own short section: key files, entry points, flows, and links to other areas.

## 5. Trace the main flows
Pick the 3 to 5 most important paths (a typical request, the main job, startup, the riskiest operation) and follow
each from entry point to side effect, one line per hop: `file:symbol -> file:symbol`. Note where data changes shape
and where it is stored. Read the code on each hop. Don't infer a call from a name.

## 6. Find the hot spots
From git history: files changed most often, files that usually change together, recent large changes, and files with
many authors or many fixes. Combine with size and complexity: a big file that changes often is where bugs and
merge conflicts come from. Commands are in [references.md](references.md).

## 7. Write "where to change what"
A short table of the changes people will actually make (add a route, a setting, a field, a screen, a job) and the
files each one touches, in order. Include the test that covers it.

**Using the map before a change** (the blast radius): for the symbol or file about to change, list what calls or
imports it directly (these break if its contract changes), then one level further (likely affected), and which main
flows pass through it. Include tests in the list; exclude them from the count of real callers. After the change,
map the diff back to the flows it touches and run their tests. Commands in [references.md](references.md).

## 8. Save the map
Write `docs/codebase-map.md` with: the date and commit it was built from, the tools used, the sections above, and an
"Unknown / not verified" list. Mark each dependency or flow edge by how it is known: read in the code, reported by a
tool, or inferred (dynamic wiring). Keep it to what a newcomer needs; link to files instead of quoting code. A diagram
(text or Mermaid) helps for the module graph. So the next session finds it, add a row for `docs/codebase-map.md` to
"Where things live" in `DIRECTORY.md` (outside the generated block).

## Done when
- [ ] Entry points, modules with their dependencies, 3 to 5 traced flows, hot spots, and a "where to change what"
  table are in `docs/codebase-map.md`.
- [ ] Every flow hop and dependency was read in the code or produced by a tool, not guessed from names.
- [ ] The map names its date, commit, tools used, and what is unknown or not mapped.
- [ ] Generated, vendored and build output is excluded, and no tool index files were added to git.
- [ ] `git status` shows nothing a tool added unasked; any server started for the map is stopped; no code left the
  machine without the user's OK.

## Pitfalls
- **Folder names lie.** A folder called `utils` can hold the core logic. Map from imports and calls.
- **Dynamic wiring hides edges.** Dependency injection, reflection, plugins, event buses and string-keyed routes don't
  show in imports. Search for the registration side and note these edges as such.
- **Too much detail.** A map that lists every function is the code again. Stop at what answers "where" and "how it
  flows".
- **Stale maps mislead.** Always record the commit, and refresh the parts whose files changed since.
- **Graph tools and huge repos.** Visual graph viewers that load everything into the browser slow down past a few
  thousand files and can crash on tens of thousands. Query the tool or narrow the scope instead of rendering
  everything.
- **Same name, different symbol.** Several functions or classes can share a name across files. Pin each one by file
  (and kind) before tracing or judging impact.
- **Tools that write into the repo.** An indexer can add instruction files, skills or hooks of its own. Check
  `git status` after every tool run.
- **Several repos, one system.** When services live in separate repos, map each one and add the contracts between
  them (APIs, queues, shared schemas) to the boundaries.

Inspired by "gitnexus-explorer" in NousResearch/hermes-agent (MIT, see LICENSE and [SOURCE.md](SOURCE.md)).
