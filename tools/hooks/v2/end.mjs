// Engine v2 end hook (Stop): the one check. It judges only what this session did in this turn, from its own
// transcript, and blocks at most once with a short plain list of what is really missing.
import { runbooks, turnRows, turnActs, met, opened, worked, loadTurn, testGaps } from './lib.mjs';

// Check 1: the routed runbook was followed, and its checkable "Done when" items were met.
export function missing(turn, acts, books = runbooks()) {
  const book = turn.runbook && books.find(b => b.file === turn.runbook);
  if (!book || !worked(acts)) return [];
  const out = [];
  if (!opened(book, acts)) out.push(`Open ${book.file} and check the work against its steps.`);
  for (const it of book.items) if (met(it, acts) === false) out.push(`${book.file} item ${it.n}: ${it.text}`);
  return out;
}

export function onStop(data) {
  if (data.stop_hook_active) return null; // at most one block per turn
  const turn = loadTurn(data.session_id), acts = { ...turnActs(turnRows(data.transcript_path || '')), at: turn.at };
  const list = [...missing(turn, acts), ...testGaps(acts)];
  if (!list.length) return null;
  return { decision: 'block', reason: `Not done yet:\n${list.map(s => `- ${s}`).join('\n')}\nDo these, then finish with only what changed.` };
}
