// Engine v2 end hook (Stop): the one check. It judges only what this session did in this turn, from its own
// transcript, and blocks with a short plain list of what is really missing until it is done (at most MAX_BLOCKS times).
import fs from 'node:fs';
import path from 'node:path';
import { passLine } from './lines.mjs';
import { unansweredLate, asksOnly } from './late.mjs';
import { PAUSE_ASK } from '../pause.mjs';
import { wakeGaps } from '../wakeups.mjs';
import { forbiddenGaps, codeRuleGaps, injectionGaps, verbatimGaps, CRASHED, crashLine, logStop, upgradeGaps, autoRuns, sessionStart, changedOf, projectConfig, inGlobs, priorCalls, filesMatching } from './lib.mjs';
import { ROOT, at, runbooks, turnRows, turnActs, met, applies, opened, worked, loadTurn, saveTurn, testGaps, gateGaps, screenGaps, healthGaps, knowledgeGaps, securityGaps, claimGaps, questionGaps, noteGaps, quoteGaps, tail, helpersRunning, backgroundRuns, helperRuns, evidenceGaps, evidenceOf, skillBooks, alwaysGaps, scopeGaps, earlierPrompts, ALWAYS, engineCheckGaps } from './lib.mjs';
// (the two data tables, one evaluator each: the project's always list and the engine's own checks)
// (each check runs on its own: one that throws is named once with its error, and the rest still run)
const S = (name, f) => { try { return f(); } catch (e) { return [crashLine(name, e)]; } };
const tableGaps = acts => [...alwaysGaps(acts), ...engineCheckGaps(acts), ...forbiddenGaps(acts), ...codeRuleGaps(acts), ...injectionGaps(acts), ...verbatimGaps(acts)];

