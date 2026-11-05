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
menu: C3
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
put('docs/playbooks/windows.md', '---\r\nname: windows\r\ntriggers: rotate the logs\r\nmenu: W1\r\n---\r\n# Logs\r\n## Done when\r\n1. The old logs are zipped (file: logs/*.zip)\r\n');
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
report(reminder('C3 --since monday --format xlsx').book?.name === 'export' && !reminder('C31 rows').book && !reminder('version C3 is out').book, 'start: a menu code at the start routes to its runbook; a longer code or one mid-sentence does not');
const win = reminder('please rotate the logs tonight');
report(win.book?.name === 'windows' && reminder('W1').book?.name === 'windows' && /1\. The old logs are zipped$/m.test(win.text), 'start: a runbook saved with Windows line endings routes and shows its list', win.text);
const { typed } = await import('./lib.mjs');
report(!typed({ type: 'user', message: { content: '<local-command-stdout>Login successful.</local-command-stdout>' } }) && typed({ type: 'user', message: { content: 'export the orders' } }), 'start: terminal output from a local command is not a typed request');
report(reminder('what time is it').text === '', 'start: a request no runbook fits gets nothing');
put('DIRECTORY.md', '# Directory\n'); put('skills/learn-from-upset/SKILL.md', '# Learn from upset\n');
report(/pick the runbook in DIRECTORY\.md/.test(reminder('the totals look off on the summary page').text) && !reminder('the totals look off').book,
  'start: when no trigger fits, one line asks the agent to pick and open the fitting runbook');
const { upset } = await import('./start.mjs');
report(/learn-from-upset/.test(reminder('WHY DID YOU BREAK THE EXPORT AGAIN').text) && /learn-from-upset/.test(reminder('ugh, you forgot the totals row').text)
  && upset('the export still has issues because ur not following the format') && upset('i dont think you understand the totals')
  && !upset('still working?') && !upset('why do you think the export is slow?') && !upset('B2 CSV export --path out/orders') && !upset('add a CSV export'),
  'start: an upset message (capitals or frustration words) goes to the learn-from-upset skill; plain questions and codes do not');
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
report(missing({ runbook: null }, acts([user('fix it'), edit, say('Fixed.')])).length === 0, 'end: a turn no runbook fit, and that opened none, is not held to one');
const chose = missing({ runbook: null }, acts([user('fix the orders file'), read, edit, say('Fixed.')]));
report(chose.some(s => /export\.md item 1/.test(s)) && !chose.some(s => /^Open/.test(s)), 'end: with none routed, the runbook the agent opened is the one the turn is held to', chose);
report(onStop({ stop_hook_active: true, transcript_path: transcript([user('add a csv export'), edit]), session_id: 's' }) === null, 'end: never blocks twice in one turn');
put('docs/CHANGELOG.md', '# Changelog\n');
const turnStart = new Date(Date.now() + 50).toISOString();
const onlyNamed = missing(turn, { ...acts([user('add a csv export'), read, edit, call('Bash', { command: 'npm test' }), call('Bash', { command: 'cat docs/CHANGELOG.md' }), say('How it was checked: tests.')]), at: turnStart });
report(onlyNamed.some(s => /item 2/.test(s)), 'end: a command that only names a file (cat) does not count as changing it', onlyNamed);
await new Promise(r => setTimeout(r, 120));
fs.appendFileSync(path.join(dir, 'docs/CHANGELOG.md'), '- csv export\n');
const viaCmd = missing(turn, { ...acts([user('add a csv export'), read, edit, call('Bash', { command: 'npm test' }), call('Bash', { command: 'node tools/log.mjs "csv export"' }), say('How it was checked: tests.')]), at: turnStart });
report(viaCmd.length === 0, 'end: a file a script changed during the turn counts as changed', viaCmd);

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
report(testGaps(acts([user('upgrade the engine'), call('Bash', { command: 'node tools/hooks/selfcheck.mjs --full > .cache/sc.txt; tail -1 .cache/sc.txt' }, 'selfcheck: ALL PASS (1655 passed, 0 failed)'), say('Upgraded: 1655 passed.')])).length === 0,
  'end: a project\'s own test command whose output shows a passing summary backs "N passed"');
report(testGaps(acts([user('upgrade the engine'), call('Bash', { command: 'node tools/check.mjs' }, 'checks: 12 passed, 2 failed'), say('Done, 12 passed.')])).length === 1,
  'end: an output with failures does not back "passed"');
