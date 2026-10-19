#!/usr/bin/env node
// Removes exact duplicate files from the protected originals folders (sources/ and the like). Originals are evidence,
// so nothing else is ever deleted: only files byte for byte identical to one that stays.
//   node tools/dedupe.mjs                    list the duplicates (changes nothing)
//   node tools/dedupe.mjs --apply            remove them, and log each one in docs/CHANGELOG.md
//   node tools/dedupe.mjs --path <folder>    only this folder (inside an originals folder)
// Which copy stays: the one the project's other files refer to (by file name or path). When none or several are referred
// to: the better name (longer, not ending in a dash or digits, like "photo-2" or "1234.jpg"), then the oldest. A copy
// that is referred to is never deleted: when two copies are both referred to, it says so, to merge the references by
// hand. Folders with a file changed in the last 10 minutes are skipped (a helper may still be writing there).
// Lesson: a research helper downloaded the same picture twice, and the originals guard rightly refused a plain delete.
// Lesson: keeping the oldest copy kept a badly named one, while a page linked the newer one, so --apply would have
// broken that picture.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ROOT, config, usageOf } from './hooks/hooks.mjs';

const args = process.argv.slice(2);
if (args.includes('--help')) { console.log(usageOf(import.meta.url)); process.exit(0); }
const apply = args.includes('--apply');
const only = (() => { const i = args.indexOf('--path'); return i >= 0 ? String(args[i + 1] || '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/$/, '') : null; })();
const BUSY_MS = 10 * 60_000;
let dirs = [...new Set((config().protectedOriginals || []).map(g => g.split(/[/*]/)[0]).filter(Boolean))].filter(d => fs.existsSync(path.join(ROOT, d)));
if (only) {
  if (!dirs.some(d => only === d || only.startsWith(d + '/'))) { console.log(`${only} is not inside an originals folder (${dirs.join(', ') || 'none set'}): nothing to do.`); process.exit(0); }
  dirs = fs.existsSync(path.join(ROOT, only)) ? [only] : [];
}
const byHash = new Map(), busy = new Set(), now = Date.now();
const walk = d => {
  let ents; try { ents = fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) { walk(p); continue; }
    const full = path.join(ROOT, p), st = fs.statSync(full);
    if (now - st.mtimeMs < BUSY_MS) busy.add(d);
    const h = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    byHash.set(h, [...(byHash.get(h) || []), { p, t: st.mtimeMs }]);
  }
};
for (const d of dirs) walk(d);
const inBusy = p => [...busy].some(d => path.posix.dirname(p) === d);

// The project's text files, searched once for references to each candidate (its path, or its file name).
const TEXT = /\.(md|mdx|txt|html?|css|js|mjs|cjs|jsx|ts|tsx|json|ya?ml|py|csv|svg)$/i;
const SKIP = /^(\.git|node_modules|\.cache|\.claude|\.agents|\.gemini|\.codex|\.obsidian|\.starter|state|dist|build)$/;
const texts = [];
(function scan(d) {
  let ents; try { ents = fs.readdirSync(path.join(ROOT, d || '.'), { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = d ? `${d}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!SKIP.test(e.name) && !dirs.some(x => p === x)) scan(p); continue; }
    // the engine's own code and docs name sample files, not the project's pictures
    if (!TEXT.test(e.name) || p === 'docs/CHANGELOG.md' || /^(tools\/hooks|skills|packs|library|\.githooks)\//.test(p) || /^tools\/(trial|new-project|dedupe)\.mjs$/.test(p)) continue;
    try { const s = fs.statSync(path.join(ROOT, p)); if (s.size < 2e6) texts.push({ p, t: fs.readFileSync(path.join(ROOT, p), 'utf8') }); } catch { }
  }
})('');
const referenced = p => {
  const name = path.posix.basename(p), esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // the whole name, not part of a longer one ("photo.jpg" is not a reference to "a-photo.jpg")
  const rx = new RegExp(`(^|[^\\w.-])(${[...new Set([p, encodeURI(p), name, encodeURI(name)])].map(esc).join('|')})($|[^\\w-]|\\.(?![\\w]))`);
  return texts.some(f => rx.test(f.t));
};
const stem = p => path.posix.basename(p).replace(/\.[^.]+$/, '');
const goodName = p => (/(-|_|\s)$|(^|[-_ ])\(?\d+\)?$|^\d+$|copy$/i.test(stem(p)) ? 0 : 1);

const dupes = [], conflicts = [], skipped = [];
for (const group of [...byHash.values()].filter(g => g.length > 1)) {
  if (group.some(f => inBusy(f.p))) { skipped.push(group.map(f => f.p).join(', ')); continue; }
  const refs = group.filter(f => referenced(f.p));
  if (refs.length > 1) { conflicts.push(refs.map(f => f.p)); }
  const ranked = [...group].sort((a, b) => (referenced(b.p) - referenced(a.p)) || (goodName(b.p) - goodName(a.p)) || (stem(b.p).length - stem(a.p).length) || (a.t - b.t) || a.p.localeCompare(b.p));
  const keep = ranked[0];
  for (const r of ranked.slice(1)) if (!referenced(r.p)) dupes.push({ drop: r.p, keep: keep.p });
}
for (const c of conflicts) console.log(`both referenced: ${c.join(' and ')} (same bytes). Merge the references by hand, then run this again.`);
for (const s of skipped) console.log(`skipped (a file in the folder changed in the last 10 minutes; a helper may still be writing there): ${s}`);
if (!dupes.length) { console.log(`Done: no exact duplicates to remove in ${dirs.join(', ') || '(no originals folders)'}.`); process.exit(0); }
for (const d of dupes) console.log(`${apply ? 'removed ' : 'duplicate'} ${d.drop} (same bytes as ${d.keep}, which stays)`);
if (!apply) { console.log(`\n${dupes.length} exact duplicate(s). Remove them with: node tools/dedupe.mjs --apply`); process.exit(0); }
for (const d of dupes) fs.rmSync(path.join(ROOT, d.drop));
const log = path.join(ROOT, 'docs', 'CHANGELOG.md'), day = new Date().toISOString().slice(0, 10);
fs.mkdirSync(path.dirname(log), { recursive: true });
fs.appendFileSync(log, dupes.map(d => `- ${day}: removed exact duplicate ${d.drop} (same bytes as ${d.keep})`).join('\n') + '\n');
console.log(`\nDone: removed ${dupes.length} exact duplicate(s), logged in docs/CHANGELOG.md.`);
