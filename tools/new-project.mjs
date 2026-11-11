#!/usr/bin/env node
// Bring this starter into a project folder, from anywhere: node "<starter>/tools/new-project.mjs" "<project folder>"
// With no mode flag the folder decides: empty or missing → a new project; made from the starter → upgrade its engine;
// anything else → adopt it (existing files are never overwritten). Flags force a mode:
//   node tools/new-project.mjs "<folder>" [--name "Name"] [--desc "one line"] [--git]   new project (core + pack payloads)
//   add --auto to run without questions: setup assumes the answers (recorded as assumed) and the agent decides
//   node tools/new-project.mjs "<folder>" --adopt     add the starter to an existing project (keeps every existing file)
//   node tools/new-project.mjs "<folder>" --upgrade   refresh only the engine (hooks, tools, core skills and standards).
//     It audits and times the hooks before and after, rolls back if a check that passed now fails (--accept-findings
//     keeps the upgrade and lists them to fix), and writes an upgrade review to docs/DECISIONS.md: every new rule, pack,
//     skill, finding and slowdown, each to adopt or decline with the user. The hooks hold work until it is decided.
//   node tools/new-project.mjs "<folder>" --add-pack <name>   make a pack available in a project (then: packs.mjs install)
//   node tools/new-project.mjs "<folder>" --add-skill <name>  copy a skill from the starter's library into a project's skills/
//   node tools/new-project.mjs "<folder>" --remove    take the engine out: unwire its hooks, remove its files (backed up
//     in .cache/engine-removed/), keep everything the project wrote
//   node "<a starter clone in a project's folder>/tools/new-project.mjs" --self-install [--git] [--beside]   that folder
//     becomes the project, with the engine and all it makes in its .anzuelo/ folder; --beside makes a classic project
//     there instead, linked to a starter copy next to it
//   add --dry-run to see what would happen (a summary; --verbose lists every file); --dev allows a development copy (.starter-dev) for throwaway test projects
// The AI installs packs during setup (SETUP-PROMPT.md): it asks what the project is about and picks only what fits.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CORE_SKILLS, today as localToday, usageOf, isEngineCheck, shippedChecks, checkKey, ENGINE_CHECKS_HISTORY, changelogSince, breakingItems, upgradeReport, withReviewBlock, fastestBench, probeEngine, noteEngineChange } from './hooks/hooks.mjs';
import { wire } from './hooks/wire.mjs';
import { dataLikeDirs } from './hooks/datadirs.mjs';
import { carryRunEach } from './hooks/selfcmds.mjs';

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const starterHead = () => (spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: STARTER, encoding: 'utf8' }).stdout || '').trim() || 'the newest starter';

// Engine: generic machinery, replaced on --upgrade. Everything else is the project's own content.
const ENGINE = [
  'tools/hooks/hooks.mjs', 'tools/hooks/selfcheck.mjs', 'tools/hooks/selftest-cache.mjs', 'tools/hooks/trigger-cases.mjs', 'tools/hooks/git-guard.mjs', 'tools/hooks/statusline.mjs', 'tools/hooks/paths.mjs', 'tools/hooks/settings.mjs', 'tools/hooks/repo.mjs', 'tools/hooks/people.mjs', 'tools/hooks/labels.mjs', 'tools/hooks/base-checks.mjs', 'tools/hooks/wakeups.mjs', 'tools/hooks/injection.mjs', 'tools/hooks/jsonl.mjs', 'tools/hooks/selfcmds.mjs', 'tools/hooks/pause.mjs', 'tools/hooks/caps.mjs', 'tools/hooks/relay.mjs', 'tools/hooks/claims.mjs', 'tools/hooks/grant.mjs', 'tools/hooks/count.mjs', 'tools/hooks/datadirs.mjs', 'tools/hooks/names.mjs', 'tools/hooks/rootfiles.mjs', 'tools/hooks/menu.mjs', 'tools/hooks/history.mjs', 'tools/hooks/writing.mjs', 'tools/hooks/excuse.mjs', 'tools/hooks/extstop.mjs', 'tools/hooks/decide.mjs', 'tools/hooks/worth.mjs', 'tools/hooks/gui.mjs', 'tools/hooks/correct.mjs', 'tools/hooks/praise.mjs', 'tools/hooks/planreq.mjs', 'tools/hooks/near.mjs', 'tools/hooks/skilllearn.mjs', 'tools/hooks/hooktests.mjs', 'tools/hooks/donewhen.mjs', 'tools/hooks/gates.mjs', 'tools/hooks/launchers.mjs', 'tools/hooks/trace.mjs', 'tools/hooks/proof.mjs', 'tools/hooks/knowledge.mjs', 'tools/audit.mjs', 'tools/always.mjs', 'tools/packs.mjs',
  'tools/writing-check.mjs', 'tools/integrity-check.mjs',
  '.githooks/commit-msg', '.githooks/pre-commit', '.githooks/pre-push',
  'docs/checks/session-checklist.md', 'docs/checks/finish-checklist.md', 'docs/checks/runbook-standards.md',
  'docs/checks/writing-standards.md', 'docs/checks/layout-standards.md', 'docs/recommended-tools.md', 'docs/checks/better-or-worse.md',
  'docs/playbooks/_TEMPLATE.md', 'docs/playbooks/_fallback.md', 'docs/playbooks/project.md', 'docs/playbooks/plan.md', 'docs/playbooks/status-lines.md', 'docs/playbooks/trigger-words.md', 'docs/playbooks/engine.md', 'HOW-TO-USE.md', 'tools/skills.mjs', 'tools/starter.mjs', 'tools/recall.mjs', 'tools/hooks/wire.mjs', 'tools/survey.mjs', 'tools/dedupe.mjs', 'tools/fit.mjs',
  'tools/hooks/engine-checks.json', 'tools/hooks/engine-checks-history.json', 'tools/hooks/defaults.json', 'tools/hooks/SETTINGS.md',
  // the starter's proof that its full self-test passed on this engine: a project with the same engine reuses it
  // (selftest-cache.mjs PROOF_FILE). Lesson: each new project's setup ran the whole engine suite again first.
  'tools/hooks/engine-proof.json',
  // engine v2, every file of its folder (hooks.mjs imports them for the prompt and Stop hooks). Lesson (two projects):
  // the list named none of them, so after v2 became the default every upgraded project's prompt and Stop hooks failed
  // to load it, and the error went only to the transcript: no reminder and no end check, for days
  ...fs.readdirSync(path.join(STARTER, 'tools/hooks/v2')).filter(f => f.endsWith('.mjs')).map(f => `tools/hooks/v2/${f}`)
];
// The engine's own runbooks (hooks.mjs CORE_RUNBOOKS: project, plan, status-lines, trigger-words, engine; and _fallback, _TEMPLATE) are engine like the core
// skills: replaced on upgrade, keeping the project's added triggers, its "## Project lessons" section and its
// hardened/harden/keep marks (mergeSkill). Lesson: project.md was in neither list, so upgraded projects kept an old copy
// whose "Done when" items had no (hook:)/(judgment:) labels, and done-when-labeled fired on the engine's own runbook.
// Added on upgrade only when missing: the project may have tuned them.
// (docs/checks/always.md holds the project's own standing rules: made once, never replaced)
const ENGINE_IF_MISSING = ['tools/hooks/project-scenarios.mjs', 'docs/plans/README.md', 'docs/security.md', 'docs/names.json', 'docs/glossary.md', 'docs/checks/always.md'];
// Core skills are engine too: an upgrade replaces each whole folder (SKILL.md, references, scripts, LICENSE, SOURCE).
// Engine skills merged into another (the old folder and its checks go on upgrade), and pack runbooks whose job an engine
// skill took over (the upgrade review offers to merge them; the project may have tuned them).
const RETIRED_CORE = { 'web-search': { into: 'research', tags: ['search-cited'] } };
const RETIRED_FILES = ['tools/hooks/test-hooks.mjs'];
// Engine files that were renamed: references in the project's own docs move with them (paths only).
const RENAMED_FILES = { 'tools/hooks/test-hooks.mjs': 'tools/hooks/selfcheck.mjs' };
const MERGED_RUNBOOKS = { research: 'research', 'answer-question': 'research' };
// Pack files that are engine too: refreshed on upgrade when the project has the pack.
const PACK_ENGINE = { gui: ['tools/screenshot.mjs', 'docs/checks/visual-review.md', 'skills/gui-review-loop/'] };
for (const s of CORE_SKILLS) (function walk(d) {
  const at = path.join(STARTER, d);
  if (!fs.existsSync(at)) return;
  for (const n of fs.readdirSync(at)) { const p = `${d}/${n}`; fs.statSync(path.join(STARTER, p)).isDirectory() ? walk(p) : ENGINE.push(p); }
})(`skills/${s}`);
// Never copied into a project: the starter's own files, personal or machine state, and generated output.
const NEVER = new Set(['.git', 'node_modules', '.cache', 'state', '.starter-template', '.starter-dev', 'trial.mjs', '.private-terms', 'New Project.bat', 'settings.local.json', '.codex', 'starter.local.json', '.starter', '.obsidian', 'feedback-inbox', 'starter-feedback.md', 'fit-checklist.md']);
const TEXT = /\.(md|mjs|js|json|txt)$/;

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const target = args.find((a, i) => !a.startsWith('--') && !['--name', '--desc', '--add-pack', '--add-skill'].includes(args[i - 1]));
const dry = flag('--dry-run');
// Self-install: a clone of the starter made straight into a project's folder sets that project up. The starter moves
// to its own copy, and the project is made from that copy and linked to it, so it upgrades from it. Lesson (a field report): a clone into a new project's folder left the agent
// guessing where the starter belongs, and the user had to know the layout.
if (flag('--self-install')) {
  const git = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
  const fail = m => { console.error(m); process.exit(1); };
  if (fs.existsSync(path.join(STARTER, '.starter-dev'))) fail(`${STARTER} is a development copy of the starter: it never becomes a project.`);
  if (!fs.existsSync(path.join(STARTER, '.git'))) fail(`${STARTER} is not a git clone of the starter: run node tools/new-project.mjs "<project folder>" instead.`);
  const dirty = (git(STARTER, 'status', '--porcelain').stdout || '').trim();
  if (dirty) fail(`${STARTER} has changes of its own, so it is left as it is:\n${dirty}`);
  const url = (git(STARTER, 'remote', 'get-url', 'origin').stdout || '').trim();
  const repo = path.basename(url.replace(/\.git$/, '').replace(/[\\/]+$/, '')) || 'starter';
  const proj = opt('--name') || path.basename(STARTER);
  // (a clone in a folder named after the repository is what "git clone" makes inside the project's folder: the parent is
  // the project, and the engine goes into its .anzuelo/; the clean clone is removed after. Lesson (the user, 2026-11-08):
  // a clone made inside a new project's folder was taken for a starter copy, and the agent asked where the project goes)
  if (proj.toLowerCase().startsWith(repo.toLowerCase()) && !opt('--name') && !flag('--beside')) {
    const parent = path.dirname(STARTER), name = path.basename(parent);
    console.log(`Self-install: ${STARTER} is a clone inside ${parent}, so ${parent} becomes the project "${name}", with the engine in ${path.join(parent, '.anzuelo')}; this clone is removed after.`);
    if (dry) { console.log('Dry run, nothing written.'); process.exit(0); }
    if (flag('--git') && !fs.existsSync(path.join(parent, '.git'))) git(parent, 'init', '-q');
    const r = spawnSync(process.execPath, [path.join(STARTER, 'tools/starter.mjs'), 'install', parent, '--name', name, ...(opt('--desc') ? ['--desc', opt('--desc')] : [])], { stdio: 'inherit' });
    if (r.status !== 0) fail(`Installing failed; ${parent} keeps its files, and this clone is left as it is.`);
    try { process.chdir(parent); fs.rmSync(STARTER, { recursive: true, force: true }); } catch { console.log(`(remove ${STARTER} by hand: it is no longer needed)`); }
    console.log(`\nOpen ${parent} with your agent and say "set up this project".`);
    process.exit(0);
  }
  if (proj.toLowerCase().startsWith(repo.toLowerCase())) fail(`${STARTER} is named as a starter copy, not a project: run its tools/new-project.mjs "<project folder>".`);
  // (by default the folder becomes the project with everything of the engine in its .anzuelo/ folder: the engine's own
  // clone in .anzuelo/engine, what it makes for the project in .anzuelo/local (starter.mjs install). --beside instead
  // makes a classic project here, with the starter's copy next to it. The user, 2026-11-08: one folder per project,
  // and everything of the engine inside it, in .anzuelo)
  const beside = flag('--beside');
  const head = (git(STARTER, 'rev-parse', 'HEAD').stdout || '').trim();
  if (!beside) {
    console.log(`Self-install: ${STARTER} becomes the project "${proj}", with the engine (at ${head.slice(0, 7)}) and everything it makes in ${path.join(STARTER, '.anzuelo')}.`);
    if (dry) { console.log('Dry run, nothing written.'); process.exit(0); }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-self-')), src = path.join(tmp, repo);
    try {
      if (git(tmp, 'clone', '-q', STARTER, src).status !== 0) fail('Could not copy the starter aside; nothing was changed.');
      if (url) git(src, 'remote', 'set-url', 'origin', url);
      // (the clone here is exactly the commit just copied, with nothing of its own: the folder is emptied for the project)
      for (const n of fs.readdirSync(STARTER)) fs.rmSync(path.join(STARTER, n), { recursive: true, force: true });
      if (flag('--git')) git(STARTER, 'init', '-q');
      const r = spawnSync(process.execPath, [path.join(src, 'tools/starter.mjs'), 'install', STARTER, '--name', proj, ...(opt('--desc') ? ['--desc', opt('--desc')] : [])], { stdio: 'inherit' });
      if (r.status !== 0) fail(`Installing failed; clone the starter again into ${STARTER} and retry.`);
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
    console.log(`\nOpen ${STARTER} with your agent and say "set up this project".`);
    process.exit(0);
  }
  const copy = path.join(path.dirname(STARTER), `${repo}-${proj.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '')}`), into = STARTER;
  console.log(`Self-install: the project "${proj}" goes to ${into}; the starter goes to ${copy} (at ${head.slice(0, 7)}), and the project links to it.`);
  if (dry) { console.log('Dry run, nothing written.'); process.exit(0); }
  if (fs.existsSync(copy)) {
    if (fs.existsSync(path.join(copy, '.starter-dev')) || !fs.existsSync(path.join(copy, 'tools/new-project.mjs'))) fail(`${copy} exists and is no stable starter copy: move it away first.`);
    if (git(copy, 'status', '--porcelain').stdout.trim()) fail(`${copy} exists with changes of its own: it is left as it is.`);
    if (git(copy, 'fetch', '-q', STARTER, head).status !== 0 || git(copy, 'checkout', '-q', '--detach', head).status !== 0) fail(`${copy} could not be brought to ${head.slice(0, 7)}.`);
  } else {
    if (git(path.dirname(STARTER), 'clone', '-q', STARTER, copy).status !== 0) fail(`Could not copy the starter to ${copy}.`);
    if (url) git(copy, 'remote', 'set-url', 'origin', url);
  }
  // (the clone here is exactly the commit the copy now has, with nothing of its own: the folder is emptied for the project)
  for (const n of fs.readdirSync(STARTER)) fs.rmSync(path.join(STARTER, n), { recursive: true, force: true });
  const pass = args.filter(a => !['--self-install', '--dry-run', '--beside'].includes(a));
  const r = spawnSync(process.execPath, [path.join(copy, 'tools/new-project.mjs'), into, ...(pass.includes('--name') ? [] : ['--name', proj]), ...pass], { stdio: 'inherit' });
  if (r.status !== 0) fail(`Making the project failed; the starter is safe in ${copy}. Retry: node "${path.join(copy, 'tools/new-project.mjs')}" "${into}"`);
  console.log(`\nOpen the project folder with your agent: ${into}`);
  process.exit(0);
}
if (!target) { console.log(usageOf(import.meta.url)); process.exit(1); }
const dest = path.resolve(target);
// An ignore pattern that matches files the project already commits is never added: ignoring them would push the user
// to untrack their own files (e.g. a CLAUDE.md they keep in git). Lesson: adopting such a project flagged its CLAUDE.md.
// A tracked file the ignore list itself re-includes ("!.env.example" after ".env.*") doesn't count. Lesson: a repo that
// tracked .env.example never got ".env.*", so .env.local was left unignored and git hygiene failed on adoption.
const trackedBy = pattern => (spawnSync('git', ['ls-files', '-ci', `--exclude=${pattern}`], { cwd: dest, encoding: 'utf8' }).stdout || '').split(/\r?\n/).filter(Boolean);
const tracked = (pattern, negations = []) => fs.existsSync(path.join(dest, '.git')) &&
  trackedBy(pattern).filter(f => !negations.some(n => trackedBy(n.slice(1)).includes(f))).length > 0;
// A development copy (marked by .starter-dev, ignored by git) never feeds real projects: half-finished changes would
// reach them through every upgrade and every pack or skill they add. Projects use a stable copy (a clean clone).
if (fs.existsSync(path.join(STARTER, '.starter-dev')) && !flag('--dev') && !(process.env.STARTER_ALLOW_DEV ?? process.env.KS_ALLOW_DEV)) {
  console.error(`${STARTER} is a development copy of the starter (it has a .starter-dev file).
Use a stable copy for real projects: git clone <the starter's repository> into its own folder and run its tools/new-project.mjs.
To test this copy on a throwaway project, add --dev.`);
  process.exit(1);
}
// The starter always stays in its own folder, outside every project it makes (and never the other way round).
const within = (child, parent) => { const rel = path.relative(parent, child); return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel)); };
if (within(dest, STARTER) || within(STARTER, dest)) {
  const name = path.basename(dest) === path.basename(STARTER) || within(STARTER, dest) ? 'my-project' : path.basename(dest);
  console.error('A project and the starter must not be inside each other. Pick a folder outside the starter, e.g. next to it: ' +
    path.join(path.dirname(STARTER), name));
  process.exit(1);
}

