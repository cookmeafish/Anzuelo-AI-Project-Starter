# App standards (changes, data, security, UX, performance, AI features, docs)

Baselines for any application. Items marked (check) or (hook: x) are enforced by `codeRules`, `commitGate` or
requirements.json; the rest are for the independent reviewer. Project-wide security baseline: `docs/security.md`.
This app's own decisions: `docs/foundation.md`.

## Surgical changes
- Before writing code, state the goal in one sentence and which files it touches.
- Change only what the task needs. A diff line that doesn't serve the goal comes out.
- Match the style around you: naming, formatting, error handling and patterns already in the file.
- No drive-by refactors, renames or reformatting. Note them as a separate task for the user to approve.

## Data safety (persistent state)
- **Saving needs a good load first.** If the load failed or came back incomplete, block the save, so a bad read
  can't overwrite good data. Receiving nothing is not an instruction to erase what is stored.
- Whole-file writes are atomic: temp file, then rename. A file that won't parse is set aside (`*.corrupt-<date>`),
  never treated as empty. An unreachable store is an error, never "no data".
- Saves send only what changed. Deletes are explicit, with tombstones where data syncs.
- Moves and migrations never delete. Collisions go to a dated backup folder, and a migration ships with a restore test
  (`data-change.md`).
- Async results land only where they were requested (tag them with a request id). Never write back a copy taken
  before an await.
- Tests and agent runs use a sandbox data folder or stub every write. They never touch the user's real data.
- Never save a default value over a choice the user made.

## Security
- A local server answers only on loopback and checks Host and Origin. A web page must not be able to call it.
- Never build a file path from client input. Cap request sizes.
- Untrusted HTML or markdown goes through a sanitizer (check: raw `innerHTML` assignments), and nothing rendered may
  load a remote URL by itself.
- Secrets live in ignored files (`.env*`), never in code, logs or commits (hook: no-secrets). Client-exposed env
  prefixes never carry keys the user would mind leaking.
- Never run `.cmd` or `.bat` files through `execFile` without a shell (check). Every spawned process has an error
  handler.
- No `eval` on dynamic input; parse the data instead (check).
- Errors never show internals to a visitor: the app runs in production mode by default (`NODE_ENV=production` in its
  start script for Node, debug off for Flask or Django), it has its own error handler that returns a plain page, and
  that page uses nothing set per request (a signed-in flag, the user's name), since an error can happen before those
  are set. A test sends an oversized body, a malformed one and a missing route, and checks that no response holds a
  stack trace ("at ", a file path). <!-- Lesson (website trials): a 50 KB login post failed before the page's own
  setup ran, the error page then failed too, and dev mode sent the full stack trace with the server's file paths -->
- A size cap answers with a plain 413 page, and a request over it can never crash the server.

## UX and UI
- Design tokens, not hardcoded colors. Readable contrast (WCAG AA) in every theme.
- Every user-facing string goes through the i18n layer when the app is translated, with no missing or duplicate keys.
- No native `alert`, `confirm` or `prompt` (check). Use the app's own dialogs.
- Nothing fixed-position covers controls. Layouts survive zoom and small screens.
- Errors are explained in plain words with a next step, never a raw "500".
- Deleting a control deletes its handler too.

## Performance
- **Measure, don't guess.** Every performance claim comes with before and after numbers from the same tool
  (hook: perf-numbers).
- Motion is time-based, not frame-based. Nothing animates off-screen. Heavy work runs off the main thread, in small
  slices. Cache what is expensive, keyed by its inputs.

## AI features (apps that call language models)
- One call layer; every call names its purpose and has a timeout.
- Empty, refused or truncated replies are errors, never saved as content.
- Parse model JSON tolerantly, and test the parser against real reply variants.
- Never let the model claim it changed something. The app reports what actually happened.
- Never invent prices, citations or results. Track cost.

## Docs
- The README is for users: tight, current, no internals. Every command, port and shortcut it names must exist.
- Lists that must stay in sync (routes, settings readers, tables) get a test that compares them.
- One canonical agent-instructions file (AGENTS.md = CLAUDE.md). Other copies are generated and verified, or don't exist.
