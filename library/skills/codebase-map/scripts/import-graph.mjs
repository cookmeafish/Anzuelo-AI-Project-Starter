#!/usr/bin/env node
// Builds a dependency graph from the imports in a repo (JavaScript/TypeScript, Python, Go) without installing anything.
//   node skills/codebase-map/scripts/import-graph.mjs [repo folder] [--depth N] [--mermaid] [--json] [--file <path>]
//     --depth N     group files into modules by their first N folders (default 2)
//     --mermaid     also print a Mermaid diagram of the module graph
//     --json        print the whole result as JSON instead of text
//     --file <path> also show one file's view: what it imports and what imports it
// Read-only: it lists files (git ls-files when available) and reads them. Regex parsing: dynamic imports, path aliases
// and generated code are missed, so treat the result as a starting point and check edges in the code.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const take = f => { const i = args.indexOf(f); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const flag = f => { const i = args.indexOf(f); if (i < 0) return false; args.splice(i, 1); return true; };
const depth = Number(take('--depth') || 2);
const focus = take('--file');
const asJson = flag('--json');
const mermaid = flag('--mermaid');
const root = path.resolve(args[0] || '.');
if (!fs.existsSync(root)) { console.error(`no such folder: ${root}`); process.exit(2); }

const SKIP = /(^|\/)(node_modules|\.git|dist|build|out|target|vendor|coverage|\.next|\.venv|venv|__pycache__|\.cache|third_party)(\/|$)/;
const EXT = { js: 'js', mjs: 'js', cjs: 'js', jsx: 'js', ts: 'js', tsx: 'js', mts: 'js', cts: 'js', py: 'py', go: 'go' };
const extOf = f => EXT[path.extname(f).slice(1)];

function listFiles() {
  const g = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (g.status === 0 && g.stdout.trim()) return g.stdout.split('\n').filter(Boolean);
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(path.join(root, d), { withFileTypes: true })) {
      const rel = d ? `${d}/${e.name}` : e.name;
      if (SKIP.test(rel)) continue;
      if (e.isDirectory()) walk(rel); else out.push(rel);
    }
  })('');
  return out;
}

const files = listFiles().filter(f => !SKIP.test(f) && extOf(f) && !/\.d\.ts$|\.min\.js$/.test(f));
const fileSet = new Set(files);
const read = f => { try { const s = fs.readFileSync(path.join(root, f), 'utf8'); return s.length > 2_000_000 ? '' : s; } catch { return ''; } };

// Go: the module path from go.mod maps import paths to folders
let goModule = null;
try { goModule = /^module\s+(\S+)/m.exec(fs.readFileSync(path.join(root, 'go.mod'), 'utf8'))[1]; } catch { /* no go.mod */ }
const goDirs = new Map();
for (const f of files) if (extOf(f) === 'go' && !f.endsWith('_test.go')) { const d = path.posix.dirname(f); if (!goDirs.has(d)) goDirs.set(d, f); }

