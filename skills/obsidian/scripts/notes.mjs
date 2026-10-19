#!/usr/bin/env node
// The project's notes as a graph: what links to what, what is unconnected, and what is likely related. Zero dependencies.
//   node skills/obsidian/scripts/notes.mjs links <note>      links out, backlinks, and suggested relations for one note
//   node skills/obsidian/scripts/notes.mjs suggest <note>    notes sharing the most key words with it, not linked yet
//   node skills/obsidian/scripts/notes.mjs orphans [--all]   notes with no links in or out (--all: every markdown file, packs too)
//   node skills/obsidian/scripts/notes.mjs check             links between notes that don't resolve (exit 1 if any)
//   node skills/obsidian/scripts/notes.mjs open <note>       open the note in Obsidian (obsidian:// link)
// Notes are the markdown files under docs/ and the root, minus generated and logbook files (see NOT_NOTES).
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
// the starter's own records and templates are not notes: they are linked from the rules, not from each other.
// Lesson: a new project's audit listed BRIEF, DECISIONS, security and the spec template as orphan notes.
const NOT_NOTES = /^(docs\/(CHANGELOG|STATUS|MENU|BRIEF|DECISIONS|security|foundation|lessons|fit-checklist|recommended-tools|glossary)\.md|docs\/(specs|releases)\/_TEMPLATE\.md|docs\/(plans|knowledge)\/README\.md|docs\/knowledge\/SOURCES\.md|docs\/feedback-inbox\/|docs\/playbooks\/_|docs\/checks\/|DIRECTORY\.md|CLAUDE\.md|AGENTS\.md|SETUP-PROMPT\.md|HOW-TO-USE\.md)/;
const SKIP = /^(\.git|node_modules|\.cache|\.claude|\.agents|\.codex|\.gemini|\.obsidian|\.starter|state)$/;
const ALL = process.argv.includes('--all');
// the project's own note folders ("knowledgeDirs" in tools/hooks/config.json, e.g. a vault in Notes/) are notes too.
// Lesson: a vault in Notes/ reported every link resolving while its links were never read.
const KNOWLEDGE_ROOTS = (() => { try { return [].concat(JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'hooks', 'config.json'), 'utf8')).knowledgeDirs || []).map(d => String(d).split(/[\/]/)[0]).filter(Boolean); } catch { return []; } })();
const STOP = new Set('a an the this that these to of for in on at my me it its is are be do does did and or with from by i we our you your as not no can will should was were has have had but if then than so what when which who how why all any each one'.split(' '));
const words = s => [...new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3 && !STOP.has(w)).map(w => w.replace(/(?<![su])s$/, '')))];

function notes(every = false) {
  const out = [];
  const walk = d => { for (const n of fs.readdirSync(path.join(ROOT, d || '.'))) { if (SKIP.test(n)) continue; const p = d ? `${d}/${n}` : n; const st = fs.statSync(path.join(ROOT, p)); if (st.isDirectory()) { if (!d && !ALL && !['docs', 'profiles', ...KNOWLEDGE_ROOTS].includes(n)) continue; walk(p); } else if (p.endsWith('.md') && (every || ALL || !NOT_NOTES.test(p))) out.push(p); } };
  walk('');
  return out;
}
const read = p => { try { return fs.readFileSync(path.join(ROOT, p), 'utf8'); } catch { return ''; } };
// Links out of a note to other project files: relative markdown links and [[wikilinks]], resolved to project paths.
function linksOf(p, all) {
  const text = read(p).replace(/```[\s\S]*?```/g, ''), out = new Set();
  for (const m of text.matchAll(/\]\(([^)\s#]+\.md)(#[^)]*)?\)/g)) { if (/^[a-z]+:/i.test(m[1])) continue; out.add(path.posix.normalize(path.posix.join(path.posix.dirname(p), decodeURI(m[1])))); }
  for (const m of text.matchAll(/\[\[([^\]|#]+)/g)) { const t = m[1].trim().toLowerCase(); const hit = all.find(n => n.toLowerCase() === t || n.toLowerCase() === `${t}.md` || path.posix.basename(n, '.md').toLowerCase() === path.posix.basename(t, '.md')); out.add(hit || `${t}.md`); }
  out.delete(p);
  return [...out];
}
function graph() {
  // every markdown file can link to a note (CLAUDE.md, runbooks, checklists); only real notes are listed
  const all = notes(), out = {}, inn = {};
  for (const n of notes(true)) { out[n] = linksOf(n, all); for (const t of out[n]) (inn[t] ||= new Set()).add(n); }
  return { all, out, inn };
}
function suggest(p, g, limit = 5) {
  const mine = new Set(words(read(p))), linked = new Set([...(g.out[p] || []), ...(g.inn[p] || [])]);
  return g.all.filter(n => n !== p && !linked.has(n)).map(n => { const theirs = words(read(n)); const shared = theirs.filter(w => mine.has(w)); return { n, score: shared.length / Math.sqrt(theirs.length + 1), shared }; })
    .filter(s => s.shared.length >= 4).sort((a, b) => b.score - a.score).slice(0, limit);
}
const resolve = arg => { const p = String(arg || '').replace(/\\/g, '/').replace(/^\.\//, ''); return fs.existsSync(path.join(ROOT, p)) ? p : notes().find(n => n.endsWith('/' + p) || path.posix.basename(n, '.md') === p.replace(/\.md$/, '')); };

const [cmd, arg] = process.argv.slice(2);
const usage = () => { for (const l of fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split(/\r?\n/).slice(1)) { if (!l.startsWith('//')) break; console.log(l); } process.exit(2); };
if (['links', 'suggest', 'open'].includes(cmd) && !resolve(arg)) { console.error(`no note "${arg || ''}"`); process.exit(2); }
const g = cmd ? graph() : null;
if (cmd === 'links') {
  const p = resolve(arg);
  console.log(`${p}\n  links out: ${(g.out[p] || []).join(', ') || 'none'}\n  backlinks: ${[...(g.inn[p] || [])].join(', ') || 'none'}`);
  const s = suggest(p, g);
  console.log(`  suggested (shared words, not linked): ${s.map(x => `${x.n} (${x.shared.slice(0, 4).join(', ')})`).join('; ') || 'none'}`);
} else if (cmd === 'suggest') {
  const s = suggest(resolve(arg), g, 8);
  console.log(s.length ? s.map(x => `${x.n}  shares: ${x.shared.slice(0, 6).join(', ')}`).join('\n') : 'no likely relations found');
} else if (cmd === 'orphans') {
  const related = n => (read(n).split(/^##\s+Related[^\n]*\n/m)[1] || '').trim(); // a stated reason to stand alone counts
  const o = g.all.filter(n => !(g.out[n] || []).length && !(g.inn[n] || new Set()).size && !related(n));
  console.log(o.length ? o.join('\n') : 'no orphan notes');
} else if (cmd === 'check') {
  const broken = g.all.flatMap(n => (g.out[n] || []).filter(t => !fs.existsSync(path.join(ROOT, t))).map(t => `${n} -> ${t}`));
  console.log(broken.length ? broken.join('\n') + `\nNOTES: ${broken.length} broken link(s)` : 'NOTES: every link resolves');
  process.exit(broken.length ? 1 : 0);
} else if (cmd === 'open') {
  const url = `obsidian://open?path=${encodeURIComponent(path.join(ROOT, resolve(arg)))}`;
  const [bin, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  spawn(bin, args, { detached: true, stdio: 'ignore' }).unref();
  console.log(`opening ${url}`);
} else usage();
