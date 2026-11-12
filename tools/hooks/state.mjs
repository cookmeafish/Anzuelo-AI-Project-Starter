// Paths, session state, globs and the transcript's text, shared by the hooks' entry, the safety guard and the tools, so
// none of them imports the old engine's hooks-main.mjs for them (engine v2-only plan, step 1b).
import fs from 'node:fs';
import path from 'node:path';
import { where, whereWrite, relOf } from './paths.mjs';
import { read, abs, esc, config } from './settings.mjs';

export const STATE = where('tools/hooks/state');
export const absw = p => whereWrite(p); // (where a write goes: an engine file changed for this project is its local copy)
export const rel = p => relOf(p);
export const rulesText = () => read(abs('AGENTS.md')) || read(abs('CLAUDE.md')); // (CLAUDE.md: AGENTS.md's local twin)
// (STARTER_ switches; the old KS_ names still read. Lesson: names from the starter's old name outlived the rename)
export const envOf = n => process.env[`STARTER_${n}`] ?? process.env[`KS_${n}`];
// The session these hooks run for, set once per hook call by the entry (setSession):
// - SID: each session keeps its own turn record and snapshot. Lesson: a second session's prompt replaced the first's.
// - DRY_STATE: a self-check inside a session reads its state, writes none. Lesson: it reset the session's Stop record.
// - NO_TRANSCRIPT: a session id with no readable transcript is a hand run; no per-session state. Lesson: a dry run with
//   made-up ids left 27 state files behind.
export let SID = '', DRY_STATE = false, NO_TRANSCRIPT = false;
export const setSession = ({ sid, dry, noTranscript } = {}) => { if (sid !== undefined) SID = sid; if (dry !== undefined) DRY_STATE = dry; if (noTranscript !== undefined) NO_TRANSCRIPT = noTranscript; };
// (the first 4 KB only: a real transcript can be many megabytes, and the hooks have a speed budget)
export function transcriptState(tp) {
  if (!tp) return 'none';
  let st; try { st = fs.statSync(String(tp)); } catch { return 'missing'; }
  if (!st.isFile()) return 'unreadable';
  if (!st.size) return 'empty';
  let fd = null;
  try { fd = fs.openSync(String(tp), 'r'); const b = Buffer.alloc(Math.min(st.size, 4096)); const n = fs.readSync(fd, b, 0, b.length, 0); return /\S/.test(b.toString('utf8', 0, n)) ? 'ok' : 'empty'; }
  catch { return 'unreadable'; } finally { if (fd !== null) try { fs.closeSync(fd); } catch { } }
}
// (a turn's own files. Lesson: a second session reset the first one's block count and lost its earlier failures)
export const PER_SESSION = new Set(['turn.json', 'checklist-shown.json', 'acknowledged.json', 'reminders-shown.json', 'snapshot.json', 'turn-end.json', 'notices-shown.json', 'stop-blocks.json', 'stop-failed.json',
  'event-hints.json', 'plan-watch.json', 'friction-turn.json', 'ext-shown.json', 'wakeups.json', 'checklist.json', 'scope-shown.json', 'alive.json', 'late-told.json', 'images-told.json']);
export const stateName = n => SID && PER_SESSION.has(n) ? n.replace(/.json$/, `.${SID}.json`) : n;
// (a session's own file when it has one, else the shared one, written before sessions were told apart or by a test)
export const stateFile = n => { const own = path.join(STATE, stateName(n)); return own !== path.join(STATE, n) && !fs.existsSync(own) ? path.join(STATE, n) : own; };
// (a timing run writes no session state but keeps the caches it rebuilt. Lesson: each timed run after an upgrade was cold)
const BENCH_CACHES = new Set(['mirror-stamps.json', 'names.json', 'fit-check.json', 'fit-later.json']);
export function writeState(name, obj) {
  if ((envOf('BENCH') && !BENCH_CACHES.has(name)) || DRY_STATE) return;
  if (NO_TRANSCRIPT && (PER_SESSION.has(name) || name === 'setup.json')) return;
  try { fs.mkdirSync(STATE, { recursive: true }); fs.writeFileSync(path.join(STATE, stateName(name)), JSON.stringify(obj, null, 2)); } catch {}
}
// State hygiene: per-session files go once 7 days old, at session start or with "hooks.mjs prune" (--dry lists them).
// Lesson: one project had 33 state files and 336 KB after two days.
export const STATE_KEEP_DAYS = 7;
const SESSION_STATE = new RegExp(`^(${[...PER_SESSION].map(n => esc(n.replace(/\.json$/, ''))).join('|')})(\\.[A-Za-z0-9_-]+)?\\.json$`);
export function pruneState({ dry = false, days = STATE_KEEP_DAYS, now = Date.now() } = {}) {
  const out = [];
  let names = []; try { names = fs.readdirSync(STATE); } catch { return out; }
  for (const n of names) {
    if (!SESSION_STATE.test(n)) continue;
    let s; try { s = fs.statSync(path.join(STATE, n)); } catch { continue; }
    if (!s.isFile() || now - s.mtimeMs <= days * 86400_000) continue;
    out.push({ name: n, bytes: s.size, days: Math.floor((now - s.mtimeMs) / 86400_000) });
    if (!dry) try { fs.rmSync(path.join(STATE, n), { force: true }); } catch { }
  }
  return out;
}
// (a glob as a regex: "**/" is any number of whole folders, so "**/schema.*" never matches "sales.schema.json")
export function globRe(g) {
  let s = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') { if (g[i + 1] === '*') { i++; if (g[i + 1] === '/') { s += '(?:.*/)?'; i++; } else s += '.*'; } else s += '[^/]*'; }
    else if (c === '?') s += '[^/]';
    else s += esc(c);
  }
  return new RegExp('^' + s + '$', 'i');
}
export const match = (p, globs) => [].concat(globs || []).some(g => globRe(g).test(p));
export const textOf = c => typeof c === 'string' ? c : Array.isArray(c) ? c.filter(x => x && x.type === 'text').map(x => x.text || '').join('\n') : '';
export const SNAPSHOT = 'snapshot.json', HASH_MAX = 2 * 1024 * 1024;
export const engineOf = () => envOf('ENGINE') || config().engine;
// A sub-agent prompt that points at a brief file ("Your brief: .cache/briefs/export.md") passes on the rules when that
// file tells the sub-agent to read AGENTS.md. Lesson: a short prompt naming a full brief that began "Read AGENTS.md
// first" was denied, so the brief had to be pasted into the prompt.
export function briefFileNamesRules(prompt) {
  const paths = [...String(prompt).matchAll(/(?:[A-Za-z]:)?[\w.~\\/-]*[\w-]\.(?:md|txt)\b/g)].map(m => m[0]).filter(s => !/^(AGENTS|CLAUDE)\.md$/.test(s)).slice(0, 8);
  for (const s of paths) {
    const full = path.isAbsolute(s) ? s : abs(s);
    try { const st = fs.statSync(full); if (st.isFile() && st.size < 1024 * 1024 && /\bAGENTS\.md\b|\bCLAUDE\.md\b/.test(fs.readFileSync(full, 'utf8'))) return true; } catch { }
  }
  return false;
}
