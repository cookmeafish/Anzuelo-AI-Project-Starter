// Engine v2 end hook (Stop): the one check. It judges only what this session did in this turn, from its own
// transcript, and blocks with a short plain list of what is really missing until it is done (at most MAX_BLOCKS times).
import { runbooks, turnRows, turnActs, met, applies, opened, worked, loadTurn, saveTurn, testGaps, gateGaps, screenGaps, healthGaps, knowledgeGaps, securityGaps, claimGaps, questionGaps, noteGaps, quoteGaps, tail, helpersRunning, helperRuns, evidenceOf, skillBooks } from './lib.mjs';

// Check 1: the routed runbook was followed, and its checkable "Done when" items were met. With none routed, the
// runbook the agent chose and opened is the one it is held to (the runbook itself, not a skill it names: reading the
// debug skill does not make a turn a debug runbook turn. Lesson (replay): it added a block). A runbook the turn wrote
// or edited is its work, not the procedure it chose. Lesson (trial v43): a setup that wrote the vault-tidy runbook and
// read it back was held to that runbook's items.
const authored = (b, acts) => acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && String(c.input.file_path || '').replace(/\\/g, '/').endsWith(b.file));
// (a routed runbook the agent never opened, while it opened another one, gives way to that one: the router guessed, the
// agent chose. Lesson (trial v45): a page request routed to a recipe runbook on a broad trigger, the agent followed the
// feature runbook, and the end check held it to the recipe items)
const picked = (acts, books) => books.find(b => opened({ ...b, skills: [] }, acts) && !authored(b, acts));
const chosen = (turn, acts, books) => { const routed = turn.runbook && books.find(b => b.file === turn.runbook); return routed && !opened(routed, acts) ? picked(acts, books.filter(b => b !== routed)) || routed : routed || picked(acts, books); };
export function missing(turn, acts, books = runbooks()) {
  const book = chosen(turn, acts, books);
  if (!book || !worked(acts)) return [];
  const out = [];
  if (!opened(book, acts)) out.push(`Open ${book.file} and check the work against its steps.`);
  for (const it of book.items) if (applies(it, acts) && met(it, acts) === false) out.push(`${book.file} item ${it.n}: ${it.text}`);
  return out;
}

// The checkable items of each skill with a route of its own that the turn opened (beside the runbook): a rule a skill
// carries is held like a runbook's. Only marked items count; its judgment items stay the skill's own. Lesson
// (2026-11-07): the skills' "Done when" lists were never read, so the rules the skills and packs carry went unchecked.
export function skillMissing(acts, books = skillBooks()) {
  if (!worked(acts)) return [];
  return books.filter(s => opened({ ...s, skills: [] }, acts) && !authored(s, acts))
    .flatMap(s => s.items.filter(it => it.kind && applies(it, acts) && met(it, acts) === false).map(it => `${s.file} item ${it.n}: ${it.text}`));
}

