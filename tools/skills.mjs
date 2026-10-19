#!/usr/bin/env node
// Bring existing third-party skills into the project, so they work for every agent (canonical copy in skills/).
//   node tools/skills.mjs add <owner/repo> <skill>   install one skill (via the open `skills` CLI) into skills/<skill>/
//   node tools/skills.mjs recommended                install every skill in config.json "recommendedSkills" that is missing
//   node tools/skills.mjs list                       recommended skills and whether each is installed
//   node tools/skills.mjs library                    the ready-made skills (library/, a kept .starter/ copy, or the linked starter)
//   node tools/skills.mjs enable <name> [...]        copy library skills into skills/, with their checks
//   node tools/skills.mjs disable <name> [...]       remove a skill and the checks it brought
//   node tools/skills.mjs retire <name> [...]        delete a runbook or skill nobody uses, with its checks and menu codes (skill-curate)
//   node tools/skills.mjs refresh                    re-list the library checks and regenerate mirrors (after skills arrive from outside)
//   node tools/skills.mjs compare <ours> <original>  list text an adapted skill still shares with the original (must be none)
// A downloaded skill is third-party code: read every file it adds. Then make it ours: rewrite it in the project's style
// (plain writing, the AGENTS.md rules, our runbooks and checks), keep its LICENSE, and credit the source in SOURCE.md.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, config, syncAll, findLibrary, CORE_SKILLS, today, usageOf, flushEngineWrites } from './hooks/hooks.mjs';

const cfg = config();
const dir = n => path.join(ROOT, cfg.skillsDir, n);
const recommended = cfg.recommendedSkills || [];

function add(source, skill) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(source || '') || !/^[\w.-]+$/.test(skill || '')) { console.error('usage: node tools/skills.mjs add <owner/repo> <skill>'); return false; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-add-'));
  try {
    // project-scope install into an empty scratch folder, then copy the result here
    // source and skill were checked against strict patterns above, so the one command string is safe for the shell
    const r = spawnSync(`npx -y skills add ${source} --skill ${skill} --agent claude-code -y`, { cwd: tmp, encoding: 'utf8', shell: true, timeout: 300_000 });
    const got = path.join(tmp, '.claude', 'skills', skill);
    if (!fs.existsSync(path.join(got, 'SKILL.md'))) { console.error(`could not install ${source} ${skill}:\n${(r.stdout || '').slice(-800)}${r.stderr || ''}`); return false; }
    // never replace a skill the project already has (it may be our adapted version) unless asked
    if (fs.existsSync(dir(skill)) && !process.argv.includes('--replace')) { console.error(`${cfg.skillsDir}/${skill}/ already exists. Compare first; re-run with --replace to overwrite it.`); return false; }
    fs.rmSync(dir(skill), { recursive: true, force: true });
    fs.cpSync(got, dir(skill), { recursive: true });
    // the skill folder's own license wins over the repo's; fetch the repo's only when the folder has none
    const own = fs.readdirSync(dir(skill)).find(f => /^(LICEN[CS]E|COPYING)(\.(md|txt))?$/i.test(f));
    if (own && own !== 'LICENSE') fs.renameSync(path.join(dir(skill), own), path.join(dir(skill), 'LICENSE'));
    if (!own) {
      const lic = spawnSync(`curl -fsSL https://raw.githubusercontent.com/${source}/HEAD/LICENSE`, { encoding: 'utf8', shell: true, timeout: 60_000 });
      if (lic.status === 0 && lic.stdout.trim()) fs.writeFileSync(path.join(dir(skill), 'LICENSE'), lic.stdout);
      else console.error('no license found in the skill folder or the repo root: check the repo before adapting it, and do not copy its text if it has none.');
    }
    fs.writeFileSync(path.join(dir(skill), 'SOURCE.md'), `Installed from https://github.com/${source} (skill "${skill}") on ${today()} ` +
      `with tools/skills.mjs. Third-party: update by re-running the same command, not by editing these files.\n`);
    const files = [];
    (function walk(d) { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); fs.statSync(p).isDirectory() ? walk(p) : files.push(path.relative(ROOT, p).split(path.sep).join('/')); } })(dir(skill));
    console.log(`installed ${skill} from ${source} into ${cfg.skillsDir}/${skill}/. Read every file, then adapt it (rewrite in the project's style, keep LICENSE, credit in SOURCE.md):\n${files.map(f => '  ' + f).join('\n')}`);
    return true;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

