// Engine v2 end hook (Stop): the one check. It judges only what this session did in this turn, from its own
// transcript, and blocks with a short plain list of what is really missing until it is done (at most MAX_BLOCKS times).
import '../hidewin.mjs'; import { fitStaleGaps } from '../fitstale.mjs'; // child processes start hidden (no console windows)
import { withNote, correctionsOf } from '../correct.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { passLine } from './lines.mjs';
import * as W from './worklog.mjs';
import { planRequired, OPEN_WORK, planOpen } from '../planreq.mjs';
import { keyWords, closestRunbook, coreRunbook, userWords as userWordsOf } from '../near.mjs';
import { appendHistory } from '../history.mjs';
import { relayedBody } from '../relay.mjs';
// REQ: plan-open (planreq.mjs), on the plans open when the turn began; asked once. Lesson: plans were left half done
function planOpenGaps(turn, acts, again) {
  if (again || checkOff('plan-open')) return [];
  // (a plan is the session's that carries it out: one its own earlier calls wrote, edited or ran. Lesson (2026-11-12):
  // turns were held for plans another session was carrying out)
  const goOn = /\b(the plan|resume|continue|keep going|carry on|next step)\b/i.test(ownWords(acts.heard, acts.agentAll)); // (or the user's own words ask to go on with one)
  const startPlans = (turn.openPlans || []).filter(p => fs.existsSync(at(p)) && (goOn || (acts.prior || []).some(c => JSON.stringify(c.input || {}).replace(/\\\\/g, '/').includes(p))));
  if (!startPlans.length) return [];
  const changed = changedOf(acts), cmds = acts.calls.filter(c => /^(Bash|PowerShell)$/.test(c.name)).map(c => String(c.input?.command || ''));
  const read = p => { try { return fs.readFileSync(at(p), 'utf8'); } catch { return ''; } };
  let planNames = []; try { planNames = fs.readdirSync(at('docs/plans')); } catch { }
  const msg = planOpen({ workTurn: worked(acts) || changed.length > 0, prompt: String(acts.heard || ''), changed, cmds, relayed: !!relayedBody(String(acts.heard || '')), startPlans },
    { read, planNames, runbookNames: runbooks().map(b => b.name), keyWords });
  return msg ? [msg] : [];
}
import { labelsEsHint } from '../labels.mjs';
import { unansweredLate, asksOnly } from './late.mjs';
import { PAUSE_ASK } from '../pause.mjs';
import { externalStopSteps } from '../extstop.mjs';
import { reviewExcuse } from '../excuse.mjs';
import { frictionGaps } from './friction.mjs';
import { VERBATIM_ENGINE } from './verbatim.mjs';
import { NAMES_FILE, NAME_FILES, namesIn, nameProblems, headsOf, newLinesOf } from '../names.mjs';
import { rootToolchainFile } from '../rootfiles.mjs';
import { waivedTag, gitClaimGaps, notesOf, ownWords } from './lib.mjs';
import { wakeGaps, watchersArmed, watcherLeft, wakeupsPending } from '../wakeups.mjs';
import { makeSkillLearn } from '../skilllearn.mjs';
import { makeProof } from '../proof.mjs';
import { forbiddenGaps, codeRuleGaps, injectionGaps, verbatimGaps, CRASHED, crashLine, logStop, upgradeGaps, autoRuns, sessionStart, changedOf, projectConfig, checkOff, inGlobs, priorCalls, filesMatching, withBackgroundOutputs, hookTestsGaps, engineChecks, doneWhen, smallChange } from './lib.mjs';
import { ROOT, at, runbooks, turnRows, turnActs, met, applies, opened, worked, loadTurn, saveTurn, testGaps, gateGaps, screenGaps, healthGaps, knowledgeGaps, staleCitedGaps, securityGaps, claimGaps, questionGaps, noteGaps, quoteGaps, tail, helpersRunning, backgroundRuns, helperRuns, evidenceGaps, evidenceOf, skillBooks, alwaysGaps, scopeGaps, earlierPrompts, ALWAYS, engineCheckGaps, loadDirty, isSpanish } from './lib.mjs';
// (the two data tables, one evaluator each: the project's always list and the engine's own checks)
// (each check runs on its own: one that throws is named once with its error, and the rest still run)
// (ANZUELO_V2_TIMING=1 prints each step's time to stderr, to find what a slower Stop spends; off, it costs nothing)
const TIMES = process.env.ANZUELO_V2_TIMING || process.env.STARTER_TIMING ? [] : null; // (STARTER_TIMING: the timing both engines answer)
const laps = () => { let t = TIMES ? performance.now() : 0; return name => { if (!TIMES) return; const n = performance.now(); TIMES.push([name, Math.round((n - t) * 10) / 10]); t = n; }; };
const S = (name, f) => { const t = TIMES ? performance.now() : 0; try { return f(); } catch (e) { return [crashLine(name, e)]; } finally { if (TIMES) TIMES.push([name, Math.round((performance.now() - t) * 10) / 10]); } };
const tableGaps = acts => [...alwaysGaps(acts), ...engineCheckGaps(acts), ...forbiddenGaps(acts), ...codeRuleGaps(acts), ...injectionGaps(acts), ...verbatimGaps(acts), ...planGaps(acts), ...noteLinkedGaps(acts), ...nameVarGaps(acts), ...rootTidyGaps(acts), ...fitStaleGaps({ root: ROOT, changed: changedOf(acts), since: Date.parse(acts.at || '') || 0 })];
// REQ: plan-required (planreq.mjs). A file is new when neither git's last commit nor the turn-start snapshot has it and
// it was made after the turn began; git is asked only once the cheap conditions hold.
function planGaps(acts) {
  const cfg = projectConfig(), changed = changedOf(acts), n = Number(cfg.planNewFiles) || 5, said = String(acts.said || acts.answer || '');
  if (checkOff('plan-required') || changed.length < n || !OPEN_WORK.test(said) || changed.some(p => /^docs\/plans\/.+\.md$/.test(p) || p === 'docs/STATUS.md')) return [];
  const since = Date.parse(acts.at || '') || 0, start = acts.startHashes?.files || {};
  let head = null; const inHead = p => { if (head === null) { const r = spawnSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8', timeout: 5000, maxBuffer: 1 << 26 }); head = new Set(r.status === 0 ? r.stdout.split('\n') : []); } return head.has(p); };
  const born = p => { if (start[p] || inHead(p)) return false; try { return fs.statSync(at(p)).birthtimeMs > since - 1000; } catch { return false; } };
  const wroteSelf = new Set(acts.calls.filter(c => /^(Write|NotebookEdit)$/.test(c.name)).map(c => path.relative(ROOT, String(c.input?.file_path || c.input?.notebook_path || '')).replace(/\\/g, '/')));
  // (new files made by a command count as work too, as the old engine counted them: v2's worked() sees the edit tools only)
  const msg = planRequired({ changed, said, workTurn: true, setup: fs.existsSync(at('SETUP-PROMPT.md')) && !fs.existsSync(at('.starter-template')), wroteSelf, born,
    generated: new Set(), notWork: p => inGlobs(p, cfg.notWork || []), exists: p => fs.existsSync(at(p)) }, n);
  return msg ? [msg] : [];
}

// REQ: note-linked. A new note (docs/knowledge, docs/notes, docs/*.md, knowledgeDirs; not templates or the starter's
// documents) links to related notes (a .md link, a [[wiki link]] or "## Related" saying why it stands alone).
const NOT_A_NOTE = /(^|\/)(CHANGELOG|STATUS|MENU|BRIEF|DECISIONS|README|SOURCES|INDEX|security|foundation|fit-checklist|lessons|recommended-tools|user-requirements|starter-feedback|glossary)\.md$/i;
export function noteLinkedGaps(acts) {
  if (checkOff('note-linked') || waivedTag('note-linked', acts)) return [];
  const cfg = projectConfig(), dirs = [...new Set(['docs/knowledge', ...[].concat(cfg.knowledgeDirs || [])].map(d => String(d).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '').toLowerCase()).filter(Boolean))];
  const isNote = p => /\.md$/i.test(p) && !NOT_A_NOTE.test(p) && (/^docs\/(knowledge|notes)\/.+\.md$/i.test(p) || /^docs\/[^/]+\.md$/i.test(p)
    || (dirs.some(d => p.toLowerCase().startsWith(d + '/')) && !/(^|\/)(_?templates?|attachments?|\.obsidian|\.trash)\//i.test(p)));
  const notes = changedOf(acts).filter(isNote);
  if (!notes.length) return [];
  const since = Date.parse(acts.at || '') || 0, start = acts.startHashes?.files || {};
  const head = new Set((r => r.status === 0 ? r.stdout.split('\n') : [])(spawnSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8', timeout: 5000, maxBuffer: 1 << 26 })));
  const born = p => { if (start[p] || head.has(p)) return false; try { return fs.statSync(at(p)).birthtimeMs > since - 1000; } catch { return false; } };
  const unlinked = notes.filter(p => { if (!born(p)) return false; let t = ''; try { t = fs.readFileSync(at(p), 'utf8'); } catch { return false; }
    return !/\]\([^)\s]+\.md(#[^)]*)?\)|\[\[[^\]]+\]\]/.test(t) && !(t.split(/^##\s+Related[^\n]*\n/m)[1] || '').trim(); });
  return unlinked.length ? [`New note${unlinked.length > 1 ? 's' : ''} ${unlinked.slice(0, 4).join(', ')} link${unlinked.length > 1 ? '' : 's'} to nothing. Link each to its related notes (in the text or under "## Related"; node skills/obsidian/scripts/notes.mjs suggest <note> finds candidates), or say under "## Related" why it stands alone (obsidian skill).`] : [];
}

// Whether a file is new this turn: not in git's last commit or the turn-start snapshot, and made after the turn began.
const bornNow = acts => {
  const since = Date.parse(acts.at || '') || 0, start = acts.startHashes?.files || {};
  let head = null; const inHead = p => { if (head === null) head = new Set((r => r.status === 0 ? r.stdout.split('\n') : [])(spawnSync('git', ['ls-tree', '-r', '--name-only', 'HEAD'], { cwd: ROOT, encoding: 'utf8', timeout: 5000, maxBuffer: 1 << 26 }))); return head.has(p); };
  // (a file the turn first touched with an edit, not a write, was there before it, as the proof check reads it. Lesson
  // (the v2 self-test): an edited root file in a folder without git was taken for a new one)
  const first = new Map(); for (const c of acts.calls || []) if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(c.name)) { const f = path.relative(ROOT, path.resolve(ROOT, String(c.input?.file_path || c.input?.notebook_path || ''))).replace(/\\/g, '/'); if (!first.has(f)) first.set(f, c.name); }
  return p => { if (start[p] || /^(Edit|MultiEdit|NotebookEdit)$/.test(first.get(p) || '') || inHead(p)) return false; try { return fs.statSync(at(p)).birthtimeMs > since - 1000; } catch { return false; } };
};
// REQ: root-tidy (rule 13), under v2, as the old engine judged it: a file new this turn sits loose in the project root
// while the root holds only what people open first (rootAllowed) and what a language or tool needs there (the shared
// tools/hooks/rootfiles.mjs). A file already in the root is the project's own layout.
export function rootTidyGaps(acts) {
  if (checkOff('root-tidy')) return [];
  const cfg = projectConfig(), cands = changedOf(acts).filter(p => p && !p.includes('/') && !inGlobs(p, [].concat(cfg.rootAllowed || [])) && fs.existsSync(at(p)));
  if (!cands.length) return [];
  const born = bornNow(acts), rootFiles = () => { try { return fs.readdirSync(ROOT, { withFileTypes: true }).filter(e => e.isFile()).map(e => e.name); } catch { return []; } };
  const loose = cands.filter(p => !rootToolchainFile(p, { match: (n, gs) => inGlobs(n, [].concat(gs || [])), rootFiles }) && born(p));
  return loose.length ? [`New files sit loose in the project root: ${loose.join(', ')}. Move each into the folder that fits (docs/checks/layout-standards.md), or add it to rootAllowed in tools/hooks/config.json if it really must live in the root (toolchain config, the one start file).`] : [];
}

// REQ: name-var (rule 17), under v2: the shared tools/hooks/names.mjs, as the old engine judged it. A changeable name
// from docs/names.json typed out in a file this turn changed (outside a marker in docs, in text people read in code),
// in the lines the turn wrote only (lines git's last commit had are not this turn's). The engine's own files and the
// project's namesIgnore are skipped.
export function nameVarGaps(acts) {
  if (checkOff('name-var')) return [];
  const files = changedOf(acts).filter(p => p !== NAMES_FILE && NAME_FILES.test(p) && fs.existsSync(at(p)));
  if (!files.length) return [];
  const nm = namesIn(ROOT);
  if (!Object.keys(nm).length) return [];
  const cfg = projectConfig(), starter = fs.existsSync(at('.starter-template')), heads = headsOf(ROOT, files, spawnSync);
  const typed = files.flatMap(p => { let now = ''; try { now = fs.readFileSync(at(p), 'utf8'); } catch { return []; }
    return nameProblems(p, newLinesOf(now, heads.get(p)), { root: ROOT, nm, skip: inGlobs(p, cfg.namesIgnore || []) || (!starter && inGlobs(p, VERBATIM_ENGINE)) }); });
  return typed.length ? [`Names are written once, in ${NAMES_FILE}, so they can be changed in one place. ${typed.slice(0, 4).join('; ')}${typed.length > 4 ? ` (+${typed.length - 4} more)` : ''}. Use the marker in docs and read the file in code, or say in one line why it must stay typed out.`] : [];
}

// Check 1: the routed runbook, else the one the agent opened (not a skill it names), was followed and its checkable
// "Done when" items met. A runbook the turn wrote or changed, by a script too, is its work, not its procedure.
const authored = (b, acts) => acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && String(c.input.file_path || '').replace(/\\/g, '/').endsWith(b.file))
  // (a command that writes: one that only reads the runbook, after an upgrade rewrote it, is following it. Lesson (a
  // project's report): an upgrade turn that read the engine runbook with Get-Content was held to the routed one)
  || (acts.calls.some(c => /^(Bash|PowerShell)$/.test(c.name) && String(c.input.command || '').replace(/\\/g, '/').includes(b.file)
    && /WriteAllText|Set-Content|Out-File|Add-Content|writeFileSync|\bsed\s+-i|\btee\b|>>?\s*["']?[\w./-]*\.md\b|\.Replace\(|\.replace\(/.test(String(c.input.command || '')))
    && (() => { const since = Date.parse(acts.at || '') || 0; try { return since > 0 && fs.statSync(at(b.file)).mtimeMs > since; } catch { return false; } })());
// The runbook the turn is held to, from evidence only: the one the answer says it followed ("Runbook: x.md", "followed
// the x runbook") and opened, else the one routed from the user's own prompt. A runbook only read, grepped or named in a
// test is no choice. Not one the turn edited: that was changing the procedure, not following it. Lesson (2026-11-12):
// runbooks read for reference, or probed by routing tests, held turns to 2 to 14 items each
const FOLLOWED = /\b(?:runbook|playbook)s?\s*:\s*`?(?:[\w./-]*\/)?([\w-]+)(?:\.md)?`?|\bfollowed (?:the )?`?([\w-]+)`? (?:runbook|playbook)\b/gi;
const chosen = (turn, acts, books) => {
  const said = [...String(acts.answer || '').matchAll(FOLLOWED)].map(m => m[1] || m[2]);
  return books.find(b => said.includes(b.name) && opened(b, acts) && !authored(b, acts)) || (turn.runbook && books.find(b => b.file === turn.runbook && !authored(b, acts)));
};
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
  // (and what the agent said in the request's earlier rounds: a "does not fit" given once holds in the later rounds.
  // Lesson (the old suite under v2): a waiver from round 1 was asked for again in round 2)
  const all = `${acts.answer || ''}\n${acts.saidAll || acts.said || ''}`.replace(/`/g, '').split(/\n|;|\.\s+/);
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
  const book = chosen(turn, acts, books);  // (a typed question routed to a runbook made for answers, one with an "(evidence)" item, is held to opening it and
  // its answer items; others stay free. The user, 2026-11-07: knowledge answers come from the best sources)
  const asked = book && !worked(acts) && book.file === turn.runbook && book.items.some(it => it.kind === 'evidence') && !relayed(acts);
  // (15 or more tool calls is real work too, files changed or not (Step 0.4): the routed runbook is opened for it. Only
  // the opening is asked: its file items wait for files. Lesson (the old suite under v2): a 16-call turn routed to the
  // plan runbook never opened it, and v2 asked nothing, counting only file edits as work)
  if (book && !worked(acts) && !asked && book.file === turn.runbook && acts.calls.length >= 15 && !/<(cross-session-message|agent-message|task-notification)\b|^This session is being continued from a previous conversation/m.test(acts.heard || '') && !opened(book, acts))
    return [`Open ${book.file} and follow its steps: 15 or more tool calls is real work, files changed or not.`];
  if (!book || (!worked(acts) && !asked)) return [];
  const out = [];
  // (an agent with no hooks: its reads leave no record, so the answer naming the runbook it followed ("Playbook:
  // meal-plan.md") stands for opening it, as the old engine read it. Lesson (the old suite under v2): the no-hooks
  // check asked to open the runbook again in every round, with no way to show it was)
  const namedHere = acts.session === 'manual' && new RegExp(`\\b(?:playbook|runbook)s?\\s*:\\s*\`?(?:docs/playbooks/)?${book.name.replace(/[^\w-]/g, '')}(?:\\.md)?\\b`, 'i').test(String(acts.answer || ''));
  if (!opened(book, acts) && !namedHere) out.push(`Open ${book.file} and ${asked ? 'answer by' : 'check the work against'} its steps.`);
  // (evidence is for answers: on a work turn, facts written into files have their own check, knowledgeGaps)
  for (const it of book.items) if ((asked ? it.kind === 'answer' || it.kind === 'evidence' : it.kind !== 'evidence') && applies(it, acts) && met(it, acts) === false)
    out.push(`${book.file} item ${it.n}: ${it.kind === 'evidence' ? evidenceGaps(acts).join(' ') : it.text}`);
  return out;
}

// REQ: runbook-exists (rule 2, Step 0.3), each asked once: (a) a runbook the answer names as followed was never opened;
// (b) _fallback.md was followed and no runbook left behind; (c) work past the small-fix size opened and made none: open
// the closest (top 3 named), leave one, or say why none fits. Not a question, a relayed message or the setup turn.
const NONE_FITS = /\b(no|none of the|not an?)\s+(existing\s+)?runbooks?\b[^.\n]{0,60}\b(fits?|applies|apply|needed|covers?)\b|\bone-?off\b|\bno runbook (is )?needed\b/i;
export function unroutedGaps(turn, acts, again, books = runbooks()) {
  if (again || checkOff('runbook-exists') || !worked(acts) || /<(cross-session-message|agent-message|task-notification)\b|^This session is being continued from a previous conversation/m.test(acts.heard || '') || fs.existsSync(at('SETUP-PROMPT.md')) && !fs.existsSync(at('.starter-template'))) return [];
  const said = `${acts.said || ''}\n${acts.answer || ''}\n${notesOf(acts)}`;
  const made = acts.calls.some(c => c.name === 'Write' && /(^|\/)docs\/playbooks\/[^/_][^/]*\.md$|(^|\/)skills\/[^/]+\/SKILL\.md$/.test(String(c.input?.file_path || '').replace(/\\/g, '/')));
  const fallback = acts.calls.some(c => c.name === 'Read' && /(^|\/)docs\/playbooks\/_fallback\.md$/.test(String(c.input?.file_path || '').replace(/\\/g, '/')));
  const anyOpened = books.some(b => opened(b, acts)) || skillBooks({ parts: true }).some(b => opened(b, acts));
  // (a) (from what the agent said, never the notes: their old record lines made 29% and 48% of work turns ask (replay))
  const named = [...`${acts.said || ''}\n${acts.answer || ''}`.matchAll(/\bPlaybook:\s*(?:docs\/playbooks\/)?([\w-]+)\.md\b/gi)].map(m => m[1]).filter(n => n !== '_fallback');
  // (a runbook opened earlier counts only for a message that goes on with the work ("again", "continue", an image alone,
  // a resumed request). Lesson (2026-11-10): "any earlier opening" made 0 asks in 245 turns)
  const heard = String(acts.heard || ''), goesOn = /^\s*\[Request interrupted/.test(heard) || !heard.replace(/\[Image[^\]]*\]/g, '').trim()
    || /\b(again|continue|keep going|go on|carry on|resume|same as before|otra vez|de nuevo|sigue|contin[uú]a)\b/i.test(heard);
  const pool = books.map(b => ({ name: b.name, file: b.file, triggers: b.triggers || [], fm: { summary: (/^summary:\s*(.+)$/m.exec(b.front || '') || [])[1] || '' } })), top = [];
  for (let i = 0; i < 3; i++) { const c = closestRunbook(heard, pool.filter(p => !top.includes(p.file)), coreRunbook); if (!c) break; top.push(c.file); }
  const readBefore = file => (acts.prior || []).some(c => c.name === 'Read' && String(c.input?.file_path || '').replace(/\\/g, '/').endsWith(file));
  const skillBefore = name => (acts.prior || []).some(c => (c.name === 'Skill' && JSON.stringify(c.input || {}).includes(name)) || (c.name === 'Read' && String(c.input?.file_path || '').replace(/\\/g, '/').endsWith(`skills/${name}/SKILL.md`)));
  const earlierCounts = b => goesOn && (readBefore(b.file) || skillBefore(b.name));
  // (a runbook the turn wrote is one its writer knows: made for this work, it counts as opened. Lesson (the v2 sweep): a
  // runbook made for a new kind of task and named as followed was asked to be opened)
  const wrote = b => acts.calls.some(c => ['Write', 'Edit'].includes(c.name) && String(c.input?.file_path || '').replace(/\\/g, '/').endsWith(b.file));
  const notOpened = books.filter(b => named.includes(b.name) && !opened(b, acts) && !wrote(b) && !earlierCounts(b) && b.file !== turn.runbook);
  if (notOpened.length) return notOpened.map(b => `Open ${b.file} and check the work against its steps.`);
  if (made || NONE_FITS.test(said)) return [];
  // (b)
  if (fallback) return ['This work followed docs/playbooks/_fallback.md: leave a runbook for this kind of task behind (rule 2, the runbook-create skill), or say in one line why none is needed (a one-off).'];
  // (c)
  const openedBefore = goesOn && (acts.prior || []).some(c => c.name === 'Skill' || (c.name === 'Read' && /(^|\/)docs\/playbooks\/[^/_][^/]*\.md$|(^|\/)skills\/[^/]+\/SKILL\.md$/.test(String(c.input?.file_path || '').replace(/\\/g, '/'))));
  if (turn.runbook || anyOpened || openedBefore || smallChange(acts, changedOf(acts))) return [];
  return [`No runbook was opened for this work. Open the closest one${top.length ? ` (${top.join(', ')})` : ' (DIRECTORY.md lists them)'} and check the work against it, leave a new runbook for this kind of task (rule 2, the runbook-create skill), or say in one line why none fits (a one-off).`];
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
  const t0 = TIMES ? (TIMES.length = 0, performance.now()) : 0;
  const out = judge(data, opts);
  if (TIMES) process.stderr.write(`V2-STOP-TIMING ${JSON.stringify({ total: Math.round(performance.now() - t0), parts: TIMES.filter(([, ms]) => ms >= 0.5) })}\n`);
  // (each decision goes in the Stop log, "hooks.mjs last": its round, result and the steps it asked for)
  if (!opts.shadow) logStop(data.session_id, { request: decided.request || '', round: decided.round ?? null, result: out ? 'blocked' : waiting ? 'waiting' : decided.capped ? 'ended-unresolved' : decided.round ? 'passed' : 'ended', steps: out ? decided.steps || [] : [] });
  if (!out && !waiting && !opts.shadow) { const t = loadTurn(data.session_id); if (t.at) saveTurn(data.session_id, { ...t, ended: true }); }
  // (REQ: recall-hint: a passing work turn leaves its line in the history, as the old engine's did, so a later request
  // like it starts from how it was done and tools/recall.mjs finds it. Lesson (the old suite under v2): v2 wrote none)
  if (!out && passed && !opts.shadow && worked(passed.acts) && !process.env.STARTER_BENCH) try {
    const a = passed.acts, books = [...runbooks(), ...skillBooks({ parts: true })];
    appendHistory(at('tools/hooks/state/history.jsonl'), { key: `${data.session_id || 'x'}|${passed.turn.at || ''}`, at: new Date().toISOString().slice(0, 10),
      prompt: String(userWordsOf(a.heard || '')).replace(/\s+/g, ' ').slice(0, 300), used: [...new Set(books.filter(b => opened(b, a)).map(b => b.name))],
      changed: changedOf(a).slice(0, 12), answer: String(a.answer || '').split(/^#{1,6}\s*\**finished\b/im)[0].replace(/\s+/g, ' ').trim().slice(0, 400) });
  } catch { }
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
// A complaint turn, by the agent's own judgment, never the user's words: an Issue line it wrote this turn (the notes, its
// text or a write to the notes), the learn-from-upset skill opened, or an Issue line earlier this session; not when it
// called the complaint a false alarm ("Issue: none"). The proof checks are judged in such turns, as the old engine did.
export const complaintTurn = acts => {
  const notes = turnNotes(acts);
  if (ISSUE_NONE.test(notes)) return false;
  return ISSUE.test(notes) || /^\W*Issue:\s*(?!none\b|<)[^\n]*\|\s*runbook:/im.test(acts.said || '') || (acts.calls || []).some(issueWritten)
    || (acts.calls || []).some(c => c.name === 'Read' && /learn-from-upset[\\/]+SKILL\.md$/i.test(String(c.input?.file_path || ''))) || acts.issuesBefore > 0;
};
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
// REQ: external-stop, under v2: the shared tools/hooks/extstop.mjs. A project's own Stop command (config "externalStop")
// runs inside this end check: its numbered steps join this list, a crash is one step, and a run out of time is named as
// one to rerun, never to remove. Lesson (the old suite under v2): v2 never ran it, so a project that merged its own Stop
// hook lost those checks
const externalV2 = data => externalStopSteps(data, projectConfig(), { ROOT, bench: !!(process.env.STARTER_BENCH ?? process.env.KS_BENCH) }).map(s => s.msg);
// REQ: review-excuse, under v2: the shared tools/hooks/excuse.mjs. Where sub-agents exist (config "subagents", a host
// whose transcript names its entry point, or a helper used this turn), "no other reviewer" is no reason to skip a review.
// Lesson (the old suite under v2): the excuse passed
const excuseV2 = (acts, rows) => {
  const cfg = projectConfig();
  if (checkOff('review-excuse') || waivedTag('review-excuse', acts)) return [];
  const subagents = cfg.subagents === true || (cfg.subagents !== false && ((rows || []).some(r => typeof r?.entrypoint === 'string') || (acts.calls || []).some(c => /^(Agent|Task)$/.test(c.name))));
  const m = reviewExcuse(acts.answer, subagents);
  return m ? [m] : [];
};
// (REQ: friction-reported, tools/hooks/v2/friction.mjs: the turn's Issue lines, in its notes or its own text, against the
// checks this project runs)
const frictionV2 = acts => {
  return frictionGaps(ROOT, acts.at || '', `${acts.at ? notesOf(acts) : ''}\n${acts.said || ''}`, engineChecks().map(r => r && r.tag).filter(Boolean));
};
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
// REQ: notice-answer. In a headless run the caller gets only the last message: a reply to a background notice or a fired
// wakeup, after the turn already answered, replaces that answer. Unless it carries the answer again (most of its lines,
// or as long as 60% of it), the turn is held, once (not on a send-back). Interactive sessions show the answer above, so
// a short reply is fine. Lesson (the old engine): a headless run's result was a three-line reply to a leftover watcher's
// notice, with none of the answer.
export function noticeAnswerGaps(rows, final, again = false) {
  if (again || !final || !rows.some(r => /^sdk/.test(String(r.entrypoint || '')))) return [];
  const notice = r => r.type === 'user' && (r.turnOrigin === 'scheduled' || /<task-notification>/.test(typeof r.message?.content === 'string' ? r.message.content : JSON.stringify(r.message?.content || '')));
  const at = rows.map(notice).lastIndexOf(true);
  if (at < 0) return [];
  const prev = rows.slice(0, at).filter(r => r.type === 'assistant').flatMap(r => (Array.isArray(r.message?.content) ? r.message.content : []).filter(x => x?.type === 'text').map(x => String(x.text || ''))).filter(t => t.trim()).pop() || '';
  const norm = s => String(s || '').toLowerCase().replace(/[*_`#>|]+/g, ' ').replace(/\s+/g, ' ').trim(), r = norm(final), p = norm(prev);
  if (!p || r.length >= p.length * 0.6) return [];
  const lines = prev.split(/\r?\n/).map(norm).filter(l => l.length >= 25);
  if (lines.length ? lines.filter(l => r.includes(l)).length / lines.length >= 0.5 : r.includes(p.slice(0, 60))) return [];
  return ['This run is headless (claude -p or the SDK): its caller gets only the last message, and this reply to a background notice is now that message, so the answer given before is lost. End with that whole answer again, then any news from the notice.'];
}
const turnNotes = notesOf; // (the agent's notes this turn)
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
  // (an Issue line the agent wrote in its own text counts as one in the notes: the note check asks it to move it there)
  const inText = /^\W*Issue:\s*(?!none\b|<)[^\n]*\|\s*runbook:/im.test(acts.said || '');
  if (!(ISSUE.test(notes) || inText || acts.calls.some(issueWritten) || acts.calls.some(c => c.name === 'Read' && /learn-from-upset[\\/]+SKILL\.md$/i.test(String(c.input?.file_path || ''))))) return [];
  const changed = changedOf(acts, true);
  // (a turn that changed nothing owes it too once the agent wrote an Issue line: it took the complaint on, and "sorry, I'll
  // be careful" is no fix and no verdict. Only the skill opened, on a turn of no work, is a look at it. Lesson (the old
  // suite under v2): an apology with "Learned (none)" and no verdict passed)
  if (!worked(acts) && !changed.length && !(ISSUE.test(notes) || acts.calls.some(issueWritten))) return [];
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
// REQ: stop-follow-on. An ask whose fix writes files (a rule, a lesson) sets off the checks on those files, such as the
// runbook's changelog item once the turn changes files. They are named now, after the ask, judged as if those files
// were written, so the next round brings nothing this one could have named. Lesson (the old engine): a lesson written
// in round 1 made new steps appear only in round 2.
const FIX_FILES = [
  [/^Write the rule down\b/, () => ['CLAUDE.md', 'docs/checks/user-requirements.md']],
  [/^Write the lesson where it stops the next miss\b/, (turn, acts) => {
    // (a complaint in a turn that changed nothing may well not hold, and "Learned (none)" says it did not: no lesson file
    // is foreseen. Lesson (the old engine): a false complaint, checked with nothing changed, got changelog and audit steps)
    if (!changedOf(acts).length || /^[\s>*_-]*(learned|aprendido)\s*\((none|nothing|ninguno|ninguna|nada)\)\s*:/im.test(`${acts.said || ''}\n${turnNotes(acts)}`)) return [];
    const named = [...String(acts.said || '').matchAll(/^[\s>*_-]*learned\s*\((?:one-off|lesson|rule|check|skill|engine)\)\s*:[^\n]*?(?:→|->)\s*`?([^`\s,;]+)/gim)].map(m => m[1].replace(/[.)]+$/, ''));
    return named.length ? named : [chosen(turn, acts, runbooks())?.file || 'docs/playbooks/x.md'];
  }],
  // (a "Done when" item, of a runbook, a skill or the always list, that asks for a file: "(file: data/**)" as "data/x")
  [/^[\w./-]+\.md item \d+: /, (turn, acts, s) => {
    const [, f, n] = /^([\w./-]+\.md) item (\d+): /.exec(s);
    const it = doneWhen((() => { try { return fs.readFileSync(at(f), 'utf8'); } catch { return ''; } })()).find(i => String(i.n) === n);
    return it?.kind === 'file' ? String(it.arg || '').split('|').map(a => sampleOf(a.trim())).filter(Boolean) : [];
  }],
  // (an engine check that asks for files changed: one path of each of its globs)
  [/^Check: /, (turn, acts, s) => {
    const q = engineChecks().find(r => r && r.message && s.startsWith(`Check: ${r.message}`));
    const globs = c => !c || typeof c !== 'object' ? [] : [...[].concat(c.filesChanged || []), ...(c.anyOf || []).flatMap(globs)];
    return globs(q?.require).map(sampleOf);
  }]
];
// a glob as one path it matches ("items/**/*.txt" -> "items/x/x.txt"), so the checks on it can be asked
const sampleOf = g => String(g).replace(/\{([^,}]*)[^}]*\}/g, '$1').replace(/\*\*/g, 'x').replace(/[*?]/g, 'x');
export function followOn(turn, acts, list) {
  const done = new Set(changedOf(acts));
  // (a record line, the changelog, status or decisions, is the step itself, not work that sets off more. Lesson (the old
  // suite under v2): a runbook's changelog item set off the Finished section on a turn that only re-decided a checklist row)
  const RECORD = /^(docs\/(CHANGELOG|STATUS|DECISIONS)\.md|tools\/starter\/(STARTER-CHANGELOG|STATUS)\.md)$/;
  const files = [...new Set(list.flatMap(s => FIX_FILES.filter(([rx]) => rx.test(s)).flatMap(([, f]) => f(turn, acts, s))))].filter(f => !done.has(f) && !RECORD.test(f));
  if (!files.length) return [];
  const sim = { ...acts, calls: [...acts.calls, ...files.map(f => ({ name: 'Edit', input: { file_path: at(f) } }))] };
  const now = new Set(list);
  const out = [...new Set([...missing(turn, sim), ...skillMissing(sim), ...alwaysGaps(sim), ...engineCheckGaps(sim), ...hookTestsGaps(sim)])].filter(s => !now.has(s))
    .map(s => `Then, once ${files.slice(0, 2).join(' and ')} ${files.length > 1 ? 'are' : 'is'} written: ${s}`);
  // (the self-tests: a fix that writes the hook or its checks, or a rule whose enforcement may be a check, is told once,
  // plainly, as the old engine did; what a check's text will be is not known yet)
  const HOOKISH = /^tools\/hooks\/([^/]+\.mjs|requirements\.json|config\.json)$|^docs\/checks\/always\.md$/;
  if ((files.some(f => HOOKISH.test(f)) || list.some(s => /^Write the rule down\b/.test(s))) && ![...done].some(f => HOOKISH.test(f)) && !list.some(s => /^The (hook logic|checks\b[^\n]*) changed: run/.test(s)))
    out.push('Then, if the fix changes the hook engine or its checks (tools/hooks/): run node tools/hooks/selfcheck.mjs (or --tags <the new or changed check>) until it prints ALL PASS.');
  return out;
}
// REQ: skill-learn, under v2: the shared tools/hooks/skilllearn.mjs. The checks that held an earlier round of this request
// come from the Stop log (its steps), each mapped to its check: an engine check by its message, a runbook's "Done when"
// item as its own ("<file>#<n>"), the core rule and complaint asks by their words. A runbook's own checks are the engine
// checks that name it, its frontmatter "checks:" and its items.
const CORE_ASKS = [['rule-request', /^(Write the rule down|Say how the rule is enforced)\b/], ['rule-memory', /^Save the rule to memory\b/],
  ['hooks-tested', /^The (hook logic|checks\b[^\n]*) changed: run\b/],
  ['upset-learned', /^(The runbook your Issue line names|Give the point in general terms|Say the root cause|Say first whether it holds|Say what you checked|Write the lesson where it stops)/]];
const normStep = s => String(s).replace(/\s+/g, ' ').slice(0, 80);
function stepTags(step) {
  const s = normStep(step);
  if (/^Then\b/.test(s) || /^verify /.test(s)) return [];
  const item = /^([\w./-]+\.md) item (\d+): /.exec(s);
  if (item) { const it = doneWhen((() => { try { return fs.readFileSync(at(item[1]), 'utf8'); } catch { return ''; } })()).find(i => String(i.n) === item[2]); return it && it.kind !== 'answer' ? [`${item[1]}#${item[2]}`] : []; }
  return [...CORE_ASKS.filter(([, rx]) => rx.test(s)).map(([t]) => t), ...engineChecks().filter(r => r?.message && normStep(`Check: ${r.message}`) === s.slice(0, normStep(`Check: ${r.message}`).length)).map(r => r.tag)];
}
let skillLearnMemo = null;
function skillLearnGaps(turn, acts, list, sid, request) {
  const NONE = /^[\s>*_-]*learned\s*\((none|nothing|ninguno|ninguna|nada)\)\s*:\s*\S.{8,}/im;
  const P = makeProof({ LEARNED_NONE: NONE }), esc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const fmChecks = front => String((/^checks:\s*(.+)$/m.exec(front || '') || [])[1] || '').replace(/^core:?/i, '').replace(/^none.*$/i, '').split(',').map(t => t.trim()).filter(Boolean);
  const books = [chosen(turn, acts, runbooks())].filter(Boolean).map(b => ({ name: b.name, file: b.file, front: b.front, items: b.items }));
  const skills = skillBooks({ parts: true }).filter(s => opened({ ...s, skills: [] }, acts) && !authored(s, acts)).map(s => ({ name: s.name, skillName: s.name, file: s.file, front: s.front, items: s.items }));
  if (!books.length && !skills.length) return [];
  // (a round that asked to open a runbook had not followed it yet: its items failing then are no miss of the runbook.
  // Oversight, 2026-11-10: no extra round after the work is done)
  const unfollowed = steps => new Set(steps.map(s => (/^Open ([\w./-]+\.md) and /.exec(normStep(s)) || [])[1]).filter(Boolean));
  const ownOf = (tags, steps) => { const skip = unfollowed(steps); return tags.filter(t => ![...skip].some(f => t.startsWith(`${f}#`))); };
  const earlier = (() => { try { return fs.readFileSync(at('tools/hooks/state/stop-log.jsonl'), 'utf8'); } catch { return ''; } })().split('\n')
    .map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(e => e && e.session === sid && e.request === request && e.result === 'blocked').flatMap(e => ownOf((e.steps || []).flatMap(stepTags), e.steps || []));
  const failedBefore = [...new Set(earlier)], failingNow = [...new Set(ownOf(list.flatMap(stepTags), list))];
  if (!failedBefore.length && !failingNow.length) return [];
  const checks = engineChecks();
  const SL = skillLearnMemo ||= makeSkillLearn({ complaintDisproved: P.complaintDisproved, learnedNone: () => NONE,
    promptGated: () => new Set(['rule-request', 'rule-memory', 'requirement-enforced', 'upset-learned', 'autonomy-recorded']),
    waived: (tag, text) => new RegExp(`N/?A\\s*\\(\\s*${esc(tag)}\\s*\\)|N/?A:\\s*${esc(tag)}\\b`, 'i').test(text || ''),
    ownChecks: item => [...engineChecks().filter(q => [q.when?.playbookUsed, q.when?.playbookRouted, q.when?.skillUsed].some(n => n && (n === item.name || n === item.skillName))).map(q => q.tag),
      ...fmChecks(item.front), ...(item.items || []).filter(i => i.kind && i.kind !== 'answer').map(i => `${item.file}#${i.n}`)],
    loadRequirements: () => ({ reqs: checks }), setupTurn: () => fs.existsSync(at('SETUP-PROMPT.md')) && !fs.existsSync(at('.starter-template')), esc });
  // (what the agent said includes its turn notes, as the old engine read them: "Learned (none): ..." is often there)
  const x = { said: `${acts.said || acts.answer || ''}\n${turnNotes(acts)}`, answer: String(acts.answer || ''), workTurn: worked(acts), changed: changedOf(acts), usedPb: books, usedSkills: skills, failedBefore, cmds: [], since: Date.parse(turn.at || '') || 0 };
  return SL.skillLearnCheck(x, projectConfig(), failingNow).map(g => g.msg);
}
// The answer the user holds before the latest block (the host shows a block as a "Stop hook feedback" message); when that
// was itself a note (short with no Finished section, or "Added:"/"Corrected:"), the full answer before it with each note
// after it. Lesson (the old suite's "stop rounds" under v2): a third round's note was judged beside the second's only.
const textOf = r => { const c = r?.message?.content; return Array.isArray(c) ? c.filter(x => x?.type === 'text').map(x => x.text).join('\n') : typeof c === 'string' ? c : ''; };
const noteOn = (prev, note) => prev && note && !note.includes(prev.trim().slice(0, 200)) && (/^\s*(added|corrected|añadido|corregido)\s*:/im.test(note) || (note.length <= 600 && !/^\s*(#{1,6}\s*|\*\*)?finished\b/im.test(note)));
export function answerBeforeBlock(rows) {
  let last = ''; const sent = [];
  for (const r of rows) { const t = textOf(r);
    if (r?.type === 'assistant') { if (t.trim()) last = t; } else if (r?.type === 'user' && /^\s*Stop hook feedback\b/.test(t) && last && last !== sent.at(-1)) sent.push(last); }
  return sent.reduce((held, t) => noteOn(held, t) ? withNote(held, t) ?? `${held.trim()}\n\n${t}` : t, '');
}
function judge(data, { shadow = false } = {}) {
  // (with no saved start, the turn starts at its request's own time. Lesson (a field report): the first turn after an
  // upgrade installed v2 had no saved start, so a file a script wrote did not count, and the request was blocked twice)
  const lap = laps();
  const saved = loadTurn(data.session_id), rows = turnRows(data.transcript_path || '', saved.at);
  lap('turn rows');
  if (data.stop_hook_active && !saved.at) return null; // (no record of the request: its blocks can't be counted)
  // (a background command of this turn still running is waited for like a helper: its result is not in yet. A server
  // or watcher never ends, so it does not count. Lesson (a project's report): a turn waiting on its full self-test was
  // blocked three times and wrote its answer before the results existed)
  const LIVE = /(?:^|&&|;|\|)\s*(?:cd\s+\S+\s*&&\s*)?(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:dev|start|serve|preview|watch)\b|\b(?:vite|next\s+dev|nodemon|http\.server|runserver|uvicorn|flask\s+run|tail\s+-f)\b|\s--watch\b/i;
  // REQ: headless-resume. A headless run (claude -p or the SDK) ends with its answer, and a helper resumed by a message
  // (SendMessage) stops with it, so waiting for it loses its work: the turn is held instead. Lesson (the old engine, trial
  // round 23): a headless setup resumed its helper, answered "still running", and the user never got the result.
  const running = helpersRunning(rows), lost = headlessResumed(rows, running);
  if (!lost.length && (running.length || backgroundRuns(rows).some(r => !LIVE.test(r.cmd)))) {
    // REQ: claim-checked, while helpers run: the work is not over, so nothing else is asked yet, but an answer that says
    // a git push or commit happened when this turn's last one was refused or failed is held now, once, as the old
    // engine did. Lesson (the old suite under v2): "Pushed. Everything is on GitHub" passed while a helper still ran
    // and the push had been refused.
    const said = typeof data.last_assistant_message === 'string' && data.last_assistant_message.trim() ? data.last_assistant_message.trim() : '';
    const early = data.stop_hook_active ? [] : S('claimGaps', () => { const a = turnActs(rows); return waivedTag('claim-checked', a) ? [] : gitClaimGaps({ ...a, answer: said || a.answer }); });
    if (early.length) {
      decided = { request: '', round: 1, steps: early.map(s => s.replace(/\s+/g, ' ').slice(0, 80)) };
      return { decision: 'block', reason: `Not done yet:\n${early.map(s => `- ${s}`).join('\n')}\nFix it in the answer now; the helpers' results are checked when they report back. Tell the user in a line, in their language, only what changed, with nothing about this check in it.` };
    }
    // (logged with its request and the round the next Stop is, as the old engine did: "hooks.mjs last" shows the rounds
    // across waits. Lesson (the old suite under v2): waits were logged with no request or round)
    { const again0 = Boolean(saved.at && saved.blocked === saved.at), at0 = saved.at && new Date(Number.isNaN(+saved.at) ? saved.at : +saved.at);
      decided = { request: at0 && !Number.isNaN(+at0) ? at0.toISOString() : '', round: (again0 ? saved.rounds || 1 : 0) + 1 }; }
    waiting = true; return null;
  }
  const found = turnActs(rows);
  const turn = { ...saved, at: saved.at || found.started || '' };
  // (a helper's commands count too, in time order. Lesson (trial v40): tests a setup helper ran were asked for again)
  const runs = helperRuns(data.transcript_path || '', data.session_id || '', turn.at);
  const acts = withBackgroundOutputs({ ...found, at: turn.at, calls: runs.length ? [...found.calls, ...runs].sort((a, b) => (a.at || 0) - (b.at || 0)) : found.calls }, rows);
  acts.startHashes = loadDirty(data.session_id || '', saved.at || '');
  // (the session, so a turn can tell when another session works in the same folder: touchedSince)
  acts.session = String(data.session_id || '');
  lap('acts (turn, helpers, start hashes)');
  // (the final answer as the host hands it over: the transcript may not hold it yet when the Stop hook runs. Lesson
  // (2026-11-07): an answer that ended with its Finished section was blocked for lacking one)
  const final = typeof data.last_assistant_message === 'string' ? data.last_assistant_message.trim() : '';
  if (final) { acts.answer = final; if (!String(acts.said || '').includes(final)) acts.said = `${acts.said || ''}${final}\n`; }
  // (counted per request: a turn that goes on after its block and stops again, with no new request, is the same request.
  // Lesson (trial): a continuation the host did not mark as one restarted the count)
  const again = Boolean(turn.at && turn.blocked === turn.at), rounds = again ? turn.rounds || 1 : 0;
  const t0 = turn.at && new Date(Number.isNaN(+turn.at) ? turn.at : +turn.at);
  decided = { request: t0 && !Number.isNaN(+t0) ? t0.toISOString() : '', round: rounds + 1 };
  // (the cap ends the turn with its last steps not done: logged as such, never as a pass)
  if (rounds >= MAX_BLOCKS) { decided.capped = true; return null; }
  // REQ: pause-stops. The user asked to pause, stop or restart (in the request or a message typed during the turn): the
  // turn ends now, nothing more asked; the next session's checks pick up what is open (the guard still refused anything
  // unsafe during the work). Lesson (a field report): after "get to a good pausing point, I will restart the computer",
  // the end check held the turn 3 rounds and the work went on while the user restarted.
  if (pausedTurn(acts)) return null;
  // (on a repeat, what the agent said is read from after the last block: a message sent before it can't be taken back.
  // Lesson (2026-11-07): an Issue line in the first answer re-blocked the corrected answer that had none)
  // (a "does not fit" said in an earlier round still holds: the whole request's text is kept for that, saidAll)
  acts.saidAll = acts.said;
  if (again && turn.lastBlock) { const after = turnActs(rows.filter(r => (Date.parse(r.timestamp || '') || 0) > turn.lastBlock)); acts.said = after.said + (final && !after.said.includes(final) ? `${final}\n` : ''); acts.answer = final || after.answer || acts.answer; }
  // REQ: answer-resent. After a block the agent is told to send only a short note of what changed, so a repeat round
  // judges the answer sent before the block together with that note ("Added: ...", "Corrected: ...", a line or two), not
  // the note alone. Lesson (the old suite under v2): the note alone lacked the Finished section and the root cause, and
  // the turn was held again for what the first answer had.
  // (a note stands for the answer only beside a full answer sent earlier in this turn; a correction must quote that
  // answer word for word. Otherwise the user reads a note about an answer they never got, or a correction of words that
  // are not there. As the old engine. Lesson (the old suite under v2): "Answer unchanged" and "Added: ..." with no answer
  // before them passed, and the user never got the answer)
  const resent = [], sentNote = String(acts.answer || '').trim();
  const isNote = /^\W{0,4}(added|añadido|corrected|correction|corregido|correcci[oó]n)\s*:|^\W{0,4}(answer unchanged|respuesta sin cambios)\b/i.test(sentNote);
  const prevAnswer = again ? answerBeforeBlock(rows) : '';
  // (any text the agent sent earlier in this turn that is not itself a note is an answer the note can stand beside, with
  // or without a block between them. Lesson (the gui port): an "Added:" after a passing answer was called answer-less)
  const earlier = rows.filter(r => r?.type === 'assistant').map(textOf).map(t => t.trim()).filter(t => t && t !== sentNote && !/^\W{0,4}(added|añadido|corrected|correction|corregido|correcci[oó]n|answer unchanged|respuesta sin cambios)\b/i.test(t));
  if (isNote && !String(prevAnswer).trim() && !earlier.length) resent.push('The last message is only a note on an answer ("Added:", "Corrected:" or "Answer unchanged"), but no full answer was sent earlier in this turn. End with the whole answer to the request.');
  if (again) { const prev = prevAnswer, note = acts.answer || '';
    if (noteOn(prev, note)) {
      // (its "Corrected:" lines are applied to the earlier answer, as the old engine does (correct.mjs): the withdrawn text
      // is no longer part of the answer. Lesson (the old suite under v2): a corrected-away figure was traced as made up)
      const applied = withNote(prev, note);
      if (applied === null) { const lost = note.split(/\r?\n/).flatMap(l => correctionsOf(l) || []).filter(f => !prev.includes(f.old));
        resent.push(`The correction quotes text the earlier answer does not hold word for word (${lost.map(f => `"${f.old.slice(0, 60)}"`).join(', ')}). Quote it exactly, or end with the whole answer again, corrected.`); }
      acts.answer = applied ?? `${prev.trim()}\n\n${note}`; } }
  const raw = tail(data.transcript_path, 5 << 20), history = evidenceOf(raw);
  acts.earlier = earlierPrompts(raw, turn.at); acts.runbook = turn.runbook || ''; acts.notesAt = turn.notesAt; acts.notesSha = turn.notesSha; acts.transcriptPath = data.transcript_path || '';
  acts.issuesBefore = issuesBefore(raw, turn.at); acts.prior = priorCalls(raw, turn.at); acts.complaint = complaintTurn(acts);
  lap('session transcript (tail, history, earlier)');
  // (a declared self-test the turn needed and never ran is run here first, so every check below judges its output;
  // never in a preview)
  let autos = []; if (!shadow) try { acts.sessionStart = sessionStart(data.transcript_path || '') || turn.at || null; autos = autoRuns(acts); } catch (e) { autos = [crashLine('self-run', e)]; }
  // (a message typed during the work is asked about once: a repeat round does not hold it again, however it was
  // answered, as the old engine did. Lesson (the old suite under v2): it was asked in every round)
  const late = (again ? [] : unansweredLate(rows, final)).map(m => `Answer the user's message typed at ${String(m.at).slice(11, 16) || 'mid-task'}: "${m.text.replace(/\s+/g, ' ').slice(0, 200)}"`);
  // (wakeups scheduled in any turn of the session count: one left from earlier still re-invokes it later)
  const sessionRows = raw.split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  acts.agentAll = W.agentTexts(sessionRows).map(x => x.t).join('\n'); // (a user message quoting the agent is not their words)
  // (REQ: watcher-left, the shared wakeups.mjs: a watcher armed in the session and not ended or named in the answer is
  // stopped before the answer, or its notice's reply replaces it. Lesson (the old suite under v2): v2 let one stay armed)
  const wakes = [...wakeGaps(sessionRows, final || acts.answer || '', acts.heard || ''), ...(checkOff('watcher-left') ? [] : watcherLeft(watchersArmed(sessionRows), final || acts.answer || ''))];
  lap('self-runs, late, session rows, wakeups');
  // (the work log: what this turn's messages asked, or the agent promised, that no later text of its named yet. The user's
  // rule, 2026-11-12: nothing asked or promised is dropped; the agent goes on to it, or says it is declined or waits)
  const logOpen = S('workLog', () => { if (!data.session_id) return [];
    const texts = [...W.agentTexts(sessionRows), ...(final ? [{ t: final, at: new Date().toISOString() }] : [])];
    // (proof it was forgotten, not a guess: another ask of this turn was taken up and this one not; a promise made before
    // the final answer and never named after. A terse "Done." after the work is no proof)
    const open = W.update(String(data.session_id), { msgs: W.typedMsgs(rows), texts }).filter(i => i.at >= (turn.at || '')), fin = texts.at(-1)?.at || '';
    const took = W.loadLog(String(data.session_id)).some(i => i.from === 'user' && i.status === 'done' && i.at >= (turn.at || '')), armed = watchersArmed(sessionRows).length + wakeupsPending(sessionRows).length > 0; // (a promise a watcher or wakeup is armed for is waiting)
    return open.filter(i => i.from === 'user' ? took : i.at < fin && !armed).map(i => `Still open: "${i.text}". Do it now, after a one-line update to the user, or say in one line it is declined (why) or waits on the user (what).`); });
  // (keep working: a turn that ticked a box of the project's queue is told the next open one, once)
  const nextUp = S('queue', () => { if (again || !W.tickedQueue(acts.calls)) return []; const q = W.queueOpen(f => { try { return fs.readFileSync(at(f), 'utf8'); } catch { return ''; } })[0];
    return q ? [`Next in the queue (${q.file}): "${q.text.slice(0, 160)}". Give the user a one-line update and start it now, unless it waits on the user (then say so).`] : []; });
  const extra = (turn.also || []).flatMap(f => missing({ ...turn, runbook: f }, acts, runbooks().filter(b => b.file === f)));
  const resumedLost = [...(lost.length ? [headlessLine(lost)] : []), ...noticeAnswerGaps(rows, final || acts.answer, data.stop_hook_active)];
  const list = [...resent, ...resumedLost, ...late, ...logOpen, ...nextUp, ...autos, ...wakes,...S('missing', () => [...emptyGaps(acts), ...missing(turn, acts), ...upsetGaps(turn, acts), ...ruleGaps(acts), ...watchedGaps(acts)]), ...S('unrouted', () => unroutedGaps(turn, acts, again)), ...extra, ...S('skillMissing', () => skillMissing(acts)), ...S('reviewGaps', () => reviewGaps(turn, acts)), ...S('testGaps', () => testGaps(acts, history)), ...S('gateGaps', () => gateGaps(acts)), ...S('screenGaps', () => screenGaps(acts)), ...S('healthGaps', () => [...healthGaps(acts, { run: !shadow }), ...upgradeGaps(turn, acts)]), ...S('knowledgeGaps', () => knowledgeGaps(acts)), ...S('staleCitedGaps', () => staleCitedGaps(acts)), ...S('securityGaps', () => securityGaps(acts)), ...S('questionGaps', () => [...questionGaps(acts), ...questionFileGaps(acts)]), ...S('noteGaps', () => noteGaps(acts)), ...S('quoteGaps', () => quoteGaps(acts)), ...S('claimGaps', () => claimGaps(acts, history)), ...S('scopeGaps', () => scopeGaps(acts)), ...S('tableGaps', () => tableGaps(acts)), ...S('planOpen', () => planOpenGaps(turn, acts, again)), ...S('externalStop', () => externalV2(data)), ...S('reviewExcuse', () => excuseV2(acts, rows)), ...S('friction', () => frictionV2(acts))].filter((s, i, all) => all.indexOf(s) === i);
  // (format items never hold: the Finished section, plain-writing reflows, a runbook item asking for the Finished section.
  // The reminder asks for them up front. The user, 2026-11-12: a hold for format splits the answer into fragments)
  const fmt = engineChecks().filter(r => ['finished-summary', 'plain-writing'].includes(r?.tag)).map(r => `Check: ${r.message}`.slice(0, 60));
  const notFmt = s => !fmt.some(m => s.replace(/^Then, once [^:]+: /, '').startsWith(m)) && !/^Make it plain and direct\b/.test(s) && !/ item \d+: [^\n]*\bFinished\b/.test(s); list.splice(0, list.length, ...list.filter(notFmt));
  // (the waiver tally: what this turn cleared with a reason is recorded; a check cleared in 3+ earlier turns is named)
  const full = list.splice(0, list.length); list.push(...full.filter(kept(acts)).filter(s => !(again && CRASHED.test(s))));
  list.push(...S('followOn', () => followOn(turn, acts, list)).filter(kept(acts)).filter(notFmt));
  list.push(...S('skillLearn', () => skillLearnGaps(turn, acts, list, data.session_id || '', decided.request || '')).filter(kept(acts)));
  const often = shadow ? '' : tally(full, list, turn.at ? `${data.session_id || 'x'}|${turn.at}` : '');
  // (a turn that ran the check on its draft has seen the verify list: the real stop does not send it back for it again.
  // Lesson (the user, 2026-11-07): the list came in the draft check and then again as a send-back, and the user read a
  // second round of the answer)
  const previewed = !shadow && (acts.calls || []).some(c => /^(Bash|PowerShell)$/.test(c.name) && /hooks\.mjs["']?\s+check\b[^\n]*--answer-file/.test(String(c.input?.command || '')));
  const check = again || previewed ? null : toVerify(turn, acts);
  decided.steps = [...list.map(s => s.replace(/\s+/g, ' ').slice(0, 80)), ...(check ? [`verify ${check.file}`] : [])];
  // (what the pass line may say, from what this turn proved: the checks ran over real work, the runbook's checkable items
  // all met, the files its own calls changed)
  if (!list.length && !check) { if (!shadow) { const b = worked(acts) ? chosen(turn, acts, runbooks()) : null, its = b ? b.items.filter(it => it.kind && it.kind !== 'evidence' && applies(it, acts)) : [];
    passed = { acts, turn, rounds, evidence: { checked: worked(acts) || rounds > 0, book: its.length && its.every(it => met(it, acts) === true) ? b.file : '', written: changedOf(acts) } }; } return null; }
  const parts = [], last = rounds + 1 === MAX_BLOCKS;
  // (a repeat block asks for the fix, or one line on why the item doesn't fit this work, never the same answer again.
  // Lesson (2026-11-07): an agent resent the same answer to each repeat block, and the false item was never looked at)
  if (list.length) parts.push(`${again ? 'Still not done (do it now, or say in one line of the answer why it does not fit this work, as "<runbook>.md doesn\'t fit this task: <why>" or "item N doesn\'t fit: <why>"; resending the same answer does not count)' : 'Not done yet'}:\n${list.map(s => `- ${s}`).join('\n')}`);
  if (often && list.length) parts.push(often);
  if (last) parts.push('This is the last check for this request: whatever you can\'t do, say plainly in the answer that it is not done and why.');
  // (a Spanish request is told the Spanish labels of what it is held to, as the old engine did)
  if (list.length && isSpanish(acts.heard || '')) parts.push(labelsEsHint(list.join(' ').toLowerCase().replace(/\s+/g, '-')));
  if (turn.at && !shadow) saveTurn(data.session_id, { ...turn, blocked: turn.at, rounds: rounds + 1, lastBlock: Date.now() });
  if (check) parts.push(`Check that these items of ${check.file} are really done (one that doesn't fit: "item N doesn't fit: <why>"; none of them: "${check.file.replace(/^.*\//, '')} doesn't fit this task: <why>"):\n${check.items.map(it => `${it.n}. ${it.text}`).join('\n')}`);
  // (after a block: a short note in the user's language of only what changed, the check left out, not the answer again.
  // The user, 2026-11-07: run the check before answering instead)
  return { decision: 'block', reason: `${parts.join('\n')}\nFix what isn't done. Then tell the user in a line or two, in their language, only what changed in the answer above, with nothing about this check in it; if nothing changed for them, say nothing more. Next time, run node tools/hooks/hooks.mjs check --answer-file <your draft> before answering, so the answer goes out once.` };
}
