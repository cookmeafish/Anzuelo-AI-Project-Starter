#!/usr/bin/env node
// Recurring work kept in docs/routines.md. Zero dependencies.
//   node routines.mjs list                       every routine with its next date and whether it is due
//   node routines.mjs due                        only the routines due today or earlier (exit 0 either way)
//   node routines.mjs done "<Routine>"           sets its Last run to today, then checks the file
//   node routines.mjs add "<Routine>" "<Every>" "<runbook path>"   adds a row (Last run: never), then checks the file
//   node routines.mjs check                      validates the file: RESULT: PASS or RESULT: FAIL <why>
// Options: --file <path> (default docs/routines.md), --today YYYY-MM-DD (default: today on this computer).
// Run it from the project root: runbook paths are checked relative to the current folder.
// The file format is fixed (the session hook reads the same table):
//   # Routines
//   | Routine | Every | Runbook | Last run |
//   |---|---|---|---|
//   | Weekly report | monday | docs/playbooks/weekly-report.md | never |
// Every: day, week, month, weekday (Mon to Fri), monday..sunday, "N days", "month day N" (N from 1 to 28).
// Last run: YYYY-MM-DD or never. A routine is due when its next date after Last run is today or earlier.
// Also usable as a module: import { dueRoutines } from './routines.mjs'.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const HEADER = '| Routine | Every | Runbook | Last run |';
const DIVIDER = '|---|---|---|---|';
const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const validIso = s => /^\d{4}-\d\d-\d\d$/.test(s) && iso(toDate(s)) === s;
const plusDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// Is this a known "Every" value? Returns a reason when it is not.
export function everyProblem(every) {
  const e = String(every || '').trim().toLowerCase();
  if (['day', 'week', 'month', 'weekday'].includes(e) || DAYS.includes(e)) return null;
  let m;
  if ((m = /^(\d+) days?$/.exec(e))) return Number(m[1]) >= 1 ? null : 'N days needs N of 1 or more';
  if ((m = /^month day (\d+)$/.exec(e))) return Number(m[1]) >= 1 && Number(m[1]) <= 28 ? null : 'month day N needs N from 1 to 28 (shorter months have no day 29 to 31)';
  return `unknown Every "${every}" (use day, week, month, weekday, monday..sunday, "N days" or "month day N")`;
}

// The next date after `last` (YYYY-MM-DD or never) on which the routine is due. Same rules as the session hook.
export function nextRun(every, last, today) {
  const t = toDate(today);
  if (/^never$/i.test(last)) return t;
  if (!validIso(last) || everyProblem(every)) return null;
  const e = every.trim().toLowerCase(), l0 = toDate(last);
  let m;
  if (e === 'day') return plusDays(l0, 1);
  if (e === 'week') return plusDays(l0, 7);
  if (e === 'month') return new Date(l0.getFullYear(), l0.getMonth() + 1, l0.getDate());
  if (e === 'weekday') { let n = plusDays(l0, 1); while ([0, 6].includes(n.getDay())) n = plusDays(n, 1); return n; }
  if (DAYS.includes(e)) { let n = plusDays(l0, 1); while (n.getDay() !== DAYS.indexOf(e)) n = plusDays(n, 1); return n; }
  if ((m = /^(\d+) days?$/.exec(e))) return plusDays(l0, Number(m[1]));
  m = /^month day (\d+)$/.exec(e);
  let n = new Date(l0.getFullYear(), l0.getMonth(), Number(m[1]));
  if (n <= l0) n = new Date(l0.getFullYear(), l0.getMonth() + 1, Number(m[1]));
  return n;
}

