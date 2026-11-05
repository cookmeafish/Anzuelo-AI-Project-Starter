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
const { turnRows, turnActs, worked } = await import('./lib.mjs');

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
{
  const { doneWhen } = await import('./lib.mjs');
  const [both] = doneWhen('## Done when\n- [ ] The plan is saved in `docs/plans/` (hook: plan-saved; judgment: the reader) (file: docs/plans/*.md).\n');
  report(both.kind === 'file' && both.arg === 'docs/plans/*.md' && both.text === 'The plan is saved in docs/plans/', 'start: an item with the old engine\'s marker and v2\'s keeps v2\'s check and shows neither', both);
}
const r = reminder('can you add a CSV export for the orders page');
report(r.book?.name === 'export' && /^Runbook: open docs\/playbooks\/export\.md/.test(r.text) && /Done when:\n1\. The tests pass/.test(r.text) && !/ran:|file:|answer:|judgment:|REQ/.test(r.text),
  'start: a matching request gets the runbook and its Done-when list, in plain words', r.text);
{
  const { route } = await import('./lib.mjs');
  const books = [{ file: 'docs/playbooks/engine.md', name: 'engine', triggers: ['upgrade the engine'], menu: [] }, { file: 'docs/playbooks/project.md', name: 'project', triggers: ['audit', 'sweep'], menu: [] }];
  const msg = 'Engine upgrade 1a2b3c is ready in your linked starter copy. It fixes the audit sweep. Run node tools/starter.mjs upgrade.';
  report(route(msg, books)?.name === 'engine', 'start: an engine upgrade message goes to the engine runbook, not to a runbook named by words in its list of fixes', route(msg, books)?.name);
  put('.starter-template', ''); const inStarter = route(msg, books)?.name; fs.rmSync(path.join(dir, '.starter-template'));
  report(inStarter === 'project', 'start: in the starter itself an upgrade message is a report back and routes on its other words', inStarter);
}
{
  const { onPrompt } = await import('./start.mjs');
  const { loadTurn } = await import('./lib.mjs');
  onPrompt({ session_id: 'notice', prompt: 'can you add a CSV export for the orders page' });
  const out = onPrompt({ session_id: 'notice', prompt: '<task-notification>\n<task-id>b1</task-id>\n<status>completed</status>\n</task-notification>' });
  report(out === null && loadTurn('notice').runbook === 'docs/playbooks/export.md', 'start: a background-job notice mid-turn adds no reminder and keeps the runbook the turn was routed to', [out, loadTurn('notice').runbook]);
}
report(/4\. The output reads well for a person, which only a reader can judge$/m.test(r.text), 'start: an item that wraps onto a second line is shown whole, without its check marker', r.text);
report(reminder('C3 --since monday --format xlsx').book?.name === 'export' && !reminder('C31 rows').book && !reminder('version C3 is out').book, 'start: a menu code at the start routes to its runbook; a longer code or one mid-sentence does not');
const win = reminder('please rotate the logs tonight');
report(win.book?.name === 'windows' && reminder('W1').book?.name === 'windows' && /1\. The old logs are zipped$/m.test(win.text), 'start: a runbook saved with Windows line endings routes and shows its list', win.text);
const { typed } = await import('./lib.mjs');
report(!typed({ type: 'user', message: { content: '<local-command-stdout>Login successful.</local-command-stdout>' } }) && typed({ type: 'user', message: { content: 'export the orders' } }), 'start: terminal output from a local command is not a typed request');
report(reminder('what time is it').text === '', 'start: a request no runbook fits gets nothing');
{
  // a phrase that opens the request names its job, even when a longer phrase of another runbook comes later
  put('docs/playbooks/orders-loop.md', '---\nname: orders-loop\ntriggers: orders loop\n---\n## Done when\n1. The loop ran\n');
  const r = reminder('Orders loop: pick up where it is, then export the orders for the week');
  report(r.book?.name === 'orders-loop' && reminder('please export the orders, the orders loop can wait').book?.name === 'export',
    'start: a trigger that opens the request wins over a longer one later; mid-sentence the longest still wins', r.text);
  fs.rmSync(path.join(dir, 'docs/playbooks/orders-loop.md'));
}
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
{
  // the items no script can check: the agent goes over them once at the end of a work turn, in the one block
  const { toVerify } = await import('./end.mjs');
  const v = toVerify(turn, acts(good)), stop = onStop({ transcript_path: transcript(good), session_id: 'verify1' });
  report(v?.file === 'docs/playbooks/export.md' && v.items.map(i => i.n).join() === '4' && /reads well for a person, which only a reader can judge$/.test(v.items[0].text)
    && /Check that these items of docs\/playbooks\/export\.md are really done[\s\S]*\n4\. The output reads well/.test(stop?.reason || '') && !/Not done yet/.test(stop?.reason || ''),
    'end: on a work turn the runbook\'s items no script can check are listed once for the agent to verify; met checkable ones are not', stop?.reason);
  report(toVerify(turn, acts([user('what does the csv export do?'), read, say('It writes one row per order.')])) === null && toVerify({ runbook: null }, acts([user('fix it'), edit, say('Fixed.')])) === null
    && onStop({ stop_hook_active: true, transcript_path: transcript(good), session_id: 'verify1' }) === null,
    'end: a question, a turn with no runbook, and the repeat Stop get no verify list');
}
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

