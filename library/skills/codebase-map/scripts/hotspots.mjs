#!/usr/bin/env node
// Finds the hot spots in a git repo: files that change most, that get fixed most, that change together, and that are
// both big and busy.
//   node skills/codebase-map/scripts/hotspots.mjs [repo folder] [--since "1 year ago"] [--top N] [--json]
// Read-only: runs git log and reads file sizes. Commits touching more than 50 files (mass renames, formatting,
// vendoring) are left out of the co-change count.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const take = f => { const i = args.indexOf(f); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const since = take('--since') || '1 year ago';
const topN = Number(take('--top') || 20);
const asJson = args.includes('--json');
const root = path.resolve(args.filter(a => a !== '--json')[0] || '.');

const log = spawnSync('git', ['log', `--since=${since}`, '--no-merges', '--name-only', '--format=%x00%s'], { cwd: root, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
if (log.status !== 0) { console.error(`not a git repo, or git failed: ${(log.stderr || '').trim()}`); process.exit(2); }

const SKIP = /(^|\/)(node_modules|vendor|dist|build|third_party)\/|(\.lock|-lock\.json|\.min\.js|\.snap)$/;
const churn = new Map(), fixes = new Map(), pairs = new Map();
let commits = 0;
for (const block of log.stdout.split('\0').slice(1)) {
  const [subject, ...rest] = block.split('\n');
  const changed = [...new Set(rest.map(s => s.trim()).filter(f => f && !SKIP.test(f)))];
  if (!changed.length) continue;
  commits++;
  const isFix = /\b(fix|fixes|fixed|bug|hotfix|regression|revert)\b/i.test(subject);
  for (const f of changed) { churn.set(f, (churn.get(f) || 0) + 1); if (isFix) fixes.set(f, (fixes.get(f) || 0) + 1); }
  if (changed.length <= 50) for (let i = 0; i < changed.length; i++) for (let j = i + 1; j < changed.length; j++) {
    const k = [changed[i], changed[j]].sort().join('  +  ');
    pairs.set(k, (pairs.get(k) || 0) + 1);
  }
}

const lines = f => { try { const s = fs.readFileSync(path.join(root, f), 'utf8'); return s.split('\n').length; } catch { return 0; } };
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
const existing = [...churn.keys()].filter(f => fs.existsSync(path.join(root, f)));
const risk = new Map(existing.map(f => [f, Math.round(churn.get(f) * Math.log2(2 + lines(f)))]));

const result = {
  root, since, commits,
  mostChanged: top(churn, topN).map(([file, changes]) => ({ file, changes })),
  mostFixed: top(fixes, topN).map(([file, fixCommits]) => ({ file, fixCommits })),
  changedTogether: top(new Map([...pairs].filter(([, n]) => n >= 3)), topN).map(([pair, times]) => ({ pair, times })),
  bigAndBusy: top(risk, topN).map(([file, score]) => ({ file, score, changes: churn.get(file), lines: lines(file) })),
};
if (asJson) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }
console.log(`Hot spots in ${root} since ${since}: ${commits} commits\n`);
const show = (title, rows, fmt) => { console.log(title); if (!rows.length) console.log('  (none)'); for (const r of rows) console.log('  ' + fmt(r)); console.log(''); };
show('Most changed files:', result.mostChanged, r => `${String(r.changes).padStart(4)}  ${r.file}`);
show('Most fixed files (commit subject mentions a fix or bug):', result.mostFixed, r => `${String(r.fixCommits).padStart(4)}  ${r.file}`);
show('Files that change together (3+ times; hidden coupling when they are in different modules):', result.changedTogether, r => `${String(r.times).padStart(4)}  ${r.pair}`);
show('Big and busy (changes x log of size; start reviews and tests here):', result.bigAndBusy, r => `${String(r.score).padStart(5)}  ${r.file}  (${r.changes} changes, ${r.lines} lines)`);
