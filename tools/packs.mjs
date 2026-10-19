#!/usr/bin/env node
// Packs: optional sets of runbooks, checks, config and menu codes on top of the core. A project installs only the
// packs that fit what it is about, so it never carries machinery it doesn't use. REQ: pack-purity.
//   node tools/packs.mjs list                               every available pack, what it is for, installed or not
//   node tools/packs.mjs install knowledge [app ...]        install packs (never overwrites an existing file)
//   node tools/packs.mjs configure app --test "npm test" --build "npm run build" [--code "src/**,lib/**"] [--version-file package.json]
//                                                           wire the app pack's gates to this project's real commands
//   node tools/packs.mjs prune                              after setup: delete the payloads of packs NOT installed
//   node tools/packs.mjs status                             installed packs and whether the project still matches them
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { starterSources, findLibrary, setupCompleteness, usageOf } from './hooks/hooks.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = path.join(ROOT, 'packs');
const REGISTRY = path.join(ROOT, 'tools', 'packs-registry.json');
const CONFIG = path.join(ROOT, 'tools', 'hooks', 'config.json');
const REQS = path.join(ROOT, 'tools', 'hooks', 'requirements.json');
const rd = (p, d = '') => { try { return fs.readFileSync(p, 'utf8'); } catch { return d; } };
const rj = (p, d) => { try { return JSON.parse(rd(p)); } catch { return d; } };
const wj = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2) + '\n');
const rel = p => path.relative(ROOT, p).split(path.sep).join('/');

function filesOf(dir) {
  const out = [];
  const walk = d => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else out.push(path.relative(dir, p).split(path.sep).join('/')); } };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}
// Pack payloads from every source (this project during setup, a kept copy in .starter/, the linked starter folder);
// the first source that has a pack wins. "src" is where its payload lives, "from" says which source that is.
export function available() {
  const out = [];
  for (const s of starterSources()) {
    const dir = path.join(s.dir, 'packs');
    if (!fs.existsSync(dir)) continue;
    for (const n of fs.readdirSync(dir).filter(n => fs.existsSync(path.join(dir, n, 'pack.json')))) {
      if (out.some(p => p.name === n)) continue;
      out.push({ ...rj(path.join(dir, n, 'pack.json'), {}), name: n, src: path.join(dir, n), from: s.kind, files: filesOf(path.join(dir, n, 'files')) });
    }
  }
  return out;
}
// What every pack owns, kept after prune so the audit can still prove a project holds nothing from other packs.
export function registry() {
  const reg = rj(REGISTRY, { packs: {} });
  for (const p of available()) reg.packs[p.name] = { title: p.title, for: p.for, files: p.files, tags: (p.requirements || []).map(r => r.tag), menu: (p.menu || []).map(r => (/^\|\s*([A-Z]\d+)/.exec(r) || [])[1]).filter(Boolean) };
  // the library's skill names, so docs may name a skill the project could still enable
  const lib = findLibrary();
  if (lib) reg.library = [...new Set([...(reg.library || []), ...fs.readdirSync(path.join(lib.dir, 'skills'))])].sort();
  return reg;
}
export const installed = () => rj(CONFIG, {}).packs || [];

function mergeArrays(a = [], b = []) { const out = [...a]; for (const x of b) if (!out.some(y => JSON.stringify(y) === JSON.stringify(x))) out.push(x); return out; }