const JS_TRY = ['', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '/index.ts', '/index.tsx', '/index.js', '/index.jsx', '/index.mjs'];
function resolveJs(from, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null;
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  const stems = [base, base.replace(/\.(m|c)?js$/, '')];
  for (const s of stems) for (const t of JS_TRY) if (fileSet.has(s + t)) return s + t;
  return undefined;
}
const pyRoots = ['', 'src/', 'lib/', 'app/'];
function resolvePy(from, dots, mod) {
  const parts = mod ? mod.split('.') : [];
  const bases = [];
  if (dots) { let d = path.posix.dirname(from); for (let i = 1; i < dots; i++) d = path.posix.dirname(d); bases.push(d === '.' ? '' : d + '/'); }
  else bases.push(...pyRoots);
  for (const b of bases) {
    const p = b + parts.join('/');
    for (const c of [p + '.py', p + '/__init__.py']) if (fileSet.has(c.replace(/^\//, ''))) return c.replace(/^\//, '');
  }
  return dots ? undefined : null;
}
function resolveGo(spec) {
  if (!goModule || !(spec === goModule || spec.startsWith(goModule + '/'))) return null;
  const dir = spec.slice(goModule.length + 1) || '.';
  return goDirs.get(dir) || undefined;
}

const edges = new Map(); // file -> Set(file)
let unresolved = 0, external = 0;
const add = (a, b) => { if (b === null) { external++; return; } if (b === undefined) { unresolved++; return; } if (a !== b) { if (!edges.has(a)) edges.set(a, new Set()); edges.get(a).add(b); } };

for (const f of files) {
  const src = read(f), kind = extOf(f);
  if (kind === 'js') {
    for (const m of src.matchAll(/(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g))
      add(f, resolveJs(f, m[1] || m[2] || m[3] || m[4]));
  } else if (kind === 'py') {
    for (const m of src.matchAll(/^\s*from\s+(\.*)([\w.]*)\s+import\s+([\w*, ()]+)/gm)) {
      const dots = m[1].length, mod = m[2];
      // "from . import a, b" refers to sibling modules
      if (!mod && dots) for (const n of m[3].replace(/[()]/g, '').split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean)) add(f, resolvePy(f, dots, n));
      else add(f, resolvePy(f, dots, mod));
    }
    for (const m of src.matchAll(/^\s*import\s+([\w., ]+)/gm))
      for (const n of m[1].split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean)) add(f, resolvePy(f, 0, n));
  } else if (kind === 'go') {
    const specs = [];
    for (const m of src.matchAll(/^import\s*\(([\s\S]*?)\)/gm)) for (const s of m[1].matchAll(/"([^"]+)"/g)) specs.push(s[1]);
    for (const m of src.matchAll(/^import\s+(?:\w+\s+)?"([^"]+)"/gm)) specs.push(m[1]);
    for (const s of specs) add(f, resolveGo(s));
  }
}

const moduleOf = f => { const parts = f.split('/'); return parts.length <= depth ? (parts.length > 1 ? parts.slice(0, -1).join('/') : '(root)') : parts.slice(0, depth).join('/'); };
const fanIn = new Map(), fanOut = new Map(), modEdges = new Map();
for (const [a, bs] of edges) {
  fanOut.set(a, bs.size);
  for (const b of bs) {
    fanIn.set(b, (fanIn.get(b) || 0) + 1);
    const ma = moduleOf(a), mb = moduleOf(b);
    if (ma !== mb) { const k = `${ma} -> ${mb}`; modEdges.set(k, (modEdges.get(k) || 0) + 1); }
  }
}

// module cycles (strongly connected components with more than one module)
const adj = new Map();
for (const k of modEdges.keys()) { const [a, b] = k.split(' -> '); if (!adj.has(a)) adj.set(a, []); adj.get(a).push(b); if (!adj.has(b)) adj.set(b, []); }
const cycles = []; { let i = 0; const idx = new Map(), low = new Map(), stack = [], on = new Set();
  const strong = v => { idx.set(v, i); low.set(v, i); i++; stack.push(v); on.add(v);
    for (const w of adj.get(v)) { if (!idx.has(w)) { strong(w); low.set(v, Math.min(low.get(v), low.get(w))); } else if (on.has(w)) low.set(v, Math.min(low.get(v), idx.get(w))); }
    if (low.get(v) === idx.get(v)) { const c = []; let w; do { w = stack.pop(); on.delete(w); c.push(w); } while (w !== v); if (c.length > 1) cycles.push(c); } };
  for (const v of adj.keys()) if (!idx.has(v)) strong(v); }

const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);
const langs = {}; for (const f of files) langs[extOf(f)] = (langs[extOf(f)] || 0) + 1;
const result = {
  root, files: files.length, languages: langs, internalEdges: [...edges.values()].reduce((n, s) => n + s.size, 0),
  externalImports: external, unresolvedImports: unresolved,
  moduleEdges: top(modEdges, 1000).map(([k, n]) => ({ edge: k, imports: n })),
  mostImported: top(fanIn, 15).map(([f, n]) => ({ file: f, importedBy: n })),
  mostImporting: top(fanOut, 15).map(([f, n]) => ({ file: f, imports: n })),
  moduleCycles: cycles,
};
if (focus) {
  const f = focus.replace(/\\/g, '/');
  result.file = { file: f, imports: [...(edges.get(f) || [])], importedBy: [...edges].filter(([, bs]) => bs.has(f)).map(([a]) => a) };
}
const id = s => 'm_' + s.replace(/[^\w]/g, '_');
const mer = ['graph LR', ...result.moduleEdges.slice(0, 60).map(e => { const [a, b] = e.edge.split(' -> '); return `  ${id(a)}["${a}"] -->|${e.imports}| ${id(b)}["${b}"]`; })];

if (asJson) { if (mermaid) result.mermaid = mer.join('\n'); console.log(JSON.stringify(result, null, 2)); process.exit(0); }
console.log(`Import graph of ${root}`);
console.log(`files: ${files.length} (${Object.entries(langs).map(([k, v]) => `${k} ${v}`).join(', ')}); internal edges: ${result.internalEdges}; external imports: ${external}; unresolved: ${unresolved}`);
console.log(`\nModule edges (depth ${depth}), most used first:`);
for (const e of result.moduleEdges.slice(0, 40)) console.log(`  ${e.edge}  (${e.imports})`);
console.log('\nMost imported files (everything depends on these):');
for (const r of result.mostImported) console.log(`  ${String(r.importedBy).padStart(4)}  ${r.file}`);
console.log('\nFiles that import the most (often entry points or "god" files):');
for (const r of result.mostImporting) console.log(`  ${String(r.imports).padStart(4)}  ${r.file}`);
console.log(`\nModule cycles: ${cycles.length ? '' : 'none found'}`);
for (const c of cycles) console.log(`  ${c.join(' <-> ')}`);
if (result.file) {
  console.log(`\n${result.file.file}\n  imports: ${result.file.imports.join(', ') || '(none found)'}\n  imported by: ${result.file.importedBy.join(', ') || '(none found)'}`);
}
if (mermaid) console.log('\n```mermaid\n' + mer.join('\n') + '\n```');
if (unresolved) console.log(`\nNote: ${unresolved} relative import(s) could not be resolved (path aliases, generated files, or non-code assets).`);
