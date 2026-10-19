#!/usr/bin/env node
// Project sweeps: structure, routing, generated files, rules ↔ checks, skills, packs, publish safety, git hygiene.
//   node tools/audit.mjs           structural sweeps
//   node tools/audit.mjs --full    + the hook self-tests and ablation tests (and, in the starter, the trial)
//   node tools/audit.mjs --setup   + the hook self-tests and the setup gate (SETUP-PROMPT.md may be deleted only when this passes)
// FAIL = fix before finishing. WARN = worth fixing. Fix the project, never weaken a sweep to make it pass.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ROOT, read, abs, exists, frontmatter, playbooks, skillProblems, playbookProblems, knowledgeProblems, config,
  loadRequirements, usage, hardenDue, menu, runbookHasCheck, generatedSkill, directoryBlock, staleKnowledge,
  setupProblems, upgradeProblems, bench, gitignoreProblems, writingProblems, aiAttributedCommits, BASE_REQUIREMENTS, routableSkills, skillHasCheck, curateDue,
  FIT_FILE, fitProblems, fitRows, fitDecision, fitWhenOf, doneWhenItems, DONE_LABEL, findLibrary, secretHit, mirrorText, logRun, testInputsHash, deadTriggers
} from './hooks/hooks.mjs';

const cfg = config();
const results = [];
// An adopted project before setup keeps its own AGENTS.md / CLAUDE.md, with the starter's beside them as *.starter.md.
// Until setup merges them, what depends on the merged rules file is setup's job, not a failure of the project.
const MERGE_PENDING = exists('SETUP-PROMPT.md') && !exists('.starter-template') && ['AGENTS.starter.md', 'CLAUDE.starter.md'].some(exists);
const AFTER_MERGE = /identical twins|every hard rule|relative links resolve|every REQ tag|rules map/i;
const sweep = (name, fn) => {
  let out;
  try { out = fn() || {}; } catch (e) { out = { fail: [`sweep crashed: ${e.message}`] }; }
  if (MERGE_PENDING && AFTER_MERGE.test(name) && out.fail?.length) out = { warn: [...out.fail.map(l => `${l} (setup merges the rules files: SETUP-PROMPT.md)`), ...(out.warn || [])] };
  const fail = out.fail || [], warn = out.warn || [];
  results.push({ name, status: fail.length ? 'FAIL' : warn.length ? 'WARN' : 'PASS', lines: [...fail, ...warn], note: out.note || '' });
};
// (.agents, .codex and .gemini hold generated agent wiring and skill copies, like .claude: never the project's notes)
const SKIPDIR = /^(\.git|node_modules|state|\.cache|\.starter|\.agents|\.codex|\.gemini|dist|build|__pycache__)$/;
const walk = (d, pred, acc = [], skip = SKIPDIR) => {
  let names = []; try { names = fs.readdirSync(abs(d || '.')); } catch { return acc; }
  for (const n of names) {
    const p = d ? `${d}/${n}` : n;
    if (skip.test(n)) continue;
    let s; try { s = fs.lstatSync(abs(p)); } catch { continue; }
    if (s.isSymbolicLink()) continue; // never follow a link (Lesson: a workspace link loop hung the audit)
    if (s.isDirectory()) walk(p, pred, acc, skip); else if (pred(p)) acc.push(p);
  }
  return acc;
};
const isTemplate = exists('.starter-template');
const pbs = playbooks();
const hooksSrc = read(abs('tools/hooks/hooks.mjs'));
const testsSrc = read(abs('tools/hooks/selfcheck.mjs')) + read(abs('tools/hooks/project-scenarios.mjs')); // the project's own scenarios count too
const { reqs, fileReqs = [], error: reqError, disabled = [] } = loadRequirements();
const baseTags = new Set(BASE_REQUIREMENTS.map(b => b.tag));
// pack checks count as known even when the pack is not installed here (the starter keeps them in packs/*/pack.json)
const packTags = new Set([...(() => { try { return fs.readdirSync(abs('packs')); } catch { return []; } })().flatMap(n => { try { return JSON.parse(read(abs(`packs/${n}/pack.json`))).requirements.map(r => r.tag); } catch { return []; } }),
  ...Object.values((() => { try { return JSON.parse(read(abs('tools/packs-registry.json'))).packs; } catch { return {}; } })()).flatMap(p => p.tags || []),
  // library skills' checks, which enable adds to requirements.json
  ...(() => { try { return JSON.parse(read(abs('library/catalog.json'))).skills.flatMap(e => (e.requirements || []).map(r => r.tag)); } catch { return []; } })(),
  // every check the engine ships, from the project's own engine-checks.json: library/ goes once the starter is linked,
  // kept or removed. Lesson: right after "starter.mjs link", library tags in rule-enforcement.md were "enforced nowhere".
  ...(() => { try { return JSON.parse(read(abs('tools/hooks/engine-checks.json'))).requirements.map(r => r.tag); } catch { return []; } })()]);
const coreTags = new Set([...hooksSrc.matchAll(/REQ: ([a-z0-9-]+)/g)].map(m => m[1]));
const reqTags = new Set(fileReqs.map(r => r && r.tag).filter(Boolean));
const knownTag = t => coreTags.has(t) || reqTags.has(t) || packTags.has(t);
const skillNames = fs.existsSync(abs(cfg.skillsDir)) ? fs.readdirSync(abs(cfg.skillsDir)).filter(n => exists(`${cfg.skillsDir}/${n}/SKILL.md`)) : [];
const git = (...a) => spawnSync('git', a, { cwd: ROOT, encoding: 'utf8' });
const isRepo = exists('.git');

