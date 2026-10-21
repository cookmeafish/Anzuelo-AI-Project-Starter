#!/usr/bin/env node
// Proves the starter makes projects better and never worse. It builds realistic sample projects in a temp folder,
// brings the starter into each one (new, adopt, upgrade, and upgrade again), and checks every promise:
//   node tools/trial.mjs           all sample projects (about a minute)
//   node tools/trial.mjs --deep    also runs the engine's self-tests inside one adopted project (several minutes)
// Starter-only: projects never get this file. Prints TRIAL: PASS or TRIAL: FAIL with each broken promise.
// Each promise answers a question the user would otherwise have to ask: "did it touch my files?", "are my rules
// kept?", "are my secrets still out of git?", "do my own tests and git hooks still work?", "is it slower?", "does a
// second upgrade change anything?", "did anything private from the starter leak in?".
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const deep = process.argv.includes('--deep');
const env = { ...process.env, STARTER_ALLOW_DEV: '1' };
const run = (cmd, args, cwd, timeout = 300000) => spawnSync(cmd, args, { cwd, encoding: 'utf8', env, timeout });
const node = (args, cwd, timeout) => run(process.execPath, args, cwd, timeout);
const git = (args, cwd) => run('git', args, cwd);
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-trial-'));
const results = [];
const check = (project, promise, ok, detail = '') => results.push({ project, promise, ok: !!ok, detail });

const write = (dir, files) => { for (const [f, c] of Object.entries(files)) { const p = path.join(dir, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); } };
// every file under dir with its hash, skipping git's own data and the engine's local state
function snapshot(dir, skip = /^(\.git|tools\/hooks\/state|\.cache)(\/|$)/) {
  const out = {};
  (function walk(d) {
    for (const e of fs.readdirSync(path.join(dir, d), { withFileTypes: true })) {
      const p = d ? `${d}/${e.name}` : e.name;
      if (skip.test(p)) continue;
      if (e.isDirectory()) walk(p); else out[p] = crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, p))).digest('hex');
    }
  })('');
  return out;
}
const gitRepo = (dir, msg = 'initial') => { git(['init', '-q', '-b', 'main'], dir); git(['config', 'user.email', 'trial'], dir); git(['config', 'user.name', 'Trial'], dir); git(['add', '-A'], dir); git(['commit', '-q', '-m', msg], dir); };
// An upgrade runs the project's self-tests itself (minutes each); the trial tests the upgrade's promises, so it leaves
// them out (--deep runs the self-tests once on their own). Lesson: with the self-tests inside, upgrades passed the
// 5-minute limit on a busy machine, were killed mid-output, and every upgrade promise read as broken.
const starterRun = (dir, ...flags) => node([path.join(STARTER, 'tools', 'new-project.mjs'), dir, '--dev', ...flags, ...(flags.includes('--upgrade') ? ['--no-selftest'] : [])], STARTER);
const ignored = (dir, p) => git(['check-ignore', '-q', '--no-index', p], dir).status === 0;

// ---------- the sample projects ----------
const SAMPLES = {
  'empty folder (new project)': { files: {}, mode: [] },
  'notes and data (knowledge, no git)': {
    files: { 'notes/trip ideas.md': '# Trip ideas\nKyoto in spring.\n', 'data/prices.csv': 'item,price\ntent,120\n', 'archive/old rules (CLAUDE.md).md': '# Old rules\nAlways cite sources.\n', 'README.md': '# My notes\n' },
    mode: ['--adopt'] },
  'node app with git, own rules, secrets and husky hooks': {
    files: {
      'package.json': JSON.stringify({ name: 'shop', version: '1.2.3', scripts: { test: 'node --test' } }, null, 2) + '\n',
      'src/price.mjs': 'export const total = (a, b) => a + b;\n',
      'test/price.test.mjs': "import test from 'node:test';\nimport assert from 'node:assert';\nimport { total } from '../src/price.mjs';\ntest('adds', () => assert.equal(total(2, 3), 5));\n",
      'AGENTS.md': '# Shop rules\n- Never change prices without a test.\n- Use metric units.\n',
      '.gitignore': 'node_modules/\n.env\ncoverage-custom/\n',
      '.env': 'API_KEY=not-a-real-key-123\n',
      '.env.example': 'API_KEY=\n',
      '.husky/pre-commit': '#!/bin/sh\necho own hook\n',
      '.claude/settings.json': JSON.stringify({ permissions: { allow: ['Bash(npm test)'] }, hooks: { Stop: [{ hooks: [{ type: 'command', command: 'echo mine' }] }] } }, null, 2) + '\n'
    },
    git: true, hooksPath: '.husky', mode: ['--adopt'] },
  'python app with CLAUDE.md only': {
    files: { 'app.py': 'print("hi")\n', 'CLAUDE.md': '# Python rules\n- Use type hints.\n', 'requirements.txt': 'requests\n' },
    git: true, mode: ['--adopt'] }
};

