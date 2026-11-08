// Engine v2 in shadow: while v1 is the engine, v2's start and end run beside it and only log what they would have shown
// or blocked, to tools/hooks/state/v2-shadow.jsonl. Nothing is printed, so the user feels no change. The log gives
// live recall and precision per check, including changes made by helpers and scripts that a replay can't see.
// Off with "v2shadow": false in tools/hooks/config.json.
import fs from 'node:fs';
import path from 'node:path';
import { onPrompt } from './start.mjs';
import { onStop } from './end.mjs';
import { ROOT, at } from './lib.mjs';

const MAX_BYTES = 2_000_000;
export function shadow(cmd, data) {
  const out = cmd === 'prompt' ? onPrompt(data) : onStop(data, { shadow: true });
  if (cmd === 'stop' && data.stop_hook_active) return; // v2 judges only the first attempt to finish
  const row = { at: new Date().toISOString(), sid: String(data.session_id || '').slice(0, 64), event: cmd };
  if (cmd === 'prompt') row.reminder = out?.hookSpecificOutput?.additionalContext || '';
  else row.block = out?.reason || '';
  const file = at('tools/hooks/state/v2-shadow.jsonl');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // (the log stays small: past the limit, the older half goes)
  try { if (fs.statSync(file).size > MAX_BYTES) { const t = fs.readFileSync(file, 'utf8'); fs.writeFileSync(file, t.slice(t.indexOf('\n', t.length / 2) + 1)); } } catch { }
  fs.appendFileSync(file, JSON.stringify(row) + '\n');
}