{
  // a project with a large .cache: a change elsewhere is still seen
  for (let k = 0; k < 2100; k++) put(`.cache/bulk/f${k}.txt`, 'x');
  const bulkStart = new Date(Date.now() + 50).toISOString();
  await new Promise(r => setTimeout(r, 120));
  fs.appendFileSync(path.join(dir, 'docs/CHANGELOG.md'), '- bulk\n');
  const bulk = missing(turn, { ...acts([user('add a csv export'), read, edit, call('Bash', { command: 'npm test' }), call('Bash', { command: 'node tools/log.mjs' }), say('How it was checked: tests.')]), at: bulkStart });
  report(!bulk.some(s => /item 2/.test(s)), 'end: thousands of files in .cache do not hide a change elsewhere', bulk);
  fs.rmSync(path.join(dir, '.cache/bulk'), { recursive: true });
}

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
report(testGaps(acts([user('Another session: the upgrade is in, selfcheck 1635 passed, 0 failed.'), say('The project is upgraded and its 1635 tests passed.')])).length === 0
  && testGaps(acts([user('how is the project?'), call('Bash', { command: 'tail -1 ../app/.cache/selfcheck-last.txt' }, 'selfcheck: ALL PASS (1635 passed)'), say('Its tests passed.')])).length === 0,
  'end: an answer relaying a result this turn heard or read (a message, a report file) is not asked to run the tests itself');
const resumed = turnRows(transcript([user('fix the export'), code, { type: 'user', isCompactSummary: true, message: { role: 'user', content: 'This session is being continued from a previous conversation that ran out of context.' } }, say('Continuing.')]));
report(resumed.length === 5, 'end: the summary that resumes a session is not a new request, so the turn keeps its earlier work', resumed.length);
{
  // (the host writes a message from another session as a meta row, and the prompt hook runs on it: a new turn)
  const peer = { type: 'user', isMeta: true, message: { role: 'user', content: 'Another Claude session sent a message: <cross-session-message from="x">a note</cross-session-message>' } };
  const hooked = { type: 'attachment', attachment: { type: 'hook_additional_context', hookEvent: 'UserPromptSubmit', content: [] } };
  const p = turnActs(turnRows(transcript([user('fix the export'), code, say('Fixed.'), peer, hooked, call('Bash', { command: 'git log -3' }), say('Noted.')])));
  report(!worked(p), 'end: a message from another session that starts a turn is that turn\'s start, so the earlier turn\'s edits are not this turn\'s work', p.calls.map(c => c.name));
  const mid = turnActs(turnRows(transcript([user('fix the export'), code, { type: 'attachment', attachment: { type: 'queued_command', prompt: 'a note' } }, hooked, say('Fixed.')])));
  report(worked(mid), 'end: a message from another session that arrives mid-turn does not split the turn', mid.calls.map(c => c.name));
}
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

