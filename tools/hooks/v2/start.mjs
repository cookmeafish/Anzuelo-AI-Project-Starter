// Engine v2 start hook (UserPromptSubmit): the reminder. At most 10 plain lines: the runbook that fits and its
// "Done when" list, which the end hook checks. Nothing about the engine itself.
import fs from 'node:fs';
import path from 'node:path';
import { route, skillBooks, saveTurn, loadTurn, isSpanish, ROOT } from './lib.mjs';

export const MAX_LINES = 10;
// (an upset message: mostly capitals, or the usual frustration words. Lesson (routing sample): complaints used no
// trigger phrase, so they reached no runbook)
export const upset = p => { const s = String(p), letters = s.replace(/[^A-Za-z]/g, ''); return (letters.length >= 12 && letters.replace(/[^A-Z]/g, '').length / letters.length > 0.6)
  // (a complaint about what was done: "you made a new note without linking it". Lesson (trial v38): it got no notice)
  || /\byou (made|wrote|added|created|built|saved|left|put|did)\b[^.?!]{0,80}\bwithout\b/i.test(s)
  // (a repeated miss: "you keep making X", "why does it keep ...", "wrong again!!". Lesson (trial v41): a complaint with
  // "!!" got only the generic reminder)
  || /(?<!\b(?:can|could|would|will|should|to|please|and|if|let|make) )\b(you|u|it) keep(s)? (on )?\w+ing\b|\bwhy (do|does|did) (you|it) keep\b|\bagain\s*!!/i.test(s)
  // (what was let through, and "that should never happen again". Lesson (trial v42): "you let any user delete ...! that
  // should never happen again" got no notice and no runbook)
  || /\byou (let|allowed) (any|anyone|anybody|everyone|everybody|every|all|the|a|other|staff|users?)\b[^.?!]{0,80}!|\b(that|this|it) (should|must|can) never happen again\b/i.test(s)
  || /\b(wtf|ugh|again\?!|why (did|would) you|you (forgot|missed|ignored|broke)|i (already )?told you|not what i asked|frustrat\w*|annoy\w*|(you|u|you're|ur|youre) (are )?not (following|listening)|i don'?t think you (understand|get it)|(is )?still (broken|wrong))\b/i.test(s)
  // (the Spanish forms. Lesson (trial v37): "otra vez pusiste texto en inglés" got no upset notice under v2)
  || /(?<!\p{L})(otra vez|de nuevo) (pusiste|hiciste|olvidaste|dejaste|metiste|usaste|escribiste|rompiste)|(?<!\p{L})(te (lo )?dije|(se te )?olvid(aste|ó)|por qu[eé] (lo )?hiciste|no me (escuchas|haces caso)|sigue (roto|mal|fallando))(?!\p{L})/iu.test(s); };
const has = f => fs.existsSync(path.join(ROOT, f));
// (a word only mentioned ("the word ugh", a word in quotes) or on the user's ignore list, config "ignoreWords": {"upset":
// [...]}, is no complaint. Lesson (end-to-end run): a request to whitelist a word was itself read as upset)
const ignored = () => { try { return [].concat(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/hooks/config.json'), 'utf8')).ignoreWords?.upset || []).map(String).filter(Boolean); } catch { return []; } };
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
  let text = ''; try { text = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf8'); } catch { return []; }
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
const relayedRx = /^\s*Another Claude session sent a message|<cross-session-message\b/;
export function reminder(prompt) {
  const raw = String(prompt || '');
  // (pasted text is not the user's words: it never routes and is never upset. Lesson (the old engine): words inside a
  // pasted text set off the complaint handling)
  prompt = String(prompt || '').replace(/<pasted_content\b[^>]*>[\s\S]*?<\/pasted_content(?:\s[^>]*)?>|<pasted_content\b[^>]*\/>/gi, ' ');
  // (upset and a fitting runbook: both are named, so the fix still follows its runbook)
  const sore = upsetIn(prompt) && has('skills/learn-from-upset/SKILL.md') ? 'This sounds upset: open skills/learn-from-upset/SKILL.md and follow it.' : '';
  const book = route(prompt);
  // (a Spanish request: the whole answer in Spanish, labels too. Lesson (trial v37): a runbook item quoted an English
  // label, and it went into a Spanish answer twice, the second time in the reply to a complaint about English text)
  // (and the files the answer points them to. Lesson (trial v45): a Spanish answer sent the user to a spec and release
  // notes written in English)
  const es = isSpanish(prompt) ? 'The user writes in Spanish: write the whole answer in Spanish, including any label a runbook quotes in English, and any file you point them to.' : '';
  // (with no runbook routed, a skill whose own trigger phrase fits is named: the reminder only, the end check is
  // unchanged. Not beside a runbook, which names its own skills, and not on a one-word trigger. Lesson (replay of three
  // sources): beside a runbook it was mostly noise, like "compare" in a scheduled request, and every miss alone was one
  // word, like "note" or "redundant")
  // (and in the request's first sentence, where it says what it asks: everyday phrases like "find out" come up later in
  // long instructions. Lesson (a scheduled review request): "if it is idle, find out why" named the research skill)
  const sk = book ? null : route(String(prompt).trim().split(/(?<=[.?!])\s+|\n/)[0] || '', skillBooks());
  const skill = sk && /\s/.test(sk.matched || '') && !(sore && sk.name === 'learn-from-upset') ? `Skill: open ${sk.file} and follow it.` : '';
  if (sore && !book) return { book: null, text: [sore, skill, es].filter(Boolean).join('\n') };
  // (no trigger fits: the agent picks the runbook, and the end check holds the turn to the one it opened. Lesson
  // (routing sample): plain requests used no trigger phrase; growing trigger lists forever is the old engine's path)
  if (!book) return { book: null, text: [skill, has('DIRECTORY.md') ? 'If this is real work, pick the runbook in DIRECTORY.md that fits and open it.' : '', es, ...rulesFor(prompt).map(r => `The project's own rule here: ${r}`)].filter(Boolean).join('\n') };
  const own = rulesFor(prompt).map(r => `The project's own rule here: ${r}`);
  // (a message relayed from another session may only report: its runbook is for when it asks for work. Lesson (project
  // report): a note that a fix had landed got the bugfix runbook and its list, though it asked for nothing)
  // (said in the runbook line itself: a line of its own was most of the reminders' growth on peer messages)
  const lines = [...(sore ? [sore] : []), ...(es ? [es] : []), ...own, `Runbook${relayedRx.test(raw) ? ', only if this message asks for work here' : ''}: open ${book.file} and follow it.`];
  if (book.items.length) {
    lines.push('Done when:');
    for (const it of book.items) lines.push(`${it.n}. ${it.text.length > 140 ? it.text.slice(0, it.text.lastIndexOf(' ', 137)) + '...' : it.text}`);
  }
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
  const { book, text } = reminder(data.prompt || '');
  // (a message that arrives while a turn runs joins that turn: it gets its reminder, and the turn keeps its start and
  // its runbook. A turn ends when its Stop passes; one left open over 12 hours, as after a crash, does not hold.
  // Lesson (live): a mid-turn message moved the turn's start, and the end check lost the work done before it)
  const prev = loadTurn(data.session_id);
  if (prev.at && !prev.ended && Date.now() - Date.parse(prev.at) < 12 * 3600_000) saveTurn(data.session_id, { ...prev, runbook: prev.runbook || book?.file || null });
  else saveTurn(data.session_id, { at: new Date().toISOString(), runbook: book?.file || null });
  return text ? { hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: text } } : null;
}
