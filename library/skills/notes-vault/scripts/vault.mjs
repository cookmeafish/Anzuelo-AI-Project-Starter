#!/usr/bin/env node
// An existing notes folder (Obsidian vault or plain Markdown) as the project's knowledge. Zero dependencies, read-only.
//   node skills/notes-vault/scripts/vault.mjs scan [--root <dir>]          note folders, link style, registration
//   node skills/notes-vault/scripts/vault.mjs find <topic> [--root <dir>]  existing notes on a topic (title, aliases, heading, text)
// scan lists every top-level folder that holds Markdown notes, with its note count, its link style ([[wikilinks]] or
// Markdown links), the folders to leave out (attachments, templates), and whether "knowledgeDirs" in
// tools/hooks/config.json already registers it. It prints the knowledgeDirs line to add, and RESULT: PASS when every
// note folder is registered, RESULT: FAIL <folders> otherwise. It never moves, renames or writes a note.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const ROOT = path.resolve(opt('--root') || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
const [cmd, ...rest] = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--root');
const usage = () => { console.error('usage: node vault.mjs scan [--root <dir>] | node vault.mjs find <topic> [--root <dir>]'); process.exit(2); };

// the starter's own folders and build output are not the user's notes
const NOT_NOTES = /^(\.|node_modules$|docs$|tools$|skills$|library$|packs$|outputs$|inbox$|sources$|profiles$|src$|app$|lib$|server$|dist$|build$|state$|logs$)/i;
const LEAVE_OUT = /^(\.obsidian|\.trash|attachments?|assets|media|images?|files|_resources|templates?|_templates|excalidraw)$/i;
const rel = p => path.relative(ROOT, p).replace(/\\/g, '/');
const read = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } };
function mdFiles(dir, skipped = []) {
  const out = [];
  const walk = d => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); let st; try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) { if (LEAVE_OUT.test(n) || n.startsWith('.')) { skipped.push(rel(p)); continue; } walk(p); } else if (/\.md$/i.test(n)) out.push(p); } };
  walk(dir);
  return out;
}
function registered() {
  let c = {}; try { c = JSON.parse(read(path.join(ROOT, 'tools/hooks/config.json')) || '{}'); } catch { }
  return ['docs/knowledge', ...(Array.isArray(c.knowledgeDirs) ? c.knowledgeDirs : [])].map(d => d.replace(/\\/g, '/').replace(/\/+$/, ''));
}
function noteFolders() {
  const out = [];
  for (const n of fs.readdirSync(ROOT)) {
    const p = path.join(ROOT, n);
    if (NOT_NOTES.test(n) || LEAVE_OUT.test(n) || !fs.statSync(p).isDirectory()) continue;
    const skipped = [], files = mdFiles(p, skipped);
    if (files.length) out.push({ dir: n, files, skipped });
  }
  return out;
}

if (cmd === 'scan') {
  const reg = registered(), folders = noteFolders();
  const vault = fs.existsSync(path.join(ROOT, '.obsidian')) ? 'Obsidian vault at the project root' : folders.some(f => fs.existsSync(path.join(ROOT, f.dir, '.obsidian'))) ? 'Obsidian vault inside a folder' : 'no .obsidian folder (plain Markdown notes)';
  console.log(`Root: ${rel(ROOT) || '.'}  (${vault})`);
  if (!folders.length) { console.log('No note folders found outside the starter\'s own folders.\nRESULT: PASS'); process.exit(0); }
  const missing = [];
  for (const f of folders) {
    let wiki = 0, md = 0;
    for (const p of f.files) { const t = read(p); wiki += (t.match(/\[\[[^\]]+\]\]/g) || []).length; md += (t.match(/\]\([^)\s]+\.md(#[^)]*)?\)/g) || []).length; }
    const style = wiki > md ? '[[wikilinks]]' : md > wiki ? 'Markdown links' : (wiki ? 'mixed' : 'no links yet');
    const isReg = reg.some(r => f.dir === r || f.dir.startsWith(r + '/'));
    if (!isReg) missing.push(f.dir);
    console.log(`\n${f.dir}/  ${f.files.length} notes, link style: ${style} (${wiki} wiki, ${md} markdown), ${isReg ? 'registered' : 'NOT registered'}`);
    if (f.skipped.length) console.log(`  leave out: ${[...new Set(f.skipped)].slice(0, 8).join(', ')}`);
  }
  const all = [...new Set([...reg.filter(r => r !== 'docs/knowledge'), ...missing])];
  console.log(`\nknowledgeDirs for tools/hooks/config.json: ${JSON.stringify(all)}`);
  console.log('Link check: these folders are outside docs/, so run notes.mjs check --all and read the lines for these folders.');
  console.log(missing.length ? `RESULT: FAIL not registered: ${missing.join(', ')}` : 'RESULT: PASS');
  process.exit(missing.length ? 1 : 0);
} else if (cmd === 'find') {
  const topic = rest.join(' ').trim();
  if (!topic) usage();
  const norm = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const want = norm(topic), words = want.split(/[^a-z0-9]+/).filter(w => w.length > 2);
  const dirs = [...new Set([...registered(), ...noteFolders().map(f => f.dir)])].filter(d => fs.existsSync(path.join(ROOT, d)));
  const hits = [];
  for (const d of dirs) for (const p of mdFiles(path.join(ROOT, d))) {
    const text = read(p), title = norm(path.basename(p, '.md'));
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] || '';
    // aliases: inline (aliases: [a, b]) or as a list under the key
    const am = /^aliases\s*:[ \t]*(.*)((?:\r?\n[ \t]*-[ \t]+.+)*)/m.exec(fm);
    const aliases = am ? `${am[1]},${am[2].replace(/\r?\n[ \t]*-[ \t]+/g, ',')}`.replace(/[[\]"']/g, '').split(',').map(s => norm(s.trim())).filter(Boolean) : [];
    const h1 = norm(/^#\s+(.+)$/m.exec(text)?.[1] || '');
    const body = norm(text);
    let score = 0, why = [];
    if (title === want || h1 === want) { score += 10; why.push('title'); }
    if (aliases.includes(want)) { score += 8; why.push('alias'); }
    const inTitle = words.filter(w => title.includes(w) || h1.includes(w)).length;
    if (inTitle && score < 10) { score += 3 * inTitle; why.push(`${inTitle} word(s) in title`); }
    const mentions = words.reduce((n, w) => n + (body.split(w).length - 1), 0);
    if (mentions) { score += Math.min(mentions, 5) / 5; why.push(`${mentions} mention(s)`); }
    if (score > 0) hits.push({ p: rel(p), score, why });
  }
  hits.sort((a, b) => b.score - a.score);
  console.log(hits.length ? hits.slice(0, 10).map(h => `${h.p}  (${h.why.join(', ')})`).join('\n') : `no note on "${topic}" yet`);
  if (hits[0]?.score >= 8) console.log(`\nExtend ${hits[0].p} instead of starting a new note.`);
} else usage();