sweep('AGENTS.md and CLAUDE.md are identical twins', () => !exists('CLAUDE.md') ? { warn: ['CLAUDE.md is made on each machine: run node tools/hooks/wire.mjs'] } :
  read(abs('CLAUDE.md')) && read(abs('CLAUDE.md')) === read(abs('AGENTS.md')) ? {} : { fail: ['AGENTS.md and CLAUDE.md differ or one is missing. Run node tools/hooks/hooks.mjs sync (both must say they "are twins").'] });

sweep('hooks wired for every agent', () => {
  const fail = [], warn = [];
  const want = { SessionStart: 'session', UserPromptSubmit: 'prompt', PreToolUse: 'pretool', PostToolUse: 'posttool', Stop: 'stop' };
  if (!exists('.claude/settings.json')) return { warn: ['the agent wiring is made on each machine: run node tools/hooks/wire.mjs'] };
  let j; try { j = JSON.parse(read(abs('.claude/settings.json'))); } catch (e) { return { fail: [`.claude/settings.json does not parse: ${e.message}`] }; }
  for (const [ev, arg] of Object.entries(want)) if (!(j.hooks?.[ev] || []).flatMap(m => m.hooks || []).some(h => (h.command || '').includes('hooks.mjs') && new RegExp(`\\b${arg}\\b`).test(h.command))) fail.push(`.claude/settings.json: ${ev} does not run hooks.mjs ${arg}`);
  const pre = (j.hooks?.PreToolUse || []).map(m => m.matcher || '').join('|');
  for (const t of ['Write', 'Edit', 'Bash', 'PowerShell', 'Read', 'Agent']) if (!pre.includes(t)) warn.push(`.claude/settings.json: PreToolUse matcher lacks ${t}`);
  if (exists('.codex/hooks.json')) { try { const c = JSON.parse(read(abs('.codex/hooks.json'))); if (!JSON.stringify(c).includes('hooks.mjs')) fail.push('.codex/hooks.json does not run hooks.mjs'); } catch (e) { fail.push(`.codex/hooks.json does not parse: ${e.message}`); } }
  if (j.includeCoAuthoredBy !== false) warn.push('.claude/settings.json: set "includeCoAuthoredBy": false (no AI attribution)');
  for (const g of ['commit-msg', 'pre-push', 'pre-commit']) if (!exists(`.githooks/${g}`)) fail.push(`.githooks/${g} is missing`);
  const hp = isRepo ? (git('config', 'core.hooksPath').stdout || '').trim() : '.githooks';
  if (hp !== '.githooks') {
    // the project's own hooks are kept (wire.mjs); they pass when they call ours
    const own = hp || '.git/hooks', calls = ['commit-msg', 'pre-push', 'pre-commit'].every(g => /\.githooks\//.test(read(abs(`${own}/${g}`)) || ''));
    const real = hp || (exists('.git/hooks') && fs.readdirSync(abs('.git/hooks')).some(n => !n.endsWith('.sample')));
    if (!real) fail.push('git hooks are not enabled: run node tools/hooks/wire.mjs');
    else if (!calls) warn.push(`the project's own git hooks (${own}) don't call .githooks/commit-msg, pre-commit and pre-push, so git does not check AI attribution, secrets or .gitignore (the agent hooks still do)`);
  }
  return { fail, warn };
});

// a warning, never a failure: older runbooks get labeled when they are next changed (the stop check then requires it)
sweep('every "Done when" item says how it is proven', () => {
  const files = walk('', p => /^(docs\/playbooks\/[^/_][^/]*\.md|(skills|library\/skills|packs\/[^/]+\/files\/skills)\/[^/]+\/SKILL\.md|packs\/[^/]+\/files\/docs\/playbooks\/[^/_][^/]*\.md)$/.test(p));
  const warn = files.flatMap(p => { const n = doneWhenItems(read(abs(p))).filter(i => !DONE_LABEL.test(i)).length; return n ? [`${p}: ${n} item(s) without "(hook: <tag>)" or "(judgment: <why>)"`] : []; });
  return { warn, note: `${files.length} files` };
});

sweep('requirements.json is valid', () => {
  if (reqError) return { fail: [`does not parse: ${reqError}`] };
  const fail = [], warn = disabled.map(d => `baseline check "${d.tag}" is turned off: ${d.reason}`), seen = new Set();
  const regexKeys = ['promptMatches', 'promptNotMatches', 'answerMatches', 'answerNotMatches', 'toolRan', 'toolUsed', 'resultMatches'];
  const installed = cfg.packs || [];
  for (const r of fileReqs) {
    if (!r || !r.tag) { fail.push('an entry has no tag'); continue; }
    if (seen.has(r.tag)) fail.push(`duplicate tag ${r.tag}`); seen.add(r.tag);
    if (!r.message) fail.push(`${r.tag}: no message (tell the agent what to do)`);
    if (!r.require || !Object.keys(r.require).length) fail.push(`${r.tag}: empty require`);
    if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(JSON.stringify(r).replace(/\\u00[01][0-9a-f]/gi, m => String.fromCharCode(parseInt(m.slice(2), 16))))) fail.push(`${r.tag}: contains a control character (a regex "\\b" written as a backspace?)`);
    for (const part of [r.when || {}, r.require || {}]) for (const k of regexKeys) if (part[k]) { try { new RegExp(part[k], 'im'); } catch (e) { fail.push(`${r.tag}: bad regex in ${k}: ${e.message}`); } }
    if (part2(r)) fail.push(`${r.tag}: toolPassed.cmd regex invalid`);
    if (coreTags.has(r.tag) && !baseTags.has(r.tag)) fail.push(`${r.tag}: tag is also a core check in hooks.mjs (use another tag)`);
    if (r.pack && !installed.includes(r.pack) && !isTemplate) fail.push(`${r.tag}: belongs to pack "${r.pack}", which is not installed (pack purity)`);
  }
  return { fail, warn, note: `${BASE_REQUIREMENTS.length} baseline + ${fileReqs.length} project checks` };
});
function part2(r) { try { const tp = r.require?.toolPassed; if (tp && typeof tp === 'object') new RegExp(tp.cmd); return false; } catch { return true; } }

