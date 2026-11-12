// The setup interview and what it decides: answers read from docs/DECISIONS.md, the packs they call for, people and
// local-repo answers, the files that carry names, rules lost in adoption, and what setup still lacks (setupCompleteness).
// Shared by the safety guard, the old engine and the tools (plan step 1b); setupProblems, which routes, is setup.mjs.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, read, readJSON, abs, exists, list, walkStat, esc, config, section, VERBATIM_ENGINE } from './settings.mjs';
import { LOCAL, split, where } from './paths.mjs';
import { STATE, rulesText, match } from './state.mjs';
import { NAME_FILES, NAME_MARK, namesIn, nameProblems as sharedNameProblems } from './names.mjs';
import { FIT_FILE, findLibrary, fitCandidates, fitDecision, fitKey, fitReasonProblem, fitRows } from './fit.mjs';
const CONFIG = () => where('tools/hooks/config.json'), names = () => namesIn(ROOT);
export function nameProblems(file, text, nm = names(), cfg = config()) {
  // the engine's files belong to the starter, not the project (in the starter itself they are its own code)
  return sharedNameProblems(file, text, { root: ROOT, nm, skip: match(file, cfg.namesIgnore) || (!exists('.starter-template') && match(file, VERBATIM_ENGINE)) });
}
export function nameFiles(cfg = config()) {
  const out = [];
  const walk = d => { for (const n of list(d)) { const p = d ? `${d}/${n}` : n; if (match(p, cfg.ignoreForChanges) || /^(\.git|node_modules)$/.test(n)) continue; let s; try { s = walkStat(p); } catch { continue; } if (s.isDirectory()) walk(p); else if (NAME_FILES.test(n)) out.push(p); } };
  walk('');
  // (files git ignores are this machine's own. Lesson: the audit flagged an ignored file holding the folder's path)
  if (!out.length) return out;
  const ig = spawnSync('git', ['check-ignore', '--stdin'], { cwd: ROOT, input: out.join('\n'), encoding: 'utf8' });
  const ignored = new Set((ig.status === 0 ? ig.stdout : '').split(/\r?\n/).filter(Boolean).map(p => p.replace(/\\/g, '/')));
  return out.filter(p => !ignored.has(p));
}
// Each rule the project had before adoption (.starter/original-rules/) is in AGENTS.md (most of its key words in one
// paragraph) or under "## Dropped rules" in docs/DECISIONS.md. Lesson: a merge silently lost two of the user's rules.
export function lostRules() {
  const dir = '.starter/original-rules', out = [];
  if (!exists(dir)) return out;
  const keyWords = s => [...new Set(String(s).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 4))];
  const paras = rulesText().toLowerCase().split(/\n\s*\n|\n(?=\s*(?:[-*]|\d+\.)\s)/), dropped = section(read(abs('docs/DECISIONS.md')), 'Dropped rules').toLowerCase();
  for (const f of list(dir)) {
    const rules = read(abs(`${dir}/${f}`)).split(/\r?\n/).map(l => l.replace(/^\s*(?:[-*]|\d+\.)\s+/, '').trim()).filter(l => l && !/^(#|```|<!--|\|)/.test(l) && keyWords(l).length >= 3);
    for (const r of rules) {
      const k = keyWords(r), need = Math.ceil(k.length * 0.6);
      if (!paras.some(p => k.filter(w => p.includes(w)).length >= need) && k.filter(w => dropped.includes(w)).length < need)
        out.push(`${f} rule "${r.slice(0, 80)}" is not in AGENTS.md: merge it back, or list it under "## Dropped rules" in docs/DECISIONS.md with why`);
    }
  }
  return out.slice(0, 8);
}
// REQ: setup-interview. Answered before anything installs, as "- Key: answer" under "## Setup interview" (DECISIONS.md).
export const INTERVIEW = ['Involvement', 'Focus', 'Kind of work', 'Visual interface', 'Typical requests', 'Inputs', 'People', 'Sensitive data',
  'Constraints', 'Quality bar', 'Always/never'];
export const INTERVIEW_AFTER = ['Packs', 'Library skills', 'Starter']; // recorded as each choice is made
export const INTERVIEW_APP = ['Commands', 'Branches', 'Sign-off', 'Release'];
export function setupInterview() {
  const f = {};
  // name markers inside answers read as the name itself (Lesson: answers written with a marker stopped counting)
  for (const m of section(read(abs('docs/DECISIONS.md')), 'Setup interview').replace(NAME_MARK, (x, k) => names()[k] || k).matchAll(/^\s*-\s*\*{0,2}([^:*\n]+?)\*{0,2}:\s*(.*)$/gm))
  { // autonomy auto: "assumed - <answer>"; which answers were assumed is kept apart, as the agent's guess, not the user's
    const k = m[1].trim().toLowerCase(), v = m[2].trim();
    f[k] = v.replace(/^assumed\s*[-:]\s*/i, '');
    if (/^assumed\s*[-:]/i.test(v)) Object.defineProperty(f, `${k} (assumed)`, { value: true, enumerable: false });
  }
  return f;
}
// (a placeholder is a whole answer in angle brackets. Lesson: a command with <args> was read as unanswered)
export const unanswered = v => !v || /^\s*<[^>]*>\s*$|<\.\.\.>|<e\.g\.|^\.{3}$|^(tbd|todo|\?)$/i.test(v);
// The packs the answers call for: knowledge work → knowledge, software → app, a visual interface → gui.
export function packsFor(f) {
  // (the leading keyword decides. Lesson: "knowledge (... no software)" read as software)
  const full = (f['kind of work'] || '').toLowerCase().replace(/^\s*assumed\s*-\s*/, ''), want = [];
  const lead = (/^\W*(knowledge|software|both|app|neither|none)\b/.exec(full) || [])[1];
  const kind = lead || full.split(/[(;,.]| - /)[0];
  if (/knowledge|both/.test(kind)) want.push('knowledge');
  if (/software|\bapp\b|both/.test(kind)) want.push('app');
  if (/^yes\b/i.test(f['visual interface'] || '')) want.push('gui');
  return want;
}
export const setupPrompts = () => readJSON(path.join(STATE, 'setup.json'), {}).prompts || 0;
// The "People" answer: 'one', 'several' (data kept apart, a profile each) or null. The leading word decides; roles and
// app accounts are not separate people; a plain list of names is several. Lesson: any comma read as "several people".
export const ONE_LEAD = /^(one|1|single|solo|alone|just (me|one|myself|the owner)|only (me|one|myself|the owner)|a single|an? (individual|single)|uno|una|s[oó]lo yo|individual|personal)\b/;
export const ME_LEAD = /^(me|myself|i|yo|the owner|the user|the author)\b/;
export const SEVERAL_LEAD = /^(several|multiple|many|two|three|four|five|six|seven|eight|nine|ten|[2-9]|\d{2,}|varias|varios|dos|tres|cuatro|cinco|each\b|per[- ]person)\b/;
export const NOT_SEPARATE = /\bno (per[- ]person|separate|individual|personal) (data|profiles?|records?|files?)\b|\bno profiles\b|\bnot (separate|distinct) (people|persons|users|profiles|data owners)\b|\b(roles?|accounts?|users?) (in|inside|of|within) the (app|application|database|service|system|site)\b|\bapp (users|accounts)\b|\bshar(e|es|ed|ing) (one|a single|the same) (inventory|account|database|data|record|list|vault|set)\b|\bsin perfiles\b/;
export function peopleAnswer(raw) {
  const t = String(raw || '').toLowerCase().replace(/^\s*(assumed|answered|decided|inferred|guessed)\s*[-:]\s*/, '').trim();
  if (!t || unanswered(t)) return null;
  if (ONE_LEAD.test(t)) return 'one';
  if (NOT_SEPARATE.test(t)) return 'one';
  if (SEVERAL_LEAD.test(t)) return 'several';
  // a list of people: two or more short items, each a name or "me"/"my partner", split by commas, "and", "&", "+", "y"
  const lead = t.split(/\s[-–]\s|[;(:.]/)[0];
  const items = lead.split(/,|\s+(?:and|&|\+|y|plus)\s+/).map(s => s.trim()).filter(Boolean);
  if (items.length >= 2 && items.every(s => s.split(/\s+/).length <= 3 && !/\b(maybe|later|perhaps|possibly|eventually|occasional|tal vez|quiz[aá]s)\b/.test(s))) return 'several';
  // "me (owner), plus maybe a helper later": one owner with qualifiers
  if (ME_LEAD.test(t)) return 'one';
  return null;
}
// REQ: setup-complete. Every pack the answers call for and every library skill that fits, unless declined with a reason.
// decide: the request says not to ask; then set "autonomy" first. Lesson: setups told not to ask were told to ask.
export const localRepoAnswer = () => readJSON(path.join(LOCAL, 'config.json'), {}).privateRepo;
export function setupCompleteness(cfg = config(), { final = false, beforeStarter = false, decide = false } = {}) {
  const probs = [], f = setupInterview(), own = readJSON(CONFIG(), {});
  const packs = own.packs || [];
  const auto = cfg.autonomy === 'auto';
  if (!auto && decide) probs.push('the user said not to ask: set "autonomy": "auto" in tools/hooks/config.json and record that choice in docs/DECISIONS.md, then decide the setup answers yourself');
  else if (setupPrompts() < 2 && !auto) probs.push('ask the user the setup questions (SETUP-PROMPT.md Phase 2) and wait for the reply: the answers come from the user, not from guesses');
  const after = beforeStarter ? INTERVIEW_AFTER.filter(k => k !== 'Starter') : INTERVIEW_AFTER;
  const keys = [...INTERVIEW, ...(final ? after : []), ...(final && packs.includes('app') ? INTERVIEW_APP : [])];
  const missing = keys.filter(k => unanswered(f[k.toLowerCase()]));
  if (missing.length) probs.push(auto || decide ? `docs/DECISIONS.md "## Setup interview": decide and record ${missing.join(', ')} yourself ("- Key: assumed - <answer> - <why>")`
    : `docs/DECISIONS.md "## Setup interview": record the user's answer for ${missing.join(', ')} ("- Key: answer")`);
  // (the engine in .anzuelo/engine: whether the files made for this project get a private git repository of their own
  // is asked once, at install or setup. Plan: engine outside the project, Task 4)
  if (split && typeof localRepoAnswer() !== 'boolean') probs.push('ask the user once: keep the files made for this project (.anzuelo/local) in a private git repository of their own, for history and backup, never part of the project\'s pushes? Record it: node .anzuelo/engine/tools/starter.mjs local-repo yes|no');
  if (!final) return probs;
  // "Let the AI decide everything" holds after setup too: later choices don't ask either
  if (/^decide/i.test(f.involvement || '') && cfg.autonomy !== 'auto') probs.push('Setup interview "Involvement: decide": set "autonomy": "auto" in tools/hooks/config.json, so later choices don\'t ask either');
  const want = packsFor(f);
  if (!/^(knowledge|software|app|both|neither|none)\b/i.test(f['kind of work'] || '')) probs.push('Setup interview "Kind of work" must start with knowledge, software, both or neither');
  if (!/^(yes|no)\b/i.test(f['visual interface'] || '')) probs.push('Setup interview "Visual interface" must start with yes or no');
  // (the Branches answer sets the protected branches; an assumed one changes nothing. Lessons: work on master kept it
  // protected; two setups that assumed it turned the push guard off)
  const workOn = !f['branches (assumed)'] &&/(?<!\b(never|don'?t|do not|not|no)\s+)\b(work|commit|push)(s|ing)?\s+(directly\s+)?(on|to)\s+(main|master)\b(?![^.;]*\b(never|don'?t|not)\b)/i.exec(f.branches || '');
  if (workOn && (cfg.protectedBranches || []).includes(workOn[6].toLowerCase())) probs.push(`Setup interview "Branches" says the work goes on ${workOn[6]}, but tools/hooks/config.json still protects it: set "protectedBranches" to the branches never to push to (or [])`);
  for (const p of want.filter(p => !packs.includes(p))) probs.push(`the answers call for the ${p} pack and it is not installed: node tools/packs.mjs install ${p}`);
  for (const p of packs.filter(p => !want.includes(p))) probs.push(`the ${p} pack is installed but the answers don't call for it: fix the "Kind of work" / "Visual interface" answer or remove the pack`);
  // every file each installed pack owns is really here (nothing dropped on the way)
  const reg = readJSON(abs('tools/packs-registry.json'), { packs: {} }).packs;
  for (const p of packs) { const gone = (reg[p]?.files || []).filter(x => !exists(x)); if (gone.length) probs.push(`the ${p} pack is incomplete, missing: ${gone.slice(0, 5).join(', ')}${gone.length > 5 ? ', ...' : ''} (node tools/packs.mjs install ${p})`); }
  if (peopleAnswer(f['people']) === 'several' && list(cfg.scopesRoot).filter(n => exists(`${cfg.scopesRoot}/${n}/PROFILE.md`)).length < 2)
    probs.push(`several people: create ${cfg.scopesRoot}/<name>/PROFILE.md for each, so their data stays separate`);
  if (own.starter && f.starter && !new RegExp(`^${own.starter}\\b`, 'i').test(f.starter)) probs.push(`Setup interview "Starter" says "${f.starter.slice(0, 30)}" but the project is set to ${own.starter}`);
  // library: every skill that fits is enabled, or left out with the reason (in this line or in the fit checklist)
  const lib = findLibrary();
  if (lib) {
    const line = f['library skills'] || '';
    const [on, off = ''] = line.split(/\bleft out\b/i);
    const fitC = new Map(fitCandidates(cfg).candidates.map(c => [fitKey(c.kind, c.item), c]));
    const fitOut = new Set(fitRows().filter(r => r.kind === 'skill' && /^(skip|later)$/.test(fitDecision(r.decision) || '') && !fitReasonProblem(r.reason, fitC.get(fitKey(r.kind, r.item)))).map(r => r.item));
    for (const e of readJSON(path.join(lib.dir, 'catalog.json'), { skills: [] }).skills) {
      const enabled = exists(`${cfg.skillsDir}/${e.name}/SKILL.md`);
      const fits = e.for === 'any' || packs.includes(e.for);
      if (enabled && !new RegExp(`\\b${esc(e.name)}\\b`).test(on)) probs.push(`Setup interview "Library skills": list ${e.name} as enabled`);
      if (fits && !enabled && !fitOut.has(e.name) && !new RegExp(`\\b${esc(e.name)}\\b\\s*(\\(|because|-|:)`).test(off))
        probs.push(`library skill ${e.name} fits this project (${e.for}): enable it (node tools/skills.mjs enable ${e.name}), or skip it with the reason in ${FIT_FILE}`);
    }
  }
  return probs;
}
