#!/usr/bin/env node
// What is this project? A quick read of the folder before setup asks anything, so the questions and the agent's own
// choices start from what is really here. Read-only, zero dependencies.
//   node tools/survey.mjs          the summary, with suggested setup answers
//   node tools/survey.mjs --json   the same as JSON
// It skips the starter's own files, dependencies and build output, and lists the documents worth reading first.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, usageOf } from './hooks/hooks.mjs';

if (process.argv.includes('--help')) { console.log(usageOf(import.meta.url)); process.exit(0); }
const SKIP_DIR = /^(\.git|node_modules|\.cache|\.claude|\.codex|\.obsidian|\.starter|dist|build|out|target|bin|obj|venv|\.venv|__pycache__|coverage|packs|library)$/;
// the starter's own files, so the survey describes the project, not the starter
const STARTER = /^(AGENTS|CLAUDE|DIRECTORY|HOW-TO-USE|SETUP-PROMPT)\.md$|^(README|AGENTS|CLAUDE)\.starter\.md$|^skills\/|^tools\/hooks\/|^tools\/(audit|packs|skills|starter|new-project|writing-check|integrity-check|recall|survey|screenshot)\.mjs$|^tools\/starter\.local\.json$|^\.githooks\/|^docs\/(checks|playbooks|plans)\/|^docs\/(BRIEF|STATUS|CHANGELOG|DECISIONS|MENU|security|names\.json|foundation|lessons)(\.md)?$|^docs\/names\.json$/;
const CODE = /\.(js|mjs|cjs|ts|tsx|jsx|py|rb|go|rs|java|kt|cs|cpp|c|h|swift|php|lua|gd|dart|scala|ex|exs)$/i;
const VISUAL = /\.(html?|css|scss|vue|svelte|jsx|tsx)$/i;
const DATA = /\.(json|csv|tsv|xlsx?|sqlite|db|parquet|xml|ya?ml)$/i;
const SCRIPT = /\.(ps1|sh|bat|cmd)$/i;
const NOTES = /\.(md|mdx|txt|rst|org|docx?|pdf)$/i;

const files = [];
(function walk(d) {
  let names; try { names = fs.readdirSync(path.join(ROOT, d || '.'), { withFileTypes: true }); } catch { return; }
  for (const e of names) {
    const p = d ? `${d}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!SKIP_DIR.test(e.name)) walk(p); continue; }
    if (STARTER.test(p) || files.length > 20000) continue;
    let size = 0; try { size = fs.statSync(path.join(ROOT, p)).size; } catch { }
    files.push({ p, size });
  }
})('');

const count = rx => files.filter(f => rx.test(f.p)).length;
const exts = {};
for (const f of files) { const x = (path.extname(f.p) || '(none)').toLowerCase(); exts[x] = (exts[x] || 0) + 1; }
const heading = p => { try { return (/^#\s+(.+)$/m.exec(fs.readFileSync(path.join(ROOT, p), 'utf8').slice(0, 4000)) || [, ''])[1].trim(); } catch { return ''; } };
// documents worth reading first: instructions for agents, readmes, then the largest notes
const instructions = files.filter(f => /(^|\/)(\.cursorrules|\.windsurfrules|copilot-instructions\.md|GEMINI\.md|CONVENTIONS\.md)$|(^|\/)archive\/.*(AGENTS|CLAUDE)/i.test(f.p)).map(f => f.p);
const readmes = files.filter(f => /(^|\/)readme(\.[a-z]+)?$/i.test(f.p)).map(f => f.p);
const notes = files.filter(f => /\.(md|mdx|txt)$/i.test(f.p) && !readmes.includes(f.p)).sort((a, b) => b.size - a.size).slice(0, 12).map(f => ({ p: f.p, title: heading(f.p) }));
const manifests = files.filter(f => /(^|\/)(package\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod|.*\.csproj|.*\.sln|Gemfile|composer\.json|project\.godot|pubspec\.yaml)$/.test(f.p)).map(f => f.p);
const scripts = {};
for (const m of manifests.filter(p => p.endsWith('package.json'))) { try { Object.assign(scripts, JSON.parse(fs.readFileSync(path.join(ROOT, m), 'utf8')).scripts || {}); } catch { } }
const git = spawnSync('git', ['log', '-n', '1', '--format=%cs'], { cwd: ROOT, encoding: 'utf8' });
const commits = spawnSync('git', ['rev-list', '--count', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
const big = files.filter(f => f.size > 5e6).map(f => `${f.p} (${Math.round(f.size / 1e6)} MB)`);
const n = { code: count(CODE), visual: count(VISUAL), data: count(DATA), scripts: count(SCRIPT), notes: count(NOTES), all: files.length };

// suggested answers: a starting point the agent checks against what it reads, never a verdict
const software = n.code >= 5 || manifests.length > 0;
const knowledge = n.notes + n.data >= Math.max(5, n.code);
const suggest = {
  kind: software && knowledge ? 'both' : software ? 'software' : 'knowledge',
  visual: n.visual > 0 ? `yes (${n.visual} web or UI files)` : 'no',
  packs: [...(knowledge || !software ? ['knowledge'] : []), ...(software ? ['app'] : []), ...(n.visual > 0 ? ['gui'] : [])],
  commands: Object.keys(scripts).filter(k => /^(test|build|lint|start|dev)$/.test(k)).map(k => `npm run ${k}`)
};
const out = { files: n, extensions: Object.entries(exts).sort((a, b) => b[1] - a[1]).slice(0, 10), readmes, instructions, notes, manifests, scripts,
  git: git.status === 0 ? { last: git.stdout.trim(), commits: Number(commits.stdout) || 0 } : null, big, suggest };

if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
console.log(`Project survey (${n.all} files of its own: ${n.code} code, ${n.visual} web/UI, ${n.notes} notes or documents, ${n.data} data, ${n.scripts} scripts)`);
console.log(`Most common file types: ${out.extensions.map(([x, c]) => `${x} ${c}`).join(', ') || 'none'}`);
console.log(`Git: ${out.git ? `${out.git.commits} commits, last on ${out.git.last}` : 'not a git repository'}`);
if (readmes.length) console.log(`Read first: ${readmes.join(', ')}`);
if (instructions.length) console.log(`Earlier AI instructions (keep what still applies): ${instructions.join(', ')}`);
if (notes.length) console.log('Main notes and documents:\n' + notes.map(x => `  ${x.p}${x.title ? `: ${x.title}` : ''}`).join('\n'));
if (manifests.length) console.log(`Code projects: ${manifests.join(', ')}${Object.keys(scripts).length ? ` (scripts: ${Object.keys(scripts).join(', ')})` : ''}`);
if (big.length) console.log(`Large files (keep out of git or treat as data): ${big.join(', ')}`);
console.log(`\nSuggested starting answers (check them against what you read):\n  Kind of work: ${suggest.kind}\n  Visual interface: ${suggest.visual}\n  Packs: ${suggest.packs.join(', ') || 'core only'}${suggest.commands.length ? `\n  Commands: ${suggest.commands.join(', ')}` : ''}`);
console.log('\nNext: read the files above, then write the user a short "What I found" summary before asking anything.');