sweep('runbooks are well-formed, routed and checked', () => {
  const fail = [], warn = [];
  for (const pb of pbs) {
    fail.push(...playbookProblems(pb.file));
    if (pb.fm.trigger_regex && !pb.triggerRe) fail.push(`${pb.file}: trigger_regex does not compile`);
    if (!pb.name.startsWith('_') && !runbookHasCheck(pb)) fail.push(`${pb.file}: no check (a requirements.json entry with playbookUsed "${pb.name}", or "checks: core ..." / "checks: none - <reason>")`);
  }
  const by = {};
  for (const pb of pbs) for (const t of pb.triggers) (by[t] ||= []).push(pb.name);
  for (const [t, names] of Object.entries(by)) if (names.length > 1) warn.push(`trigger "${t}" is shared by ${names.join(', ')} (add a precedence line in DIRECTORY.md or make it specific)`);
  for (const pb of pbs) for (const t of pb.triggers) if (t.length < 4 && !/\s/.test(t) && !/^(qa|ui|gui|css|xss|fps|bug)$/.test(t)) warn.push(`${pb.file}: trigger "${t}" is very short and may match unrelated messages`);
  // one common word ("looks", "fix") never routes: the router skips it. Lesson: the gui runbook's "looks" matched nothing.
  for (const item of [...pbs, ...routableSkills(cfg)]) for (const t of deadTriggers(item.triggers || [])) warn.push(`${item.file}: trigger "${t}" is one common word, so it never routes: make it a phrase ("looks bad") or a specific word`);
  return { fail, warn, note: `${pbs.length} runbooks` };
});

sweep('generated files are current (skills, mirrors, DIRECTORY.md)', () => {
  const fail = [];
  for (const pb of pbs.filter(p => p.skillName && !p.fm.skill)) {
    const f = `${cfg.skillsDir}/${pb.skillName}/SKILL.md`;
    const cur = read(abs(f));
    if (!cur) fail.push(`${f} is missing (run node tools/hooks/hooks.mjs sync)`);
    else if (/^generated:\s*true/m.test(cur) && cur !== generatedSkill(pb)) fail.push(`${f} is out of date (sync)`);
  }
  // a mirror is the skill with its relative links re-pointed from the mirror's folder (hooks.mjs mirrorText)
  for (const m of cfg.skillMirrors) for (const n of skillNames) if (read(abs(`${m}/${n}/SKILL.md`)) !== mirrorText(read(abs(`${cfg.skillsDir}/${n}/SKILL.md`)), `${cfg.skillsDir}/${n}`, `${m}/${n}`)) fail.push(`${m}/${n}/SKILL.md differs from ${cfg.skillsDir}/${n}/SKILL.md (sync)`);
  if (!read(abs('DIRECTORY.md')).includes(directoryBlock(cfg))) fail.push('DIRECTORY.md is out of date (sync)');
  return { fail };
});

sweep('menu codes point at real runbooks', () => {
  const { codes } = menu(), fail = [], warn = [];
  for (const [c, r] of Object.entries(codes)) if (!exists(`docs/playbooks/${r.playbook}`)) fail.push(`${c} → docs/playbooks/${r.playbook} does not exist`);
  for (const pb of pbs) if (pb.fm.menu && !codes[pb.fm.menu]) warn.push(`${pb.file}: menu ${pb.fm.menu} is not in docs/MENU.md`);
  return { fail, warn, note: `${Object.keys(codes).length} codes` };
});

sweep('relative links resolve', () => {
  const fail = [];
  const files = walk('', p => p.endsWith('.md') && !p.startsWith('.claude/') && !p.startsWith('packs/') && !p.startsWith('tools/starter/'));
  for (const f of files) {
    const text = read(abs(f)).replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
    for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      const link = m[1].split('#')[0];
      if (!link || /^[a-z]+:/i.test(link) || /[<{]/.test(link)) continue;
      const target = path.relative(ROOT, path.resolve(path.dirname(abs(f)), decodeURI(link))).split(path.sep).join('/');
      if (!exists(target)) fail.push(`${f}: broken link ${m[1]}`);
    }
  }
  return { fail, note: `${files.length} files` };
});

