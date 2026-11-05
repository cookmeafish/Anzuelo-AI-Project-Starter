#!/usr/bin/env node
// What the Stop check was worth on real sessions: every step it asked for, and what the agent did next before its next
// answer - real work (an edit outside the notes, a test or build run) or only notes, waivers and a resent answer. Read-only.
// usage: node tools/starter/stop-value.mjs <transcript folder> [--since YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), dir = args[0], since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '2000';
if (!dir || !fs.existsSync(dir)) { console.error('usage: node tools/starter/stop-value.mjs <transcript folder> [--since YYYY-MM-DD]'); process.exit(2); }
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).map(f => path.join(dir, f));
const NOTES = /turn-notes|hooks\.mjs\s+waive|answer\.md/;
const steps = new Map(), bump = (k, real) => { const e = steps.get(k) || { asked: 0, real: 0 }; e.asked++; if (real) e.real++; steps.set(k, e); };
let blocks = 0, realBlocks = 0;
for (const f of files) {
  const rows = fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(r => r && r.timestamp >= since);
  rows.forEach((r, i) => {
    const a = r.attachment;
    if (!a || a.type !== 'hook_additional_context' || a.hookEvent !== 'Stop') return;
    const t = typeof a.content === 'string' ? a.content : JSON.stringify(a.content);
    const m = /left before this answer is complete \(round \d of \d\)\.\s*([\s\S]*?)\s*For the agent:/.exec(t.replace(/\\n/g, '\n'));
    if (!m) return;
    const asked = m[1].split(/\s(?=\d+\.\s)/).map(s => s.replace(/^\d+\.\s*/, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    // what the agent did until its next answer
    let real = false;
    for (let j = i + 1; j < rows.length; j++) {
      const c = rows[j].message?.content;
      if (rows[j].type === 'user' && typeof c === 'string' && !rows[j].isMeta) break;
      for (const x of Array.isArray(c) ? c : []) {
        if (x.type !== 'tool_use') continue;
        const p = String(x.input?.file_path || ''), cmd = String(x.input?.command || '');
        if (/^(Edit|Write|MultiEdit)$/.test(x.name) && !NOTES.test(p)) real = true;
        if (/^(Bash|PowerShell)$/.test(x.name) && cmd && !NOTES.test(cmd) && /\b(test|pytest|npm|node|python|git (add|commit)|build|check|audit)\b/.test(cmd)) real = true;
      }
      if (rows[j].attachment?.hookEvent === 'Stop' && rows[j].attachment?.type === 'hook_additional_context') break;
    }
    blocks++; if (real) realBlocks++;
    for (const s of asked) bump(s.replace(/[0-9a-f]{7,}|\d+/g, 'N').slice(0, 90), real);
  });
}
console.log(`${blocks} Stop blocks; after ${realBlocks} the agent did real work (an edit outside the notes, or a run), after ${blocks - realBlocks} only notes, waivers or a resent answer`);
for (const [k, e] of [...steps].sort((a, b) => b[1].asked - a[1].asked)) console.log(String(e.asked).padStart(4), String(e.real).padStart(4), k);