// Table rows of the file: { line, name, every, runbook, last } (header and divider left out).
export function parseRoutines(text) {
  const rows = [];
  String(text || '').split(/\r?\n/).forEach((l, i) => {
    if (!l.trim().startsWith('|')) return;
    const c = l.split('|').map(s => s.trim());
    if (c.length < 6 || /^:?-*:?$/.test(c[1]) || /^routine$/i.test(c[1])) return;
    rows.push({ line: i + 1, name: c[1], every: c[2], runbook: c[3].replace(/`/g, ''), last: c[4], cells: c.length - 2 });
  });
  return rows;
}

// The routines due on `today` (YYYY-MM-DD): their next date after Last run is today or earlier.
export function dueRoutines(text, today = iso(new Date())) {
  const t = toDate(today);
  return parseRoutines(text).filter(r => { const n = nextRun(r.every, r.last, today); return n && n <= t; })
    .map(r => ({ name: r.name, every: r.every, runbook: r.runbook, last: r.last, next: iso(nextRun(r.every, r.last, today)) }));
}

// Problems in the file; an empty list means it is valid. `root` is where runbook paths are looked up.
export function checkRoutines(text, root = process.cwd(), today = iso(new Date())) {
  const probs = [];
  const lines = String(text || '').split(/\r?\n/);
  if (!lines.some(l => l.trim() === '# Routines')) probs.push('no "# Routines" heading');
  const h = lines.findIndex(l => l.trim().replace(/\s+/g, ' ') === HEADER);
  if (h < 0) probs.push(`no header row "${HEADER}"`);
  else if ((lines[h + 1] || '').replace(/\s/g, '') !== DIVIDER) probs.push(`the line after the header must be "${DIVIDER}"`);
  const seen = new Set();
  for (const r of parseRoutines(text)) {
    const at = `line ${r.line} (${r.name || 'no name'})`;
    if (r.cells !== 4) probs.push(`${at}: needs exactly 4 cells, has ${r.cells}`);
    if (!r.name) probs.push(`${at}: no routine name`);
    if (seen.has(r.name.toLowerCase())) probs.push(`${at}: the name is used twice`);
    seen.add(r.name.toLowerCase());
    const ep = everyProblem(r.every);
    if (ep) probs.push(`${at}: ${ep}`);
    if (!r.runbook) probs.push(`${at}: no runbook path`);
    else if (!fs.existsSync(path.resolve(root, r.runbook))) probs.push(`${at}: runbook ${r.runbook} does not exist`);
    if (!/^never$/i.test(r.last) && !validIso(r.last)) probs.push(`${at}: Last run "${r.last}" is not a date (YYYY-MM-DD) or never`);
    else if (validIso(r.last) && r.last > today) probs.push(`${at}: Last run ${r.last} is in the future`);
  }
  return probs;
}

function main(argv) {
  const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const pos = argv.filter((a, i) => !a.startsWith('--') && !['--file', '--today'].includes(argv[i - 1]));
  const [cmd, ...rest] = pos;
  const file = opt('--file') || 'docs/routines.md';
  const today = opt('--today') || iso(new Date());
  if (!validIso(today)) { console.error(`--today must be YYYY-MM-DD, got ${today}`); return 1; }
  const read = () => fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const report = () => {
    const text = read();
    const probs = text === null ? [`${file} does not exist`] : checkRoutines(text, process.cwd(), today);
    for (const p of probs) console.log(`  - ${p}`);
    console.log(probs.length ? `RESULT: FAIL ${probs.length} problem(s) in ${file}` : `RESULT: PASS ${file} (${parseRoutines(text).length} routines)`);
    return probs.length ? 1 : 0;
  };

  if (cmd === 'check') return report();
  if (cmd === 'list' || cmd === 'due') {
    const text = read();
    if (text === null) { console.log(`No routines yet (${file} does not exist).`); return 0; }
    const rows = cmd === 'due' ? dueRoutines(text, today) : parseRoutines(text);
    if (!rows.length) { console.log(cmd === 'due' ? `No routines due on ${today}.` : `No routines in ${file}.`); return 0; }
    for (const r of rows) {
      const n = nextRun(r.every, r.last, today);
      const state = !n ? 'INVALID (run check)' : n <= toDate(today) ? 'DUE' : `next ${iso(n)}`;
      console.log(`${r.name} | every ${r.every} | last run ${r.last} | ${state} | ${r.runbook}`);
    }
    return 0;
  }
  if (cmd === 'done') {
    const name = (rest[0] || '').trim();
    const text = read();
    if (!name || text === null) { console.error(!name ? 'usage: routines.mjs done "<Routine>"' : `${file} does not exist`); return 1; }
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    const lines = text.split(/\r?\n/);
    const row = parseRoutines(text).find(r => r.name.toLowerCase() === name.toLowerCase());
    if (!row) { console.error(`no routine named "${name}" in ${file}. Names: ${parseRoutines(text).map(r => r.name).join(', ') || 'none'}`); return 1; }
    const c = lines[row.line - 1].split('|');
    c[4] = ` ${today} `;
    lines[row.line - 1] = c.join('|');
    fs.writeFileSync(file, lines.join(eol));
    console.log(`${row.name}: Last run set to ${today}.`);
    return report();
  }
  if (cmd === 'add') {
    const [name, every, runbook] = rest.map(s => String(s).trim());
    if (!name || !every || !runbook) { console.error('usage: routines.mjs add "<Routine>" "<Every>" "<runbook path>"'); return 1; }
    if (/\|/.test(name + every + runbook)) { console.error('a cell may not contain "|"'); return 1; }
    if (everyProblem(every)) { console.error(everyProblem(every)); return 1; }
    if (!fs.existsSync(runbook)) { console.error(`runbook ${runbook} does not exist: create it first (runbook-create skill)`); return 1; }
    let text = read();
    if (text === null) { fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true }); text = `# Routines\n${HEADER}\n${DIVIDER}\n`; }
    if (parseRoutines(text).some(r => r.name.toLowerCase() === name.toLowerCase())) { console.error(`"${name}" is already in ${file}`); return 1; }
    const eol = text.includes('\r\n') ? '\r\n' : '\n';
    fs.writeFileSync(file, text.replace(/(\r?\n)*$/, '') + eol + `| ${name} | ${every.toLowerCase()} | ${runbook} | never |` + eol);
    console.log(`Added "${name}" (every ${every.toLowerCase()}, ${runbook}).`);
    return report();
  }
  console.error('usage: node routines.mjs list|due|check|done "<Routine>"|add "<Routine>" "<Every>" "<runbook>" [--file F] [--today YYYY-MM-DD]');
  return 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode = main(process.argv.slice(2));
