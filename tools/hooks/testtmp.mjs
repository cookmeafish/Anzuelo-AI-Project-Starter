// Test folders: every fixture the self-tests, the trial and the sweeps make lives under one root, <temp>/anzuelo-tests,
// and is removed when the process that made it ends, passed or failed (a normal end, an error, Ctrl+C). What a killed run
// leaves is removed by "node tools/starter.mjs clean-tests" (older than 1 hour, under this root only), and by each new
// run of the self-tests. Lesson (oversight, 2026-11-11): about 11,000 fixture folders, nearly 2 million files, were left
// in the temp folder; the kernel kept memory for each file until a restart, and the machine lagged.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const TEST_ROOT = path.join(os.tmpdir(), 'anzuelo-tests');
const MADE = new Set();
const rm = d => { try { fs.rmSync(d, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch { } };
export function cleanMade() { for (const d of MADE) rm(d); MADE.clear(); }
let hooked = false;
const hook = () => {
  if (hooked) return; hooked = true;
  process.on('exit', cleanMade);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) try { process.once(sig, () => { cleanMade(); process.exit(130); }); } catch { }
};
// A new folder under the root, removed when this process ends (keep: true leaves it, for a folder another process uses)
export function testDir(prefix = 'tmp-', { keep = false } = {}) {
  fs.mkdirSync(TEST_ROOT, { recursive: true });
  const d = fs.mkdtempSync(path.join(TEST_ROOT, String(prefix).replace(/[\\/]/g, '-')));
  if (!keep) { MADE.add(d); hook(); }
  return d;
}
// Leftovers of killed runs: entries under the root older than maxAgeMs (default 1 hour), and the runs under each
// project's folder (projects/<name>/) at the same age. Returns how many were removed.
export function cleanOld(maxAgeMs = 3600_000) {
  let n = 0;
  const sweep = (dir, skip = '') => { try { for (const e of fs.readdirSync(dir)) { if (e === skip) continue; const p = path.join(dir, e); try { if (Date.now() - fs.statSync(p).mtimeMs > maxAgeMs) { rm(p); n++; } } catch { } } } catch { } };
  sweep(TEST_ROOT, 'projects');
  try { for (const p of fs.readdirSync(path.join(TEST_ROOT, 'projects'))) sweep(path.join(TEST_ROOT, 'projects', p)); } catch { }
  return n;
}

// A project's own test runs: <temp>/anzuelo-tests/projects/<name>, the name from docs/names.json (PROJECT_NAME) or the
// folder's name. Lesson (oversight, 2026-11-11): about 15,000 folders, nearly 2 million files, that projects' own test
// suites (and the browsers they started) left in the temp folder; anything that walks the temp folder pays for each.
export function projectSlug(root = process.cwd()) {
  let n = '';
  try { n = JSON.parse(fs.readFileSync(path.join(root, 'docs/names.json'), 'utf8')).PROJECT_NAME || ''; } catch { }
  if (!n || /\{\{/.test(n)) n = path.basename(path.resolve(root));
  return String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project';
}
// Calls fn(env) with TEMP, TMP and TMPDIR set to a new folder under the project's test folder, and removes that folder
// when fn returns or throws: for the commands the engine runs for a project (its declared self-tests and check
// commands), so what they leave never reaches the real temp folder.
export function withOwnTemp(fn, root = process.cwd()) {
  let dir = null;
  try { const base = path.join(TEST_ROOT, 'projects', projectSlug(root)); fs.mkdirSync(base, { recursive: true }); dir = fs.mkdtempSync(path.join(base, 'run-')); MADE.add(dir); hook(); } catch { }
  try { return fn(dir ? { TEMP: dir, TMP: dir, TMPDIR: dir } : {}); }
  finally { if (dir) { rm(dir); MADE.delete(dir); const base = path.dirname(dir); for (const d of [base, path.dirname(base), TEST_ROOT]) try { fs.rmdirSync(d); } catch { break; } } }
}
// Runs a test command (any language) with its temp folder (TEMP, TMP, TMPDIR) pointed at a new folder under the
// project's test folder, removes that folder when the command ends, passed or failed, and lists what the command still
// added to the real temp folder (another program running at the same time may have added some of it).
// Returns { status, dir, added }.
export function runIsolated(cmd, { root = process.cwd(), stdio = 'inherit', env = process.env } = {}) {
  const real = os.tmpdir(), ls = () => { try { return new Set(fs.readdirSync(real)); } catch { return new Set(); } };
  const before = ls(), base = path.join(TEST_ROOT, 'projects', projectSlug(root));
  fs.mkdirSync(base, { recursive: true });
  const dir = fs.mkdtempSync(path.join(base, 'run-'));
  MADE.add(dir); hook();
  // (one string runs in the shell, as typed; separate words run without one, so paths with spaces stay whole; on Windows a
  // bare name such as npm is tried as npm.cmd too)
  const opts = { cwd: root, stdio, encoding: 'utf8', env: { ...env, TEMP: dir, TMP: dir, TMPDIR: dir } };
  const words = [].concat(cmd);
  let r = words.length === 1 ? spawnSync(words[0], { ...opts, shell: true }) : spawnSync(words[0], words.slice(1), opts);
  if (words.length > 1 && r.error?.code === 'ENOENT' && process.platform === 'win32' && !path.extname(words[0])) r = spawnSync(`${words[0]}.cmd`, words.slice(1), { ...opts, shell: true });
  rm(dir); MADE.delete(dir);
  for (const d of [base, path.dirname(base), TEST_ROOT]) try { fs.rmdirSync(d); } catch { break; } // (only empty ones)
  const added = [...ls()].filter(n => !before.has(n) && n !== 'anzuelo-tests').sort();
  return { status: r.status ?? (r.error ? 127 : 1), dir, added, stdout: r.stdout, stderr: r.stderr };
}
