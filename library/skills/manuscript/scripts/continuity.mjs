#!/usr/bin/env node
// Names and capitalized terms per chapter, with spelling variants flagged. Zero dependencies, read-only.
//   node skills/manuscript/scripts/continuity.mjs <chapter files or folders...> [--style <style sheet>] [--min 2]
// Reads .md, .txt and .fountain files (folders: every such file inside, sorted by name). For each chapter it lists the
// capitalized terms it uses (names, places, invented words) with counts. Then it flags:
//   - a term written two ways (same letters apart from case or accents, or one or two letters apart), across the book;
//   - a term the style sheet marks as wrong ("Name (not: Variant, Other)" or a "Wrong" column), with where it occurs;
//   - a term close to a style sheet name but not equal to it.
// --min N: list only terms used at least N times in the book (default 1). Prints RESULT: PASS when nothing is flagged,
// RESULT: FAIL <count> variant(s) otherwise. It never changes a file: deciding which spelling is right is the author's.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const valued = new Set(['--style', '--min']);
const inputs = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const MIN = Math.max(1, parseInt(opt('--min') || '1', 10) || 1);
if (!inputs.length) { console.error('usage: node continuity.mjs <chapter files or folders...> [--style <style sheet>] [--min 2]'); process.exit(2); }

const EXT = /\.(md|markdown|txt|fountain)$/i;
const files = [];
for (const p of inputs) {
  if (!fs.existsSync(p)) { console.error(`not found: ${p}`); process.exit(2); }
  if (fs.statSync(p).isDirectory()) {
    const walk = d => fs.readdirSync(d).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .forEach(n => { const q = path.join(d, n); if (fs.statSync(q).isDirectory()) walk(q); else if (EXT.test(n)) files.push(q); });
    walk(p);
  } else files.push(p);
}
if (!files.length) { console.error('no chapter files (.md, .txt, .fountain) found'); process.exit(2); }

// Words that start sentences or headings but are not names. Others are dropped when the book also uses them in lower case.
const COMMON = new Set(('i a an the this that these those he she it we they you his her its our their my your me him them us ' +
  'and but or so yet for nor if then when while after before because though although as at by in on of to from with without ' +
  'what who whom whose which where why how yes no not oh ah well now here there all some any each every both one two three ' +
  'mr mrs ms dr st chapter part scene int ext day night later cut fade continued').split(' '));
