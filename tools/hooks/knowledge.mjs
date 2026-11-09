// The knowledge pack's source condition ("knowledgeFromFiles"), for both engines: the facts a turn wrote into the
// knowledge files come from the project's own files, each one labeled. A line with an evidence label (or a row of a
// table with a label column) carries the label, a date and a source that is a file or folder of this project that
// exists. A web link means research (sources read and cited), so it never counts here.
// Returns the reason it does not hold, or '' when it does.
// Lesson: setup labeled each style-sheet fact "observed" with the chapter file and the date, and the check still held
// the turn for two Stop rounds until the knowledge-capture skill was invoked as a ritual.
// x: { changed: paths changed this turn, uses: the turn's tool calls (or none), toolsKnown }; cfg: { evidenceLabels,
// knowledgeDirs }; io: { read(rel), exists(rel), match(rel, globs), rel(abs) }
const SRC_EXT = /^[\w.@-]+\.(md|txt|csv|tsv|json|ya?ml|pdf|docx?|xlsx?|pptx?|py|js|mjs|ts|go|rs|java|cs|html?|toml|ini|log|png|jpe?g|gif|svg)$/i;
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function knowledgeFromFiles(x, cfg, io) {
  const files = (x.changed || []).filter(p => /\.md$/i.test(p) && io.match(p, (cfg.knowledgeDirs || []).map(d => `${d.replace(/\/+$/, '')}/**`)) && !/(^|\/)(README|SOURCES|INDEX)\.md$/i.test(p) && io.exists(p));
  if (!files.length) return 'no knowledge file changed';
  const edits = new Map();
  if (x.toolsKnown) for (const u of x.uses || []) {
    if (!/^(Write|Edit|MultiEdit)$/.test(u.name)) continue;
    const f = io.rel(u.input.file_path || '');
    edits.set(f, `${edits.get(f) || ''}\n${[u.input.content, u.input.new_string, ...(u.input.edits || []).map(e => e.new_string)].filter(v => typeof v === 'string').join('\n')}`);
  }
  const labelRe = new RegExp(`(?<![\\w-])(${(cfg.evidenceLabels || []).map(esc).join('|')})(?![\\w-])`, 'i');
  const cells = l => l.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
  const sourceOk = s => {
    const toks = String(s).replace(/[`*[\]()<>]/g, ' ').split(/[\s,;]+/).map(t => t.replace(/[.:]+$/, '')).filter(t => t && !/^20\d\d-\d\d-\d\d$/.test(t) && (t.includes('/') || SRC_EXT.test(t)));
    return toks.length > 0 && toks.every(t => !/^https?:/i.test(t) && !t.startsWith('..') && io.exists(t.replace(/^\.\//, '').replace(/\/+$/, '')));
  };
  let judged = 0;
  for (const f of files) {
    const full = io.read(f), added = edits.has(f) ? edits.get(f) : full;
    if (/https?:\/\//i.test(added)) return `${f}: a web link was added (that is research: sources read and cited this turn)`;
    // the label, source and date columns of every table in the file whose header names a label column
    const rows = new Map(), lines = full.split(/\r?\n/);
    for (let i = 0; i + 1 < lines.length; i++) {
      if (!/^\s*\|/.test(lines[i]) || !/^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) continue;
      const h = cells(lines[i]).map(s => s.toLowerCase()), li = h.findIndex(s => /label|evidence/.test(s));
      if (li < 0) continue;
      const si = h.findIndex(s => /source/.test(s));
      for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j++) rows.set(lines[j].trim(), { li, si });
    }
    for (const l of added.split(/\r?\n/).map(s => s.trim()).filter(Boolean)) {
      const row = rows.get(l);
      if (!row && !labelRe.test(l)) continue;
      judged++;
      const c = row ? cells(l) : null;
      if (!(row ? labelRe.test(c[row.li] || '') : true)) return `${f}: "${l.slice(0, 60)}" has no evidence label`;
      if (!/\b20\d\d-\d\d-\d\d\b/.test(l)) return `${f}: "${l.slice(0, 60)}" has no date`;
      if (!sourceOk(row && row.si >= 0 ? c[row.si] : l)) return `${f}: "${l.slice(0, 60)}" names no source file of this project that exists`;
    }
  }
  return judged ? '' : 'no labeled fact was written';
}
