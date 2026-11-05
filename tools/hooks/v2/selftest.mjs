#!/usr/bin/env node
// Engine v2 self-test: a scratch project with one runbook, and transcripts of real turn shapes. Runs in seconds.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-'));
process.env.ANZUELO_ROOT = dir;
const put = (f, s) => { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), s); };
put('docs/playbooks/export.md', `---
name: export
triggers: csv export, export the orders
---
# Export
## Steps
1. Write it.
## Done when
1. The tests pass (ran: npm test|pytest)
2. The change is in the changelog (file: docs/CHANGELOG.md)
3. The answer says how it was checked (answer: how it was checked)
4. The output reads well for a person, which only a
   reader can judge (judgment: taste)
`);
put('docs/playbooks/long.md', `---\ntriggers: long job\n---\n## Done when\n${Array.from({ length: 14 }, (_, i) => `${i + 1}. Step number ${i + 1} is done`).join('\n')}\n`);
const { reminder, MAX_LINES } = await import('./start.mjs');
const { missing, onStop } = await import('./end.mjs');
const { turnRows, turnActs } = await import('./lib.mjs');

let pass = 0, fail = 0;
const report = (ok, name, detail = '') => { if (ok) pass++; else { fail++; console.log(`FAIL  ${name}  -> ${detail}`); } };
let id = 0;
const user = text => ({ type: 'user', message: { role: 'user', content: text } });
const call = (name, input, result = 'ok', error = false) => { const k = `t${++id}`; return [
  { type: 'assistant', message: { content: [{ type: 'tool_use', id: k, name, input }] } },
  { type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: k, content: result, is_error: error }] } }]; };
const say = text => ({ type: 'assistant', message: { content: [{ type: 'text', text }] } });
const transcript = rows => { const f = path.join(dir, `t${++id}.jsonl`); fs.writeFileSync(f, rows.flat().map(r => JSON.stringify(r)).join('\n') + '\n'); return f; };
const turn = { runbook: 'docs/playbooks/export.md' };
const acts = rows => turnActs(turnRows(transcript(rows)));

// start: the reminder
const r = reminder('can you add a CSV export for the orders page');
report(r.book?.name === 'export' && /^Runbook: open docs\/playbooks\/export\.md/.test(r.text) && /Done when:\n1\. The tests pass/.test(r.text) && !/ran:|file:|answer:|judgment:|REQ/.test(r.text),
  'start: a matching request gets the runbook and its Done-when list, in plain words', r.text);
report(/4\. The output reads well for a person, which only a reader can judge$/m.test(r.text), 'start: an item that wraps onto a second line is shown whole, without its check marker', r.text);
report(reminder('what time is it').text === '', 'start: a request no runbook fits gets nothing');
const long = reminder('start the long job now').text.split('\n');
report(long.length <= MAX_LINES && /more in docs\/playbooks\/long\.md/.test(long.at(-1)), `start: the reminder is at most ${MAX_LINES} lines`, long.length);

// end: check 1
const read = call('Read', { file_path: path.join(dir, 'docs/playbooks/export.md') });
const edit = call('Edit', { file_path: path.join(dir, 'src/export.js'), old_string: 'a', new_string: 'b' });
const log = call('Edit', { file_path: path.join(dir, 'docs/CHANGELOG.md'), old_string: 'a', new_string: 'b' });
const good = [user('add a csv export'), read, edit, call('Bash', { command: 'npm test' }, 'Tests: 4 passed'), log, say('Done. How it was checked: npm test, 4 pass.')];
report(missing(turn, acts(good)).length === 0, 'end: a turn that met every checkable item passes', missing(turn, acts(good)));
const noRead = missing(turn, acts([user('add a csv export'), edit, call('Bash', { command: 'npm test' }), log, say('How it was checked: tests.')]));
report(noRead.length === 1 && /Open docs\/playbooks\/export\.md/.test(noRead[0]), 'end: work done without opening the runbook is named', noRead);
const failed = missing(turn, acts([user('add a csv export'), read, edit, call('Bash', { command: 'npm test' }, 'Tests: 1 failed', true), log, say('How it was checked: tests.')]));
report(failed.length === 1 && /item 1: The tests pass/.test(failed[0]), 'end: tests that ran and failed do not count as run', failed);
const noLog = missing(turn, acts([user('add a csv export'), read, edit, call('Bash', { command: 'pytest -q' }), say('Shipped.')]));
report(noLog.length === 2 && noLog.some(s => /item 2/.test(s)) && noLog.some(s => /item 3/.test(s)) && !noLog.some(s => /item 4/.test(s)),
  'end: a missing changelog and answer line are named; a judgment item never is', noLog);
