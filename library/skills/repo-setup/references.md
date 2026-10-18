# Repo setup: where the clues live

Names vary by stack. Look for the kind of file, not one exact name.

| What you need | Where it is usually written |
|---|---|
| Toolchain version | A version file in the root (one per language or a shared one), an `engines` or `requires` field in the manifest, the container base image, the CI setup step |
| Package manager | The lock file in the root decides it. A manifest field may pin the manager's own version |
| Install command | CI install step; package scripts; a Makefile or task runner target; `scripts/` |
| Generated code | Package scripts named like generate, codegen, build:types; schema or protocol folders; a post-install hook |
| Services | A compose file or dev container config; CI service containers; the README's prerequisites |
| Env variables | Env templates; the config module that reads the environment; CI secrets and variables (names only) |
| Test command | CI test step; the manifest's test script; the test runner's config file |
| Run command | Package start or dev script; a Procfile; the container entry point; launch scripts in `scripts/` |
| Known setup quirks | Contributor docs, the issue tracker's "setup" or "install" labels, comments in CI config |

## Env file states to report
| State | Meaning | Next step for the user |
|---|---|---|
| Kept | A local env file already existed | None, unless values are missing |
| Created from template | Copied from the template | Fill the listed secrets |
| Missing | No file and no template | Provide the listed variables, or confirm the app runs without them |

## Parallel working copies
```
parent/
  <repo>/            main checkout (exists already)
  <repo>-review/     optional: a clean copy for reviewing others' changes
  <repo>-1 .. -N/    one per parallel work stream, each on its own branch
```
- Create each branch from the agreed base, then its worktree. Skip any that exist.
- Copy env files from the main checkout into each copy, with the same kept / template / missing rules.
- Copy ignored local tool config too (files the main checkout has that `.gitignore` excludes and a tool reads).
- Install dependencies in each copy. Copies don't share installed dependencies safely.
- Remove a copy only when its branch is merged or the user says so, and never with uncommitted changes in it.

Commands (git, any platform; `<base>` is the agreed start point, for example `origin/main`):
| Job | Command |
|---|---|
| List copies git knows | `git worktree list` (add `--porcelain` for one field per line, for scripts) |
| Find stale entries | `git worktree prune --dry-run` |
| Does a branch exist? | `git branch --list <branch>` (prints the name when it exists, nothing when not) |
| New branch | `git branch <branch> <base>` |
| New copy on it | `git worktree add ../<repo>-<n> <branch>` |
| Branch and copy in one go | `git worktree add -b <branch> ../<repo>-<n> <base>` |
| Remove a merged copy | `git worktree remove ../<repo>-<n>` (refuses when there are uncommitted changes; keep it that way) |

## Setup report
End with a short report the user can scan:
- Toolchain: pinned versions and what was installed or selected.
- Env files per location: kept, created from a template (with the secrets still to fill), or missing.
- Install and generation: done or failed, per working copy.
- Working copies: created, skipped (already there), failed.
- Baseline: build, tests (failures with their errors), app started.
- Warnings and workarounds, and the next step.
