#!/usr/bin/env node
// Replay engine v2 over a project's real sessions: each typed request is routed by v2's start hook, and v2's end check
// judges what that turn did. Prints reminder size, blocks per turn and what they asked for. Read-only. File times are
// not used (they are today's, not the turn's): shell commands that write a code file stand in for them
// (replay-lib.mjs), and a file a helper or a separate script changed counts as unchanged here.
// usage: node tools/starter/v2-replay.mjs <project folder> <transcript folder> [--since YYYY-MM-DD] [--show]
import fs from 'node:fs';
import path from 'node:path';

const [project, tdir] = process.argv.slice(2), args = process.argv.slice(2);
const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '2000';
if (!project || !tdir) { console.error('usage: node tools/starter/v2-replay.mjs <project folder> <transcript folder> [--since YYYY-MM-DD] [--show]'); process.exit(2); }
process.env.ANZUELO_ROOT = path.resolve(project);
const { reminder } = await import('../hooks/v2/start.mjs');
const { missing } = await import('../hooks/v2/end.mjs');
const { turnActs, testGaps, gateGaps, screenGaps, healthGaps, knowledgeGaps, runbooks, typed } = await import('../hooks/v2/lib.mjs');
const books = runbooks();
import { firstTry, withShellEdits } from './replay-lib.mjs';

let turns = 0, routed = 0, lines = 0, chars = 0, blocks = 0;
const kinds = new Map();
for (const f of fs.readdirSync(tdir).filter(f => f.endsWith('.jsonl')).map(f => path.join(tdir, f))) {
  const rows = fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const starts = rows.map((r, i) => typed(r) && r.timestamp >= since ? i : -1).filter(i => i >= 0);
  starts.forEach((s, k) => {
    const prompt = rows[s].message.content, slice = rows.slice(s, starts[k + 1] ?? rows.length);
    const r = reminder(prompt);
    turns++; if (r.book) { routed++; lines += r.text.split('\n').length; chars += r.text.length; }
    const acts = withShellEdits(turnActs(firstTry(slice))), list = [...missing({ runbook: r.book?.file || null }, acts, books), ...testGaps(acts), ...gateGaps(acts), ...screenGaps(acts), ...healthGaps(acts, { run: false }), ...knowledgeGaps(acts)];
    // (the health check can't be rerun on a past turn: "would run" is counted on its own line, not as a block)
    if (list.some(x => !/would run here/.test(x))) blocks++;
    if (list.length) { for (const x of list) { const key = x.replace(/item \d+: .*/, 'item N').replace(/docs\/playbooks\/[\w-]+\.md|tools\/starter\/runbooks\/[\w-]+\.md/, '<runbook>'); kinds.set(key, (kinds.get(key) || 0) + 1); }
      if (args.includes('--show')) console.log(`${rows[s].timestamp?.slice(0, 16)} "${prompt.replace(/\s+/g, ' ').slice(0, 70)}"\n   ${list.join('\n   ')}`); }
  });
}
const rate = (n, d) => d ? (n / d).toFixed(2) : '-';
console.log(`${turns} typed requests, ${routed} routed | reminder ${rate(lines, routed)} lines, ${rate(chars, routed)} chars when routed | v2 Stop: ${blocks} blocks (${rate(blocks, turns)}/turn)`);
for (const [k, n] of [...kinds].sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(5), k);
