#!/usr/bin/env node
// The old suite under engine v2, compared by exact test name with the committed list of tests v2 still fails
// (tools/starter/reviews/v2-failing.txt). Fails when a test fails that is not on the list (a v2 regression), and when a
// listed test now passes (take it off the list in the same commit: the list only shrinks).
// Lesson (2026-11-08): the release chain ran the old suite under the old engine only, so a v2 regression in an old
// test passed the chain and shipped, three times in one day.
// usage: node tools/starter/v2-sweep.mjs [--from <selfcheck output file>] [--write]
//   --from   read an earlier run's output instead of running the suite (it takes a while)
//   --write  rewrite the list from this run; refused if it would add a name (a new failure is fixed, not listed)
//   --here   run in this folder, not on a frozen copy (only for a folder nothing else edits)
//   --freeze-only  make the frozen copy, print its folder and stop (for its test)
// The suite runs on a frozen copy of this folder as it is now, uncommitted and new files included (a detached git
// worktree under ~/.anzuelo-frozen, wired), so editing the engine in the main folder while it runs changes nothing under
// test. Inside a worktree already (the release chain's frozen copy) it runs in place. Lesson (2026-11-09): sweeps ran in
// the main folder, so the next fix waited idle for 10 to 15 minutes each time rather than change what was being tested.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIST = process.env.V2_SWEEP_LIST || path.join(ROOT, 'tools/starter/reviews/v2-failing.txt'); // (the env names another list, for its test)
const args = process.argv.slice(2), opt = k => args.includes(k) ? args[args.indexOf(k) + 1] : null;
const git = (a, cwd = ROOT) => spawnSync('git', a, { cwd, encoding: 'utf8', maxBuffer: 1 << 26 });
// (a linked worktree's git dir differs from the common one: it is a frozen copy already)
const linked = () => { const d = git(['rev-parse', '--absolute-git-dir']).stdout.trim(), c = git(['rev-parse', '--path-format=absolute', '--git-common-dir']).stdout.trim(); return !!d && !!c && path.resolve(d) !== path.resolve(c); };
function freeze() {
  const snap = git(['stash', 'create']).stdout.trim() || git(['rev-parse', 'HEAD']).stdout.trim();
  const base = process.env.V2_SWEEP_FROZEN || path.join(os.homedir(), '.anzuelo-frozen');
  const dir = path.join(base, `sweep-${snap.slice(0, 7)}-${Date.now()}`);
  fs.mkdirSync(base, { recursive: true });
  // (the copy an earlier failed run kept goes first: it holds the branch, and only the latest failed run is kept)
  const keep = path.join(base, 'last-failed-sweep.txt');
  try { drop(fs.readFileSync(keep, 'utf8').trim()); fs.rmSync(keep, { force: true }); } catch { }
  // (and the copies of runs killed before they ended, older than any live run. Lesson (2026-11-09): a stopped run's copy
  // stayed behind)
  for (const n of fs.readdirSync(base).filter(n => /^sweep-/.test(n))) { const d = path.join(base, n); try { if (Date.now() - fs.statSync(d).mtimeMs > 3 * 3600_000) drop(d); } catch { } }
  git(['worktree', 'prune']);
  // (on a branch, as the release chain's copy is: a test that clones the starter and pulls fails on a detached one. One
  // reused branch, reset each run, so none pile up. Lesson (the first frozen sweep): two upgrade tests failed "not on a
  // branch")
  const add = git(['worktree', 'add', '-q', '--force', '-B', 'v2-sweep', dir, snap]);
  if (add.status !== 0) throw new Error(`v2-sweep: could not make the frozen copy: ${add.stderr.trim()}`);
  // (new files git does not ignore are part of the batch too: "stash create" leaves them out)
  for (const f of git(['ls-files', '--others', '--exclude-standard', '-z']).stdout.split('\0').filter(Boolean)) {
    fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.copyFileSync(path.join(ROOT, f), path.join(dir, f));
  }
  fs.mkdirSync(path.join(dir, '.cache'), { recursive: true });
  return dir;
}
// (each frozen copy is removed when its run ends, pass or fail; only the last failed one stays, for debugging, until the
// next run starts. Lesson (a peer's review, 2026-11-09): copies piled up, a full engine copy per run, 4.5 GB)
let frozen = null;
function drop(d) { if (!d) return; git(['worktree', 'remove', '--force', d]); fs.rmSync(d, { recursive: true, force: true }); }
function release(failed) {
  if (!frozen) return;
  if (failed) {
    fs.writeFileSync(path.join(path.dirname(frozen), 'last-failed-sweep.txt'), frozen);
    console.log(`v2-sweep: the failed run's copy stays in ${frozen} for debugging (only the last failed one is kept)`);
  } else drop(frozen);
  git(['worktree', 'prune']);
}
let out;
if (args.includes('--freeze-only')) { console.log(linked() ? 'in place' : freeze()); process.exit(0); }
if (opt('--from')) out = fs.readFileSync(opt('--from'), 'utf8');
else {
  const here = args.includes('--here') || linked(), dir = here ? ROOT : freeze();
  if (!here) { frozen = dir; console.log(`v2-sweep: running on a frozen copy in ${dir}; the main folder is free to edit`); spawnSync(process.execPath, ['tools/hooks/wire.mjs'], { cwd: dir, encoding: 'utf8' }); }
  // (V2_SWEEP_SUITE names another suite inside the folder, for this script's own test)
  const r = spawnSync(process.execPath, [path.join(dir, process.env.V2_SWEEP_SUITE || 'tools/hooks/selfcheck.mjs'), '--full'], { cwd: dir, encoding: 'utf8', maxBuffer: 1 << 28, env: { ...process.env, STARTER_ENGINE: 'v2' } });
  out = `${r.stdout || ''}\n${r.stderr || ''}`;
  try { fs.mkdirSync(path.join(ROOT, '.cache'), { recursive: true }); fs.writeFileSync(path.join(ROOT, '.cache/v2-sweep.txt'), out); } catch { }
}
const total = /selfcheck: \w+[^\n]*\((\d+) passed, (\d+) failed/.exec(out);
if (!total) { release(true); console.error('v2-sweep: the suite printed no total line; it did not finish'); process.exit(2); }
// (a test's name is the text between "FAIL  " and "  -> ": the detail after it changes from run to run)
const failing = [...new Set([...out.matchAll(/^FAIL  (.+?)(?:  -> |$)/gm)].map(m => m[1].trim()))].sort();
const listed = fs.existsSync(LIST) ? fs.readFileSync(LIST, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#')) : [];
const have = new Set(listed), now = new Set(failing);
const newFails = failing.filter(n => !have.has(n)), fixed = listed.filter(n => !now.has(n));
if (args.includes('--write')) {
  release(!!(listed.length && newFails.length));
  if (listed.length && newFails.length) { console.error(`v2-sweep: refused, the list only shrinks; ${newFails.length} new failure(s):\n- ${newFails.join('\n- ')}`); process.exit(1); }
  fs.writeFileSync(LIST, `# Old-suite tests engine v2 still fails (tools/starter/v2-sweep.mjs). It only shrinks: a port takes its names off.\n${failing.join('\n')}\n`);
  console.log(`v2-sweep: wrote ${failing.length} name(s) (${total[1]} passed, ${total[2]} failed)`);
  process.exit(0);
}
// (a listed test that passes now is taken off the list by this run, which proves it: the list only shrinks, and only a
// new failure fails the sweep. Lesson (oversight, 2026-11-09): two release chains, an hour of machine time, failed only
// because ports made listed tests pass, good news read as a failure)
if (newFails.length) {
  console.log(`FAIL v2-sweep: ${newFails.length} test(s) fail under v2 that are not on the list (regressions):\n- ${newFails.slice(0, 40).join('\n- ')}`);
  if (fixed.length) console.log(`(also, ${fixed.length} listed test(s) pass now; a failing run leaves the list as it was):\n- ${fixed.slice(0, 40).join('\n- ')}`);
} else if (fixed.length) {
  const keep = listed.filter(n => now.has(n));
  fs.writeFileSync(LIST, `# Old-suite tests engine v2 still fails (tools/starter/v2-sweep.mjs). It only shrinks: a port takes its names off.\n${keep.join('\n')}\n`);
  console.log(`v2-sweep: ${fixed.length} listed test(s) pass now and are taken off the list (${listed.length} -> ${keep.length}):\n- ${fixed.slice(0, 40).join('\n- ')}`);
}
release(!!newFails.length);
console.log(`v2-sweep: ${newFails.length ? 'FAIL' : 'PASS'} (${total[1]} passed, ${total[2]} failed; ${newFails.length ? listed.length : listed.filter(n => now.has(n)).length} on the list)`);
process.exit(newFails.length ? 1 : 0);