// end: check 4, the health check
const { healthGaps } = await import('./lib.mjs');
const rule = call('Edit', { file_path: path.join(dir, 'docs/playbooks/export.md'), old_string: 'a', new_string: 'b' });
report(healthGaps(acts([user('add a step'), rule, say('Added.')])).length === 0, 'end: a project with no health check is not asked for one');
put('tools/audit.mjs', `import fs from 'node:fs'; fs.appendFileSync('tools/ran.txt', 'x'); const f = fs.readFileSync('tools/fail.txt', 'utf8'); if (f.trim()) { console.log('FAIL  ' + f.trim() + '  (2 files)'); process.exit(1); } console.log('audit: PASS');`);
put('tools/fail.txt', 'runbook steps');
const ranCount = () => { try { return fs.readFileSync(path.join(dir, 'tools/ran.txt'), 'utf8').length; } catch { return 0; } };
report(healthGaps(acts([user('fix the export'), code, say('Fixed.')])).length === 0 && ranCount() === 0, 'end: a turn that changed no rule, runbook, check or skill does not run the health check');
const hFail = healthGaps(acts([user('add a step'), rule, say('Added.')]));
report(hFail.length === 1 && /health check .*fails.*runbook steps/.test(hFail[0]) && ranCount() === 1, 'end: a structural change runs the health check, and a failure is named', hFail);
report(healthGaps(acts([user('add another step'), rule, say('Added.')])).length === 0, 'end: a failure already reported on an earlier turn is not asked about again');
put('tools/fail.txt', 'skill mirror');
report(healthGaps(acts([user('add a third step'), rule, say('Added.')])).length === 1, 'end: a new failure is asked about');
put('tools/fail.txt', 'publish safety\n        - library/other.md: a private term');
const untouched = healthGaps(acts([user('add a fourth step'), rule, say('Added.')]));
put('tools/fail.txt', 'name check\n        - docs/playbooks/export.md: a typed-out name');
const mine = healthGaps(acts([user('add a fifth step'), rule, say('Added.')]));
report(untouched.length === 0 && mine.length === 1, 'end: a new failure that names only files the turn did not touch is not its; one naming a changed file is', { untouched, mine });
put('tools/fail.txt', 'skill mirror');
const before = ranCount();
report(healthGaps(acts([user('add a step'), rule, call('Bash', { command: 'node tools/audit.mjs' }, 'audit: PASS (30 sweeps)'), say('Added.')])).length === 0 && ranCount() === before,
  'end: a passing health check the agent ran after the change is enough; it is not run again');
report(/would run/.test(healthGaps(acts([user('add a step'), rule, say('Added.')]), { run: false })[0] || '') && ranCount() === before, 'end: in shadow the health check is only noted, never run');
fs.rmSync(path.join(dir, 'tools/audit.mjs'));

// end: check 5, knowledge sources
const { knowledgeGaps } = await import('./lib.mjs');
const fact = (text, f = 'docs/knowledge/tides.md') => call('Edit', { file_path: path.join(dir, f), old_string: 'a', new_string: text });
const plain = 'The spring tide at the north pier reaches 4.2 metres in March, and the harbour closes for two days each year.';
report(knowledgeGaps(acts([user('add the tide facts'), fact(plain), say('Added.')])).length === 1, 'end: new knowledge text with no source is named');
report(knowledgeGaps(acts([user('add the tide facts'), fact(plain + ' Source: https://example.org/tides (read 2026-11-05).'), say('Added.')])).length === 0
  && knowledgeGaps(acts([user('add the tide facts'), fact(plain + ' (observed, 2026-11-05, from data/tides.csv)'), say('Added.')])).length === 0
  && knowledgeGaps(acts([user('add the tide facts'), fact(plain + ' The user said this on 2026-11-05.'), say('Added.')])).length === 0,
  'end: a link, a project file or the user as the source passes');
report(knowledgeGaps(acts([user('add the tide facts'), fact(plain), call('Edit', { file_path: path.join(dir, 'docs/knowledge/SOURCES.md'), old_string: 'a', new_string: '| tides | https://example.org |' }), say('Added.')])).length === 0,
  'end: a sources list edited in the same turn covers the new facts');
