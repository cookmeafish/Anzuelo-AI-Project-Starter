---
name: repo-setup
description: Gets a freshly cloned or unfamiliar repository to install, build, run and pass its tests locally, for any language or stack. It reads the setup recipe the repo already has (CI config, manifests, lock files, env templates), installs the pinned toolchain and dependencies, creates local env files from templates without inventing secrets, records a test baseline, and writes the result down as one start file plus the app gates. Use when a project is cloned or adopted for the first time, when "it doesn't build on my machine", or before parallel work that needs several working copies.
triggers: set up the repo, setup repo, clone and run, get it running, install dependencies, run it locally, fresh clone, worktree, worktrees
---
# Repo setup: from clone to green, once

A repo is set up when a new person can start it with one command and the tests tell the truth. Most setups fail on
things the repo already wrote down somewhere (a pinned version, an env template, a code generation step), so read
first and install second. Every step here is safe to run again: check what exists, skip it, and say so.

Say at the start: "Setting up the repo (repo-setup skill)."

## 1. Read the recipe the repo already has
Look before installing anything. In order of trust:
1. **CI config.** It is the one setup that runs on every change, so it is the most likely to be current: the
   toolchain versions, install commands, services and test commands it uses.
2. **Manifests and lock files.** They name the package manager and the dependencies. The lock file decides the
   package manager; never mix two.
3. **Version pins:** toolchain files, `engines` fields, container base images.
4. **Env templates** (`.env.example`, `.env.default`, `.env.sample`) and the code that reads them.
5. **Existing scripts and task runners** (`scripts/`, a Makefile or similar, package scripts).
6. **README and contributor docs.** Useful, but often stale. When they disagree with CI, trust CI and note the gap.

[references.md](references.md) lists where each kind of clue usually lives. Write down what you found before acting.

## 2. Check what is already done
Is there an installed dependency folder, a local env file, a built output, extra working copies? Keep what works.
Never overwrite a local env file or delete a working copy without asking: they can hold the user's own settings and
unsaved work.
- **Working copies:** ask git, not the folder names. `git worktree list` shows every copy git knows about, wherever it
  lives and whatever it is called. More than one entry means a layout already exists: extend it, don't rebuild it.
- **Half-finished earlier setup:** a branch without its folder, or a folder git no longer tracks
  (`git worktree prune --dry-run` lists those). Report them before creating anything new.

## 3. Ask only what the repo can't tell you
One focused question, with options where possible. Typical gaps: which branch to start from, which optional services
are needed, where real secrets come from, and whether parallel working copies are wanted and how many (step 9).
Small, reversible details: decide and say what you assumed (AGENTS.md, Step 0).

## 4. Match the toolchain
Install or select the exact versions the repo pins. A "close enough" version is the most common source of failures
that look like code bugs. If a pinned version is missing on this machine, say which one and how to get it; don't
silently use another.

## 5. Create local env files from templates
Env files often live in more than one folder (one per service or package in a multi-part repo). Find every template
and every place the code reads the environment, and keep that list in one place (a script in `scripts/`) so the main
checkout and every later working copy use the same list. Two lists drift apart. For each location:
1. A local env file exists: keep it.
2. Only a template exists: copy it to the local name and list every value that still needs a real secret.
3. Neither exists: read the code for the variables it needs, list them, and ask whether to continue without them.

Never invent a secret, never put a real one in a template, a log or a commit, and check that the local env file is
ignored by git. Report each env file as kept, created from a template, or missing. If no env file and no template was
found anywhere, stop and ask before going on: the app may not start at all without them.

## 6. Install dependencies
Use the lock-file-respecting install (the "clean install" form of the package manager), so the result matches CI.
Then run any generation steps the repo needs (schema clients, compiled protocols, assets). Long installs run in the
background while you read on; say when they finish. With several working copies, install them one after another and
record each as done or failed, so one failure doesn't hide behind the others. On a failure, stop and use the debug
skill. Don't retry the same command with random flags.

