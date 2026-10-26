#!/usr/bin/env node
// Collects the git evidence for "why does this code exist": the commit that introduced a file, line range or
// function, every later commit that shaped it, files that keep changing with it, who shaped it, and the intent words
// in the commit messages.
//   node skills/commit-archaeologist/scripts/dig.mjs <file> [--repo <folder>] [--lines A-B | --func <name>] [--json] [--out <file>] [--no-pickaxe]
// Read-only and offline: it only runs git log, git diff-tree, git blame and git show. Nothing is fetched or written,
// except the JSON file named by --out.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const opt = name => { const i = argv.indexOf(name); if (i < 0) return null; const v = argv[i + 1]; argv.splice(i, 2); return v ?? ''; };
const flag = name => { const i = argv.indexOf(name); if (i < 0) return false; argv.splice(i, 1); return true; };
const repoArg = opt('--repo') || '.';
const linesArg = opt('--lines');
const funcArg = opt('--func');
const outArg = opt('--out');
const asJson = flag('--json');
const noPickaxe = flag('--no-pickaxe');
const fileArg = argv[0];

const BULK = 50; // a commit touching more files than this is treated as mechanical (format, rename, vendoring)

function fail(msg) { console.error(`error: ${msg}`); process.exit(2); }
function git(cwd, args, { ok = false, timeout = 60_000 } = {}) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, timeout });
  if (r.error) fail(r.error.code === 'ENOENT' ? 'git is not installed or not on PATH' : `git failed: ${r.error.message}`);
  if (r.status !== 0 && !ok) fail((r.stderr || r.stdout || 'git command failed').trim().split('\n')[0]);
  return { out: r.stdout || '', status: r.status };
}

if (!fileArg) fail('usage: node skills/commit-archaeologist/scripts/dig.mjs <file> [--repo <folder>] [--lines A-B | --func <name>] [--json] [--out <file>] [--no-pickaxe]');
if (linesArg && funcArg) fail('use --lines or --func, not both');
const repoHint = path.resolve(repoArg);
if (!fs.existsSync(repoHint) || !fs.statSync(repoHint).isDirectory()) fail(`not a folder: ${repoArg}`);
const root = path.resolve(git(repoHint, ['rev-parse', '--show-toplevel']).out.trim());
const target = path.resolve(path.isAbsolute(fileArg) ? fileArg : path.join(root, fileArg));
const rel = path.relative(root, target).split(path.sep).join('/');
if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) fail('the file must be inside the repository');
if (!git(root, ['ls-files', '--error-unmatch', '--', rel], { ok: true }).out.trim()) fail(`not tracked by git: ${rel}`);

const notes = [];
if (git(root, ['rev-parse', '--is-shallow-repository'], { ok: true }).out.trim() === 'true')
  notes.push('shallow clone: history stops early, so the real origin may be older than shown');
if (git(root, ['diff', '--quiet', 'HEAD', '--', rel], { ok: true }).status === 1)
  notes.push('the file has uncommitted changes: line numbers refer to the last commit (HEAD), not the working copy');

let range = null;
if (linesArg) {
  const m = /^([1-9]\d*)-([1-9]\d*)$/.exec(linesArg);
  if (!m) fail('--lines takes A-B with positive numbers, such as 40-72');
  range = [Number(m[1]), Number(m[2])];
  if (range[0] > range[1]) fail('--lines: the start must not be after the end');
  const count = git(root, ['show', `HEAD:${rel}`]).out.split('\n').length - 1;
  if (range[1] > count) fail(`--lines ends at ${range[1]}, but ${rel} has ${count} lines at HEAD`);
}
const mode = range ? 'lines' : funcArg ? 'function' : 'file';
const selector = range ? `${range[0]},${range[1]}:${rel}` : funcArg ? `:${funcArg}:${rel}` : null;

