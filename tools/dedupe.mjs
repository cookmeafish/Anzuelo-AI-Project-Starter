#!/usr/bin/env node
// Removes exact duplicate files from the protected originals folders (sources/ and the like), keeping the oldest copy.
// Originals are evidence, so nothing else is ever deleted: only files byte for byte identical to one that stays.
//   node tools/dedupe.mjs            list the duplicates (changes nothing)
//   node tools/dedupe.mjs --apply    remove them, and log each one in docs/CHANGELOG.md
// Lesson: a research helper downloaded the same picture twice, and the originals guard rightly refused a plain delete.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, config, usageOf } from './hooks/hooks.mjs';

if (process.argv.includes('--help')) { console.log(usageOf(import.meta.url)); process.exit(0); }
const apply = process.argv.includes('--apply');
const dirs = [...new Set((config().protectedOriginals || []).map(g => g.split(/[/*]/)[0]).filter(Boolean))].filter(d => fs.existsSync(path.join(ROOT, d)));
const byHash = new Map();
const walk = d => {
  for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) { walk(p); continue; }
    const full = path.join(ROOT, p), h = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    byHash.set(h, [...(byHash.get(h) || []), { p, t: fs.statSync(full).mtimeMs }]);
  }
};
for (const d of dirs) walk(d);
const dupes = [...byHash.values()].filter(g => g.length > 1).flatMap(g => { const [keep, ...rest] = g.sort((a, b) => a.t - b.t || a.p.localeCompare(b.p)); return rest.map(r => ({ drop: r.p, keep: keep.p })); });
if (!dupes.length) { console.log(`Done: no exact duplicates in ${dirs.join(', ') || '(no originals folders)'}.`); process.exit(0); }
for (const d of dupes) console.log(`${apply ? 'removed ' : 'duplicate'} ${d.drop} (same bytes as ${d.keep}, which stays)`);
if (!apply) { console.log(`\n${dupes.length} exact duplicate(s). Remove them with: node tools/dedupe.mjs --apply`); process.exit(0); }
for (const d of dupes) fs.rmSync(path.join(ROOT, d.drop));
const log = path.join(ROOT, 'docs', 'CHANGELOG.md'), day = new Date().toISOString().slice(0, 10);
fs.mkdirSync(path.dirname(log), { recursive: true });
fs.appendFileSync(log, dupes.map(d => `- ${day}: removed exact duplicate ${d.drop} (same bytes as ${d.keep})`).join('\n') + '\n');
console.log(`\nDone: removed ${dupes.length} exact duplicate(s), logged in docs/CHANGELOG.md.`);
