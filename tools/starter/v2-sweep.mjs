#!/usr/bin/env node
// The old suite under engine v2, compared by exact test name with the committed list of tests v2 still fails
// (tools/starter/reviews/v2-failing.txt). Fails when a test fails that is not on the list (a v2 regression), and when a
// listed test now passes (take it off the list in the same commit: the list only shrinks).
// Lesson (2026-11-08): the release chain ran the old suite under the old engine only, so a v2 regression in an old
// test passed the chain and shipped, three times in one day.
// usage: node tools/starter/v2-sweep.mjs [--from <selfcheck output file>] [--write]
//   --from   read an earlier run's output instead of running the suite (it takes a while)
//   --write  rewrite the list from this run; refused if it would add a name (a new failure is fixed, not listed)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIST = process.env.V2_SWEEP_LIST || path.join(ROOT, 'tools/starter/reviews/v2-failing.txt'); // (the env names another list, for its test)
const args = process.argv.slice(2), opt = k => args.includes(k) ? args[args.indexOf(k) + 1] : null;
let out;
if (opt('--from')) out = fs.readFileSync(opt('--from'), 'utf8');
else {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/hooks/selfcheck.mjs'), '--full'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, STARTER_ENGINE: 'v2' } });
  out = `${r.stdout || ''}\n${r.stderr || ''}`;
  try { fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true }); fs.writeFileSync(path.join(ROOT, '.cache/v2-sweep.txt'), out); } catch { }
}
const total = /selfcheck: \w+[^\n]*\((\d+) passed, (\d+) failed/.exec(out);
if (!total) { console.error('v2-sweep: the suite printed no total line; it did not finish'); process.exit(2); }
// (a test's name is the text between "FAIL  " and "  -> ": the detail after it changes from run to run)
const failing = [...new Set([...out.matchAll(/^FAIL  (.+?)(?:  -> |$)/gm)].map(m => m[1].trim()))].sort();
const listed = fs.existsSync(LIST) ? fs.readFileSync(LIST, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')) : [];
const have = new Set(listed), now = new Set(failing);
const newFails = failing.filter(n => !have.has(n)), fixed = listed.filter(n => !now.has(n));
if (args.includes('--write')) {
  if (listed.length && newFails.length) { console.error(`v2-sweep: refused, the list only shrinks; ${newFails.length} new failure(s):\n- ${newFails.join('\n- ')}`); process.exit(1); }
  fs.writeFileSync(LIST, `# Old-suite tests engine v2 still fails (tools/starter/v2-sweep.mjs). It only shrinks: a port takes its names off.\n${failing.join('\n')}\n`);
  console.log(`v2-sweep: wrote ${failing.length} name(s) (${total[1]} passed, ${total[2]} failed)`);
  process.exit(0);
}
if (newFails.length) console.log(`FAIL v2-sweep: ${newFails.length} test(s) fail under v2 that are not on the list (regressions):\n- ${newFails.slice(0, 40).join('\n- ')}`);
if (fixed.length) console.log(`FAIL v2-sweep: ${fixed.length} listed test(s) pass now: take them off tools/starter/reviews/v2-failing.txt in this commit (node tools/starter/v2-sweep.mjs --from .cache/v2-sweep.txt --write):\n- ${fixed.slice(0, 40).join('\n- ')}`);
console.log(`v2-sweep: ${newFails.length || fixed.length ? 'FAIL' : 'PASS'} (${total[1]} passed, ${total[2]} failed; ${listed.length} on the list)`);
process.exit(newFails.length || fixed.length ? 1 : 0);
