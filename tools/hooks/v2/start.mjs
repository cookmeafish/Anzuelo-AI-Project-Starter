// Engine v2 start hook (UserPromptSubmit): the reminder. At most 10 plain lines: the runbook that fits and its
// "Done when" list, which the end hook checks. Nothing about the engine itself.
import fs from 'node:fs';
import path from 'node:path';
import { route, skillBooks, saveTurn, loadTurn, isSpanish, ROOT, at, quoteCheckOn, projectConfig, checkOff, snapshotLater, runbooks, routeEnglish, engineChecks, doneWhen, ALWAYS, SMALL_SKIP, scopeLine } from './lib.mjs';
import { closestRunbook, coreRunbook, isTaskRequest, userWords, AUTONOMY_WORDS, ownEnds, EXAMPLE_CLASS, multiPart } from '../near.mjs';
import { isPraise } from '../praise.mjs';
import { NUMBERS_ASK } from '../trace.mjs';
import { openPlansOf } from '../planreq.mjs';
import { expandMenuOf, menuLines } from '../menu.mjs';
import { recallLine } from '../history.mjs';

// REQ: check-preview. What the end check will also ask for if the work changes files, beyond the runbook's own list: the
// engine checks that name this runbook or skill and apply once files change, and the project's own always.md items that
// apply when a file changes. One line, last, so the line cap drops it first; each named by the check's own tag or item
// text, never a list of its own. A hint only. (Oversight, 2026-11-10: "the start hook lists what must be done if X
// happens". Lesson (the old suite under v2): the agent first heard of these checks when the end check held the turn)
export function alsoChecked(names = [], { unrouted = false } = {}) {
  const files = c => JSON.stringify(c || {}).includes('"filesChanged"');
  // (no runbook routed: the end check's leave-a-runbook ask, said ahead, and that a runbook the project's own hooks name
  // counts as one followed when they route. Lesson (the old suite under v2): the old preview named runbook-exists)
  const ext = [].concat(projectConfig().externalHooks || []).length > 0;
  const rbx = unrouted && !checkOff('runbook-exists') ? [`runbook-exists: met once it follows a runbook${ext ? ", such as one the project's own hooks name" : ''}, leaves one, or says why none fits`] : [];
  const mine = engineChecks().filter(r => files(r.when) && [r.when?.playbookUsed, r.when?.playbookRouted, r.when?.skillUsed].some(n => n && names.includes(n))).map(r => r.tag.replace(/-/g, ' '));
  let own = []; try { own = doneWhen(fs.readFileSync(at(ALWAYS), 'utf8')).filter(it => it.kind && (it.whens || []).some(w => w.kind === 'file')).map(it => it.text); } catch { }
  // (plan-required applies to any task: named as the old engine named it, with the project's own new-file limit)
  const plan = checkOff('plan-required') ? [] : [`plan required (a plan in docs/plans/ first) if it adds ${Number(projectConfig().planNewFiles) || 5}+ new files`];
  // (an item is cut at about 60 characters only when the line would run long; a short line is left whole. Lesson (the
  // old suite under v2): one item was cut mid-sentence with room to spare)
  const cut = s => s.length <= 60 ? s : s.slice(0, s.lastIndexOf(' ', 57)) + '...';
  const whole = [...new Set([...rbx, ...mine, ...own, ...plan])], fits = whole.slice(0, 4).join('; ').length <= 300;
  const all = fits ? whole : [...new Set(whole.map(cut))];
  return all.length ? `Also checked at the end if files change: ${all.slice(0, 4).join('; ')}${all.length > 4 ? `; +${all.length - 4} more` : ''}.` : '';
}
// (REQ: small-change, said before the work so a small fix never starts a feature's ceremony: when the "Also checked"
// line names a step a small fix skips, a line of its own follows, while the reminder has room. Lesson (the old suite
// under v2): the old engine said it; v2 skipped the steps unannounced)
export function smallLine(also) {
  const names = [...String(also || '').matchAll(/(?:^|: |; )([a-z][a-z -]+?)(?=:|;|\.$| if | \()/g)].map(m => m[1].trim().replace(/ /g, '-'));
  if (!names.some(t => SMALL_SKIP.test(t))) return '';
  const pc = projectConfig();
  return `Small fix: if the change stays within ${pc.smallFiles ?? 3} files and ${pc.smallLines ?? 40} edited lines, the record steps are skipped; tests still apply.`;
}
import { toOtherSession, RELAY_START, HANDBACK, relayedBody, relayRouteText, relayRequestText } from '../relay.mjs';
// (the host's notice that a peer went idle or held a message: no request of anyone's)
const NOTICE = /^\s*\[Cross-session (idle|delivery) notice\]/;
import { asksOnly } from './late.mjs';
import { PAUSE_ASK, PAUSE_HINT } from '../pause.mjs';
import { capsUpset, unquoted } from '../caps.mjs';
import { BASE_REQUIREMENTS } from '../base-checks.mjs';
import { frictionHint } from './friction.mjs';
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
  || /(?<!\b(?:can|could|would|will|should|to|please|and|if|let|make) )\b(you|u) keep(s)? (on )?\w+ing\b|\bwhy (do|does|did) (you|it) keep\b|\bagain\s*!!/i.test(s)
  // ("it keeps ...ing" only when the message is no plain request to fix something: there "it" is the thing to fix.
  // Lesson (the old suite under v2): "please fix the garden shed door, it keeps coming loose" was read as upset)
  || (/(?<!\b(?:can|could|would|will|should|to|please|and|if|let|make) )\bit keeps? (on )?\w+ing\b/i.test(s) && !/^\s*(?:please\s+)?(?:fix|repair|mend|adjust|tighten|can you|could you|would you)\b/i.test(s))
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
  // (a long message: only its start and end are the user's words, the rest is pasted material, as the old engine.
  // Lesson (the old suite under v2): complaint words in the middle of a pasted log read as an upset user)
  let s = ownEnds(p).replace(/(["'`“‘])[^"'`”’\n]{1,40}["'`”’]/g, ' ').replace(/\b(?:the |that |this )?words?\s+\S+/gi, ' ');
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
// (a check is held on what the turn does when every way it can apply needs an action: a file changed, its content, a
// command run or failed. One that can apply on the request's or answer's words alone is only likely to fit. Oversight
// (2026-11-10), per the 2026-11-07 decision: "Must" only for checks an action sets off)
const ACTION = new Set(['filesChanged', 'changedContentMatches', 'toolRan', 'ranFailing', 'toolCount']);
const acted = w => !!w && typeof w === 'object' && (Object.keys(w).some(k => ACTION.has(k)) || (Array.isArray(w.anyOf) && w.anyOf.length > 0 && w.anyOf.every(acted)) || (Array.isArray(w.allOf) && w.allOf.some(acted)));
// The skills and runbooks a check makes mandatory on what the request says (a requirement with "forces" and a "hint"
// pattern, built-in or the project's own, minus the ones switched off), each once, with the words that set it off.
function forcedBy(p) {
  let j = {}; try { j = JSON.parse(fs.readFileSync(at('tools/hooks/requirements.json'), 'utf8')); } catch { }
  const file = Array.isArray(j.requirements) ? j.requirements : [], off = new Set([...file.map(r => r && r.tag), ...(j.disabled || []).map(d => d && d.tag)]);
  const out = new Map(), text = unquoted(p), cfg = projectConfig();
  for (const q of [...BASE_REQUIREMENTS.filter(b => !off.has(b.tag)), ...file]) {
    if (!q || q.enabled === false || !q.forces || !q.hint || out.has(q.forces) || checkOff(q.tag)) continue;
    let hit = null; try { hit = new RegExp(q.hint, 'i').exec(text); } catch { }
    if (!hit) continue;
    const f = has(`${cfg.skillsDir || 'skills'}/${q.forces}/SKILL.md`) ? `${cfg.skillsDir || 'skills'}/${q.forces}/SKILL.md` : `docs/playbooks/${q.forces}.md`;
    if (has(f)) out.set(q.forces, { name: q.forces, file: f, word: hit[0].trim(), acted: acted(q.when) });
  }
  return [...out.values()];
}
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
  // (REQ: friction-reported, tools/hooks/v2/friction.mjs: a check the user's complaints keep naming is offered to them to
  // turn off, once; nothing is turned off silently)
  const friction = relayedRx.test(raw) ? '' : frictionHint(ROOT);
  const praise = !sore && !relayedRx.test(raw) && isPraise(userWords(prompt), projectConfig()) ? 'Praise: the user liked something. If it should repeat, write what exactly worked into the runbook or skill it came from (a "What works" line); "keep doing this" is a standing rule (project-rule).' : '';
  // REQ: answer-traced (at the request, a hint only). A request about numbers is told up front where its figures must
  // come from; the end check judges the figures the answer states, whatever was asked. Oversight decision 2026-11-10.
  const figures = !relayedRx.test(raw) && NUMBERS_ASK.test(String(userWords(prompt))) ? 'Figures: every figure in the answer comes from something read or run this turn; mark any other "(estimate)" or "(not verified)".' : '';
  // REQ: autonomy-recorded (at the request, a hint only). The user handing the work over ("without my input", "no me
  // preguntes") is told to record it and decide from then on, as the old engine. Lesson (the old suite under v2): v2 said
  // nothing, and the agent kept asking
  const autonomy = !relayedRx.test(raw) && projectConfig().autonomy !== 'auto' && AUTONOMY_WORDS.test(String(userWords(prompt)))
    ? `Autonomy: the user wants the work done without their input. Set "autonomy": "auto" in tools/hooks/config.json and record it in docs/DECISIONS.md (date, the choice, why), then decide instead of asking and record each choice as "Assumed: <choice> - <why> - <cost if wrong>". Outward actions, third-party installs and anything irreversible still need an OK.` : '';
  // REQ: event-hint (at the request, a hint only). A check that makes a skill or runbook mandatory when something happens
  // (a trigger with "forces", like sign-in or payment code and the security review) says so as soon as the request shows
  // it is coming, so the work follows it from the start, as the old engine. Not for a request that only asks, nor a
  // relayed one, nor for words inside quotes. Lesson (the old suite under v2): v2 named it only at the end
  // REQ: scope-general (at the request). Items named as cases of a wider point ("or something else", "there might be
  // others") are told the work covers every case, as the old engine; the end check holds a work turn to a Scope line.
  // Not beside the upset line, which leads to the same. Lesson (the old suite under v2): v2 said nothing
  const examples = !sore && !relayedRx.test(raw) && EXAMPLE_CLASS.test(unquoted(String(userWords(prompt))))
    ? 'Examples: the items named are cases of a wider point. Change every case, not only the ones named, and say which in a line "Scope: <the point in general terms> - <every case it covers, and how many you checked>".' : '';
  // REQ: shared-steps (at the request, rule 8). A request with several tasks (3+ list items, or 2+ "and also") is told to
  // do the steps they share once, as the old engine (multiPart, shared in near.mjs). Lesson (the old suite under v2): v2
  // said nothing, and shared reads, builds and test runs were done once per task
  const shared = !relayedRx.test(raw) && multiPart(String(userWords(prompt)))
    ? 'Shared steps: this request has several tasks. List each one\'s steps, merge the ones they share (the same read, build, test run or helper, or a task another one already does), and do each once, in one order. Repeat a step only where the user asked for it.' : '';
  const must = relayedRx.test(raw) || asksOnly(String(userWords(prompt)), projectConfig().changeWords) ? [] : forcedBy(String(userWords(prompt)));
  const mustLines = must.filter(m => m.name !== book?.name).map(m => m.acted ? `Must follow: ${m.name} (the request mentions "${m.word.slice(0, 40)}"): open ${m.file} now and follow it from the start; the end check holds it once the work does what it covers.`
    : `Likely fits: ${m.name} (the request mentions "${m.word.slice(0, 40)}"): open ${m.file} if the work turns out to need it.`);
  // (menu codes, several at once too, each said in full, and an unknown one asked about, as the old engine did; never in
  // a relayed message, where a code is the other session's text. Lesson (the old suite under v2): only the first code
  // routed, and an unknown one was guessed at)
  const menuL = relayedRx.test(raw) ? [] : menuLines(expandMenuOf(String(userWords(prompt)), { root: ROOT }));
  // (REQ: recall-hint: a request much like an earlier finished one starts from how that was done, the shared
  // tools/hooks/history.mjs; never for a relayed message, which is no request of the user's)
  const recall = relayedRx.test(raw) ? '' : recallLine(at('tools/hooks/state/history.jsonl'), String(userWords(prompt)));
  if (recall) menuL.push(recall);
  const scope = relayedRx.test(raw) ? '' : scopeLine(userWords(prompt));
  if (scope) menuL.push(scope);
  if (!book) { const al = isTaskRequest(prompt, taskVerbs, toOtherSession(prompt)) ? alsoChecked(sk && skill ? [sk.name] : [], { unrouted: !(sk && skill) }) : '';
    return { book: null, text: [...menuL, ...mustLines, friction, skill, praise, figures, autonomy, examples, shared, pick, es, ...rulesFor(prompt).map(r => `The project's own rule here: ${r}`), al, smallLine(al)].filter(Boolean).slice(0, MAX_LINES).join('\n') }; }
  const own = rulesFor(prompt).map(r => `The project's own rule here: ${r}`);
  // (a message relayed from another session may only report: its runbook is for when it asks for work. Lesson (project
  // report): a note that a fix had landed got the bugfix runbook and its list, though it asked for nothing)
  // (said in the runbook line itself: a line of its own was most of the reminders' growth on peer messages)
  // (a turn likely to write a lesson down, upset or a rule, lesson or runbook request, is told to write it in general
  // terms, in the runbook line itself: no extra line, and nothing on other turns. The end check catches a slip
  // (quoteGaps). On only with the quote check, quoteCheckOn)
  const lesson = quoteOn && (sore || ['project', 'learn-from-upset', 'runbook-create', 'project-rule'].includes(book.name)) ? ' Write any lesson in general terms, not in the user\'s own words.' : '';
  // (REQ: rule-request: a standing rule routed to the project runbook hears, in the same line, the skill that records it
  // and to test only its new check, as the old engine's hint said. Not on a complaint (the upset line leads there), nor
  // in a relayed message. Lesson (the old suite under v2): the hint was gone, and agents ran the whole self-test for one
  // new check)
  const ruleNote = book.name === 'project' && !sore && !relayedRx.test(raw) && (book.matched === 'standing rule' || /\b(from now on|going forward|from here on|make (it|this|that) a rule|new rule|always|never|remember to|de ahora en adelante|a partir de ahora|desde ahora|siempre|nunca)\b/i.test(String(userWords(prompt))))
    ? ' RULE REQUEST: record it with the project-rule skill, and run the new check\'s own scenarios (node tools/hooks/selfcheck.mjs --tags <tag>, not the whole self-test).' : '';
  const lines = [...menuL, ...(sore ? [sore] : []), ...(friction ? [friction] : []), ...mustLines, ...(es ? [es] : []), ...(praise ? [praise] : []), ...(figures ? [figures] : []), ...(autonomy ? [autonomy] : []), ...(examples ? [examples] : []), ...(shared ? [shared] : []), ...own, `Runbook${relayedRx.test(raw) ? ', only if this message asks for work here' : ''}: open ${book.file} and follow it.${lesson}${ruleNote}`];
  if (book.items.length) {
    // (and how to hold the answer until it passes, in the same line. Lesson (the user, 2026-11-07): an answer sent back
    // by the end check reached the user twice; the first version must already be the final one)
    lines.push('Done when (before answering, check your draft: node tools/hooks/hooks.mjs check --answer-file <draft>):');
    for (const it of book.items) lines.push(`${it.n}. ${it.text.length > 140 ? it.text.slice(0, it.text.lastIndexOf(' ', 137)) + '...' : it.text}`);
  }
  // (what the end check also asks if files change: only when it fits under the cap, so it never pushes an item out)
  const also = alsoChecked([book.name]);
  // (when it has no line of its own left, it goes at the end of the last line: the cap holds, and the agent still hears
  // what will be checked. Lesson (the check-preview guard under v2): a long runbook list pushed it out, and round 1 then
  // held the project's own check on the runbook being fixed, unannounced)
  if (also && lines.length < MAX_LINES) lines.push(also);
  // (more items than fit: the runbook has the rest)
  const out = lines.length > MAX_LINES ? [...lines.slice(0, MAX_LINES - 1), `(${lines.length - MAX_LINES + 1} more in ${book.file})`] : lines;
  if (also && !out.includes(also)) out[out.length - 1] += ` ${also}`;
  const sm = smallLine(also);
  if (sm) { if (out.length < MAX_LINES) out.push(sm); else out[out.length - 1] += ` ${sm}`; }
  const text = out.join('\n');
  return { book, text };
}

export function onPrompt(data) {
  // (a host notice, like a background job ending, is not a request: the turn keeps its runbook and gets no reminder.
  // Lesson (live): a job's notice mid-turn cleared the routed runbook, and the end check held the turn to another one)
  // (so is a helper's report back: the words of its report route nowhere. Lesson (live): a review helper's report
  // routed to the project runbook, and the end check asked for its rule-request items)
  if (/^\s*(<(task-notification|system-reminder)\b|\[SYSTEM NOTIFICATION)/i.test(String(data.prompt || '')) || /<agent-message\b[^>]*>\s*\[Subagent hand-back\]/.test(String(data.prompt || ''))) return null;
  // (so is the summary that resumes a session after its context ran out: the work goes on under the turn it continues,
  // and the words it recaps route nowhere. Lesson (the old suite under v2): a resumed summary got a fresh reminder)
  if (/^\s*This session is being continued from a previous conversation\b/i.test(String(data.prompt || ''))) return null;
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
  // (the session's transcript is kept with the turn, so the self-check run from the agent's shell can read it: REQ
  // check-preview, hooks.mjs v2Cli)
  const tx = data.transcript_path ? { transcript: String(data.transcript_path) } : {};
  if (prev.at && !prev.ended && Date.now() - Date.parse(prev.at) < 12 * 3600_000) saveTurn(data.session_id, { ...prev, runbook: prev.runbook || book?.file || null, ...(also ? { also } : {}), ...sore, ...tx });
  // (a new turn notes its uncommitted files' contents in the background, so the end check can tell a file it only
  // touched from one it changed)
  // (and the plans open when it began: REQ plan-open, planreq.mjs)
  else { const at0 = new Date().toISOString(); let openPlans = [];
    try { openPlans = openPlansOf(fs.readdirSync(at('docs/plans')), p => { try { return fs.readFileSync(at(p), 'utf8'); } catch { return ''; } }).map(x => x.p); } catch { }
    saveTurn(data.session_id, { at: at0, runbook: book?.file || null, ...sore, ...tx, ...(openPlans.length ? { openPlans } : {}) }); snapshotLater(data.session_id, at0); }
  return text ? { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text } } : null;
}
