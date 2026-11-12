// Run control for the hook self-tests (tools/hooks/selfcheck.mjs): the engine-result cache, one suite at a time per
// project, and how many helper processes a run may start. Kept apart from selfcheck.mjs so each part has a test.
// Lesson: in new projects the setup ran the 10 to 20 minute self-test 2 or 3 times, under load from other projects, and
// two setups were killed at the 60-minute limit while the engine they tested had not changed at all.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

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
// The main checkout of a linked git worktree, or null for a main checkout or no repository. A whole pass in a frozen
// worktree of a commit is recorded there too, and the main folder's end check takes it only when its own tested files
// hash the same. Lesson: the full self-test passed on a frozen copy of the exact commit, and the main folder's check
// asked for it again in four turns.
export function mainCheckout(dir) {
  const git = a => (spawnSync('git', ['-C', dir, 'rev-parse', '--path-format=absolute', a], { encoding: 'utf8' }).stdout || '').trim();
  const common = git('--git-common-dir'), own = git('--git-dir');
  if (!common || !own || path.resolve(common) === path.resolve(own) || path.basename(common) !== '.git') return null;
  return path.dirname(common);
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

// --- the starter's own proof ------------------------------------------------------------------------------------------
// The starter runs every engine test on itself, and a whole run that passes writes PROOF_FILE: a hash of the engine as
// the tests saw it (proofHash of its fixtures base). new-project copies that file with the engine. In a project whose
// fixtures base hashes the same, byte for byte, that run already proved the engine, so the project's run needs only its
// own scenarios and checks and a smoke set that proves this machine and Node run it. A changed engine file, a linked
// starter with another engine, --full or --deep runs everything. The starter itself always runs everything.
// Lesson: every new project's setup waited 5 to 16 minutes for the first full run of about 980 engine tests on an
// engine the starter had already passed, because the result cache only knew passes made on that machine.
export const PROOF_FILE = 'tools/hooks/engine-proof.json';
// What the proof covers, in a fixtures base: the engine's code, checks, core runbooks and checklists, the core skills,
// every pack and library payload, and the settings the fixtures run with (without the pack list, which only decides
// which scenarios apply). The project's own content never reaches the base, and the hash leaves it out anyway.
// (every engine module the hooks import is in it: a changed base-checks.mjs with the old proof would reuse a pass the
// new code never had)
export const PROOF_PATHS = /^(tools\/hooks\/(hooks|hooks-main|hidewin|testtmp|fitstale|fit|state|shell|runs|transcript|setupinfo|setup|selfcheck|selftest-cache|trigger-cases|git-guard|wire|paths|settings|repo|people|labels|base-checks|wakeups|injection|claims|grant|count|datadirs|names|rootfiles|menu|history|writing|excuse|extstop|decide|worth|gui|correct|praise|planreq|near|skilllearn|hooktests|donewhen|gates|launchers|trace|proof|knowledge|jsonl|selfcmds|pause|caps|relay|statusline)\.mjs|tools\/hooks\/v2\/[^/]+\.mjs|tools\/hooks\/engine-checks\.json|tools\/(audit|packs|writing-check|integrity-check|skills|starter|recall|survey|dedupe|fit)\.mjs|\.githooks\/[^/]+|docs\/checks\/(session-checklist|finish-checklist|runbook-standards|writing-standards|layout-standards|better-or-worse)\.md|docs\/playbooks\/(_TEMPLATE|_fallback|project|plan)\.md|packs\/.+|library\/.+)$/;
export function proofHash(baseDir, coreSkills = []) {
  const h = createHash('sha256');
  const core = new RegExp(`^skills\\/(${coreSkills.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') || '(?!)'})\\/`);
  // (text is compared with its line endings made the same, so a checkout with CRLF proves the same engine)
  const text = p => { const b = fs.readFileSync(p); return /\.(mjs|js|json|md|txt|html?|css|ya?ml|py|sh)$|^[^.]+$/i.test(path.basename(p)) ? Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n')) : b; };
  for (const [r] of manifest(baseDir)) if (PROOF_PATHS.test(r) || core.test(r)) { h.update(`${r}\0`); try { h.update(text(path.join(baseDir, r))); } catch { } h.update('\n'); }
  let cfg = {}; try { cfg = JSON.parse(fs.readFileSync(path.join(baseDir, 'tools/hooks/config.json'), 'utf8')); } catch { }
  for (const k of ['packs', 'externalHooks', 'hookContract', '_comment']) delete cfg[k];
  const canon = v => Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v;
  h.update(`config\0${JSON.stringify(canon(cfg))}`);
  return h.digest('hex').slice(0, 24);
}
export function readProof(dir) { try { const j = JSON.parse(fs.readFileSync(path.join(dir, PROOF_FILE), 'utf8')); return j && typeof j.engine === 'string' ? j : null; } catch { return null; } }
// written only when it changes, so a passing run on an unchanged engine leaves the file as it was. `commit` is the
// commit the run tested, when its files were exactly that commit's (testedCommit); a run on changed files leaves it out.
// `speed`: whether each suite's time limits were judged with the machine to itself ({ stop, v2 }), not only noted.
export function writeProof(dir, engine, tests, commit = null, speed = null) {
  const now = readProof(dir);
  if (now && now.engine === engine && now.tests === tests && (!commit || now.commit === commit) && JSON.stringify(now.speed ?? null) === JSON.stringify(speed)) return false;
  fs.writeFileSync(path.join(dir, PROOF_FILE), JSON.stringify({ _comment: 'Written by tools/hooks/selfcheck.mjs in the starter when every test passes: the hash of the engine those tests ran on, and the commit they tested when the files were exactly that commit. A project whose engine hashes the same reuses that result (tools/hooks/selftest-cache.mjs); the starter is pushed only for that commit (git-guard.mjs pre-push). Do not edit.', engine, tests, ...(commit ? { commit } : {}), ...(speed ? { speed } : {}) }, null, 2) + '\n');
  return true;
}
// The starter's records a passing run or a release writes after the tests: no engine change, so a commit that differs
// from the tested one only in these is still the tested engine.
export const PROOF_RECORDS = ['tools/hooks/engine-proof.json', 'tools/starter/STATUS.md', 'tools/starter/dogfood-log.md', 'tools/starter/STARTER-CHANGELOG.md', 'tools/starter/trials/rounds.json'];
// (plans are records too, never engine code: a plan note written while a release runs does not undo its proof.
// Oversight, 2026-11-10)
export const isProofRecord = f => PROOF_RECORDS.includes(f) || /^docs\/plans\/[^/]+\.md$/.test(f);
const gitIn = (dir, ...a) => { const r = spawnSync('git', ['-C', dir, ...a], { encoding: 'utf8' }); return r.status === 0 ? r.stdout : null; };
// The commit a run tests: HEAD, when nothing but the records differs from it (tracked or new files). Otherwise null.
export function testedCommit(dir) {
  const head = gitIn(dir, 'rev-parse', 'HEAD')?.trim(), st = gitIn(dir, 'status', '--porcelain');
  if (!head || st == null) return null;
  const changed = st.split('\n').filter(Boolean).map(l => l.slice(3).replace(/^"|"$/g, '').replace(/^.* -> /, ''));
  return changed.every(isProofRecord) ? head : null;
}
// REQ: starter-tested. Is the commit `sha` proved? Its own copy of the proof must name a tested commit whose files differ
// from `sha` only in the records. Read from the commit itself, so nothing a later or partial run writes can make it
// pass or fail. Lesson: the push gate read a record of the last run on this machine, and a run of the old suite under
// the new engine (failing by design) overwrote it, so a tested release was refused until the whole suite ran again.
export function proofCovers(dir, sha) {
  let proof = null; try { proof = JSON.parse(gitIn(dir, 'show', `${sha}:${PROOF_FILE}`) || 'null'); } catch { }
  if (!proof?.commit) return { ok: false, why: `no proof of a passing whole self-test names a tested commit in ${sha.slice(0, 7)}` };
  // (the time limits judged once with the machine to itself: a limit only noted beside other runs proves no speed.
  // Lesson (oversight, 2026-11-09): with limits noted, not failed, under load, a machine always busy during the release
  // run would never judge them, and a slow engine could ship)
  const unjudged = ['stop', 'v2'].filter(k => proof.speed?.[k] !== true);
  if (unjudged.length) return { ok: false, why: `the tested commit ${String(proof.commit).slice(0, 7)} never had its time limits judged with the machine to itself (${unjudged.join(', ')}: only noted beside other self-test runs, or not run). Run the release chain again when no other self-test runs` };
  const diff = gitIn(dir, 'diff', '--name-only', proof.commit, sha);
  if (diff == null) return { ok: false, why: `the tested commit ${String(proof.commit).slice(0, 7)} is not in this repository` };
  // (the list of tests v2 may still fail counts as a record only when it shrank: the release run removes the tests that
  // pass now; a test added to it would weaken the run without a new one)
  const V2_LIST = 'tools/starter/reviews/v2-failing.txt';
  const lines = c => new Set(String(gitIn(dir, 'show', `${c}:${V2_LIST}`) || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean));
  const shrank = () => { const was = lines(proof.commit); return [...lines(sha)].every(l => was.has(l)); };
  // (so does the count of requirement tags with no v2 test, only when it went down: the audit lowers it itself)
  const V2_COUNT = 'tools/starter/reviews/v2-untested.txt', count = c => parseInt(String(gitIn(dir, 'show', `${c}:${V2_COUNT}`) || ''), 10);
  // (a tested commit from before the file held the number in tools/audit.mjs: 114 then)
  const lowered = () => { const w = count(proof.commit), was = Number.isFinite(w) ? w : 114, now = count(sha); return Number.isFinite(now) && now < was; };
  // (so does the retired list, only when it shrank: the release run drops the entries of tests that pass now. Lesson
  // (release of d880341): a run that dropped two such entries was refused, and the list had to be put back by hand)
  const V2_RETIRED = 'tools/starter/reviews/v2-retired.txt';
  const retiredShrank = () => { const was = new Set(String(gitIn(dir, 'show', `${proof.commit}:${V2_RETIRED}`) || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean));
    return String(gitIn(dir, 'show', `${sha}:${V2_RETIRED}`) || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean).every(l => was.has(l)); };
  const extra = diff.split('\n').filter(f => f && !isProofRecord(f) && !(f === V2_LIST && shrank()) && !(f === V2_COUNT && lowered()) && !(f === V2_RETIRED && retiredShrank()));
  return extra.length ? { ok: false, why: `${sha.slice(0, 7)} changed ${extra.length} file(s) since the tested commit ${proof.commit.slice(0, 7)}: ${extra.slice(0, 3).join(', ')}` } : { ok: true };
}

// --- who has to fix a failing test ------------------------------------------------------------------------------------
// In a project, a failed run says plainly whose failure each one is. The project's own scenarios and checks are fixed
// here. The engine's run in a copy that has only the starter's files, so the project's notes, runbooks and tools cannot
// cause them: either the project changed an engine file (named), or the engine as shipped fails on this machine, which is
// reported to the starter instead of chased with reruns.
// Lesson: agents reworded their own notes and reran the 10-minute self-test up to five times for an engine test failure.
export function failureCause({ engineFailed = [], projectFailed = [], changed = [] } = {}) {
  const out = [], few = l => `${l.slice(0, 5).join(' | ')}${l.length > 5 ? ` | and ${l.length - 5} more` : ''}`;
  if (projectFailed.length) out.push(`project tests failed (caused by this project, fix them here: its own scenarios in tools/hooks/project-scenarios.mjs and its checks in tools/hooks/requirements.json): ${few(projectFailed)}`);
  if (engineFailed.length) out.push(changed.length
    ? `engine tests failed (caused by this project's changes to engine files, fixable here): they run in a copy with only the starter's files, and these engine files differ from the starter's: ${few(changed)}. Fix or restore them; this project's notes, runbooks and tools are not in that copy, so rewording them changes nothing: ${few(engineFailed)}`
    : `engine tests failed (caused by the engine, not by this project): they run in a copy with only the starter's files, so nothing in this project can fix them and a rerun gives the same result. Report it once with node tools/starter.mjs feedback "<test name>: <its why>", say so in the answer, and go on: ${few(engineFailed)}`);
  return out;
}

// --- one suite at a time per project----------------------------------------------------------------------------------
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
// (busy: only the runs still working; a run that only waits for its turn to time a hook adds no load. Lesson (two
// projects): two runs waited for each other at the timing test for the full 10 minutes, then timed at the same moment,
// and one counted the other as gone and failed on the other's load)
export function otherSuites(dir = runningDir(), { busy = false } = {}) {
  let n = 0;
  for (const f of (() => { try { return fs.readdirSync(dir); } catch { return []; } })()) {
    const m = /^(\d+)\.json$/.exec(f); if (!m) continue;
    const pid = Number(m[1]);
    if (pid === process.pid) continue;
    if (!alive(pid)) { try { fs.rmSync(path.join(dir, f), { force: true }); } catch { } continue; }
    if (!(busy && readJSON(path.join(dir, f))?.waiting)) n++;
  }
  return n;
}
// marks this run as only waiting (or working again), and the turn to time a hook: one run at a time on the machine
export function markWaiting(waiting, dir = runningDir()) {
  const f = path.join(dir, `${process.pid}.json`), cur = readJSON(f);
  if (cur) try { fs.writeFileSync(f, JSON.stringify({ ...cur, waiting: !!waiting })); } catch { }
}
export const timingLock = (dir = runningDir()) => path.join(dir, 'timing.lock');
// Waits, as a run that adds no load, until no other self-test run is working and the turn to time is this run's, up to
// `ms`. True when it got both (the caller releases the lock); false when the wait ran out.
export async function waitQuiet(ms, { dir = runningDir(), step = 5000 } = {}) {
  markWaiting(true, dir);
  try {
    for (const t0 = Date.now(); ; await new Promise(r => setTimeout(r, step))) {
      if (!otherSuites(dir, { busy: true }) && takeLock(timingLock(dir), { what: 'v2 timing' }).taken) return true;
      if (Date.now() - t0 >= ms) return false;
    }
  } finally { markWaiting(false, dir); }
}
// The v2 self-test's release-mode verdict on its time limits, read by the whole self-test into the proof: { commit, judged }
export const SPEED_RECORD = '.cache/speed-judged.json';
// The hooks that got slower than the last released proof's times on the same machine, by more than pct: a slowdown
// that still sits under the fixed limit is caught too. prev and cur: { machine, prompt, pretool } (each hook's whole run,
// fastest of its samples, in ms). A different machine, or no earlier times, compares nothing. Oversight, 2026-11-11.
// (the machine as a short hash: the proof is published, and the computer's name is a private detail. Lesson: the
// publish-safety sweep caught the raw name in the first proof that kept times)
export const machineId = () => createHash('sha1').update(`${os.hostname()}|${(os.cpus()[0] || {}).model || ''}|${os.cpus().length}`).digest('hex').slice(0, 12);
export function slowerThan(prev, cur, pct = 0.15) {
  if (!prev || !cur || !prev.machine || prev.machine !== cur.machine) return [];
  return ['prompt', 'pretool'].filter(k => Number(prev[k]) > 0 && Number(cur[k]) > Number(prev[k]) * (1 + pct)).map(k => `${k} ${cur[k]} ms against ${prev[k]} ms at the last release`);
}
// (the last run out removes the empty folder, so a finished run leaves nothing in the temp folder; a run that registers
// while another removes it makes the folder again. Lesson (oversight, 2026-11-11): leftovers in the temp folder)
export function registerSuite(info, dir = runningDir()) {
  const f = path.join(dir, `${process.pid}.json`), body = JSON.stringify({ at: new Date().toISOString(), ...info });
  for (let i = 0; i < 3; i++) try { fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(f, body); break; } catch { }
  return () => { try { fs.rmSync(f, { force: true }); } catch { } try { fs.rmdirSync(dir); } catch { } };
}
// cpus: logical CPUs; others: suites already running; tests: how many will run here (40 per helper at least)
export function shardCount({ cpus = os.cpus().length, others = 0, tests = 0, max = 12 } = {}) {
  const share = Math.floor(Math.max(1, cpus - 1) / (1 + Math.max(0, others)));
  return Math.max(1, Math.min(max, share, Math.ceil(tests / 40)));
}
