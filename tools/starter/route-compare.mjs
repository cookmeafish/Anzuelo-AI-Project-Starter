#!/usr/bin/env node
// Routing on real prompts: the runbook v1 routed each typed request to (from its recorded prompt hint) against the one
// v2's start hook picks. Read-only. --list prints every disagreement for hand labeling.
// usage: node tools/starter/route-compare.mjs <project folder> <transcript folder> [--since YYYY-MM-DD] [--list]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), [project, tdir] = args;
const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '2000';
process.env.ANZUELO_ROOT = path.resolve(project);
const { route, typed } = await import('../hooks/v2/lib.mjs');
const c = { both: 0, same: 0, differ: 0, v1only: 0, v2only: 0, none: 0 }, list = [];
for (const f of fs.readdirSync(tdir).filter(f => f.endsWith('.jsonl')).map(f => path.join(tdir, f))) {
  const rows = fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  rows.forEach((r, i) => {
    if (!typed(r) || r.timestamp < since) return;
    // v1's hint for this prompt: the prompt hook's context recorded right after it
    let v1 = null;
    for (const r2 of rows.slice(i + 1, i + 12)) {
      const a = r2.attachment;
      if (a?.hookEvent === 'UserPromptSubmit' && a.type === 'hook_additional_context') { v1 = /ROUTE: ([\w-]+)/.exec(typeof a.content === 'string' ? a.content : JSON.stringify(a.content))?.[1] || null; break; }
    }
    const v2 = route(r.message.content)?.name || null, p = r.message.content.replace(/\s+/g, ' ').slice(0, 90);
    if (v1 && v2) { c.both++; if (v1 === v2) c.same++; else { c.differ++; list.push(`differ  v1=${v1} v2=${v2}  "${p}"`); } }
    else if (v1) { c.v1only++; list.push(`v1 only v1=${v1}  "${p}"`); }
    else if (v2) { c.v2only++; list.push(`v2 only v2=${v2}  "${p}"`); }
    else c.none++;
  });
}
console.log(`both routed ${c.both} (same ${c.same}, different ${c.differ}) | only v1 ${c.v1only} | only v2 ${c.v2only} | neither ${c.none}`);
if (args.includes('--list')) console.log(list.join('\n'));
