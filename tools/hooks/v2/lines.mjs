// Engine v2: the lines the user sees ("⚓ <name> ..."). Each kind can be hidden: config "userLines" is true (all, the
// default), false (none) or {"hide": ["praise", ...]} (the status-lines runbook). Plan: engine v2 only, 1b user lines.
import fs from 'node:fs';
import { at } from './lib.mjs';

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

// The agent's notes for this turn (.cache/turn-notes.md, unless an earlier turn wrote it last), and the problem of its
// last "Issue: <problem> | runbook: <name> | fixed when: <outcome>" line ("Issue: none - <why>" is no issue).
export const notesSince = since => { try { const f = at('.cache/turn-notes.md'); return since && fs.statSync(f).mtimeMs < since - 1000 ? '' : fs.readFileSync(f, 'utf8'); } catch { return ''; } };
export const issueOf = notes => {
  const t = ([...String(notes).matchAll(/^[\s>*_-]*issue\s*:\s*(.+)$/gim)].pop()?.[1] || '').replace(/\s+/g, ' ').trim();
  return /^none\b/i.test(t) ? '' : t.split('|')[0].trim().slice(0, 110);
};
const LEARNED = /^[\s>*_-]*learned\s*\((?:one-off|lesson|rule|check|skill|engine)\)\s*:\s*.+?\s*(?:→|->)\s*`?([^`\s,;]+)/gim;

// The line for a turn that passed the end check: the issue fixed (or only acknowledged, on a turn that changed
// nothing), the checks passed, the runbook it pulled up followed, a lesson saved. A question with no issue shows
// nothing. Lesson (the user): after a project moved to v2 these lines were gone, and the engine looked switched off.
export function passLine({ acts = {}, turn = {}, rounds = 0 } = {}) {
  const A = brand(), calls = acts.calls || [], notes = notesSince(Date.parse(turn.at || '') || 0);
  const work = calls.some(c => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name)
    || (/^(Bash|PowerShell)$/.test(c.name) && /\b(git\s+commit|writeFileSync|Set-Content|Out-File)\b|>\s*[\w./"'-]+\.\w+/.test(String(c.input?.command || ''))));
  const issue = issueOf(notes);
  const book = turn.runbook && calls.some(c => String(c.input?.file_path || c.input?.command || '').replace(/\\/g, '/').includes(turn.runbook))
    ? turn.runbook.replace(/^.*?([\w-]+)(?:\/SKILL)?\.md$/, '$1') : '';
  const learned = [...new Set([...`${acts.said || ''}\n${notes}`.matchAll(LEARNED)].map(m => m[1]))];
  const passed = [`${A} ✅ checks passed${rounds ? ` after ${rounds} fix round${rounds > 1 ? 's' : ''}` : ''}`,
    ...(book ? [`📖 the ${book} runbook it pulled up was followed`] : []), ...(learned.length ? [`🧠 lesson saved in ${learned.slice(0, 2).join(', ')}`] : [])];
  return visible([issue ? `${A} 🚨 ${work ? 'fixed' : 'acknowledged'}: ${issue}` : '', work ? passed.join(' · ') : ''].filter(Boolean).join('\n'));
}
