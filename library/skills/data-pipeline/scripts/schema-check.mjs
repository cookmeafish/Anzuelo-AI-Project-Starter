#!/usr/bin/env node
// Check a data file against its schema before a pipeline uses it. Zero dependencies, read-only.
//   node schema-check.mjs <file.csv|.tsv|.json|.jsonl> <schema.json> [--sep ;] [--max-examples N]
// The schema is JSON:
//   { "columns": { "<name>": { "type": "string|integer|number|boolean|date|datetime", "required": true,
//                              "optional": false, "enum": [..], "min": 0, "max": 100, "pattern": "^[A-Z]{2}$" } },
//     "allowExtra": false, "missing": ["", "NA", "null"], "minRows": 1 }
// Every column listed must be present unless "optional": true. "required": true means no row may leave it empty
// (a value from "missing" counts as empty). Extra columns fail unless "allowExtra": true.
// Prints one line per problem with the row count and the first rows affected, then "RESULT: PASS" or
// "RESULT: FAIL <why>". Exit code 0 on PASS, 1 on FAIL, 2 on a usage error.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const pos = args.filter((a, i) => !a.startsWith('--') && !['--sep', '--max-examples'].includes(args[i - 1]));
const [file, schemaFile] = pos;
const MAX_EX = Math.max(1, parseInt(opt('--max-examples') || '5', 10) || 5);
const usage = msg => { console.error(msg); console.error('usage: node schema-check.mjs <file.csv|.tsv|.json|.jsonl> <schema.json> [--sep ;] [--max-examples N]'); console.log(`RESULT: FAIL ${msg}`); process.exit(2); };
if (!file || !schemaFile) usage('missing arguments');
for (const f of [file, schemaFile]) if (!fs.existsSync(f)) usage(`not found: ${f}`);

let schema;
try { schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8').replace(/^﻿/, '')); } catch (e) { usage(`schema does not parse: ${e.message}`); }
if (!schema || typeof schema.columns !== 'object' || Array.isArray(schema.columns)) usage('schema needs a "columns" object');
const TYPES = new Set(['string', 'integer', 'number', 'boolean', 'date', 'datetime']);
for (const [c, s] of Object.entries(schema.columns)) if (s.type && !TYPES.has(s.type)) usage(`schema column "${c}": unknown type "${s.type}"`);
const MISSING = new Set((schema.missing ?? ['']).map(String));

// ---- read the file into { columns, rows } with rows as objects ----
let text = fs.readFileSync(file, 'utf8');
if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
const ext = path.extname(file).toLowerCase();

function parseDelimited(src, sep) {
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
      row.push(field); field = ''; out.push(row); row = [];
      i += c === '\r' && src[i + 1] === '\n' ? 2 : 1; continue;
    }
    field += c; i++;
  }
  if (field !== '' || row.length) { row.push(field); out.push(row); }
  return out.filter(r => !(r.length === 1 && r[0] === ''));
}

const problems = [];
let columns = [], rows = [];
if (ext === '.json' || ext === '.jsonl' || ext === '.ndjson') {
  let data;
  try {
    data = ext === '.json' ? JSON.parse(text) : text.split(/\r?\n/).filter(l => l.trim()).map(l => JSON.parse(l));
  } catch (e) { console.log(`FAIL file does not parse as ${ext.slice(1)}: ${e.message}`); console.log('RESULT: FAIL file does not parse'); process.exit(1); }
  if (!Array.isArray(data)) data = Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.data) ? data.data : null;
  if (!data || data.some(r => !r || typeof r !== 'object' || Array.isArray(r))) {
    console.log('FAIL expected an array of objects (or {"rows": [...]}, or one object per line)'); console.log('RESULT: FAIL not a table'); process.exit(1);
  }
  const seen = new Set(); for (const r of data) for (const k of Object.keys(r)) seen.add(k);
  columns = [...seen]; rows = data;
} else {
  const sep = opt('--sep') || (ext === '.tsv' || ext === '.tab' ? '\t' : ',');
  const grid = parseDelimited(text, sep);
  if (!grid.length) { console.log('FAIL the file is empty'); console.log('RESULT: FAIL empty file'); process.exit(1); }
  columns = grid[0].map(h => h.trim());
  const ragged = [];
  rows = grid.slice(1).map((r, i) => {
    if (r.length !== columns.length) ragged.push(i + 2);
    return Object.fromEntries(columns.map((c, j) => [c, r[j] ?? '']));
  });
  if (ragged.length) problems.push(`rows with a wrong number of fields: ${ragged.length} (rows ${ragged.slice(0, MAX_EX).join(', ')})`);
  const dupHead = columns.filter((c, i) => columns.indexOf(c) !== i);
  if (dupHead.length) problems.push(`duplicate column names: ${[...new Set(dupHead)].join(', ')}`);
}

