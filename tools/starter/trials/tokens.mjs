#!/usr/bin/env node
// Starter-only. Where a round's tokens go, per turn: model requests, the context each request carries (input + cache
// reads + cache writes), output, and the same for helper agents (sidechains). Context times requests is most of the
// bill: a big context re-sent with every step costs more than the steps themselves.
//   node tools/starter/trials/tokens.mjs <round> [project]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const [round, only] = process.argv.slice(2);
if (!round) { console.error('usage: tokens.mjs <round> [project]'); process.exit(1); }
const root = path.join(os.homedir(), '.claude', 'projects');
const filesOf = sid => { for (const d of fs.readdirSync(root)) { const f = path.join(root, d, `${sid}.jsonl`); if (fs.existsSync(f)) { const sub = path.join(root, d, sid, 'subagents'); return { main: f, subs: fs.existsSync(sub) ? fs.readdirSync(sub).filter(n => n.endsWith('.jsonl')).map(n => path.join(sub, n)) : [] }; } } return { main: null, subs: [] }; };
const rowsOf = f => f ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];
const usage = rows => { const seen = new Set(); let req = 0, ctx = 0, out = 0, first = 0; for (const r of rows) { const u = r.message?.usage, id = r.message?.id; if (r.type !== 'assistant' || !u || seen.has(id)) continue; seen.add(id); req++; const c = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0); if (!first) first = c; ctx += c; out += u.output_tokens || 0; } return { req, ctx, out, first }; };
const k = n => `${Math.round(n / 1000)}k`;
const dir = path.join(TRIALS, `results-${round}`);
const tot = { req: 0, ctx: 0, out: 0, sreq: 0, sctx: 0 };
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json') && (!only || f.startsWith(only)))) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const prompts = (j.turns || []).map(t => String(t.prompt || '').slice(0, 40));
  console.log(j.id);
  for (const sid of [...new Set((j.turns || []).map(t => t.sid).filter(Boolean))]) {
    const { main, subs } = filesOf(sid), rows = rowsOf(main);
    // split the main session by the prompts the trial sent
    const cuts = [];
    rows.forEach((r, i) => { if (r.type === 'user' && typeof r.message?.content === 'string' && prompts.some(p => p && r.message.content.startsWith(p))) cuts.push(i); });
    cuts.forEach((c, n) => {
      const part = rows.slice(c, cuts[n + 1] ?? rows.length), u = usage(part);
      const t0 = Date.parse(part[0]?.timestamp || ''), t1 = Date.parse(part.at(-1)?.timestamp || '');
      const subsHere = subs.map(rowsOf).filter(sr => { const ts = Date.parse(sr[0]?.timestamp || ''); return ts >= t0 && ts <= t1; }).map(usage);
      const s = subsHere.reduce((a, b) => ({ req: a.req + b.req, ctx: a.ctx + b.ctx }), { req: 0, ctx: 0 });
      tot.req += u.req; tot.ctx += u.ctx; tot.out += u.out; tot.sreq += s.req; tot.sctx += s.ctx;
      console.log(`  turn ${n + 1}: ${u.req} requests, first context ${k(u.first)}, avg context ${k(u.req ? u.ctx / u.req : 0)}, total context ${k(u.ctx)}, output ${k(u.out)} | helpers: ${subsHere.length} (${s.req} requests, ${k(s.ctx)} context)`);
    });
  }
}
console.log(`total: ${tot.req} requests, ${k(tot.ctx)} context, ${k(tot.out)} output; helpers ${tot.sreq} requests, ${k(tot.sctx)} context`);
