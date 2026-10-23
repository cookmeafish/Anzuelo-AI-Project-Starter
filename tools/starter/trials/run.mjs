#!/usr/bin/env node
// Starter-only. New-project trials for the improvement loop (tools/starter/runbooks/improvement-loop.md): each trial makes a
// brand-new project with tools/new-project.mjs (an empty folder, or one with the project's own files), has a real
// headless Claude Code session set it up, then gives it real work and a complaint, turn by turn. The record of every
// turn (answer, files changed, runbooks opened, Stop blocks, minutes) is what the blind judges read.
//   node tools/starter/trials/run.mjs --list                         every scenario (* = in the standard round)
//   node tools/starter/trials/run.mjs --round v10 [--freeze] [ids]   a whole round, 4 trials at a time
//   node tools/starter/trials/run.mjs <id>                           one trial (TRIAL_RUN, TRIAL_STARTER from the env)
// --freeze tests a frozen copy of this commit (a git worktree in the temp folder), so edits made while a round runs
// never reach it. Records go to .cache/trials/results-<round>/ (ANZUELO_TRIALS_DIR moves them); projects to
// <temp>/anzuelo-new/<id>-<round>.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STARTER_ROOT = path.resolve(HERE, '..', '..', '..');
export const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(STARTER_ROOT, '.cache', 'trials');
const SC = JSON.parse(fs.readFileSync(path.join(HERE, process.env.TRIAL_SCENARIOS || 'scenarios.json'), 'utf8'));
// The standard round: eight kinds of project (code in three languages, a Spanish-speaking user, letters, numbers from
// spreadsheets, a notes vault, a manuscript). The same set every round, so rounds compare.
export const STANDARD = ['np-flask-api', 'np-go-service', 'np-photo-cli', 'np-blog-es', 'np-landlord', 'np-weekly-sales', 'np-vault', 'np-novel'];
const PARALLEL = 4;

const arg = process.argv[2];
if (arg === '--list') { for (const s of SC) console.log(`${STANDARD.includes(s.id) ? '*' : ' '} ${s.id} - ${s.why}`); process.exit(0); }
if (arg === '--round') await round();
else await one(arg);

async function round() {
  const name = process.argv[3];
  if (!/^[\w.-]+$/.test(name || '')) { console.error('usage: run.mjs --round <name> [--freeze] [ids...]'); process.exit(1); }
  const ids = process.argv.slice(4).filter(a => !a.startsWith('--'));
  const list = ids.length ? ids : STANDARD;
  for (const id of list) if (!SC.some(s => s.id === id)) { console.error(`unknown trial ${id}`); process.exit(1); }
  let starter = process.env.TRIAL_STARTER || STARTER_ROOT;
  const head = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: STARTER_ROOT, encoding: 'utf8' }).stdout.trim();
  if (process.argv.includes('--freeze')) {
    const dirty = spawnSync('git', ['status', '--porcelain', '--', 'tools', 'skills', 'docs', 'packs', 'library'], { cwd: STARTER_ROOT, encoding: 'utf8' }).stdout.trim();
    if (dirty) console.log(`note: uncommitted changes are not in the frozen copy (${dirty.split('\n').length} files)`);
    starter = path.join(os.tmpdir(), `anzuelo-frozen-${head}`);
    if (!fs.existsSync(starter)) {
      const w = spawnSync('git', ['worktree', 'add', '-q', '--detach', starter, 'HEAD'], { cwd: STARTER_ROOT, encoding: 'utf8' });
      if (w.status !== 0) { console.error(`could not freeze ${head}: ${w.stderr}`); process.exit(1); }
    }
  }
  const engine = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: starter, encoding: 'utf8' }).stdout.trim() || head;
  fs.mkdirSync(TRIALS, { recursive: true });
  fs.writeFileSync(path.join(TRIALS, `round-${name}.json`), JSON.stringify({ round: name, engine, starter, ids: list, started: new Date().toISOString() }, null, 2));
  console.log(`round ${name}: engine ${engine}, ${list.length} trials, ${PARALLEL} at a time`);
  const env = { ...process.env, TRIAL_STARTER: starter, TRIAL_RUN: `-${name}` };
  const queue = [...list];
  const worker = async () => {
    for (let id; (id = queue.shift());) {
      const log = fs.openSync(path.join(TRIALS, `log-${name}-${id}.txt`), 'w');
      const code = await new Promise(res => spawn(process.execPath, [fileURLToPath(import.meta.url), id], { env, stdio: ['ignore', log, log] }).on('close', res));
      fs.closeSync(log);
      console.log(`${id} exit=${code}`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(PARALLEL, list.length) }, worker));
  console.log(`round ${name} done. Next: node tools/starter/trials/judge.mjs ${name}`);
}

