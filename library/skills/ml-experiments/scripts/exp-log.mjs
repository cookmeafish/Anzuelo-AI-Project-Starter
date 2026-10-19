#!/usr/bin/env node
// Experiment log: one Markdown table row per training or evaluation run, and the best run picked from it. Zero dependencies.
//   node exp-log.mjs add <log.md> --name <run> --data <file|folder>... --params "<k=v, ...>" --seed <n> --score "<metric>=<value>[+-<spread>]" [--notes "<text>"]
//   node exp-log.mjs best <log.md> --metric <name> [--lower]   (--lower when smaller is better, such as rmse or loss)
// "add" fills in the date, a short sha256 of the data (all files under a folder, in name order) and the git commit
// (read with git rev-parse; "+dirty" when tracked files have uncommitted changes). It creates the log with its header.
// "best" reads every row, picks the best value of the metric and shows the runner-up and the baseline row (name
// starting with "baseline") next to it. Ends with RESULT: PASS, or RESULT: FAIL <why> when nothing can be compared.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

const [cmd, log, ...rest] = process.argv.slice(2);
const opt = k => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
const opts = k => { const out = []; rest.forEach((a, i) => { if (a === k) for (let j = i + 1; j < rest.length && !rest[j].startsWith('--'); j++) out.push(rest[j]); }); return out; };
const fail = why => { console.log(`RESULT: FAIL ${why}`); process.exit(1); };
const HEADER = '| date | name | data | commit | params | seed | score | notes |\n|---|---|---|---|---|---|---|---|\n';
const cell = s => String(s ?? '').replace(/\|/g, '/').replace(/\r?\n/g, ' ').trim();

if (cmd === 'add' && log) {
  const name = opt('--name'), seed = opt('--seed'), score = opt('--score'), data = opts('--data');
  if (!name || !score || seed == null || !data.length) fail('add needs --name, --data, --seed and --score');
  const hash = crypto.createHash('sha256');
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  for (const d of data) {
    if (!fs.existsSync(d)) fail(`data not found: ${d}`);
    for (const f of fs.statSync(d).isDirectory() ? walk(d) : [d]) { hash.update(f.replace(/\\/g, '/')); hash.update(fs.readFileSync(f)); }
  }
  const git = a => { const r = spawnSync('git', a, { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : ''; };
  const head = git(['rev-parse', '--short', 'HEAD']);
  const commit = head ? head + (git(['status', '--porcelain', '--untracked-files=no']) ? '+dirty' : '') : 'no git';
  const row = [new Date().toISOString().slice(0, 10), name, `${data.join(' ')} sha256:${hash.digest('hex').slice(0, 12)}`,
    commit, opt('--params') || '', seed, score, opt('--notes') || ''].map(cell);
  if (!fs.existsSync(log)) { fs.mkdirSync(path.dirname(path.resolve(log)), { recursive: true }); fs.writeFileSync(log, '# Experiment log\n\n' + HEADER); }
  const before = fs.readFileSync(log, 'utf8');
  fs.appendFileSync(log, (before.endsWith('\n') ? '' : '\n') + `| ${row.join(' | ')} |\n`);
  console.log(`logged: ${row.join(' | ')}`);
  if (commit.endsWith('+dirty') || commit === 'no git') console.log('note: the code version is not a clean commit; commit before runs you want to repeat');
  console.log('RESULT: PASS');
} else if (cmd === 'best' && log) {
  const metric = opt('--metric'), lower = rest.includes('--lower');
  if (!metric) fail('best needs --metric <name>');
  if (!fs.existsSync(log)) fail(`no log at ${log}`);
  const lines = fs.readFileSync(log, 'utf8').split(/\r?\n/).filter(l => /^\|/.test(l));
  const head = (lines[0] || '').split('|').map(s => s.trim().toLowerCase());
  const iName = head.indexOf('name'), iScore = head.indexOf('score'), iDate = head.indexOf('date');
  if (iName < 0 || iScore < 0) fail('the log table needs "name" and "score" columns');
  const esc = metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s,;])${esc}\\s*[=:]\\s*(-?\\d+(?:\\.\\d+)?)(?:\\s*(?:\\+-|±|\\+/-)\\s*(\\d+(?:\\.\\d+)?))?`, 'i');
  const runs = lines.slice(2).map(l => l.split('|').map(s => s.trim())).map(c => {
    const m = re.exec(c[iScore] || ''); return m ? { name: c[iName], value: +m[1], spread: m[2] != null ? +m[2] : null, date: c[iDate] || '' } : null;
  }).filter(Boolean);
  if (!runs.length) fail(`no row has a score for "${metric}"`);
  const sorted = [...runs].sort((a, b) => lower ? a.value - b.value : b.value - a.value);
  const [best, second] = sorted;
  const base = runs.find(r => /^baseline/i.test(r.name));
  const show = r => `${r.name} ${metric}=${r.value}${r.spread != null ? ` +-${r.spread}` : ''} (${r.date})`;
  console.log(`rows with ${metric}: ${runs.length}`);
  console.log(`best: ${show(best)}`);
  if (second) {
    const gap = Math.abs(best.value - second.value);
    console.log(`runner-up: ${show(second)}, gap ${+gap.toFixed(6)}`);
    const spread = Math.max(best.spread ?? 0, second.spread ?? 0);
    if (best.spread == null || second.spread == null) console.log('note: a spread is missing, so the gap cannot be judged against the noise');
    else if (gap <= spread) console.log('note: the gap is within the spread; treat the two as a tie');
  }
  console.log(base ? `baseline: ${show(base)}, gap ${+Math.abs(best.value - base.value).toFixed(6)}` : 'note: no baseline row (name starting with "baseline")');
  console.log('RESULT: PASS');
} else {
  console.error('usage: node exp-log.mjs add <log.md> --name <run> --data <path>... --params "<k=v>" --seed <n> --score "<metric>=<v>[+-<s>]"\n       node exp-log.mjs best <log.md> --metric <name> [--lower]');
  process.exit(2);
}
