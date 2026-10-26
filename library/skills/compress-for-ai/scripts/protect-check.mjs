#!/usr/bin/env node
// Protect check: proves that a shortened text kept every token that must never change, in any mode (AI-facing files,
// agent-to-agent notes, opted-in terse replies).
//   node skills/compress-for-ai/scripts/protect-check.mjs <before> <after>
//   node skills/compress-for-ai/scripts/protect-check.mjs --tokens <file>     list what it protects in one file
// Prints one line per token that changed or disappeared, then PROTECT: PASS or PROTECT: FAIL.
// Exit 0 = pass, 1 = fail, 2 = usage error. Zero dependencies; reads docs/names.json from the current folder if present.
// compress-guard.mjs imports protectDiff() from here, so both scripts use the same rules.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// ---------- split: frontmatter, code (fenced, indented, keep regions), prose ----------
const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;
export function split(text) {
  text = text.replace(/\r\n?/g, '\n');
  const fmM = /^---\n[\s\S]*?\n---\n/.exec(text);
  const fm = fmM ? fmM[0] : '';
  const lines = text.slice(fm.length).split('\n');
  const code = [], prose = [];
  let inList = false, prevBlank = true;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^\s{0,3}<!--\s*keep\s*-->\s*$/i.test(l)) {
      let j = i + 1; while (j < lines.length && !/^\s{0,3}<!--\s*\/keep\s*-->\s*$/i.test(lines[j])) j++;
      if (j < lines.length) { code.push(lines.slice(i, j + 1).join('\n')); prose.push('\u0000CODE'); i = j; prevBlank = false; continue; }
    }
    const f = FENCE.exec(l);
    if (f) {
      let j = i + 1;
      while (j < lines.length) { const c = FENCE.exec(lines[j]); if (c && c[2][0] === f[2][0] && c[2].length >= f[2].length && !c[3].trim()) break; j++; }
      if (j < lines.length) { code.push(lines.slice(i, j + 1).join('\n')); prose.push('\u0000CODE'); i = j; prevBlank = false; continue; }
    }
    if (!l.trim()) { prevBlank = true; prose.push(l); continue; }
    const indent = l.length - l.trimStart().length;
    if (/^\s*([-*+]|\d+[.)])\s/.test(l)) inList = true; else if (indent === 0) inList = false;
    if (!inList && prevBlank && /^( {4}|\t)/.test(l)) {
      let j = i; const run = [];
      while (j < lines.length && (/^( {4}|\t)/.test(lines[j]) || (!lines[j].trim() && j + 1 < lines.length && /^( {4}|\t)/.test(lines[j + 1])))) run.push(lines[j++]);
      code.push(run.join('\n')); prose.push('\u0000CODE'); i = j - 1; prevBlank = false; continue;
    }
    prevBlank = false; prose.push(l);
  }
  return { fm, code, prose: prose.join('\n').replace(/\u0000CODE/g, '') };
}

