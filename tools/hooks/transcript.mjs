// The session's transcript: its rows (Claude Code or Codex), the current turn with its request, queued messages and
// tool calls, helpers' transcripts, and background work; shared by the safety guard and the old engine (plan step 1b).
import fs from 'node:fs';
import path from 'node:path';
import { read, readJSON } from './settings.mjs';
import { envOf, stateFile, textOf } from './state.mjs';
import { MOVED_BG } from './runs.mjs';
import { userWords as userText } from './near.mjs';
import { HANDBACK } from './relay.mjs';
import { watchersArmed, wakeupsPending } from './wakeups.mjs';
// (host notices are no request. Lesson: an idle notice about a peer got hints as if the user had typed it)
export const SKIP = ['Stop hook feedback', '<system-reminder>', '<task-notification>', 'Another Claude session', '<agent-message', '<cross-session-message',
  '[Cross-session idle notice]', '[Cross-session delivery notice]', '[SYSTEM NOTIFICATION', 'Caveat: The messages below', 'Almost done:', 'Project rules not met yet', 'Stop hook error', '<local-command-stdout>', '<local-command-stderr>', '[Request interrupted'];
export const COMPACT = 'This session is being continued from a previous conversation';
export const isToolResult = c => Array.isArray(c) && c.some(x => x && x.type === 'tool_result');
export const skipped = t => SKIP.some(s => String(t).trimStart().startsWith(s));
// (a peer's message or notice starts a turn of its own. Lesson: a reply to an idle notice was held to the last turn's files)
export const RELAYED_TURN = /^\s*(<cross-session-message\b|Another Claude session sent a message|\[Cross-session (idle|delivery) notice\])/;
export const relayedTurn = r => r?.type === 'user' && !isToolResult(r.message?.content) && RELAYED_TURN.test(textOf(r.message?.content)) && !HANDBACK.test(textOf(r.message?.content));
// A real user prompt (text, or text + images): not a tool result, a notice, or a message the session sent itself.
export function promptOf(r) {
  if (!r || r.type !== 'user' || r.isMeta || selfSent(r)) return null;
  const c = r.message && r.message.content;
  if (c == null || isToolResult(c)) return null;
  const t = textOf(c);
  if (typeof c === 'string' && !t.trim()) return null;
  if (skipped(t)) return null;
  return t;
}
// Codex rollout lines as Claude Code's rows, so every check reads Codex's tool history. Lesson: under Codex no tool call
// was ever seen, so every "did it run the tests" check guessed.
export const CODEX_SKIP = /^\s*(<environment_context>|<user_instructions>|<permissions instructions>|# AGENTS\.md instructions)/;
export function codexRows(rows) {
  if (!rows.some(r => r && r.payload && /^(response_item|session_meta|turn_context|event_msg)$/.test(r.type))) return rows;
  const out = [], shellCmd = a => { const c = a?.command ?? a?.cmd ?? a?.action?.command; return Array.isArray(c) ? (/^(ba|z)?sh$|powershell|pwsh|cmd$/i.test(c[0] || '') && c.length >= 3 ? c[c.length - 1] : c.join(' ')) : String(c ?? ''); };
  for (const r of rows) {
    const p = r?.payload, ts = r?.timestamp;
    if (r?.type !== 'response_item' || !p) continue;
    if (p.type === 'message') {
      const text = (Array.isArray(p.content) ? p.content : []).map(c => c?.text || '').join('\n');
      if (p.role === 'user' && !CODEX_SKIP.test(text)) out.push({ type: 'user', timestamp: ts, message: { content: [{ type: 'text', text }] } });
      else if (p.role === 'assistant') out.push({ type: 'assistant', timestamp: ts, message: { content: [{ type: 'text', text }] } });
    } else if (/^(function_call|custom_tool_call|local_shell_call)$/.test(p.type)) {
      let args = p.arguments ?? p.input ?? p.action ?? {};
      if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = { command: args }; } }
      const n = String(p.name || (p.type === 'local_shell_call' ? 'shell' : ''));
      const tool = /^(shell|exec_command|container\.exec|local_shell|shell_command)$/.test(n) ? { name: 'Bash', input: { command: shellCmd(args) } }
        : n === 'apply_patch' ? { name: 'apply_patch', input: { command: typeof p.input === 'string' ? p.input : shellCmd(args) } }
        : { name: n, input: args };
      if (tool.name === 'Bash' && /^\s*apply_patch\b/.test(tool.input.command)) tool.name = 'apply_patch';
      out.push({ type: 'assistant', timestamp: ts, message: { content: [{ type: 'tool_use', id: p.call_id || p.id, ...tool }] } });
    } else if (/^(function_call_output|custom_tool_call_output|local_shell_call_output)$/.test(p.type)) {
      let o = p.output, err = false;
      if (typeof o === 'string') { try { const j = JSON.parse(o); if (j && typeof j === 'object' && 'output' in j) { err = Number(j.metadata?.exit_code) > 0; o = j.output; } } catch { } }
      else if (o && typeof o === 'object') { err = Number(o.metadata?.exit_code ?? o.exit_code) > 0; o = o.output ?? o.content ?? JSON.stringify(o); }
      out.push({ type: 'user', timestamp: ts, message: { content: [{ type: 'tool_result', tool_use_id: p.call_id || p.id, content: String(o ?? ''), ...(err ? { is_error: true } : {}) }] } });
    }
  }
  return out;
}
// The transcript's tail, growing until it holds the turn's prompt. Lesson: a 568 MB transcript could not be read whole.
export const TAIL_START = 48 << 20, TAIL_MAX = 384 << 20;
export function transcriptRows(transcript, hasStart = rows => rows.some(r => promptOf(r) !== null || relayedTurn(r)), first = TAIL_START) {
  let size = 0; try { size = fs.statSync(String(transcript)).size; } catch { return []; }
  for (let win = Math.min(size, first); ; win = Math.min(size, win * 2, TAIL_MAX)) {
    let text = '';
    try {
      const fd = fs.openSync(String(transcript), 'r');
      try { const b = Buffer.alloc(win); fs.readSync(fd, b, 0, win, size - win); text = b.toString('utf8'); } finally { fs.closeSync(fd); }
    } catch { return []; }
    const lines = text.split(/\r?\n/);
    if (win < size) lines.shift(); // (the first line may be cut)
    const rows = [];
    // (the host's api-request copies repeat what is logged. Lesson: tool calls were counted double)
    for (const line of lines) { if (!line.trim() || line.startsWith('{"type":"api-request')) continue; try { const r = JSON.parse(line); if (!/^api-request/.test(String(r.type))) rows.push(r); } catch { } }
    if (win >= size || win >= TAIL_MAX || hasStart(rows)) return rows;
  }
}
// REQ: helper-work-counts. Tool calls of this turn's helpers (<session>/subagents/) count as its work, never its answer.
// Lesson: work done in a helper was asked for again at Stop.
export function helperRows(transcript, since) {
  const dir = path.join(String(transcript || '').replace(/\.jsonl$/, ''), 'subagents');
  let files = []; try { files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl')); } catch { return []; }
  const out = [];
  for (const f of files) {
    // (an earlier turn's helper file is skipped unread. Lesson: reading all made pretool 45% slower)
    try { if (since && fs.statSync(path.join(dir, f)).mtimeMs < since - 1000) continue; } catch { continue; }
    let rows = []; try { rows = read(path.join(dir, f)).split(/\r?\n/).filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { continue; }
    const t0 = Date.parse(rows.find(r => r.timestamp)?.timestamp || '') || 0;
    if (!since || t0 < since - 1000) continue;
    for (const r of rows) {
      const c = r.message?.content;
      if (!Array.isArray(c)) continue;
      const keep = c.filter(x => x?.type === 'tool_use' || x?.type === 'tool_result');
      if (keep.length) out.push({ ...r, message: { ...r.message, content: keep }, helper: true });
    }
  }
  return out;
}
export function turn(transcript) {
  let rows = codexRows(transcriptRows(transcript));
  let start = -1, prompt = '';
  for (let i = rows.length - 1; i >= 0; i--) {
    const p = promptOf(rows[i]);
    if (p !== null) { start = i; prompt = p; break; }
    // (a peer's message starts a turn with no request. Lesson: old work was checked again on every peer reply)
    if (relayedTurn(rows[i])) { start = i; prompt = ''; break; }
  }
  if (start < 0) return fallbackTurn();
  // REQ: compaction-summary. A summary quotes old requests: it is no request. Lesson: it triggered demands nobody made.
  if (rows[start].isCompactSummary || prompt.trimStart().startsWith(COMPACT)) prompt = '';
  const entries = rows.slice(start + 1);
  // REQ: queued-messages. Messages typed mid-turn are part of the request. Lesson: a mid-turn ask was silently dropped.
  const queued = [];
  for (const r of entries) {
    const a = r.attachment;
    if (r.type === 'attachment' && a && a.type === 'queued_command') {
      const q = textOf(a.prompt ?? a.content ?? '');
      if (q.trim() && !skipped(q)) queued.push(q);
    }
  }
  const since = Date.parse(rows[start].timestamp || '') || null;
  // every message the user typed in this session (for the verbatim check), excluding compaction summaries
  const allPrompts = rows.map(r => (r.isCompactSummary ? null : promptOf(r))).filter(p => p && !p.trimStart().startsWith(COMPACT)).map(userText);
  for (const r of rows) { const a = r.attachment; if (r.type === 'attachment' && a?.type === 'queued_command') { const q = textOf(a.prompt ?? a.content ?? ''); if (!skipped(q)) allPrompts.push(userText(q)); } }
  // (what the session and its helpers wrote into files: its own numbers are not made up, REQ answer-traced; helpers read
  // on first use. Lesson: a helper's figures were called made up)
  let helperCache = null;
  const helpers = () => helperCache ??= helperRows(transcript, since);
  const writesOf = rs => rs.flatMap(r => r.type === 'assistant' && Array.isArray(r.message?.content) ? r.message.content : [])
    .filter(x => x && x.type === 'tool_use' && /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(x.name))
    .map(x => [x.input?.content, x.input?.new_string, x.input?.new_source, ...(x.input?.edits || []).map(e => e.new_string)].filter(s => typeof s === 'string').join('\n')).join('\n');
  const mainWrites = writesOf(rows);
  // (every tool input of the session and its start: a file it made is its own to remove, REQ protect-originals)
  const sessionTools = rows.flatMap(r => r.type === 'assistant' && Array.isArray(r.message?.content) ? r.message.content : [])
    .filter(x => x && x.type === 'tool_use').map(x => JSON.stringify(x.input || {})).join('\n');
  const sessionStart = Date.parse(rows.find(r => r.timestamp)?.timestamp || '') || since;
  // a helper ran this session, also before a compaction (its summary lists the tools used before it)
  const sessionHelpers = rows.some(r => r.type === 'assistant' && Array.isArray(r.message?.content) && r.message.content.some(c => c?.type === 'tool_use' && /^(Agent|Task)$/.test(c.name)))
    || rows.some(r => r.type === 'user' && /<tools-used-before-summary>[^<]*\b(Agent|Task)\b/.test(textOf(r.message?.content ?? '')));
  // (what the session's tools returned, earlier turns too, REQ answer-traced. Lesson: totals read a turn earlier were flagged)
  let readCache = null;
  // (an earlier turn's background run that ends now is this turn's run. Lesson: a passed chain was asked for again)
  return {
    get carriedEntries() { return backgroundLaunches(rows.slice(0, start + 1)); },
    get sessionResults() { return readCache ??= toolResults(rows); }, since, entries, raw: [prompt, ...queued].join('\n'),
    // (the agent's own last text before the request: the list a short typed "do it" approves)
    get before() { for (let i = start - 1; i >= 0; i--) { const c = rows[i].message?.content; if (rows[i].type === 'assistant' && Array.isArray(c)) { const s = c.filter(b => b?.type === 'text').map(b => b.text).join('\n'); if (s.trim()) return s; } } return ''; }, get helperEntries() { return helpers(); }, prompt: [prompt, ...queued].map(userText).filter(s => s.trim()).join('\n'), parts: [prompt, ...queued].map(userText).filter(s => s.trim()), queued, toolsKnown: true, allPrompts, bgRunning: backgroundRunning(rows), watchers: watchersArmed(rows), wakeups: wakeupsPending(rows),
    get sessionWrites() { const h = helpers(); return h.length ? `${mainWrites}\n${writesOf(h)}` : mainWrites; }, sessionTools, sessionStart, sessionHelpers };
}
// A message the session sent itself (a wakeup's or a cron job's prompt) or a background task's notice: not the user's.
// Claude Code marks them (isMeta, turnOrigin "scheduled", promptSource "system", origin.kind "task-notification").
export const selfSent = r => !!r && r.type === 'user' && !isToolResult(r.message?.content) &&
  (r.isMeta || r.turnOrigin === 'scheduled' || r.promptSource === 'system' || r.origin?.kind === 'task-notification');
// Background helpers and commands not done yet (no notice names them): their file changes are theirs, not this turn's.
export function backgroundRunning(rows) {
  const launches = [], results = new Map(), notes = [], stops = [], shells = [], resumes = [];
  rows.forEach((r, i) => {
    const c = r.message?.content;
    // helpers and background commands alike (Lesson: checks fired on files a still-running background sweep made)
    if (r.type === 'assistant' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_use' && /^(Agent|Task|Bash|PowerShell)$/.test(x.name)) (x.input?.run_in_background ? launches : shells).push({ id: x.id, i, helper: /^(Agent|Task)$/.test(x.name) });
    // (a resumed helper runs until its next notice. Lesson: Stop asked for a resumed reviewer's verdict 3 rounds)
    if (r.type === 'assistant' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_use' && x.name === 'SendMessage') resumes.push({ id: x.id, i });
    if (r.type === 'user' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_result') { const tx = textOf(x.content); results.set(x.tool_use_id, tx); stops.push({ i, t: tx, id: x.tool_use_id }); }
    const t = r.type === 'attachment' ? textOf(r.attachment?.prompt ?? r.attachment?.content ?? '') : r.type === 'user' ? textOf(c) : '';
    if (/<task-notification>/.test(t)) notes.push({ i, t });
  });
  // (a launch counts once its result says it started; done when a later notice names it or it was stopped. A command
  // moved to the background, and a helper's own "async agent launched", are launches too. Lessons: a killed job was
  // waited on forever, a refused one counted, timed-out commands and host-backgrounded helpers were not waited on)
  for (const s of shells) if (MOVED_BG.test(results.get(s.id) || '') || (s.helper && /^\s*async agent launched\b/i.test(results.get(s.id) || ''))) launches.push(s);
  for (const s of resumes) { const m = /\bresumedAgentId["']?\s*[:=]\s*["']?([\w-]{4,})/i.exec(results.get(s.id) || ''); if (m) launches.push({ ...s, agentId: m[1] }); }
  return launches.filter(l => {
    if (l.agentId) return !notes.some(n => n.i > l.i && n.t.includes(l.agentId)) && !stops.some(s => s.i > l.i && s.t.includes(l.agentId) && /\b(stopped|killed|cancell?ed|terminated)\b/i.test(s.t));
    const res = results.get(l.id) || '';
    if (results.has(l.id) && !/launched|running in background|in the background|moved to the background|async agent|agentId/i.test(res)) return false;
    const ids = [...res.matchAll(/\b(?:agent_?id|task_?id|ID)\s*[:=]\s*["']?([\w-]{4,})/gi)].map(m => m[1]);
    const later = notes.filter(n => n.i > l.i);
    // (the launch's own "will be stopped" is not a stop. Lesson: a running sweep counted as stopped)
    if (ids.length && stops.some(s => s.i > l.i && s.id !== l.id && ids.some(id => s.t.includes(id)) && /\b(stopped|killed|cancell?ed|terminated)\b/i.test(s.t))) return false;
    return ids.length ? !later.some(n => ids.some(id => n.t.includes(id))) : !later.length;
  }).map(l => l.id);
}
// REQ: agent-neutral. With no readable transcript, the request and start "begin" recorded; tool history unknown.
export function fallbackTurn() {
  // (bench: a turn that starts now and changed nothing)
  if (envOf('BENCH')) return { since: Date.now(), entries: [], prompt: 'what does the brief say', queued: [], toolsKnown: false, allPrompts: ['what does the brief say'] };
  const s = readJSON(stateFile('turn.json'), null);
  if (!s || !s.at) return null;
  return { since: Date.parse(s.at), entries: [], prompt: userText(s.prompt), queued: [], toolsKnown: false, allPrompts: [s.prompt || ''], bgRunning: [], sessionWrites: '' };
}
export function toolResultsList(entries) {
  const out = [];
  for (const r of entries) {
    const c = r.type === 'user' && r.message && r.message.content;
    if (Array.isArray(c)) for (const x of c) if (x && x.type === 'tool_result') out.push(textOf(x.content));
  }
  return out;
}
export const toolResults = entries => toolResultsList(entries).join('\n');
// The background command launches (and their stubs) among rows before a turn, for carriedRuns.
export function backgroundLaunches(rowsBefore) {
  const bg = new Set(), keep = [];
  for (const r of rowsBefore) {
    const c = Array.isArray(r.message?.content) ? r.message.content : [];
    const launches = c.filter(x => r.type === 'assistant' && x?.type === 'tool_use' && x.input?.run_in_background && typeof x.input?.command === 'string');
    const stubs = c.filter(x => r.type === 'user' && x?.type === 'tool_result' && bg.has(x.tool_use_id));
    launches.forEach(x => bg.add(x.id));
    if (launches.length) keep.push({ ...r, message: { ...r.message, content: launches } });
    if (stubs.length) keep.push({ ...r, message: { ...r.message, content: stubs } });
  }
  return keep;
}