// Every path, command and skill a doc names is real: here, in a pack or library skill the project could add, or an
// output that work creates. Lesson: renames and moves left docs pointing at files and commands that no longer existed.
sweep('references point at real files, commands and skills', () => {
  const fail = [];
  const reg = (() => { try { return JSON.parse(read(abs('tools/packs-registry.json'))); } catch { return {}; } })();
  const provided = new Set();
  const addPath = p => { provided.add(p); while (p.includes('/')) { p = p.slice(0, p.lastIndexOf('/')); provided.add(p); } };
  for (const p of Object.values(reg.packs || {})) for (const f of p.files || []) addPath(f);
  for (const f of walk('packs', p => /^packs\/[^/]+\/files\//.test(p))) addPath(f.replace(/^packs\/[^/]+\/files\//, ''));
  // optional skills a core skill may name ("the incident-response skill, when enabled"), from wherever the library is
  // (Lesson: after setup removed library/, the debug skill's mention of incident-response failed this sweep)
  const lib = findLibrary(); let catNames = [];
  try { catNames = lib ? (JSON.parse(read(path.join(lib.dir, 'catalog.json'))).skills || []).map(e => e.name) : []; } catch { }
  const libNames = new Set([...(reg.library || []), ...catNames, ...(exists('library/skills') ? fs.readdirSync(abs('library/skills')) : [])]);
  for (const n of libNames) addPath(`skills/${n}/SKILL.md`);
  for (const f of walk('library/skills', () => true)) addPath(f.replace(/^library\//, ''));
  // folders that work fills in, files tools create at runtime, and the starter folder's own files (tools/starter/)
  const RUNTIME = /^(outputs|inbox|sources|profiles|logs|src|app|lib|server|packages|data|site|\.cache|\.codex|\.claude|\.starter|tools\/hooks\/state|tools\/starter|docs\/(knowledge|plans|specs|releases|reviews|retired|incidents|feedback-inbox))(\/|$)|^tools\/(starter\.local|packs-registry)\.json$|^docs\/(codebase-map|tech-debt|glossary|legal-positions|brand-voice|fit-checklist)\.md$/;
  const real = p => { p = p.replace(/\/$/, ''); return exists(p) || provided.has(p) || RUNTIME.test(p); };
  const skillNames = new Set([...fs.readdirSync(abs(cfg.skillsDir)), ...libNames, ...[...provided].map(p => /^skills\/([^/]+)/.exec(p)?.[1]).filter(Boolean),
    ...pbs.map(p => p.name), ...[...provided].map(p => /^docs\/playbooks\/([^/_][^/]*)\.md$/.exec(p)?.[1]).filter(Boolean)]);
  const files = walk('', p => /\.(md|mjs|json)$/.test(p) && !/(^|\/)(CHANGELOG|STARTER-CHANGELOG|SOURCE|LICENSE)[^/]*$/.test(p) && !/^(\.claude|library\/skills\/[^/]+\/LICENSE)/.test(p));
  for (const f of files) {
    const text = read(abs(f));
    for (const m of text.matchAll(/`([^`\n]+)`/g)) {
      const t = m[1].trim();
      if (/[<>*{}…]|\.\.\./.test(t)) continue;
      const pm = /^((?:docs|tools|skills|library|packs|\.githooks)\/[\w.-]+(?:\/[\w.-]+)*(?:\.\w+|\/))$/.exec(t);
      if (pm && !real(pm[1])) fail.push(`${f}: \`${t}\` does not exist`);
      const cm = /^node\s+((?:tools|skills)\/[\w./-]+\.mjs)(?:\s+([a-z][\w-]*))?/.exec(t);
      if (cm && !real(cm[1])) fail.push(`${f}: \`${t}\`: ${cm[1]} does not exist`);
      else if (cm && cm[2] && exists(cm[1])) { const src = read(abs(cm[1])); if (!src.includes(`'${cm[2]}'`) && !src.includes(`"${cm[2]}"`)) fail.push(`${f}: \`${t}\`: ${cm[1]} has no "${cm[2]}" command`); }
    }
    for (const m of text.matchAll(/\*\*([a-z][a-z0-9-]+)\*\* skill|\bthe ([a-z][a-z0-9]+(?:-[a-z0-9]+)+) skill\b/g))
      if (!skillNames.has(m[1] || m[2])) fail.push(`${f}: names the skill "${m[1] || m[2]}", which does not exist`);
  }
  return { fail, note: `${files.length} files` };
});

sweep('skills are valid', () => {
  const fail = [], warn = [];
  for (const n of skillNames) {
    fail.push(...skillProblems(`${cfg.skillsDir}/${n}`));
    const fm = frontmatter(read(abs(`${cfg.skillsDir}/${n}/SKILL.md`))) || {};
    if (fm.description && !/\buse (when|whenever|for|after|in)\b/i.test(fm.description)) warn.push(`skill ${n}: the description should say when to use it ("Use when ...")`);
  }
  for (const pb of pbs) if (pb.fm.skill && !exists(pb.fm.skill)) fail.push(`${pb.file}: skill ${pb.fm.skill} does not exist`);
  // a skill no runbook owns is a procedure of its own: it needs triggers to be found and a check to be proven
  for (const s of routableSkills(cfg)) {
    if (!s.triggers.length) fail.push(`${s.file}: no "triggers:" line, so nothing routes to it`);
    if (!skillHasCheck(s)) fail.push(`${s.file}: no check (a requirements.json entry with "when": {"skillUsed": "${s.name}"}, or "checks: none - <reason>")`);
  }
  return { fail, warn, note: `${skillNames.length} skills, ${routableSkills(cfg).length} with their own route` };
});

// Ready-made skills (library/) and adapted third-party skills: valid, cataloged, credited, written to the house style.
if (exists('library')) sweep('skill library is valid, cataloged and credited', () => {
  const fail = [];
  let cat = [];
  try { cat = JSON.parse(read(abs('library/catalog.json'))).skills || []; } catch (e) { fail.push(`library/catalog.json does not parse: ${e.message}`); }
  const dirs = fs.readdirSync(abs('library/skills')).filter(n => fs.statSync(abs(`library/skills/${n}`)).isDirectory());
  for (const n of dirs) {
    fail.push(...skillProblems(`library/skills/${n}`));
    if (!cat.some(e => e.name === n)) fail.push(`library/skills/${n} has no entry in library/catalog.json`);
  }
  for (const e of cat) {
    if (!dirs.includes(e.name)) fail.push(`catalog entry ${e.name} has no folder in library/skills`);
    // plain, does, outcome: setup offers every choice in plain words (what it does, what the user will notice)
    for (const k of ['summary', 'for', 'ask', 'plain', 'does', 'outcome', 'good', 'costs']) if (!e[k]) fail.push(`catalog entry ${e.name}: missing "${k}"`);
    if (e.for && !['any', 'app', 'knowledge', 'gui'].includes(e.for)) fail.push(`catalog entry ${e.name}: "for" must be any or a pack name (app, knowledge, gui)`);
  }
  for (const p of exists('packs') ? fs.readdirSync(abs('packs')).filter(n => exists(`packs/${n}/pack.json`)) : []) {
    let j = {}; try { j = JSON.parse(read(abs(`packs/${p}/pack.json`))); } catch { }
    for (const k of ['plain', 'does', 'outcome', 'good', 'costs']) if (!j[k]) fail.push(`packs/${p}/pack.json: missing "${k}" (setup offers it in plain words)`);
  }
  return { fail, note: `${dirs.length} skills` };
});
sweep('third-party skills are credited', () => {
  const fail = [];
  const roots = [cfg.skillsDir, 'library/skills'].filter(exists);
  for (const r of roots) for (const n of fs.readdirSync(abs(r))) {
    const d = `${r}/${n}`;
    if (!exists(`${d}/SOURCE.md`)) continue; // our own skill
    const src = read(abs(`${d}/SOURCE.md`));
    if (/NOT ADAPTED YET/.test(src)) fail.push(`${d}: downloaded but not adapted yet (rewrite it in the project's style, then credit it in SOURCE.md)`);
    if (/\b(MIT|Apache|BSD|ISC)\b/.test(src) && !exists(`${d}/LICENSE`)) fail.push(`${d}: SOURCE.md names a license but the LICENSE file is missing`);
    // Projects made from the starter may be sold: every license must allow commercial use without passing a copyleft on.
    const lic = read(abs(`${d}/LICENSE`)) + '\n' + src;
    if (!/\bMIT License\b|Apache License|\bBSD\b|\bISC License\b|\b0BSD\b|CC0|The Unlicense|zlib License/i.test(lic) || /\bGNU\b|\b[AL]?GPL\b|NonCommercial|non-commercial/i.test(read(abs(`${d}/LICENSE`))))
      fail.push(`${d}: its license must allow commercial use (MIT, Apache-2.0, BSD, ISC, 0BSD, CC0, Unlicense, zlib). Rewrite it as our own skill without its text, or remove it`);
    for (const f of fs.readdirSync(abs(d)).filter(f => f.endsWith('.md') && f !== 'SOURCE.md'))
      for (const p of writingProblems(read(abs(`${d}/${f}`))).slice(0, 3)) fail.push(`${d}/${f}: ${p}`);
  }
  return { fail };
});
sweep('every hard rule has an enforcement row', () => {
  const sec = /## Hard rules[^\n]*\n([\s\S]*?)(\n## |$)/.exec(read(abs('CLAUDE.md')));
  if (!sec) return { fail: ['AGENTS.md / CLAUDE.md has no "## Hard rules" section'] };
  const nums = [...sec[1].matchAll(/^(\d+)\.\s/gm)].map(m => m[1]);
  const enf = read(abs('docs/checks/rule-enforcement.md'));
  return { fail: nums.filter(n => !new RegExp(`^\\|\\s*${n}\\s*\\|`, 'm').test(enf)).map(n => `hard rule ${n} has no row in docs/checks/rule-enforcement.md`), note: `${nums.length} rules` };
});

sweep('every REQ tag is enforced and tested', () => {
  const fail = [];
  const tagsIn = f => {
    const out = new Set();
    for (const line of read(abs(f)).split(/\r?\n/)) {
      if (!line.startsWith('|') || /^\|\s*-/.test(line)) continue;
      const cells = line.split('|').map(c => c.trim());
      for (const t of (cells[cells.length - 2] || '').split(/[,(]/)) { const m = /^\s*([a-z][a-z0-9]*(?:-[a-z0-9]+)+|[a-z]+)\s*$/.exec(t.replace(/[`)]/g, '')); if (m && !/^(doc|tag|tags|req|hook|packs?)$/.test(m[1])) out.add(m[1]); }
    }
    return out;
  };
  const docTags = new Set([...tagsIn('docs/checks/rule-enforcement.md'), ...tagsIn('docs/checks/user-requirements.md')]);
  for (const t of docTags) if (!knownTag(t) && t !== 'pack-purity') fail.push(`tag ${t} is named in docs/checks but enforced nowhere`);
  const enf = read(abs('docs/checks/rule-enforcement.md'));
  for (const t of reqTags) if (!enf.includes(t) && !reqs.find(r => r.tag === t)?.pack && !reqs.find(r => r.tag === t)?.appGate) fail.push(`requirements.json tag ${t} has no row in docs/checks/rule-enforcement.md`);
  for (const t of [...coreTags, ...reqTags, ...packTags]) if (!testsSrc.includes(t) && !reqs.find(r => r.tag === t)?.appGate) fail.push(`tag ${t} has no test scenario in tools/hooks/selfcheck.mjs`);
  return { fail, note: `${coreTags.size} core + ${reqTags.size} project tags` };
});

if (exists('docs/knowledge')) sweep('knowledge files are labeled, sourced, dated', () => {
  const fail = [], warn = [];
  const files = walk('docs/knowledge', p => p.endsWith('.md') && !/(^|\/)(README|SOURCES)\.md$/i.test(p));
  for (const f of files) fail.push(...knowledgeProblems(f, cfg));
  for (const s of staleKnowledge(cfg)) warn.push(`${s.file} is stale (${s.why})`);
  return { fail, warn, note: `${files.length} files` };
});

sweep('skills due for hardening', () => ({ warn: hardenDue(pbs, usage(), cfg).map(p => `${p.file} used ${usage()[p.name]?.uses} times: run the skill-harden skill`) }));
sweep('skills due for cleanup', () => ({ warn: isTemplate ? [] : curateDue(cfg).map(p => `${p.file} unused for ${p.days} days: keep it with a reason, merge it, or retire it (skill-curate skill)`) }));

sweep('pack purity (nothing from packs this project did not choose)', () => {
  if (isTemplate) return { note: 'the starter itself carries every pack payload' };
  const fail = [];
  const reg = (() => { try { return JSON.parse(read(abs('tools/packs-registry.json'))); } catch { return { packs: {} }; } })();
  const installed = cfg.packs || [];
  for (const [name, p] of Object.entries(reg.packs || {})) {
    if (installed.includes(name)) continue;
    for (const f of p.files || []) if (exists(f)) fail.push(`${f} belongs to the "${name}" pack, which is not installed`);
    for (const c of p.menu || []) if (menu().codes[c]) fail.push(`menu code ${c} belongs to the "${name}" pack`);
  }
  return { fail, note: `installed: ${installed.join(', ') || 'core only'}` };
});

sweep('publish safety (no personal or machine details)', () => {
  const fail = [];
  const ignored = new Set();
  const all = walk('', p => /\.(md|mdx|txt|json|mjs|cjs|js|ts|tsx|jsx|py|html?|css|ya?ml|bat|cmd|ps1|sh|toml|ini|cfg)$|(^|\/)\.(gitignore|gitattributes)$|^\.githooks\//.test(p), [], /^(\.git|node_modules|\.cache|\.starter|state)$/);
  if (isRepo) { const r = spawnSync('git', ['check-ignore', '--stdin'], { cwd: ROOT, input: all.join('\n'), encoding: 'utf8' }); for (const l of (r.stdout || '').split(/\r?\n/)) if (l) ignored.add(l.trim()); }
  else for (const f of all) if (/^\.private-terms$|^tools\/hooks\/state\//.test(f)) ignored.add(f);
  const terms = read(abs('.private-terms')).split(/\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('#'));
  const checks = [
    [/[A-Za-z0-9._%+-]+@(?!example\.(com|org)|users\.noreply\.github\.com)[A-Za-z0-9.-]+\.[a-z]{2,}/, 'an email address'],
    [/[A-Za-z]:[\\/]+Users[\\/]+(?!<|USER|you|\$|%)[A-Za-z0-9._-]+/i, 'a personal Windows path'],
    [/\/(home|Users)\/(?!<|user\b|you\b|\$)[a-z0-9._-]{2,}\//i, 'a personal home path'],
    // first part 10 to 255, every part a real octet, and not a version ("v9.7.0.3", "version 12.1.0.4", "9.7.0.3")
    // Lesson: four-part version numbers in a game's data were flagged as IP addresses.
    [/(?<![\w.]|\bv|\bversions?[\s:=]{1,3}|\bbuild[\s:=]{1,3})(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}(?![\w.])(?<!127\.0\.0\.1)/i, 'an IP address']
  ];
  for (const f of all.filter(f => !ignored.has(f) && f !== '.private-terms')) {
    const text = read(abs(f));
    for (const [rx, what] of checks) { const m = rx.exec(text); if (m && !/noreply@(anthropic|openai)\.com/.test(m[0])) fail.push(`${f}: ${what} ("${m[0].slice(0, 40)}")`); }
    for (const t of terms) if (text.toLowerCase().includes(t.toLowerCase())) fail.push(`${f}: contains a private term from .private-terms`);
    // Lesson: a fake key in a test fixture made every project's first full commit fail the secret check. Build such
    // strings at runtime instead of writing them out.
    // A key prefix counts only at the start of a word (Lesson: "...isk-encounter-..." in a file name read as a key).
    const key = secretHit(`${f}\n${text}`, cfg);
    if (key) fail.push(`${f}: looks like a secret (pattern ${key}). Real ones go in .env; test fixtures build the string at runtime`);
  }
  return { fail, note: `${all.length - ignored.size} publishable files, ${terms.length} private terms` };
});

sweep('browser safety (never the installed Chrome/Edge)', () => {
  const rx = /executablePath\s*[:=]|channel\s*:\s*['"](chrome|msedge)['"]|CHROME_BIN|(?<!chrome-win(64)?[\\/])(chrome|msedge)\.exe/i;
  const files = walk('', p => /\.(mjs|cjs|js|ts|py|ps1|sh|bat|cmd|json)$/.test(p) && !p.startsWith('tools/hooks/') && p !== 'tools/audit.mjs', [], /^(\.git|node_modules|\.starter|state)$/);
  return { fail: files.filter(f => rx.test(read(abs(f)))).map(f => `${f} drives the installed browser (agent copies in ignored folders count too)`) };
});

sweep('git hygiene', () => {
  const fail = [], warn = [];
  const stray = walk('', p => /(^|\/)(nul|con|aux|prn|com\d|lpt\d)(\.[a-z0-9]+)?$/i.test(p), [], /^(\.git|node_modules)$/);
  for (const s of stray) fail.push(`${s}: a Windows reserved-name file (usually from "> nul" in Bash); delete it`);
  for (const n of fs.readdirSync(ROOT)) { const s = fs.statSync(abs(n)); if (s.isFile() && s.size === 0 && /^\d+$|^[^.]+$/.test(n) && n !== '.starter-template') warn.push(`${n}: an empty stray file in the root`); }
  if (isRepo) {
    const bad = aiAttributedCommits(cfg);
    if (bad.length) fail.push(`unpushed commits credit an AI agent: ${bad.join(', ')}`);
    fail.push(...gitignoreProblems(cfg)); // REQ: gitignore-ready
    const allBad = (git('log', '--all', '-n', '500', '--format=%h %B').stdout || '').split(/\n(?=[0-9a-f]{7,} )/).filter(b => new RegExp(cfg.aiAttribution, 'i').test(b)).map(b => b.slice(0, 8));
    if (allBad.length) warn.push(`commits on some branch credit an AI agent: ${allBad.slice(0, 6).join(', ')} (reword before those branches are ever pushed)`);
    const dirty = (git('status', '--porcelain').stdout || '').split(/\r?\n/).filter(Boolean);
    if (dirty.length > 30) warn.push(`${dirty.length} uncommitted changes: checkpoint-commit on the work branch`);
  }
  for (const f of ['CLAUDE.md']) { const kb = Buffer.byteLength(read(abs(f))) / 1024; if (kb > cfg.instructionBudgetKB) warn.push(`${f} is ${Math.round(kb)} KB (budget ${cfg.instructionBudgetKB} KB): move detail into docs/ and link it`); }
  return { fail, warn };
});

sweep('user-facing writing (no em dashes, no filler)', () => {
  const files = walk('', p => match2(p, cfg.userFacing) && !match2(p, cfg.userFacingIgnore) && !p.startsWith('packs/') && !p.startsWith('.claude/'));
  const probs = files.flatMap(f => writingProblems(read(abs(f)), cfg, f));
  return { fail: probs.slice(0, 20), note: `${files.length} files` };
});
function match2(p, globs) { return [].concat(globs || []).some(g => { let s = ''; for (let i = 0; i < g.length; i++) { const c = g[i]; if (c === '*') { if (g[i + 1] === '*') { s += '.*'; i++; if (g[i + 1] === '/') i++; } else s += '[^/]*'; } else s += c.replace(/[.+^${}()|[\]\\]/g, '\\$&'); } return new RegExp('^' + s + '$', 'i').test(p); }); }

sweep('tools compile', () => {
  const files = walk('', p => /\.(mjs|cjs)$/.test(p) && (p.startsWith('tools/') || p.startsWith(cfg.skillsDir + '/')));
  const fail = [];
  for (const f of files) { const r = spawnSync(process.execPath, ['--check', abs(f)], { encoding: 'utf8' }); if (r.status !== 0) fail.push(`${f}: ${(r.stderr || '').split('\n').find(l => /Error/.test(l)) || 'syntax error'}`); }
  return { fail, note: `${files.length} scripts` };
});

// Every hook runs on every turn: a slow one makes the whole project slow, so additions must not cost speed unseen.
sweep('hooks stay fast', () => {
  const b = bench(), slow = Object.entries(b).filter(([, v]) => v > cfg.hookBudgetMs);
  return { fail: slow.map(([k, v]) => `the ${k} hook takes ${v} ms (budget ${cfg.hookBudgetMs} ms in tools/hooks/config.json): find what made it slow, or weigh raising the budget`), note: Object.entries(b).map(([k, v]) => `${k} ${v} ms`).join(', ') };
});

sweep('upgrade reviewed', () => ({ warn: upgradeProblems(cfg) }));

// REQ: fit-checklist. Every pack, library skill, recommended tool and optional feature is decided with a reason that holds.
// The starter itself has no checklist (each project makes its own); during setup a gap is a warning, after it a failure.
sweep('every candidate decided (fit checklist)', () => {
  if (isTemplate) return exists(FIT_FILE) ? { warn: [`${FIT_FILE} is in the starter: each project makes its own with node tools/fit.mjs, so delete it here`] } : { note: 'each project keeps its own (node tools/fit.mjs)' };
  const probs = fitProblems(cfg);
  // a "later" the hooks can't measure is revisited here
  const revisit = fitRows().filter(r => fitDecision(r.decision) === 'later' && !fitWhenOf(r)?.metric).map(r => `${r.item} (when: ${fitWhenOf(r)?.text || '?'})`);
  const note = revisit.length ? `later, check whether it is time: ${revisit.join('; ')}` : '';
  return exists('SETUP-PROMPT.md') ? { warn: probs, note } : { fail: probs, note };
});

// Notes nothing links to and that link nowhere are invisible in the graph and to the agent following links.
if (exists('skills/obsidian/scripts/notes.mjs')) sweep('notes are connected (obsidian)', () => {
  const r = spawnSync(process.execPath, [abs('skills/obsidian/scripts/notes.mjs'), 'orphans', ...(isTemplate ? ['--all'] : [])], { cwd: ROOT, encoding: 'utf8' }); // the starter maps every file
  const o = (r.stdout || '').split(/\r?\n/).filter(l => l && l !== 'no orphan notes');
  return { warn: o.map(n => `${n}: links to nothing and nothing links to it (obsidian skill: link it, merge it, or say why under "## Related")`) };
});

// Every session starts by reading these: kept small, they cost little; grown unchecked, they crowd out the work.
sweep('always-loaded files stay small', () => {
  const sizes = ['CLAUDE.md', 'DIRECTORY.md'].map(f => [f, read(abs(f)).length]), total = sizes.reduce((a, [, n]) => a + n, 0);
  return { warn: total > cfg.alwaysLoadedMaxChars ? [`${sizes.map(([f, n]) => `${f} ${n}`).join(' + ')} = ${total} characters, over ${cfg.alwaysLoadedMaxChars}: merge repeated preferences and rules, and move detail into runbooks or skills`] : [], note: `${total} characters` };
});

sweep('project housekeeping', () => {
  const fail = [], warn = [];
  if (exists('inbox')) { const n = fs.readdirSync(abs('inbox')).filter(x => !/^readme\.md$/i.test(x) && !x.startsWith('.')); if (n.length) warn.push(`inbox/ has ${n.length} unprocessed file(s)`); }
  if (!isTemplate) {
    if (/status:\s*not bootstrapped/i.test(read(abs('docs/BRIEF.md')))) warn.push('docs/BRIEF.md is not filled in: follow SETUP-PROMPT.md');
    if (!exists('tools/hooks/state/last-session.json')) warn.push('the hooks have never run in a live session here (Node on PATH? hooks enabled?)');
  }
  const sd = /Updated:\s*(\d{4}-\d\d-\d\d)/.exec(read(abs('docs/STATUS.md')))?.[1];
  const lc = /^- (\d{4}-\d\d-\d\d)/m.exec(read(abs('docs/CHANGELOG.md')))?.[1];
  if (sd && lc && Date.parse(lc) - Date.parse(sd) > 14 * 864e5) warn.push(`docs/STATUS.md (${sd}) is older than the latest CHANGELOG entry (${lc})`);
  return { fail, warn };
});

// The starter: lessons projects sent back (node tools/starter.mjs report) are read and acted on. An entry is reviewed
// once its line says "(reviewed YYYY-MM-DD: <what was done>)".
if (isTemplate && exists('docs/feedback-inbox')) sweep('project feedback reviewed', () => {
  const open = [];
  for (const f of fs.readdirSync(abs('docs/feedback-inbox')).filter(n => n.endsWith('.md')))
    for (const l of read(abs(`docs/feedback-inbox/${f}`)).split(/\r?\n/)) if (/^- \d{4}-\d\d-\d\d: \S/.test(l) && !/\(reviewed\b/i.test(l)) open.push(`docs/feedback-inbox/${f}: ${l.slice(2, 110)}`);
  return { warn: open.length ? [`${open.length} feedback line(s) from projects not reviewed yet: fix or decline each, then mark it "(reviewed YYYY-MM-DD: <what was done>)": ${open.slice(0, 5).join(' | ')}${open.length > 5 ? ' ...' : ''}`] : [] };
});

if (process.argv.includes('--setup')) sweep('setup is complete (SETUP-PROMPT.md may be deleted)', () => ({ fail: isTemplate ? [] : setupProblems(cfg), note: isTemplate ? 'the starter itself is never "set up"' : '' }));

// --setup proves the hooks work in this project too; --full adds the ablation tests
if (process.argv.includes('--full') || process.argv.includes('--setup')) {
  for (const [name, args] of [['hook self-tests', []], ['ablation tests (every required step is load-bearing)', ['--ablation']]].slice(0, process.argv.includes('--full') ? 2 : 1)) {
    sweep(name, () => {
      // --setup: the self-tests take minutes, so they wait until the quick sweeps pass, and a full pass from earlier counts
      // while nothing they test has changed since. --full always runs them. Lesson: each setup retry cost 11 minutes.
      if (!process.argv.includes('--full')) {
        if (results.some(r => r.status === 'FAIL')) return { warn: ['skipped until the failures above are fixed (the self-tests take minutes)'] };
        const st = (() => { try { return JSON.parse(read(abs('tools/hooks/state/selftest.json'))); } catch { return {}; } })();
        if (st.passed && st.inputs && st.inputs === testInputsHash()) return { note: `passed earlier (${st.count} tests) and nothing they test has changed since` };
      }
      const r = spawnSync(process.execPath, [abs('tools/hooks/selfcheck.mjs'), ...args], { encoding: 'utf8', timeout: 900000 });
      const out = (r.stdout || '') + (r.stderr || '');
      const summary = out.trim().split(/\r?\n/).pop();
      return r.status === 0 ? { note: summary } : { fail: [summary, ...out.split(/\r?\n/).filter(l => l.startsWith('FAIL')).slice(0, 15)] };
    });
  }
  // in the starter: the trial proves on sample projects that new, adopt and upgrade never make a project worse
  if (process.argv.includes('--full') && exists('tools/trial.mjs')) sweep('trial: no project gets worse (sample projects)', () => {
    const r = spawnSync(process.execPath, [abs('tools/trial.mjs')], { encoding: 'utf8', timeout: 900000 });
    const out = (r.stdout || '') + (r.stderr || ''), summary = out.trim().split(/\r?\n/).filter(l => /^TRIAL:/.test(l)).pop() || 'no result';
    return r.status === 0 ? { note: summary } : { fail: [summary, ...out.split(/\r?\n/).filter(l => l.startsWith('FAIL')).slice(0, 15)] };
  });
}

let failed = 0;
// Status word in color only for a person at a terminal (writing-standards.md "In the terminal"); pipes get plain text.
const COLOR = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = s => COLOR ? `\x1b[${{ PASS: 32, FAIL: 31, WARN: 33 }[s.trim()] || 0}m${s}\x1b[0m` : s;
results.forEach((r, i) => {
  if (r.status === 'FAIL') failed++;
  console.log(`${paint(r.status.padEnd(4))}  ${String(i + 1).padStart(2)}. ${r.name}${r.note ? `  (${r.note})` : ''}`);
  for (const l of r.lines) console.log(`        - ${l}`);
});
console.log(`\naudit: ${paint(failed ? 'FAIL' : 'PASS')} (${results.length} sweeps, ${failed} failed, ${results.filter(r => r.status === 'WARN').length} warnings)`);
// recorded for agents whose tool history the hooks can't read (REQ: audit-run)
logRun(`node tools/audit.mjs ${process.argv.slice(2).join(' ')}`.trim(), results.filter(r => r.status === 'FAIL').map(r => `FAIL ${r.name}`).concat(`audit: ${failed ? 'FAIL' : 'PASS'} (${results.length} sweeps, ${failed} failed)`).join('\n'), !!failed);
process.exit(failed ? 1 : 0);
