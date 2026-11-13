// Test folders: all under <temp>/anzuelo-tests, removed when their process ends or by the next run. Lesson (2026-11-11):
// about 11,000 left folders held kernel memory until a restart.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
// Cooperative stop ("starter.mjs stop-tests" writes <root>/STOP): runs started before it exit within a second.
export const STOP_FILE = path.join(TEST_ROOT, 'STOP'), requestStop = () => { fs.mkdirSync(TEST_ROOT, { recursive: true }); fs.writeFileSync(STOP_FILE, `${new Date().toISOString()}\n`); return STOP_FILE; };
const STARTED = Date.now(); let stopSeen = 0; export const watchStop = () => { const t = setInterval(stopIfAsked, 1000); t.unref?.(); return t; };
export function stopIfAsked() { const t = Date.now(); if (t - stopSeen < 500) return; stopSeen = t; let m = 0; try { m = fs.statSync(STOP_FILE).mtimeMs; } catch { return; }
  if (m >= STARTED - 1000) { try { process.stderr.write(`stopped: ${STOP_FILE}\n`); } catch { } cleanMade(); process.exit(3); } }
// A new folder <prefix><pid>-XXXXXX, removed at exit (keep: true leaves it), or by cleanDead once its process is gone
const owned = (dir, prefix) => fs.mkdtempSync(path.join(dir, `${String(prefix).replace(/[\\/]/g, '-')}${process.pid}-`));
export function testDir(prefix = 'tmp-', { keep = false } = {}) {
  fs.mkdirSync(TEST_ROOT, { recursive: true });
  const d = owned(TEST_ROOT, prefix);
  if (!keep) { MADE.add(d); hook(); }
  return d;
}
// A failed run's folder kept for a look, in <root>/failed/ (neither cleanup touches it), the newest `cap` kept. Lesson
// (2026-11-12): a failing trial's sample was gone before it could be read.
export const FAILED_ROOT = path.join(TEST_ROOT, 'failed');
export function keepFailed(dir, label, cap = 3) {
  fs.mkdirSync(FAILED_ROOT, { recursive: true });
  const to = path.join(FAILED_ROOT, `${String(label).replace(/[^\w-]/g, '-')}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  try { fs.renameSync(dir, to); } catch { try { fs.cpSync(dir, to, { recursive: true }); rm(dir); } catch { return dir; } }
  MADE.delete(dir);
  const all = fs.readdirSync(FAILED_ROOT).map(n => path.join(FAILED_ROOT, n)).sort((a, b) => { try { return fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs; } catch { return 0; } });
  for (const old of all.slice(cap)) rm(old);
  return to;
}
// Leftovers older than maxAgeMs (1 hour) under the root and each projects/<name>/ (not failed/). Returns how many were removed.
export function cleanOld(maxAgeMs = 3600_000) { let n = 0;
  const sweep = (dir, skip = '') => { try { for (const e of fs.readdirSync(dir)) { if (e === skip || e === 'failed') continue; const p = path.join(dir, e); try { if (Date.now() - fs.statSync(p).mtimeMs > maxAgeMs) { rm(p); n++; } } catch { } } } catch { } };
  sweep(TEST_ROOT, 'projects');
  try { for (const p of fs.readdirSync(path.join(TEST_ROOT, 'projects'))) sweep(path.join(TEST_ROOT, 'projects', p)); } catch { }
  return n;
}

// What killed runs left (their process gone, a minute old at least), run first by every suite.
const alive = pid => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
export function cleanDead(minAgeMs = 60_000) {
  let n = 0;
  const sweep = dir => { try { for (const e of fs.readdirSync(dir)) {
    const pid = Number(/-(\d+)-[A-Za-z0-9]{6}$/.exec(e)?.[1]); if (!pid || pid === process.pid || alive(pid)) continue;
    const p = path.join(dir, e); try { if (Date.now() - fs.statSync(p).mtimeMs >= minAgeMs) { rm(p); n++; } } catch { } } } catch { } };
  sweep(TEST_ROOT);
  try { for (const p of fs.readdirSync(path.join(TEST_ROOT, 'projects'))) sweep(path.join(TEST_ROOT, 'projects', p)); } catch { }
  pruneCompileCache(); return n; }
// The hooks' compile cache stays bounded (other Node versions' folders go; past `cap` files emptied). Lesson: 22 GB.
export function pruneCompileCache(cap = 4000, dir = path.join(os.tmpdir(), 'anzuelo-compile-cache')) { let n = 0;
  try { for (const v of fs.readdirSync(dir)) { if (!v.startsWith(`v${process.versions.node}-`)) { rm(path.join(dir, v)); continue; } n += fs.readdirSync(path.join(dir, v)).length; } } catch { return 0; }
  if (n > cap) { rm(dir); return 0; } return n; }
// A project's own test runs: <temp>/anzuelo-tests/projects/<name> (PROJECT_NAME or the folder's name). Lesson
// (2026-11-11): projects' own suites left about 15,000 folders in the temp folder.
export function projectSlug(root = process.cwd()) {
  let n = '';
  try { n = JSON.parse(fs.readFileSync(path.join(root, 'docs/names.json'), 'utf8')).PROJECT_NAME || ''; } catch { }
  if (!n || /\{\{/.test(n)) n = path.basename(path.resolve(root));
  return String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'project';
}
// Calls fn(env) with TEMP, TMP and TMPDIR in a new folder under the project's test folder, removed when fn ends: for the
// commands the engine runs for a project, so what they leave never reaches the real temp folder.
export function withOwnTemp(fn, root = process.cwd()) {
  let dir = null;
  try { const base = path.join(TEST_ROOT, 'projects', projectSlug(root)); fs.mkdirSync(base, { recursive: true }); dir = owned(base, 'run-'); MADE.add(dir); hook(); } catch { }
  try { return fn(dir ? { TEMP: dir, TMP: dir, TMPDIR: dir } : {}); }
  finally { if (dir) { rm(dir); MADE.delete(dir); const base = path.dirname(dir); for (const d of [base, path.dirname(base), TEST_ROOT]) try { fs.rmdirSync(d); } catch { break; } } }
}
// Runs a test command (any language) with TEMP, TMP and TMPDIR in a new folder under the project's test folder, removed
// when it ends, and lists what it still added to the real temp folder. Returns { status, dir, added }.
export function runIsolated(cmd, { root = process.cwd(), stdio = 'inherit', env = process.env, timeout, under } = {}) {
  const real = os.tmpdir(), ls = () => { try { return new Set(fs.readdirSync(real)); } catch { return new Set(); } };
  // (under: a folder to make the run's temp folder in, for a caller that removes it whole: startTempHint)
  const before = ls(), base = under || path.join(TEST_ROOT, 'projects', projectSlug(root));
  fs.mkdirSync(base, { recursive: true });
  const dir = owned(base, 'run-');
  MADE.add(dir); hook();
  // (one string runs in the shell, as typed; separate words run without one, so paths with spaces stay whole; on Windows a
  // bare name such as npm is tried as npm.cmd too)
  const opts = { cwd: root, stdio, encoding: 'utf8', env: { ...env, TEMP: dir, TMP: dir, TMPDIR: dir }, ...(timeout ? { timeout } : {}) };
  const words = [].concat(cmd);
  let r = words.length === 1 ? spawnSync(words[0], { ...opts, shell: true }) : spawnSync(words[0], words.slice(1), opts);
  if (words.length > 1 && r.error?.code === 'ENOENT' && process.platform === 'win32' && !path.extname(words[0])) r = spawnSync(`${words[0]}.cmd`, words.slice(1), { ...opts, shell: true });
  // (left: what the command left in its own temp folder, which it would have left in the real one without this)
  const leftInOwn = (() => { try { return fs.readdirSync(dir).filter(n => n !== 'node-compile-cache').sort(); } catch { return []; } })();
  rm(dir); MADE.delete(dir);
  if (!under) for (const d of [base, path.dirname(base), TEST_ROOT]) try { fs.rmdirSync(d); } catch { break; } // (only empty ones)
  const added = [...ls()].filter(n => !before.has(n) && n !== 'anzuelo-tests').sort();
  return { status: r.status ?? (r.error ? 127 : 1), timedOut: r.error?.code === 'ETIMEDOUT', dir, added, left: leftInOwn, stdout: r.stdout, stderr: r.stderr };
}
// The upgrade's one plain line for a project whose own approved test commands (selfCommands, up to 3) leave temp
// folders, said once in the upgrade report. Cheap only: a command that took over a minute is skipped, each gets a minute.
export const HINT_LIMIT_MS = 60_000;
const timesFile = root => path.join(root, 'tools/hooks/state/selfcmd-times.json');
// How long each test command the engine ran for the project took last time, in ms (the end check's self-runs record it)
export function recordRunTime(root, cmd, ms) {
  try { const f = timesFile(root); let j = {}; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { } j[cmd] = Math.round(ms); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j)); } catch { }
}
export function tempHint(root, { timeout = HINT_LIMIT_MS, under } = {}) {
  let cmds = [], times = {};
  try { cmds = [].concat(JSON.parse(fs.readFileSync(path.join(root, 'tools/hooks/config.json'), 'utf8')).selfCommands || []).filter(c => typeof c === 'string' && c.trim()).slice(0, 3); } catch { }
  try { times = JSON.parse(fs.readFileSync(timesFile(root), 'utf8')); } catch { }
  const leaky = cmds.filter(c => !(Number(times[c]) > HINT_LIMIT_MS)).map(c => ({ c, r: runIsolated(c, { root, stdio: 'pipe', timeout, under }) }))
    .filter(({ r }) => !r.timedOut).map(({ c, r }) => ({ c, n: r.left.length + r.added.length })).filter(x => x.n > 0);
  return leaky.length ? `Your tests leave temp folders (${leaky.map(x => `${x.c}: ${x.n} left`).join('; ')}): run them with node tools/starter.mjs test-run -- <your test command>` : '';
}
// The same check in its own process, started now; collect() gives its line from a file, or stops its tree and gives ''.
export function startTempHint(root, { timeout = HINT_LIMIT_MS } = {}) {
  let res = null;
  try { const base = path.join(TEST_ROOT, 'projects', projectSlug(root)); fs.mkdirSync(base, { recursive: true }); res = path.join(owned(base, 'hint-'), 'result.json'); } catch { return { collect: () => '' }; }
  const me = JSON.stringify(pathToFileURL(fileURLToPath(import.meta.url)).href);
  const kid = spawn(process.execPath, ['--input-type=module', '-e', `import fs from 'node:fs'; const { tempHint } = await import(${me}); const h = tempHint(${JSON.stringify(root)}, { timeout: ${Number(timeout)}, under: ${JSON.stringify(path.dirname(res))} }); fs.writeFileSync(${JSON.stringify(res)}, JSON.stringify(h));`], { stdio: 'ignore', windowsHide: true });
  const stop = () => { try { if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(kid.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }); else kid.kill('SIGKILL'); } catch { } };
  // (a stopped tree may hold its files a moment: a few tries, then the empty folders above go too)
  const cleanup = () => { const d = path.dirname(res); for (let i = 0; i < 10 && fs.existsSync(d); i++) { rm(d); if (fs.existsSync(d)) spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},200)'], { windowsHide: true }); } for (const p of [path.dirname(d), path.dirname(path.dirname(d)), TEST_ROOT]) try { fs.rmdirSync(p); } catch { break; } };
  return { collect: () => { let h = ''; if (fs.existsSync(res)) { try { h = JSON.parse(fs.readFileSync(res, 'utf8')) || ''; } catch { } } else stop(); cleanup(); return h; } };
}
