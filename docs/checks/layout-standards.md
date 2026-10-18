# Layout standards (where things go)

Everything lives in a folder that says what it is. The root stays small: what a person opens first, plus (for apps)
one file that starts the app. The Stop hook blocks new loose files in the root (REQ: root-tidy), and the audit flags
existing ones. Allowed root files are `rootAllowed` in `tools/hooks/config.json`; packs and setup extend the list.

## The root
| Kind | Files |
|---|---|
| Read first | `README.md`, `HOW-TO-USE.md`, `AGENTS.md` (plus its local twin `CLAUDE.md`, not in git), `DIRECTORY.md`, `SETUP-PROMPT.md` (until setup is done), `LICENSE` |
| Start the app (apps only) | ONE obvious start file, e.g. `Start <App>.bat` (Windows) and `start.sh` (macOS/Linux), or the toolchain's own (`npm start` via `package.json`). The README's first instruction points at it. |
| Toolchain config that must sit in the root | `package.json` and its lock file, `pyproject.toml`, `requirements.txt`, `Cargo.toml`, `go.mod`, `tsconfig.json`, bundler config, `.gitignore`, `.gitattributes`, `.editorconfig`, `.env.example` |

Everything else goes in a folder. When in doubt, use a folder.

## Core folders (every project)
| Folder | What |
|---|---|
| `docs/` | Brief, status, decisions, changelog, menu, security baseline, `playbooks/` (runbooks), `checks/` (standards), `plans/` |
| `skills/` | Skills, one folder each (`.claude/skills/` is a generated local mirror, not in git) |
| `tools/` | Project tools and the hook engine (`tools/hooks/`) |
| `library/` | The starter's optional skills, until setup enables the ones that fit and `tools/starter.mjs` clears the rest |
| `.cache/` | Scratch: screenshots, drafts, temporary output. Never committed |

## Knowledge pack folders
`docs/knowledge/` (facts by topic), `inbox/` (drop zone), `sources/` (originals), `outputs/` (deliverables).

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
