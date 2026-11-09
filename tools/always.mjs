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
import { spawnSync } from 'node:child_process';

import { ROOT } from './hooks/settings.mjs';
import { doneWhen } from './hooks/v2/lib.mjs';
// (the project's folder, also when the engine sits in .anzuelo/engine)
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
// (a bracket inside a character class is written as its code, so the marker's own parentheses stay balanced)
const plain = s => String(s).replace(/^\(\?c\)/, '').replace(/\[(?:\\.|[^\]\\])*\]/g, cls => cls.replace(/\(/g, '\\x28').replace(/\)/g, '\\x29'));
const cmdOf = v => typeof v === 'string' ? v : v?.cmd;
const WHEN = { answerMatches: x => `(when answer: ${plain(x)})`, answerNotMatches: x => `(when answer: ${not(plain(x))})`, promptMatches: x => `(when prompt: ${plain(x)})`,
  promptNotMatches: x => `(when prompt: ${not(plain(x))})`, filesChanged: x => `(when file: ${files(x)})`, toolRan: x => `(when ran: ${plain(x)})`,
  // (used means read: an edit of the runbook, as in an engine upgrade, is not using it. Lesson (a field report): an
  // upgrade turn that edited a runbook was held to that runbook's answer checks)
  skillUsed: x => `(when tool: ^Read\\b.*skills[\\\\/]+${x}[\\\\/]+SKILL\\.md)`, playbookUsed: x => `(when tool: ^Read\\b.*playbooks[\\\\/]+${x}\\.md)`,
  // (a work turn is one that changed files, as the end check counts work)
  workTurn: x => x ? '(when tool: ^(Edit|Write|MultiEdit|NotebookEdit) )' : null };
// (toolPassed: a command matching it ran and did not fail, which is what "ran" checks)
const REQUIRE = { answerMatches: x => `(answer: ${plain(x)})`, answerNotMatches: x => `(answer: ${not(plain(x))})`, filesChanged: x => `(file: ${files(x)})`, toolRan: x => `(ran: ${plain(x)})`,
  // (a declared self-test the end check may run itself keeps that: "(self: <command>)". Lesson (a real project): the
  // conversion dropped selfRun, so a converted check was asked for and never run)
  toolPassed: x => cmdOf(x) ? `(ran: ${plain(cmdOf(x))}${x?.pass ? ` => ${plain(x.pass)}` : ''})${x?.selfRun && x?.selfAuto ? ` (self: ${x.selfRun})` : ''}` : null };

