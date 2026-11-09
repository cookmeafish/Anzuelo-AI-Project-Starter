// The end check's side of a message typed mid-turn: which questions no later text of the agent's answered.
import { LATE } from './midturn.mjs';

// REQ: queued-messages (2026-10-17). A question the user typed mid-turn is part of the request: the turn is held until
// a later text of the agent's answers it (shares a quarter of its key words, at least one, or a yes/no opens the reply
// to a yes/no question). The final answer counts. Lesson (2026-11-08): v2 kept only the hint at the next tool call, and
// a question waited unanswered while a long run went on.
// (an instruction is not a question: "do this one", "do multiple checks" asks for work; "do you", "does it" asks.
// Replay of real sessions: imperatives opening with "do" were held as unanswered questions)
const ASK = /^\s*(?:what|why|how|which|who|where|when|should|is|are|was|were|can|could|would|will|has|have|any|tell me|show me|qu[eé]|por ?qu[eé]|c[oó]mo|cu[aá]l|d[oó]nde|cu[aá]ndo|es|est[aá])\b|^\s*(?:do|does|did)\s+(?:you|i|we|they|it|he|she|this|that|these|those|there|anyone)\b(?!\s+(?:one|for|and|now|first)\b)/i;
// (a reply may open with a short label first: "Short answer first: no". Replay: such answers were held)
const YES = /^[\s*_>#-]*(?:[\w ]{0,25}:\s*[*_]*)?(?:yes|no|yeah|yep|nope|not (?:really|quite|fully|yet)|s[ií]|understood|got it)\b/i;
// (an instruction with a check-in tag is not a question: "commit it all, okay?", "... understand?". Nor is one that
// opens with a request ("also make it a requirement ..."). Replay: 3 of 31 holds were such instructions)
const TAG = /[\s,.]*\b(?:ok(?:ay)?|understand|understood|got it|alright|all right|k)\s*[?？]+\s*$/i;
const ORDER = /^\s*(?:(?:also|and|so|now|please|then|ok(?:ay)?|like)[\s,]+)*(?:add|make|fix|commit|push|update|run|move|create|write|build|remove|change|rename|install|enable|apply|check|go|keep|use|put|stop|start|once you)\b/i;
const STOPW = new Set(['what', 'that', 'this', 'with', 'from', 'have', 'there', 'they', 'then', 'than', 'your', 'about', 'still', 'does', 'were', 'when', 'which', 'would', 'could', 'should', 'tell', 'show', 'need', 'needs', 'some', 'things', 'thing']);
const keys = s => [...new Set((s.toLowerCase().match(/[\p{L}\d]{4,}/gu) || []).filter(w => !STOPW.has(w)))];
// REQ: question-answered (as it arrives). A message that only asks, no work: a question mark at its end, or a question
// opener, and no instruction or change word ("can you add ..." asks for work). The reminder says to answer it first.
const INSTRUCTS = /(^|[.!?:\n]\s*)(please\s+)?(add|fix|make|update|upgrade|run|move|create|write|build|remove|change|rename|install|enable|implement|apply|check|go|analy[sz]e|review|test|organi[sz]e|verify|redo)\b/i;
export function asksOnly(p, changeWords = '') {
  const t = String(p || '').trim();
  if (!t || t.length >= 1500 || INSTRUCTS.test(t) || ORDER.test(t) || TAG.test(t)) return false;
  if (/(^|[.!?:\n]\s*)(please\s+)?do\b(?!\s+(you|i|we|they|it|he|she|this|that|these|those|there|anyone|anybody)\b)/i.test(t) && !/\?\s*$/.test(t)) return false;
  if (!(/[?？]\s*$/.test(t) || /^\s*any\b/i.test(t) || ASK.test(t))) return false;
  try { return !(changeWords && new RegExp(changeWords, 'i').test(t)); } catch { return true; }
}
export function unansweredLate(rows, final = '') {
  const qs = [], texts = [];
  rows.forEach((r, i) => {
    const c = r.message?.content, words = p => Array.isArray(p) ? p.filter(b => b?.type === 'text').map(b => b.text).join('\n') : String(p || '');
    const q = (r.type === 'attachment' && r.attachment?.type === 'queued_command' ? words(r.attachment.prompt) : r.type === 'user' && LATE.test(words(c)) ? words(c) : '')
      .replace(LATE, '').replace(/\n*This is how Claude Code surfaces[\s\S]*$/, '').trim();
    // ("keep X but cut Y, right?" asks for a check: it stays a question)
    const asks = s => (/[?？]\s*$/.test(s) && !TAG.test(s) && (!ORDER.test(s) || /\bright\s*[?？]+\s*$/i.test(s))) || ASK.test(s);
    if (q && !q.startsWith('<') && q.length < 1500 && asks(q)) qs.push({ q, i, at: r.timestamp || '' });
    if (r.type === 'assistant' && Array.isArray(c)) for (const b of c) if (b?.type === 'text' && b.text.trim()) texts.push({ t: b.text, i });
  });
  if (final) texts.push({ t: final, i: rows.length });
  return qs.filter(({ q, i }) => {
    const later = texts.filter(t => t.i > i);
    // (a reply that opens with yes or no answers a question however it was worded: "I thought you would ...?" "Yes.")
    if (later.some(t => YES.test(t.t))) return false;
    const w = keys(q); if (!w.length) return !later.length;
    const need = Math.max(1, Math.round(w.length / 4));
    return !later.some(t => { const k = new Set(keys(t.t)); return w.filter(x => k.has(x)).length >= need; });
  }).map(({ q, at }) => ({ at, text: q }));
}
