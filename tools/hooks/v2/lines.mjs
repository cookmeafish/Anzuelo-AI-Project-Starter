// Engine v2: the lines the user sees ("⚓ <name> ..."). Each kind can be hidden: config "userLines" is true (all, the
// default), false (none) or {"hide": ["praise", ...]} (the status-lines runbook). Plan: engine v2 only, 1b user lines.
import fs from 'node:fs';
import { at, notesOf } from './lib.mjs';

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
  return /^none\b/i.test(t) ? '' : t.split('|')[0].trim().slice(0, 110);
};
const LEARNED = /^[\s>*_-]*learned\s*\((?:one-off|lesson|rule|check|skill|engine)\)\s*:\s*.+?\s*(?:→|->)\s*`?([^`\s,;]+)/gim;

// The line for a turn that passed the end check: the issue acknowledged (never "fixed" until the evidence model proves
// it; a file change is no proof: docs/plans/2026-11-12-evidence-model.md), the checks passed, the runbook it pulled up followed, a lesson saved. A question with no issue shows
// nothing. Lesson (the user): after a project moved to v2 these lines were gone, and the engine looked switched off.
export const passLine = arg => visible(passText(arg));
// The pass line's text, before the user's settings hide any part of it.
export function passText({ acts = {}, turn = {}, rounds = 0 } = {}) {
  const A = brand(), calls = acts.calls || [], notes = notesOf({ at: turn.at, notesAt: turn.notesAt, notesSha: turn.notesSha });
  const work = calls.some(c => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name)
    || (/^(Bash|PowerShell)$/.test(c.name) && /\b(git\s+commit|writeFileSync|Set-Content|Out-File)\b|>\s*[\w./"'-]+\.\w+/.test(String(c.input?.command || ''))));
  // (REQ: upset-acknowledged: an Issue line the agent wrote in its own text, with none in the notes, is acknowledged too,
  // as the old engine did by copying it to the notes. The end check still reads only the notes and file writes, so a line
  // dropped after a block holds nothing. Lesson (the old suite under v2): the line was in the chat, and the user saw no
  // "acknowledged")
  const issue = issueOf(notes) || issueOf(String(acts.said || '').replace(/\*\*/g, ''));
  // (a runbook the turn wrote new is shown as made, never as "pulled up": it was not there to pull up. Lesson (the old
  // suite under v2): a runbook made this turn whose triggers fit the request read as followed)
  const made = [...new Set(calls.filter(c => c.name === 'Write').map(c => String(c.input?.file_path || '').replace(/\\/g, '/').replace(/^.*?(docs\/playbooks\/[\w-]+\.md)$/, '$1')).filter(f => /^docs\/playbooks\/[\w-]+\.md$/.test(f)))];
  const book = turn.runbook && !made.some(f => String(turn.runbook).replace(/\\/g, '/').endsWith(f)) && calls.some(c => String(c.input?.file_path || c.input?.command || '').replace(/\\/g, '/').includes(turn.runbook))
    ? turn.runbook.replace(/^.*?([\w-]+)(?:\/SKILL)?\.md$/, '$1') : '';
  const learned = [...new Set([...`${acts.said || ''}\n${notes}`.matchAll(LEARNED)].map(m => m[1]))];
  const passed = [`${A} ✅ checks passed${rounds ? ` after ${rounds} fix round${rounds > 1 ? 's' : ''}` : ''}`,
    ...(book ? [`📖 the ${book} runbook it pulled up was followed`] : []), ...made.slice(0, 2).map(f => `🌱 new runbook made: ${f}`), ...(learned.length ? [`🧠 lesson saved in ${learned.slice(0, 2).join(', ')}`] : [])];
  return [issue ? `${A} 🚨 acknowledged: ${issue}` : '', work ? passed.join(' · ') : ''].filter(Boolean).join('\n');
}
