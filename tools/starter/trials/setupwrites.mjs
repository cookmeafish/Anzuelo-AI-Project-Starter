// Which files a setup turn writes and edits (main session and helpers), grouped by folder, with how often each was
// touched. node tools/starter/trials/setupwrites.mjs <round> [project]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const [round, only] = process.argv.slice(2);
const res = path.join('.cache', 'trials', `results-${round}`);
const projDir = path.join(os.homedir(), '.claude', 'projects');
const find = sid => { for (const d of fs.readdirSync(projDir)) { const f = path.join(projDir, d, `${sid}.jsonl`); if (fs.existsSync(f)) return f; } return null; };
const groups = {}, files = {};
for (const file of fs.readdirSync(res).filter(f => f.endsWith('.json'))) {
  const name = file.replace(/\.json$/, '');
  if (only && name !== only) continue;
  const t = JSON.parse(fs.readFileSync(path.join(res, file), 'utf8')).turns?.[0];
  const main = t?.sid && find(t.sid);
  if (!main) continue;
  const sub = path.join(path.dirname(main), t.sid, 'subagents');
  const all = [main, ...(fs.existsSync(sub) ? fs.readdirSync(sub).filter(f => f.endsWith('.jsonl')).map(f => path.join(sub, f)) : [])];
  for (const f of all) for (const l of fs.readFileSync(f, 'utf8').split('\n')) {
    let r; try { r = JSON.parse(l); } catch { continue; }
    if (r?.type !== 'assistant') continue;
    for (const c of Array.isArray(r.message?.content) ? r.message.content : []) {
      if (c.type !== 'tool_use' || !/^(Write|Edit|MultiEdit)$/.test(c.name)) continue;
      const p = String(c.input?.file_path || '').replace(/\\/g, '/').replace(/^.*?-e\d*anz\//, '').replace(/^.*?anzuelo-new\/[^/]+\//, '');
      const g = p.includes('/') ? p.split('/').slice(0, p.startsWith('docs/') || p.startsWith('tools/') ? 2 : 1).join('/') + '/' : p;
      groups[g] = (groups[g] || 0) + 1; files[p] = (files[p] || 0) + 1;
    }
  }
}
console.log('by folder:'); for (const [g, n] of Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 18)) console.log(`  ${String(n).padStart(4)}  ${g}`);
console.log('most-touched files:'); for (const [p, n] of Object.entries(files).sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(`  ${String(n).padStart(4)}  ${p}`);