report(knowledgeGaps(acts([user('fix a typo'), fact('Tides'), fact(plain, 'docs/knowledge/README.md'), fact(plain, 'notes/tides.md'), say('Fixed.')])).length === 0,
  'end: a short fix, the knowledge index files and notes outside the knowledge base ask for nothing');
{
  const { execSync } = await import('node:child_process');
  const git = c => execSync(`git ${c}`, { cwd: dir, stdio: 'pipe' });
  put('docs/knowledge/pier.md', '# Pier\n'); git('init -q'); git('-c user.name=t -c user.email=t@t add docs/knowledge/pier.md'); git('-c user.name=t -c user.email=t@t commit -q -m base');
  const kStart = new Date(Date.now() + 50).toISOString();
  await new Promise(r => setTimeout(r, 120));
  fs.appendFileSync(path.join(dir, 'docs/knowledge/pier.md'), plain + '\n');
  const merged = [user('merge the tide notes'), call('Bash', { command: 'python merge.py' }), say('Merged.')];
  report(knowledgeGaps({ ...acts(merged), at: kStart }).length === 1, 'end: facts a script added to the knowledge base with no source are named (live turn)');
  fs.appendFileSync(path.join(dir, 'docs/knowledge/pier.md'), 'Source: https://example.org/pier\n');
  report(knowledgeGaps({ ...acts(merged), at: kStart }).length === 0, 'end: a script that added the facts with their source passes');
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true });
}

// end: check 6, security review
const { securityGaps } = await import('./lib.mjs');
const login = call('Edit', { file_path: path.join(dir, 'src/login.js'), old_string: 'a', new_string: 'const ok = await bcrypt.compare(password, user.hash);' });
report(securityGaps(acts([user('add sign-in'), login, say('Done.')])).length === 0, 'end: a project that declares no security pattern is not checked');
put('tools/hooks/requirements.json', JSON.stringify({ requirements: [{ tag: 'security-code', when: { changedContentMatches: { pattern: '\\b(bcrypt|password|subprocess)\\b', files: ['**/*.js', '**/*.py'], ignore: ['tools/hooks/**'] } } }] }));
report(securityGaps(acts([user('add sign-in'), login, say('Done.')])).length === 1, 'end: security-sensitive code with no review is named');
report(securityGaps(acts([user('add sign-in'), login, call('Skill', { skill: 'security-review' }), say('Done.')])).length === 0
  && securityGaps(acts([user('add sign-in'), login, call('Write', { file_path: path.join(dir, 'docs/reviews/security-2026-11-05.md'), content: 'PASS' }), say('Done.')])).length === 0,
  'end: the security review run, or its report written, in the turn passes');
report(securityGaps(acts([user('fix the total'), code, call('Edit', { file_path: path.join(dir, 'tools/hooks/x.js'), old_string: 'a', new_string: 'subprocess' }), call('Edit', { file_path: path.join(dir, 'notes/a.md'), old_string: 'a', new_string: 'password' }), say('Fixed.')])).length === 0,
  'end: plain code, ignored folders and notes ask for no review');
fs.rmSync(path.join(dir, 'tools/hooks/requirements.json'));

// end: check 7, claims backed by the turn
const { claimGaps } = await import('./lib.mjs');
put('src/a.js', 'x');
report(claimGaps(acts([user('commit it'), call('Bash', { command: 'git commit -m x' }, '[main 3e76a21] x'), say('Committed as 3e76a21. Corrected: "old" -> "new". The changed file is src/a.js.')])).length === 0,
  'end: a commit shown by this turn\'s output and a file that exists pass; an engine label is not a claim');
const madeUp = claimGaps(acts([user('commit it'), code, say('Committed as 9f8e7d6, see src/missing.js and C:/nowhere/at/all.md.')]));
report(madeUp.length === 3 && /9f8e7d6/.test(madeUp[0]) && /src\/missing\.js/.test(madeUp[1]) && /C:\/nowhere/.test(madeUp[1]) && /says it committed/.test(madeUp[2]), 'end: a commit nothing showed and files that do not exist are named', madeUp);
report(claimGaps(acts([user('clean up'), code, say('Removed src/old.js, the color is #a1b2c3d, and see other-project/notes/a.md for the record.')])).length === 0,
  'end: a file said to be removed, a colour code and a path in another folder ask for nothing');
report(claimGaps(acts([user('save it'), code, say('Done and committed.')])).some(s => /says it committed/.test(s))
  && claimGaps(acts([user('save it'), code, call('Bash', { command: 'git commit -m x' }, '[main 1a2b3c4] x', true), say('Done and committed.')])).some(s => /says it committed/.test(s)),
  'end: "committed" with no successful git commit this turn is named');
report(claimGaps(acts([user('save it'), code, call('Bash', { command: 'git add -A && git commit -q -m x' }, ''), say('Committed (not pushed).')])).length === 0
  && claimGaps(acts([user('status?'), say('Nothing is committed yet, and it was committed earlier in the week.')])).length === 0,
  'end: a real commit, "not committed" and "committed earlier" pass');