## 7. Start the services it depends on
Databases, queues, caches, emulators: start only what the tests or the app actually need, the way CI does
(containers if the repo provides them). Note the ports, and check none is already taken by something else.

## 8. Prove it works and record the baseline
Run, in this order, and keep the output: build, the full test suite, then start the app once and see it respond.
Tests that fail on a clean setup are the **baseline**. Write them down with their error, so later work isn't blamed
for them and doesn't hide them. Don't fix them during setup unless the user asks.

## 9. Optional: parallel working copies
For parallel work (parallel-agents or orchestrate skills), make one working copy per stream with git worktrees, as
siblings of the main checkout. Layout and commands: [references.md](references.md).
1. **Agree the count and the base** (step 3). A spare copy for reviewing others' changes is optional.
2. **Update the base first** (`git fetch`), so every copy starts from the same current commit.
3. **Branch, then folder,** for each copy: create the branch from the base only if it doesn't exist, and add the
   worktree only if its folder doesn't exist. Report every skip.
4. **Local files git doesn't carry:** env files (step 5 rules and list) and any ignored local config a tool needs in
   each copy (look at what the main checkout has that `.gitignore` excludes). Copy those; never commit them.
5. **Install in each copy** (step 6). Copies don't share installed dependencies safely.
6. **Ports and data:** copies that run services need separate ports or databases, or must take turns.
7. **Verify:** `git worktree list` shows every copy on its branch. Report created, skipped and failed copies.

Never use the copy that holds the coordinator's own files as a spare. One more copy later follows the same steps for
one name. Remove a copy only with `git worktree remove`, only when its branch is merged or the user says so, and
never while it has uncommitted changes.

## 10. Write it down so the next person needs one command
- **One start file** in the root that calls `scripts/` and holds no logic (`docs/checks/layout-standards.md`). Put
  install, launch and reset steps in `scripts/`. The README's first instruction points at the start file.
- **App pack:** wire the gates to the real commands, for example
  `node tools/packs.mjs configure app --test "<test>" --build "<build>" --run "<run>" --code "<source globs>"`, then
  run the checks it prints.
  If `docs/foundation.md` is still unset, note it as the next step; it is decided with the user, not during setup.
- **`docs/STATUS.md`:** setup done, the baseline failures, missing secrets, working copies made, and anything that
  needed a workaround. The report format is in [references.md](references.md).
- Gaps between the docs and what actually worked go in `docs/STATUS.md` as open questions, not into silent fixes.

## Done when
- [ ] The toolchain matches the repo's pins, and dependencies came from the lock file.
- [ ] Every env file is reported as kept, created from a template, or missing, and no secret was invented or committed.
- [ ] If working copies were wanted: `git worktree list` shows each one on its branch, each with its env files and
      install, and every skipped or failed copy is reported.
- [ ] Build passed, the full test suite ran, and the app started once and responded.
- [ ] Baseline failures are written down with their errors.
- [ ] One start file in the root calls `scripts/`, and the README points at it.
- [ ] App gates are configured to the real commands (app pack).
- [ ] `docs/STATUS.md` says what was set up, what is missing, and what is next.

## Pitfalls
- Trusting the README over CI, then debugging a version mismatch as if it were a code bug.
- Mixing package managers, or installing without the lock file, so local results differ from CI.
- Copying a template env file and reporting "set up" while it still holds placeholder secrets.
- Overwriting a local env file or deleting a working copy that held the user's own changes.
- Two working copies sharing one port or one database, so their tests corrupt each other.
- Judging whether working copies exist by folder names instead of asking git.
- Env file locations listed in two places (setup and the per-copy step) that drift apart.
- Forgetting ignored local config when making a copy, so a tool works in the main checkout and fails in the copy.
- Fixing baseline test failures on the side, which hides that they were there before any change.
- A start file that grows its own logic instead of calling `scripts/`.

Inspired by "setup-repo" in Significant-Gravitas/AutoGPT (MIT, see LICENSE and [SOURCE.md](SOURCE.md)).
