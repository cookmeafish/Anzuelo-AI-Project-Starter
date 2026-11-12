// A transcript's tool calls and command runs, the engine's run log, and rows in time order; shared by the safety guard
// and the old engine (plan step 1b).
import fs from 'node:fs';
import path from 'node:path';
import { esc } from './settings.mjs';
import { STATE, rel, textOf } from './state.mjs';
// (a foreground command past its timeout: "moved to the background (ID: x)")
export const MOVED_BG = /moved to the background \(ID:?\s*([\w-]+)\)/i;
// tool_use ids a hook or the user denied: they never ran, so they count neither as work done nor as a breach.
export function deniedIds(entries) {
  const ids = new Set();
  for (const r of entries) {
    const c = r.type === 'user' && r.message && r.message.content;
    if (!Array.isArray(c)) continue;
    for (const x of c) {
      if (x && x.type === 'tool_result' && x.is_error &&
          /hook (error|blocked)|denied|permission|doesn'?t want to proceed|rejected|REQ: /i.test(textOf(x.content)))
        ids.add(x.tool_use_id);
    }
  }
  return ids;
}
export function toolUses(entries) {
  const skip = deniedIds(entries), out = [];
  for (const r of entries) {
    const c = r.type === 'assistant' && r.message && r.message.content;
    if (!Array.isArray(c)) continue;
    for (const x of c) if (x && x.type === 'tool_use' && !skip.has(x.id)) out.push({ name: x.name, input: x.input || {} });
  }
  return out;
}
// The run log, for agents whose tool history can't be read ("hooks.mjs run <command>"; the audit and self-tests record
// themselves). Lesson: without a transcript, the Stop hook ran the whole self-test and audit itself, minutes per stop.
export const RUN_LOG = 'runs.jsonl';
export function loggedRuns(since) {
  let rows = []; try { rows = fs.readFileSync(path.join(STATE, RUN_LOG), 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { }
  return rows.filter(r => Date.parse(r.at) >= (since || 0)).map(r => ({ cmd: r.cmd, out: r.out, error: r.error }));
}
// Each shell run with its output, in order: lets checks require that a validator PASSED, not just that it ran.
export function runsOf(entries) {
  const byId = new Map(), out = [];
  // the files edited before each run (editedBefore), so a check can tell a failure the turn found from one it caused
  const edited = [];
  for (const r of entries) {
    const c = r.message && r.message.content;
    if (!Array.isArray(c)) continue;
    for (const x of c) {
      if (r.type === 'assistant' && x && x.type === 'tool_use' && /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(x.name)) edited.push(rel(x.input?.file_path || x.input?.notebook_path || ''));
      if (r.type === 'assistant' && x && x.type === 'tool_use' && typeof x.input?.command === 'string') {
        const run = { cmd: x.input.command, out: '', error: false, editedBefore: edited.slice(), pending: true }; byId.set(x.id, run); out.push(run);
      } else if (r.type === 'user' && x && x.type === 'tool_result' && byId.has(x.tool_use_id)) {
        const run = byId.get(x.tool_use_id); run.out = textOf(x.content); run.error = !!x.is_error; run.pending = false;
      }
    }
  }
  // (a background run's result is its output file, its exit code in the later task notice, which may come as a queued
  // attachment. Lessons: the stub, and a notice sent as an attachment, were read as a passing run's output)
  const notes = entries.map(r => r.type === 'user' ? textOf(r.message?.content) : r.type === 'attachment' ? textOf(r.attachment?.prompt ?? r.attachment?.content ?? '') : '').join('\n');
  for (const run of out) {
    // (a foreground command past its timeout says "moved to the background (ID: x)": the same, once it ends)
    const id = (/running in background with ID:?\s*([\w-]+)/i.exec(run.out) || MOVED_BG.exec(run.out))?.[1];
    if (!id) continue;
    const file = /written to:?\s*(\S+?\.output)\b/i.exec(run.out)?.[1];
    const note = new RegExp(`<task-id>${esc(id)}</task-id>[\\s\\S]*?</task-notification>`).exec(notes)?.[0] || '';
    if (!note) { run.out = ''; run.pending = true; continue; }
    try { const t = fs.readFileSync(file, 'utf8'); run.out = t.length > 200000 ? t.slice(-200000) : t; } catch { run.out = ''; }
    const code = /exit code (\d+)/i.exec(note)?.[1];
    run.error = /<status>(failed|killed|error)/i.test(note) || (code != null && code !== '0');
  }
  return out;
}
// Rows of several transcripts in the order they happened (a row with no time keeps the time of the row before it).
// Lesson (a field report): helpers' rows were put after the session's own, so a helper's early failing test run was
// "the last run", and the session's later passing runs never met the check for 3 rounds.
export function inTimeOrder(...lists) {
  const rows = [];
  for (const list of lists) { let at = ''; for (const r of list || []) { at = (typeof r?.timestamp === 'string' && r.timestamp) || at; rows.push({ r, at, i: rows.length }); } }
  return rows.sort((a, b) => (a.at && b.at && a.at !== b.at ? (a.at < b.at ? -1 : 1) : a.i - b.i)).map(x => x.r);
}