for (const [name, s] of Object.entries(SAMPLES)) {
  const dir = path.join(WORK, name.replace(/[^a-z0-9]+/gi, '-').replace(/-$/, ''));
  fs.mkdirSync(dir, { recursive: true });
  write(dir, s.files);
  if (s.git) { gitRepo(dir); if (s.hooksPath) git(['config', 'core.hooksPath', s.hooksPath], dir); }
  const before = snapshot(dir);
  const head = s.git ? git(['rev-parse', 'HEAD'], dir).stdout.trim() : '';
  const r = starterRun(dir, '--name', 'Trial', ...s.mode);
  check(name, 'the starter ran without an error', r.status === 0, (r.stderr || r.stdout).slice(-400));
  const after = snapshot(dir);

  // "did it touch my files?" Existing files keep their exact content; only these may grow, and only by appending
  const MAY_GROW = ['.gitignore', '.claude/settings.json'];
  for (const [f, h] of Object.entries(before)) {
    if (MAY_GROW.includes(f)) continue;
    check(name, `kept ${f} exactly as it was`, after[f] === h, after[f] ? 'content changed' : 'deleted');
  }
  if (before['.gitignore']) {
    const was = s.files['.gitignore'].split('\n').filter(Boolean), now = fs.readFileSync(path.join(dir, '.gitignore'), 'utf8').split(/\r?\n/);
    check(name, 'kept every existing .gitignore line', was.every(l => now.includes(l)), was.filter(l => !now.includes(l)).join(', '));
  }
  if (before['.claude/settings.json']) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, '.claude/settings.json'), 'utf8'));
    check(name, "kept the user's own agent permissions and hooks", JSON.stringify(j.permissions || {}).includes('npm test') && JSON.stringify(j.hooks || {}).includes('echo mine'), JSON.stringify(j).slice(0, 300));
  }
  // "are my rules kept?" The user's rule files are untouched, and the starter's arrive beside them for setup to merge
  // the starter's rules are AGENTS.md (a clean clone has no CLAUDE.md: wire makes it on each machine)
  if (before['AGENTS.md'] || before['CLAUDE.md']) check(name, 'the starter\'s rules arrived as AGENTS.starter.md for setup to merge, and the project\'s own rules were kept for the merge check', after['AGENTS.starter.md'] && Object.keys(after).some(p => p.startsWith('.starter/original-rules/')));
  // "are my secrets still out of git?"
  if (s.files['.env']) check(name, '.env stays ignored by git', ignored(dir, '.env'));
  // a tracked .env.example must not keep ".env.*" out (Lesson: .env.local stayed unignored and git hygiene failed)
  if (s.files['.env.example'] && s.git) check(name, '.env.local is ignored while the tracked .env.example stays in git', ignored(dir, '.env.local') && !ignored(dir, '.env.example'));
  // (git can only answer inside a repository; a folder without git is checked once it becomes one)
  if (s.git) for (const p of ['tools/hooks/state/turn.json', '.codex/hooks.json', 'tools/starter.local.json', 'CLAUDE.md']) if (!before[p]) check(name, `${p} is ignored by git`, ignored(dir, p));
  if (s.git) {
    // "did it change my git history or hooks?"
    check(name, 'made no commit and left HEAD where it was', git(['rev-parse', 'HEAD'], dir).stdout.trim() === head);
    if (s.hooksPath) check(name, "kept the project's own git hooks switched on", git(['config', 'core.hooksPath'], dir).stdout.trim() === s.hooksPath);
  }
  // "do my own tests still pass?"
  if (s.files['package.json']) { const t = run(process.execPath, ['--test'], dir); check(name, "the project's own tests still pass", t.status === 0, (t.stdout + t.stderr).slice(-300)); }
  // "did anything private from the starter leak in?"
  for (const p of ['.starter-dev', '.private-terms', 'LICENSE', 'tools/trial.mjs', '.starter-template']) if (!before[p]) check(name, `no ${p} from the starter`, !fs.existsSync(path.join(dir, p)));
  check(name, "none of the starter's own plans came along", !fs.existsSync(path.join(dir, 'docs/plans')) || fs.readdirSync(path.join(dir, 'docs/plans')).every(n => n === 'README.md'));
  // "is everything wired and healthy?"
  const a = node(['tools/audit.mjs'], dir);
  check(name, 'the audit runs with no failed sweep', /audit: PASS/.test(a.stdout), a.stdout.split('\n').filter(l => /^FAIL|^\s+- /.test(l)).slice(0, 8).join(' | '));
  // "is it slower?" The hooks stay within their speed budget
  const b = node(['tools/hooks/hooks.mjs', 'bench'], dir);
  check(name, 'the hooks stay within their speed budget', b.status === 0 && !/over budget|SLOW/i.test(b.stdout), b.stdout.slice(-300));

  // "does an upgrade keep my work, and a second upgrade change nothing?"
  write(dir, { 'docs/playbooks/my-own.md': '---\nname: my-own\nsummary: the project\'s own runbook\ntriggers: my own thing\nchecks: none - a sample runbook in the trial\n---\n# Playbook: my own\n## Steps\n1. Do it.\n## Done when\n- [ ] Done.\n' });
  // an outdated core check is refreshed by the upgrade; one the project marked "custom" is kept as it is
  // 3-way merge: an outdated entry still equal to what was shipped last time (tools/hooks/engine-checks.json) is refreshed;
  // one edited here is kept, marked "custom" and listed in the review; with no earlier shipped copy a differing entry is kept too
  const rqPath = path.join(dir, 'tools/hooks/requirements.json'), rq0 = JSON.parse(fs.readFileSync(rqPath, 'utf8'));
  const ecPath = path.join(dir, 'tools/hooks/engine-checks.json'), noPrev = /python/.test(name);
  const ec0 = fs.existsSync(ecPath) ? JSON.parse(fs.readFileSync(ecPath, 'utf8')) : { requirements: [] };
  const cited = rq0.requirements.find(r => r.tag === 'research-cited'), rooted = rq0.requirements.find(r => r.tag === 'debug-root-cause'), sec = rq0.requirements.find(r => r.tag === 'security-report');
  if (cited) { cited.require = { answerMatches: 'an old pattern' }; const e = ec0.requirements.find(r => r.tag === 'research-cited'); if (e) e.require = { answerMatches: 'an old pattern' }; } // as an older starter shipped it
  if (rooted) Object.assign(rooted, { custom: true, message: 'our own wording' });
  if (sec) sec.message = 'our own security wording'; // edited here, never shipped like this
  fs.writeFileSync(rqPath, JSON.stringify(rq0, null, 2) + '\n');
  if (noPrev) fs.rmSync(ecPath, { force: true }); else fs.writeFileSync(ecPath, JSON.stringify(ec0, null, 2) + '\n');
  // an older engine runbook: project.md with unlabeled "Done when" items, plus the project's own trigger, lessons and mark.
  // Lesson: project.md was never refreshed by upgrades, so done-when-labeled fired on the engine's own runbook.
  const pmPath = path.join(dir, 'docs/playbooks/project.md');
  const pmOld = fs.readFileSync(path.join(STARTER, 'docs/playbooks/project.md'), 'utf8').replace(/\s*\([^)]*\b(hooks?|judgment)\b[^)]*\)/g, '')
    .replace(/^triggers:\s*(.*)$/m, 'triggers: $1, our quarterly tidy-up').replace(/^---\r?\n/, '---\nhardened: 2026-10-01\n')
    .replace(/^## Pitfalls[^\n]*\n/m, m => m + '- Our own pitfall: run the sweeps before a release.\n') + '\n## Project lessons\n- Keep the menu to one screen.\n';
  // an older shipped version of a core check, from the starter's history, with no earlier engine-checks.json: never edited
  // here, so the upgrade refreshes it instead of keeping it as "custom". Lesson: older pack checks were all kept as edits.
  const firstRq = (() => { const g = git(['log', '--format=%H', '--reverse', '--', 'tools/hooks/requirements.json'], STARTER).stdout.split('\n')[0]; try { return JSON.parse(git(['show', `${g}:tools/hooks/requirements.json`], STARTER).stdout).requirements; } catch { return []; } })();
  const oldShipped = noPrev ? firstRq.find(o => o.tag !== 'research-cited' && rq0.requirements.some(r => r.tag === o.tag && !r.custom && JSON.stringify(r) !== JSON.stringify(o)) && !['security-report', 'debug-root-cause'].includes(o.tag)) : null;
  if (oldShipped) { rq0.requirements = rq0.requirements.map(r => r.tag === oldShipped.tag ? oldShipped : r); fs.writeFileSync(rqPath, JSON.stringify(rq0, null, 2) + '\n'); }
  fs.writeFileSync(pmPath, pmOld);
  // installed pack and enabled library skill whose checks this project never got (as with an older starter): the
  // upgrade adds them, with their rule-enforcement rows, and lists them in the review.
  // Lesson: upgrades merged only core checks, so the live hooks skipped pack and library checks the self-tests ran.
  const packSample = /knowledge/.test(name), packTags = ['knowledge-source-trigger', 'a11y-checked'];
  if (packSample) {
    const cfgP = path.join(dir, 'tools/hooks/config.json');
    fs.writeFileSync(cfgP, JSON.stringify({ ...JSON.parse(fs.readFileSync(cfgP, 'utf8')), autonomy: 'auto' }, null, 2) + '\n');
    fs.appendFileSync(path.join(dir, 'docs/DECISIONS.md'), '\n## Setup interview (2026-10-18)\n' + ['Involvement: decide', 'Focus: trip notes', 'Kind of work: knowledge', 'Visual interface: a small page',
      'Typical requests: see docs/BRIEF.md', 'Inputs: notes and prices', 'People: one', 'Sensitive data: none', 'Constraints: none', 'Quality bar: sourced', 'Always/never: none'].map(a => `- ${a.replace(': ', ': assumed - ')}`).join('\n') + '\n');
    const ip = node(['tools/packs.mjs', 'install', 'knowledge'], dir), en = node(['tools/skills.mjs', 'enable', 'frontend-design'], dir);
    check(name, 'the knowledge pack installs and frontend-design enables', ip.status === 0 && en.status === 0, `${ip.stdout.slice(-200)} ${ip.stderr.slice(0, 200)} ${en.stderr.slice(0, 200)}`);
    const rq = JSON.parse(fs.readFileSync(path.join(dir, 'tools/hooks/requirements.json'), 'utf8'));
    rq.requirements = rq.requirements.filter(r => !packTags.includes(r.tag));
    fs.writeFileSync(path.join(dir, 'tools/hooks/requirements.json'), JSON.stringify(rq, null, 2) + '\n');
    const ep = path.join(dir, 'docs/checks/rule-enforcement.md');
    fs.writeFileSync(ep, fs.readFileSync(ep, 'utf8').split('\n').filter(l => !packTags.some(t => l.includes(t))).join('\n'));
    // a pack skill as an older release shipped it (plus a trigger of the project's own), a pack file edited here, and an
    // engine from before the "Involvement" question. Lesson: pack files were never refreshed, and a new setup question
    // failed audit --setup with no word in the upgrade review.
    const kc = 'skills/knowledge-capture/SKILL.md', first = git(['log', '--format=%H', '--reverse', '--', `packs/knowledge/files/${kc}`], STARTER).stdout.split('\n')[0];
    fs.writeFileSync(path.join(dir, kc), git(['show', `${first}:packs/knowledge/files/${kc}`], STARTER).stdout.replace(/^triggers:(.*)$/m, 'triggers:$1, our trip tally'));
    fs.appendFileSync(path.join(dir, 'docs/checks/evidence-standards.md'), '\n- Our own rule: two sources for every price.\n');
    // a file the enabled skill gained after this project got it (its SKILL.md links it)
    fs.rmSync(path.join(dir, 'skills/frontend-design/templates.md'), { force: true });
    const dp = path.join(dir, 'docs/DECISIONS.md'), hp = path.join(dir, 'tools/hooks/hooks.mjs');
    fs.writeFileSync(dp, fs.readFileSync(dp, 'utf8').replace(/^- Involvement:.*\n/m, ''));
    fs.writeFileSync(hp, fs.readFileSync(hp, 'utf8').replace("export const INTERVIEW = ['Involvement', ", 'export const INTERVIEW = ['));
  }
  const mine = snapshot(dir);
  const u1 = starterRun(dir, '--upgrade', '--accept-findings');
  const rq1 = JSON.parse(fs.readFileSync(rqPath, 'utf8')).requirements, starterRq = JSON.parse(fs.readFileSync(path.join(STARTER, 'tools/hooks/requirements.json'), 'utf8')).requirements;
  const review = (() => { try { return fs.readFileSync(path.join(dir, 'docs/DECISIONS.md'), 'utf8'); } catch { return ''; } })();
  if (cited && !noPrev) check(name, 'an upgrade refreshes an outdated core skill check the project never edited', JSON.stringify(rq1.find(r => r.tag === 'research-cited')?.require) === JSON.stringify(starterRq.find(r => r.tag === 'research-cited')?.require));
  if (cited && noPrev) check(name, 'with no earlier shipped copy, an upgrade keeps a differing core check and lists it in the review', rq1.find(r => r.tag === 'research-cited')?.require?.answerMatches === 'an old pattern' && /- check: research-cited, kept your edited version/.test(review));
  if (sec) check(name, 'an upgrade keeps a core check edited in the project, marks it custom and lists it in the review', rq1.find(r => r.tag === 'security-report')?.message === 'our own security wording' && rq1.find(r => r.tag === 'security-report')?.custom === true && /- check: security-report, kept your edited version/.test(review), review.slice(-600));
  if (rooted) check(name, 'an upgrade keeps a core check the project marked "custom"', rq1.find(r => r.tag === 'debug-root-cause')?.message === 'our own wording');
  if (oldShipped) check(name, 'with no earlier shipped copy, an upgrade still refreshes a check equal to an older shipped version', !rq1.find(r => r.tag === oldShipped.tag)?.custom && !new RegExp(`- check: ${oldShipped.tag}, kept`).test(review), oldShipped.tag);
  check(name, "an upgrade moves a pitfall the project wrote into an engine runbook to its Project lessons, and lists it in the review",
    /^## Project lessons[\s\S]*Our own pitfall: run the sweeps/m.test(fs.readFileSync(pmPath, 'utf8')) && /- lessons: docs\/playbooks\/project\.md became an engine file/.test(review), review.slice(-400));
  check(name, 'an upgrade runs without an error', u1.status === 0, (u1.stderr || u1.stdout).slice(-400));
  const pmNew = fs.readFileSync(pmPath, 'utf8'), dw = (/^## Done when[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(pmNew)?.[1] || '').split('\n').filter(l => /^\s*- \[[ x]\]/.test(l));
  check(name, "an upgrade refreshes the engine's project runbook (every Done when item labeled) and keeps its trigger, lessons and hardened mark",
    dw.length && dw.every(l => /\b(hooks?\s*:|judgment\b)/.test(l)) && /^triggers:.*our quarterly tidy-up/m.test(pmNew) && pmNew.includes('Keep the menu to one screen.') && /^hardened: 2026-10-01$/m.test(pmNew),
    dw.filter(l => !/\b(hooks?\s*:|judgment\b)/.test(l)).slice(0, 2).join(' | ') || pmNew.slice(0, 300));
  if (packSample) {
    const ruleMap = fs.readFileSync(path.join(dir, 'docs/checks/rule-enforcement.md'), 'utf8');
    const got = packTags.filter(t => rq1.some(r => r.tag === t && (r.pack === 'knowledge' || r.skill === 'frontend-design')));
    check(name, 'an upgrade adds the new checks of an installed pack and an enabled library skill, with their rows, and lists them in the review',
      got.length === 2 && packTags.every(t => ruleMap.includes(t) && new RegExp(`- check: ${t}, added from`).test(review)), `got ${got.join(', ')} | ${review.slice(-500)}`);
    const kcNow = fs.readFileSync(path.join(dir, 'skills/knowledge-capture/SKILL.md'), 'utf8'), kcStarter = fs.readFileSync(path.join(STARTER, 'packs/knowledge/files/skills/knowledge-capture/SKILL.md'), 'utf8');
    const trig = t => (/^triggers:\s*(.*)$/m.exec(t)?.[1] || '').split(',').map(s => s.trim());
    check(name, "an upgrade refreshes a pack skill the project never edited, keeping the trigger it added, and keeps a pack file it edited",
      trig(kcStarter).every(t => trig(kcNow).includes(t)) && trig(kcNow).includes('our trip tally') && fs.readFileSync(path.join(dir, 'docs/checks/evidence-standards.md'), 'utf8').includes('Our own rule: two sources for every price.'),
      kcNow.slice(0, 300));
    check(name, 'an upgrade brings a file an enabled skill gained since, so its links resolve', fs.existsSync(path.join(dir, 'skills/frontend-design/templates.md')));
    // what the upgrade wrote is the engine's, so the next Stop doesn't count it as the agent's new files (plan-required)
    const ew = (() => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'tools/hooks/state/engine-writes.json'), 'utf8')); } catch { return {}; } })();
    check(name, "an upgrade records the files it wrote as the engine's, so they don't ask for a plan", ['skills/frontend-design/templates.md', 'skills/knowledge-capture/SKILL.md', 'tools/hooks/requirements.json'].every(f => ew[f]), Object.keys(ew).slice(0, 8).join(', '));
    check(name, 'an upgrade names a setup question added since the project was set up', /- interview: Involvement \(new setup question/.test(review), review.slice(-500));
  }
  const afterUp = snapshot(dir);
  check(name, "an upgrade keeps the project's own runbook", afterUp['docs/playbooks/my-own.md'] === mine['docs/playbooks/my-own.md']);
  for (const f of Object.keys(before)) if (!MAY_GROW.includes(f)) check(name, `an upgrade kept ${f}`, afterUp[f] === before[f]);
  const u2 = starterRun(dir, '--upgrade', '--accept-findings');
  const again = snapshot(dir, /^(\.git|tools\/hooks\/state|\.cache|\.starter-backup[^/]*|docs\/DECISIONS\.md|docs\/CHANGELOG\.md)(\/|$)/);
  const prev = Object.fromEntries(Object.entries(afterUp).filter(([f]) => !/^(\.starter-backup[^/]*|docs\/DECISIONS\.md|docs\/CHANGELOG\.md)(\/|$)/.test(f)));
  const diff = [...new Set([...Object.keys(prev), ...Object.keys(again)])].filter(f => prev[f] !== again[f]);
  check(name, 'a second upgrade changes nothing', u2.status === 0 && !diff.length, diff.slice(0, 8).join(', '));

  // "if an upgrade breaks something, is my project exactly as it was?" A project file names the old self-test file, which
  // the upgrade retires (a doc names it too, which the upgrade rewrites): the references sweep then fails, the upgrade
  // rolls back, and every file must match. Lesson: a rollback left rewritten docs and new skill copies behind.
  if (!noPrev) {
    const oldRef = '`node tools/hooks/' + 'test-hooks.mjs`'; // split, so the starter's own audit doesn't read it as a reference
    write(dir, { 'tools/hooks/test-hooks.mjs': '// an old engine file\n', 'docs/old-notes.md': `# Old notes\nRun ${oldRef} after hook changes.\n`, 'tools/my-tool.mjs': `// run ${oldRef} before this tool\n` });
    // an enabled library skill as an older release shipped it, so the upgrade refreshes it and the sync rewrites its
    // mirrors. Lesson: a rollback restored the skill but left the new engine's mirrors and generated runbook skills.
    const fd = 'library/skills/frontend-design/SKILL.md', fdOld = git(['log', '--format=%H', '--reverse', '--', fd], STARTER).stdout.split('\n')[0];
    if (packSample && fdOld) { fs.writeFileSync(path.join(dir, 'skills/frontend-design/SKILL.md'), git(['show', `${fdOld}:${fd}`], STARTER).stdout); node(['tools/hooks/hooks.mjs', 'sync'], dir); }
    const pre = snapshot(dir, /^(\.git|tools\/hooks\/state|\.cache)(\/|$)/);
    const u3 = starterRun(dir, '--upgrade');
    const post = snapshot(dir, /^(\.git|tools\/hooks\/state|\.cache)(\/|$)/);
    const moved = [...new Set([...Object.keys(pre), ...Object.keys(post)])].filter(f => pre[f] !== post[f]);
    check(name, 'an upgrade that breaks a passing check rolls back to exactly the project it was', u3.status === 1 && /ROLLED BACK/.test(u3.stderr) && /exactly as it was/.test(u3.stderr) && !moved.length,
      `status ${u3.status} | ${moved.slice(0, 6).join(', ')} | ${(u3.stderr || '').slice(0, 300)}`);
    // a rolled-back run never reads as a success: no change log ahead of the notice
    check(name, 'a rolled-back upgrade leads with ROLLED BACK and prints no change log', /^ROLLED BACK/.test(u3.stderr.trim()) && !/^(updated|created)\s/m.test(u3.stdout), u3.stdout.slice(0, 300));
    for (const f of ['tools/hooks/test-hooks.mjs', 'docs/old-notes.md', 'tools/my-tool.mjs']) fs.rmSync(path.join(dir, f), { force: true });
  }

  // "is everything that helps added, and nothing that doesn't?" The fit checklist starts undecided, and after the AI
  // fills it the way setup does (no question to the user), it validates. Run last: setup changes the project's files.
  if (s.files['package.json']) {
    const fit = (...a) => node(['tools/fit.mjs', ...a], dir);
    fit();
    const open = fit('check');
    const cp = path.join(dir, 'tools/hooks/config.json');
    fs.writeFileSync(cp, JSON.stringify({ ...JSON.parse(fs.readFileSync(cp, 'utf8')), autonomy: 'auto' }, null, 2) + '\n');
    const answers = ['Involvement: decide', 'Focus: the shop prices', 'Kind of work: software', 'Visual interface: no', 'Typical requests: see docs/BRIEF.md', 'Inputs: the code',
      'People: one', 'Sensitive data: the API key in .env', 'Constraints: none', 'Quality bar: tested', 'Always/never: none'];
    fs.appendFileSync(path.join(dir, 'docs/DECISIONS.md'), `\n## Setup interview (2026-10-18)\n${answers.map(a => `- ${a.replace(': ', ': assumed - ')}`).join('\n')}\n`);
    const inst = node(['tools/packs.mjs', 'install', 'app'], dir);
    const rows = JSON.parse(fit('--json').stdout || '[]');
    const list = rows.map(r => r.item === 'ripgrep' ? { item: r.item, kind: r.kind, decision: 'later - when: the code passes 500 files', reason: 'the agent search tool is fast enough until the code grows much larger' }
      : { item: r.item, kind: r.kind, decision: r.present ? 'add' : 'skip', reason: r.present ? `Worth it: ${r.item} is set up and its checks catch mistakes in the shop code / a little upkeep`
        : `${r.item} adds nothing a small priced-items shop needs yet, so it would only cost upkeep${r.signals.length ? `, even with ${r.signals.join(' and ')}` : ''}` });
    fs.writeFileSync(path.join(WORK, 'fit-decisions.json'), JSON.stringify(list));
    fit('decide', '--file', path.join(WORK, 'fit-decisions.json'));
    const done = fit('check'), sum = fit('summary');
    // "does the recommended last step of setup keep the project healthy?" link (or keep, or remove) takes packs/ and
    // library/ out of the project; the audit must still pass without them. Lesson: right after link, the audit failed on
    // library tags the project had never enabled. (Linking itself waits for setup to finish, so its effect is made here.)
    const parked = path.join(WORK, `${path.basename(dir)}-parked`);
    fs.mkdirSync(parked, { recursive: true });
    for (const d of ['packs', 'library']) if (fs.existsSync(path.join(dir, d))) fs.renameSync(path.join(dir, d), path.join(parked, d));
    const la = node(['tools/audit.mjs'], dir);
    for (const d of ['packs', 'library']) if (fs.existsSync(path.join(parked, d))) fs.renameSync(path.join(parked, d), path.join(dir, d));
    check(name, 'without packs/ and library/ (as after starter.mjs link) the audit still passes', /audit: PASS/.test(la.stdout),
      la.stdout.split('\n').filter(l => /^FAIL|^\s+- /.test(l)).slice(0, 6).join(' | '));
    check(name, 'the fit checklist starts undecided and validates after setup-style filling', /FIT: FAIL/.test(open.stdout) && inst.status === 0 && /FIT: PASS/.test(done.stdout) && /Added: [^.]*\bapp\b/.test(sum.stdout) && /Later: ripgrep \(when: the code passes 500 files\)/.test(sum.stdout),
      `${open.stdout.slice(-120)} | ${inst.stderr.slice(0, 200)} | ${done.stdout.slice(0, 400)} | ${sum.stdout.slice(0, 200)}`);
  }
}