const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function terms(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n/, '').replace(/`[^`]*`/g, ' ').replace(/\]\([^)]*\)/g, ']');
  const out = [];
  // a run of capitalized words is one term ("Port Elden"); a single letter or an all-caps shout is not
  const re = /\p{Lu}[\p{Ll}\p{M}'’-]+(?:\s+\p{Lu}[\p{Ll}\p{M}'’-]+)*/gu;
  for (const m of body.matchAll(re)) {
    const t = m[0].replace(/['’]s$/u, '').replace(/[-'’]+$/u, '');
    if (t.length < 2) continue;
    const words = t.split(/\s+/);
    while (words.length && COMMON.has(words[0].toLowerCase().split(/['’]/)[0])) words.shift(); // "The Harbor Inn" -> "Harbor Inn", "You're" -> none
    if (words.length) out.push(words.join(' '));
  }
  return out;
}

const chapters = files.map(f => ({ file: f.replace(/\\/g, '/'), text: fs.readFileSync(f, 'utf8') }));
const lowerWords = new Set();
for (const c of chapters) for (const w of c.text.match(/(?<![\p{L}\p{M}])\p{Ll}[\p{Ll}\p{M}'’-]*/gu) || []) lowerWords.add(w);
const book = new Map(); // term -> Map(file -> count)
for (const c of chapters) {
  for (const t of terms(c.text)) {
    // a single word the book also writes in lower case is an ordinary word at the start of a sentence
    if (!t.includes(' ') && lowerWords.has(t.toLowerCase())) continue;
    if (!book.has(t)) book.set(t, new Map());
    book.get(t).set(c.file, (book.get(t).get(c.file) || 0) + 1);
  }
}
const total = t => [...book.get(t).values()].reduce((a, b) => a + b, 0);
const where = t => [...book.get(t).entries()].map(([f, n]) => `${path.basename(f)} (${n})`).join(', ');

// ---- style sheet: names to keep, and spellings marked wrong ----
const low = s => s.toLowerCase();
const keep = new Map(), wrong = new Map(); // lower-case spelling -> the style sheet's name
const styleFile = opt('--style');
if (styleFile) {
  if (!fs.existsSync(styleFile)) { console.error(`style sheet not found: ${styleFile}`); process.exit(2); }
  for (const line of fs.readFileSync(styleFile, 'utf8').split(/\r?\n/)) {
    let name = '', bad = [];
    const row = /^\s*\|([^|]+)\|([^|]*)\|?/.exec(line); // | Name | wrong spellings | ...
    const item = /^\s*[-*]\s+\**([^(:*\n]+?)\**\s*(?:\((?:not|never|avoid)\s*:?\s*([^)]+)\))?\s*(?:[:,].*)?$/i.exec(line);
    if (row && !/^[\s:-]+$/.test(row[1]) && !/^\s*(name|term|word)s?\s*$/i.test(row[1])) { name = row[1].trim(); bad = row[2].split(/[,;/]/); }
    else if (item) { name = item[1].trim(); bad = (item[2] || '').split(/[,;/]/); }
    if (!name || !/^\p{Lu}/u.test(name)) continue;
    keep.set(low(name), name);
    for (const b of bad.map(s => s.replace(/^\s*(not|never|avoid)\s*:?\s*/i, '').trim()).filter(Boolean)) if (low(b) !== low(name)) wrong.set(low(b), name);
  }
}

function dist(a, b) { // Levenshtein, small strings only
  if (Math.abs(a.length - b.length) > 2) return 3;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// two spellings of one name: the same apart from case or accents, or (5+ letters) one letter apart, (8+) two
const close = (a, b) => { if (low(a) === low(b)) return false; const x = norm(a), y = norm(b); if (x === y) return true; const n = Math.min(x.length, y.length); return n >= 5 && dist(x, y) <= (n >= 8 ? 2 : 1); };

// ---- report ----
console.log(`Chapters: ${chapters.length}. Distinct capitalized terms: ${book.size}.${styleFile ? ` Style sheet: ${keep.size} names, ${wrong.size} wrong spellings.` : ' No style sheet given.'}`);
for (const c of chapters) {
  const list = [...book.keys()].filter(t => book.get(t).has(c.file) && total(t) >= MIN).sort((a, b) => book.get(b).get(c.file) - book.get(a).get(c.file) || a.localeCompare(b));
  console.log(`\n${c.file}\n  ${list.map(t => `${t} ${book.get(t).get(c.file)}`).join(', ') || '(none)'}`);
}
// compare single words too, so "Old Lindquist" is caught against "Lindqvist"
const words = new Map(); // word -> Map(file -> count)
for (const [t, m] of book) for (const w of t.split(/\s+/)) { if (!words.has(w)) words.set(w, new Map()); for (const [f, n] of m) words.get(w).set(f, (words.get(w).get(f) || 0) + n); }
const at = (w, m = words) => [...m.get(w).entries()].map(([f, n]) => `${path.basename(f)} (${n})`).join(', ');
const keepWords = new Set([...keep.values()].flatMap(k => k.split(/\s+/)).map(low));
const flags = [], flagged = new Set();
for (const t of book.keys()) if (wrong.has(low(t))) { flags.push(`"${t}" is marked wrong in the style sheet (use "${wrong.get(low(t))}"): ${where(t)}`); for (const w of t.split(/\s+/)) flagged.add(low(w)); }
for (const w of words.keys()) {
  if (flagged.has(low(w))) continue;
  if (wrong.has(low(w))) { flags.push(`"${w}" is marked wrong in the style sheet (use "${wrong.get(low(w))}"): ${at(w)}`); flagged.add(low(w)); continue; }
  if (keepWords.has(low(w))) continue;
  const near = [...keepWords].find(k => close(k, w));
  if (near) { flags.push(`"${w}" is close to the style sheet's "${[...keep.values()].flatMap(k => k.split(/\s+/)).find(k => low(k) === near)}": ${at(w)}`); flagged.add(low(w)); }
}
const all = [...words.keys()];
for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
  const [a, b] = [all[i], all[j]];
  if (!close(a, b) || flagged.has(low(a)) || flagged.has(low(b))) continue;
  flags.push(`"${a}" and "${b}" may be one name spelled two ways: ${at(a)} / ${at(b)}`);
}
console.log(`\nVariants (${flags.length}):`);
for (const f of flags) console.log(`  - ${f}`);
console.log(flags.length ? `RESULT: FAIL ${flags.length} variant(s) to decide` : 'RESULT: PASS');
process.exit(flags.length ? 1 : 0);
