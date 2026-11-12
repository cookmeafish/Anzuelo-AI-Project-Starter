// The safety guard during the work: a tool call is refused only for what IN_WORK_GUARDS lists (tests: selftest, selfcheck).
import '../hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE, split, kind } from '../paths.mjs';
import { commitIds, cutIds } from '../claims.mjs';
import { selfListGrows, selfCmdWrites } from '../selfcmds.mjs';
import { ROOT, read, readJSON, abs, exists, list, walkStat, esc, config, re, secretHit, forbiddenRe, today } from '../settings.mjs';
import { stateFile, writeState, SNAPSHOT, rel, globRe, match, textOf, engineOf } from '../state.mjs';
import { people, peopleIn, peopleFor, personOf, pathsPeople } from '../people.mjs';
import { isWakeTool, WAKE_ASK } from '../wakeups.mjs';
import { gitignoreProblems, aiAttributedCommits } from '../repo.mjs';
import { AUTONOMY_WORDS } from '../near.mjs';
export { commitIds };
// Shared helpers come from the loader (use(hooksModule)): an import cycle left the hook waiting forever.
let H = null;
export const use = h => { H = h; };

// REQ: quiet-work. Refused during work: the irreversible, leaks, a user's protection, a hung headless run. Rest: end check.
export const IN_WORK_GUARDS = /^REQ: (approval-gate|self-commands|browser-guard|claim-checked|commit-gate|engine-readonly|forbidden-command|forbidden-terms|git-safety|gitignore-ready|headless-no-wakeup|injection-guard|no-ai-attribution|no-overwrite|no-secrets|outward-gate|permission-respected|protect-originals|publish-gate|scope-separate|setup-[\w-]+|shell-hygiene|skill-mirror|subagent-brief|wakeup-left|whole-output|write-only-via)\b/;
// A path pattern in an approved list as a regex: "**/" is any number of folders, none included; "**" anything; "*"
// within one folder. Lesson (a sweep for the root-file glob bug): "old/**" covered one level only, "**/*.bak" no root file
export const wildRx = g => new RegExp(`(^|/)${String(g).split('**/').map(a => a.split('**').map(b => b.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')).join('.*')).join('(?:.*/)?')}$`, 'i');
// One denial names every rule the call breaks, numbered, at most PRETOOL_MAX (a retry was once denied rule by rule).
const PRETOOL_MAX = 6;
export function pretoolDecision(data, cfg = config()) {
  const hits = pretoolHits(data, cfg).filter(h => IN_WORK_GUARDS.test(h));
  if (hits.length < 2) return hits[0] || null;
  const shown = hits.slice(0, PRETOOL_MAX), more = hits.length - shown.length;
  return `This tool call breaks ${hits.length} rules. Fix all of them before trying again:\n` +
    shown.map((h, i) => `${i + 1}. ${h}`).join('\n') + (more ? `\n(${more} more not shown.)` : '');
}
export { pretoolDecision as guard };

