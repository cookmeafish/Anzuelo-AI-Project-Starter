# Review: installing the engine into a large established AI app (2026-11-13)

Three independent read-only reviews of a large, established, distributed AI app ("project four"), plus a fourth
profile, checked against the engine's install, wire and upgrade code (branch app-port). Oversight confirmed the two
blocking findings in the code itself. Nothing was installed or changed in the app.

## Ground truth about the app
- An Electron and Vite app that runs unpackaged from a git checkout. Other people install it by cloning or by a ZIP of
  `master`. Its self-updater counts only tracked changes as dirty, then runs `reset --hard FETCH_HEAD` on `origin master`.
- An AI-first app. Its runtime AI (question generation, answer grading, prompts, model and key handling) is app code.
- It has its own very large rules files: CLAUDE.md for one AI tool and AGENTS.md for another. They differ, are about
  262 KB each, and CLAUDE.md is about 65k tokens. It also has a tracked project skill in `.claude/skills/`, a drifted
  ignored copy in `.agents/skills/`, and an ignored `.claude/settings.local.json` with 11 permissions.
- Git: no hooks today, LFS filters configured, two live worktrees under `.claude/worktrees/`, and its own block in
  `.git/info/exclude`. `core.autocrlf=true`. A file named `nul` sits in the root.
- Its test runner runs every `*.test.*` file under the root, dot-folders included. Its dev server polls the root every
  300 ms and serves files under it to its own origin.
- One of its tests parses a marked section of its CLAUDE.md.

## Confirmed breaks (blocking)
1. **Every push would be refused** once the engine's git hooks are set. The push check (repo.mjs) treats `.claude/skills`
   and `.cache` as engine-private. The app tracks its own skill there, and its own `.cache` is app data. The check also
   wants secret-file names the app doesn't have to be ignored. Fix: in the `.anzuelo` layout, check only paths the engine
   wrote (the ownership manifest and the `.mirror` marker), and never the project's own files.
2. **Commits in the app's worktrees run no checks,** silently, because the hooks path is relative. A later LFS install
   would put its hooks into the engine's folder, and the engine clone would then refuse upgrades. Fix: don't take the
   hooks path when the repo has worktrees or LFS. Rely on the in-session commit guard and say so; or use an absolute
   path that chains to any existing hooks.
3. **The uninstall writes engine records into the app's real `docs/`, `skills/` and `docs/playbooks/`.** It also writes
   a decision note after deleting `.anzuelo/`, puts its backup in the app's own `.cache/`, and leaves both exclude
   blocks. Fix: restore only what the project had (from the install's own record), back up outside the project, and
   remove the engine's exclude blocks.

## Likely breaks or slowdowns (fix before the install)
4. **Name-marker sync** can rewrite any tracked `.md`, `.txt` or `.html` that holds a marker. Rule: never touch tracked
   files of an adopted project.
5. **The change snapshot walks the whole root** every prompt and stop, worktrees and build output included. The ignore
   list it builds from .gitignore drops dot-folders, globs and lines without a trailing slash. Fix: take the list from git
   itself (`ls-files -oi --exclude-standard --directory`), and skip nested checkouts and reserved names (`nul`).
6. **Engine state churns under the root** while a dev server polls it and serves it. Fix: for apps that watch their
   root, keep high-churn state outside the project folder. Ship no `.html`, `*.test.*` or `*.spec.*` files in the
   engine's folders or skill copies.
7. **CLAUDE.local.md is replaced whole** if it exists. Fix: add the import line, never replace the file.
8. **The pre-commit check refuses commits from sessions the hooks never saw** (started before install). Fix: refuse only
   when the session's settings carry the engine's hooks.
9. **The agent wrote engine scratch (its answer draft) into the app's own `.cache/`.** Fix: every engine scratch path
   goes to the engine's own place.

## Conflicts with the app's own coding rules (the app's rule wins)
10. Never sync or regenerate either rules file. The engine's rules come in only through CLAUDE.local.md.
11. **Records:** the version bump plus the commit message is the changelog. No CHANGELOG, STATUS or DECISIONS asks. New
    rules go into the app's own rules sections.
12. **GUI:** the gui pack stays off. The app's own drive script (port 3001, localhost, stubbed data) is the review loop.
    The app's gates are vitest, vite build and the drive script.
13. **Attribution:** the app names AI providers legitimately. Only trailers, author identity and "generated with" lines
    are blocked.
14. **Load:** with about 65k tokens of the app's own rules, the engine runs light. No STATUS or open-plan dump at
    session start, a short reminder, format and record items off, and a work log that tracks without holding.
15. The owner writes in caps often. Plain caps aren't upset by themselves in this project, but its own "QA" complaint
    word is.
16. Generated and data folders are never "changed files" for engine checks.

## The boundary (the user's top rule)
- `.anzuelo/` is solely for the AI agent that codes the app.
- Anything that drives the app's own AI at runtime is app code: its runbooks and skills, prompts, project hooks that
  enforce app rules, templates. It stays tracked and pushed and ships to users. The engine never moves it or claims it.
- The engine never moves, renames, replaces or deletes a project file. Delete `.anzuelo/` and the app still builds,
  tests and runs. A fresh clone carries no engine.

## Safe, checked
- Install changes no tracked file today, apart from row 4 above. The self-updater still works, and `reset --hard` leaves
  the ignored `.anzuelo/` alone.
- The tracked project skill and its drifted copy are untouched (no `.mirror` marker).
- Neither rules file is written in this layout. No `.gitattributes` is added.
- The app's own exclude block is kept, and the engine only appends after it.
- Nothing in the app's runtime reads `.claude/`, CLAUDE.md or `.anzuelo/`. The only exception is a test that reads a
  marked CLAUDE.md section.
- The engine ships no test files today.

## Gate before the install
All of 1-9 fixed at the source, each with a test on an app-shaped sample. Then the adoption trial passes on a sample
with these shapes, plus the three proofs (delete `.anzuelo/`, fresh clone, packaging). After that comes a release
pushed to `main`, and the install from that pushed commit.
