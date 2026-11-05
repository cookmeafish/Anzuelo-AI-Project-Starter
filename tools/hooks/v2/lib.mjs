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
    // (every marker goes from the shown text: an item may carry the old engine's "(hook: ...)" or "(judgment: ...)"
    // before v2's own)
    const text = raw.replace(/\s*\((?:file|ran|answer|hooks?|judgment):[^)]*\)/gi, '').replace(/\s*\.\s*$/, '').replace(/`/g, '').trim();
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
// A transcript's last part, from a line start, at most `max` bytes. Lesson (the old engine): a 568 MB transcript was
// over the largest string a file can be read into, and every hook lost the session's history.
export function tail(transcript, max = 32 << 20) {
  try {
    const size = fs.statSync(String(transcript)).size, win = Math.min(size, max), b = Buffer.alloc(win), fd = fs.openSync(String(transcript), 'r');
    try { fs.readSync(fd, b, 0, win, size - win); } finally { fs.closeSync(fd); }
    const t = b.toString('utf8');
    return win < size ? t.slice(t.indexOf('\n') + 1) : t;
  } catch { return ''; }
}

// Codex writes rollout lines ({ type: "response_item", payload: message | function_call | ..._output }). They become
// the same rows as Claude Code's: a typed message, tool calls with results, and each file an apply_patch touched as an
// Edit of it with the patch's added lines. Lesson (the old engine): under Codex no tool call was seen at all.
const CODEX_SKIP = /^\s*(<environment_context>|<user_instructions>|<permissions instructions>|# AGENTS\.md instructions)/;
export function codexRows(rows) {
  if (!rows.some(r => r?.payload && /^(response_item|session_meta|turn_context|event_msg)$/.test(r.type))) return rows;
  const out = [], shell = a => { const c = a?.command ?? a?.cmd ?? a?.action?.command; return Array.isArray(c) ? (/^(ba|z)?sh$|powershell|pwsh|cmd$/i.test(c[0] || '') && c.length >= 3 ? c[c.length - 1] : c.join(' ')) : String(c ?? ''); };
  for (const r of rows) {
    const p = r?.payload, timestamp = r?.timestamp;
    if (r?.type !== 'response_item' || !p) continue;
    if (p.type === 'message') {
      const text = (Array.isArray(p.content) ? p.content : []).map(c => c?.text || '').join('\n');
      if (p.role === 'user' && !CODEX_SKIP.test(text)) out.push({ type: 'user', timestamp, message: { content: text } });
      else if (p.role === 'assistant') out.push({ type: 'assistant', timestamp, message: { content: [{ type: 'text', text }] } });
    } else if (/^(function_call|custom_tool_call|local_shell_call)$/.test(p.type)) {
      let args = p.arguments ?? p.input ?? p.action ?? {};
      if (typeof args === 'string') { try { args = JSON.parse(args); } catch { args = { command: args }; } }
      const name = String(p.name || (p.type === 'local_shell_call' ? 'shell' : '')), id = p.call_id || p.id;
      // (newer Codex: one "exec" call whose code runs tools.exec_command({cmd: "..."}) and tools.apply_patch(...): its
      // commands are one shell call, and each patched file an edit. Lesson (real sessions): 51 of them, none read)
      if (name === 'exec' && typeof p.input === 'string') {
        const cmds = [...p.input.matchAll(/\bcmd\s*:\s*("(?:[^"\\]|\\.)*")/g)].map(m => { try { return JSON.parse(m[1]); } catch { return m[1]; } });
        if (cmds.length) out.push({ type: 'assistant', timestamp, message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command: cmds.join('\n') } }] } });
        for (const patch of p.input.match(/\*\*\* Begin Patch[\s\S]*?\*\*\* End Patch/g) || []) codexRows.patch(out, timestamp, `${id}:p`, patch.replace(/\\n/g, '\n'));
        continue;
      }
      const cmd = name === 'apply_patch' && typeof p.input === 'string' ? p.input : shell(args);
      if (name === 'apply_patch' || /^\s*apply_patch\b/.test(cmd)) codexRows.patch(out, timestamp, id, cmd);
      else out.push({ type: 'assistant', timestamp, message: { content: [{ type: 'tool_use', id, ...(/^(shell|exec_command|container\.exec|local_shell|shell_command)$/.test(name) ? { name: 'Bash', input: { command: cmd } } : { name, input: args }) }] } });
    } else if (/^(function_call_output|custom_tool_call_output|local_shell_call_output)$/.test(p.type)) {
      let o = p.output, err = false;
      if (typeof o === 'string') { try { const j = JSON.parse(o); if (j && typeof j === 'object' && 'output' in j) { err = Number(j.metadata?.exit_code) > 0; o = j.output; } } catch { } }
      else if (o && typeof o === 'object') { err = Number(o.metadata?.exit_code ?? o.exit_code) > 0; o = o.output ?? o.content ?? JSON.stringify(o); }
      out.push({ type: 'user', timestamp, message: { content: [{ type: 'tool_result', tool_use_id: p.call_id || p.id, content: String(o ?? ''), ...(err ? { is_error: true } : {}) }] } });
    }
  }
  return out;
}
// (a patch: one Edit per file it adds or updates, with the lines it adds)
codexRows.patch = (out, timestamp, id, patch) => {
  for (const [, f, body] of String(patch).matchAll(/^\*\*\* (?:Add|Update) File: (.+)\n([\s\S]*?)(?=^\*\*\* |(?![\s\S]))/gm))
    out.push({ type: 'assistant', timestamp, message: { content: [{ type: 'tool_use', id: `${id}:${f}`, name: 'Edit', input: { file_path: f.trim(), new_string: body.split('\n').filter(l => l.startsWith('+')).map(l => l.slice(1)).join('\n') } }] } });
};

// This turn's rows from a transcript (Claude Code or Codex): everything after the last message the user typed.
export function turnRows(transcript) {
  const rows = codexRows(tail(transcript).split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
  let start = 0;
  rows.forEach((r, i) => { if (typed(r)) start = i; });
  return rows.slice(start);
}

// Background shell runs this session started that have not finished: a launch whose result says it runs in the
// background, until a task notice names its id or a stop names it. No command text is matched. Lesson (the old engine):
// a notice set off by words in a command fired on a grep of a test's output file and on quoted text.
export function backgroundRuns(rows) {
  const runs = new Map(), done = new Set();
  for (const r of rows) {
    for (const x of Array.isArray(r.message?.content) ? r.message.content : []) {
      if (x?.type !== 'tool_result') continue;
      const out = typeof x.content === 'string' ? x.content : (Array.isArray(x.content) ? x.content.map(c => c?.text || '').join('\n') : '');
      // (the host's own line only, at the start of the result: a command's output may quote it. Lesson: a grep that
      // printed the line counted as a run still going)
      const m = /^\s*Command (?:running in background with ID:|[^\n]*?moved to the background \(ID:?)\s*([\w-]+)/i.exec(out);
      if (m) runs.set(m[1], x.tool_use_id);
    }
    const s = JSON.stringify(r);
    for (const m of s.matchAll(/<task-id>([\w-]+)<\/task-id>|stopped task:?\s*([\w-]+)/gi)) done.add(m[1] || m[2]);
  }
  const cmds = new Map();
  for (const r of rows) for (const x of Array.isArray(r.message?.content) ? r.message.content : []) if (x?.type === 'tool_use') cmds.set(x.id, String(x.input?.command || x.input?.description || ''));
  return [...runs].filter(([id]) => !done.has(id)).map(([id, use]) => ({ id, cmd: cmds.get(use) || '' }));
}
export const backgroundRunsOf = transcript => backgroundRuns(codexRows(tail(transcript).split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)));

// What the turn did: tool calls with their results, and the last text the agent wrote.
export function turnActs(rows) {
  const calls = [], byId = new Map();
  let answer = '', context = '', started = '';
  for (const r of rows) {
    started ||= r.timestamp || '';
    // (what the hooks and the host showed the agent this turn: evidence too, like a version a status line named)
    if (r.attachment) context += JSON.stringify(r.attachment.content ?? r.attachment).slice(0, 20000) + '\n';
    if (r.type === 'user' && typeof r.message?.content === 'string') context += r.message.content.slice(0, 20000) + '\n';
    const c = r.message?.content;
    if (!Array.isArray(c)) continue;
    for (const x of c) {
      if (r.type === 'assistant' && x.type === 'tool_use') { const call = { name: x.name, input: x.input || {}, error: false, out: '', done: 0, at: Date.parse(r.timestamp || '') || 0 }; calls.push(call); byId.set(x.id, call); }
      if (x.type === 'tool_result' && byId.has(x.tool_use_id)) {
        const out = typeof x.content === 'string' ? x.content : Array.isArray(x.content) ? x.content.map(b => b?.text || '').join('\n') : '';
        Object.assign(byId.get(x.tool_use_id), { out: out.slice(-4000), error: !!x.is_error || /\bexit code [1-9]|^Exit code [1-9]/m.test(out), done: Date.parse(r.timestamp || '') || 0 });
      }
      if (r.type === 'assistant' && x.type === 'text' && x.text.trim()) answer = x.text;
    }
  }
  return { calls, answer, context, started };
}

// The files a path or glob names: walked from its fixed part, at most 20,000. Bulk folders below it are skipped
// (.git, node_modules, .cache, virtual environments, build output). Lesson: one project held 40,000 files in .cache, and
// a 2,000-file cap hid every change outside it.
const BULK = new Set(['.git', 'node_modules', '.cache', '.venv', 'venv', '__pycache__', 'dist', 'build', '.next', 'target']);
function filesMatching(glob) {
  const g = glob.replace(/\\/g, '/'), rx = globRx(g), base = g.split('/').filter((s, i, a) => !/[*?]/.test(a.slice(0, i + 1).join('/'))).join('/');
  if (!/[*?]/.test(g)) return fs.existsSync(path.join(ROOT, g)) ? [g] : [];
  const out = [], walk = d => { if (out.length > 20000) return; let es = []; try { es = fs.readdirSync(path.join(ROOT, d), { withFileTypes: true }); } catch { return; }
    for (const e of es) { if (e.isDirectory() && BULK.has(e.name)) continue; const p = d ? `${d}/${e.name}` : e.name; if (e.isDirectory()) walk(p); else if (rx.test(p)) out.push(p); } };
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
// (the tree is walked once per turn checked, whatever number of checks ask)
const walked = new WeakMap();
// (only while one of the turn's own commands or helpers ran: a file another session changed meanwhile is not this
// turn's. A run in the background counts until the turn ends. Lesson (the old engine): a peer session's edits in the
// same folder were blamed on the turn. Calls with no times, as in hand-made transcripts, keep the whole turn.)
const RUNNER = /^(Bash|PowerShell|Agent|Task)$/, BG = /^\s*(Command running in background|Command[^\n]*moved to the background|Async agent launched)/i;
const ranAt = (acts, t) => {
  const runs = acts.calls.filter(c => RUNNER.test(c.name));
  if (runs.some(c => !c.at)) return true;
  return runs.some(c => t >= c.at - 2000 && t <= (BG.test(c.out) || !c.done ? Infinity : c.done + 2000));
};
const changedSince = (acts, rx) => { const since = Date.parse(acts.at || '') || 0; if (!since) return []; if (!walked.has(acts)) walked.set(acts, filesMatching('**/*')); return walked.get(acts).filter(f => rx.test(f) && !/^(\.cache|tools\/hooks\/state)\//.test(f) && (() => { try { const t = fs.statSync(path.join(ROOT, f)).mtimeMs; return t > since && ranAt(acts, t); } catch { return false; } })()); };
const mtime = f => { try { return fs.statSync(path.join(ROOT, f)).mtimeMs; } catch { return 0; } };
// The project's own declared checks: tools/hooks/config.json "commitGate" entries, a command (a regex) and the files it
// covers. A change to those files asks for that command to pass afterwards.
const gates = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/hooks/config.json'), 'utf8')).commitGate || []; } catch { return []; } };
export function gateGaps(acts) {
  const out = [], since = Date.parse(acts.at || '') || 0;
  for (const g of gates()) {
    const when = [].concat(g.when || []).map(globRx), hit = p => when.some(rx => rx.test(p));
    const edits = acts.calls.map((c, k) => [c, k]).filter(([c]) => /^(Edit|Write|MultiEdit)$/.test(c.name) && hit(relp(c.input.file_path || '')));
    const files = changedSince(acts, { test: hit });
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
  const codeWrite = Math.max(0, ...changedSince(acts, CODE).map(mtime));
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
  const lastWrite = Math.max(0, ...changedSince(acts, { test: screen }).map(mtime));
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
  const lastWrite = Math.max(0, ...changedSince(acts, { test: own }).map(mtime));
  if (lastEdit < 0 && !lastWrite) return [];
  if (i.some(([c, k]) => k > lastEdit && /^(Bash|PowerShell)$/.test(c.name) && !c.error && /audit\.mjs/.test(String(c.input.command || '')) && /audit: PASS/.test(c.out || '') && (!lastWrite || c.done > lastWrite))) return [];
  if (!run) return ['(the health check would run here)'];
  // (a hard limit: a slow audit never holds the end of a turn. Its time is kept, to see what it costs)
  const t0 = Date.now(), r = spawnSync(process.execPath, ['tools/audit.mjs'], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  const ms = Date.now() - t0;
  if (r.status === 0 || r.error) { saveTurn('health', { ...loadTurn('health'), ms }); return []; }
  // (a failure already reported on an earlier turn is not this turn's: it is asked about once, not on every turn after.
  // Lesson: a sweep waiting on the user's decision failed in every structural turn)
  const fails = String(r.stdout || '').split('\n').filter(l => /^FAIL/.test(l)).map(l => l.replace(/^FAIL\s+/, '').replace(/\s*\(.*$/, '').trim());
  const known = new Set(loadTurn('health').fails || []), fresh = fails.filter(f => !known.has(f));
  saveTurn('health', { fails, ms });
  if (fails.length && !fresh.length) return [];
  return [`The project's health check (node tools/audit.mjs) fails after this change: ${fresh.slice(0, 3).join('; ') || 'see its output'}. Fix it and run it again.`];
}

