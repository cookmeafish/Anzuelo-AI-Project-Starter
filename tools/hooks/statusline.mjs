#!/usr/bin/env node
// Status bar for Claude Code ("statusLine" in .claude/settings.json): one line, how the session stands right now. It
// reads only the session transcript Claude Code passes on stdin, so it costs no hook time and works in any project.
//   ⏳ working                      the agent is busy (its newest entry is not a final reply)
//   almost done, N steps left      the Stop hook sent it back to finish steps, and it is on them
//   ⏳ waiting on N background tasks the reply is written, background agents or commands still run
//   ⚠️ ended with N steps not done  the turn ended unfinished
//   (nothing)                      no turn yet, or the turn is finished
// The user's own status line (the "statusLine" in their ~/.claude/settings.json, e.g. model, context, folder) is
// printed first, unchanged: this line is added under it, never in its place. (Lesson (the user): the project's
// setting replaced a bar the user had installed with another app, and model, context and folder vanished)
// (the state comes from the newest entry, never from guessing where a turn started. Lesson (the user): a turn started
// by a background agent's notice, not by a typed message, showed done while the agent worked, after four fixes that
// each patched one screenshot)
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const C = { ok: '\x1b[32m', warn: '\x1b[33m', bad: '\x1b[31m', off: '\x1b[0m' };

let raw = '', input = {};
try { raw = fs.readFileSync(0, 'utf8'); input = JSON.parse(raw || '{}'); } catch { }

// the status line this one would otherwise replace: the project's shared setting, else the user's own, whichever is
// set and is not this script (so it never calls itself), run with the same input. The engine never overrides or
// disables any status line but its own. (Lesson (the user): "anzuelo should never override or disable the status bar
// of anything else besides itself")
const projectDir = input.workspace?.project_dir || input.cwd || process.cwd();
const theirs = [path.join(projectDir, '.claude', 'settings.json'), path.join(os.homedir(), '.claude', 'settings.json')]
  .map(f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).statusLine?.command; } catch { return ''; } })
  .find(cmd => cmd && !/statusline\.mjs/.test(cmd));
