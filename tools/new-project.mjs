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
//   add --dry-run to see what would happen (a summary; --verbose lists every file); --dev allows a development copy (.starter-dev) for throwaway test projects
// The AI installs packs during setup (SETUP-PROMPT.md): it asks what the project is about and picks only what fits.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CORE_SKILLS, today as localToday, usageOf, isEngineCheck, shippedChecks, checkKey, ENGINE_CHECKS_HISTORY } from './hooks/hooks.mjs';
import { wire } from './hooks/wire.mjs';

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Engine: generic machinery, replaced on --upgrade. Everything else is the project's own content.
const ENGINE = [
  'tools/hooks/hooks.mjs', 'tools/hooks/selfcheck.mjs', 'tools/hooks/git-guard.mjs', 'tools/audit.mjs', 'tools/packs.mjs',
  'tools/writing-check.mjs', 'tools/integrity-check.mjs',
  '.githooks/commit-msg', '.githooks/pre-commit', '.githooks/pre-push',
  'docs/checks/session-checklist.md', 'docs/checks/finish-checklist.md', 'docs/checks/runbook-standards.md',
  'docs/checks/writing-standards.md', 'docs/checks/layout-standards.md', 'docs/recommended-tools.md', 'docs/checks/better-or-worse.md',
  'docs/playbooks/_TEMPLATE.md', 'docs/playbooks/_fallback.md', 'docs/playbooks/project.md', 'docs/playbooks/plan.md', 'HOW-TO-USE.md', 'tools/skills.mjs', 'tools/starter.mjs', 'tools/recall.mjs', 'tools/hooks/wire.mjs', 'tools/survey.mjs', 'tools/dedupe.mjs', 'tools/fit.mjs',
  'tools/hooks/engine-checks.json', 'tools/hooks/engine-checks-history.json'
];
// The engine's own runbooks (hooks.mjs CORE_RUNBOOKS: project, plan; and _fallback, _TEMPLATE) are engine like the core
// skills: replaced on upgrade, keeping the project's added triggers, its "## Project lessons" section and its
// hardened/harden/keep marks (mergeSkill). Lesson: project.md was in neither list, so upgraded projects kept an old copy
// whose "Done when" items had no (hook:)/(judgment:) labels, and done-when-labeled fired on the engine's own runbook.
// Added on upgrade only when missing: the project may have tuned them.
const ENGINE_IF_MISSING = ['tools/hooks/project-scenarios.mjs', 'docs/plans/README.md', 'docs/security.md', 'docs/names.json', 'docs/glossary.md'];
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
const fill = (text, json) => {
  const v = s => json ? JSON.stringify(s).slice(1, -1) : s;
  return text.replaceAll('{{PROJECT_NAME}}', v(name)).replaceAll('{{CREATED}}', today)
    .replaceAll('{{ONE_LINE}}', v(opt('--desc') || `<!-- One line on what ${name} is for: filled in during setup. -->`));
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
function probe() {
  if (dry) return { failed: [], swept: [], speed: {} };
  const a = spawnSync(process.execPath, [path.join(dest, 'tools', 'audit.mjs')], { cwd: dest, encoding: 'utf8', timeout: 600000 });
  const rows = [...(a.stdout || '').matchAll(/^(PASS|WARN|FAIL)\s+\d+\.\s+(.+?)(?:\s{2}\(.*)?$/gm)];
  const b = spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'hooks.mjs'), 'bench'], { cwd: dest, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
  // each failing sweep's own lines, so a rollback can say exactly what broke
  const details = {}; let cur = null;
  for (const l of (a.stdout || '').split(/\r?\n/)) { const m = /^(PASS|WARN|FAIL)\s+\d+\.\s+(.+?)(?:\s{2}\(.*)?$/.exec(l); if (m) cur = m[1] === 'FAIL' ? m[2].trim() : null; else if (cur && /^\s+- /.test(l)) (details[cur] ||= []).push(l.trim()); }
  return { failed: rows.filter(r => r[1] === 'FAIL').map(r => r[2].trim()), swept: rows.map(r => r[2].trim()), details,
    speed: Object.fromEntries([...(b.stdout || '').matchAll(/\b(prompt|pretool|stop) (\d+) ms/g)].map(m => [m[1], +m[2]])) };
}
// A dry run prints a summary: how many files it would create or update per folder, every file that collides with one
// already there, and the other steps. --verbose prints every line. Lesson: a dry run printed hundreds of file lines and
// buried the few collisions that mattered.
function printLog() {
  if (!dry || flag('--verbose')) { console.log(log.join('\n')); return; }
  const counts = {}, kept = [], other = [];
  for (const l of log) {
    const m = /^(created|updated)\s+(\S+)/.exec(l), k = /^kept\s+(\S+) \(exists\)/.exec(l);
    if (m) { const top = m[2].includes('/') ? m[2].split('/')[0] + '/' : '(root)'; const c = counts[m[1]] ||= {}; c[top] = (c[top] || 0) + 1; }
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
    if (/^(skills\/[^/]+\/SKILL\.md|docs\/playbooks\/[^_/][^/]*\.md)$/.test(as)) text = mergeSkill(fs.readFileSync(from, 'utf8'), mine, rel);
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
const movedLessons = [], legacyScenarios = [], untracked = [];
// every version of a file the starter shipped (from its git history), newest first
function shippedTexts(rel) {
  const git = (...a) => spawnSync('git', a, { cwd: STARTER, encoding: 'utf8', maxBuffer: 64 << 20 });
  return (git('log', '--format=%H', '--', rel).stdout || '').split('\n').filter(Boolean).map(c => git('show', `${c}:${rel}`).stdout || '').filter(Boolean);
}
// The starter's new SKILL.md, plus the triggers the project added and its "## Project lessons" section. Lines the
// project added to the file's "## Pitfalls" (in neither the new file nor any shipped version) move to "## Project
// lessons". Lesson: project.md became an engine runbook, and the pitfalls a project had written into it were lost.
function mergeSkill(theirs, mine, rel) {
  const trig = t => (/^triggers:\s*(.*)$/m.exec(t)?.[1] || '').split(',').map(s => s.trim()).filter(Boolean);
  // a trigger some release shipped is the starter's, not the project's: one the starter has since removed stays removed
  // Lesson: "remember, audit, skill, skills, hook, hooks" came back into project.md after the starter dropped them
  const everShipped = new Set(rel ? [...shippedLines(rel)].filter(l => /^triggers:/.test(l)).flatMap(l => trig(l)) : []);
  const extra = trig(mine).filter(t => !trig(theirs).includes(t) && !everShipped.has(t));
  let out = theirs;
  if (extra.length) out = /^triggers:/m.test(out) ? out.replace(/^triggers:\s*(.*)$/m, (l, v) => `triggers: ${[v.trim(), ...extra].filter(Boolean).join(', ')}`)
    : out.replace(/^---\r?\n/, `---\ntriggers: ${extra.join(', ')}\n`);
  // the project's own marks in the frontmatter (skill-harden, skill-curate) stay, so a replaced runbook is not due again
  const fmOf = t => /^---\r?\n([\s\S]*?)\r?\n---/.exec(t)?.[1] || '';
  const marks = fmOf(mine).split(/\r?\n/).filter(l => /^(hardened|harden|keep):/.test(l) && !new RegExp(`^${l.split(':')[0]}:`, 'm').test(fmOf(out)));
  if (marks.length && /^---\r?\n/.test(out)) out = out.replace(/^(---\r?\n[\s\S]*?)(\r?\n---)/, (m, a, b) => `${a}\n${marks.join('\n')}${b}`);
  let lessons = /^## Project lessons[^\n]*\n[\s\S]*?(?=^## |(?![\s\S]))/m.exec(mine)?.[0];
  const pit = /^## Pitfalls[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(mine)?.[1] || '';
  const known = new Set([...theirs.split(/\r?\n/).map(l => l.trim()), ...(rel ? shippedLines(rel) : [])]);
  const added = pit.split(/\r?\n/).filter(l => /^\s*[-*]\s+\S/.test(l) && !known.has(l.trim()) && !(lessons || '').includes(l.trim()));
  if (added.length) {
    lessons = (lessons ? lessons.replace(/\s*$/, '\n') : '## Project lessons\n') + added.join('\n') + '\n';
    movedLessons.push([rel, added.length]);
  }
  // the heading itself, not a mention of it in the text (Lesson: project.md names the section in a sentence, and the lessons were dropped)
  if (lessons && !/^## Project lessons/m.test(out)) out = out.replace(/\s*$/, '\n\n') + lessons.replace(/\s*$/, '\n');
  return out;
}

// With no mode flag the folder decides: empty → a new project; made from the starter → upgrade its engine; anything
// else → adopt it (existing files are never overwritten). So an agent pointed at the starter needs one command.
const madeFromStarter = fs.existsSync(path.join(dest, 'tools', 'hooks', 'hooks.mjs'));
const auto = !['--adopt', '--upgrade', '--add-pack', '--add-skill'].some(flag);
if (auto && madeFromStarter) console.log(`${dest} was made from the starter: upgrading its engine (its own content stays as it is).\n`);
if (flag('--upgrade') || (auto && madeFromStarter)) {
  if (!madeFromStarter) { console.error(`${dest} is not a project made from the starter (no tools/hooks/hooks.mjs). Use --adopt.`); process.exit(1); }
  // Never worse: audit and time the project before, so the result can be compared after.
  const before = probe();
  const print0 = dry ? null : fingerprint(dest);
  const backupDir = path.join(dest, '.cache', 'upgrade-backup', stamp);
  const snapMissing = SNAP.filter(f => !fs.existsSync(path.join(dest, f)));
  // the core checks this project got from its last upgrade, read before the engine files are replaced (3-way merge below)
  const prevShipped = (() => { try { return JSON.parse(fs.readFileSync(path.join(dest, 'tools', 'hooks', 'engine-checks.json'), 'utf8')).requirements || null; } catch { return null; } })();
  const keptChecks = [], addedChecks = [];
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
  // ignore lines added since the project was made (the starter link, a kept copy), and the link itself if missing
  const gi = path.join(dest, '.gitignore');
  const have = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8').split(/\r?\n/) : [];
  const tmpl = fs.readFileSync(path.join(STARTER, 'tools', 'starter', 'gitignore.project'), 'utf8').split(/\r?\n/), tmplNeg = tmpl.filter(l => l.startsWith('!'));
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
  log.push(...wire(dest, { dry })); // every agent's wiring, the git hooks and Obsidian (tools/hooks/wire.mjs)
  printLog();
  console.log(`\n${dry ? 'Dry run, nothing written: this is what an upgrade of' : 'Upgraded the engine in'} ${dest}${dry ? ' would change' : ''}. The project's own content (AGENTS.md / CLAUDE.md, requirements.json, config.json, its own runbooks, knowledge, code) was not touched, apart from the merged checks listed above. ${unchanged} engine file(s) were already current.${backedUp ? ` ${backedUp} replaced file(s) are backed up in .cache/upgrade-backup/${stamp}/.` : ''}`);
  // regenerate the project's skills, mirrors and DIRECTORY.md with its new engine, so nothing is left stale
  if (!dry) { const r = spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'hooks.mjs'), 'sync'], { cwd: dest, encoding: 'utf8' }); console.log((r.stdout || r.stderr || '').trim()); }
  if (dry) { console.log('\nAn upgrade also audits and times the project before and after, and writes an upgrade review (docs/DECISIONS.md).'); process.exit(0); }
  // Never worse: a check that passed before and fails now rolls the whole upgrade back, unless the user accepts the
  // findings as work to do. New checks that fail and slower hooks go into the review, to fix or decide.
  const after = probe();
  const broke = after.failed.filter(s => before.swept.includes(s) && !before.failed.includes(s));
  if (broke.length && !flag('--accept-findings')) {
    for (const f of created) fs.rmSync(path.join(dest, f), { force: true });
    for (const f of snapMissing) fs.rmSync(path.join(dest, f), { force: true });
    (function restore(d) { for (const n of fs.existsSync(d) ? fs.readdirSync(d) : []) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) restore(p); else if (n.endsWith('.orig')) { const to = path.join(dest, path.relative(backupDir, p).slice(0, -5)); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(p, to); } } })(backupDir);
    // every file the upgrade (or its sync) added goes, then the result is compared with the fingerprint taken before
    const now = fingerprint(dest);
    for (const p of now.keys()) if (!print0.has(p)) fs.rmSync(path.join(dest, p), { force: true });
    (function prune(d) { for (const e of fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }) : []) { const p = path.join(d, e.name); if (e.isDirectory() && !e.isSymbolicLink() && !FP_SKIP.test(e.name)) { prune(p); const r = path.relative(dest, p).split(path.sep).join('/'); try { if (!print0.dirs.has(r) && !fs.readdirSync(p).length) fs.rmdirSync(p); } catch { } } } })(dest);
    if (untracked.length) spawnSync('git', ['add', '-f', '--', ...untracked.filter(f => fs.existsSync(path.join(dest, f)))], { cwd: dest }); // back into git, as before
    const after2 = fingerprint(dest), differ = [...print0].filter(([p, h]) => after2.get(p) !== h).map(([p]) => p);
    console.error(`\nROLLED BACK: after the upgrade these checks failed that passed before: ${broke.join('; ')}. ` +
      (differ.length ? `${differ.length} file(s) could not be put back exactly: ${differ.slice(0, 8).join(', ')} (copies in .cache/upgrade-backup/${stamp}/).\n` : 'The project is exactly as it was (every file checked).\n') +
      broke.map(b => (after.details?.[b] || []).slice(0, 8).map(l => `  ${b}: ${l}`).join('\n')).filter(Boolean).join('\n') + '\n' +
      `The new engine checks more or checks differently. Upgrade with --accept-findings to keep it anyway: each of these goes into the upgrade review, to fix.`);
    process.exit(1);
  }
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
  const fitNew = spawnSync(process.execPath, [path.join(dest, 'tools', 'fit.mjs'), '--count-new'], { cwd: dest, encoding: 'utf8' });
  const fresh = Number((fitNew.stdout || '').trim()) || 0;
  if (fitNew.status !== 0) console.log(`skipped  the fit checklist: ${(fitNew.stderr || '').split(/\r?\n/)[0]}`);
  else if (fresh) items.push(`fit: ${fresh} new candidates`);
  // packs and library skills that fit the project's setup answers and were never enabled or declined
  const fit = spawnSync(process.execPath, ['--input-type=module', '-e', `import { fitGaps } from ${JSON.stringify(pathToFileURL(path.join(dest, 'tools', 'hooks', 'hooks.mjs')).href)}; console.log(JSON.stringify(fitGaps()));`], { cwd: dest, encoding: 'utf8' });
  try { items.push(...JSON.parse(fit.stdout)); } catch { log.push(`skipped  the fit check: ${(fit.stderr || '').split('\n')[0]}`); }
  // the project's own runbooks whose job an engine skill now does: merge what is special about them, then retire them
  for (const [rb, into] of Object.entries(MERGED_RUNBOOKS)) if (fs.existsSync(path.join(dest, 'docs', 'playbooks', `${rb}.md`)) && !decided.includes(`- merge: docs/playbooks/${rb}.md`)) items.push(`merge: docs/playbooks/${rb}.md into the ${into} skill`);
  for (const s of after.failed.filter(s => !before.failed.includes(s) && !(fresh && /fit checklist/.test(s)))) items.push(`check: ${s.replace(/: /g, ', ')}`);
  for (const [ev, ms] of Object.entries(after.speed)) if (before.speed[ev] && ms > before.speed[ev] * 1.5 && ms - before.speed[ev] > 100) items.push(`speed: the ${ev} hook went from ${before.speed[ev]} to ${ms} ms`);
  // no ": " inside an item: the review's parser ends the item at the first one
  for (const a of addedChecks) items.push(`check: ${a}; it now runs in this project's hooks (to switch it off, set its "enabled" to false)`);
  for (const tag of keptChecks) items.push(`check: ${tag}, kept your edited version; the starter's newer one differs (to take it, replace the entry with the one in tools/hooks/engine-checks.json)`);
  if (legacyScenarios.length) items.push(`scenarios: ${legacyScenarios.length} of this project's own test scenarios were in the retired test-hooks.mjs (${legacyScenarios.slice(0, 4).join('; ').replace(/: /g, ' - ')}${legacyScenarios.length > 4 ? '; ...' : ''}); move them into tools/hooks/project-scenarios.mjs from tools/hooks/legacy-scenarios.txt, then delete that file`);
  for (const [file, n] of movedLessons) items.push(`lessons: ${file} became an engine file, so ${n} line(s) this project added moved to its "## Project lessons" section (check they still read right there)`);
  // a repeat upgrade that changed nothing has nothing to review (Lesson: it appended a review holding only "self-tests")
  if (!items.length && !log.some(l => /^(updated|created|removed|renamed)\b/.test(l))) { console.log('\nUPGRADE REVIEW: nothing changed, so there is nothing new to decide.'); process.exit(0); }
  items.push('self-tests: node tools/hooks/selfcheck.mjs passes here');
  const dp = path.join(dest, 'docs', 'DECISIONS.md');
  fs.mkdirSync(path.dirname(dp), { recursive: true });
  // each pack and skill in plain words: what it does and what the user will notice
  const plainOf = i => {
    const [kind, name] = i.split(': ');
    const e = kind === 'skill' ? (JSON.parse(fs.readFileSync(path.join(STARTER, 'library', 'catalog.json'), 'utf8')).skills || []).find(x => x.name === name)
      : kind === 'pack' && fs.existsSync(path.join(STARTER, 'packs', name || '', 'pack.json')) ? JSON.parse(fs.readFileSync(path.join(STARTER, 'packs', name, 'pack.json'), 'utf8')) : null;
    return e?.plain ? `\n  ${e.plain}: ${e.does} What you'll notice: ${e.outcome}` : '';
  };
  fs.appendFileSync(dp, `\n## Upgrade review (${today})\n<!-- Decide each line with the user, or let the AI decide (it writes why), replacing "?": "adopted - Worth it: <gain> / <cost>", ` +
    `"fixed - <how>" or "declined - <why>". Adopt only what makes this project better. -->\n` + items.map(i => `- ${i}: ?${plainOf(i)}`).join('\n') + '\n');
  // what changed in the starter since the last review, to explain the items
  const last = [...decided.matchAll(/^## Upgrade review \((\d{4}-\d\d-\d\d)\)/gm)].pop()?.[1] || '';
  const news = fs.readFileSync(path.join(STARTER, 'tools', 'starter', 'STARTER-CHANGELOG.md'), 'utf8').split(/\n(?=- \d{4}-\d\d-\d\d:)/).filter(e => /^- (\d{4}-\d\d-\d\d)/.test(e) && e.slice(2, 12) > last);
  console.log(`\nChecks: ${before.failed.length} failing before, ${after.failed.length} after. Hooks: ${Object.entries(after.speed).map(([k, v]) => `${k} ${before.speed[k] ?? '?'} → ${v} ms`).join(', ') || 'not timed'}.`);
  console.log(`\nUPGRADE REVIEW: ${items.length} item(s) to decide with the user, in docs/DECISIONS.md "## Upgrade review (${today})":\n` + items.map(i => `  - ${i}`).join('\n'));
  if (news.length) console.log(`\nWhat changed in the starter since ${last || 'this project was made'} (tools/starter/STARTER-CHANGELOG.md):\n` + news.map(e => e.split('\n')[0]).join('\n'));
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
