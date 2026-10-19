#!/usr/bin/env node
// What happens to the starter once setup is done. Setup asks the user and runs one of the three choices:
//   node tools/starter.mjs link [starter folder]  remove the leftovers here; add packs, library skills and engine
//                                                 upgrades later straight from the starter folder (recommended)
//   node tools/starter.mjs keep                   move the pack payloads and the skill library into .starter/ (ignored by
//                                                 git), so the project can grow later even without the starter folder
//   node tools/starter.mjs remove                 remove the leftovers and forget the starter
// Later:
//   node tools/starter.mjs status                 the choice, the link, what can still be added, and how many commits the
//                                                 linked starter is behind its git origin
//   node tools/starter.mjs update                 get the newest starter (git pull in the linked copy), then upgrade
//   node tools/starter.mjs upgrade                refresh the engine from the linked starter (new-project.mjs --upgrade):
//                                                 rolls back if a check that passed now fails, then lists what to review
//   node tools/starter.mjs feedback "<text>"      note a lesson about the engine itself (hooks, checks, tools) in
//                                                 docs/starter-feedback.md: one dated line, kept on upgrade
//   node tools/starter.mjs report                 copy the lines not yet reported into the linked starter's
//                                                 docs/feedback-inbox/<project>.md (appends; skipped without a link)
// The starter always lives in its own folder, outside every project it creates. The link is a path on this machine,
// so it is kept in tools/starter.local.json, which git ignores. On another machine, run "link <folder>" again.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, STARTER_LINK, starterLink, starterSources, syncAll, setupCompleteness, usageOf } from './hooks/hooks.mjs';
import { registry } from './packs.mjs';

const CONFIG = path.join(ROOT, 'tools', 'hooks', 'config.json');
const at = (...p) => path.join(ROOT, ...p);
const readCfg = () => { try { return JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { return {}; } };
const setMode = mode => { const c = readCfg(); c.starter = mode; fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2) + '\n'); };
const node = (...a) => spawnSync(process.execPath, a, { cwd: ROOT, encoding: 'utf8' });
const leftovers = () => ['packs', 'library'].filter(d => fs.existsSync(at(d)));
// Lessons about the engine found in this project travel back to the starter. Lesson: engine-level lessons stayed in
// the project where they were found, so every other project hit them again.
const FEEDBACK = 'docs/starter-feedback.md';
const FEEDBACK_HEAD = '# Feedback for the starter\nLessons about the engine itself (hooks, checks, tools), one dated line each. Upgrades keep this file;\n`node tools/starter.mjs report` copies new lines to the linked starter.\n\n';
const feedbackLines = () => { try { return fs.readFileSync(at(FEEDBACK), 'utf8').split(/\r?\n/).filter(l => /^- \d{4}-\d\d-\d\d: \S/.test(l)).map(l => l.trim()); } catch { return []; } };
const reportedLines = () => { try { return new Set(JSON.parse(fs.readFileSync(at('tools', 'hooks', 'state', 'feedback-reported.json'), 'utf8'))); } catch { return new Set(); } };

if (fs.existsSync(at('.starter-template'))) { console.error('This is the starter itself. These commands are for projects made from it.'); process.exit(1); }

const [cmd, arg] = process.argv.slice(2);

// REQ: setup-complete. During setup the leftovers go only once everything that fits the project is in, so nothing is lost.
if (['link', 'keep', 'remove'].includes(cmd) && fs.existsSync(at('SETUP-PROMPT.md'))) {
  const probs = setupCompleteness(undefined, { final: true, beforeStarter: true });
  if (probs.length) { console.error('Not yet. Setup must first give the project everything that fits it:\n- ' + probs.join('\n- ')); process.exit(1); }
}

// Records what every pack owns before the payloads leave, so the audit can still check pack purity.
function saveRegistry() { fs.writeFileSync(at('tools', 'packs-registry.json'), JSON.stringify(registry(), null, 2) + '\n'); }

function clearHere() {
  saveRegistry();
  for (const d of leftovers()) fs.rmSync(at(d), { recursive: true, force: true });
}

function finish(mode, lines) {
  setMode(mode);
  node(path.join('tools', 'skills.mjs'), 'refresh'); // the rule-to-check map lists only enabled library skills
  syncAll();
  console.log([...lines, '', `Record it in docs/DECISIONS.md: "Starter: ${mode}" and why.`].join('\n'));
}