// Every path a delete names in originals folder d is new this turn (not in the turn-start snapshot, not in git).
export function deletesOnlyNewFiles(cmd, d) {
  const snap = readJSON(stateFile(SNAPSHOT), null), turnAt = Date.parse(readJSON(stateFile('turn.json'), {}).at || '');
  if (!snap?.files || !turnAt || Date.parse(snap.at) < turnAt - 5000) return false;
  const paths = [...String(cmd).matchAll(new RegExp(`(["']?)((?:[^\\s"';|&]*[\\\\/])?${esc(d)}[\\\\/](?:[^"';|&\\n]+?))\\1(?=$|[\\s;|&])`, 'g'))].map(m => rel(m[2].replace(/\\/g, '/')));
  if (!paths.length) return false;
  for (const p of paths) {
    if (/[*?]/.test(p) || p.startsWith('..') || !exists(p) || snap.files[p]) return false;
    let s; try { s = fs.statSync(abs(p)); } catch { return false; }
    if (s.isDirectory()) return false;
    if (exists('.git') && spawnSync('git', ['ls-files', '--error-unmatch', p], { cwd: ROOT, encoding: 'utf8' }).status === 0) return false;
  }
  return true;
}
// The session's own uncited downloads in a protected folder are not evidence yet: it may remove or rename them.
export function sessionOwnFiles(cmd, d, t) {
  if (!t?.sessionTools) return false;
  const paths = [...String(cmd).matchAll(new RegExp(`(["']?)((?:[^\\s"';|&]*[\\\\/])?${esc(d)}[\\\\/](?:[^"';|&\\n]+?))\\1(?=$|[\\s;|&])`, 'g'))].map(m => rel(m[2].replace(/\\/g, '/')));
  const there = paths.filter(p => exists(p));
  if (!there.length) return false;
  const citing = [];
  const walk = dir => { for (const n of list(dir)) { const p = `${dir}/${n}`; let s; try { s = walkStat(p); } catch { continue; } if (s.isDirectory()) walk(p); else if (/\.(md|json|ya?ml|csv|txt|html?)$/i.test(n)) citing.push(p); } };
  walk('docs'); walk(d); if (exists('outputs')) walk('outputs');
  for (const p of there) {
    if (/[*?]/.test(p) || p.startsWith('..')) return false;
    let s; try { s = fs.statSync(abs(p)); } catch { return false; }
    if (s.isDirectory() || s.mtimeMs < (t.sessionStart || Infinity) - 5000) return false;
    const base = p.split('/').pop();
    if (!t.sessionTools.includes(base)) return false;
    if (exists('.git') && spawnSync('git', ['ls-files', '--error-unmatch', p], { cwd: ROOT, encoding: 'utf8' }).status === 0) return false;
    if (citing.some(c => c !== p && read(abs(c)).includes(base))) return false;
  }
  return true;
}
// A file this turn made (not in the snapshot and untracked, or written or copied this turn) is a draft, not an output.
export function madeThisTurn(p, t, cfg = config()) {
  if (p.startsWith('..')) return false;
  const tracked = () => exists('.git') && spawnSync('git', ['ls-files', '--error-unmatch', p], { cwd: ROOT, encoding: 'utf8' }).status === 0;
  const snap = readJSON(stateFile(SNAPSHOT), null), turnAt = Date.parse(readJSON(stateFile('turn.json'), {}).at || '');
  const ign = (cfg.ignoreForChanges || []).map(globRe), parts = p.split('/');
  const skipped = parts.some((_, i) => { const q = parts.slice(0, i + 1).join('/'); return ign.some(r => r.test(q) || r.test(q + '/')); });
  if (snap?.files && turnAt && Date.parse(snap.at) >= turnAt - 5000 && !skipped) return !snap.files[p] && !tracked();
  const entries = t?.entries || [], ids = new Set();
  const base = p.split('/').pop(), copied = cmd => cmd.split(/&&|\|\||[;|\n]/).some(seg => {
    const m = /^\s*(?:cp|copy|Copy-Item|cpi)\s+(.+)$/i.exec(seg); if (!m) return false;
    const args = [...m[1].matchAll(/"([^"]+)"|'([^']+)'|(\S+)/g)].map(a => a[1] ?? a[2] ?? a[3]).filter(a => !/^-/.test(a));
    return args.length >= 2 && args.at(-1).replace(/\\/g, '/').split('/').pop() === base; });
  for (const r of entries) { const c = r.message?.content; if (r.type === 'assistant' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_use' && ((x.name === 'Write' && rel(x.input?.file_path || '') === p) || (/^(Bash|PowerShell)$/.test(x.name) && copied(String(x.input?.command || ''))))) ids.add(x.id); }
  if (!ids.size) return false;
  const writes = new Set(); for (const r of entries) { const c = r.message?.content; if (r.type === 'assistant' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_use' && x.name === 'Write') writes.add(x.id); }
  for (const r of entries) { const c = r.message?.content; if (r.type === 'user' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_result' && ids.has(x.tool_use_id) && !x.is_error && (!writes.has(x.tool_use_id) || /^File created successfully\b/.test(textOf(x.content).trim()))) return !tracked(); }
  return false;
}
// The files a command deletes or moves away (rm/del/Remove-Item, sources of mv/Move-Item); with globs, matching ones only.
export function removedPaths(cmd, globs = null) {
  const segs = [[]], args = [];
  for (const m of String(cmd).matchAll(/"((?:\\.|[^"\\])*)"|'([^']*)'|(&&|\|\||[;|&\n])|([^\s;|&"']+)/g))
    if (m[3]) segs.push([]); else segs[segs.length - 1].push(m[1] ?? m[2] ?? m[4]);
  const RM = /^(rm|del|erase|unlink|rmdir|rd|remove-item|ri)$/i, MV = /^(mv|move|move-item|mi|rename-item|ren)$/i;
  for (let words of segs) {
    while (words.length && /^(sudo|command|\w+=\S*)$/.test(words[0])) words = words.slice(1);
    if (/^git$/i.test(words[0] || '') && /^(rm|mv)$/i.test(words[1] || '')) words = words.slice(1);
    const verb = words[0] || '';
    if (!RM.test(verb) && !MV.test(verb)) continue;
    // (PowerShell's -Destination and -NewName name the target, not a file that goes away)
    const a = [];
    for (let i = 1; i < words.length; i++) { if (/^-(destination|newname)$/i.test(words[i])) { i++; continue; } if (!/^-/.test(words[i]) && !/^\/[a-z]$/i.test(words[i])) a.push(words[i]); }
    args.push(...(MV.test(verb) ? a.slice(0, -1) : a));
  }
  const files = [], gl = globs ? [].concat(globs) : null;
  const want = q => !gl || match(q, gl);
  const statics = gl && gl.map(g => g.split(/[*?{[]/)[0]);
  const reach = dir => !statics || statics.some(s => (s === '' && !/(^|\/)(node_modules|\.git|\.venv|venv|dist|build|target)$/.test(dir)) || s.startsWith(dir + '/') || `${dir}/`.startsWith(s.replace(/[^/]*$/, '')) && s.replace(/[^/]*$/, '') !== '');
  let visited = 0;
  // (a wildcard without ** only reaches as deep as its own folders)
  const walk = (d, keep = () => true, depth = Infinity) => {
    if (d && !reach(d)) return;
    for (const n of list(d)) {
      if (++visited > 20000) return;
      const q = d ? `${d}/${n}` : n; let s; try { s = walkStat(q); } catch { continue; }
      if (s.isDirectory()) { if ((d || n !== '.git') && q.split('/').length < depth) walk(q, keep, depth); } else if (keep(q) && want(q)) files.push(q);
    }
  };
  for (const p of args.map(x => rel(x.replace(/\\/g, '/')))) {
    if (p.startsWith('..')) continue;
    if (/[*?]/.test(p)) { const r = globRe(p); walk(p.replace(/(^|\/)[^/]*[*?].*$/, ''), q => r.test(q), p.includes('**') ? Infinity : p.split('/').length); continue; }
    let s; try { s = fs.statSync(abs(p)); } catch { continue; }
    if (s.isDirectory()) walk(p); else if (want(p)) files.push(p);
  }
  return [...new Set(files)];
}
// Secrets files: .env and its variants (not .env.example), private keys. Reading one is fine when the user asked for it.
const SECRET_FILE = /(^|[\\/])(\.env(\.(?!example$|sample$|template$)[\w.-]+)?|[^\\/]+\.(pem|key|p12|pfx)|id_(rsa|ed25519|ecdsa))$/i;
const SECRET_IN_CMD = /(^|[\s"'/\\])(\.env(?:\.(?!example\b|sample\b|template\b)[\w.-]+)?|[\w.-]+\.(?:pem|key|p12|pfx)|id_(?:rsa|ed25519|ecdsa))(?=$|[\s"';|&)])/i;
const SECRET_ASKED = /\.env\b|\b(env|environment) (file|variables?)\b|\b(private )?key file\b|\bsecrets? file\b/i;
const secretReadMsg = f => `REQ: no-secrets. Reading ${f} would put its secrets into this conversation. Check .env.example for the names, test that a value is set without printing it, or ask the user if they want this file read.`;
// A connected service's tool that sends, posts, creates or deletes acts outside the project (rule 6).
const OUTWARD_MCP = /(^|_)(send|post|reply|publish|tweet|email|mail|message|comment|submit|invite|share|upload|delete|remove|create_(issue|pull|pr|comment|event|page|post|message|release))/i;
const outwardWhat = m => /mail|smtp/i.test(m) ? 'it sends an email' : /\bgh\b/i.test(m) ? 'it changes GitHub for other people to see' : /\bpush\b/i.test(m) ? 'it pushes to a shared repository' : 'it sends data to an outside service';
// Codex's apply_patch: each file in the patch gets the guards of a Write, Edit or delete.
export function patchFiles(patch) {
  const out = [];
  let cur = null;
  for (const line of String(patch || '').split(/\r?\n/)) {
    const m = /^\*\*\*\s+(Add|Update|Delete) File:\s*(.+?)\s*$/.exec(line), mv = /^\*\*\*\s+Move to:\s*(.+?)\s*$/.exec(line);
    if (m) { cur = { op: m[1].toLowerCase(), file: m[2], added: [] }; out.push(cur); continue; }
    if (mv && cur) { out.push({ op: 'add', file: mv[1], added: cur.added }); continue; }
    if (cur && /^\+(?!\+\+)/.test(line)) cur.added.push(line.slice(1));
  }
  return out.map(f => ({ ...f, added: f.added.join('\n') }));
}
// The parts of a command that run in the project (a cd elsewhere moves the rest out; the host's cwd is not trusted).
export function inProjectParts(cmd, cwd = ROOT) {
  const unix = s => process.platform === 'win32' ? s.replace(/^\/([a-z])(?=\/|$)/i, '$1:') : s;
  const norm = s => s.replace(/\\/g, '/').toLowerCase();
  const roots = [norm(ROOT), norm(ROOT).replace(/^([a-z]):/, (_, d) => `/${d}`)];
  let at = path.resolve(unix(String(cwd || ROOT))); const keep = [];
  for (const seg of String(cmd).split(/\s*(?:&&|\|\||;|\r?\n)\s*/)) {
    const m = /^(?:cd|chdir|Set-Location|sl|pushd)(?:\s+\/d)?\s+(?:-(?:Path|LiteralPath)\s+)?(["']?)([^"';&|]+?)\1\s*$/i.exec(seg.trim());
    if (m) { at = path.resolve(at, unix(m[2].trim().replace(/^~(?=[\\/]|$)/, os.homedir()))); continue; }
    const r = path.relative(ROOT, at);
    if ((!r.startsWith('..') && !path.isAbsolute(r)) || roots.some(x => norm(seg).includes(x))) keep.push(seg);
  }
  return keep.join('; ');
}
// The request asks to change this very file and names it (path, name, a word of it, or "chapter 1"), not for a copy.
const CHANGE_ASK = /\b(change|edit|fix|correct|polish|tighten|rewrite|revise|reword|tweak|update|improve|shorten|lengthen|expand|trim|cut|swap|replace|rename|remove|delete|add|adjust|redo|rework|make(?!\s+(a|an|another|new|copy|a copy|me a)\b)|cambi\w*|edit\w*|corrig\w*|arregl\w*|pul\w*|reescrib\w*|mejor\w*|ajust\w*|acort\w*|alarg\w*|quit\w*|añad\w*|agreg\w*|haz(?!\s+(un|una|otr[oa]))|hazlo)\b/i;
// (a version number asks for a new copy only as one: "save it as v2", not "change the notes to say v2")
const NEW_COPY = /\b(new (version|file|copy)|another version|a copy|copy of|(?:as|a|into|como|una?)\s+v\d+\b|v\d+\s+(?:of|copy|file|de|copia)\b|nueva versi[oó]n|otra versi[oó]n|una copia|copia de)\b/i;
const FOLDER_NOUN = { chapters: '(chapter|ch\\.?|cap[ií]tulo|cap\\.?)', capitulos: '(cap[ií]tulo|chapter|cap\\.?)' };
export function asksToChange(p, prompt) {
  const ask = String(prompt || '');
  if (!CHANGE_ASK.test(ask) || NEW_COPY.test(ask)) return false;
  const file = p.split('/').pop(), base = file.replace(/\.[^.]+$/, ''), dir = p.split('/').slice(-2, -1)[0] || '';
  const said = s => new RegExp(`(?<![\\w\\u00C0-\\u024F])${esc(s)}(?![\\w\\u00C0-\\u024F])`, 'i').test(ask);
  if (said(p) || said(file) || said(base)) return true;
  const COMMON = /^(file|draft|final|copy|version|notes?|chapter|part|section|untitled|document|output|outputs|summary|report|index|readme)$/i;
  if (base.split(/[^A-Za-zÀ-ɏ]+/).filter(w => w.length >= 4 && !COMMON.test(w)).some(said)) return true;
  const n = /^0*(\d+)/.exec(base)?.[1] || /(?:^|[^a-z])(?:ch|chapter|part|cap)[-_ ]?0*(\d+)/i.exec(base)?.[1];
  if (!n || !dir) return false;
  const noun = FOLDER_NOUN[dir.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] || esc(dir.replace(/e?s$/i, ''));
  return new RegExp(`\\b${noun}s?\\s*(n[oº.]?\\s*|#\\s*)?0*${n}\\b`, 'i').test(ask);
}

// Every rule the call breaks, in the order the checks run (each message once).
export function pretoolHits(data, cfg) {
  // (the helpers still in the old engine, handed in by use() until each moves to a shared module: plan step 1b)
  const { turn, WAKE_STATE, isSuspended, settingUp, toolUses, loggedRuns, briefFileNamesRules, FORBID_EXEMPT, countRe,
    BROWSER_CODE, heldSidestep, runsOf, onPath, gitPush, askedPushEarlier, runText, outwardCommand, setupCompleteness,
    setupProblems, names, inTimeOrder, redirectedRun, shellParts, inlineCodeOut, sedInPlaceFiles, cmdHead, gateResult } = H;
  const out = [], add = m => { if (m && !out.includes(m)) out.push(m); };
  // REQ: self-commands. Only the user adds a command the end check may run itself (selfcmds.mjs).
  if (selfListGrows(data.tool_name, data.tool_input, ROOT) || (/^(Bash|PowerShell)$/.test(data.tool_name || '') && selfCmdWrites(data.tool_input?.command)))
    add('REQ: self-commands. Only the user approves a command for the end check to run itself. Run the check yourself instead, and if it should run on its own, give the user the line to paste: `! node tools/hooks/hooks.mjs self-allow "<the exact command>"`.');
  if (data.tool_name === 'apply_patch' || (/^(Bash|shell)$/.test(data.tool_name || '') && /^\s*apply_patch\b/.test(data.tool_input?.command || ''))) {
    for (const f of patchFiles(data.tool_input?.command || data.tool_input?.patch || data.tool_input?.input || '')) {
      const sub = f.op === 'delete' ? { tool_name: 'Bash', tool_input: { command: `rm "${f.file}"` } }
        : { tool_name: f.op === 'add' ? 'Write' : 'Edit', tool_input: f.op === 'add' ? { file_path: f.file, content: f.added } : { file_path: f.file, old_string: '', new_string: f.added } };
      pretoolHits({ ...data, ...sub }, cfg).forEach(add);
    }
    return out;
  }
  const name = data.tool_name || '', inp = data.tool_input || {};
  if (engineOf() !== 'v2' && H) add(H.upsetUnacknowledged(name, inp, data.transcript_path || '')); // TODO(1e): v1 only, goes with v1
  // REQ: outward-gate (MCP tools): a service's tool that sends, posts, creates or deletes needs the user's OK.
  if (/^mcp__/.test(name) && OUTWARD_MCP.test(name.replace(/^mcp__[^_]+(?:_[^_]+)*?__/, '')) && !isSuspended('check:outward-gate')) {
    const prompt = (turn(data.transcript_path || '') || {}).prompt || '';
    if (!re(config().outwardOk).test(prompt)) add(`REQ: outward-gate. ${name} acts outside the project (it sends, posts, creates or deletes something). Rule 6: that needs the user's OK in this request. Draft it and ask first.`);
  }
  let _t;
  const t = () => (_t ??= turn(data.transcript_path || '') || { prompt: '', entries: [] });
  const req = () => t().prompt || '';
  // A typed approval ("do it", "yes, go ahead") covers exactly the paths a list it answers names: the text the user
  // pasted with it, or the agent's own last message. Pasted text alone never approves (it may carry instructions that
  // are not the user's). Lesson (a field report): the agent listed the exact files to remove and rename, the user pasted
  // the list back with "just do it, don't ask me again", and the guard still refused, reading the typed words only.
  const APPROVE = /\b(?:(?:just )?do (?:it|that|them|this|those)|go ahead|go for it|yes|yep|yeah|ok(?:ay)?|proceed|approved?|sure|s[ií]|hazlo|dale)\b/i;
  const approvedList = () => {
    if (!APPROVE.test(req())) return '';
    const pasted = [...String(t().raw || '').matchAll(/<pasted_content\b[^>]*>([\s\S]*?)<\/pasted_content/gi)].map(m => m[1]).join('\n');
    return `${pasted}\n${t().before || ''}`.replace(/\\/g, '/');
  };
  // (each path in a line or sentence of the list that names this action: a file listed to rename is not one to delete)
  const listedAll = (paths, verb) => {
    const lines = approvedList().split(/\n|;|\.\s+(?=[A-Z])/).filter(l => verb.test(l));
    // ("**/" is any number of folders, none included; "**" anything; "*" within one folder. Lesson (a sweep for the root-file
    // glob bug): "old/**" covered only one level, and "**/*.bak" no file at the root)
    const has = (l, p) => l.includes(p) || l.includes(p.split('/').pop()) || [...l.matchAll(/[\w./*-]*\*[\w./*-]*/g)].some(m => wildRx(m[0]).test(p));
    return paths.length > 0 && paths.every(p => lines.some(l => has(l, p)));
  };
  // REQ: wakeup-left. A headless run with a job running needs no wakeup (one pending kept a run from ever answering).
  // REQ: claim-checked (messages). A commit the repository lacks, that nothing here showed, is refused before the message
  // goes. Lesson (2026-11-08): two made-up commit ids were sent to a peer, each written before the commit returned.
  if (name === 'SendMessage' && typeof inp.message === 'string') {
    const ids = commitIds(inp.message);
    const missing = ids.filter(h => spawnSync('git', ['cat-file', '-e', `${h}^{commit}`], { cwd: ROOT, timeout: 5000 }).status !== 0);
    if (missing.length) {
      // (evidence is user rows only: tool results and received messages, never the agent's own text or messages)
      let seen = ''; try { seen = fs.readFileSync(data.transcript_path || '', 'utf8').split('\n').filter(l => /^\{"(?:[^"]+":[^,]*,"){0,6}type":"user"|"type":"user"/.test(l) && !/"type":"assistant"/.test(l)).join('\n'); } catch { }
      const bad = missing.filter(h => !seen.includes(h));
      if (bad.length) add(`REQ: claim-checked. This message names commit ${bad.join(', ')}, which this repository does not have and no command here showed: read the id from the command's output (git log -1 --format=%h) and send it again.`);
    }
    // (a shortened stand-in, "commit 72c...": never an id. Oversight, 2026-11-10)
    const cut = cutIds(inp.message);
    if (cut.length) add(`REQ: claim-checked. This message names commit ${cut.join(', ')}, a shortened stand-in, not an id: read the full id from git output (git log -1 --format=%h), or say "the next commit", and send it again.`);
  }
  if (isWakeTool(name, inp)) {
    if (typeof inp.prompt === 'string' && inp.prompt.trim()) {
      const w = readJSON(stateFile(WAKE_STATE), {});
      writeState(WAKE_STATE, { prompts: [...new Set([...(w.prompts || []), inp.prompt.trim().slice(0, 2000)])].slice(-20) });
    }
    const tt = t();
    if ((tt.entries || []).some(r => /^sdk/.test(String(r.entrypoint || ''))) && (tt.bgRunning || []).length && !WAKE_ASK.test(req()) && !isSuspended('check:wakeup-left'))
      add(`REQ: wakeup-left. This run is headless (claude -p or the SDK), and a background job of this session still runs: its notice wakes you by itself when it ends, so no fallback wakeup is needed. A wakeup still pending after your answer keeps the run from ending until its time limit stops it, and the caller then gets no answer. End this turn with a short status instead; you are re-invoked when the job ends.`);
  }
  const ppl = people(cfg);
  // REQ: scope-separate. One person's request never touches another's folder; a logged waiver covers whom it names.
  const waivedFor = () => {
    const cmds = [...toolUses(t().entries || []).map(u => typeof u.input?.command === 'string' ? u.input.command : ''), ...loggedRuns(t().since).map(r => r.cmd)];
    const why = cmds.flatMap(c => [...String(c).matchAll(/hooks\.mjs["']?\s+waive\s+scope-separate\s+(?:"([^"\n]+)"|'([^'\n]+)'|([^"'\n&;|]+))/gi)]).map(m => m[1] || m[2] || m[3] || '');
    return why.length ? { any: why.some(w => !peopleIn(w, ppl).length), people: why.flatMap(w => peopleIn(w, ppl)) } : null;
  };
  const scopeCheck = (persons, writing) => {
    // setup creates everyone's folder at once; there is no one else's data yet
    if (!ppl.length || !persons.length || settingUp()) return null;
    let named = peopleFor(req(), t().allPrompts, ppl);
    const w = persons.some(x => !named.includes(x)) && waivedFor();
    if (w) named = [...new Set([...named, ...w.people, ...(w.any && persons.length === 1 ? persons : [])])];
    if (persons.length > 1 && !persons.every(x => named.includes(x)))
      return `REQ: scope-separate. This touches several people's folders (${persons.join(', ')}) at once. Work on one person per tool run, and only the people this request is about.`;
    const other = persons.find(x => named.length ? !named.includes(x) : writing && !re(cfg.ruleRequest).test(req()));
    if (other) return `REQ: scope-separate. ${cfg.scopesRoot}/${other}/ belongs to ${other}, and this request is ${named.length ? `about ${named.join(', ')}` : 'not about them'}. Don't ${writing ? 'change' : 'read'} another person's data. ` +
      `If the request is about ${other} after all (a follow-up to earlier work on them), confirm it and retry: node tools/hooks/hooks.mjs waive scope-separate "<why this is ${other}'s>". Otherwise ${named.length ? `work only in ${named.map(n => `${cfg.scopesRoot}/${n}/`).join(', ')}` : 'leave that folder alone'}.`;
    return null;
  };
  // REQ: subagent-brief. A sub-agent only follows the rules it is shown: every brief points it at AGENTS.md.
  if (/^(Agent|Task)$/.test(name) && cfg.subagentBrief && typeof inp.prompt === 'string' && inp.subagent_type !== 'fork' && !/AGENTS\.md|CLAUDE\.md/.test(inp.prompt) && !briefFileNamesRules(inp.prompt))
    add('REQ: subagent-brief. Sub-agents follow only what their brief says. Add to the prompt: "Read AGENTS.md first and follow its rules (plain writing, no invented facts, no AI attribution, the runbook for this task: docs/playbooks/<name>.md)." A prompt that names a brief file saying it works too. Then re-check its output yourself before reporting it.');
  // REQ: headless-no-wakeup. A headless run ends with its answer: nothing would wake it later.
  if (/^(ScheduleWakeup|CronCreate)$/.test(name) && /^sdk/.test(process.env.CLAUDE_CODE_ENTRYPOINT || ''))
    add('REQ: headless-no-wakeup. This is a headless run: it ends with its answer, so nothing would wake it. A helper or background job you started reports back by itself in this turn when it ends: do other work meanwhile, or wait for it, then answer.');
  if (name === 'Read' && inp.file_path) {
    const who = personOf(rel(inp.file_path), cfg);
    if (who) { const named = peopleFor(req(), t().allPrompts, ppl); if (named.length && !named.includes(who)) add(scopeCheck([who], false)); }
    // REQ: no-secrets (reading). A secrets file read into the conversation leaves the machine with it.
    if (SECRET_FILE.test(rel(inp.file_path)) && !SECRET_ASKED.test(req())) add(secretReadMsg(rel(inp.file_path)));
    return out;
  }
  if (/^(Write|Edit|MultiEdit|NotebookEdit)$/.test(name)) {
    const target = inp.file_path || inp.notebook_path || '';
    if (!target) return out;
    const p = rel(target);
    if (p.startsWith('..')) return out;
    // (a file this turn created is the turn's own draft: fixing it overwrites no delivered output and no original)
    const there = exists(p) && !((match(p, cfg.noOverwrite) || match(p, cfg.newVersionOnly || []) || match(p, cfg.protectedOriginals)) && madeThisTurn(p, t(), cfg));
    const who = personOf(p, cfg);
    if (who) add(scopeCheck([who], true));
    const incoming = [inp.content, inp.new_string, ...(inp.edits || []).map(e => e.new_string)].filter(s => typeof s === 'string').join('\n');
    // REQ: no-secrets (writing). A key typed into a tracked file is one commit from leaking. Ignored secret stores are fine.
    const key = !SECRET_FILE.test(p) && secretHit(incoming, cfg);
    if (key && spawnSync('git', ['check-ignore', '-q', p], { cwd: ROOT }).status !== 0)
      add(`REQ: no-secrets. This writes something that looks like a secret (pattern ${key}) into ${p}. Keep secrets in .env (ignored by git) and read them from the environment; a test uses an obviously fake value.`);
    // REQ: forbidden-terms. Only what this write adds counts: editing a line that already had the name is no new slip.
    const fx = !FORBID_EXEMPT.test(p) && forbiddenRe(cfg);
    if (fx) {
      const outgoing = name === 'Write' ? (exists(p) ? read(abs(p)) : '') : [inp.old_string, ...(inp.edits || []).map(e => e.old_string)].filter(s => typeof s === 'string').join('\n');
      const m = countRe(fx, incoming) > countRe(fx, outgoing) && new RegExp(fx.source, 'iu').exec(incoming);
      if (m && spawnSync('git', ['check-ignore', '-q', p], { cwd: ROOT }).status !== 0)
        add(`REQ: forbidden-terms. This writes "${m[1]}" into ${p}, a name the user asked to keep out of the project. Use a neutral word or example instead.`);
    }
    // REQ: browser-guard. Automating the INSTALLED Chrome/Edge can trigger failed OS sign-ins that lock the user's account.
    if (!/\.md$/i.test(p) && !p.startsWith('tools/hooks/') && BROWSER_CODE.test(incoming))
      add(`REQ: browser-guard. ${p} would drive the installed Chrome/Edge (executablePath / channel / CHROME_BIN / chrome.exe). Use Playwright's bundled Chromium (no executablePath, no channel) and --mute-audio, like tools/screenshot.mjs.`);
    // REQ: write-only-via. Some files may only be written by the tool that validates them.
    const via = cfg.writeOnlyVia.find(v => match(p, [v.glob]));
    if (via) add(`REQ: write-only-via. ${p} may only be created or changed with ${via.tool} (it validates the content). Run that tool instead of editing the file directly.`);
    // REQ: engine-readonly. Files in .anzuelo/engine are the starter's: a change there blocks the next upgrade.
    const rawFile = String(inp.file_path || inp.notebook_path || '');
    if (split && rawFile && !path.relative(ENGINE, path.resolve(ROOT, rawFile)).startsWith('..'))
      add(`REQ: engine-readonly. ${rawFile} is in the engine (.anzuelo/engine), which upgrades replace. ${kind(p) === 'both' ? `Make this project's copy first: node .anzuelo/engine/tools/starter.mjs override ${p}, then edit .anzuelo/local/${p}.` : 'Engine code changes belong in the starter; note it in docs/starter-feedback.md.'}`);
    // REQ: skill-mirror. Mirrors are generated copies; edits there would be overwritten.
    if (cfg.skillMirrors.some(m => p.startsWith(m + '/')))
      add(`REQ: skill-mirror. ${p} is a generated copy. Edit ${p.replace(new RegExp(`^(${cfg.skillMirrors.map(esc).join('|')})/`), cfg.skillsDir + '/')} instead; the hooks copy it here.`);
    // REQ: protect-originals. Originals are evidence: never changed, only added.
    if (there && match(p, cfg.protectedOriginals) && !/(^|\/)README\.md$/i.test(p))
      add(`REQ: protect-originals. ${p} is an original (protected: ${cfg.protectedOriginals.join(', ')}). Originals are never edited or overwritten. Put derived or corrected content in docs/ or outputs/ and link the original.`);
    // REQ: no-overwrite. Delivered outputs keep their history: a new version is a new file.
    if (there && match(p, cfg.newVersionOnly || []))
      add(`REQ: no-overwrite. ${p} is kept as written: in this project every version is a new file (newVersionOnly). Write the change as a new file (e.g. "<name> v2${path.extname(p)}") and leave this one as it is.`);
    else if (there && match(p, cfg.noOverwrite) && !re(cfg.overwriteWords).test(req()) && !asksToChange(p, req()))
      add(`REQ: no-overwrite. ${p} is a delivered output, and the request does not name it as the file to change. If the user asked for a new version, write it as a new file (e.g. "<name> v2.md"). ` +
        'If they did ask to change this file, in words the hook did not catch, make no copy: ask them in one line to confirm the change to this file.');
  }
  if (/^(Bash|PowerShell)$/.test(name) && typeof inp.command === 'string') {
    const cmd = inp.command;
    // REQ: permission-respected. A program held for approval this turn is not run another way (a one-liner).
    const held = heldSidestep(cmd, () => runsOf(t().entries || []));
    const there = held && onPath(held);
    // (a hook setting with a value is the user's one-line command; reading one, even before ";", is fine)
    const set = cmd.match(/hooks\.mjs["']?\s+setting\s+([\w-]+)[ \t]+([^\s;&|].*)/);
    if (set) add(`REQ: permission-respected. \`hooks.mjs setting\` with a value is the user's command. Edit tools/hooks/config.json yourself; if the host refused that edit, don't write it another way: end the answer with the line for the user to paste, \`! node tools/hooks/hooks.mjs setting ${set[1]} ${set[2].replace(/\s*(&&|;|\|).*$/, '').trim()}\` (docs/playbooks/engine.md).`);
    if (held) add(`REQ: permission-respected. \`${held}\` was held for the user's approval earlier in this turn; running it through another program is the same command without that approval. ${there === false ? `It is also not installed here: \`${held}\` is not on PATH. Say so in the answer ("NOT VERIFIED: <what> - ${held} is not installed on this machine"), not that it only needs approval.` : `Leave it: say in the answer what was not verified ("NOT VERIFIED: <what> - ${held} was held for approval"), or ask the user to approve it.`}`);
    // REQ: browser-guard (commands)
    if (/(?<!chrome-win(64)?[\\/])(chrome|msedge)\.exe|\bstart\s+(chrome|msedge)\b|Start-Process\s+["']?(chrome|msedge)\b|google-chrome(-stable)?\b|CHROME_BIN=/i.test(cmd))
      add('REQ: browser-guard. Don\'t launch or automate the installed Chrome/Edge (it can lock the user\'s OS account). Use node tools/screenshot.mjs or Playwright\'s bundled Chromium.');
    // REQ: shell-hygiene. In Git Bash "> nul" creates a real file named nul that Windows can barely delete.
    if (name === 'Bash' && /[12&]?>>?\s*nul\b/i.test(cmd))
      add('REQ: shell-hygiene. In Bash, "> nul" creates a file literally named "nul". Use > /dev/null instead.');
    // REQ: forbidden-command. Project-defined commands that must never run (e.g. killing the user's own app or port).
    for (const f of cfg.forbiddenCommands) { try { if (re(f.pattern).test(cmd)) add(`REQ: forbidden-command. ${f.reason || 'This command is forbidden in this project.'} (pattern: ${f.pattern})`); } catch { } }
    // REQ: git-safety. History rewrites and force operations need a fresh backup bundle and the user's explicit words.
    const destructive = /\bgit\b[^;&|]*\b(filter-repo|filter-branch|reset\s+--hard|clean\s+-[a-z]*f|branch\s+-D|push\b[^;&|]*(--force|-f\b|\+\w)|rebase\b[^;&|]*-i|reflog\s+expire|gc\s+--prune)/i.exec(cmd);
    if (destructive) {
      const fresh = list(cfg.backupDir).some(n => /\.bundle$/.test(n) && Date.now() - fs.statSync(abs(`${cfg.backupDir}/${n}`)).mtimeMs < 3600_000);
      const asked = re(`\\b(force|reset|rewrite|delete|drop|clean|filter|squash|rebase)\\b`).test(req());
      if (!asked) add(`REQ: git-safety. "${destructive[0].trim()}" can destroy work and the user didn't ask for it in this request. Ask first.`);
      else if (!fresh) add(`REQ: git-safety. Before "${destructive[0].trim()}", back up every ref: mkdir -p ${cfg.backupDir} && git bundle create ${cfg.backupDir}/backup-$(date +%Y%m%d-%H%M%S).bundle --all`);
    }
    // Skipping or re-pointing the git hooks needs the user's own words (a refused commit was retried with --no-verify).
    const skipHooks = /\bgit\b[^;&|]*\b(commit|push|merge)\b[^;&|]*\s--no-verify\b|\bgit\b[^;&|]*\bcommit\b[^;&|]*\s-[a-zA-Z]*n[a-zA-Z]*\b|\bgit\s+-c\s+core\.hooksPath=|\bgit\s+config\b[^;&|]*\bcore\.hooksPath[ \t]+(?!["']?\.githooks\b)[^\s;&|]|\bHUSKY=0\b/i.exec(cmd);
    if (skipHooks && !/\b(no-?verify|skip (the )?(git )?hooks|bypass (the )?hooks|without (the )?hooks|hooks ?path|husky)\b/i.test(req()))
      add(`REQ: git-safety. "${skipHooks[0].trim().slice(0, 80)}" skips or re-points the git hooks (AI attribution, secrets and .gitignore checks). Fix what the hook reported instead; do this only when the user asks for it in their own words.`);
    const pushTo = gitPush(cmd) && /\bgit(?:\s+-[cC]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+push\b([^;&|]*)/i.exec(cmd);
    if (pushTo) {
      const branchArg = cfg.protectedBranches.find(b => re(`(^|[\\s:/])${esc(b)}(\\s|$)`).test(pushTo[1]));
      const current = !branchArg && /\bpush\b\s*($|origin\s*$|-u\s+origin\s*$)/i.test(pushTo[0]) ? (spawnSync('git', ['branch', '--show-current'], { cwd: ROOT, encoding: 'utf8' }).stdout || '').trim() : '';
      const target = branchArg || (cfg.protectedBranches.includes(current) ? current : '');
      // (the user's OK holds for the session; "pushOk": "request" makes it count only in the same message)
      if (target && !re(`\\b${esc(target)}\\b`).test(req()) && !(cfg.pushOk !== 'request' && askedPushEarlier(data.transcript_path, target)))
        add(`REQ: git-safety. This pushes to the protected branch "${target}", and the user didn't name it in this request. Push to the work branch, or ask first.`);
    }
    // REQ: gitignore-ready. A push waits until .gitignore keeps everything private out and everything needed in.
    if (gitPush(cmd)) {
      const gi = gitignoreProblems(cfg);
      if (gi.length) add(`REQ: gitignore-ready. Fix .gitignore before pushing:\n- ${gi.join('\n- ')}`);
    }
    // REQ: publish-gate. Publishing waits for a security review this turn or today (rule 15); quoted text, dry runs don't.
    const pub = /\b(npm|pnpm|yarn)\s+publish\b|\bgh\s+release\s+create\b|\bgh\s+repo\s+(create\b[^\n;&|]*--public|edit\b[^\n;&|]*--visibility[= ]public)|\b(vercel|netlify)\b[^\n;&|]*--prod\b|\bfirebase\s+deploy\b|\bdocker\s+push\b|\btwine\s+upload\b|\bcargo\s+publish\b|\b(dart|flutter)\s+pub\s+publish\b|\b(poetry|uv)\s+publish\b|\bgem\s+push\b|\bfastlane\s+\w*(deliver|release|upload|beta)\b|\bhf\s+upload\b|\bhuggingface-cli\s+upload\b|\bvsce\s+publish\b|\bflyctl?\s+deploy\b|\bwrangler\s+(deploy|publish)\b/i.exec(runText(cmd));
    if (pub && !/(^|\s)--dry-run\b/.test(cmd) && !isSuspended('check:publish-gate')) {
      const reviewed = toolUses(t().entries || []).some(u => (u.name === 'Skill' && /(^|:)security-review$/.test(String(u.input.skill || ''))) || (u.name === 'Read' && /skills[\\/]security-review[\\/]SKILL\.md$/i.test(String(u.input.file_path || ''))));
      const loggedToday = new RegExp(`^\\|\\s*${esc(today())}\\s*\\|`, 'm').test(read(abs('docs/security.md')));
      if (!reviewed && !loggedToday) add(`REQ: publish-gate. "${pub[0].trim()}" publishes or deploys. Run the security-review skill first (skills/security-review/SKILL.md) and log it in docs/security.md, then publish (hard rule 15). The user's OK to publish is needed too (rule 6).`);
    }
    // REQ: no-secrets. Printing a secrets file leaks it to the chat; "git add -f" puts an ignored one in history.
    const readsSecret = new RegExp(`(^|[\\s;&|(])(cat|type|Get-Content|gc|less|more|head|tail|bat|nl|strings|xxd|od|findstr|sed\\s+-n|awk)\\b[^;&|\\n]*${SECRET_IN_CMD.source}`, 'i');
    if ((readsSecret.test(cmd) || /open\(\s*\\?["'][^"']*\.env\\?["']/.test(cmd)) && !SECRET_ASKED.test(req())) add(secretReadMsg((SECRET_IN_CMD.exec(cmd) || [, , 'that file'])[2]));
    if (/\bgit\s+add\b[^;&|\n]*(\s-f\b|--force)/i.test(cmd) && SECRET_IN_CMD.test(cmd))
      add('REQ: no-secrets. "git add -f" on a secrets file puts it into the history even though .gitignore keeps it out. Commit .env.example with empty values instead.');
    // REQ: no-secrets. Nothing that looks like a key or private key gets committed.
    if (/\bgit\b[^;&|]*\b(commit|push)\b/i.test(cmd)) {
      const staged = spawnSync('git', ['diff', '--cached', '-U0'], { cwd: ROOT, encoding: 'utf8' }).stdout || '';
      const added = staged.split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).join('\n');
      const hit = secretHit(added, cfg) || secretHit(cmd, cfg);
      if (hit) add(`REQ: no-secrets. The staged changes contain something that looks like a secret (pattern ${hit}). Unstage it, move it to an ignored file (.env), and make sure .gitignore covers it.`);
      const names = /\bcommit\b/i.test(cmd) ? (spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: ROOT, encoding: 'utf8' }).stdout || '').split(/\r?\n/).filter(Boolean) : [];
      // REQ: approval-gate. Taste-driven work is committed only after the user has seen it and said yes.
      const needOk = names.filter(n => match(n, cfg.approvalPaths));
      if (needOk.length && !/\b(approve[sd]?|looks good|lgtm|ship it|commit (it|this|them)|go ahead|that's good|perfect)\b/i.test(req()))
        add(`REQ: approval-gate. ${needOk.slice(0, 5).join(', ')} need the user's OK before commit. Show Before / Now and ask.`);
      // REQ: commit-gate. Project gates (tests, build) must have PASSED this turn before a commit of the files they cover.
      if (/\bcommit\b/i.test(cmd) && cfg.commitGate.length) {
        const runs = runsOf(t().entries);
        for (const g of cfg.commitGate) {
          if (g.when && !names.some(n => match(n, g.when))) continue;
          const last = runs.filter(r => re(g.cmd).test(cmdHead(r.cmd))).pop();
          const res = last && gateResult(last, { pass: g.pass ?? '' });
          if (t().toolsKnown && (!last || !res.ok)) {
            // (the gate shown as a command to run, its own && chain included)
            add(`REQ: commit-gate. Before committing, run this gate and get a PASS this turn: ${String(g.cmd).replace(/^\^|\$$/g, '').replace(/\\(.)/g, '$1')}` +
              ` (exactly as written, its own && included; nothing else before or after it with ; or |)${last ? `. The last run did not pass: ${res.why}` : ''}.`);
            break;
          }
        }
      }
    }
    // REQ: no-ai-attribution. Commits, pushes, PRs, issues and releases are solely the user's.
    if (/\bgit\b[^;&|]*\bcommit\b|\bgh\s+(pr|issue|release)\s+(create|edit|comment|merge)\b|\bgit\b[^;&|]*\b(tag\s+-[am]|notes)\b/i.test(cmd) && re(cfg.aiAttribution).test(cmd))
      add('REQ: no-ai-attribution. This text credits an AI agent (co-author trailer, "generated with", AI email or robot emoji). Remove it: commits, PRs and releases are solely the user\'s.');
    if (/\bgit\b[^;&|]*\bcommit\b[^;&|]*--author[= ]["']?[^"']*/i.test(cmd) && re(cfg.aiAuthor).test(/--author[= ]["']?([^"']*)/i.exec(cmd)?.[1] || ''))
      add('REQ: no-ai-attribution. Don\'t set an AI as the commit author. Commits are authored by the user\'s own git identity.');
    if (gitPush(cmd)) {
      const bad = aiAttributedCommits(cfg);
      if (bad.length) add(`REQ: no-ai-attribution. Unpushed commits credit an AI agent: ${bad.slice(0, 5).join(', ')}. Reword them (message and author) before pushing. Ask the user first if rewriting history affects anyone else.`);
    }
    // REQ: outward-gate. Sending, posting, pushing, issues and PRs need the user's OK (rule 6); after attribution.
    const outward = outwardCommand(cmd);
    // (a git push the user OK'd earlier in the session counts here too, as in git-safety)
    const pushOkEarlier = () => /\bgit\b[^;&|]*\bpush\b/i.test(outward) && cfg.pushOk !== 'request'
      && askedPushEarlier(data.transcript_path, (/(?::|\s)([\w./-]+)\s*$/.exec(outward.replace(/\s+\d?>.*$/, '').trim()) || [])[1]?.replace(/^.*:/, '') || 'main');
    if (outward && !isSuspended('check:outward-gate') && !re(cfg.outwardOk).test(req()) && !pushOkEarlier())
      add(`REQ: outward-gate. "${outward.trim().slice(0, 80)}" acts outside the project (${outwardWhat(outward)}). Rule 6: that needs the user's OK in this request. Draft it instead and ask, or run it once they say so.`);
    // REQ: setup-interview / setup-complete. During setup nothing installs before the user answered (real runs only).
    if (exists('SETUP-PROMPT.md') && !exists('.starter-template')) {
      const ran = cmd.replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\2\b/g, '').replace(/echo\s+(["'])[\s\S]*?\1/g, '');
      const step = /\bnode\s+(?:"[^"\n]*?|'[^'\n]*?|[^\s"']*?)(packs\.mjs["']?\s+install|skills\.mjs["']?\s+enable|starter\.mjs["']?\s+(link|keep|remove))\b/.exec(ran);
      if (step) {
        // (answers this same command writes count: it records the interview, then installs)
        const writes = /setup interview/i.test(cmd) ? new Set([...cmd.matchAll(/^\s*-\s*\*{0,2}([^:*\n]+?)\*{0,2}:\s*\S/gm)].map(m => m[1].trim().toLowerCase())) : new Set();
        const LIST = /^docs\/DECISIONS\.md "## Setup interview": (?:record the user's answer for|decide and record) (.+?)(?: yourself)?\s*\("/;
        const covered = p => { const m = LIST.exec(p); return !!m && m[1].split(/,\s*/).every(k => writes.has(k.trim().toLowerCase())); };
        const probs = setupCompleteness(cfg, { final: /starter\.mjs/.test(step[1]), beforeStarter: true, decide: AUTONOMY_WORDS.test(req()) }).filter(p => !covered(p));
        if (probs.length) add(`REQ: setup-${/starter\.mjs/.test(step[1]) ? 'complete' : 'interview'}. Not yet:\n- ${probs.join('\n- ')}`);
      }
    }
    // REQ: setup-gate. SETUP-PROMPT.md is deleted only when the project is really set up and verified.
    if (/(^|[\s;&|(])(rm|del|erase|Remove-Item|ri|unlink|mv|move|Move-Item|Rename-Item|ren|git\s+rm)\b[^;&|]*SETUP-PROMPT\.md/i.test(cmd)) {
      if (exists('.starter-template')) add(`REQ: setup-gate. This is the ${names().STARTER_NAME || 'project'} starter itself: SETUP-PROMPT.md stays here (new projects get a copy).`);
      else {
        const probs = setupProblems(cfg);
        // (an audit sent to a file is read from that file, and a helper's audit counts too)
        const audited = runsOf(inTimeOrder(t().entries, t().helperEntries)).some(r => /audit\.mjs/.test(r.cmd) && /--(full|setup)/.test(r.cmd) && /audit: PASS/.test((redirectedRun(r, /audit\.mjs/, t().since || 0) || r).out));
        if (!audited) probs.push('run node tools/audit.mjs --setup in this turn and get "audit: PASS"');
        if (probs.length) add('REQ: setup-gate. Setup is not finished, so SETUP-PROMPT.md stays:\n- ' + probs.join('\n- '));
      }
    }
    // REQ: scope-separate (commands). A waiver's reason may name the folder it is about: waive reads and writes no data.
    const who = /^\s*node\s+["']?(\.\/)?tools[\\/]hooks[\\/]hooks\.mjs["']?\s+waive\s/.test(cmd) && !/[;&|<>`]|\$\(/.test(cmd.replace(/"[^"\n]*"|'[^'\n]*'/g, '')) ? [] : pathsPeople(cmd, cfg).filter(n => ppl.some(x => x.name === n));
    if (who.length) { const writing = /(^|[\s;&|(])(rm|del|mv|move|cp|copy|Remove-Item|Move-Item|Copy-Item|Set-Content|Out-File|Add-Content|tee|sed\s+-i)\b|>/.test(cmd); add(scopeCheck(who, writing)); }
    // REQ: whole-output. A lookup tool's own output (not its --help) is read whole, not through a filter.
    for (const tool of cfg.wholeOutputTools) {
      const stripped = cmd.replace(/\s2>&1|\s2>\s*\/dev\/null|\s2>\$null/g, '');
      const runsTool = p => re(`^(?:\\w+=\\S*\\s+)*(?:(?:\\S*[\\\\/])?(?:python3?|py|node|bash|sh|pwsh|powershell|ruby|perl|deno|bun|tsx|uv\\s+run)(?:\\.exe)?\\s+(?:-\\S+\\s+)*)?["']?(?:\\.[\\\\/])?(?:\\S*[\\\\/])?${esc(tool.split('/').pop())}\\b`).test(p.trim());
      const { parts, ops } = shellParts(stripped);
      const piped = parts.some((p, i) => runsTool(p) && p.includes(tool.split('/').pop()) && !/(^|\s)(-h|--help|-\?|\/\?)(\s|$)/.test(p) && ops[i] === '|' && /^(head|tail|grep|egrep|rg|cut|sed|awk|findstr|Select-String|Select-Object|sort|uniq|less|more)\b/i.test(parts[i + 1] || ''));
      if (stripped.includes(tool) && piped)
        add(`REQ: whole-output. Read the output of ${tool} whole: don't pipe it into a filter. Write it to a file in .cache/ and Read that if it is long.`);
    }
    // REQ: protect-originals. Adding INTO a protected folder is fine, removing or overwriting is not (in-project parts
    // only; inline code and quoted prose are no command; the project's own folder, not a same-named nested one).
    const prose = c => String(c).replace(/(?<!(?:-c|-lc|\/c|eval|-Command)\s+)("[^"\n]*?(?:\s+[^\s"]+){3,}[^"\n]*"|'[^'\n]*?(?:\s+[^\s']+){3,}[^'\n]*')/gi, '""');
    const here = cfg.protectedOriginals.length ? inProjectParts(prose(inlineCodeOut(cmd))) : cmd;
    const rootP = [...new Set([ROOT, ROOT.replace(/\\/g, '/')])].map(r => esc(r.replace(/[\\/]+$/, ''))).join('|');
    for (const g of here.trim() ? cfg.protectedOriginals : []) {
      const d = g.replace(/\/?\*\*.*$/, ''), cmd = here;
      if (!d) continue;
      const P = `["']?(?:\\.[\\\\/]|(?:${rootP})[\\\\/])?${esc(d)}(?:[\\\\/]|["'\\s;|&]|$)`;
      const hits = [
        `(^|[\\s;&|(])(rm|del|erase|rmdir|rd|Remove-Item|ri|Clear-Content|truncate|shred|unlink)\\b[^;&|]*?(\\s|^)${P}`,
        `(^|[\\s;&|(])(mv|move|Move-Item|Rename-Item|ren)\\s+(-{1,2}\\S+\\s+)*${P}`,
        `(^|[^<>2&])>{1,2}\\s*${P}`,
        `(^|[\\s;&|(])(Set-Content|Out-File|Add-Content|tee)\\b[^;&|]*?(\\s|^)${P}`
      ].map(b => re(b).test(cmd));
      // (sed -i edits only its file arguments, not its script)
      hits.push(sedInPlaceFiles(cmd).some(f => re(`^${P}`).test(f)));
      const bad = hits.some(Boolean);
      // (a glob narrower than its folder protects only the paths it matches; a folder the command names still counts)
      if (bad && !/^(\*\*(\/\*)?)?$/.test(g.slice(d.length + 1))) {
        const top = `${ROOT.replace(/\\/g, '/').replace(/\/+$/, '')}/`.toLowerCase();
        const named = [...cmd.matchAll(/"([^"\n]*)"|'([^'\n]*)'|([^\s;&|<>()]+)/g)].map(m => (m[1] ?? m[2] ?? m[3]).replace(/\\/g, '/'))
          .map(p => (p.toLowerCase().startsWith(top) ? p.slice(top.length) : p).replace(/^\.\//, '')).filter(p => p === d || p.startsWith(`${d}/`));
        if (named.length && !named.some(p => match(p, [g]) || match(`${p}/x`, [g]) || !/\.\w+$/.test(p.split('/').pop()))) continue;
      }
      // (a plain delete of files this turn made, or of the session's own still uncited downloads, is not of originals)
      if (bad && hits[0] && !hits.slice(1).some(Boolean) && deletesOnlyNewFiles(cmd, d)) continue;
      if (bad && (hits[0] || hits[1]) && !hits.slice(2).some(Boolean) && sessionOwnFiles(cmd, d, t())) continue;
      const top0 = `${ROOT.replace(/\\/g, '/').replace(/\/+$/, '')}/`.toLowerCase();
      const inD = () => [...cmd.matchAll(/"([^"\n]*)"|'([^'\n]*)'|([^\s;&|<>()]+)/g)].map(m => (m[1] ?? m[2] ?? m[3]).replace(/\\/g, '/'))
        .map(p => (p.toLowerCase().startsWith(top0) ? p.slice(top0.length) : p).replace(/^\.\//, '')).filter(p => p.startsWith(`${d}/`));
      // (a rename's new name need not be listed: only what it moves or removes)
      const approved = bad && !hits.slice(2).some(Boolean) && listedAll(hits[1] && !hits[0] ? inD().slice(0, -1) : inD(), hits[1] ? /\b(rename|move|mv)\b/i : /\b(delete|remove|rm|trash|erase|clean ?up|get rid of)\b/i);
      if (bad && !approved && !re(cfg.deleteWords).test(req()))
        add(`REQ: protect-originals. This command could delete, move or overwrite files in ${d}/ (originals). Only do that when the user asked for it in this request; copying new files INTO ${d}/ is fine. For exact duplicates, run node tools/dedupe.mjs (it keeps the oldest copy).`);
    }
    // Removing an output or original from before this turn is overwriting it (rm then Write); new files stay free.
    const strict = cfg.newVersionOnly || [];
    if ((cfg.noOverwrite.length || strict.length || cfg.protectedOriginals.length) && /(^|[\s;&|(])(rm|del|erase|unlink|rmdir|rd|Remove-Item|ri|mv|move|Move-Item|mi|Rename-Item|ren)\b/i.test(prose(cmd))) {
      const gone = removedPaths(prose(cmd), [...cfg.noOverwrite, ...strict, ...cfg.protectedOriginals]).filter(p => !madeThisTurn(p, t(), cfg));
      // (a plain delete the request asks for, naming the file or the old drafts, is allowed; rewriting stays blocked)
      const OLD_ONES = /\b(old|older|previous|earlier|draft|unused|duplicate|extra|stale)\s+(files?|versions?|drafts?|cop(y|ies)|lists?)\b|\b(drafts|previous versions)\b/i;
      const plainDelete0 = !/(^|[\s;&|(])(mv|move|Move-Item|mi|Rename-Item|ren)\b/i.test(prose(cmd));
      const plainDelete = re(cfg.deleteWords).test(req()) && plainDelete0;
      const FILE_DELETE = /\b(delete|remove|get rid of|trash|erase|clean ?up)\s+(the\s+|that\s+|this\s+|those\s+|these\s+|my\s+)?([\w.'-]+\s+){0,3}(files?|versions?|drafts?|cop(y|ies)|duplicates?)\b/i;
      const askedDelete = () => plainDelete && (OLD_ONES.test(req()) || FILE_DELETE.test(req()));
      // (originals named by a pattern alone, such as "**/*.pdf"; folders are checked above)
      const dirs = cfg.protectedOriginals.map(g => g.replace(/\/?\*\*.*$/, '')).filter(Boolean);
      const orig = gone.filter(p => match(p, cfg.protectedOriginals) && !dirs.some(d => p.startsWith(d + '/')) && !/(^|\/)README\.md$/i.test(p));
      if (orig.length && !re(cfg.deleteWords).test(req()))
        add(`REQ: protect-originals. This command deletes or moves ${orig.slice(0, 3).join(', ')}${orig.length > 3 ? ` and ${orig.length - 3} more` : ''}, an original that was there before this turn. Originals are never removed unless the user asked for it in this request. Put derived or corrected content in docs/ or outputs/ and link the original.`);
      // (config "deleteOk": globs the project declares deletable without asking; a plain delete only)
      const deletable = p => plainDelete0 && match(p, cfg.deleteOk || []);
      const outs = gone.filter(p => !askedDelete(p) && !deletable(p) && (match(p, strict) || (match(p, cfg.noOverwrite) && !re(cfg.overwriteWords).test(req()) && !asksToChange(p, req()))));
      if (outs.length)
        add(`REQ: no-overwrite. This command deletes or moves ${outs.slice(0, 3).join(', ')}${outs.length > 3 ? ` and ${outs.length - 3} more` : ''}, a delivered output that was there before this turn, and the request does not name it as a file to change or delete. ` +
          'Removing it and writing it again is the same as writing over it. If the user asked for a new version, write it as a new file (e.g. "<name> v2.md"); if they asked to change or delete this file, in words the hook did not catch, ask them in one line to confirm.');
    }
  }
  return out;
}
