// Engine v2 start hook (UserPromptSubmit): the reminder. At most 10 plain lines: the runbook that fits and its
// "Done when" list, which the end hook checks. Nothing about the engine itself.
import fs from 'node:fs';
import path from 'node:path';
import { route, skillBooks, saveTurn, loadTurn, isSpanish, ROOT, at, quoteCheckOn, projectConfig, checkOff, snapshotLater, runbooks, routeEnglish, engineChecks, doneWhen, ALWAYS } from './lib.mjs';
import { closestRunbook, coreRunbook, isTaskRequest, userWords } from '../near.mjs';
import { isPraise } from '../praise.mjs';
import { NUMBERS_ASK } from '../trace.mjs';

// REQ: check-preview. What the end check will also ask for if the work changes files, beyond the runbook's own list: the
// engine checks that name this runbook or skill and apply once files change, and the project's own always.md items that
// apply when a file changes. One line, last, so the line cap drops it first; each named by the check's own tag or item
// text, never a list of its own. A hint only. (Oversight, 2026-11-10: "the start hook lists what must be done if X
// happens". Lesson (the old suite under v2): the agent first heard of these checks when the end check held the turn)
export function alsoChecked(names = []) {
  const files = c => JSON.stringify(c || {}).includes('"filesChanged"');
  const mine = engineChecks().filter(r => files(r.when) && [r.when?.playbookUsed, r.when?.playbookRouted, r.when?.skillUsed].some(n => n && names.includes(n))).map(r => r.tag.replace(/-/g, ' '));
  let own = []; try { own = doneWhen(fs.readFileSync(at(ALWAYS), 'utf8')).filter(it => it.kind && (it.whens || []).some(w => w.kind === 'file')).map(it => it.text.length <= 60 ? it.text : it.text.slice(0, it.text.lastIndexOf(' ', 57)) + '...'); } catch { }
  // (plan-required applies to any task: named as the old engine named it, with the project's own new-file limit)
  const plan = checkOff('plan-required') ? [] : [`plan required (a plan in docs/plans/ first) if it adds ${Number(projectConfig().planNewFiles) || 5}+ new files`];
  const all = [...new Set([...mine, ...own, ...plan])];
  return all.length ? `Also checked at the end if files change: ${all.slice(0, 4).join('; ')}${all.length > 4 ? `; +${all.length - 4} more` : ''}.` : '';
}
import { toOtherSession, RELAY_START, HANDBACK, relayedBody, relayRouteText, relayRequestText } from '../relay.mjs';
// (the host's notice that a peer went idle or held a message: no request of anyone's)
const NOTICE = /^\s*\[Cross-session (idle|delivery) notice\]/;
import { asksOnly } from './late.mjs';
import { PAUSE_ASK, PAUSE_HINT } from '../pause.mjs';
import { capsUpset } from '../caps.mjs';
import { esLabelList } from '../labels.mjs';

// REQ: question-answered (as it arrives). A message that only asks is answered first, in plain words; one typed while a
// turn runs is answered in the very next message and starts no work of its own. Lesson (a study of 117 real questions):
// runbook hints on "why"/"is it" questions sent agents into fix work, and questions typed mid-turn went unanswered.
const Q_NOW = 'QUESTION (typed while you work): answer it in your very next message, plainly and first, then carry on. Never defer it ("I\'ll answer once ..."), and start no other work for it unless it asks for work.';
const Q_FIRST = 'QUESTION: answer it directly, first, in plain words. A runbook or skill named below is where the answer may be, not steps to run, unless the user asks for the work.';

