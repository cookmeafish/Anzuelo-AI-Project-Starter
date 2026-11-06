// Engine v2 end hook (Stop): the one check. It judges only what this session did in this turn, from its own
// transcript, and blocks at most once with a short plain list of what is really missing.
import { runbooks, turnRows, turnActs, met, applies, opened, worked, loadTurn, saveTurn, testGaps, gateGaps, screenGaps, healthGaps, knowledgeGaps, securityGaps, claimGaps, tail, helpersRunning, helperRuns, evidenceOf } from './lib.mjs';

// Check 1: the routed runbook was followed, and its checkable "Done when" items were met. With none routed, the
// runbook the agent chose and opened is the one it is held to (the runbook itself, not a skill it names: reading the
// debug skill does not make a turn a debug runbook turn. Lesson (replay): it added a block). A runbook the turn wrote
// or edited is its work, not the procedure it chose. Lesson (trial v43): a setup that wrote the vault-tidy runbook and
// read it back was held to that runbook's items.
const authored = (b, acts) => acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && String(c.input.file_path || '').replace(/\\/g, '/').endsWith(b.file));
const chosen = (turn, acts, books) => (turn.runbook && books.find(b => b.file === turn.runbook)) || books.find(b => opened({ ...b, skills: [] }, acts) && !authored(b, acts));
export function missing(turn, acts, books = runbooks()) {
  const book = chosen(turn, acts, books);
  if (!book || !worked(acts)) return [];
  const out = [];
  if (!opened(book, acts)) out.push(`Open ${book.file} and check the work against its steps.`);
  for (const it of book.items) if (applies(it, acts) && met(it, acts) === false) out.push(`${book.file} item ${it.n}: ${it.text}`);
  return out;
}

// The items of that runbook no script can check: on a turn that changed files, the agent itself goes over them once at
// the end, in the same single block, so the whole list gets done, not only its checkable part. Lesson (the user,
// 2026-11-05): the hook before reminds, the hook after has the agent verify that everything on the runbook was done.
export function toVerify(turn, acts, books = runbooks()) {
  const book = chosen(turn, acts, books);
  if (!book || !worked(acts)) return null;
  const items = book.items.filter(it => applies(it, acts) && met(it, acts) === null);
  return items.length ? { file: book.file, items } : null;
}

// (in shadow, the health check is not run, only noted: the old engine's turn must not wait on it)
// A Stop that passes ends the turn: the next request starts a new one, and a message before then joins this one.
// (while a helper started this turn still works, the turn is not over: no check yet, and the turn stays open, so the
// Stop after the helper reports back judges the whole of it)
let waiting = false;
export function onStop(data, opts = {}) {
  waiting = false;
  const out = judge(data, opts);
  if (!out && !waiting && !opts.shadow) { const t = loadTurn(data.session_id); if (t.at) saveTurn(data.session_id, { ...t, ended: true }); }
  return out;
}
function judge(data, { shadow = false } = {}) {
  if (data.stop_hook_active) return null; // at most one block per turn
  // (with no saved start, the turn starts at its request's own time. Lesson (a field report): the first turn after an
  // upgrade installed v2 had no saved start, so a file a script wrote did not count, and the request was blocked twice)
  const saved = loadTurn(data.session_id), rows = turnRows(data.transcript_path || '', saved.at);
  if (helpersRunning(rows).length) { waiting = true; return null; }
  const found = turnActs(rows);
  const turn = { ...saved, at: saved.at || found.started || '' };
  // (a helper's commands count too, in time order. Lesson (trial v40): tests a setup helper ran were asked for again)
  const runs = helperRuns(data.transcript_path || '', data.session_id || '', turn.at);
  const acts = { ...found, at: turn.at, calls: runs.length ? [...found.calls, ...runs].sort((a, b) => (a.at || 0) - (b.at || 0)) : found.calls };
  // (and per request: a turn that goes on after its block and stops again, with no new request, is not blocked again.
  // Lesson (trial): one request got the same list 3 times, each stop after a continuation the host did not mark)
  if (turn.at && turn.blocked === turn.at) return null;
  const list = [...missing(turn, acts), ...testGaps(acts), ...gateGaps(acts), ...screenGaps(acts), ...healthGaps(acts, { run: !shadow }), ...knowledgeGaps(acts), ...securityGaps(acts), ...claimGaps(acts, evidenceOf(tail(data.transcript_path, 5 << 20)))];
  const check = toVerify(turn, acts);
  if (!list.length && !check) return null;
  const parts = [];
  if (list.length) parts.push(`Not done yet:\n${list.map(s => `- ${s}`).join('\n')}`);
  if (turn.at && !shadow) saveTurn(data.session_id, { ...turn, blocked: turn.at });
  if (check) parts.push(`Check that these items of ${check.file} are really done (skip any that don't fit this work):\n${check.items.map(it => `${it.n}. ${it.text}`).join('\n')}`);
  // (the user reads the last message, so it carries the whole answer, in the user's language. Lesson (trials v33, v34):
  // "finish with only what changed" made it a note like "nothing changed", in English to a Spanish-speaking user)
  // (the same answer, not a new one: lines no fix touched stay as they were, and the check itself stays out. Lesson
  // (trial v43): each resent answer was reworded, and gained lines like "no skills were added" that meant nothing to the user)
  return { decision: 'block', reason: `${parts.join('\n')}\nFix what isn't done. Then give your whole answer to the user again, in their language: the same answer, changed only where a fix changed something, with nothing about this check in it. It is the message they read last.` };
}
