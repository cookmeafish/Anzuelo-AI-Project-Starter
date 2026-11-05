#!/usr/bin/env node
// Did a Stop block find a real problem? After each block, the check or test runs the agent made: if one failed (and a
// later run passed), the block found something; if every run passed at once, it only confirmed work that was fine.
// Read-only. usage: node tools/starter/stop-found.mjs <transcript folder> [--since YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), dir = args[0], since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '2000';
const RUN = /\b(test|tests|pytest|selfcheck|audit|check|verify|build|lint)\b|test_\w+\.py|\.test\./i;
const FAILED = /\b[1-9]\d* (tests? |checks? )?(failed|failing)\b|\bFAIL(ED)?\b|Traceback|\bError:|not ok\b|exit code [1-9]/;
let blocks = 0, withRun = 0, found = 0, confirmed = 0;
const kinds = new Map(), bump = (k, f) => { const e = kinds.get(k) || { runs: 0, found: 0 }; e.runs++; if (f) e.found++; kinds.set(k, e); };
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')).map(f => path.join(dir, f))) {
  const rows = fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(r => r && r.timestamp >= since);
  rows.forEach((r, i) => {
    const a = r.attachment;
    if (!a || a.type !== 'hook_additional_context' || a.hookEvent !== 'Stop') return;
    const t = (typeof a.content === 'string' ? a.content : JSON.stringify(a.content)).replace(/\\n/g, '\n');
    const asked = /complete \(round \d of \d\)\.\s*([\s\S]*?)\s*For the agent:/.exec(t)?.[1];
    if (!asked) return;
    blocks++;
    const ids = new Map(), outs = [];
    for (const r2 of rows.slice(i + 1)) {
      if (r2.attachment?.hookEvent === 'Stop' || (r2.type === 'user' && typeof r2.message?.content === 'string' && !r2.isMeta)) break;
      for (const x of Array.isArray(r2.message?.content) ? r2.message.content : []) {
        if (x.type === 'tool_use' && /^(Bash|PowerShell)$/.test(x.name) && RUN.test(String(x.input?.command || ''))) ids.set(x.id, true);
        if (x.type === 'tool_result' && ids.has(x.tool_use_id)) outs.push((typeof x.content === 'string' ? x.content : JSON.stringify(x.content)).slice(-3000) + (x.is_error ? ' exit code 1' : ''));
      }
    }
    if (!outs.length) return;
    withRun++;
    const fail = outs.some(o => FAILED.test(o));
    if (fail) found++; else confirmed++;
    for (const s of asked.split(/\s(?=\d+\.\s)/)) bump(s.replace(/^\d+\.\s*/, '').replace(/\s+/g, ' ').replace(/\d+/g, 'N').slice(0, 70), fail);
  });
}
console.log(`${blocks} Stop blocks; ${withRun} were followed by a check or test run: in ${found} a run failed (a problem found), in ${confirmed} every run passed (nothing found)`);
for (const [k, e] of [...kinds].sort((a, b) => b[1].runs - a[1].runs).slice(0, 25)) console.log(String(e.runs).padStart(4), String(e.found).padStart(4), k);
