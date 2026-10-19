#!/usr/bin/env node
// Checks changed code files stay modular (modular-code skill). Zero dependencies.
//   node skills/modular-code/scripts/modularity.mjs <file> [<file> ...] [--max-lines 400] [--max-function 60]
// Judges only what this change adds (compared with the last commit; the whole file when it is new or git is absent),
// so an existing project is never told to rewrite code it already had:
//   FAIL  a file over --max-lines that this change made longer (split off what you add)
//   FAIL  a URL, host, IP address or port typed into code (it belongs in a config file or an environment variable)
//   FAIL  an import that reaches into another module's private files (internal/, private/, _private/)
//   WARN  a function that grew past --max-function lines; a relative import that climbs 3 or more folders
// Prints RESULT: PASS or RESULT: FAIL <why> (exit 1). Tests, config files, generated and engine files are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? Number(args[i + 1]) : d; };
const MAX_LINES = opt('--max-lines', 400), MAX_FN = opt('--max-function', 60);
const files = args.filter((a, i) => !a.startsWith('--') && !['--max-lines', '--max-function'].includes(args[i - 1]));
if (!files.length) { console.log('usage: node skills/modular-code/scripts/modularity.mjs <file> [...] [--max-lines 400] [--max-function 60]'); process.exit(2); }

const CODE = /\.(m?[jt]sx?|cjs|py|dart|rs|go|cs|kt|kts|swift|gd|java|vue|svelte|rb|php)$/i;
const SKIP = /(^|\/)(tests?|__tests__|spec|fixtures|mocks?|node_modules|dist|build|out|target|generated|vendor|migrations|\.cache|tools\/hooks|skills|packs|library)\/|\.(test|spec)\.[a-z]+$|_test\.[a-z]+$|(^|\/)test_[^/]+\.py$|(^|\/)(config|settings|constants|env)[^/]*\.[a-z]+$|\.config\.[a-z]+$|\.d\.ts$|(^|\/)tools\/[\w-]+\.mjs$/i;
const git = a => spawnSync('git', a, { encoding: 'utf8' });
const inGit = git(['rev-parse', '--is-inside-work-tree']).stdout.trim() === 'true';
const fails = [], warns = [];

for (const raw of files) {
  const f = raw.replace(/\\/g, '/');
  if (!CODE.test(f) || SKIP.test(f) || !fs.existsSync(f)) continue;
  const now = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const old = inGit ? git(['show', `HEAD:${f}`]) : { status: 1 };
  const before = old.status === 0 ? old.stdout.split(/\r?\n/) : null;
  // the lines this change added (a line counts as added when the old file had it fewer times)
  let added = now.map((t, i) => ({ t, n: i + 1 }));
  if (before) { const have = new Map(); for (const t of before) have.set(t, (have.get(t) || 0) + 1); added = added.filter(({ t }) => { const c = have.get(t) || 0; if (c) { have.set(t, c - 1); return false; } return true; }); }
  if (!added.length) continue;
  // 1. size: never make an oversized file bigger
  if (now.length > MAX_LINES && (!before || now.length > before.length))
    fails.push(`${f}: ${now.length} lines (over ${MAX_LINES}${before ? `, was ${before.length}` : ''}): split it by job instead of adding to it`);
  for (const { t, n } of added) {
    const code = t.replace(/(^|\s)(\/\/|#)(?!!).*$/, '').trim();
    if (!code || /^\s*(\*|\/\*|"""|''')/.test(t)) continue;
    // 2. changeable settings typed into code
    const url = /(["'`])(https?:\/\/(?!localhost\b|127\.0\.0\.1\b|example\.(com|org)\b|schemas?\.|www\.w3\.org)[^"'`\s]+)\1/.exec(code);
    const ip = /(["'`])(\d{1,3}\.){3}\d{1,3}(:\d+)?\1/.exec(code);
    const port = /\b(port|PORT)\s*[:=]\s*\d{2,5}\b|listen\(\s*\d{2,5}\s*[,)]/.exec(code);
    if (url || ip || port) fails.push(`${f}:${n}: ${(url || ip || port)[0].slice(0, 60)} is typed into the code: read it from the config module or an environment variable (with its default in one place)`);
    // 3. reaching into another module's private files
    const imp = /(?:\bfrom\s+|\bimport\s+|\brequire\(\s*|\bimport\(\s*)["'`]([^"'`]+)["'`]/.exec(code)?.[1] || '';
    if (/(^|\/)(internal|private|_private)\//.test(imp) && /\.\.\//.test(imp)) fails.push(`${f}:${n}: imports ${imp}, another module's private files: import its public entry instead`);
    else if (/^(\.\.\/){3,}/.test(imp)) warns.push(`${f}:${n}: ${imp} climbs ${imp.match(/\.\.\//g).length} folders: a shared module or the other module's public entry is usually clearer`);
  }
  // 4. long functions (a warning: the count is a heuristic across languages)
  const start = /^\s*(export\s+)?(async\s+)?(function\b|def\s|fn\s|func\s|(public|private|protected|static|override|internal)\s[^=]*\(|[\w$]+\s*=\s*(async\s*)?\([^)]*\)\s*=>\s*\{\s*$)/;
  let open = null;
  for (let i = 0; i <= now.length; i++) {
    const t = now[i];
    if (t === undefined || (start.test(t) && i > (open?.at ?? -1))) {
      if (open && i - open.at > MAX_FN && added.some(a => a.n > open.at && a.n <= i)) warns.push(`${f}:${open.at + 1}: a function of about ${i - open.at} lines (over ${MAX_FN}): split it by step`);
      open = t === undefined ? null : { at: i };
    }
  }
}
for (const w of warns) console.log(`WARN  ${w}`);
for (const x of fails) console.log(`FAIL  ${x}`);
console.log(fails.length ? `RESULT: FAIL ${fails.length} problem(s): ${fails[0]}` : `RESULT: PASS (${files.length} file(s) checked${warns.length ? `, ${warns.length} warning(s)` : ''})`);
process.exit(fails.length ? 1 : 0);
