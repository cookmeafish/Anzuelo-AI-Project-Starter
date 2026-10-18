#!/usr/bin/env node
// Guard rails for shortening AI-facing text files: decides which files may be compressed, keeps byte-exact backups
// in .cache/compress/, and proves afterwards that nothing load-bearing was lost.
//   node skills/compress-for-ai/scripts/compress-guard.mjs plan <file>...           which files may be compressed, and why not for the rest
//   node skills/compress-for-ai/scripts/compress-guard.mjs backup <file>...         copy each file to .cache/compress/<stamp>/ and verify the copy
//   node skills/compress-for-ai/scripts/compress-guard.mjs check <backup folder>    compare every backed-up file with its current version
//   node skills/compress-for-ai/scripts/compress-guard.mjs check <before> <after>   compare two files
//   node skills/compress-for-ai/scripts/compress-guard.mjs restore <backup folder> [file]   put the originals back
// Run from the project root. Exit 0 = pass, 1 = problems found, 2 = usage error. It never sends anything anywhere.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const BACKUPS = '.cache/compress';
const LARGE = 100 * 1024;
const [cmd, ...args] = process.argv.slice(2);
const rel = p => path.relative(ROOT, path.resolve(ROOT, p)).split(path.sep).join('/');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const usage = () => { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n')); process.exit(2); };

// ---------- which files may be compressed ----------
const globRe = g => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*\//g, '\u0001').replace(/\*\*/g, '\u0002')
  .replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0001/g, '(?:.*/)?').replace(/\u0002/g, '.*') + '$', 'i');
const matchAny = (p, globs) => globs.some(g => globRe(g).test(p));
function projectConfig() {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'hooks', 'config.json'), 'utf8')); } catch { return {}; }
}
const cfg = projectConfig();
const PROTECTED = ['sources/**', 'outputs/**', 'inbox/**', 'profiles/**', '**/LICENSE*', '**/COPYING*', '**/SOURCE.md', '.cache/**', 'node_modules/**', '.git/**',
  ...(cfg.protectedOriginals || []), ...(cfg.noOverwrite || [])];
const USER_FACING = ['README*', '**/README*', 'HOW-TO-USE.md', 'SETUP-PROMPT.md', 'docs/BRIEF.md', 'docs/STATUS.md', 'docs/CHANGELOG.md', 'docs/DECISIONS.md',
  'docs/MENU.md', 'docs/knowledge/**', 'docs/plans/**', 'docs/reviews/**', 'docs/releases/**', '**/CHANGELOG*', '**/*.html', '**/*.htm'];
const GENERATED = ['.claude/skills/**', '.codex/**', '.agents/**', 'DIRECTORY.md'];
const PROSE = /\.(md|mdc|markdown|txt|rst)$/i;
const SECRET = /(^|\/)(\.env(\..*)?|\.netrc|\.npmrc|\.pypirc|id_(rsa|dsa|ecdsa|ed25519)(\.pub)?|authorized_keys|known_hosts|[^/]*\.(pem|key|p12|pfx|jks|keystore|gpg|asc))$|(^|\/)\.(ssh|aws|gnupg|kube|docker)\/|secret|credential|passw(or)?d|api[-_]?key|access[-_]?key|private[-_]?key|token/i;

function classify(file) {
  const p = rel(file);
  if (p.startsWith('..')) return { ok: false, why: 'outside the project' };
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) return { ok: false, why: 'not a file' };
  if (SECRET.test(p)) return { ok: false, why: 'name looks like it holds secrets: never read it into a rewrite' };
  if (matchAny(p, PROTECTED)) return { ok: false, why: 'protected (originals, deliverables, licenses, credits or scratch): never changed' };
  if (/\.orig$/.test(p)) return { ok: false, why: 'a backup copy' };
  if (matchAny(p, GENERATED)) return { ok: false, why: 'generated: compress the file it is generated from' };
  if (!PROSE.test(p)) return { ok: false, why: 'not a prose file (code, config or data stays as it is)' };
  if (matchAny(p, USER_FACING)) return { ok: false, why: 'user-facing: keep it plain readable English (docs/checks/writing-standards.md)' };
  const raw = fs.readFileSync(p);
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(raw); } catch { return { ok: false, why: 'not valid UTF-8: a rewrite could destroy bytes' }; }
  if (!text.trim()) return { ok: false, why: 'empty' };
  if (/^---\r?\n[\s\S]*?^generated:\s*true\s*$[\s\S]*?^---/m.test(text.slice(0, 2000))) return { ok: false, why: 'generated (frontmatter says generated: true): compress its runbook instead' };
  const notes = [];
  if (raw.length > LARGE) notes.push(`large (${raw.length} bytes): compress one section at a time`);
  if (/^docs\/checks\//.test(p)) notes.push('tools read the tables here: leave table cells as they are');
  if (/(^|\/)(AGENTS|CLAUDE)\.md$/.test(p)) notes.push('twin file: compress only one of AGENTS.md / CLAUDE.md, the hooks copy it to the other');
  return { ok: true, why: notes.join('; ') || 'AI-facing prose' };
}

