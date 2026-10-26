#!/usr/bin/env node
// Keyless web search through the ddgs command line tool, with clean output for scripts.
//   node skills/research/scripts/search.mjs <text|news|images|videos> "<query>" [count] [--json] [-t d|w|m|y] [-r region]
// Never installs anything and never uses a shell. Exit 0 = results, 1 = no results, 2 = bad usage or ddgs missing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const TYPES = ['text', 'news', 'images', 'videos'];
const args = process.argv.slice(2);
const json = args.includes('--json');
const opt = flag => { const i = args.indexOf(flag); if (i < 0) return null; const v = args[i + 1]; args.splice(i, 2); return v; };
const age = opt('-t');
const region = opt('-r');
const rest = args.filter(a => a !== '--json');
const [type, query, countArg] = rest;
const count = Number(countArg || 5);

function usage(msg) {
  if (msg) console.error(msg);
  console.error('usage: node search.mjs <text|news|images|videos> "<query>" [count] [--json] [-t d|w|m|y] [-r region]');
  process.exit(2);
}
if (!TYPES.includes(type) || !query) usage();
if (!Number.isInteger(count) || count < 1 || count > 50) usage('count must be a whole number from 1 to 50');
if (age && !['d', 'w', 'm', 'y'].includes(age)) usage('-t takes d, w, m or y');

const probe = spawnSync('ddgs', ['--help'], { encoding: 'utf8' });
if (probe.error || probe.status !== 0) {
  console.error('ddgs is not available in this shell. Ask the user before installing it (pip install ddgs), or use another web tool.');
  process.exit(2);
}

function runOnce() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'research-search-'));
  const file = path.join(dir, 'results.json');
  try {
    const cmd = [type, '-q', query, '-m', String(count), '-o', file];
    if (age) cmd.push('-t', age);
    if (region) cmd.push('-r', region);
    const r = spawnSync('ddgs', cmd, { encoding: 'utf8', timeout: 60_000 });
    if (r.status !== 0) return { error: (r.stderr || r.stdout || 'ddgs failed').trim().split('\n').slice(-3).join(' ') };
    if (!fs.existsSync(file)) return { results: [] };
    return { results: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch (e) {
    return { error: e.message };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

let out = runOnce();
if (!out.error && !out.results.length) {
  // empty usually means throttling: wait, then try exactly once more
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 4000);
  out = runOnce();
}
if (out.error) { console.error(`search failed: ${out.error}`); process.exit(1); }
if (!out.results.length) { console.error('no results (throttled, blocked, or a weak query): wait, rephrase, or use another tool'); process.exit(1); }

const link = r => r.href || r.url || r.content || r.image || '';
const snippet = r => (r.body || r.description || '').replace(/\s+/g, ' ').slice(0, 200);
if (json) console.log(JSON.stringify(out.results, null, 2));
else out.results.forEach((r, i) => {
  const when = r.date || r.published || '';
  console.log(`${i + 1}. ${r.title || '(no title)'}${when ? `  [${when}]` : ''}\n   ${link(r)}${snippet(r) ? `\n   ${snippet(r)}` : ''}`);
});
