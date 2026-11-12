#!/usr/bin/env node
// No leaks that slow the computer: what a test run or a release chain leaves behind, counted before and after.
//   node tools/starter/leaks.mjs --save <file>      write a snapshot
//   node tools/starter/leaks.mjs --compare <file>   compare now with it; exit 1 when a count rose past its budget
// Counts: entries in the temp folder and under <temp>/anzuelo-tests, files in the hooks' compile cache, whether Node's
// default compile cache grew, the test transcript folders in ~/.claude/projects, frozen copies, test processes still
// running, and the kernel pool (Windows). User rule, 2026-11-12: the engine and every project using it leave nothing
// that slows the computer; a compile cache had grown to about 2.65 million files without anyone seeing it.
import '../hooks/hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const T = os.tmpdir(), HOME = os.homedir();
const ls = d => { try { return fs.readdirSync(d); } catch { return []; } };
const mtime = d => { try { return fs.statSync(d).mtimeMs; } catch { return 0; } };
// (a rise of up to this much is not a leak: other programs use the temp folder too; a chain keeps its own frozen copy)
export const BUDGET = { temp: 25, tests: 2, cache: 600, nodeCache: 0, transcripts: 0, frozen: 1, processes: 0, pagedMB: 300 };

export function snapshot() {
  const cc = path.join(T, 'anzuelo-compile-cache'), nc = path.join(T, 'node-compile-cache');
  const s = {
    temp: ls(T).length,
    tests: ls(path.join(T, 'anzuelo-tests')).filter(n => n !== 'STOP').length + ls(path.join(T, 'anzuelo-tests', 'projects')).reduce((n, p) => n + ls(path.join(T, 'anzuelo-tests', 'projects', p)).length, 0),
    cache: ls(cc).reduce((n, v) => n + ls(path.join(cc, v)).length, 0),
    // (Node's default cache is only stat'ed: listing millions of files would itself take minutes)
    nodeCacheAt: Object.fromEntries(ls(nc).map(v => [v, mtime(path.join(nc, v))])),
    transcripts: ls(path.join(HOME, '.claude', 'projects')).filter(n => /AppData-Local-Temp/i.test(n)).length,
    frozen: ls(path.join(HOME, '.anzuelo-frozen')).length,
    processes: 0, pagedMB: null, nonpagedMB: null,
  };
  if (process.platform === 'win32') {
    const ps = spawnSync('powershell.exe', ['-NoProfile', '-Command', "$m = Get-CimInstance Win32_PerfRawData_PerfOS_Memory; $p = @(Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -match 'anzuelo-tests|anzuelo-frozen' -and $_.ProcessId -ne " + process.pid + " }).Count; '{0} {1} {2}' -f [math]::Round($m.PoolPagedBytes/1MB), [math]::Round($m.PoolNonpagedBytes/1MB), $p"], { encoding: 'utf8', timeout: 60000, windowsHide: true });
    const [pg, np, pr] = (ps.stdout || '').trim().split(/\s+/).map(Number);
    if (Number.isFinite(pg)) Object.assign(s, { pagedMB: pg, nonpagedMB: np, processes: pr });
  }
  return s;
}

// The rises past their budget, one plain line each ([] when nothing leaked)
export function compare(before, after, budget = BUDGET) {
  const out = [];
  for (const k of ['temp', 'tests', 'cache', 'transcripts', 'frozen']) if (after[k] - before[k] > budget[k]) out.push(`${k}: ${before[k]} -> ${after[k]} (budget +${budget[k]})`);
  const grew = Object.entries(after.nodeCacheAt || {}).filter(([v, t]) => t > (before.nodeCacheAt?.[v] || 0)).map(([v]) => v);
  if (grew.length > budget.nodeCache) out.push(`Node's default compile cache grew: ${grew.join(', ')}`);
  if (after.processes > budget.processes) out.push(`processes: ${after.processes} test processes still running`);
  if (before.pagedMB != null && after.pagedMB != null && after.pagedMB - before.pagedMB > budget.pagedMB) out.push(`kernel pool (paged): ${before.pagedMB} -> ${after.pagedMB} MB (budget +${budget.pagedMB})`);
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf('--save'), j = process.argv.indexOf('--compare');
  if (i > 0 && process.argv[i + 1]) { const s = snapshot(); fs.writeFileSync(process.argv[i + 1], JSON.stringify(s)); console.log(`leaks: snapshot saved (${JSON.stringify({ ...s, nodeCacheAt: undefined })})`); }
  else if (j > 0 && process.argv[j + 1]) {
    const before = JSON.parse(fs.readFileSync(process.argv[j + 1], 'utf8')), after = snapshot(), bad = compare(before, after);
    console.log(bad.length ? `LEAKS:\n${bad.map(l => `- ${l}`).join('\n')}` : 'leaks: none past the budget');
    process.exit(bad.length ? 1 : 0);
  } else { console.error('usage: node tools/starter/leaks.mjs --save <file> | --compare <file>'); process.exit(2); }
}