export const MAX_LINES = 10;
// (an upset message: capitals with a sign of trouble (caps.mjs, shared with the old engine), or the usual frustration
// words. Lesson (routing sample): complaints used no trigger phrase, so they reached no runbook. Lesson (two projects'
// trigger logs): capitals alone are emphasis, "GO ALL OUT" is eager; "it NEEDS TO BE CLEAR" with "still" is upset)
export const upset = p => { const s = String(p); return capsUpset(s)
  // (a complaint about what was done: "you made a new note without linking it". Lesson (trial v38): it got no notice)
  || /\byou (made|wrote|added|created|built|saved|left|put|did)\b[^.?!]{0,80}\bwithout\b/i.test(s)
  // (a repeated miss: "you keep making X", "why does it keep ...", "wrong again!!". Lesson (trial v41): a complaint with
  // "!!" got only the generic reminder)
  || /(?<!\b(?:can|could|would|will|should|to|please|and|if|let|make) )\b(you|u|it) keep(s)? (on )?\w+ing\b|\bwhy (do|does|did) (you|it) keep\b|\bagain\s*!!/i.test(s)
  // (what was let through, and "that should never happen again". Lesson (trial v42): "you let any user delete ...! that
  // should never happen again" got no notice and no runbook)
  || /\byou (let|allowed) (any|anyone|anybody|everyone|everybody|every|all|the|a|other|staff|users?)\b[^.?!]{0,80}!|\b(that|this|it) (should|must|can) never happen again\b/i.test(s)
  || /\b(wtf|ugh|again\?!|why (did|would) you|you (forgot|missed|ignored|broke)|i (already )?told you|not what i asked|frustrat\w*|annoy\w*|(you|u|you're|ur|youre) (are )?not (following|listening)|i don'?t think you (understand|get it)|(is )?still (broken|wrong)|do you (ever|even) (think|read|check|look|listen|test|consider|care))\b/i.test(s)
  // (the Spanish forms. Lesson (trial v37): "otra vez pusiste texto en inglés" got no upset notice under v2)
  || /(?<!\p{L})(otra vez|de nuevo) (pusiste|hiciste|olvidaste|dejaste|metiste|usaste|escribiste|rompiste)|(?<!\p{L})(te (lo )?dije|(se te )?olvid(aste|ó)|por qu[eé] (lo )?hiciste|no me (escuchas|haces caso)|sigue (roto|mal|fallando))(?!\p{L})/iu.test(s); };
const has = f => fs.existsSync(at(f));
// (a word only mentioned ("the word ugh", a word in quotes) or on the user's ignore list, config "ignoreWords": {"upset":
// [...]}, is no complaint. Lesson (end-to-end run): a request to whitelist a word was itself read as upset)
const ignored = () => { try { return [].concat(JSON.parse(fs.readFileSync(at('tools/hooks/config.json'), 'utf8')).ignoreWords?.upset || []).map(String).filter(Boolean); } catch { return []; } };
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const upsetIn = p => {
  let s = String(p).replace(/(["'`“‘])[^"'`”’\n]{1,40}["'`”’]/g, ' ').replace(/\b(?:the |that |this )?words?\s+\S+/gi, ' ');
  for (const w of ignored()) s = s.replace(new RegExp(`\\b${esc(w)}\\b`, 'gi'), ' ');
  return upset(s);
};
// The project's own standing rules (AGENTS.md, "The user's standing preferences") that share a word with the request,
// at most two. Lesson (trials v30, v37): agents built against a rule the project already had for the area they touched
// (who may delete, who manages accounts); the rule was in the rules file, not in front of them at that moment.
const STOP = new Set(['about', 'after', 'again', 'their', 'there', 'these', 'thing', 'which', 'would', 'could', 'should', 'please', 'every', 'other', 'where', 'while', 'project', 'always', 'never', 'until', 'because', 'stays', 'without']);
export function rulesFor(prompt) {
  let text = ''; try { text = fs.readFileSync(at('AGENTS.md'), 'utf8'); } catch { return []; }
  const sec = /^##\s+The user's standing preferences\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im.exec(text)?.[1] || '';
  const stem = w => w.toLowerCase().slice(0, 5);
  // (a short request only: a long one shares words with most rules. Lesson (replay): on long requests and relayed
  // messages a rule line showed on nearly every turn)
  if (String(prompt).length > 300 || relayedRx.test(String(prompt))) return [];
  const words = new Set((String(prompt).match(/\p{L}{5,}/gu) || []).map(w => w.toLowerCase()).filter(w => !STOP.has(w)).map(stem));
  if (!words.size) return [];
  const rules = sec.split(/\r?\n/).filter(l => /^\s*-\s+\S/.test(l) && !/^\s*-\s+\(none/i.test(l));
  const stemsOf = l => new Set((l.match(/\p{L}{5,}/gu) || []).filter(w => !STOP.has(w.toLowerCase())).map(stem));
  // (a word counts only when it is this rule's own, in no other rule: the project's main nouns are in many)
  const seen = new Map(); for (const l of rules) for (const s of stemsOf(l)) seen.set(s, (seen.get(s) || 0) + 1);
  return rules
    // (two words in common, not one: one common word, like the project's main noun, matched 16 of 38 real requests)
    .filter(l => [...stemsOf(l)].filter(s => words.has(s) && seen.get(s) === 1).length >= 2)
    .slice(0, 2).map(l => l.replace(/^\s*-\s+/, '').trim()).map(l => l.length > 200 ? l.slice(0, l.lastIndexOf(' ', 197)) + '...' : l);
}
// (a message relayed from another session, a helper or a task notice is not the user's: it is never upset and sets no
// rule. Lesson (a peer session, live): a status report quoting a capital "NEVER" got "This sounds upset")
const relayedRx = /^\s*Another Claude session sent a message|<(cross-session-message|agent-message|task-notification)\b/;
export function reminder(prompt, { midTurn = false } = {}) {
  const raw = String(prompt || '');
  // (REQ: pause-stops: a request to pause, stop or restart wraps up now, whatever else the message says)
  if (!relayedRx.test(raw) && PAUSE_ASK.test(raw)) return { book: null, text: [PAUSE_HINT, upsetIn(raw) && has('skills/learn-from-upset/SKILL.md') ? 'This sounds upset: open skills/learn-from-upset/SKILL.md and follow it.' : ''].filter(Boolean).join('\n') };
  const asking = !relayedRx.test(raw) && asksOnly(raw.replace(/<pasted_content\b[\s\S]*?(<\/pasted_content[^>]*>|\/>)/gi, ' '), projectConfig().changeWords);
  if (asking && midTurn) return { book: null, text: [Q_NOW, upsetIn(raw) && has('skills/learn-from-upset/SKILL.md') ? 'This sounds upset: open skills/learn-from-upset/SKILL.md and follow it.' : ''].filter(Boolean).join('\n') };
  const r = remind(prompt);
  return asking ? { book: r.book, text: [Q_FIRST, r.text].filter(Boolean).join('\n') } : r;
}
function remind(prompt) {
  const raw = String(prompt || '');
  // REQ: relay-preview. A message relayed from another session or agent routes on the sentences that ask for work (what
  // it quotes, runs or reports as done left out: relay.mjs, shared with the old engine), never on its wrapper; a helper's
  // hand-back, a peer's idle or delivery notice and a message that only reports get no reminder. Lesson (the old suite
  // under v2): the wrapper's own words ("cross-session message") routed to the field-report runbook, and small talk
  // got the generic line.
  if (RELAY_START.test(raw) || NOTICE.test(raw)) {
    // (the host sends both wrappers, the sentence then the tag: each is peeled)
    const peel = s => { const b = relayedBody(s); return b && RELAY_START.test(b) ? peel(b) : b; };
    const body = HANDBACK.test(raw) ? '' : peel(raw);
    const ask = body ? relayRequestText(relayRouteText(body), projectConfig()) : '';
    if (!ask) return { book: null, text: '' };
    // (its "from now on" or "always" sets no rule of the user's, so it does not route to the rules runbook: the work does.
    // As the old engine. Lesson (the old suite under v2): "from now on always tune my zorbel weekly" went to project.md)
    prompt = ask.replace(/\b(from now on|going forward|from here on|de ahora en adelante|a partir de ahora)\b,?\s*/gi, ' ').replace(/^(\s*)(always|never|siempre|nunca)\s+/i, '$1').trim() || ask;
  }
  // (pasted text is not the user's words: it never routes and is never upset. Lesson (the old engine): words inside a
  // pasted text set off the complaint handling)
  prompt = String(prompt || '').replace(/<pasted_content\b[^>]*>[\s\S]*?<\/pasted_content(?:\s[^>]*)?>|<pasted_content\b[^>]*\/>/gi, ' ');
  // (upset and a fitting runbook: both are named, so the fix still follows its runbook)
  const sore = !relayedRx.test(raw) && upsetIn(prompt) && has('skills/learn-from-upset/SKILL.md') ? 'This sounds upset: open skills/learn-from-upset/SKILL.md and follow it.' : '';
  // (routed on the user's own words: the hooks' own output pasted back, and messages relayed into it, never route. As the
  // old engine. Lesson (the old suite under v2): a pasted block's "make a plan" step routed to the plan runbook)
  const book = route(userWords(prompt) || prompt);
  const quoteOn = quoteCheckOn();
  // (a Spanish request: the whole answer in Spanish, labels too. Lesson (trial v37): a runbook item quoted an English
  // label, and it went into a Spanish answer twice, the second time in the reply to a complaint about English text)
  // (and the files the answer points them to. Lesson (trial v45): a Spanish answer sent the user to a spec and release
  // notes written in English)
  // (with the labels every answer may use, in Spanish; the end check names the rest when it holds a turn)
  const es = isSpanish(prompt) ? `LANGUAGE: the user writes in Spanish: write the whole answer in Spanish, including any label a runbook quotes in English, and any file you point them to. The checks accept these labels: ${esLabelList('')}.` : '';
  // (with no runbook routed, a skill whose own trigger phrase fits is named: the reminder only, the end check is
  // unchanged. Not beside a runbook, which names its own skills, and not on a one-word trigger. Lesson (replay of three
  // sources): beside a runbook it was mostly noise, like "compare" in a scheduled request, and every miss alone was one
  // word, like "note" or "redundant")
  // (and in the request's first sentence, where it says what it asks: everyday phrases like "find out" come up later in
  // long instructions. Lesson (a scheduled review request): "if it is idle, find out why" named the research skill)
  // (on the user's own words only: a message relayed from another session suggests no skill, its words describe that
  // session's work. Lesson (the old suite under v2): a relayed "ran in parallel" status named the parallel-agents skill)
  const sk = book ? null : route(String(userWords(prompt)).trim().split(/(?<=[.?!])\s+|\n/)[0] || '', skillBooks());
  // (a one-word trigger counts as the request's first word, an imperative ("research ...", "investiga ...") or a label
  // typed as one ("note: ..."): the noise one-word triggers made came from words later in long requests)
  const first = (String(prompt).trim().toLowerCase().match(/^[^\s]+/) || [''])[0];
  // (only the skill's own name ("research ...") or a label typed with its colon ("note: ..."): a generic verb that opens
  // the request, "compare the two totals", stays unnamed. Lesson (replay): one-word misses were generic words)
  // (in Spanish, by its English: "investiga ..." opens with "research")
  const firstWord = first.replace(/[^\p{L}\p{N}-]+$/u, '');
  const opens = (t, name) => !!t && ((/:$/.test(t) && first === t) || ([firstWord, routeEnglish(firstWord)].includes(name) && [name, firstWord].includes(t)));
  const skill = sk && (/\s/.test(sk.matched || '') || opens(String(sk.trigger || sk.matched || ''), sk.name)) && !(sore && sk.name === 'learn-from-upset') ? `Skill: open ${sk.file} and follow it.` : '';
  if (sore && !book) return { book: null, text: [sore + (quoteOn ? ' Write any lesson in general terms, not in the user\'s own words.' : ''), skill, es].filter(Boolean).join('\n') };
  // (no trigger fits: the agent picks the runbook, and the end check holds the turn to the one it opened. Lesson
  // (routing sample): plain requests used no trigger phrase; growing trigger lists forever is the old engine's path)
  // (a task with no trigger and no skill: the runbook sharing the most content words with it is named in the same line,
  // a hint only, as the old engine's closest runbook. Lesson (the old suite under v2): different wording for a known job
  // got only the generic line, and its own runbook went unopened)
  const taskVerbs = (() => { try { return new RegExp(projectConfig().taskVerbs || '(?!)', 'i'); } catch { return /(?!)/; } })();
  const near = !book && !skill && isTaskRequest(prompt, taskVerbs, toOtherSession(prompt))
    ? closestRunbook(prompt, runbooks().map(b => ({ name: b.name, file: b.file, triggers: b.triggers || [], fm: { summary: (/^summary:\s*(.+)$/m.exec(b.front || '') || [])[1] || '' } })), coreRunbook) : null;
  const pick = near ? `Closest runbook: ${near.file} (shared words: ${near.words.join(', ')}). If it fits this job, open and follow it; if not, pick the one in DIRECTORY.md that fits.`
    : has('DIRECTORY.md') ? 'If this is real work, pick the runbook in DIRECTORY.md that fits and open it.' : '';
  // REQ: praise-captured (at the request, a hint only). Praise in the user's own words (praise.mjs, shared with the old
  // engine) names what to do with it; the end check never holds a turn for praise on its own. Oversight (2026-11-10):
  // "detection from the user's words is a reminder hint only". Lesson (the old suite under v2): v2 said nothing on praise,
  // so what the user liked was never written down to repeat.
  const praise = !sore && !relayedRx.test(raw) && isPraise(userWords(prompt), projectConfig()) ? 'Praise: the user liked something. If it should repeat, write what exactly worked into the runbook or skill it came from (a "What works" line); "keep doing this" is a standing rule (project-rule).' : '';
  // REQ: answer-traced (at the request, a hint only). A request about numbers is told up front where its figures must
  // come from; the end check judges the figures the answer states, whatever was asked. Oversight decision 2026-11-10.
  const figures = !relayedRx.test(raw) && NUMBERS_ASK.test(String(userWords(prompt))) ? 'Figures: every figure in the answer comes from something read or run this turn; mark any other "(estimate)" or "(not verified)".' : '';
  if (!book) return { book: null, text: [skill, praise, figures, pick, es, ...rulesFor(prompt).map(r => `The project's own rule here: ${r}`), isTaskRequest(prompt, taskVerbs, toOtherSession(prompt)) ? alsoChecked(sk && skill ? [sk.name] : []) : ''].filter(Boolean).slice(0, MAX_LINES).join('\n') };
  const own = rulesFor(prompt).map(r => `The project's own rule here: ${r}`);
  // (a message relayed from another session may only report: its runbook is for when it asks for work. Lesson (project
  // report): a note that a fix had landed got the bugfix runbook and its list, though it asked for nothing)
  // (said in the runbook line itself: a line of its own was most of the reminders' growth on peer messages)
  // (a turn likely to write a lesson down, upset or a rule, lesson or runbook request, is told to write it in general
  // terms, in the runbook line itself: no extra line, and nothing on other turns. The end check catches a slip
  // (quoteGaps). On only with the quote check, quoteCheckOn)
  const lesson = quoteOn && (sore || ['project', 'learn-from-upset', 'runbook-create', 'project-rule'].includes(book.name)) ? ' Write any lesson in general terms, not in the user\'s own words.' : '';
  const lines = [...(sore ? [sore] : []), ...(es ? [es] : []), ...(praise ? [praise] : []), ...(figures ? [figures] : []), ...own, `Runbook${relayedRx.test(raw) ? ', only if this message asks for work here' : ''}: open ${book.file} and follow it.${lesson}`];
  if (book.items.length) {
    // (and how to hold the answer until it passes, in the same line. Lesson (the user, 2026-11-07): an answer sent back
    // by the end check reached the user twice; the first version must already be the final one)
    lines.push('Done when (before answering, check your draft: node tools/hooks/hooks.mjs check --answer-file <draft>):');
    for (const it of book.items) lines.push(`${it.n}. ${it.text.length > 140 ? it.text.slice(0, it.text.lastIndexOf(' ', 137)) + '...' : it.text}`);
  }
  // (what the end check also asks if files change: only when it fits under the cap, so it never pushes an item out)
  const also = alsoChecked([book.name]);
  if (also && lines.length < MAX_LINES) lines.push(also);
  // (more items than fit: the runbook has the rest)
  const text = lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES - 1), `(${lines.length - MAX_LINES + 1} more in ${book.file})`].join('\n') : lines.join('\n');
  return { book, text };
}

export function onPrompt(data) {
  // (a host notice, like a background job ending, is not a request: the turn keeps its runbook and gets no reminder.
  // Lesson (live): a job's notice mid-turn cleared the routed runbook, and the end check held the turn to another one)
  // (so is a helper's report back: the words of its report route nowhere. Lesson (live): a review helper's report
  // routed to the project runbook, and the end check asked for its rule-request items)
  if (/^\s*(<(task-notification|system-reminder)\b|\[SYSTEM NOTIFICATION)/i.test(String(data.prompt || '')) || /<agent-message\b[^>]*>\s*\[Subagent hand-back\]/.test(String(data.prompt || ''))) return null;
  // (a message that arrives while a turn runs joins that turn: it gets its reminder, and the turn keeps its start and
  // its runbook. A turn ends when its Stop passes; one left open over 12 hours, as after a crash, does not hold.
  // Lesson (live): a mid-turn message moved the turn's start, and the end check lost the work done before it)
  const prev = loadTurn(data.session_id);
  const open = !!(prev.at && !prev.ended && Date.now() - Date.parse(prev.at) < 12 * 3600_000);
  const { book, text } = reminder(data.prompt || '', { midTurn: open });
  // (an upset message from the user, not a relay, marks the turn: its end check asks for a fresh reviewer)
  const sore = upsetIn(data.prompt || '') && !relayedRx.test(String(data.prompt || '')) ? { upset: true } : {};
  // (REQ: queued-messages: a request typed mid-turn that fits another runbook adds it, and its "Done when" is checked
  // too. Lesson (2026-11-08): v2 kept only the first runbook, and a typed request's own checks were dropped)
  const also = prev.runbook && book?.file && book.file !== prev.runbook && !(prev.also || []).includes(book.file) ? [...(prev.also || []), book.file] : prev.also;
  if (prev.at && !prev.ended && Date.now() - Date.parse(prev.at) < 12 * 3600_000) saveTurn(data.session_id, { ...prev, runbook: prev.runbook || book?.file || null, ...(also ? { also } : {}), ...sore });
  // (a new turn notes its uncommitted files' contents in the background, so the end check can tell a file it only
  // touched from one it changed)
  else { const at0 = new Date().toISOString(); saveTurn(data.session_id, { at: at0, runbook: book?.file || null, ...sore }); snapshotLater(data.session_id, at0); }
  return text ? { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text } } : null;
}
