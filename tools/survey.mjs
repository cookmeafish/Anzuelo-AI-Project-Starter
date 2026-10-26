#!/usr/bin/env node
// What is this project? A quick read of the folder before setup asks anything, so the questions and the agent's own
// choices start from what is really here. Read-only, zero dependencies.
//   node tools/survey.mjs          the summary, with suggested setup answers
//   node tools/survey.mjs --json   the same as JSON
// It skips the starter's own files, dependencies and build output, and lists the documents worth reading first.
// The same counts feed the fit checklist (node tools/fit.mjs): what the project has is evidence for each decision.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, usageOf, projectSurvey, SURVEY_KINDS } from './hooks/hooks.mjs';

if (process.argv.includes('--help')) { console.log(usageOf(import.meta.url)); process.exit(0); }
const sv = projectSurvey();
const files = sv.files, manifests = sv.manifests, big = sv.big;
const exts = {};
for (const f of files) { const x = (path.extname(f.p) || '(none)').toLowerCase(); exts[x] = (exts[x] || 0) + 1; }
const heading = p => { try { return (/^#\s+(.+)$/m.exec(fs.readFileSync(path.join(ROOT, p), 'utf8').slice(0, 4000)) || [, ''])[1].trim(); } catch { return ''; } };
// documents worth reading first: instructions for agents, readmes, then the largest notes
// (Lesson: .cursor/rules, .clinerules and .windsurf rules were missed, so their conventions were lost on adoption)
const instructions = files.filter(f => /(^|\/)(\.cursorrules|\.windsurfrules|\.clinerules|copilot-instructions\.md|GEMINI\.md|CONVENTIONS\.md)$|(^|\/)(\.cursor|\.windsurf|\.clinerules|\.roo|\.github\/instructions)\/.+\.(md|mdc|txt)$|(^|\/)archive\/.*(AGENTS|CLAUDE)/i.test(f.p)).map(f => f.p);
const readmes = files.filter(f => /(^|\/)readme(\.[a-z]+)?$/i.test(f.p)).map(f => f.p);
const notes = files.filter(f => /\.(md|mdx|txt)$/i.test(f.p) && SURVEY_KINDS.notes.test(f.p) && !readmes.includes(f.p)).sort((a, b) => b.size - a.size).slice(0, 12).map(f => ({ p: f.p, title: heading(f.p) }));
// a manifest is untrusted data: no __proto__ or constructor key may reach the object
const scripts = Object.create(null);
for (const m of manifests.filter(p => p.endsWith('package.json'))) { try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(path.join(ROOT, m), 'utf8')).scripts || {})) if (!/^(__proto__|constructor|prototype)$/.test(k)) scripts[k] = v; } catch { } }
const git = spawnSync('git', ['log', '-n', '1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8' });
// (a repository with no commits yet is still a repository. Lesson: "git init" then the survey said "not a git repository")
const isRepo = !!sv.git || fs.existsSync(path.join(ROOT, '.git'));
const n = { code: sv.n.code, visual: sv.n.visual, data: sv.n.data, scripts: sv.n.scripts, notes: sv.n.notes, all: sv.n.all };
// suggested answers: a starting point the agent checks against what it reads, never a verdict
// a few code files with tests or a notebook are software too; manifests and tool config are not data
// (Lesson: an ML project with 4 code files got no app pack, and a monorepo's package.json files made it "knowledge")
const software = n.code >= 3 || manifests.length > 0;
n.data = files.filter(f => SURVEY_KINDS.data.test(f.p) && !manifests.includes(f.p) && !/(^|\/)(package-lock|tsconfig|jsconfig|turbo|lerna|nx|tslint|\.?eslintrc|\.?prettierrc|composer\.lock|[\w.-]*\.config)\.json$|(^|\/)\.[\w-]+\.ya?ml$|(^|\/)(pnpm-workspace|docker-compose|compose)\.ya?ml$/i.test(f.p)).length;
// screens that are not web files: Flutter, XAML, QML, Godot scenes, Android layouts, iOS storyboards
const readOf = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return ''; } };
const appUi = files.filter(f => /\.(xaml|axaml|qml|tscn|storyboard|xib)$|(^|\/)res\/layout\/[^/]+\.xml$/i.test(f.p)).length
  + (manifests.some(m => /pubspec\.yaml$/.test(m) && /\bflutter\s*:/.test(readOf(m))) ? files.filter(f => /\.dart$/i.test(f.p)).length : 0);