// Check 5: new facts written into the knowledge base name where they came from. The outcome, not the process: each
// knowledge edit's new text carries a source (a link, a project file, "source:", a footnote, "the user said"), or a
// sources list edited in the same turn does. Replay: the old engine's ask found a real problem in 4 of 7 runs.
const knowledgeDirs = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/hooks/config.json'), 'utf8')).knowledgeDirs || ['docs/knowledge']; } catch { return ['docs/knowledge']; } };
const SOURCED = /https?:\/\/|\bsources?\s*:|\[\^[^\]]+\]|\b(the )?user (said|told|gave|wrote)\b|\bobserved\b|\(from [\w./-]+\)|\b[\w-]+\/[\w./-]+\.(md|txt|csv|json|pdf)\b/i;
export function knowledgeGaps(acts) {
  const dirs = knowledgeDirs().map(d => d.replace(/\/+$/, '') + '/');
  const isK = r => dirs.some(d => r.startsWith(d)) && !/(^|\/)(README|SOURCES|INDEX)\.md$/i.test(r);
  const sourcesEdited = acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && /(^|\/)SOURCES\.md$/i.test(relp(c.input.file_path || '')));
  const sourcesWritten = changedSince(acts, { test: r => /(^|\/)SOURCES\.md$/i.test(r) }).length > 0;
  const bare = [...new Set(acts.calls.filter(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && isK(relp(c.input.file_path || '')))
    .filter(c => { const t = String(c.input.new_string ?? c.input.content ?? (c.input.edits || []).map(e => e.new_string).join('\n')); return t.trim().length > 80 && !SOURCED.test(t); })
    .map(c => relp(c.input.file_path)))];
  // (in a live turn, a knowledge file a script wrote: its lines added since the last commit. Lesson (replay): facts
  // merged into the knowledge base by a script were never seen)
  const edited = new Set(acts.calls.filter(c => /^(Edit|Write|MultiEdit)$/.test(c.name)).map(c => relp(c.input.file_path || '')));
  for (const f of changedSince(acts, { test: isK }).filter(f => !edited.has(f) && f.endsWith('.md'))) {
    const d = spawnSync('git', ['diff', '-U0', '--', f], { cwd: ROOT, encoding: 'utf8', timeout: 5000 }).stdout || '';
    const added = d.split('\n').filter(l => /^\+(?!\+\+)/.test(l)).map(l => l.slice(1)).join('\n');
    if (added.trim().length > 80 && !SOURCED.test(added)) bare.push(f);
  }
  return bare.length && !sourcesEdited && !sourcesWritten ? [`New facts in ${bare.slice(0, 3).join(', ')} name no source: add where each came from (a link read this turn, a project file, or the user).`] : [];
}

