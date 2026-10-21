// Run control for the hook self-tests (tools/hooks/selfcheck.mjs): the engine-result cache, one suite at a time per
// project, and how many helper processes a run may start. Kept apart from selfcheck.mjs so each part has a test.
// Lesson: in new projects the setup ran the 10 to 20 minute self-test 2 or 3 times, under load from other projects, and
// two setups were killed at the 60-minute limit while the engine they tested had not changed at all.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';

// --- engine-result cache -------------------------------------------------------------------------------------------
// The engine's scenarios run in the fixtures-only base (selfcheck.mjs base()), so their result is a function of that
// base's files, Node, the platform and the date (fixtures carry dates). The stamp hashes exactly those, so a recorded
// full pass is reused only for the same inputs. It lives in a cache for this machine, so every project made from the
// same engine shares it.
const SKIP_IN_MANIFEST = /^(\.git|\.memtest|state|node_modules)$/;
export function manifest(dir) {
  const out = [];
  const walk = rel => {
    let names = []; try { names = fs.readdirSync(path.join(dir, rel)).sort(); } catch { return; }
    for (const n of names) {
      if (SKIP_IN_MANIFEST.test(n)) continue;
      const r = rel ? `${rel}/${n}` : n, p = path.join(dir, r);
      let s; try { s = fs.lstatSync(p); } catch { continue; }
      if (s.isSymbolicLink()) continue;
      if (s.isDirectory()) walk(r);
      else { let h = ''; try { h = createHash('sha1').update(fs.readFileSync(p)).digest('hex'); } catch { } out.push([r, h]); }
    }
  };
  walk('');
  return out;
}
export const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// extra: [name, text] pairs for what the engine's tests read outside the base (engine files of the real project)
export function engineStamp(baseDir, extra = [], { day = localDay(), node = process.versions.node, platform = process.platform } = {}) {
  const h = createHash('sha256');
  h.update(`node ${String(node).split('.')[0]}\0${platform}\0${day}\0`);
  for (const [r, s] of manifest(baseDir)) h.update(`${r}\0${s}\n`);
  for (const [n, t] of extra) h.update(`extra ${n}\0${t}\n`);
  return h.digest('hex').slice(0, 24);
}
export const cacheFile = () => process.env.STARTER_SELFTEST_CACHE || path.join(os.homedir(), '.cache', 'project-starter', 'engine-passes.json');
function readCache(file = cacheFile()) { try { const j = JSON.parse(fs.readFileSync(file, 'utf8')); return Array.isArray(j.passes) ? j : { passes: [] }; } catch { return { passes: [] }; } }
export function findPass(stamp, file = cacheFile()) { return readCache(file).passes.find(p => p && p.stamp === stamp) || null; }
// a pass is recorded only when every engine test passed in a full run; the newest 40 are kept
export function recordPass(stamp, info, file = cacheFile()) {
  try {
    const j = readCache(file);
    j.passes = [{ stamp, at: new Date().toISOString(), ...info }, ...j.passes.filter(p => p && p.stamp !== stamp)].slice(0, 40);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(j, null, 1));
    fs.renameSync(tmp, file);
    return true;
  } catch { return false; }
}
// Every Nth engine scenario still runs when the results are reused: a smoke set that catches a broken machine (no git,
// a temp folder that can't be written) which the stamp cannot see.
export const SMOKE_EVERY = 40;

// --- one suite at a time per project ----------------------------------------------------------------------------------
// A second run while one is going waits for it and reuses its result, instead of doubling the load. A lock whose
// process is gone, or that is older than LOCK_MAX_MS, is stale and taken over.
// Lesson: agents started a second audit or self-test while the first was still running in the background.
export const LOCK_MAX_MS = 3 * 3600_000;
export const alive = pid => { if (!Number.isInteger(pid) || pid <= 0) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
export function lockState(lockFile, now = Date.now()) {
  const l = readJSON(lockFile);
  if (!l) return fs.existsSync(lockFile) ? { stale: true, why: 'unreadable' } : null;
  if (!alive(l.pid)) return { ...l, stale: true, why: `its process ${l.pid} is gone` };
  if (now - Date.parse(l.at || 0) > LOCK_MAX_MS) return { ...l, stale: true, why: `older than ${LOCK_MAX_MS / 3600_000} hours` };
  return { ...l, stale: false };
}
// takes the lock (true), or returns the live holder
export function takeLock(lockFile, info) {
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  for (let i = 0; i < 2; i++) {
    try { fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, at: new Date().toISOString(), ...info }), { flag: 'wx' }); return { taken: true }; }
    catch (e) {
      if (e.code !== 'EEXIST') return { taken: true, error: e.message }; // can't lock (read-only folder): run anyway
      const st = lockState(lockFile);
      if (st && !st.stale) return { taken: false, holder: st };
      try { fs.rmSync(lockFile, { force: true }); } catch { }
    }
  }
  return { taken: true };
}
export function releaseLock(lockFile) { const l = readJSON(lockFile); if (l && l.pid === process.pid) try { fs.rmSync(lockFile, { force: true }); } catch { } }

// --- helper processes scaled to the machine and to the suites already running ----------------------------------------
// os.loadavg() is always 0 on Windows, so the load is counted directly: each running suite registers itself in a folder
// for this machine, and a run shares the CPUs with the live ones. Lesson: eight projects set up at once, each with 12
// helpers, and every suite took two to four times as long.
export const runningDir = () => process.env.STARTER_SELFTEST_RUNNING || path.join(os.tmpdir(), 'starter-selftest-running');
export function otherSuites(dir = runningDir()) {
  let n = 0;
  for (const f of (() => { try { return fs.readdirSync(dir); } catch { return []; } })()) {
    const m = /^(\d+)\.json$/.exec(f); if (!m) continue;
    const pid = Number(m[1]);
    if (pid === process.pid) continue;
    if (alive(pid)) n++; else try { fs.rmSync(path.join(dir, f), { force: true }); } catch { }
  }
  return n;
}
export function registerSuite(info, dir = runningDir()) {
  try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, `${process.pid}.json`), JSON.stringify({ at: new Date().toISOString(), ...info })); } catch { }
  return () => { try { fs.rmSync(path.join(dir, `${process.pid}.json`), { force: true }); } catch { } };
}
// cpus: logical CPUs; others: suites already running; tests: how many will run here (40 per helper at least)
export function shardCount({ cpus = os.cpus().length, others = 0, tests = 0, max = 12 } = {}) {
  const share = Math.floor(Math.max(1, cpus - 1) / (1 + Math.max(0, others)));
  return Math.max(1, Math.min(max, share, Math.ceil(tests / 40)));
}
