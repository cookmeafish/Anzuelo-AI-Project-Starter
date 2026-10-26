#!/usr/bin/env node
// Starter-only. The tool calls of a round's work turns in one attribute.mjs category, one line each, to see what the
// starter adds.   node tools/starter/trials/steplist.mjs <round> <category> [--from-turn 2]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { category } from './attribute.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [round, want] = process.argv.slice(2);
const P = path.join(os.homedir(), '.claude', 'projects');
const findT = sid => { for (const d of fs.readdirSync(P)) { const f = path.join(P, d, `${sid}.jsonl`); if (fs.existsSync(f)) return f; } return null; };
const dir = path.join(HERE, '..', '..', '..', '.cache', 'trials', `results-${round}`);
const short = s => String(s || '').replace(/\\/g, '/').replace(/^.*?anzuelo-new\/[^/]+\//, '').replace(/^cd "[^"]+" && /, '').replace(/\s+/g, ' ').slice(0, 120);
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  rec.turns.forEach((t, ti) => {
    if (ti === 0) return;
    const file = t.sid && findT(t.sid); if (!file) return;
    const rows = fs.readFileSync(file, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    const isP = (r, p) => r.type === 'user' && typeof r.message?.content === 'string' && p && r.message.content.trim() === String(p).trim();
    let s = -1; rows.forEach((r, i) => { if (isP(r, t.prompt)) s = i; });
    let e = rows.length; for (let i = s + 1; i < rows.length; i++) if (isP(rows[i], rec.turns[ti + 1]?.prompt)) { e = i; break; }
    if (s < 0) return;
    for (const r of rows.slice(s, e)) if (r.type === 'assistant') for (const c of r.message?.content || []) {
      if (c.type !== 'tool_use' || category(c.name, c.input || {}) !== want) continue;
      const i = c.input || {};
      console.log(`${rec.id} t${ti + 1}: ${c.name} ${short(i.command || i.file_path || i.pattern)}`);
    }
  });
}