// Check 6: code that touches sign-in, secrets, commands, uploads, payments or personal data was written, and the turn
// neither ran the security review nor wrote its report. The pattern and the files are the project's own
// (tools/hooks/requirements.json, "security-code"), so a project tunes them in one place. Replay: the old engine's ask
// found a real problem in 3 of 4 runs.
const securitySpec = () => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/hooks/requirements.json'), 'utf8')).requirements.find(r => r.tag === 'security-code')?.when?.changedContentMatches || null; } catch { return null; } };
export function securityGaps(acts) {
  const spec = securitySpec();
  if (!spec?.pattern) return [];
  let rx; try { rx = new RegExp(spec.pattern, 'i'); } catch { return []; }
  const files = (spec.files || []).map(globRx), ignore = (spec.ignore || []).map(globRx);
  const covered = r => files.some(x => x.test(r)) && !ignore.some(x => x.test(r)) && !/^(\.\.|[a-z]:)/i.test(r);
  const hit = acts.calls.filter(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && covered(relp(c.input.file_path || '')))
    .filter(c => rx.test(String(c.input.new_string ?? c.input.content ?? (c.input.edits || []).map(e => e.new_string).join('\n'))))
    .map(c => relp(c.input.file_path));
  if (!hit.length) return [];
  const reviewed = acts.calls.some(c => (c.name === 'Skill' && /security-review$/.test(String(c.input.skill || '')))
    || (c.name === 'Read' && /skills[\\/]security-review[\\/]SKILL\.md$/i.test(String(c.input.file_path || '')))
    || (/^(Edit|Write)$/.test(c.name) && /^docs\/reviews\/security[^/]*\.md$/i.test(relp(c.input.file_path || ''))))
    || changedSince(acts, { test: r => /^docs\/reviews\/security[^/]*\.md$/i.test(r) }).length > 0;
  return reviewed ? [] : [`Security-sensitive code changed (${[...new Set(hit)].slice(0, 3).join(', ')}): run the security review (skills/security-review/SKILL.md) and say its result.`];
}