const resumed = turnRows(transcript([user('fix the export'), code, { type: 'user', isCompactSummary: true, message: { role: 'user', content: 'This session is being continued from a previous conversation that ran out of context.' } }, say('Continuing.')]));
report(resumed.length === 5, 'end: the summary that resumes a session is not a new request, so the turn keeps its earlier work', resumed.length);
fs.rmSync(path.join(dir, 'package.json')); put('pyproject.toml', '[project]\nname = "tool"\n');
report(testGaps(acts([user('fix the total'), code, say('Fixed.')])).length === 0, 'end: a build file alone (pyproject.toml, no test setup) asks for no tests');
put('tools/gui/test_panel.py', 'def test_x(): pass\n');
report(testGaps(acts([user('fix the total'), code, say('Fixed.')])).length === 1, 'end: test files in the project (test_*.py) count as a test setup');
fs.rmSync(path.join(dir, 'tools'), { recursive: true });
put('pyproject.toml', '[project]\nname = "tool"\n[tool.pytest.ini_options]\n');
report(testGaps(acts([user('fix the total'), code, say('Fixed.')])).length === 1, 'end: a configured pytest asks for a test run after a code change');
report(testGaps(acts([user('tidy the notes'), call('Edit', { file_path: path.join(dir, 'notes/a.md'), old_string: 'a', new_string: 'b' }), say('Tidied.')])).length === 0, 'end: a change to notes, not code, asks for no tests');
report(testGaps(acts([user('fix the total'), call('Write', { file_path: path.join(dir, '.cache/fix.py'), content: 'x' }), call('Write', { file_path: path.join(os.tmpdir(), 'scratch.py'), content: 'x' }), say('Fixed.')])).length === 0,
  'end: a scratch script in .cache or outside the project is not project code');
const helperStart =new Date(Date.now() + 50).toISOString();
await new Promise(r => setTimeout(r, 120));
put('src/helper.py', 'x = 1\n');
report(testGaps({ ...acts([user('fix the total'), call('Agent', { prompt: 'fix it' }), say('Fixed.')]), at: helperStart }).length === 1, 'end: code a helper or script changed during the turn asks for a test run');
const ranLater = acts([user('fix the total'), call('Agent', { prompt: 'fix it' }), call('Bash', { command: 'pytest -q' }, '3 passed'), say('Fixed, 3 passed.')]);
ranLater.calls[1].done = Date.now() + 1000;
report(testGaps({ ...ranLater, at: helperStart }).length === 0, 'end: a passing test run after the helper\'s change covers it');

// end: the project's own declared checks (config.json commitGate)
const { gateGaps } = await import('./lib.mjs');
put('tools/hooks/config.json', JSON.stringify({ commitGate: [{ cmd: 'python site/verify\\.py && node site/controls\\.js', when: ['site/**'] }] }));
const siteEdit = call('Edit', { file_path: path.join(dir, 'site/page.html'), old_string: 'a', new_string: 'b' });
const gNone = gateGaps(acts([user('fix the page'), siteEdit, say('Fixed.')]));
report(gNone.length === 2 && /python site\/verify\.py/.test(gNone[0]), 'end: a change to files a declared check covers asks for each part of that check', gNone);
report(gateGaps(acts([user('fix the page'), siteEdit, call('Bash', { command: 'python site/verify.py' }), call('Bash', { command: 'node site/controls.js' }), say('Fixed.')])).length === 0,
  'end: the parts run one at a time after the change count');
report(gateGaps(acts([user('fix the page'), call('Bash', { command: 'python site/verify.py && node site/controls.js' }), siteEdit, say('Fixed.')])).length === 2, 'end: a declared check run before the change does not cover it');
report(gateGaps(acts([user('fix the page'), siteEdit, call('Bash', { command: 'python site/verify.py && node site/controls.js' }, 'Exit code 1', true), say('Fixed.')])).length === 2, 'end: a failing declared check does not count');
fs.rmSync(path.join(dir, 'pyproject.toml'));
put('tools/hooks/config.json', JSON.stringify({ test: 'node site/page-test.mjs && python site/verify.py' }));
const page = call('Edit', { file_path: path.join(dir, 'site/page.js'), old_string: 'a', new_string: 'b' });
report(testGaps(acts([user('fix the page'), page, say('Fixed.')])).length === 1
  && testGaps(acts([user('fix the page'), page, call('Bash', { command: 'cd site && node site/page-test.mjs' }, 'done'), say('Fixed.')])).length === 0,
  'end: the project\'s declared test command (config "test") is its test setup and counts as a test run');
