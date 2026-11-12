// The fit checklist and the project survey, shared by both engines (moved whole from hooks-main.mjs; plan
// docs/plans/2026-11-12-fit-shared-module.md). docs/fit-checklist.md has one row per pack, library skill, recommended tool
// and optional feature; node tools/fit.mjs keeps it. hooks-main.mjs re-exports what it exported before.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, abs, bulkDir, config, exists, list, read, readJSON } from './settings.mjs';
import { kind, split, where } from './paths.mjs';
import { GENERIC, keyWords } from './near.mjs';
const envOf = n => process.env[`STARTER_${n}`] ?? process.env[`KS_${n}`];
const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const section = (text, name) => (new RegExp(`^##\\s+${esc(name)}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'im').exec(text) || [, ''])[1];
const CONFIG = () => where('tools/hooks/config.json');

export function frontmatter(text) {
  const m = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/.exec(text || '');
  if (!m) return null;
  const o = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const k = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(lines[i]);
    if (!k) continue;
    let v = k[2].trim();
    if (v === '>' || v === '|' || v === '>-' || v === '|-' || v === '') { // folded/multi-line value
      const more = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) more.push(lines[++i].trim());
      if (more.length) v = more.join(' ');
      else if (v !== '') v = '';
    }
    o[k[1]] = v.replace(/^["']|["']$/g, '');
  }
  return o;
}
export const splitList = s => String(s || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean);


// ---------- The starter, after setup ----------
// At the end of setup the user chooses (tools/starter.mjs): link the project to the starter folder it came from, keep
// a local copy of the unused packs and library skills in .starter/ (ignored by git), or remove the starter's leftovers.
// Packs, library skills and engine upgrades are then found in that order: the project itself (during setup), the
// kept copy, the linked starter folder. The link is a machine path, so it lives in an ignored file.
export const STARTER_LINK = 'tools/starter.local.json';
export function starterLink() {
  const j = readJSON(abs(STARTER_LINK), null);
  return j && j.path && fs.existsSync(path.join(j.path, 'tools', 'new-project.mjs')) ? path.resolve(j.path) : null;
}
let sourcesWarned = false;
export function starterSources() {
  const out = [{ kind: 'project', dir: ROOT }];
  if (fs.existsSync(abs('.starter'))) out.push({ kind: 'kept copy', dir: abs('.starter') });
  const link = starterLink();
  // a development copy (.starter-dev) never feeds a real project: its unfinished changes would arrive with each pack or skill
  if (link && fs.existsSync(path.join(link, '.starter-dev')) && !exists('.starter-dev') && !envOf('ALLOW_DEV')) {
    if (!sourcesWarned) { sourcesWarned = true; console.error(`The linked starter (${link}) is a development copy. Link a stable copy: node tools/starter.mjs link "<stable starter folder>"`); }
  } else if (link) out.push({ kind: 'linked starter', dir: link });
  return out;
}
// The first place that has a pack payload or library skill: { dir, kind } or null.
export function findPack(name) {
  for (const s of starterSources()) { const d = path.join(s.dir, 'packs', name); if (fs.existsSync(path.join(d, 'pack.json'))) return { dir: d, kind: s.kind }; }
  return null;
}
export function findLibrary() {
  for (const s of starterSources()) { const d = path.join(s.dir, 'library'); if (fs.existsSync(path.join(d, 'catalog.json'))) return { dir: d, kind: s.kind }; }
  return null;
}

// ---------- survey: what is in the project (tools/survey.mjs, the fit checklist, the "later" notices) ----------
// The project's own files, without the starter's files, dependencies and build output. Read-only.
const SURVEY_SKIP = /^(\.git|node_modules|\.cache|\.claude|\.agents|\.gemini|\.codex|\.obsidian|\.starter|dist|build|out|target|bin|obj|venv|\.venv|__pycache__|coverage|packs|library)$/;
export const SURVEY_STARTER = /^(AGENTS|CLAUDE|DIRECTORY|HOW-TO-USE|SETUP-PROMPT)\.md$|^(README|AGENTS|CLAUDE)\.starter\.md$|^skills\/|^tools\/hooks\/|^tools\/(audit|packs|skills|starter|new-project|writing-check|integrity-check|recall|survey|screenshot|fit|dedupe)\.mjs$|^tools\/starter\.local\.json$|^\.githooks\/|^docs\/(checks|playbooks|plans)\/|^docs\/(BRIEF|STATUS|CHANGELOG|DECISIONS|MENU|security|names\.json|foundation|lessons|fit-checklist|recommended-tools|glossary)(\.md)?$|^docs\/names\.json$|^docs\/(releases|specs)\/_TEMPLATE\.md$|^docs\/knowledge\/(README|SOURCES)\.md$|^(inbox|outputs|sources)\/README\.md$|^tools\/starter\/|^tools\/(packs-registry|starter\.local)\.json$|^docs\/feedback-inbox\//;
// (the pack templates and the starter's own folders are not the project's notes. Lesson: a new project "had" 9 notes)
export const SURVEY_KINDS = {
  code: /\.(js|mjs|cjs|ts|tsx|jsx|py|ipynb|rb|go|rs|java|kt|cs|cpp|c|h|swift|php|lua|gd|dart|scala|ex|exs|r|jl)$/i,
  visual: /\.(html?|css|scss|vue|svelte|jsx|tsx)$/i,
  data: /\.(json|csv|tsv|xlsx?|sqlite|db|parquet|xml|ya?ml)$/i,
  tabular: /\.(csv|tsv|xlsx?|sqlite|db|parquet)$/i,
  scripts: /\.(ps1|sh|bat|cmd)$/i,
  powershell: /\.(ps1|psm1)$/i,
  shell: /\.(sh|bash)$/i,
  python: /\.(py|ipynb)$/i,
  jsts: /\.(js|mjs|cjs|ts|tsx|jsx)$/i,
  // (a dependency list or licence is not a note. Lesson: requirements.txt counted as a document)
  notes: /^(?!(.*\/)?(requirements[^/]*|constraints[^/]*|LICENSE|NOTICE|COPYING|CMakeLists|robots|third[_-]party[^/]*)\.txt$).*\.(md|mdx|txt|rst|org|docx?|pdf)$/i
};
export function projectSurvey({ git = true } = {}) {
  const files = [];
  (function walk(d) {
    let ents; try { ents = fs.readdirSync(path.join(ROOT, d || '.'), { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const p = d ? `${d}/${e.name}` : e.name;
      if (e.isDirectory()) { if (!SURVEY_SKIP.test(e.name) && !bulkDir(path.join(ROOT, d || '.'), e.name, 'deps')) walk(p); continue; }
      if (SURVEY_STARTER.test(p) || files.length > 20000) continue;
      let size = 0; try { size = fs.statSync(path.join(ROOT, p)).size; } catch { }
      files.push({ p, size });
    }
  })('');
  const n = { all: files.length };
  for (const [k, rx] of Object.entries(SURVEY_KINDS)) n[k] = files.filter(f => rx.test(f.p)).length;
  const manifests = files.filter(f => /(^|\/)(package\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod|.*\.csproj|.*\.sln|Gemfile|composer\.json|project\.godot|pubspec\.yaml)$/.test(f.p)).map(f => f.p);
  const big = files.filter(f => f.size > 5e6).map(f => `${f.p} (${Math.round(f.size / 1e6)} MB)`);
  let repo = null;
  if (git && exists('.git')) { const c = spawnSync('git', ['rev-list', '--count', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }); repo = { commits: Number(c.stdout) || 0 }; }
  return { files, n, manifests, big, git: repo };
}

// ---------- fit checklist: every candidate decided by the AI, with a reason that holds (REQ: fit-checklist) ----------
// docs/fit-checklist.md has one row per pack, library skill, recommended tool and optional feature: Item | Kind |
// Signal | Decision | Reason. node tools/fit.mjs keeps the rows; node tools/fit.mjs check runs fitProblems. The AI fills
// it from the survey, the brief and the code, so the user is not asked about each one. Lesson in advance: a list the
// user had to go through item by item got skipped, and things that fit the project were never added.
export const FIT_FILE = 'docs/fit-checklist.md';
const gitHooksOn = () => {
  if (!exists('.git')) return false;
  const hp = (spawnSync('git', ['config', 'core.hooksPath'], { cwd: ROOT, encoding: 'utf8' }).stdout || '').trim();
  if (hp === '.githooks') return true;
  const own = hp || '.git/hooks';
  return ['commit-msg', 'pre-push', 'pre-commit'].every(g => /\.githooks\//.test(read(abs(`${own}/${g}`))));
};
// strict: a "skip" while it is on contradicts the project, so it fails
export const FIT_FEATURES = [
  { item: 'Obsidian vault', what: 'The .obsidian settings, so the notes open in Obsidian with working links and a graph.', present: () => exists('.obsidian'), how: 'node tools/hooks/wire.mjs makes .obsidian/' },
  { item: 'git hooks', what: 'The .githooks checks on every commit and push (AI attribution, secrets, .gitignore).', present: gitHooksOn, how: 'git config core.hooksPath .githooks (or call .githooks/* from your own hooks)' },
  { item: 'autonomy auto', what: '"autonomy": "auto" in tools/hooks/config.json: the AI decides and records its choices instead of asking.', present: cfg => cfg.autonomy === 'auto', strict: true, how: 'set "autonomy": "auto" in tools/hooks/config.json' },
  { item: 'recall and memory', what: 'tools/recall.mjs and the history of finished turns, so a request like an earlier one starts from how it was solved.', present: () => exists('tools/recall.mjs'), how: 'upgrade the engine (tools/recall.mjs)' },
  { item: 'plans', what: 'Step-by-step plans in docs/plans/ for bigger work, resumed by the next session.', present: () => exists('docs/plans/README.md') || exists('skills/plan/SKILL.md'), how: 'upgrade the engine (skills/plan, docs/plans/README.md)' }
];
// The survey's evidence for each candidate. A "skip" of a candidate whose signal is on must say why the signal doesn't
// make it worth having (its reason has to mention it).
const FIT_SIGNALS = [
  { id: 'web', count: s => s.n.visual, label: c => `${c} web/UI files`, words: /\b(web|ui|html|css|screens?|pages?|interfaces?|visual|front.?end|dashboards?|gui)\b/i, for: ['pack:gui', 'skill:frontend-design', 'tool:playwright', 'tool:playwright mcp'] },
  { id: 'data', count: s => s.n.tabular, label: c => `${c} data files (csv, xlsx and similar)`, words: /\b(data|csv|tsv|xlsx?|spreadsheets?|tables?|datasets?|parquet|sqlite)\b/i, for: ['skill:data-analysis', 'tool:duckdb', 'tool:csvkit', 'tool:sqlite-utils'] },
  { id: 'git', count: s => s.git ? s.git.commits + 1 : 0, label: (c, s) => `a git repository (${s.git.commits} commits)`, words: /\b(git|commits?|repos?|repository|history|version control)\b/i, for: ['feature:git hooks', 'tool:gitleaks'] },
  { id: 'code', count: s => s.n.code >= 5 || s.manifests.length ? s.n.code || 1 : 0, label: c => `${c} code files`, words: /\b(code|software|scripts?|apps?|programs?|source)\b/i, for: ['pack:app'] },
  { id: 'notes', count: s => s.n.notes >= 5 ? s.n.notes : 0, label: c => `${c} notes or documents`, words: /\b(notes?|documents?|docs|markdown|knowledge|writing|texts?)\b/i, for: ['pack:knowledge', 'feature:obsidian vault'] },
  { id: 'python', count: s => s.n.python, label: c => `${c} Python files`, words: /\bpython\b|\.py\b/i, for: ['tool:ruff', 'tool:pytest', 'tool:uv'] },
  { id: 'shell', count: s => s.n.shell, label: c => `${c} shell scripts`, words: /\b(shell|bash|sh|scripts?)\b/i, for: ['tool:shellcheck'] },
  { id: 'big', count: s => s.big.length, label: c => `${c} large files (over 5 MB)`, words: /\b(large|big|binary|binaries|lfs|size|media)\b/i, for: ['tool:git lfs'] },
  // Lesson: a vault with .obsidian/ and PDFs in its inbox got "no direct signal" for Obsidian, MarkItDown and OCR
  // (the engine itself writes .obsidian/app.json with three link settings: only more than that is the user's vault.
  // Lesson: reviews found every project's survey counted the engine's own file as the user's Obsidian vault)
  { id: 'obsidian', count: () => userVault() ? 1 : 0, label: () => 'an Obsidian vault (.obsidian/)', words: /\b(obsidian|vault|notes?|graph|links?)\b/i, for: ['feature:obsidian vault', 'tool:obsidian', 'pack:knowledge'] },
  { id: 'docs', count: s => s.files.filter(f => /\.(pdf|docx?|pptx?|xlsx|epub)$/i.test(f.p)).length, label: c => `${c} PDF or Office documents`, words: /\b(pdfs?|documents?|office|docx?|word|pptx?|slides|scans?|ocr|convert|text)\b/i, for: ['tool:markitdown', 'tool:pandoc', 'tool:tesseract ocr', 'pack:knowledge'] },
  { id: 'js', count: s => s.n.jsts && s.manifests.some(m => /package\.json$/.test(m)) ? s.n.jsts : 0, label: c => `${c} JavaScript or TypeScript files`, words: /\b(js|javascript|ts|typescript|node|npm|eslint|prettier|lint|linter|types?)\b/i, for: ['tool:biome', 'tool:typescript (tsc)'] },
  // Lesson: a Rust CLI, a Godot game and an ML project got "no direct signal" for every tool of their own language
  { id: 'rust', count: s => s.manifests.filter(m => /Cargo\.toml$/.test(m)).length, label: c => `${c} Rust crate(s) (Cargo.toml)`, words: /\b(rust|cargo|crates?|clippy|lint|tests?)\b/i, for: ['tool:rust toolchain', 'tool:clippy', 'tool:cargo-audit', 'tool:cargo-nextest', 'skill:dependency-update'] },
  { id: 'godot', count: s => s.manifests.filter(m => /project\.godot$/.test(m)).length, label: () => 'a Godot project (project.godot)', words: /\b(godot|gdscript|game|lint|tests?)\b/i, for: ['tool:godot (headless)', 'tool:gdtoolkit', 'tool:gdunit4', 'skill:game-dev'] },
  { id: 'flutter', count: s => s.manifests.filter(m => /pubspec\.yaml$/.test(m)).length, label: () => 'a Dart or Flutter package (pubspec.yaml)', words: /\b(flutter|dart|mobile|apps?|phones?)\b/i, for: ['tool:flutter sdk', 'skill:mobile-app', 'pack:gui'] },
  // a toolchain the code needs is a candidate of its own: without it nothing compiles or runs (Lesson: reviewers found
  // Go, Rust and Flutter projects whose code never ran, with no row that said so)
  { id: 'go', count: s => s.manifests.filter(m => /go\.mod$/.test(m)).length, label: c => `${c} Go module(s) (go.mod)`, words: /\b(go|golang|lint|vet|tests?|vulnerab\w*)\b/i, for: ['tool:go toolchain', 'tool:golangci-lint', 'tool:govulncheck', 'skill:dependency-update'] },
  { id: 'powershell', count: s => s.n.powershell, label: c => `${c} PowerShell script(s)`, words: /\b(powershell|ps1|scripts?|lint|tests?)\b/i, for: ['tool:psscriptanalyzer', 'tool:pester'] },
  { id: 'notebooks', count: s => s.files.filter(f => /\.ipynb$/i.test(f.p)).length, label: c => `${c} Jupyter notebook(s)`, words: /\b(notebooks?|jupyter|ipynb|outputs?|ml|experiments?)\b/i, for: ['tool:nbstripout', 'tool:nbqa', 'skill:ml-experiments'] }
];
// What the brief and the setup answers say the work is: evidence too, so a skill whose files don't exist yet is still
// weighed. Lesson: a bakery whose brief was all newsletters and supplier emails got "no direct signal" for marketing.
// The choices about the starter itself (packs, library skills, tools) name skills, so they are not evidence about the
// work. Lesson: "Library skills: frontend-design ..." counted as the brief asking for a library and a front end.
const briefText = () => `${read(abs('docs/BRIEF.md')).replace(/^##\s+Tools\b[\s\S]*?(?=^##\s|(?![\s\S]))/m, '')}\n${section(read(abs('docs/DECISIONS.md')), 'Setup interview')}`
  .replace(/<!--[\s\S]*?-->/g, ' ').split(/\r?\n/).filter(l => !/^\s*[-*]\s*\**(packs|library skills|starter|commands|release|tools)\**\s*:/i.test(l)).join('\n');
const BRIEF_SIGNALS = [
  ['marketing', /\b(marketing|campaigns?|newsletters?|social media|instagram|brand|promotions?|ads?|seo)\b/i],
  ['legal-review', /\b(contracts?|terms of (service|use)|privacy policy|gdpr|legal|compliance|lease|ndas?)\b/i],
  ['user-research', /\b(user (interviews?|research|feedback)|customer (interviews?|feedback)|surveys?|usability|personas?)\b/i],
  ['data-analysis', /\b(sales (figures|data|numbers)|spreadsheets?|statistics|kpis?|metrics|reports? on (sales|numbers))\b/i],
  ['correspondence', /\b(emails?|letters?|suppliers?|landlord|replies|reply to (customers|clients)|correspondence)\b/i],
  ['routines', /\b(every (day|morning|week|month|monday|tuesday|wednesday|thursday|friday)|weekly|monthly|daily|recurring|routine)\b/i],
  ['manuscript', /\b(novel|book|chapters?|screenplay|script writing|memoir|manuscript|short stories)\b/i],
  ['ml-experiments', /\b(machine learning|ml model|train(ing)? (a |the )?model|neural|classifier|datasets?|kaggle|pytorch|tensorflow|scikit)\b/i],
  ['mobile-app', /\b(mobile app|android|ios|iphone|flutter|react native|swiftui|play store|app store)\b/i],
  ['game-dev', /\b(game|godot|unity|unreal|sprites?|levels?|player character|steam|itch\.io)\b/i],
  ['web-app-patterns', /\b(web app|website|react|vue|svelte|next\.?js|front.?end|dashboard)\b/i],
  ['package-release', /\b((code|software|client|python|js|javascript|typescript|rust|dart) library|crates?\.io|crate|npm package|pypi|nuget|pub\.dev|publish(ed)? to (npm|pypi|crates|nuget|pub)|sdk|cli tool)\b/i],
  ['data-pipeline', /\b(pipeline|etl|imports? (of|from)|exports? from|batch(es)?|ingest(ion)?)\b/i],
  ['notes-vault', /\b(obsidian|vault|my notes|notes app|zettelkasten)\b/i],
  ['dependency-update', /\b(dependenc(y|ies)|upgrade|outdated|vulnerab\w+|dependabot|renovate)\b/i]
];
for (const [skill, rx] of BRIEF_SIGNALS) FIT_SIGNALS.push({ id: `brief-${skill}`, count: () => { const m = rx.exec(fitBrief.text ??= briefText()); return m ? 1 : 0; },
  label: () => `the brief or setup answers mention "${rx.exec(fitBrief.text ??= briefText())[0]}"`, words: new RegExp(`${rx.source}|\\bbrief\\b|\\banswers?\\b`, 'i'), for: [`skill:${skill}`] });
const fitBrief = {};
export const fitKey = (kind, item) => `${kind}:${String(item).toLowerCase()}`;
export function fitSignals(sv = projectSurvey()) {
  const out = {}; fitBrief.text = undefined; // read the brief afresh on each call
  for (const sg of FIT_SIGNALS) { const c = sg.count(sv); if (!c) continue; for (const k of sg.for) (out[k] ||= []).push({ id: sg.id, label: sg.label(c, sv), words: sg.words }); }
  return out;
}
// Every candidate: { kind, item, what, present(cfg), how }. Packs and skills come from the starter's sources; when none
// is reachable (the starter was removed), known=false keeps the rows already decided instead of dropping them.
// Sections of docs/recommended-tools.md whose tools only work on code: in a project with no code yet, fit.mjs decides
// them "later - when: the first code file appears" itself. Lesson: a notes-only project had 63 code tools to decide.
const FIT_CODE_SECTIONS = /code quality|testing|environment managers|task runners/i;
export function fitCandidates(cfg = config()) {
  const own = readJSON(CONFIG(), {}), out = [], known = { pack: false, skill: false };
  const packNames = new Set(own.packs || []);
  for (const s of starterSources()) { let ns = []; try { ns = fs.readdirSync(path.join(s.dir, 'packs')); } catch { } for (const n of ns) if (fs.existsSync(path.join(s.dir, 'packs', n, 'pack.json'))) { packNames.add(n); known.pack = true; } }
  for (const n of [...packNames].sort()) {
    const p = findPack(n), j = p ? readJSON(path.join(p.dir, 'pack.json'), {}) : {};
    out.push({ kind: 'pack', item: n, what: [j.does, j.good && `Good when: ${j.good}`, j.costs && `Costs: ${j.costs}`].filter(Boolean).join(' '), present: () => (own.packs || []).includes(n), how: `node tools/packs.mjs install ${n}` });
  }
  const lib = findLibrary();
  if (lib) {
    known.skill = true;
    for (const e of readJSON(path.join(lib.dir, 'catalog.json'), { skills: [] }).skills)
      out.push({ kind: 'skill', item: e.name, what: [e.does, e.good && `Good when: ${e.good}`, e.costs && `Costs: ${e.costs}`, `Fits: ${e.for}`].filter(Boolean).join(' '), present: () => exists(`${cfg.skillsDir}/${e.name}/SKILL.md`), how: `node tools/skills.mjs enable ${e.name}` });
  }
  let section = '';
  for (const line of read(abs('docs/recommended-tools.md')).split(/\r?\n/)) {
    if (/^## /.test(line)) section = line.slice(3).trim();
    const m = /^\|\s*\[([^\]]+)\]\([^)]*\)[^|]*\|([^|]*)\|([^|]*)\|([^|]*)\|/.exec(line);
    if (!m) continue;
    const item = m[1].trim();
    out.push({ kind: 'tool', item, section, codeOnly: FIT_CODE_SECTIONS.test(section) && !/^(lychee|vale|markdownlint)/i.test(item), what: `${m[2].trim()}. Recommend when: ${m[3].trim()}. Skip when: ${m[4].trim()}.`, present: () => fitToolListed(item), how: `install it (docs/recommended-tools.md), then list it under "## Tools" in docs/BRIEF.md` });
  }
  for (const f of FIT_FEATURES) out.push({ kind: 'feature', ...f });
  return { candidates: out, known };
}
export function fitToolListed(item, brief = read(abs('docs/BRIEF.md'))) {
  // every "## Tools" section counts (Lesson: a second one added below the template's empty one was not read)
  const tools = brief.split(/^## /m).filter(p => /^Tools\s*$/m.test(p.split('\n')[0])).join('\n').replace(/<!--[\s\S]*?-->/g, '');
  const names = [item, item.replace(/\s*\(.*\)\s*/, ''), (/\(([^)]+)\)/.exec(item) || [])[1]].filter(Boolean);
  return names.some(v => new RegExp(`(^|[^a-z0-9])${esc(v.trim())}($|[^a-z0-9])`, 'i').test(tools));
}
// The table: rows in file order. Cells never hold "|" (fit.mjs writes "/" instead).
export function fitRows(text = read(abs(FIT_FILE))) {
  const rows = [];
  for (const line of text.split(/\r?\n/)) {
    if (!/^\|/.test(line) || /^\|\s*-/.test(line) || /^\|\s*Item\s*\|/i.test(line)) continue;
    const c = line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(s => s.trim());
    if (c.length < 5) continue;
    rows.push({ item: c[0], kind: c[1].toLowerCase(), signal: c[2], decision: c[3], reason: c.slice(4).join(' / ') });
  }
  return rows;
}
export const fitDecision = d => (/^(add|skip|later)\b/i.exec(String(d).trim()) || [])[1]?.toLowerCase() || null;
// "later - when: the code passes 30 files" → { metric: 'code', min: 31 }. The noun decides what is counted: "commits"
// the git history, "code files" or "data files" a survey kind, "html files" files ending in .html, "trip files" files
// whose path contains "trip". A condition the hooks can't read gets metric null: not measurable, the sweeps revisit it.
// Lesson: "more than 6 trip files" was counted against every file in the project, so it read as met on day one.
const FIT_KINDS = [['visual', /\b(web|ui|screens?|pages?)\b/], ['tabular', /\bdata\b|\bcsv\b|spreadsheets?|\bxlsx\b/], ['python', /\bpython\b/],
  ['code', /\bcode\b|\bsource\b/], ['notes', /\bnotes?\b|\bdocuments?\b/], ['scripts', /\bscripts?\b/]];
const FIT_EXTS = /^(html?|css|scss|js|mjs|cjs|ts|tsx|jsx|py|md|mdx|txt|csv|tsv|json|xml|ya?ml|xlsx?|pdf|docx?|png|jpe?g|gif|svg|sql|sqlite|db|ps1|sh|bat|go|rs|java|cs|rb|php)$/;
const FIT_NOT_NOUN = /^(\d[\d,]*|a|an|the|any|more|than|first|new|over|above|beyond|of|its|our|all|some|few|many|several|passes|has|have|exceeds?)$/;
export function fitWhen(text) {
  const m = /when:\s*(.+)$/i.exec(String(text || ''));
  if (!m) return null;
  const w = m[1].toLowerCase(), out = { text: m[1].trim(), metric: null };
  const num = /(\d[\d,]*)/.exec(w);
  let min = num ? Number(num[1].replace(/,/g, '')) : /appear|exist|\bany\b|first|arrive|added|starts?/.test(w) ? 1 : null;
  if (min != null && num && /pass|over|more than|exceed|above|beyond/.test(w)) min += 1;
  if (min == null) return out;
  const kindIn = s => (FIT_KINDS.find(([, rx]) => rx.test(s)) || [])[0];
  if (/\bcommits?\b/.test(w)) return { ...out, metric: 'commits', min };
  const f = /([a-z0-9.+#_-]+)\s+files?\b/.exec(w);
  if (f) {
    const noun = f[1].replace(/^\./, '');
    if (FIT_EXTS.test(noun)) return { ...out, metric: `.${noun} files`, ext: noun, min };
    const kind = kindIn(noun);
    if (kind) return { ...out, metric: kind, min };
    if (FIT_NOT_NOUN.test(noun)) return { ...out, metric: kindIn(w) || 'all', min }; // "the code passes 30 files", "more than 30 files"
    if (/^[a-z][a-z0-9_-]{2,}$/.test(noun)) return { ...out, metric: `files named *${noun}*`, word: noun, min };
    return out;
  }
  const kind = kindIn(w);
  return kind ? { ...out, metric: kind, min } : out;
}
// the condition sits in the Decision cell ("later - when: ...") or, failing that, in the Reason
export const fitWhenOf = r => fitWhen(/when:/i.test(r.decision) ? r.decision : r.reason);
// (code files of the project's own work, as fit.mjs counts them when it defers code tools: helper scripts under tools/
// or scripts/ don't meet "the first code file appears". Lesson, trial round 19: one validator script under tools/ made
// that condition true and reopened about 60 code-tool rows in a landlord's desk and a research vault)
const FIT_HELPER_DIRS = /^(tools|scripts|skills|library|packs|\.claude|\.codex|\.githooks|\.github|\.cache)\//;
const FIT_CODE_EXT = /\.(m?[jt]sx?|cjs|py|go|rs|rb|java|kt|cs|php|swift|dart|gd|c|cc|cpp|h|hpp|lua|ex|exs|scala|vue|svelte)$/i;
export const fitMetric = (sv, w) => w.metric === 'code' ? (sv.files || []).filter(f => FIT_CODE_EXT.test(f.p) && !FIT_HELPER_DIRS.test(f.p)).length
  : w.metric === 'commits' ? sv.git?.commits || 0
  : w.ext ? sv.files.filter(f => f.p.toLowerCase().endsWith(`.${w.ext}`)).length
  : w.word ? sv.files.filter(f => f.p.toLowerCase().includes(w.word)).length
  : sv.n[w.metric] || 0;
const FIT_FILLER = new Set(['not', 'needed', 'need', 'needs', 'this', 'that', 'the', 'for', 'now', 'use', 'used', 'useful', 'maybe', 'later', 'really', 'any', 'project',
  'here', 'just', 'also', 'very', 'and', 'but', 'with', 'there', 'they', 'than', 'then', 'would', 'could', 'might', 'will', 'can', 'may', 'yet', 'all', 'one', 'thing',
  'things', 'stuff', 'time', 'moment', 'currently', 'right', 'applicable', 'relevant', 'required', 'necessary', 'unnecessary', 'nice', 'have', 'good', 'idea', 'skip', 'add']);
const FIT_BOILER = /^(not needed|n ?a|no use|maybe later|later|not relevant|not applicable|none|nothing|not required|unnecessary|no need|skip|skipped|no|yes|useful|could be useful|nice to have|might help|not now|tbd|todo)$/;
// What is wrong with a reason, or '' when it holds (docs/checks/better-or-worse.md: a concrete gain or cost).
const userVault = () => {
  if (!exists('.obsidian')) return false;
  const files = list('.obsidian');
  if (files.some(f => f !== 'app.json')) return true;
  const app = readJSON(abs('.obsidian/app.json'), {});
  return JSON.stringify(Object.keys(app).filter(k => k !== 'userIgnoreFilters').sort()) !== JSON.stringify(['alwaysUpdateLinks', 'newLinkFormat', 'useMarkdownLinks']);
};
// The words of a text that can tie a reason to its item: 4+ letters, not filler or words every candidate uses, cut to
// their first 5 letters ("games" and "game-dev" meet at "game"; "marketed" and "marketing" at "marke").
const FIT_GENERIC = new Set([...FIT_FILLER, 'when', 'recommend', 'good', 'your', 'with', 'from', 'into', 'each', 'every', 'other', 'more', 'only', 'already', 'adds',
  'code', 'file', 'files', 'tool', 'tools', 'user', 'users', 'projects', 'makes', 'keeps', 'checks', 'check', 'what', 'which', 'where', 'about', 'their', 'them',
  'after', 'before', 'first', 'helps', 'help', 'does', 'over', 'none', 'nothing', 'work', 'works', 'runs', 'built', 'build', 'builds', 'gain', 'cost', 'costs', 'upkeep']);
const fitStems = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !FIT_GENERIC.has(w)).map(w => w.slice(0, 5));
// A reason names something about its item: the item's name, or a word of what the item is or is for ("Not a game." for
// game-dev, "No YAML files." for yq).
export function fitReasonNamesItem(reason, c) {
  if (!c) return false;
  const r = String(reason || '').toLowerCase();
  if (String(c.item || '').toLowerCase().split(/[^a-z0-9.+-]+/).filter(w => w.length >= 2).some(w => new RegExp(`(^|[^a-z0-9])${esc(w)}([^a-z0-9]|$)`).test(r))) return true;
  const own = new Set([...fitStems(c.item), ...fitStems(c.what)]);
  return fitStems(r).some(w => own.has(w));
}
// A reason is judged on what it says, not on its length: a short reason that names something about the item stands
// ("Not a game: a terminal photo renamer."), and a reason of 8 words or more stands as before. Lesson: the old 8-word
// minimum made an agent glue the same 11-word tail onto 31 short reasons, which left the checklist the user was sent
// to with 31 ungrammatical copies of one sentence.
export function fitReasonProblem(reason, c = null) {
  const r = String(reason || '').trim(), flat = r.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!r || r === '?') return 'no reason: say what it gains or costs for this project';
  if (FIT_BOILER.test(flat)) return `"${r}" is boilerplate: say what it gains or costs for this project`;
  // being there already is no reason to keep it (Lesson: reviewers found packs and skills "already in the project and
  // kept" only because the engine's own files looked like a signal)
  if (/^(it is |it's |its )?already (in|part of|set up in|installed in) (the|this) project\b[^.]{0,30}$/.test(flat)) return `"${r}" says it is there, not why it helps: say what it gains or costs for this project`;
  const words = flat.split(' ').filter(Boolean);
  // (the item's own name is no content: "Not needed: game-dev." says nothing, "Not a game." does)
  const item = String(c?.item || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const content = (item ? ` ${flat} `.split(` ${item} `).join(' ') : flat).split(' ').filter(w => w.length >= 3 && !FIT_FILLER.has(w));
  if (words.length < 8 && !(words.length >= 3 && content.length && fitReasonNamesItem(r, c)))
    return `the reason (${words.length} words) says nothing about ${c?.item || 'this item'} or what it would do here: name what it is for and why this project does or doesn't need that (a short reason is fine when it does)`;
  if (words.length >= 8 && words.filter(w => w.length >= 3 && !FIT_FILLER.has(w)).length < 4) return 'the reason is boilerplate: name the concrete gain or cost for this project';
  if (/worth it\s*:/i.test(r) && !/worth it\s*:\s*\S[^/]*\/\s*\S/i.test(r)) return '"Worth it:" needs "<gain> / <cost>"';
  return '';
}
// The "later - when: <condition>" tail of a reason, cut before the reason is judged. Only a "when:" that starts the
// text, follows "later" or follows punctuation counts. Lesson: "Recommend when: ..." quoted from the catalog was cut too.
export const FIT_WHEN_TAIL = /(?:^|\blater\s*-?\s*|[-.;,(]\s*)when:.*$/i;
// Every problem with the checklist, as "<kind> <item>: <what to do>". [] means FIT: PASS.
export function fitProblems(cfg = config(), { sv = null, text = null } = {}) {
  if (text == null && !exists(FIT_FILE)) return [`${FIT_FILE} is missing: run node tools/fit.mjs, then decide every row`];
  const rows = fitRows(text ?? read(abs(FIT_FILE))), probs = [];
  const { candidates, known } = fitCandidates(cfg);
  const have = new Set(rows.map(r => fitKey(r.kind, r.item)));
  const missing = candidates.filter(c => !have.has(fitKey(c.kind, c.item)));
  if (missing.length) probs.push(`${missing.length} candidate(s) are not in the checklist yet (${missing.slice(0, 4).map(c => c.item).join(', ')}${missing.length > 4 ? ', ...' : ''}): run node tools/fit.mjs`);
  sv ||= projectSurvey();
  const signals = fitSignals(sv), byKey = new Map(candidates.map(c => [fitKey(c.kind, c.item), c]));
  const seen = {};
  for (const r of rows) { const k = r.reason.toLowerCase().replace(/\s+/g, ' ').trim(); if (k.length > 3) seen[k] = (seen[k] || 0) + 1; }
  for (const r of rows) {
    const at = `${r.kind} ${r.item}`, key = fitKey(r.kind, r.item), d = fitDecision(r.decision);
    let c = byKey.get(key);
    // a pack or skill row is kept when the starter can't be reached to list them; it is still checked against the project
    if (!c && ['pack', 'skill'].includes(r.kind) && !known[r.kind]) c = r.kind === 'pack' ? { kind: 'pack', item: r.item, present: () => (readJSON(CONFIG(), {}).packs || []).includes(r.item), how: `node tools/packs.mjs install ${r.item}` }
      : { kind: 'skill', item: r.item, present: () => exists(`${cfg.skillsDir}/${r.item}/SKILL.md`), how: `node tools/skills.mjs enable ${r.item}` };
    if (!c) { probs.push(`${at}: no longer a candidate: run node tools/fit.mjs`); continue; }
    if (!d) { probs.push(/^\?*$/.test(r.decision.trim()) ? `${at}: not decided yet (add, skip or "later - when: <condition>", with the reason)` : `${at}: the decision must be add, skip or later`); continue; }
    if (!r.signal || r.signal === '?') probs.push(`${at}: write what the survey, brief or code shows about it in Signal`);
    const rp = fitReasonProblem(r.reason.replace(FIT_WHEN_TAIL, '').trim() || r.reason, c);
    if (rp) probs.push(`${at}: ${rp}`);
    else if (seen[r.reason.toLowerCase().replace(/\s+/g, ' ').trim()] > 2) probs.push(`${at}: the same reason is used for ${seen[r.reason.toLowerCase().replace(/\s+/g, ' ').trim()]} rows: write one that is about this item`);
    const on = !!c.present(cfg);
    if (d === 'add' && !on) probs.push(`${at}: decided add, but it is not in the project: ${c.how}`);
    if (d === 'skip' && on && (c.kind !== 'feature' || c.strict)) probs.push(`${at}: decided skip, but it is in the project: remove it, or decide add`);
    if (d === 'skip') for (const s of signals[key] || []) if (!s.words.test(r.reason)) probs.push(`${at}: the project has ${s.label}: say why it still doesn't help (the reason must mention it)`);
    if (d === 'later') {
      const w = fitWhenOf(r);
      if (!w) probs.push(`${at}: later needs a condition: "later - when: <what has to happen>"`);
      // a user who asked not to be asked will never give the OK a "later" waits for (Lesson: a photo tool deferred the
      // library that reads when a photo was taken, its whole purpose, "until the user OKs it", in an autonomy-auto project)
      // (a tool installed on the machine itself still needs the user's OK under "auto", AGENTS.md Step 0: then the reason
      // says it is a machine install; anything installed into the project does not wait)
      else if (cfg.autonomy === 'auto' && /\b(user|owner|you)\b[^.]*\b(oks?|okays?|approves?|agrees?|confirms?|answers?|signs? off|decides?|gives? the go)\b|\bwith the user\b|\buser'?s? (ok|approval|go-ahead)\b/i.test(w.text)
        && !(r.kind === 'tool' && /\b(machine|system[- ]wide|globally|global install|on (the|this) computer|admin(istrator)?|Install-Module|winget|brew|apt)\b/i.test(`${r.reason} ${w.text}`)))
        probs.push(`${at}: its condition waits for the user's OK, but this project runs with autonomy "auto" (the user asked not to be asked): decide add or skip now (a tool installed on the machine itself may wait: say so in the reason)`);
      else if (w.metric && fitMetric(sv, w) >= w.min) probs.push(`${at}: its condition is met now (when: ${w.text}; ${w.metric} is ${fitMetric(sv, w)}): decide add or skip`);
    }
  }
  return probs;
}
// Notes, not failures: 5 or more reasons that end with the same words (the item's own name aside), where that shared
// tail is most of each reason. It reads as padding to the user the checklist is shown to; a short reason that names the
// item is enough. Rows the engine wrote itself are left out. Not a failure, so checklists already decided this way keep
// passing. Lesson: 31 reasons in one checklist ended with "...in this photo renaming tool, so adding it would only cost
// upkeep", glued on by a script to reach a word minimum.
const FIT_GENERATED = /^auto: |\bworks on (code|[\w ]+ files), and this project has (no code files yet|none yet)|^already in the project and kept \(change it if it does not fit\)/i;
export function fitBoilerplate(text = null) {
  const rows = fitRows(text ?? (exists(FIT_FILE) ? read(abs(FIT_FILE)) : '')), groups = new Map();
  for (const r of rows) {
    if (!fitDecision(r.decision) || !r.reason || FIT_GENERATED.test(r.reason)) continue;
    const w = r.reason.toLowerCase().split(String(r.item).toLowerCase()).join(' § ').replace(/[^a-z0-9§\s]/g, ' ').split(/\s+/).filter(Boolean);
    if (w.length < 6) continue;
    const k = w.slice(-6).join(' ');
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ r, w });
  }
  const notes = [];
  for (const g of groups.values()) {
    if (g.length < 5) continue;
    let n = 6; while (g.every(x => x.w.length > n) && g.every(x => x.w[x.w.length - 1 - n] === g[0].w[g[0].w.length - 1 - n])) n++;
    const share = g.map(x => n / x.w.length).sort((a, b) => a - b)[g.length >> 1];
    if (share < 0.5) continue;
    notes.push(`${g.length} reasons end with the same ${n} words ("...${g[0].w.slice(-n).join(' ')}"): ${g.slice(0, 4).map(x => x.r.item).join(', ')}${g.length > 4 ? ', ...' : ''}. ` +
      'A short reason that names the item is enough ("Not a game: a terminal photo renamer."): drop the shared tail, or say what is particular to each item');
  }
  return notes;
}

// The skills whose triggers the request names, as [{ pb, hits }]: every key word of a trigger is in the request, and a
// trigger of several words has them close together (the old engine's router passes itself instead, for its own extra
// rules; engine v2 uses this)
export function triggerMatch(text, items) {
  const seq = keyWords(text), words = new Set(seq);
  const near = k => { const at = k.map(w => seq.indexOf(w)); return at.every(i => i >= 0) && Math.max(...at) - Math.min(...at) <= k.length + 1; };
  return items.map(pb => ({ pb, hits: pb.triggers.filter(t => { const k = keyWords(t); return k.length && (k.length === 1 ? words.has(k[0]) : k.every(w => words.has(w)) && near(k)); }) })).filter(x => x.hits.length);
}
// Library skills the fit checklist left for later or skipped, whose own triggers the request matches.
export function fitDueByRequest(text, cfg = config(), match = triggerMatch) {
  if (!exists(FIT_FILE)) return [];
  const rows = fitRows().filter(r => r.kind === 'skill' && ['later', 'skip'].includes(fitDecision(r.decision)) && !exists(`${cfg.skillsDir}/${r.item}/SKILL.md`));
  if (!rows.length) return [];
  const lib = findLibrary();
  if (!lib) return [];
  const items = rows.map(r => {
    const fm = frontmatter(read(path.join(lib.dir, 'skills', r.item, 'SKILL.md'))) || {};
    return { name: r.item, fm, triggers: splitList(fm.triggers), triggerRe: null, row: r };
  }).filter(x => x.triggers.length);
  // (a "later - when: <condition>" row waits for that condition: one trigger alone needs a word of the condition too; two
  // or more triggers are the skill's job plainly. Lesson, a field report: "explain how to use the pivot table" matched the
  // teach skill's one trigger "explain how", and its row waited for "the user asks to learn the tax rules step by step")
  const want = new Set(keyWords(text));
  const meets = (r, hits) => { const m = /\bwhen\s*:\s*([^)|]*)/i.exec(r.decision || ''); if (!m || hits.length >= 2) return true;
    const cond = keyWords(m[1]).filter(w => w.length > 3 && !GENERIC.has(w) && !/^(user|users|ask|asks|asked|want|wants|first|need|needs|time)$/.test(w));
    return !cond.length || cond.some(w => want.has(w)); };
  return match(text, items).filter(({ pb, hits }) => meets(pb.row, hits)).map(({ pb, hits }) => ({ item: pb.name, hits, decision: pb.row.decision.slice(0, 120) }));
}
// What the user asks to pass on to someone else is that one message's content, not a standing rule or requirement here.