report(['The fixes get committed once they pass.', 'Wipe once they have committed 3 or more creatures.', 'My own rule pushed the plan further.', 'I will commit once the tests pass, after it can be committed.']
  .every(t => claimGaps(acts([user('status?'), code, say(t)])).length === 0)
  && claimGaps(acts([user('upgrade it'), code, call('Bash', { command: 'node tools/starter.mjs upgrade' }, 'upgrade done: committed as Engine upgrade'), say('The upgrade is finished and committed.')])).length === 0,
  'end: future or other-meaning uses of committed and pushed are no claims; a command whose output shows the commit backs one');
report(claimGaps(acts([user('which engine is this?'), { type: 'attachment', attachment: { type: 'hook_additional_context', content: 'engine 4c5d6e7 (starter)' } }, code, say('It runs engine 4c5d6e7.')])).length === 0,
  'end: a commit the hooks named to the agent this turn backs the answer');

// Codex transcripts and long ones
{
  const ri = (payload, ts = '2026-11-05T10:00:00Z') => ({ type: 'response_item', timestamp: ts, payload });
  const codex = path.join(dir, 'codex.jsonl');
  fs.writeFileSync(codex, [
    { type: 'session_meta', payload: { id: 'x' } },
    ri({ type: 'message', role: 'user', content: [{ type: 'input_text', text: '<environment_context>cwd</environment_context>' }] }),
    ri({ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'fix the total' }] }),
    ri({ type: 'custom_tool_call', name: 'apply_patch', call_id: 'c1', input: '*** Begin Patch\n*** Update File: src/a.js\n@@\n-old\n+const total = 1;\n*** End Patch' }),
    ri({ type: 'function_call', name: 'shell', call_id: 'c2', arguments: JSON.stringify({ command: ['bash', '-lc', 'npm test'] }) }),
    ri({ type: 'function_call_output', call_id: 'c2', output: JSON.stringify({ output: 'Tests: 1 failed', metadata: { exit_code: 1 } }) }),
    ri({ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Fixed.' }] }),
  ].map(r => JSON.stringify(r)).join('\n') + '\n');
  put('package.json', JSON.stringify({ scripts: { test: 'node --test' } }));
  const ca = turnActs(turnRows(codex));
  report(ca.calls.length === 2 && ca.calls[0].name === 'Edit' && /src\/a\.js$/.test(ca.calls[0].input.file_path) && /const total/.test(ca.calls[0].input.new_string)
    && ca.calls[1].name === 'Bash' && ca.calls[1].input.command === 'npm test' && ca.calls[1].error && ca.answer === 'Fixed.' && testGaps(ca).length === 1,
    'end: a Codex turn is read: its typed message, the patch as an edit, the failing test run, the answer', ca);
  fs.rmSync(path.join(dir, 'package.json'));
  // newer Codex: an "exec" call whose code runs the commands and the patch
  fs.writeFileSync(codex, [
    ri({ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'add the export' }] }),
    ri({ type: 'custom_tool_call', name: 'exec', call_id: 'e1', input: 'const patch = "*** Begin Patch\\n*** Add File: src/export.js\\n+export const rows = [];\\n*** End Patch";\ntools.apply_patch(patch);\ntext(await tools.exec_command({cmd:"npm test -- --run \\"export\\"", workdir:"C:\\\\x"}));\ntext(await tools.exec_command({cmd:"git status"}));' }),
    ri({ type: 'custom_tool_call_output', call_id: 'e1', output: 'Tests: 3 passed' }),
    ri({ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Added.' }] }),
  ].map(r => JSON.stringify(r)).join('\n') + '\n');
  const ex = turnActs(turnRows(codex));
  report(ex.calls.length === 2 && ex.calls[0].name === 'Bash' && ex.calls[0].input.command === 'npm test -- --run "export"\ngit status' && ex.calls[0].out === 'Tests: 3 passed'
    && ex.calls[1].name === 'Edit' && ex.calls[1].input.file_path === 'src/export.js' && ex.calls[1].input.new_string === 'export const rows = [];',
    'end: a newer Codex exec call is read: its commands as one shell call with the output, its patch as an edit', ex.calls);
  const { tail } = await import('./lib.mjs');
  const big = path.join(dir, 'big.jsonl');
  fs.writeFileSync(big, Array.from({ length: 3000 }, (_, k) => JSON.stringify(say(`filler ${k} ${'x'.repeat(300)}`))).join('\n') + '\n' + [user('add a csv export'), say('Done.')].map(r => JSON.stringify(r)).join('\n') + '\n');
  const t = tail(big, 64 << 10);
  report(t.length <= 64 << 10 && t.length > 0 && !t.startsWith('lller') && turnRows(big).length === 2, 'end: a transcript is read from its tail, starting at a whole line, and the turn is still found');
}

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

