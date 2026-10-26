---
name: dependency-update
description: Adds, upgrades or removes a third-party dependency, or upgrades a framework, language runtime, SDK or engine, without making the project worse. Checks why it is needed, its license, maintenance and known vulnerabilities, makes the smallest change in the right package (workspaces and monorepos included), runs the project's gates before and after and compares them, changes one thing at a time, rolls back on a regression, and records the decision. Covers npm, pnpm, yarn, bun, pip, uv, poetry, cargo, go, dotnet, flutter and dart pub, bundler, composer, gradle and maven. Use when the user asks to add, install, bump, upgrade, pin or remove a package or library, to move to a newer framework or runtime version, when an audit or a bot reports a vulnerable or outdated dependency, or when a lockfile changes.
triggers: add a dependency, add a package, install a package, add a library, remove a dependency, remove the package, upgrade the package, upgrade a dependency, upgrade dependencies, update dependencies, update the dependencies, outdated packages, outdated dependencies, npm audit, pip-audit, cargo audit, dependabot, renovate, vulnerable dependency, vulnerable package, pin the version, lockfile, lock file, framework upgrade, upgrade the framework, upgrade the runtime, upgrade node, upgrade python, upgrade flutter, major version upgrade, is it safe to upgrade, is it safe to update, bump the dependency, npm packages, upgrade react, bump express, add lodash, upgrade to
---
# Dependency update: one proven change at a time

A dependency is someone else's code running with this project's permissions. An upgrade is done only when proven no
worse than before. "It installed" is not proof.

Say at the start: "Changing dependencies one at a time, with gates before and after (dependency-update skill)."

## What the other skills already cover
- **Weighing a new dependency:** the engine's worth-it check (AGENTS.md rule 16) requires `Worth it: <gain> / <cost>`
  whenever a dependency is added, by command or by editing a manifest. Section **B** gives the facts for that line.
- **Recording the decision:** the architecture skill, when enabled, and its check on installs (architecture-trigger)
  accept a row in `docs/DECISIONS.md`. Step **E**6 writes that row.
- **Facts from the web** (release dates, advisories, maintainer counts): the research skill. Cite what you read.
- **A gate that fails after the change:** the debug skill finds the cause before any fix.
- **A security audit of the whole app:** the security-review skill. This skill only checks the packages it touches.
- **Publishing your own package to a registry:** the package-release skill.
- **A database schema or data format migration:** the data-change runbook (app pack), not this skill.

Commands per package manager are in [references.md](references.md).

## Pick the situation
| Situation | Do |
|---|---|
| Add a new dependency | **A**, **B**, **C**, **D**, **E** |
| Upgrade one dependency (patch, minor or major) | **B** (vulnerabilities and license of the new version), **C**, **D**, **E** |
| Upgrade a framework, runtime, SDK or engine | **C**, **F**, then **E** |
| An audit or bot reports a vulnerable or outdated package | **B**, then one upgrade per round through **C**, **D**, **E** |
| Remove a dependency | **C**, **D** (removal steps), **E** |
| A gate that passed before fails after | **G** |

## A. Is it needed?
1. Say in one line what it is for.
2. Check that the project, the standard library or an existing dependency does not already do it. Search every
   manifest (each workspace's `package.json`, `pyproject.toml`, `requirements*.txt`, `Cargo.toml`, `go.mod`,
   `*.csproj`, `pubspec.yaml`, `Gemfile`, `composer.json`, `build.gradle*`, `pom.xml`) and the code.
3. A package that saves a few lines is usually not worth a new supply-chain risk. Say so and stop.

## B. Vet it (untrusted code until vetted)
1. **Exact name.** Compare it with the registry page and the source repository. Lookalike names (typosquats) exist.
2. **License allows commercial use:** MIT, Apache-2.0, BSD, ISC, MPL-2.0, Unlicense and zlib are fine. GPL, AGPL,
   LGPL for static linking, "non-commercial" or no license: stop and ask the user.
3. **Maintained:** last release date, open security issues, more than one maintainer, recent commits. Note what you
   found; abandonment is a cost.
4. **Known vulnerabilities** for the exact version you will install (audit commands in references.md, or the OSV
   database at osv.dev).
