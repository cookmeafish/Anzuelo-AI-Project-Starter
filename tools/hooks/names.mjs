// REQ: name-var (rule 17). Every changeable name is written once, in docs/names.json: docs show it in a marker
// (<!--name:KEY-->value<!--/name-->), code reads the file. Shared by both engines and the audit: hooks.mjs wraps these
// with its own config, and v2's end check calls them directly. Moved whole from hooks.mjs (2026-11-10), unchanged.
import fs from 'node:fs';
import path from 'node:path';

export const NAMES_FILE = 'docs/names.json';
export const NAME_MARK = /<!--name:([A-Za-z0-9_]+)-->[\s\S]*?<!--\/name-->/g;
export const NAME_DOCS = /\.(md|mdx|txt|html?)$/i; // markers are refilled only in docs: code reads the file
export const NAME_FILES = /\.(md|mdx|txt|html?|js|mjs|cjs|jsx|ts|tsx|py|json|ya?ml|css|vue|svelte|toml|ini|sh|ps1|bat)$/i;
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };

// The names file's string values, without "_" keys.
export const namesIn = root => Object.fromEntries(Object.entries(readJSON(path.join(root, NAMES_FILE), {})).filter(([k, v]) => !k.startsWith('_') && typeof v === 'string'));
// "_subjects": keys whose value is also a real-world thing the project's content talks about (a project named after a
// city, a river or a product). Its mentions in content are the subject, not the project's name, so they are not flagged;
// the markers still refill on a rename. Lesson: a project named after its subject flagged every mention of the subject.
export const subjectsIn = root => new Set([].concat(readJSON(path.join(root, NAMES_FILE), {})._subjects || []));
// A name that is still a template placeholder ({{PROJECT_NAME}}) or too short to search for is not checked.
const checkable = (nm, sub) => Object.entries(nm).filter(([k, v]) => !sub.has(k) && v.trim().length >= 3 && !/\{\{|<!--/.test(v));
export const stampNames = (text, nm) => text.replace(NAME_MARK, (m, k) => k in nm ? `<!--name:${k}-->${nm[k]}<!--/name-->` : m);

// A changeable name typed out in a file: outside a marker in docs, or anywhere in code.
// ctx: { root, nm, skip (namesIgnore or an engine file: not checked) }.
// Lesson: a project named "pipe" flagged the engine's own files, "from pipe.clean import" and the user's README, and a
// name inside an HTML <title> was told to take a marker that the browser would show as text.
export function nameProblems(file, text, { root, nm, skip = false }) {
  if (file === NAMES_FILE || skip) return [];
  // a package manifest names the package itself, which a rename must change by hand anyway
  // (Lesson: pyproject.toml and "python -m photodate" were flagged in a project named after its package.)
  if (/(^|\/)(pyproject\.toml|setup\.(cfg|py)|package(-lock)?\.json|Cargo\.(toml|lock)|go\.(mod|sum)|pubspec\.yaml|composer\.json|Gemfile|[^/]+\.gemspec|[^/]+\.csproj)$/i.test(file)) return [];
  text = String(text).replace(/(\s-m\s+|\bpython3?\s+)[\w.]+/g, '$1');
  const doc = NAME_DOCS.test(file), html = /\.html?$/i.test(file);
  // code: only text people read (strings and comments) counts, never an identifier, module or import path
  let bare = text.replace(NAME_MARK, '');
  if (!doc) bare = bare.split(/\r?\n/).filter(l => !/^\s*(import|from|export\s+\*|use|require|package|module|#include|using)\b/.test(l)).join('\n');
  // docs: a package folder or command is written as it is (`python -m pkg`, pkg/x.py), so code spans, fenced blocks
  // and path-like text don't count. Lesson: a Python project named after its package flagged its own install steps,
  // and a marker inside a path breaks on a rename.
  else bare = bare.replace(/```[\s\S]*?```|`[^`\n]*`/g, '');
  const word = v => doc ? new RegExp(`(?<![\\w./\\\\-])${esc(v)}(?![\\w-]|[./\\\\]\\w)`) : new RegExp(`(?<![\\w./\\\\-])${esc(v)}(?![\\w./\\\\(-])`);
  // in code, a name that is also the code's own package or command name is that identifier: the program name in a
  // command-line parser ("prog") or its usage example must match the command people type, and a rename changes the
  // package by hand anyway. Lesson: the check made a CLI drop its typed program name, and --help then showed
  // "python.exe -m photodate" instead of the command the README teaches.
  const ids = doc ? new Set() : codeIdentifiers(root);
  // one finding per typed name, even when several keys hold it (Lesson: PROJECT_NAME and a second key holding the same name gave two)
  const seen = new Set();
  return checkable(nm, subjectsIn(root)).filter(([, v]) => !/^[a-z]+$/.test(v) || v.length > 5).filter(([, v]) => !ids.has(v.toLowerCase().replace(/-/g, '_')))
    .filter(([, v]) => word(v).test(bare) && !seen.has(v) && seen.add(v))
    .map(([k, v]) => `${file}: "${v}" is typed out; ${html && new RegExp(`<title>[^<]*${esc(v)}`, 'i').test(bare) ? `inside <title> or an attribute a marker would show: fill it from ${NAMES_FILE} when the page is built, or waive it: node tools/hooks/hooks.mjs waive name-var "<why>"`
      : doc ? `write <!--name:${k}-->${v}<!--/name-->` : `read it from ${NAMES_FILE} (key ${k})`}`);
}
// The code's own package, module and command names (lowercase, "-" as "_"): a folder at the root or in src/ that holds
// code, and the name the package manifest gives (pyproject.toml, package.json, Cargo.toml, go.mod). Once per root.
const CODE_IDS = new Map();
export function codeIdentifiers(root) {
  if (CODE_IDS.has(root)) return CODE_IDS.get(root);
  const out = new Set(), add = s => { if (s) out.add(String(s).toLowerCase().replace(/^@[^/]+\//, '').replace(/-/g, '_')); };
  CODE_IDS.set(root, out);
  const at = p => path.join(root, p), list = d => { try { return fs.readdirSync(at(d)); } catch { return []; } }, read = p => { try { return fs.readFileSync(at(p), 'utf8'); } catch { return ''; } };
  const CODE = /\.(py|js|mjs|cjs|ts|tsx|go|rs|rb|java|kt|cs|php|dart|swift)$/i;
  for (const d of ['', 'src']) for (const n of list(d || '.')) { const p = d ? `${d}/${n}` : n; try { if (!/^[._]/.test(n) && fs.statSync(at(p)).isDirectory() && list(p).some(f => CODE.test(f))) add(n); } catch { } }
  const py = read('pyproject.toml'), pj = readJSON(at('package.json'), {}), cargo = read('Cargo.toml'), gomod = read('go.mod');
  add(/^\[(?:project|tool\.poetry)\][^[]*?^name\s*=\s*["']([^"']+)/m.exec(py)?.[1]);
  for (const s of (/^\[project\.scripts\]([^[]*)/m.exec(py)?.[1] || '').match(/^[\w.-]+(?=\s*=)/gm) || []) add(s);
  add(pj.name); for (const s of Object.keys(typeof pj.bin === 'object' && pj.bin || {})) add(s);
  add(/^\[package\][^[]*?^name\s*=\s*["']([^"']+)/m.exec(cargo)?.[1]);
  add(/^module\s+(\S+)/m.exec(gomod)?.[1]?.split('/').pop());
  return out;
}
// The lines of a file this turn wrote: lines its HEAD version already had are not this turn's typing (each counted
// once). heads: one "git cat-file --batch" for every file, none without names to find. Lesson: adding a link to an
// index flagged a name typed out years before in another line; one "git show" per file took 2.6 s of a 3.3 s Stop.
export function headsOf(root, files, spawnSync) {
  const out = new Map();
  if (!files.length || !fs.existsSync(path.join(root, '.git'))) return out;
  const r = spawnSync('git', ['cat-file', '--batch'], { cwd: root, input: files.map(p => `HEAD:${p}`).join('\n') + '\n', maxBuffer: 256 * 1024 * 1024 });
  if (r.status !== 0 || !r.stdout) return out;
  const buf = r.stdout; let at = 0;
  for (const p of files) {
    const nl = buf.indexOf(10, at); if (nl < 0) break;
    const head = buf.toString('utf8', at, nl), m = /^\S+ blob (\d+)$/.exec(head);
    if (!m) { at = nl + 1; continue; } // "<name> missing": not in HEAD (new or gitignored)
    const size = Number(m[1]); out.set(p, buf.toString('utf8', nl + 1, nl + 1 + size)); at = nl + 1 + size + 1;
  }
  return out;
}
export const newLinesOf = (now, before) => {
  if (before === undefined) return now;
  const have = new Map(); for (const l of before.split(/\r?\n/)) have.set(l, (have.get(l) || 0) + 1);
  return now.split(/\r?\n/).filter(l => { const c = have.get(l) || 0; if (c) { have.set(l, c - 1); return false; } return true; }).join('\n');
};
