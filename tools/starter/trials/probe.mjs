#!/usr/bin/env node
// Starter-only. Does a hook line really reach the user? One real headless Claude Code turn in a test project, then the
// lines the hooks showed the user, read from the session's own transcript (hook_system_message), not from a simulation.
// Lesson (the user): the "acknowledged" line passed its self-test but was never seen, because the Issue line was
// written from the shell, which the edit hook never sees.
//   node tools/starter/trials/probe.mjs --new <name>                      a fresh project (prints its folder)
//   node tools/starter/trials/probe.mjs <folder> "<prompt>" [--resume <session>] [--model <m>]
// Prints JSON: { session, answer, lines: [{ event, text }] }. Files to set up first go in the folder with any tool.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const STARTER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const [a, b] = process.argv.slice(2), opt = f => { const i = process.argv.indexOf(f); return i > 0 ? process.argv[i + 1] : undefined; };
if (a === '--new') {
  // (outside any .claude folder: Claude Code refuses writes there)
  const dir = path.join(os.tmpdir(), 'anzuelo-probe', `${b || 'p'}-${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  const g = (...x) => spawnSync('git', x, { cwd: dir, encoding: 'utf8' });
  g('init', '-q');
  const r = spawnSync(process.execPath, [path.join(STARTER, 'tools', 'new-project.mjs'), dir, '--dev', '--name', b || 'Probe'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status) { console.error(r.stderr || r.stdout); process.exit(1); }
  g('add', '-A'); g('-c', 'user.name=probe', '-c', 'user.email=probe@example.invalid', 'commit', '-q', '--no-verify', '-m', 'starter added');
  console.log(dir); process.exit(0);
}
if (!a || !b || !fs.existsSync(a)) { console.error('usage: probe.mjs --new <name> | probe.mjs <folder> "<prompt>" [--resume <session>] [--model <m>]'); process.exit(1); }
const TOOLS = ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Skill', 'Agent', 'Task', 'TodoWrite', 'Bash(node:*)', 'Bash(git:*)', 'Bash(ls:*)', 'Bash(cat:*)', 'Bash(echo:*)', 'Bash(mkdir:*)'];
const args = ['-p', b, '--output-format', 'json', '--permission-mode', 'acceptEdits', '--allowedTools', ...TOOLS,
  ...(opt('--resume') ? ['--resume', opt('--resume')] : []), ...(opt('--model') ? ['--model', opt('--model')] : [])];
const r = spawnSync('claude', args, { cwd: a, encoding: 'utf8', timeout: 30 * 60_000, maxBuffer: 64 << 20 });
let j = {}; try { j = JSON.parse(r.stdout); } catch { j = { result: (r.stdout || '').slice(-2000), error: (r.stderr || '').slice(-1000) }; }
const root = path.join(os.homedir(), '.claude', 'projects'), sid = j.session_id;
const rows = (() => { for (const d of sid ? fs.readdirSync(root) : []) { const f = path.join(root, d, `${sid}.jsonl`); if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } return []; })();
// (this turn only: a resumed session's transcript also holds the earlier turns. The session-start lines are written
// just before the prompt, so the turn starts after the last assistant message before it. Lesson (probe): every
// session-start line was missed)
const at = rows.map(x => x.type === 'user' && typeof x.message?.content === 'string' && x.message.content.includes(b.slice(0, 40))).lastIndexOf(true);
// (the previous turn's end-of-turn lines come after its last assistant message, so they end it too)
const start = rows.slice(0, Math.max(0, at)).map(x => x.type === 'assistant' || /^Stop/.test(x.attachment?.hookName || x.attachment?.hookEvent || '')).lastIndexOf(true) + 1;
const lines = rows.slice(Math.max(0, start)).filter(x => x.type === 'attachment' && x.attachment?.type === 'hook_system_message')
  .map(x => ({ event: x.attachment.hookName || x.attachment.hookEvent, text: x.attachment.content }));
console.log(JSON.stringify({ session: sid, answer: String(j.result || '').slice(0, 1500), error: j.error, lines }, null, 2));