// One check as Done-when lines (one per required thing), or the keys no marker can say.
export function asItems(r) {
  const w = r.when || {}, q = r.require || {};
  const bad = [...Object.keys(w).filter(k => !WHEN[k]).map(k => `when.${k}`), ...Object.keys(q).filter(k => !REQUIRE[k]).map(k => `require.${k}`)];
  if (bad.length || !Object.keys(q).length) return { bad: bad.length ? bad : ['no require'] };
  if (Object.entries(w).some(([k, v]) => !WHEN[k](v))) return { bad: Object.entries(w).filter(([k, v]) => !WHEN[k](v)).map(([k]) => `when.${k} (false)`) };
  const cond = Object.entries(w).map(([k, v]) => WHEN[k](v)).join(' ');
  // (the message keeps its own brackets; only one that looks like a marker would be read as one. Lesson (a field
  // report): dropping every bracket broke the sentences)
  const text = String(r.message || r.tag).replace(/\s+/g, ' ').replace(/\((when\s+)?(file|ran|answer|prompt|tool|evidence)\b/gi, '[$1$2').trim();
  const req = Object.entries(q).map(([k, v]) => [k, REQUIRE[k](v)]);
  if (req.some(([, m]) => !m)) return { bad: req.filter(([, m]) => !m).map(([k]) => `require.${k} (no command)`) };
  // (a line whose markers read back differently, a regex nested deeper than a marker holds, is listed, not written)
  const marks = [...cond.matchAll(/\(when (\w+): /g)].length;
  const lines = req.map(([, m]) => `- [ ] ${text} ${cond ? `${cond} ` : ''}${m} <!-- req: ${r.tag} -->`);
  // (read back the way the end check reads it)
  // (a "(self: <command>)" after the marker is read back on its own: it.self)
  const selfOf = m => / \(self: (.*)\)$/.exec(m)?.[1] || null, core = m => m.replace(/ \(self: .*\)$/, '');
  const read = lines.map(l => doneWhen(`## Done when\n${l}\n`)[0] || {});
  const back = read.map(it => [...(it.whens || []).map(x => x.arg), it.arg].filter(Boolean));
  const inner = s => s.replace(/^\((?:when\s+)?\w+:\s*/, '').replace(/\)$/, '').trim();
  const want = req.map(([, m]) => [...Object.keys(w).map(k => WHEN[k](w[k])), core(m)].map(inner));
  if (back.some((b, i) => b.length !== marks + 1 || b.some((x, j) => x !== want[i][j]) || (read[i].self || null) !== selfOf(req[i][1]))) return { bad: ['a regex nested deeper than a marker can hold'] };
  return { lines };
}
// The selfRun commands with selfAuto among these checks that the project's last commit already held, word for word.
export function committedSelfRuns(checks, headText = (() => { const r = spawnSync('git', ['show', 'HEAD:tools/hooks/requirements.json'], { cwd: ROOT, encoding: 'utf8' }); return r.status === 0 ? r.stdout : ''; })()) {
  const runs = c => !c || typeof c !== 'object' ? [] : [...(c.toolPassed?.selfRun && c.toolPassed?.selfAuto ? [String(c.toolPassed.selfRun).trim()] : []), ...(c.anyOf || []).flatMap(runs)];
  let head = []; try { head = (JSON.parse(headText).requirements || []).flatMap(r => runs(r?.require)); } catch { }
  return [...new Set(checks.flatMap(r => runs(r?.require)).filter(c => head.includes(c)))];
}
// (a check already said by a runbook's "Done when" with the same markers is there already, not converted twice.
// Lesson (a field report): two checks moved into a runbook by hand were written again into always.md)
const listDir = d => { try { return fs.readdirSync(at(d)); } catch { return []; } };
export const pending = (rd = readText, ls = listDir) => {
  const have = rd(ALWAYS_FILE), books = ls('docs/playbooks').filter(n => n.endsWith('.md')).map(n => rd(`docs/playbooks/${n}`)).join('\n');
  const inBook = r => { const a = asItems(r); return !!a.lines && a.lines.every(l => { const m = [...l.matchAll(/\((?:file|ran|answer|prompt|tool): /g)].pop(); return m && books.includes(l.slice(m.index, l.lastIndexOf(' <!--'))); }); };
  // (a "<!-- req: <tag> -->" on a runbook's item counts like one in always.md: moved by hand, it is there. Lesson (a
  // field report): a check moved into a runbook with its tag was still called missing)
  return ownChecks(rd).filter(r => !new RegExp(`req: ${r.tag.replace(/[^\w-]/g, '')}(?![\\w-])`).test(`${have}\n${books}`) && !inBook(r));
};

// An older convert wrote "runbook used" as "(when tool: playbooks[\\/]<name>\.md)", which an edit of the runbook also
// met; it means read now. Lines written that way are rewritten to the read form, once. Lesson (a field report): every
// project converted before the change kept the old markers, and they were fixed by hand.
const OLD_FORMS = [['(when tool: playbooks[\\\\/]', '(when tool: ^Read\\b.*playbooks[\\\\/]+'], ['(when tool: skills[\\\\/]', '(when tool: ^Read\\b.*skills[\\\\/]+']];
export function migrate(text) {
  let n = 0;
  const out = String(text).split('\n').map(l => {
    let s = l;
    for (const [from, to] of OLD_FORMS) if (s.includes(from)) { s = s.split(from).join(to); if (to.includes('skills')) s = s.split('[\\\\/]SKILL\\.md').join('[\\\\/]+SKILL\\.md'); }
    if (s !== l) n++;
    return s;
  }).join('\n');
  return { text: out, n };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  if (cmd === 'pending') { const p = pending(); console.log(p.length ? `not in ${ALWAYS_FILE}: ${p.map(r => r.tag).join(', ')}` : 'none pending'); process.exit(p.length ? 1 : 0); }
  if (cmd !== 'convert') { console.log('usage: node tools/always.mjs convert [--dry-run] | pending'); process.exit(2); }
  const out = [], left = [], dry = process.argv.includes('--dry-run');
  const all = ownChecks(), todo = pending();
  for (const r of todo) { const a = asItems(r); if (a.lines) out.push(...a.lines); else left.push(`${r.tag} (${a.bad.join(', ')})`); }
  // (old "runbook used" markers in always.md become the read form)
  let have = ''; try { have = fs.readFileSync(at(ALWAYS_FILE), 'utf8'); } catch { }
  const mig = migrate(have);
  if (mig.n && !dry) fs.writeFileSync(at(ALWAYS_FILE), mig.text);
  // (what was there already, so a report needs no hand count: in always.md by its tag, or in a runbook)
  const books = listDir('docs/playbooks').filter(n => n.endsWith('.md')).map(n => readText(`docs/playbooks/${n}`)).join('\n');
  const there = all.filter(r => !todo.includes(r)), inBooks = there.filter(r => new RegExp(`req: ${r.tag.replace(/[^\w-]/g, '')}(?![\\w-])`).test(books)).length;
  console.log(`${all.length} own check(s): ${there.length} already there (${there.length - inBooks} in ${ALWAYS_FILE}, ${inBooks} in a runbook), ${todo.length} to convert; ${mig.n} old "runbook used" marker(s) rewritten to the read form${dry ? ' (dry run)' : ''}`);
  if (out.length && !dry) {
    let text = mig.text;
    if (!/^##\s+Done when\s*$/m.test(text)) text = (text.trim() ? `${text.trim()}\n\n` : HEAD.replace('## Done when\n', '')) + '## Done when\n';
    fs.mkdirSync(path.dirname(at(ALWAYS_FILE)), { recursive: true });
    fs.writeFileSync(at(ALWAYS_FILE), `${text.replace(/\s*$/, '\n')}${out.join('\n')}\n`);
  }
  console.log(`converted ${out.length} line(s) into ${ALWAYS_FILE}${process.argv.includes('--dry-run') ? ' (dry run)' : ''}`);
  // (a self-run the project already had, in its last commit, stays approved: it goes on the user's list, recorded in the
  // decisions file. One added since, by anyone, is not approved here: only the user's self-allow adds it. REQ: self-commands)
  if (!dry) { const approved = committedSelfRuns(todo);
    if (approved.length) { const { allowSelf } = await import('./hooks/selfcmds.mjs');
      for (const c of approved) if (allowSelf(ROOT, c).added) fs.appendFileSync(at('docs/DECISIONS.md'), `\n- ${new Date().toISOString().slice(0, 10)}: kept approved for the end check to run itself (converted from requirements.json, in the last commit): \`${c}\`\n`);
      console.log(`kept ${approved.length} self-run command(s) approved (they were in the last commit)`); } }
  if (left.length) { console.log(`NOT converted, move each by hand into a runbook's or ${ALWAYS_FILE}'s "Done when" (add <!-- req: <tag> --> to it):\n- ${left.join('\n- ')}`); process.exit(1); }
}
