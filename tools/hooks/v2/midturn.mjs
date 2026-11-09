// What the user types while an agent works, at the agent's next tool call. A message typed into a busy chat waits in
// a queue, and one passed to a busy helper carries text only ("[Image #45] ..." without the picture). Lessons (the
// user): a helper went on working for minutes while the user's questions waited unanswered, and asked four times for
// screenshots that were on disk the whole time (Claude Code keeps each pasted picture as images/<N>.<ext> in the main
// session's temp folder).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The last 2 MB of the agent's own transcript: this runs at every tool call.
const tail = f => { try { const fd = fs.openSync(f, 'r'), size = fs.fstatSync(fd).size, n = Math.min(size, 2 << 20), b = Buffer.alloc(n); fs.readSync(fd, b, 0, n, size - n); fs.closeSync(fd); return b.toString('utf8'); } catch { return ''; } };
const own = data => { const main = String(data.transcript_path || ''), id = String(data.agent_id || '').replace(/[^\w-]/g, '');
  return id && main ? data.agent_transcript_path || path.join(main.replace(/\.jsonl$/i, ''), 'subagents', `agent-${id}.jsonl`) : main; };
export const LATE = /^\s*The user sent a new message while you were working:\s*/;

// The user's messages typed after the agent last wrote to them, not answered yet: their time and text. (Messages from
// tools, other sessions and background notices start with "<" and are not the user's.)
export function lateMessages(data) {
  const out = [];
  for (const l of tail(own(data)).split('\n')) {
    let r; try { r = JSON.parse(l); } catch { continue; }
    const c = r.message?.content;
    if (r.type === 'assistant' && Array.isArray(c) && c.some(b => b.type === 'text' && b.text.trim())) out.length = 0;
    // (a message with a picture is a list of parts: its text parts are the message. Lesson (live): one showed as
    // "[object Object]")
    const words = p => Array.isArray(p) ? p.filter(b => b?.type === 'text').map(b => b.text).join('\n') : String(p || '');
    const q = r.type === 'attachment' && r.attachment?.type === 'queued_command' ? words(r.attachment.prompt)
      : r.type === 'user' && LATE.test(words(c)) ? words(c) : '';
    const text = q.replace(LATE, '').replace(/\n*This is how Claude Code surfaces[\s\S]*$/, '').trim();
    if (text && !text.startsWith('<')) out.push({ at: r.timestamp || '', text });
  }
  return out;
}

// For a helper: the newest typed message that names more pictures than it carries, with the saved files for them.
export function missingImages(data, tmp = os.tmpdir()) {
  if (!data.agent_id || !data.transcript_path) return null;
  let last = null;
  for (const l of tail(own(data)).split('\n')) {
    if (!l.includes('[Image #')) continue;
    let r; try { r = JSON.parse(l); } catch { continue; }
    if (r.type !== 'user') continue;
    const c = r.message?.content, blocks = Array.isArray(c) ? c : [{ type: 'text', text: String(c || '') }];
    const nums = [...blocks.filter(b => b?.type === 'text').map(b => b.text).join('\n').matchAll(/\[Image #(\d+)\]/g)].map(m => m[1]);
    if (nums.length) last = blocks.filter(b => b?.type === 'image').length < nums.length ? { at: r.timestamp || '', nums } : null;
  }
  if (!last) return null;
  const dir = path.join(tmp, 'claude', path.basename(path.dirname(String(data.transcript_path))), String(data.session_id || ''), 'images');
  let names = []; try { names = fs.readdirSync(dir); } catch { }
  return { ...last, dir, files: last.nums.map(n => names.find(f => new RegExp(`^${n}\\.\\w+$`).test(f))).filter(Boolean).map(f => path.join(dir, f)) };
}

// REQ: late-answered. Which messages to tell the agent about at this tool call, given what was told before ({ key: calls since told }):
// each once, and once more after 2 further tool calls with no reply; and which told ones have their reply now.
// Lesson (2026-11-08): one note was not enough; the agent made 4 more calls and started a long run, and the question
// waited minutes.
export function lateDue(told, ms, key) {
  const now = Object.fromEntries(ms.map(m => [key(m), m])), next = {}, say = [], answered = [];
  for (const [k, n] of Object.entries(told)) if (!(k in now)) { if (n !== 'done') answered.push(k); } else next[k] = n;
  for (const [k, m] of Object.entries(now)) {
    if (!(k in next)) { next[k] = 0; say.push(m); }
    else if (typeof next[k] === 'number' && ++next[k] >= 2) { next[k] = 'again'; say.push(m); }
  }
  for (const k of answered) next[k] = 'done';
  return { say, again: say.some(m => next[key(m)] === 'again'), answered: answered.length, told: next };
}

// What the agent is told, once per message.
// (answered where the user asked: a helper's hand-back shows only in the main chat. Lesson (the user): a question typed
// into a helper's chat was answered in the main chat, and looked ignored where it was asked)
export const lateNote = (ms, again = false) => `${again ? 'Still unanswered: the' : 'The'} user wrote while you work: ${ms.map(m => `"${m.text.replace(/\s+/g, ' ').slice(0, 300)}"`).join(' and ')}. `
  + (again ? 'Write the answer as text now, before this or any other command; start long runs in the background. ' : '')
  + 'Answer it now in a line or two (a question first, in their language), as text in this chat, where they asked, then go on with the work; never leave it waiting until the work ends.';
export const imagesNote = m => `The user's message names ${m.nums.map(n => `[Image #${n}]`).join(' ')}, but the pictures did not reach you (a message `
  + 'passed to a busy helper carries text only). Do not ask the user to send them again. '
  + (m.files.length ? `Open them with the Read tool: ${m.files.join('; ')}.` : `They were not found in ${m.dir}; look in the user's Pictures\\Screenshots folder, then ask once for what is still missing.`);
