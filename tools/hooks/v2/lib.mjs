// Engine v2: shared pieces for the start reminder and the end check. A runbook's "Done when" list is the turn's
// requirements: the start hook shows it, the end hook checks the items it can check against this session's own
// transcript (never the git state of a shared folder). Plan: docs/plans/2026-11-05-engine-v2.md.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { roots, resolver } from '../paths.mjs';
import { people, personOf, peopleIn, peopleFor } from '../people.mjs';

export const ROOT = process.env.ANZUELO_ROOT || process.cwd();
// (where each file is: in a project with the engine in .anzuelo/engine, runbooks and skills come from the local copy
// and the engine's, the records from .anzuelo/local; anywhere else every path is under ROOT, as before. Plan:
// docs/plans/2026-11-07-engine-outside-the-project.md)
const HERE = roots(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), {});
export const LAYOUT = HERE.split ? { ENGINE: HERE.ENGINE, PROJECT: ROOT, LOCAL: path.join(ROOT, '.anzuelo', 'local'), split: true } : { ENGINE: ROOT, PROJECT: ROOT, LOCAL: ROOT, split: false };
const { where: at, relOf, listAll } = resolver(LAYOUT);
export { at };
const RUNBOOK_DIRS = ['docs/playbooks', 'tools/starter/runbooks'];
// (Windows line endings read as plain ones: a runbook saved with CRLF had no header the router could see. Lesson
// (replay): most of a project's runbooks were invisible to routing)
const read = f => { try { return fs.readFileSync(at(f), 'utf8').replace(/\r\n?/g, '\n'); } catch { return ''; } };

