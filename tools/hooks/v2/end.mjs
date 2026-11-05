// Engine v2 end hook (Stop): the one check. It judges only what this session did in this turn, from its own
// transcript, and blocks at most once with a short plain list of what is really missing.
import { runbooks, turnRows, turnActs, met, opened, worked, loadTurn, testGaps, gateGaps, screenGaps, healthGaps, knowledgeGaps, securityGaps, claimGaps, tail } from './lib.mjs';

// Check 1: the routed runbook was followed, and its checkable "Done when" items were met. With none routed, the
// runbook the agent chose and opened is the one it is held to.
export function missing(turn, acts, books = runbooks()) {
  const book = (turn.runbook && books.find(b => b.file === turn.runbook)) || books.find(b => opened(b, acts));
  if (!book || !worked(acts)) return [];
  const out = [];
  if (!opened(book, acts)) out.push(`Open ${book.file} and check the work against its steps.`);
  for (const it of book.items) if (met(it, acts) === false) out.push(`${book.file} item ${it.n}: ${it.text}`);
  return out;
}

// The items of that runbook no script can check: on a turn that changed files, the agent itself goes over them once at
// the end, in the same single block, so the whole list gets done, not only its checkable part. Lesson (the user,
// 2026-11-05): the hook before reminds, the hook after has the agent verify that everything on the runbook was done.
export function toVerify(turn, acts, books = runbooks()) {
  const book = (turn.runbook && books.find(b => b.file === turn.runbook)) || books.find(b => opened(b, acts));
  if (!book || !worked(acts)) return null;
  const items = book.items.filter(it => met(it, acts) === null);
  return items.length ? { file: book.file, items } : null;
}

// (in shadow, the health check is not run, only noted: the old engine's turn must not wait on it)
export function onStop(data, { shadow = false } = {}) {
  if (data.stop_hook_active) return null; // at most one block per turn
  const turn = loadTurn(data.session_id), acts = { ...turnActs(turnRows(data.transcript_path || '')), at: turn.at };
  const list = [...missing(turn, acts), ...testGaps(acts), ...gateGaps(acts), ...screenGaps(acts), ...healthGaps(acts, { run: !shadow }), ...knowledgeGaps(acts), ...securityGaps(acts), ...claimGaps(acts, tail(data.transcript_path, 5 << 20))];
  const check = toVerify(turn, acts);
  if (!list.length && !check) return null;
  const parts = [];
  if (list.length) parts.push(`Not done yet:\n${list.map(s => `- ${s}`).join('\n')}`);
  if (check) parts.push(`Check that these items of ${check.file} are really done (skip any that don't fit this work):\n${check.items.map(it => `${it.n}. ${it.text}`).join('\n')}`);
  return { decision: 'block', reason: `${parts.join('\n')}\nFix what isn't done, then finish with only what changed.` };
}
