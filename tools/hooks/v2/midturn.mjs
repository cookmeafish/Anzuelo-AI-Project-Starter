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
const LATE = /^\s*The user sent a new message while you were working:\s*/;

// The user's messages typed after the agent last wrote to them, not answered yet: their time and text. (Messages from
// tools, other sessions and background notices start with "<" and are not the user's.)
export function lateMessages(data) {
  const out = [];
  for (const l of tail(own(data)).split('\n')) {
    let r; try { r = JSON.parse(l); } catch { continue; }
    const c = r.message?.content;
    if (r.type === 'assistant' && Array.isArray(c) && c.some(b => b.type === 'text' && b.text.trim())) out.length = 0;
    const q = r.type === 'attachment' && r.attachment?.type === 'queued_command' ? String(r.attachment.prompt || '')
      : r.type === 'user' && typeof c === 'string' && LATE.test(c) ? c : '';
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

// What the agent is told, once per message.
export const lateNote = ms => `The user wrote while you work: ${ms.map(m => `"${m.text.replace(/\s+/g, ' ').slice(0, 300)}"`).join(' and ')}. `
  + 'Answer it now in a line or two (a question first, in their language), then go on with the work; never leave it waiting until the work ends.';
export const imagesNote = m => `The user's message names ${m.nums.map(n => `[Image #${n}]`).join(' ')}, but the pictures did not reach you (a message `
  + 'passed to a busy helper carries text only). Do not ask the user to send them again. '
  + (m.files.length ? `Open them with the Read tool: ${m.files.join('; ')}.` : `They were not found in ${m.dir}; look in the user's Pictures\\Screenshots folder, then ask once for what is still missing.`);
