#!/usr/bin/env node
// Keep Jupyter notebooks free of outputs and secrets before they are committed. Zero dependencies.
//   node nb-strip.mjs --check <file.ipynb|folder>...   report only; ends with RESULT: PASS or RESULT: FAIL <why>
//   node nb-strip.mjs <file.ipynb|folder>...           clear outputs and execution counts in place, then check again
// A folder is searched for .ipynb files (checkpoints, node_modules and .git are skipped).
// Strip mode changes only outputs, execution counts and widget state; cell sources are never touched.
// Secrets found in cell sources are reported in both modes and must be removed by hand (keys belong in env vars).
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const targets = args.filter(a => !a.startsWith('--'));
if (!targets.length) { console.error('usage: node nb-strip.mjs [--check] <file.ipynb|folder>...'); process.exit(2); }

const SKIP = /^(\.ipynb_checkpoints|node_modules|\.git|\.venv|venv)$/;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (SKIP.test(e.name) ? [] : walk(path.join(d, e.name))) : /\.ipynb$/i.test(e.name) ? [path.join(d, e.name)] : []);
// Patterns that look like real credentials. A placeholder such as "<your key>" or os.environ[...] does not match.
const SECRETS = [
  [/\b(sk-[A-Za-z0-9_-]{20,})/, 'API key (sk-...)'],
  [/\b(AKIA[0-9A-Z]{16})\b/, 'AWS access key'],
  [/\b(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/, 'GitHub token'],
  [/\b(hf_[A-Za-z0-9]{30,})/, 'Hugging Face token'],
  [/\b(AIza[0-9A-Za-z_-]{35})/, 'Google API key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\b(api[_-]?key|secret|token|password|passwd)\s*[:=]\s*["'][^"'\s<>{}]{12,}["']/i, 'hard-coded credential'],
];

const files = [];
for (const t of targets) {
  if (!fs.existsSync(t)) { console.log(`missing: ${t}`); files.push({ missing: t }); continue; }
  if (fs.statSync(t).isDirectory()) files.push(...walk(t)); else files.push(t);
}

let bad = 0;
const reasons = new Set();
for (const f of files) {
  if (f.missing) { bad++; reasons.add('missing file'); continue; }
  let nb;
  try { nb = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`${f}: not valid notebook JSON (${e.message})`); bad++; reasons.add('unreadable notebook'); continue; }
  const cells = Array.isArray(nb.cells) ? nb.cells : [];
  let outputs = 0, counts = 0;
  const secrets = [];
  cells.forEach((c, i) => {
    if (Array.isArray(c.outputs) && c.outputs.length) outputs++;
    if (c.execution_count != null) counts++;
    const src = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
    for (const [re, what] of SECRETS) if (re.test(src)) secrets.push(`cell ${i + 1}: ${what}`);
  });
  const widgets = !!nb.metadata?.widgets;
  if (!check && (outputs || counts || widgets)) {
    for (const c of cells) {
      if (c.cell_type === 'code') { c.outputs = []; c.execution_count = null; }
    }
    if (widgets) delete nb.metadata.widgets;
    fs.writeFileSync(f, JSON.stringify(nb, null, 1) + '\n'); // Jupyter's own layout: one-space indent, trailing newline
    console.log(`stripped ${f}: ${outputs} cell(s) with output, ${counts} execution count(s)${widgets ? ', widget state' : ''}`);
    outputs = counts = 0;
  }
  const probs = [];
  if (outputs) probs.push(`${outputs} cell(s) with output`);
  if (counts) probs.push(`${counts} execution count(s)`);
  if (widgets && check) probs.push('widget state in metadata');
  for (const s of secrets) probs.push(`possible secret, ${s}`);
  if (probs.length) {
    bad++;
    console.log(`${f}: ${probs.join('; ')}`);
    if (outputs || counts || (widgets && check)) reasons.add('outputs not cleared');
    if (secrets.length) reasons.add('possible secret in a cell');
  }
}
console.log(`checked ${files.length} notebook(s)`);
console.log(bad ? `RESULT: FAIL ${[...reasons].join(', ')}` : 'RESULT: PASS');
process.exit(bad ? 1 : 0);
