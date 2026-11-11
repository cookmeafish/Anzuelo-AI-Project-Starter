// REQ: root-tidy (rule 13). Shared by both engines: hooks.mjs and v2 end.mjs call rootToolchainFile with their own
// glob matcher and the root's file names. Moved whole from hooks.mjs (2026-11-10), unchanged.
// The files a language or tool needs in the project root, by ecosystem (REQ: root-tidy). "files" may always sit there:
// their names say what they are. "sources" only when one of the ecosystem's "markers" is in the root too: Go's package
// main sits next to go.mod, a .NET app's Program.cs next to its project file, Godot's icon next to project.godot.
// Lesson: root-tidy blocked a Go service's new main-package files, and the agent loosened rootAllowed to get past it.
export const ROOT_TOOLCHAINS = [
  { name: 'Go', markers: ['go.mod', 'go.work'], files: ['go.mod', 'go.sum', 'go.work', 'go.work.sum', '.golangci.y*ml', '.golangci.toml', '.goreleaser.y*ml'], sources: ['*.go'] },
  { name: 'Rust', files: ['Cargo.toml', 'Cargo.lock', 'rust-toolchain', 'rust-toolchain.toml', 'rustfmt.toml', '.rustfmt.toml', 'clippy.toml', 'deny.toml'], markers: ['Cargo.toml'], sources: ['build.rs'] },
  { name: 'Python', markers: ['pyproject.toml', 'setup.py', 'requirements.txt', 'manage.py'], files: ['pyproject.toml', 'setup.py', 'setup.cfg', 'requirements*.txt', 'constraints*.txt', 'uv.lock', 'poetry.lock',
    'Pipfile', 'Pipfile.lock', 'pdm.lock', '.python-version', 'tox.ini', 'noxfile.py', 'pytest.ini', 'mypy.ini', '.flake8', 'ruff.toml', '.ruff.toml', '.pylintrc', 'MANIFEST.in', 'environment.y*ml'],
    sources: ['conftest.py', 'manage.py'] },
  { name: 'Node and the web', markers: ['package.json', 'deno.json', 'deno.jsonc'], files: ['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', 'yarn.lock', '.yarnrc*',
    'bun.lockb', 'bun.lock', 'bunfig.toml', 'deno.json', 'deno.jsonc', 'deno.lock', 'tsconfig*.json', 'jsconfig*.json', '*.config.js', '*.config.mjs', '*.config.cjs', '*.config.ts', '*.config.mts',
    '.npmrc', '.npmignore', '.nvmrc', '.node-version', '.browserslistrc', '.babelrc*', '.prettierrc*', '.prettierignore', '.eslintrc*', '.eslintignore', '.stylelintrc*', 'biome.json', 'biome.jsonc',
    'turbo.json', 'nx.json', 'lerna.json'], sources: ['index.html'] },
  { name: 'Java and Kotlin (Gradle, Maven, sbt)', files: ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts', 'gradle.properties', 'gradlew', 'gradlew.bat', 'pom.xml', 'mvnw', 'mvnw.cmd', 'lombok.config', 'build.sbt'] },
  { name: '.NET', markers: ['*.csproj', '*.fsproj', '*.vbproj'], files: ['*.csproj', '*.fsproj', '*.vbproj', '*.sln', '*.slnx', 'global.json', 'nuget.config', 'NuGet.Config', 'Directory.Build.props', 'Directory.Build.targets', 'Directory.Packages.props'],
    sources: ['*.cs', '*.fs', '*.vb'] },
  { name: 'Flutter and Dart', files: ['pubspec.yaml', 'pubspec.lock', 'analysis_options.yaml', '.metadata', 'l10n.yaml', 'build.yaml', 'devtools_options.yaml', 'dart_test.yaml'] },
  { name: 'Godot', markers: ['project.godot'], files: ['project.godot', 'export_presets.cfg', 'default_bus_layout.tres', 'default_env.tres'], sources: ['icon.svg', 'icon.svg.import', 'icon.png', 'icon.png.import'] },
  { name: 'Unreal', files: ['*.uproject'] },
  { name: 'Ruby', files: ['Gemfile', 'Gemfile.lock', 'Rakefile', 'config.ru', '.ruby-version', '.rubocop.yml', '*.gemspec'] },
  { name: 'PHP', files: ['composer.json', 'composer.lock', 'artisan', 'phpunit.xml', 'phpunit.xml.dist', 'phpstan.neon', 'phpstan.neon.dist', '.php-cs-fixer.php', '.php-cs-fixer.dist.php'] },
  { name: 'Swift and Apple', files: ['Package.swift', 'Package.resolved', 'Podfile', 'Podfile.lock', 'Cartfile', 'Cartfile.resolved', '.swiftlint.yml', '.swift-version'] },
  { name: 'C, C++ and Zig', files: ['CMakeLists.txt', 'CMakePresets.json', 'meson.build', 'meson_options.txt', 'conanfile.txt', 'conanfile.py', 'vcpkg.json', '.clang-format', '.clang-tidy', 'configure.ac', 'Makefile.am', 'build.zig', 'build.zig.zon'] },
  { name: 'Other languages', files: ['mix.exs', 'mix.lock', '.formatter.exs', 'rebar.config', 'stack.yaml', 'cabal.project', '*.cabal', 'deps.edn', 'project.clj', 'Project.toml', 'Manifest.toml', 'DESCRIPTION', 'NAMESPACE', '*.Rproj', 'renv.lock'] },
  { name: 'Build and task runners', files: ['Makefile', 'GNUmakefile', 'justfile', 'Justfile', 'Taskfile.y*ml', 'WORKSPACE', 'WORKSPACE.bazel', 'MODULE.bazel', 'BUILD.bazel', '.bazelrc', '.bazelversion',
    'flake.nix', 'flake.lock', 'shell.nix', 'default.nix', 'devbox.json', 'mise.toml', '.mise.toml', '.tool-versions', '.envrc', 'Brewfile'] },
  { name: 'Docker and deployment', files: ['Dockerfile', 'Dockerfile.*', '*.Dockerfile', 'Containerfile', '.dockerignore', 'docker-compose*.y*ml', 'compose.y*ml', 'compose.*.y*ml', 'docker-bake.hcl', 'Procfile',
    'fly.toml', 'render.yaml', 'railway.json', 'railway.toml', 'nixpacks.toml', 'vercel.json', 'netlify.toml', 'wrangler.toml', 'wrangler.json', 'wrangler.jsonc', 'firebase.json', '.firebaserc',
    'serverless.y*ml', 'skaffold.yaml', 'app.yaml', 'Chart.yaml', '*.tf', '.terraform.lock.hcl', '.terraform-version'] },
  { name: 'CI and repository tools', files: ['.gitlab-ci.yml', '.travis.yml', 'azure-pipelines.yml', 'Jenkinsfile', 'bitbucket-pipelines.yml', 'appveyor.yml', '.appveyor.yml', 'cloudbuild.yaml', 'codecov.yml', '.codecov.yml',
    'sonar-project.properties', 'renovate.json', 'renovate.json5', '.pre-commit-config.yaml', '.pre-commit-hooks.yaml', '.mailmap', '.gitmodules', 'CODEOWNERS', '.markdownlint*', '.yamllint*', '.commitlintrc*',
    'commitlint.config.*', 'lefthook.yml', '.lintstagedrc*'] }
];
// The ecosystem that lets this root file sit in the root, or null.
// The ecosystem that lets this root file sit in the root, or null. rootFiles: a function giving the root's file names.
export function rootToolchainFile(p, { match, rootFiles }) {
  let root = null;
  const has = globs => (root ||= rootFiles()).some(n => n !== p && match(n, globs));
  for (const t of ROOT_TOOLCHAINS) if (match(p, t.files) || (t.sources && match(p, t.sources) && has(t.markers || []))) return t.name;
  return null;
}
