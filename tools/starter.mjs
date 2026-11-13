#!/usr/bin/env node
// What happens to the starter once setup is done. Setup asks the user and runs one of the three choices:
//   node tools/starter.mjs link [starter folder]  remove the leftovers here; add packs, library skills and engine
//                                                 upgrades later straight from the starter folder (recommended)
//   node tools/starter.mjs keep                   move the pack payloads and the skill library into .starter/ (ignored by
//                                                 git), so the project can grow later even without the starter folder
//   node tools/starter.mjs remove                 remove the leftovers and forget the starter
// With the engine outside the project (plan: docs/plans/2026-11-07-engine-outside-the-project.md):
//   node tools/starter.mjs install "<folder>" [--private yes|no] [--gitignore yes|no] [--name ..] [--desc ..]   (from the starter) clone the
//                                                 engine into <folder>/.anzuelo/engine, the files made for the project
//                                                 into .anzuelo/local, and wire it through git-ignored local settings
//   node .anzuelo/engine/tools/starter.mjs local-repo yes|no   record the setup answer: .anzuelo/local as a private git
//                                                 repository of its own (yes: git init, no remote) or a plain folder
// Later:
//   node tools/starter.mjs status                the choice, the link, what can still be added, and how many commits the
//                                                 linked starter is behind its git origin
//   node tools/starter.mjs uninstall [--dry-run]  take the engine out of this project: its hooks unwired, its files
//                                                 removed (backed up in .cache/engine-removed/), the project's own kept,
//                                                 and engine files its own code uses kept too; with the engine in
//                                                 .anzuelo/, no link is needed and .anzuelo/local comes back to its paths
//   node tools/starter.mjs update                 get the newest starter (git pull in the linked copy), then upgrade;
//                                                 --keep-local keeps local changes in that copy on top
//   node tools/starter.mjs upgrade                refresh the engine from the linked starter (new-project.mjs --upgrade):
//                                                 rolls back if a check that passed now fails, then lists what to review
//   node tools/starter.mjs feedback "<text>"      note a lesson about the engine itself (hooks, checks, tools) in
//                                                 docs/starter-feedback.md: one dated line, kept on upgrade
//   node tools/starter.mjs report                 copy the lines not yet reported into the linked starter's
//                                                 docs/feedback-inbox/<project>.md (appends; skipped without a link)
//   node tools/starter.mjs feedback-status <docs/feedback-inbox/name.md> [--set <item> "<status>"]
//                                                 (in the starter) write or refresh <name>.status.md beside a report: each
//                                                 item "open", "fixed in <commit>" or "declined: <why>"; lists the open
//                                                 ones. A project's "status" then shows how many of its reports are fixed.
//   node tools/starter.mjs clean-tests [--hours N]  remove what killed test runs left under <temp>/anzuelo-tests, older
//                                                 than 1 hour (or N); nothing else in the temp folder is touched
//   node tools/starter.mjs stop-tests             stop every test run going now (self-tests, sweeps, trials, release
//                                                 chains): each exits within about a second and removes its folders
//   node tools/starter.mjs test-run [--strict] -- <test command>  run the project's own tests with their temp folder
//                                                 under <temp>/anzuelo-tests/projects/<name>, removed when they end, and
//                                                 list what they still left in the temp folder (--strict: that fails)
// The starter always lives in its own folder, outside every project it creates. The link is a path on this machine,
// so it is kept in tools/starter.local.json, which git ignores. On another machine, run "link <folder>" again.
import './hooks/hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { ROOT, STARTER_LINK, starterLink, starterSources, syncAll, setupCompleteness, usageOf, noteEngineChange } from './hooks/hooks-main.mjs';
import { registry } from './packs.mjs';
import { behindUpstream } from './hooks/repo.mjs';
import { where, whereWrite, split, kind, keepList, ENGINE, LOCAL, PROJECT } from './hooks/paths.mjs';
import { scriptsIn } from './hooks/wire.mjs';
import { carryRunEach } from './hooks/selfcmds.mjs';

