// REQ: answer-resent (corrections), shared by both engines (moved from hooks.mjs unchanged).
// 'Corrected: "<old>" -> "<new>"', one per line ("Corregido:" too; straight or curly quotes, -> or →), as the whole last
// message: the corrections, or null.
export function correctionsOf(text) {
  const s = String(text || '').trim();
  if (s.length > 2000 || !/^\W{0,4}(corrected|correction|corregido|correcci[oó]n)\s*:/i.test(s)) return null;
  // (one per line, read from the arrow out, so quotes inside the quoted text stay part of it. Lesson (a field report):
  // a fixed quote that held quotes parsed as no correction, the line was checked as the answer, and the em dash in
  // its old text blocked the turn again)
  const out = s.split(/\r?\n/).map(l => /["“](.+?)["”]\s*(?:->|→)\s*["“](.*)["”]\W{0,2}$/.exec(l.trim())).filter(Boolean).map(m => ({ old: m[1], new: m[2] }));
  return out.length ? out : null;
}
// The earlier full answer with a note's corrections applied and the rest of the note added after it, or null when a
// correction quotes text the earlier answer does not hold word for word (the old engine then asks for the whole answer).
export function withNote(prev, note) {
  const lines = String(note || '').split(/\r?\n/), whole = correctionsOf(note);
  const fixes = whole || lines.flatMap(l => correctionsOf(l) || []);
  if (fixes.some(f => !String(prev).includes(f.old))) return null;
  const rest = whole ? '' : lines.filter(l => !correctionsOf(l)).join('\n').trim();
  return `${fixes.reduce((s, f) => s.replace(f.old, f.new), String(prev).trim())}${rest ? `\n\n${rest}` : ''}`;
}