if (deep) {
  const dir = fs.readdirSync(WORK).map(n => path.join(WORK, n)).find(d => fs.existsSync(path.join(d, 'package.json')));
  // mid-setup, like a real project: SETUP-PROMPT.md still there, the fit checklist decided, autonomy on, a plan open.
  // Lesson: the self-tests read the project's own checklist, plans and setup state instead of their sandbox.
  const cfgP = path.join(dir, 'tools/hooks/config.json');
  try { fs.writeFileSync(cfgP, JSON.stringify({ ...JSON.parse(fs.readFileSync(cfgP, 'utf8')), autonomy: 'auto' }, null, 2) + '\n'); } catch { }
  write(dir, { 'docs/plans/2026-10-18-setup.md': '# Setup: plan\n- [x] interview\n- [ ] runbooks\n', 'tools/hooks/state/setup.json': '{"prompts":1}' });
  // and the project's own content the fixtures must never see: real duplicates in an originals folder, a decided fit
  // checklist with a "later" row about the project's own files, and files that match it.
  // Lesson: in a big project the fit and dedupe tests read the project's real checklist, files and duplicates.
  try { const c = JSON.parse(fs.readFileSync(cfgP, 'utf8')); c.protectedOriginals = [...new Set([...(c.protectedOriginals || []), 'sources/**'])]; fs.writeFileSync(cfgP, JSON.stringify(c, null, 2) + '\n'); } catch { }
  write(dir, { 'sources/raid-a.png': 'same bytes', 'sources/raid-a-copy.png': 'same bytes', 'sources/raid-b.png': 'same bytes',
    ...Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`notes/raid-${i}.md`, `# Raid ${i}\n`])) });
  node(['tools/fit.mjs'], dir);
  const fitRows = JSON.parse(node(['tools/fit.mjs', '--json'], dir).stdout || '[]').map(r => ({ item: r.item, kind: r.kind,
    decision: r.item === 'fd' ? 'later - when: more than 6 raid files' : r.present ? 'add' : 'skip',
    reason: r.present ? `Worth it: ${r.item} is set up in this project and keeps its checks running / a little upkeep` : `${r.item} adds nothing this sample project needs, so it would only cost upkeep${r.signals.length ? `, even with ${r.signals.join(' and ')}` : ''}` }));
  fs.writeFileSync(path.join(WORK, 'deep-fit.json'), JSON.stringify(fitRows));
  node(['tools/fit.mjs', 'decide', '--file', path.join(WORK, 'deep-fit.json')], dir);
  const t = node(['tools/hooks/selfcheck.mjs'], dir, 1800000);
  check('deep', "the engine's self-tests pass inside an adopted project mid-setup", fs.existsSync(path.join(dir, 'SETUP-PROMPT.md')) && /ALL PASS/.test(t.stdout), t.stdout.split('\n').filter(l => /^FAIL/.test(l)).slice(0, 5).join(' | '));
}

const bad = results.filter(r => !r.ok);
// Status word in color only for a person at a terminal (writing-standards.md "In the terminal"); pipes get plain text.
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = s => COLOR ? `\x1b[${s === 'PASS' ? 32 : 31}m${s}\x1b[0m` : s;
for (const r of bad) console.log(`${paint('FAIL')}  [${r.project}] ${r.promise}${r.detail ? `: ${r.detail.replace(/\s+/g, ' ').slice(0, 300)}` : ''}`);
console.log(`\nTRIAL: ${paint(bad.length ? 'FAIL' : 'PASS')} (${results.length - bad.length} of ${results.length} promises kept across ${Object.keys(SAMPLES).length} sample projects)`);
if (!bad.length) fs.rmSync(WORK, { recursive: true, force: true }); else console.log(`Sample projects kept for a look: ${WORK}`);
process.exit(bad.length ? 1 : 0);