report(missing(turn, acts([user('what does the csv export do?'), say('It writes one row per order.')])).length === 0,
  'end: a text-only answer is never checked against the runbook');
const earlier = missing(turn, acts([user('add a csv export'), read, edit, call('Bash', { command: 'npm test' }), log, say('How it was checked: tests.'), user('and the totals row?'), edit, say('Added.')]));
report(earlier.some(s => /item 1/.test(s)) && earlier.some(s => /Open/.test(s)), 'end: only this turn counts, not what an earlier turn did', earlier);
report(missing({ runbook: null }, acts([user('fix it'), edit, say('Fixed.')])).length === 0, 'end: a turn no runbook fit is not held to one');
report(onStop({ stop_hook_active: true, transcript_path: transcript([user('add a csv export'), edit]), session_id: 's' }) === null, 'end: never blocks twice in one turn');
const viaCmd = missing(turn, acts([user('add a csv export'), read, edit, call('Bash', { command: 'npm test' }), call('Bash', { command: 'echo "- csv export" >> docs/CHANGELOG.md' }), say('How it was checked: tests.')]));
report(viaCmd.length === 0, 'end: a file changed by a command counts as changed', viaCmd);

// end: check 2, tests
const { testGaps } = await import('./lib.mjs');
put('package.json', JSON.stringify({ scripts: { test: 'node --test tests/*.test.mjs' } }));
const code = call('Edit', { file_path: path.join(dir, 'src/a.js'), old_string: 'a', new_string: 'b' });
report(testGaps(acts([user('fix the total'), code, say('Fixed.')])).some(s => /Run the tests after the last code change/.test(s)), 'end: code changed with no test run after it is named');
report(testGaps(acts([user('fix the total'), code, call('Bash', { command: 'node --test tests/*.test.mjs' }), say('Fixed, tests pass.')])).length === 0
  && testGaps(acts([user('fix the total'), code, call('Bash', { command: 'npm test 2>&1 | tail -5' }), say('Fixed.')])).length === 0,
  'end: the project\'s test script counts under either name (npm test or the command it maps to)');
report(testGaps(acts([user('fix the total'), call('Bash', { command: 'npm test' }), code, say('Fixed.')])).length === 1, 'end: a test run before the last change does not cover it');
report(testGaps(acts([user('fix the total'), code, call('Bash', { command: 'npm test' }, 'Tests: 2 failed', true), say('Fixed.')])).length === 1, 'end: a failing test run does not count');
report(testGaps(acts([user('is the export fine?'), say('Yes, all 12 tests passed.')])).some(s => /no test run passed in this turn/.test(s)), 'end: an answer that claims passing tests with no run this turn is named');
report(testGaps(acts([user('tidy the notes'), call('Edit', { file_path: path.join(dir, 'notes/a.md'), old_string: 'a', new_string: 'b' }), say('Tidied.')])).length === 0, 'end: a change to notes, not code, asks for no tests');

fs.rmSync(dir, { recursive: true, force: true });
console.log(`v2 selftest: ${fail ? 'FAIL' : 'ALL PASS'} (${pass} passed, ${fail} failed)`);
process.exit(fail ? 1 : 0);
