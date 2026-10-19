#!/usr/bin/env node
// The fit checklist: does this project need each pack, library skill, recommended tool and optional feature? The AI
// fills it from the survey, the brief and the code, so the user doesn't go through it item by item. Zero dependencies.
//   node tools/fit.mjs                  create or refresh docs/fit-checklist.md: new candidates as "?", decisions kept,
//                                       items that no longer exist removed
//   node tools/fit.mjs check            FIT: PASS or FIT: FAIL with each problem (exit 1 on FAIL)
//   node tools/fit.mjs decide "<item>" add|skip|"later - when: <condition>" "<reason>"
//                                       record one decision (add --kind pack|skill|tool|feature when a name is shared)
//   node tools/fit.mjs decide --file <decisions.json>
//                                       record many: [{ "item", "kind"?, "decision", "reason", "signal"? }]
//   node tools/fit.mjs summary [--all]  the short line for the user: "Added: ... Skipped: ... (why). Later: ... (when)."
//                                       (skips with no survey evidence are counted, not listed; --all lists them)
//   node tools/fit.mjs --json           every row with what it is, whether it is in the project, and the survey's signals
// Rules for each row (docs/checks/better-or-worse.md): add only what makes the project better, and it must really be
// in the project; skip with a reason that answers any signal the survey found; later with "when: <condition>".
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, read, abs, config, usageOf, FIT_FILE, fitRows, fitCandidates, fitSignals, fitProblems, fitDecision, fitWhenOf, FIT_WHEN_TAIL, projectSurvey, flushEngineWrites } from './hooks/hooks.mjs';

const args = process.argv.slice(2);
const VALUED = ['--kind', '--file'];
const pos = args.filter((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]));
const cmd = args.includes('--json') ? 'json' : pos[0] || 'refresh';
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
if (args.includes('--help')) { console.log(usageOf(import.meta.url)); process.exit(0); }
const cfg = config();
const cell = s => String(s ?? '').replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
const key = (kind, item) => `${kind}:${String(item).toLowerCase()}`;

const HEADER = `# Fit checklist

<!-- Kept by node tools/fit.mjs; checked by node tools/fit.mjs check (setup, upgrades and the audit wait for FIT: PASS).
The AI fills it from the survey (node tools/survey.mjs), docs/BRIEF.md and the code, not the user. One row per
candidate. Decision: add, skip, or "later - when: <condition>" (the hooks watch conditions about file or commit counts).
Reason: the concrete gain or cost for THIS project (docs/checks/better-or-worse.md; "Worth it: <gain> / <cost>" fits),
at least 8 words. "add" must be true in the project. A "skip" of something the survey found evidence for must say why
that evidence doesn't make it worth it. Signal lines starting with "survey:" are refreshed; write your own to keep it.
Only choices that cost money, touch privacy or act outside the project go to the user, as one question with choices. -->
`;

