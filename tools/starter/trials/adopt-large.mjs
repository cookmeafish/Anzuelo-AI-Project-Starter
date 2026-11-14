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
// (and the shape of a large adopted AI app: its own agent rules of about 260 KB each, 56,000 git-ignored scratch files,
// worktrees of its own under .claude/worktrees. A field report, 2026-11-13: an app of this shape took 32 s per Stop)
const bigRules = `# Project rules\n${'- Keep the recipe logic in src/core; never call the network from a component; name each test for what it proves.\n'.repeat(2300)}`;
put('CLAUDE.md', bigRules); put('AGENTS.md', bigRules);
g(['add', '.claude', 'CLAUDE.md', 'AGENTS.md']); g(['commit', '-q', '--no-verify', '-m', 'Add the project\'s own Claude settings']);
for (let i = 0; i < 55884; i++) { const d = path.join(dir, '.scratch', `run-${Math.floor(i / 300)}`); if (i % 300 === 0) fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `frame-${i}.json`), '{}'); }
fs.appendFileSync(path.join(dir, '.git', 'info', 'exclude'), '\n.scratch/\n.claude/worktrees/\n');
for (const w of ['a', 'b']) g(['worktree', 'add', '-q', '-b', `trial-wt-${w}`, path.join(dir, '.claude', 'worktrees', w)]);
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
// (for the three proofs: every file the folder holds before the install, tracked, untracked or ignored, nested checkouts
// aside; the files a test runner would collect, dot-folders included; and the app's own test command when given)
const TESTS = /(^|\/)(__tests__\/|[^/]*\.(test|spec)\.[^/]+$)/;
const tree = () => { const out = {}; const walk = d => { let es = []; try { es = fs.readdirSync(path.join(dir, d), { withFileTypes: true }); } catch { return; }
  for (const e of es) { const p = d ? `${d}/${e.name}` : e.name; if (p === '.git' || (e.isDirectory() && fs.existsSync(path.join(dir, p, '.git')))) continue; if (e.isDirectory()) walk(p); else out[p] = hash(p); } }; walk(''); return out; };
const appTest = opt('--app-test'), runApp = () => appTest ? spawnSync(appTest, { cwd: dir, shell: true, encoding: 'utf8', env, timeout: 20 * 60_000 }).status : null;
const tree0 = tree(), tests = t => Object.keys(t).filter(f => TESTS.test(f) && !f.startsWith('node_modules/')).length, tests0 = tests(tree0), app0 = runApp();
const refs0 = new Set(g(['grep', '-l', '-F', '.anzuelo']).stdout.split('\n').filter(Boolean));
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
const { stateOutside } = await import('../../hooks/paths.mjs'), so = stateOutside(path.join(dir, '.anzuelo', 'local'), dir); // (read now: the delete proof removes .anzuelo/)
const installed = fs.existsSync(path.join(dir, '.anzuelo', 'engine', 'tools', 'hooks', 'hooks.mjs'));
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
// 3c. the end of a turn in this shape: a session with a long transcript (about 4 MB) whose last turn edits the app's own
// rules ends within its time, held at most once (light mode), with no health check of the engine's judging the app
const stopTimes = (() => { const tp = path.join(os.tmpdir(), `anzuelo-stop-${Date.now().toString(36)}.jsonl`), hk = path.join(dir, '.anzuelo', 'engine', 'tools', 'hooks', 'hooks.mjs');
  if (!fs.existsSync(hk)) return { ms: [], error: 'no engine' };
  const t = Date.now(), rows = [], filler = 'The recipe list now sorts by cooking time, and the timer page shows the next step. '.repeat(20);
  for (let i = 0; i < 1200; i++) rows.push({ type: 'user', timestamp: new Date(t - 3600_000 + i * 1000).toISOString(), message: { role: 'user', content: `Step ${i}: please check the recipe page.` } }, { type: 'assistant', timestamp: new Date(t - 3600_000 + i * 1000 + 500).toISOString(), message: { role: 'assistant', content: [{ type: 'text', text: filler }] } });
  rows.push({ type: 'user', timestamp: new Date(t).toISOString(), message: { role: 'user', content: 'Add a line to the rules about naming buttons.' } },
    { type: 'assistant', timestamp: new Date(t + 500).toISOString(), message: { role: 'assistant', content: [{ type: 'tool_use', id: 'e1', name: 'Edit', input: { file_path: path.join(dir, 'CLAUDE.md'), old_string: 'x', new_string: 'y' } }] } },
    { type: 'assistant', timestamp: new Date(t + 1000).toISOString(), message: { role: 'assistant', content: [{ type: 'text', text: 'Added the naming line to the rules.' }] } });
  fs.writeFileSync(tp, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); const keep = fs.readFileSync(path.join(dir, 'CLAUDE.md')); fs.appendFileSync(path.join(dir, 'CLAUDE.md'), '- Buttons are named for what they do.\n');
  const runs = [false, true].map(active => { const t0 = Date.now(), r = spawnSync(process.execPath, [hk, 'stop'], { cwd: dir, encoding: 'utf8', env: { ...env, CLAUDE_PROJECT_DIR: dir }, input: JSON.stringify({ session_id: 'trial-stop', transcript_path: tp, stop_hook_active: active }), maxBuffer: 64 << 20 }); return { ms: Date.now() - t0, out: r.stdout || '' }; });
  fs.writeFileSync(path.join(dir, 'CLAUDE.md'), keep); fs.rmSync(tp, { force: true });
  return { ms: runs.map(r => r.ms), outs: runs.map(r => r.out.slice(0, 200)), blocks: runs.filter(r => /left before this is done|"decision":\s*"block"/.test(r.out)).length, health: runs.some(r => /health check/.test(r.out)) }; })();
