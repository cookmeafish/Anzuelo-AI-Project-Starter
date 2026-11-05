// Engine v2 start hook (UserPromptSubmit): the reminder. At most 10 plain lines: the runbook that fits and its
// "Done when" list, which the end hook checks. Nothing about the engine itself.
import { route, saveTurn } from './lib.mjs';

export const MAX_LINES = 10;
export function reminder(prompt) {
  const book = route(prompt);
  if (!book) return { book: null, text: '' };
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