// tools that only work on one language: [item, file extensions, the language in words]
const LANG_TOOLS = [
  [/^(clippy|cargo-audit|cargo-nextest)$/i, 'rs', 'Rust'],
  [/^(ruff|pyright|mypy|pytest)$/i, 'py|ipynb', 'Python'],
  [/^(nbstripout|nbqa)$/i, 'ipynb', 'Jupyter notebook'],
  [/^(gdtoolkit|gdunit4)$/i, 'gd', 'GDScript'],
  [/^(biome|eslint|prettier|vitest)$/i, 'js|mjs|cjs|jsx|ts|tsx', 'JavaScript or TypeScript'],
  [/^typescript \(tsc\)$/i, 'ts|tsx|js|mjs', 'TypeScript or JavaScript'],
  [/^shellcheck$/i, 'sh', 'shell script']
];
function build(sv) {
  const old = fitRows(read(abs(FIT_FILE)));
  const byKey = new Map(old.map(r => [key(r.kind, r.item), r]));
  const { candidates, known } = fitCandidates(cfg);
  const signals = fitSignals(sv);
  const rows = [], added = [], kept = new Set();
  for (const c of candidates) {
    const k = key(c.kind, c.item), was = byKey.get(k);
    const noCode = c.codeOnly && !(sv.n?.code) && !(signals[k] || []).length;
    const here = c.kind !== 'tool' && !!c.present(cfg);
    // a tool for one language in a project with no file of that language (decided "later" below, for new rows)
    const langOf = c.kind === 'tool' && !(signals[k] || []).length && LANG_TOOLS.find(([rx]) => rx.test(c.item));
    const lang = langOf && !sv.files.some(f => new RegExp(`\\.(${langOf[1]})$`, 'i').test(f.p)) ? langOf : null;
    // the same every refresh, so a second upgrade changes nothing (Lesson: the notes were added to new rows only)
    const auto = noCode ? 'survey: no code files yet' : lang ? `survey: no .${lang[1].split('|')[0]} files`
      : `survey: ${(signals[k] || []).map(s => s.label).join('; ') || 'no direct signal'}${here ? '; already in the project' : ''}`;
    if (was) kept.add(k); else added.push(c.item);
    const signal = was && was.signal && !/^survey:/i.test(was.signal) && was.signal !== '?' ? was.signal : auto;
    // a code tool in a project with no code: decided "later" here, so the AI weighs only what can matter now
    if (!was && noCode) {
      rows.push({ item: c.item, kind: c.kind, signal: auto, decision: 'later - when: the first code file appears', reason: `${c.item} works on code, and this project has no code files yet, so it would only add setup and noise now` });
      continue;
    }
    // a tool for one language in a project with no file of that language: "later", until the first one appears. Lesson:
    // Clippy, cargo-audit and cargo-nextest needed three reasons that all said "no Rust here" in a JavaScript project.
    if (!was && lang) {
      const ext = lang[1].split('|')[0];
      rows.push({ item: c.item, kind: c.kind, signal: auto, decision: `later - when: the first .${ext} file appears`, reason: `${c.item} works on ${lang[2]} files, and this project has none yet, so it would only add an install and setup now` });
      continue;
    }
    // already in the project (a pack setup installed, an enabled skill, a feature that is on): decided "add" here, with
    // what it does as the reason; the AI can still change it. Lesson: installed packs and built-in features were "?" rows.
    if (!was && here) {
      const does = String(c.what || '').split(/(?<=\.)\s/)[0].replace(/\s+/g, ' ').trim();
      rows.push({ item: c.item, kind: c.kind, signal: auto, decision: 'add', reason: `already in the project and kept (change it if it does not fit): ${does || 'part of how this project works'}` });
      continue;
    }
    rows.push({ item: c.item, kind: c.kind, signal, decision: was ? was.decision : '?', reason: was ? was.reason : '' });
  }
  // packs and skills the starter can't list right now (it was removed): their decided rows stay
  for (const r of old) if (!kept.has(key(r.kind, r.item)) && ['pack', 'skill'].includes(r.kind) && !known[r.kind]) { rows.push(r); kept.add(key(r.kind, r.item)); }
  const removed = old.filter(r => !kept.has(key(r.kind, r.item))).map(r => r.item);
  const text = HEADER + '\n| Item | Kind | Signal | Decision | Reason |\n|---|---|---|---|---|\n' + rows.map(r => `| ${cell(r.item)} | ${r.kind} | ${cell(r.signal)} | ${cell(r.decision) || '?'} | ${cell(r.reason)} |`).join('\n') + '\n';
  return { rows, added, removed, text };
}
function save(text, engine = true) {
  if (read(abs(FIT_FILE)) === text) return false;
  fs.mkdirSync(path.dirname(abs(FIT_FILE)), { recursive: true });
  fs.writeFileSync(abs(FIT_FILE), text);
  if (engine) try { flushEngineWrites([FIT_FILE]); } catch { }
  return true;
}

if (cmd === 'refresh') {
  const b = build(projectSurvey());
  const changed = save(b.text);
  const open = b.rows.filter(r => !fitDecision(r.decision)).length;
  if (args.includes('--count-new')) { console.log(b.added.length); process.exit(0); }
  console.log(`fit: ${FIT_FILE} ${changed ? 'updated' : 'already current'} (${b.rows.length} candidates, ${b.added.length} new, ${b.removed.length} removed, ${open} to decide)`);
  if (b.removed.length) console.log(`removed (no longer candidates): ${b.removed.join(', ')}`);
  if (open) console.log('Next: decide each "?" row from the survey, the brief and the code (node tools/fit.mjs --json shows what each one is), then node tools/fit.mjs check.');
  process.exit(0);
}

