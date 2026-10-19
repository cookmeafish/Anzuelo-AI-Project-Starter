#!/usr/bin/env node
// How did we solve this before? Searches the project's memory, best match first. Read-only, zero dependencies.
//   node tools/recall.mjs "<key words>" [--all]
// Looks in the history of finished work turns (tools/hooks/state/history.jsonl, kept on this machine), then in
// docs/CHANGELOG.md, docs/DECISIONS.md, docs/STATUS.md, docs/glossary.md, docs/plans/ and docs/knowledge/. Shows the
// best history match in full and the next ones in one line each; --all lists every match.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, read, usageOf, keyWords, recallMatches } from './hooks/hooks.mjs';

const args = process.argv.slice(2);
const q = args.filter(a => !a.startsWith('--')).join(' ').trim();
if (!q) { console.log(usageOf(import.meta.url)); process.exit(2); }
const all = args.includes('--all');

const hits = recallMatches(q, all ? 50 : 3);
if (hits.length) {
  const [top, ...rest] = hits;
  console.log(`Past work, best match (${top.h.at}):\n  request: ${top.h.prompt}\n  followed: ${top.h.used.join(', ') || '-'}\n  changed: ${top.h.changed.join(', ') || '-'}\n  answer: ${top.h.answer}`);
  for (const r of rest) console.log(`  also ${r.h.at}: ${r.h.prompt.slice(0, 100)}`);
} else console.log('Past work: nothing similar recorded yet.');

// the project's own records: lines that share the most key words with the question
const want = new Set(keyWords(q).filter(w => w.length > 2));
const files = ['docs/CHANGELOG.md', 'docs/DECISIONS.md', 'docs/STATUS.md', 'docs/glossary.md'];
for (const d of ['docs/plans', 'docs/knowledge']) {
  const walk = p => { let st; try { st = fs.lstatSync(path.join(ROOT, p)); } catch { return; } if (st.isSymbolicLink()) return; if (st.isDirectory()) for (const n of fs.readdirSync(path.join(ROOT, p))) walk(`${p}/${n}`); else if (p.endsWith('.md')) files.push(p); };
  walk(d);
}
const lines = files.flatMap(f => read(path.join(ROOT, f)).split(/\r?\n/).map((l, i) => ({ f, i: i + 1, l: l.trim() })))
  .filter(x => x.l.length > 12).map(x => ({ ...x, score: keyWords(x.l).filter(w => want.has(w)).length }))
  .filter(x => x.score >= Math.min(2, want.size)).sort((a, b) => b.score - a.score).slice(0, all ? 50 : 8);
console.log(lines.length ? '\nIn the project records:\n' + lines.map(x => `  ${x.f}:${x.i}  ${x.l.slice(0, 160)}`).join('\n') : '\nIn the project records: nothing matching.');
