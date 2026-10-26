#!/usr/bin/env node
// Starter-only. One trial turn, step by step: each tool call (shortened) and each text the agent wrote, to see which
// steps the starter caused.   node tools/starter/trials/steps.mjs <round> <project> <turn number>
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const [round, id, n] = process.argv.slice(2);
if (!round || !id || !n) { console.error('usage: steps.mjs <round> <project> <turn number>'); process.exit(1); }
const j = JSON.parse(fs.readFileSync(path.join(TRIALS, `results-${round}`, `${id}.json`), 'utf8'));
const t = j.turns[Number(n) - 1], next = j.turns[Number(n)];
const root = path.join(os.homedir(), '.claude', 'projects');
let rows = [];
for (const d of fs.readdirSync(root)) { const f = path.join(root, d, `${t.sid}.jsonl`); if (fs.existsSync(f)) { rows = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); break; } }
const starts = p => rows.findIndex(r => r.type === 'user' && typeof r.message?.content === 'string' && r.message.content.startsWith(String(p || '').slice(0, 30)));
const s = starts(t.prompt), e = next && next.sid === t.sid ? starts(next.prompt) : rows.length;
console.log(`PROMPT: ${String(t.prompt).slice(0, 160)}`);
for (const r of rows.slice(s + 1, e < 0 ? rows.length : e)) {
  const c = r.message?.content;
  if (r.type !== 'assistant' || !Array.isArray(c)) continue;
  for (const x of c) {
    if (x.type === 'tool_use') { const i = x.input || {}; console.log(`  ${x.name} ${String(i.command || i.file_path || i.skill || i.pattern || i.prompt || '').split(path.sep).join('/').replace(/\\/g, '/').replace(/^.*?anzuelo-new\/[^/]+\//, '').replace(/\s+/g, ' ').slice(0, 140)}`); }
    else if (x.type === 'text' && x.text.trim()) console.log(`  [text] ${x.text.replace(/\s+/g, ' ').slice(0, 100)}`);
  }
}