put('tools/hooks/config.json', JSON.stringify({ commitGate: [{ cmd: 'python site/verify\\.py && node site/controls\\.js', when: ['site/**'] }] }));
report(gateGaps(acts([user('tidy the notes'), call('Edit', { file_path: path.join(dir, 'notes/a.md'), old_string: 'a', new_string: 'b' }), say('Tidied.')])).length === 0, 'end: a change outside a declared check\'s files asks for nothing');

// end: check 3, screens
const { screenGaps } = await import('./lib.mjs');
const css = call('Edit', { file_path: path.join(dir, 'web/site.css'), old_string: 'a', new_string: 'b' });
const shoot = call('Bash', { command: 'node tools/screenshot.mjs --file web/index.html' }, 'SCREENSHOT: .cache/gui-review/1/index.png');
const look = call('Read', { file_path: path.join(dir, '.cache/gui-review/1/index.png') });
report(screenGaps(acts([user('make the header blue'), css, say('Done.')])).length === 0, 'end: a project with no screenshot tool is not asked for screenshots');
put('tools/screenshot.mjs', '// shots\n');
report(screenGaps(acts([user('make the header blue'), css, say('Done.')])).length === 1, 'end: a changed screen with no screenshots is named');
report(screenGaps(acts([user('make the header blue'), css, shoot, say('Done.')])).length === 1, 'end: screenshots taken but never looked at do not count');
report(screenGaps(acts([user('make the header blue'), css, shoot, look, say('Done.')])).length === 0, 'end: screenshots taken after the change and looked at pass');
report(screenGaps(acts([user('make the header blue'), shoot, look, css, say('Done.')])).length === 1, 'end: screenshots from before the last change do not cover it');
report(screenGaps(acts([user('tidy the notes'), call('Edit', { file_path: path.join(dir, 'docs/ui/a.html'), old_string: 'a', new_string: 'b' }), call('Write', { file_path: path.join(dir, '.cache/x.html'), content: 'x' }), say('Tidied.')])).length === 0,
  'end: pages under docs or .cache are not screens');
report(screenGaps(acts([user('fix the paste test'), call('Edit', { file_path: path.join(dir, 'app/gui/test_text.py'), old_string: 'a', new_string: 'b' }), call('Edit', { file_path: path.join(dir, 'app/gui/fixtures/fake.py'), old_string: 'a', new_string: 'b' }), say('Fixed.')])).length === 0
  && screenGaps(acts([user('fix the panel'), call('Edit', { file_path: path.join(dir, 'app/gui/panel.py'), old_string: 'a', new_string: 'b' }), say('Fixed.')])).length === 1,
  'end: tests and fixtures in a gui folder are not screens; the gui code itself is');

// shadow: beside v1, v2 only logs
const { shadow } = await import('./shadow.mjs');
const shadowLog = path.join(dir, 'tools/hooks/state/v2-shadow.jsonl');
const printed = []; const write = process.stdout.write; process.stdout.write = s => { printed.push(s); return true; };
try {
  shadow('prompt', { session_id: 'sh', prompt: 'add a csv export' });
  shadow('stop', { session_id: 'sh', transcript_path: transcript([user('add a csv export'), edit, say('Done.')]) });
  shadow('stop', { session_id: 'sh', stop_hook_active: true, transcript_path: transcript([user('add a csv export'), edit, say('Done.')]) });
} finally { process.stdout.write = write; }
const logged = fs.readFileSync(shadowLog, 'utf8').trim().split('\n').map(l => JSON.parse(l));
report(!printed.length && logged.length === 2 && /Runbook: open docs\/playbooks\/export\.md/.test(logged[0].reminder) && /Open docs\/playbooks\/export\.md/.test(logged[1].block),
  'shadow: logs the reminder and the block it would have given, prints nothing, and skips the repeat Stop', { printed, logged });

fs.rmSync(dir, { recursive: true, force: true });
console.log(`v2 selftest: ${fail ? 'FAIL' : 'ALL PASS'} (${pass} passed, ${fail} failed)`);
process.exit(fail ? 1 : 0);