5. **Weight:** how many transitive packages it brings and whether it runs install scripts.
6. These facts go into the `Worth it:` line. Installing third-party code needs the user's OK unless the project runs
   with `"autonomy": "auto"`, and always needs it for install scripts from an unknown publisher.

## C. Baseline before the change
1. Start from a clean working tree (commit or stash first) so a rollback is one command.
2. Run the project's gates and note each result line: tests, build, lint, type check (with the app pack, the
   commands set by `node tools/packs.mjs configure app`), plus the security audit.
3. For a framework or runtime upgrade, also note the timings you care about (build time, test time, startup).
4. A gate that already fails is listed as "failing before", so it is not blamed on the change.

## D. Smallest change, right place
1. **One thing per round:** one dependency, or one group that must move together (a framework and its plugins).
   Two unrelated upgrades in one round hide which one broke the build.
2. **Right package.** In a monorepo or workspace, add it to the package that imports it, never the root unless every
   package uses it (references.md, "Workspaces"). Shared tooling (linters, type checkers) goes in the root dev
   dependencies.
3. **Use the package manager**, never a hand edit of the lockfile. The manifest and lockfile change together.
4. **Version range** follows the project's convention. Never "latest" or `*`.
5. **Upgrades:** read the changelog or migration guide for every version between old and new. List the breaking
   changes that touch this project and fix those call sites in the same round.
6. **Removal:** delete the imports first, then the dependency, then search that nothing else imports it.

## E. After, compare, record
1. Run the same gates as **C**, the same way.
2. Write the comparison in the answer as one line per gate: `Before/after: tests 214 pass -> 214 pass, build ok ->
   ok, audit 2 high -> 0`. A timing that is more than 1.5x slower is reported with the numbers.
3. A gate that passed before and fails now is a regression: go to **G**. Never call it done with one.
4. Run the audit again for the changed packages.
5. Check that only expected files changed (`git status`): manifest, lockfile and the call sites from **D**5.
6. Record an addition, a removal or a major upgrade in `docs/DECISIONS.md`: what, why, what it rules out, and the
   advisory it fixes, if any. Patch and minor bumps need only the CHANGELOG line.

## F. Framework, runtime, SDK or engine upgrade
1. Read the official upgrade guide end to end. Write down each step that applies to this project.
2. Upgrade on a branch: `git switch -c upgrade/<what>`.
3. Use the tool that owns the upgrade when there is one (references.md, "Framework and runtime"), then the version
   files (`.nvmrc`, `.python-version`, `rust-toolchain.toml`, `global.json`, `go.mod` go line, the CI matrix).
4. Apply renames and removals in the project's own files, each one listed in the answer.
5. Go through **E**. Engine and framework upgrades always get a `docs/DECISIONS.md` row.

## G. Roll back on a regression
1. Undo the change completely: `git restore` the manifest and lockfile (or `git switch -` and delete the branch),
   then reinstall from the lockfile (`npm ci`, `uv sync`, `cargo build`, and so on).
2. Run the gates again. They must match the baseline from **C**; if they don't, the rollback is not complete.
3. Report the regression, the version that caused it, and the options: a smaller step, wait for a fix, or fix the
   call sites (debug skill).

## Done when
- [ ] The gates ran after the manifest or lockfile change, and the answer has a `Before/after:` line per gate (hook: dependency-gates-compared).
- [ ] A new dependency has `Worth it: <gain> / <cost>` with license, maintenance and vulnerabilities (hook: worth-it).
- [ ] No gate that passed before fails after, or the change was rolled back and the gates match the baseline (judgment: needs the two result sets side by side).
- [ ] Manifest and lockfile changed together, in the right package (judgment: lockfile names and workspace layouts differ by tool).
- [ ] Additions, removals and major upgrades have a `docs/DECISIONS.md` row (judgment: minor and patch bumps need none; architecture-trigger covers installs when the architecture skill is enabled).

## Pitfalls
- A package added at the root of a monorepo makes every package depend on it and hides which one needs it.
- `npm install` without `-w` in a workspace rewrites the root lockfile in ways nobody asked for.
- Merging several bot upgrades at once: batch only patch updates of dev tools, review the rest one by one.
- An audit "fix" with `--force` that jumps a major version without reading the changelog.
- A rollback that restores the manifest but not the lockfile, or not the installed packages, leaves a third state that
  matches neither version.
- Running the "after" gates with different flags or a warm cache, so the comparison means nothing.
