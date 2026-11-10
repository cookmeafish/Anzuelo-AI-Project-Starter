// REQ: praise-captured (the detector), shared by both engines. Moved here from hooks.mjs unchanged; the config comes in
// as cfg (the engine's merged config: "praise" and "ignoreWords").
// ---------- the user's whitelist (REQ: trigger-words) ----------
// Words that set nothing off by themselves for this user, per kind (config "ignoreWords": {"upset": [...], "praise":
// [...], "rule": [...]}), kept in tools/hooks/config.json so upgrades keep them. Capitals and every other trigger word
// in the same message still count. The engine never adds trigger words on its own: the built-in ones were checked
// against a real user's messages. Lesson (the user): "have a way to whitelist words ... make whitelisting easy peasy and
// actually work and respected"; on learning new words: "im almost thinking of scrapping the trigger word thing because
// it might catch things that aren't issues" (no learning).
export const WORD_KINDS = ['upset', 'praise', 'rule'];
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const wordsRe = (list, flags = 'iu') => list.length ? new RegExp(list.map(w => `(?<![\\p{L}\\p{N}])${esc(w)}(?![\\p{L}\\p{N}])`).join('|'), flags) : null;
export const ignoredWords = (kind, cfg = {}) => [].concat(cfg.ignoreWords?.[kind] || []).map(String).filter(Boolean);
export function withoutIgnored(text, kind, cfg = {}) { const r = wordsRe(ignoredWords(kind, cfg), 'giu'); return r ? String(text).replace(r, ' ') : String(text); }
// Praise is a statement. The same words in a question ("is it doing a good job?", "¿lo está haciendo bien?") or after
// "if"/"whether" ask for a verdict. Lesson: PRAISE fired on "is it doing a good job or a bad job?".
export function isPraise(p, cfg = {}) {
  if (!cfg.praise) return false;
  for (const c of String(p || '').split(/(?<=[.!?\n])/)) {
    const s = c.trim();
    if (!s || /\?\s*$/.test(s) || /^¿/.test(s) || /^(is|are|was|were|do|does|did|has|have|had|can|could|would|will|should|how|what|why|which|whether|am i|was it)\b/i.test(s)) continue;
    // (the user's whitelisted words don't count: REQ trigger-words)
    const t = withoutIgnored(s, 'praise', cfg), m = new RegExp(cfg.praise, 'i').exec(t);
    // (a praise word on a thing ("an amazing recipe") or a goal ("until it is amazing", "make it perfect") praises no
    // work. Lesson (two projects' trigger logs): both read as praise and asked for a rule to keep)
    if (m && /^(amazing|awesome|perfect)$/i.test(m[0]) && (/^\s+(?!(job|work|stuff|now|too|and|so|as|btw|thanks|thank|man|dude|lol)\b)[a-z]/i.test(t.slice(m.index + m[0].length))
      || /\b(until|till|so (that|it)|make (it|them|this|that|everything)|to be|should be|must be|needs? to be|want (it|them|this)|believe|hope|wish|could be|would be|will be)\b/i.test(t.slice(0, m.index)))) continue;
    if (m && !/\b(if|whether|unless|si)\b/i.test(t.slice(0, m.index))) return true;
  }
  return false;
}
