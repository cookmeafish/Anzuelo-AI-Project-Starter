#!/usr/bin/env node
// Starter-only. Anzuelo's cost against the same projects with no starter (a round run with TRIAL_BARE=1):
//   node tools/starter/trials/efficiency.mjs <anzuelo round> <bare round>
// Per project and in total: minutes, dollars and tool calls, for setup (turn 1) and for the work turns after it, and
// the ratio Anzuelo / bare. The user's bar: "almost as fast and not too many more tokens", with Anzuelo's benefits kept.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const [a, b] = process.argv.slice(2);
if (!a || !b) { console.error('usage: efficiency.mjs <anzuelo round> <bare round>'); process.exit(1); }
const load = r => {
  const d = path.join(TRIALS, `results-${r}`), out = {};
  for (const f of fs.existsSync(d) ? fs.readdirSync(d).filter(f => f.endsWith('.json')) : []) {
    const j = JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'));
    // cost is the session's running total: a turn's own cost is the step from the turn before (a new session restarts it)
    let prev = 0, prevSid = null;
    const turns = (j.turns || []).map(t => { const c = Number(t.cost) || 0; const own = t.sid === prevSid ? c - prev : c; prev = c; prevSid = t.sid; return { min: Number(t.min) || 0, usd: Math.max(0, own), calls: Number(t.turns) || 0 }; });
    out[j.id] = turns;
  }
  return out;
};
const A = load(a), B = load(b);
const sum = (ts, k) => ts.reduce((s, t) => s + t[k], 0);
const f = (n, d = 1) => Number.isFinite(n) ? n.toFixed(d) : '-';
const ratio = (x, y) => y > 0 ? `${f(x / y, 2)}x` : '-';
const rows = [], tot = { a: { s: [], w: [] }, b: { s: [], w: [] } };
for (const id of Object.keys(A).filter(id => B[id]).sort()) {
  const [as, ...aw] = A[id], [bs, ...bw] = B[id];
  tot.a.s.push(as); tot.b.s.push(bs); tot.a.w.push(...aw); tot.b.w.push(...bw);
  rows.push(`${id.padEnd(18)} setup ${f(as.min)}/${f(bs.min)} min, $${f(as.usd, 2)}/$${f(bs.usd, 2)} | work ${f(sum(aw, 'min'))}/${f(sum(bw, 'min'))} min (${ratio(sum(aw, 'min'), sum(bw, 'min'))}), ` +
    `$${f(sum(aw, 'usd'), 2)}/$${f(sum(bw, 'usd'), 2)} (${ratio(sum(aw, 'usd'), sum(bw, 'usd'))}), calls ${sum(aw, 'calls')}/${sum(bw, 'calls')}`);
}
if (!rows.length) { console.log(`no project is in both ${a} and ${b}`); process.exit(1); }
console.log(`efficiency: ${a} (Anzuelo) / ${b} (no starter); each pair is Anzuelo/bare`);
for (const r of rows) console.log(`  ${r}`);
const T = (g, k) => sum(g, k);
console.log(`setup total: ${f(T(tot.a.s, 'min'))}/${f(T(tot.b.s, 'min'))} min (${ratio(T(tot.a.s, 'min'), T(tot.b.s, 'min'))}), $${f(T(tot.a.s, 'usd'), 2)}/$${f(T(tot.b.s, 'usd'), 2)} (${ratio(T(tot.a.s, 'usd'), T(tot.b.s, 'usd'))})`);
console.log(`work turns (${tot.a.w.length}): ${f(T(tot.a.w, 'min'))}/${f(T(tot.b.w, 'min'))} min (${ratio(T(tot.a.w, 'min'), T(tot.b.w, 'min'))}), $${f(T(tot.a.w, 'usd'), 2)}/$${f(T(tot.b.w, 'usd'), 2)} (${ratio(T(tot.a.w, 'usd'), T(tot.b.w, 'usd'))}), tool calls ${T(tot.a.w, 'calls')}/${T(tot.b.w, 'calls')} (${ratio(T(tot.a.w, 'calls'), T(tot.b.w, 'calls'))})`);