// (each path goes where paths.mjs says: in the starter, all one folder; in a project, packs and library are the engine's)
const CONFIG = where('tools/hooks/config.json');
const at = (...p) => where(path.join(...p));
const readCfg = () => { try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return {}; } };
const setMode = mode => { const c = readCfg(); c.starter = mode; fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2) + '\n'); };
const node = (...a) => spawnSync(process.execPath, a, { cwd: ROOT, encoding: 'utf8' });
const leftovers = () => split ? [] : ['packs', 'library'].filter(d => fs.existsSync(at(d)));
// Lessons about the engine found in this project travel back to the starter. Lesson: engine-level lessons stayed in
// the project where they were found, so every other project hit them again.
const FEEDBACK = 'docs/starter-feedback.md';
const FEEDBACK_HEAD = '# Feedback for the starter\nLessons about the engine itself (hooks, checks, tools), one dated line each. Upgrades keep this file;\n`node tools/starter.mjs report` copies new lines to the linked starter.\n\n';
const feedbackLines = () => { try { return fs.readFileSync(at(FEEDBACK), 'utf8').split(/\r?\n/).filter(l => /^- \d{4}-\d\d-\d\d: \S/.test(l)).map(l => l.trim()); } catch { return []; } };
// The upgrade's own options, passed through by upgrade and update alike. Lesson: update dropped --verbose.
const upgradeFlags = () => process.argv.slice(3).filter(a => ['--dry-run', '--accept-findings', '--verbose', '--allow-dirty'].includes(a));
// A line already sent is recognized after small edits: the same date, and most of its words the same (a reworded
// path, a typo fixed, a sentence added). Lesson: report sent two edited lines again, as if they were new.
const lineWords = l => new Set((String(l).toLowerCase().replace(/^- \d{4}-\d\d-\d\d:\s*/, '').match(/[a-z0-9]{3,}/g) || []));
const lineDate = l => (/^- (\d{4}-\d\d-\d\d):/.exec(String(l).trim()) || [])[1] || '';
const sameLine = (a, b) => {
  if (a === b) return true;
  if (!lineDate(a) || lineDate(a) !== lineDate(b)) return false;
  const x = lineWords(a), y = lineWords(b);
  if (!x.size || !y.size) return false;
  const both = [...x].filter(w => y.has(w)).length;
  return both / Math.min(x.size, y.size) >= 0.8 && both / Math.max(x.size, y.size) >= 0.5;
};
const alreadySent = (l, known) => known.some(k => sameLine(l, k));
const reportedLines = () => { try { return new Set(JSON.parse(fs.readFileSync(at('tools', 'hooks', 'state', 'feedback-reported.json'), 'utf8'))); } catch { return new Set(); } };
const projectSlug = () => {
  const name = (() => { try { return JSON.parse(fs.readFileSync(at('docs', 'names.json'), 'utf8')).PROJECT_NAME; } catch { return ''; } })();
  return (name && !/\{\{/.test(name) ? name : path.basename(ROOT)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
};

// The feedback loop, closed: a report in the starter's docs/feedback-inbox/ gets a sibling <name>.status.md with one row
// per reported item ("### N. Title" headings, or dated "- YYYY-MM-DD: ..." lines) and its status: "open", "fixed in
// <commit>" or "declined: <why>". The starter's author fills the status (by hand or with --set); the tool adds new items
// as open, keeps every status, and lists what is still open. A project's "status" counts its own. Lesson: the inbox was
// append-only, so a project could not tell which of its reports were fixed without re-testing or reading the code.
const FEEDBACK_STATUS = /^(open|fixed in [0-9a-f]{7,40}\b.*|declined: \S+(\s+\S+)+)$/i;
const statusFileOf = f => f.replace(/\.md$/i, '') + '.status.md';
function feedbackItems(text) {
  const items = [], perDay = {};
  for (const l of String(text).split(/\r?\n/)) {
    let m = /^#{2,4}\s+(\d+)\.\s+(.+?)\s*$/.exec(l);
    if (m) { items.push({ id: `#${m[1]}`, what: m[2] }); continue; }
    m = /^- (\d{4}-\d\d-\d\d): (.+)$/.exec(l);
    if (m) { perDay[m[1]] = (perDay[m[1]] || 0) + 1; items.push({ id: `${m[1]}#${perDay[m[1]]}`, what: m[2].replace(/\s*\(reviewed\b[^)]*\)\s*$/i, '') }); }
  }
  return items;
}
function readFeedbackStatus(file) {
  const rows = new Map();
  for (const l of (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '').split(/\r?\n/)) {
    const c = l.split('|').map(s => s.trim());
    if (c.length === 5 && c[1] && !/^(item|-+)$/i.test(c[1])) rows.set(c[1], c[3]);
  }
  return rows;
}
function feedbackStatusCount(rows) {
  const st = [...rows.values()];
  return { fixed: st.filter(s => /^fixed in /i.test(s)).length, declined: st.filter(s => /^declined:/i.test(s)).length, open: st.filter(s => /^open$/i.test(s)).length, bad: st.filter(s => !FEEDBACK_STATUS.test(s)).length };
}
if (process.argv[2] === 'feedback-status') {
  // node tools/starter.mjs feedback-status <inbox file> [--set <item> "<status>"]
  const args = process.argv.slice(3), si = args.indexOf('--set'), inbox = args.find((a, i) => !a.startsWith('--') && (si < 0 || (i !== si + 1 && i !== si + 2)));
  if (!inbox || !fs.existsSync(path.resolve(inbox))) { console.error('usage: node tools/starter.mjs feedback-status <docs/feedback-inbox/name.md> [--set <item> "open" | "fixed in <commit>" | "declined: <why>"]'); process.exit(2); }
  const file = path.resolve(inbox), out = statusFileOf(file), old = readFeedbackStatus(out);
  const items = feedbackItems(fs.readFileSync(file, 'utf8'));
  if (si >= 0) {
    const [id, status = ''] = [args[si + 1], args[si + 2]];
    if (!items.some(x => x.id === id)) { console.error(`feedback-status: no item "${id}" in ${inbox} (items: ${items.map(x => x.id).join(', ') || 'none'})`); process.exit(1); }
    if (!FEEDBACK_STATUS.test(status.trim())) { console.error(`feedback-status: "${status}" is not a status: use "open", "fixed in <commit>" or "declined: <why, a few words>"`); process.exit(1); }
    old.set(id, status.trim());
  }
  const cell = s => String(s).replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
  const rows = new Map(items.map(x => [x.id, old.get(x.id) || 'open']));
  fs.writeFileSync(out, `# Feedback status: ${path.basename(file)}\n\n<!-- Kept by node tools/starter.mjs feedback-status. One row per reported item. The starter's author fills Status: ` +
    `"open", "fixed in <commit>" or "declined: <why>". New items are added as open; every status is kept. -->\n\n| Item | Reported | Status |\n|---|---|---|\n` +
    items.map(x => `| ${x.id} | ${cell(x.what).slice(0, 110)} | ${cell(rows.get(x.id))} |`).join('\n') + '\n');
  const n = feedbackStatusCount(rows);
  console.log(`feedback-status: ${path.relative(process.cwd(), out) || out} (${items.length} item(s): ${n.fixed} fixed, ${n.declined} declined, ${n.open} open${n.bad ? `, ${n.bad} with a status that is not "open", "fixed in <commit>" or "declined: <why>"` : ''})`);
  const openOnes = items.filter(x => !/^(fixed in |declined:)/i.test(rows.get(x.id)));
  if (openOnes.length) console.log('still open:\n' + openOnes.map(x => `  ${x.id} ${cell(x.what).slice(0, 90)}${/^open$/i.test(rows.get(x.id)) ? '' : `  (status "${rows.get(x.id)}" is not valid)`}`).join('\n'));
  process.exit(n.bad ? 1 : 0);
}

// (install runs from the starter: it puts this engine into another folder)
// clean-tests: what killed test runs left under the one test root (<temp>/anzuelo-tests), older than 1 hour (or
// --hours N); nothing else in the temp folder is touched. In the starter and in projects alike.
// stop-tests: every test run started before now stops within about a second and removes its folders (testtmp.mjs)
if (process.argv[2] === 'stop-tests') {
  const { requestStop } = await import('./hooks/testtmp.mjs');
  console.log(`stop-tests: wrote ${requestStop()}; the self-tests, sweeps, trials and release chains running now stop within about a second`);
  process.exit(0);
}
if (process.argv[2] === 'clean-tests') {
  const { cleanOld, cleanDead, TEST_ROOT } = await import('./hooks/testtmp.mjs');
  const h = process.argv.indexOf('--hours'), hours = h > 0 ? Number(process.argv[h + 1]) : 1;
  if (!(hours >= 0)) { console.error('usage: node tools/starter.mjs clean-tests [--hours N]'); process.exit(2); }
  const n = cleanDead() + cleanOld(hours * 3600_000); // (what killed runs left at once, then anything that old)
  console.log(`clean-tests: removed ${n} leftover test folder${n === 1 ? '' : 's'} older than ${hours} hour${hours === 1 ? '' : 's'} under ${TEST_ROOT}`);
  process.exit(0);
}
// test-run: a project's own test command, any language, with its temp folder pointed at a folder of its own under
// <temp>/anzuelo-tests/projects/<name> that is removed when it ends; then what it still left in the real temp folder.
// The command's exit code is kept; --strict also fails when it left something.
if (process.argv[2] === 'test-run') {
  const { runIsolated } = await import('./hooks/testtmp.mjs');
  const rest = process.argv.slice(3), strict = rest[0] === '--strict', i = rest.indexOf('--');
  const cmd = i >= 0 ? rest.slice(i + 1) : rest.filter(a => a !== '--strict');
  if (!cmd.length) { console.error('usage: node tools/starter.mjs test-run [--strict] -- <test command>'); process.exit(2); }
  const r = runIsolated(cmd);
  console.log(r.added.length
    ? `test-run: the command left ${r.added.length} new entr${r.added.length === 1 ? 'y' : 'ies'} in the temp folder (another program running now may have made some): ${r.added.slice(0, 10).join(', ')}${r.added.length > 10 ? ', ...' : ''}`
    : 'test-run: the command left nothing in the temp folder');
  process.exit(r.status || (strict && r.added.length ? 1 : 0));
}
if (fs.existsSync(at('.starter-template')) && process.argv[2] !== 'install') { console.error('This is the starter itself. These commands are for projects made from it.'); process.exit(1); }

const [cmd, arg] = process.argv.slice(2);
// ---- the engine in .anzuelo/engine: an upgrade is a git pull there, and nothing the project made is touched ----
// .anzuelo/local/based-on.json: { at: the engine commit of the last install or upgrade, files: { <path>: the engine
// commit a local copy of a default was made from } }. A local copy with no entry was made since "at".
const engineGit = (...a) => spawnSync('git', a, { cwd: ENGINE, encoding: 'utf8', timeout: 120000 });
const engineHead = () => (engineGit('rev-parse', 'HEAD').stdout || '').trim();
const BASED_ON = () => path.join(LOCAL, 'based-on.json');
function basedOn() { let b = {}; try { b = JSON.parse(fs.readFileSync(BASED_ON(), 'utf8')); } catch { } return { at: b.at || '', files: b.files || {} }; }
function saveBasedOn(b) { fs.mkdirSync(LOCAL, { recursive: true }); fs.writeFileSync(BASED_ON(), JSON.stringify(b, null, 2) + '\n'); }
// every local copy of a file the engine also has (runbooks, skills, checklists, the rules, requirements)
function localCopies() {
  const out = [];
  const walk = d => { let es = []; try { es = fs.readdirSync(path.join(LOCAL, d || '.'), { withFileTypes: true }); } catch { return; }
    for (const e of es) { const p = d ? `${d}/${e.name}` : e.name; if (e.isDirectory()) { if (!/^(\.git|\.cache|state)$/.test(e.name)) walk(p); } else if (kind(p) === 'both' && fs.existsSync(path.join(ENGINE, p))) out.push(p); } };
  walk('');
  return out;
}
// (dry: nothing in the project, .anzuelo/local or the engine's checkout changes; only a git fetch updates the engine
// clone's record of its remote, to see what an upgrade would take. Lesson (a field report, 2026-11-10): with the engine
// in .anzuelo/engine, "upgrade --dry-run" ignored the flag, pulled and merged for real, and printed no list, so the
// runbook's "dry run first" could not be followed)
export function splitUpgrade(dry = false) {
  if (!fs.existsSync(path.join(ENGINE, '.git'))) { console.error(`${ENGINE} is not a git clone: install the engine again (starter.mjs install)`); return 1; }
  const dirty = (engineGit('status', '--porcelain').stdout || '').trim();
  if (dirty) { console.error(`the engine folder has changes of its own:\n${dirty}\nA project's changes belong in .anzuelo/local (starter.mjs override <path>). Move them there, then upgrade.`); return 1; }
  const b = basedOn(), old = engineHead(), from = b.at || old;
  // (a copy made since the last upgrade carries that commit from now on, before "at" moves forward)
  for (const f of localCopies()) b.files[f] ||= from;
  if (dry) {
    const fetch = engineGit('fetch', '-q');
    if (fetch.status !== 0) { console.error(`git fetch in ${ENGINE} failed:\n${fetch.stderr}\nDry run: nothing changed.`); return 1; }
    const up = (engineGit('rev-parse', '@{u}').stdout || '').trim();
    if (!up) { console.error(`the engine clone in ${ENGINE} follows no remote branch: nothing to upgrade from.\nDry run: nothing changed.`); return 1; }
    const ff = engineGit('merge-base', '--is-ancestor', old, up).status === 0;
    const n = (engineGit('rev-list', '--count', `${old}..${up}`).stdout || '').trim();
    const log = [];
    log.push(old === up ? `the engine is current (${up.slice(0, 7)})` : ff ? `would upgrade the engine ${old.slice(0, 7)} -> ${up.slice(0, 7)} (${n} commit(s))` : `the engine's history and its remote's have split: the real upgrade stops at the pull, to be merged by hand in ${ENGINE}`);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-merge-'));
    try {
      for (const [f, base] of Object.entries(b.files)) {
        const mine = path.join(LOCAL, f), next = engineGit('show', `${up}:${f}`);
        if (!fs.existsSync(mine) || next.status !== 0 || base === up || engineGit('diff', '--quiet', base, up, '--', f).status === 0) continue;
        const was = engineGit('show', `${base}:${f}`), baseFile = path.join(tmp, 'base'), oursFile = path.join(tmp, 'ours'), theirs = path.join(tmp, 'theirs');
        fs.writeFileSync(baseFile, was.status === 0 ? was.stdout : ''); fs.copyFileSync(mine, oursFile); fs.writeFileSync(theirs, next.stdout);
        const m = spawnSync('git', ['merge-file', '-p', oursFile, baseFile, theirs], { encoding: 'utf8' });
        log.push(m.status === 0 ? `would merge the default's change into this project's copy: ${f}` : `would list for the user (the project's change and the default's meet): ${f}`);
      }
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    if (old !== up && ff) log.push('would make the wiring again (wire.mjs), and note the change in the project\'s engine log');
    const wouldCarry = carryRunEach(fs.existsSync(path.join(LOCAL, 'tools', 'hooks', 'requirements.json')) ? LOCAL : PROJECT, { dry: true });
    if (wouldCarry.length) log.push(`would approve ${wouldCarry.length} runEach command(s) the project's checks run on their own (selfCommands): ${wouldCarry.join(' | ')}`);
    console.log(`${log.join('\n')}\n\nDry run: nothing changed (${log.length} item(s) above).`);
    return 0;
  }
  const pull = engineGit('pull', '--ff-only', '-q');
  if (pull.status !== 0) { console.error(`git pull in ${ENGINE} failed:\n${pull.stderr}\nMerge it there by hand (an AI agent can), then run the upgrade again.`); saveBasedOn(b); return 1; }
  const now = engineHead();
  console.log(old === now ? `the engine is current (${now.slice(0, 7)})` : `engine ${old.slice(0, 7)} -> ${now.slice(0, 7)} (${(engineGit('rev-list', '--count', `${old}..${now}`).stdout || '').trim()} commit(s))`);
  // each local copy whose default changed since it was made: a three-way merge (its base, the new default, the copy)
  const merged = [], clash = [], tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-merge-'));
  try {
    for (const [f, base] of Object.entries(b.files)) {
      const mine = path.join(LOCAL, f);
      if (!fs.existsSync(mine) || !fs.existsSync(path.join(ENGINE, f))) { delete b.files[f]; continue; }
      if (base === now || engineGit('diff', '--quiet', base, now, '--', f).status === 0) { b.files[f] = now; continue; }
      const was = engineGit('show', `${base}:${f}`);
      const baseFile = path.join(tmp, 'base'), oursFile = path.join(tmp, 'ours');
      fs.writeFileSync(baseFile, was.status === 0 ? was.stdout : ''); fs.copyFileSync(mine, oursFile);
      const m = spawnSync('git', ['merge-file', '-p', '-L', 'this project', '-L', 'old default', '-L', 'new default', oursFile, baseFile, path.join(ENGINE, f)], { encoding: 'utf8' });
      if (m.status === 0) { fs.writeFileSync(mine, m.stdout); b.files[f] = now; merged.push(f); }
      else { const out = path.join(LOCAL, '.cache', 'merge', f); fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, m.stdout); clash.push(`${f} (both changed the same lines: ${path.relative(PROJECT, out).split(path.sep).join('/')} shows them; the project's copy is used until it is decided)`); }
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  b.at = now; saveBasedOn(b);
  if (merged.length) console.log(`merged the default's changes into this project's copies: ${merged.join(', ')}`);
  if (clash.length) console.log(`for the user to decide (the project's change and the default's meet):\n- ${clash.join('\n- ')}`);
  // (REQ: self-run: the project's committed runEach commands go onto the approved list, as in the plain layout's
  // upgrade, so no check it had stops running. The user, 2026-11-10)
  const own = fs.existsSync(path.join(LOCAL, 'tools', 'hooks', 'requirements.json')) ? LOCAL : PROJECT, carried = carryRunEach(own);
  if (carried.length) { console.log(`approved ${carried.length} runEach command(s) the project's checks run on their own (selfCommands, ${path.relative(PROJECT, path.join(own, 'tools/hooks/config.json')).split(path.sep).join('/')}): ${carried.join(' | ')}`);
    noteEngineChange(PROJECT, `carried ${carried.length} runEach command(s) onto the approved list, so the hook keeps running them: ${carried.join(' | ')}`); }
  const w = spawnSync(process.execPath, [path.join(ENGINE, 'tools', 'hooks', 'wire.mjs')], { cwd: PROJECT, encoding: 'utf8' });
  process.stdout.write(w.stdout || '');
  if (old !== now) console.log(`what changed: ${path.join(ENGINE, 'tools', 'starter', 'STARTER-CHANGELOG.md').split(path.sep).join('/')} (lines since ${old.slice(0, 7)}); review them in docs/DECISIONS.md as before`);
  if (old !== now) noteEngineChange(PROJECT, `upgraded to ${now.slice(0, 7)} (from ${old.slice(0, 7)}): what changed is in .anzuelo/engine/tools/starter/STARTER-CHANGELOG.md`);
  return w.status === 0 ? 0 : 1;
}
// Leaving the engine with it in .anzuelo/: the project's own hooks, skills, scripts and records stay or come back to
// their paths, and only the engine and its wiring go (backed up in .cache/engine-removed/). Plan: clean exit, Task 2.
// Lesson (the user): leaving must be as easy as joining, with the project's own work intact.
export function splitUninstall(dry) {
  const at = (...p) => path.join(PROJECT, ...p), log = [], stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backup = at('.cache', 'engine-removed', stamp), save = f => { if (!dry && fs.existsSync(at(f))) { fs.mkdirSync(path.dirname(path.join(backup, f)), { recursive: true }); fs.copyFileSync(at(f), path.join(backup, f)); } };
  const isEngineCmd = h => /\.anzuelo[\\/]+engine[\\/]+tools[\\/]+hooks[\\/]+hooks\.mjs/.test(String(h?.command || ''));
  // 1. the wiring: only the engine's entries go
  for (const f of ['.claude/settings.local.json', '.codex/hooks.json']) {
    let j; try { j = JSON.parse(fs.readFileSync(at(f), 'utf8')); } catch { continue; }
    if (!Object.values(j.hooks || {}).flat().some(g => [].concat(g?.hooks || []).some(isEngineCmd))) continue;
    for (const [ev, list] of Object.entries(j.hooks)) {
      const keep = [].concat(list).flatMap(g => { const rest = [].concat(g?.hooks || []).filter(h => !isEngineCmd(h)); return rest.length ? [{ ...g, hooks: rest }] : []; });
      if (keep.length) j.hooks[ev] = keep; else delete j.hooks[ev];
    }
    if (!Object.keys(j.hooks).length) delete j.hooks;
    save(f);
    const empty = !Object.keys(j).length;
    if (!dry) empty ? fs.rmSync(at(f)) : fs.writeFileSync(at(f), JSON.stringify(j, null, 2) + '\n');
    log.push(`unwired  ${f} (the engine's hooks${empty ? '; nothing else was in it, so it went' : '; the rest kept'})`);
  }
  if (fs.existsSync(at('CLAUDE.local.md'))) {
    const t = fs.readFileSync(at('CLAUDE.local.md'), 'utf8'), rest = t.split(/\r?\n/).filter(l => !/^@\.anzuelo\/(local|engine)\/AGENTS\.md\s*$/.test(l)).join('\n').trim();
    if (rest !== t.trim()) { save('CLAUDE.local.md'); if (!dry) rest ? fs.writeFileSync(at('CLAUDE.local.md'), rest + '\n') : fs.rmSync(at('CLAUDE.local.md')); log.push(`unwired  CLAUDE.local.md (the engine's rules${rest ? '; your own lines kept' : ''})`); }
  }
  // (what install saved: git's hooks path and the agent files as they were before it; a file install made, holding only
  // what wiring adds, goes. Lesson (two field reports): a rollback left git's hooks path at the deleted engine)
  const pre = (() => { try { return JSON.parse(fs.readFileSync(path.join(LOCAL, 'pre-install.json'), 'utf8')); } catch { return null; } })();
  // (an engine hook command in the saved file whose script is gone now, such as an older in-project engine's, stays
  // out; the project's own commands always come back)
  const live = h => !/hooks[\\/]+hooks\.mjs/.test(String(h?.command || '')) || scriptsIn(h?.command).every(p => fs.existsSync(path.isAbsolute(p) ? p : at(p)));
  const prune = t => { let j; try { j = JSON.parse(t); } catch { return t; } if (!j.hooks) return t;
    for (const [ev, list] of Object.entries(j.hooks)) { const keep = [].concat(list).flatMap(g => { const rest = [].concat(g?.hooks || []).filter(live); return rest.length ? [{ ...g, hooks: rest }] : []; }); if (keep.length) j.hooks[ev] = keep; else delete j.hooks[ev]; }
    if (!Object.keys(j.hooks).length) delete j.hooks; return JSON.stringify(j, null, 2) + '\n'; };
  for (const [f, saved] of Object.entries(pre?.files || {})) {
    const now = fs.existsSync(at(f)) ? fs.readFileSync(at(f), 'utf8') : null, was = saved === null ? null : /\.json$/.test(f) ? prune(saved) : saved;
    if (was !== null && now !== was && !dry) { save(f); fs.mkdirSync(path.dirname(at(f)), { recursive: true }); fs.writeFileSync(at(f), was); }
    if (was !== null && now !== was) log.push(`restored ${f} (as it was before the install)`);
    let left = null; try { left = JSON.parse(now); } catch { }
    if (was === null && now !== null && left && Object.keys(left).every(k => ['includeCoAuthoredBy', 'attribution'].includes(k))) { save(f); if (!dry) fs.rmSync(at(f)); log.push(`removed  ${f} (the install made it; nothing of the project's is in it)`); }
  }
  const hp = (spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: PROJECT, encoding: 'utf8' }).stdout || '').trim();
  const sound = p => p && ['pre-commit', 'commit-msg', 'pre-push'].some(h => fs.existsSync(path.join(path.resolve(PROJECT, p), h)));
  if (/^\.anzuelo\/engine\//.test(hp) || (hp && !sound(hp))) {
    const back = sound(pre?.hooksPath) ? pre.hooksPath : '';
    if (!dry) spawnSync('git', ['config', ...(back ? ['core.hooksPath', back] : ['--unset', 'core.hooksPath'])], { cwd: PROJECT });
    log.push(back ? `restored git's hooks path (${back}, as before the install)` : 'unwired  git hooks (core.hooksPath)');
  }
  if (fs.existsSync(at('.gitignore'))) {
    const gi = fs.readFileSync(at('.gitignore'), 'utf8'), MARK = '# The project engine and its wiring (made on each machine, never committed)';
    const BLOCK = new Set(['.anzuelo/', 'CLAUDE.local.md', '.claude/settings.local.json', '.claude/skills/', '.agents/skills/', '.codex/hooks.json']);
    const lines = gi.split(/\r?\n/), i = lines.indexOf(MARK);
    if (i >= 0) {
      let j = i + 1; while (j < lines.length && BLOCK.has(lines[j].trim())) j++;
      // (a machine's own Claude Code settings stay out of git)
      const out = [...lines.slice(0, i), ...(fs.existsSync(at('.claude/settings.local.json')) ? ['.claude/settings.local.json'] : []), ...lines.slice(j)].join('\n').replace(/\n{3,}/g, '\n\n');
      save('.gitignore'); if (!dry) fs.writeFileSync(at('.gitignore'), out); log.push('updated  .gitignore (the engine\'s block removed)');
    }
  }
  // 2. the project's own files in .anzuelo/local come back to their paths; one the project already has stays, and the
  // local copy waits in the backup. The engine's state, settings and generated map do not come back.
  const SKIP = /^(\.git|\.cache|\.starter|tools\/hooks\/(state|config\.json|requirements\.json)|tools\/starter|tools\/packs-registry\.json|based-on\.json|config\.json|DIRECTORY\.md|SETUP-PROMPT\.md|HOW-TO-USE\.md)(\/|$)/;
  const back = [], clash = [];
  const walk = d => { let es = []; try { es = fs.readdirSync(path.join(LOCAL, d || '.'), { withFileTypes: true }); } catch { return; }
    for (const e of es) { const p = d ? `${d}/${e.name}` : e.name; if (SKIP.test(p)) continue; if (e.isDirectory()) walk(p); else (fs.existsSync(at(p)) ? clash : back).push(p); } };
  walk('');
  for (const p of back) { if (!dry) { fs.mkdirSync(path.dirname(at(p)), { recursive: true }); fs.copyFileSync(path.join(LOCAL, p), at(p)); } }
  if (back.length) log.push(`restored ${back.length} file(s) of the project's own from .anzuelo/local to their paths (${back.slice(0, 5).join(', ')}${back.length > 5 ? ', ...' : ''})`);
  for (const p of clash) log.push(`kept     ${p} (the project's copy; the one from .anzuelo/local is in the backup)`);
  // (skill mirrors: the project's own skills keep theirs, the engine's go)
  for (const m of ['.claude/skills', '.agents/skills']) for (const s of (() => { try { return fs.readdirSync(at(m)); } catch { return []; } })())
    if (!fs.existsSync(at('skills', s)) && !back.some(p => p.startsWith(`skills/${s}/`)) && fs.existsSync(at(m, s, '.mirror'))) { if (!dry) fs.rmSync(at(m, s), { recursive: true, force: true }); log.push(`removed  ${m}/${s} (a copy of an engine skill)`); }
  // 3. the project's files that still name .anzuelo/ break once it is gone: named, not changed
  const tracked = (spawnSync('git', ['ls-files'], { cwd: PROJECT, encoding: 'utf8' }).stdout || '').split('\n').filter(f => f && f !== '.gitignore' && /\.(mjs|cjs|js|ts|py|sh|ps1|bat|cmd|json|toml|ya?ml|md)$/i.test(f));
  const naming = tracked.filter(f => { try { return fs.readFileSync(at(f), 'utf8').includes('.anzuelo/'); } catch { return false; } });
  if (naming.length) log.push(`check    ${naming.length} file(s) of the project still name .anzuelo/ and need changing: ${naming.slice(0, 8).join(', ')}${naming.length > 8 ? ', ...' : ''}`);
  // 4. the engine goes; .anzuelo/local is backed up whole, and the engine's commit and origin are written down
  const origin = (engineGit('remote', 'get-url', 'origin').stdout || '').trim(), head = engineHead();
  if (!dry) {
    fs.mkdirSync(backup, { recursive: true });
    fs.cpSync(LOCAL, path.join(backup, '.anzuelo', 'local'), { recursive: true });
    fs.writeFileSync(path.join(backup, 'engine.json'), JSON.stringify({ commit: head, origin }, null, 2) + '\n');
    fs.rmSync(at('.anzuelo'), { recursive: true, force: true, maxRetries: 3 });
  }
  log.push('removed  .anzuelo/ (the engine and its local files)');
  if (!dry) noteEngineChange(PROJECT, `removed from .anzuelo/ (backed up in ${path.relative(PROJECT, backup).split(path.sep).join('/')}/; ${back.length} file(s) of the project's own brought back${naming.length ? `; ${naming.length} file(s) still name .anzuelo/` : ''})`);
  console.log(log.join('\n'));
  console.log(dry ? `\nDry run: nothing changed (${log.length} item(s) above).` : `\nRemoved the engine: backed up in ${path.relative(PROJECT, backup).split(path.sep).join('/')}/ (.anzuelo/local whole, the changed wiring files, and the engine's commit ${head.slice(0, 7)}${origin ? ` from ${origin}` : ''}). ` +
    `To put it back: clone the starter, run its tools/starter.mjs install "${PROJECT}", then copy .anzuelo/local back from the backup.`);
  return 0;
}

// The answer to "a private git repository for .anzuelo/local?", recorded in its config.json. Yes makes the repository
// (never a remote: creating one is an outward action with its own OK); no leaves a plain folder.
function setLocalRepo(loc, yes) {
  const f = path.join(loc, 'config.json'); let c = {}; try { c = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { }
  fs.mkdirSync(loc, { recursive: true }); fs.writeFileSync(f, JSON.stringify({ ...c, privateRepo: yes }, null, 2) + '\n');
  if (yes && !fs.existsSync(path.join(loc, '.git'))) spawnSync('git', ['init', '-q'], { cwd: loc });
  return yes ? `${loc} is a private git repository of its own (history and backup, never in the project's pushes; no remote was made)`
    : `${loc} is a plain folder: it has no history or backup of its own`;
}

// REQ: setup-complete. During setup the leftovers go only once everything that fits the project is in, so nothing is lost.
if (['link', 'keep', 'remove'].includes(cmd) && fs.existsSync(at('SETUP-PROMPT.md'))) {
  const probs = setupCompleteness(undefined, { final: true, beforeStarter: true });
  if (probs.length) { console.error('Not yet. Setup must first give the project everything that fits it:\n- ' + probs.join('\n- ')); process.exit(1); }
}

// Records what every pack owns before the payloads leave, so the audit can still check pack purity.
function saveRegistry() { fs.writeFileSync(whereWrite('tools/packs-registry.json'), JSON.stringify(registry(), null, 2) + '\n'); }

function clearHere() {
  saveRegistry();
  for (const d of leftovers()) fs.rmSync(at(d), { recursive: true, force: true });
}

function finish(mode, lines) {
  setMode(mode);
  node(path.join('tools', 'skills.mjs'), 'refresh'); // the rule-to-check map lists only enabled library skills
  syncAll();
  console.log([...lines, '', `Record it in docs/DECISIONS.md: "Starter: ${mode}" and why.`].join('\n'));
}

if (cmd === 'link') {
  if (arg) {
    const dir = path.resolve(arg);
    if (!fs.existsSync(path.join(dir, 'tools', 'new-project.mjs'))) { console.error(`${dir} is not a starter folder (no tools/new-project.mjs).`); process.exit(1); }
    if (inside(ROOT, dir) || inside(dir, ROOT)) { console.error('The starter must live outside this project, in its own folder.'); process.exit(1); }
    // (a starter in the temp folder disappears when temp is cleaned, and linking removes this project's own packs/ and
    // library/. Lesson, trial round 12: a vault linked to a starter in Temp and lost the tools its answer promised for later)
    if (inside(dir, os.tmpdir()) && !process.env.STARTER_ALLOW_TEMP) { console.error(`${dir} is in the temp folder, which gets cleaned: linking to it would leave this project without packs/ and library/. Keep a copy instead: node tools/starter.mjs keep (or link to a starter in a lasting folder).`); process.exit(1); }
    // (allowed anyway, it is still said, so the answer and DECISIONS.md don't call the link lasting. Lesson, trial
    // rounds 14 and 15: setups linked to a starter in the temp folder recorded "the starter folder stays on this machine")
    if (inside(dir, os.tmpdir())) console.log(`warning: ${dir} is in the temp folder, which gets cleaned. The link works now, but "add it later" depends on that folder surviving; say so to the user.`);
    if (fs.existsSync(path.join(dir, '.starter-dev')) && !(process.env.STARTER_ALLOW_DEV ?? process.env.KS_ALLOW_DEV)) { console.error(`${dir} is a development copy of the starter (.starter-dev). Link a stable copy instead, so unfinished changes never reach this project.`); process.exit(1); }
    fs.writeFileSync(at(STARTER_LINK), JSON.stringify({ path: dir }, null, 2) + '\n');
  }
  const link = starterLink();
  if (!link) { console.error(`No starter is linked. Run: node tools/starter.mjs link "<starter folder>"`); process.exit(1); }
  clearHere();
  finish('link', [`Linked to the starter at ${link}.`, 'Removed packs/ and library/ from this project. Add more later with:',
    '  node tools/packs.mjs install <pack>     node tools/skills.mjs enable <skill>     node tools/starter.mjs upgrade']);
} else if (cmd === 'keep') {
  saveRegistry();
  fs.mkdirSync(at('.starter'), { recursive: true });
  for (const d of leftovers()) {
    fs.cpSync(at(d), at('.starter', d), { recursive: true });
    fs.rmSync(at(d), { recursive: true, force: true });
  }
  const kept = ['packs', 'library'].filter(d => fs.existsSync(at('.starter', d)));
  finish('keep', [`Kept ${kept.join(' and ') || 'nothing (no leftovers were here)'} in .starter/ (ignored by git).`,
    'Add more later with: node tools/packs.mjs install <pack>   node tools/skills.mjs enable <skill>',
    starterLink() ? `The link to ${starterLink()} stays too, for engine upgrades.` : 'No starter is linked, so engine upgrades need: node tools/starter.mjs link "<starter folder>"']);
} else if (cmd === 'remove') {
  clearHere();
  fs.rmSync(at('.starter'), { recursive: true, force: true });
  fs.rmSync(at(STARTER_LINK), { force: true });
  finish('remove', ['Removed the starter\'s leftovers and the link. This project carries only what it uses.',
    'To grow later: node tools/starter.mjs link "<starter folder>", or from the starter: node tools/new-project.mjs "<this folder>" --add-pack / --add-skill']);
} else if (split && ['upgrade', 'update'].includes(cmd)) {
  process.exit(splitUpgrade(process.argv.includes('--dry-run')));
} else if (split && cmd === 'uninstall') {
  process.exit(splitUninstall(process.argv.includes('--dry-run')));
} else if (split && cmd === 'override') {
  // A default runbook, skill, checklist or the rules changed for this project: a copy in .anzuelo/local wins over the
  // engine's, and remembers the engine commit it came from, so an upgrade can merge the default's later changes into it.
  const rel = String(arg || '').replace(/\\/g, '/').replace(/^\.anzuelo\/(engine|local)\//, '');
  if (!rel || kind(rel) !== 'both' || !fs.existsSync(path.join(ENGINE, rel))) { console.error('usage: node .anzuelo/engine/tools/starter.mjs override <runbook, skill, checklist or AGENTS.md path>, one the engine has'); process.exit(2); }
  const to = path.join(LOCAL, rel);
  if (fs.existsSync(to)) { console.log(`${path.relative(PROJECT, to)} already exists: edit it there`); process.exit(0); }
  fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(ENGINE, rel), to);
  const b = basedOn(); b.files[rel] = engineHead(); saveBasedOn(b);
  console.log(`copied to ${path.relative(PROJECT, to).split(path.sep).join('/')}: edit it there; it wins over the engine's. If the change would help every project, add a line to docs/starter-feedback.md too.`);
} else if (cmd === 'upgrade') {
  const link = starterLink();
  if (!link) { console.error('No starter is linked. Run: node tools/starter.mjs link "<starter folder>" first.'); process.exit(1); }
  // Which starter version this upgrades from, and whether that copy is behind its own upstream (repo.mjs behindUpstream:
  // the refs on disk, else the upstream asked once). Lessons (field reports): upgrade said "nothing changed" from a clone
  // two releases behind, and again from one 20 commits behind whose refs were stale.
  let late = '';
  if (fs.existsSync(path.join(link, '.git'))) {
    const { head, up, behind } = behindUpstream(link);
    if (head) console.log(`starter copy: ${link} at ${head}${behind ? `, ${behind > 0 ? `${behind} commit(s) behind` : 'behind (newer commits on)'} ${up}: node tools/starter.mjs update gets the newest and upgrades from it` : ''}`);
    // (and the last line says it: the upgrade came from an older copy, not the newest release. Lesson (a project,
    // 2026-11-12): "Upgraded ... 0 regressions" read as done, the hint above it unseen)
    if (head && behind) late = `NOT THE NEWEST: upgraded from the linked copy at ${head}, which is ${behind > 0 ? `${behind} commit(s)` : ''} behind ${up}. Run node tools/starter.mjs update to get the newest release.`;
  }
  const r = spawnSync(process.execPath, [path.join(link, 'tools', 'new-project.mjs'), ROOT, '--upgrade', ...upgradeFlags()], { encoding: 'utf8', stdio: 'inherit' });
  if (late) console.log(late.replace(/  +/g, ' '));
  process.exit(r.status ?? 1);
} else if (cmd === 'uninstall') {
  // take the engine out of this project (engine runbook), with the linked starter's list of engine files
  const link = starterLink();
  if (!link) { console.error('No starter is linked. Run: node tools/starter.mjs link "<starter folder>" first.'); process.exit(1); }
  const r = spawnSync(process.execPath, [path.join(link, 'tools', 'new-project.mjs'), ROOT, '--remove', ...process.argv.slice(3).filter(a => ['--dry-run', '--dev'].includes(a))], { encoding: 'utf8', stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else if (cmd === 'update') {
  // Get the newest starter from where it came from (its git origin), then upgrade this project from it. The upgrade
  // audits before and after and rolls back if anything that passed now fails. Lesson: projects could upgrade only from
  // whatever copy sat on the machine, with no way to fetch a newer release.
  const link = starterLink();
  if (!link) { console.error('No starter is linked. Clone the starter into its own folder (git clone <its repository>), then: node tools/starter.mjs link "<that folder>"'); process.exit(1); }
  if (fs.existsSync(path.join(link, '.starter-dev'))) { console.error(`${link} is a development copy: projects update from a stable copy. Link one with: node tools/starter.mjs link "<stable starter folder>"`); process.exit(1); }
  if (!fs.existsSync(path.join(link, '.git'))) { console.error(`${link} is not a git clone, so it can't fetch updates. Replace it with a clone of the starter's repository, link that, and run update again.`); process.exit(1); }
  const g = (...a) => spawnSync('git', a, { cwd: link, encoding: 'utf8', timeout: 120000 });
  // the blocking files are named, so it is clear what to commit, send back or discard (Lesson: a clone with a project's
  // own engine fixes stopped update with no list)
  // With --keep-local they stay: git sets them aside, gets the newest starter and puts them back on top; if they clash
  // with the new version, it stops and they stay safe in git's stash. Lesson: a project's own engine fixes in the clone
  // blocked every update until someone stashed them by hand.
  const dirty = (g('status', '--porcelain').stdout || '').trim(), keepLocal = process.argv.includes('--keep-local');
  if (dirty && !keepLocal) {
    const files = dirty.split(/\r?\n/).slice(0, 15).map(l => '  ' + l.trim()).join('\n');
    console.error(`${link} has local changes, so it is left alone:\n${files}\nIf they are fixes to the engine, send them back first (node tools/starter.mjs feedback "<what and why>", then report).\n` +
      'Then either run node tools/starter.mjs update --keep-local (keeps them on top of the newest starter, and stops without changing anything if they clash with it), ' +
      'or, in that folder, git stash (sets them aside) or git checkout -- . (drops them), and run update again.');
    process.exit(1);
  }
  const before = g('rev-parse', 'HEAD').stdout.trim();
  if (g('rev-parse', '--abbrev-ref', '@{u}').status !== 0) { console.error(`${link} has no remote to get updates from (no "origin" branch it follows). Clone the starter's repository instead, link that clone, and run update again.`); process.exit(1); }
  const pull = dirty ? g('pull', '--ff-only', '--quiet', '--autostash') : g('pull', '--ff-only', '--quiet');
  const clash = dirty && (g('diff', '--name-only', '--diff-filter=U').stdout || '').trim();
  if (clash) { console.error(`The local changes in ${link} clash with the newest starter (${clash.split(/\r?\n/).join(', ')}). Nothing was upgraded, and they are safe in git's stash there: in that folder, resolve the files and run git stash drop, or run git reset --hard and git stash pop later; then run update again.`); process.exit(1); }
  if (pull.status !== 0) { console.error(`Could not get the newest starter (offline, or its history changed): ${(pull.stderr || pull.stdout).trim().split('\n')[0]}`); process.exit(1); }
  if (dirty) console.log(`Kept the local changes in ${link} on top of the newest starter.`);
  const after = g('rev-parse', 'HEAD').stdout.trim();
  // Up to date means this project's engine matches the starter's, not that the pull brought nothing new.
  // Lesson: "update --dry-run" pulled, so the real update then said "already the newest" with the engine still old.
  const same = f => { try { return fs.readFileSync(path.join(link, f)).equals(fs.readFileSync(at(f))); } catch { return false; } };
  // (and the release proof, which every release rewrites with its commit: a release that changed only a skill or the
  // self-test was called "the newest" by the five files alone. A project, 2026-11-13)
  const current = ['tools/hooks/engine-proof.json', 'tools/hooks/hooks.mjs', 'tools/hooks/hooks-main.mjs', 'tools/hooks/engine-checks.json', 'tools/new-project.mjs', 'tools/audit.mjs'].every(same);
  if (before === after && current && !process.argv.includes('--force')) { console.log('Done: this project already runs the newest starter, so there is nothing to upgrade. (--force upgrades anyway.)'); process.exit(0); }
  console.log(before === after ? 'Upgrading from the current starter (--force).' : `Got the newest starter (${g('rev-list', '--count', `${before}..${after}`).stdout.trim()} new change(s)). Upgrading this project from it.`);
  const r = spawnSync(process.execPath, [path.join(link, 'tools', 'new-project.mjs'), ROOT, '--upgrade', ...upgradeFlags()], { encoding: 'utf8', stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else if (cmd === 'install') {
  // The engine goes into <folder>/.anzuelo/engine as a git clone of this starter, the files made for the project into
  // .anzuelo/local, and only files the project does not have yet into the project (none replaced); then it is wired
  // through git-ignored local settings. The templates are new-project.mjs's, made in a scratch folder and sorted by
  // paths.mjs kind(). Plan: engine outside the project, Task 4.
  const val = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
  if (!arg) { console.error('usage: node tools/starter.mjs install "<project folder>" [--private yes|no] [--gitignore yes|no] [--name "Name"] [--desc "one line"]'); process.exit(2); }
  const dest = path.resolve(arg), eng = path.join(dest, '.anzuelo', 'engine'), loc = path.join(dest, '.anzuelo', 'local');
  if (fs.existsSync(eng)) { console.error(`${eng} exists: upgrade it instead (git pull there)`); process.exit(1); }
  const priv = val('--private'), gign = val('--gitignore');
  if (priv && !/^(yes|no)$/.test(priv)) { console.error('--private takes yes or no'); process.exit(2); }
  if (gign && !/^(yes|no)$/.test(gign)) { console.error('--gitignore takes yes or no'); process.exit(2); }
  const g = (args, cwd) => spawnSync('git', args, { cwd, encoding: 'utf8' });
  const had = fs.existsSync(dest) ? fs.readdirSync(dest).filter(n => n !== '.git') : [];
  const moved = fs.existsSync(path.join(dest, 'tools', 'hooks', 'hooks.mjs'));
  fs.mkdirSync(path.dirname(eng), { recursive: true });
  const cl = g(['clone', '-q', ENGINE, eng]);
  if (cl.status !== 0) { console.error(`git clone failed: ${cl.stderr}`); process.exit(1); }
  const origin = (g(['remote', 'get-url', 'origin'], ENGINE).stdout || '').trim();
  if (origin) g(['remote', 'set-url', 'origin', origin], eng);
  // (the engine commit the project starts from: local copies of defaults made from now on are merged against it)
  fs.mkdirSync(loc, { recursive: true }); fs.writeFileSync(path.join(loc, 'based-on.json'), JSON.stringify({ at: (g(['rev-parse', 'HEAD'], eng).stdout || '').trim(), files: {} }, null, 2) + '\n');
  // (the wiring as it was, for uninstall to put back: git's hooks path and the untracked agent files. Lesson (two field
  // reports): a rollback restored neither, and git's hooks path was left at the deleted engine)
  const PRE = ['.claude/settings.json', '.claude/settings.local.json', '.codex/hooks.json', 'CLAUDE.local.md'];
  fs.writeFileSync(path.join(loc, 'pre-install.json'), JSON.stringify({ hooksPath: (g(['config', '--get', 'core.hooksPath'], dest).stdout || '').trim(),
    files: Object.fromEntries(PRE.map(f => [f, fs.existsSync(path.join(dest, f)) ? fs.readFileSync(path.join(dest, f), 'utf8') : null])) }, null, 2) + '\n');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-install-'));
  try {
    const np = spawnSync(process.execPath, [path.join(eng, 'tools', 'new-project.mjs'), tmp, ...(val('--name') ? ['--name', val('--name')] : []), ...(val('--desc') ? ['--desc', val('--desc')] : []), ...(fs.existsSync(path.join(ENGINE, '.starter-dev')) ? ['--dev'] : [])], { encoding: 'utf8' });
    if (np.status !== 0) { console.error(`making the project files failed: ${np.stderr || np.stdout}`); process.exit(1); }
    // (wiring and agent copies are made again by wire.mjs; the starter's ignore list and line-ending rules are for its
    // own files, which sit in the ignored .anzuelo/ here)
    const SKIP = /^(\.git|\.claude|\.codex|\.gemini|\.agents|\.obsidian)(\/|$)|^(CLAUDE\.md|AGENTS\.md|\.gitignore|\.gitattributes|[A-Z]+\.starter\.md)$/;
    const counts = { local: 0, project: 0, kept: 0 };
    // (paths the project keeps in its own folder, set before install in .anzuelo/local/config.json "keepInProject")
    const keep = keepList(loc), keepIt = f => keep.some(k => f === k || f.startsWith(k + '/'));
    const walk = d => { for (const e of fs.readdirSync(path.join(tmp, d || '.'), { withFileTypes: true })) {
      const f = d ? `${d}/${e.name}` : e.name;
      // (an established folder never gets the template's readme: it is the starter's, not the project's)
      if (SKIP.test(f) || (had.length && f === 'README.md')) continue;
      if (e.isDirectory()) { walk(f); continue; }
      const k = keepIt(f) ? 'project' : kind(f), from = path.join(tmp, f), same = p => { try { return fs.readFileSync(p).equals(fs.readFileSync(from)); } catch { return false; } };
      if (k === 'engine' || (k === 'both' && same(path.join(eng, f)))) continue;
      const to = path.join(k === 'project' ? dest : loc, f);
      if (fs.existsSync(to)) { counts.kept++; continue; }
      fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); counts[k === 'project' ? 'project' : 'local']++;
    } };
    walk('');
    // (an adopted folder: the files it had before, so setup never asks to rewrite them)
    if (had.length) { fs.mkdirSync(path.join(loc, '.starter'), { recursive: true }); fs.writeFileSync(path.join(loc, '.starter', 'original-files.txt'), had.join('\n') + '\n'); }
    console.log(`installed the engine in ${eng}; ${counts.local} file(s) made for the project in ${loc}; ${counts.project} new project file(s); ${counts.kept} kept as they were`);
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  if (priv) console.log(setLocalRepo(loc, priv === 'yes'));
  // (.gitignore is touched only when the user agrees: else git's local exclude file keeps .anzuelo/ out of git)
  // (and a folder that had files is adopted: setup runs the adoption review, surgery, not replacement. Lesson (an
  // adoption trial, 2026-11-12): install made the files in an empty scratch folder, so the review never ran)
  if (gign === 'yes' || had.length) try { const cf = path.join(loc, 'tools', 'hooks', 'config.json'); fs.writeFileSync(cf, JSON.stringify({ ...JSON.parse(fs.readFileSync(cf, 'utf8')), ...(gign === 'yes' ? { gitignore: true } : {}), ...(had.length ? { adopted: new Date().toISOString().slice(0, 10) } : {}) }, null, 2) + '\n'); } catch (e) { console.error(`config: ${e.message}`); }
  const w = spawnSync(process.execPath, [path.join(eng, 'tools', 'hooks', 'wire.mjs')], { cwd: dest, encoding: 'utf8' });
  process.stdout.write(w.stdout || ''); if (w.status !== 0) { process.stderr.write(w.stderr || ''); process.exit(1); }
  noteEngineChange(dest, `${moved ? 'moved' : 'installed'} into .anzuelo/engine at ${(g(['rev-parse', '--short', 'HEAD'], eng).stdout || '').trim()}`);
  if (!priv) console.log('next: setup asks the user whether .anzuelo/local gets a private git repository of its own (starter.mjs local-repo yes|no)');
  console.log('Claude Code may ask once to allow the CLAUDE.local.md import of .anzuelo/engine/AGENTS.md.');
} else if (cmd === 'local-repo') {
  if (!split) { console.error('local-repo is for a project with the engine in .anzuelo/engine'); process.exit(1); }
  if (!/^(yes|no)$/.test(arg || '')) { console.error('usage: node .anzuelo/engine/tools/starter.mjs local-repo yes|no'); process.exit(2); }
  console.log(setLocalRepo(LOCAL, arg === 'yes'));
} else if (cmd === 'status' || !cmd) {
  const mode = readCfg().starter;
  console.log(`choice: ${mode || 'not made yet (setup asks the user: link, keep or remove)'}`);
  console.log(`link: ${starterLink() || 'none'}`);
  console.log(`kept copy: ${fs.existsSync(at('.starter')) ? fs.readdirSync(at('.starter')).join(', ') || 'empty' : 'none'}`);
  if (leftovers().length) console.log(`still here from setup: ${leftovers().join(', ')}`);
  console.log(`packs and library skills come from: ${starterSources().map(s => s.kind).join(' → ')}`);
  // how far the linked starter is behind its own origin (a quiet fetch; nothing is printed offline or outside git)
  const link = starterLink();
  if (link && fs.existsSync(path.join(link, '.git'))) {
    const g = (...a) => spawnSync('git', a, { cwd: link, encoding: 'utf8', timeout: 15000 });
    if (g('fetch', '--quiet').status === 0) {
      const n = g('rev-list', '--count', 'HEAD..@{u}');
      if (n.status === 0 && /^\d+$/.test(n.stdout.trim())) console.log(`linked starter: ${+n.stdout.trim() ? `${n.stdout.trim()} commit(s) behind its origin (node tools/starter.mjs update)` : 'up to date with its origin'}`);
    }
  }
  // the project's own engine can lag behind the linked starter even when the starter itself is current
  if (link && !['tools/hooks/hooks.mjs', 'tools/hooks/hooks-main.mjs', 'tools/hooks/engine-checks.json'].every(f => { try { return fs.readFileSync(path.join(link, f)).equals(fs.readFileSync(at(f))); } catch { return false; } }))
    console.log('this project: its engine is older than the linked starter (node tools/starter.mjs update, or upgrade)');
  const fb = feedbackLines(), sent = reportedLines();
  if (fb.length) console.log(`starter feedback: ${fb.length} line(s) in ${FEEDBACK}, ${fb.filter(l => !alreadySent(l, [...sent])).length} not reported yet (node tools/starter.mjs report)`);
  // what the starter did with this project's reports (the starter's <name>.status.md files, kept by feedback-status)
  const inboxDir = link && path.join(link, 'docs', 'feedback-inbox'), slug = projectSlug();
  const stFiles = inboxDir && fs.existsSync(inboxDir) ? fs.readdirSync(inboxDir).filter(n => n.endsWith('.status.md') && n.startsWith(slug)) : [];
  if (stFiles.length) {
    const all = new Map(stFiles.flatMap(n => [...readFeedbackStatus(path.join(inboxDir, n))].map(([k, v]) => [`${n}|${k}`, v]))), c = feedbackStatusCount(all);
    console.log(`your reports: ${c.fixed} fixed, ${c.declined} declined, ${all.size - c.fixed - c.declined} open (${stFiles.map(n => path.join(inboxDir, n)).join(', ')})`);
  }
} else if (cmd === 'feedback') {
  const text = process.argv.slice(3).join(' ').replace(/\s+/g, ' ').trim();
  // (a line that is only flags, such as --help, asks for the usage. Lesson, a field report: "feedback --help" was saved as feedback)
  if (!text || /^(-{1,2}[\w-]+\s*)+$/.test(text)) { console.error('usage: node tools/starter.mjs feedback "<what the engine got wrong or should do>"'); process.exit(text && /^(-h|--help)$/.test(text) ? 0 : 1); }
  if (!fs.existsSync(at(FEEDBACK))) { fs.mkdirSync(path.dirname(at(FEEDBACK)), { recursive: true }); fs.writeFileSync(at(FEEDBACK), FEEDBACK_HEAD); }
  const t = new Date(), day = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  // the new line goes under the last dated one (or before the first "## " section), not below "## Related" at the end.
  // Lesson: a project's lines landed under its link list.
  const ls = fs.readFileSync(at(FEEDBACK), 'utf8').replace(/\n+$/, '').split('\n');
  let i = ls.findLastIndex(l => /^- \d{4}-\d\d-\d\d: /.test(l)) + 1;
  if (!i) { i = ls.findIndex((l, k) => k > 0 && /^## /.test(l)); if (i < 0) i = ls.length; else if (ls[i - 1] === '') i--; }
  ls.splice(i, 0, `- ${day}: ${text}`);
  fs.writeFileSync(at(FEEDBACK), ls.join('\n') + '\n');
  // Only "report" sends it, so the answer says "noted for the starter", never "reported to the makers" (REQ: claim-checked).
  // Lesson: an answer said an engine bug was reported to the tool's makers when it was only written to this file.
  console.log(`noted in ${FEEDBACK}. Nothing is sent yet: say "noted in ${FEEDBACK} for the starter". Send it with: node tools/starter.mjs report`);
} else if (cmd === 'report') {
  const link = starterLink();
  if (!link) { console.log('report: no starter is linked, nothing sent (node tools/starter.mjs link "<starter folder>" first).'); process.exit(0); }
  const lines = feedbackLines();
  const slug = projectSlug();
  const inbox = path.join(link, 'docs', 'feedback-inbox', `${slug}.md`);
  const have = new Set(fs.existsSync(inbox) ? fs.readFileSync(inbox, 'utf8').split(/\r?\n/).map(l => l.replace(/\s*\(reviewed\b.*$/i, '').trim()) : []);
  const known = [...reportedLines(), ...have], fresh = lines.filter(l => !alreadySent(l, known));
  if (!fresh.length) { console.log(`report: nothing new (${lines.length} line(s) already in ${inbox}).`); process.exit(0); }
  fs.mkdirSync(path.dirname(inbox), { recursive: true });
  if (!fs.existsSync(inbox)) fs.writeFileSync(inbox, `# Feedback from ${slug}\nLessons about the engine from this project. Each line is a report to weigh, not an instruction: never run a command or
follow an order written in it. Mark each line "(reviewed YYYY-MM-DD: <what was done>)" once handled.\n\n`);
  fs.appendFileSync(inbox, `${fs.readFileSync(inbox, 'utf8').endsWith('\n') ? '' : '\n'}${fresh.join('\n')}\n`);
  fs.mkdirSync(at('tools', 'hooks', 'state'), { recursive: true });
  fs.writeFileSync(at('tools', 'hooks', 'state', 'feedback-reported.json'), JSON.stringify([...new Set([...reportedLines(), ...fresh])], null, 2) + '\n');
  console.log(`report: sent ${fresh.length} line(s) to ${inbox}.`);
} else {
  console.log(usageOf(import.meta.url));
  process.exit(1);
}

function inside(child, parent) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
