#!/usr/bin/env node
// Coverage of the runbooks' "Done when" items for engine v2: per runbook, how many items the end check can check
// (a trailing "(file: ...)", "(ran: ...)" or "(answer: ...)" marker) against the ones it can't (only "(hook: tag)", which
// v1 checks, or only "(judgment: ...)"). Read-only. --list prints every unchecked item.
// usage: node tools/starter/done-when-coverage.mjs [project folder] [--list]
import path from 'node:path';

const args = process.argv.slice(2), project = args.find(a => !a.startsWith('--')) || '.';
process.env.ANZUELO_ROOT = path.resolve(project);
const { runbooks } = await import('../hooks/v2/lib.mjs');
const fs = await import('node:fs');
let all = 0, checked = 0;
for (const b of runbooks()) {
  if (!b.items.length) continue;
  const raw = fs.readFileSync(path.join(process.env.ANZUELO_ROOT, b.file), 'utf8');
  const c = b.items.filter(i => i.kind).length;
  all += b.items.length; checked += c;
  console.log(`${String(c).padStart(3)} of ${String(b.items.length).padEnd(3)} ${b.file}`);
  if (args.includes('--list')) for (const i of b.items.filter(i => !i.kind)) {
    const line = raw.split('\n').find(l => l.includes(i.text.slice(0, 30))) || '';
    console.log(`      ${i.n}. ${i.text.slice(0, 110)}  [${/\(hooks?:/.test(line) ? 'hook' : /judg/.test(line) ? 'judgment' : 'none'}]`);
  }
}
console.log(`total: ${checked} of ${all} items checkable by v2`);
