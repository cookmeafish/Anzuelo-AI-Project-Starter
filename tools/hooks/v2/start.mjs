// Engine v2 start hook (UserPromptSubmit): the reminder. At most 10 plain lines: the runbook that fits and its
// "Done when" list, which the end hook checks. Nothing about the engine itself.
import fs from 'node:fs';
import path from 'node:path';
import { route, saveTurn, ROOT } from './lib.mjs';

export const MAX_LINES = 10;
// (an upset message: mostly capitals, or the usual frustration words. Lesson (routing sample): complaints used no
// trigger phrase, so they reached no runbook)
export const upset = p => { const s = String(p), letters = s.replace(/[^A-Za-z]/g, ''); return (letters.length >= 12 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.6)
  || /\b(wtf|ugh|again\?!|why (did|would) you|you (forgot|missed|ignored|broke)|i (already )?told you|not what i asked|frustrat\w*|annoy\w*|(you|u|you're|ur|youre) (are )?not (following|listening)|i don'?t think you (understand|get it)|(is )?still (broken|wrong))\b/i.test(s); };
const has = f => fs.existsSync(path.join(ROOT, f));
export function reminder(prompt) {
  if (upset(prompt) && has('skills/learn-from-upset/SKILL.md')) return { book: null, text: 'This sounds upset: open skills/learn-from-upset/SKILL.md and follow it.' };
  const book = route(prompt);
  // (no trigger fits: the agent picks the runbook, and the end check holds the turn to the one it opened. Lesson
  // (routing sample): plain requests used no trigger phrase; growing trigger lists forever is the old engine's path)
  if (!book) return { book: null, text: has('DIRECTORY.md') ? 'If this is real work, pick the runbook in DIRECTORY.md that fits and open it.' : '' };
  const lines = [`Runbook: open ${book.file} and follow it.`];
  if (book.items.length) {
    lines.push('Done when:');
    for (const it of book.items) lines.push(`${it.n}. ${it.text.length > 140 ? it.text.slice(0, it.text.lastIndexOf(' ', 137)) + '...' : it.text}`);
  }
  // (more items than fit: the runbook has the rest)
  const text = lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES - 1), `(${lines.length - MAX_LINES + 1} more in ${book.file})`].join('\n') : lines.join('\n');
  return { book, text };
}

export function onPrompt(data) {
  const { book, text } = reminder(data.prompt || '');
  saveTurn(data.session_id, { at: new Date().toISOString(), runbook: book?.file || null });
  return text ? { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text } } : null;
}