if (cmd === 'link') {
  if (arg) {
    const dir = path.resolve(arg);
    if (!fs.existsSync(path.join(dir, 'tools', 'new-project.mjs'))) { console.error(`${dir} is not a starter folder (no tools/new-project.mjs).`); process.exit(1); }
    if (inside(ROOT, dir) || inside(dir, ROOT)) { console.error('The starter must live outside this project, in its own folder.'); process.exit(1); }
    if (fs.existsSync(path.join(dir, '.starter-dev')) && !(process.env.STARTER_ALLOW_DEV ?? process.env.KS_ALLOW_DEV)) { console.error(`${dir} is a development copy of the starter (.starter-dev). Link a stable copy instead, so unfinished changes never reach this project.`); process.exit(1); }
    fs.writeFileSync(at(STARTER_LINK), JSON.stringify({ path: dir }, null, 2) + '\n');
  }
  const link = starterLink();
  if (!link) { console.error(`No starter is linked. Run: node tools/starter.mjs link "<starter folder>"`); process.exit(1); }
  clearHere();
  finish('link', [`Linked to the starter at ${link}.`, 'Removed packs/ and library/ from this project. Add more later with:',
    '  node tools/packs.mjs install <pack>     node tools/skills.mjs enable <skill>     node tools/starter.mjs upgrade']);
} else if (cmd === 'keep') {
  saveRegistry();
  fs.mkdirSync(at('.starter'), { recursive: true });
  for (const d of leftovers()) {
    fs.cpSync(at(d), at('.starter', d), { recursive: true });
    fs.rmSync(at(d), { recursive: true, force: true });
  }
  const kept = ['packs', 'library'].filter(d => fs.existsSync(at('.starter', d)));
  finish('keep', [`Kept ${kept.join(' and ') || 'nothing (no leftovers were here)'} in .starter/ (ignored by git).`,
    'Add more later with: node tools/packs.mjs install <pack>   node tools/skills.mjs enable <skill>',
    starterLink() ? `The link to ${starterLink()} stays too, for engine upgrades.` : 'No starter is linked, so engine upgrades need: node tools/starter.mjs link "<starter folder>"']);
} else if (cmd === 'remove') {
  clearHere();
  fs.rmSync(at('.starter'), { recursive: true, force: true });
  fs.rmSync(at(STARTER_LINK), { force: true });
  finish('remove', ['Removed the starter\'s leftovers and the link. This project carries only what it uses.',
    'To grow later: node tools/starter.mjs link "<starter folder>", or from the starter: node tools/new-project.mjs "<this folder>" --add-pack / --add-skill']);
} else if (cmd === 'upgrade') {
  const link = starterLink();
  if (!link) { console.error('No starter is linked. Run: node tools/starter.mjs link "<starter folder>" first.'); process.exit(1); }
  const r = spawnSync(process.execPath, [path.join(link, 'tools', 'new-project.mjs'), ROOT, '--upgrade', ...process.argv.slice(3).filter(a => ['--dry-run', '--accept-findings'].includes(a))], { encoding: 'utf8', stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else if (cmd === 'update') {
  // Get the newest starter from where it came from (its git origin), then upgrade this project from it. The upgrade
  // audits before and after and rolls back if anything that passed now fails. Lesson: projects could upgrade only from
  // whatever copy sat on the machine, with no way to fetch a newer release.
  const link = starterLink();
  if (!link) { console.error('No starter is linked. Clone the starter into its own folder (git clone <its repository>), then: node tools/starter.mjs link "<that folder>"'); process.exit(1); }
  if (fs.existsSync(path.join(link, '.starter-dev'))) { console.error(`${link} is a development copy: projects update from a stable copy. Link one with: node tools/starter.mjs link "<stable starter folder>"`); process.exit(1); }
  if (!fs.existsSync(path.join(link, '.git'))) { console.error(`${link} is not a git clone, so it can't fetch updates. Replace it with a clone of the starter's repository, link that, and run update again.`); process.exit(1); }
  const g = (...a) => spawnSync('git', a, { cwd: link, encoding: 'utf8', timeout: 120000 });
  if ((g('status', '--porcelain').stdout || '').trim()) { console.error(`${link} has local changes, so it is left alone. Commit or discard them there, then run update again.`); process.exit(1); }
  const before = g('rev-parse', 'HEAD').stdout.trim();
  const pull = g('pull', '--ff-only', '--quiet');
  if (pull.status !== 0) { console.error(`Could not get the newest starter (offline, or its history changed): ${(pull.stderr || pull.stdout).trim().split('\n')[0]}`); process.exit(1); }
  const after = g('rev-parse', 'HEAD').stdout.trim();
  if (before === after && !process.argv.includes('--force')) { console.log('Done: the starter is already the newest version, so there is nothing to upgrade. (--force upgrades anyway.)'); process.exit(0); }
  console.log(before === after ? 'Upgrading from the current starter (--force).' : `Got the newest starter (${g('rev-list', '--count', `${before}..${after}`).stdout.trim()} new change(s)). Upgrading this project from it.`);
  const r = spawnSync(process.execPath, [path.join(link, 'tools', 'new-project.mjs'), ROOT, '--upgrade', ...process.argv.slice(3).filter(a => ['--dry-run', '--accept-findings'].includes(a))], { encoding: 'utf8', stdio: 'inherit' });
  process.exit(r.status ?? 1);
} else if (cmd === 'status' || !cmd) {
  const mode = readCfg().starter;
  console.log(`choice: ${mode || 'not made yet (setup asks the user: link, keep or remove)'}`);
  console.log(`link: ${starterLink() || 'none'}`);
  console.log(`kept copy: ${fs.existsSync(at('.starter')) ? fs.readdirSync(at('.starter')).join(', ') || 'empty' : 'none'}`);
  if (leftovers().length) console.log(`still here from setup: ${leftovers().join(', ')}`);
  console.log(`packs and library skills come from: ${starterSources().map(s => s.kind).join(' → ')}`);
  // how far the linked starter is behind its own origin (a quiet fetch; nothing is printed offline or outside git)
  const link = starterLink();
  if (link && fs.existsSync(path.join(link, '.git'))) {
    const g = (...a) => spawnSync('git', a, { cwd: link, encoding: 'utf8', timeout: 15000 });
    if (g('fetch', '--quiet').status === 0) {
      const n = g('rev-list', '--count', 'HEAD..@{u}');
      if (n.status === 0 && /^\d+$/.test(n.stdout.trim())) console.log(`linked starter: ${+n.stdout.trim() ? `${n.stdout.trim()} commit(s) behind its origin (node tools/starter.mjs update)` : 'up to date with its origin'}`);
    }
  }
  const fb = feedbackLines(), sent = reportedLines();
  if (fb.length) console.log(`starter feedback: ${fb.length} line(s) in ${FEEDBACK}, ${fb.filter(l => !sent.has(l)).length} not reported yet (node tools/starter.mjs report)`);
} else if (cmd === 'feedback') {
  const text = process.argv.slice(3).join(' ').replace(/\s+/g, ' ').trim();
  if (!text) { console.error('usage: node tools/starter.mjs feedback "<what the engine got wrong or should do>"'); process.exit(1); }
  if (!fs.existsSync(at(FEEDBACK))) { fs.mkdirSync(path.dirname(at(FEEDBACK)), { recursive: true }); fs.writeFileSync(at(FEEDBACK), FEEDBACK_HEAD); }
  const t = new Date(), day = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  fs.appendFileSync(at(FEEDBACK), `${fs.readFileSync(at(FEEDBACK), 'utf8').endsWith('\n') ? '' : '\n'}- ${day}: ${text}\n`);
  console.log(`noted in ${FEEDBACK}. Send it to the starter with: node tools/starter.mjs report`);
} else if (cmd === 'report') {
  const link = starterLink();
  if (!link) { console.log('report: no starter is linked, nothing sent (node tools/starter.mjs link "<starter folder>" first).'); process.exit(0); }
  const lines = feedbackLines();
  const name = (() => { try { return JSON.parse(fs.readFileSync(at('docs', 'names.json'), 'utf8')).PROJECT_NAME; } catch { return ''; } })();
  const slug = (name && !/\{\{/.test(name) ? name : path.basename(ROOT)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  const inbox = path.join(link, 'docs', 'feedback-inbox', `${slug}.md`);
  const have = new Set(fs.existsSync(inbox) ? fs.readFileSync(inbox, 'utf8').split(/\r?\n/).map(l => l.replace(/\s*\(reviewed\b.*$/i, '').trim()) : []);
  const sent = reportedLines(), fresh = lines.filter(l => !have.has(l) && !sent.has(l));
  if (!fresh.length) { console.log(`report: nothing new (${lines.length} line(s) already in ${inbox}).`); process.exit(0); }
  fs.mkdirSync(path.dirname(inbox), { recursive: true });
  if (!fs.existsSync(inbox)) fs.writeFileSync(inbox, `# Feedback from ${slug}\nLessons about the engine from this project. Mark each line "(reviewed YYYY-MM-DD: <what was done>)" once handled.\n\n`);
  fs.appendFileSync(inbox, `${fs.readFileSync(inbox, 'utf8').endsWith('\n') ? '' : '\n'}${fresh.join('\n')}\n`);
  fs.mkdirSync(at('tools', 'hooks', 'state'), { recursive: true });
  fs.writeFileSync(at('tools', 'hooks', 'state', 'feedback-reported.json'), JSON.stringify([...new Set([...reportedLines(), ...fresh])], null, 2) + '\n');
  console.log(`report: sent ${fresh.length} line(s) to ${inbox}.`);
} else {
  console.log(usageOf(import.meta.url));
  process.exit(1);
}

function inside(child, parent) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
