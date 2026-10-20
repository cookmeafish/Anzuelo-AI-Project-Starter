---
name: package-release
description: Prepares a library or command-line tool for a package registry (npm, PyPI, crates.io, pub.dev, NuGet, RubyGems, Maven Central) the safe way. Decides the semantic version from what changed for users, writes the changelog entry, checks the public API for breaking changes, previews the package contents with a dry run, keeps the minimum supported language version honest, and publishes only with the user's OK. Use when a published package gets a new version, when the public API of a library changes, or when the user asks to publish a package, choose the version number, check for breaking changes, yank a release or see what goes into the package.
triggers: publish the crate, publish to npm, publish to pypi, publish to crates.io, publish to pub.dev, publish to nuget, publish the package, publish the library, cargo publish, npm publish, twine upload, semver, semantic versioning, semver bump, breaking change, public api, changelog entry, yank a release, yank the version, dry run publish, package contents, what goes into the package, minimum supported version, msrv
---
# Package release: the right version, the right contents

Users trust a package's version number to say whether an update can break their code, and its contents to hold only
what they should. Neither can be taken back: registries keep old versions, and a yank does not remove downloads.

Say at the start: "Preparing the package release (package-release skill)."

## What the other skills already cover
- **The release itself** (gates, release notes, rollback plan, branch, attribution scan, asking for the OK): the
  release runbook (app pack). Follow it alongside this skill; this skill adds the registry side.
- **Publishing is gated by the engine:** the publish-gate denies `npm publish`, `cargo publish`, `twine upload`,
  `dart pub publish` and the like (not with `--dry-run`) until the security-review skill ran this turn or one is
  logged today in `docs/security.md`, and the outward-gate holds outward actions until the user gives the OK in this
  conversation (AGENTS.md rule 6). Don't work around either; run the review, then ask.
- **Adding or upgrading the package's own dependencies:** the dependency-update skill.
- **A failing build or test on the minimum version:** the debug skill.

## Pick the situation
| Situation | Do |
|---|---|
| "What should the next version be?" or "is this breaking?" | **A**, **B** |
| Preparing a new version for publishing | **A**, **B**, **C**, **D**, **E**, then **F** with the OK |
| "What goes into the package?" | **D** |
| Raising the minimum language or runtime version | **C**, then **A** (it is a breaking change for some users) |
| A bad version is out | **G** |

## A. Decide the version from what users see
1. List every change since the last tag: `git log --oneline <last-tag>..HEAD`, plus the merged pull requests.
2. Sort each by what a user of the package notices, not by diff size:
   - **major:** a public item removed or renamed, a signature or default changed, behavior changed that callers
     relied on, the minimum supported language version raised, a supported platform dropped;
   - **minor:** a new public item, a new option with a safe default, a deprecation (still working);
   - **patch:** a bug fix, docs, internal changes, performance with the same results.
3. Before 1.0.0 the convention is: breaking goes into minor, everything else into patch. Say which convention the
   project follows.
4. Pre-releases get a suffix (`2.0.0-rc.1`, PEP 440 `2.0.0rc1`) and never the registry's default tag.

## B. Check the public API for breaking changes
Use a tool, don't guess:
| Ecosystem | Check |
|---|---|
| Rust | `cargo semver-checks` (optional tool) |
| TypeScript / npm | `npx @arethetypeswrong/cli --pack` for the types and entry points; `api-extractor` (optional) for an API diff |
| Python | `griffe check <package> --against <last-tag>` (optional), or a diff of the public names in `__all__` |
| Dart / Flutter | `dart pub publish --dry-run` warnings, and a diff of the exported library files |
| .NET | package validation: `<EnablePackageValidation>true</EnablePackageValidation>` with a baseline version |
| Java / Kotlin | `japicmp` or the Kotlin binary-compatibility validator (optional) |
| Ruby, PHP | a diff of public classes and methods since the last tag |

Every break found either moves the version to major or gets undone (keep the old name as a deprecated alias).