// ---------- what must survive ----------
const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/;
function split(text) {
  // returns { fm, code: [blocks in order], prose: text with code and keep regions removed }
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
      if (j < lines.length) { code.push(lines.slice(i, j + 1).join('\n')); i = j; prevBlank = false; continue; }
    }
    const f = FENCE.exec(l);
    if (f) {
      let j = i + 1;
      while (j < lines.length) { const c = FENCE.exec(lines[j]); if (c && c[2][0] === f[2][0] && c[2].length >= f[2].length && !c[3].trim()) break; j++; }
      if (j < lines.length) { code.push(lines.slice(i, j + 1).join('\n')); i = j; prevBlank = false; continue; }
    }
    if (!l.trim()) { prevBlank = true; prose.push(l); continue; }
    const indent = l.length - l.trimStart().length;
    if (/^\s*([-*+]|\d+[.)])\s/.test(l)) inList = true; else if (indent === 0) inList = false;
    if (!inList && prevBlank && /^( {4}|\t)/.test(l)) {
      let j = i; const run = [];
      while (j < lines.length && (/^( {4}|\t)/.test(lines[j]) || (!lines[j].trim() && j + 1 < lines.length && /^( {4}|\t)/.test(lines[j + 1])))) run.push(lines[j++]);
      code.push(run.join('\n')); i = j - 1; prevBlank = false; continue;
    }
    prevBlank = false; prose.push(l);
  }
  return { fm, code, prose: prose.join('\n') };
}
const count = arr => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
function lostAdded(a, b) {
  const A = count(a), B = count(b), lost = [], added = [];
  for (const [k, n] of A) if ((B.get(k) || 0) < n) lost.push(n - (B.get(k) || 0) > 1 ? `${k} (x${n - (B.get(k) || 0)})` : k);
  for (const [k, n] of B) if ((A.get(k) || 0) < n) added.push(k);
  return { lost, added };
}
const short = list => list.slice(0, 8).map(s => JSON.stringify(s.length > 60 ? s.slice(0, 60) + '...' : s)).join(', ') + (list.length > 8 ? `, and ${list.length - 8} more` : '');