// Check 1: the routed runbook, else the one the agent opened (not a skill it names), was followed and its checkable
// "Done when" items met. A runbook the turn wrote or changed, by a script too, is its work, not its procedure.
const authored = (b, acts) => acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && String(c.input.file_path || '').replace(/\\/g, '/').endsWith(b.file))
  // (a command that writes: one that only reads the runbook, after an upgrade rewrote it, is following it. Lesson (a
  // project's report): an upgrade turn that read the engine runbook with Get-Content was held to the routed one)
  || (acts.calls.some(c => /^(Bash|PowerShell)$/.test(c.name) && String(c.input.command || '').replace(/\\/g, '/').includes(b.file)
    && /WriteAllText|Set-Content|Out-File|Add-Content|writeFileSync|\bsed\s+-i|\btee\b|>>?\s*["']?[\w./-]*\.md\b|\.Replace\(|\.replace\(/.test(String(c.input.command || '')))
    && (() => { const since = Date.parse(acts.at || '') || 0; try { return since > 0 && fs.statSync(at(b.file)).mtimeMs > since; } catch { return false; } })());
// (a routed runbook never opened gives way to the one the agent opened: the router guessed, the agent chose)
const picked = (acts, books) => books.find(b => opened({ ...b, skills: [] }, acts) && !authored(b, acts));
// (the routed one too: a turn that edited its own routed runbook was changing the procedure, not following it. Lesson
// (a project's report): adding a marker to the routed runbook held the turn to that runbook's items)
const chosen = (turn, acts, books) => { const routed = turn.runbook && books.find(b => b.file === turn.runbook && !authored(b, acts)); return routed && !opened(routed, acts) ? picked(acts, books.filter(b => b !== routed)) || routed : routed || picked(acts, books); };
// A runbook item the answer says, in one line, does not fit this work is cleared: the line names it ("item 3") and
// says why. Lesson (a project's report): the block offered that way out, and the line that took it was held again.
// (or names a path the item names, and says why in plain words: agents rarely write "item 3")
const NOFIT = /\b((?:do|does)(?:n['’]t| not) (?:fit|apply)|not (?:applicable|needed|relevant)|n\/a|(?:was|is)(?:n['’]t| not) part of|not part of|never asked|not asked|(?:is|was)(?:n['’]t| not) for (?:this|that|a|an)|not for this|(?:does|did)(?:n['’]t| not) (?:follow|use) it because)\b/i;
// A plain "not run yet" with its reason in the same or the next sentence clears the item that shares at least two of
// its words (stems). Lesson (2026-11-08): "the full suite hasn't run; it runs before the release" was held 3 rounds.
const NOTDONE = /\b(?:has|have|was|were|is|are|did)(?:n['’]t| not)(?: yet)? (?:been )?(?:run|done|pushed|committed|started)\b|\bnot (?:yet )?(?:run|pushed|committed|done|verified)\b|\bdeferred\b/i;
const REASON = /\b(because|since|until|before|after|waits? (?:for|until)|so that)\b|\s[-–:]\s/i;
const STOP = new Set(['user', 'only', 'this', 'that', 'with', 'from', 'have', 'been', 'work', 'done', 'what', 'when', 'your', 'they', 'then', 'than', 'item', 'answer']);
const stems = s => new Set((s.toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !STOP.has(w)).map(w => w.slice(0, 4)));
const kept = acts => {
  // (one clause at a time: "item 3 done; item 5 n/a" clears item 5 only)
  const all = String(acts.answer || acts.said || '').replace(/`/g, '').split(/\n|;|\.\s+/);
  const lines = all.filter(l => NOFIT.test(l));
  // (or "does not apply: <a reason of 3 words or more>" in one line)
  const later = all.flatMap((l, i) => (NOTDONE.test(l) && (REASON.test(l) || REASON.test(all[i + 1] || ''))) || (NOFIT.test(l) && l.slice(l.search(NOFIT)).split(/\s+/).length >= 6) ? [stems(`${l} ${all[i + 1] || ''}`)] : []);
  const about = text => { const w = stems(text); return later.some(s => [...w].filter(x => s.has(x)).length >= 2); };
  // (a line that names the runbook itself, by path, file name or "the <name> runbook", clears its "Open" ask and all
  // its items: the route was a guess. Lesson (a live false block): three rounds went on a misrouted runbook, and a plain
  // "the project runbook doesn't fit this" never cleared the ask to open it)
  const named = file => { const name = file.replace(/^.*\//, '').replace(/\.md$/, ''); return lines.some(l => l.includes(file) || l.includes(`${name}.md`) || new RegExp(`\\b${name}\\s+(runbook|playbook|skill)\\b`, 'i').test(l)); };
  return s => {
    const o = /^Open (\S+\.md) and\b/.exec(s); if (o) return !named(o[1]);
    // (an engine check, "Check: <message>": a plain "not done, because ..." about it clears it, as for runbook items)
    if (/^Check: /.test(s)) return !about(s.slice(7));
    const m = /^(\S+) item (\d+): (.*)$/.exec(s); if (!m) return true;
    // (naming the always list does not clear all of it: it is standing rules, not a runbook that may not fit)
    if ((named(m[1]) && m[1] !== ALWAYS) || about(m[3])) return false;
    m.splice(1, 1);
    const paths = (m[2].match(/[\w.-]*[\w-]\/[\w./*-]*|\b[\w-]+\.(?:md|json|mjs|js|py|ts|csv)\b/g) || []).filter(p => !/^(and|either)\/or$/i.test(p));
    return !lines.some(l => new RegExp(`\\bitems?\\s*(?:\\d+\\s*(?:,|and)\\s*)*${m[1]}\\b`, 'i').test(l) || paths.some(p => l.includes(p)));
  };
};
export const waived = (acts, list) => list.filter(kept(acts));
// REQ: waiver-tally. The turns that waved each check away (cleared by "doesn't fit" or "not done, because"), the last
// 20 per check in tools/hooks/state/waivers.json, the old engine's file: a check waived in 3+ earlier turns doesn't fit
// some kind of work here, and the next block says so, so it gets fixed instead of skipped. Lesson (a field report): the
// same checks were waived build after build, and nothing pointed at a lasting fix.
const GAP_TAG = [[/^(A wakeup you scheduled is|\d+ wakeups you scheduled are) still pending/, 'wakeup-left'], [/^These files now hold a name the user asked/, 'forbidden-terms'],
  [/^Code rules broken/, 'code-rules'], [/ contain text that reads as instructions to an AI /, 'injection-guard'], [/^Something read this turn carries instructions/, 'injection-flagged'],
  [/^These files copy the user's own words/, 'no-verbatim-examples'], [/^Security-sensitive code changed /, 'security-code']];
const gapKey = s => GAP_TAG.find(([rx]) => rx.test(s))?.[1] || s.replace(/\s+/g, ' ').slice(0, 80);
export function tally(full, left, id) {
  const f = at('tools/hooks/state/waivers.json');
  let t = {}; try { t = JSON.parse(fs.readFileSync(f, 'utf8')) || {}; } catch { }
  const gone = [...new Set(full.filter(s => !left.includes(s)).map(gapKey))];
  if (id && gone.length) {
    for (const k of gone) { const ks = t[k] ||= []; if (!ks.includes(id)) { ks.push(id); if (ks.length > 20) ks.shift(); } }
    try { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(t)); } catch { }
  }
  const often = [...new Set(left.map(gapKey))].filter(k => (t[k] || []).filter(x => x !== id).length >= 3);
  return often.length ? `${often.join(', ')} ${often.length > 1 ? 'were' : 'was'} waived in 3+ earlier turns here: if ${often.length > 1 ? 'they never fit' : 'it never fits'} this kind of task, don't waive it again: tell the user in one line (the check, how often it was waived, and why), so the check gets fixed instead of skipped. Otherwise do the step.` : '';
}
// (a question the user typed whose first sentence asks for facts; not another session's note, a report or a summary.
// Replay: most research-trigger turns were summaries, and praise naming "research" was held)
const relayed = acts => /<(cross-session-message|agent-message|task-notification)\b|^This session is being continued from a previous conversation/m.test(acts.heard || '')
  || !(s => /\?|\b(research|look (it |this |that )?up|find out|compare|according to)\b/i.test(s) || /^\W*(?:\w+\W+){0,3}(what|which|who|when|where|how|is there|are there|tell me)\b/i.test(s))((/^\s*([^\n.!?]*[.!?]?)/.exec(String(acts.heard || '').replace(/<pasted_content[\s\S]*?<\/pasted_content>/g, ' ')) || [])[1] || '');

export function missing(turn, acts, books = runbooks()) {
  const book = chosen(turn, acts, books);
  // (a typed question routed to a runbook made for answers, one with an "(evidence)" item, is held to opening it and
  // its answer items; others stay free. The user, 2026-11-07: knowledge answers come from the best sources)
  const asked = book && !worked(acts) && book.file === turn.runbook && book.items.some(it => it.kind === 'evidence') && !relayed(acts);
  if (!book || (!worked(acts) && !asked)) return [];
  const out = [];
  if (!opened(book, acts)) out.push(`Open ${book.file} and ${asked ? 'answer by' : 'check the work against'} its steps.`);
  // (evidence is for answers: on a work turn, facts written into files have their own check, knowledgeGaps)
  for (const it of book.items) if ((asked ? it.kind === 'answer' || it.kind === 'evidence' : it.kind !== 'evidence') && applies(it, acts) && met(it, acts) === false)
    out.push(`${book.file} item ${it.n}: ${it.kind === 'evidence' ? evidenceGaps(acts).join(' ') : it.text}`);
  return out;
}

// The checkable items of each skill with a route of its own that the turn opened (beside the runbook): a rule a skill
// carries is held like a runbook's. Only marked items count; its judgment items stay the skill's own. Lesson
// (2026-11-07): the skills' "Done when" lists were never read, so the rules the skills and packs carry went unchecked.
export function skillMissing(acts, books = skillBooks({ parts: true })) {
  // (a typed question that opened a skill is held to its evidence items only; a work turn to all but those)
  const work = worked(acts);
  if (!work && relayed(acts)) return [];
  return books.filter(s => opened({ ...s, skills: [] }, acts) && !authored(s, acts))
    .flatMap(s => s.items.filter(it => it.kind && (work ? it.kind !== 'evidence' : it.kind === 'evidence') && applies(it, acts) && met(it, acts) === false)
      .map(it => `${s.file} item ${it.n}: ${it.kind === 'evidence' ? evidenceGaps(acts).join(' ') : it.text}`));
}

// A fresh reviewer, once per turn, when it pays (the user was upset, risky work, or "review: helper" on the runbook):
// one cheap helper given the facts, not the reasoning. The user, 2026-11-07: fresh eyes find what the first is blind to.
const RELEASE = /\bgit\s+tag\s+(-[as]\s+)?v?\d|\bgh\s+release\s+create\b|\bnpm\s+publish\b|\bgit\s+push\b[^\n]*--tags\b/i;
export function reviewGaps(turn, acts, books = runbooks()) {
  const book = chosen(turn, acts, books), why = [];
  // (an answer from 2 or more sources, on a runbook made for answers: a fresh reader checks what no script can, conflicts
  // shown side by side with their sources and inference labeled. Only then, so it stays cheap)
  const ans = String(acts.answer || ''), srcs = new Set([...ans.matchAll(/https?:\/\/[^\s)>\]"'`]+|(?:[\w.-]+\/)+[\w.-]+\.\w+/g)].map(m => m[0]));
  const answers = !worked(acts) && book && book.file === turn.runbook && book.items.some(it => it.kind === 'evidence') && srcs.size >= 2;
  if (!worked(acts) && !answers) return [];
  if (answers) why.push('the answer and the sources it cites: any conflict between sources shown side by side with each source, never merged or picked silently; inference labeled and kept apart from sourced facts');
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
let waiting = false, passed = null, decided = {};
export function onStop(data, opts = {}) {
  waiting = false; passed = null; decided = {};
  const out = judge(data, opts);
  // (each decision goes in the Stop log, "hooks.mjs last": its round, result and the steps it asked for)
  if (!opts.shadow) logStop(data.session_id, { request: decided.request || '', round: decided.round ?? null, result: out ? 'blocked' : waiting ? 'waiting' : decided.round ? 'passed' : 'ended', steps: out ? decided.steps || [] : [] });
  if (!out && !waiting && !opts.shadow) { const t = loadTurn(data.session_id); if (t.at) saveTurn(data.session_id, { ...t, ended: true }); }
  // (a turn that passed tells the user what the engine did, where the host shows it: opts.show. REQ: prompt-visible)
  const line = !out && passed && opts.show ? passLine(passed) : '';
  return out || (line ? { systemMessage: line } : null);
}
// A stop after a block re-checks only what a script can check, and blocks again with what is still missing, at most
// MAX_BLOCKS times per request; the last one has the agent tell the user plainly what is not done. The verify list
// comes once. Lesson (the user, 2026-11-07): the end check is there to make sure the work gets done, and one block
// let an agent that ignored it end the turn with the work undone.
export const MAX_BLOCKS = 3;
// REQ: upset-learned. A complaint (this turn's request upset, or one typed during it) on a turn that changed files: the
// answer says whether it held, and when it did, what was checked; a lesson is written where it stops the next miss (a
// skill, runbook, rule, check, test or the agent's memory notes, changed this turn); an engine lesson in a project goes
// to the starter; upset again in the session needs a plan in docs/plans/ and a sweep of the real data. A complaint
// shown not to hold, or strong words about nothing wrong, owes none of it. Lesson (the old suite under v2): v2 checked
// none of the learn-from-upset items, whose markers it strips, and the same miss could come back unlearned.
const NOT_HELD = /\b(does(?:n'?t| not)|did(?:n'?t| not)) hold\b|\bis(?:n'?t| not) what happened\b|\balready (?:lists?|has|have|there|in place|does|shows?)\b|\bnot (?:actually |really )?(?:wrong|an? (?:issue|problem|mistake))\b|\bnothing (?:was )?wrong\b|\b(?:is|was) (?:already )?(?:there|correct|right)\b[^.\n]{0,40}\b(?:already|in fact|actually)\b|no (?:se sostiene|era (?:un )?(?:error|problema))|\bno encontr[eé]\b|\bnada (?:estaba )?mal\b/i;
// (a partial verdict, or a lead that is itself the evidence, "Checked: <what> - <what was wrong>", says it too)
const PARTLY = /^\W*(?:partly|in part|en parte|parcialmente)\b/im, LEAD_CHECKED = /^\s*(?:checked|comprobado|verificado)\s*:/im;
// (owning the miss in plain words says it held too: "I should have ...", "my mistake". Lesson (replay of real sessions):
// good answers that owned the miss without a set phrase were asked for a verdict)
const HELD = /\bI (?:should have|shouldn'?t have|missed|forgot|got [^.\n]{0,30}wrong|was wrong|broke|left out|skipped)\b|\bmy (?:mistake|fault|bad)\b|\b(?:that|it) was (?:wrong|my fault)\b|\byou(?:'re| are| were) (?:right|correct)\b|\b(?:it|the complaint|that) (?:holds|held)\b|\b(?:holds|held) in (?:full|part)\b|\bpartly right\b|\btienes raz[oó]n\b|\bten[ií]as raz[oó]n\b|\bes cierto\b/i;
const CHECKED = /^\s*(?:checked|comprobado|verificado)\s*:|\b(?:i )?(?:checked|verified|compared|looked (?:at|through)|went through|revis[eé]|comprob[eé])\b/im;
const LESSON_AT = /^(skills|docs\/playbooks|tools\/starter\/runbooks|docs\/checks|tools\/hooks|tests?)\/|^(AGENTS|CLAUDE)\.md$|^docs\/starter-feedback\.md$/;
const MEMORY = /[\\/]\.claude[\\/]projects[\\/][^\\/]+[\\/]memory[\\/]/i;
// An Issue line the agent wrote: "Issue: <problem> | runbook: ... | fixed when: ...", never the template's "<...>" and
// never "Issue: none" (a false alarm). In the notes file, or in the call that wrote it.
const ISSUE = /^\s*Issue:\s*(?!none\b|<)\S/im, ISSUE_NONE = /^\s*Issue:\s*none\b/im;
const issueWritten = c => /^(Bash|PowerShell|Write|Edit|MultiEdit)$/.test(c.name) && /turn-notes\.md/.test(JSON.stringify(c.input || {})) && /(^|\\n|["'])\s*Issue:\s*(?!none\b|<)\S/i.test(JSON.stringify(c.input || {}));
// How many Issue lines the agent wrote in this session before the turn (in the transcript's earlier tool calls).
export const issuesBefore = (raw, before) => String(raw || '').split('\n').filter(l => { if (!l.includes('turn-notes') || !l.includes('Issue:')) return false;
  try { const r = JSON.parse(l); return r.type === 'assistant' && (!before || String(r.timestamp || '') < before) && (r.message?.content || []).some(x => x.type === 'tool_use' && issueWritten({ name: x.name, input: x.input })); } catch { return false; } }).length;
// REQ: empty-answer. A turn that changed files ends with an answer the user can read. Lesson (the old suite under v2):
// a work turn whose answer was empty was asked only for a Finished section.
export const emptyGaps = acts => !String(acts.answer || '').trim() && changedOf(acts).length ? ['The answer is empty: tell the user what was done and what is left, then the Finished section.'] : [];
// REQ: question-no-file. A turn whose every typed message only asks gets an answer, not edits (rule 5): a changed file
// outside "questionNoFileExempt" (the records, notes, knowledge) is held, unless the answer quotes the words that asked
// for it ("Asked for: "...""). With "autonomy": "auto", "what should we do?" asks for the fix done. News typed first
// and a question queued after it is no question. Lesson (the old suite under v2): v2 let a question end with edits.
const DECIDE = /\bwhat (do you think |would you suggest |would you )?((should|shall|could|can|do) (we|i)|(we|i) (should|could|can)) do\b|\bhow (should|shall|do|can|could) (we|i) (fix|solve|handle|deal with|improve|address)\b/i;
export function questionFileGaps(acts, cfg = null) {
  const parts = (acts.parts || []).filter(p => String(p).trim());
  if (!parts.length) return [];
  const c = cfg || projectConfig();
  if (!parts.every(p => asksOnly(p, c.changeWords || ''))) return [];
  if (c.autonomy === 'auto' && parts.some(p => DECIDE.test(p))) return [];
  if (/asked for:\s*["“]/i.test(`${acts.said || ''}\n${acts.answer || ''}`)) return [];
  const unasked = changedOf(acts).filter(f => !inGlobs(f, c.questionNoFileExempt || []));
  return unasked.length ? [`This was a question, but files changed (${unasked.slice(0, 5).join(', ')}). Questions get answers, not edits: undo the changes nobody asked for, or quote the words that asked for them ("Asked for: "...").`] : [];
}
// A message the user typed this turn (the request, or one typed mid-turn) asks to pause, stop or restart.
export const pausedTurn = acts => (acts.parts || []).some(p => PAUSE_ASK.test(p));
// REQ: watched-inputs. Data the user updates while the agent works ("watchedInputs" globs in config.json) changes the
// answer: a watched file changed since the turn began, not by the turn's own edits, is named in the answer with what
// the new data changed. Only the watched globs are read, so a project without them pays nothing. Lesson (the old
// engine): an answer built on the old export said nothing of the new one the user had just saved.
export function watchedGaps(acts, cfg = null) {
  const globs = [].concat((cfg || projectConfig()).watchedInputs || []), since = Date.parse(acts.at || '') || 0;
  if (!globs.length || !since) return [];
  const own = new Set(changedOf(acts)), ans = String(acts.answer || '');
  const mt = f => { try { return fs.statSync(at(f)).mtimeMs; } catch { return 0; } };
  return [...new Set(globs.flatMap(g => filesMatching(g)))].filter(f => mt(f) > since && !own.has(f) && !ans.includes(f) && !ans.includes(path.basename(f)))
    .slice(0, 3).map(f => `${f} was updated while you worked. Re-run what depends on it and say in the answer what the new data changed (name the file).`);
}
// The helpers this headless run resumed with SendMessage that are still running (none in an interactive session).
export function headlessResumed(rows, running) {
  if (!rows.some(r => /^sdk/.test(String(r.entrypoint || '')))) return [];
  const text = x => typeof x.content === 'string' ? x.content : JSON.stringify(x.content || '');
  const resumed = new Set(rows.flatMap(r => (Array.isArray(r.message?.content) ? r.message.content : []).filter(x => x?.type === 'tool_result')
    .map(x => /resumedAgentId\\?"?\s*:\s*\\?"([\w-]+)/.exec(text(x))?.[1]).filter(Boolean)));
  return running.filter(id => resumed.has(id));
}
export const headlessLine = ids => `This run is headless (claude -p or the SDK): it ends with this answer, and a helper resumed with SendMessage stops with it, so its work never comes back (agent ${ids.join(', ')}). Do the rest of its work yourself, or start a new helper with the Agent tool and wait for its result, then end with the whole answer.`;
// The agent's notes file, when this turn wrote it.
const turnNotes = acts => { try { const f = at('.cache/turn-notes.md'), st = fs.statSync(f); return st.mtimeMs >= (Date.parse(acts.at || '') || 0) - 2000 ? fs.readFileSync(f, 'utf8') : ''; } catch { return ''; } };
// REQ: rule-request. A standing rule the agent took on is written where every later turn reads it and enforced, not only
// promised: the principle in AGENTS.md (CLAUDE.md), its dated row in docs/checks/user-requirements.md, how it is
// enforced (a check, a test a check runs, a "Done when" line, a guard, or "hook: N/A <reason>"), and with
// "memoryOnRuleRequest" a memory note. The trigger is the agent's own judgment: it opened the project-rule skill, ran
// `hooks.mjs rule`, or its notes or answer record a rule ("Rule: ...", "rule added"). Never "always", "never" or "from
// now on" in the prompt: keyword-forced rule handling was retired on 2026-11-07, and those words only feed the
// reminder's hint. "Rule: none - <why>" (or "not a rule") is the agent's call that nothing is owed. Lesson (the old suite
// under v2): a rule taken on and only promised was never written down or enforced.
const RULE_SAID = /^\s*(?:[-*]\s*)?(?:new |standing )?rule\s*:\s*(?!none\b|<)\S|\b(?:new|standing) rule (?:added|saved|written|set)\b|\brule (?:added|saved|written|is in place)\b/im;
const RULE_NONE = /\brule\s*:\s*none\b|\bnot a (?:standing |lasting )?rule\b|N\/A\(rule-request\)/im;
const RULE_TEST = /(^|\/)(tests?|__tests__|spec)\/|\.(test|spec)\.\w+$/i;
export function ruleGaps(acts, cfg = null) {
  const notes = turnNotes(acts), both = `${acts.answer || ''}\n${notes}`;
  if (RULE_NONE.test(both)) return [];
  const cmd = c => /^(Bash|PowerShell)$/.test(c.name) ? String(c.input?.command || '') : '';
  const skill = acts.calls.some(c => (c.name === 'Read' && /project-rule[\\/]+SKILL\.md$/i.test(String(c.input?.file_path || ''))) || (c.name === 'Skill' && /(^|:)project-rule$/.test(String(c.input?.skill || ''))));
  const ran = acts.calls.some(c => /\bhooks\.mjs["']?\s+rule\s/.test(cmd(c)) && !c.error);
  if (!skill && !ran && !RULE_SAID.test(both)) return [];
  const changed = changedOf(acts, true), out = [];
  if (!ran && (!changed.some(f => /^(AGENTS|CLAUDE)\.md$/.test(f)) || !changed.includes('docs/checks/user-requirements.md')))
    out.push('Write the rule down: node tools/hooks/hooks.mjs rule "<the principle, in your own words>" --why "<why>" --enforced "<how>" (its AGENTS.md line and dated row in docs/checks/user-requirements.md), or say "Rule: none - <why>" if it is no standing rule.');
  // (enforcement: the project-rule skill's own list asks for it when the skill was opened. A test file counts only when a
  // check runs it. Lesson (old suite): a rule added as cases to a test no check ran looked enforced and was not)
  const runBy = f => { const j = (() => { try { return JSON.parse(fs.readFileSync(at('tools/hooks/requirements.json'), 'utf8')); } catch { return {}; } })();
    const cmds = JSON.stringify(j.requirements || []) + (() => { try { return fs.readFileSync(at(ALWAYS), 'utf8'); } catch { return ''; } })();
    return cmds.includes(path.basename(f)); };
  const enforced = /\bhook:\s*\S|\bDone when\b/i.test(both) || changed.some(f => /^(docs\/playbooks\/[^/]+\.md|docs\/checks\/always\.md|tools\/hooks\/(config|requirements)\.json|skills\/[^/]+\/SKILL\.md)$/.test(f) || (RULE_TEST.test(f) && runBy(f)));
  if (!skill && !enforced) out.push('Say how the rule is enforced: "hook: <the check or test that runs it>" (a test only counts when a check runs it), a "Done when" line on its runbook, a guard, or "hook: N/A <why it cannot be checked>".');
  if ((cfg || projectConfig()).memoryOnRuleRequest && !acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && MEMORY.test(String(c.input?.file_path || ''))))
    out.push('Save the rule to memory too: a feedback note with the rule, **Why:** and **How to apply:**, and its line in MEMORY.md.');
  return out;
}
export function upsetGaps(turn, acts) {
  // (what the user typed this turn, messages typed mid-turn included; a message relayed from another session or a helper
  // is not theirs. Lesson (replay of real sessions): a helper's report was read as the user's complaint)
  // (nor is a summary of an earlier conversation, or the engine's own status lines quoted back. Lesson (replay): a
  // resumed session's summary named the starter, and every complaint after it read as about the engine)
  const said = String(acts.heard || '').replace(/<(cross-session-message|agent-message|task-notification|system-reminder)\b[\s\S]*?(?:<\/\1>|$(?![\s\S]))/gi, ' ')
    .split(/^\s*Another Claude session sent a message/m)[0].split(/This session is being continued from a previous conversation/)[0]
    .split('\n').filter(l => !/⚓|^\s*(?:Stop hook feedback|PreToolUse|PostToolUse|UserPromptSubmit)\b/i.test(l)).join('\n');
  // (the trigger is the agent's own judgment, never the user's words: an Issue line it wrote this turn (rule 3), or the
  // learn-from-upset skill it opened. Words in the request only feed the reminder's hint. Lesson (a peer's review,
  // citing the retirement of keyword-forced handling on 2026-11-07): a word match misread shouted rules and requests)
  const notes = turnNotes(acts);
  if (ISSUE_NONE.test(notes)) return []; // (the agent's own call: a false alarm, said with why)
  if (!(ISSUE.test(notes) || acts.calls.some(issueWritten) || acts.calls.some(c => c.name === 'Read' && /learn-from-upset[\\/]+SKILL\.md$/i.test(String(c.input?.file_path || ''))))) return [];
  const changed = changedOf(acts, true);
  if (!worked(acts) && !changed.length) return [];
  const ans = String(acts.answer || ''), lead = ans.slice(0, 400), both = `${ans}\n${notes}`;
  // (the answer or the notes saying it did not hold, in words: a bare "Learned (none)" says nothing about it)
  if (NOT_HELD.test(both)) return [];
  const out = [];
  // (a standing rule said with emphasis, "UPDATE THE PROJECT TO NEVER ...", "... MUST ...", is a rule request, which the
  // project-rule skill handles: no verdict on a complaint is owed. Lesson (replay of real sessions))
  const ruleAsk = /\b(?:update the project to|from now on|going forward|make (?:it|this) a rule|(?:always|never) (?:do|name|use|make|put|add|ask|check)|must (?:always|never)?\s*\w+)\b/i.test(said);
  if (PARTLY.test(lead) || LEAD_CHECKED.test(lead) || ruleAsk) { /* a verdict with its evidence, or a rule request */ }
  else if (!HELD.test(lead)) out.push('Say first whether it holds: the complaint in full, in part, or not. Agreeing: "You\'re right: <what was wrong>". Not agreeing: in your own words and with no concession ("Checked: <what you opened> - <what it showed>"); never blame files the user doesn\'t see.');
  else if (!CHECKED.test(ans)) out.push('Say what you checked to know it holds ("Checked: <the file or result you opened> - <what was wrong>"), not only that you agree.');
  // REQ: upset-acknowledged. The runbook the Issue line names is opened (its own items are then held like any runbook's),
  // and the answer gives the user's point in general terms with every case it covers, and the root cause of the miss,
  // in words or as "Scope:" / "Root cause:" (no done or skipped record lines: row 40). Lesson (the user): the agent
  // "acknowledged", followed no runbook, and fixed the one example shown without finding why it was missed.
  const issueText = [notes, ...acts.calls.filter(issueWritten).map(c => JSON.stringify(c.input || {}))].join('\n');
  const named = /\bIssue:[^\n]*?\|\s*runbook:\s*([\w-]+)/i.exec(issueText)?.[1];
  const files = named ? [`docs/playbooks/${named}.md`, `skills/${named}/SKILL.md`, `tools/starter/runbooks/${named}.md`] : [];
  if (named && files.some(f => fs.existsSync(at(f))) && !acts.calls.some(c => (c.name === 'Read' && files.some(f => String(c.input?.file_path || '').replace(/\\/g, '/').endsWith(f))) || (c.name === 'Skill' && new RegExp(`(^|:)${named}$`).test(String(c.input?.skill || '')))))
    out.push(`The runbook your Issue line names, ${named}, was not opened this turn: open it and follow it to the end before the answer.`);
  if (!ruleAsk) {
    if (!/^\s*Scope\s*:\s*\S|\bevery (?:case|place|one|item|line|row|file|page|screen|amount)\b|\ball \d+\b|\b\d+ (?:checked|cases|places|items|lines|rows|files)\b/im.test(both))
      out.push('Give the point in general terms with every case it covers ("Scope: <the point in general terms> - <every case it covers, checked>"), not only the example the user showed.');
    if (!/\broot cause\b|\bcaused by\b|\bbecause\b|\bcame from\b|\bwas missed since\b/i.test(both))
      out.push('Say the root cause ("Root cause: <what in the process let the miss through>"), not only the fix.');
  }
  const memo = acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && MEMORY.test(String(c.input?.file_path || '')));
  if (!changed.some(f => LESSON_AT.test(f)) && !memo) out.push(`Write the lesson where it stops the next miss, in this turn: the skill, runbook, rule or check that missed it (learn-from-upset skill), not only a note.${/Learned \(none\)/i.test(notes) ? ' "Learned (none)" is only for a complaint that did not hold.' : ''}`);
  const engine = !fs.existsSync(at('.starter-template')) && /\b(?:anzuelo|the engine|the starter|(?:stop|end|pretool|prompt) hooks?|end check)\b/i.test(said); // (the engine named, not any "check": "do 20 more sweeps to check the app" is the user's work. Lesson (replay))
  if (engine && !changed.includes('docs/starter-feedback.md') && !acts.calls.some(c => /starter\.mjs["']?\s+feedback\b/.test(String(c.input?.command || '')))) out.push('This is about the engine: send the lesson to the starter (node tools/starter.mjs feedback "<what went wrong and why>"), not only into this project.');
  // (a new rule said with emphasis is no failed patch: the plan and sweep are for the same kind of miss coming back)
  if (!ruleAsk && acts.issuesBefore > 0) {
    const plan = changed.some(f => /^docs\/plans\/[^/]+\.md$/.test(f)), swept = /\b\d+\s+(?:checked|checks|items|records|files)\b[^\n]{0,80}\b0 wrong\b|\bsweep\b[^\n]{0,120}\b0 wrong\b/i.test(both);
    if (!plan || !swept) out.push('The user is upset again in this session: patching failed. Write a plan in docs/plans/ listing everything wrong, each with its root cause and fix, and run the fix over the whole real record, saying how many were checked and that 0 are wrong.');
  }
  return out;
}
function judge(data, { shadow = false } = {}) {
  // (with no saved start, the turn starts at its request's own time. Lesson (a field report): the first turn after an
  // upgrade installed v2 had no saved start, so a file a script wrote did not count, and the request was blocked twice)
  const saved = loadTurn(data.session_id), rows = turnRows(data.transcript_path || '', saved.at);
  if (data.stop_hook_active && !saved.at) return null; // (no record of the request: its blocks can't be counted)
  // (a background command of this turn still running is waited for like a helper: its result is not in yet. A server
  // or watcher never ends, so it does not count. Lesson (a project's report): a turn waiting on its full self-test was
  // blocked three times and wrote its answer before the results existed)
  const LIVE = /(?:^|&&|;|\|)\s*(?:cd\s+\S+\s*&&\s*)?(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:dev|start|serve|preview|watch)\b|\b(?:vite|next\s+dev|nodemon|http\.server|runserver|uvicorn|flask\s+run|tail\s+-f)\b|\s--watch\b/i;
  // REQ: headless-resume. A headless run (claude -p or the SDK) ends with its answer, and a helper resumed by a message
  // (SendMessage) stops with it, so waiting for it loses its work: the turn is held instead. Lesson (the old engine, trial
  // round 23): a headless setup resumed its helper, answered "still running", and the user never got the result.
  const running = helpersRunning(rows), lost = headlessResumed(rows, running);
  if (!lost.length && (running.length || backgroundRuns(rows).some(r => !LIVE.test(r.cmd)))) { waiting = true; return null; }
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
  const t0 = turn.at && new Date(Number.isNaN(+turn.at) ? turn.at : +turn.at);
  decided = { request: t0 && !Number.isNaN(+t0) ? t0.toISOString() : '', round: rounds + 1 };
  if (rounds >= MAX_BLOCKS) return null;
  // REQ: pause-stops. The user asked to pause, stop or restart (in the request or a message typed during the turn): the
  // turn ends now, nothing more asked; the next session's checks pick up what is open (the guard still refused anything
  // unsafe during the work). Lesson (a field report): after "get to a good pausing point, I will restart the computer",
  // the end check held the turn 3 rounds and the work went on while the user restarted.
  if (pausedTurn(acts)) return null;
  // (on a repeat, what the agent said is read from after the last block: a message sent before it can't be taken back.
  // Lesson (2026-11-07): an Issue line in the first answer re-blocked the corrected answer that had none)
  if (again && turn.lastBlock) { const after = turnActs(rows.filter(r => (Date.parse(r.timestamp || '') || 0) > turn.lastBlock)); acts.said = after.said + (final && !after.said.includes(final) ? `${final}\n` : ''); acts.answer = final || after.answer || acts.answer; }
  const raw = tail(data.transcript_path, 5 << 20), history = evidenceOf(raw);
  acts.earlier = earlierPrompts(raw, turn.at); acts.runbook = turn.runbook || '';
  acts.issuesBefore = issuesBefore(raw, turn.at); acts.prior = priorCalls(raw, turn.at);
  // (a declared self-test the turn needed and never ran is run here first, so every check below judges its output;
  // never in a preview)
  let autos = []; if (!shadow) try { acts.sessionStart = sessionStart(data.transcript_path || '') || turn.at || null; autos = autoRuns(acts); } catch (e) { autos = [crashLine('self-run', e)]; }
  const late = unansweredLate(rows, final).map(m => `Answer the user's message typed at ${String(m.at).slice(11, 16) || 'mid-task'}: "${m.text.replace(/\s+/g, ' ').slice(0, 200)}"`);
  // (wakeups scheduled in any turn of the session count: one left from earlier still re-invokes it later)
  const wakes = wakeGaps(raw.split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean), final || acts.answer || '', acts.heard || '');
  const extra = (turn.also || []).flatMap(f => missing({ ...turn, runbook: f }, acts, runbooks().filter(b => b.file === f)));
  const resumedLost = lost.length ? [headlessLine(lost)] : [];
  const list = [...resumedLost, ...late, ...autos, ...wakes, ...S('missing', () => [...emptyGaps(acts), ...missing(turn, acts), ...upsetGaps(turn, acts), ...ruleGaps(acts), ...watchedGaps(acts)]), ...extra, ...S('skillMissing', () => skillMissing(acts)), ...S('reviewGaps', () => reviewGaps(turn, acts)), ...S('testGaps', () => testGaps(acts, history)), ...S('gateGaps', () => gateGaps(acts)), ...S('screenGaps', () => screenGaps(acts)), ...S('healthGaps', () => [...healthGaps(acts, { run: !shadow }), ...upgradeGaps(turn, acts)]), ...S('knowledgeGaps', () => knowledgeGaps(acts)), ...S('securityGaps', () => securityGaps(acts)), ...S('questionGaps', () => [...questionGaps(acts), ...questionFileGaps(acts)]), ...S('noteGaps', () => noteGaps(acts)), ...S('quoteGaps', () => quoteGaps(acts)), ...S('claimGaps', () => claimGaps(acts, history)), ...S('scopeGaps', () => scopeGaps(acts)), ...S('tableGaps', () => tableGaps(acts))].filter((s, i, all) => all.indexOf(s) === i);
  // (the waiver tally: what this turn cleared with a reason is recorded; a check cleared in 3+ earlier turns is named)
  const full = list.splice(0, list.length); list.push(...full.filter(kept(acts)).filter(s => !(again && CRASHED.test(s))));
  const often = shadow ? '' : tally(full, list, turn.at ? `${data.session_id || 'x'}|${turn.at}` : '');
  // (a turn that ran the check on its draft has seen the verify list: the real stop does not send it back for it again.
  // Lesson (the user, 2026-11-07): the list came in the draft check and then again as a send-back, and the user read a
  // second round of the answer)
  const previewed = !shadow && (acts.calls || []).some(c => /^(Bash|PowerShell)$/.test(c.name) && /hooks\.mjs["']?\s+check\b[^\n]*--answer-file/.test(String(c.input?.command || '')));
  const check = again || previewed ? null : toVerify(turn, acts);
  decided.steps = [...list.map(s => s.replace(/\s+/g, ' ').slice(0, 80)), ...(check ? [`verify ${check.file}`] : [])];
  if (!list.length && !check) { if (!shadow) passed = { acts, turn, rounds }; return null; }
  const parts = [], last = rounds + 1 === MAX_BLOCKS;
  // (a repeat block asks for the fix, or one line on why the item doesn't fit this work, never the same answer again.
  // Lesson (2026-11-07): an agent resent the same answer to each repeat block, and the false item was never looked at)
  if (list.length) parts.push(`${again ? 'Still not done (do it now, or say in one line of the answer why it does not fit this work; resending the same answer does not count)' : 'Not done yet'}:\n${list.map(s => `- ${s}`).join('\n')}`);
  if (often && list.length) parts.push(often);
  if (last) parts.push('This is the last check for this request: whatever you can\'t do, say plainly in the answer that it is not done and why.');
  if (turn.at && !shadow) saveTurn(data.session_id, { ...turn, blocked: turn.at, rounds: rounds + 1, lastBlock: Date.now() });
  if (check) parts.push(`Check that these items of ${check.file} are really done (skip any that don't fit this work):\n${check.items.map(it => `${it.n}. ${it.text}`).join('\n')}`);
  // (after a block: a short note in the user's language of only what changed, the check left out, not the answer again.
  // The user, 2026-11-07: run the check before answering instead)
  return { decision: 'block', reason: `${parts.join('\n')}\nFix what isn't done. Then tell the user in a line or two, in their language, only what changed in the answer above, with nothing about this check in it; if nothing changed for them, say nothing more. Next time, run node tools/hooks/hooks.mjs check --answer-file <your draft> before answering, so the answer goes out once.` };
}
