// The turn of an agent with no transcript (any agent but Claude Code: "begin", then "check --answer-file"), written as one
// so the end check judges it like any other: the request "begin" recorded, each command the run log holds since then
// ("hooks.mjs run <cmd>" writes it, and the self-tests record themselves), each file changed since then, and the draft.
// Lesson (the old suite under v2): with no transcript, v2's check judged nothing and said PASS for an edited hook file,
// where the old engine judged the run log and the changed files.
import fs from 'node:fs';
import path from 'node:path';
import { at, filesMatching } from './lib.mjs';

const NOT_WORK = /^(\.cache|tools\/hooks\/state|\.git|node_modules)\//;
export function manualTranscript(turn, { request = '' } = {}) {
  const since = Date.parse(turn.at || '') || 0;
  if (!since) return '';
  const iso = t => new Date(t).toISOString(), rows = [];
  rows.push([since, { type: 'user', timestamp: iso(since), message: { role: 'user', content: request || turn.request || '(the recorded request)' } }]);
  let n = 0;
  const call = (t, name, input, out, error) => {
    const id = `manual-${++n}`;
    rows.push([t, { type: 'assistant', timestamp: iso(t), message: { role: 'assistant', content: [{ type: 'tool_use', id, name, input }] } }]);
    rows.push([t + 0.5, { type: 'user', timestamp: iso(t + 1), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: String(out || ''), ...(error ? { is_error: true } : {}) }] } }]);
  };
  // (the run log: commands since the request)
  const log = (() => { try { return fs.readFileSync(at('tools/hooks/state/runs.jsonl'), 'utf8'); } catch { return ''; } })();
  for (const l of log.split('\n')) { let r; try { r = JSON.parse(l); } catch { continue; } const t = Date.parse(r?.at || ''); if (t >= since && r.cmd) call(t, 'Bash', { command: r.cmd }, r.out, r.error); }
  // (the files changed since the request, each as its own edit at the time it was written)
  for (const f of filesMatching('**/*')) {
    if (NOT_WORK.test(f)) continue;
    let t = 0; try { t = fs.statSync(at(f)).mtimeMs; } catch { continue; }
    if (t > since) call(t, 'Edit', { file_path: at(f), old_string: '', new_string: '' }, 'The file was updated.');
  }
  rows.sort((a, b) => a[0] - b[0]);
  const file = at('tools/hooks/state/v2-manual-transcript.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, rows.map(([, r]) => JSON.stringify(r)).join('\n') + '\n');
  return file;
}
