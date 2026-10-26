#!/usr/bin/env node
// Starter-only. Repeated work in a trial's sessions (main and helpers), the waste the user fears most: steps done
// again that didn't need to happen again.
//   reread: the same file (and range) read again with no write to it since, and no command naming it since
//   rerun:  the same command run again with no file written since (reads, listings and the hook's own commands aside)
// A new user turn starts fresh: reading a file again a turn later is fair. compare.mjs counts these per turn, and a
// round with more of them than the one it is compared with is WORSE.
//   node tools/starter/trials/repeats.mjs <round> [project]   lists them
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const PROJECTS = process.env.ANZUELO_TRANSCRIPTS_DIR || path.join(os.homedir(), '.claude', 'projects');
const findTranscript = sid => { try { for (const d of fs.readdirSync(PROJECTS)) { const f = path.join(PROJECTS, d, `${sid}.jsonl`); if (fs.existsSync(f)) return f; } } catch { } return null; };
const norm = p => String(p || '').replace(/\\/g, '/').replace(/^.*?anzuelo-new\/[^/]+\//, '');
const cmdKey = c => String(c).replace(/^\s*cd\s+("[^"]+"|\S+)\s*&&\s*/, '').replace(/\s*2>&1/g, '').replace(/\s*\|\s*(tail|head)\b[^|;&]*$/, '').replace(/\s+/g, ' ').trim();
const LOOK = /^(cat|ls|head|tail|grep|echo|printf|wc|find|git (status|diff|log|show))\b|hooks\.mjs\s+(check|waive|begin|why)\b/;

// The repeats in one transcript's rows: [{ kind, what }]
export function repeatsIn(rows) {
  const out = [], reads = new Set(), cmds = new Set();
  for (const r of rows) {
    if (r.type === 'user' && typeof r.message?.content === 'string') { reads.clear(); cmds.clear(); }
    if (r.type !== 'assistant') continue;
    for (const c of Array.isArray(r.message?.content) ? r.message.content : []) {
      if (c?.type !== 'tool_use') continue;
      const inp = c.input || {};
      if (c.name === 'Read') { const k = norm(inp.file_path) + (inp.offset ? `@${inp.offset}` : ''); if (reads.has(k)) out.push({ kind: 'reread', what: k }); reads.add(k); }
      else if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(c.name)) { const p = norm(inp.file_path || inp.notebook_path); for (const k of [...reads]) if (k.split('@')[0] === p) reads.delete(k); cmds.clear(); }
      else if (/^(Bash|PowerShell)$/.test(c.name)) {
        const k = cmdKey(inp.command || '');
        for (const rk of [...reads]) { const base = rk.split('@')[0].split('/').pop(); if (base && k.includes(base)) reads.delete(rk); }
        if (LOOK.test(k)) continue;
        if (cmds.has(k)) out.push({ kind: 'rerun', what: k.slice(0, 120) });
        cmds.add(k);
      }
    }
  }
  return out;
}
// Every repeat in a trial record's sessions (each transcript once), or null when no transcript is found.
export function repeatsOf(record) {
  const seen = new Set(), out = [];
  for (const t of record?.turns || []) {
    const main = t?.sid && findTranscript(t.sid);
    if (!main) continue;
    const sub = path.join(path.dirname(main), t.sid, 'subagents');
    let helpers = []; try { helpers = fs.readdirSync(sub).filter(f => f.endsWith('.jsonl')).map(f => path.join(sub, f)); } catch { }
    for (const f of [main, ...helpers]) {
      if (seen.has(f)) continue; seen.add(f);
      const rows = fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      out.push(...repeatsIn(rows));
    }
  }
  return seen.size ? out : null;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [round, only] = process.argv.slice(2);
  if (!round) { console.log('usage: node tools/starter/trials/repeats.mjs <round> [project]'); process.exit(2); }
  const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '.cache', 'trials', `results-${round}`);
  let total = 0;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (only && r.id !== only) continue;
    const rep = repeatsOf(r) || [];
    total += rep.length;
    console.log(`${r.id}: ${rep.length} repeat(s) over ${(r.turns || []).length} turns`);
    for (const x of rep) console.log(`  ${x.kind}: ${x.what}`);
  }
  console.log(`total: ${total}`);
}