// Check 7: the answer claims nothing the turn can't back. A commit it names exists here or showed up in this turn's
// tool output (another repository's commit, read in a log, counts). A file it names exists, unless it says the file
// went. Only checkable facts: labels, wording and judgment are never read as claims. Lesson (an old check): the
// "Corrected:" label the engine itself asked for was called a claim with no evidence. Evidence is the whole session so
// far (`history`, the transcript's text), not only this turn: a version a message named two turns ago is known.
// Lesson (replay): an engine version relayed by another session earlier was flagged as made up.
export function claimGaps(acts, history = '') {
  const a = String(acts.answer || ''), seen = acts.calls.map(c => JSON.stringify(c.input) + '\n' + (c.out || '')).join('\n') + (acts.context || '') + history;
  const out = [];
  const hashes = [...new Set([...a.matchAll(/(?<![\w/#-])([0-9a-f]{7,40})(?![\w-])/g)].map(m => m[1]).filter(h => /\d/.test(h) && /[a-f]/.test(h)))];
  const unknown = hashes.filter(h => !seen.includes(h) && spawnSync('git', ['cat-file', '-e', `${h}^{commit}`], { cwd: ROOT, timeout: 5000 }).status !== 0);
  if (unknown.length) out.push(`The answer names commit ${unknown.slice(0, 3).join(', ')}, which no command in this turn showed and this repository does not have: check it, or correct the answer.`);
  const top = p => { try { return fs.existsSync(path.join(ROOT, p.split('/')[0])); } catch { return false; } };
  const paths = [...new Set([...a.matchAll(/(?:[A-Za-z]:[\\/]|(?<![\w.:/\\-]))((?:[\w.-]+[\\/])+[\w.-]+\.[A-Za-z]{1,5})\b/g)].map(m => m[0].replace(/\\/g, '/')))];
  const missingFiles = paths.filter(p => /^[A-Za-z]:\//.test(p) ? !fs.existsSync(p) : top(p) && !fs.existsSync(path.join(ROOT, p)))
    .filter(p => !new RegExp(`(delet|remov|retir|renam|moved)\\w*[^.\\n]{0,80}${p.split('/').pop().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|${p.split('/').pop().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^.\\n]{0,80}(delet|remov|retir|renam|moved|gone)`, 'i').test(a));
  if (missingFiles.length) out.push(`The answer names ${missingFiles.slice(0, 3).join(', ')}, which does not exist: check the path, or correct the answer.`);
  // (it says, as done, that it committed or pushed the work, and no command this turn did or showed it. Only the
  // first-person "done" forms: "will get committed", "pushed it further" or a game's "they committed" are not claims.
  // Lesson (replay): a plain word match was wrong 6 times in 8)
  for (const [word, rx] of [['committed', /\bgit\b[^|;&\n]*\bcommit\b|\[[\w./-]+ [0-9a-f]{7,}\]|\bcommitted\b/i], ['pushed', /\bgit\b[^|;&\n]*\bpush\b|\bTo (https?:|git@|[\w.-]+:)|\b[0-9a-f]{7,}\.\.[0-9a-f]{7,}\b/i]]) {
    const claim = new RegExp(`\\b(I(?:'ve| have)?|it(?:'s| is)|(?:is|are|was|were|all|work|changes?) (?:now )?|and )\\s*(?:\\w+ )?${word}\\b(?! (earlier|before|last|in an earlier|yesterday|by))|^\\W*${word}\\b`, 'im');
    if (!claim.test(a) || new RegExp(`\\b(not|never|nothing|no)\\b[^.\\n]{0,20}\\b${word}\\b|n't\\b[^.\\n]{0,20}\\b${word}\\b|\\b(will|to be|can be|get|gets|once)\\b[^.\\n]{0,15}\\b${word}\\b`, 'i').test(a)) continue;
    // (also backed: a real commit the answer names, or, for "committed", any commit made here since the turn began, by
    // a helper or a script included)
    const since = acts.at || acts.started;
    const backed = acts.calls.some(c => /^(Bash|PowerShell)$/.test(c.name) && !c.error && (rx.test(String(c.input.command || '')) || rx.test(c.out || '')))
      || hashes.some(h => !unknown.includes(h))
      || (word === 'committed' && !!since && !!String(spawnSync('git', ['log', `--after=${since}`, '--format=%h', '-1'], { cwd: ROOT, encoding: 'utf8', timeout: 5000 }).stdout || '').trim());
    if (!backed) out.push(`The answer says it ${word}, but no command in this turn ${word === 'committed' ? 'committed' : 'pushed'}: check it, or correct the answer.`);
  }
  return out;
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
