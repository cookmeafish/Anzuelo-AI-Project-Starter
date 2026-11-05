#!/usr/bin/env node
// Recall of real misses: on each real turn where v1's Stop asked for something and the agent then did real work, does
// v2's end check ask for the same kind of thing? Read-only. Prints X of N per kind.
// usage: node tools/starter/v2-recall.mjs <project folder> <transcript folder> [--since YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2), [project, tdir] = args;
const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '2000';
process.env.ANZUELO_ROOT = path.resolve(project);
const { reminder } = await import('../hooks/v2/start.mjs');
const { missing } = await import('../hooks/v2/end.mjs');
const { turnActs, testGaps, runbooks, typed } = await import('../hooks/v2/lib.mjs');
const books = runbooks();
// The turn as it stood at the agent's first attempt to finish: up to the first Stop hook run. Later rows hold the fixes
// the old engine's block forced, so judging the whole turn would see a turn already repaired.
const firstTry = slice => { const k = slice.findIndex(r => /^Stop$/.test(r.attachment?.hookEvent || '')); return k < 0 ? slice : slice.slice(0, k); };

const KINDS = [
  ['tests', /run the (tests|build)|health check|self-tests|until (it|they) pass|tests? passed/i],
  ['runbook', /open (the matching runbook|[\w/.-]+\.md)|checklist|\bitem \d|leave a runbook|runbook .* followed/i],
  ['claim', /claim in it is not backed|did you make that up|says nothing like it|correct the answer/i],
  ['security', /security review/i],
  ['screens', /screenshot|visual review|accessibility/i],
  ['knowledge', /knowledge base|used the web in a knowledge/i],
  ['lesson', /learn from what upset|lesson/i],
  ['plan', /\bplan\b/i],
  ['records', /changelog|status\.md|decisions/i],
];
const kindsOf = text => KINDS.filter(([, rx]) => rx.test(text)).map(([k]) => k);
const NOTES = /turn-notes|hooks\.mjs\s+waive|answer\.md/;
const tally = new Map(), add = (k, hit) => { const e = tally.get(k) || { n: 0, x: 0 }; e.n++; if (hit) e.x++; tally.set(k, e); };
for (const f of fs.readdirSync(tdir).filter(f => f.endsWith('.jsonl')).map(f => path.join(tdir, f))) {
  const rows = fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const starts = rows.map((r, i) => typed(r) && r.timestamp >= since ? i : -1).filter(i => i >= 0);
  starts.forEach((s, k) => {
    const slice = rows.slice(s, starts[k + 1] ?? rows.length);
    // v1's asks in this turn that were followed by real work
    const real = new Set();
    slice.forEach((r, i) => {
      const a = r.attachment;
      if (!a || a.type !== 'hook_additional_context' || a.hookEvent !== 'Stop') return;
      const t = (typeof a.content === 'string' ? a.content : JSON.stringify(a.content)).replace(/\\n/g, '\n');
      const asked = /complete \(round \d of \d\)\.\s*([\s\S]*?)\s*For the agent:/.exec(t)?.[1] || '';
      let work = false;
      for (const r2 of slice.slice(i + 1)) {
        if (r2.attachment?.hookEvent === 'Stop' && r2.attachment?.type === 'hook_additional_context') break;
        for (const x of Array.isArray(r2.message?.content) ? r2.message.content : []) if (x.type === 'tool_use') {
          const p = String(x.input?.file_path || ''), cmd = String(x.input?.command || '');
          if (/^(Edit|Write|MultiEdit)$/.test(x.name) && !NOTES.test(p)) work = true;
          if (/^(Bash|PowerShell)$/.test(x.name) && cmd && !NOTES.test(cmd)) work = true;
        }
      }
      if (work) for (const kd of kindsOf(asked)) { real.add(kd); (real.why ||= {})[kd] = asked; }
    });
    if (!real.size) return;
    const r = reminder(rows[s].message.content), acts = turnActs(firstTry(slice));
    const v2list = [...missing({ runbook: r.book?.file || null }, acts, books), ...testGaps(acts)], v2 = new Set(kindsOf(v2list.join('\n')));
    for (const kd of real) add(kd, v2.has(kd));
    // --show <kind>: what v1 asked on each such turn, and what v2 asked
    const show = args.includes('--show') ? args[args.indexOf('--show') + 1] : '';
    if (show && real.has(show)) console.log(`${rows[s].timestamp?.slice(0, 16)} v1: ${real.why[show].replace(/\s+/g, ' ').slice(0, 200)}\n   v2: ${v2list.join(' | ') || '(nothing)'} | edits ${acts.calls.filter(c => /Edit|Write/.test(c.name)).map(c => String(c.input.file_path).split(/[\\/]/).pop()).join(',').slice(0, 120)}`);
  });
}
console.log('v1 real catches (asked, then real work followed) that v2 also asks for on the same turn:');
for (const [k, e] of [...tally].sort((a, b) => b[1].n - a[1].n)) console.log(`  ${k.padEnd(10)} ${e.x} of ${e.n}`);