const has = rx => manifests.some(m => rx.test(m)), testsPy = files.some(f => /(^|\/)(tests?\/|test_[^/]+\.py$|[^/]+_test\.py$)/.test(f.p));
// pytest only when the project uses it (a dependency, its config, or a conftest); plain unittest otherwise.
// Lesson: "pytest" was suggested for a project whose tests are unittest and where pytest was not installed.
const usesPytest = files.some(f => /(^|\/)(conftest\.py|pytest\.ini)$/.test(f.p)) || manifests.some(m => /(pyproject\.toml|requirements[^/]*\.txt|setup\.cfg)$/.test(m) && /\bpytest\b/.test(readOf(m)));
const toolCmds = [
  ...(has(/(pyproject\.toml|requirements[^/]*\.txt)$/) && testsPy ? [usesPytest ? 'pytest' : `python -m unittest discover${files.some(f => /^tests\//.test(f.p)) ? ' -s tests' : ''}`] : []),
  ...(has(/Cargo\.toml$/) ? ['cargo build', 'cargo test'] : []),
  ...(has(/go\.mod$/) ? ['go build ./...', 'go test ./...'] : []),
  ...(has(/pubspec\.yaml$/) ? (manifests.some(m => /pubspec\.yaml$/.test(m) && /\bflutter\s*:/.test(readOf(m))) ? ['flutter analyze', 'flutter test'] : ['dart analyze', 'dart test']) : []),
  ...(has(/\.(csproj|sln)$/) ? ['dotnet build', 'dotnet test'] : [])
];
// notebooks next to data files mean analysis and results to keep, not only code
// (Lesson: an ML project with a notebook and a dataset was suggested the app pack alone)
const knowledge = n.notes + n.data >= Math.max(5, n.code) || (n.data > 0 && files.some(f => /\.ipynb$/i.test(f.p)));
const suggest = {
  kind: software && knowledge ? 'both' : software ? 'software' : 'knowledge',
  visual: n.visual + appUi > 0 ? `yes (${n.visual + appUi} web, app or game screen files)` : 'no',
  packs: [...(knowledge || !software ? ['knowledge'] : []), ...(software ? ['app'] : []), ...(n.visual + appUi > 0 ? ['gui'] : [])],
  commands: [...Object.keys(scripts).filter(k => /^(test|build|lint|start|dev)$/.test(k)).map(k => `npm run ${k}`), ...toolCmds]
};
const out = { files: n, extensions: Object.entries(exts).sort((a, b) => b[1] - a[1]).slice(0, 10), readmes, instructions, notes, manifests, scripts,
  git: isRepo ? { last: git.status === 0 ? git.stdout.trim() : null, commits: sv.git?.commits || 0 } : null, big, suggest };

if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`Project survey (${n.all} files of its own: ${n.code} code, ${n.visual} web/UI, ${n.notes} notes or documents, ${n.data} data, ${n.scripts} scripts)`);
console.log(`Most common file types: ${out.extensions.map(([x, c]) => `${x} ${c}`).join(', ') || 'none'}`);
console.log(`Git: ${out.git ? (out.git.last ? `${out.git.commits} commits, last on ${out.git.last}` : 'a repository with no commits yet') : 'not a git repository'}`);
if (readmes.length) console.log(`Read first: ${readmes.join(', ')}`);
if (instructions.length) console.log(`Earlier AI instructions (keep what still applies): ${instructions.join(', ')}`);
if (notes.length) console.log('Main notes and documents:\n' + notes.map(x => `  ${x.p}${x.title ? `: ${x.title}` : ''}`).join('\n'));
if (manifests.length) console.log(`Code projects: ${manifests.join(', ')}${Object.keys(scripts).length ? ` (scripts: ${Object.keys(scripts).join(', ')})` : ''}`);
if (big.length) console.log(`Large files (keep out of git or treat as data): ${big.join(', ')}`);
console.log(`\nSuggested starting answers (check them against what you read):\n  Kind of work: ${suggest.kind}\n  Visual interface: ${suggest.visual}\n  Packs: ${suggest.packs.join(', ') || 'core only'}${suggest.commands.length ? `\n  Commands: ${suggest.commands.join(', ')}` : ''}`);
console.log('\nNext: read the files above, then write the user a short "What I found" summary before asking anything.');
