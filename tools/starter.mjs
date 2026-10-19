#!/usr/bin/env node
// What happens to the starter once setup is done. Setup asks the user and runs one of the three choices:
//   node tools/starter.mjs link [starter folder]  remove the leftovers here; add packs, library skills and engine
//                                                 upgrades later straight from the starter folder (recommended)
//   node tools/starter.mjs keep                   move the pack payloads and the skill library into .starter/ (ignored by
//                                                 git), so the project can grow later even without the starter folder
//   node tools/starter.mjs remove                 remove the leftovers and forget the starter
// Later:
//   node tools/starter.mjs status                 the choice, the link, and what can still be added
//   node tools/starter.mjs upgrade                refresh the engine from the linked starter (new-project.mjs --upgrade):
//                                                 rolls back if a check that passed now fails, then lists what to review
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
    if (fs.existsSync(path.join(dir, '.starter-dev')) && !process.env.KS_ALLOW_DEV) { console.error(`${dir} is a development copy of the starter (.starter-dev). Link a stable copy instead, so unfinished changes never reach this project.`); process.exit(1); }
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
} else if (cmd === 'status' || !cmd) {
  const mode = readCfg().starter;
  console.log(`choice: ${mode || 'not made yet (setup asks the user: link, keep or remove)'}`);
  console.log(`link: ${starterLink() || 'none'}`);
  console.log(`kept copy: ${fs.existsSync(at('.starter')) ? fs.readdirSync(at('.starter')).join(', ') || 'empty' : 'none'}`);
  if (leftovers().length) console.log(`still here from setup: ${leftovers().join(', ')}`);
  console.log(`packs and library skills come from: ${starterSources().map(s => s.kind).join(' → ')}`);
} else {
  console.log(usageOf(import.meta.url));
  process.exit(1);
}

function inside(child, parent) {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}