const files = [];
(function walk(d) {
  for (const n of fs.readdirSync(path.join(STARTER, d || '.'))) {
    if (NEVER.has(n)) continue;
    if (!d && n === 'LICENSE') continue; // the starter's own license; a project picks its own (skills keep theirs)
    const p = d ? `${d}/${n}` : n;
    if (fs.statSync(path.join(STARTER, p)).isDirectory()) walk(p); else files.push(p);
  }
})('');

const today = localToday();
// An existing project keeps its name: the one in its CLAUDE.md heading ("# <name>: START HERE").
const ownHeading = (() => { try { return /^#\s+(.+?):\s*START HERE/m.exec(fs.readFileSync(path.join(dest, 'CLAUDE.md'), 'utf8'))?.[1].replace(/<!--[\s\S]*?-->/g, '').trim(); } catch { return ''; } })();
// Else the name the project already gives itself: its README's title, then its manifest. Lesson: an adopted project
// called "Pipe Cleaner" in its README became "pipe" (the folder), a word that then matched code everywhere.
const ownName = (() => {
  const rd = p => { try { return fs.readFileSync(path.join(dest, p), 'utf8'); } catch { return ''; } };
  const h1 = /^#\s+([^\n#<[]{2,60}?)\s*$/m.exec(rd('README.md'))?.[1].replace(/[*_`]/g, '').trim();
  if (h1 && !/^(readme|about|introduction|overview)$/i.test(h1)) return h1;
  return /^\s*name\s*=\s*["']([^"']+)["']/m.exec(rd('pyproject.toml'))?.[1] || /^\s*name\s*=\s*["']([^"']+)["']/m.exec(rd('Cargo.toml'))?.[1]
    || (() => { try { return JSON.parse(rd('package.json')).name?.replace(/^@[^/]+\//, ''); } catch { return ''; } })() || '';
})();
const name = opt('--name') || (ownHeading && !ownHeading.includes('{{') ? ownHeading : '') || ownName || path.basename(dest);
// the placeholder names no project: a typed-out name there was flagged by name-var in every new project
const fill = (text, json) => {
  const v = s => json ? JSON.stringify(s).slice(1, -1) : s;
  return text.replaceAll('{{PROJECT_NAME}}', v(name)).replaceAll('{{CREATED}}', today)
    .replaceAll('{{ONE_LINE}}', v(opt('--desc') || '<!-- One line on what this project is for: filled in during setup. -->'));
};
const log = [];
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
let unchanged = 0, backedUp = 0;
const created = []; // files an upgrade added, so a rollback can take them out again
// Project files an upgrade may change besides the engine: copied first, so a rollback restores them exactly.
const SNAP = ['tools/hooks/config.json', 'tools/hooks/requirements.json', '.gitignore', 'docs/checks/rule-enforcement.md', '.claude/settings.json', '.codex/hooks.json', '.gemini/settings.json', 'CLAUDE.md', 'AGENTS.md', 'tools/starter.local.json'];
// Every file of the project and its hash, so a rollback can prove the project is exactly as it was (caches, git,
// dependencies and hook state are left out). Lesson: a rollback said "the project is as it was" while renamed-file
// rewrites and freshly synced skill copies were still there, and the audit that passed before now failed.
const FP_SKIP = /^(\.git|node_modules|\.cache|state|dist|build|__pycache__|\.venv|venv|target)$/;
function fingerprint(root) {
  const out = new Map();
  out.dirs = new Set();
  (function walk(d) {
    for (const e of fs.existsSync(path.join(root, d)) ? fs.readdirSync(path.join(root, d), { withFileTypes: true }) : []) {
      const p = d ? `${d}/${e.name}` : e.name;
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) { if (!FP_SKIP.test(e.name)) { out.dirs.add(p); walk(p); } continue; }
      try { const b = fs.readFileSync(path.join(root, p)); out.set(p, createHash('sha1').update(b).digest('hex')); } catch { }
    }
  })('');
  return out;
}
// The project's audit (which sweeps ran, which failed) and its hook speed, as its current engine reports them.
// (each long phase says so as it starts: an upgrade ran silent for over 10 minutes and the caller took it for hung.
// Lesson (a field report): a shell tool timed out on the silence and moved the upgrade to the background)
// (on stdout: a rolled-back run's errors lead with ROLLED BACK)
const phase = what => { if (!dry) process.stdout.write(`upgrade: ${what} (a few minutes; longer while other test runs share the machine)\n`); };
function probe(when) {
  if (dry) return { failed: [], swept: [], speed: {} };
  phase(`${when} the upgrade: the audit and the hook timing`);
  const a = spawnSync(process.execPath, [path.join(dest, 'tools', 'audit.mjs')], { cwd: dest, encoding: 'utf8', timeout: 600000 });
  const rows = [...(a.stdout || '').matchAll(/^(PASS|WARN|FAIL)\s+\d+\.\s+(.+?)(?:\s{2}\(.*)?$/gm)];
  // (timed after one untimed run: right after an upgrade writes its files, the first runs read them cold. Lesson, a
  // field report: the upgrade said the prompt hook took 620 ms; the same hook timed by hand afterwards took 277 to 322)
  const benchOnce = () => spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'hooks.mjs'), 'bench'], { cwd: dest, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
  // (and the fastest of three runs per hook, before and after alike: a machine still busy right after the upgrade only
  // adds time. Lesson, a field report: three upgrades each read Stop 87 to 131 ms slower, then the same engine read
  // fast again at the next upgrade)
  benchOnce();
  const runs = [benchOnce(), benchOnce(), benchOnce()].map(r => r.stdout || '');
  // each failing sweep's own lines, so a rollback can say exactly what broke
  const details = {}; let cur = null;
  for (const l of (a.stdout || '').split(/\r?\n/)) { const m = /^(PASS|WARN|FAIL)\s+\d+\.\s+(.+?)(?:\s{2}\(.*)?$/.exec(l); if (m) cur = m[1] === 'FAIL' ? m[2].trim() : null; else if (cur && /^\s+- /.test(l)) (details[cur] ||= []).push(l.trim()); }
  return { failed: rows.filter(r => r[1] === 'FAIL').map(r => r[2].trim()), swept: rows.map(r => r[2].trim()), details,
    speed: fastestBench(runs) };
}
// A dry run prints a summary: how many files it would create or update per folder, every file that collides with one
// already there, and the other steps. --verbose prints every line. Lesson: a dry run printed hundreds of file lines and
// buried the few collisions that mattered.
function printLog() {
  if (!dry || flag('--verbose')) { console.log(log.join('\n')); return; }
  const counts = {}, kept = [], other = [];
  for (const l of log) {
    const m = /^(created|updated)\s+(\S+)/.exec(l), k = /^kept\s+(\S+) \(exists\)/.exec(l);
    // (refreshed checks are entries of one file, named with it, not a file at the root. Lesson (two field reports):
    // "(root) 1" read as a file outside tools/, a reason the engine runbook gives to stop an upgrade)
    if (m?.[2] === 'checks') other.push(l.replace(/^updated\s+checks\s+/, 'would refresh check(s) ').replace(/ \(the starter's newer version;.*$/, ''));
    else if (m) { const top = m[2].includes('/') ? m[2].split('/')[0] + '/' : '(root)'; const c = counts[m[1]] ||= {}; c[top] = (c[top] || 0) + 1; }
    else if (k) kept.push(k[1]);
    else other.push(l);
  }
  const line = (verb, c) => { const n = Object.values(c || {}).reduce((a, b) => a + b, 0); return n ? `would ${verb} ${n} file(s): ${Object.entries(c).sort((a, b) => b[1] - a[1]).map(([d, x]) => `${d} ${x}`).join(', ')}` : ''; };
  console.log([`Dry run summary (add --verbose for every file):`, line('create', counts.created), line('update', counts.updated),
    kept.length ? `would collide with ${kept.length} existing file(s), kept as they are: ${kept.join(', ')}` : 'collisions: none', ...other].filter(Boolean).join('\n'));
}
function put(rel, { overwrite = false, as = rel } = {}) {
  const to = path.join(dest, as);
  const from = path.join(STARTER, rel);
  if (fs.existsSync(to) && !overwrite) { log.push(`kept     ${as} (exists)`); return false; }
  if (fs.existsSync(to) && fs.readFileSync(to).equals(fs.readFileSync(from))) { unchanged++; return false; }
  let text = null, note = '';
  if (fs.existsSync(to)) {
    // An upgrade replaces engine files, but never loses what the project added: a core skill keeps its own triggers
    // and its "## Project lessons" section (where skill-learn writes), and every replaced file is backed up first.
    const mine = fs.readFileSync(to, 'utf8');
    // _fallback.md too: an adopted project keeps its own fallback steps under "## Project lessons" (Lesson: an upgrade
    // replaced an adopted project's _fallback.md whole, dropping its own rules; only _TEMPLATE.md has nothing to keep)
    if (/^(skills\/[^/]+\/SKILL\.md|docs\/playbooks\/(?!_TEMPLATE\.md)[^/]+\.md)$/.test(as)) text = mergeSkill(fs.readFileSync(from, 'utf8'), mine, rel);
    // the merge gave back the project's file as it is: nothing to update (Lesson: a repeat upgrade listed these as "updated")
    if (text != null && text === mine) { unchanged++; return false; }
    const backup = path.join(dest, '.cache', 'upgrade-backup', stamp, as + '.orig'); // .orig: never loaded or run as code
    if (!dry) { fs.mkdirSync(path.dirname(backup), { recursive: true }); fs.writeFileSync(backup, mine); }
    note = text && text !== fs.readFileSync(from, 'utf8') ? ' (kept the project\'s triggers and lessons)' : '';
    note += ` (old version: .cache/upgrade-backup/${stamp}/${as}.orig)`;
    backedUp++;
  }
  if (!fs.existsSync(to)) created.push(as);
  log.push(`${fs.existsSync(to) ? 'updated' : 'created'}  ${as}${note}`);
  if (dry) return true;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (text != null) fs.writeFileSync(to, text);
  // placeholders are filled in docs and data, never in code: the engine names them itself (Lesson: it filled its own tests)
  else if (TEXT.test(rel) && !rel.endsWith('.mjs') && !overwrite) fs.writeFileSync(to, fill(fs.readFileSync(from, 'utf8'), rel.endsWith('.json'))); else fs.copyFileSync(from, to);
  return true;
}
// Every line the starter ever shipped in a file (from its git history, when it has one), so a line the project wrote
// can be told from an older engine line.
const shippedLinesCache = {};
function shippedLines(rel) {
  if (shippedLinesCache[rel]) return shippedLinesCache[rel];
  const set = new Set(), git = (...a) => spawnSync('git', a, { cwd: STARTER, encoding: 'utf8', maxBuffer: 64 << 20 });
  for (const c of (git('log', '--format=%H', '--', rel).stdout || '').split('\n').filter(Boolean))
    for (const l of (git('show', `${c}:${rel}`).stdout || '').split(/\r?\n/)) set.add(l.trim());
  return (shippedLinesCache[rel] = set);
}
const movedLessons = [], movedSections = [], legacyScenarios = [], untracked = [], editedPayload = [];
// every version of a file the starter shipped (from its git history), newest first
function shippedTexts(rel) {
  const git = (...a) => spawnSync('git', a, { cwd: STARTER, encoding: 'utf8', maxBuffer: 64 << 20 });
  return (git('log', '--format=%H', '--', rel).stdout || '').split('\n').filter(Boolean).map(c => git('show', `${c}:${rel}`).stdout || '').filter(Boolean);
}
// The starter's new SKILL.md, plus the triggers the project added and its "## Project lessons" section. Lines the
// project added to the file's "## Pitfalls" (in neither the new file nor any shipped version) move to "## Project
// lessons". Lesson: project.md became an engine runbook, and the pitfalls a project had written into it were lost.
// The check markers the project put on the Done-when items of an engine runbook ("(ran: ...)", "(when file: ...)" and
// the like) stay on the same items of the new version, where that version ships no check of its own there. Items are
// matched by their words without markers. Lesson (two field reports): upgrades dropped a project's markers, so the end
// check's coverage fell back on every upgrade.
function keepMarkers(theirs, mine) {
  const V2 = /\((?:when\s+)?(?:file|ran|answer):[^)]*\)/gi;
  const items = t => {
    const m = /^## Done when[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(t), out = [];
    let cur = null;
    for (const l of m ? m[1].split(/\r?\n/) : []) {
      if (/^\s*(?:\d+\.|[-*])\s+/.test(l)) out.push(cur = { lines: [l] });
      else if (cur && /^\s+\S/.test(l)) cur.lines.push(l);
      else cur = null;
    }
    return out;
  };
  const key = it => it.lines.join(' ').replace(/\([^)]*:[^)]*\)/g, '').replace(/^\s*(?:\d+\.|[-*])\s+(?:\[[ x]\]\s*)?/, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
  const own = new Map(items(mine).map(it => [key(it), it.lines.join(' ').match(V2) || []]));
  let out = theirs;
  for (const it of items(theirs)) {
    const has = it.lines.join(' ').match(V2) || [], when = s => /^\(when/i.test(s);
    const add = (own.get(key(it)) || []).filter(m => !has.some(h => when(h) === when(m)));
    if (!add.length) continue;
    const last = it.lines[it.lines.length - 1];
    out = out.replace(last, () => `${last.replace(/\s*$/, '')} ${add.join(' ')}`);
  }
  return out;
}
function mergeSkill(theirs, mine, rel) {
  const trig = t => (/^triggers:\s*(.*)$/m.exec(t)?.[1] || '').split(',').map(s => s.trim()).filter(Boolean);
  // a trigger some release shipped is the starter's, not the project's: one the starter has since removed stays removed
  // Lesson: "remember, audit, skill, skills, hook, hooks" came back into project.md after the starter dropped them
  const everShipped = new Set(rel ? [...shippedLines(rel)].filter(l => /^triggers:/.test(l)).flatMap(l => trig(l)) : []);
  const extra = trig(mine).filter(t => !trig(theirs).includes(t) && !everShipped.has(t));
  let out = keepMarkers(theirs, mine);
  if (extra.length) out = /^triggers:/m.test(out) ? out.replace(/^triggers:\s*(.*)$/m, (l, v) => `triggers: ${[v.trim(), ...extra].filter(Boolean).join(', ')}`)
    : out.replace(/^---\r?\n/, `---\ntriggers: ${extra.join(', ')}\n`);
  // the project's own marks in the frontmatter (skill-harden, skill-curate) stay, so a replaced runbook is not due again
  const fmOf = t => /^---\r?\n([\s\S]*?)\r?\n---/.exec(t)?.[1] || '';
  // ...and so do the starter triggers it took out ("triggers_removed:"): they leave the merged list too
  // (Lesson: an adopted project narrowed a pack's triggers, and the next upgrade put them back)
  const removed = trig(mine.replace(/^triggers:.*$/m, '').replace(/^triggers_removed:/m, 'triggers:')).map(t => t.toLowerCase());
  if (removed.length) out = out.replace(/^triggers:\s*(.*)$/m, (l, v) => `triggers: ${v.split(',').map(s => s.trim()).filter(t => t && !removed.includes(t.toLowerCase())).join(', ')}`);
  const marks = fmOf(mine).split(/\r?\n/).filter(l => /^(hardened|harden|keep|triggers_removed):/.test(l) && !new RegExp(`^${l.split(':')[0]}:`, 'm').test(fmOf(out)));
  if (marks.length && /^---\r?\n/.test(out)) out = out.replace(/^(---\r?\n[\s\S]*?)(\r?\n---)/, (m, a, b) => `${a}\n${marks.join('\n')}${b}`);
  let lessons = /^## Project lessons[^\n]*\n[\s\S]*?(?=^## |(?![\s\S]))/m.exec(mine)?.[0];
  const pit = /^## Pitfalls[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(mine)?.[1] || '';
  const known = new Set([...theirs.split(/\r?\n/).map(l => l.trim()), ...(rel ? shippedLines(rel) : [])]);
  const added = pit.split(/\r?\n/).filter(l => /^\s*[-*]\s+\S/.test(l) && !known.has(l.trim()) && !(lessons || '').includes(l.trim()));
  if (added.length) {
    lessons = (lessons ? lessons.replace(/\s*$/, '\n') : '## Project lessons\n') + added.join('\n') + '\n';
    movedLessons.push([rel, added.length]);
  }
  // A section the project added (a heading no release shipped, with its text) moves under "## Project lessons", one
  // level down, and the upgrade names it. Lesson, field report: an adopted project's "### §11b Performance" in project.md
  // was dropped by an upgrade that said only "kept the project's triggers and lessons".
  const body = mine.replace(/^## Project lessons[^\n]*\n[\s\S]*?(?=^## |(?![\s\S]))/m, '');
  const heads = [...body.matchAll(/^(#{2,4})[ \t]+(.+)$/gm)];
  let skipTo = -1;
  for (const [i, h] of heads.entries()) {
    if (h.index < skipTo || known.has(h[0].trim())) continue;
    const level = h[1].length, next = heads.slice(i + 1).find(n => n[1].length <= level);
    const block = body.slice(h.index, next ? next.index : body.length).replace(/\s*$/, '');
    skipTo = next ? next.index : body.length;
    if ((lessons || '').includes(h[2].trim())) continue;
    const down = block.replace(/^(#{2,5})(?=[ \t])/gm, m => level === 2 ? `${m}#` : m);
    lessons = (lessons ? lessons.replace(/\s*$/, '\n') : '## Project lessons\n') + '\n' + down + '\n';
    movedSections.push([rel, h[2].trim()]);
  }
  // the heading itself, not a mention of it in the text (Lesson: project.md names the section in a sentence, and the lessons were dropped)
  if (lessons && !/^## Project lessons/m.test(out)) out = out.replace(/\s*$/, '\n\n') + lessons.replace(/\s*$/, '\n');
  return out;
}

// With no mode flag the folder decides: empty → a new project; made from the starter → upgrade its engine; anything
// else → adopt it (existing files are never overwritten). So an agent pointed at the starter needs one command.
const madeFromStarter = fs.existsSync(path.join(dest, 'tools', 'hooks', 'hooks.mjs'));
const auto = !['--adopt', '--upgrade', '--add-pack', '--add-skill', '--remove'].some(flag);
// Take the engine out of a project (engine runbook): unwire its hooks and remove its engine files, keeping everything
// the project wrote (AGENTS.md, docs, its own runbooks, checks and code). The removed files are backed up first, so
// --adopt or a copy back undoes it.
if (flag('--remove')) {
  if (!madeFromStarter) { console.error(`${dest} has no engine to remove (no tools/hooks/hooks.mjs).`); process.exit(1); }
  const log = [], at = (...p) => path.join(dest, ...p), backupDir = at('.cache', 'engine-removed', stamp);
  // (only the engine's own event commands are its wiring: a project hook that runs "hooks.mjs jobs", or a group that
  // also runs a project command, keeps that command)
  const ENGINE_CMD = /^node\s+"?[^"]*tools[\\/]+hooks[\\/]+hooks\.mjs"?\s+(session|prompt|pretool|posttool|stop|subagentstop)\s*$/;
  const isEngineCmd = h => ENGINE_CMD.test(String(h?.command || '').trim());
  let ownWiring = '';
  // the hook wiring: only the engine's entries go, every other setting stays
  for (const f of ['.claude/settings.json', '.codex/hooks.json']) {
    let j; try { j = JSON.parse(fs.readFileSync(at(f), 'utf8')); } catch { continue; }
    const groups = Object.values(j.hooks || {}).flat();
    if (!groups.some(g => [].concat(g?.hooks || []).some(isEngineCmd))) { ownWiring += JSON.stringify(j.hooks || {}); continue; }
    for (const [ev, list] of Object.entries(j.hooks)) {
      const keep = [].concat(list).flatMap(g => { const rest = [].concat(g?.hooks || []).filter(h => !isEngineCmd(h)); return rest.length ? [{ ...g, hooks: rest }] : []; });
      if (keep.length) j.hooks[ev] = keep; else delete j.hooks[ev];
    }
    ownWiring += JSON.stringify(j.hooks || {});
    if (!Object.keys(j.hooks).length) delete j.hooks;
    if (!dry) { fs.mkdirSync(path.join(backupDir, path.dirname(f)), { recursive: true }); fs.copyFileSync(at(f), path.join(backupDir, f)); fs.writeFileSync(at(f), JSON.stringify(j, null, 2) + '\n'); }
    log.push(`unwired  ${f} (the engine's hooks; other settings kept)`);
  }
  const hp = (spawnSync('git', ['config', '--get', 'core.hooksPath'], { cwd: dest, encoding: 'utf8' }).stdout || '').trim();
  if (hp === '.githooks') { if (!dry) spawnSync('git', ['config', '--unset', 'core.hooksPath'], { cwd: dest }); log.push('unwired  git hooks (core.hooksPath)'); }
  // the engine's files, its machine state and starter link, the skills generated from its runbooks, and their mirrors
  const generated = (() => { try { return fs.readdirSync(at('skills')); } catch { return []; } })().filter(s => {
    const t = (() => { try { return fs.readFileSync(at('skills', s, 'SKILL.md'), 'utf8'); } catch { return ''; } })(), rb = /^runbook:\s*(\S+)/m.exec(t)?.[1];
    return /^generated:\s*true/m.test(t) && rb && ENGINE.includes(rb);
  });
  // What the project still uses stays (Lesson (the user): leaving the engine must keep the project's own hooks, skills
  // and scripts working): an engine file its own code or hook settings name, with the engine files that one loads, and
  // an engine runbook, checklist or core skill it changed (its "## Project lessons", or text no shipped version has).
  const lf = t => t.replace(/\r\n/g, '\n'), text = f => { try { return lf(fs.readFileSync(at(f), 'utf8')); } catch { return ''; } };
  const engineSet = new Set(ENGINE.filter(f => fs.existsSync(at(f)))), kept = new Map();
  const listed = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: dest, encoding: 'utf8' });
  const own = (listed.status === 0 ? listed.stdout : '').split('\n').filter(f => f && /\.(mjs|cjs|js|ts|py|sh|ps1|bat|cmd|json|toml|ya?ml)$/i.test(f) && !engineSet.has(f) && !fs.existsSync(path.join(STARTER, f)) && !/^(\.claude|\.agents|packs|library|\.starter|\.cache|node_modules)\//.test(f) && !/^tools\/hooks\/(state|config\.json|requirements\.json)/.test(f));
  const refsIn = (from, t) => [...t.matchAll(/["'`](\.{1,2}\/[^"'`\s]+)["'`]/g)].map(m => path.posix.normalize(path.posix.join(path.posix.dirname(from), m[1])));
  for (const [from, t] of [...own.map(f => [f, text(f)]), ['(hook settings)', ownWiring]])
    for (const e of engineSet) if (t.includes(e) || (from !== '(hook settings)' && refsIn(from, t).includes(e))) kept.set(e, `used by ${[kept.get(e)?.replace(/^used by /, ''), from].filter(Boolean).join(', ')}`);
  // (and what a kept engine file loads: its relative imports and files read next to it)
  for (let grew = true; grew;) { grew = false; for (const k of [...kept.keys()]) for (const r of refsIn(k, text(k))) if (engineSet.has(r) && !kept.has(r)) { kept.set(r, `loaded by ${k}`); grew = true; } }
  for (const f of engineSet) if (!kept.has(f) && /^(docs\/(playbooks|checks)\/[^/]+\.md|skills\/[^/]+\/SKILL\.md)$/.test(f)) {
    const t = text(f);
    if (/^## Project lessons[^\n]*\n+(?!## |$)\S/m.test(t) || (fs.existsSync(path.join(STARTER, '.git')) && !shippedTexts(f).some(s => lf(s) === t))) kept.set(f, 'this project changed it');
  }
  const keptSkills = new Set([...kept.keys()].map(f => /^skills\/([^/]+)\//.exec(f)?.[1] || /^docs\/playbooks\/([^/]+)\.md$/.exec(f)?.[1]).filter(Boolean));
  // (a kept skill keeps its whole folder: its references and scripts)
  for (const f of engineSet) { const s = /^skills\/([^/]+)\//.exec(f)?.[1]; if (s && keptSkills.has(s) && !kept.has(f)) kept.set(f, `part of the kept ${s} skill`); }
  const mirrors = [...CORE_SKILLS, ...generated].filter(s => !keptSkills.has(s)).flatMap(s => ['.claude/skills', '.agents/skills'].map(m => `${m}/${s}`));
  for (const [f, why] of kept) log.push(`kept     ${f} (${why})`);
  for (const f of [...[...engineSet].filter(f => !kept.has(f)), ...generated.filter(s => !keptSkills.has(s)).map(s => `skills/${s}`), ...mirrors, 'tools/hooks/state', 'tools/starter.local.json'].filter(f => fs.existsSync(at(f)))) {
    if (!dry) { fs.cpSync(at(f), path.join(backupDir, f), { recursive: true }); fs.rmSync(at(f), { recursive: true, force: true }); }
    log.push(`removed  ${f}`);
  }
  if (!dry) for (const s of CORE_SKILLS) try { fs.rmdirSync(at('skills', s)); } catch { }
  console.log(log.join('\n'));
  if (!dry) noteEngineChange(dest, `removed (backed up in .cache/engine-removed/${stamp}/${kept.size ? `; ${kept.size} engine file(s) kept because the project uses them` : ''})`);
  console.log(dry ? `\nDry run: nothing changed (${log.length} item(s) above).` : `\nRemoved the engine from ${dest}: ${log.length} item(s), backed up in .cache/engine-removed/${stamp}/. ` +
    'The project\'s own files stay. AGENTS.md (and CLAUDE.md) still describe the engine\'s rules: edit them to what the project keeps. ' +
    `To put the engine back: node "${path.join(STARTER, 'tools', 'new-project.mjs')}" "${dest}" --adopt`);
  process.exit(0);
}
if (auto && madeFromStarter) console.log(`${dest} was made from the starter: upgrading its engine (its own content stays as it is).\n`);
if (flag('--upgrade') || (auto && madeFromStarter)) {
  if (!madeFromStarter) { console.error(`${dest} is not a project made from the starter (no tools/hooks/hooks.mjs). Use --adopt.`); process.exit(1); }
  // Never worse: audit and time the project before, so the result can be compared after.
  const before = probe('before');
  const print0 = dry ? null : fingerprint(dest);
  const backupDir = path.join(dest, '.cache', 'upgrade-backup', stamp);
  const snapMissing = SNAP.filter(f => !fs.existsSync(path.join(dest, f)));
  // the core checks this project got from its last upgrade, read before the engine files are replaced (3-way merge below)
  const prevShipped = (() => { try { return JSON.parse(fs.readFileSync(path.join(dest, 'tools', 'hooks', 'engine-checks.json'), 'utf8')).requirements || null; } catch { return null; } })();
  const keptChecks = [], addedChecks = [];
  // the setup questions this project's engine asked, read before it is replaced: only questions added since are new
  const prevHooks = (() => { try { return fs.readFileSync(path.join(dest, 'tools', 'hooks', 'hooks.mjs'), 'utf8').replace(/\r\n/g, '\n'); } catch { return ''; } })();
  const prevQuestions = [...prevHooks.matchAll(/export const INTERVIEW\w* = \[([^\]]*)\]/g)].flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1]));
  // the starter commit this project last took its engine from (its hooks.mjs as shipped then), or null when unknown
  const gitAt = (c, rel) => spawnSync('git', ['show', `${c}:${rel}`], { cwd: STARTER, encoding: 'utf8', maxBuffer: 64 << 20 }).stdout || '';
  const baseCommit = (() => {
    for (const c of (spawnSync('git', ['log', '--format=%H', '--', 'tools/hooks/hooks.mjs'], { cwd: STARTER, encoding: 'utf8' }).stdout || '').split('\n').filter(Boolean))
      if (gitAt(c, 'tools/hooks/hooks.mjs').replace(/\r\n/g, '\n') === prevHooks) return c;
    return null;
  })();
  if (!dry) for (const f of SNAP.filter(f => fs.existsSync(path.join(dest, f)))) { const b = path.join(backupDir, f + '.orig'); fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(path.join(dest, f), b); }
  for (const f of ENGINE) if (fs.existsSync(path.join(STARTER, f))) put(f, { overwrite: true });
  for (const f of ENGINE_IF_MISSING) if (fs.existsSync(path.join(STARTER, f))) put(f);
  // GUI used to be core: a project that has its runbook now has the gui pack. Each installed pack's engine files are refreshed.
  const cp = path.join(dest, 'tools', 'hooks', 'config.json');
  const pc = JSON.parse(fs.readFileSync(cp, 'utf8'));
  pc.packs ||= [];
  if (fs.existsSync(path.join(dest, 'docs', 'playbooks', 'gui.md')) && !pc.packs.includes('gui')) {
    pc.packs.push('gui'); log.push('packs    gui (the GUI runbook, review loop and screenshot tool are now the gui pack)');
    if (!dry) fs.writeFileSync(cp, JSON.stringify(pc, null, 2) + '\n');
  }
  for (const [pack, list] of Object.entries(PACK_ENGINE)) {
    if (!pc.packs.includes(pack)) continue;
    const root = path.join(STARTER, 'packs', pack, 'files');
    const walk = d => fs.statSync(path.join(root, d)).isDirectory() ? fs.readdirSync(path.join(root, d)).flatMap(n => walk(`${d.replace(/\/$/, '')}/${n}`)) : [d];
    for (const f of list.filter(f => fs.existsSync(path.join(root, f))).flatMap(walk)) put(`packs/${pack}/files/${f}`, { overwrite: true, as: f });
  }
  // The rest of each installed pack's files and of each enabled library skill: the installer copies them as they are,
  // so one still equal to a version the starter shipped was never edited here and is refreshed (a skill or runbook keeps
  // its added triggers and lessons); an edited one is kept and goes into the upgrade review.
  // Lesson: knowledge-capture's new triggers never reached an upgraded project, and its route self-test failed.
  const lf = t => t.replace(/\r\n/g, '\n');
  // (a "triggers_removed:" line is the project's trigger choice, like its triggers: the file is still refreshed, and the
  // merge keeps the removal. Lesson: a pack runbook whose triggers a project narrowed was never refreshed again)
  const bodyOf = t => lf(t).replace(/^triggers:.*\n/m, '').replace(/^(hardened|harden|keep|triggers_removed):.*\n/gm, '').replace(/^## Project lessons[^\n]*\n[\s\S]*?(?=^## |(?![\s\S]))/m, '').trimEnd();
  const refreshPayload = (rel, as) => {
    const to = path.join(dest, as);
    // a file the pack or skill has and this project lacks comes too, as packs.mjs install would add it: a refreshed
    // runbook or skill may now link to it (Lesson: frontend-design linked templates.md, and the app runbooks named the
    // modular-code skill, but neither came, so the references sweep rolled the upgrade back)
    if (!fs.existsSync(to)) { put(rel, { as }); return; }
    const mine = fs.readFileSync(to, 'utf8');
    if (lf(mine) === lf(fs.readFileSync(path.join(STARTER, rel), 'utf8'))) { unchanged++; return; }
    const skillLike = /(^|\/)SKILL\.md$|^docs\/playbooks\/[^_/][^/]*\.md$/.test(as);
    if (shippedTexts(rel).some(t => skillLike ? bodyOf(t) === bodyOf(mine) : lf(t) === lf(mine))) put(rel, { overwrite: true, as });
    // edited here: named in the review only when the starter changed the file since this project's last upgrade, so a
    // filled-in foundation.md is not listed every time (unknown last upgrade: named, to be safe)
    else if (baseCommit === null || lf(gitAt(baseCommit, rel)) !== lf(fs.readFileSync(path.join(STARTER, rel), 'utf8'))) editedPayload.push([as, rel]);
  };
  const filesUnder = (root, d = '') => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesUnder(root, `${d}${e.name}/`) : [`${d}${e.name}`]);
  for (const pack of pc.packs) {
    const root = path.join(STARTER, 'packs', pack, 'files');
    if (!fs.existsSync(root)) continue;
    const engine = PACK_ENGINE[pack] || [];
    for (const f of filesUnder(root).filter(f => !engine.some(e => f === e || (e.endsWith('/') && f.startsWith(e))))) refreshPayload(`packs/${pack}/files/${f}`, f);
  }
  const skillsDir = pc.skillsDir || 'skills', lib = path.join(STARTER, 'library', 'skills');
  for (const sk of fs.existsSync(lib) ? fs.readdirSync(lib) : [])
    if (fs.existsSync(path.join(dest, skillsDir, sk, 'SKILL.md'))) for (const f of filesUnder(path.join(lib, sk))) refreshPayload(`library/skills/${sk}/${f}`, `${skillsDir}/${sk}/${f}`);
  // ignore lines added since the project was made (the starter link, a kept copy), and the link itself if missing
  const gi = path.join(dest, '.gitignore');
  let have = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8').split(/\r?\n/) : [];
  // (an older release shipped bare "build/" and "dist/", which also hide a folder of that name deeper down, such as a
  // skill named build; one that hides such a folder is anchored to the top. Lesson (a field report): a project skill
  // named build was left out of git)
  if (fs.existsSync(path.join(dest, '.git'))) {
    const hidden = (spawnSync('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory'], { cwd: dest, encoding: 'utf8' }).stdout || '').split(/\r?\n/);
    const fix = ['build/', 'dist/'].filter(l => have.includes(l) && hidden.some(h => h.includes(`/${l}`) && !/(^|\/)node_modules\//.test(h)));
    if (fix.length) { have = have.filter(l => !fix.includes(l) || !have.includes(`/${l}`)).map(l => fix.includes(l) ? `/${l}` : l); log.push(`anchored .gitignore ${fix.join(', ')} to the top folder (they also hid ${hidden.filter(h => fix.some(l => h.includes(`/${l}`))).slice(0, 3).join(', ')})`); if (!dry) fs.writeFileSync(gi, have.join(/\r\n/.test(fs.readFileSync(gi, 'utf8')) ? '\r\n' : '\n')); }
  }
  const tmpl =fs.readFileSync(path.join(STARTER, 'tools', 'starter', 'gitignore.project'), 'utf8').split(/\r?\n/), tmplNeg = tmpl.filter(l => l.startsWith('!'));
  const want = tmpl.filter(l => l && !l.startsWith('#') && !have.includes(l) && !['CLAUDE.md', '.claude/'].includes(l) && (l.startsWith('!') || !tracked(l, tmplNeg)));
  if (want.length) { log.push(`appended .gitignore (${want.join(', ')})`); if (!dry) fs.appendFileSync(gi, '\n# Project starter\n' + want.join('\n') + '\n'); }
  // Files the engine generates and an older release let into git (skill copies, hook state) leave the index; the files
  // stay on disk. The user's own files are never untracked. Lesson: a project tracked .claude/skills and its hook state,
  // so git hygiene and the push check failed after every upgrade.
  if (fs.existsSync(path.join(dest, '.git'))) {
    const gen = (spawnSync('git', ['ls-files', '--', '.claude/skills', '.agents/skills', 'tools/hooks/state'], { cwd: dest, encoding: 'utf8' }).stdout || '').split(/\r?\n/).filter(f => f && !/runbook-usage\.json$/.test(f));
    if (gen.length) { log.push(`untracked ${gen.length} generated file(s) from git (skill copies, hook state; still on disk)`); if (!dry) { spawnSync('git', ['rm', '-r', '--cached', '-q', '--', ...gen], { cwd: dest }); untracked.push(...gen); } }
  }
  const lk = path.join(dest, 'tools', 'starter.local.json');
  // The link follows the starter the project was just upgraded from (a stable copy), so packs, library skills and the
  // self-tests read the same release. Lesson: upgrading from a new clone kept the link to an old one, and 5 self-tests
  // failed against its older checks. A development copy never replaces a link to a stable one.
  const was = (() => { try { return JSON.parse(fs.readFileSync(lk, 'utf8')).path; } catch { return null; } })();
  const devCopy = fs.existsSync(path.join(STARTER, '.starter-dev'));
  if (!dry && (!was || (path.resolve(was) !== path.resolve(STARTER) && (!devCopy || !fs.existsSync(was))))) {
    fs.writeFileSync(lk, JSON.stringify({ path: STARTER }, null, 2) + '\n');
    log.push(was ? `relinked tools/starter.local.json → this starter (was ${was})` : 'linked   tools/starter.local.json → this starter');
  }
  // the core skills' checks: added when the project lacks them, and refreshed when the starter's version changed, so a
  // core skill and its check never disagree. A 3-way merge keeps local edits: an entry equal to the copy shipped last
  // time (tools/hooks/engine-checks.json) is refreshed; one that differs from it (or any differing entry when there is no
  // earlier copy) was edited here, so it is kept, marked "custom": true, and listed in the upgrade review.
  // Lesson: the research skill moved to numbered citations, but upgraded projects kept the old check for it.
  // Lesson: a refresh replaced a check the project had tuned, and nobody was told.
  // The same merge covers the checks of the packs this project installed (config.json "packs") and of the library skills
  // it enabled (skills/<name>/SKILL.md present): tools/hooks/engine-checks.json ships all three kinds, keyed by tag.
  // Lesson: only core checks were merged, so new pack and library checks never reached upgraded projects, and their
  // live hooks disagreed with the self-tests (which load the starter's checks).
  const rq = path.join(dest, 'tools', 'hooks', 'requirements.json');
  try {
    const mine = JSON.parse(fs.readFileSync(rq, 'utf8'));
    const shipped = path.join(STARTER, 'tools', 'hooks', 'engine-checks.json');
    const theirs = (fs.existsSync(shipped) ? JSON.parse(fs.readFileSync(shipped, 'utf8')).requirements : null) || shippedChecks(STARTER);
    const skillsDir = pc.skillsDir || 'skills';
    const applies = r => r.pack ? pc.packs.includes(r.pack) : r.skill ? fs.existsSync(path.join(dest, skillsDir, r.skill, 'SKILL.md')) : isEngineCheck(r);
    const skillChecks = theirs.filter(applies);
    const origin = r => r.pack ? `the ${r.pack} pack` : r.skill ? `the ${r.skill} library skill` : 'a core skill';
    const missing = skillChecks.filter(r => !mine.requirements.some(m => m.tag === r.tag));
    if (missing.length) {
      log.push(`added    checks ${missing.map(r => r.tag).join(', ')} to tools/hooks/requirements.json`);
      addedChecks.push(...missing.map(r => `${r.tag}, added from ${origin(r)}`));
      if (!dry) mine.requirements.push(...missing);
    }
    const refreshed = [];
    // What a project sets on purpose is not an edit: switching a check off, and the app pack's code folders and version
    // file (packs.mjs configure app). They are left out of the comparison and kept on a refresh.
    // (checkKey in hooks.mjs leaves out what a project sets on purpose: enabled, code folders, the pack / skill labels)
    const same = (a, b) => checkKey(a) === checkKey(b);
    let history = {}; try { history = JSON.parse(fs.readFileSync(path.join(STARTER, ENGINE_CHECKS_HISTORY), 'utf8')).versions || {}; } catch { }
    const everShipped = m => (history[m.tag] || []).includes(checkKey(m));
    mine.requirements = mine.requirements.map(m => {
      const s = skillChecks.find(r => r.tag === m.tag);
      // equal to the newest apart from labels: it gets the pack / skill label older releases didn't write
      if (s && same(m, s)) return { ...m, ...(s.pack ? { pack: s.pack } : {}), ...(s.skill ? { skill: s.skill } : {}) };
      // "custom" on an entry that is exactly an older shipped version came from an older upgrade's mistake, not the project
      if (!s || (m.custom && !everShipped(m))) return m;
      const was = prevShipped?.find(r => r.tag === m.tag);
      if (!everShipped(m) && (!was || !same(m, was))) { keptChecks.push(m.tag); return { ...m, custom: true }; } // edited here (or unknown): never replaced silently
      refreshed.push(m.tag);
      const next = { ...s, ...('enabled' in m ? { enabled: m.enabled } : {}) }; // a check the project switched off (or on) stays so
      if (s.codeGlobs && m.when?.filesChanged) next.when = { ...next.when, filesChanged: m.when.filesChanged };
      if (s.tag === 'version-bump' && m.enabled && m.require?.filesChanged) next.require = { ...next.require, filesChanged: m.require.filesChanged };
      return next;
    });
    if (refreshed.length) log.push(`updated  checks ${refreshed.join(', ')} in tools/hooks/requirements.json (the starter's newer version; mark an entry "custom": true to keep yours)`);
    if (keptChecks.length) log.push(`kept     checks ${keptChecks.join(', ')}: edited in this project, so they stay (marked "custom") and go into the upgrade review`);
    if (!dry && (missing.length || refreshed.length || keptChecks.length)) fs.writeFileSync(rq, JSON.stringify(mine, null, 2) + '\n');
    // pack checks whose patterns lost their backslashes in an older starter: take the corrected pattern
    let fixed = 0;
    for (const r of mine.requirements.filter(r => r.pack && /\[sS\]|root causes\*/.test(r.require?.answerMatches || ''))) {
      const good = JSON.parse(fs.readFileSync(path.join(STARTER, 'packs', r.pack, 'pack.json'), 'utf8')).requirements.find(q => q.tag === r.tag);
      if (good?.require?.answerMatches) { r.require.answerMatches = good.require.answerMatches; fixed++; }
    }
    if (fixed) { log.push(`fixed    ${fixed} pack check pattern(s) in tools/hooks/requirements.json`); if (!dry) fs.writeFileSync(rq, JSON.stringify(mine, null, 2) + '\n'); }
    // every check needs its row in the rule-to-check map: bring the starter's rows for tags the project doesn't list
    const ep = path.join(dest, 'docs', 'checks', 'rule-enforcement.md');
    const myMap = fs.existsSync(ep) ? fs.readFileSync(ep, 'utf8') : '';
    const rows = fs.readFileSync(path.join(STARTER, 'docs', 'checks', 'rule-enforcement.md'), 'utf8').split(/\r?\n/).filter(l => l.startsWith('| '));
    const need = skillChecks.map(r => r.tag).filter(t => !new RegExp(`\\b${t}\\b`).test(myMap));
    const add = [...new Set(need.map(t => rows.find(l => new RegExp(`\\b${t}\\b`).test(l))).filter(Boolean))];
    if (add.length && myMap) {
      log.push(`added    ${add.length} row(s) to docs/checks/rule-enforcement.md for ${need.join(', ')}`);
      if (!dry) fs.writeFileSync(ep, myMap.replace(/\s*$/, '\n') + add.join('\n') + '\n');
    }
  } catch (e) { log.push(`skipped  core, pack and library checks: ${e.message}`); }
  // Engine skills merged into another one: the old folder goes (backed up) with its checks, so one job has one skill.
  for (const [old, { into, tags }] of Object.entries(RETIRED_CORE)) {
    const at = path.join(dest, 'skills', old);
    if (!fs.existsSync(at)) continue;
    log.push(`retired  skills/${old}/ (now part of the ${into} skill; old version in .cache/upgrade-backup/${stamp}/)`);
    if (dry) continue;
    (function save(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) save(p); else { const b = path.join(backupDir, path.relative(dest, p) + '.orig'); fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(p, b); } } })(at);
    fs.rmSync(at, { recursive: true, force: true });
    const rq = path.join(dest, 'tools', 'hooks', 'requirements.json'), ep = path.join(dest, 'docs', 'checks', 'rule-enforcement.md');
    try { const j = JSON.parse(fs.readFileSync(rq, 'utf8')); j.requirements = j.requirements.filter(r => !tags.includes(r.tag)); fs.writeFileSync(rq, JSON.stringify(j, null, 2) + '\n'); } catch { }
    if (fs.existsSync(ep)) fs.writeFileSync(ep, tags.reduce((t, tag) => t.replace(new RegExp(`,?\\s*\\b${tag}\\b`, 'g'), ''), fs.readFileSync(ep, 'utf8')));
  }
  // Engine files renamed or gone: the old copy is backed up and removed, so nothing stale keeps running.
  // test-hooks.mjs became selfcheck.mjs because "node --test" ran it as one of the project's own tests.
  for (const old of RETIRED_FILES) {
    const at = path.join(dest, old);
    if (!fs.existsSync(at)) continue;
    log.push(`retired  ${old} (renamed or replaced; old version in .cache/upgrade-backup/${stamp}/)`);
    // The project's own scenarios lived in the old self-test file: the ones no starter ever shipped are listed for the
    // review, and kept in tools/hooks/legacy-scenarios.txt (not run) until they are moved into project-scenarios.mjs.
    // Lesson: retiring test-hooks.mjs dropped a project's own scenarios, and the audit then rolled the upgrade back.
    if (/test-hooks\.mjs$/.test(old)) {
      const names = t => [...t.matchAll(/\bname:\s*'((?:[^'\\]|\\.)*)'/g)].map(m => m[1]);
      const shipped = new Set([...shippedLines('tools/hooks/test-hooks.mjs'), ...shippedLines('tools/hooks/selfcheck.mjs')].flatMap(l => names(l)));
      const own = names(fs.readFileSync(at, 'utf8')).filter(n => !shipped.has(n));
      if (own.length && shipped.size) {
        legacyScenarios.push(...own);
        if (!dry) fs.writeFileSync(path.join(dest, 'tools', 'hooks', 'legacy-scenarios.txt'), `The project's own scenarios from the retired test-hooks.mjs. Move each into tools/hooks/project-scenarios.mjs, then delete this file.\n\n${fs.readFileSync(at, 'utf8')}`);
      }
    }
    if (dry) continue;
    const b = path.join(backupDir, old + '.orig');
    fs.mkdirSync(path.dirname(b), { recursive: true });
    fs.copyFileSync(at, b);
    fs.rmSync(at, { force: true });
  }
  // A renamed engine file: the project's own docs that name it are pointed at the new name (a path swap, nothing else).
  // Lesson: an upgrade retired test-hooks.mjs, the project's rules still named it, and the references sweep rolled it back.
  const docs = []; (function walk(d) { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) { const p = path.join(d, e.name);
    if (e.isDirectory()) { if (!/^(\.git|node_modules|\.cache|\.claude|\.agents|\.gemini|\.codex|state)$/.test(e.name)) walk(p); } else if (/\.md$/i.test(e.name)) docs.push(p); } })(dest);
  for (const p of docs) {
    const text = fs.readFileSync(p, 'utf8'); let next = text;
    for (const [from, to] of Object.entries(RENAMED_FILES)) next = next.split(from).join(to);
    if (next !== text) {
      log.push(`updated  ${path.relative(dest, p).replace(/\\/g, '/')} (renamed engine file: ${Object.entries(RENAMED_FILES).filter(([f]) => text.includes(f)).map(([f, t]) => `${f} -> ${t}`).join(', ')})`);
      if (!dry) { const b = path.join(backupDir, path.relative(dest, p) + '.orig'); if (!fs.existsSync(b)) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.writeFileSync(b, text); } fs.writeFileSync(p, next); }
    }
  }
  // (REQ: self-run. The project's committed runEach commands go onto the approved list, the one list the hook runs a
  // project's command from on its own, so no check it had stops running. The user, 2026-11-10. Backed up for a rollback)
  const carried = carryRunEach(dest, { dry: true });
  if (carried.length) {
    log.push(`approved ${carried.length} runEach command(s) the project's checks run on each changed file, carried onto selfCommands in tools/hooks/config.json: ${carried.join(' | ')}`);
    if (!dry) { const cf = path.join(dest, 'tools', 'hooks', 'config.json'), b = path.join(backupDir, 'tools', 'hooks', 'config.json.orig'); if (fs.existsSync(cf) && !fs.existsSync(b)) { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(cf, b); } carryRunEach(dest); }
  }
  log.push(...wire(dest, { dry })); // every agent's wiring, the git hooks and Obsidian (tools/hooks/wire.mjs)
  const done = () => { printLog(); console.log(`\n${dry ? 'Dry run, nothing written: this is what an upgrade of' : 'Upgraded the engine in'} ${dest}${dry ? ' would change' : ''}. The project's own content (AGENTS.md / CLAUDE.md, requirements.json, config.json, its own runbooks, knowledge, code) was not touched, apart from the merged checks listed above. ${unchanged} engine file(s) were already current.${backedUp ? ` ${backedUp} replaced file(s) are backed up in .cache/upgrade-backup/${stamp}/.` : ''}`); };
  if (dry) { done(); console.log('\nAn upgrade also audits and times the project before and after, and writes an upgrade review (docs/DECISIONS.md).'); process.exit(0); }
  // regenerate the project's skills, mirrors and DIRECTORY.md with its new engine, so nothing is left stale
  const sync = () => { const r = spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'hooks.mjs'), 'sync'], { cwd: dest, encoding: 'utf8' }); return (r.stdout || r.stderr || '').trim(); };
  const synced = sync();
  // (the project's own requirements.json checks move into docs/checks/always.md before the after-check, so the new
  // engine enforces them. Lesson (a field report): the after-check asked for the convert, which only the upgrade
  // brings, and every plain upgrade rolled back)
  const conv = spawnSync(process.execPath, [path.join(dest, 'tools', 'always.mjs'), 'convert'], { cwd: dest, encoding: 'utf8', env: { ...process.env, ANZUELO_ROOT: dest } });
  if (/converted [1-9]|NOT converted/.test(conv.stdout || '')) log.push(...String(conv.stdout).trim().split('\n').map(l => `always   ${l}`));
  // Never worse: a check that passed before and fails now rolls the whole upgrade back, unless the user accepts the
  // findings as work to do. New checks that fail and slower hooks go into the review, to fix or decide.
  const after = probe('after');
  // a sweep that now fails only because the new release brought new candidates to decide (new tools or skills in the
  // fit checklist) is a finding for the upgrade review, not a break. Lesson: adding tools to the catalog rolled back a
  // real project's upgrade, and would have rolled back every project's
  // (an own check the convert could not say as markers is work for the review too: it is listed, never dropped)
  const onlyNew = s => (after.details?.[s] || []).length > 0 && after.details[s].every(l => /not decided yet|candidate\(s\) are not in the checklist yet|fit\.mjs check still fails \(\d+ problem\(s\), first: [^)]*not decided yet|the engine does not read requirements\.json for it/.test(l));
  const broke = after.failed.filter(s => before.swept.includes(s) && !before.failed.includes(s) && !onlyNew(s));
  if (broke.length && !flag('--accept-findings')) {
    for (const f of created) fs.rmSync(path.join(dest, f), { force: true });
    for (const f of snapMissing) fs.rmSync(path.join(dest, f), { force: true });
    (function restore(d) { for (const n of fs.existsSync(d) ? fs.readdirSync(d) : []) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) restore(p); else if (n.endsWith('.orig')) { const to = path.join(dest, path.relative(backupDir, p).slice(0, -5)); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(p, to); } } })(backupDir);
    // the generated skills, mirrors and DIRECTORY.md were made by the new engine: the restored one makes them again
    // (Lesson: a rollback left 46 generated files from the new engine for the user to put right). The mirror stamps
    // go first, so every mirror is compared by content (Lesson: a stamp from the new engine kept its skill's mirror).
    fs.rmSync(path.join(dest, 'tools', 'hooks', 'state', 'mirror-stamps.json'), { force: true });
    sync();
    // every file the upgrade (or its sync) added goes, then the result is compared with the fingerprint taken before
    const now = fingerprint(dest);
    for (const p of now.keys()) if (!print0.has(p)) fs.rmSync(path.join(dest, p), { force: true });
    (function prune(d) { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) { const p = path.join(d, e.name); if (e.isDirectory() && !e.isSymbolicLink() && !FP_SKIP.test(e.name)) { prune(p); const r = path.relative(dest, p).split(path.sep).join('/'); try { if (!print0.dirs.has(r) && !fs.readdirSync(p).length) fs.rmdirSync(p); } catch { } } } })(dest);
    if (untracked.length) spawnSync('git', ['add', '-f', '--', ...untracked.filter(f => fs.existsSync(path.join(dest, f)))], { cwd: dest }); // back into git, as before
    const after2 = fingerprint(dest), differ = [...print0].filter(([p, h]) => after2.get(p) !== h).map(([p]) => p);
    // the rollback leads, so a rolled-back run never reads as a success (the change log it undid is not printed)
    console.error(`ROLLED BACK: the upgrade was undone (${log.filter(l => /^(updated|created)\b/.test(l)).length} file change(s) reverted). After it, these checks failed that passed before: ${broke.join('; ')}. ` +
      (differ.length ? `${differ.length} file(s) could not be put back exactly: ${differ.slice(0, 8).join(', ')} (copies in .cache/upgrade-backup/${stamp}/).\n` : 'The project is exactly as it was (every file checked).\n') +
      broke.map(b => (after.details?.[b] || []).slice(0, 8).map(l => `  ${b}: ${l}`).join('\n')).filter(Boolean).join('\n') + '\n' +
      `The new engine checks more or checks differently. Upgrade with --accept-findings to keep it anyway: each of these goes into the upgrade review, to fix.`);
    noteEngineChange(dest, `rolled back: the upgrade to ${starterHead()} was undone, because checks that passed before failed after it (${broke.join(', ')})`);
    process.exit(1);
  }
  done(); console.log(synced);
  // what the upgrade wrote is the engine's doing, not the agent's work in the next turn, as with the pack installer
  // (Lesson: the files an upgrade added asked for a plan at the next Stop)
  const wrote = [...log.map(l => /^(?:updated|created)\s+(\S+)/.exec(l)?.[1]).filter(Boolean), ...SNAP.filter(f => fs.existsSync(path.join(dest, f)))];
  if (wrote.length) spawnSync(process.execPath, ['--input-type=module', '-e', `import { flushEngineWrites } from ${JSON.stringify(pathToFileURL(path.join(dest, 'tools', 'hooks', 'hooks.mjs')).href)}; flushEngineWrites(${JSON.stringify(wrote)});`], { cwd: dest, encoding: 'utf8' });
  const items = [];
  // new hard rules the project doesn't have yet (by their bold title), unless an earlier review decided them
  const decided = fs.existsSync(path.join(dest, 'docs', 'DECISIONS.md')) ? fs.readFileSync(path.join(dest, 'docs', 'DECISIONS.md'), 'utf8') : '';
  const titles = t => [...t.matchAll(/^\d+\. \*\*(.+?)\*\*/gm)].map(m => m[1].replace(/[.:]+$/, ''));
  // Lesson: a fresh clone of the starter has no CLAUDE.md (it is made per machine), and reading it crashed the upgrade.
  const rulesOf = d => ['AGENTS.md', 'CLAUDE.md'].map(n => path.join(d, n)).filter(p => fs.existsSync(p)).map(p => fs.readFileSync(p, 'utf8')).join('\n');
  const mineRules = rulesOf(dest);
  for (const t of titles(rulesOf(STARTER))) if (!mineRules.includes(t) && !decided.includes(`- rule: ${t}:`)) items.push(`rule: ${t}`);
  // a rule the project has, still worded as an older release shipped it, while the starter's wording changed since:
  // offered too. Lesson: old projects never got "never offer to add checks" or the message kinds, which were added to
  // existing rules, because only the titles were compared.
  const bodies = text => Object.fromEntries([...String(text).matchAll(/^\d+\. \*\*(.+?)\*\*([\s\S]*?)(?=^\d+\. \*\*|^## |(?![\s\S]))/gm)].map(m => [m[1].replace(/[.:]+$/, ''), m[2].replace(/\s+/g, ' ').trim()]));
  const theirsB = bodies(rulesOf(STARTER)), mineB = bodies(mineRules);
  const oldB = shippedTexts('AGENTS.md').map(bodies);
  for (const [t, body] of Object.entries(theirsB)) {
    const m = mineB[t];
    if (m && m !== body && oldB.some(o => o[t] === m) && !decided.includes(`- rule-changed: ${t}:`)) items.push(`rule-changed: ${t} (the starter's wording grew; compare AGENTS.md with the starter's and take what fits)`);
  }
  // the fit checklist gets a row for every new candidate (pack, library skill, tool, feature), decided by the AI
  // (new candidates with no sign of need here are decided "skip" by fit.mjs itself: only the real decisions are items)
  const fitNew = spawnSync(process.execPath, [path.join(dest, 'tools', 'fit.mjs'), '--count-new', '--auto-skip'], { cwd: dest, encoding: 'utf8' });
  const fitOut = (fitNew.stdout || '').trim().split(/\r?\n/), fresh = Number(fitOut[0]) || 0;
  const autoSkipped = (fitOut.find(l => /^auto-skipped: /.test(l)) || '').replace(/^auto-skipped: /, '');
  if (fitNew.status !== 0) console.log(`skipped  the fit checklist: ${(fitNew.stderr || '').split(/\r?\n/)[0]}`);
  else { if (fresh) items.push(`fit: ${fresh} new candidates`); if (autoSkipped) console.log(`fit: decided "skip" for new candidates with no sign of need here (change a row in docs/fit-checklist.md if one fits): ${autoSkipped}`); }
  // packs and library skills that fit the project's setup answers and were never enabled or declined
  const fit = spawnSync(process.execPath, ['--input-type=module', '-e', `import { fitGaps } from ${JSON.stringify(pathToFileURL(path.join(dest, 'tools', 'hooks', 'hooks.mjs')).href)}; console.log(JSON.stringify(fitGaps()));`], { cwd: dest, encoding: 'utf8' });
  try { items.push(...JSON.parse(fit.stdout)); } catch { log.push(`skipped  the fit check: ${(fit.stderr || '').split('\n')[0]}`); }
  // the project's own runbooks whose job an engine skill now does: merge what is special about them, then retire them
  for (const [rb, into] of Object.entries(MERGED_RUNBOOKS)) if (fs.existsSync(path.join(dest, 'docs', 'playbooks', `${rb}.md`)) && !decided.includes(`- merge: docs/playbooks/${rb}.md`)) items.push(`merge: docs/playbooks/${rb}.md into the ${into} skill`);
  for (const s of after.failed.filter(s => !before.failed.includes(s) && !((fresh || autoSkipped) && /fit checklist/.test(s)))) items.push(`check: ${s.replace(/: /g, ', ')}`);
  // the project's own hooks ("externalHooks") against the new engine's output contract: a field they read that it no
  // longer prints is its own item, before the user's next turn trips on it (node tools/hooks/selfcheck.mjs --contract)
  const ctr = spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'selfcheck.mjs'), '--contract'], { cwd: dest, encoding: 'utf8', timeout: 60000 });
  if (ctr.status === 1) for (const l of (ctr.stdout || '').split(/\r?\n/).filter(l => l.startsWith('- '))) { const it = `contract: ${l.slice(2).replace(/: /g, ', ').slice(0, 300)}`; if (!decided.includes(`- ${it.slice(0, 60)}`)) items.push(it); }
  for (const [ev, ms] of Object.entries(after.speed)) if (before.speed[ev] && ms > before.speed[ev] * 1.5 && ms - before.speed[ev] > 100) items.push(`speed: the ${ev} hook went from ${before.speed[ev]} to ${ms} ms`);
  // no ": " inside an item: the review's parser ends the item at the first one
  for (const a of addedChecks) items.push(`check: ${a}; it now runs in this project's hooks (to switch it off, set its "enabled" to false)`);
  for (const tag of keptChecks) items.push(`check: ${tag}, kept your edited version; the starter's newer one differs (to take it, replace the entry with the one in tools/hooks/engine-checks.json)`);
  if (legacyScenarios.length) items.push(`scenarios: ${legacyScenarios.length} of this project's own test scenarios were in the retired test-hooks.mjs (${legacyScenarios.slice(0, 4).join('; ').replace(/: /g, ' - ')}${legacyScenarios.length > 4 ? '; ...' : ''}); move them into tools/hooks/project-scenarios.mjs from tools/hooks/legacy-scenarios.txt, then delete that file`);
  for (const [as, rel] of editedPayload) items.push(`file: ${as}, edited in this project so kept; the starter's newer version differs (compare it with ${rel} in the starter and take what fits)`);
  // (REQ: changelog. The user's own data folders are content, not project work: a changelog line per data edit is noise.
  // Offered once, for folders that look like data, by name or by holding mostly data files; the project decides.
  // Oversight 2026-11-10)
  {
    let pc = {}; try { pc = JSON.parse(fs.readFileSync(path.join(dest, 'tools', 'hooks', 'config.json'), 'utf8')); } catch { }
    const dataDirs = pc.dataDirs === undefined && !decided.includes('- data-dirs:') ? dataLikeDirs(dest) : [];
    if (dataDirs.length) items.push(`data-dirs: ${dataDirs.map(d => `${d}/`).join(', ')} look like your own data; edits there are content, not project work, so they need no changelog line. To adopt, set "dataDirs" to ${JSON.stringify(dataDirs)} in tools/hooks/config.json`);
  }
  // setup questions added since this project's interview: the setup check would ask for them with no warning
  // (Lesson: a new "Involvement" question failed audit --setup in an adopted project, and the review never named it)
  const iv = spawnSync(process.execPath, ['--input-type=module', '-e', `import * as h from ${JSON.stringify(pathToFileURL(path.join(dest, 'tools', 'hooks', 'hooks.mjs')).href)}; const f = h.setupInterview(); console.log(JSON.stringify(Object.keys(f).length ? [...h.INTERVIEW, ...h.INTERVIEW_AFTER, ...(h.config().packs || []).includes('app') ? h.INTERVIEW_APP : []].filter(k => !(k.toLowerCase() in f) && !${JSON.stringify(prevQuestions)}.includes(k)) : []));`], { cwd: dest, encoding: 'utf8' });
  try { const keys = JSON.parse(iv.stdout); if (keys.length && !decided.includes(`- interview: ${keys.join(', ')} (`)) items.push(`interview: ${keys.join(', ')} (new setup question${keys.length > 1 ? 's' : ''}; record each answer under "## Setup interview" in docs/DECISIONS.md, or the setup check asks for it)`); } catch { log.push(`skipped  the new setup questions: ${(iv.stderr || '').split('\n')[0]}`); }
  for (const [file, h] of movedSections) items.push(`sections: ${file} is an engine file, so the section "${h}" this project added moved to its "## Project lessons" section (check it still reads right there)`);
  for (const [file, n] of movedLessons) items.push(`lessons: ${file} became an engine file, so ${n} line(s) this project added moved to its "## Project lessons" section (check they still read right there)`);
  // a repeat upgrade that changed nothing has nothing to review (Lesson: it appended a review holding only "self-tests")
  // the upgrade ends with one line: which starter commit, regressions, decisions left. Lesson: a project read a whole
  // upgrade log to find out whether anything needed it.
  const rev = (() => { const r = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: STARTER, encoding: 'utf8' }); return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : 'from the starter copy'; })();
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  // a check failing now that did not fail before, and is no regression (it is new, or only new rows to decide), is named
  // in the last line and is a review item. Lesson: a project read "0 failing before, 1 after" and found which sweep only
  // by running the audit itself.
  const newFails = after.failed.filter(s => !before.failed.includes(s) && !broke.includes(s));
  for (const s of newFails.filter(s => !onlyNew(s))) items.push(`audit: "${s.replace(/: /g, ' - ')}" fails after the upgrade (a new or changed check; node tools/audit.mjs shows what it wants)`);
  const summary = decisions => `\nUpgrade ${rev}: ${plural(broke.length, 'regression')}, ${plural(decisions, 'decision')} needed${newFails.length ? `, newly failing: ${newFails.join('; ')}` : ''}${autoSkipped ? `, ${plural(autoSkipped.split(', ').length, 'new fit row')} skipped automatically` : ''}.`;
  if (!items.length && !log.some(l => /^(updated|created|removed|renamed)\b/.test(l))) { console.log('\nUPGRADE REVIEW: nothing changed, so there is nothing new to decide.'); console.log(summary(0)); process.exit(0); }
  // changes that can break a project's own hooks or scripts that read the engine's output, flagged in the changelog with
  // "Breaking for project hooks:", each its own item. Lesson: a new Stop output shape broke a project script that read
  // the old "reason" key, and the review never said the output had changed.
  // What is new is what the starter's changelog says now and did not say at the commit this project's engine came from
  // (baseCommit); only without that commit does the date of the last review decide. The notes are review items when the
  // project has its own hooks ("externalHooks"); otherwise there is nothing of its own to check, and they are only shown.
  // Lesson: entries were picked by date, so a re-check entry dated the day before the project's last review was skipped.
  const sinceLast = [...decided.matchAll(/^## Upgrade review \((\d{4}-\d\d-\d\d)\)/gm)].pop()?.[1] || '';
  const CL = 'tools/starter/STARTER-CHANGELOG.md';
  const oldLog = baseCommit ? gitAt(baseCommit, CL) || null : null;
  const since = changelogSince(fs.readFileSync(path.join(STARTER, CL), 'utf8'), oldLog, sinceLast);
  const extHooks = (() => { try { return JSON.parse(fs.readFileSync(cp, 'utf8')).externalHooks || []; } catch { return []; } })();
  const brk = breakingItems(since.breaking, extHooks, decided);
  items.push(...brk.items);
  for (const it of brk.shown) console.log(`note     ${it} (this project lists no "externalHooks", so it has no hooks of its own to check)`);
  // the self-tests run here once: a pass is written in, so the review does not wait on a step the upgrade can do itself.
  // Lesson: every upgrade left "self-tests: ?" for the agent to run and record by hand.
  // (--no-selftest leaves it to the agent: the starter's own tests of the upgrade itself use it, to stay quick)
  if (!process.argv.includes('--no-selftest')) phase('the self-tests');
  const st = process.argv.includes('--no-selftest') ? { status: 1, stdout: '' } : spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'selfcheck.mjs')], { cwd: dest, encoding: 'utf8', timeout: 900000, env: { ...process.env, STARTER_NO_TIMING_WAIT: '1' } });
  const stLine = ((st.stdout || '').match(/^selfcheck: .*$/m) || [''])[0];
  const stPassed = st.status === 0 && /ALL PASS/.test(stLine);
  items.push(stPassed ? `self-tests: node tools/hooks/selfcheck.mjs passes here||passed (${today}, run by the upgrade: ${stLine.replace(/^selfcheck:\s*/, '')})` : 'self-tests: node tools/hooks/selfcheck.mjs passes here');
  // (the engine is proven to run here, not only installed: the project's own prompt and Stop hooks run once. Lesson (two
  // projects): an upgrade and a full self-test passed while the default engine could not load in the project)
  const probed = probeEngine(dest), wiringErrs = probed.filter(e => e.startsWith('wiring: ')), engineErrs = probed.filter(e => !e.startsWith('wiring: '));
  if (wiringErrs.length) { items.push(`wiring: ${wiringErrs.map(e => e.slice(8)).join('; ')}. Fix each (a broken git hooks path means commits go unchecked)`); console.log(`\nWIRING BROKEN: ${wiringErrs.map(e => e.slice(8)).join('; ')}`); }
  if (engineErrs.length) { items.push(`engine: the hooks fail to run in this project (${engineErrs.join('; ')}). Fix it before relying on the engine: tell the starter session`); console.log(`\nENGINE DOES NOT RUN HERE: ${engineErrs.join('; ')}`); }
  if (carried.length) items.push(`selfCommands: ${carried.length} runEach command(s) the project's checks ran on their own were carried onto the approved list (tools/hooks/config.json), so the hook keeps running them: ${carried.join(' | ')}. Take one off to have the agent run it instead||carried (${today}, by the upgrade; they count once tools/hooks/config.json is committed)`);
  const dp = path.join(dest, 'docs', 'DECISIONS.md');
  fs.mkdirSync(path.dirname(dp), { recursive: true });
  // each pack and skill in plain words: what it does and what the user will notice
  const plainOf = i => {
    const [kind, name] = i.split(': ');
    const e = kind === 'skill' ? (JSON.parse(fs.readFileSync(path.join(STARTER, 'library', 'catalog.json'), 'utf8')).skills || []).find(x => x.name === name)
      : kind === 'pack' && fs.existsSync(path.join(STARTER, 'packs', name || '', 'pack.json')) ? JSON.parse(fs.readFileSync(path.join(STARTER, 'packs', name, 'pack.json'), 'utf8')) : null;
    return e?.plain ? `\n  ${e.plain}: ${e.does} What you'll notice: ${e.outcome}` : '';
  };
  // (the starter commit after the date tells two reviews of one day apart. Lesson (a field report): two same-day
  // upgrades left two identical headings)
  // (a starter copy without git history has no commit to name)
  const revTo = /^[0-9a-f]{7,}$/.test(rev) ? ` to ${rev}` : '';
  const block = `\n## Upgrade review (${today})${revTo}\n<!-- Decide each line with the user, or let the AI decide (it writes why), replacing "?": "adopted - Worth it: <gain> / <cost>", ` +
    `"fixed - <how>" or "declined - <why>". Adopt only what makes this project better. -->\n` + items.map(i => { const [it, done] = i.split('||'); return `- ${it}: ${done || '?'}${plainOf(it)}`; }).join('\n') + '\n';
  // (nothing to decide: the last review that also held only the self-tests is updated in place, not repeated)
  fs.writeFileSync(dp, withReviewBlock(fs.existsSync(dp) ? fs.readFileSync(dp, 'utf8') : '', block, items.length === 1 && stPassed));
  const toDecide = items.filter(i => !i.includes('||')).length;
  if (!dry) noteEngineChange(dest, `upgraded to ${starterHead()}: ${toDecide ? `${toDecide} item(s) to decide in "## Upgrade review (${today})"` : 'nothing to decide'}`);
  // what changed in the starter since the last review, to explain the items
  const last = [...decided.matchAll(/^## Upgrade review \((\d{4}-\d\d-\d\d)\)/gm)].pop()?.[1] || '';
  // (the same entries as the breaking notes: new since this project's engine commit. Lesson: "- 2026-10-20 (re-check)"
  // entries never showed here, as the date had to be followed by a colon)
  const news = since.entries;
  // each failing sweep by name, and whether it is only new candidates to decide (expected) or a real regression
  // (Lesson: "0 failing before, 1 after" left a project guessing which check and whether to worry)
  const named = after.failed.map(s => `${s}${onlyNew(s) ? ' (expected: new candidates to decide in the review)' : before.failed.includes(s) ? ' (failed before too)' : ''}`);
  console.log(`\nChecks: ${before.failed.length} failing before, ${after.failed.length} after${named.length ? `: ${named.join('; ')}` : ''}. Hooks: ${Object.entries(after.speed).map(([k, v]) => `${k} ${before.speed[k] ?? '?'} → ${v} ms`).join(', ') || 'not timed'}.`);
  const open = items.filter(i => !i.includes('||'));
  console.log(upgradeReport({ open, news, last, today, revTo, stLine }));
  console.log(summary(open.length));
  process.exit(0);
}

if ((flag('--add-skill') || flag('--add-pack')) && !madeFromStarter) { console.error(`${dest} was not made from the starter. Set it up first: node tools/new-project.mjs "${dest}"`); process.exit(1); }
if (flag('--add-skill')) {
  const sk = opt('--add-skill');
  const src = path.join(STARTER, 'library', 'skills', sk || '');
  if (!sk || !fs.existsSync(path.join(src, 'SKILL.md'))) { console.error(`unknown library skill "${sk}". Available: ${fs.readdirSync(path.join(STARTER, 'library', 'skills')).join(', ')}`); process.exit(1); }
  const entry = JSON.parse(fs.readFileSync(path.join(STARTER, 'library', 'catalog.json'), 'utf8')).skills.find(e => e.name === sk) || {};
  const checks = (entry.requirements || []).map(r => ({ ...r, skill: sk }));
  if (!dry) {
    fs.cpSync(src, path.join(dest, 'skills', sk), { recursive: true });
    // its checks come with it, tagged with the skill, so `tools/skills.mjs disable` can take them out again
    const rq = path.join(dest, 'tools', 'hooks', 'requirements.json');
    const j = JSON.parse(fs.readFileSync(rq, 'utf8'));
    j.requirements = j.requirements.filter(r => !checks.some(c => c.tag === r.tag)).concat(checks);
    fs.writeFileSync(rq, JSON.stringify(j, null, 2) + '\n');
    spawnSync(process.execPath, [path.join(dest, 'tools', 'skills.mjs'), 'refresh'], { cwd: dest, encoding: 'utf8' });
  }
  console.log(`${dry ? 'Dry run: would add' : 'Added'} "${sk}" to ${dest}/skills/${sk}, with its check${checks.length === 1 ? '' : 's'} ${checks.map(c => c.tag).join(', ') || '(none)'}. It routes by its own triggers.`);
  process.exit(0);
}
if (flag('--add-pack')) {
  const pack = opt('--add-pack');
  const src = path.join(STARTER, 'packs', pack || '');
  if (!pack || !fs.existsSync(path.join(src, 'pack.json'))) { console.error(`unknown pack "${pack}". Available: ${fs.readdirSync(path.join(STARTER, 'packs')).join(', ')}`); process.exit(1); }
  if (!dry) fs.cpSync(src, path.join(dest, 'packs', pack), { recursive: true });
  console.log(`${dry ? 'Dry run: would copy' : 'Copied'} the "${pack}" pack payload into ${dest}/packs/${pack}.\nNext, in the project: node tools/packs.mjs install ${pack} && node tools/packs.mjs prune`);
  process.exit(0);
}

const existing = fs.existsSync(dest) ? fs.readdirSync(dest).filter(n => n !== '.git') : [];
if (existing.length && !flag('--adopt')) console.log(`${dest} already has files: adding the starter around them. Nothing existing is overwritten.\n`);
const hadInstructions = ['CLAUDE.md', 'AGENTS.md'].some(f => fs.existsSync(path.join(dest, f)));
// The project's own files, as they were before the starter came: setup never asks to rewrite them (name markers in the
// user's README or web page). Lesson: setup asked to edit an adopted project's README and index.html.
if (existing.length && !dry && !fs.existsSync(path.join(dest, '.starter', 'original-files.txt'))) {
  const own = [];
  const walk = d => { for (const e of fs.readdirSync(path.join(dest, d || '.'), { withFileTypes: true })) { if (/^(\.git|node_modules|\.venv|venv|dist|build|target)$/.test(e.name) || own.length > 20000) continue; const p = d ? `${d}/${e.name}` : e.name; if (e.isDirectory()) walk(p); else own.push(p); } };
  walk('');
  fs.mkdirSync(path.join(dest, '.starter'), { recursive: true });
  fs.writeFileSync(path.join(dest, '.starter', 'original-files.txt'), own.join('\n') + '\n');
}
// The user's own rules are kept as they were, so setup can prove the merge lost none of them (setup-gate).
if (hadInstructions && !dry) for (const f of ['CLAUDE.md', 'AGENTS.md']) if (fs.existsSync(path.join(dest, f)) && !fs.existsSync(path.join(dest, '.starter', 'original-rules', f))) {
  fs.mkdirSync(path.join(dest, '.starter', 'original-rules'), { recursive: true });
  fs.copyFileSync(path.join(dest, f), path.join(dest, '.starter', 'original-rules', f));
}
for (const f of files) {
  if (f === 'README.md' || f.startsWith('tools/starter/') && !/^tools\/starter\/(README\.project\.md|gitignore\.project)$/.test(f)) continue;
  if (f === 'tools/starter/README.project.md') { if (!existing.includes('README.md')) put(f, { as: 'README.md' }); else put(f, { as: 'README.starter.md' }); continue; }
  if (f === 'tools/starter/gitignore.project') {
    const gi = path.join(dest, '.gitignore');
    const lines = fs.readFileSync(path.join(STARTER, f), 'utf8').split(/\r?\n/);
    const neg = lines.filter(l => l.startsWith('!'));
    const keep = lines.filter(l => !l || l.startsWith('#') || l.startsWith('!') || !tracked(l, neg));
    if (keep.length < lines.length) log.push(`kept in git what the project already commits (${lines.filter(l => !keep.includes(l)).join(', ')}): not added to .gitignore`);
    if (!fs.existsSync(gi)) { if (!dry) fs.writeFileSync(gi, keep.join('\n')); log.push('created  .gitignore'); }
    else {
      const have = fs.readFileSync(gi, 'utf8').split(/\r?\n/);
      const add = keep.filter(l => l && !l.startsWith('#') && !have.includes(l));
      if (add.length) { log.push(`appended .gitignore (${add.length} lines)`); if (!dry) fs.appendFileSync(gi, '\n# Project starter\n' + add.join('\n') + '\n'); }
    }
    continue;
  }
  if (f === '.gitignore') continue; // the starter's own ignore list; projects get gitignore.project
  // A repository with history keeps its own line endings: "* eol=lf" would mark every CRLF file as changed. Only the
  // starter's files get LF (its git hooks must have it). Lesson: adopting a Windows repo showed 400 modified files.
  if (f === '.gitattributes' && existing.length && !fs.existsSync(path.join(dest, f)) && spawnSync('git', ['rev-parse', '--verify', 'HEAD'], { cwd: dest, encoding: 'utf8' }).status === 0) {
    if (!dry) fs.writeFileSync(path.join(dest, f), '# The starter\'s files keep LF line endings (its git hooks need them); the project\'s own files keep theirs\n' +
      ['.githooks/**', 'tools/hooks/**', 'tools/*.mjs', 'skills/**', 'docs/playbooks/**', 'docs/checks/**'].map(g => `${g} text eol=lf`).join('\n') + '\n');
    log.push('created  .gitattributes (LF for the starter\'s files only: the project\'s own line endings are kept)');
    continue;
  }
  // An existing CLAUDE.md / AGENTS.md is never replaced: the starter's versions arrive as *.starter.md and the setup
  // merges them. Both get renamed, so the twin sync can't copy one over the user's file.
  if ((f === 'CLAUDE.md' || f === 'AGENTS.md') && hadInstructions) { put(f, { as: f.replace('.md', '.starter.md') }); continue; }
  if (f === 'CLAUDE.md' || f.startsWith('.claude/')) continue; // made for this machine by wire (tools/hooks/wire.mjs)
  if (/^docs\/plans\/(?!README\.md$)/.test(f)) continue; // the starter's own development plans, not the project's
  put(f);
}
if (!dry) {
  fs.mkdirSync(path.join(dest, 'tools', 'hooks', 'state'), { recursive: true });
  // the project starts with no packs installed: setup decides
  const cp = path.join(dest, 'tools', 'hooks', 'config.json');
  // an existing project is marked, so setup also records its current state before changing it
  try { const c = JSON.parse(fs.readFileSync(cp, 'utf8')); c.packs = []; delete c.starter; if (existing.length) c.adopted = today; fs.writeFileSync(cp, JSON.stringify(c, null, 2) + '\n'); } catch { }
  // where this project came from (a path on this machine, ignored by git): setup asks whether to keep the link
  fs.writeFileSync(path.join(dest, 'tools', 'starter.local.json'), JSON.stringify({ path: STARTER }, null, 2) + '\n');
  log.push('linked   tools/starter.local.json → this starter (setup asks: link, keep a copy, or remove)');
}
if (flag('--auto') && !dry) { const cp = path.join(dest, 'tools', 'hooks', 'config.json'); const c = JSON.parse(fs.readFileSync(cp, 'utf8')); c.autonomy = 'auto'; fs.writeFileSync(cp, JSON.stringify(c, null, 2) + '\n'); log.push('autonomy auto: setup assumes the answers and the agent decides without asking (tools/hooks/config.json)'); }
if (flag('--git') && !dry && !fs.existsSync(path.join(dest, '.git'))) {
  const r = spawnSync('git', ['init'], { cwd: dest, encoding: 'utf8' });
  log.push(r.status === 0 ? 'git init done' : `git init failed: ${r.stderr}`);
}
// every agent's wiring, the git hooks, Obsidian, and the generated files for this project (not the starter's)
log.push(...wire(dest, { dry }));
printLog();
console.log(`\n${existing.length ? 'Added the starter to' : 'Created'} ${dest}${dry ? ' (dry run: nothing written)' : ''}.`);
if (existing.length && hadInstructions) console.log('The folder already had CLAUDE.md / AGENTS.md: the starter versions are *.starter.md, and setup merges them (your rules are kept).');
console.log('Next: open the folder with your AI agent and say "set up this project". It reads SETUP-PROMPT.md and does the rest.');
