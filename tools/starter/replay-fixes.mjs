// Replays the fix-proof end checks (fixGaps in tools/hooks/v2/lib.mjs) on a project's real past turns, read-only, so
// each hold can be judged by hand: right hold, false hold, or missed. Starter-only (fix-proof plan, Task 5).
//   node tools/starter/replay-fixes.mjs <project dir> <transcript.jsonl>... [--max 20]
// Prints one block per candidate turn (a code edit plus a complaint, the debug skill or a fix route): the request's
// first words, the runs before and after the code edits, and what the checks would say. The output names project
// content: keep it outside the starter (a scratchpad), and write only general findings into tools/starter/reviews/.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readRows } from '../hooks/jsonl.mjs';

const args = process.argv.slice(2), maxAt = args.indexOf('--max'), max = maxAt >= 0 ? +args[maxAt + 1] : 20;
const [project, ...files] = args.filter((a, i) => a !== '--max' && i !== maxAt + 1 || maxAt < 0);
if (!project || !files.length) { console.error('usage: node tools/starter/replay-fixes.mjs <project dir> <transcript.jsonl>... [--max 20]'); process.exit(2); }
process.env.CLAUDE_PROJECT_DIR = path.resolve(project); process.env.ANZUELO_ROOT = path.resolve(project); process.env.V2_NO_STATE = '1';
const L = await import(pathToFileURL(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'hooks', 'v2', 'lib.mjs')).href);

// A typed prompt starts a turn: a user row with text, not a tool result, not the host's own rows.
const typed = r => r.type === 'user' && !r.isMeta && !r.isCompactSummary && !r.isSidechain && (typeof r.message?.content === 'string' || (Array.isArray(r.message?.content) && !r.message.content.some(b => b?.type === 'tool_result')));
const text = c => typeof c === 'string' ? c : Array.isArray(c) ? c.filter(b => b?.type === 'text').map(b => b.text).join('\n') : '';
const NOT_USER = /^\s*(<(cross-session-message|task-notification|system-reminder)\b|Another Claude session|\[SYSTEM NOTIFICATION|This session is being continued)/;
const FIX_ROUTE = /(^|[\\/])(debug|bugfix|field-report|learn-from-upset|improvement-loop)(\.md|[\\/]SKILL\.md)$/;
let shown = 0; const seen = new Set();
for (const f of files) {
  const rows = readRows(f); // (line by line, at any size: never the whole transcript in one string)
  const starts = rows.map((r, i) => typed(r) && !NOT_USER.test(text(r.message.content)) ? i : -1).filter(i => i >= 0);
  for (let k = 0; k < starts.length && shown < max; k++) {
    const turn = rows.slice(starts[k], starts[k + 1] ?? rows.length), acts = L.turnActs(turn);
    acts.at = turn[0].timestamp || '';
    const calls = acts.calls || [];
    // (the route as the live engine takes it: route() on the request's words, never the reminder's "closest" hint)
    if (seen.has(acts.at)) continue; seen.add(acts.at);
    const book = (() => { try { return L.route(text(turn[0].message.content)); } catch { return null; } })();
    acts.routes = book?.file ? [book.file] : [];
    acts.complaint = calls.some(c => /turn-notes\.md/.test(JSON.stringify(c.input || {})) && /Issue:\s*(?!none\b|<)\S/.test(JSON.stringify(c.input || {}))) || calls.some(c => c.name === 'Read' && /learn-from-upset[\\/]+SKILL\.md$/i.test(String(c.input?.file_path || '')));
    const gaps = L.fixGaps(acts);
    const code = calls.filter(c => /^(Edit|Write|MultiEdit)$/.test(c.name) && /\.(m?[jt]sx?|cjs|py|go|rs|java|cs|rb|php|sh|ps1)$/i.test(String(c.input?.file_path || '')));
    if (!code.length || !(acts.complaint || acts.routes.some(f => FIX_ROUTE.test(f)) ||calls.some(c => c.name === 'Read' && /[\\/]debug[\\/]+SKILL\.md$/i.test(String(c.input?.file_path || ''))))) continue;
    shown++;
    const runs = L.proofTurn(acts).runs.map(r => `${r.editedBefore.length ? 'after ' : 'before'} ${r.error ? 'ERR ' : ''}${r.cmd.replace(/\s+/g, ' ').slice(0, 90)}`);
    console.log(`=== ${path.basename(f)} @ ${acts.at}\nrequest: ${text(turn[0].message.content).replace(/\s+/g, ' ').slice(0, 160)}\ntrigger: ${[acts.complaint && 'complaint', acts.routes.length && `route ${acts.routes[0]}`].filter(Boolean).join(', ') || 'debug read'}; code edits ${code.length}: ${[...new Set(code.map(c => path.basename(String(c.input.file_path))))].slice(0, 4).join(', ')}\nruns:\n  ${runs.slice(0, 12).join('\n  ') || '(none)'}\nverdict: ${gaps.length ? gaps.map(g => g.slice(0, 110)).join('\n         ') : 'NOT HELD'}\nanswer tail: ${String(acts.answer || '').replace(/\s+/g, ' ').slice(-200)}\n`);
  }
}
console.log(`replay-fixes: ${shown} candidate fix turn(s)`);