// A fresh reviewer, once per turn, before the answer, when it pays: the user was upset with the work (the agent's own
// fix tends to cover only the case shown), risky work is about to be called done (security-sensitive code, a release
// or publish), or the runbook asks for an outside read of its judgment items ("review: helper"). One helper covers all of
// it, on a cheaper model, with only the facts it needs, never the agent's reasoning. Lesson (the user, 2026-11-07): a
// second agent that hasn't seen the work finds what the first one is blind to, and its cost must stay small.
const RELEASE = /\bgit\s+tag\s+(-[as]\s+)?v?\d|\bgh\s+release\s+create\b|\bnpm\s+publish\b|\bgit\s+push\b[^\n]*--tags\b/i;
export function reviewGaps(turn, acts, books = runbooks()) {
  if (!worked(acts)) return [];
  const book = chosen(turn, acts, books), why = [];
  if (turn.upset) why.push('the user\'s complaint, and every file the fix touched: find every case of the same problem, not only the one named');
  if (securityGaps(acts).length || acts.calls.some(c => /^(Bash|PowerShell)$/.test(c.name) && RELEASE.test(String(c.input.command || '')) && !/--dry-run/.test(String(c.input.command || ''))))
    why.push('the changed files: follow skills/security-review/SKILL.md on them and report each FAIL');
  const judged = book && /^review:\s*helper\b/m.test(book.front || '') ? book.items.filter(it => applies(it, acts) && met(it, acts) === null) : [];
  if (judged.length) why.push(`what the work produced, against these items of ${book.file}: ${judged.map(it => it.n).join(', ')}`);
  if (!why.length) return [];
  const asked = acts.calls.some(c => /^(Agent|Task)$/.test(c.name) && /\b(fresh|independent|blind|outside)\b[^\n]{0,40}\breview|has not seen/i.test(`${c.input.description || ''} ${c.input.prompt || ''}`));
  return asked ? [] : [`Before the answer, have one fresh reviewer check the work (one helper for all of it; a cheaper model such as "sonnet"; the word "fresh review" in its brief). Give it only ${why.join('; and ')}. Never your reasoning. Ask for each problem with its file and line, in under 150 words, then check what it reports and fix what holds.`];
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
// A stop after a block re-checks only what a script can check, and blocks again with what is still missing, at most
// MAX_BLOCKS times per request; the last one has the agent tell the user plainly what is not done. The verify list
// comes once. Lesson (the user, 2026-11-07): the end check is there to make sure the work gets done, and one block
// let an agent that ignored it end the turn with the work undone.
export const MAX_BLOCKS = 3;
function judge(data, { shadow = false } = {}) {
  // (with no saved start, the turn starts at its request's own time. Lesson (a field report): the first turn after an
  // upgrade installed v2 had no saved start, so a file a script wrote did not count, and the request was blocked twice)
  const saved = loadTurn(data.session_id), rows = turnRows(data.transcript_path || '', saved.at);
  if (data.stop_hook_active && !saved.at) return null; // (no record of the request: its blocks can't be counted)
  if (helpersRunning(rows).length) { waiting = true; return null; }
  const found = turnActs(rows);
  const turn = { ...saved, at: saved.at || found.started || '' };
  // (a helper's commands count too, in time order. Lesson (trial v40): tests a setup helper ran were asked for again)
  const runs = helperRuns(data.transcript_path || '', data.session_id || '', turn.at);
  const acts = { ...found, at: turn.at, calls: runs.length ? [...found.calls, ...runs].sort((a, b) => (a.at || 0) - (b.at || 0)) : found.calls };
  // (the final answer as the host hands it over: the transcript may not hold it yet when the Stop hook runs. Lesson
  // (2026-11-07): an answer that ended with its Finished section was blocked for lacking one)
  const final = typeof data.last_assistant_message === 'string' ? data.last_assistant_message.trim() : '';
  if (final) { acts.answer = final; if (!String(acts.said || '').includes(final)) acts.said = `${acts.said || ''}${final}\n`; }
  // (counted per request: a turn that goes on after its block and stops again, with no new request, is the same request.
  // Lesson (trial): a continuation the host did not mark as one restarted the count)
  const again = Boolean(turn.at && turn.blocked === turn.at), rounds = again ? turn.rounds || 1 : 0;
  if (rounds >= MAX_BLOCKS) return null;
  // (on a repeat, what the agent said is read from after the last block: a message sent before it can't be taken back.
  // Lesson (2026-11-07): an Issue line in the first answer re-blocked the corrected answer that had none)
  if (again && turn.lastBlock) { const after = turnActs(rows.filter(r => (Date.parse(r.timestamp || '') || 0) > turn.lastBlock)); acts.said = after.said + (final && !after.said.includes(final) ? `${final}\n` : ''); acts.answer = final || after.answer || acts.answer; }
  const history = evidenceOf(tail(data.transcript_path, 5 << 20));
  const list = [...missing(turn, acts), ...skillMissing(acts), ...reviewGaps(turn, acts), ...testGaps(acts, history), ...gateGaps(acts), ...screenGaps(acts), ...healthGaps(acts, { run: !shadow }), ...knowledgeGaps(acts), ...securityGaps(acts), ...questionGaps(acts), ...noteGaps(acts), ...quoteGaps(acts), ...claimGaps(acts, history)];
  // (a turn that ran the check on its draft has seen the verify list: the real stop does not send it back for it again.
  // Lesson (the user, 2026-11-07): the list came in the draft check and then again as a send-back, and the user read a
  // second round of the answer)
  const previewed = !shadow && (acts.calls || []).some(c => /^(Bash|PowerShell)$/.test(c.name) && /hooks\.mjs["']?\s+check\b[^\n]*--answer-file/.test(String(c.input?.command || '')));
  const check = again || previewed ? null : toVerify(turn, acts);
  if (!list.length && !check) return null;
  const parts = [], last = rounds + 1 === MAX_BLOCKS;
  // (a repeat block asks for the fix, or one line on why the item doesn't fit this work, never the same answer again.
  // Lesson (2026-11-07): an agent resent the same answer to each repeat block, and the false item was never looked at)
  if (list.length) parts.push(`${again ? 'Still not done (do it now, or say in one line of the answer why it does not fit this work; resending the same answer does not count)' : 'Not done yet'}:\n${list.map(s => `- ${s}`).join('\n')}`);
  if (last) parts.push('This is the last check for this request: whatever you can\'t do, say plainly in the answer that it is not done and why.');
  if (turn.at && !shadow) saveTurn(data.session_id, { ...turn, blocked: turn.at, rounds: rounds + 1, lastBlock: Date.now() });
  if (check) parts.push(`Check that these items of ${check.file} are really done (skip any that don't fit this work):\n${check.items.map(it => `${it.n}. ${it.text}`).join('\n')}`);
  // (the user reads the last message, so it carries the whole answer, in the user's language. Lesson (trials v33, v34):
  // "finish with only what changed" made it a note like "nothing changed", in English to a Spanish-speaking user)
  // (the same answer, not a new one: lines no fix touched stay as they were, and the check itself stays out. Lesson
  // (trial v43): each resent answer was reworded, and gained lines like "no skills were added" that meant nothing to the user)
  // (and then a short note, not the whole answer again: the user's terminal shows the answer just above. Lesson (the
  // user, 2026-11-07): each block made them read the same answer again; run the check before answering instead)
  return { decision: 'block', reason: `${parts.join('\n')}\nFix what isn't done. Then tell the user in a line or two, in their language, only what changed in the answer above, with nothing about this check in it; if nothing changed for them, say nothing more. Next time, run node tools/hooks/hooks.mjs check --answer-file <your draft> before answering, so the answer goes out once.` };
}
