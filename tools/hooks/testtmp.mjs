// Test folders: every fixture the self-tests, the trial and the sweeps make lives under one root, <temp>/anzuelo-tests,
// and is removed when the process that made it ends, passed or failed (a normal end, an error, Ctrl+C). What a killed run
// leaves is removed by "node tools/starter.mjs clean-tests" (older than 1 hour, under this root only), and by each new
// run of the self-tests. Lesson (oversight, 2026-11-11): about 11,000 fixture folders, nearly 2 million files, were left
// in the temp folder; the kernel kept memory for each file until a restart, and the machine lagged.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
// Leftovers of killed runs: entries under the root older than maxAgeMs (default 1 hour). Returns how many were removed.
export function cleanOld(maxAgeMs = 3600_000) {
  let n = 0;
  try { for (const e of fs.readdirSync(TEST_ROOT)) { const p = path.join(TEST_ROOT, e); try { if (Date.now() - fs.statSync(p).mtimeMs > maxAgeMs) { rm(p); n++; } } catch { } } } catch { }
  return n;
}
