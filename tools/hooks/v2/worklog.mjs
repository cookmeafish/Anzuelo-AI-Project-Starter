// Engine v2: the work log, one per session: each ask the user typed (the request and every message typed while the agent
// worked) and each promise the agent made ("I'll ..."). The engine fills it; nothing is asked of the agent. An item
// closes on evidence: a later text of the agent's that names it (shares its key words), or `hooks.mjs log done|wait
// "<item>"`. The end check lists what is still open; the reminder shows it only when there is any. User rule
// (2026-11-12): nothing the user asks or the agent promises is dropped without being done, declined with a reason, or
// handed back. Lesson (a live case): of four messages typed in a minute, the agent worked on the last, and the first
// three were never mentioned again. Plan: docs/plans/2026-11-12-nothing-forgotten.md
import fs from 'node:fs';
import path from 'node:path';
import { at } from './lib.mjs';
import { keys } from './late.mjs';

const file = sid => at(`tools/hooks/state/v2-log.${String(sid || 'x').replace(/[^\w-]/g, '').slice(0, 64)}.json`);
export const loadLog = sid => { try { return JSON.parse(fs.readFileSync(file(sid), 'utf8')).items || []; } catch { return []; } };
const saveLog = (sid, items) => { if (!sid || process.env.V2_NO_STATE || process.env.STARTER_BENCH) return;
  try { fs.mkdirSync(path.dirname(file(sid)), { recursive: true }); fs.writeFileSync(file(sid), JSON.stringify({ items: items.slice(-100) })); } catch { } };
// (thanks, a yes, "go on": no ask. Nor a message from another session, a helper or the host: not the user's)
const CHAT = /^\s*(?:thanks?(?: you)?|thx|ok(?:ay)?|cool|great|nice|perfect|good|yes|yep|yeah|no|nope|sure|lol|got it|sounds good|go ahead|go on|continue|keep going|gracias|vale|s[ií])\b[\s.!]*$/i;
const NOT_USER = /<(cross-session-message|agent-message|task-notification|system-reminder)\b|^\s*(Another Claude session sent a message|This session is being continued|Stop hook feedback|\[SYSTEM NOTIFICATION)/i;
const textOf = c => Array.isArray(c) ? c.filter(b => b?.type === 'text').map(b => b.text).join('\n') : String(c || '');
// The asks in a typed message: each line or sentence with key words (a list item, a question, an order); at most 6.
export function asksIn(msg) {
  const t = textOf(msg).replace(/\[Image[^\]]*\]/g, ' ').trim();
  if (!t || NOT_USER.test(t) || t.startsWith('<') || CHAT.test(t) || t.length > 6000) return [];
  const bits = t.split(/\n+|(?<=[.!?])\s+(?=[A-Z¿¡])/).map(s => s.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim()).filter(s => s.length > 3 && !CHAT.test(s) && keys(s).length);
  return (bits.length > 6 ? [t.replace(/\s+/g, ' ')] : bits).map(s => s.slice(0, 300));
}
// A later text of the agent's names the item: half its key words, at least one (two once it has four or more).
const named = (item, text) => { const w = keys(item), k = new Set(keys(text)); return w.length > 0 && w.filter(x => k.has(x)).length >= Math.max(w.length >= 4 ? 2 : 1, Math.round(w.length / 2)); };
const PROMISE = /\b(?:I'll|I will|I'm going to|next,? I'll|then I'll)\s+([^.\n]{8,160})/gi;
// The log brought up to date: new asks (msgs: [{ text, at }]), the agent's promises in its texts ([{ t, at }]), and each
// open item closed by a later text that names it. Returns the open items, oldest first.
export function update(sid, { msgs = [], texts = [] } = {}) {
  const items = loadLog(sid), have = new Set(items.map(i => i.text));
  const add = (text, from, when) => { if (!have.has(text)) { items.push({ text, from, at: when, status: 'open' }); have.add(text); } };
  for (const m of msgs) for (const a of asksIn(m.text)) add(a, 'user', m.at || new Date().toISOString());
  for (const x of texts) for (const p of String(x.t).matchAll(PROMISE)) add(`${p[1].trim()} (your promise)`, 'promise', x.at);
  for (const it of items) if (it.status === 'open' && texts.some(x => x.at > it.at && named(it.text.replace(/ \(your promise\)$/, ''), x.t))) it.status = 'done';
  saveLog(sid, items);
  return items.filter(i => i.status === 'open');
}
// `hooks.mjs log add|done|wait "<item>"`: the agent adds an item, or closes or parks the open one its words name.
export function logCommand(sid, verb, text) {
  const items = loadLog(sid), hit = items.find(i => i.status === 'open' && (i.text === text || named(i.text, text)));
  if (verb === 'add') items.push({ text: String(text).slice(0, 300), from: 'agent', at: new Date().toISOString(), status: 'open' });
  else if (hit && /^(done|wait)$/.test(verb)) hit.status = verb === 'done' ? 'done' : 'wait';
  else return `log: no open item matches "${text}"`;
  saveLog(sid, items); return `log: ${verb} "${(verb === 'add' ? text : hit.text).slice(0, 80)}"`;
}
// What the user typed in transcript rows: the request, queued messages and ones typed mid-turn (text parts of a message
// with a picture too, never "[object Object]"), each with its time.
export const typedMsgs = rows => rows.flatMap(r => { const c = r.message?.content, w = textOf(c);
  if (r.type === 'attachment' && r.attachment?.type === 'queued_command') return [{ text: textOf(r.attachment.prompt), at: r.timestamp || '' }];
  if (r.type !== 'user' || r.isMeta || r.isCompactSummary) return [];
  const m = /The user sent a new message while you were working:\s*([\s\S]*?)(?:\n\s*This is how Claude Code surfaces|$)/.exec(w);
  return m ? [{ text: m[1], at: r.timestamp || '' }] : Array.isArray(c) && c.some(b => b?.type === 'tool_result') ? [] : [{ text: w, at: r.timestamp || '' }]; });