async function one(id) {
  const sc = SC.find(s => s.id === id);
  if (!sc) { console.error('unknown trial (see --list)'); process.exit(1); }
  const FIX = process.env.TRIAL_STARTER || STARTER_ROOT;
  const RUN = process.env.TRIAL_RUN || '';
  // outside any .claude folder: Claude Code refuses writes there
  const dir = path.join(os.tmpdir(), 'anzuelo-new', sc.id + RUN);
  if (fs.existsSync(dir)) { console.error(`${dir} exists; pick a new round name`); process.exit(1); }
  fs.mkdirSync(dir, { recursive: true });
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', maxBuffer: 64 << 20 });
  const commit = msg => { g('add', '-A'); g('-c', 'user.name=trial', '-c', 'user.email=trial@example.invalid', 'commit', '-q', '--no-verify', '-m', msg); return g('rev-parse', 'HEAD').stdout.trim(); };
  for (const [f, t] of Object.entries(sc.files || {})) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t); }
  if (sc.git !== false) { g('init', '-q'); if (Object.keys(sc.files || {}).length) commit('the project before the starter'); }
  // the starter's own entry point: an empty folder becomes a new project, a folder with files is adopted
  const made = spawnSync(process.execPath, [path.join(FIX, 'tools', 'new-project.mjs'), dir, '--dev', ...(sc.name ? ['--name', sc.name] : [])], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const madeOk = made.status === 0;
  if (sc.git !== false) commit('starter added');

  const TOOLS = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Skill', 'WebSearch', 'WebFetch', 'Agent', 'Task', 'TodoWrite', 'Bash(node:*)', 'Bash(git:*)', 'Bash(python:*)',
    'Bash(npm:*)', 'Bash(npx:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(mkdir:*)', 'PowerShell(node:*)', 'PowerShell(git:*)', 'PowerShell(python:*)', 'PowerShell(npm:*)'];
  const turn = (prompt, sid) => {
    const args = ['-p', prompt, '--output-format', 'json', '--permission-mode', 'acceptEdits', '--allowedTools', ...TOOLS, ...(sid ? ['--resume', sid] : [])];
    const t0 = Date.now();
    const r = spawnSync('claude', args, { cwd: dir, encoding: 'utf8', timeout: 60 * 60_000, maxBuffer: 64 << 20 });
    let j = {}; try { j = JSON.parse(r.stdout); } catch { j = { result: (r.stdout || '').slice(-3000), error: (r.stderr || String(r.error || '')).slice(-1000) }; }
    return { prompt, min: Math.round((Date.now() - t0) / 6000) / 10, sid: j.session_id || sid, answer: j.result || '', turns: j.num_turns, cost: j.total_cost_usd, error: j.error || (r.status ? `exit ${r.status}` : '') };
  };
  const root = path.join(os.homedir(), '.claude', 'projects');
  const rowsOf = sid => { for (const d of fs.readdirSync(root)) { const f = path.join(root, d, `${sid}.jsonl`); if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } return []; };
  const text = r => JSON.stringify(r.message?.content ?? r.attachment ?? r.content ?? '');
  const node = (...a) => spawnSync(process.execPath, a, { cwd: dir, encoding: 'utf8', maxBuffer: 64 << 20, timeout: 20 * 60_000 });
  const readJ = p => { try { return JSON.parse(fs.readFileSync(path.join(dir, p), 'utf8')); } catch { return {}; } };
  const state = () => {
    const cfg = readJ('tools/hooks/config.json');
    const skills = fs.existsSync(path.join(dir, 'skills')) ? fs.readdirSync(path.join(dir, 'skills')) : [];
    return {
      setupPromptLeft: fs.existsSync(path.join(dir, 'SETUP-PROMPT.md')),
      packs: cfg.packs || [], autonomy: cfg.autonomy || '', skills: skills.length,
      library: skills.filter(s => fs.existsSync(path.join(FIX, 'library', 'skills', s))),
      audit: node('tools/audit.mjs').stdout.trim().split('\n').pop(),
      fit: node('tools/fit.mjs', 'check').stdout.trim().split('\n').pop(),
      checks: (readJ('tools/hooks/requirements.json').requirements || []).length,
    };
  };
  const turns = []; let sid = null, seen = 0, seenSid = null;
  const all = [sc.setup, ...[].concat(sc.then || [])];
  for (const [i, p0] of all.entries()) {
    // a turn may be { prompt, files, newSession }: new files dropped in first (as the user would), or a new session
    const p = typeof p0 === 'string' ? p0 : p0.prompt;
    if (typeof p0 === 'object') { for (const [f, t] of Object.entries(p0.files || {})) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), t); } if (p0.newSession) sid = null; }
    const before = commit(`before turn ${i + 1}`);
    const t = turn(p, sid); sid = t.sid;
    const after = commit(`after turn ${i + 1}`);
    const allRows = rowsOf(sid); if (sid !== seenSid) { seen = 0; seenSid = sid; }
    const rows = allRows.slice(seen); seen = allRows.length; // this turn only
    const opened = [...new Set(rows.flatMap(r => r.type === 'assistant' && Array.isArray(r.message?.content) ? r.message.content : []).filter(c => c?.type === 'tool_use')
      .map(c => c.name === 'Skill' ? `skill:${c.input?.skill || ''}` : String(c.input?.file_path || '').replace(/\\/g, '/'))
      .map(p => (/(docs\/playbooks\/[^/]+\.md|skills\/[^/]+\/SKILL\.md|SETUP-PROMPT\.md)$/.exec(p) || [])[1] || (p.startsWith('skill:') ? p : '')).filter(Boolean))];
    const blockTags = [...new Set(rows.map(text).filter(x => /Almost done:/.test(x)).flatMap(x => (/Names: ([\w ,-]+)/.exec(x) || [, ''])[1].split(/,\s*/)).map(s => s.trim()).filter(Boolean))];
    // what the starter's own hooks cost this turn: text they put into the conversation, tool calls they denied (each a
    // full extra round), and Stop blocks (each another round)
    const overhead = { hookChars: 0, denials: 0, stopBlocks: 0 };
    for (const r of rows) {
      const a = r.attachment;
      if (r.type === 'attachment' && a && (a.hookEvent || /hook/i.test(a.type || ''))) overhead.hookChars += (Array.isArray(a.content) ? a.content.join('') : typeof a.content === 'string' ? a.content : '').length;
      const c = r.message?.content;
      const said = v => typeof v === 'string' ? v : Array.isArray(v) ? v.map(y => y?.text || '').join('') : '';
      if (r.type === 'user' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_result' && /^PreToolUse:\S+ hook error: /.test(said(x.content))) overhead.denials++;
      if (/Almost done:/.test(text(r)) && r.type !== 'assistant') overhead.stopBlocks++;
    }
    const changed = g('diff', '--name-status', before, after).stdout.trim().split('\n').filter(Boolean);
    const reqDiff = g('diff', before, after, '--', 'tools/hooks/requirements.json').stdout;
    turns.push({ ...t, answer: t.answer.slice(0, 2500), opened, blockTags, overhead, changed: changed.length, changedFiles: changed.slice(0, 60),
      newChecks: [...reqDiff.matchAll(/^\+\s*"tag":\s*"([^"]+)"/gm)].map(m => m[1]),
      learned: [...new Set(rows.flatMap(r => r.type === 'assistant' ? (r.message?.content || []).filter(c => c.type === 'text').flatMap(c => c.text.match(/Learned \([a-z-]+\):[^\n]*/g) || []) : []))].map(s => s.slice(0, 200)),
      waivers: (t.answer.match(/N\/?A\s*\([\w-]+\)\s*:[^\n·]*/g) || []), state: state() });
  }
  const st = turns[0]?.state || {};
  const want = sc.expect || {};
  const out = { id: sc.id, why: sc.why, dir, made: madeOk, madeOut: (made.stdout || made.stderr || '').slice(-800), turns,
    verdict: {
      setupDone: !st.setupPromptLeft && /PASS/.test(st.audit || ''),
      packsRight: want.packs ? want.packs.every(p => st.packs.includes(p)) && st.packs.every(p => want.packs.includes(p)) : null,
      skillsWanted: want.skills ? want.skills.filter(s => !st.library.includes(s)) : null,
      skillsUnwanted: want.noSkills ? want.noSkills.filter(s => st.library.includes(s)) : null,
      // each task turn (all but setup and the closing complaint) against the runbook or skill it should follow
      steps: want.steps ? want.steps.map((f, k) => ({ turn: k + 1, want: f, ok: [].concat(f).every(x => turns[k + 1]?.opened.some(o => o.includes(x))), opened: turns[k + 1]?.opened })) : null,
      taskFollowed: want.follow ? [].concat(want.follow).every(f => turns[1]?.opened.some(o => o.includes(f))) : null,
      learned: (turns.at(-1)?.learned.length || turns.at(-1)?.newChecks.length) ? true : null,
    } };
  const resDir = path.join(TRIALS, 'results' + RUN);
  fs.mkdirSync(resDir, { recursive: true });
  fs.writeFileSync(path.join(resDir, `${sc.id}.json`), JSON.stringify(out, null, 2));
  console.log(`${sc.id}: made ${madeOk} | setup ${out.verdict.setupDone} (${st.audit}; prompt left ${st.setupPromptLeft}) | packs ${JSON.stringify(st.packs)} right=${out.verdict.packsRight} | steps ${out.verdict.steps ? out.verdict.steps.map(x => x.ok ? 1 : 0).join('') : '-'} | followed ${out.verdict.taskFollowed} | learned ${out.verdict.learned} | ${turns.map(t => `${t.min}m${t.error ? ' ERR ' + t.error.slice(0, 60) : ''}`).join(', ')}`);
}
