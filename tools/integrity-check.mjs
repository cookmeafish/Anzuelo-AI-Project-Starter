#!/usr/bin/env node
// Integrity check after interrupted work (a usage limit, a crash, a compaction): are recently edited files complete
// and well-formed? REQ: interrupted-work.
//   node tools/integrity-check.mjs            files changed in the last 24 hours
//   node tools/integrity-check.mjs --hours 6  a different window
//   node tools/integrity-check.mjs a.json b.svg
// Checks: JSON parses, JS/MJS/CJS passes node --check, SVG/XML/HTML ends with its closing tag, no file is empty when
// it had content type, and no unresolved merge markers. Prints RESULT: PASS or one PROBLEM line per file.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const hi = args.indexOf('--hours');
const hours = hi >= 0 ? Number(args[hi + 1]) : 24;
const given = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--hours');
const SKIP = /^(\.git|node_modules|\.cache|dist|build|\.claude|\.agents|\.gemini|tools[\\/]hooks[\\/]state)$/;
// installed dependencies and virtual environments are not work that an interruption could have cut short (hooks.mjs
// bulkDir). Lesson: a fresh .venv's files were reported at session start as having unresolved merge markers.
const { bulkDir } = await import('./hooks/hooks.mjs').catch(() => ({ bulkDir: (d, n) => /^(\.venv|venv|__pycache__|site-packages)$/.test(n) }));

const files = [];
if (given.length) files.push(...given.map(f => path.resolve(f)));
else {
  const since = Date.now() - hours * 3600_000;
  const walk = d => { for (const n of fs.readdirSync(d)) { if (SKIP.test(n)) continue; const p = path.join(d, n); const s = fs.statSync(p); if (s.isDirectory()) { if (!bulkDir(d, n)) walk(p); } else if (s.mtimeMs > since) files.push(p); } };
  walk(ROOT);
}

const probs = [];
let jsChecked = 0;
for (const f of files) {
  const rel = path.relative(ROOT, f).split(path.sep).join('/');
  let text;
  try { text = fs.readFileSync(f, 'utf8'); } catch { probs.push(`${rel}: unreadable`); continue; }
  const ext = path.extname(f).toLowerCase();
  if (/^(<{7}|={7}|>{7})( |$)/m.test(text)) probs.push(`${rel}: unresolved merge markers`);
  // empty is broken only where it lost content, or where an empty file can't be valid; __init__.py and markers are
  // empty on purpose (Lesson: a real project's empty __init__.py files were reported as broken after a resume)
  if (!text.trim() && !/(^|\/)(__init__\.py|py\.typed|\.gitkeep|\.keep)$/.test(rel) && /\.(json|js|mjs|cjs|ts|tsx|jsx|svg|html|css|md|py)$/.test(ext)) {
    const before = spawnSync('git', ['show', `HEAD:${rel}`], { cwd: ROOT, encoding: 'utf8' });
    if ((before.status === 0 && before.stdout.trim()) || /\.(json|svg|html)$/.test(ext)) probs.push(`${rel}: empty file`);
  }
  if (ext === '.json' && text.trim()) { try { JSON.parse(text.replace(/^﻿/, '')); } catch (e) { probs.push(`${rel}: invalid JSON (${e.message})`); } }
  if (/^\.(js|mjs|cjs)$/.test(ext) && jsChecked < 60) {
    jsChecked++;
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) probs.push(`${rel}: syntax error (${(r.stderr || '').split('\n').find(l => /Error/.test(l)) || 'node --check failed'})`);
  }
  const tags = { '.svg': '</svg>', '.html': '</html>', '.htm': '</html>' };
  if (tags[ext] && text.trim() && /<(svg|html)\b/i.test(text) && !text.trim().toLowerCase().endsWith(tags[ext])) probs.push(`${rel}: does not end with ${tags[ext]} (cut off?)`);
}
for (const p of probs) console.log('PROBLEM ' + p);
console.log(probs.length ? `RESULT: FAIL (${probs.length} problem(s) in ${files.length} file(s))` : `RESULT: PASS (${files.length} file(s) checked)`);
process.exit(probs.length ? 1 : 0);
