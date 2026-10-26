#!/usr/bin/env node
// Checks MCP tool definitions for the problems an agent trips over: missing or thin descriptions, undescribed inputs,
// names without a verb or a shared prefix, and missing behavior annotations.
//   node skills/mcp-builder/scripts/lint-tools.mjs <tools.json> [--prefix name]
// <tools.json> is a saved tools/list result: { "tools": [...] }, a JSON-RPC response with result.tools, or a bare array.
// Read-only: it reads that one file and prints. Exit 0 = clean, 1 = problems found, 2 = bad usage or unreadable file.
import fs from 'node:fs';

const args = process.argv.slice(2);
const pi = args.indexOf('--prefix');
const wantPrefix = pi >= 0 ? args.splice(pi, 2)[1] : null;
const file = args[0];
if (!file) { console.error('usage: node skills/mcp-builder/scripts/lint-tools.mjs <tools.json> [--prefix name]'); process.exit(2); }

let tools;
try {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  tools = Array.isArray(data) ? data : data.tools || data.result?.tools;
  if (!Array.isArray(tools)) throw new Error('no tools array found');
} catch (e) { console.error(`cannot read ${file}: ${e.message}`); process.exit(2); }

const VERBS = new Set(('get list search find fetch read query lookup look count describe show check validate ' +
  'create add insert new make post send submit upload import write save set put update edit change rename move ' +
  'merge patch delete remove archive cancel void close open start stop run execute trigger restart retry ' +
  'approve reject assign link unlink convert translate summarize analyze compare export download generate ' +
  'sync refresh resolve schedule publish subscribe unsubscribe enable disable test ping').split(' '));
const problems = [];
const say = (tool, msg) => problems.push(`${tool}: ${msg}`);
const words = n => n.split(/[_\-.]|(?<=[a-z])(?=[A-Z])/).filter(Boolean).map(w => w.toLowerCase());

const names = tools.map(t => t.name || '');
const seen = new Set();
for (const n of names) { if (seen.has(n)) say(n, 'duplicate tool name'); seen.add(n); }

// a shared prefix: the first word most names start with
const firsts = names.map(n => words(n)[0]).filter(Boolean);
const tally = {}; for (const f of firsts) tally[f] = (tally[f] || 0) + 1;
const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
const common = wantPrefix ? wantPrefix.toLowerCase() : top && top[1] === firsts.length && firsts.length > 1 ? top[0] : null;
const usesPrefix = common && !VERBS.has(common);
const styles = new Set(names.map(n => n.includes('_') ? 'snake' : n.includes('-') ? 'kebab' : /[A-Z]/.test(n) ? 'camel' : 'plain'));
if (styles.size > 1) problems.push(`(all): names mix styles (${[...styles].join(', ')}); pick one`);

for (const t of tools) {
  const n = t.name || '(no name)';
  if (!t.name) say(n, 'missing name');
  const w = words(t.name || '');
  const rest = usesPrefix && w[0] === common ? w.slice(1) : w;
  if (!rest.length || !VERBS.has(rest[0])) say(n, `name should start with a verb${usesPrefix ? ` after the "${common}" prefix` : ''}`);
  if (wantPrefix && w[0] !== wantPrefix.toLowerCase()) say(n, `name lacks the "${wantPrefix}" prefix`);
  if (!wantPrefix && tools.length > 1 && !usesPrefix) { say(n, 'no shared service prefix across tools (helps next to other servers)'); }

  const d = (t.description || '').trim();
  if (!d) say(n, 'missing description');
  else if (d.split(/\s+/).length < 8) say(n, `description is very short (${d.split(/\s+/).length} words): say when to use it and what it returns`);

  const props = t.inputSchema?.properties || {};
  const required = new Set(t.inputSchema?.required || []);
  if (!t.inputSchema) say(n, 'missing inputSchema');
  for (const [p, s] of Object.entries(props)) {
    if (!s || typeof s !== 'object') continue;
    if (!s.description) say(n, `input "${p}" has no description`);
    if (!s.type && !s.enum && !s.anyOf && !s.oneOf && !s.$ref) say(n, `input "${p}" has no type`);
    if (s.type === 'string' && !s.enum && !s.maxLength && !s.format && !s.pattern && /^(kind|type|mode|status|format|order|sort)$/i.test(p))
      say(n, `input "${p}" looks like a fixed set of choices: use an enum`);
    if ((s.type === 'integer' || s.type === 'number') && /limit|count|size|max|page/i.test(p) && s.maximum === undefined)
      say(n, `input "${p}" has no maximum`);
  }
  for (const r of required) if (!(r in props)) say(n, `required input "${r}" is not defined`);

  const a = t.annotations || {};
  const missing = ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint'].filter(k => a[k] === undefined);
  if (missing.length) say(n, `annotations not set: ${missing.join(', ')} (the defaults assume the worst)`);
  if (a.readOnlyHint === false && a.destructiveHint !== false && d && !/delet|remov|overwrit|destroy|permanent|cannot be undone|irreversib/i.test(d))
    say(n, 'may be destructive but the description does not say so');
}

if (!usesPrefix && !wantPrefix && tools.length > 1) {
  // collapse the per-tool prefix notes into one line
  const kept = problems.filter(p => !p.endsWith('no shared service prefix across tools (helps next to other servers)'));
  kept.push('(all): no shared service prefix across tools (helps next to other servers)');
  problems.length = 0; problems.push(...kept);
}

for (const p of problems) console.log('PROBLEM ' + p);
console.log(problems.length ? `LINT: ${problems.length} problem(s) in ${tools.length} tool(s)` : `LINT: PASS (${tools.length} tool(s))`);
process.exit(problems.length ? 1 : 0);
