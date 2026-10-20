# Codebase map: reference commands

Adjust to the stack. Run from the repo root. Leave out generated and vendored folders.

## Size and layout
- Files per extension: `git ls-files | sed -n 's/.*\.//p' | sort | uniq -c | sort -rn`
- Largest tracked files by lines: `git ls-files | xargs wc -l 2>/dev/null | sort -rn | head -30`
- A line counter such as `cloc` or `tokei` gives per-language totals if installed.

## Entry points and wiring (ripgrep)
- Mains and startup: `rg -n "def main|func main|if __name__ ==|static void main|\.listen\(|createServer"`
- Routes and handlers: `rg -n "@(app|router)\.(get|post|put|delete)|\.(get|post|put|delete)\(['\"]/|Route\("`
- Scheduled and queued work: `rg -n -i "cron|schedule|consumer|subscribe|worker"`
- Config and environment reads: `rg -n "process\.env|os\.environ|getenv|Environment\."`
- Imports of one module: `rg -n "from ['\"].*<module>|import .*<module>|require\(['\"].*<module>"`

## Dependency graphs from language tooling (when available)
- JavaScript / TypeScript: `npx madge --image graph.svg src` or `npx depcruise src` (ask before installing).
- Python: `pydeps <package>` or the import list from `python -X importtime`.
- Go: `go list -deps ./...`; Rust: `cargo tree`; Java / Kotlin: the build tool's dependency report.

## This skill's scripts (Node 18+, read-only, nothing to install)
- `node skills/codebase-map/scripts/import-graph.mjs [repo] [--depth N] [--mermaid] [--json] [--file <path>]`
  Lists files (respecting `.gitignore` when the folder is a git repo), parses imports for JavaScript/TypeScript,
  Python and Go, and prints: module edges with counts (a module is the first N folders, default 2), the most imported
  files, the files that import the most, cycles between modules, and with `--mermaid` a diagram for the map. `--file`
  adds one file's imports and importers, the first step of a blast-radius check. It uses pattern matching, not a
  compiler: path aliases, dynamic imports and generated code show up as "unresolved" or not at all.
- `node skills/codebase-map/scripts/hotspots.mjs [repo] [--since "1 year ago"] [--top N] [--json]`
  Reads `git log` (merges skipped) and prints the most changed files, the most fixed files (commit subject mentions
  fix, bug, hotfix, regression or revert), pairs of files that change together 3 or more times, and "big and busy"
  files ranked by changes times the log of their line count. Commits over 50 files are left out of the pairs.

## Blast radius before a change
1. Direct dependents: `import-graph.mjs --file <path>`, or the language's "find references", or
   `rg -n -w "<symbol>"` (then read each hit; the same name can mean a different symbol).
2. One level further: repeat for each direct dependent that passes the changed value on.
3. Flows: which traced flows in the map pass through the file.
4. Co-change: `hotspots.mjs` pairs that include the file often hide a dependency the imports don't show.
5. After the change: `git diff --name-only` mapped onto the flows; run the tests of every flow touched.

## Symbol view (for the few symbols that matter most)
For each core symbol record: where it is defined (file and line), who calls it, what it calls, and which flows it
is a step in.

## Hot spots from git
- Most changed files (last year): `git log --since=1.year --name-only --format= | sort | uniq -c | sort -rn | head -30`
- Files changed with a given file: `git log --format=%H -- <file> | xargs -I{} git show --name-only --format= {} | sort | uniq -c | sort -rn | head`
- Fix-heavy files: `git log --since=1.year -i --grep=fix --name-only --format= | sort | uniq -c | sort -rn | head -20`
- Recent large changes: `git log --since=3.months --shortstat --format="%h %ad %s" --date=short`

## Map file outline
```markdown
# Codebase map
Built: YYYY-MM-DD at commit <sha>. Tools: <graph tool | language tooling | rg | git>.

## Overview          languages, frameworks, build / test / run commands
## Entry points      file:symbol, one line each
## Modules           job, main files, depends on, used by (+ diagram)
## Boundaries        database, network, files, other services, config, route map, contracts with other repos
## Areas             functional areas: key files, entry points, flows, links to other areas
## Main flows        entry -> hop -> hop -> side effect
## Hot spots         file, why (churn, size, fixes, coupled with)
## Where to change what   change -> files in order -> covering test
## Unknown / not mapped
```
