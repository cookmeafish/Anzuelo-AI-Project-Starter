#!/usr/bin/env node
// Starter-only. Which runbooks, skills and check docs a round's work turns opened, how often and how much text each
// added to the context (every later request carries it):  node tools/starter/trials/reads.mjs <round> [--turns 2-]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const round = process.argv[2];
const ti = process.argv.indexOf('--turns'), from = ti > 0 ? parseInt(process.argv[ti + 1], 10) || 1 : 2;
if (!round) { console.error('usage: reads.mjs <round> [--turns 2-]'); process.exit(1); }
const root = path.join(os.homedir(), '.claude', 'projects');
const rowsOf = sid => { for (const d of fs.readdirSync(root)) { const f = path.join(root, d, `${sid}.jsonl`); if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } return []; };
const DOC = /docs\/playbooks\/|SKILL\.md|docs\/checks\/|AGENTS\.md|CLAUDE\.md|docs\/foundation\.md|DIRECTORY\.md|SETUP-PROMPT\.md/;
const cnt = {};
const dir = path.join(TRIALS, `results-${round}`);
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const p = String(j.turns[from - 1]?.prompt || '').slice(0, 30), sid = j.turns[from - 1]?.sid;
  if (!sid || !p) continue;
  const rows = rowsOf(sid), s = rows.findIndex(r => r.type === 'user' && typeof r.message?.content === 'string' && r.message.content.startsWith(p));
  if (s < 0) continue;
  const res = new Map();
  for (const r of rows.slice(s)) for (const c of Array.isArray(r.message?.content) ? r.message.content : []) if (c?.type === 'tool_result') res.set(c.tool_use_id, JSON.stringify(c.content ?? '').length);
  for (const r of rows.slice(s)) for (const c of Array.isArray(r.message?.content) ? r.message.content : []) {
    if (c?.type !== 'tool_use' || c.name !== 'Read') continue;
    const fp = String(c.input?.file_path || '').split(path.sep).join('/').replace(/\\/g, '/').replace(/^.*?anzuelo-new\/[^/]+\//, '');
    if (!DOC.test(fp)) continue;
    const e = cnt[fp] ||= { n: 0, chars: 0 }; e.n++; e.chars += res.get(c.id) || 0;
  }
}
const list = Object.entries(cnt).sort((a, b) => b[1].chars - a[1].chars);
console.log(`reads: round ${round}, turns ${from}+: ${list.reduce((s, [, e]) => s + e.n, 0)} reads of runbooks, skills and check docs, ${Math.round(list.reduce((s, [, e]) => s + e.chars, 0) / 1000)}k chars`);
for (const [k, e] of list.slice(0, 20)) console.log(`  ${String(e.n).padStart(3)}x ${String(Math.round(e.chars / 1000)).padStart(4)}k  ${k}`);