## C. Minimum supported version
1. Read the declared minimum: `rust-version` in `Cargo.toml`, `requires-python` in `pyproject.toml`, `engines` in
   `package.json`, `environment.sdk` in `pubspec.yaml`, `TargetFramework(s)` in the project file,
   `required_ruby_version` in the gemspec, `require.php` in `composer.json`.
2. Run the tests on that minimum and on the latest (CI matrix or a local toolchain). An untested minimum is a guess.
3. Raising it is a decision: a `docs/DECISIONS.md` row and a changelog line under "Breaking" (or per the project's
   stated policy, if it treats it as minor).

## D. Preview the contents with a dry run
Build the package and read the file list before anything leaves the machine:
| Ecosystem | Dry run | Read |
|---|---|---|
| npm, pnpm, yarn | `npm pack --dry-run` (or `pnpm pack`, `yarn pack --dry-run`) | the "Tarball Contents" list |
| Rust | `cargo package --list`, then `cargo package` to build it | the file list; the build proves it compiles alone |
| Python | `python -m build` (or `uv build`, `poetry build`), then `twine check dist/*` | `tar -tzf dist/*.tar.gz` and `unzip -l dist/*.whl` |
| Dart / Flutter | `dart pub publish --dry-run` | the file tree and warnings |
| .NET | `dotnet pack -c Release` | the `.nupkg` is a zip: `unzip -l` it |
| Ruby | `gem build *.gemspec` | `tar -xOf <gem> data.tar.gz \| tar -tz` |
| Java / Kotlin | `./gradlew publishToMavenLocal` or `mvn package` | `jar tf` on the built jars |

Check the list: no secrets or `.env` files, no test fixtures with real data, no build caches or large unrelated
files; the license, README, and the entry points and type files the manifest names are present. Fix the
include/exclude rules (`files` in package.json, `.npmignore`, `include`/`exclude` in Cargo.toml, `MANIFEST.in` or
the build backend's settings) and rerun the dry run.

## E. Changelog and version, together
1. Add the changelog entry under the new version, written for users and grouped as Breaking, Added, Fixed,
   Deprecated. Each breaking item says what to do instead.
2. Set the version in the manifest in the same change, and every place that repeats it (`__version__`, a version
   constant, the docs).
3. Run the gates and the dry run again on the final state.
4. Tag `vX.Y.Z` locally. Pushing the tag waits for **F**.

## F. Publish, only with the OK
1. Run the security-review skill on what changed since the last release (the publish-gate needs it).
2. Ask, in one message: package name, version, registry, the file count from **D**, and the tag. Wait for the OK.
3. Publish with the registry's command, using a token from the environment or trusted publishing, never a token in a
   repository file.
4. After it succeeds, push the tag and check the registry page shows the new version and its files.

## G. A bad version is out
1. Publish a fixed version first; most users will pick that up.
2. Then deprecate or yank the bad one, with the user's OK: `npm deprecate <pkg>@<version> "<why>"`,
   `cargo yank --version <v>`, a yank on PyPI's web page, `dart pub` retract within 7 days, `dotnet nuget delete`
   (unlists). These are outward actions too.
3. Say in the changelog what was wrong and which version to use.

## Done when
- [ ] A dry run of the package ran this turn and its file list was read (hook: package-dry-run).
- [ ] The version follows from the changes in **A**, and the API check in **B** ran or its absence is stated (judgment: whether a change breaks users needs a reader).
- [ ] The changelog entry and the version changed together (judgment: changelog file names and formats differ by project).
- [ ] The minimum supported version was tested, or the answer says it was not (judgment: needs the CI matrix).
- [ ] Publishing waited for the security review and the user's OK (hook: publish-gate, outward-gate).

## Pitfalls
- Judging the version by the size of the diff: a one-line default change can be major, a large refactor can be patch.
- A package that works from the repository but fails when installed, because a built or type file was left out.
- Publishing from a dirty tree, so the package holds files that are in no commit.
- Raising the minimum language version in a patch release.
- Pushing the tag before the publish succeeded, so the tag points at a version that does not exist on the registry.
- Yanking instead of fixing: the yanked version stays in lockfiles that already resolved it.
