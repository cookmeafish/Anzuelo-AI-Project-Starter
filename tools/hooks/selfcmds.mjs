// The commands the user approved for the end check to run itself: tools/hooks/config.json "selfCommands". Only the user
// adds one (node tools/hooks/hooks.mjs self-allow "<command>"); the guard refuses an agent's edit that adds one, and the
// end check runs no other. Kept apart so the guard (pretool) and the end check share it without loading each other.
// Lesson (a peer's security review): a self-run named in a markdown file agents edit could be made to run any command.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const SELF_KEY = 'selfCommands';
const listOf = text => { try { return [].concat(JSON.parse(text)[SELF_KEY] || []).map(s => String(s).trim()).filter(Boolean); } catch { return null; } };
// Whether a tool call would add a command to the list in a project's tools/hooks/config.json. An edit is applied to the
// file as it is and the lists before and after are compared; a file that will not parse after it is taken as adding
// when it names the list (there is no telling what it holds).
export function selfListGrows(name, inp, root, read0 = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } }) {
  const f = String(inp?.file_path || '');
  if (!/^(Edit|Write|MultiEdit)$/.test(name) || !/(^|[\\/])tools[\\/]hooks[\\/]config\.json$/i.test(f)) return false;
  const now = read0(path.isAbsolute(f) ? f : path.join(root, f));
  let next = now;
  if (name === 'Write') next = String(inp.content || '');
  else for (const e of name === 'MultiEdit' ? inp.edits || [] : [inp]) next = e.replace_all ? next.split(e.old_string).join(e.new_string) : next.replace(e.old_string, () => e.new_string);
  const before = new Set(listOf(now) || []), after = listOf(next);
  return after === null ? new RegExp(SELF_KEY).test(next) : after.some(c => !before.has(c));
}
// A shell command that runs the user's command for the list, or names the list and writes the config file (a read or a
// search that mentions either is fine).
export const selfCmdWrites = cmd => { const c = String(cmd || '');
  // (the key spelled with an escape, "selfCommands", parses to the same name: a write with an escape counts too)
  return /hooks\.mjs["']?\s+self-allow\b/.test(c) || (/\bselfCommands\b|\\u00[0-9a-f]{2}/i.test(c) && /config\.json/.test(c) && /(^|[^<\d&=-])>>?\s*\S|\bsed\b[^|;&]*\s-i|writeFile|appendFile|Set-Content|Add-Content|Out-File|\btee\b|\bcp\b|\bmv\b|Copy-Item|Move-Item/i.test(c)); };
// The list as it stood in the last commit made before `before` (an ISO time: the session's start), read from git, so
// no change made during the session counts: an edit, a script, or a commit made since. Not a git project, or no such
// commit: none. Lesson (a peer's security review): a script the agent wrote could edit the config without the guard
// seeing it; only a list committed before the session began is the user's.
export function approvedBefore(file, before) {
  const git = (...a) => { const r = spawnSync('git', a, { cwd: path.dirname(file), encoding: 'utf8', timeout: 10000 }); return r.status === 0 ? r.stdout.trim() : null; };
  const top = git('rev-parse', '--show-toplevel');
  if (!top) return [];
  const sha = before ? git('rev-list', '-1', `--before=${before}`, 'HEAD') : 'HEAD';
  if (!sha) return [];
  const rel = path.relative(top, file).replace(/\\/g, '/'), text = git('show', `${sha}:${rel}`);
  return text == null ? [] : listOf(text) || [];
}
// Adds a command to the list (the user's own command) and returns the line to record in docs/DECISIONS.md.
export function allowSelf(root, cmd) {
  const f = path.join(root, 'tools/hooks/config.json');
  let j = {}; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { }
  const list = [].concat(j[SELF_KEY] || []).map(s => String(s).trim()), c = String(cmd || '').trim();
  if (!c) return { ok: false, msg: 'usage: node tools/hooks/hooks.mjs self-allow "<the exact command>"' };
  if (list.includes(c)) return { ok: true, msg: `already approved: ${c}` };
  j[SELF_KEY] = [...list, c];
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
  return { ok: true, added: true, msg: `approved for the end check to run itself: ${c}. It counts once it is committed, from the next session on (commit tools/hooks/config.json).` };
}