// guard (design B): under "engine": "v2" each safety refusal still happens, the decision is the same as v1's, and an
// ordinary busy turn gets no refusal at all. Lesson: the quiet engine's point is silence during the work, safety aside.
{
  const { guard, IN_WORK_GUARDS } = await import('./guard.mjs');
  const { config, ROOT } = await import('../hooks.mjs');
  const R = ROOT.replace(/\\/g, '/') + '/', g = 'gi' + 't ', base = { ...config(), engine: 'v2' };
  const prot = { ...base, protectedOriginals: ['originals/**'] };
  const bash = command => ({ tool_name: 'Bash', tool_input: { command } });
  const refuse = [
    ['no-secrets', { tool_name: 'Write', tool_input: { file_path: R + 'src/k.js', content: 'const k = "sk-ant-api03-' + 'A'.repeat(90) + '";\n' } }, base],
    ['no-ai-attribution', bash(g + 'commit -m "fix\n\nCo-Authored' + '-By: Claude <noreply@' + 'anthropic.com>"'), base],
    ['git-safety', bash(g + 'reset --' + 'hard HEAD~3'), base],
    ['outward-gate|git-safety', bash(g + 'push origin main'), base],
    ['browser-guard', bash('start ' + 'chrome --remote-debugging-port=9222'), base],
    ['skill-mirror', { tool_name: 'Edit', tool_input: { file_path: R + '.claude/skills/plan/SKILL.md', old_string: 'a', new_string: 'b' } }, base],
    ['protect-originals', bash('rm -' + 'rf originals/2024'), prot],
    ['protect-originals', { tool_name: 'Edit', tool_input: { file_path: R + 'tools/starter/STATUS.md', old_string: 'a', new_string: 'b' } }, { ...base, protectedOriginals: ['tools/starter/**'] }],
  ];
  const got = refuse.map(([tag, d, cfg]) => [tag, guard({ session_id: '', ...d }, cfg) || '']);
  const same = refuse.every(([, d, cfg]) => guard({ session_id: '', ...d }, cfg) === guard({ session_id: '', ...d }, { ...cfg, engine: 'v1' }));
  report(got.every(([tag, r]) => new RegExp(`REQ: (${tag})\\b`).test(r)) && same && IN_WORK_GUARDS.test('REQ: no-secrets'),
    'guard: under v2 each safety guard refuses (secrets, AI credit, risky git, push, browser, generated copies, protected files), the same as v1', got.filter(([tag, r]) => !new RegExp(`REQ: (${tag})\\b`).test(r)));
  const busy = [
    { tool_name: 'Read', tool_input: { file_path: R + 'README.md' } }, { tool_name: 'Grep', tool_input: { pattern: 'total' } },
    { tool_name: 'Glob', tool_input: { pattern: 'src/**/*.js' } },
    { tool_name: 'Edit', tool_input: { file_path: R + 'src/report.js', old_string: 'a', new_string: 'b' } },
    { tool_name: 'Write', tool_input: { file_path: R + 'docs/notes.md', content: '# Notes\n\nThe totals row is fixed.\n' } },
    { tool_name: 'Write', tool_input: { file_path: R + 'docs/style.md', content: 'A dash — waits for the end check.\n' } },
    bash('npm test'), bash('node tools/hooks/v2/selftest.mjs'), bash(g + 'status && ' + g + 'diff --stat'),
    bash(g + 'add src/report.js && ' + g + 'commit -m "Fix the totals row"'), bash('ls docs/plans'), bash('rm -' + 'rf node_modules/.cache'),
  ];
  const loud = busy.map(d => [d.tool_input.command || d.tool_input.file_path || d.tool_input.pattern, guard({ session_id: '', ...d }, prot)]).filter(([, r]) => r);
  report(!loud.length, 'guard: a busy ordinary turn (reads, edits, writes, tests, a commit, a cache delete) gets no refusal under v2', loud);
}

