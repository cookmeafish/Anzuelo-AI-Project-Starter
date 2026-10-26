#!/usr/bin/env node
// Profile a data file before analysing it. Zero dependencies, read-only.
//   node profile.mjs <file.csv|.tsv|.json|.jsonl> [--top N] [--sep ;]
// Prints rows, columns, duplicate and ragged rows, then per column: type guess, missing, placeholder-like values,
// distinct count, and min/max/mean/median plus an outlier count for numbers, earliest/latest for dates, and the most
// common values for text. Every figure is computed from the file on this run, so it can be quoted as traced.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--top' && args[args.indexOf(a) - 1] !== '--sep');
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const TOP = Math.max(1, parseInt(opt('--top') || '5', 10) || 5);
if (!file) { console.error('usage: node profile.mjs <file.csv|.tsv|.json|.jsonl> [--top N] [--sep ;]'); process.exit(1); }
if (!fs.existsSync(file)) { console.error(`not found: ${file}`); process.exit(1); }

let text = fs.readFileSync(file, 'utf8');
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1); // byte order mark
const ext = path.extname(file).toLowerCase();

// ---- read the file into { columns, rows } where each row is an array of raw values ----
function parseDelimited(src, sep) {
  // RFC 4180 style: fields may be quoted, quotes inside are doubled, quoted fields may hold separators and newlines.
  const out = []; let row = [], field = '', inQ = false, i = 0;
  while (i < src.length) {
    const c = src[i];
    if (inQ) {
      if (c === '"') { if (src[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
      field += c; i++; continue;
    }
    if (c === '"' && field === '') { inQ = true; i++; continue; }
    if (c === sep) { row.push(field); field = ''; i++; continue; }
    if (c === '\r' || c === '\n') {
      row.push(field); field = '';
      if (!(row.length === 1 && row[0] === '')) out.push(row); // skip blank lines
      row = [];
      i += (c === '\r' && src[i + 1] === '\n') ? 2 : 1; continue;
    }
    field += c; i++;
  }
  if (inQ) console.error('WARN: the file ends inside a quoted field (an unmatched quote); the last row may be wrong.');
  if (field !== '' || row.length) { row.push(field); if (!(row.length === 1 && row[0] === '')) out.push(row); }
  return out;
}

function guessSep(src) {
  const first = src.split(/\r?\n/, 1)[0] || '';
  const counts = [',', '\t', ';', '|'].map(s => [s, first.split(s).length - 1]).sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

let columns = [], rows = [], ragged = 0;
if (ext === '.json' || ext === '.jsonl' || ext === '.ndjson') {
  let data;
  if (ext === '.json') {
    try { data = JSON.parse(text); } catch (e) { console.error(`not valid JSON: ${e.message}`); process.exit(1); }
    if (!Array.isArray(data) && data && typeof data === 'object') {
      const arrays = Object.entries(data).filter(([, v]) => Array.isArray(v));
      if (arrays.length === 1) { console.log(`(using the array under "${arrays[0][0]}")`); data = arrays[0][1]; }
    }
  } else {
    data = [];
    for (const [n, line] of text.split(/\r?\n/).entries()) {
      if (!line.trim()) continue;
      try { data.push(JSON.parse(line)); } catch { console.error(`WARN: line ${n + 1} is not valid JSON; skipped.`); }
    }
  }
  if (!Array.isArray(data)) { console.error('expected an array of records (or one object holding a single array).'); process.exit(1); }
  const seen = new Set();
  for (const rec of data) if (rec && typeof rec === 'object' && !Array.isArray(rec)) for (const k of Object.keys(rec)) seen.add(k);
  columns = seen.size ? [...seen] : ['value'];
  rows = data.map(rec => {
    if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return [rec];
    return columns.map(k => rec[k]);
  });
} else {
  const sep = opt('--sep') || (ext === '.tsv' || ext === '.tab' ? '\t' : guessSep(text));
  const all = parseDelimited(text, sep === '\\t' ? '\t' : sep);
  if (!all.length) { console.log('rows: 0 (empty file)'); process.exit(0); }
  columns = all[0].map((h, i) => h.trim() || `column_${i + 1}`);
  rows = all.slice(1);
  for (const r of rows) if (r.length !== columns.length) ragged++;
  const width = Math.max(columns.length, ...rows.map(r => r.length));
  for (let i = columns.length; i < width; i++) columns.push(`extra_${i + 1}`);
}

// ---- classify values ----
const PLACEHOLDER = /^(na|n\/a|nan|null|none|nil|-|--|\?|tbd|unknown|missing|#n\/a|#value!|#div\/0!)$/i;
const NUM = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;
const NUM_SEP = /^[-+]?\d{1,3}(,\d{3})+(\.\d+)?$/; // 1,234.5
const BOOL = /^(true|false|yes|no|y|n)$/i;
const DATE = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/;
const DATE_SLASH = /^\d{1,2}[/.]\d{1,2}[/.]\d{2,4}$/;

function kind(v) {
  if (v === null || v === undefined) return ['missing'];
  if (typeof v === 'number') return Number.isFinite(v) ? ['number', v] : ['placeholder'];
  if (typeof v === 'boolean') return ['boolean'];
  if (typeof v === 'object') return ['text', JSON.stringify(v)];
  const s = String(v).trim();
  if (s === '') return ['missing'];
  if (PLACEHOLDER.test(s)) return ['placeholder'];
  if (NUM.test(s)) return ['number', Number(s)];
  if (NUM_SEP.test(s)) return ['number', Number(s.replace(/,/g, ''))];
  if (BOOL.test(s)) return ['boolean'];
  if (DATE.test(s) && !Number.isNaN(Date.parse(s.replace(' ', 'T')))) return ['date', s];
  if (DATE_SLASH.test(s)) return ['date-ambiguous', s];
  return ['text', s];
}

const fmt = n => {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return String(n);
  const a = Math.abs(n);
  return a >= 1000 ? n.toFixed(2) : a >= 1 ? n.toFixed(3).replace(/\.?0+$/, '') : n.toPrecision(4);
};
const quantile = (sorted, q) => {
  const p = (sorted.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (p - lo);
};
const show = s => { const t = String(s).replace(/\s+/g, ' '); return t.length > 40 ? t.slice(0, 37) + '...' : t; };

// ---- table-level facts ----
const keys = rows.map(r => JSON.stringify(r.map(v => (v === undefined ? null : v))));
const dupRows = keys.length - new Set(keys).size;
console.log(`file: ${file}`);
console.log(`rows: ${rows.length}   columns: ${columns.length}   duplicate rows: ${dupRows}${ragged ? `   rows with a different field count than the header: ${ragged}` : ''}`);
console.log('');

// ---- per column ----
for (let c = 0; c < columns.length; c++) {
  const counts = { missing: 0, placeholder: 0, number: 0, boolean: 0, date: 0, 'date-ambiguous': 0, text: 0 };
  const nums = [], dates = [], freq = new Map();
  for (const r of rows) {
    const raw = r[c];
    const [k, val] = kind(raw);
    counts[k]++;
    if (k === 'number') nums.push(val);
    if (k === 'date') dates.push(val);
    if (k !== 'missing') { const key = typeof raw === 'object' && raw !== null ? JSON.stringify(raw) : String(raw).trim(); freq.set(key, (freq.get(key) || 0) + 1); }
  }
  const present = rows.length - counts.missing - counts.placeholder;
  const order = ['number', 'date', 'boolean', 'date-ambiguous', 'text'].sort((a, b) => counts[b] - counts[a]);
  let type = present === 0 ? 'empty' : order[0];
  const off = present - counts[type];
  if (type === 'number' && nums.length && nums.every(Number.isInteger)) type = 'integer';
  const typeLine = present && off ? `${type} (mixed: ${off} value${off === 1 ? '' : 's'} of another type)` : type;

  console.log(`[${c + 1}] ${columns[c]}`);
  console.log(`    type: ${typeLine}`);
  console.log(`    missing: ${counts.missing}${rows.length ? ` (${fmt(100 * counts.missing / rows.length)}%)` : ''}${counts.placeholder ? `   placeholder-like (NA, null, -, ...): ${counts.placeholder}` : ''}`);
  console.log(`    distinct: ${freq.size}${freq.size === rows.length && rows.length > 1 ? ' (all unique: possible ID)' : ''}`);

  if ((type === 'number' || type === 'integer') && nums.length) {
    const s = [...nums].sort((a, b) => a - b);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const q1 = quantile(s, 0.25), q3 = quantile(s, 0.75), iqr = q3 - q1;
    const out = s.filter(v => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
    console.log(`    min: ${fmt(s[0])}   max: ${fmt(s[s.length - 1])}   mean: ${fmt(mean)}   median: ${fmt(quantile(s, 0.5))}`);
    console.log(`    outside 1.5 x IQR: ${out}${s.some(v => v < 0) ? `   negative: ${s.filter(v => v < 0).length}` : ''}   zero: ${s.filter(v => v === 0).length}`);
  } else if (type === 'date' && dates.length) {
    const s = [...dates].sort();
    console.log(`    earliest: ${s[0]}   latest: ${s[s.length - 1]}`);
  } else if (type === 'date-ambiguous') {
    console.log('    note: dates like 03/04/2025 can be day-first or month-first; confirm the format before sorting or comparing.');
  }
  if (type !== 'empty' && !(type === 'number' || type === 'integer' || type === 'date') || freq.size <= TOP) {
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).slice(0, TOP);
    if (top.length) console.log(`    top values: ${top.map(([v, n]) => `"${show(v)}" ${n}`).join(', ')}`);
  }
  if (type === 'text') {
    const raws = rows.map(r => r[c]).filter(v => typeof v === 'string' && v !== '');
    const ws = raws.filter(v => v !== v.trim()).length;
    const lower = new Map(); for (const v of freq.keys()) { const k = String(v).toLowerCase(); lower.set(k, (lower.get(k) || 0) + 1); }
    const caseDup = [...lower.values()].filter(n => n > 1).length;
    const notes = [];
    if (ws) notes.push(`${ws} value(s) with leading or trailing spaces`);
    if (caseDup) notes.push(`${caseDup} value(s) differ only by upper or lower case`);
    if (notes.length) console.log(`    note: ${notes.join('; ')}.`);
  }
}
