# Dependency update: commands per tool

Run each command from the folder that owns the manifest. Commands that install or upgrade need the user's OK unless
the project runs with `"autonomy": "auto"` (dependency-update skill, section B).

## Add, upgrade, remove
| Tool | Add | Upgrade one | Remove | Install from lockfile |
|---|---|---|---|---|
| npm | `npm install <pkg>@<range>` | `npm install <pkg>@<version>` | `npm uninstall <pkg>` | `npm ci` |
| pnpm | `pnpm add <pkg>@<range>` | `pnpm update <pkg>@<version>` | `pnpm remove <pkg>` | `pnpm install --frozen-lockfile` |
| yarn | `yarn add <pkg>@<range>` | `yarn up <pkg>@<version>` (classic: `yarn upgrade`) | `yarn remove <pkg>` | `yarn install --immutable` |
| bun | `bun add <pkg>@<range>` | `bun update <pkg>` | `bun remove <pkg>` | `bun install --frozen-lockfile` |
| pip | add to `requirements.txt`, then `pip install -r requirements.txt` | change the pin, reinstall | delete the line, `pip uninstall <pkg>` | `pip install -r requirements.txt` |
| uv | `uv add <pkg>` | `uv lock --upgrade-package <pkg>` then `uv sync` | `uv remove <pkg>` | `uv sync --frozen` |
| poetry | `poetry add <pkg>@<range>` | `poetry update <pkg>` | `poetry remove <pkg>` | `poetry sync` (Poetry 2; 1.x: `poetry install --sync`) |
| cargo | `cargo add <crate>@<range>` | `cargo update -p <crate> --precise <version>` | `cargo remove <crate>` | `cargo build --locked` |
| go | `go get <module>@<version>` | `go get <module>@<version>` then `go mod tidy` | remove imports, `go mod tidy` | `go mod download` |
| dotnet | `dotnet add package <Pkg> --version <v>` | same command with the new version | `dotnet remove package <Pkg>` | `dotnet restore --locked-mode` |
| flutter / dart | `flutter pub add <pkg>` / `dart pub add <pkg>` | `dart pub upgrade <pkg>` (major: `--major-versions`) | `dart pub remove <pkg>` | `dart pub get --enforce-lockfile` |
| bundler | `bundle add <gem>` | `bundle update <gem> --conservative` | `bundle remove <gem>` | `bundle install` (frozen in CI) |
| composer | `composer require <vendor/pkg>:<range>` | `composer update <vendor/pkg> --with-dependencies` | `composer remove <vendor/pkg>` | `composer install` |
| gradle | edit the version catalog (`libs.versions.toml`) or `build.gradle(.kts)` | same file | same file | `./gradlew build --write-locks` once, then normal builds |
| maven | edit `pom.xml` | `mvn versions:use-dep-version -Dincludes=<g:a> -DdepVersion=<v>` | edit `pom.xml` | `mvn -o verify` after one online build |

## What is outdated, what is vulnerable
| Tool | Outdated | Vulnerabilities |
|---|---|---|
| npm, pnpm, yarn, bun | `npm outdated`, `pnpm outdated`, `yarn outdated`, `bun outdated` | `npm audit`, `pnpm audit`, `yarn npm audit` |
| Python | `pip list --outdated`, `uv tree --outdated`, `poetry show --outdated` | `pip-audit` |
| cargo | `cargo update --dry-run` | `cargo audit` (cargo-audit, optional) |
| go | `go list -m -u all` | `govulncheck ./...` (optional) |
| dotnet | `dotnet list package --outdated` | `dotnet list package --vulnerable --include-transitive` |
| dart / flutter | `dart pub outdated` | the OSV database, or `osv-scanner` |
| bundler | `bundle outdated` | `bundle audit` (bundler-audit, optional) |
| composer | `composer outdated --direct` | `composer audit` |
| gradle, maven | `./gradlew dependencyUpdates` (plugin), `mvn versions:display-dependency-updates` | OWASP dependency-check (optional), `osv-scanner` |
| any lockfile | | `osv-scanner --lockfile=<file>` (optional, one tool for every ecosystem) |

Tools marked optional are not installed by default: ask before installing them (`docs/recommended-tools.md`).

## Workspaces
| Tool | Add to one package | Run its tests |
|---|---|---|
| npm | `npm install <pkg> -w packages/<name>` | `npm test -w packages/<name>` |
| pnpm | `pnpm add <pkg> --filter <name>` | `pnpm --filter <name> test` |
| yarn | `yarn workspace <name> add <pkg>` | `yarn workspace <name> test` |
| bun | `cd packages/<name> && bun add <pkg>` | `bun test` in that folder |
| uv | `uv add <pkg> --package <name>` | `uv run --package <name> pytest` |
| cargo | `cargo add <crate> -p <name>` | `cargo test -p <name>` |
| go (go.work) | `go get` inside the module folder | `go test ./...` inside it |
| dotnet | `dotnet add <project.csproj> package <Pkg>` | `dotnet test <project.csproj>` |
| dart (pub workspaces) | `dart pub add <pkg>` inside the package folder | `dart test` inside it |

After a change in one package, also run the gates of every package that depends on it.

## Framework and runtime
| Moving | Tool that helps | Version files to update |
|---|---|---|
| Node.js | none needed; read the release notes | `.nvmrc`, `.node-version`, `engines` in package.json, CI matrix |
| React, Next.js, Angular, Vue | the framework's codemods (`npx @next/codemod`, `ng update`, the Vue migration build) | package.json |
| Python | `pyupgrade` (optional) | `.python-version`, `requires-python`, CI matrix |
| Django | `django-upgrade` (optional), deprecation warnings with `python -Wd` | requirements |
| Rust | `cargo fix --edition` for an edition change | `rust-toolchain.toml`, `rust-version`, `edition` |
| Go | `go fix ./...` | `go` line in go.mod, toolchain line |
| .NET | .NET Upgrade Assistant (optional) | `global.json`, `TargetFramework` |
| Flutter / Dart | `dart fix --apply` | `environment.sdk` in pubspec.yaml, CI |
| Rails | `bin/rails app:update` | `Gemfile`, `.ruby-version` |
| Spring Boot, Gradle | OpenRewrite recipes (optional), `./gradlew wrapper --gradle-version <v>` | build files, wrapper properties |

## Gates commonly used for the before/after line
`npm test`, `npm run build`, `npm run lint`, `npx tsc --noEmit`, `pytest`, `ruff check`, `mypy .`, `cargo test`,
`cargo clippy`, `go test ./...`, `go vet ./...`, `dotnet test`, `flutter test`, `dart analyze`, `bundle exec rspec`,
`vendor/bin/phpunit`, `./gradlew check`, `mvn verify`.