// The agent's texts in transcript rows, each with its time, for closing items and finding promises.
export const agentTexts = rows => rows.flatMap(r => r.type === 'assistant' && Array.isArray(r.message?.content) ? r.message.content.filter(b => b?.type === 'text' && b.text.trim()).map(b => ({ t: b.text, at: r.timestamp || '' })) : []);
// The project's queue: the open boxes of the "## Queue" sections in its status file (the starter's own in the starter),
// not one marked as waiting on the user. Keep-working: a turn that ticked a queue box is told the next one, so the work
// goes on without the user asking. The user, 2026-11-12: "the user shouldn't have to slow down for the agent"
export const QUEUE_FILES = ['docs/STATUS.md', 'tools/starter/STATUS.md'];
export function queueOpen(read) {
  return QUEUE_FILES.flatMap(f => (String(read(f) || '').split(/^## /m).filter(s => /^Queue\b/i.test(s)).join('\n').match(/^- \[ \] .+$/gm) || [])
    .map(l => l.replace(/^- \[ \] /, '').trim()).filter(l => !/waiting on (you|the user)|waits on the user/i.test(l)).map(text => ({ text, file: f })));
}
export const tickedQueue = calls => calls.some(c => /^(Edit|MultiEdit)$/.test(c.name) && /(^|[\\/])STATUS\.md$/.test(String(c.input?.file_path || ''))
  && /- \[ \]/.test(JSON.stringify(c.input?.old_string ?? c.input?.edits ?? '')) && /- \[x\]/i.test(JSON.stringify(c.input?.new_string ?? c.input?.edits ?? '')));
export const openLines = (open, n = 5) => open.slice(0, n).map(i => `- ${i.text}${i.from === 'user' && i.at ? ` (${String(i.at).slice(11, 16)})` : ''}`).join('\n');
