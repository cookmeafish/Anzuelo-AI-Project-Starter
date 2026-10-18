#!/usr/bin/env node
// Finds the first test file that leaves something behind (a stray file or folder, changed state on disk).
// Runs your test command once per test file, in sorted order, and checks for the leftover after each run.
//
//   node skills/debug/scripts/find-polluter.mjs --leftover <path> --tests "<glob>" --cmd "<command with {file}>"
//   node skills/debug/scripts/find-polluter.mjs --leftover .git --tests "src/**/*.test.ts" --cmd "npx vitest run {file}"
//   node skills/debug/scripts/find-polluter.mjs --leftover out/tmp.db --tests "tests/**/test_*.py" --cmd "python -m pytest {file}" --dry-run
//
// Options:
//   --leftover <path>  the file or folder that should not appear (relative to --root)
//   --tests <glob>     which test files to try; * matches within a folder, ** across folders. Repeat for more globs.
//   --cmd <command>    the test command; {file} is replaced by the quoted test file path (appended if missing)
//   --root <dir>       the folder to search and run in (default: the current folder)
//   --timeout <sec>    stop one test run after this many seconds (default 300)
//   --dry-run          only list the test files that would run
//
// It never deletes anything. If the leftover already exists, it stops and asks you to remove it first.
// Exit codes: 0 no polluter found, 1 polluter found, 2 usage or setup problem.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const SKIP_DIRS = new Set(['node_modules', '.git', '.hg', '.svn', 'dist', 'build', 'coverage', '.venv', 'venv', '__pycache__', '.cache']);

function parseArgs(argv) {
  const o = { tests: [], root: process.cwd(), timeout: 300, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i], next = () => { if (i + 1 >= argv.length) usage(`${a} needs a value`); return argv[++i]; };
    if (a === '--leftover') o.leftover = next();
    else if (a === '--tests') o.tests.push(next());
    else if (a === '--cmd') o.cmd = next();
    else if (a === '--root') o.root = path.resolve(next());
    else if (a === '--timeout') o.timeout = Number(next());
    else if (a === '--dry-run') o.dryRun = true;
    else if (a === '-h' || a === '--help') usage();
    else usage(`unknown option ${a}`);
  }
  if (!o.leftover || !o.tests.length || (!o.cmd && !o.dryRun)) usage('--leftover, --tests and --cmd are required');
  if (!(o.timeout > 0)) usage('--timeout must be a positive number of seconds');
  return o;
}

function usage(msg) {
  if (msg) console.error(`find-polluter: ${msg}`);
  console.error('usage: node find-polluter.mjs --leftover <path> --tests "<glob>" --cmd "<test command with {file}>" [--root <dir>] [--timeout <sec>] [--dry-run]');
  process.exit(2);
}

// Glob to regular expression: ** spans folders (including none), * stays inside one folder, ? is one character.
function globToRegex(glob) {
  let g = glob.replace(/\\/g, '/').replace(/^\.\//, ''), s = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*' && g[i + 1] === '*') { i++; if (g[i + 1] === '/') { i++; s += '(?:.*/)?'; } else s += '.*'; }
    else if (c === '*') s += '[^/]*';
    else if (c === '?') s += '[^/]';
    else s += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${s}$`, process.platform === 'win32' ? 'i' : '');
}

function walk(root, rel = '', out = []) {
  let entries;
  try { entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(root, r, out); }
    else if (e.isFile()) out.push(r);
  }
  return out;
}

const quote = f => (/^[\w./-]+$/.test(f) ? f : `"${f.replace(/"/g, '\\"')}"`);
const describe = p => { const st = fs.statSync(p); return `${st.isDirectory() ? 'folder' : `file, ${st.size} bytes`}, modified ${st.mtime.toISOString()}`; };

const o = parseArgs(process.argv.slice(2));
if (!fs.existsSync(o.root)) usage(`--root ${o.root} does not exist`);
const leftover = path.resolve(o.root, o.leftover);
const patterns = o.tests.map(globToRegex);
const files = [...new Set(walk(o.root).filter(f => patterns.some(re => re.test(f))))].sort();

console.log(`Looking for the test file that creates: ${o.leftover}`);
console.log(`Test files matched: ${files.length}`);
if (!files.length) { console.log('RESULT: FAIL no test files matched the --tests glob(s)'); process.exit(2); }
if (o.dryRun) { for (const f of files) console.log(`  ${f}`); console.log('RESULT: PASS dry run, nothing executed'); process.exit(0); }
if (fs.existsSync(leftover)) {
  console.log(`RESULT: FAIL ${o.leftover} already exists (${describe(leftover)}). Remove or move it yourself, then run again.`);
  process.exit(2);
}

for (const [i, f] of files.entries()) {
  const cmd = o.cmd.includes('{file}') ? o.cmd.split('{file}').join(quote(f)) : `${o.cmd} ${quote(f)}`;
  process.stdout.write(`[${i + 1}/${files.length}] ${f} ... `);
  const r = spawnSync(cmd, { cwd: o.root, shell: true, stdio: 'ignore', timeout: o.timeout * 1000 });
  const how = r.error?.code === 'ETIMEDOUT' ? `timed out after ${o.timeout}s` : r.error ? `could not run (${r.error.message})` : `exit ${r.status}`;
  if (fs.existsSync(leftover)) {
    console.log(how);
    console.log(`\nRESULT: FAIL polluter found: ${f}`);
    console.log(`  Created: ${o.leftover} (${describe(leftover)})`);
    console.log(`  Run it alone: ${cmd}`);
    console.log('  The leftover was not removed. Remove it before running this script again.');
    process.exit(1);
  }
  console.log(`${how}, clean`);
}
console.log(`\nRESULT: PASS no single test file left ${o.leftover} behind.`);
console.log('  If it still appears in a full run, it needs two tests together (order dependence): see references.md.');
process.exit(0);
