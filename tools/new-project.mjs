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
//   add --dry-run to see what would happen
// The AI installs packs during setup (SETUP-PROMPT.md): it asks what the project is about and picks only what fits.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CORE_SKILLS, today as localToday, usageOf } from './hooks/hooks.mjs';
import { wire } from './hooks/wire.mjs';

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Engine: generic machinery, replaced on --upgrade. Everything else is the project's own content.
const ENGINE = [
  'tools/hooks/hooks.mjs', 'tools/hooks/test-hooks.mjs', 'tools/hooks/git-guard.mjs', 'tools/audit.mjs', 'tools/packs.mjs',
  'tools/writing-check.mjs', 'tools/integrity-check.mjs',
  '.githooks/commit-msg', '.githooks/pre-commit', '.githooks/pre-push',
  'docs/checks/session-checklist.md', 'docs/checks/finish-checklist.md', 'docs/checks/runbook-standards.md',
  'docs/checks/writing-standards.md', 'docs/checks/layout-standards.md',
  'docs/playbooks/_TEMPLATE.md', 'docs/playbooks/_fallback.md', 'HOW-TO-USE.md', 'tools/skills.mjs', 'tools/starter.mjs', 'tools/recall.mjs', 'tools/hooks/wire.mjs', 'tools/hooks/agents/claude-settings.json'
];
// Added on upgrade only when missing: the project may have tuned them.
const ENGINE_IF_MISSING = ['docs/playbooks/plan.md', 'docs/plans/README.md', 'docs/security.md', 'docs/names.json'];
// Core skills are engine too: an upgrade replaces each whole folder (SKILL.md, references, scripts, LICENSE, SOURCE).
// Engine skills merged into another (the old folder and its checks go on upgrade), and pack runbooks whose job an engine
// skill took over (the upgrade review offers to merge them; the project may have tuned them).
const RETIRED_CORE = { 'web-search': { into: 'research', tags: ['search-cited'] } };
const MERGED_RUNBOOKS = { research: 'research', 'answer-question': 'research' };
// Pack files that are engine too: refreshed on upgrade when the project has the pack.
const PACK_ENGINE = { gui: ['tools/screenshot.mjs', 'docs/checks/visual-review.md', 'skills/gui-review-loop/'] };
for (const s of CORE_SKILLS) (function walk(d) {
  const at = path.join(STARTER, d);
  if (!fs.existsSync(at)) return;
  for (const n of fs.readdirSync(at)) { const p = `${d}/${n}`; fs.statSync(path.join(STARTER, p)).isDirectory() ? walk(p) : ENGINE.push(p); }
})(`skills/${s}`);
// Never copied into a project: the starter's own files, personal or machine state, and generated output.
const NEVER = new Set(['.git', 'node_modules', '.cache', 'state', '.starter-template', '.private-terms', 'New Project.bat', 'settings.local.json', '.codex', 'starter.local.json', '.starter', '.obsidian']);
const TEXT = /\.(md|mjs|js|json|txt)$/;

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const target = args.find((a, i) => !a.startsWith('--') && !['--name', '--desc', '--add-pack', '--add-skill'].includes(args[i - 1]));
const dry = flag('--dry-run');
if (!target) { console.log(usageOf(import.meta.url)); process.exit(1); }
const dest = path.resolve(target);
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
const name = opt('--name') || (ownHeading && !ownHeading.includes('{{') ? ownHeading : '') || path.basename(dest);
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
const SNAP = ['tools/hooks/config.json', 'tools/hooks/requirements.json', '.gitignore', 'docs/checks/rule-enforcement.md', '.claude/settings.json', '.codex/hooks.json', 'tools/starter.local.json'];
// The project's audit (which sweeps ran, which failed) and its hook speed, as its current engine reports them.
function probe() {
  if (dry) return { failed: [], swept: [], speed: {} };
  const a = spawnSync(process.execPath, [path.join(dest, 'tools', 'audit.mjs')], { cwd: dest, encoding: 'utf8', timeout: 600000 });
  const rows = [...(a.stdout || '').matchAll(/^(PASS|WARN|FAIL)\s+\d+\.\s+(.+?)(?:\s{2}\(.*)?$/gm)];
  const b = spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'hooks.mjs'), 'bench'], { cwd: dest, encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
  return { failed: rows.filter(r => r[1] === 'FAIL').map(r => r[2].trim()), swept: rows.map(r => r[2].trim()),
    speed: Object.fromEntries([...(b.stdout || '').matchAll(/\b(prompt|pretool|stop) (\d+) ms/g)].map(m => [m[1], +m[2]])) };
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
    if (/^skills\/[^/]+\/SKILL\.md$/.test(as)) text = mergeSkill(fs.readFileSync(from, 'utf8'), mine);
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
// The starter's new SKILL.md, plus the triggers the project added and its "## Project lessons" section.
function mergeSkill(theirs, mine) {
  const trig = t => (/^triggers:\s*(.*)$/m.exec(t)?.[1] || '').split(',').map(s => s.trim()).filter(Boolean);
  const extra = trig(mine).filter(t => !trig(theirs).includes(t));
  let out = theirs;
  if (extra.length) out = /^triggers:/m.test(out) ? out.replace(/^triggers:\s*(.*)$/m, (l, v) => `triggers: ${[v.trim(), ...extra].filter(Boolean).join(', ')}`)
    : out.replace(/^---\r?\n/, `---\ntriggers: ${extra.join(', ')}\n`);
  const lessons = /^## Project lessons[^\n]*\n[\s\S]*?(?=^## |(?![\s\S]))/m.exec(mine)?.[0];
  if (lessons && !out.includes('## Project lessons')) out = out.replace(/\s*$/, '\n\n') + lessons.replace(/\s*$/, '\n');
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
  const backupDir = path.join(dest, '.cache', 'upgrade-backup', stamp);
  const snapMissing = SNAP.filter(f => !fs.existsSync(path.join(dest, f)));
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
  const want = fs.readFileSync(path.join(STARTER, 'tools', 'starter', 'gitignore.project'), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#') && !have.includes(l) && !['CLAUDE.md', '.claude/'].includes(l));
  if (want.length) { log.push(`appended .gitignore (${want.join(', ')})`); if (!dry) fs.appendFileSync(gi, '\n# Project starter\n' + want.join('\n') + '\n'); }
  const lk = path.join(dest, 'tools', 'starter.local.json');
  if (!fs.existsSync(lk) && !dry) { fs.writeFileSync(lk, JSON.stringify({ path: STARTER }, null, 2) + '\n'); log.push('linked   tools/starter.local.json → this starter'); }
  // the core skills' checks: added when the project lacks them, never changed when it has them
  const rq = path.join(dest, 'tools', 'hooks', 'requirements.json');
  try {
    const mine = JSON.parse(fs.readFileSync(rq, 'utf8'));
    const theirs = JSON.parse(fs.readFileSync(path.join(STARTER, 'tools', 'hooks', 'requirements.json'), 'utf8')).requirements;
    const skillChecks = theirs.filter(r => CORE_SKILLS.includes(r.when?.skillUsed) || r.when?.playbookUsed === 'plan');
    const missing = skillChecks.filter(r => !mine.requirements.some(m => m.tag === r.tag));
    if (missing.length) {
      log.push(`added    checks ${missing.map(r => r.tag).join(', ')} to tools/hooks/requirements.json`);
      if (!dry) { mine.requirements.push(...missing); fs.writeFileSync(rq, JSON.stringify(mine, null, 2) + '\n'); }
    }
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
  } catch (e) { log.push(`skipped  core skill checks: ${e.message}`); }
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
  log.push(...wire(dest, { dry })); // every agent's wiring, the git hooks and Obsidian (tools/hooks/wire.mjs)
  console.log(log.join('\n'));
  console.log(`\n${dry ? 'Dry run, nothing written: this is what an upgrade of' : 'Upgraded the engine in'} ${dest}${dry ? ' would change' : ''}. The project's own content (AGENTS.md / CLAUDE.md, requirements.json, config.json, runbooks, knowledge, code) was not touched. ${unchanged} engine file(s) were already current.${backedUp ? ` ${backedUp} replaced file(s) are backed up in .cache/upgrade-backup/${stamp}/.` : ''}`);
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
    spawnSync(process.execPath, [path.join(dest, 'tools', 'hooks', 'hooks.mjs'), 'sync'], { cwd: dest, encoding: 'utf8' });
    console.error(`\nROLLED BACK: after the upgrade these checks failed that passed before: ${broke.join('; ')}. The project is as it was.\n` +
      `The new engine checks more or checks differently. Upgrade with --accept-findings to keep it anyway: each of these goes into the upgrade review, to fix.`);
    process.exit(1);
  }
  const items = [];
  // new hard rules the project doesn't have yet (by their bold title), unless an earlier review decided them
  const decided = fs.existsSync(path.join(dest, 'docs', 'DECISIONS.md')) ? fs.readFileSync(path.join(dest, 'docs', 'DECISIONS.md'), 'utf8') : '';
  const titles = t => [...t.matchAll(/^\d+\. \*\*(.+?)\*\*/gm)].map(m => m[1].replace(/[.:]+$/, ''));
  const mineRules = fs.existsSync(path.join(dest, 'CLAUDE.md')) ? fs.readFileSync(path.join(dest, 'CLAUDE.md'), 'utf8') : '';
  for (const t of titles(fs.readFileSync(path.join(STARTER, 'CLAUDE.md'), 'utf8'))) if (!mineRules.includes(t) && !decided.includes(`- rule: ${t}:`)) items.push(`rule: ${t}`);
  // packs and library skills that fit the project's setup answers and were never enabled or declined
  const fit = spawnSync(process.execPath, ['--input-type=module', '-e', `import { fitGaps } from ${JSON.stringify(pathToFileURL(path.join(dest, 'tools', 'hooks', 'hooks.mjs')).href)}; console.log(JSON.stringify(fitGaps()));`], { cwd: dest, encoding: 'utf8' });
  try { items.push(...JSON.parse(fit.stdout)); } catch { log.push(`skipped  the fit check: ${(fit.stderr || '').split('\n')[0]}`); }
  // the project's own runbooks whose job an engine skill now does: merge what is special about them, then retire them
  for (const [rb, into] of Object.entries(MERGED_RUNBOOKS)) if (fs.existsSync(path.join(dest, 'docs', 'playbooks', `${rb}.md`)) && !decided.includes(`- merge: docs/playbooks/${rb}.md`)) items.push(`merge: docs/playbooks/${rb}.md into the ${into} skill`);
  for (const s of after.failed.filter(s => !before.failed.includes(s))) items.push(`check: ${s.replace(/: /g, ', ')}`);
  for (const [ev, ms] of Object.entries(after.speed)) if (before.speed[ev] && ms > before.speed[ev] * 1.5 && ms - before.speed[ev] > 100) items.push(`speed: the ${ev} hook went from ${before.speed[ev]} to ${ms} ms`);
  items.push('self-tests: node tools/hooks/test-hooks.mjs passes here');
  const dp = path.join(dest, 'docs', 'DECISIONS.md');
  fs.mkdirSync(path.dirname(dp), { recursive: true });
  fs.appendFileSync(dp, `\n## Upgrade review (${today})\n<!-- Decide each line with the user, replacing "?": "adopted - Worth it: <gain> / <cost>", "fixed - <how>" or ` +
    `"declined - <why>". Adopt only what makes this project better. The hooks hold work until every line is decided. -->\n` + items.map(i => `- ${i}: ?`).join('\n') + '\n');
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
for (const f of files) {
  if (f === 'README.md' || f.startsWith('tools/starter/') && !/^tools\/starter\/(README\.project\.md|gitignore\.project)$/.test(f)) continue;
  if (f === 'tools/starter/README.project.md') { if (!existing.includes('README.md')) put(f, { as: 'README.md' }); else put(f, { as: 'README.starter.md' }); continue; }
  if (f === 'tools/starter/gitignore.project') {
    const gi = path.join(dest, '.gitignore');
    if (!fs.existsSync(gi)) put(f, { as: '.gitignore' });
    else {
      const have = fs.readFileSync(gi, 'utf8').split(/\r?\n/);
      const add = fs.readFileSync(path.join(STARTER, f), 'utf8').split(/\r?\n/).filter(l => l && !l.startsWith('#') && !have.includes(l));
      if (add.length) { log.push(`appended .gitignore (${add.length} lines)`); if (!dry) fs.appendFileSync(gi, '\n# Project starter\n' + add.join('\n') + '\n'); }
    }
    continue;
  }
  if (f === '.gitignore') continue; // the starter's own ignore list; projects get gitignore.project
  // An existing CLAUDE.md / AGENTS.md is never replaced: the starter's versions arrive as *.starter.md and the setup
  // merges them. Both get renamed, so the twin sync can't copy one over the user's file.
  if ((f === 'CLAUDE.md' || f === 'AGENTS.md') && hadInstructions) { put(f, { as: f.replace('.md', '.starter.md') }); continue; }
  if (f === 'CLAUDE.md' || f.startsWith('.claude/')) continue; // made for this machine by wire (tools/hooks/wire.mjs)
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
console.log(log.join('\n'));
console.log(`\n${existing.length ? 'Added the starter to' : 'Created'} ${dest}${dry ? ' (dry run: nothing written)' : ''}.`);
if (existing.length && hadInstructions) console.log('The folder already had CLAUDE.md / AGENTS.md: the starter versions are *.starter.md, and setup merges them (your rules are kept).');
console.log('Next: open the folder with your AI agent and say "set up this project". It reads SETUP-PROMPT.md and does the rest.');
