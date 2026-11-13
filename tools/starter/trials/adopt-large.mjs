#!/usr/bin/env node
// Starter-only. The adoption trial's agent part on a large established app: a copy of a public repository (a local
// clone you made, passed as the source) gets the engine installed in .anzuelo/engine, a real headless Claude Code
// session sets it up, and the result is checked against the promises for an established project:
//   1. the adoption review ran (an "## Adoption review" section written under .anzuelo/);
//   2. the project's own agent rules, git hooks and package settings are byte for byte the same, and git's hooks path
//      is what it was;
//   3. nothing of the starter lands outside .anzuelo/, except the wiring (CLAUDE.local.md, git-ignored host settings);
//   4. a normal commit of the project's own work goes through.
//   node tools/starter/trials/adopt-large.mjs <source clone> [--prompt "<the setup request>"] [--keep]
// The copy goes to a temp folder whose name has a space (as many real project folders do). Record: .cache/trials/.
import '../../hooks/hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
const src = args.find((a, i) => !a.startsWith('--') && !['--prompt'].includes(args[i - 1]));
if (!src || !fs.existsSync(path.join(src, '.git'))) { console.error('usage: node tools/starter/trials/adopt-large.mjs <source clone> [--prompt "<request>"] [--keep]'); process.exit(2); }
const prompt = opt('--prompt') || 'Set up the engine in this project. It is an established app: keep everything it already has.';
const dir = path.join(os.tmpdir(), `anzuelo adopt ${Date.now().toString(36)}`);
const env = { ...process.env }; delete env.CLAUDE_CODE_SESSION_ID; delete env.CLAUDECODE; delete env.ANZUELO_ROOT; delete env.CLAUDE_PROJECT_DIR;
const g = (a, o = {}) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', env, maxBuffer: 64 << 20, ...o });
const hash = f => { try { return crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, f))).digest('hex'); } catch { return null; } };

// the copy, from the source's last commit
spawnSync('git', ['clone', '-q', '--no-hardlinks', path.resolve(src), dir], { encoding: 'utf8' });
g(['config', 'user.name', 'Trial']); g(['config', 'user.email', 'trial@example.invalid']);
// (as a real established app looks mid-work: on a feature branch, its own .claude/ settings and commands committed,
// 22 uncommitted files (12 tracked files changed, 10 new), installed dependencies and data folders git ignores)
g(['checkout', '-q', '-b', 'feature/trial-work']);
const put = (f, t) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t); };
put('.claude/settings.json', JSON.stringify({ hooks: { PostToolUse: [{ matcher: 'Edit', hooks: [{ type: 'command', command: 'node scripts/own-lint.js' }] }] }, permissions: { allow: ['Bash(yarn test:*)'] } }, null, 2) + '\n');
put('.claude/commands/release-notes.md', '# Release notes\nWrite the release notes from the "changes" list, with each item\'s \\`PR\\` number.\n');
g(['add', '.claude']); g(['commit', '-q', '--no-verify', '-m', 'Add the project\'s own Claude settings']);
const tracked = g(['ls-files', '*.ts', '*.tsx']).stdout.split('\n').filter(Boolean).slice(0, 12);
for (const f of tracked) fs.appendFileSync(path.join(dir, f), `\n// work in progress: "café" \\ tab\there\n`);
for (let i = 1; i <= 10; i++) put(`packages/excalidraw/wip/draft-${i}.ts`, `export const draft${i} = "naïve \\"quote\\" ${i}";\n`);
put('node_modules/left-pad/index.js', 'module.exports = s => s;\n'); put('node_modules/left-pad/package.json', '{"name":"left-pad"}\n');
put('data/exports/scene-1.excalidraw', JSON.stringify({ type: 'excalidraw', elements: [] })); put('data/cache/thumbs.json', '{}\n');
fs.appendFileSync(path.join(dir, '.git', 'info', 'exclude'), '\ndata/\n');
// the work in progress, byte for byte: every changed, new and ignored file the project has, and git's view of it
// (the engine's wiring is not the project's work: its folder, its git-ignored host files, and skill copies git ignores)
const MIRROR = /^!! (\.claude|\.agents)\/skills\//;
const wip = () => { const st = g(['status', '--porcelain', '--ignored', '-uall']).stdout.split('\n').filter(Boolean).filter(l => !/^.. (\.anzuelo\/|CLAUDE\.local\.md$|\.claude\/settings\.local\.json$|\.codex\/)/.test(l) && !MIRROR.test(l));
  return { status: st.sort().join('\n'), files: Object.fromEntries(st.map(l => l.slice(3).replace(/^"|"$/g, '')).map(f => [f, hash(f)])), diff: crypto.createHash('sha1').update(g(['diff', 'HEAD']).stdout).digest('hex'), branch: g(['branch', '--show-current']).stdout.trim() }; };