{
  const pasted = '<pasted_content id="a1">WHY DID YOU BREAK IT AGAIN, you forgot the C3 export</pasted_content a1>';
  report(!/upset/.test(reminder(`summarize this ${pasted}`).text) && !reminder(`what does this say ${pasted}`).book && /learn-from-upset/.test(reminder(`WHY DID YOU BREAK IT AGAIN ${pasted}`).text),
    'start: words inside pasted text neither route nor count as upset; the user\'s own words around it still do');
}

{
  // a word only mentioned, or on the user's ignore list, is no complaint; upset and a fitting runbook name both
  const cf = path.join(dir, 'tools/hooks/config.json'), before = fs.existsSync(cf) ? fs.readFileSync(cf, 'utf8') : null;
  put('tools/hooks/config.json', JSON.stringify({ ...(before ? JSON.parse(before) : {}), ignoreWords: { upset: ['annoying'] } }));
  const both = reminder('ugh, you forgot the csv export again');
  report(!/upset/.test(reminder('whitelist the word ugh, it is not me being upset').text) && !/upset/.test(reminder('stop treating "wtf" as a complaint').text)
    && !/upset/.test(reminder('this report layout is annoying to read').text) && /upset/.test(reminder('ugh, you forgot the totals row').text)
    && /learn-from-upset/.test(both.text) && /Runbook: open docs\/playbooks\/export\.md/.test(both.text) && both.book?.name === 'export',
    'start: a mentioned or whitelisted word is no complaint; an upset message that fits a runbook names both', both.text);
  if (before === null) fs.rmSync(cf); else fs.writeFileSync(cf, before);
}

// another session's change: a file written while none of the turn's own commands or helpers ran is not the turn's
{
  const T = ms => new Date(ms).toISOString(), at = Date.now() + 50;
  const timed = (k, name, input, from, to, result = 'ok') => [
    { type: 'assistant', timestamp: T(from), message: { content: [{ type: 'tool_use', id: k, name, input }] } },
    { type: 'user', timestamp: T(to), message: { content: [{ type: 'tool_result', tool_use_id: k, content: result }] } }];
  await new Promise(r => setTimeout(r, 120));
  put('pytest.ini', '[pytest]\n');
  put('src/peer.py', 'x = 2\n');
  const t = fs.statSync(path.join(dir, 'src/peer.py')).mtimeMs;
  const before = acts([user('fix the total'), timed('p1', 'Bash', { command: 'ls' }, t - 60000, t - 50000), say('Done.')]);
  const during = acts([user('fix the total'), timed('p2', 'Bash', { command: 'node tools/fix.mjs' }, t - 1000, t + 1000), say('Done.')]);
  const bg = acts([user('fix the total'), timed('p3', 'Bash', { command: 'node tools/fix.mjs', run_in_background: true }, t - 60000, t - 59000, 'Command running in background with ID: b7'), say('Started.')]);
  report(testGaps({ ...before, at: T(at) }).length === 0 && testGaps({ ...during, at: T(at) }).length === 1 && testGaps({ ...bg, at: T(at) }).length === 1,
    'end: a file changed while none of the turn\'s commands ran is another session\'s; one changed during a command or a background run is the turn\'s',
    [testGaps({ ...before, at: T(at) }), testGaps({ ...during, at: T(at) }), testGaps({ ...bg, at: T(at) })].map(g => g.length));
  fs.rmSync(path.join(dir, 'src/peer.py')); fs.rmSync(path.join(dir, 'pytest.ini'));
}

