// Runs one hook call in a worker thread instead of a new node process, for the starter's own test suites: a worker
// starts no program, so it leaves none of the kernel records each program start outside System32 leaves for good
// (about one File object per start; plan docs/plans/2026-11-14-fewer-process-starts.md, Task 3). The shipped hook runs
// unchanged: this runner shims, inside the worker and before the hook is imported, what a separate process would have
// had of its own (its arguments, working folder, input, output, exit code and the working folder its own child
// programs start in). One worker per call, never reused, so no module state is shared between calls.
// Starter-only. runHook(dir, event, input, env) -> { out, err, status }, synchronous, like spawnSync.
import '../hooks/hidewin.mjs'; // child processes start hidden (no console windows)
import { Worker, isMainThread, workerData } from 'node:worker_threads';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const MAX = 4 * 1024 * 1024; // (output room per call: a hook's stdout and stderr together)

export function runHook(dir, event, input, env, { timeoutMs = 120000 } = {}) {
  const sab = new SharedArrayBuffer(8 + MAX), flag = new Int32Array(sab, 0, 2);
  // (no inherited node flags: a parent started with --input-type made the worker fail to load, and its error could not
  // reach the parent, which waits blocked)
  const w = new Worker(fileURLToPath(import.meta.url), { workerData: { dir, event, input, sab }, env, execArgv: [], stdout: true, stderr: true, stdin: false });
  w.unref();
  const done = Atomics.wait(flag, 0, 0, timeoutMs);
  if (done === 'timed-out') { w.terminate(); return { out: '', err: `[hook run ended: timed out after ${timeoutMs} ms in a worker]`, status: null }; }
  const len = flag[1], json = new TextDecoder().decode(new Uint8Array(sab, 8, len).slice());
  try { return JSON.parse(json); } catch { return { out: '', err: '[hook run ended: unreadable worker result]', status: null }; }
}

if (!isMainThread && workerData?.sab) {
  const { dir, event, input, sab } = workerData, flag = new Int32Array(sab, 0, 2);
  const fs = (await import('node:fs')).default, cp = (await import('node:child_process')).default;
  let out = '', err = '', sent = false;
  const send = code => { if (sent) return; sent = true;
    const bytes = new TextEncoder().encode(JSON.stringify({ out, err, status: code ?? 0 })).subarray(0, MAX);
    new Uint8Array(sab, 8, bytes.length).set(bytes); Atomics.store(flag, 1, bytes.length); Atomics.store(flag, 0, 1); Atomics.notify(flag, 0); };
  // (what a process of its own would have: arguments, working folder, input on fd 0, output, exit)
  const hook = path.join(dir, 'tools', 'hooks', 'hooks.mjs');
  process.argv = [process.execPath, hook, event];
  process.cwd = () => dir; process.chdir = () => { throw new Error('chdir is not available to a hook run in a test worker'); };
  const readFileSync = fs.readFileSync;
  fs.readFileSync = function (f, ...rest) { return f === 0 || f === '/dev/stdin' ? (rest[0] ? String(input) : Buffer.from(String(input))) : readFileSync.call(this, f, ...rest); };
  const text = c => typeof c === 'string' ? c : Buffer.from(c).toString('utf8');
  process.stdout.write = (c, ...r) => { out += text(c); const cb = r.find(x => typeof x === 'function'); if (cb) cb(); return true; };
  process.stderr.write = (c, ...r) => { err += text(c); const cb = r.find(x => typeof x === 'function'); if (cb) cb(); return true; };
  // (the hook's own child programs start in its folder, as they would from a process started there)
  for (const k of ['spawnSync', 'spawn', 'execSync', 'execFileSync', 'execFile', 'exec']) { const f = cp[k]; if (typeof f !== 'function') continue;
    cp[k] = function (...a) { const i = a.findIndex((x, j) => j > 0 && x && typeof x === 'object' && !Array.isArray(x)); if (i < 0) a.splice(k.startsWith('exec') && !k.startsWith('execFile') ? 1 : 2, 0, { cwd: dir }); else if (!a[i].cwd) a[i] = { ...a[i], cwd: dir }; return f.apply(this, a); }; }
  // (named imports of node:fs and node:child_process see the shims only once the builtin modules' ES exports are synced)
  (await import('node:module')).default.syncBuiltinESMExports();
  process.on('exit', code => send(code));
  for (const ev of ['uncaughtException', 'unhandledRejection']) process.on(ev, e => { err += `${e?.stack || e}\n`; process.exitCode = 1; send(1); process.exit(1); });
  try { await import(pathToFileURL(hook).href); } catch (e) { err += `${e?.stack || e}\n`; send(1); process.exit(1); }
}
