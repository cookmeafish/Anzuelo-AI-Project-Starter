// Engine v2: shared pieces for the start reminder and the end check. A runbook's "Done when" list is the turn's
// requirements: the start hook shows it, the end hook checks the items it can check against this session's own
// transcript (never the git state of a shared folder). Plan: docs/plans/2026-11-05-engine-v2.md.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const ROOT = process.env.ANZUELO_ROOT || process.cwd();
const RUNBOOK_DIRS = ['docs/playbooks', 'tools/starter/runbooks'];
// (Windows line endings read as plain ones: a runbook saved with CRLF had no header the router could see. Lesson
// (replay): most of a project's runbooks were invisible to routing)
const read = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n?/g, '\n'); } catch { return ''; } };

// "## Done when" items. A checkable item ends with one of:
//   (file: <path or glob>)   the turn changed that file (Edit, Write, or a command that names it as its output)
//   (ran: <regex>)           the turn ran a command matching it, and the run did not fail
//   (answer: <regex>)        the turn's final answer matches it
// Anything else is shown at the start and not checked at the end.
export function doneWhen(text) {
  const m = /^##\s+Done when\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im.exec(String(text));
  if (!m) return [];
  // (an item wraps onto indented lines: they belong to it)
  const items = [];
  for (const l of m[1].split('\n')) {
    const start = /^\s*(?:\d+\.|[-*])\s+(?:\[[ x]\]\s*)?(.+)$/.exec(l)?.[1];
    if (start) items.push(start.trim());
    else if (items.length && /^\s+\S/.test(l)) items[items.length - 1] += ' ' + l.trim();
  }
  return items.map((raw, i) => {
    const c = /\((file|ran|answer):\s*([^)]+)\)\s*\.?\s*$/i.exec(raw);
    const text = raw.replace(/\s*\((?:file|ran|answer|hook|judgment):[^)]*\)\s*\.?\s*$/i, '').replace(/`/g, '').trim();
    return { n: i + 1, text, kind: c ? c[1].toLowerCase() : null, arg: c ? c[2].trim() : null };
  });
}

export function runbooks() {
  const out = [];
  for (const d of RUNBOOK_DIRS) {
    let names = []; try { names = fs.readdirSync(path.join(ROOT, d)); } catch { continue; }
    for (const f of names.filter(f => f.endsWith('.md') && !f.startsWith('_'))) {
      const file = `${d}/${f}`, text = read(file), fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] || '';
      const triggers = (/^triggers:\s*(.+)$/m.exec(fm)?.[1] || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 2);
      const menu = (/^menu:\s*(.+)$/m.exec(fm)?.[1] || '').split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]\d{1,2}$/.test(s));
      out.push({ name: f.replace(/\.md$/, ''), file, triggers, menu, items: doneWhen(text) });
    }
  }
  return out;
}

// The runbook whose trigger phrase matches the request best: the longest whole-phrase match wins.
export function route(prompt, books = runbooks()) {
  // (a menu code at the start, "B4 <args>", names its runbook outright)
  const code = /^\s*([A-Za-z]\d{1,2})(?=\s|$)/.exec(String(prompt))?.[1]?.toUpperCase();
  const byCode = code && books.find(b => b.menu.includes(code));
  if (byCode) return { ...byCode, matched: code };
  const p = ` ${String(prompt).toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ')} `;
  let best = null;
  for (const b of books) for (const t of b.triggers) {
    const phrase = t.replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
    if (phrase && p.includes(` ${phrase} `) && (!best || phrase.length > best.len)) best = { book: b, len: phrase.length, phrase };
  }
  return best && { ...best.book, matched: best.phrase };
}

// A message the user typed: not a notice, a relayed message, or the summary that resumes a session.
export const typed = r => r.type === 'user' && !r.isMeta && !r.isCompactSummary && typeof r.message?.content === 'string'
  && !/^\s*<(task-notification|system-reminder|cross-session-message|agent-message|command-|local-command-)|^This session is being continued from a previous conversation/.test(r.message.content);
// This turn's rows from a transcript: everything after the last message the user typed.
export function turnRows(transcript) {
  let rows = [];
  try { rows = fs.readFileSync(transcript, 'utf8').split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { return []; }
  let start = 0;
  rows.forEach((r, i) => { if (typed(r)) start = i; });
  return rows.slice(start);
}

// What the turn did: tool calls with their results, and the last text the agent wrote.
export function turnActs(rows) {
  const calls = [], byId = new Map();
  let answer = '';
  for (const r of rows) {
    const c = r.message?.content;
    if (!Array.isArray(c)) continue;
    for (const x of c) {
      if (r.type === 'assistant' && x.type === 'tool_use') { const call = { name: x.name, input: x.input || {}, error: false, out: '', done: 0 }; calls.push(call); byId.set(x.id, call); }
      if (x.type === 'tool_result' && byId.has(x.tool_use_id)) {
        const out = typeof x.content === 'string' ? x.content : Array.isArray(x.content) ? x.content.map(b => b?.text || '').join('\n') : '';
        Object.assign(byId.get(x.tool_use_id), { out: out.slice(-4000), error: !!x.is_error || /\bexit code [1-9]|^Exit code [1-9]/m.test(out), done: Date.parse(r.timestamp || '') || 0 });
      }
      if (r.type === 'assistant' && x.type === 'text' && x.text.trim()) answer = x.text;
    }
  }
  return { calls, answer };
}

// The files a path or glob names: walked from its fixed part, skipping .git and node_modules, at most 2,000.
function filesMatching(glob) {
  const g = glob.replace(/\\/g, '/'), rx = globRx(g), base = g.split('/').filter((s, i, a) => !/[*?]/.test(a.slice(0, i + 1).join('/'))).join('/');
  if (!/[*?]/.test(g)) return fs.existsSync(path.join(ROOT, g)) ? [g] : [];
  const out = [], walk = d => { if (out.length > 2000) return; let es = []; try { es = fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }); } catch { return; }
    for (const e of es) { if (e.name === '.git' || e.name === 'node_modules') continue; const p = d ? `${d}/${e.name}` : e.name; if (e.isDirectory()) walk(p); else if (rx.test(p)) out.push(p); } };
  walk(base);
  return out;
}
const globRx = g => new RegExp('^' + g.replace(/\\/g, '/').replace(/[.+^${}()|[\]]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$', 'i');
const relp = p => path.relative(ROOT, path.resolve(ROOT, String(p))).replace(/\\/g, '/');

// Whether a checkable item was met by what the turn did. Null means it can't be checked here.
export function met(item, acts) {
  if (!item.kind) return null;
  if (item.kind === 'answer') return new RegExp(item.arg, 'i').test(acts.answer);
  if (item.kind === 'ran') { const rx = new RegExp(item.arg, 'i'); return acts.calls.some(c => /^(Bash|PowerShell)$/.test(c.name) && rx.test(String(c.input.command || '')) && !c.error); }
  // (a file changed in this turn: edited by a tool, or written since the turn began by anything, a script included.
  // A command that only names the file does not count. Lesson (review): "cat docs/CHANGELOG.md" met "CHANGELOG updated")
  if (item.kind === 'file') {
    const rx = globRx(item.arg), since = Date.parse(acts.at || '') || 0;
    return acts.calls.some(c => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name) && rx.test(relp(c.input.file_path || c.input.notebook_path || '')))
      || (!!since && filesMatching(item.arg).some(f => { try { return fs.statSync(path.join(ROOT, f)).mtimeMs > since; } catch { return false; } }));
  }
  return null;
}

// A test run: the usual runners, or the project's own test script under any name it is called by (npm test runs
// package.json's "test", so either form counts). Lesson (trial v31): the tests passed through npm test and the check
// still asked three times for its mapped command.
const RUNNERS = /\btest_\w+\.py\b|\b\w+_test\.(py|go)\b|\.test\.(m?js|ts)\b|\b(npm (run )?test|pnpm (run )?test|yarn test|pytest|python -m (pytest|unittest)|go test|cargo test|dotnet test|node --test|vitest|jest|mvn test|gradle test|phpunit|rspec|bundle exec rake test)\b/i;
const testScript = () => { let s = ''; try { s = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).scripts?.test || ''; } catch { } return /no test specified/.test(s) ? '' : s.trim(); };
// (a run whose output shows a passing test summary is a test run, whatever the command is called: a project's own
// self-test, a check script. Lesson (replay): answers that truly reported "1655 passed" from a project's self-test
// were flagged, because the command was not a known runner)
const PASS_OUT = /\b\d+ (tests? )?passed\b|\bALL PASS\b|\bRESULT:\s*PASS\b|\b0 (failed|failures)\b|\bRan \d+ tests?\b[\s\S]{0,200}\bOK\b|\b\d+ passing\b|\btests? passed\b/i;
const FAIL_OUT = /\b[1-9]\d* (tests? )?(failed|failing)\b|\bFAILED\b|\bnot ok\b/;
export const passedRun = c => /^(Bash|PowerShell)$/.test(c.name) && !c.error && (isTestRun(String(c.input.command || '')) || PASS_OUT.test(c.out || '')) && !FAIL_OUT.test(c.out || '');
// (the project's own declared test and build commands, tools/hooks/config.json "test" and "build", count part by part.
// Lesson (replay): a project's tests were a plain script run with node, which no runner name matched)
const declared = () => { try { const c = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/hooks/config.json'), 'utf8')); return [c.test, c.build].filter(s => typeof s === 'string').flatMap(s => s.split(/\s*&&\s*/)).map(s => s.trim()).filter(Boolean); } catch { return []; } };
export function isTestRun(cmd) {
  if (RUNNERS.test(cmd)) return true;
  const script = testScript();
  return (!!script && String(cmd).includes(script)) || declared().some(d => String(cmd).includes(d));
}
const CODE = /\.(js|mjs|cjs|ts|tsx|jsx|py|go|rs|java|kt|cs|rb|php|swift|c|cc|cpp|h|vue|svelte)$/i;
// Files changed in the turn: edited by a tool, or (in a live turn) written since it began by anything, a helper or a
// script included. Lesson (replay): edits made by helpers were invisible, and their code went untested.
const changedSince = (since, rx) => since ? filesMatching('**/*').filter(f => rx.test(f) && !/^(\.cache|tools\/hooks\/state)\//.test(f) && (() => { try { return fs.statSync(path.join(ROOT, f)).mtimeMs > since; } catch { return false; } })()) : [];
const mtime = f => { try { return fs.statSync(path.join(ROOT, f)).mtimeMs; } catch { return 0; } };
// The project's own declared checks: tools/hooks/config.json "commitGate" entries, a command (a regex) and the files it
// covers. A change to those files asks for that command to pass afterwards.
const gates = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/hooks/config.json'), 'utf8')).commitGate || []; } catch { return []; } };
export function gateGaps(acts) {
  const out = [], since = Date.parse(acts.at || '') || 0;
  for (const g of gates()) {
    const when = [].concat(g.when || []).map(globRx), hit = p => when.some(rx => rx.test(p));
    const edits = acts.calls.map((c, k) => [c, k]).filter(([c]) => /^(Edit|Write|MultiEdit)$/.test(c.name) && hit(relp(c.input.file_path || '')));
    const files = changedSince(since, { test: hit });
    if (!edits.length && !files.length) continue;
    const lastEdit = Math.max(-1, ...edits.map(([, k]) => k)), lastWrite = Math.max(0, ...files.map(mtime));
    // (a chained command counts part by part: the agent may run its steps one at a time)
    for (const part of String(g.cmd || '').split(/\s*&&\s*/).filter(Boolean)) {
      let rx; try { rx = new RegExp(part, 'i'); } catch { continue; }
      const ok = acts.calls.some((c, k) => /^(Bash|PowerShell)$/.test(c.name) && !c.error && rx.test(String(c.input.command || '')) && k > lastEdit && (!lastWrite || c.done > lastWrite));
      if (!ok) out.push(`Run the project's check \`${part.replace(/\\(.)/g, '$1')}\` after the change, and say the result.`);
    }
  }
  return out;
}
// Check 2: code changed after the last passing test run, or the answer says tests passed and none did this turn.
export function testGaps(acts) {
  const out = [], i = acts.calls.map((c, k) => [c, k]);
  // (the project's code: not a scratch script in .cache or outside the project. Lesson (replay): helper scripts the
  // agent wrote in .cache asked for the project's tests)
  const own = p => { const r = relp(p); return CODE.test(r) && !/^(\.\.|\.cache\/|[a-z]:)/i.test(r); };
  const lastCode = Math.max(-1, ...i.filter(([c]) => /^(Edit|Write|MultiEdit)$/.test(c.name) && own(c.input.file_path || '')).map(([, k]) => k));
  const passes = i.filter(([c]) => passedRun(c)).map(([, k]) => k);
  const codeWrite = Math.max(0, ...changedSince(Date.parse(acts.at || '') || 0, CODE).map(mtime));
  const anyRunner = i.some(([c]) => /^(Bash|PowerShell)$/.test(c.name) && isTestRun(String(c.input.command || '')));
  // (a project has tests when a runner was seen this turn or a test setup exists, not just a build file. Lesson
  // (review): pyproject.toml and go.mod are in many projects with no tests at all)
  const has = f => fs.existsSync(path.join(ROOT, f)), pyproject = (() => { try { return fs.readFileSync(path.join(ROOT, 'pyproject.toml'), 'utf8'); } catch { return ''; } })();
  const hasTests = anyRunner || !!testScript() || declared().length > 0 || ['pytest.ini', 'conftest.py', 'tests', 'test', '__tests__', 'spec'].some(has)
    || /\[tool\.pytest/.test(pyproject) || ['**/*_test.go', '**/test_*.py', '**/*_test.py', '**/*.test.js', '**/*.test.mjs', '**/*.test.ts'].some(g => filesMatching(g).length > 0);
  if ((lastCode >= 0 || codeWrite) && hasTests && !passes.some(k => k > lastCode && (!codeWrite || acts.calls[k].done > codeWrite))) out.push('Run the tests after the last code change, and say the result.');
  else if (/\b(all )?tests? (now )?pass(ed|es|ing)?\b|\b\d+ (tests? )?passed\b/i.test(acts.answer) && !passes.length) out.push('The answer says tests passed, but no test run passed in this turn: run them, or correct the answer.');
  return out;
}

// Check 3: a screen changed, and no screenshot taken after the change was looked at. Only in a project that can take
// them (tools/screenshot.mjs). Replay: the old engine's screenshot ask found a real problem in 7 of 13 runs.
const SCREEN = /\.(html?|css|scss|jsx|tsx|vue|svelte|xaml|qml)$|(^|\/)(gui|ui|templates|components)\//i;
// (tests and their fixtures in a gui folder show nothing on screen. Lesson (replay): edits to a gui folder's tests asked
// for screenshots)
const NOT_SCREEN = /^(\.cache|docs|skills|packs|library|node_modules|dist|build|tools\/hooks)\/|\.md$|(^|\/)(tests?|fixtures|__tests__)\/|(^|\/)test_[^/]*$|[._-]test\.\w+$/i;
export function screenGaps(acts) {
  if (!fs.existsSync(path.join(ROOT, 'tools/screenshot.mjs'))) return [];
  const screen = p => { const r = relp(p); return SCREEN.test(r) && !NOT_SCREEN.test(r) && !/^(\.\.|[a-z]:)/i.test(r); };
  const i = acts.calls.map((c, k) => [c, k]);
  const lastEdit = Math.max(-1, ...i.filter(([c]) => /^(Edit|Write|MultiEdit)$/.test(c.name) && screen(c.input.file_path || '')).map(([, k]) => k));
  const lastWrite = Math.max(0, ...changedSince(Date.parse(acts.at || '') || 0, { test: screen }).map(mtime));
  if (lastEdit < 0 && !lastWrite) return [];
  const shot = i.find(([c, k]) => k > lastEdit && /^(Bash|PowerShell)$/.test(c.name) && !c.error && /screenshot/i.test(String(c.input.command || '')) && (!lastWrite || c.done > lastWrite));
  const looked = shot && i.some(([c, k]) => k > shot[1] && c.name === 'Read' && /\.(png|jpe?g|webp)$/i.test(String(c.input.file_path || '')));
  return looked ? [] : ['A screen changed: take screenshots after the last change (node tools/screenshot.mjs) and look at them.'];
}

// Check 4: the project's structure changed (rules, runbooks, checks, skills, hook settings) and no passing health
// check (tools/audit.mjs) ran after it. The end check runs it itself and asks only when it fails. Replay: the old
// engine's ask found a real problem in 5 of 8 runs.
const STRUCTURE = /^(CLAUDE\.md|AGENTS\.md|docs\/MENU\.md|docs\/playbooks\/|docs\/checks\/|skills\/|tools\/hooks\/(requirements|config)\.json$)/;
export function healthGaps(acts, { run = true } = {}) {
  if (!fs.existsSync(path.join(ROOT, 'tools/audit.mjs'))) return [];
  const own = p => STRUCTURE.test(relp(p));
  const i = acts.calls.map((c, k) => [c, k]);
  const lastEdit = Math.max(-1, ...i.filter(([c]) => /^(Edit|Write|MultiEdit)$/.test(c.name) && own(c.input.file_path || '')).map(([, k]) => k));
  const lastWrite = Math.max(0, ...changedSince(Date.parse(acts.at || '') || 0, { test: own }).map(mtime));
  if (lastEdit < 0 && !lastWrite) return [];
  if (i.some(([c, k]) => k > lastEdit && /^(Bash|PowerShell)$/.test(c.name) && !c.error && /audit\.mjs/.test(String(c.input.command || '')) && /audit: PASS/.test(c.out || '') && (!lastWrite || c.done > lastWrite))) return [];
  if (!run) return ['(the health check would run here)'];
  const r = spawnSync(process.execPath, ['tools/audit.mjs'], { cwd: ROOT, encoding: 'utf8', timeout: 90_000 });
  if (r.status === 0 || r.error) return [];
  // (a failure already reported on an earlier turn is not this turn's: it is asked about once, not on every turn after.
  // Lesson: a sweep waiting on the user's decision failed in every structural turn)
  const fails = String(r.stdout || '').split('\n').filter(l => /^FAIL/.test(l)).map(l => l.replace(/^FAIL\s+/, '').replace(/\s*\(.*$/, '').trim());
  const known = new Set(loadTurn('health').fails || []), fresh = fails.filter(f => !known.has(f));
  saveTurn('health', { fails });
  if (fails.length && !fresh.length) return [];
  return [`The project's health check (node tools/audit.mjs) fails after this change: ${fresh.slice(0, 3).join('; ') || 'see its output'}. Fix it and run it again.`];
}

// Whether the turn opened the runbook (read it, or ran its skill).
export const opened = (book, acts) => acts.calls.some(c => (c.name === 'Read' && relp(c.input.file_path || '') === book.file)
  || (c.name === 'Skill' && String(c.input.skill || '').replace(/^.*:/, '') === book.name)
  || (/^(Bash|PowerShell)$/.test(c.name) && String(c.input.command || '').includes(book.file)));

// Whether the turn did any work: a file changed, or a command that is not only a read.
export const worked = acts => acts.calls.some(c => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name));

const STATE = () => path.join(ROOT, 'tools', 'hooks', 'state');
const stateFile = sid => path.join(STATE(), `v2-turn.${String(sid || 'x').replace(/[^\w-]/g, '').slice(0, 64)}.json`);
export const saveTurn = (sid, v) => { try { fs.mkdirSync(STATE(), { recursive: true }); fs.writeFileSync(stateFile(sid), JSON.stringify(v)); } catch { } };
export const loadTurn = sid => { try { return JSON.parse(fs.readFileSync(stateFile(sid), 'utf8')); } catch { return {}; } };
