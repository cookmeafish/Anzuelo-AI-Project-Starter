// Where a setup turn's time goes: every tool call in the main session and its helpers, grouped by kind, with its
// wall time (tool_use to tool_result) and the model time between calls.
// node tools/starter/trials/setuptime.mjs <round> [project]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const [round, only] = process.argv.slice(2);
const res = path.join('.cache', 'trials', `results-${round}`);
const projDir = path.join(os.homedir(), '.claude', 'projects');
const find = sid => { for (const d of fs.readdirSync(projDir)) { const f = path.join(projDir, d, `${sid}.jsonl`); if (fs.existsSync(f)) return f; } return null; };
const rowsOf = f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const kindOf = (name, inp) => {
  if (!/^(Bash|PowerShell)$/.test(name)) return name === 'Agent' ? 'Agent (helper)' : name;
  const c = String(inp.command || '');
  for (const [k, re] of [['audit --setup', /audit\.mjs[^|&;]*--setup/], ['audit', /audit\.mjs/], ['selfcheck', /selfcheck\.mjs/], ['fit', /fit\.mjs/], ['hooks check', /hooks\.mjs\s+check/],
    ['hooks other', /hooks\.mjs/], ['tests', /node --test|pytest|npm (run )?test|unittest/], ['install', /npm (ci|i|install)|pip install|uv /], ['git', /^\s*(cd [^&]+&&\s*)?git /], ['read/list', /^\s*(cd [^&]+&&\s*)?(cat|ls|head|tail|grep|find|sed -n|wc|Get-Content|Get-ChildItem)\b/]]) if (re.test(c)) return `sh: ${k}`;
  return 'sh: other';
};
const total = {}; let model = 0, toolT = 0;
for (const file of fs.readdirSync(res).filter(f => f.endsWith('.json'))) {
  const name = file.replace(/\.json$/, '');
  if (only && name !== only) continue;
  const t = JSON.parse(fs.readFileSync(path.join(res, file), 'utf8')).turns?.[0];
  const main = t?.sid && find(t.sid);
  if (!main) continue;
  const files = [main, ...(() => { const d = path.join(path.dirname(main), t.sid, 'subagents'); try { return fs.readdirSync(d).filter(f => f.endsWith('.jsonl')).map(f => path.join(d, f)); } catch { return []; } })()];
  for (const f of files) {
    const rows = rowsOf(f), started = {};
    let lastEnd = null;
    for (const r of rows) {
      const at = Date.parse(r.timestamp || '') || null;
      for (const c of Array.isArray(r.message?.content) ? r.message.content : []) {
        if (r.type === 'assistant' && c.type === 'tool_use') { started[c.id] = { at, kind: kindOf(c.name, c.input || {}) }; if (lastEnd && at) model += at - lastEnd; }
        if (r.type === 'user' && c.type === 'tool_result' && started[c.tool_use_id]) {
          const s = started[c.tool_use_id]; const ms = at && s.at ? at - s.at : 0;
          if (s.kind !== 'Agent (helper)') { const k = total[s.kind] ||= { n: 0, ms: 0 }; k.n++; k.ms += ms; toolT += ms; }
          lastEnd = at;
        }
      }
    }
  }
}
const min = ms => (ms / 60000).toFixed(1);
console.log(`setup time in ${round}${only ? ` ${only}` : ''}: tools ${min(toolT)} min, model between calls about ${min(model)} min`);
for (const [k, v] of Object.entries(total).sort((a, b) => b[1].ms - a[1].ms)) console.log(`  ${k.padEnd(20)} ${String(v.n).padStart(4)} calls  ${min(v.ms).padStart(6)} min`);
