#!/usr/bin/env node
// Read-only helper for the orchestrate skill. Zero dependencies. It never writes files and never contacts anything.
//   node skills/orchestrate/scripts/ledger.mjs check <ledger.md> [--stale-minutes 30]   what needs the coordinator's attention this round
//   node skills/orchestrate/scripts/ledger.mjs fingerprint <output.txt> [--lines 20]   a short hash of the last lines of a worker's captured output
// check exits 1 when something needs action, 0 when nothing does, 2 on a usage or read error.
// The ledger format is the template in ../references.md (a markdown table with at least Task and State columns).
import fs from 'node:fs';
import crypto from 'node:crypto';

const [cmd, file, ...rest] = process.argv.slice(2);
const opt = (name, def) => { const i = rest.indexOf(name); const v = i >= 0 ? Number(rest[i + 1]) : NaN; return Number.isFinite(v) && v > 0 ? v : def; };
const fail = msg => { console.error(msg); process.exit(2); };
const readText = f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { fail(`cannot read ${f}: ${e.message}`); } };
const list = s => s.split(/[,;]/).map(x => x.trim().toLowerCase()).filter(x => x && x !== '-');
const ACTIVE = ['running', 'waiting-approval', 'stuck', 'exited', 'stalled', 'needs-answer'];
const KNOWN = ['waiting', ...ACTIVE, 'ready-to-check', 'accepted', 'escalated', 'released'];

if (cmd === 'fingerprint' && file) {
  // Compare this value between rounds: the same value while the worker's process is alive means no new output.
  // Strip terminal color codes and trailing spaces first, so redraws without new content don't change the value.
  const lines = readText(file).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r/g, '').split('\n')
    .map(l => l.trimEnd()).filter(l => l.trim());
  const tail = lines.slice(-opt('--lines', 20)).join('\n');
  console.log(crypto.createHash('sha256').update(tail).digest('hex').slice(0, 16));
} else if (cmd === 'check' && file) {
  check(readText(file), opt('--stale-minutes', 30));
} else {
  console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 6).join('\n'));
  process.exit(2);
}

function parseTable(text) {
  // The first table whose header has Task and State columns. Cells are split on unescaped pipes.
  const rows = text.split(/\r?\n/).filter(l => l.trim().startsWith('|'));
  const split = l => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim());
  for (let i = 0; i < rows.length - 1; i++) {
    const head = split(rows[i]).map(h => h.toLowerCase());
    if (!head.some(h => h.startsWith('task')) || !head.some(h => h === 'state')) continue;
    const col = start => head.findIndex(h => h.startsWith(start));
    const idx = { task: col('task'), owner: col('owner'), resume: col('resume'), resource: col('shared'), steps: col('required'),
      reported: col('steps reported'), state: col('state'), nudges: col('nudges'), seen: col('last seen'), evidence: col('evidence') };
    const out = [];
    for (let j = i + 2; j < rows.length && !/^\s*$/.test(rows[j]); j++) {
      const c = split(rows[j]);
      if (/^-+$/.test(c[0] || '')) continue;
      const get = k => (idx[k] >= 0 ? c[idx[k]] || '' : '');
      out.push({ line: j, task: get('task'), owner: get('owner'), resume: get('resume'), resource: get('resource'), steps: get('steps'),
        reported: get('reported'), state: get('state').toLowerCase(), nudges: Number(get('nudges')) || 0, seen: get('seen'), evidence: get('evidence'), has: idx });
    }
    return out;
  }
  return null;
}

function seenAt(s) {
  // Accepts "YYYY-MM-DD HH:MM" or "HH:MM" (today). Anything else is unknown.
  const full = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})/.exec(s);
  if (full) return new Date(`${full[1]}T${full[2].padStart(5, '0')}:00`);
  const hm = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (hm) { const d = new Date(); d.setHours(+hm[1], +hm[2], 0, 0); if (d > new Date()) d.setDate(d.getDate() - 1); return d; }
  return null;
}

function check(text, staleMin) {
  const rows = parseTable(text);
  if (!rows) fail('no ledger table found (needs a header row with Task and State columns)');
  const counts = {}; const todo = [];
  const say = (r, what) => todo.push(`  ${r.task || '(unnamed)'}: ${what}`);
  const workspaces = {}; const resources = {};
  for (const r of rows) {
    counts[r.state || '(empty)'] = (counts[r.state || '(empty)'] || 0) + 1;
    const active = ACTIVE.includes(r.state);
    if (!KNOWN.includes(r.state)) say(r, `unknown state "${r.state || ''}": use one of ${KNOWN.join(', ')} (references.md, States)`);
    if (r.state === 'ready-to-check') say(r, 'finish signal received: run the acceptance gate');
    if (r.state === 'needs-answer') say(r, 'waiting for an answer from the coordinator or the user');
    if (r.state === 'waiting-approval') say(r, 'waiting at an approval prompt: approve only if routine and inside its workspace');
    if (r.state === 'exited') say(r, r.resume ? `process gone: resume it with ${r.resume}` : 'process gone and no resume handle recorded');
    if (r.state === 'stuck' || r.state === 'stalled') say(r, `${r.state}: re-brief (nudges so far: ${r.nudges})`);
    if (active && r.nudges >= 3) say(r, `${r.nudges} nudges without progress: mark escalated and tell the user`);
    if (active && !r.owner.replace(/-/g, '').trim()) say(r, 'active but no owner or workspace recorded');
    if (r.state === 'accepted') {
      const missing = list(r.steps).filter(s => !list(r.reported).includes(s));
      if (missing.length) say(r, `accepted but steps never reported: ${missing.join(', ')}`);
      if (r.has.evidence >= 0 && !r.evidence.replace(/-/g, '').trim()) say(r, 'accepted with no evidence written down');
    }
    if (active && r.has.seen >= 0) {
      const t = seenAt(r.seen);
      if (!t) say(r, 'no readable "last seen" time (use YYYY-MM-DD HH:MM)');
      else if ((Date.now() - t) / 60000 > staleMin) say(r, `last seen ${Math.round((Date.now() - t) / 60000)} min ago: check the worker is really there (ledger may be stale)`);
    }
    if (active) {
      const ws = (r.owner.split(',')[1] || '').trim().toLowerCase();
      if (ws) (workspaces[ws] ||= []).push(r.task);
      for (const res of list(r.resource)) (resources[res] ||= []).push(r.task);
    }
  }
  for (const [ws, tasks] of Object.entries(workspaces)) if (tasks.length > 1) todo.push(`  workspace ${ws} is used by ${tasks.length} active tasks: ${tasks.join(', ')}`);
  for (const [res, tasks] of Object.entries(resources)) if (tasks.length > 1) todo.push(`  shared resource ${res} has ${tasks.length} active tasks (must run one at a time): ${tasks.join(', ')}`);
  console.log('States: ' + Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', '));
  const active = rows.filter(r => ACTIVE.includes(r.state)).length, waiting = rows.filter(r => r.state === 'ready-to-check').length;
  console.log(`Active: ${active}${waiting ? `, waiting for the acceptance gate: ${waiting}` : ''}. ${active || waiting ? 'Schedule the next round.' : 'No active task: stop scheduling rounds.'}`);
  if (todo.length) { console.log('Needs action:'); console.log(todo.join('\n')); }
  console.log(todo.length ? `LEDGER: ${todo.length} item(s) need action` : 'LEDGER: nothing needs action');
  process.exit(todo.length ? 1 : 0);
}