// commit list, oldest first
const listArgs = selector ? ['log', '--format=%H', '-s', '-L', selector] : ['log', '--follow', '--format=%H', '--', rel];
const hashes = [...new Set(git(root, listArgs).out.split('\n').map(s => s.trim()).filter(s => /^[0-9a-f]{40}$/.test(s)))].reverse();
if (!hashes.length) fail(`no commits found for ${rel}${funcArg ? ` (function "${funcArg}" not found by git's function matcher)` : ''}`);

function category(subject, body) {
  const s = subject.toLowerCase(), t = `${subject}\n${body}`.toLowerCase();
  if (/^merge\b/.test(s)) return 'merge';
  if (/\brevert(s|ed|ing)?\b/.test(t)) return 'revert';
  const cc = /^(\w+)(\([^)]*\))?!?:/.exec(s);
  if (cc) {
    const map = { feat: 'feat', feature: 'feat', fix: 'fix', bugfix: 'fix', hotfix: 'hotfix', refactor: 'refactor', perf: 'perf', docs: 'docs', doc: 'docs', test: 'test', tests: 'test', chore: 'chore', build: 'chore', ci: 'chore', style: 'chore' };
    if (map[cc[1]]) return map[cc[1]];
  }
  if (/\bhot[ -]?fix\b/.test(t)) return 'hotfix';
  if (/\b(refactor|clean ?up|restructure|rename|move|extract)\b/.test(t)) return 'refactor';
  if (/\b(fix|fixes|fixed|bug|patch|regression)\b/.test(t)) return 'fix';
  if (/\b(feat|feature|add|adds|added|introduce|implement|support)\b/.test(t)) return 'feat';
  return 'other';
}

const SIGNALS = [
  ['issue-ref', /(?<![\w/])(#\d+|\b(?:pr|issue|gh)[\s:#-]*\d+|\b[A-Z][A-Z0-9]{1,9}-\d+\b)/g],
  ['revert', /\brevert(s|ed|ing)?\b/gi],
  ['workaround', /\bwork[ -]?around\b/gi],
  ['temporary', /\b(temporary|temporarily|temp fix|for now|until)\b/gi],
  ['todo', /\b(TODO|FIXME|XXX)\b/g],
  ['hack', /\b(hack|hacky|kludge)\b/gi],
  ['compat', /\b(backward[s]? compat\w*|compatib\w+|legacy|deprecat\w+)\b/gi],
  ['security', /\b(security|CVE-\d{4}-\d+|vulnerab\w+|injection|xss|csrf)\b/gi],
  ['performance', /\b(perf|performance|slow|faster|latency|timeout)\b/gi],
];

const FMT = '%H%x00%aN%x00%aI%x00%s%x00%b%x00%P%x01';
const timeline = [], signals = [];
for (const h of hashes) {
  const raw = git(root, ['diff-tree', '--root', '-r', '-M', '--name-status', `--format=${FMT}`, h]).out;
  const cut = raw.indexOf('\x01');
  const [hash, author, date, subject, body, parents] = raw.slice(0, cut).split('\x00');
  const files = new Set(), renames = [];
  for (const line of raw.slice(cut + 1).split('\n')) {
    const f = line.split('\t');
    if (f.length >= 3 && f[0].startsWith('R')) { files.add(f[1]); files.add(f[2]); renames.push({ from: f[1], to: f[2] }); }
    else if (f.length >= 2 && /^[AMDTCU]/.test(f[0])) files.add(f[f.length - 1]);
  }
  const text = `${subject}\n${body}`;
  const found = [];
  for (const [type, re] of SIGNALS) {
    const hits = [...new Set([...text.matchAll(re)].map(m => m[0]))].slice(0, 5);
    for (const e of hits) { found.push(type); signals.push({ type, commit: hash.slice(0, 12), evidence: e, subject }); }
  }
  const reverts = [...body.matchAll(/This reverts commit ([0-9a-f]{7,40})/gi)].map(m => m[1]);
  timeline.push({ hash, short: hash.slice(0, 12), author, date, subject, body: body.trim(), category: category(subject, body),
    merge: parents.trim().split(/\s+/).length > 1, files: [...files].sort(), renames, bulk: files.size > BULK,
    signals: [...new Set(found)], reverts });
}
// link reverts to the commits they undo
for (const e of timeline) for (const r of e.reverts) { const t = timeline.find(x => x.hash.startsWith(r)); if (t) t.revertedBy = e.short; }

// every name the target had, so an old name is not counted as a companion file
const aliases = new Set([rel]);
for (const e of [...timeline].reverse()) for (const r of e.renames) if (aliases.has(r.to)) aliases.add(r.from);
for (const n of git(root, ['log', '--follow', '--name-only', '--format=', '--', rel], { ok: true }).out.split('\n')) if (n.trim()) aliases.add(n.trim());

// companion files: present in at least a third of the non-bulk commits, and at least twice
const counted = timeline.filter(e => !e.bulk && !e.merge);
const threshold = Math.max(2, Math.ceil(counted.length / 3));
const byFile = new Map();
for (const e of counted) for (const f of e.files) if (!aliases.has(f)) (byFile.get(f) || byFile.set(f, []).get(f)).push(e.short);
const coChanged = [...byFile].filter(([, c]) => c.length >= threshold)
  .map(([file, commits]) => ({ file, count: commits.length, ratio: Math.round(100 * commits.length / counted.length) / 100, commits }))
  .sort((a, b) => b.count - a.count || a.file.localeCompare(b.file));

// current authorship (who last shaped the surviving lines) next to historical commit counts
const blameArgs = ['blame', '--line-porcelain', '-w'];
if (fs.existsSync(path.join(root, '.git-blame-ignore-revs'))) blameArgs.push('--ignore-revs-file', '.git-blame-ignore-revs');
if (range) blameArgs.push('-L', `${range[0]},${range[1]}`);
else if (funcArg) blameArgs.push('-L', `:${funcArg}`);
blameArgs.push('HEAD', '--', rel);
const lineCounts = new Map();
let current = '';
for (const line of git(root, blameArgs, { ok: true }).out.split('\n')) {
  if (line.startsWith('author ')) current = line.slice(7);
  else if (line.startsWith('\t')) { lineCounts.set(current, (lineCounts.get(current) || 0) + 1); current = ''; }
}
const commitCounts = new Map();
for (const e of timeline) commitCounts.set(e.author, (commitCounts.get(e.author) || 0) + 1);
const authors = [...new Set([...lineCounts.keys(), ...commitCounts.keys()])]
  .map(name => ({ name, currentLines: lineCounts.get(name) || 0, commits: commitCounts.get(name) || 0 }))
  .sort((a, b) => b.currentLines - a.currentLines || b.commits - a.commits || a.name.localeCompare(b.name));

// ancestry checks: did the code exist before the commit the line history starts at?
const ancestry = [];
if (mode !== 'file') {
  const fileFirst = git(root, ['log', '--follow', '--format=%h%x00%aI%x00%s', '--', rel], { ok: true }).out.trim().split('\n').pop();
  if (fileFirst) {
    const [h, d, s] = fileFirst.split('\x00');
    if (!timeline[0].hash.startsWith(h)) ancestry.push({ kind: 'file-older', commit: h, date: d, subject: s,
      note: 'the file history (following renames) starts earlier than the selected lines: they were added or rewritten later, or git lost the trail' });
  }
  if (!noPickaxe) {
    const head = git(root, ['show', `HEAD:${rel}`]).out.split('\n');
    const pick = range ? head.slice(range[0] - 1, range[1]) : head;
    const probe = pick.map(l => l.trim()).filter(l => l.length >= 12 && /[A-Za-z]/.test(l)).sort((a, b) => b.length - a.length)[0];
    if (probe) {
      const first = git(root, ['log', '--reverse', '--format=%h%x00%aI%x00%s', '-S', probe], { ok: true, timeout: 120_000 }).out.trim().split('\n')[0];
      if (first) {
        const [h, d, s] = first.split('\x00');
        if (d && Date.parse(d) < Date.parse(timeline[0].date)) ancestry.push({ kind: 'text-older', commit: h, date: d, subject: s, probe: probe.slice(0, 80),
          note: 'a line of this code first appeared in an earlier commit, maybe in another file: it may have been moved or copied here' });
      }
    }
  }
}
// earlier attempts on the whole file that were undone, even when outside the selected lines
const fileReverts = git(root, ['log', '--follow', '-i', '--grep=revert', '--format=%h%x00%s', '--', rel], { ok: true }).out.trim()
  .split('\n').filter(Boolean).map(l => { const [h, s] = l.split('\x00'); return { commit: h, subject: s }; })
  .filter(r => !timeline.some(e => e.hash.startsWith(r.commit)));

const report = {
  region: { repo: root.split(path.sep).join('/'), file: rel, mode, lines: range ? { start: range[0], end: range[1] } : null,
    func: funcArg || null, historicalPaths: [...aliases].sort(), coChangeThreshold: threshold, commits: timeline.length },
  notes, introducedBy: timeline[0], timeline, coChanged, authors, signals, ancestry, fileReverts,
};

if (outArg) { fs.mkdirSync(path.dirname(path.resolve(outArg)), { recursive: true }); fs.writeFileSync(outArg, JSON.stringify(report, null, 2) + '\n'); }
if (asJson) { console.log(JSON.stringify(report, null, 2)); process.exit(0); }

const where = rel + (range ? `:${range[0]}-${range[1]}` : funcArg ? ` (function ${funcArg})` : '');
const out = [`HISTORY DIG: ${where}  [${mode} mode, ${timeline.length} commits]`];
for (const n of notes) out.push(`NOTE: ${n}`);
const i0 = timeline[0];
out.push(`Introduced by ${i0.short} ${i0.date.slice(0, 10)} ${i0.author}: ${i0.subject}`);
out.push('', 'TIMELINE (oldest first)');
for (const e of timeline) out.push(`  ${e.short}  ${e.date.slice(0, 10)}  ${e.category.padEnd(8)} ${e.subject}${e.bulk ? '  [bulk]' : ''}${e.revertedBy ? `  [reverted by ${e.revertedBy}]` : ''}`);
out.push('', `COMPANION FILES (in ${threshold}+ of ${counted.length} commits)`);
out.push(...(coChanged.length ? coChanged.map(c => `  ${c.count}x  ${c.file}`) : ['  none above the threshold']));
out.push('', 'AUTHORS (current lines / commits in this history)');
out.push(...authors.map(a => `  ${String(a.currentLines).padStart(4)} / ${String(a.commits).padEnd(4)} ${a.name}`));
out.push('', 'INTENT SIGNALS (from commit messages)');
out.push(...(signals.length ? signals.map(s => `  ${s.commit}  ${s.type.padEnd(11)} "${s.evidence}"`) : ['  none: the messages do not say why']));
if (ancestry.length) { out.push('', 'ANCESTRY'); for (const a of ancestry) out.push(`  ${a.commit} ${a.date.slice(0, 10)} ${a.subject}: ${a.note}`); }
if (fileReverts.length) { out.push('', 'OTHER REVERTS ON THIS FILE'); for (const r of fileReverts) out.push(`  ${r.commit}  ${r.subject}`); }
console.log(out.join('\n'));