function tokens(text) {
  const s = split(text);
  const inline = [...s.prose.matchAll(/(?<!`)(`+)(?!`)([\s\S]+?)(?<!`)\1(?!`)/g)].map(m => m[2]);
  const bare = s.prose.replace(/(?<!`)(`+)(?!`)([\s\S]+?)(?<!`)\1(?!`)/g, ' ');
  const urls = [...bare.matchAll(/https?:\/\/[^\s)<>`"']+/g)].map(m => m[0].replace(/[.,;:]+$/, ''));
  const links = [...bare.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(m => m[1]);
  const noUrl = bare.replace(/https?:\/\/[^\s)<>`"']+/g, ' ').replace(/\]\([^)]*\)/g, ']');
  const paths = [...noUrl.matchAll(/(?:\.{1,2}\/|[A-Za-z]:\\|~\/)[\w.\\/-]+|(?:[\w.-]+\/)+[\w-]+\.[A-Za-z0-9]{1,8}\b/g)].map(m => m[0].replace(/[.,;:]+$/, ''));
  const headings = [...s.prose.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)].map(m => ({ level: m[1].length, text: m[2] }));
  const plainProse = noUrl.replace(/^\s*\d+[.)]\s/gm, ' ').replace(/^#{1,6}\s/gm, ' ');
  const numbers = [...plainProse.matchAll(/(?<![\w.])\d[\d.,:/-]*\d%?|(?<![\w.])\d%?(?![\w])/g)].map(m => m[0]);
  const tags = [...text.matchAll(/\bREQ:\s*[\w-]+|N\/A\([\w-]+\)/g)].map(m => m[0].replace(/\s+/g, ' '));
  const boxes = (s.prose.match(/^\s*[-*+]\s+\[[ xX]\]/gm) || []).length;
  const bullets = (s.prose.match(/^\s*([-*+]|\d+[.)])\s/gm) || []).length;
  const negations = (noUrl.match(/\b(not|never|no|none|nothing|nobody|without|only|except|unless|cannot|can't|don't|doesn't|isn't|aren't|won't|shouldn't|mustn't|didn't)\b/gi) || []).length;
  const tables = []; let cur = null;
  for (const l of s.prose.split('\n')) {
    if (/^\s*\|.*\|\s*$/.test(l)) { if (!cur) tables.push(cur = []); cur.push(l.split('|').length - 2); } else cur = null;
  }
  const words = (text.match(/\S+/g) || []).length;
  return { s, inline, urls, links, paths, headings, numbers, tags, boxes, bullets, negations, tables, words };
}

function compare(beforeRaw, afterRaw, label) {
  const errors = [], warnings = [];
  let after;
  try { after = new TextDecoder('utf-8', { fatal: true }).decode(afterRaw); } catch { return { errors: [`${label}: the new version is not valid UTF-8`], warnings, sizes: null }; }
  const before = beforeRaw.toString('utf8');
  const A = tokens(before), B = tokens(after);
  if (A.s.fm !== B.s.fm) errors.push('frontmatter changed (name, description, triggers and other keys must stay byte for byte)');
  if (A.s.code.length !== B.s.code.length || A.s.code.some((c, i) => c !== B.s.code[i]))
    errors.push(`code blocks or <!-- keep --> regions changed, moved or were removed (${A.s.code.length} before, ${B.s.code.length} after)`);
  const diff = (name, a, b, addedIsError = false) => {
    const { lost, added } = lostAdded(a, b);
    if (lost.length) errors.push(`${name} lost: ${short(lost)}`);
    if (added.length) (addedIsError ? errors : warnings).push(`${name} added: ${short(added)}`);
  };
  diff('inline code', A.inline, B.inline);
  diff('URLs', A.urls, B.urls, true);
  diff('link targets', A.links, B.links, true);
  diff('paths', A.paths, B.paths);
  diff('numbers', A.numbers, B.numbers);
  diff('REQ tags and waivers', A.tags, B.tags, true);
  const ht = h => h.map(x => x.text);
  if (JSON.stringify(ht(A.headings)) !== JSON.stringify(ht(B.headings))) {
    const { lost, added } = lostAdded(ht(A.headings), ht(B.headings));
    errors.push(`headings changed (text, count or order; links to them would break). lost: ${short(lost) || 'none'}; added: ${short(added) || 'none'}`);
  } else if (A.headings.some((h, i) => h.level !== B.headings[i].level)) warnings.push('heading levels changed');
  if (A.boxes !== B.boxes) errors.push(`checklist items changed: ${A.boxes} before, ${B.boxes} after (each "Done when" item stays)`);
  if (JSON.stringify(A.tables) !== JSON.stringify(B.tables)) errors.push(`table shape changed (rows per table and cells per row): ${JSON.stringify(A.tables)} before, ${JSON.stringify(B.tables)} after`);
  if (A.bullets && Math.abs(A.bullets - B.bullets) / A.bullets > 0.15) warnings.push(`list items: ${A.bullets} before, ${B.bullets} after (merged or dropped items: check none carried a separate fact)`);
  if (B.negations < A.negations) warnings.push(`negations (not, never, no, only, except...): ${A.negations} before, ${B.negations} after. Check every rule still forbids what it forbade`);
  const em = t => (t.match(/—/g) || []).length;
  if (em(after) > em(before)) errors.push('em dashes added (writing standards)');
  const leak = /\b(here is the (compressed|shortened|rewritten)|i (have )?(compressed|shortened|rewrote)|compressed version|as an ai\b)/i;
  if (leak.test(after) && !leak.test(before)) errors.push('commentary about the rewrite leaked into the file');
  const firstLine = t => (t.split(/\r?\n/).find(l => l.trim()) || '').trim();
  if (/^(`{3,}|~{3,})/.test(firstLine(after)) && !/^(`{3,}|~{3,})/.test(firstLine(before))) errors.push('the whole file was wrapped in a code fence');
  const crlf = t => (t.match(/\r\n/g) || []).length * 2 > (t.match(/\n/g) || []).length;
  if (crlf(before) !== crlf(after)) warnings.push('line endings changed (CRLF vs LF)');
  const sizes = { before: beforeRaw.length, after: afterRaw.length, wordsBefore: A.words, wordsAfter: B.words };
  const bodyLen = (t, fm) => t.replace(/\r\n?/g, '\n').slice(fm.length).trim().length;
  if (bodyLen(after, B.s.fm) >= bodyLen(before, A.s.fm)) errors.push(`not shorter: ${sizes.before} bytes before, ${sizes.after} after`);
  return { errors, warnings, sizes };
}

// ---------- commands ----------
function report(results) {
  let bad = 0, b = 0, a = 0;
  for (const r of results) {
    const s = r.sizes;
    if (s) { b += s.before; a += s.after; }
    const sz = s ? `  ${s.before} -> ${s.after} bytes, ${s.wordsBefore} -> ${s.wordsAfter} words` : '';
    console.log(`${r.errors.length ? 'FAIL' : 'ok  '} ${r.file}${sz}`);
    for (const e of r.errors) console.log(`  ERROR ${e}`);
    for (const w of r.warnings) console.log(`  WARN  ${w}`);
    if (r.errors.length) bad++;
  }
  const pct = b ? Math.round(100 * (b - a) / b) : 0;
  console.log(`COMPRESS CHECK: ${bad ? 'FAIL' : 'PASS'} (${results.length} file(s), ${b} -> ${a} bytes, ${pct}% smaller by size; token savings are not measured)`);
  process.exitCode = bad ? 1 : 0;
}

if (cmd === 'plan') {
  if (!args.length) usage();
  let skip = 0, twinError = false;
  for (const f of args) { const c = classify(f); if (!c.ok) skip++; console.log(`${c.ok ? 'COMPRESS' : 'SKIP    '} ${rel(f)}: ${c.why}`); }
  const twins = args.map(rel).filter(p => /^(AGENTS|CLAUDE)\.md$/.test(p));
  if (twins.length > 1) { console.log('ERROR AGENTS.md and CLAUDE.md are twins: compress only one'); twinError = true; }
  console.log(`PLAN: ${args.length - skip} to compress, ${skip} to skip`);
  process.exitCode = args.length === skip || twinError ? 1 : 0; // skipping some files is normal; nothing to compress is not
} else if (cmd === 'backup') {
  if (!args.length) usage();
  const refused = args.map(f => [f, classify(f)]).filter(([, c]) => !c.ok);
  if (refused.length) { for (const [f, c] of refused) console.log(`REFUSED ${rel(f)}: ${c.why}`); process.exit(1); }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = `${BACKUPS}/${stamp}`;
  if (fs.existsSync(dir)) { console.log(`REFUSED ${dir} already exists: wait a second and run again`); process.exit(1); }
  const manifest = { created: new Date().toISOString(), files: [] };
  for (const f of args) {
    const p = rel(f), raw = fs.readFileSync(p), dest = path.join(dir, p + '.orig');
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, raw);
    if (sha(fs.readFileSync(dest)) !== sha(raw)) { console.log(`ERROR the backup of ${p} does not match the original: stop, nothing was changed`); process.exit(1); }
    manifest.files.push({ path: p, backup: path.relative(dir, dest).split(path.sep).join('/'), sha256: sha(raw), bytes: raw.length });
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`BACKUP: ${manifest.files.length} file(s) in ${dir} (verified). Check later with: node skills/compress-for-ai/scripts/compress-guard.mjs check ${dir}`);
} else if (cmd === 'check') {
  if (args.length === 2 && fs.existsSync(args[0]) && fs.statSync(args[0]).isFile()) {
    report([{ file: rel(args[1]), ...compare(fs.readFileSync(args[0]), fs.readFileSync(args[1]), rel(args[1])) }]);
  } else if (args.length === 1) {
    const mf = path.join(args[0], 'manifest.json');
    if (!fs.existsSync(mf)) { console.error(`no manifest.json in ${args[0]}`); process.exit(2); }
    const m = JSON.parse(fs.readFileSync(mf, 'utf8'));
    report(m.files.map(f => {
      const orig = fs.readFileSync(path.join(args[0], f.backup));
      if (!fs.existsSync(f.path)) return { file: f.path, errors: ['the file is gone'], warnings: [], sizes: null };
      if (sha(orig) !== f.sha256) return { file: f.path, errors: ['the backup copy was changed since it was made: do not trust it'], warnings: [], sizes: null };
      return { file: f.path, ...compare(orig, fs.readFileSync(f.path), f.path) };
    }));
  } else usage();
} else if (cmd === 'restore') {
  if (!args.length) usage();
  const m = JSON.parse(fs.readFileSync(path.join(args[0], 'manifest.json'), 'utf8'));
  const only = args[1] ? rel(args[1]) : null;
  let n = 0;
  for (const f of m.files.filter(f => !only || f.path === only)) {
    const orig = fs.readFileSync(path.join(args[0], f.backup));
    if (sha(orig) !== f.sha256) { console.log(`ERROR backup of ${f.path} does not match its manifest: not restored`); process.exitCode = 1; continue; }
    fs.writeFileSync(f.path, orig); n++;
    console.log(`restored ${f.path}`);
  }
  console.log(`RESTORE: ${n} file(s)`);
} else usage();
