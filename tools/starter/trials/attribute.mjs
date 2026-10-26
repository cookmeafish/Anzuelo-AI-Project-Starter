#!/usr/bin/env node
// Starter-only. Why each request of a round's work turns happened, and what it cost. Every model request (an assistant
// message with its own usage) is put under the category of the tool call it made, or "answer" for the final text, and
// weighted by token price (input 1, cache write 1.25, cache read 0.1, output 5, all relative to input). With a bare
// round beside it, the difference per category is the starter's own cost.
//   node tools/starter/trials/attribute.mjs <round> [bareRound] [--turns 2-] [--project id]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = path.join(HERE, '..', '..', '..', '.cache', 'trials');
const PROJECTS = path.join(os.homedir(), '.claude', 'projects');
const args = process.argv.slice(2), flag = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const [round, bare] = args.filter((a, i) => !a.startsWith('--') && !['--turns', '--project'].includes(args[i - 1]));
const fromTurn = Number(String(flag('--turns') || '2-').replace('-', '')) || 2, only = flag('--project');
const findT = sid => { for (const d of fs.readdirSync(PROJECTS)) { const f = path.join(PROJECTS, d, `${sid}.jsonl`); if (fs.existsSync(f)) return f; } return null; };
const rel = p => String(p || '').replace(/\\/g, '/').replace(/^.*?anzuelo-new\/[^/]+\//, '');

export function category(name, inp) {
  const p = rel(inp.file_path || inp.notebook_path || inp.path || ''), c = String(inp.command || '');
  if (name === 'Read' || name === 'Grep' || name === 'Glob') {
    if (/^(docs\/playbooks|skills|library\/skills)\/|\/SKILL\.md$|references\.md$|sections\//.test(p)) return 'read: runbooks/skills';
    if (/^(AGENTS|CLAUDE|DIRECTORY|HOW-TO-USE)\.md$|^docs\/(STATUS|CHANGELOG|DECISIONS|BRIEF|foundation|INDEX|names)\b|^docs\/(checks|plans|specs|releases|reviews)\/|^memory\//.test(p)) return 'read: records/rules';
    if (/^tools\/hooks\//.test(p)) return 'read: engine';
    return 'task';
  }
  if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(name)) {
    if (/^\.cache\/answer/.test(p)) return 'pre-check';
    if (/^docs\/(STATUS|CHANGELOG|DECISIONS|BRIEF|lessons)\.md$|^docs\/(checks|plans|specs|releases|reviews|incidents)\/|^memory\/|^\.cache\/turn-notes|^(AGENTS|CLAUDE)\.md$|^tools\/hooks\/(requirements\.json|project-scenarios\.mjs|config\.json)$/.test(p)) return 'write: records/rules';
    if (/^docs\/playbooks\/|^skills\//.test(p)) return 'write: runbooks/skills';
    return 'task';
  }
  if (/^(Bash|PowerShell)$/.test(name)) {
    if (/hooks\.mjs\s+check\b/.test(c)) return 'pre-check';
    if (/hooks\.mjs\s+(waive|begin|why|run|checks)\b|turn-notes/.test(c)) return 'starter commands';
    if (/audit\.mjs|selfcheck\.mjs|fit\.mjs|starter\.mjs|plan-tasks\.mjs|writing-check|draft-check/.test(c)) return 'starter checks';
    return 'task';
  }
  if (/^(Agent|Task)$/.test(name)) return 'helper';
  return 'task';
}
const W = u => (u.input_tokens || 0) + 1.25 * (u.cache_creation_input_tokens || 0) + 0.1 * (u.cache_read_input_tokens || 0) + 5 * (u.output_tokens || 0);

function turnRows(rows, prompt, nextPrompt) {
  const isPrompt = (r, p) => r.type === 'user' && typeof r.message?.content === 'string' && p && r.message.content.trim() === String(p).trim();
  let s = -1; rows.forEach((r, i) => { if (isPrompt(r, prompt)) s = i; });
  if (s < 0) return [];
  let e = rows.length; for (let i = s + 1; i < rows.length; i++) if (isPrompt(rows[i], nextPrompt)) { e = i; break; }
  return rows.slice(s, e);
}
export function attributeRound(name) {
  const dir = path.join(TRIALS, `results-${name}`), out = { cats: {}, requests: 0, units: 0, turns: 0, stopRounds: 0 };
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
    const rec = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (only && rec.id !== only) continue;
    const turns = rec.turns || [];
    for (let ti = fromTurn - 1; ti < turns.length; ti++) {
      const t = turns[ti], file = t?.sid && findT(t.sid); if (!file) continue;
      const rows = turnRows(fs.readFileSync(file, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean), t.prompt, turns[ti + 1]?.prompt);
      out.turns++;
      // one request = one message id: Claude Code writes its text and each tool call as separate rows sharing the id
      // and usage, so the rows are grouped first and the request takes the category of its first tool call
      const reqs = new Map(); let afterStop = false;
      for (const r of rows) {
        const blob = JSON.stringify(r.message?.content || r.content || '');
        if ((r.type === 'user' || r.type === 'system') && !/tool_result/.test(blob) && /Stop hook|Almost done:|steps? (is|are) left before this answer/i.test(blob)) { afterStop = true; out.stopRounds++; }
        if (r.type !== 'assistant' || !r.message?.usage) continue;
        const id = r.message.id || r.uuid;
        const q = reqs.get(id) || { u: r.message.usage, tool: null, afterStop };
        const tool = (r.message.content || []).find(c => c.type === 'tool_use');
        if (tool && !q.tool) q.tool = tool;
        reqs.set(id, q);
      }
      for (const q of reqs.values()) {
        let cat = q.tool ? category(q.tool.name, q.tool.input || {}) : 'answer';
        if (q.afterStop && cat === 'answer') cat = 'answer again (after Stop)';
        const c = out.cats[cat] ||= { requests: 0, units: 0 };
        c.requests++; c.units += W(q.u); out.requests++; out.units += W(q.u);
      }
    }
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const a = attributeRound(round), b = bare ? attributeRound(bare) : null;
  const k = x => Math.round(x / 1000);
  console.log(`${round}: ${a.turns} work turns, ${a.requests} requests (${(a.requests / a.turns).toFixed(1)}/turn), ${k(a.units / a.turns)}k units/turn, stop rounds ${a.stopRounds}`);
  if (b) console.log(`${bare}: ${b.turns} work turns, ${b.requests} requests (${(b.requests / b.turns).toFixed(1)}/turn), ${k(b.units / b.turns)}k units/turn`);
  const cats = [...new Set([...Object.keys(a.cats), ...Object.keys(b?.cats || {})])].sort((x, y) => (a.cats[y]?.units || 0) - (a.cats[x]?.units || 0));
  console.log('\ncategory                         req/turn   k units/turn   share' + (b ? '   | bare req/turn  k units/turn' : ''));
  for (const c of cats) {
    const x = a.cats[c] || { requests: 0, units: 0 }, y = b?.cats[c] || { requests: 0, units: 0 };
    console.log(`${c.padEnd(32)} ${(x.requests / a.turns).toFixed(1).padStart(7)}   ${String(k(x.units / a.turns)).padStart(11)}   ${String(Math.round(x.units / a.units * 100)).padStart(4)}%` + (b ? `   | ${(y.requests / b.turns).toFixed(1).padStart(12)}  ${String(k(y.units / b.turns)).padStart(12)}` : ''));
  }
}