function insertRows(file, heading, rows) {
  // append rows to the first table (or list) under a "## heading" section
  let text = rd(file);
  const at = text.search(new RegExp(`^##\\s+${heading}`, 'mi'));
  if (at < 0 || !rows.length) return;
  const next = text.slice(at + 3).search(/^##\s/m);
  const end = next < 0 ? text.length : at + 3 + next;
  const section = text.slice(at, end).replace(/\s+$/, '');
  const add = rows.filter(r => !section.includes(r));
  if (!add.length) return;
  text = text.slice(0, at) + section + '\n' + add.join('\n') + '\n' + (next < 0 ? '' : '\n') + text.slice(end).replace(/^\s+/, '');
  fs.writeFileSync(file, text);
}

// REQ: setup-interview. During setup nothing is installed before the user has answered, for agents without hooks too.
export function setupGate() {
  if (!fs.existsSync(path.join(ROOT, 'SETUP-PROMPT.md')) || fs.existsSync(path.join(ROOT, '.starter-template'))) return;
  const probs = setupCompleteness();
  if (probs.length) { console.error('Not yet: setup asks the user first.\n- ' + probs.join('\n- ')); process.exit(1); }
}

function install(names) {
  setupGate();
  const all = available();
  const cfg = rj(CONFIG, {});
  const reqs = rj(REQS, { requirements: [] });
  for (const n of names) {
    const p = all.find(x => x.name === n);
    if (!p) { console.log(`unknown pack "${n}". Available: ${all.map(x => x.name).join(', ') || '(none: payloads were pruned; reinstall from the starter)'}`); process.exit(1); }
    for (const f of p.files) {
      const to = path.join(ROOT, f);
      if (fs.existsSync(to)) { console.log(`kept     ${f} (exists)`); continue; }
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(path.join(p.src, 'files', f), to);
      console.log(`added    ${f}`);
    }
    for (const [k, v] of Object.entries(p.config || {})) cfg[k] = Array.isArray(v) ? mergeArrays(cfg[k], v) : (cfg[k] ?? v);
    for (const q of p.requirements || []) if (!reqs.requirements.some(r => r.tag === q.tag)) { reqs.requirements.push({ ...q, pack: n }); console.log(`check    ${q.tag}`); }
    insertRows(path.join(ROOT, 'docs', 'MENU.md'), 'Codes', p.menu || []);
    insertRows(path.join(ROOT, 'docs', 'MENU.md'), 'Flags', p.flags || []);
    insertRows(path.join(ROOT, 'DIRECTORY.md'), 'Precedence', (p.precedence || []).map(l => `- ${l}`));
    insertRows(path.join(ROOT, 'DIRECTORY.md'), 'Where things live', (p.layout || []).map(r => `| ${r.join(' | ')} |`));
    cfg.packs = mergeArrays(cfg.packs, [n]);
    console.log(`installed pack: ${n}`);
  }
  wj(CONFIG, cfg);
  wj(REQS, reqs);
  wj(REGISTRY, registry());
  // a new pack can make library skills fit (gui → frontend-design): name them, so nothing that fits is missed
  const lib = findLibrary();
  const fits = lib ? rj(path.join(lib.dir, 'catalog.json'), { skills: [] }).skills.filter(e => names.includes(e.for) && !fs.existsSync(path.join(ROOT, 'skills', e.name, 'SKILL.md'))) : [];
  if (fits.length) console.log(`\nLibrary skills that now fit: ${fits.map(e => e.name).join(', ')}. Enable each one that is worth it: node tools/skills.mjs enable <name>`);
  console.log('\nSkills, mirrors and DIRECTORY.md are regenerated. Next: node tools/audit.mjs' + (names.includes('app') ? '\nThen wire the app gates: node tools/packs.mjs configure app --test "<test command>" --build "<build command>" --code "<source globs>"' : ''));
}

function configureApp(argv) {
  const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const cfg = rj(CONFIG, {});
  if (!(cfg.packs || []).includes('app')) { console.log('install the app pack first: node tools/packs.mjs install app'); process.exit(1); }
  if (!['--test', '--build', '--lint', '--typecheck', '--run', '--code', '--version-file'].some(k => argv.includes(k))) {
    console.log('usage: node tools/packs.mjs configure app --test "<cmd>" --build "<cmd>" [--lint "<cmd>"] [--typecheck "<cmd>"] [--run "<cmd>"] [--code "<globs>"] [--version-file <file>]'); process.exit(1);
  }
  if (opt('--version-file') && !fs.existsSync(path.join(ROOT, opt('--version-file')))) console.log(`note: ${opt('--version-file')} does not exist yet; the version-bump check will ask for it once code changes.`);
  const app = cfg.app || {};
  for (const k of ['test', 'build', 'lint', 'typecheck', 'run']) if (opt('--' + k) !== undefined) app[k] = opt('--' + k);
  if (opt('--code')) app.code = opt('--code').split(',').map(s => s.trim()).filter(Boolean);
  if (opt('--version-file')) app.versionFile = opt('--version-file');
  app.code ||= ['src/**', 'app/**', 'lib/**', 'server/**', 'packages/**'];
  cfg.app = app;
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // gates: every configured command must have PASSED (exit 0) this turn before code is committed
  cfg.commitGate = (cfg.commitGate || []).filter(g => !g.app);
  for (const k of ['test', 'build', 'lint', 'typecheck']) if (app[k]) cfg.commitGate.push({ app: true, cmd: escRe(app[k]), pass: '', when: app.code });
  wj(CONFIG, cfg);
  const reqs = rj(REQS, { requirements: [] });
  reqs.requirements = reqs.requirements.filter(r => !r.appGate);
  for (const k of ['test', 'build', 'lint', 'typecheck']) if (app[k]) reqs.requirements.push({
    tag: `app-${k}-pass`, pack: 'app', appGate: true, rule: '4',
    when: { filesChanged: app.code }, require: { toolPassed: { cmd: escRe(app[k]), pass: '', selfRun: app[k] } },
    message: `Code changed: run \`${app[k]}\` and get it passing (exit 0) after your last edit. Fix the code, never the test.`
  });
  if (app.versionFile) reqs.requirements = reqs.requirements.map(r => r.tag === 'version-bump' ? { ...r, enabled: true, when: { ...r.when, filesChanged: app.code }, require: { filesChanged: [app.versionFile] } } : r);
  for (const r of reqs.requirements) if (r.pack === 'app' && r.when?.filesChanged && r.codeGlobs) r.when.filesChanged = app.code;
  wj(REQS, reqs);
  console.log(`configured app gates: ${['test', 'build', 'lint', 'typecheck'].filter(k => app[k]).map(k => `${k}="${app[k]}"`).join(', ') || '(none given)'}; code: ${app.code.join(', ')}`);
  console.log('Next: node tools/hooks/selfcheck.mjs && node tools/audit.mjs');
}

function prune() {
  const keep = installed();
  wj(REGISTRY, registry());
  // only the payloads inside this project; a kept copy and the linked starter are never touched here
  for (const p of available().filter(p => p.from === 'project')) if (!keep.includes(p.name)) { fs.rmSync(path.join(PACKS, p.name), { recursive: true, force: true }); console.log(`removed payload of unused pack: ${p.name}`); }
  for (const n of keep) { fs.rmSync(path.join(PACKS, n), { recursive: true, force: true }); console.log(`removed installed payload (files are in place): ${n}`); }
  try { fs.rmdirSync(PACKS); } catch { }
  console.log(`kept tools/packs-registry.json (what each pack owns) so the audit can check pack purity. Installed: ${keep.join(', ') || '(core only)'}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'list' || !cmd) {
    const inst = installed();
    for (const p of available()) console.log(`${inst.includes(p.name) ? '[installed]' : '[ ]        '} ${p.plain || p.title} (pack: ${p.name})${p.from === 'project' ? '' : ` (from the ${p.from})`}\n            What it does: ${p.does || p.title}\n            What you'll notice: ${p.outcome || '-'}\n            Good when: ${p.good || '-'}\n            Costs: ${p.costs || '-'}\n            For: ${p.for}\n            Not for: ${p.notFor || '-'}`);
    if (!available().length) console.log(`(no pack payloads: the starter's leftovers were removed and no starter is linked) installed: ${inst.join(', ') || 'core only'}\nTo grow later: node tools/starter.mjs link "<starter folder>"`);
  } else if (cmd === 'install') install(rest.filter(a => !a.startsWith('--')));
  else if (cmd === 'configure' && rest[0] === 'app') configureApp(rest.slice(1));
  else if (cmd === 'prune') prune();
  else if (cmd === 'status') console.log(`installed: ${installed().join(', ') || 'core only'}\navailable payloads: ${available().map(p => p.name).join(', ') || '(pruned)'}`);
  else { console.log(usageOf(import.meta.url)); process.exit(1); }
  // runbooks and skills changed: regenerate their skills, mirrors and DIRECTORY.md right away, not "later"
  if (['install', 'prune'].includes(cmd)) { const { syncAll } = await import('./hooks/hooks.mjs'); syncAll(); }
}