const [cmd, a, b] = process.argv.slice(2);
if (cmd === 'add') process.exitCode = add(a, b) ? 0 : 1;
else if (cmd === 'recommended') {
  let ok = true;
  for (const s of recommended) if (!fs.existsSync(path.join(dir(s.skill), 'SKILL.md'))) ok = add(s.source, s.skill) && ok;
  process.exitCode = ok ? 0 : 1;
} else if (cmd === 'list') {
  for (const s of recommended) console.log(`${fs.existsSync(path.join(dir(s.skill), 'SKILL.md')) ? 'installed' : 'MISSING  '}  ${s.skill}  (${s.source})  ${s.why || ''}`);
} else if (cmd === 'library') {
  const cat = libraryCatalog();
  const lib = findLibrary();
  if (!cat.length) console.log('no skill library: the starter\'s leftovers were removed and no starter is linked. To grow later: node tools/starter.mjs link "<starter folder>"');
  else if (lib.kind !== 'project') console.log(`(from the ${lib.kind})`);
  for (const e of cat) console.log(`${fs.existsSync(path.join(dir(e.name), 'SKILL.md')) ? 'enabled ' : '        '} ${e.plain || e.name} (skill: ${e.name}, fits: ${e.for})\n${' '.repeat(9)}What it does: ${e.does || e.summary}\n${' '.repeat(9)}What you'll notice: ${e.outcome || '-'}\n${' '.repeat(9)}Good when: ${e.good || '-'}\n${' '.repeat(9)}Costs: ${e.costs || '-'}\n${' '.repeat(9)}Question: ${e.ask}`);
} else if (cmd === 'enable') {
  (await import('./packs.mjs')).setupGate();
  const names = process.argv.slice(3).map(skillName);
  for (const n of names) {
    const from = path.join(findLibrary()?.dir || path.join(ROOT, 'library'), 'skills', n);
    if (!fs.existsSync(path.join(from, 'SKILL.md'))) { console.error(`no library skill "${n}". See: node tools/skills.mjs library`); process.exitCode = 1; continue; }
    fs.cpSync(from, dir(n), { recursive: true });
    // copied from the library as it is: not the agent's own new skill (no skill-reuse or name-var on it)
    try { const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.relative(ROOT, path.join(d, e.name)).split(path.sep).join('/')]); flushEngineWrites(walk(dir(n))); } catch { }
    // its checks come with it: the skill routes by its own triggers and the Stop hook proves it was followed
    const reqs = (libraryCatalog().find(e => e.name === n) || {}).requirements || [];
    const added = setRequirements(reqs.map(r => ({ ...r, skill: n })), []);
    console.log(`enabled ${n} → ${cfg.skillsDir}/${n}/${added.length ? ` with its check${added.length > 1 ? 's' : ''} ${added.join(', ')}` : ''}. It routes by its own triggers (SKILL: hint).`);
  }
} else if (cmd === 'disable') {
  for (const n of process.argv.slice(3).map(skillName)) {
    if (!fs.existsSync(path.join(dir(n), 'SKILL.md'))) { console.error(`no skill "${n}" in ${cfg.skillsDir}/`); process.exitCode = 1; continue; }
    fs.rmSync(dir(n), { recursive: true, force: true });
    const removed = setRequirements([], [n]);
    console.log(`disabled ${n}: removed ${cfg.skillsDir}/${n}/${removed.length ? ` and its checks ${removed.join(', ')}` : ''}.`);
  }
} else if (cmd === 'retire') {
  // skill-curate: delete a runbook or skill nobody uses, with its generated files, checks and menu codes
  for (const n of process.argv.slice(3).map(skillName)) {
    const pb = path.join(ROOT, 'docs', 'playbooks', `${n}.md`);
    // a project runbook that shares its name with an engine skill (the skill took over its job) goes; the skill stays
    const core = CORE_SKILLS.includes(n);
    if ((core && !fs.existsSync(pb)) || ['project', 'plan'].includes(n)) { console.error(`${n} is part of the engine and is never retired.`); process.exitCode = 1; continue; }
    const gone = [];
    if (fs.existsSync(pb)) { fs.rmSync(pb); gone.push(`docs/playbooks/${n}.md`); }
    if (!core && fs.existsSync(dir(n))) { fs.rmSync(dir(n), { recursive: true, force: true }); gone.push(`${cfg.skillsDir}/${n}/`); }
    if (!gone.length) { console.error(`no runbook or skill named "${n}"`); process.exitCode = 1; continue; }
    // its checks: tagged with the skill, or triggered by using it
    const rq = path.join(ROOT, 'tools', 'hooks', 'requirements.json');
    const j = JSON.parse(fs.readFileSync(rq, 'utf8'));
    const mine = r => r.when?.playbookUsed === n || (!core && (r.skill === n || r.when?.skillUsed === n || r.forces === n));
    const tags = j.requirements.filter(mine).map(r => r.tag);
    j.requirements = j.requirements.filter(r => !mine(r));
    fs.writeFileSync(rq, JSON.stringify(j, null, 2) + '\n');
    // the rule-to-check map no longer lists them (a row whose last tag goes stays, for the rule it describes)
    const map = path.join(ROOT, 'docs', 'checks', 'rule-enforcement.md');
    if (tags.length && fs.existsSync(map)) fs.writeFileSync(map, fs.readFileSync(map, 'utf8').split('\n').map(l => {
      if (!l.startsWith('| ')) return l;
      const cells = l.split('|'), i = cells.length - 2;
      cells[i] = ' ' + cells[i].split(',').map(t => t.trim()).filter(t => t && !tags.includes(t)).join(', ') + ' ';
      return cells.join('|');
    }).join('\n'));
    const menu = path.join(ROOT, 'docs', 'MENU.md');
    if (fs.existsSync(menu)) fs.writeFileSync(menu, fs.readFileSync(menu, 'utf8').split('\n').filter(l => !new RegExp(`^\\|\\s*[A-Z]\\d+\\s*\\|[^|]*\\|\\s*${n}\\.md\\s*\\|`).test(l)).join('\n'));
    console.log(`retired ${n}: removed ${gone.join(' and ')}${tags.length ? `, checks ${tags.join(', ')}` : ''}. Log it in docs/CHANGELOG.md.`);
    // files that still point at it: fix or remove each mention (the audit fails on broken links and references)
    const refs = [];
    (function walk(d) {
      for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
        const p = d ? `${d}/${e.name}` : e.name;
        if (e.isDirectory()) { if (!/^(\.git|\.claude|\.agents|\.gemini|\.cache|\.starter|node_modules|state|library|packs)$/.test(e.name)) walk(p); }
        else if (/\.md$/.test(e.name) && !/CHANGELOG/.test(e.name) && new RegExp(`\\b${n}\\.md\\b|${cfg.skillsDir}/${n}/`).test(fs.readFileSync(path.join(ROOT, p), 'utf8'))) refs.push(p);
      }
    })('');
    if (refs.length) console.log(`  still mentioned in: ${refs.join(', ')}. Update or remove those mentions.`);
  }
} else if (cmd === 'compare') {
  // Originality check for an adapted skill: every run of 8+ words it shares with the original. Our version keeps the
  // ideas, not the text; short shared phrases are fine, copied sentences are not.
  const ours = process.argv[3], theirs = process.argv[4], N = 8;
  if (!ours || !theirs) { console.error('usage: node tools/skills.mjs compare <our skill folder> <original skill folder>'); process.exit(1); }
  const text = d => { const out = []; (function walk(x) { for (const n of fs.readdirSync(x)) { const p = path.join(x, n); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(md|txt)$/i.test(n) && !/^(LICEN[CS]E|SOURCE)/i.test(n)) out.push(fs.readFileSync(p, 'utf8')); } })(d); return out.join('\n'); };
  const words = s => s.toLowerCase().replace(/https?:\/\/\S+/g, ' ').replace(/[`*_#>|\[\]()]/g, ' ').match(/[a-z0-9']+/g) || [];
  const a = words(text(ours)), b = words(text(theirs));
  const grams = new Set(); for (let i = 0; i + N <= b.length; i++) grams.add(b.slice(i, i + N).join(' '));
  const runs = []; let i = 0;
  while (i + N <= a.length) {
    if (!grams.has(a.slice(i, i + N).join(' '))) { i++; continue; }
    let j = i + N; while (j < a.length && grams.has(a.slice(j - N + 1, j + 1).join(' '))) j++;
    runs.push(a.slice(i, j).join(' ')); i = j;
  }
  const copied = runs.reduce((n, r) => n + r.split(' ').length, 0);
  const pct = a.length ? Math.round(100 * copied / a.length) : 0;
  for (const r of runs) console.log(`  shared (${r.split(' ').length} words): "${r.slice(0, 160)}${r.length > 160 ? '...' : ''}"`);
  console.log(`COMPARE: ${runs.length} shared run(s) of ${N}+ words, ${pct}% of our text. ${runs.length ? 'Rewrite each one in your own words.' : 'Original wording.'}`);
  process.exitCode = runs.length ? 1 : 0;
} else if (cmd === 'refresh') {
  // after skills arrive from outside (new-project --add-skill): re-list their checks and regenerate the mirrors
  console.log('refreshed the library row in docs/checks/rule-enforcement.md and the generated files.');
} else { console.log(usageOf(import.meta.url)); process.exitCode = 1; }
if (['enable', 'disable', 'retire', 'refresh'].includes(cmd)) syncLibraryRow();
if (['add', 'recommended', 'enable', 'disable', 'retire', 'refresh'].includes(cmd) && !process.exitCode) syncAll();

// The "Library" row of the rule-to-check map lists exactly the checks of the library skills this project enabled
// (the requirements that carry a "skill" field), and disappears when there are none.
function syncLibraryRow() {
  const f = path.join(ROOT, 'docs', 'checks', 'rule-enforcement.md');
  if (!fs.existsSync(f)) return;
  let reqs = [];
  try { reqs = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'hooks', 'requirements.json'), 'utf8')).requirements || []; } catch { return; }
  const mine = reqs.filter(r => r.skill);
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  const i = lines.findIndex(l => l.startsWith('| Library |'));
  const row = `| Library | Each enabled library skill proves its own "Done when" (added by \`tools/skills.mjs enable\`) | the skill's SKILL.md | stop, when the skill was used or its event happened: ${[...new Set(mine.map(r => r.skill))].join(', ')} | ${mine.map(r => r.tag).join(', ')} |`;
  if (!mine.length) { if (i >= 0) lines.splice(i, 1); }
  else if (i >= 0) lines[i] = row; else lines.push(row);
  fs.writeFileSync(f, lines.join('\n').replace(/\n*$/, '\n'));
}

// Adds checks (replacing any with the same tag) and drops the checks a removed skill brought. Returns the tags touched.
function setRequirements(add, dropSkills) {
  const f = path.join(ROOT, 'tools', 'hooks', 'requirements.json');
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const before = j.requirements.map(r => r.tag);
  j.requirements = j.requirements.filter(r => !dropSkills.includes(r.skill) && !add.some(a => a.tag === r.tag)).concat(add);
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
  return add.length ? add.map(a => a.tag) : before.filter(t => !j.requirements.some(r => r.tag === t));
}

function libraryCatalog() {
  const lib = findLibrary();
  try { return lib ? JSON.parse(fs.readFileSync(path.join(lib.dir, 'catalog.json'), 'utf8')).skills || [] : []; } catch { return []; }
}

// "library/skills/x/", "x/" and "x" all mean the skill x
function skillName(a) { return path.basename(String(a).replace(/[\/]+$/, '')); }