// 4. a normal commit of the project's own work
fs.writeFileSync(path.join(dir, 'TRIAL-NOTE.txt'), 'A note the project itself commits.\n');
g(['add', 'TRIAL-NOTE.txt']); const commit = g(['commit', '-q', '-m', 'Add a trial note'], { env: { ...env, ANZUELO_SESSION_GATE: 'off' } });

// Proof: a friend's clone (what someone downloading the app gets) carries no engine file, no new engine reference and no
// hooks path
const friend = path.join(os.tmpdir(), `anzuelo friend ${Date.now().toString(36)}`);
spawnSync('git', ['clone', '-q', '--no-hardlinks', '-b', 'feature/trial-work', dir, friend], { encoding: 'utf8' });
const fg = a => spawnSync('git', a, { cwd: friend, encoding: 'utf8', maxBuffer: 64 << 20 }).stdout || '';
const ENGINE_RX = /^(\.anzuelo\/|CLAUDE\.local\.md$|\.claude\/settings\.local\.json$|\.codex\/hooks\.json$)|\/\.mirror$/;
const friendEngine = fg(['ls-files']).split('\n').filter(f => f && ENGINE_RX.test(f)), friendRefs = fg(['grep', '-l', '-F', '.anzuelo']).split('\n').filter(f => f && !refs0.has(f)), friendHooks = fg(['config', '--get', 'core.hooksPath']).trim();
fs.rmSync(friend, { recursive: true, force: true });
// Proof: the app's packager never packs the engine: what npm would pack, and an electron-builder file list if it has one
const pack = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: dir, shell: true, encoding: 'utf8', env, timeout: 300000, maxBuffer: 64 << 20 });
let packed = null; try { packed = JSON.parse(pack.stdout)[0].files.map(f => f.path); } catch { }
const pj = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')); } catch { return {}; } })(), ebFiles = [].concat(pj.build?.files || []);
const { globRx } = await import('../../hooks/v2/lib.mjs'), SAMPLE = ['.anzuelo/engine/tools/hooks/hooks.mjs', 'CLAUDE.local.md', '.claude/skills/plan/SKILL.md', '.codex/hooks.json'];
const ebPacks = ebFiles.length ? SAMPLE.filter(s => ebFiles.some(p => !String(p).startsWith('!') && globRx(String(p)).test(s)) && !ebFiles.some(p => String(p).startsWith('!') && globRx(String(p).slice(1)).test(s))) : [];
// (no proof by default: npm "not a package" means npm doesn't pack this folder; electron-builder with no file list packs
// the whole app folder, which the owner must decide to narrow; and no packager at all is said plainly)
const npmNot = !packed && /must have name and version|private/i.test(pack.stderr || pack.stdout || ''), ebAll = (!!pj.build || fs.existsSync(path.join(dir, 'electron-builder.yml'))) && !ebFiles.length;
const packNote = packed ? `npm packs ${packed.length} files` : npmNot ? 'npm does not pack this folder (not a package)' : `npm pack failed: ${(pack.stderr || '').trim().split('\n')[0]?.slice(0, 120)}`;
const packedEngine = (packed || []).filter(f => ENGINE_RX.test(f) || /^\.(claude|agents)\/skills\//.test(f));
// Proof: delete the engine (its folder and the wiring) and the folder is what it was, file for file; the app's tests
// are the same files, and its own test command (when given) ends the same way
for (const f of ['.anzuelo', 'CLAUDE.local.md', '.codex/hooks.json', ...(tree0['.claude/settings.local.json'] ? [] : ['.claude/settings.local.json'])]) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
for (const m of ['.claude/skills', '.agents/skills']) for (const n of (() => { try { return fs.readdirSync(path.join(dir, m)); } catch { return []; } })()) if (fs.existsSync(path.join(dir, m, n, '.mirror'))) fs.rmSync(path.join(dir, m, n), { recursive: true, force: true });
const tree1 = tree(), treeDiff = Object.keys({ ...tree0, ...tree1 }).filter(f => f !== 'TRIAL-NOTE.txt' && tree0[f] !== tree1[f] && !(f === '.claude/settings.local.json' && tree0[f])), app1 = runApp();

const checks = [
  ['the engine installed in .anzuelo/engine', inst.status === 0 && installed, (inst.stderr || inst.stdout || '').slice(-300)],
  ['the setup session ran to an answer', !j.is_error && !!j.result, (j.error || '').slice(0, 300)],
  // (only the agent session writes the review: --no-agent leaves this check out and says so, never a false FAIL)
  ...args.includes('--no-agent') ? [] : [['the adoption review was written under .anzuelo/', !!review, review ? path.relative(dir, review) : 'no "## Adoption review" section under .anzuelo/']],
  ['the project\'s own rules, hooks and package settings are byte for byte the same', !changedOwn.length, changedOwn.join(', ')],
  ['git\'s hooks path is what it was', hooksPath1 === hooksPath0, `${hooksPath0 || '(unset)'} -> ${hooksPath1 || '(unset)'}`],
  ['nothing of the starter outside .anzuelo/ but the wiring', !stray.length, stray.slice(0, 15).join(', ')],
  [`the ${uncommitted} uncommitted files, the ignored dependencies and data, and the branch are untouched`, !wipChanged.length && wip0.status === wip1.status && wip0.diff === wip1.diff && wip1.branch === 'feature/trial-work', `${wipChanged.slice(0, 10).join(', ')} | branch ${wip1.branch}`],
  ['a normal commit of the project\'s own work goes through', commit.status === 0, (commit.stderr || '').slice(0, 300)],
  ['the end of a turn in this shape (a 4 MB transcript, rules files of 260 KB, 56,000 ignored files, worktrees) takes under 2 s, holds at most once and runs no health check of the engine\'s on the app', stopTimes.ms.length === 2 && stopTimes.ms.every(m => m < 2000) && stopTimes.blocks <= 1 && !stopTimes.health, JSON.stringify(stopTimes)],
  ['proof: a friend\'s clone has no engine file, no new reference to .anzuelo and no hooks path', !friendEngine.length && !friendRefs.length && !friendHooks, JSON.stringify({ friendEngine: friendEngine.slice(0, 5), friendRefs: friendRefs.slice(0, 5), friendHooks })],
  ['proof: the app\'s packager never packs the engine (npm pack, and electron-builder: a file list that leaves the engine out, or none at all, which packs everything and needs the owner\'s decision)', (!!packed || npmNot) && !packedEngine.length && !ebPacks.length && !ebAll,
    JSON.stringify({ packedEngine: packedEngine.slice(0, 5), ebPacks, electronBuilder: ebAll ? 'no file list: it packs the whole folder; ask the owner before adding an exclude' : ebFiles.length ? 'file list checked' : 'none', npm: packNote })],
  ['proof: with the engine deleted the folder is what it was before the install, file for file; the same test files; the app\'s own tests end the same', !treeDiff.length && tests(tree1) === tests0 && app1 === app0, JSON.stringify({ changed: treeDiff.slice(0, 8), tests: [tests0, tests(tree1)], app: [app0, app1] })],
];
const rec = { at: new Date().toISOString(), src: path.resolve(src), dir, files: files0, minutes: Math.round((Date.now() - t0) / 6000) / 10, prompt, answer: j.result || '', cost: j.total_cost_usd, turns: j.num_turns, session: j.session_id, own: OWN, changedOwn, hooksPath: [hooksPath0, hooksPath1], wiring, stray, review: review ? path.relative(dir, review) : null, checks };
const out = path.join(STARTER, '.cache', 'trials', `adopt-large-${Date.now().toString(36)}.json`);
fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(rec, null, 2));
for (const [what, ok, why] of checks) console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${!ok && why ? `: ${why}` : ''}`);
console.log(`wiring outside .anzuelo/: ${wiring.join(', ') || 'none'}, and ${mirrors} skill copies git ignores (.claude/skills, .agents/skills); ${files0} tracked files; ${rec.minutes} min; record: ${out}`);
// (an adopted project's state sits in the user's profile: the trial copy's goes with the copy, never left behind)
if (!args.includes('--keep')) { fs.rmSync(dir, { recursive: true, force: true }); if (so) fs.rmSync(so, { recursive: true, force: true }); } else console.log(`kept: ${dir}${so ? ` (its state: ${so})` : ''}`);
const bad = checks.filter(c => !c[1]).length;
console.log(`ADOPT-LARGE: ${bad ? 'FAIL' : 'PASS'} (${checks.length - bad} of ${checks.length}${args.includes('--no-agent') ? '; no agent run, so the adoption review is not checked' : ''})`);
process.exit(bad ? 1 : 0);