// background runs: from the session's own launches and notices, never from command text
{
  const { backgroundRuns } = await import('./lib.mjs');
  const use = (id, command, bg) => ({ type: 'assistant', message: { content: [{ type: 'tool_use', id, name: 'Bash', input: { command, ...(bg ? { run_in_background: true } : {}) } }] } });
  const res = (id, text) => ({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: id, content: text }] } });
  const launch = [use('t1', 'npm test', true), res('t1', 'Command running in background with ID: b1. Output is being written to: x.output')];
  const quoted = [use('t2', 'grep -n background notes.txt', false), res('t2', '12:Command running in background with ID: q9\nsee "moved to the background (ID: q8)"')];
  const ids = rows => backgroundRuns(rows).map(r => r.id).join(',');
  const notice = { type: 'queue-operation', content: '<task-notification>\n<task-id>b1</task-id>\n<status>completed</status>' };
  const stop = [use('t3', '', false), res('t3', 'Successfully stopped task: b1 (npm test)')];
  report(ids(launch) === 'b1' && backgroundRuns(launch)[0].cmd === 'npm test' && ids([...launch, notice]) === '' && ids([...launch, ...stop]) === '' && ids([...launch, ...quoted]) === 'b1' && ids(quoted) === '',
    'runs: a background launch runs until its notice or a stop; output that quotes the launch line is not a run', { a: ids(launch), b: ids([...launch, notice]), c: ids([...launch, ...stop]), d: ids(quoted) });
}

// the whole project works the simple way (the user, 2026-11-05): v2 is the default engine, the old one only on request,
// and the session text, rules, runbooks and skills ask for no record lines, waivers or turn notes (the Issue line that
// shows the user "acknowledged" excepted)
{
  const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', '..', '..');
  const saved = process.env.STARTER_ENGINE;
  delete process.env.STARTER_ENGINE;
  const { engineOf, V2_SESSION } = await import('../hooks.mjs');
  const dflt = engineOf(); process.env.STARTER_ENGINE = 'v1'; const pinned = engineOf();
  if (saved === undefined) delete process.env.STARTER_ENGINE; else process.env.STARTER_ENGINE = saved;
  const RECORD = /turn-notes|turn notes|hooks\.mjs waive|`(Playbook|Skill|Worth it|Proven|Learned|Sweep|Conflicts|Cold read|Done N|Skip N|Verified):/;
  const walk = d => { try { return fs.readdirSync(path.join(repo, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith('.md') ? [`${d}/${e.name}`] : []); } catch { return []; } };
  const files = ['AGENTS.md', 'README.md', ...walk('docs/playbooks'), ...walk('skills'), ...walk('tools/starter/runbooks'), 'docs/checks/writing-standards.md', 'docs/checks/finish-checklist.md'];
  const asks = files.flatMap(f => fs.readFileSync(path.join(repo, f), 'utf8').split('\n').map((l, i) => [f, i + 1, l]))
    .filter(([, , l]) => RECORD.test(l) && !/Issue:|before any fix, as your first step|No record lines|no `Playbook:`|`Verified: <n> claims traced/.test(l)).map(([f, n, l]) => `${f}:${n}: ${l.trim().slice(0, 80)}`);
  // (the rules only shrink: at most the 152 lines they had at the switch, until the short draft replaces them;
  // docs/plans/2026-11-05-engine-v2-agents-draft.md, under 60)
  const ruleLines = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8').split('\n').length;
  report(ruleLines <= 153, `simple: AGENTS.md stays at most 152 lines (${ruleLines - 1})`, ruleLines);
  report(dflt === 'v2' && pinned === 'v1' && !RECORD.test(V2_SESSION) && files.length > 20 && !asks.length,
    `simple: v2 is the default engine (v1 only when pinned), and the session text and ${files.length} rule, runbook and skill files ask for no record lines`, JSON.stringify({ dflt, pinned, asks: asks.slice(0, 8) }));
}

// size budget (docs/plans/2026-11-05-engine-v2.md): the engine stays small, and the end check has at most 15 checks.
// Lesson: v1 grew to about 9,600 lines of hooks, most of it fixing friction it made itself.
{
  const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));
  const engine = fs.readdirSync(here).filter(f => f.endsWith('.mjs') && f !== 'selftest.mjs');
  const lines = engine.reduce((n, f) => n + fs.readFileSync(path.join(here, f), 'utf8').split('\n').length, 0);
  const checks = (/const list = \[([^\]]*)\]/.exec(fs.readFileSync(path.join(here, 'end.mjs'), 'utf8'))?.[1].match(/\.\.\.\w+\(/g) || []).length;
  report(lines <= 1500 && checks >= 1 && checks <= 15, `size: the v2 engine is at most 1,500 lines (${lines}) and the end check runs at most 15 checks (${checks})`, { lines, checks });
}

fs.rmSync(dir, { recursive: true, force: true });
console.log(`v2 selftest: ${fail ? 'FAIL' : 'ALL PASS'} (${pass} passed, ${fail} failed)`);
process.exit(fail ? 1 : 0);