// "## Done when" items. A checkable item ends with one of:
//   (file: <path or glob>)   the turn changed that file (Edit, Write, or a command that names it as its output)
//   (ran: <regex>)           the turn ran a command matching it, and the run did not fail
//                            ("<regex> => <output regex>": and it printed that, e.g. a test's pass line)
//   (answer: <regex>)        the turn's final answer matches it
//   (prompt: <regex>)        what the user typed this turn matches it (mid-turn messages too)
//   (tool: <regex>)          a tool call's name and input match it
//   (evidence)               the answer is backed by sources read this turn (evidenceGaps)
// Each kind also works as a condition, "(when answer: <regex>)"; several conditions must all hold.
// Anything else is shown at the start and not checked at the end.
// The project's own standing rules that belong to no single runbook live in ALWAYS's "## Done when", checked every
// turn. Lesson (a field report): a project's rule kept in requirements.json looked enforced and was not read by v2.
export const ALWAYS = 'docs/checks/always.md';
export function alwaysGaps(acts) {
  return doneWhen(read(ALWAYS)).filter(it => it.kind && it.kind !== 'evidence' && applies(it, acts) && met(it, acts) === false).map(it => `${ALWAYS} item ${it.n}: ${it.text}`);
}
export function doneWhen(text) {
  // (Windows line endings too: "## Done when\r" matched nothing. Lesson (a project's report): any caller passing a
  // runbook's raw text got no items)
  const m = /^##\s+Done when\s*$([\s\S]*?)(?=^##\s|(?![\s\S]))/im.exec(String(text).replace(/\r\n?/g, '\n'));
  if (!m) return [];
  // (an item wraps onto indented lines: they belong to it)
  const items = [];
  // (a comment is for whoever edits the runbook, never part of the item. Lesson (trial v38): a lesson comment about a
  // past trial was shown in every project's reminder, word for word)
  for (const l of m[1].replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const start = /^\s*(?:\d+\.|[-*])\s+(?:\[[ x]\]\s*)?(.+)$/.exec(l)?.[1];
    if (start) items.push(start.trim());
    else if (items.length && /^\s+\S/.test(l)) items[items.length - 1] += ' ' + l.trim();
  }
  return items.map((raw, i) => {
    // (a marker's value may hold one level of brackets, such as a regex group. Lesson (a project's report): a ")" in
    // the value cut the marker short)
    // (the last marker anywhere in the item. Lesson (a field report): a marker on the first line of a two-line item
    // was not read)
    // (three levels: a "not this" pattern around a group, ^(?![\s\S]*(?:a (b|c))), needs them. Lesson (a project's
    // converted rules))
    const VAL = String.raw`((?:[^()]|\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))+)`;
    const c = [...raw.matchAll(new RegExp(String.raw`\((file|ran|answer|prompt|tool):\s*${VAL}\)`, 'gi'))].at(-1);
    // (an item that fits one branch of a runbook says when: "(when ran: <regex>)" and the like. On a turn where that
    // did not happen it is neither checked nor listed. Several "when" markers must all hold. Lesson (replay): an engine
    // upgrade turn was asked to verify the install, removal and setting items too)
    const w = [...raw.matchAll(new RegExp(String.raw`\(when\s+(file|ran|answer|prompt|tool):\s*${VAL}\)`, 'gi'))];
    // (every marker goes from the shown text: an item may carry the old engine's "(hook: ...)" or "(judgment: ...)"
    // before v2's own)
    // ("(evidence)": the answer is backed by sources read this turn, checked by evidenceGaps)
    const ev = !c && /\(evidence\)/i.test(raw);
    const text = raw.replace(new RegExp(String.raw`\s*\((?:when\s+)?(?:file|ran|answer|prompt|tool|hooks?|judgment):${VAL.replace('+)', '*)')}\)|\s*\(evidence\)`, 'gi'), '').replace(/\s*\.\s*$/, '').replace(/`/g, '').trim();
    const whens = w.map(x => ({ kind: x[1].toLowerCase(), arg: x[2].trim() }));
    return { n: i + 1, text, kind: c ? c[1].toLowerCase() : ev ? 'evidence' : null, arg: c ? c[2].trim() : null, when: whens[0] || null, whens };
  });
}

export function runbooks() {
  const out = [];
  for (const d of RUNBOOK_DIRS) {
    let names = []; try { names = listAll(d); } catch { continue; }
    for (const f of names.filter(f => f.endsWith('.md') && !f.startsWith('_'))) {
      const file = `${d}/${f}`, text = read(file), fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] || '';
      const triggers = (/^triggers:\s*(.+)$/m.exec(fm)?.[1] || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 2);
      const menu = (/^menu:\s*(.+)$/m.exec(fm)?.[1] || '').split(/[,\s]+/).map(s => s.trim().toUpperCase()).filter(s => /^[A-Z]\d{1,2}$/.test(s));
      // (the skills it hands its steps to: its own mirror, and each skills/<name>/SKILL.md its text names)
      const skills = [...new Set([`skills/${f.replace(/\.md$/, '')}/SKILL.md`, ...[...text.matchAll(/\bskills\/[\w-]+\/SKILL\.md\b/g)].map(m => m[0])])];
      out.push({ name: f.replace(/\.md$/, ''), file, triggers, menu, items: doneWhen(text), skills, front: fm });
    }
  }
  return out;
}
// The skills with a route of their own (skills/<name>/SKILL.md with triggers): not a runbook's mirror, not generated,
// not a part of a runbook ("runbook:"). Lesson (trial v44): "what was our best week, and what drove it?" matched the
// data-analysis skill's own triggers, and the reminder named nothing, as v2 read only the runbooks.
// ({ parts: true }: also a skill that is part of a runbook and has checkable items, for the end check. The agent picks
// it, and once opened its items hold. Lesson (2026-11-08): the upset and rule skills are parts of a runbook, so once
// keyword forcing was retired, nothing checked that their lesson or rule was stored)
export function skillBooks({ parts = false } = {}) {
  const own = new Set(runbooks().map(b => b.name)), out = [];
  let names = []; try { names = listAll('skills'); } catch { return out; }
  for (const n of names.filter(n => !own.has(n))) {
    const file = `skills/${n}/SKILL.md`, text = read(file), fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] || '';
    if (!fm || /^generated:\s*true/m.test(fm)) continue;
    const triggers = (/^triggers:\s*(.+)$/m.exec(fm)?.[1] || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 2), items = doneWhen(text);
    if (/^runbook:/m.test(fm) ? parts && items.some(it => it.kind) : triggers.length) out.push({ name: n, file, triggers, menu: [], items, skills: [] });
  }
  return out;
}

// The runbook whose trigger phrase matches the request best: a phrase that opens the request wins, then the longest
// whole-phrase match. (Lesson (live v2): a request that opened with its job's name went to another runbook because a
// longer phrase of a sub-step appeared later in it)
const STANDING = /(?:^|[.!?;]\s+)(?:every|each|all|no) (?:new |single )?[\p{L}-]+ (?:links?|has|have|gets?|goes|go|must|should|needs?|stays?|uses?|keeps?|ends?|starts?|names?|includes?|is always|are always|is never|are never)\b/iu;
export function route(prompt, books = runbooks()) {
  // (a menu code at the start, "B4 <args>", names its runbook outright)
  const code = /^\s*([A-Za-z]\d{1,2})(?=\s|$)/.exec(String(prompt))?.[1]?.toUpperCase();
  const byCode = code && books.find(b => b.menu.includes(code));
  if (byCode) return { ...byCode, matched: code };
  // (an engine upgrade goes to the engine runbook, where its checklist is, whatever the fixes it describes say. Not in
  // the starter, where an upgrade message is a project's report back. Lesson (replay): every upgrade message the starter
  // sent a project routed to the project runbook on words like "audit" in its list of fixes)
  const eng = books.find(b => b.file === 'docs/playbooks/engine.md');
  if (eng && !fs.existsSync(at('.starter-template')) && /\bstarter\.mjs\s+(update|upgrade)\b|\bengine upgrade\b|\b(upgrade|update)\s+(the\s+|this\s+|your\s+)?(engine|starter)\b|\b(upgrade|update)\s+to\s+(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,40}\b|\blinked starter copy\b|\bactualiza\w*\s+(el\s+)?(motor|starter)\b/i.test(String(prompt))) return { ...eng, matched: 'engine upgrade' };
  const match = text => {
    const p = ` ${String(text).toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ')} `;
    let best = null;
    for (const b of books) for (const t of b.triggers) {
      const phrase = t.replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
      const score = !phrase || !p.includes(` ${phrase} `) ? 0 : (p.startsWith(` ${phrase} `) ? 1000 : 0) + phrase.length;
      if (score && (!best || score > best.score)) best = { book: b, score, phrase };
    }
    return best;
  };
  // (a Spanish request with no trigger of its own routes like its English wording. Lesson (trial v37): Spanish requests
  // got no runbook under v2, while v1's router translated "agrega una página de índice" to "add a page, index page")
  const best = match(prompt) || (isSpanish(prompt) ? match(routeEnglish(prompt)) : null);
  // (a standing rule said plainly ("every new note links to", "should never happen again", ", always", ", siempre") is a
  // rule request, ahead of a trigger found mid-sentence. Lessons (trials v38 to v43): each went unrouted or misrouted)
  const said = isSpanish(prompt) ? `${prompt}\n${routeEnglish(prompt)}` : String(prompt);
  const proj = books.find(b => b.file === 'docs/playbooks/project.md'), rule = proj && (STANDING.test(said) || /\b(that|this|it) (should|must|can) never happen again\b/i.test(said) || /,\s*(always|never)\s*(?:[.!]+|$)/im.test(said));
  if (best && !(rule && best.score < 1000)) return { ...best.book, matched: best.phrase };
  return rule ? { ...proj, matched: 'standing rule' } : null;
}
// Spanish: the common short words outnumber the English ones (as the old engine tells them apart).
const ES_WORDS = /(?<![\p{L}])(el|la|los|las|de|del|en|un|y|es|se|al|lo|que|para|con|por|una|est[aá]|esta|este|mi|tu|todo|pero|como|tiene|quiero|hay|desde|sobre|cada|otra|vez)(?![\p{L}])/giu;
const EN_WORDS = /\b(the|and|to|of|is|that|it|for|with|my|this|you|on|are|please|what|from|have|be)\b/gi;
export const isSpanish = text => { const s = String(text || '').slice(0, 2000), es = (s.match(ES_WORDS) || []).length, en = (s.match(EN_WORDS) || []).length; return es >= 3 && es > en * 2; };
// A Spanish request's common task words in English, for routing only, so runbooks need no Spanish triggers (the old
// engine's map, phrases before the words in them; no word with two common senses, like "carta": letter and menu)
const ROUTE_ES = [
  [/\b(configura|prepara|monta|inicializa)r? (este|el|mi) proyecto\b/, 'set up this project'], [/\b(de ahora en adelante|a partir de ahora|desde ahora)\b/, 'from now on'],
  [/\bnueva regla\b/, 'new rule'], [/\bte (lo )?dije\b/, 'i told you'], [/\b(olvidaste|se te olvid[oó])\b/, 'you forgot'], [/\bpor qu[eé] (lo )?hiciste\b/, 'why did you'],
  [/\b(agrega|añade|agregar|añadir|incluye|pon)\b/, 'add'], [/\b(arregla|corrige|repara|arreglar|corregir)\b/, 'fix'], [/\b(crea|crear|haz|hacer)\b/, 'make'],
  [/\b(cambia|cambiar|modifica)\b/, 'change'], [/\b(quita|elimina|borra|quitar|eliminar|borrar)\b/, 'remove'], [/\b(revisa|revisar|revisión)\b/, 'review'],
  [/\b(publica|publicar|despliega|desplegar)\b/, 'publish'], [/\b(escribe|redacta|escribir|redactar)\b/, 'write'], [/\b(resume|resumir|resumen)\b/, 'summary'],
  [/\b(nuev[oa]s?)\b/, 'new'], [/\bp[aá]ginas?\b/, 'page'], [/\bbot[oó]n(es)?\b/, 'button'], [/\bcolumnas?\b/, 'column'], [/\bcampos?\b/, 'field'],
  [/\bpantallas?\b/, 'screen'], [/\binicio de sesi[oó]n\b/, 'login'], [/\bopci[oó]n(es)?\b/, 'option'], [/\bfunci[oó]n(es)?\b/, 'feature'], [/\b[ií]ndice\b/, 'index'],
  [/\b(error|errores|fallo|fallos)\b/, 'bug'], [/\bpruebas?\b/, 'tests'], [/\bseguridad\b/, 'security'], [/\b(informe|reporte)s?\b/, 'report'],
  [/\bnotas?\b/, 'note'], [/\b(plan|planes)\b/, 'plan'], [/\b(dise[nñ]o)\b/, 'design'], [/\b(datos)\b/, 'data'], [/\b(regla)s?\b/, 'rule'],
  [/\b(una?|el|la|los|las)\b/, 'a'], [/\b(siempre)\b/, 'always'], [/\b(nunca)\b/, 'never'],
].map(([r, v]) => [new RegExp(r.source.replaceAll(String.raw`\b`, String.raw`(?:(?<![\p{L}\p{N}_])(?=[\p{L}\p{N}_])|(?<=[\p{L}\p{N}_])(?![\p{L}\p{N}_]))`), 'giu'), v]);
export const routeEnglish = text => ROUTE_ES.reduce((s, [r, v]) => s.replace(r, v), String(text || ''));

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
export const startsTurn = (rows, i) => {
  const r = rows[i];
  if (typed(r)) return true;
  if (r.type !== 'user' || typeof r.message?.content !== 'string' || r.isCompactSummary) return false;
  for (let j = i + 1; j < rows.length && j <= i + 3; j++) if (rows[j].attachment?.hookEvent === 'UserPromptSubmit') return true;
  return false;
};
export function turnRows(transcript, at = '') {
  const rows = codexRows(tail(transcript).split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean));
  // (live, the turn starts where the prompt hook saw the request: the rows from that time on, and the request's own row
  // just before it. Lesson: guessing the start from row kinds broke on peer messages, notices and helper reports alike)
  const t = Date.parse(at || '');
  if (t) {
    let s = rows.findIndex(r => Date.parse(r.timestamp || '') >= t);
    if (s < 0) s = rows.length;
    for (let j = s - 1; j >= 0 && t - (Date.parse(rows[j].timestamp || '') || 0) < 30_000; j--)
      if (rows[j].type === 'user' && typeof rows[j].message?.content === 'string') { s = j; break; }
    if (rows.some(r => r.timestamp)) return rows.slice(s);
  }
  // (with no saved time, as in a replay: a row the host wrote, such as a message from another session, starts a turn
  // when the prompt hook ran on it. Lesson: a peer's turn of read-only commands reached back to the last typed request)
  let start = 0;
  rows.forEach((r, i) => { if (startsTurn(rows, i)) start = i; });
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
// The transcript of whoever runs "hooks.mjs check" now: a helper shares the session's id, and its transcript (written
// as it calls the command) is newer than the session's own. Lesson (trial v38): a setup helper's check read the
// session's transcript, saw none of the helper's own test runs, and asked for tests, build and screenshots again.
export function callerTranscript(main, sid) {
  const mt = f => { try { return fs.statSync(f).mtimeMs; } catch { return 0; } };
  const dir = path.join(path.dirname(main), sid, 'subagents');
  let best = null; try { for (const f of fs.readdirSync(dir).filter(f => /^agent-[\w-]+\.jsonl$/.test(f))) { const t = mt(path.join(dir, f)); if (!best || t > best.t) best = { f, t }; } } catch { }
  return best && best.t > mt(main) ? { file: path.join(dir, best.f), id: best.f.replace(/^agent-|\.jsonl$/g, '').slice(0, 40) } : { file: main, id: '' };
}
// The commands this session's helpers ran since the turn began (their transcripts sit in <session>/subagents), so a
// test run, build or screenshot a helper made counts for the session's turn. Commands and image reads only: what it edited is
// seen by its files' times. Lesson (trial v40): setup run in a helper as the engine says, then the end check asked
// the session for the tests, build and screenshots the helper had already run.
export function helperRuns(main, sid, since, until = '') {
  const u = Date.parse(until || '') || Infinity, t = Date.parse(since || ''), dir = path.join(path.dirname(main), sid, 'subagents');
  if (!t || path.basename(main, '.jsonl') !== sid) return [];
  let fs_ = []; try { fs_ = fs.readdirSync(dir).filter(f => /^agent-[\w-]+\.jsonl$/.test(f) && fs.statSync(path.join(dir, f)).mtimeMs >= t); } catch { return []; }
  return fs_.flatMap(f => {
    const rows = codexRows(tail(path.join(dir, f)).split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)).filter(r => { const x = Date.parse(r.timestamp || '') || 0; return x >= t && x < u; });
    // (and the screenshots it looked at. Lesson (trial v41): a setup helper took and read screenshots, and the session
    // was asked for them again)
    return turnActs(rows).calls.filter(c => /^(Bash|PowerShell)$/.test(c.name) || (c.name === 'Read' && /\.(png|jpe?g|webp)$/i.test(String(c.input.file_path || ''))));
  });
}
// Helper agents started in the background that have not reported back: a launch whose result says so, until a task
// notice or the helper's hand-back names its id. Lesson (trial v33): the end check judged a turn while its reviewer
// was still working, and the agent answered with filler about unfinished work.
export function helpersRunning(rows) {
  // (in order: a helper resumed after its report runs again until its next one. Lesson (trial v36): a reviewer resumed
  // with SendMessage still counted as done from its first report, and the answer went out before its second)
  const runs = new Set();
  for (const r of rows) {
    for (const m of JSON.stringify(r).matchAll(/<task-id>([\w-]+)<\/task-id>|<agent-message from=\\?"([\w-]+)\\?"/g)) runs.delete(m[1] || m[2]);
    for (const x of Array.isArray(r.message?.content) ? r.message.content : []) {
      if (x?.type !== 'tool_result') continue;
      const out = typeof x.content === 'string' ? x.content : (Array.isArray(x.content) ? x.content.map(c => c?.text || '').join('\n') : '');
      const m = /^\s*Async agent launched successfully[\s\S]{0,400}?agentId:\s*([\w-]+)/i.exec(out) || /"resumedAgentId"\s*:\s*"([\w-]+)"/.exec(out);
      if (m) runs.add(m[1]);
    }
  }
  return [...runs];
}
export const backgroundRunsOf = transcript => backgroundRuns(codexRows(tail(transcript).split('\n').map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)));

// What the turn did: tool calls with their results, and the last text the agent wrote.
export function turnActs(rows) {
  const calls = [], byId = new Map();
  let answer = '', context = '', started = '', heard = '', said = '';
  for (const r of rows) {
    started ||= r.timestamp || '';
    // (what the hooks and the host showed the agent this turn: evidence too, like a version a status line named)
    if (r.attachment) context += JSON.stringify(r.attachment.content ?? r.attachment).slice(0, 20000) + '\n';
    // (REQ: queued-messages: a message typed mid-turn that waited in the queue is part of the request too)
    const qp = r.attachment?.type === 'queued_command' ? r.attachment.prompt : null;
    const qt = Array.isArray(qp) ? qp.filter(b => b?.type === 'text').map(b => b.text).join('\n') : String(qp || '');
    if (qt.trim() && !qt.trim().startsWith('<')) heard += qt.slice(0, 20000) + '\n';
    // (only the conversation's own rows: the host's request copies repeat results with no time. Lesson (trial): a copy
    // erased when each test run ended, and runs that passed after the last change were asked for again)
    if (r.type !== 'user' && r.type !== 'assistant') continue;
    if (r.type === 'user' && typeof r.message?.content === 'string') { context += r.message.content.slice(0, 20000) + '\n'; heard += r.message.content.slice(0, 20000) + '\n'; }
    const c = r.message?.content;
    if (!Array.isArray(c)) continue;
    // (a message the user typed mid-turn comes as a text item beside tool results: heard too)
    if (r.type === 'user') for (const x of c) { const m = x.type === 'text' && /The user sent a new message while you were working:\s*([\s\S]*?)(?:\n\s*This is how Claude Code surfaces|$)/.exec(x.text || ''); if (m) heard += m[1].slice(0, 20000) + '\n'; }
    for (const x of c) {
      if (r.type === 'assistant' && x.type === 'tool_use') { const call = { name: x.name, input: x.input || {}, error: false, out: '', done: 0, at: Date.parse(r.timestamp || '') || 0 }; calls.push(call); byId.set(x.id, call); }
      if (x.type === 'tool_result' && byId.has(x.tool_use_id)) {
        const out = typeof x.content === 'string' ? x.content : Array.isArray(x.content) ? x.content.map(b => b?.text || '').join('\n') : '';
        Object.assign(byId.get(x.tool_use_id), { out: out.slice(-4000), error: !!x.is_error || /\bexit code [1-9]|^Exit code [1-9]/m.test(out), done: Date.parse(r.timestamp || '') || 0 });
      }
      if (r.type === 'assistant' && x.type === 'text' && x.text.trim()) { answer = x.text; said += x.text + '\n'; }
    }
  }
  return { calls, answer, context, started, heard, said };
}

// The user asked for no questions ("autonomy": "auto", or "don't ask me" in this turn's request), and a message of
// this turn still asks some. Every message counts: the user sees each one. Lesson (trial v44): three setups told
// "do not ask me anything" ended a message with "Questions for you", choices the agent was to make itself.
export function questionGaps(acts) {
  const auto = (() => { try { return JSON.parse(fs.readFileSync(at('tools/hooks/config.json'), 'utf8')).autonomy === 'auto'; } catch { return false; } })();
  if (!auto && !/\b(do not|don'?t|never) ask me\b|\bno me preguntes\b/i.test(acts.heard || '')) return [];
  if (!/^\W*Questions? for you\b|^\W*Preguntas? para (ti|usted)\b/im.test(acts.said || acts.answer || '')) return [];
  return ['The user asked for no questions: make each choice yourself and note it as "Assumed: <choice> - <why> - <cost if wrong>". A step only the user can take (an install, a sign-in, a name for git) goes under a Heads-up, not a question; ask only what the rules stop for (an outward action, anything irreversible).'];
}

// The quote check is offered, not forced ("quoteCheck" in config.json; unset: off in a project, on in the starter), and
// runs every time while on. Lesson: some knowledge projects must keep exact quotes.
export const quoteCheckOn = () => { let v; try { v = JSON.parse(fs.readFileSync(at('tools/hooks/config.json'), 'utf8')).quoteCheck; } catch { } return v === true || (v === undefined && fs.existsSync(at('.starter-template'))); };
// A file the turn wrote that copies six or more of the user's words in a row and presents them as the user's (in
// quotes, or on a line naming the user): AGENTS.md rule 14 wants the lesson in general terms. Asked once, at the end,
// only when it happened. Lesson: lessons were written down as the user's own sentences, over a hundred of them.
export function quoteGaps(acts) {
  if (!quoteCheckOn()) return [];
  const words =s => String(s).toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
  // (only what the user typed: pasted text, relayed messages, notices and quoted blocks are someone else's words.
  // Lesson (a sweep of 1,799 real turns): pasted card text quoted in a review and file paths were flagged)
  const own = String(acts.heard || '').replace(/<(pasted_content|cross-session-message|agent-message|task-notification)\b[\s\S]*?<\/\1>/g, ' ')
    .split('\n').filter(l => !/^\s*>/.test(l)).join('\n');
  const heard = words(own);
  if (heard.length < 6) return [];
  const runs = new Set(heard.slice(5).map((_, i) => heard.slice(i, i + 6).join(' ')).filter(r => !/\d/.test(r)));
  const hits = [];
  for (const c of acts.calls || []) {
    if (!/^(Edit|Write|MultiEdit)$/.test(c.name) || c.error) continue;
    const file = String(c.input.file_path || '').replace(/\\/g, '/');
    if (!file || /(^|\/)\.cache\/|\/memory\/|turn-notes|\/scratchpad\//i.test(file)) continue;
    const text = [c.input.new_string, c.input.content, ...(c.input.edits || []).map(e => e.new_string)].filter(Boolean).join('\n');
    // (judged on the file as it is now: a quote reworded later in the turn is gone. Lesson (dogfood): a reworded line
    // was named again at every re-check)
    let now = ''; try { now = ` ${words(fs.readFileSync(path.isAbsolute(file) ? file : at(file), 'utf8')).join(' ')} `; } catch { continue; }
    for (const line of text.split('\n')) {
      // (a quote on a line that names the user as its source: "Lesson (the user): ...", "the user said ...")
      if (!/\b(the user|user said|user asked|user wrote)\b/i.test(line)) continue;
      // (a quote may run on past the end of its line, as in a wrapped comment)
      const quotes = [...line.matchAll(/["“]([^"“”]{20,})(?:["”]|$)/g)].map(m => words(m[1]));
      const run = quotes.flatMap(w => w.slice(5).map((_, i) => w.slice(i, i + 6).join(' '))).find(r => runs.has(r) && now.includes(` ${r} `));
      if (run) { hits.push(`${file.split('/').slice(-2).join('/')}: "${run}..."`); break; }
    }
  }
  return hits.length ? [`The turn wrote the user's own words as a quote (${hits.slice(0, 3).join('; ')}): write the lesson in general terms instead (AGENTS.md rule 14), unless the user asked for that exact text.`] : [];
}

// An engine note ("Issue: ...") shown to the user belongs in the notes file; the answer says it in plain words.
export function noteGaps(acts) {
  if (!/^\W*Issue:\s*(.*\|\s*runbook:|none\s+-)/im.test(acts.said || acts.answer || '')) return [];
  return ['An "Issue:" line is in the answer: it is a note for .cache/turn-notes.md only. Take it out and say in plain words what went wrong and what changes.'];
}

// The files a path or glob names, walked from its fixed part, at most 20,000, skipping bulk folders and build output
// (lessons: 40,000 cache files hid real changes; a site build's rewrite was asked to be screenshotted).
const BULK = new Set(['.git', 'node_modules', '.cache', '.venv', 'venv', '__pycache__', 'dist', 'build', '.next', 'target', '_site', '.nuxt', '.output', '.svelte-kit', 'coverage', 'storybook-static']);
function filesMatching(glob) {
  const g = glob.replace(/\\/g, '/'), rx = globRx(g), base = g.split('/').filter((s, i, a) => !/[*?]/.test(a.slice(0, i + 1).join('/'))).join('/');
  if (!/[*?]/.test(g)) return fs.existsSync(at(g)) ? [g] : [];
  // (in a project with the engine in .anzuelo/, the project walk skips it and the local folder is walked under the same
  // names; the engine's own files are no project work)
  const out = new Set(), walk = (root, d) => { if (out.size > 20000) return; let es = []; try { es = fs.readdirSync(path.join(root, d), { withFileTypes: true }); } catch { return; }
    for (const e of es) { if (e.isDirectory() && (BULK.has(e.name) || (LAYOUT.split && root === ROOT && !d && e.name === '.anzuelo'))) continue; const p = d ? `${d}/${e.name}` : e.name; if (e.isDirectory()) walk(root, p); else if (rx.test(p)) out.add(p); } };
  for (const root of new Set([ROOT, LAYOUT.LOCAL])) walk(root, base);
  return [...out];
}
const globRx = g => new RegExp('^' + g.replace(/\\/g, '/').replace(/[.+^${}()|[\]]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$', 'i');
const relp = p => relOf(p);

// Whether a checkable item was met by what the turn did. Null means it can't be checked here.
// Whether an item fits this turn: always, or when its "(when ...)" condition held.
export const applies = (item, acts) => (item.whens || (item.when ? [item.when] : [])).every(w => met(w, acts) === true);
export function met(item, acts) {
  if (!item.kind) return null;
  // (a marker whose regex does not compile is not checked, never a crash of the whole end check. Lesson (replay of a
  // project's converted rules): one bad pattern stopped every check of the turn)
  if (/^(answer|prompt|tool|ran)$/.test(item.kind)) try { new RegExp(item.arg); } catch { return null; }
  if (item.kind === 'answer') return new RegExp(item.arg, 'i').test(acts.answer);
  // (prompt: what the user typed this turn, mid-turn messages too; tool: a tool call whose name and input match)
  if (item.kind === 'prompt') return new RegExp(item.arg, 'i').test(acts.heard || '');
  if (item.kind === 'tool') { const rx = new RegExp(item.arg, 'i'); return acts.calls.some(c => rx.test(`${c.name} ${JSON.stringify(c.input || {})}`)); }
  if (item.kind === 'evidence') return evidenceGaps(acts).length === 0;
  // ("<command> => <output>": the run also printed that, such as a test's pass line)
  if (item.kind === 'ran') { const [cmd, out] = item.arg.split(/\s+=>\s+/); try { new RegExp(out || ''); } catch { return null; } const rx = new RegExp(cmd, 'i');
    // (output sent to a file, "> .cache/t.txt", is read from that file. Replay: a test run redirected that way passed
    // and was still asked for)
    const printed = c => { const f = /(?:^|\s)1?>{1,2}\s*(["']?)([^\s"'&|;<>]+)\1/.exec(String(c.input.command || ''))?.[2]; return `${c.out || ''}\n${f ? read(f) : ''}`; };
    return acts.calls.some(c => /^(Bash|PowerShell)$/.test(c.name) && rx.test(String(c.input.command || '')) && !c.error && (!out || new RegExp(out).test(printed(c)))); }
  // (changed this turn by a tool or anything since the turn began; only naming it does not count. In the starter its own
  // changelog stands for docs/CHANGELOG.md, the template. Lessons: "cat" met "updated"; 3 re-blocks on a written line)
  if (item.kind === 'file') {
    const since = Date.parse(acts.at || '') || 0;
    // ("a|b": either path or glob)
    const args = item.arg.split('|').map(s => s.trim()).flatMap(a => [a, ...(/^docs\/CHANGELOG\.md$/i.test(a) && fs.existsSync(at('.starter-dev')) ? ['tools/starter/STARTER-CHANGELOG.md'] : [])]);
    return args.some(arg => { const rx = globRx(arg);
      return acts.calls.some(c => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name) && rx.test(relp(c.input.file_path || c.input.notebook_path || '')))
        || (!!since && filesMatching(arg).some(f => { try { return fs.statSync(at(f)).mtimeMs > since; } catch { return false; } })); });
  }
  return null;
}

// A test run: the usual runners, or the project's own test script under any name it is called by (npm test runs
// package.json's "test", so either form counts). Lesson (trial v31): the tests passed through npm test and the check
// still asked three times for its mapped command.
const RUNNERS = /\btest_\w+\.py\b|\b\w+_test\.(py|go)\b|\.test\.(m?js|ts)\b|\b(npm (run )?test|pnpm (run )?test|yarn test|pytest|python -m (pytest|unittest)|go test|cargo test|dotnet test|node --test|vitest|jest|mvn test|gradle test|phpunit|rspec|bundle exec rake test)\b/i;
const testScript = () => { let s = ''; try { s = JSON.parse(fs.readFileSync(at('package.json'), 'utf8')).scripts?.test || ''; } catch { } return /no test specified/.test(s) ? '' : s.trim(); };
// (a run whose output shows a passing test summary is a test run, whatever the command is called: a project's own
// self-test, a check script. Lesson (replay): answers that truly reported "1655 passed" from a project's self-test
// were flagged, because the command was not a known runner)
const PASS_OUT = /\b\d+ (tests? )?passed\b|\bALL PASS\b|\bRESULT:\s*PASS\b|\b0 (failed|failures)\b|\bRan \d+ tests?\b[\s\S]{0,200}\bOK\b|\b\d+ passing\b|\btests? passed\b/i;
const FAIL_OUT = /\b[1-9]\d* (tests? )?(failed|failing)\b|\bFAILED\b|\bnot ok\b/;
export const passedRun = c => /^(Bash|PowerShell)$/.test(c.name) && !c.error && (isTestRun(String(c.input.command || '')) || PASS_OUT.test(c.out || '')) && !FAIL_OUT.test(c.out || '');
// (the project's declared "test" and "build" commands in config.json, top level or under "app", count part by part.
// Lessons: a plain node script matched no runner name; a Go project's command under "app" was not read)
const cfgCmds = keys => { try { const c = JSON.parse(fs.readFileSync(at('tools/hooks/config.json'), 'utf8')); return keys.flatMap(k => [c[k], c.app?.[k]]).filter(s => typeof s === 'string').flatMap(s => s.split(/\s*&&\s*/)).map(s => s.trim()).filter(Boolean); } catch { return []; } };
const declared = () => cfgCmds(['test', 'build']);
// (the declared test command alone, tools/hooks/config.json "test" or "app.test")
const ownTests = () => cfgCmds(['test']);
// (whether a program can start here: a shell word, a path, or a file on PATH)
const SHELL_WORDS = new Set(['cd', 'echo', 'set', 'export', 'true', 'test']);
export const installed = prog => SHELL_WORDS.has(prog) || /[\/\\]/.test(prog) || String(process.env.PATH || process.env.Path || '').split(path.delimiter).filter(Boolean)
  .some(d => ['', ...(process.platform === 'win32' ? String(process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').toLowerCase().split(';') : [])].some(x => { try { return fs.statSync(path.join(d, prog + x)).isFile(); } catch { return false; } }));
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
const changedSince = (acts, rx) => { const since = Date.parse(acts.at || '') || 0; if (!since) return []; if (!walked.has(acts)) walked.set(acts, filesMatching('**/*')); return walked.get(acts).filter(f => rx.test(f) && !/^(\.cache|tools\/hooks\/state)\//.test(f) && (() => { try { const t = fs.statSync(at(f)).mtimeMs; return t > since && ranAt(acts, t); } catch { return false; } })()); };
const mtime = f => { try { return fs.statSync(at(f)).mtimeMs; } catch { return 0; } };
// REQ: scope-separate (rule 11). One person's data never mixes with another's: files of someone the request is not
// about changed this turn, or an answer about one person brings in another's details. A follow-up that names nobody is
// about the latest request that named someone (acts.earlier: the session's earlier requests). Not in the setup turn,
// which makes everyone's folder on purpose. Lesson (the old engine): the guards kept another person's folder closed,
// but nothing stopped their data in the answer.
// The session's requests before this turn (the user's typed prompts in the transcript tail), newest last.
export const earlierPrompts = (text, before) => String(text || '').split('\n').flatMap(l => { let r; try { r = JSON.parse(l); } catch { return []; }
  const c = r.message?.content; return r.type === 'user' && typeof c === 'string' && !c.startsWith('<') && (!before || String(r.timestamp || '') < before) ? [c] : []; }).slice(-5);
// (the settings as this project has them: the engine's defaults, then the project's config.json)
const projectConfig = () => { const j = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; } }; return { ...j(new URL('../defaults.json', import.meta.url)), ...j(at('tools/hooks/config.json')) }; };
export function scopeGaps(acts) {
  const cfg = projectConfig(), ppl = people(cfg, { list: d => { try { return listAll(d); } catch { return []; } }, read, path: at });
  if (!ppl.length || fs.existsSync(at('SETUP-PROMPT.md')) || acts.calls.some(c => /SETUP-PROMPT\.md/.test(String(c.input.command || '')) && /\b(rm|del|Remove-Item|unlink)\b/.test(String(c.input.command || '')))) return [];
  const named = peopleFor(acts.heard || '', acts.earlier || [], ppl);
  const changed = [...acts.calls.filter(c => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name)).map(c => relp(c.input.file_path || c.input.notebook_path || '')), ...changedSince(acts, new RegExp(`^${cfg.scopesRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/`, 'i'))];
  const touched = [...new Set(changed.map(p => personOf(p, cfg)).filter(Boolean))];
  const wrong = touched.filter(n => named.length ? !named.includes(n) : !new RegExp(cfg.ruleRequest, 'i').test(acts.heard || ''));
  if (wrong.length) return [`Files of ${wrong.join(', ')} changed, but this request is ${named.length ? `about ${named.join(', ')}` : 'not about them'}. Undo those changes, or ask the user before keeping them (rule 11: one person's data never mixes with another's).`];
  // (a line of the answer that names the other and says why they belong clears it)
  const why = n => String(acts.answer || '').split('\n').some(l => peopleIn(l, ppl).includes(n) && /\b(belongs?|relevant|needed|compar\w*|on purpose|asked)\b/i.test(l) && /\b(because|since|why|as)\b/i.test(l));
  const others = named.length === 1 ? peopleIn(acts.answer || '', ppl).filter(n => !named.includes(n) && !peopleIn([acts.heard, ...(acts.earlier || [])].join('\n'), ppl).includes(n) && !why(n)) : [];
  return others.length ? [`This request is about ${named[0]}, and the answer also talks about ${others.join(', ')}. Keep each person's details apart: take ${others.join(', ')} out of the answer, or say in one line why they belong here.`] : [];
}
// The project's own declared checks: tools/hooks/config.json "commitGate" entries, a command (a regex) and the files it
// covers. A change to those files asks for that command to pass afterwards.
const gates = () => { try { return JSON.parse(fs.readFileSync(at('tools/hooks/config.json'), 'utf8')).commitGate || []; } catch { return []; } };
// A run that could not start: held for approval, or its program missing.
const CANT_START = /requires? approval|permission|denied|not recognized|command not found|not found|not installed|ENOENT|executable file not found/i;
const cantStart = c => /^(Bash|PowerShell)$/.test(c.name) && c.error && CANT_START.test(c.out || '');
// (the program each step of a command starts: "cd api && go test ./..." starts cd and go)
const programs = cmd => String(cmd).split(/\s*(?:&&|\|\||;)\s*/).map(s => (/^\s*([\w.\/-]+)/.exec(s) || [])[1]).filter(Boolean).map(s => s.toLowerCase());
export function gateGaps(acts) {
  const out = [], since = Date.parse(acts.at || '') || 0;
  // (a declared check whose program could not start this turn is not asked for: the end check cannot make it run.
  // Lesson (trial v36): go was not installed, go test failed to start, and go build and go vet were still asked for)
  const missing = new Set(acts.calls.filter(cantStart).flatMap(c => programs(c.input.command || '')).filter(p => p !== 'cd'));
  for (const g of gates()) {
    const when = [].concat(g.when || []).map(globRx), hit = p => when.some(rx => rx.test(p));
    const edits = acts.calls.map((c, k) => [c, k]).filter(([c]) => /^(Edit|Write|MultiEdit)$/.test(c.name) && hit(relp(c.input.file_path || '')));
    const files = changedSince(acts, { test: hit });
    if (!edits.length && !files.length) continue;
    const lastEdit = Math.max(-1, ...edits.map(([, k]) => k)), lastWrite = Math.max(0, ...files.map(mtime));
    // (a chained command counts part by part: the agent may run its steps one at a time)
    for (const part of String(g.cmd || '').split(/\s*&&\s*/).filter(Boolean)) {
      let rx; try { rx = new RegExp(part, 'i'); } catch { continue; }
      // (a step that is itself a test run is met by any passing test run after the change, however it is spelled.
      // Lesson (trial v34): the declared glob was quoted, the agent's run was not, and passing tests were asked for)
      const after = (c, k) => k > lastEdit && (!lastWrite || c.done > lastWrite), asTest = isTestRun(part.replace(/\\(.)/g, '$1'));
      const ok = acts.calls.some((c, k) => after(c, k) && ((/^(Bash|PowerShell)$/.test(c.name) && !c.error && rx.test(String(c.input.command || ''))) || (asTest && passedRun(c))));
      if (!ok && !programs(part.replace(/\\(.)/g, '$1')).some(p => missing.has(p))) out.push(`Run the project's check \`${part.replace(/\\(.)/g, '$1')}\` after the change, and say the result.`);
    }
  }
  return out;
}
// Check 2: code changed after the last passing test run, or the answer says tests passed and none did this turn.
export function testGaps(acts, history = '') {
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
  const has = f => fs.existsSync(at(f)), pyproject = (() => { try { return fs.readFileSync(at('pyproject.toml'), 'utf8'); } catch { return ''; } })();
  const hasTests = anyRunner || !!testScript() || declared().length > 0 || ['pytest.ini', 'conftest.py', 'tests', 'test', '__tests__', 'spec'].some(has)
    || /\[tool\.pytest/.test(pyproject) || ['**/*_test.go', '**/test_*.py', '**/*_test.py', '**/*.test.js', '**/*.test.mjs', '**/*.test.ts'].some(g => filesMatching(g).length > 0);
  // (a run this turn that could not start, held for approval or missing its program, is not asked for again; with a
  // declared test command only a try of that one counts. Lessons (trials v33 to v44): the same held run, ten times over)
  const mine = ownTests(), cmdOf = c => String(c.input.command || '');
  const cantRun = (mine.length ? i.some(([c]) => cantStart(c) && mine.some(t => cmdOf(c).includes(t))) : i.some(([c]) => cantStart(c) && isTestRun(cmdOf(c))))
    || (mine.length > 0 && mine.some(t => programs(t).some(p => !installed(p))));
  if ((lastCode >= 0 || codeWrite) && hasTests && !cantRun && !passes.some(k => k > lastCode && (!codeWrite || acts.calls[k].done > codeWrite)))
    out.push(mine.length ? `Run the tests after the last code change (this project's command: ${mine.join(' && ')}), and say the result.` : 'Run the tests after the last code change, and say the result.');
  // (only a pass count is a claim; one read this turn may be relayed, and with no code changed an earlier run's count
  // stands. Lessons: relayed results, "I don't know whether they pass", and a true "81 passed" were all held)
  else if (/\b\d+ (tests? )?passed\b/i.test(acts.answer) && !passes.length
    && ![acts.heard || '', ...acts.calls.map(c => c.out)].join('\n').split('\n').some(l => /\b\d+ (tests? )?passed\b|\bALL PASS\b/i.test(l) && !/\b[1-9]\d* (tests? )?fail/i.test(l))
    && !(lastCode < 0 && !codeWrite && [...acts.answer.matchAll(/\b(\d+) (?:tests? )?passed\b/gi)].every(m => new RegExp(`(?<!\\d)${m[1]} (tests? )?passed\\b`, 'i').test(history)))) out.push('The answer says tests passed, but no test run passed in this turn: run them, or correct the answer.');
  return out;
}

// Check 3: a screen changed, and no screenshot taken after the change was looked at. Only in a project that can take
// them (tools/screenshot.mjs). Replay: the old engine's screenshot ask found a real problem in 7 of 13 runs.
const SCREEN = /\.(html?|css|scss|jsx|tsx|vue|svelte|xaml|qml)$|(^|\/)(gui|ui|templates|components)\//i;
// (tests and their fixtures in a gui folder show nothing on screen. Lesson (replay): edits to a gui folder's tests asked
// for screenshots)
const NOT_SCREEN = /^(\.cache|docs|skills|packs|library|tools\/hooks)\/|(^|\/)(node_modules|dist|build|_site|\.next|\.nuxt|\.output|\.svelte-kit|coverage|storybook-static)\/|\.md$|(^|\/)(tests?|fixtures|__tests__)\/|(^|\/)test_[^/]*$|[._-]test\.\w+$/i;
export function screenGaps(acts) {
  if (!fs.existsSync(at('tools/screenshot.mjs'))) return [];
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
  if (!fs.existsSync(at('tools/audit.mjs'))) return [];
  const own = p => STRUCTURE.test(relp(p));
  const i = acts.calls.map((c, k) => [c, k]);
  const lastEdit = Math.max(-1, ...i.filter(([c]) => /^(Edit|Write|MultiEdit)$/.test(c.name) && own(c.input.file_path || '')).map(([, k]) => k));
  const lastWrite = Math.max(0, ...changedSince(acts, { test: own }).map(mtime));
  if (lastEdit < 0 && !lastWrite) return [];
  if (i.some(([c, k]) => k > lastEdit && /^(Bash|PowerShell)$/.test(c.name) && !c.error && /audit\.mjs/.test(String(c.input.command || '')) && /audit: PASS/.test(c.out || '') && (!lastWrite || c.done > lastWrite))) return [];
  if (!run) return ['(the health check would run here)'];
  // (a hard limit: a slow audit never holds the end of a turn. Its time is kept, to see what it costs)
  const t0 = Date.now(), r = spawnSync(process.execPath, [at('tools/audit.mjs')], { cwd: ROOT, encoding: 'utf8', timeout: 30_000 });
  const ms = Date.now() - t0;
  if (r.status === 0 || r.error) { saveTurn('health', { ...loadTurn('health'), ms }); return []; }
  // (a failure reported on an earlier turn, or naming only files this turn did not change, is not this turn's. Lesson:
  // a sweep waiting on the user failed every structural turn)
  const blocks = String(r.stdout || '').split(/\n(?=PASS|WARN|FAIL)/).filter(b => /^FAIL/.test(b));
  const touched = new Set([...acts.calls.filter(c => /^(Edit|Write|MultiEdit)$/.test(c.name)).map(c => relp(c.input.file_path || '')), ...changedSince(acts, { test: () => true })]);
  const others = b => { const named = [...b.matchAll(/^\s+- ([\w./-]+\.\w+):/gm)].map(m => m[1]); return named.length > 0 && named.every(f => !touched.has(f)); };
  const fails = blocks.filter(b => !others(b)).map(b => b.split('\n')[0].replace(/^FAIL\s+/, '').replace(/\s*\(.*$/, '').trim());
  if (!fails.length) { saveTurn('health', { ...loadTurn('health'), ms }); return []; }
  const known = new Set(loadTurn('health').fails || []), fresh = fails.filter(f => !known.has(f));
  saveTurn('health', { fails, ms });
  if (fails.length && !fresh.length) return [];
  return [`The project's health check (node tools/audit.mjs) fails after this change: ${fresh.slice(0, 3).join('; ') || 'see its output'}. Fix it and run it again.`];
}

// Check 5: new facts written into the knowledge base name where they came from. The outcome, not the process: each
// knowledge edit's new text carries a source (a link, a project file, "source:", a footnote, "the user said"), or a
// sources list edited in the same turn does. Replay: the old engine's ask found a real problem in 4 of 7 runs.
const knowledgeDirs = () => { try { return JSON.parse(fs.readFileSync(at('tools/hooks/config.json'), 'utf8')).knowledgeDirs || ['docs/knowledge']; } catch { return ['docs/knowledge']; } };
// ("user reported" too. Lesson (trial v46): a note labelled "(user reported, <date>)" was asked for a source, and the
// fix wrote "Source: the user" beside the label)
const SOURCED = /https?:\/\/|\bsources?\s*:|\[\^[^\]]+\]|\b(the )?user[- ]?(said|told|gave|wrote|reported|says)\b|\bobserved\b|\(from [\w./-]+\)|\b[\w-]+\/[\w./-]+\.(md|txt|csv|json|pdf)\b/i;
// An answer from sources ("(evidence)"): a source read this turn, every cited file or link read, every quote found, and
// the sources named or the search said. The user (2026-11-07): knowledge answers are backed by evidence.
const READS = c => /^(Read|Grep|Glob|WebFetch)$/.test(c.name) || (/^(Bash|PowerShell)$/.test(c.name) && /\b(cat|grep|rg|Get-Content|Select-String|head|tail|sed\s+-n|type)\b/.test(String(c.input.command || '')));
export function evidenceGaps(acts) {
  // (the runbook or skill being followed is the procedure, not a source)
  const all = acts.calls.filter(c => READS(c) && !c.error);
  const reads = all.filter(c => !/(docs\/playbooks|tools\/starter\/runbooks)\/[^/]+\.md$|\/SKILL\.md$/.test(String(c.input.file_path || '').replace(/\\/g, '/')));
  if (!reads.length) return ['Read the sources before answering: nothing was read this turn, so the answer is not backed by evidence.'];
  // (every message of the turn: after a block, the last one is only a note on what changed)
  const ans = String(acts.said || acts.answer || '').replace(/\\/g, '/');
  // (a file the turn changed, or a helper read, is known to it too: only a citation nothing in the turn touched is made up)
  const seen = acts.calls.map(c => [c.input.file_path, c.input.path, c.input.url, c.input.pattern, c.input.command, c.input.prompt].filter(Boolean).join(' ')).join('\n').replace(/\\/g, '/');
  const norm = s => String(s).replace(/[`'"]/g, '').replace(/\/+$/, '');
  const cited = [...new Set([...ans.matchAll(/https?:\/\/[^\s)>\]"'`]+/g)].map(m => m[0].replace(/[.,;:]+$/, '')))];
  const files = [...new Set([...ans.replace(/https?:\/\/\S+/g, ' ').matchAll(/(?:[\w.-]+\/)+[\w.-]+\.(?:md|txt|json|csv|pdf|html?|ya?ml)\b/g)].map(m => m[0]))];
  // (made up: a file that does not exist, or a link nothing in the turn fetched or found; a file read in an earlier turn
  // is fine. Replay (real sessions): "not read this turn" flagged most answers falsely)
  const found = acts.calls.filter(c => c.name === 'WebSearch').map(c => c.out || '').join('\n');
  const unread = [...cited.filter(u => !seen.includes(norm(u)) && !found.includes(norm(u))), ...files.filter(p => !seen.includes(norm(p)) && !fs.existsSync(at(p)) && !filesMatching(`**/${path.basename(p)}`).some(f => f.endsWith(p)))];
  const out = [];
  if (unread.length) out.push(`The answer cites ${unread.slice(0, 3).join(', ')}, which this turn never read or found and which does not exist here: cite only real sources you read.`);
  // (a quote is checked when it sits on a line with a source the turn read: then it must be that source's words)
  const corpus = (reads.map(c => c.out || '').join('\n') + '\n' + reads.filter(c => c.name === 'Read').map(c => { try { return fs.readFileSync(at(c.input.file_path), 'utf8').slice(0, 2e6); } catch { return ''; } }).join('\n')).replace(/\s+/g, ' ').toLowerCase();
  const sourced = l => [...l.matchAll(/https?:\/\/[^\s)>\]"'`]+|(?:[\w.-]+\/)+[\w.-]+\.\w+/g)].some(m => seen.includes(norm(m[0].replace(/[.,;:]+$/, ''))));
  const quotes = ans.split('\n').filter(sourced).flatMap(l => [...l.matchAll(/["“]([^"“”\n]{25,})["”]/g)].map(m => m[1].replace(/\s+/g, ' ').trim())).filter(q => !corpus.includes(q.toLowerCase()));
  if (quotes.length) out.push(`The quote "${quotes[0].slice(0, 60)}" is not in the source cited beside it: quote it word for word, or say it in your own words without quote marks.`);
  // (each fact its own source, beside it: a list of facts whose sources sit in one list at the end can't be traced. The
  // user, 2026-11-07: every output must be accurate)
  const body = String(acts.answer || '').split('\n'), cut = body.findIndex(l => /^\W*(sources?|references?)\b\W*:?/i.test(l.trim()));
  // (every fact line, whatever the count; a line that states no fact, a question or a bare label, does not count)
  const facts = (cut >= 0 ? body.slice(0, cut) : body).filter(l => /^\s*(?:[-*•]|\d+[.)])\s+\S/.test(l) && l.replace(/[^\p{L}]/gu, '').length > 25
    && !/\?\s*$/.test(l) && !/^\s*(?:[-*•]|\d+[.)])\s+\*\*[^*]+\*\*:?\s*$/.test(l));
  const cites = l => /\[\d+\]|https?:\/\/|(?:[\w.-]+\/)+[\w.-]+\.\w+|\b[\w-]+\.(?:md|txt|csv|json|pdf)\b|\b(inference|inferred|not found|not covered)\b/i.test(l);
  const bare = facts.filter(l => !cites(l));
  if (bare.length)
    out.push(`Give each fact its own source beside it (a [n] citation, the file or the link), or label it inference or not found; ${bare.length} fact line${bare.length > 1 ? 's have' : ' has'} neither, such as "${bare[0].trim().slice(0, 60)}".`);
  if (!cited.length && !files.length && !/\bnot (found|covered|in)\b[^.\n]{0,80}\b(in|the)\b|\bnothing recorded in\b/i.test(ans))
    out.push('The answer names no source: give each fact the file or link it came from, or say "not found in <sources searched>", and label anything else as inference.');
  return out;
}

export function knowledgeGaps(acts) {
  const dirs = knowledgeDirs().map(d => d.replace(/\/+$/, '') + '/');
  const isK = r => dirs.some(d => r.startsWith(d)) && !/(^|\/)(README|SOURCES|INDEX)\.md$/i.test(r);
  const sourcesEdited = acts.calls.some(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && /(^|\/)SOURCES\.md$/i.test(relp(c.input.file_path || '')));
  const sourcesWritten = changedSince(acts, { test: r => /(^|\/)SOURCES\.md$/i.test(r) }).length > 0;
  // (only the lines the edit added, and not lines that only link to notes: a link is no fact. Lesson (trial v38): a
  // "Related: [[note]]" line added below a note's old text was asked for a source)
  const linkOnly = l => /^\s*(?:[-*]\s*)?(?:#+\s*)?(?:related|see also|links?)?\s*:?\s*(?:\[\[[^\]]+\]\]|\[[^\]]*\]\([^)]*\)|[,;\s])*$/i.test(l);
  const facts = (t, old = '') => { const was = new Set(String(old).split(/\r?\n/)); return String(t).split(/\r?\n/).filter(l => !was.has(l) && !linkOnly(l)).join('\n'); };
  const bare = [...new Set(acts.calls.filter(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && isK(relp(c.input.file_path || '')))
    .filter(c => { const t = c.input.edits ? c.input.edits.map(e => facts(e.new_string, e.old_string)).join('\n') : facts(c.input.new_string ?? c.input.content ?? '', c.input.old_string); return t.trim().length > 80 && !SOURCED.test(t); })
    .map(c => relp(c.input.file_path)))];
  // (in a live turn, a knowledge file a script wrote: its lines added since the last commit. Lesson (replay): facts
  // merged into the knowledge base by a script were never seen)
  const edited = new Set(acts.calls.filter(c => /^(Edit|Write|MultiEdit)$/.test(c.name)).map(c => relp(c.input.file_path || '')));
  for (const f of changedSince(acts, { test: isK }).filter(f => !edited.has(f) && f.endsWith('.md'))) {
    const d = spawnSync('git', ['diff', '-U0', '--', f], { cwd: ROOT, encoding: 'utf8', timeout: 5000 }).stdout || '';
    const added = facts(d.split('\n').filter(l => /^\+(?!\+\+)/.test(l)).map(l => l.slice(1)).join('\n'));
    if (added.trim().length > 80 && !SOURCED.test(added)) bare.push(f);
  }
  return bare.length && !sourcesEdited && !sourcesWritten ? [`New facts in ${bare.slice(0, 3).join(', ')} name no source: add where each came from (a link read this turn, a project file, or the user).`] : [];
}

// Check 6: security-sensitive code was written (the project's "security-code" pattern in requirements.json) and the
// turn neither ran the security review nor wrote its report. Replay: the ask found a real problem in 3 of 4 runs.
const securitySpec = () => { try { return JSON.parse(fs.readFileSync(at('tools/hooks/requirements.json'), 'utf8')).requirements.find(r => r.tag === 'security-code')?.when?.changedContentMatches || null; } catch { return null; } };
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
    || (/^(Agent|Task)$/.test(c.name) && /security-review/.test(String(c.input.prompt || '')))
    || (c.name === 'Read' && /skills[\\/]security-review[\\/]SKILL\.md$/i.test(String(c.input.file_path || '')))
    || (/^(Edit|Write)$/.test(c.name) && /^docs\/reviews\/security[^/]*\.md$/i.test(relp(c.input.file_path || ''))))
    || changedSince(acts, { test: r => /^docs\/reviews\/security[^/]*\.md$/i.test(r) }).length > 0;
  return reviewed ? [] : [`Security-sensitive code changed (${[...new Set(hit)].slice(0, 3).join(', ')}): run the security review (skills/security-review/SKILL.md) and say its result.`];
}

// Check 7: the answer claims nothing the session can't back: a commit it names exists or appeared in tool output, a file
// it names exists unless it says it went. Labels and judgment are no claims. Evidence is the whole session but the
// agent's own words (lessons: a relayed version was flagged; a made-up commit was "found" in the answer itself).
export const evidenceOf = text => String(text || '').split('\n').filter(Boolean).map(l => {
  try { const r = JSON.parse(l); return r.type === 'assistant' && Array.isArray(r.message?.content) ? JSON.stringify(r.message.content.filter(x => x?.type !== 'text' && x?.type !== 'thinking')) : l; } catch { return ''; }
}).join('\n');
export function claimGaps(acts, history = '') {
  const a = String(acts.answer || ''), seen = acts.calls.map(c => JSON.stringify(c.input) + '\n' + (c.out || '')).join('\n') + (acts.context || '') + history;
  const out = [];
  const hashes = [...new Set([...a.matchAll(/(?<![\w/#-])([0-9a-f]{7,40})(?![\w-])/g)].map(m => m[1]).filter(h => /\d/.test(h) && /[a-f]/.test(h)))];
  const unknown = hashes.filter(h => !seen.includes(h) && spawnSync('git', ['cat-file', '-e', `${h}^{commit}`], { cwd: ROOT, timeout: 5000 }).status !== 0);
  if (unknown.length) out.push(`The answer names commit ${unknown.slice(0, 3).join(', ')}, which no command in this turn showed and this repository does not have: check it, or correct the answer.`);
  const top = p => { try { return fs.existsSync(at(p.split('/')[0])); } catch { return false; } };
  // (an answer with a Finished section names its files there; a path above it may be an example. Lesson (trial v34): a
  // report a later check would write, given as an example, was reported missing)
  const fin = /^\s*(#+\s*|\*\*)Finished\b/im.exec(a), listed = fin ? a.slice(fin.index) : a;
  const paths = [...new Set([...listed.matchAll(/(?:[A-Za-z]:[\\/]|(?<![\w.:/\\-]))((?:[\w.-]+[\\/])+[\w.-]+\.[A-Za-z]{1,5})\b/g)].map(m => m[0].replace(/\\/g, '/')))];
  const missingFiles = paths.filter(p => /^[A-Za-z]:\//.test(p) ? !fs.existsSync(p) : top(p) && !fs.existsSync(at(p)))
    // (a path given as an example, or one the answer says was filed or taken in elsewhere, is no claim that it exists.
    // Lesson (trial v40): "for example inbox/W43.csv" and "W42.csv was taken in ... filed as sources/..." were reported)
    .filter(p => { const n = p.split('/').pop().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), gone = 'delet|remov|retir|renam|moved|filed|archiv|taken in|copied';
      return !new RegExp(`(${gone})\\w*[^.\\n]{0,80}${n}|${n}[^.\\n]{0,80}(${gone}|gone)|(for example|e\\.g\\.|such as|named like|for instance|would be)[^.\\n]{0,30}${n}`, 'i').test(a); });
  // (two file names joined by a slash, "CLAUDE.md/AGENTS.md", are a pair, not a path: a part before the last that is a
  // file here. Lesson (replay 2026-11-07): it was reported missing)
  const isFile = s => { try { return fs.statSync(at(s)).isFile(); } catch { return false; } };
  // (a path git ignores is a file of each machine (agent settings, local rules) that may exist only elsewhere: an
  // answer describing what an install writes there is no claim it is here. Lesson (dogfood): an answer naming the
  // local settings file a project gets was held as made up)
  const ignored = (() => { const rel = missingFiles.filter(p => !/^[A-Za-z]:\//.test(p)); if (!rel.length) return new Set();
    const r = spawnSync('git', ['check-ignore', '--no-index', '--stdin'], { cwd: ROOT, input: rel.join('\n'), encoding: 'utf8', timeout: 5000 });
    return new Set((r.stdout || '').split(/\r?\n/).map(s => s.trim().replace(/\\/g, '/')).filter(Boolean)); })();
  const real = missingFiles.filter(p => !ignored.has(p) && !p.split('/').slice(0, -1).some(s => /\.[A-Za-z]{1,5}$/.test(s) && isFile(s)));
  if (real.length) out.push(`The answer names ${real.slice(0, 3).join(', ')}, which does not exist: check the path, or correct the answer.`);
  // (a "committed" or "pushed" claim is checked only by the commit it names, above, never by its wording. Lesson (live
  // data and replay): word lists for which sentences claim a commit were wrong more often than right, and each miss
  // grew the list)
  return out;
}

// Whether the turn opened the runbook (read it, or ran its skill).
// (reading a skill the runbook hands its steps to counts: its own skill, or one its text names. Lesson (trial v42): a
// complaint followed through learn-from-upset and project-rule, where the project runbook sends it, was asked to open it)
export const opened = (book, acts) => acts.calls.some(c => (c.name === 'Read' && (relp(c.input.file_path || '') === book.file || (book.skills || []).includes(relp(c.input.file_path || ''))))
  || (c.name === 'Skill' && String(c.input.skill || '').replace(/^.*:/, '') === book.name)
  || (/^(Bash|PowerShell)$/.test(c.name) && String(c.input.command || '').includes(book.file)));

// Whether the turn did any work: a file changed, or a command that is not only a read.
// (an edit counts as the project's work only inside the project folder. Lesson (live): a turn whose one edit was a
// memory note outside the project was held for every item of its runbook)
const inRoot = f => { const r = path.relative(ROOT, path.resolve(ROOT, String(f || ''))); return !!f && !r.startsWith('..') && !path.isAbsolute(r); };
export const worked = acts => acts.calls.some(c => /^(Edit|Write|MultiEdit|NotebookEdit)$/.test(c.name) && inRoot(c.input?.file_path || c.input?.notebook_path));

const STATE = () => at('tools/hooks/state');
const stateFile = sid => path.join(STATE(), `v2-turn.${String(sid || 'x').replace(/[^\w-]/g, '').slice(0, 64)}.json`);
// (no session, no record: a run without a session id (the hook timing, a hand run) would share one made-up record)
export const saveTurn = (sid, v) => { if (!sid) return; try { fs.mkdirSync(STATE(), { recursive: true }); fs.writeFileSync(stateFile(sid), JSON.stringify(v)); } catch { } };
export const loadTurn = sid => { if (!sid) return {}; try { return JSON.parse(fs.readFileSync(stateFile(sid), 'utf8')); } catch { return {}; } };