// ---- columns ----
const expected = Object.keys(schema.columns);
const missingCols = expected.filter(c => !columns.includes(c) && !schema.columns[c].optional);
const extraCols = columns.filter(c => !expected.includes(c));
if (missingCols.length) problems.push(`missing columns: ${missingCols.join(', ')}`);
if (extraCols.length && !schema.allowExtra) problems.push(`unexpected columns: ${extraCols.join(', ')} (rename in the schema, or set "allowExtra": true after a recorded decision)`);
if (schema.minRows != null && rows.length < schema.minRows) problems.push(`rows: ${rows.length}, schema expects at least ${schema.minRows}`);

// ---- values ----
const isEmpty = v => v === null || v === undefined || MISSING.has(String(v).trim());
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
const validDate = s => { const d = new Date(s.length === 10 ? s + 'T00:00:00Z' : s); return !isNaN(d) && (s.length !== 10 || d.toISOString().slice(0, 10) === s); };
function typeOk(type, v) {
  if (typeof v === 'number') return type === 'number' || (type === 'integer' && Number.isInteger(v)) || type === 'string';
  if (typeof v === 'boolean') return type === 'boolean' || type === 'string';
  if (typeof v === 'object') return false;
  const s = String(v).trim();
  switch (type) {
    case 'string': return true;
    case 'integer': return /^[+-]?\d+$/.test(s);
    case 'number': return /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s);
    case 'boolean': return /^(true|false|yes|no|0|1)$/i.test(s);
    case 'date': return DATE.test(s) && validDate(s);
    case 'datetime': return (DATETIME.test(s) || DATE.test(s)) && validDate(s);
    default: return true;
  }
}
for (const c of expected.filter(c => columns.includes(c))) {
  const s = schema.columns[c];
  const empty = [], badType = [], badEnum = [], badRange = [], badPattern = [];
  const re = s.pattern ? new RegExp(s.pattern) : null;
  rows.forEach((r, i) => {
    const line = ext.startsWith('.json') ? i + 1 : i + 2; // CSV: header is line 1
    const v = r[c];
    if (isEmpty(v)) { if (s.required) empty.push(line); return; }
    if (s.type && !typeOk(s.type, v)) { badType.push(`${line} (${JSON.stringify(v).slice(0, 30)})`); return; }
    if (s.enum && !s.enum.map(String).includes(String(v).trim())) badEnum.push(`${line} (${JSON.stringify(v).slice(0, 30)})`);
    const n = Number(v);
    if ((s.min != null && n < s.min) || (s.max != null && n > s.max)) badRange.push(`${line} (${v})`);
    if (re && !re.test(String(v))) badPattern.push(`${line} (${JSON.stringify(v).slice(0, 30)})`);
  });
  const rowWord = ext.startsWith('.json') ? 'records' : 'rows';
  const n_ = k => `${k} row${k === 1 ? '' : 's'}`;
  if (empty.length) problems.push(`${c}: required but empty in ${n_(empty.length)} (${rowWord} ${empty.slice(0, MAX_EX).join(', ')})`);
  if (badType.length) problems.push(`${c}: not ${s.type} in ${n_(badType.length)} (${rowWord} ${badType.slice(0, MAX_EX).join(', ')})`);
  if (badEnum.length) problems.push(`${c}: not one of ${s.enum.join('|')} in ${n_(badEnum.length)} (${rowWord} ${badEnum.slice(0, MAX_EX).join(', ')})`);
  if (badRange.length) problems.push(`${c}: outside ${s.min ?? '-inf'}..${s.max ?? 'inf'} in ${n_(badRange.length)} (${rowWord} ${badRange.slice(0, MAX_EX).join(', ')})`);
  if (badPattern.length) problems.push(`${c}: does not match /${s.pattern}/ in ${n_(badPattern.length)} (${rowWord} ${badPattern.slice(0, MAX_EX).join(', ')})`);
}

console.log(`file: ${file}`);
console.log(`schema: ${schemaFile}`);
console.log(`rows: ${rows.length}, columns: ${columns.length} (${expected.length} in the schema)${ext.startsWith('.json') ? '' : '; row numbers count the header as row 1'}`);
for (const p of problems) console.log(`FAIL ${p}`);
if (problems.length) { console.log(`RESULT: FAIL ${path.basename(file)}: ${problems.length} problem${problems.length > 1 ? 's' : ''}, first: ${problems[0].slice(0, 120)}`); process.exit(1); }
console.log('RESULT: PASS');
