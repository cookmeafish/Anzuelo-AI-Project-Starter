#!/usr/bin/env node
// Moves the project's own checks from tools/hooks/requirements.json into docs/checks/always.md, the "## Done when"
// list the end check reads every turn. The engine's own checks (engine-checks.json) and packs' checks are left alone.
// A check that cannot be said as markers is listed, never dropped: the audit fails until it is moved by hand.
// Lesson (a field report): a project's rule in requirements.json looked enforced, and v2 never read it.
//   node tools/always.mjs convert [--dry-run]   convert what can be, list the rest
//   node tools/always.mjs pending               the project's checks not in always.md yet (exit 1 if any)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = f => path.join(ROOT, f);
// (a caller with its own layout, such as the audit, passes how it reads a project file)
const readText = f => { try { return fs.readFileSync(at(f), 'utf8'); } catch { return ''; } };
const json = (rd, f, d) => { try { return JSON.parse(rd(f)); } catch { return d; } };
export const ALWAYS_FILE = 'docs/checks/always.md';
const HEAD = `# Always\n\nThe project's own standing rules that belong to no single runbook. The end check reads this "Done when" list\nevery turn. Markers: (file: a|b), (ran: <regex>), (answer: <regex>), (prompt: <regex>), (tool: <regex>), and the same\nwith "when " as a condition; several conditions must all hold.\n\n## Done when\n`;

// The project's own checks: not the engine's, not a pack's.
export function ownChecks(rd = readText) {
  const engine = new Set((json(rd, 'tools/hooks/engine-checks.json', {}).requirements || []).map(r => r.tag));
  return (json(rd, 'tools/hooks/requirements.json', {}).requirements || []).filter(r => r && r.tag && !r.pack && !engine.has(r.tag));
}
const not = x => `^(?![\\s\\S]*(?:${x}))`;
const files = v => [].concat(v).join('|');
const plain = s => String(s).replace(/^\(\?c\)/, '');
const WHEN = { answerMatches: x => `(when answer: ${plain(x)})`, answerNotMatches: x => `(when answer: ${not(plain(x))})`, promptMatches: x => `(when prompt: ${plain(x)})`,
  promptNotMatches: x => `(when prompt: ${not(plain(x))})`, filesChanged: x => `(when file: ${files(x)})`, toolRan: x => `(when ran: ${plain(x)})`,
  skillUsed: x => `(when tool: skills[\\\\/]${x}[\\\\/]SKILL\\.md)`, playbookUsed: x => `(when tool: playbooks[\\\\/]${x}\\.md)` };
const REQUIRE = { answerMatches: x => `(answer: ${plain(x)})`, answerNotMatches: x => `(answer: ${not(plain(x))})`, filesChanged: x => `(file: ${files(x)})`, toolRan: x => `(ran: ${plain(x)})` };

// One check as Done-when lines (one per required thing), or the keys no marker can say.
export function asItems(r) {
  const w = r.when || {}, q = r.require || {};
  const bad = [...Object.keys(w).filter(k => !WHEN[k]).map(k => `when.${k}`), ...Object.keys(q).filter(k => !REQUIRE[k]).map(k => `require.${k}`)];
  if (bad.length || !Object.keys(q).length) return { bad: bad.length ? bad : ['no require'] };
  const cond = Object.entries(w).map(([k, v]) => WHEN[k](v)).join(' ');
  const text = String(r.message || r.tag).replace(/\s+/g, ' ').replace(/[()]/g, '').trim();
  return { lines: Object.entries(q).map(([k, v]) => `- [ ] ${text} ${cond ? `${cond} ` : ''}${REQUIRE[k](v)} <!-- req: ${r.tag} -->`) };
}
export const pending = (rd = readText) => { const have = rd(ALWAYS_FILE); return ownChecks(rd).filter(r => !new RegExp(`req: ${r.tag.replace(/[^\w-]/g, '')}(?![\\w-])`).test(have)); };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  if (cmd === 'pending') { const p = pending(); console.log(p.length ? `not in ${ALWAYS_FILE}: ${p.map(r => r.tag).join(', ')}` : 'none pending'); process.exit(p.length ? 1 : 0); }
  if (cmd !== 'convert') { console.log('usage: node tools/always.mjs convert [--dry-run] | pending'); process.exit(2); }
  const out = [], left = [];
  for (const r of pending()) { const a = asItems(r); if (a.lines) out.push(...a.lines); else left.push(`${r.tag} (${a.bad.join(', ')})`); }
  if (out.length && !process.argv.includes('--dry-run')) {
    let text = ''; try { text = fs.readFileSync(at(ALWAYS_FILE), 'utf8'); } catch { }
    if (!/^##\s+Done when\s*$/m.test(text)) text = (text.trim() ? `${text.trim()}\n\n` : HEAD.replace('## Done when\n', '')) + '## Done when\n';
    fs.mkdirSync(path.dirname(at(ALWAYS_FILE)), { recursive: true });
    fs.writeFileSync(at(ALWAYS_FILE), `${text.replace(/\s*$/, '\n')}${out.join('\n')}\n`);
  }
  console.log(`converted ${out.length} line(s) into ${ALWAYS_FILE}${process.argv.includes('--dry-run') ? ' (dry run)' : ''}`);
  if (left.length) { console.log(`NOT converted, move each by hand into a runbook's or ${ALWAYS_FILE}'s "Done when" (add <!-- req: <tag> --> to it):\n- ${left.join('\n- ')}`); process.exit(1); }
}
