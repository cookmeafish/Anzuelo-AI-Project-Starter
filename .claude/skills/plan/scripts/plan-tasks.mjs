#!/usr/bin/env node
// Reads a plan written with the plan skill (docs/plans/YYYY-MM-DD-<topic>.md). Read-only: it never changes the plan.
//
//   node skills/plan/scripts/plan-tasks.mjs status <plan.md>    each task with its ticked steps, and where to resume
//   node skills/plan/scripts/plan-tasks.mjs task <plan.md> <N>  the brief for task N: header, constraints, watch-for, the task
//   node skills/plan/scripts/plan-tasks.mjs check <plan.md>     the self-review checks a script can do (prints RESULT: PASS / FAIL)
//
// Exit codes: 0 fine, 1 check failed or task not found, 2 usage problem.
import fs from 'node:fs';

const [cmd, file, arg] = process.argv.slice(2);
if (!['status', 'task', 'check'].includes(cmd) || !file) {
  console.error('usage: node plan-tasks.mjs status|check <plan.md>  |  node plan-tasks.mjs task <plan.md> <N>');
  process.exit(2);
}
if (!fs.existsSync(file)) { console.error(`plan-tasks: ${file} not found`); process.exit(2); }

const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const lines = text.split('\n');

// Split into the part before the first task (header) and one block per "### Task N: name" heading.
// Headings inside code blocks are ignored.
const tasks = [];
let header = [], cur = null, inCode = false;
for (const l of lines) {
  if (/^\s*(```|~~~)/.test(l)) inCode = !inCode;
  const m = !inCode && /^#{2,4}\s+Task\s+(\d+)\s*[:.-]?\s*(.*)$/i.exec(l);
  if (m) { cur = { n: Number(m[1]), name: m[2].trim(), lines: [l] }; tasks.push(cur); continue; }
  if (cur && !inCode && /^#{1,2}\s/.test(l)) cur = null; // a new top-level section ends the task list
  (cur ? cur.lines : header).push(l);
}
const boxes = t => {
  const all = t.lines.filter(l => /^\s*[-*]\s+\[[ xX]\]/.test(l));
  return { done: all.filter(l => /\[[xX]\]/.test(l)).length, total: all.length };
};
const section = name => {
  const i = header.findIndex(l => new RegExp(`^##\\s+${name}`, 'i').test(l));
  if (i < 0) return [];
  const out = [header[i]];
  for (let j = i + 1; j < header.length && !/^##\s/.test(header[j]); j++) out.push(header[j]);
  return out;
};

if (cmd === 'status') {
  if (!tasks.length) { console.log('No "### Task N: <name>" headings found.'); process.exit(1); }
  let resume = null;
  for (const t of tasks) {
    const b = boxes(t), state = b.total && b.done === b.total ? 'done' : b.done ? 'started' : 'open';
    if (!resume && state !== 'done') resume = t;
    console.log(`Task ${t.n}: ${t.name}  [${b.done}/${b.total}] ${state}`);
  }
  const notes = lines.filter(l => /^\s*[-*]?\s*\**\d{4}-\d\d-\d\d\b/.test(l) && /decision|change|note|ruling/i.test(l)).length;
  console.log(resume ? `\nResume at Task ${resume.n}: ${resume.name}` : '\nAll tasks ticked.');
  if (notes) console.log(`Dated notes in the plan: ${notes} (read them before continuing)`);
  process.exit(0);
}

if (cmd === 'task') {
  const t = tasks.find(x => x.n === Number(arg));
  if (!t) { console.error(`plan-tasks: no Task ${arg} in ${file}`); process.exit(1); }
  const head = header.filter(l => /^#\s|^\*\*(Goal|Approach|Built with|Spec|How to run)/i.test(l));
  console.log([...head, '', ...section('Constraints'), ...section('Watch for'), ...t.lines].join('\n').replace(/\n{3,}/g, '\n\n').trim());
  process.exit(0);
}

// check
const fail = [], warn = [];
for (const f of ['Goal', 'Approach', 'Spec']) if (!header.some(l => new RegExp(`^\\*\\*${f}`, 'i').test(l))) fail.push(`header has no **${f}:** line`);
if (!section('Constraints').length) fail.push('no "## Constraints for every task" section');
const watch = section('Watch for');
if (!watch.length) fail.push('no "## Watch for" section (write "none found" only after looking)');
if (!tasks.length) fail.push('no "### Task N: <name>" headings');
tasks.forEach((t, i) => {
  const body = t.lines.join('\n');
  if (t.n !== i + 1) warn.push(`Task ${t.n}: tasks are not numbered 1, 2, 3... in order`);
  if (!/\*\*Files:?\*\*/i.test(body)) fail.push(`Task ${t.n}: no **Files:** line`);
  if (tasks.length > 1 && !/\*\*Uses\s*\/\s*provides:?\*\*/i.test(body)) warn.push(`Task ${t.n}: no **Uses / provides:** line (say "none" if it shares nothing)`);
  if (!boxes(t).total) fail.push(`Task ${t.n}: no checkbox steps ("- [ ] 1. ...")`);
  if (!/\brun\b[^\n]*`[^`]+`/i.test(body)) fail.push(`Task ${t.n}: no step that runs a command in backticks`);
  if (!/(pass|fail|prints|expect|exit)/i.test(body)) warn.push(`Task ${t.n}: no expected result stated for its checks`);
});
// Lines that decide nothing. Code blocks are skipped: tests may legitimately contain these words.
const vague = [/\bTBD\b/, /\bTODO\b/, /\bhandle (the )?edge cases\b/i, /\badd (appropriate|proper|necessary) /i, /\bvalidate (the )?input\b(?![^\n]*(reject|throw|error|return))/i,
  /\bas needed\b/i, /\bwrite tests for (the above|this)\b/i, /\bsimilar to task \d+\b/i, /\bfill in\b/i];
const loose = [/\betc\.?$/i, /\.\.\.\)?\s*$/]; // open-ended lists: a warning, since the reader may know the rest
let code = false, codeLines = 0, textLines = 0;
lines.forEach((l, i) => {
  if (/^\s*(```|~~~)/.test(l)) { code = !code; return; }
  if (code) { codeLines++; return; }
  if (l.trim()) textLines++;
  if (/<[^>\n]*>/.test(l) && !/`[^`]*<[^>]*>[^`]*`/.test(l)) warn.push(`line ${i + 1}: an <angle-bracket> placeholder left in: ${l.trim().slice(0, 70)}`);
  for (const re of vague) if (re.test(l)) { fail.push(`line ${i + 1}: decides nothing: ${l.trim().slice(0, 70)}`); break; }
  if (loose.some(re => re.test(l))) warn.push(`line ${i + 1}: open-ended list, say every item: ${l.trim().slice(0, 70)}`);
});
if (codeLines > textLines) warn.push(`code blocks are ${codeLines} of ${codeLines + textLines} lines: the plan may be doing the work. Strip bodies back to signatures and assertions`);

for (const f of fail) console.log(`FAIL ${f}`);
for (const w of warn) console.log(`WARN ${w}`);
console.log('Not checked by this script: spec coverage, names agreeing across tasks, one sensible reading per step (do those by hand).');
console.log(fail.length ? `RESULT: FAIL (${fail.length} problem(s))` : `RESULT: PASS${warn.length ? ` with ${warn.length} warning(s)` : ''}`);
process.exit(fail.length ? 1 : 0);
