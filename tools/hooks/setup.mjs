// What setup still lacks before SETUP-PROMPT.md may go (the setup gate and audit --setup). Each typical request in
// docs/BRIEF.md must route through v2's router, the one the user's requests go through. Loaded only when needed: it
// reads v2's routing (plan step 1b; oversight 2026-11-12).
import { ROOT, read, readJSON, abs, exists, config, section } from './settings.mjs';
import path from 'node:path';
import { where, recordMap, LOCAL } from './paths.mjs';
import { rulesText } from './state.mjs';
import { NAMES_FILE, namesIn } from './names.mjs';
import { fitProblems } from './fit.mjs';
import { grantProblems } from './grant.mjs';
import { lostRules, nameFiles, nameProblems, setupCompleteness, setupInterview } from './setupinfo.mjs';
import { route } from './v2/lib.mjs';
import { skillRoute } from './v2/start.mjs';
const CONFIG = () => where('tools/hooks/config.json'), names = () => namesIn(ROOT);
// (a typical request routes when v2 sends it to a runbook, or names a skill for it as its reminder does)
const routes = f => !!(route(f) || skillRoute(f));
export function setupProblems(cfg = config()) {
  const probs = [];
  const brief = read(abs('docs/BRIEF.md'));
  if (!/status:\s*bootstrapped\s+20\d\d-\d\d-\d\d/i.test(brief)) probs.push('docs/BRIEF.md: set "status: bootstrapped YYYY-MM-DD"');
  for (const s of ['Purpose', 'Who it serves', 'Scope', 'Typical requests', 'Sources and inputs', 'Constraints', 'Quality bar']) {
    const body = section(brief, s).replace(/<!--[\s\S]*?-->/g, '').replace(/^\s*(\d+\.|-)?\s*(In scope:|Out of scope:)?\s*$/gm, '').trim();
    if (!body) probs.push(`docs/BRIEF.md: "${s}" is empty`);
  }
  const typical = [...section(brief, 'Typical requests').replace(/<!--[\s\S]*?-->/g, '').matchAll(/^[ \t]*(?:\d+\.|-)[ \t]+(\S.+)$/gm)].map(m => m[1].trim());
  if (typical.length < 3) probs.push('docs/BRIEF.md: list at least 3 typical requests, each as a short, plain description of the kind of request');
  // a request written in quotes ('"How do I ...?" → x.md') is routed as the words inside them: whole, a long quote
  // reads as pasted text and is skipped. Lesson: a project's 45-character quoted request routed to nothing.
  // The words around the quotes count too ('"Walk me through X" in the walkthrough app'): either form may route.
  const forms = t => { const bare = t.replace(/\s*(→|->).*$/, ''); return [/^["“']([^"”]+)["”']/.exec(t)?.[1], bare, bare.replace(/["“”]/g, '')].filter(Boolean); };
  for (const t of typical) if (!forms(t).some(routes)) probs.push(`typical request "${t.slice(0, 70)}" routes to no runbook or skill: add its wording to a runbook's or skill's triggers (node tools/hooks/selfcheck.mjs --route "...")`);
  const claude = rulesText();
  if (/\{\{[A-Z_]+\}\}|<!-- One line on what/.test(claude)) probs.push('AGENTS.md: replace the template placeholders (name, one-line purpose)');
  if (!names().PROJECT_NAME || /\{\{/.test(names().PROJECT_NAME)) probs.push(`${NAMES_FILE}: set PROJECT_NAME, and add every other name the project uses (products, brands, companies)`);
  // files the project had before the starter came stay as the user wrote them (new-project.mjs lists them on adoption)
  const original = new Set(read(abs('.starter/original-files.txt')).split(/\r?\n/).filter(Boolean));
  for (const p of nameFiles(cfg).filter(p => !original.has(p))) probs.push(...nameProblems(p, read(abs(p)), names(), cfg));
  if (/^- \(none yet\)\s*$/m.test(section(claude, "The user's standing preferences"))) probs.push('AGENTS.md: record the user\'s standing preferences as principles (or "- (none stated, YYYY-MM-DD)")');
  if (/Not bootstrapped yet/i.test(read(abs('docs/STATUS.md')))) probs.push('docs/STATUS.md: still says "Not bootstrapped yet"');
  for (const f of ['CLAUDE.starter.md', 'AGENTS.starter.md']) if (exists(f)) probs.push(`${f}: merge it into CLAUDE.md/AGENTS.md, then delete it`);
  probs.push(...lostRules());
  if (!exists('tools/hooks/state/last-session.json')) probs.push('the hooks have never run in a live session here (open the project with your agent so its session start runs them, or run node tools/hooks/hooks.mjs begin "<a request>")');
  if (exists('CLAUDE.md') && read(abs('CLAUDE.md')) !== read(abs('AGENTS.md'))) probs.push('CLAUDE.md and AGENTS.md differ');
  const own = readJSON(CONFIG(), {});
  if (!(own.packs || []).length && !/core only/i.test(read(abs('docs/DECISIONS.md'))))
    probs.push('choose the packs: node tools/packs.mjs install <packs> (or record "core only" and why in docs/DECISIONS.md)');
  if ((own.packs || []).includes('app') && !(own.app && (own.app.test || own.app.build)))
    probs.push('wire the app gates: node tools/packs.mjs configure app --test "<cmd>" --build "<cmd>" --code "<globs>"');
  if ((own.packs || []).includes('app')) {
    // text in backticks is the page's own instruction about <...>, not a value still to fill
    const f = read(abs('docs/foundation.md')).replace(/`[^`\n]*`/g, '');
    if (!/status:\s*set\b/i.test(f) || /<\.\.\.>|<e\.g\./.test(f)) probs.push('set the app foundation with the user (app-foundation runbook): docs/foundation.md still has <...> values or no "status: set"');
    probs.push(...grantProblems(read(abs('docs/foundation.md'))));
  }
  const sec = read(abs('docs/security.md')).replace(/`[^`\n]*`/g, '');
  if (!/status:\s*set\b/i.test(sec) || /<\.\.\.>/.test(sec)) probs.push('set the security baseline with the user: docs/security.md still has <...> values or no "status: set"');
  if (own.adopted && !section(read(abs('docs/STATUS.md')), 'Current state').trim()) probs.push('docs/STATUS.md: add a "## Current state" section describing the existing project before setup changed it');
  // (an established project is improved like surgery: what it has is listed and kept, and each improvement is a
  // decided proposal, the big ones the user's call. Lesson (the user, 2026-11-07): the engine must never override an
  // established project's own hooks, runbooks and skills or make it worse, and asks only about what changes it a lot)
  if (own.adopted) {
    const rev = section(read(abs('docs/DECISIONS.md')), 'Adoption review'), lines = rev.split(/\r?\n/).filter(l => /^\s*-\s+\S/.test(l));
    if (!lines.some(l => /^\s*-\s+keep:/i.test(l))) probs.push('docs/DECISIONS.md: add a "## Adoption review" listing what the project already has (its hooks, runbooks, skills, rules, commands), one "- keep: <item> - <what the engine does instead of overriding it>" line each');
    const open = lines.filter(l => /^\s*-\s+improve:/i.test(l) && (!/\|\s*(small|big)\s*\|/i.test(l) || /\|\s*\??\s*$/.test(l)));
    if (open.length) probs.push(`docs/DECISIONS.md "## Adoption review": ${open.length} improvement line(s) need "| small|big | <decision>" (a big one is the user's: ok, no or explore): ${open[0].trim().slice(0, 80)}`);
    // (the project's own changelog, decision records or security notes are used, not a second copy: the review decides
    // each, and "recordPaths" in .anzuelo/local/config.json points the engine at it. The user's rule, 2026-11-12)
    const mapped = recordMap(LOCAL), own2 = [['docs/CHANGELOG.md', ['CHANGELOG.md', 'CHANGES.md', 'HISTORY.md', 'History.md']], ['docs/DECISIONS.md', ['docs/adr', 'docs/decisions', 'adr']], ['docs/security.md', ['SECURITY.md']]]
      .flatMap(([rec, cands]) => cands.filter(c => exists(path.join(ROOT, c))).slice(0, 1).map(c => [rec, c])).filter(([rec, c]) => !mapped[rec] && !rev.includes(c));
    for (const [rec, c] of own2) probs.push(`docs/DECISIONS.md "## Adoption review": the project has its own ${c}. Decide whether the engine uses it for ${rec} instead of a second copy: "- improve: use ${c} for ${rec} (recordPaths) | small | <decision>"; if yes, add "recordPaths": { "${rec}": "${c}" } to .anzuelo/local/config.json`);
  }
  probs.push(...setupCompleteness(cfg, { final: true }));
  // REQ: fit-checklist. Every candidate is decided by the AI with a reason that holds (node tools/fit.mjs check)
  const fit = fitProblems(cfg);
  if (fit.length) probs.push(`fit checklist: ${fit[0]}${fit.length > 1 ? ` (+${fit.length - 1} more: node tools/fit.mjs check)` : ''}`);
  // the answers are carried out, not just recorded
  const f = setupInterview();
  // (only rules the user gave: an assumed answer is the agent's guess, and writing it as the user's preference would
  // put words in their mouth. Lesson (trial v42): setup failed until the agent's guesses became "the user's" rules)
  if (f['always/never'] && !f['always/never (assumed)'] && !/^(none|no\b|n\/a)/i.test(f['always/never']) && /^- \(none (yet|stated)/m.test(section(claude, "The user's standing preferences")))
    probs.push('the user gave always/never rules in the setup interview, but CLAUDE.md has no standing preferences: write each as a rule with the project-rule skill');
  const guard = section(sec, 'What needs protecting, and from whom');
  if (/status:\s*set\b/i.test(sec) && guard && [...guard.matchAll(/^\|[^|\n]+\|\s*(N\/?A\b[^|]*)\|/gmi)].length >= 3)
    probs.push('docs/security.md: "What needs protecting" is all N/A. Every project has something to protect (at least its files and the user\'s accounts): answer each row');
  if (exists('README.starter.md')) probs.push('README.starter.md: merge what helps into README.md (the user\'s README stays), then delete it');
  // the starter's leftovers: the user decides whether the project stays linked to the starter, keeps a copy, or drops it
  if (!['link', 'keep', 'remove'].includes(own.starter)) probs.push(own.autonomy === 'auto' ? 'decide what happens to the starter (link is the default: packs, skills and upgrades stay available) and run node tools/starter.mjs link | keep | remove'
    : 'ask the user what happens to the starter now: link this project to it (recommended), keep a copy of the unused packs and library skills in .starter/, or remove it. Then run node tools/starter.mjs link | keep | remove');
  if (exists('packs') || exists('library')) probs.push(`packs/ or library/ is still in the project: run node tools/starter.mjs ${own.starter || 'link | keep | remove'}`);
  return probs;
}
