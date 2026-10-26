#!/usr/bin/env node
// Starter-only. Where a round's time goes: each tool call of each trial session is engine work (the starter's checks,
// audits, self-tests, runbooks, skill files, notes the checks read) or the user's work, with the seconds until the next
// step and the size of its result (what it adds to the context, so to every later request).
//   node tools/starter/trials/overhead.mjs <round> [--turns 2-]     (--turns 2- skips setup; --turns 1 is setup only)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const round = process.argv[2];
const ti = process.argv.indexOf('--turns'), spec = ti > 0 ? String(process.argv[ti + 1] || '') : '';
const from = parseInt(spec, 10) || 1, upto = /-\d+$/.test(spec) ? parseInt(spec.split('-')[1], 10) : spec && !spec.includes('-') ? from : Infinity;
if (!round) { console.error('usage: overhead.mjs <round> [--turns 2-]'); process.exit(1); }
const ENGINE = [
  ['check', /hooks\.mjs\s+(check|begin|why|waive|last)\b/],
  ['audit', /\baudit\.mjs\b/],
  ['selfcheck', /selfcheck\.mjs|project-scenarios|\bfit\.mjs\b/],
  ['starter cmd', /\bstarter\.mjs\b|new-project\.mjs|plan-tasks\.mjs|\bdedupe\.mjs\b|risky-patterns/],
  ['runbook/skill read', /docs\/playbooks\/|skills\/[^/]+\/(SKILL\.md|[^"]*\.md)|docs\/checks\/|AGENTS\.md|CLAUDE\.md|SETUP-PROMPT\.md|docs\/foundation\.md|docs\/fit-checklist\.md/],
  ['engine notes', /\.cache\/(turn-notes|answer|stop-details)|tools\/hooks\/(requirements\.json|config\.json|hooks\.mjs|state\/)/],
];
const root = path.join(os.homedir(), '.claude', 'projects');
const rowsOf = sid => { for (const d of fs.readdirSync(root)) { const f = path.join(root, d, `${sid}.jsonl`); if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } return []; };
const dir = path.join(TRIALS, `results-${round}`);
const agg = {}; let totalSec = 0, totalCalls = 0, totalChars = 0;
const add = (k, sec, chars) => { const a = agg[k] ||= { calls: 0, sec: 0, chars: 0 }; a.calls++; a.sec += sec; a.chars += chars; totalSec += sec; totalCalls++; totalChars += chars; };
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const sids = [...new Set((j.turns || []).map(t => t.sid).filter(Boolean))];
  const rows = sids.flatMap(rowsOf);
  // turn boundaries: the prompts the trial sent, in order
  const prompts = (j.turns || []).map(t => String(t.prompt || '').slice(0, 40));
  let turn = 0;
  const results = new Map();
  for (const r of rows) for (const c of Array.isArray(r.message?.content) ? r.message.content : []) if (c?.type === 'tool_result') results.set(c.tool_use_id, { at: Date.parse(r.timestamp || ''), chars: JSON.stringify(c.content ?? '').length });
  for (const r of rows) {
    if (r.type === 'user' && typeof r.message?.content === 'string' && prompts.some(p => p && r.message.content.startsWith(p))) turn++;
    if (turn < from || turn > upto || r.type !== 'assistant' || !Array.isArray(r.message?.content)) continue;
    for (const c of r.message.content) {
      if (c?.type !== 'tool_use') continue;
      const res = results.get(c.id), at = Date.parse(r.timestamp || '');
      const sec = res && res.at && at ? Math.max(0, Math.min(1800, (res.at - at) / 1000)) : 0;
      const txt = `${c.name} ${JSON.stringify(c.input || {})}`.replace(/\\\\/g, '/').replace(/\\/g, '/');
      const kind = (ENGINE.find(([, re]) => re.test(txt)) || [])[0];
      add(kind ? `engine: ${kind}` : `work: ${c.name}`, sec, res?.chars || 0);
    }
  }
}
const pct = (x, t) => t ? `${Math.round(100 * x / t)}%` : '-';
const keys = Object.keys(agg).sort((x, y) => agg[y].sec - agg[x].sec);
console.log(`overhead: round ${round}${from > 1 ? `, turns ${from}+` : ''}: ${totalCalls} tool calls, ${Math.round(totalSec / 60)} min in tools, ${Math.round(totalChars / 1000)}k chars of results`);
for (const k of keys) console.log(`  ${k.padEnd(28)} calls ${String(agg[k].calls).padStart(4)} (${pct(agg[k].calls, totalCalls).padStart(4)})  time ${String(Math.round(agg[k].sec)).padStart(5)} s (${pct(agg[k].sec, totalSec).padStart(4)})  results ${String(Math.round(agg[k].chars / 1000)).padStart(4)}k (${pct(agg[k].chars, totalChars)})`);
const eng = keys.filter(k => k.startsWith('engine')).reduce((s, k) => ({ calls: s.calls + agg[k].calls, sec: s.sec + agg[k].sec, chars: s.chars + agg[k].chars }), { calls: 0, sec: 0, chars: 0 });
console.log(`engine total: ${pct(eng.calls, totalCalls)} of calls, ${pct(eng.sec, totalSec)} of tool time, ${pct(eng.chars, totalChars)} of result text`);
