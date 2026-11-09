#!/usr/bin/env node
// How much the engine interrupts, measured on real sessions: what the prompt hook injects, what the tool hooks add or
// refuse during the work, and what Stop blocks, per user turn, main session and helpers apart. Read-only.
// usage: node tools/starter/interrupts.mjs <transcript folder> [--since YYYY-MM-DD] [--kinds]
import fs from 'node:fs';
import path from 'node:path';
import { readLines } from '../hooks/jsonl.mjs';

const args = process.argv.slice(2), dir = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--since');
const since = args.includes('--since') ? args[args.indexOf('--since') + 1] : '2000';
if (!dir || !fs.existsSync(dir)) { console.error('usage: node tools/starter/interrupts.mjs <transcript folder> [--since YYYY-MM-DD] [--kinds]'); process.exit(2); }
const files = [];
const walk = p => { for (const x of fs.readdirSync(p)) { const q = path.join(p, x); if (fs.statSync(q).isDirectory()) walk(q); else if (x.endsWith('.jsonl')) files.push(q); } };
walk(dir);
// the safety guards, the only refusals that belong during the work
const SAFETY = /REQ: (approval-gate|browser-guard|commit-gate|forbidden-command|forbidden-terms|git-safety|gitignore-ready|headless-no-wakeup|injection-guard|no-ai-attribution|no-overwrite|no-secrets|outward-gate|permission-respected|protect-originals|publish-gate|scope-separate|setup-[\w-]+|shell-hygiene|skill-mirror|subagent-brief|wakeup-left|whole-output|write-only-via)\b/;
const kindOf = s => (/REQ: ([\w-]+)/.exec(s)?.[1]) || (/^\W*(Heads-up: [^.(]{0,50}|Before you answer[^.]{0,40}|[A-Z][A-Z ]{5,30}:)/.exec(s)?.[1]) || s.slice(0, 50);
const text = c => typeof c === 'string' ? c : JSON.stringify(c ?? '');
const z = () => ({ turns: 0, calls: 0, promptLines: 0, promptChars: 0, notices: 0, refusals: 0, safety: 0, stops: 0, bookkeeping: 0 });
const stat = { main: z(), helper: z() }, kinds = new Map();
for (const f of files) {
  const who = /[\\/]subagents[\\/]/.test(f) ? 'helper' : 'main', s = stat[who];
  for (const l of readLines(f)) {
    let r; try { r = JSON.parse(l); } catch { continue; }
    if (!r.timestamp || r.timestamp < since) continue;
    const c = r.message?.content;
    if (r.type === 'user' && typeof c === 'string' && !r.isMeta && !/^\s*</.test(c)) s.turns++;
    if (Array.isArray(c)) for (const x of c) {
      if (x.type === 'tool_use') s.calls++;
      if (x.type === 'tool_result' && x.is_error && /hook error|REQ: /.test(text(x.content).slice(0, 300))) {
        const t = text(x.content), k = kindOf(t);
        if (SAFETY.test(t)) s.safety++; else { s.refusals++; kinds.set(`${who} refusal ${k}`, (kinds.get(`${who} refusal ${k}`) || 0) + 1); }
      }
    }
    const a = r.attachment;
    if (!a || a.type !== 'hook_additional_context') continue;
    const t = text(a.content), ev = a.hookEvent || '';
    if (ev === 'UserPromptSubmit') { s.promptLines += t.split(/\\n|\n/).filter(x => x.trim()).length; s.promptChars += t.length; }
    else if (/PreToolUse|PostToolUse/.test(ev)) { s.notices++; const k = `${who} notice ${kindOf(t.replace(/^\["?/, ''))}`; kinds.set(k, (kinds.get(k) || 0) + 1); }
    else if (ev === 'Stop') { s.stops++; if (/Record in \.cache\/turn-notes|Record \d|of the (\w+ )?checklist|"Skip N|"Done N/.test(t)) s.bookkeeping++; }
  }
}
const rate = (n, d) => d ? (n / d).toFixed(2) : '-';
console.log(`${files.length} transcripts since ${since}`);
for (const [who, s] of Object.entries(stat)) {
  console.log(`${who}: ${s.turns} turns, ${s.calls} tool calls | prompt hook ${rate(s.promptLines, s.turns)} lines and ${rate(s.promptChars, s.turns)} chars per turn | ` +
    `during work: ${s.notices} notices (${rate(s.notices, s.turns)}/turn), ${s.refusals} non-safety refusals (${rate(s.refusals, s.turns)}/turn), ${s.safety} safety refusals | ` +
    `Stop: ${s.stops} blocks (${rate(s.stops, s.turns)}/turn), ${s.bookkeeping} asking for record lines`);
}
if (args.includes('--kinds')) for (const [k, n] of [...kinds].sort((a, b) => b[1] - a[1])) console.log(String(n).padStart(6), k);