if (cmd === 'check') {
  const probs = fitProblems(cfg);
  for (const p of probs) console.log(`- ${p}`);
  console.log(`FIT: ${probs.length ? 'FAIL' : 'PASS'}${probs.length ? ` (${probs.length} problem(s))` : ` (${fitRows().length} candidates decided)`}`);
  process.exit(probs.length ? 1 : 0);
}

if (cmd === 'decide') {
  let list = [];
  if (opt('--file')) { try { list = JSON.parse(fs.readFileSync(path.resolve(opt('--file')), 'utf8')); } catch (e) { console.error(`fit: cannot read ${opt('--file')}: ${e.message}`); process.exit(2); } }
  else {
    const [, item, decision, ...reason] = pos;
    if (!item || !decision) { console.log(usageOf(import.meta.url)); process.exit(2); }
    list = [{ item, kind: opt('--kind'), decision, reason: reason.join(' ') }];
  }
  const b = build(projectSurvey()), bad = [];
  for (const d of list) {
    const hits = b.rows.filter(r => r.item.toLowerCase() === String(d.item).toLowerCase() && (!d.kind || r.kind === d.kind));
    if (hits.length !== 1) { bad.push(`${d.item}: ${hits.length ? 'several rows have this name, add --kind' : 'no such candidate'}`); continue; }
    Object.assign(hits[0], { decision: d.decision, reason: d.reason ?? hits[0].reason }, d.signal ? { signal: d.signal } : {});
  }
  const text = HEADER + '\n| Item | Kind | Signal | Decision | Reason |\n|---|---|---|---|---|\n' + b.rows.map(r => `| ${cell(r.item)} | ${r.kind} | ${cell(r.signal)} | ${cell(r.decision) || '?'} | ${cell(r.reason)} |`).join('\n') + '\n';
  save(text, false);
  for (const x of bad) console.error(`fit: ${x}`);
  console.log(`fit: recorded ${list.length - bad.length} decision(s). Run node tools/fit.mjs check.`);
  process.exit(bad.length ? 1 : 0);
}

if (cmd === 'summary') {
  const rows = fitRows(), of = d => rows.filter(r => fitDecision(r.decision) === d);
  const short = s => s.replace(FIT_WHEN_TAIL, '').replace(/\s+/g, ' ').trim().replace(/[.;,]$/, '');
  // Only skips the survey had evidence for carry their reason; the rest are counted. Lesson: a full list of skips with
  // reasons was a 1,359-word wall the user had to scroll past. --all prints every skip with its reason.
  const add = of('add').map(r => r.item), later = of('later'), skips = of('skip');
  const noted = args.includes('--all') ? skips : skips.filter(r => r.signal && !/^survey:\s*(no direct signal|no code files yet)\s*$/i.test(r.signal));
  const soon = later.filter(r => !/^the first code file appears$/i.test(fitWhenOf(r)?.text || ''));
  const parts = [`Added: ${add.join(', ') || 'nothing'}.`];
  if (noted.length) parts.push(`Skipped: ${noted.map(r => `${r.item} (${short(r.reason)})`).join('; ')}.`);
  if (skips.length > noted.length) parts.push(`${noted.length ? 'Also skipped' : 'Skipped'} ${skips.length - noted.length} item(s) with no sign of need here.`);
  if (soon.length) parts.push(`Later: ${soon.map(r => `${r.item} (when: ${fitWhenOf(r)?.text || '?'})`).join('; ')}.`);
  if (later.length > soon.length) parts.push(`${later.length - soon.length} code tool(s) wait for the first code file.`);
  console.log(`${parts.join(' ')} Every reason: ${FIT_FILE}.`);
  process.exit(0);
}

if (cmd === 'json') {
  const sv = projectSurvey(), signals = fitSignals(sv), rows = fitRows(), { candidates } = fitCandidates(cfg);
  const byKey = new Map(rows.map(r => [key(r.kind, r.item), r]));
  console.log(JSON.stringify(candidates.map(c => {
    const r = byKey.get(key(c.kind, c.item)) || {};
    return { item: c.item, kind: c.kind, what: c.what, present: !!c.present(cfg), how: c.how, signals: (signals[key(c.kind, c.item)] || []).map(s => s.label), decision: r.decision || '?', reason: r.reason || '' };
  }), null, 2));
  process.exit(0);
}

console.log(usageOf(import.meta.url));
process.exit(2);