const wip0 = wip(), uncommitted = g(['status', '--porcelain', '-uall']).stdout.split('\n').filter(Boolean).length;
// what the project owns before: its agent rules, hook managers, package settings, and git's hooks path
const OWN = ['CLAUDE.md', 'AGENTS.md', 'package.json', '.gitignore', 'lefthook.yml', '.pre-commit-config.yaml',
  ...(() => { try { return fs.readdirSync(path.join(dir, '.husky')).map(f => `.husky/${f}`); } catch { return []; } })(),
  ...(() => { try { return g(['ls-files', '.claude']).stdout.split('\n').filter(Boolean); } catch { return []; } })()].filter(f => fs.existsSync(path.join(dir, f)));
const before = Object.fromEntries(OWN.map(f => [f, hash(f)])), hooksPath0 = g(['config', '--get', 'core.hooksPath']).stdout.trim();
const files0 = Number(g(['ls-files']).stdout.split('\n').filter(Boolean).length);

// the install, as the user's agent runs it from the starter
const t0 = Date.now();
const inst = spawnSync(process.execPath, [path.join(STARTER, 'tools', 'starter.mjs'), 'install', dir, '--private', 'no', '--gitignore', 'no'], { cwd: STARTER, encoding: 'utf8', env, timeout: 600000, maxBuffer: 64 << 20 });
// the setup turn: a real headless session in the project
const TOOLS = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Skill', 'Agent', 'Task', 'TodoWrite', 'Bash(node:*)', 'Bash(git:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(mkdir:*)', 'Bash(yarn:*)', 'Bash(npm:*)'];
// (--no-agent: the install and the checks only, to try the trial itself; no agent session runs)
const turn = args.includes('--no-agent') ? { stdout: JSON.stringify({ result: '(no agent run)' }) } : spawnSync('claude',['-p', prompt, '--output-format', 'json', '--permission-mode', 'acceptEdits', '--allowedTools', ...TOOLS], { cwd: dir, encoding: 'utf8', env, timeout: 60 * 60_000, maxBuffer: 64 << 20 });
let j = {}; try { j = JSON.parse(turn.stdout); } catch { j = { result: (turn.stdout || '').slice(-3000), error: (turn.stderr || String(turn.error || '')).slice(-1000) }; }

// 1. the adoption review
const walk = d => { try { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (e.name === 'engine' && path.basename(d) === '.anzuelo' ? [] : walk(path.join(d, e.name))) : e.name.endsWith('.md') ? [path.join(d, e.name)] : []); } catch { return []; } };
const review = walk(path.join(dir, '.anzuelo')).find(f => /^## Adoption review/m.test(fs.readFileSync(f, 'utf8')));
// 2. the project's own files and hooks path
const changedOwn = OWN.filter(f => hash(f) !== before[f]), hooksPath1 = g(['config', '--get', 'core.hooksPath']).stdout.trim();
// 3. nothing outside .anzuelo/ but the wiring (new or changed, ignored files included; the project's own build output
// and dependencies are not the starter's)
const WIRING = /^(CLAUDE\.local\.md|\.claude\/settings\.local\.json|\.codex\/hooks\.json)$/;
const lines = g(['status', '--porcelain', '--ignored', '-uall']).stdout.split('\n').filter(Boolean), mirrors = lines.filter(l => MIRROR.test(l)).length;
const status = lines.filter(l => !MIRROR.test(l)).map(l => l.slice(3).replace(/^"|"$/g, '')); // (skill copies git shows would count as stray)
const outside = status.filter(f => !f.startsWith('.anzuelo/') && !/(^|\/)(node_modules|dist|build|\.cache)\//.test(f));
const stray = outside.filter(f => !WIRING.test(f) && !(f in wip0.files)), wiring = outside.filter(f => WIRING.test(f)); // (the project's own work in progress is not the starter's)
// 3b. the work in progress and the branch, untouched
const wip1 = wip(), wipChanged = Object.keys({ ...wip0.files, ...wip1.files }).filter(f => wip0.files[f] !== wip1.files[f]);
// 4. a normal commit of the project's own work
fs.writeFileSync(path.join(dir, 'TRIAL-NOTE.txt'), 'A note the project itself commits.\n');
g(['add', 'TRIAL-NOTE.txt']); const commit = g(['commit', '-q', '-m', 'Add a trial note'], { env: { ...env, ANZUELO_SESSION_GATE: 'off' } });

const checks = [
  ['the engine installed in .anzuelo/engine', inst.status === 0 && fs.existsSync(path.join(dir, '.anzuelo', 'engine', 'tools', 'hooks', 'hooks.mjs')), (inst.stderr || inst.stdout || '').slice(-300)],
  ['the setup session ran to an answer', !j.is_error && !!j.result, (j.error || '').slice(0, 300)],
  ['the adoption review was written under .anzuelo/', !!review, review ? path.relative(dir, review) : 'no "## Adoption review" section under .anzuelo/'],
  ['the project\'s own rules, hooks and package settings are byte for byte the same', !changedOwn.length, changedOwn.join(', ')],
  ['git\'s hooks path is what it was', hooksPath1 === hooksPath0, `${hooksPath0 || '(unset)'} -> ${hooksPath1 || '(unset)'}`],
  ['nothing of the starter outside .anzuelo/ but the wiring', !stray.length, stray.slice(0, 15).join(', ')],
  [`the ${uncommitted} uncommitted files, the ignored dependencies and data, and the branch are untouched`, !wipChanged.length && wip0.status === wip1.status && wip0.diff === wip1.diff && wip1.branch === 'feature/trial-work', `${wipChanged.slice(0, 10).join(', ')} | branch ${wip1.branch}`],
  ['a normal commit of the project\'s own work goes through', commit.status === 0, (commit.stderr || '').slice(0, 300)],
];
const rec = { at: new Date().toISOString(), src: path.resolve(src), dir, files: files0, minutes: Math.round((Date.now() - t0) / 6000) / 10, prompt, answer: j.result || '', cost: j.total_cost_usd, turns: j.num_turns, session: j.session_id, own: OWN, changedOwn, hooksPath: [hooksPath0, hooksPath1], wiring, stray, review: review ? path.relative(dir, review) : null, checks };
const out = path.join(STARTER, '.cache', 'trials', `adopt-large-${Date.now().toString(36)}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(rec, null, 2));
for (const [what, ok, why] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${!ok && why ? `: ${why}` : ''}`);
console.log(`wiring outside .anzuelo/: ${wiring.join(', ') || 'none'}, and ${mirrors} skill copies git ignores (.claude/skills, .agents/skills); ${files0} tracked files; ${rec.minutes} min; record: ${out}`);
// (an adopted project's state sits in the user's profile: the trial copy's goes with the copy, never left behind)
const { stateOutside } = await import('../../hooks/paths.mjs'), so = stateOutside(path.join(dir, '.anzuelo', 'local'), dir);
if (!args.includes('--keep')) { fs.rmSync(dir, { recursive: true, force: true }); if (so) fs.rmSync(so, { recursive: true, force: true }); } else console.log(`kept: ${dir}${so ? ` (its state: ${so})` : ''}`);
const bad = checks.filter(c => !c[1]).length;
console.log(`ADOPT-LARGE: ${bad ? 'FAIL' : 'PASS'} (${checks.length - bad} of ${checks.length})`);
process.exit(bad ? 1 : 0);
