// Engine v2: the lines the user sees ("⚓ <name> ..."). Each kind can be hidden: config "userLines" is true (all, the
// default), false (none) or {"hide": ["praise", ...]} (the status-lines runbook). Plan: engine v2 only, 1b user lines.
import fs from 'node:fs';
import { at, notesOf } from './lib.mjs';
import { clip } from '../writing.mjs';

const json = f => { try { return JSON.parse(fs.readFileSync(at(f), 'utf8')); } catch { return {}; } };
export const LINE_KINDS = { upset: '🚨', question: '💬', rule: '📜', runbook: '📖', skill: '⚡', checklist: '✅', passed: '✅', praise: '🌟',
  pause: '⏸️', scope: '🔒', 'left-open': '📌', 'new-task': '🌱', session: '🟢', resumed: '🔁',
  critical: '❗', blocked: '🛡️', upgrade: '🔄', plan: '🗺️', routine: '⏰', inbox: '📥', feedback: '📨', harden: '🔧', stale: '🕰️',
  lesson: '🧠', asking: '❓', 'not-fit': '🚫' };
// REQ: engine-parity. What becomes of each kind under v2: "v2: <function>" where it is shown, "dropped: <why>" decided
// with the user, "open: <why>" not shown yet (named in the v2-only plan). A kind with no entry fails the self-test.
// Lesson (the user): a project moved to v2 lost its end-of-turn lines unseen; nothing compared what each engine showed.
export const V2_SHOWS = { upset: 'v2: acknowledgedLine, passLine', passed: 'v2: passLine', lesson: 'v2: passLine', runbook: 'v2: runningLine',
  skill: 'v2: runningLine', question: 'v2: lateMessages', blocked: 'v2: deny', critical: 'v2: deny, sessionUserLine',
  checklist: 'dropped: the end check verifies the runbook items itself; the count was the optional v1 ledger',
  session: 'dropped: no "on duty" line (the user)', resumed: 'dropped: intact files are implied (the user)',
  ...Object.fromEntries(['upgrade', 'plan', 'routine', 'inbox', 'feedback', 'harden', 'stale'].map(k => [k, 'dropped: a chore the agent does, shown as "running" or "improving" (the user)'])),
  ...Object.fromEntries(['rule', 'praise', 'pause', 'scope', 'left-open', 'new-task', 'asking', 'not-fit'].map(k => [k, 'open: v1 showed it at the prompt or the end; not in v2 yet'])) };
export const brand = () => `⚓ ${json('docs/names.json').STARTER_NAME || 'Project checks'}`;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The text with the hidden kinds taken out: a whole line when it starts with one, else its " · " part.
export function visible(text, set = json('tools/hooks/config.json').userLines ?? true) {
  if (set === false || !text) return '';
  const hide = new Set([].concat(set?.hide || []).map(String));
  const icons = Object.entries(LINE_KINDS).filter(([k]) => hide.has(k)).map(([, i]) => i);
  // ("passed" hides the "checks passed" part; the checklist count beside it is the runbook's)
  const off = seg => /checks passed/.test(seg) ? hide.has('passed') : icons.some(i => seg.replace(new RegExp(`^${esc(brand())}\\s*`), '').startsWith(i));
  return String(text).split('\n').map(line => { const segs = line.split(' · '); return off(segs[0]) ? '' : segs.filter((s, i) => !i || !off(s)).join(' · '); })
    .filter(Boolean).join('\n');
}

// The problem of the turn's last "Issue: <problem> | runbook: ... | fixed when: ..." line ("Issue: none" is no issue).
export const issueOf = notes => {
  const t = ([...String(notes).matchAll(/^[\s>*_-]*issue\s*:\s*(.+)$/gim)].pop()?.[1] || '').replace(/\s+/g, ' ').trim();
  return /^none\b/i.test(t) ? '' : clip(t.split('|')[0]);
};
const LEARNED = /^[\s>*_-]*learned\s*\((?:one-off|lesson|rule|check|skill|engine)\)\s*:\s*.+?\s*(?:→|->)\s*`?([^`\s,;]+)/gim;

// The line for a turn that passed the end check, each part only on this turn's own evidence (the user's rule,
// 2026-11-12: show only what really happened): ✅ when the end check really checked something, 📖 when the runbook it
// held the turn to was met, 🌱 for a runbook written, 🧠 for a lesson file this turn changed. 🚨 here only for an Issue
// line said in the answer and never written to the notes (a written one was shown when written); never "fixed".
// Lesson (2026-11-12): every part of this line was shown false the same day.
export const passLine = arg => visible(passText(arg));
// The pass line's text, before the user's settings hide any part of it. evidence: what the end check proved
// ({ checked, book, written }), passed in by end.mjs.
export function passText({ acts = {}, turn = {}, rounds = 0, evidence = {} } = {}) {
  const A = brand(), calls = acts.calls || [], notes = notesOf({ ...acts, at: turn.at, notesAt: turn.notesAt, notesSha: turn.notesSha });
  const written = new Set(evidence.written || []), issue = issueOf(notes) ? '' : issueOf(String(acts.said || '').replace(/\*\*/g, ''));
  const made = [...written].filter(f => /^docs\/playbooks\/[\w-]+\.md$/.test(f) && calls.some(c => c.name === 'Write' && String(c.input?.file_path || '').replace(/\\/g, '/').endsWith(f)));
  const book = evidence.book && !made.includes(evidence.book) ? evidence.book.replace(/^.*?([\w-]+)(?:\/SKILL)?\.md$/, '$1') : '';
  // (a lesson line counts only for a file this turn changed: an old "learned → x" names nothing done now)
  const learned = [...new Set([...`${acts.said || ''}\n${notes}`.matchAll(LEARNED)].map(m => m[1]).filter(f => [...written].some(w => w === f || w.endsWith(`/${f}`))))];
  const parts = [...(book ? [`📖 the ${book} runbook was followed`] : []), ...made.slice(0, 2).map(f => `🌱 new runbook made: ${f}`), ...(learned.length ? [`🧠 lesson saved in ${learned.slice(0, 2).join(', ')}`] : [])];
  const ok = evidence.checked ? [`${A} ✅ checks passed${rounds ? ` after ${rounds} fix round${rounds > 1 ? 's' : ''}` : ''}`, ...parts] : parts.length ? [`${A} ${parts.shift()}`, ...parts] : [];
  return [issue ? `${A} 🚨 acknowledged: ${issue}` : '', ok.join(' · ')].filter(Boolean).join('\n');
}
