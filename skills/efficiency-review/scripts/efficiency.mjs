#!/usr/bin/env node
// Where this project's turns spend time and tokens, from its own Claude Code sessions, and what asks for each cost:
// a project rule, runbook or hook, or the starter's engine. Read-only.
//   node skills/efficiency-review/scripts/efficiency.mjs [--turns 30] [--sessions <dir>]
// Sections: the turns in numbers; the slowest commands, with the files that ask for them; steps done again with
// nothing changed; records edited on most turns; end-of-answer rounds by source and their most frequent steps.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = process.cwd();
const args = process.argv.slice(2), opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const LAST = Number(opt('--turns', 30)) || 30;
// Claude Code keeps a project's sessions under ~/.claude/projects/<the project path, every other character a dash>
const DIR = opt('--sessions', path.join(os.homedir(), '.claude', 'projects', ROOT.replace(/[^A-Za-z0-9]/g, '-')));
if (!fs.existsSync(DIR)) { console.log(`no sessions found for this project (looked in ${DIR}); pass --sessions <dir>`); process.exit(2); }

const rowsOf = f => fs.readFileSync(f, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const textOf = c => typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => x?.text || (typeof x?.content === 'string' ? x.content : '')).join('\n') : '';
const NOTICE = /^\s*(<(task-notification|system-reminder|command-|local-command)|\[SYSTEM NOTIFICATION|Caveat:|This session is being continued)/i;
const isPrompt = r => r.type === 'user' && typeof r.message?.content === 'string' && !r.isMeta && !r.isCompactSummary && !NOTICE.test(r.message.content);
const BLOCK = /Stop hook feedback|Almost done:|steps? (is|are) left before this answer|blocking error from command/i;
const rel = p => String(p || '').replace(/\\/g, '/').replace(ROOT.replace(/\\/g, '/') + '/', '');
// a command's identity: its script or program and first argument, without cd, redirects and output trimming
const keyOf = c => {
  const s = String(c).replace(/^\s*cd\s+("[^"]+"|'[^']+'|\S+)\s*(&&|;)\s*/, '').replace(/\s*\d?>&?\d?\s*\S*|\s*\|\s*(tail|head|grep|findstr|Select-Object)\b.*$/g, '').trim();
  const script = /(\S+\.(?:py|mjs|cjs|js|ts|sh|ps1))\b/.exec(s);
  return script ? `${s.split(/\s+/)[0]} ${rel(script[1])}` : s.split(/\s+/).slice(0, 2).join(' ');
};
const LOOK = /^(cat|ls|head|tail|grep|rg|find|echo|printf|wc|pwd|git (status|diff|log|show)|Get-Content|Get-ChildItem)\b/;

// every session (main transcripts and their helpers), turns in time order
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.jsonl')).map(f => path.join(DIR, f));
const turns = [];
for (const f of files) {
  const sid = path.basename(f, '.jsonl'), sub = path.join(DIR, sid, 'subagents');
  const helpers = fs.existsSync(sub) ? fs.readdirSync(sub).filter(x => x.endsWith('.jsonl')).flatMap(x => rowsOf(path.join(sub, x))) : [];
  const rows = rowsOf(f);
  let cur = null;
  for (const r of rows) {
    if (isPrompt(r)) { cur = { at: Date.parse(r.timestamp) || 0, end: Date.parse(r.timestamp) || 0, rows: [] }; turns.push(cur); continue; }
    if (cur) { cur.rows.push(r); cur.end = Math.max(cur.end, Date.parse(r.timestamp) || 0); }
  }
  // a helper's rows belong to the turn they ran in
  for (const r of helpers) { const t = Date.parse(r.timestamp) || 0; const owner = turns.filter(x => x.at <= t).sort((a, b) => b.at - a.at)[0]; if (owner) owner.rows.push(r); }
}
turns.sort((a, b) => a.at - b.at);
const recent = turns.slice(-LAST);
if (!recent.length) { console.log('no turns found'); process.exit(2); }

const cmds = {}, repeats = {}, editsByFile = {}, blocks = { engine: 0, project: 0 }, stepText = {}, hookMs = {};
let calls = 0, mins = [];
// the hook that blocked: the starter's engine (hooks.mjs) or the project's own; its steps are its "- " or "N." lines
const hookName = c => /hooks\.mjs/.test(c) ? "the starter's engine (hooks.mjs)" : `the project's own: ${rel(/[\w./\\-]+\.(?:py|mjs|cjs|js|sh|ps1)/.exec(String(c))?.[0] || String(c).slice(0, 60))}`;
// model time: from each prompt or tool result to the model's next message (a gap over 10 minutes is waiting, not work)
let reqs = 0, modelMs = 0, waitMs = 0, waitTurns = 0;
// wasted steps by kind: a refused call (each costs a retry), a --help lookup, an output too big to read whole
const waste = { refused: 0, help: 0, oversize: 0 }, churn = [];
for (const t of recent) {
  // waiting after the answer: the turn ended (a Stop ran) and the session went on later inside the same turn, on
  // background jobs it had started. Lesson (a field report): a build answered, then waited 27 minutes on sweeps
  let w = 0;
  t.rows.forEach((r, i) => { if (r.subtype !== 'stop_hook_summary') return; const a = Date.parse(r.timestamp) || 0, nx = t.rows.slice(i + 1).find(x => Date.parse(x.timestamp)); const b = nx ? Date.parse(nx.timestamp) : 0; if (a && b - a > 60000) w += b - a; });
  if (w) { waitMs += w; waitTurns++; }
  mins.push((t.end - t.at) / 60000);
  const started = {}, seenCmd = new Set(), edited = new Set(), ids = new Set(), editsNow = {};
  let lastIn = t.at;
  for (const r of t.rows) {
    const content = r.message?.content;
    const ts = Date.parse(r.timestamp) || 0;
    if (r.type === 'assistant' && r.message?.id && !ids.has(r.message.id)) { ids.add(r.message.id); reqs++; if (lastIn && ts - lastIn > 0 && ts - lastIn < 600000) modelMs += ts - lastIn; lastIn = 0; }
    if (r.type === 'user' && Array.isArray(content) && content.some(c => c?.type === 'tool_result')) lastIn = ts;
    const be = r.attachment?.type === 'hook_blocking_error' && r.attachment.hookEvent === 'Stop' ? r.attachment.blockingError : null;
    if (be) {
      (/hooks\.mjs/.test(be.command || '') ? blocks.engine++ : blocks.project++);
      for (const m of String(be.blockingError || '').matchAll(/^\s*(?:-|\d+\.)\s+(.{8,90}?)(?:[:(]|$)/gm)) { const k = `${m[1].trim()} [${/hooks\.mjs/.test(be.command || '') ? 'engine' : 'project'}]`; stepText[k] = (stepText[k] || 0) + 1; }
    }
    // (the engine blocks with feedback: an "additional context" row at Stop; a project step it runs (externalStop) says so)
    const fb = r.attachment?.type === 'hook_additional_context' && r.attachment.hookEvent === 'Stop' ? textOf(r.attachment.content) || String(r.attachment.content || '') : '';
    if (/Almost done:|steps? (is|are) left before this answer/i.test(fb)) {
      blocks.engine++;
      for (const m of fb.matchAll(/^\s*\d+\.\s+(.{8,90}?)(?:[:(]|$)/gm)) { const k = `${m[1].trim()} [${/the project's own check/.test(m[0]) ? 'project, inside the engine' : 'engine'}]`; stepText[k] = (stepText[k] || 0) + 1; }
    }
    if (r.subtype === 'stop_hook_summary') for (const h of r.hookInfos || []) { const k = hookName(h.command); const e = hookMs[k] ||= { n: 0, ms: 0 }; e.n++; e.ms += h.durationMs || 0; }
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      if (r.type === 'assistant' && c?.type === 'tool_use') {
        calls++;
        const inp = c.input || {};
        if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(c.name)) { const p = rel(inp.file_path || inp.notebook_path); edited.add(p); seenCmd.clear(); editsNow[p] = (editsNow[p] || 0) + 1; }
        if (/^(Bash|PowerShell)$/.test(c.name) && typeof inp.command === 'string') {
          const k = keyOf(inp.command);
          started[c.id] = { k, at: Date.parse(r.timestamp) || 0 };
          // (a repeat is the same whole command, arguments included, with no file written since)
          const whole = String(inp.command).replace(/^\s*cd\s+("[^"]+"|'[^']+'|\S+)\s*(&&|;)\s*/, '').replace(/\s*\|\s*(tail|head|grep|findstr|Select-Object)\b[^|]*$/, '').replace(/\s+/g, ' ').trim();
          if (!LOOK.test(k)) { if (seenCmd.has(whole)) repeats[k] = (repeats[k] || 0) + 1; seenCmd.add(whole); }
        }
      }
      if (r.type === 'user' && c?.type === 'tool_result') {
        const body = typeof c.content === 'string' ? c.content : JSON.stringify(c.content || '');
        if (c.is_error && /denied|not allowed|permission|requires approval|was blocked/i.test(body.slice(0, 400))) waste.refused++;
        if (/Output too large|exceeds maximum allowed|File content \([\d.]+ ?[KM]B\) exceeds/i.test(body.slice(0, 400)) || body.length > 50000) waste.oversize++;
      }
      if (r.type === 'assistant' && c?.type === 'tool_use' && /(^|\s)(--help|-h)(\s|$)/.test(String(c.input?.command || ''))) waste.help++;
      if (r.type === 'user' && c?.type === 'tool_result' && started[c.tool_use_id]) {
        const s = started[c.tool_use_id], ms = Math.max(0, (Date.parse(r.timestamp) || 0) - s.at);
        const e = cmds[s.k] ||= { n: 0, ms: 0 }; e.n++; e.ms += ms;
      }
    }
  }
  for (const p of edited) editsByFile[p] = (editsByFile[p] || 0) + 1;
  for (const [p, n] of Object.entries(editsNow)) if (n >= 4) churn.push([p, n]);
}

// what asks for a command: the project's rules, runbooks, skills and hooks that name its script
const SOURCES = ['CLAUDE.md', 'AGENTS.md', 'docs/playbooks', 'docs/checks', 'skills', 'tools/hooks/requirements.json', 'tools/hooks/config.json', 'tools/hooks'];
const sourceFiles = SOURCES.flatMap(s => { const a = path.join(ROOT, s); try { return fs.statSync(a).isDirectory() ? walk(a) : [a]; } catch { return []; } });
function walk(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? (/^(state|node_modules|\.git)$/.test(e.name) ? [] : walk(path.join(d, e.name))) : /\.(md|json|py|mjs|js)$/.test(e.name) ? [path.join(d, e.name)] : []); }
const askedBy = k => {
  const needle = path.basename(k.split(' ').pop()); if (!/\./.test(needle)) return [];
  const out = [];
  for (const f of sourceFiles) { if (path.basename(f) === needle) continue; let t; try { t = fs.readFileSync(f, 'utf8'); } catch { continue; } const i = t.indexOf(needle); if (i >= 0) out.push(`${rel(f)}:${t.slice(0, i).split('\n').length}`); }
  return out.slice(0, 5);
};

const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const round1 = x => Math.round(x * 10) / 10;
console.log(`EFFICIENCY: the last ${recent.length} turns of this project (${DIR})`);
console.log(`- per turn: median ${round1(med(mins))} min, ${round1(calls / recent.length)} tool calls`);
console.log(`- end-of-answer blocks: ${blocks.engine} from the starter's engine, ${blocks.project} from the project's own hooks`);
for (const [k, e] of Object.entries(hookMs).sort((a, b) => b[1].ms - a[1].ms)) console.log(`- end-of-answer hook time, ${k}: ${round1(e.ms / e.n / 1000)} s per answer (${e.n} answers)`);
// Steps, not tools: every call is also a model round trip, so a turn of many small calls is slow however fast each tool
// is. Lesson (a field report): a 33-minute build ran its tools for 6.6 minutes; the rest was 119 model requests,
// about 110 of them one item or one query at a time.
const cmdMs = Object.values(cmds).reduce((a, e) => a + e.ms, 0), perReq = reqs ? modelMs / reqs / 1000 : 0;
console.log(`\nSTEPS VS TOOL TIME: per turn ${round1(reqs / recent.length)} model requests (about ${round1(perReq)} s each, ${round1(modelMs / 60000 / recent.length)} min) against ${round1(cmdMs / 60000 / recent.length)} min running commands.`);
if (modelMs > 2 * cmdMs) console.log('- Most of a turn is the model\'s round trips: fewer, bigger steps save the most (batch small calls, one pipeline command for a fixed sequence).');
if (waitMs) console.log(`- WAITING AFTER THE ANSWER: ${round1(waitMs / 60000)} min over ${waitTurns} turn(s), the session still busy on background jobs after it answered (long sweeps started at the end). Finish checks before answering, or don't start long ones at the end.`);
// Lesson (a field report): a 181-step build had about 20 steps of refused commands and retries, 12 of outputs too big
// to read and 10 of --help lookups, found only by reading every step by hand
console.log(`WASTED STEPS: ${waste.refused} refused (each needs a retry), ${waste.help} --help lookups, ${waste.oversize} outputs too big to read whole, over ${recent.length} turn(s)${waste.refused ? '. Refused calls: one plain command per call, or allow the command in the settings of the run' : ''}${waste.help ? '. --help lookups: a short command sheet in the runbook' : ''}${waste.oversize ? '. Big outputs: a compact mode or a summary line in the tool' : ''}.`);
console.log('MOST-CALLED COMMANDS (each call also costs a model round trip; batch the frequent ones):');
for (const [k, e] of Object.entries(cmds).filter(([, e]) => e.n >= 5).sort((a, b) => b[1].n - a[1].n).slice(0, 8))
  console.log(`- ${k}: ${e.n} calls (${round1(e.ms / e.n / 1000)} s each, plus about ${round1(perReq)} s of model time per call)`);
console.log('\nSLOWEST COMMANDS (total time; what asks for them):');
for (const [k, e] of Object.entries(cmds).sort((a, b) => b[1].ms - a[1].ms).slice(0, 10))
  console.log(`- ${k}: ${round1(e.ms / 60000)} min over ${e.n} runs (${round1(e.ms / e.n / 1000)} s each)${(a => a.length ? `; named in ${a.join(', ')}` : '')(askedBy(k))}`);
const rep = Object.entries(repeats).sort((a, b) => b[1] - a[1]);
console.log(`\nDONE AGAIN WITH NOTHING CHANGED: ${rep.reduce((a, [, n]) => a + n, 0)}`);
for (const [k, n] of rep.slice(0, 8)) console.log(`- ${k}: ${n} extra run(s)`);
console.log('\nRECORDS EDITED ON MOST TURNS (a file edited in more than a third of the turns):');
for (const [p, n] of Object.entries(editsByFile).filter(([, n]) => n > recent.length / 3).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`- ${p}: ${n} of ${recent.length} turns`);
// a file edited again and again in one turn: write it once, at the end. Lesson (a field report): a build edited its
// notes and its changelog 7 times each
console.log('\nFILES EDITED 4+ TIMES IN ONE TURN (write it once, when its content is final):');
for (const [p, n] of churn.sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`- ${p}: ${n} edits in one turn`);
console.log('\nMOST FREQUENT END-OF-ANSWER STEPS:');
for (const [s, n] of Object.entries(stepText).sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`- ${n}x ${s}`);
console.log('\nNext: the efficiency-review skill maps each cost to its source and proposes what to change.');
