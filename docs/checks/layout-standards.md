# Layout standards (where things go)

Everything lives in a folder that says what it is. The root holds what a person opens first, plus (for apps) one
file that starts the app. The Stop hook blocks new loose root files (REQ: root-tidy), and the audit flags existing
ones. Allowed root files are `rootAllowed` (defaults in `tools/hooks/hooks.mjs`, extended in
`tools/hooks/config.json` by packs and setup), plus what a language or tool needs in the root, listed by ecosystem in
`ROOT_TOOLCHAINS` (`tools/hooks/hooks.mjs`).

## The root
| Kind | Files |
|---|---|
| Read first | `README.md`, `HOW-TO-USE.md`, `AGENTS.md` (plus its local twin `CLAUDE.md`, not in git), `DIRECTORY.md`, `SETUP-PROMPT.md` (until setup is done), `LICENSE` |
| Start the app (apps only) | ONE obvious start file, e.g. `Start <App>.bat` (Windows) and `start.sh` (macOS/Linux), or the toolchain's own (`npm start` via `package.json`). The README's first instruction points at it. |
| Toolchain config that must sit in the root | `package.json` and its lock file, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `tsconfig.json`, bundler config, `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example`, and the rest of `ROOT_TOOLCHAINS` (Go, Rust, Python, Node, Java and Gradle, .NET, Flutter, Godot, Docker, CI configs and more) |
| Source files the toolchain wants in the root | Only next to their marker: `*.go` beside `go.mod` (a Go main package), `*.cs` beside a `.csproj`, `conftest.py` and `manage.py` beside `pyproject.toml`, `index.html` beside `package.json`, Godot's icon beside `project.godot` |

Everything else goes in a folder. When in doubt, use a folder.

## With the engine in `.anzuelo/` (a project installed with `starter.mjs install`)
The project's git holds only the project: its own files, plus `docs/CHANGELOG.md`, `docs/BRIEF.md` and
`docs/DECISIONS.md`, which describe it. `.gitignore` has one block for the rest. `tools/hooks/paths.mjs` decides
where each file lives; agents use the plain names below, and the hooks find the file.
| Folder | What |
|---|---|
| `.anzuelo/engine/` | A git clone of the starter: hooks, tools, core runbooks and skills, packs, library. Upgraded by git pull, never edited (REQ: engine-readonly) |
| `.anzuelo/local/` | Everything the engine made for this project: status, plans, glossary, reviews, menu, settings, hook state, its own runbooks and skills, and its copies of defaults (`starter.mjs override`), which win. Optionally a private git repository of its own (setup asks) |
| Wiring, made on each machine | `CLAUDE.local.md`, `.claude/settings.local.json`, `.claude/skills/`, `.agents/skills/`, `.codex/hooks.json` |

## Core folders (every project)
| Folder | What |
|---|---|
| `docs/` | Brief, status, decisions, changelog, menu, security baseline, `playbooks/` (runbooks), `checks/` (standards), `plans/` |
| `skills/` | Skills, one folder each (`.claude/skills/` is a generated local mirror, not in git) |
| `tools/` | Project tools and the hook engine (`tools/hooks/`) |
| `packs/`, `library/` | The starter's packs and optional skills, until setup installs the ones that fit and `tools/starter.mjs` clears the rest |
| `.cache/` | Scratch: screenshots, drafts, temporary output. Never committed |

## Knowledge pack folders
`docs/knowledge/` (facts by topic), `inbox/` (drop zone), `sources/` (originals), `outputs/` (deliverables).
Originals in `sources/` are never edited. Working data the project keeps current (a price list, a stock count, a
contact table the user edits) goes in `data/`. The original it came from stays in `sources/`, and its origin is
noted in `docs/knowledge/SOURCES.md`.

## App pack folders
| Folder | What |
|---|---|
| `src/` (or the stack's convention) | Application code, split by feature or area, not one giant file |
| `tests/` or tests next to the code | Automated tests; fixtures in a `fixtures/` folder |
| `scripts/` | Install, launch, build and maintenance scripts the root start file calls |
| `assets/` or `public/` | Images, fonts, icons, static files |
| `docs/specs/`, `docs/releases/`, `docs/lessons.md`, `docs/foundation.md` | App docs |
| `dist/`, `build/` | Build output. Never committed |

## Rules
- One topic per file and one purpose per folder. Split a file once it does several unrelated jobs.
- Names describe content (`export-csv.js`, `pricing.md`), never status (`final`, `new`, `v2-fixed`). Versions are
  written as versions: `report v2.md`, or git.
- No stray files: nothing left over from a command (`nul`, empty files, `out.txt`, `tmp.json`). Scratch goes in `.cache/`.
- The start file stays thin. It calls `scripts/` and holds no logic of its own.