// ---------- what counts as protected ----------
const INLINE = /(?<!`)(`+)(?!`)([\s\S]+?)(?<!`)\1(?!`)/g;
const URL_RE = /\b(?:https?|ftp|file):\/\/[^\s)<>`"']+|\bwww\.[^\s)<>`"']+/g;
const UNITS = 'x|ms|s|sec|secs|seconds?|min|mins|minutes?|h|hrs?|hours?|days?|weeks?|months?|years?|b|bytes?|kb|mb|gb|tb|kib|mib|gib|px|em|rem|pt|k|m|tokens?|words?|chars?|characters?|lines?|files?|times|steps?|items?|runs?|tasks?|calls?|turns?|sessions?|usd|eur|gbp';
const NUM_RE = new RegExp(`(?<![\\w.$-])[$€£]?\\d(?:[\\d,]*\\d)?(?:\\.\\d+)?(?:%|\\s?(?:${UNITS})\\b)?`, 'gi');
const NEG = /\b(not|never|no|none|nothing|nobody|nowhere|neither|nor|without|cannot|can't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|won't|wouldn't|shouldn't|mustn't|haven't|hasn't)\b/gi;
const COND = /\b(only|unless|except|until)\b/gi;
const PROSE_SLASH = /^(and\/or|either\/or|yes\/no|on\/off|true\/false|read\/write|input\/output|pass\/fail|before\/after|he\/she|his\/her|s\/he|w\/o|n\/a)$/i;
const clean = s => s.replace(/[.,;:!?)\]'"]+$/, '');

function namesFile() {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs', 'names.json'), 'utf8'));
    return Object.entries(j).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string' && v.length > 1 && !/^\{\{.*\}\}$/.test(v)).map(([, v]) => v);
  } catch { return []; }
}
const NAMES = namesFile();
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function protectedTokens(text) {
  const s = split(text);
  const t = {};
  t['frontmatter keys'] = [...s.fm.matchAll(/^([\w-]+):/gm)].map(m => m[1]);
  t['inline code'] = [...s.prose.matchAll(INLINE)].map(m => m[2]);
  // markers are read from the raw prose (they may hold backticks or quotes)
  t.markers = [
    ...[...s.prose.matchAll(/<!--\s*name:([\w-]+)\s*-->([\s\S]*?)<!--\s*\/name\s*-->/g)].map(m => m[0]),
    ...[...s.prose.matchAll(/<!--[\s\S]*?-->/g)].map(m => m[0]).filter(m => !/^<!--\s*\/?name/.test(m)),
    ...[...s.prose.matchAll(/\b(?:Playbook|Skill|REQ):[ \t]*[\w.<>-]+|\bWorth it:/g)].map(m => m[0].replace(/\s+/g, ' ')),
    ...[...s.prose.matchAll(/N\/A\([\w-]+\)/g)].map(m => m[0]),
  ];
  let bare = s.prose.replace(INLINE, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  t.quotes = [...bare.matchAll(/"([^"\n]{1,200})"|“([^”\n]{1,200})”/g)].map(m => m[1] ?? m[2]);
  t['blockquote lines'] = [...bare.matchAll(/^\s*>\s?(.*\S.*)$/gm)].map(m => m[1].trim());
  t.URLs = [...bare.matchAll(URL_RE)].map(m => clean(m[0]));
  t['link targets'] = [...bare.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(m => m[1]);
  bare = bare.replace(URL_RE, ' ').replace(/\]\([^)]*\)/g, ']');
  t.headings = [...s.prose.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)].map(m => m[2]);
  const plain = bare.replace(/^\s*#{1,6}\s.*$/gm, ' ');
  // paths: drive, rooted, relative, home, folder/ with trailing slash, a/b/c, or anything ending in a file extension
  const paths = [];
  for (const m of plain.matchAll(/(?:[A-Za-z]:[\\/]|\\\\|~\/|\.{1,2}\/|(?<![\w.])\/(?=[\w.]))[^\s"'`<>|,;()]*|(?<![\w/.-])(?:[\w.@-]+[\\/])+[\w.@*-]*/g)) {
    const p = clean(m[0]);
    if (!p || PROSE_SLASH.test(p) || /^\/?$/.test(p)) continue;
    const parts = p.split(/[\\/]/).filter(Boolean);
    if (/^([A-Za-z]:|\\\\|~|\.{1,2}|\/)/.test(p) || /[\\/]$/.test(p) || parts.length > 2 || /\.[A-Za-z][\w]{0,9}$/.test(p)) paths.push(p);
  }
  for (const m of plain.matchAll(/(?<![\w/\\.-])[\w-]+(?:\.[\w-]+)*\.(?:[a-z][a-z0-9]{1,9}|[A-Z]{2,5})(?![\w/\\-])/g)) {
    if (/^(e\.g|i\.e|etc|vs|a\.m|p\.m)$/i.test(m[0]) || /^\d+(\.\d+)+$/.test(m[0])) continue;
    if (!paths.some(p => p.endsWith(m[0]))) paths.push(m[0]);
  }
  t['paths and file names'] = paths;
  const noPath = paths.reduce((x, p) => x.split(p).join(' '), plain);
  t['commands and flags'] = [
    ...[...noPath.matchAll(/(?<=^|\s)--?[A-Za-z][\w-]*(?:=\S+)?/g)].map(m => clean(m[0])).filter(f => !/^-(?:[a-z]{2,}|-)$/.test(f) || f.startsWith('--')),
    ...commands(plain),
  ];
  t.dates = [...noPath.matchAll(/\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?Z?)?\b|\b\d{1,2}:\d{2}\b/g)].map(m => m[0]);
  t.versions = [...noPath.matchAll(/(?<![\w.])v?\d+\.\d+(?:\.\d+)+(?:-[\w.]+)?\b|\bv\d+(?:\.\d+)?\b/g)].map(m => m[0]);
  const noDate = noPath.replace(/\b\d{4}-\d{2}-\d{2}\S*|\b\d{1,2}:\d{2}\b|(?<![\w.])v?\d+\.\d+(?:\.\d+)+\S*|\bv\d+\S*/g, ' ').replace(/^\s*\d+[.)]\s/gm, ' ');
  t['numbers and units'] = [...noDate.matchAll(NUM_RE)].map(m => m[0].replace(/\s+/g, '').toLowerCase());
  t.identifiers = [...noDate.matchAll(/(?<![\w$%-])(?:\$[A-Za-z_]\w*|%[A-Za-z_]\w*%|[A-Za-z_]\w*_\w+|[a-z]+[A-Z][A-Za-z0-9]*|[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*|[A-Za-z]+(?:-[A-Za-z0-9]+)*-\d[\w-]*|[A-Za-z_]\w*(?:\.[A-Za-z_]\w*)+\(?\)?)(?![\w-])/g)]
    .map(m => m[0]).filter(x => !/^(e\.g|i\.e)$/i.test(x) && !paths.includes(x));
  t['names (docs/names.json)'] = NAMES.flatMap(n => (s.prose.match(new RegExp(`(?<![\\w])${esc(n)}(?![\\w])`, 'g')) || []));
  // ordered-list numbering per list, and table shape
  const lists = []; let cur = null;
  for (const l of s.prose.split('\n')) {
    const m = /^(\s*)(\d+)[.)]\s/.exec(l);
    if (m) { if (!cur) lists.push(cur = []); cur.push(m[1].length + ':' + m[2]); }
    else if (l.trim() && !/^\s/.test(l)) cur = null; // blank lines and indented lines stay inside the list
  }
  t['list numbering'] = lists.map(x => x.join(','));
  const tables = []; let tb = null;
  for (const l of s.prose.split('\n')) { if (/^\s*\|.*\|\s*$/.test(l)) { if (!tb) tables.push(tb = []); tb.push(l.split('|').length - 2); } else tb = null; }
  t['table shape'] = tables.map(x => x.join(','));
  return { s, t, negs: negationsBySection(s.prose) };
}

// a command word plus its arguments: up to 3 words, stopping at punctuation. Kept only if it looks like a real command
// (a known subcommand, or an argument with a dot, slash, colon, at sign, equals sign or dash), so prose like "git history" is skipped.
const SUBCOMMANDS = /^(run|install|i|ci|test|exec|start|build|add|commit|push|pull|clone|checkout|switch|status|diff|log|fetch|merge|rebase|init|pr|issue|compose|up|down|apply|get)$/;
function commands(text) {
  const out = [];
  for (const m of text.matchAll(/\b(?:node|npm|npx|pnpm|yarn|git|gh|python3?|pip3?|curl|wget|pwsh|docker|kubectl|cargo|deno|bun)((?:[ \t]+[\w.:@/=$%~\\-]+){1,3})/g)) {
    const args = [];
    for (const a of m[1].trim().split(/[ \t]+/)) { args.push(a.replace(/[.,;:]+$/, '')); if (/[.,;:]$/.test(a)) break; }
    const special = a => /[./:@=\\-]/.test(a);
    // drop trailing plain words (likely prose), but keep a known subcommand in first place
    while (args.length && !special(args[args.length - 1]) && !(args.length === 1 && SUBCOMMANDS.test(args[0]))) args.pop();
    if (args.length) out.push(m[0].trim().split(/[ \t]/)[0] + ' ' + args.join(' '));
  }
  return out;
}

// negations and conditions per paragraph, grouped by heading (headings may not change, so sections line up)
function negationsBySection(prose) {
  const out = []; let sec = { title: '(top)', paras: [] };
  out.push(sec);
  const strip = x => x.replace(INLINE, ' ').replace(URL_RE, ' ');
  for (const para of prose.split(/\n\s*\n/)) {
    for (const block of para.split(/\n(?=#{1,6}\s)/)) {
      const h = /^(#{1,6})\s+(.+?)\s*#*\s*$/m.exec(block.split('\n')[0]);
      let body = block;
      if (h && block.startsWith(h[0])) { out.push(sec = { title: h[2], paras: [] }); body = block.slice(h[0].length); }
      if (!body.trim()) continue;
      const b = strip(body);
      sec.paras.push({ neg: (b.match(NEG) || []).length, cond: (b.match(COND) || []).length, text: body.trim().slice(0, 70) });
    }
  }
  return out;
}

const count = arr => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const STRICT_ADD = new Set(['URLs', 'link targets', 'markers', 'frontmatter keys']);

// Returns { problems: [...], notes: [...] }. A problem fails the check; a note is worth a look.
export function protectDiff(before, after) {
  const A = protectedTokens(before), B = protectedTokens(after);
  const problems = [], notes = [];
  if (A.s.fm !== B.s.fm) problems.push(`frontmatter: changed (it must stay byte for byte)`);
  if (A.s.code.length !== B.s.code.length) problems.push(`code blocks: ${A.s.code.length} before, ${B.s.code.length} after`);
  A.s.code.forEach((c, i) => { if (c !== B.s.code[i]) problems.push(`code block ${i + 1}: changed or moved (starts ${JSON.stringify(c.split('\n')[0].slice(0, 50))})`); });
  for (const cat of Object.keys(A.t)) {
    if (['headings', 'list numbering', 'table shape'].includes(cat)) {
      if (JSON.stringify(A.t[cat]) !== JSON.stringify(B.t[cat])) {
        const lost = A.t[cat].filter(x => !B.t[cat].includes(x));
        problems.push(`${cat}: changed (${lost.length ? 'lost ' + lost.slice(0, 5).map(x => JSON.stringify(x)).join(', ') : 'order or count'}; ${A.t[cat].length} before, ${B.t[cat].length} after)`);
      }
      continue;
    }
    const ca = count(A.t[cat]), cb = count(B.t[cat] || []);
    for (const [k, n] of ca) { const m = cb.get(k) || 0; if (m < n) problems.push(`${cat}: ${JSON.stringify(k)} ${m ? `appears ${m} time(s), was ${n}` : 'is gone'}`); }
    for (const [k, n] of cb) { if ((ca.get(k) || 0) < n) (STRICT_ADD.has(cat) ? problems : notes).push(`${cat}: ${JSON.stringify(k)} is new`); }
  }
  for (const secA of A.negs) {
    const secB = B.negs.find(x => x.title === secA.title);
    if (!secB) continue; // the heading check already failed
    const sum = (p, k) => p.reduce((n, x) => n + x[k], 0);
    for (const k of ['neg', 'cond']) {
      const word = k === 'neg' ? 'negations (not, never, no...)' : 'conditions (only, unless, except, until)';
      if (secA.paras.length === secB.paras.length) {
        secA.paras.forEach((p, i) => {
          const q = secB.paras[i];
          if (q[k] < p[k]) problems.push(`${word} in "${secA.title}", paragraph ${i + 1}: ${p[k]} before, ${q[k]} after ("${p.text}...")`);
          else if (q[k] > p[k]) notes.push(`${word} in "${secA.title}", paragraph ${i + 1}: ${p[k]} before, ${q[k]} after. A new "not" can invert a rule`);
        });
      } else if (sum(secB.paras, k) < sum(secA.paras, k)) problems.push(`${word} in "${secA.title}": ${sum(secA.paras, k)} before, ${sum(secB.paras, k)} after (paragraphs were merged, so compared per section)`);
      else if (sum(secB.paras, k) > sum(secA.paras, k)) notes.push(`${word} in "${secA.title}": ${sum(secA.paras, k)} before, ${sum(secB.paras, k)} after`);
    }
  }
  return { problems, notes };
}

// ---------- command line ----------
const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const [a, b] = process.argv.slice(2);
  if (a === '--tokens' && b && fs.existsSync(b)) { // show what the check protects in one file
    const { t, negs } = protectedTokens(fs.readFileSync(b, 'utf8'));
    for (const [k, v] of Object.entries(t)) if (v.length) console.log(`${k}: ${v.map(x => JSON.stringify(x)).join(', ')}`);
    for (const s of negs) console.log(`negations/conditions per paragraph in "${s.title}": ${s.paras.map(p => p.neg + '/' + p.cond).join(' ')}`);
    process.exit(0);
  }
  if (!a || !b || !fs.existsSync(a) || !fs.existsSync(b)) {
    console.error('usage: node skills/compress-for-ai/scripts/protect-check.mjs <before file> <after file>');
    process.exit(2);
  }
  const { problems, notes } = protectDiff(fs.readFileSync(a, 'utf8'), fs.readFileSync(b, 'utf8'));
  for (const p of problems) console.log(`CHANGED ${p}`);
  for (const n of notes) console.log(`NOTE    ${n}`);
  console.log(problems.length ? `PROTECT: FAIL (${problems.length} protected token(s) changed or gone)` : `PROTECT: PASS${notes.length ? ` (${notes.length} note(s) to read)` : ''}`);
  process.exit(problems.length ? 1 : 0);
}
