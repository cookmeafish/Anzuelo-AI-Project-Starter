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
// REQ: knowledge-labels. A knowledge file, as a whole, carries an evidence label, a source and a date, for both engines
// and the audit. Lesson: unlabeled guesses got reused as facts.
export function knowledgeProblems(file, text, labels = []) {
  const probs = [], low = String(text).toLowerCase();
  if (!labels.some(l => low.includes(l))) probs.push(`${file}: no evidence label (${labels.join(' / ')})`);
  if (!/https?:\/\/|\bsources?\b|\buser reported\b|\bsources\//i.test(text)) probs.push(`${file}: no source (a URL, a "Source:" line, sources/<file>, or "user reported")`);
  if (!/\b20\d\d-\d\d-\d\d\b/.test(text)) probs.push(`${file}: no date (YYYY-MM-DD) for when the facts were checked`);
  return probs;
}
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
// x: { answer, prompt, results, runs: [{ cmd, out, error }], toolsKnown }; io: { neverRan(run), cmdHead(cmd) }
// answerFiguresComputed: a "How it was computed" line is not enough; the figures must come from the computation.
// Each figure in the answer appears in what this turn's tools printed or read, or follows from the answer's other
// figures (their sum, difference, product, ratio, share or change in percent); the script the line names ran this
// turn; and a sum the answer works out ("315 + 125") gives the figure it stands for. Single digits, years and dates are
// left out. Returns the problems, [] when it holds.
// Lesson: an answer said week 40 without bowls made 315 (it made 440: 315 + 125, as its own "How it was computed" line
// listed), and that line pointed to a script that never printed the figure.
// (a number is "1,240" or "15.5"; the comma after "692, up" is the sentence's. Lesson (the v2 port): "692," read as no
// number, so a change worked out from it, "up 213", was named as coming from nowhere)
const FIG = /(?<![\w.])([$€£]?)(\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?)(\s?%)?(?![\w])/g;
const figNum = s => Number(String(s).replace(/[$€£%\s]/g, '').replace(/,(?=\d{3}\b)/g, ''));
export function figureProblems(x, io) {
  const out = [];
  const body = String(x.answer || '').replace(/^---\n[\s\S]*?\n---\n/, '').split(/^#{1,6}\s*\**(?:finished|terminado)\b|^\**(?:finished|terminado)\**\s*$/im)[0];
  const how = /^.*\b(how it was computed|c[oó]mo se calcul[oó])\s*:.*$/im.exec(body)?.[0] || '';
  // the script the line names ran this turn
  const script = /[\w.\\/-]*[\w-]\.(?:mjs|cjs|js|ts|py|r|sql|sh|ps1)\b/i.exec(how.replace(/`/g, ' '))?.[0];
  if (script && x.toolsKnown) {
    const base = script.replace(/\\/g, '/').split('/').pop().toLowerCase();
    if (!(x.runs || []).some(r => !io.neverRan(r) && io.cmdHead(r.cmd).replace(/\\/g, '/').toLowerCase().includes(base))) out.push(`the "How it was computed" line names ${script}, which did not run this turn`);
  }
  const clean = l => l.replace(/https?:\/\/\S+|`[^`]*`|\b[\w.-]+\/[\w./-]+|\b\d{4}-\d\d-\d\d\b|\b\d{1,2}[/:]\d{2}([/:]\d{2,4})?\b|\b[Ww]\d{1,2}\b|\[\d+\]/g, ' ').replace(/^\s*(\d+\.|-|\*)\s+/, '');
  // A figure followed by its worked arithmetic, "42.5 (calculated: (40 + 45) / 2)", is checked by doing the arithmetic;
  // a "(calculated: ...)" in words leaves its line to the reader.
  const calc = [];
  for (const l of body.split(/\r?\n/)) for (const m of l.matchAll(/(?<![\w.])([$€£]?\d[\d,]*(?:\.\d+)?)\s?%?(?:\s+[^\d\s()]+){0,4}\s*\((?:calculated|calculado)\s*:\s*([^()]*(?:\([^()]*\)[^()]*)*)\)/gi)) {
    const expr = m[2].replace(/(\d),(?=\d{3}\b)/g, '$1').replace(/×/g, '*').replace(/÷/g, '/');
    if (!/^[\d\s.+\-*/()]+$/.test(expr)) continue;
    let v; try { v = Function(`"use strict"; return (${expr});`)(); } catch { continue; }
    const want = figNum(m[1]), dec = (m[1].split('.')[1] || '').length;
    if (Number.isFinite(v) && Math.abs(v - want) > 0.5 * 10 ** -dec + 1e-9) out.push(`"${m[0].trim().slice(0, 60)}" does not add up (the arithmetic gives ${+v.toFixed(4)})`);
    calc.push(m[1]);
  }
  const lines = body.split(/\r?\n/).filter(l => !/\b(estimate|approx|not verified|my (guess|inference)|rounded|inferid[oa]|estimad[oa])\b/i.test(l) && l !== how
    && !(/\((calculated|calculado)\s*:/i.test(l) && !calc.some(c => l.includes(c))));
  const figs = [];
  for (const l of lines) for (const m of clean(l).matchAll(FIG)) {
    const n = figNum(m[0]);
    if (!Number.isFinite(n) || (!m[1] && !m[3] && Number.isInteger(n) && (n < 10 || (n >= 1900 && n <= 2099 && !m[2].includes(','))))) continue;
    figs.push({ s: m[0].trim(), n, pct: !!m[3], dec: (m[2].split('.')[1] || '').length });
  }
  // what the turn's tools printed or read, and the request itself
  const corpus = `${x.results || ''}\n${(x.runs || []).map(r => r.out || '').join('\n')}\n${x.prompt || ''}`.replace(/(\d),(?=\d{3}\b)/g, '$1');
  const inCorpus = f => new RegExp(`(?<![\\d.])${esc(String(f.n))}(?![\\d])`).test(corpus) || (f.dec && new RegExp(`(?<![\\d.])${esc(f.n.toFixed(f.dec))}(?![\\d])`).test(corpus));
  const close = (f, v) => Math.abs(f.n - v) <= (f.dec || f.pct ? 0.5 * 10 ** -f.dec + 1e-9 : (Number.isInteger(v) ? 0 : 0.5));
  // (worked out in two steps at most: "up 88 (154 to 242), 41% of the 213 gain" takes 88 from 242 - 154 first)
  let known = [...new Set(figs.filter(inCorpus).map(f => f.n))];
  const derived = f => known.some(a => known.some(b => a !== b && (close(f, a + b) || close(f, a - b) || close(f, a * b) || (b && (close(f, a / b) || (f.pct && (close(f, (a / b) * 100) || close(f, ((a - b) / b) * 100))))))));
  for (let i = 0; i < 2; i++) known = [...new Set([...known, ...figs.filter(f => !f.pct && !known.includes(f.n) && derived(f)).map(f => f.n)])];
  const bad = [...new Set(figs.filter(f => !inCorpus(f) && !derived(f) && !calc.some(c => figNum(c) === f.n)).map(f => f.s))];
  if (bad.length) out.push(`${bad.slice(0, 6).join(', ')} ${bad.length > 1 ? 'appear' : 'appears'} in no output of this turn and ${bad.length > 1 ? 'do' : 'does'} not follow from the answer's other figures`);
  // a sum the answer works out gives the figure it stands for: "a + b = c" adds up, and in a list of sums, the
  // sentence that gives most of their results gives them all
  // (a number is "1,240" or "15.5"; the comma after "150, 225" is the list's)
  const N = String.raw`\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?`;
  const sumsIn = t => [...t.matchAll(new RegExp(String.raw`(?<![\w.,])(${N})((?:\s*\+\s*(?:${N}))+)(\s*=\s*(${N}))?(?![\w])`, 'g'))]
    .map(m => ({ s: m[0].trim(), v: [m[1], ...m[2].split('+').slice(1)].reduce((a, b) => a + figNum(b), 0), eq: m[4] != null ? figNum(m[4]) : null }));
  const sents = body.split(/(?<=[.!?])\s+|\r?\n/);
  for (const s of sents) {
    const sums = sumsIn(s.replace(/`/g, ''));
    for (const q of sums) if (q.eq != null && Math.abs(q.eq - q.v) > 1e-6) out.push(`"${q.s}" does not add up (it makes ${+q.v.toFixed(4)})`);
    const open = sums.filter(q => q.eq == null);
    if (open.length < 2) continue;
    const has = (t, v) => new RegExp(`(?<![\\d.])${esc(String(+v.toFixed(4)))}(?![\\d])`).test(t.replace(/(\d),(?=\d{3}\b)/g, '$1'));
    const best = sents.filter(t => t !== s && !sumsIn(t).length).map(t => ({ t, k: open.filter(q => has(t, q.v)).length })).sort((a, b) => b.k - a.k)[0];
    if (best && best.k >= 2 && best.k * 2 >= open.length) for (const q of open.filter(q => !has(best.t, q.v)))
      out.push(`the answer works out ${q.s} = ${+q.v.toFixed(4)}, but the sentence with the other results ("${best.t.trim().slice(0, 90)}") does not give ${+q.v.toFixed(4)}`);
  }
  return out;
}
