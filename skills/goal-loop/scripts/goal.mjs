#!/usr/bin/env node
// The goal loop's log (skills/goal-loop/SKILL.md): docs/plans/YYYY-MM-DD-goal-<slug>.md.
//
//   node skills/goal-loop/scripts/goal.mjs new "<goal>"   writes a new log with the five lines to fill; prints its path
//   node skills/goal-loop/scripts/goal.mjs check <log>    the form a script can check (prints RESULT: PASS / FAIL)
//
// check: the five lines are filled; a baseline comes before any round; each round has a value, the guard and kept or
// undone; a kept round had the guard passing; no more rounds than the limit; a closed log has its status line.
// Exit codes: 0 fine, 1 check failed, 2 usage problem.
import fs from 'node:fs';
import path from 'node:path';

const [cmd, arg] = process.argv.slice(2);
const FIELDS = ['Goal', 'Measure', 'Bar', 'Limit', 'Guard'];

if (cmd === 'new' && arg) {
  const day = new Date().toISOString().slice(0, 10);
  const slug = arg.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'goal';
  const file = path.join('docs', 'plans', `${day}-goal-${slug}.md`);
  if (fs.existsSync(file)) { console.log(`${file} already exists: resume it, or pick another wording`); process.exit(2); }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `# Goal loop: ${arg}\n\nGoal: ${arg}\nMeasure: \nBar: \nLimit: 5\nGuard: \n\n- [ ] Goal met, or the loop stopped with its reason (the Result section)\n\n## Rounds\n\n## Result\n`);
  console.log(file);
  process.exit(0);
}
if (cmd !== 'check' || !arg) { console.log('usage: goal.mjs new "<goal>" | goal.mjs check <log>'); process.exit(2); }

let text = '';
try { text = fs.readFileSync(arg, 'utf8'); } catch { console.log(`RESULT: FAIL\n- ${arg} not found`); process.exit(1); }
const problems = [];
const field = n => (new RegExp(`^${n}:[ \\t]*(.*)$`, 'mi').exec(text)?.[1] || '').trim();
for (const f of FIELDS) if (!field(f)) problems.push(`"${f}:" is empty`);
const limit = Number(field('Limit')) || 0;
if (field('Limit') && !limit) problems.push('"Limit:" is not a number of rounds');
const lines = text.split(/\r?\n/);
const base = lines.findIndex(l => /^\s*-\s*Baseline:/i.test(l));
const rounds = lines.map((l, i) => ({ l, i })).filter(x => /^\s*-\s*Round\s+\d+:/i.test(x.l));
if (rounds.length && (base < 0 || base > rounds[0].i)) problems.push('no "- Baseline:" line before the first round');
for (const { l } of rounds) {
  const n = /Round\s+(\d+)/i.exec(l)[1], parts = l.split('|').map(s => s.trim());
  const guard = /guard:\s*(pass|fail)/i.exec(l)?.[1]?.toLowerCase(), verdict = /\|\s*(kept|undone)\b/i.exec(l)?.[1]?.toLowerCase();
  if (parts.length < 4 || !guard || !verdict) problems.push(`Round ${n} needs "<change> | <value> | guard: pass|fail | kept|undone"`);
  else if (verdict === 'kept' && guard === 'fail') problems.push(`Round ${n} was kept with the guard failing: undo it`);
}
if (limit && rounds.length > limit) problems.push(`${rounds.length} rounds, over the limit of ${limit}`);
const closed = /^\s*[-*] \[[xX]\]/m.test(text), status = /^status:\s*(done|dropped)\b.*$/im.exec(text)?.[0];
if (closed && !status) problems.push('the box is ticked but the Result section has no "status: done - <met, limit or stalled>" line');
if (status && !closed) problems.push('the Result has its status line but the box is not ticked');
console.log(problems.length ? `RESULT: FAIL\n${problems.map(p => `- ${p}`).join('\n')}` : `RESULT: PASS (${rounds.length} round(s)${status ? `, ${status}` : ', open'})`);
process.exit(problems.length ? 1 : 0);