let own = '';
try { if (theirs) own = execSync(theirs, { input: raw, encoding: 'utf8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] }).replace(/\s+$/, ''); } catch { }

// the engine's name, from docs/names.json of the project (else of this engine's own folder)
const nameIn = dir => { try { return JSON.parse(fs.readFileSync(path.join(dir, 'docs', 'names.json'), 'utf8')).STARTER_NAME || ''; } catch { return ''; } };
const NAME = nameIn(input.workspace?.project_dir || input.cwd || process.cwd()) || nameIn(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const MARK = new RegExp(`⚓\\s*${NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);

// the whole transcript, in file order (timestamps are not always in order). (Lesson (probe): reading only the last
// 1.5 MB lost the start of long turns and the launch of background agents; a 7 MB transcript reads in about 25 ms)
let lines = [];
try { lines = fs.readFileSync(input.transcript_path || '', 'utf8').split('\n'); } catch { }

let lastActivity = -1, lastReply = -1, lastStart = -1, startAt = '', lastApi = -1, away = -1;
const stops = [], bg = new Set();
lines.forEach((l, i) => {
  if (!l) return;
  let j; try { j = JSON.parse(l); } catch { return; }
  if (j.isSidechain) return;
  const content = j.message?.content;
  // the agent's own messages and everything that reaches it (tool results, typed messages, background notices, messages
  // from other sessions, queued messages) are activity; a final reply is marked end_turn
  // (any stop but a tool call ends the turn: end_turn, and stop_sequence when the usage limit cut it. Lesson (sweep): a
  // turn cut by the session limit read as working forever)
  if (j.type === 'assistant') { lastActivity = i; const why = j.message?.stop_reason; if (why && why !== 'tool_use') lastReply = i; }
  if (j.type === 'user' && !j.isMeta && !j.isCompactSummary) {
    lastActivity = i;
    // anything but a tool result starts new work: a typed message, a notice, a message from another session
    if (!(Array.isArray(content) && content.some(b => b.type === 'tool_result'))) { lastStart = i; startAt = j.timestamp || ''; }
  }
  if (j.type === 'attachment' && j.attachment?.type === 'queued_command') { lastActivity = i; lastStart = i; startAt = j.timestamp || ''; }
  // (the host's own marks: a call to the model, and its summary when the session sits idle)
  if (j.type === 'api-request') lastApi = i;
  if (j.type === 'system' && j.subtype === 'away_summary') away = i;
  // background agents and commands: started by a tool result, finished by a task-notification with the same id. (The
  // notice may sit in a plain message, a list of parts or a queued command, so the raw line is read; request copies
  // are skipped. Lesson (probe): only plain messages were read, and finished agents counted as running)
  const r = j.toolUseResult;
  if (r?.status === 'async_launched' && r.agentId) bg.add(r.agentId);
  if (r?.backgroundTaskId) bg.add(r.backgroundTaskId);
  // one the agent stopped itself gets no notice, only this result. (Lesson (sweep): a stopped command kept the bar on
  // "waiting" for the rest of the session)
  if (r?.task_id && /^Successfully stopped/i.test(r.message || '')) bg.delete(r.task_id);
  if (r?.shell_id && /kill|stop/i.test(r.message || '')) bg.delete(r.shell_id);
  if (l.includes('<task-notification>') && !/^api-/.test(j.type || '')) for (const m of l.matchAll(/<task-id>([^<\\]+)<\/task-id>/g)) bg.delete(m[1]);
  const a = j.attachment;
  if (j.type === 'attachment' && a?.type === 'hook_system_message' && /^Stop/.test(a.hookName || '') && MARK.test(a.content || '')) {
    stops.push({ i, lines: String(a.content).split('\n').map(x => x.replace(/^\s*⚓\s*\S+?:?\s+/, '').replace(/\s+/g, ' ').trim()).filter(Boolean) });
  }
});

const clip = (t, n = 90) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
const paint = t => /failed|blocked/i.test(t) ? C.bad + t + C.off : /almost done|steps? (left|not done)|⚠️|⏳/i.test(t) ? C.warn + t + C.off
  : /✅/.test(t) ? C.ok + t + C.off : t;
// the result line of an end message, not the "acknowledged/fixed" line beside it (Lesson (the user): a finished turn
// showed "fixed" twice and never "checks passed")
// and not a line like "rule saved" either: the line that says how the checks ended. (Lesson (sweep): a turn that saved
// a rule showed "rule saved" instead of "checks passed")
// (the result line starts the line: an issue that mentions "steps left" is not one. Lesson (sweep): a finished turn
// showed "🚨 fixed: status line shows steps left ...")
const result = s => (s.lines.find(t => /^(✅ checks passed|almost done|⚠️ ended with|❌|checks? failed)/i.test(t)) || '').replace(/ · .*$/, '');

let state = '';
if (lastActivity >= 0) {
  // done only when the newest activity is a final reply (Lesson (the user): the answer was there and the bar said
  // working; turn_duration alone comes after the bar's last refresh)
  // (or a message that never started a turn: no call to the model after it, and the host marked the session idle or a
  // minute passed. Lesson (the user): a helper's "finished" notice came after the last reply, no turn ran for it, and the
  // bar said working for good)
  const unheard = lastStart > lastReply && lastApi >= 0 && lastApi < lastStart && (away > lastStart || Date.now() - (Date.parse(startAt) || Date.now()) > 60000);
  const ended = lastReply === lastActivity || unheard;
  // the Stop hook's message for this reply, or for the work in progress since the last new message
  const stop = [...stops].reverse().find(s => s.i > (ended ? lastReply : lastStart));
  if (!ended) state = stop && /almost done/i.test(result(stop)) ? result(stop) : '⏳ working';
  // (an answer with background agents still running is not done. Lesson (the user): the bar said done while the agent
  // waited on two background agents)
  else if (bg.size) state = `⏳ waiting on ${bg.size} background task${bg.size > 1 ? 's' : ''}`;
  // (an "almost done" from an earlier stop is over once a later reply ends the turn. Lesson (the user): the bar kept
  // "5 steps left" after the agent had finished them)
  // (a finished turn shows nothing: the chat already says how it ended. Lesson (the user): "checks passed" left on the
  // bar after the turn is noise; the bar is for watching a turn until it completes)
  // (but a Stop hook that sent the reply back, "almost done", is not finished)
  else state = stop && /almost done|steps? left|not done|failed/i.test(result(stop)) ? result(stop) : '';
}
// (only how the session stands: the hook lines (runbook, skill, items to check off, acknowledged, stopped actions) are
// already in the chat. Lessons (the user): a standing "on duty" line is noise; a line in both the chat and the bar is a
// repeat)
const out = [own, state && paint(clip(state))].filter(Boolean);
process.stdout.write(out.length ? out.join('\n') + '\n' : '');
