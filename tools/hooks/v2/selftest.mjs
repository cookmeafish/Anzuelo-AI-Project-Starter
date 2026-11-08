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
  const [mid] = doneWhen('## Done when\n- [ ] The review table is written (file: docs/reviews/*.md), each area\n  with its evidence.\n');
  report(mid.kind === 'file' && mid.arg === 'docs/reviews/*.md' && mid.text === 'The review table is written, each area with its evidence', 'start: a marker inside an item, not only at its end, is its check', mid);
  const cm = doneWhen('## Done when\n- [ ] Every new flag is in the README. <!-- Lesson, an old trial: a flag shipped\n  undocumented. -->\n- [ ] The tests pass.\n');
  report(cm.length === 2 && cm[0].text === 'Every new flag is in the README' && cm[1].text === 'The tests pass', 'start: a comment in a runbook item, one line or several, is never shown', cm);
  // (an item for one branch says when it applies; on other turns it is neither checked nor listed to verify)
  const { applies, met } = await import('./lib.mjs');
  const [install, upg] = doneWhen('## Done when\n- [ ] An install started setup (when ran: tool install).\n- [ ] An upgrade was committed (when ran: tool upgrade|tool update) (ran: git commit).\n');
  const upTurn = { calls: [{ name: 'Bash', input: { command: 'node tool upgrade' }, out: 'ok' }], answer: '' };
  report(install.when?.arg === 'tool install' && install.kind === null && install.text === 'An install started setup' && upg.kind === 'ran'
    && !applies(install, upTurn) && applies(upg, upTurn) && met(upg, upTurn) === false,
    'start: a "(when ...)" item applies only on turns where its condition held, and its own check still counts there', [install, upg]);
}
const r = reminder('can you add a CSV export for the orders page');
report(r.book?.name === 'export' && /^Runbook: open docs\/playbooks\/export\.md/.test(r.text) && /Done when \(before answering, check your draft: node tools\/hooks\/hooks\.mjs check --answer-file <draft>\):\n1\. The tests pass/.test(r.text) && !/ran:|file:|answer:|judgment:|REQ/.test(r.text),
  'start: a matching request gets the runbook and its Done-when list, in plain words', r.text);
{
  const { route } = await import('./lib.mjs');
  const books = [{ file: 'docs/playbooks/engine.md', name: 'engine', triggers: ['upgrade the engine'], menu: [] }, { file: 'docs/playbooks/project.md', name: 'project', triggers: ['audit', 'sweep'], menu: [] }];
  const msg = 'Engine upgrade 1a2b3c is ready in your linked starter copy. It fixes the audit sweep. Run node tools/starter.mjs upgrade.';
  report(route(msg, books)?.name === 'engine', 'start: an engine upgrade message goes to the engine runbook, not to a runbook named by words in its list of fixes', route(msg, books)?.name);
  // (named by its version alone. Lesson (a project's report): "upgrade to <hash>" with an audit in its list of fixes went
  // to the project runbook, and the end check held the upgrade to that runbook's items)
  const byHash = route('Please upgrade to 9f8e7d6 now. It fixes the audit sweep.', books)?.name;
  report(byHash === 'engine', 'start: "upgrade to <commit>" goes to the engine runbook', byHash);
  put('.starter-template', ''); const inStarter = route(msg, books)?.name; fs.rmSync(path.join(dir, '.starter-template'));
  report(inStarter === 'project', 'start: in the starter itself an upgrade message is a report back and routes on its other words', inStarter);
  // (a standing rule stated plainly is a rule request; a plain request that only mentions "every" is not)
  const rule = route('you made a new invoice without a due date. every new invoice has a due date', books)?.name, each = route('Each order must name its customer.', books)?.name;
  const plain = route('can you check every invoice for typos', books), q = route('does every invoice have a date?', books);
  report(rule === 'project' && each === 'project' && !plain && !q, 'start: a standing rule stated plainly ("every new invoice has ...") routes to the project runbook; a request or question about every item does not', { rule, each, plain: plain?.name, q: q?.name });
  // (it comes before a work trigger found mid-sentence; a request that starts with the trigger still goes there)
  const withFeature = [...books, { file: 'docs/playbooks/feature.md', name: 'feature', triggers: ['new field'], menu: [] }];
  const mid = route('you forgot the new field in the guide. every field has to be documented', withFeature)?.name, lead = route('new field for the due date. every field has a label', withFeature)?.name;
  report(mid === 'project' && lead === 'feature', 'start: a standing rule stated plainly comes before a work trigger found mid-sentence; a trigger the request starts with still wins', { mid, lead });
  const never = route('you let any visitor cancel orders! only the owner may cancel. that should never happen again', withFeature)?.name;
  report(never === 'project', 'start: "that should never happen again" is a standing rule request and routes to the project runbook', never);
  const tailEs = route('otra vez quedó una fecha en otro formato. toda fecha que vea el cliente tiene que ir en formato largo, siempre', withFeature)?.name;
  const tailEn = route('every label the customer sees must be in plain words, always.', withFeature)?.name, notRule = route('why does the export always fail on empty rows', withFeature)?.name;
  report(tailEs === 'project' && tailEn === 'project' && notRule !== 'project', 'start: a sentence that ends ", always" (", siempre") is a standing rule request; "always" inside a question is not', { tailEs, tailEn, notRule });
}
{
  const { onPrompt } = await import('./start.mjs');
  const { loadTurn } = await import('./lib.mjs');
  onPrompt({ session_id: 'notice', prompt: 'can you add a CSV export for the orders page' });
  const out = onPrompt({ session_id: 'notice', prompt: '<task-notification>\n<task-id>b1</task-id>\n<status>completed</status>\n</task-notification>' });
  report(out === null && loadTurn('notice').runbook === 'docs/playbooks/export.md', 'start: a background-job notice mid-turn adds no reminder and keeps the runbook the turn was routed to', [out, loadTurn('notice').runbook]);
  const back = onPrompt({ session_id: 'notice', prompt: 'Another Claude session sent a message:\n<agent-message from="a1">\n[Subagent hand-back] The text below is the final report of a subagent.\n  Rule requests: none. The csv export review is written.\n</agent-message>' });
  report(back === null && loadTurn('notice').runbook === 'docs/playbooks/export.md', 'start: a helper\'s report back is not a request: no reminder, and the turn keeps its runbook', [back, loadTurn('notice').runbook]);
  // (a run with no session id, such as the hook timing, saves no turn record. Lesson (a field report): an upgrade's hook
  // timing left a turn record under a made-up id in the project's state folder)
  const { onStop } = await import('./end.mjs');
  const st = path.join(dir, 'tools/hooks/state');
  const before = fs.existsSync(st) ? fs.readdirSync(st).filter(f => /^v2-turn\./.test(f)) : [];
  const tq = path.join(os.tmpdir(), `v2-nosid-${process.pid}.jsonl`);
  fs.writeFileSync(tq, JSON.stringify({ type: 'user', message: { role: 'user', content: 'what does the brief say' } }) + '\n');
  onPrompt({ prompt: 'what does the brief say' }); onStop({ transcript_path: tq });
  fs.rmSync(tq, { force: true });
  const after = fs.existsSync(st) ? fs.readdirSync(st).filter(f => /^v2-turn\./.test(f)) : [];
  report(after.length === before.length, 'start: a hook run with no session id leaves no turn record', after.filter(f => !before.includes(f)));
  // (a turn with no saved start, such as the first turn after v2 is installed, starts at its request's own time: a file
  // a script wrote since then counts, and the request is blocked once, not again. Lesson (a field report): the first
  // turn after an upgrade asked for a file a shell command had written, and asked twice)
  const T = s => new Date(Date.now() - 60_000 + s * 1000).toISOString(), at = (s, r) => [r].flat().map(x => ({ ...x, timestamp: T(s) }));
  const late = transcript([at(0, user('upgrade the export tool')), at(1, call('Read', { file_path: path.join(dir, 'docs/playbooks/export.md') })),
    at(2, call('Edit', { file_path: path.join(dir, 'src/a.js'), old_string: 'a', new_string: 'b' })), at(3, call('Bash', { command: 'npm test' }, '3 passed')),
    at(4, say('Done; how it was checked: npm test.'))]);
  put('docs/CHANGELOG.md', '- export: tidied\n');
  const old = new Date(Date.now() - 3_600_000); fs.utimesSync(path.join(dir, 'docs/playbooks/export.md'), old, old); // (the runbook predates the turn)
  const b1 = onStop({ session_id: 'latestart', transcript_path: late }), b2 = onStop({ session_id: 'latestart', transcript_path: late });
  report(!!b1 && !/item 2/.test(b1.reason) && b2 === null, 'end: a turn with no saved start begins at its request, so a file a script wrote counts, and it is blocked once', [b1?.reason?.slice(0, 160), b2?.reason?.slice(0, 80)]);
  { // (a test run made by one of the session's helpers this turn counts; one from before the turn does not)
    const { saveTurn: sv } = await import('./lib.mjs');
    put('package.json', JSON.stringify({ scripts: { test: 'node --test tests/*.test.mjs' } }));
    const tdir = fs.mkdtempSync(path.join(dir, 'hr-')), sub = path.join(tdir, 'hrun', 'subagents'), main = path.join(tdir, 'hrun.jsonl');
    fs.mkdirSync(sub, { recursive: true });
    const lines = rows => rows.flat().map(r => JSON.stringify(r)).join('\n') + '\n';
    const mainRows = [at(10, user('tidy the invoice totals')), at(11, call('Edit', { file_path: path.join(dir, 'src/a.js'), old_string: 'a', new_string: 'b' })),
      at(12, call('Agent', { description: 'tests', prompt: 'run the tests' }, 'The tests pass.')), at(14, say('Tidied; the helper ran the tests.'))];
    const ask = s => { sv('hrun', { at: T(10), runbook: null }); fs.writeFileSync(path.join(sub, 'agent-h1.jsonl'), lines([at(s, call('Bash', { command: 'npm test' }, 'Tests: 3 passed'))])); fs.writeFileSync(main, lines(mainRows));
      return onStop({ session_id: 'hrun', transcript_path: main })?.reason || ''; };
    const helped = ask(13), stale = ask(5);
    report(!/Run the tests after the last code change/.test(helped) && /Run the tests after the last code change/.test(stale),
      'end: a test run a helper made after the last change, in this turn, counts for the session; one from before the turn does not', [helped.slice(0, 160), stale.slice(0, 160)]);
    // (and the screenshots a helper took and looked at. Lesson (trial v41))
    put('tools/screenshot.mjs', '// shots');
    mainRows[1] = at(11, call('Edit', { file_path: path.join(dir, 'src/page.html'), old_string: 'a', new_string: 'b' }));
    sv('hrun', { at: T(10), runbook: null });
    fs.writeFileSync(path.join(sub, 'agent-h1.jsonl'), lines([at(13, call('Bash', { command: 'node tools/screenshot.mjs' }, 'saved .cache/gui-review/x/_sheet-1.png')), at(13, call('Read', { file_path: path.join(dir, '.cache/gui-review/x/_sheet-1.png') }))]));
    fs.writeFileSync(main, lines(mainRows));
    const shots = onStop({ session_id: 'hrun', transcript_path: main })?.reason || '';
    fs.rmSync(path.join(dir, 'tools/screenshot.mjs'));
    report(!/A screen changed/.test(shots), 'end: screenshots a helper took and looked at after the last screen change count for the session', shots.slice(0, 160));
    fs.rmSync(path.join(dir, 'package.json'));
  }
  // (a background command of this turn still running: no check yet; a server left running does not hold it off.
  // Lesson (a project's report): a turn waiting on its full self-test was blocked three times)
  {
    const { saveTurn: sv } = await import('./lib.mjs');
    const go = (sid, command) => { sv(sid, { at: T(0), runbook: 'docs/playbooks/export.md' }); return onStop({ session_id: sid, transcript_path: transcript([at(0, user('add a csv export')), at(0, call('Read', { file_path: path.join(dir, 'docs/playbooks/export.md') })),
      at(1, call('Edit', { file_path: path.join(dir, 'src/a.js'), old_string: 'a', new_string: 'b' })),
      at(2, call('Bash', { command, run_in_background: true }, 'Command running in background with ID: bg1. Output is being written to: x.output')), at(3, say('Waiting for it.'))]) }); };
    const tests = go('bgwait', 'node tools/hooks/selfcheck.mjs --full'), server = go('bgserver', 'npm run dev');
    report(tests === null && !!server, 'end: no check while a background command of the turn still runs; a dev server left running does not hold it off', [tests?.reason?.slice(0, 80), server]);
  }
  // (a helper started this turn that has not reported back: no check yet, and the turn stays open for the next Stop)
  {
    const { saveTurn: sv, loadTurn: ld } = await import('./lib.mjs');
    sv('helperwait', { at: T(0), runbook: null });
    const base = [at(0, user('tidy the invoice totals')), at(1, call('Edit', { file_path: path.join(dir, 'src/a.js'), old_string: 'a', new_string: 'b' })),
      at(2, call('Agent', { description: 'review', prompt: 'review it', run_in_background: true }, 'Async agent launched successfully.\nagentId: a1b2c3 (internal ID)')), at(3, say('A reviewer is checking it.'))];
    const w = onStop({ session_id: 'helperwait', transcript_path: transcript(base) }), open = !ld('helperwait').ended;
    const back = { type: 'user', isMeta: true, message: { role: 'user', content: '<agent-message from="a1b2c3">\n[Subagent hand-back] The review found nothing.\n</agent-message>' } };
    const b = onStop({ session_id: 'helperwait', transcript_path: transcript([...base, at(4, back), at(5, say('The reviewer found nothing; saved as 7c6b5a4.'))]) });
    report(w === null && open && !!b && /7c6b5a4/.test(b.reason), 'end: while a helper started this turn still works there is no check and the turn stays open; after it reports back the turn is judged', [w, open, b?.reason?.slice(0, 100)]);
    // (a helper resumed after its report works again: the turn waits for its next report)
    const { helpersRunning } = await import('./lib.mjs');
    const resume = at(5, call('SendMessage', { to: 'a1b2c3', message: 'check the fix' }, '{"success":true,"message":"Resuming agent a1b2c3","resumedAgentId":"a1b2c3"}'));
    const rows = r => fs.readFileSync(transcript(r), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
    const again = helpersRunning(rows([...base, at(4, back), resume, at(6, say('The reviewer is checking the fix.'))]));
    const after = helpersRunning(rows([...base, at(4, back), resume, at(6, back), at(7, say('The reviewer found nothing.'))]));
    report(again.join() === 'a1b2c3' && after.length === 0, 'end: a helper resumed after its report counts as working until its next report', { again, after });
    { // (the manual check run by a helper reads the helper's transcript, the newest one of the session; run by the
      // session itself, the session's own)
      const { callerTranscript } = await import('./lib.mjs');
      const tdir = fs.mkdtempSync(path.join(dir, 'tr-')), main = path.join(tdir, 's1.jsonl'), sub = path.join(tdir, 's1', 'subagents');
      fs.mkdirSync(sub, { recursive: true }); fs.writeFileSync(main, '{}\n'); fs.writeFileSync(path.join(sub, 'agent-old1.jsonl'), '{}\n'); fs.writeFileSync(path.join(sub, 'agent-ab12.jsonl'), '{}\n');
      const now = Date.now() / 1000; fs.utimesSync(path.join(sub, 'agent-old1.jsonl'), now - 60, now - 60); fs.utimesSync(main, now - 30, now - 30);
      const helper = callerTranscript(main, 's1');
      fs.utimesSync(main, now + 5, now + 5);
      const own = callerTranscript(main, 's1');
      report(helper.id === 'ab12' && helper.file === path.join(sub, 'agent-ab12.jsonl') && own.file === main && own.id === '',
        'check: run by a helper, the manual check reads that helper\'s transcript; run by the session, its own', { helper, own });
    }
    // (live, the session's evidence leaves out the agent's own words: the answer never backs its own made-up commit)
    const made = onStop({ session_id: 'madeup', transcript_path: transcript([at(0, user('save the invoice fix')), at(1, say('Saved as 9e8d7c6.'))]) });
    report(!!made && /9e8d7c6/.test(made.reason), 'end: live, a commit only the answer names is reported (the answer is not its own evidence)', made?.reason?.slice(0, 120));
    // (the user reads the answer once: a block asks for a line or two on only what changed, in the user's language, with
    // no talk about the check, and says to run the check before answering next time. The user, 2026-11-07: each block
    // made them read the same answer again. Earlier lesson kept: the note is in the user's language (trials v33, v34))
    report(/only what changed in the answer above/.test(made?.reason || '') && /their language/i.test(made?.reason || '') && !/whole answer/.test(made?.reason || '')
      && /nothing about this check/.test(made?.reason || '') && /check --answer-file/.test(made?.reason || ''),
      'end: a block asks for a short note on only what changed, in the user\'s language, with nothing about the check, and for the check on a draft next time', (made?.reason || '').split('\n').at(-1));
  }
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
{
  // a skill whose own trigger phrase fits is named when no runbook routed; not beside a runbook, not on one word, and
  // not a runbook's generated mirror
  put('skills/figures/SKILL.md', '---\nname: figures\ntriggers: best week, what drove, compare\n---\n# Figures\n');
  put('skills/mirror/SKILL.md', '---\nname: mirror\ngenerated: true\ntriggers: best week\n---\n# Mirror\n');
  const alone = reminder('what was our best week so far, and what drove it?'), beside = reminder('add a CSV export of our best week'), word = reminder('compare the two totals');
  const later = reminder('Review the shop sessions every hour. If one went quiet, see what drove it and tell me.');
  report(/^Skill: open skills\/figures\/SKILL\.md and follow it\.$/m.test(alone.text) && !alone.book && beside.book?.name === 'export' && !/Skill:/.test(beside.text)
    && !/Skill:/.test(word.text) && !/Skill:/.test(later.text) && !/skills\/mirror/.test(alone.text) && !/Skill:/.test(reminder('what time is it').text),
    'start: with no runbook routed, a skill whose trigger phrase of two or more words fits the first sentence is named; beside a runbook, on one word, later in the request, or a generated skill, not', [alone.text, beside.text, word.text, later.text]);
  fs.rmSync(path.join(dir, 'skills/figures'), { recursive: true }); fs.rmSync(path.join(dir, 'skills/mirror'), { recursive: true });
}
put('DIRECTORY.md', '# Directory\n'); put('skills/learn-from-upset/SKILL.md', '# Learn from upset\n');
report(/pick the runbook in DIRECTORY\.md/.test(reminder('the totals look off on the summary page').text) && !reminder('the totals look off').book,
  'start: when no trigger fits, one line asks the agent to pick and open the fitting runbook');
const { upset } = await import('./start.mjs');
report(/learn-from-upset/.test(reminder('WHY DID YOU BREAK THE EXPORT AGAIN').text) && /learn-from-upset/.test(reminder('ugh, you forgot the totals row').text)
  && upset('the export still has issues because ur not following the format') && upset('i dont think you understand the totals')
  && !upset('still working?') && !upset('why do you think the export is slow?') && !upset('B2 CSV export --path out/orders') && !upset('add a CSV export')
  && upset('you made a new invoice without linking it to the order') && !upset('can you make the export work without the header row?')
  && upset('you keep putting the tax line under the total!! fix it') && upset('why does it keep rounding the prices') && upset('the totals are off again!!')
  && !upset('keep the export as it is') && !upset('can you keep working on the totals?') && !upset('great, it works!!')
  && upset('you let any visitor cancel orders! only the owner may cancel') && upset('the totals were off. that should never happen again')
  && !upset('thanks, you let me know in time') && !upset('can you let the staff export orders?'),
  'start: an upset message (capitals, frustration words, "you made X without Y", or "you keep doing X") goes to the learn-from-upset skill; plain questions and codes do not');
{ // a push to main the user OK'd earlier in the session runs without a second confirmation; pasted text never counts
  const { askedPushEarlier } = await import('../hooks.mjs');
  const tp = rows => transcript(rows);
  const said = askedPushEarlier(tp([user('fix the export'), say('Done.'), user('after all that commit all changes and git push to main okay?'), say('Will do.'), user('also fix the footer')]), 'main');
  const alias = askedPushEarlier(tp([user('when done, git push to master please')]), 'main');
  const never = askedPushEarlier(tp([user('fix it, commit (never push)'), user('and the main page too')]), 'main');
  const pasted = askedPushEarlier(tp([user('what is this? <pasted_content id="1">Question: can I push to main now?</pasted_content id="1">')]), 'main');
  report(said && alias && !never && !pasted, 'pretool: a push to main OK\'d earlier in the session counts (main or master); "never push" and pasted text do not', JSON.stringify({ said, alias, never, pasted }));
  // (the outward-action guard takes the same earlier OK; with none, it still refuses)
  const { spawnSync } = await import('node:child_process');
  const repo = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', '..', '..');
  const c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-push-'));
  fs.mkdirSync(path.join(c, 'tools/hooks/state'), { recursive: true }); fs.mkdirSync(path.join(c, '.cache'), { recursive: true });
  fs.cpSync(path.join(repo, 'tools/hooks/v2'), path.join(c, 'tools/hooks/v2'), { recursive: true });
  for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c, 'tools/hooks', f));
  const pre = rows => { const t = path.join(c, `t${++id}.jsonl`); fs.writeFileSync(t, rows.flat().map(r => JSON.stringify(r)).join('\n') + '\n');
    return spawnSync(process.execPath, [path.join(c, 'tools/hooks/hooks.mjs'), 'pretool'], { cwd: c, encoding: 'utf8',
      input: JSON.stringify({ session_id: 'pushok', transcript_path: t, tool_name: 'Bash', tool_input: { command: 'git push origin HEAD:main' } }),
      env: { ...process.env, STARTER_ENGINE: 'v2', ANZUELO_ROOT: c, CLAUDE_PROJECT_DIR: c } }).stdout || ''; };
  const earlier = pre([user('when it all passes, commit and git push to main'), say('Will do.'), user('also fix the footer')]);
  const none = pre([user('fix the footer'), say('Done.'), user('and the header')]);
  fs.rmSync(c, { recursive: true, force: true });
  report(!/outward-gate/.test(earlier) && /outward-gate|git-safety/.test(none), 'pretool: the outward-action guard lets a push OK\'d earlier in the session run, and still refuses one nobody OK\'d', JSON.stringify({ earlier: earlier.slice(0, 200), none: none.slice(0, 200) }));
}
{ // an upset turn, likely to write a lesson, is told to write it in general terms; a plain request is not
  const cfgR = path.join(dir, 'tools/hooks/config.json'), hadR = fs.existsSync(cfgR) ? fs.readFileSync(cfgR, 'utf8') : null;
  put('tools/hooks/config.json', JSON.stringify({ ...(hadR ? JSON.parse(hadR) : {}), quoteCheck: true }));
  const upsetR = reminder('ugh, you forgot the totals row').text, plainR = reminder('can you add a CSV export for the orders page').text;
  report(/general terms, not in the user's own words/.test(upsetR) && !/general terms/.test(plainR) && upsetR.split('\n').length === reminder('ugh, you forgot the totals row').text.split('\n').length,
    'start: an upset turn gets "write any lesson in general terms" inside an existing line; a plain request gets nothing', { upsetR, plainR });
  if (hadR === null) fs.rmSync(cfgR); else fs.writeFileSync(cfgR, hadR);
}
{ // a message relayed from another session gets its runbook only for when it asks for work
  const relay = reminder('Another Claude session sent a message:\n<cross-session-message from="x">The fix to export the orders landed in 1a2b3c. Nothing to change.</cross-session-message>');
  const asked = reminder('can you export the orders for this week');
  // (in the runbook line itself, not a line of its own: peer messages are frequent. Lesson (replay): the extra line was
  // most of the reminders' growth, on 136 and 89 peer messages)
  report(/^Runbook, only if this message asks for work here: open docs\/playbooks\/export\.md and follow it\./m.test(relay.text) && relay.text.split('\n').length === reminder('can you export the orders for this week').text.split('\n').length && !/only if/.test(asked.text),
    'start: a relayed message gets its runbook only for when it asks for work, in the runbook line itself; a typed request gets it plainly', { relay: relay.text, asked: asked.text });
}
{ // the project's own standing rule that shares two words with the request is named in the reminder; others are not
  put('AGENTS.md', "# Rules\n\n## The user's standing preferences\n- Only the owner account may delete anything; staff accounts never may (2026-11-05).\n- Exports always list the totals row last (2026-11-05).\n");
  const del = reminder('add an endpoint that deletes an order, for the owner account'), plain = reminder('can you add a CSV export for the orders page');
  // (not on a long request or a relayed message: those share words with most rules)
  const long = reminder(`export the orders with an endpoint that deletes an order for the owner account. ${'Also keep the layout as it is. '.repeat(10)}`);
  const relay = reminder('Another Claude session sent a message:\n<cross-session-message from="x">export the orders: the owner account deletes them now</cross-session-message>');
  report(/The project's own rule here: Only the owner account may delete/.test(del.text) && !/own rule/.test(plain.text) && !/own rule/.test(long.text) && !/own rule/.test(relay.text),
    'start: a standing rule of the project that shares two words with a short request is named in the reminder; one sharing one word, a long request or a relayed message is not', { del: del.text, plain: plain.text, long: long.text, relay: relay.text });
  fs.rmSync(path.join(dir, 'AGENTS.md'));
}
{ // a Spanish request routes like its English wording, gets a line to answer in Spanish, and its complaints count
  put('docs/playbooks/pages.md', '---\nname: pages\ntriggers: add a page, index page\n---\n## Done when\n1. The page is linked from the menu\n');
  const es = reminder('agrega una página de índice con todas las recetas ordenadas por categoría'), en = reminder('add a page for the recipes');
  report(es.book?.name === 'pages' && /write the whole answer in Spanish/.test(es.text) && /and any file you point them to/.test(es.text) && en.book?.name === 'pages' && !/Spanish/.test(en.text)
    && upset('otra vez pusiste texto en inglés en la página, todo tiene que estar en español') && !upset('hazlo otra vez, por favor'),
    'start: a Spanish request routes like its English wording and is told to answer in Spanish, files it points to too; a Spanish complaint is upset', { es: es.text, en: en.text });
  fs.rmSync(path.join(dir, 'docs/playbooks/pages.md'));
}
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
  // (a turn that ran the check on its draft saw the list there: the real stop does not send it back for it again, while
  // the draft check itself still shows it)
  const drafted = [...good.slice(0, -1), call('Bash', { command: 'node tools/hooks/hooks.mjs check --answer-file .cache/answer.md' }, 'CHECK: ...'), good.at(-1)];
  const real = onStop({ transcript_path: transcript(drafted), session_id: 'verify2' }), preview = onStop({ transcript_path: transcript(drafted), session_id: 'verify3' }, { shadow: true });
  report(real === null && /Check that these items of docs\/playbooks\/export\.md are really done/.test(preview?.reason || ''),
    'end: after a check on the draft, the real stop does not send the verify list back again; the draft check shows it', { real, preview: preview?.reason });
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
// (a runbook the turn wrote and read back is its work, not the procedure it chose. Lesson (trial v43))
const wrote = missing({ runbook: null }, acts([user('set up the project'), call('Write', { file_path: path.join(dir, 'docs/playbooks/export.md'), content: 'x' }), read, edit, say('Set up.')]));
report(wrote.length === 0, 'end: with none routed, a runbook the turn wrote and then read is not the one the turn is held to', wrote);
{ // (a project's report: editing the routed runbook held the turn to its items; the one-line way out was held again;
  // raw CRLF text had no items; a ")" in a marker's value cut it short)
  const edited = missing(turn, acts([user('add a marker to the export runbook'), read, call('Edit', { file_path: path.join(dir, 'docs/playbooks/export.md'), old_string: 'a', new_string: 'b' }), say('Added.')]));
  report(edited.length === 0, 'end: a turn that edited its own routed runbook is not held to that runbook', edited);
  const { waived } = await import('./end.mjs');
  const gaps = ['docs/playbooks/export.md item 1: The tests pass', 'docs/playbooks/export.md item 2: The change is in the changelog', 'Run the tests.'];
  const kept = waived({ answer: 'Done.\nItem 1 does not fit: no code changed, so there are no tests.' }, gaps);
  report(kept.length === 2 && !kept.some(s => /item 1:/.test(s)), 'end: a runbook item the answer says does not fit, by number, is cleared and only that one', kept);
  report(waived({ answer: 'Item 1 is done.' }, gaps).length === 3, 'end: naming an item without saying it does not fit clears nothing');
  const byPath = waived({ answer: 'I left the files in `reports/` alone, since redoing them was not part of this request.' }, ['docs/playbooks/r.md item 2: The files in reports/ are updated', 'docs/playbooks/r.md item 3: The index is rebuilt']);
  report(byPath.length === 1 && /item 3/.test(byPath[0]), 'end: a not-fit line that names the item\'s path, with a plain reason, clears that item only', byPath);
  // (edited by a script, not an edit tool: the routed runbook changed during the turn)
  const at = new Date(Date.now() - 60000).toISOString();
  const book = path.join(dir, 'docs/playbooks/export.md'), was = fs.statSync(book);
  fs.utimesSync(book, new Date(), new Date());
  const scripted = missing(turn, { ...acts([user('add a marker to the export runbook'), call('Bash', { command: 'node fix.mjs docs/playbooks/export.md' }), edit, say('Added.')]), at });
  fs.utimesSync(book, was.atime, was.mtime);
  report(scripted.length === 0, 'end: a routed runbook a script changed during the turn does not hold the turn', scripted);
  const { doneWhen } = await import('./lib.mjs');
  report(doneWhen('## Done when\r\n1. Zipped (file: logs/*.zip)\r\n2. Noted\r\n').length === 2, 'runbook: Done when items are read from raw Windows line endings');
  const [paren] = doneWhen('## Done when\n1. The build is named (answer: build (one|two) ready)\n');
  report(paren.kind === 'answer' && paren.arg === 'build (one|two) ready' && paren.text === 'The build is named', 'runbook: a marker value may hold a bracketed group', paren);
}
{ // (a routed runbook never opened, while another was, gives way to the one opened. Lesson (trial v45))
  put('docs/playbooks/recipes.md', '---\nname: recipes\ntriggers: recipe\n---\n## Done when\n1. The recipe card is filed\n');
  const other = missing({ runbook: 'docs/playbooks/recipes.md' }, acts([user('add a page listing the recipes'), read, edit, say('Added.')]));
  const none = missing({ runbook: 'docs/playbooks/recipes.md' }, acts([user('add a page listing the recipes'), edit, say('Added.')]));
  fs.rmSync(path.join(dir, 'docs/playbooks/recipes.md'));
  report(other.some(s => /export\.md item 1/.test(s)) && !other.some(s => /recipes\.md/.test(s)) && none.some(s => /^Open docs\/playbooks\/recipes\.md/.test(s)),
    'end: a routed runbook the agent never opened gives way to the runbook it opened; with none opened it is still asked for', JSON.stringify({ other, none }));
}
{ // (a skill the runbook hands the case to counts as opening it; any other skill does not. Lesson (trial v42))
  // (the sample skill's path is built here, so the reference sweep does not read it as a real reference)
  const sample = ['skills', 'ledger-rule', 'SKILL.md'].join('/');
  put('docs/playbooks/ledger.md', `---\ntriggers: ledger rule\n---\nA standing rule: follow the ledger procedure (\`${sample}\`).\n## Done when\n1. The rule is written (judgment: wording)\n`);
  const viaSkill = missing({ runbook: 'docs/playbooks/ledger.md' }, acts([user('every ledger line has a date'), call('Read', { file_path: path.join(dir, sample) }), edit, say('Done.')]));
  const other = missing({ runbook: 'docs/playbooks/ledger.md' }, acts([user('every ledger line has a date'), call('Read', { file_path: path.join(dir, 'skills/other/SKILL.md') }), edit, say('Done.')]));
  fs.rmSync(path.join(dir, 'docs/playbooks/ledger.md'));
  report(!viaSkill.some(s => /^Open/.test(s)) && other.some(s => /^Open/.test(s)), 'end: reading a skill the runbook hands its steps to counts as opening the runbook; another skill does not', { viaSkill, other });
}
report(onStop({ stop_hook_active: true, transcript_path: transcript([user('add a csv export'), edit]), session_id: 's' }) === null, 'end: a repeat stop with no record of its request is not blocked (its blocks cannot be counted)');
{
  // (an agent that ignores the block is blocked again with what is still missing, at most 3 times per request, the
  // verify list only the first time; once the work is done the stop passes)
  const { onPrompt } = await import('./start.mjs');
  const loadTurnT = (await import('./lib.mjs')).loadTurn;
  onPrompt({ session_id: 'again', prompt: 'add a csv export' });
  const tp = transcript([user('add a csv export'), edit]);
  const first = onStop({ transcript_path: tp, session_id: 'again' }), later = onStop({ transcript_path: tp, session_id: 'again', stop_hook_active: true });
  const third = onStop({ transcript_path: tp, session_id: 'again', stop_hook_active: true }), fourth = onStop({ transcript_path: tp, session_id: 'again', stop_hook_active: true });
  report(/Not done yet:[\s\S]*export\.md item 1/.test(first?.reason || '') && /Check that these items/.test(first?.reason || '')
    && /^Still not done \(do it now, or say in one line[\s\S]*export\.md item 1/.test(later?.reason || '') && !/Check that these items|last check/.test(later?.reason || '')
    && /last check for this request/.test(third?.reason || '') && fourth === null,
    'end: an agent that ignores the block gets a second naming the same item (no verify list), a third that says to report what is not done, and no fourth', [first?.reason, later?.reason, third?.reason, fourth]);
  onPrompt({ session_id: 'fixed', prompt: 'add a csv export' });
  const f1 = onStop({ transcript_path: tp, session_id: 'fixed' }), f2 = onStop({ transcript_path: transcript(good), session_id: 'fixed', stop_hook_active: true });
  report(f1?.decision === 'block' && f2 === null, 'end: once the missing work is done, the next stop passes', [f1?.decision, f2]);
  onPrompt({ session_id: 'again', prompt: 'add a csv export' });
  const next = onStop({ transcript_path: tp, session_id: 'again' });
  // (a message typed while a turn runs joins it; after the turn's Stop passes, the next message starts a new turn)
  onPrompt({ session_id: 'join', prompt: 'add a csv export' }); const t1 = loadTurnT('join');
  await new Promise(r => setTimeout(r, 5));
  onPrompt({ session_id: 'join', prompt: 'rotate the logs too' }); const t2 = loadTurnT('join');
  onStop({ transcript_path: transcript([user('add a csv export'), say('Done.')]), session_id: 'join' });
  await new Promise(r => setTimeout(r, 5));
  onPrompt({ session_id: 'join', prompt: 'rotate the logs' }); const t3 = loadTurnT('join');
  report(t2.at === t1.at && t2.runbook === 'docs/playbooks/export.md' && t3.at !== t1.at && t3.runbook === 'docs/playbooks/windows.md',
    'start: a message that arrives mid-turn joins the turn (same start, same runbook); after a passing Stop the next one starts a new turn', [t1, t2, t3]);
  report(next?.decision === 'block' && /^Not done yet/.test(next?.reason || ''), 'end: a new request starts its own count of blocks', next?.reason);
}
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
// (a count an earlier turn's run printed backs the claim when this turn changed no code; with a code change, or a count
// no run printed, it does not. Lesson (trial v45))
{
  const earlier = '{"type":"user","message":{"content":[{"type":"tool_result","content":"..........\\n12 passed in 3.1s"}]}}';
  const now = new Date().toISOString();
  const quiet = testGaps({ ...acts([user('is the export fine?'), say('Yes: no code changed since the 12 passed.')]), at: now }, earlier).length;
  const other = testGaps({ ...acts([user('is the export fine?'), say('Yes: 14 passed.')]), at: now }, earlier).length;
  const edited = testGaps(acts([user('fix the total'), code, say('Fixed; 12 passed.')]), earlier).length;
  report(quiet === 0 && other === 1 && edited === 1, 'end: a pass count an earlier run in the session printed backs the claim on a turn with no code change; another count, or a code change, does not', JSON.stringify({ quiet, other, edited }));
}
// (only a pass count is a claim: wording about tests is not. Lesson (trial v34): "I don't know whether your tests pass"
// and "a rule that tests pass before each commit" were held as claims that tests had passed)
report(['Go is not installed, so I don\'t know whether your tests pass today.', 'Added a rule that tests, build and vet pass before each commit.', 'The health check passed (31 checks, 0 failed).']
  .every(t => testGaps(acts([user('set it up'), say(t)])).length === 0), 'end: wording about tests passing, with no pass count, is not a claim that they passed');
report(testGaps(acts([user('upgrade the engine'), call('Bash', { command: 'node tools/hooks/selfcheck.mjs --full > .cache/sc.txt; tail -1 .cache/sc.txt' }, 'selfcheck: ALL PASS (1655 passed, 0 failed)'), say('Upgraded: 1655 passed.')])).length === 0,
  'end: a project\'s own test command whose output shows a passing summary backs "N passed"');
report(testGaps(acts([user('upgrade the engine'), call('Bash', { command: 'node tools/check.mjs' }, 'checks: 12 passed, 2 failed'), say('Done, 12 passed.')])).length === 1,
  'end: an output with failures does not back "passed"');
report(testGaps(acts([user('Another session: the upgrade is in, selfcheck 1635 passed, 0 failed.'), say('The project is upgraded and its 1635 tests passed.')])).length === 0
  && testGaps(acts([user('how is the project?'), call('Bash', { command: 'tail -1 ../app/.cache/selfcheck-last.txt' }, 'selfcheck: ALL PASS (1635 passed)'), say('Its tests passed.')])).length === 0,
  'end: an answer relaying a result this turn heard or read (a message, a report file) is not asked to run the tests itself');
const resumed = turnRows(transcript([user('fix the export'), code, { type: 'user', isCompactSummary: true, message: { role: 'user', content: 'This session is being continued from a previous conversation that ran out of context.' } }, say('Continuing.')]));
{
  // (the host also writes request copies that repeat a result with no time: they are not the turn's own rows)
  const k = `t${++id}`;
  const rows = [{ ...user('fix the total'), timestamp: '2026-01-02T10:00:00.000Z' },
    { type: 'assistant', timestamp: '2026-01-02T10:00:01.000Z', message: { content: [{ type: 'tool_use', id: k, name: 'Bash', input: { command: 'npm test' } }] } },
    { type: 'user', timestamp: '2026-01-02T10:00:09.000Z', message: { content: [{ type: 'tool_result', tool_use_id: k, content: '12 passed' }] } },
    { type: 'api-request-blob', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: k, content: '12 passed' }] } }];
  const run = turnActs(turnRows(transcript(rows))).calls[0];
  report(run?.done === Date.parse('2026-01-02T10:00:09.000Z'), 'end: a request copy that repeats a result without a time does not erase when the run ended', run?.done);
}
report(resumed.length === 5, 'end: the summary that resumes a session is not a new request, so the turn keeps its earlier work', resumed.length);
{
  // (the host writes a message from another session as a meta row, and the prompt hook runs on it: a new turn)
  const peer = { type: 'user', isMeta: true, message: { role: 'user', content: 'Another Claude session sent a message: <cross-session-message from="x">a note</cross-session-message>' } };
  const hooked = { type: 'attachment', attachment: { type: 'hook_additional_context', hookEvent: 'UserPromptSubmit', content: [] } };
  const p = turnActs(turnRows(transcript([user('fix the export'), code, say('Fixed.'), peer, hooked, call('Bash', { command: 'git log -3' }), say('Noted.')])));
  report(!worked(p), 'end: a message from another session that starts a turn is that turn\'s start, so the earlier turn\'s edits are not this turn\'s work', p.calls.map(c => c.name));
  // (live, the saved time of the prompt hook marks the start, whatever kind of row the request is)
  const at = (s, r) => ({ ...r, timestamp: `2026-01-02T10:${s}.000Z` });
  const kE = `t${++id}`, kB = `t${++id}`, kL = `t${++id}`;
  const timed = transcript([at('00:00', user('fix the export')), at('00:05', { type: 'assistant', message: { content: [{ type: 'tool_use', id: kE, name: 'Edit', input: { file_path: 'src/a.js' } }] } }),
    at('05:00', { type: 'user', isMeta: true, message: { role: 'user', content: 'a note from elsewhere' } }),
    at('05:02', { type: 'assistant', message: { content: [{ type: 'tool_use', id: kB, name: 'Bash', input: { command: 'git log -3' } }] } }),
    at('05:09', user('<system-reminder>also look at the totals</system-reminder>')),
    at('05:10', { type: 'assistant', message: { content: [{ type: 'tool_use', id: kL, name: 'Edit', input: { file_path: 'src/b.js' } }] } })]);
  const live = turnActs(turnRows(timed, '2026-01-02T10:05:00.300Z')).calls.map(c => c.input.file_path || c.input.command);
  report(JSON.stringify(live) === JSON.stringify(['git log -3', 'src/b.js']) && JSON.stringify(turnActs(turnRows(timed, '2026-01-02T10:00:00.200Z')).calls.length) === '3',
    'end: live, the turn starts at the request the prompt hook saw, by its saved time, and a row arriving mid-turn does not split it', live);
  const mid = turnActs(turnRows(transcript([user('fix the export'), code, { type: 'attachment', attachment: { type: 'queued_command', prompt: 'a note' } }, hooked, say('Fixed.')])));
  report(worked(mid), 'end: a message from another session that arrives mid-turn does not split the turn', mid.calls.map(c => c.name));
  // (a note written outside the project, such as the agent's memory or a scratch file, is not the project's work)
  const away = path.join(os.tmpdir(), 'elsewhere', 'memory', 'note.md');
  const outside = turnActs(turnRows(transcript([user('note the report'), call('Write', { file_path: away, content: 'x' }), call('Edit', { file_path: away, old_string: 'x', new_string: 'y' }), say('Noted.')])));
  const relative = turnActs(turnRows(transcript([user('fix the export'), call('Edit', { file_path: 'src/a.js', old_string: 'a', new_string: 'b' }), say('Fixed.')])));
  report(!worked(outside) && worked(relative) && worked(turnActs(turnRows(transcript([user('fix the export'), code, say('Fixed.')])))),
    'end: an edit outside the project folder is not work for the end check; one inside it, by full or relative path, is');
}
fs.rmSync(path.join(dir, 'package.json')); put('pyproject.toml', '[project]\nname = "tool"\n');
report(testGaps(acts([user('fix the total'), code, say('Fixed.')])).length === 0, 'end: a build file alone (pyproject.toml, no test setup) asks for no tests');
put('tools/gui/test_panel.py', 'def test_x(): pass\n');
report(testGaps(acts([user('fix the total'), code, say('Fixed.')])).length === 1, 'end: test files in the project (test_*.py) count as a test setup');
fs.rmSync(path.join(dir, 'tools'), { recursive: true });
put('pyproject.toml', '[project]\nname = "tool"\n[tool.pytest.ini_options]\n');
report(testGaps(acts([user('fix the total'), code, say('Fixed.')])).length === 1, 'end: a configured pytest asks for a test run after a code change');
report(testGaps(acts([user('fix the total'), code, call('Bash', { command: 'pytest -q' }, 'This Bash command requires approval', true), say('Fixed; the tests could not run here.')])).length === 0
  && testGaps(acts([user('fix the total'), code, call('Bash', { command: 'go test ./...' }, '/usr/bin/bash: line 1: go: command not found', true), say('Fixed; Go is not installed.')])).length === 0
  && testGaps(acts([user('fix the total'), code, call('Bash', { command: 'pytest -q' }, '1 failed', true), say('Fixed.')])).length === 1
  // (held before the last edit too: it stays held)
  && testGaps(acts([user('fix the total'), call('Bash', { command: 'pytest -q' }, 'This command requires approval', true), code, say('Fixed; the tests could not run here.')])).length === 0,
  'end: a test run that could not start (held for approval, program missing), before or after the last edit, is not asked for again; a failing run still is');
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
put('tools/hooks/config.json', JSON.stringify({ test: 'node site/page-test.mjs && node site/verify.mjs' }));
const page = call('Edit', { file_path: path.join(dir, 'site/page.js'), old_string: 'a', new_string: 'b' });
report(testGaps(acts([user('fix the page'), page, say('Fixed.')])).length === 1
  && testGaps(acts([user('fix the page'), page, call('Bash', { command: 'cd site && node site/page-test.mjs' }, 'done'), say('Fixed.')])).length === 0,
  'end: the project\'s declared test command (config "test") is its test setup and counts as a test run');
// (with a declared test command, a held hand-made run does not excuse it, and the ask names it; a declared command whose
// program is not installed is not asked for. Lesson (trial v44))
{
  put('tools/hooks/config.json', JSON.stringify({ test: 'node tests/run.mjs' }));
  const held = testGaps(acts([user('fix the page'), page, call('Bash', { command: 'pytest -q tests' }, 'This Bash command requires approval', true), say('Fixed; the tests could not run here.')]));
  const heldOwn = testGaps(acts([user('fix the page'), page, call('Bash', { command: 'node tests/run.mjs' }, 'This Bash command requires approval', true), say('Fixed; the tests could not run here.')])).length;
  // (the app pack's layout, "app": { "test" }, counts the same. Lesson (trial v46))
  put('tools/hooks/config.json', JSON.stringify({ app: { test: 'node tests/run.mjs' } }));
  const app = testGaps(acts([user('fix the page'), page, say('Fixed.')]));
  put('tools/hooks/config.json', JSON.stringify({ app: { test: 'no-such-runner-x test ./...' } }));
  const appMissing = testGaps(acts([user('fix the page'), page, say('Fixed; the toolchain is not installed here.')])).length;
  report(app.length === 1 && /this project's command: node tests\/run\.mjs/.test(app[0]) && appMissing === 0, 'end: the app pack\'s "app": { "test" } is the declared test command too', JSON.stringify({ app, appMissing }));
  put('tools/hooks/config.json', JSON.stringify({ test: 'no-such-runner-x test ./...' }));
  const missing = testGaps(acts([user('fix the page'), page, say('Fixed; the toolchain is not installed here.')])).length;
  report(held.length === 1 && /this project's command: node tests\/run\.mjs/.test(held[0]) && heldOwn === 0 && missing === 0,
    'end: with a declared test command, only a held run of that command excuses the tests, the ask names it, and a command whose program is not installed is not asked for', { held, heldOwn, missing });
}
put('tools/hooks/config.json', JSON.stringify({ commitGate: [{ cmd: 'python site/verify\\.py && node site/controls\\.js', when: ['site/**'] }] }));
report(gateGaps(acts([user('tidy the notes'), call('Edit', { file_path: path.join(dir, 'notes/a.md'), old_string: 'a', new_string: 'b' }), say('Tidied.')])).length === 0, 'end: a change outside a declared check\'s files asks for nothing');
// (a declared check that is a test run is met by a passing test run in another spelling. Lesson (trial v34): the
// tests passed as node --test tests/*.test.mjs, the declared check read node --test "tests/**/*.test.mjs", and it asked)
put('tools/hooks/config.json', JSON.stringify({ commitGate: [{ cmd: 'node --test "tests/\\*\\*/\\*\\.test\\.mjs"', when: ['site/**'] }] }));
report(gateGaps(acts([user('fix the page'), siteEdit, call('Bash', { command: 'node --test tests/*.test.mjs 2>&1 | grep pass' }, 'ℹ pass 16\nℹ fail 0'), say('Fixed.')])).length === 0
  && gateGaps(acts([user('fix the page'), siteEdit, call('Bash', { command: 'node --test tests/*.test.mjs' }, '✖ 1 failing\nℹ fail 1', true), say('Fixed.')])).length === 1,
  'end: a declared test check is met by a passing test run spelled another way; a failing one is not');
put('tools/hooks/config.json', JSON.stringify({ commitGate: [{ cmd: 'go test \\./\\.\\.\\. && go build \\./\\.\\.\\. && go vet \\./\\.\\.\\.', when: ['site/**'] }] }));
{ const noGo = call('Bash', { command: 'cd site && go test ./...' }, "Exit code 127\n/usr/bin/bash: line 1: go: command not found", true);
  const gMissing = gateGaps(acts([user('fix the page'), siteEdit, noGo, say('Fixed. Go is not installed here, so nothing was built or tested.')]));
  const gOther = gateGaps(acts([user('fix the page'), siteEdit, call('Bash', { command: 'gofmt -l .' }, 'command not found', true), say('Fixed.')]));
  report(gMissing.length === 0 && gOther.length === 3, 'end: a declared check whose program could not start this turn is not asked for; another missing program does not excuse it', { gMissing, gOther }); }
put('tools/hooks/config.json', JSON.stringify({ commitGate: [{ cmd: 'python site/verify\\.py && node site/controls\\.js', when: ['site/**'] }] }));

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
{ // a build rewrites its output folder; that output is not a screen the agent changed
  const built = () => { for (const f of ['_site/index.html', 'web/.svelte-kit/app.html']) put(f, '<p>built</p>'); };
  built();
  const a = acts([user('add a recipe'),call('Write', { file_path: path.join(dir, '_site/recetas/index.html'), content: 'x' }), call('Bash', { command: 'npm run build' }, 'built'), say('Added.')]);
  report(screenGaps(a).length === 0, 'end: build output (_site, .svelte-kit) is not a changed screen', screenGaps(a));
  for (const f of ['_site', 'web/.svelte-kit']) fs.rmSync(path.join(dir, f), { recursive: true, force: true });
}

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
  && knowledgeGaps(acts([user('add the tide facts'), fact(plain + ' The user said this on 2026-11-05.'), say('Added.')])).length === 0
  && knowledgeGaps(acts([user('add the tide facts'), fact(plain + ' (user reported, 2026-11-05)'), say('Added.')])).length === 0,
  'end: a link, a project file or the user as the source passes, "user reported" too');
report(knowledgeGaps(acts([user('add the tide facts'), fact(plain), call('Edit', { file_path: path.join(dir, 'docs/knowledge/SOURCES.md'), old_string: 'a', new_string: '| tides | https://example.org |' }), say('Added.')])).length === 0,
  'end: a sources list edited in the same turn covers the new facts');
report(knowledgeGaps(acts([user('fix a typo'), fact('Tides'), fact(plain, 'docs/knowledge/README.md'), fact(plain, 'notes/tides.md'), say('Fixed.')])).length === 0,
  'end: a short fix, the knowledge index files and notes outside the knowledge base ask for nothing');
{ // (link lines added below a note's old text are no new facts; a fact added the same way still is)
  const link = (add, f = 'docs/knowledge/tides.md') => call('Edit', { file_path: path.join(dir, f), old_string: plain, new_string: `${plain}\n\n${add}` });
  report(knowledgeGaps(acts([user('link the tide notes'), link('Related: [[Harbour]], [[Pier]]'), link('## Related\n- [[Moon]]\n- [Pier](pier.md)', 'docs/knowledge/moon.md'), say('Linked.')])).length === 0
    && knowledgeGaps(acts([user('add a fact'), link('The harbour master logs every closing day and posts the list at the pier office each spring.'), say('Added.')])).length === 1,
    'end: link lines added below a note\'s old text ask for no source; a new fact added the same way still does');
}
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

// end: questions the user asked not to get
const { questionGaps } = await import('./lib.mjs');
{
  const asked = [say('**Questions for you**\n1. Should staff delete books?'), say('**Done:** set up.')];
  const plain = questionGaps(acts([user('add a filter for the month'), ...asked])).length;
  const told = questionGaps(acts([user('set up this project. Decide everything yourself and do not ask me anything.'), ...asked])).length;
  put('tools/hooks/config.json', JSON.stringify({ autonomy: 'auto' }));
  const auto = questionGaps(acts([user('add a filter for the month'), ...asked])).length, none = questionGaps(acts([user('add a filter for the month'), say('**Done:** added. **Heads-up:** install Go to run the tests.')])).length;
  fs.rmSync(path.join(dir, 'tools/hooks/config.json'));
  report(plain === 0 && told === 1 && auto === 1 && none === 0, 'end: with "autonomy": "auto" or "do not ask me" in the request, any message of the turn that asks "Questions for you" is named; a heads-up is not', { plain, told, auto, none });
}

// (a repeat block reads what the agent said after the last block: an Issue line in the first answer, gone from the
// corrected one, blocks no more)
{
  const { onPrompt } = await import('./start.mjs');
  onPrompt({ session_id: 'issueclear', prompt: 'tidy the meeting notes' });
  const t0 = new Date(Date.now() + 10).toISOString(), stamp = (r, t) => ({ ...r, timestamp: t });
  await new Promise(r => setTimeout(r, 20));
  const first = [stamp(user('tidy the meeting notes'), t0), ...call('Edit', { file_path: path.join(dir, 'notes/meeting.md'), old_string: 'a', new_string: 'b' }).map(r => stamp(r, t0)),
    stamp(say('Issue: the notes were messy | runbook: debug | fixed when: the notes read cleanly\n\nTidied.'), t0)];
  const b1 = onStop({ transcript_path: transcript(first), session_id: 'issueclear' });
  await new Promise(r => setTimeout(r, 20));
  const b2 = onStop({ transcript_path: transcript([...first, stamp(say('Tidied the meeting notes.'), new Date().toISOString())]), session_id: 'issueclear', stop_hook_active: true });
  report(/Issue:/.test(b1?.reason || '') && b2 === null, 'end: after a block, an Issue line only in the answer before it blocks no more once the new answer drops it', [b1?.reason, b2?.reason]);
}

// (a skill with its own route that the turn opened is held to its checkable items; one it did not open is not)
{
  const { skillMissing } = await import('./end.mjs');
  put('skills/letters/SKILL.md', '---\nname: letters\ndescription: x\ntriggers: write a letter\n---\n## Done when\n- [ ] The answer ends with the sign-off check (answer: sign-off checked)\n- [ ] The tone fits (judgment: a reader)\n');
  const letter = call('Edit', { file_path: path.join(dir, 'letters/a.md'), old_string: 'a', new_string: 'b' });
  const readIt = call('Read', { file_path: path.join(dir, 'skills/letters/SKILL.md') });
  const opened = skillMissing(acts([user('write a letter to the landlord'), readIt, letter, say('Written.')]));
  const met = skillMissing(acts([user('write a letter to the landlord'), readIt, letter, say('Written. Sign-off checked.')]));
  const notOpened = skillMissing(acts([user('write a letter to the landlord'), letter, say('Written.')]));
  fs.rmSync(path.join(dir, 'skills/letters'), { recursive: true });
  report(opened.length === 1 && /letters\/SKILL\.md item 1/.test(opened[0]) && met.length === 0 && notOpened.length === 0,
    'end: a skill the turn opened is held to its checkable items (not its judgment ones); met or not opened, nothing', { opened, met, notOpened });
}

// (a fresh reviewer is asked for once, before the answer, only when it pays: an upset turn, risky work, or a runbook
// that asks for an outside read of its judgment items; a turn that launched one is done)
{
  const { reviewGaps } = await import('./end.mjs');
  const fix = call('Edit', { file_path: path.join(dir, 'notes/menu.md'), old_string: 'a', new_string: 'b' });
  const helper = call('Agent', { description: 'fresh review of the fix', prompt: 'You have not seen this work. Find every case of ...' });
  const upsetAsk = reviewGaps({ upset: true, runbook: null }, acts([user('you broke the menu again'), fix, say('Fixed.')]));
  const upsetDone = reviewGaps({ upset: true, runbook: null }, acts([user('you broke the menu again'), fix, helper, say('Fixed.')]));
  const calm = reviewGaps({ runbook: null }, acts([user('update the menu'), fix, say('Updated.')]));
  const release = reviewGaps({ runbook: null }, acts([user('ship it'), fix, call('Bash', { command: 'git tag v1.2.0' }), say('Tagged.')]));
  const dry = reviewGaps({ runbook: null }, acts([user('ship it'), fix, call('Bash', { command: 'gh release create v1.2.0 --dry-run' }), say('Checked.')]));
  put('docs/playbooks/letters.md', '---\nname: letters\ntriggers: write a letter\nreview: helper\n---\n## Done when\n1. The letter is saved (file: letters/**)\n2. The tone fits the reader (judgment: a reader)\n');
  const judged = reviewGaps({ runbook: 'docs/playbooks/letters.md' }, acts([user('write a letter'), call('Read', { file_path: path.join(dir, 'docs/playbooks/letters.md') }), call('Write', { file_path: path.join(dir, 'letters/a.md'), content: 'x' }), say('Written.')]));
  fs.rmSync(path.join(dir, 'docs/playbooks/letters.md'));
  const { onPrompt } = await import('./start.mjs'), { loadTurn: lt } = await import('./lib.mjs');
  onPrompt({ session_id: 'soreturn', prompt: 'WHY DID YOU BREAK THE MENU AGAIN' }); onPrompt({ session_id: 'relayturn', prompt: 'Another Claude session sent a message: WHY DID YOU BREAK THE MENU AGAIN' });
  if (!(lt('soreturn').upset === true && !lt('relayturn').upset)) report(false, 'start: an upset message from the user marks the turn; a relayed one does not', [lt('soreturn'), lt('relayturn')]);
  report(upsetAsk.length === 1 && /complaint[\s\S]*every case/.test(upsetAsk[0]) && /sonnet/.test(upsetAsk[0]) && /Never your reasoning/.test(upsetAsk[0]) && upsetDone.length === 0 && calm.length === 0
    && release.length === 1 && /security-review/.test(release[0]) && dry.length === 0 && judged.length === 1 && /letters\.md: 2\b/.test(judged[0]),
    'end: a fresh reviewer is asked for on an upset turn, a release and a runbook with "review: helper" (one brief, a cheaper model, no reasoning); not on a calm turn or a dry run, nor once one ran', { upsetAsk, upsetDone, calm, release, dry, judged });
}

// (a preview of the end check on a draft records nothing, so the real check still comes fresh; a block asks for a short
// note on what changed, never the whole answer again)
{
  const { onPrompt } = await import('./start.mjs');
  onPrompt({ session_id: 'preview1', prompt: 'add a csv export' });
  const tp = transcript([user('add a csv export'), edit]);
  const pre = onStop({ transcript_path: tp, session_id: 'preview1', last_assistant_message: 'Draft.' }, { shadow: true }), real = onStop({ transcript_path: tp, session_id: 'preview1' });
  report(pre?.decision === 'block' && /^Not done yet/.test(real?.reason || '') && /Check that these items/.test(real?.reason || '')
    && /only what changed in the answer above/.test(real?.reason || '') && !/whole answer/.test(real?.reason || '') && /check --answer-file/.test(real?.reason || ''),
    'end: a preview on a draft records nothing (the real check comes fresh); a block asks for a short note on what changed, not the whole answer again', [pre?.decision, real?.reason]);
}
// (draft checks never count toward the cap: after two of them, the real stops still get all MAX_BLOCKS rounds, and the
// "last check" line comes only on the last. Lesson (a project's report): three blocks in one request read as drafts counted)
{
  const { onPrompt } = await import('./start.mjs');
  const { MAX_BLOCKS } = await import('./end.mjs');
  onPrompt({ session_id: 'cap1', prompt: 'add a csv export' });
  const tp = transcript([user('add a csv export'), edit]);
  for (let i = 0; i < 2; i++) onStop({ transcript_path: tp, session_id: 'cap1', last_assistant_message: 'Draft.' }, { shadow: true });
  const seen = Array.from({ length: MAX_BLOCKS + 1 }, () => onStop({ transcript_path: tp, session_id: 'cap1' }));
  const lastAt = seen.findIndex(o => /last check for this request/.test(o?.reason || ''));
  report(seen.slice(0, MAX_BLOCKS).every(o => o?.decision === 'block') && lastAt === MAX_BLOCKS - 1 && seen[MAX_BLOCKS] === null,
    'end: draft checks never count toward the block cap; the real stops get every round, the last says so, then it lets go', seen.map(o => o?.decision || null));
}
// (the hooks are named by kind everywhere the user or agent reads about them: Reminder, Guard, Check)
{
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', '..', '..');
  const { V2_SESSION } = await import('../hooks.mjs');
  const docs = [fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8'), fs.readFileSync(path.join(root, 'HOW-TO-USE.md'), 'utf8'), V2_SESSION];
  report(docs.every(t => /\bReminder\b/.test(t) && /\bGuard\b/.test(t) && /\bCheck\b/.test(t)) && /check --answer-file/.test(docs[0]),
    'rules: AGENTS.md, HOW-TO-USE.md and the session note name the three kinds of hook (Reminder, Guard, Check), and the rules say to run the check on a draft first');
}

// (the final answer the host hands over counts when the transcript does not hold it yet)
{
  const { onPrompt } = await import('./start.mjs');
  const early = good.slice(0, -1), answer = 'Done. How it was checked: npm test, 4 pass.';
  onPrompt({ session_id: 'lastmsg1', prompt: 'add a csv export' }); onPrompt({ session_id: 'lastmsg2', prompt: 'add a csv export' });
  const without = onStop({ transcript_path: transcript(early), session_id: 'lastmsg1' }), handed = onStop({ transcript_path: transcript(early), session_id: 'lastmsg2', last_assistant_message: answer });
  report(/item 3/.test(without?.reason || '') && !/item 3/.test(handed?.reason || ''), 'end: the final answer the host hands over meets an answer item the transcript does not hold yet', [without?.reason, handed?.reason]);
}

// end: in the starter itself the starter's changelog meets a docs/CHANGELOG.md item (that file is the template)
{
  const { met } = await import('./lib.mjs');
  const item = { kind: 'file', arg: 'docs/CHANGELOG.md' }, wrote = acts([user('add a csv export'), call('Edit', { file_path: path.join(dir, 'tools/starter/STARTER-CHANGELOG.md'), old_string: 'a', new_string: 'b' })]);
  const project = met(item, wrote);
  put('.starter-dev', '');
  const starter = met(item, wrote);
  fs.rmSync(path.join(dir, '.starter-dev'));
  report(project === false && starter === true, 'end: in the starter, its own changelog meets a docs/CHANGELOG.md item; in a project it does not', { project, starter });
}

// (the engine runbook's upgrade items fit a real upgrade, never a dry run, which writes nothing. Lesson (replay
// 2026-11-07): most repeat blocks in one project were dry runs asked for an upgrade review and a commit)
{
  const here = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', '..', '..');
  const lines = fs.readFileSync(path.join(here, 'docs/playbooks/engine.md'), 'utf8').split('\n').filter(l => /\(when ran: starter\\\.mjs upgrade/.test(l));
  const whens = lines.map(l => /\(when\s+ran:\s*([^)]+)\)/i.exec(l)?.[1]).filter(Boolean).map(s => new RegExp(s.trim(), 'i'));
  const fits = c => whens.map(rx => rx.test(c));
  const real = ['node tools/starter.mjs upgrade 2>&1', 'node tools/starter.mjs update', 'node tools/starter.mjs update --keep-local > .cache/u.txt'].map(fits).flat();
  const dry = ['node tools/starter.mjs upgrade --dry-run 2>&1', 'node tools/starter.mjs update --dry-run', 'node tools/starter.mjs uninstall --dry-run'].map(fits).flat();
  report(whens.length >= 2 && real.every(Boolean) && !dry.some(Boolean), 'engine runbook: its upgrade items fit a real upgrade and never a dry run', { whens: whens.map(String), real, dry });
}

// end: the user's own words written into a file as a quote are named once; a general lesson, a dictated line and a
// note in .cache are not (AGENTS.md rule 14)
{
  const { quoteGaps } = await import('./lib.mjs');
  const said = 'ugh the totals row keeps vanishing every single time i export the orders';
  const w = (file, text) => call('Edit', { file_path: path.join(dir, file), old_string: 'a', new_string: text });
  const lesson = () => quoteGaps(acts([user(said), w('src/export.js', '// Lesson (the user): "the totals row keeps vanishing every single time i export"'), say('Fixed.')]));
  const cfgFile = path.join(dir, 'tools/hooks/config.json'), had = fs.existsSync(cfgFile) ? fs.readFileSync(cfgFile, 'utf8') : null;
  const setQ = v => put('tools/hooks/config.json', JSON.stringify({ ...(had ? JSON.parse(had) : {}), ...(v === undefined ? {} : { quoteCheck: v }) }));
  // (offered, never forced: unset in a project it is off; the user's "quoteCheck": true turns it on, false off)
  setQ(undefined); const unset = lesson();
  setQ(false); const off = lesson();
  setQ(true);
  const quoted = lesson();
  const general = quoteGaps(acts([user(said), w('src/export.js', '// Lesson: the export dropped the totals row; keep it as the last row'), say('Fixed.')]));
  const dictated = quoteGaps(acts([user('add a footer that reads thanks for shopping with us today friends'), w('src/footer.html', '<p>thanks for shopping with us today friends</p>'), say('Added.')]));
  const notes = quoteGaps(acts([user(said), w('.cache/turn-notes.md', 'Issue: "the totals row keeps vanishing every single time" | runbook: debug'), say('Fixed.')]));
  if (had === null) fs.rmSync(cfgFile); else fs.writeFileSync(cfgFile, had);
  report(!unset.length && !off.length, 'end: the quote check is off in a project until the user turns it on ("quoteCheck": true), and off again with false', JSON.stringify({ unset, off }));
  report(quoted.length === 1 && /rule 14/.test(quoted[0]) && !general.length && !dictated.length && !notes.length,
    'end: the user\'s own words written into a file as a quote are named once; a general lesson, a dictated line and a .cache note are not', JSON.stringify({ quoted, general, dictated, notes }));
}

// end: an engine note shown to the user
const { noteGaps } = await import('./lib.mjs');
{
  const shown = noteGaps(acts([user('why did you do that'), say('Issue: the list was wrong | runbook: debug | fixed when: the list is right\n\nYou are right.')])).length;
  const none = noteGaps(acts([user('why did you do that'), say('Issue: none - the list was right')])).length;
  const plain = noteGaps(acts([user('why did you do that'), say('You are right: the list missed two rows. The issue: a filter dropped them.')])).length;
  report(shown === 1 && none === 1 && plain === 0, 'end: an "Issue:" engine note in the answer is named; plain words about an issue are not', { shown, none, plain });
  // (the rules say the same as the check: the Issue line goes to the notes file, never the answer)
  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', '..', '..');
  const rules = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8').replace(/\s+/g, ' '), skill = fs.readFileSync(path.join(root, 'skills/learn-from-upset/SKILL.md'), 'utf8').replace(/\s+/g, ' ');
  report(/Issue: <problem>[^.]*line in `\.cache\/turn-notes\.md` \(never in the answer/.test(rules) && /the answer never shows them/.test(skill),
    'rules: AGENTS.md rule 3 and the learn-from-upset skill put the Issue line in the notes file, never the answer, as the end check expects');
}

// end: check 7, claims backed by the turn
const { claimGaps } = await import('./lib.mjs');
put('src/a.js', 'x');
report(claimGaps(acts([user('commit it'), call('Bash', { command: 'git commit -m x' }, '[main 3e76a21] x'), say('Committed as 3e76a21. Corrected: "old" -> "new". The changed file is src/a.js.')])).length === 0,
  'end: a commit shown by this turn\'s output and a file that exists pass; an engine label is not a claim');
const madeUp = claimGaps(acts([user('commit it'), code, say('Committed as 9f8e7d6, see src/missing.js and C:/nowhere/at/all.md.')]));
report(madeUp.length === 2 && /9f8e7d6/.test(madeUp[0]) && /src\/missing\.js/.test(madeUp[1]) && /C:\/nowhere/.test(madeUp[1]), 'end: a commit nothing showed and files that do not exist are named', madeUp);
report(claimGaps(acts([user('clean up'), code, say('Removed src/old.js, the color is #a1b2c3d, and see other-project/notes/a.md for the record.')])).length === 0,
  'end: a file said to be removed, a colour code and a path in another folder ask for nothing');
// (Lesson (trial v40): an example name for next week's file and a file the answer says was filed elsewhere were reported)
report(claimGaps(acts([user('take in the orders'), code, say('Save next week\'s file in src/, for example src/orders-w43.csv. Last week\'s src/orders-w42.csv was taken in during setup and is now filed under src/a.js.')])).length === 0
  && claimGaps(acts([user('take in the orders'), code, say('The orders are in src/orders-w43.csv.')])).some(s => /orders-w43/.test(s)),
  'end: a path given as an example, or said to be filed or taken in elsewhere, asks for nothing; a missing path stated as fact still does');
put('NOTES.md', 'x');
report(claimGaps(acts([user('sync the rules'), code, say('Both files, NOTES.md/src/rules.md, are in sync.')])).length === 0
  && claimGaps(acts([user('sync the rules'), code, say('See NOTES.md and src/rules-old.md.')])).some(s => /rules-old/.test(s)),
  'end: two file names joined by a slash are a pair, not a missing path; a missing path still is named');
fs.rmSync(path.join(dir, 'NOTES.md'));
// (an answer with a Finished section names its files there: a path only mentioned above it, such as an example of a
// report a later check would write, is not a file it claims. Lesson (trial v34): such an example was reported missing)
{
  put('outputs/.keep', '');
  const fin = 'The new check will write reports like outputs/check-ch03.md when it finds a problem.\n\n## Finished\n- Changed: src/a.js';
  const finBad = 'Done.\n\n## Finished\n- Changed: src/missing-report.md';
  report(claimGaps(acts([user('add the check'), code, say(fin)])).length === 0 && claimGaps(acts([user('add the check'), code, say(finBad)])).some(s => /missing-report/.test(s)),
    'end: with a Finished section, only the files it lists are checked; a missing one there is still named');
}
// (a commit claim is checked only by the commit it names, never by the word: grammar lists were wrong more often than
// right on live data)
report(['Done and committed.', 'Nothing else is ready until it passes and its engine proof is committed.', 'It ships if the change is committed.', 'All pushed.', 'The fixes get committed once they pass.']
  .every(t => claimGaps(acts([user('status?'), code, say(t)])).length === 0)
  && claimGaps(acts([user('save it'), code, say('Committed as 7c6b5a4.')])).some(s => /7c6b5a4/.test(s)),
  'end: a bare "committed" or "pushed" is not checked by its wording; a named commit nothing showed is');
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
  // (a held install stays held: the rules say not to script around it. Lesson (trial v45): a setup helper wrote a script
  // that ran the install the host had held five times)
  const rules = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8').replace(/\s+/g, ' ');
  report(/If your tool holds that install, still run the project's own test command once, and never script around the hold\./.test(rules), 'rules: a held install is never scripted around');
  // (a session the v2 prompt hook (or begin) has seen may commit: the git guard reads v2's turn file too)
  {
    const { spawnSync } = await import('node:child_process');
    const g = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-git-')), sidG = `v2gate${process.pid}`;
    spawnSync('git', ['init', '-q'], { cwd: g });
    const run = () => spawnSync(process.execPath, [path.join(repo, 'tools/hooks/git-guard.mjs'), 'pre-commit'], { cwd: g, encoding: 'utf8', env: { ...process.env, CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: sidG, ANZUELO_SESSION_GATE: '' } }).status;
    const before = run(), f = path.join(repo, 'tools/hooks/state', `v2-turn.${sidG}.json`);
    fs.writeFileSync(f, JSON.stringify({ at: new Date().toISOString(), runbook: null }));
    const after = run();
    fs.rmSync(f, { force: true }); fs.rmSync(g, { recursive: true, force: true });
    report(before === 1 && after === 0, 'guard: a session the v2 prompt hook recorded may commit; one no hook saw is refused (engine-bypassed)', [before, after]);
  }
  // (a resumed session whose last turn ended gets no "interrupted" notice; one whose last turn never ended does)
  {
    const { spawnSync } = await import('node:child_process');
    const c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-resume-'));
    fs.mkdirSync(path.join(c, 'tools/hooks/state'), { recursive: true });
    fs.cpSync(path.join(repo, 'tools/hooks/v2'), path.join(c, 'tools/hooks/v2'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c, 'tools/hooks', f));
    const resume = ended => { const sid = ended ? 'resumedone' : 'resumeopen';
      fs.writeFileSync(path.join(c, `tools/hooks/state/v2-turn.${sid}.json`), JSON.stringify({ at: new Date().toISOString(), runbook: null, ...(ended ? { ended: true } : {}) }));
      return spawnSync(process.execPath, [path.join(c, 'tools/hooks/hooks.mjs'), 'session'], { cwd: c, encoding: 'utf8', input: JSON.stringify({ session_id: sid, source: 'resume' }), env: { ...process.env, STARTER_ENGINE: 'v2', ANZUELO_ROOT: c } }).stdout || ''; };
    const done = resume(true), open = resume(false);
    fs.rmSync(c, { recursive: true, force: true });
    report(!/RESUMED|INTERRUPTED/.test(done) && /RESUMED|INTERRUPTED/.test(open), 'session: a resume after a turn that ended says nothing about an interruption; after one that never ended it does', [done.slice(-160), open.slice(-160)]);
  }
  // (during work v2 says nothing about a background run still going, even before another test run: REQ quiet-work)
  {
    const { spawnSync } = await import('node:child_process');
    const c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-quiet-'));
    fs.mkdirSync(path.join(c, 'tools/hooks/state'), { recursive: true });
    fs.cpSync(path.join(repo, 'tools/hooks/v2'), path.join(c, 'tools/hooks/v2'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c, 'tools/hooks', f));
    const tp = path.join(c, 'transcript.jsonl'), at = new Date().toISOString();
    fs.writeFileSync(tp, [
      { type: 'user', timestamp: at, message: { role: 'user', content: 'run the tests and fix the export' } },
      { type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'bgq1', name: 'Bash', input: { command: 'node tools/run-tests.mjs > .cache/t.txt 2>&1', run_in_background: true } }] } },
      { type: 'user', timestamp: at, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'bgq1', content: 'Command running in background with ID: bq1. Output is being written to: C:\\x\\bq1.output' }] } },
      { type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'agq1', name: 'Agent', input: { description: 'review the export', prompt: 'Review the export change.', run_in_background: true } }] } },
      { type: 'user', timestamp: at, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'agq1', content: 'Async agent launched successfully. agentId: agq1' }] } },
      { type: 'user', timestamp: at, message: { role: 'user', content: 'also add the totals row' } },
    ].map(r => JSON.stringify(r)).join('\n') + '\n');
    const hook = (cmd, tool_name, tool_input) => spawnSync(process.execPath, [path.join(c, 'tools/hooks/hooks.mjs'), cmd], { cwd: c, encoding: 'utf8',
      input: JSON.stringify({ session_id: 'quietwork', transcript_path: tp, tool_name, tool_input }), env: { ...process.env, STARTER_ENGINE: 'v2', ANZUELO_ROOT: c } }).stdout || '';
    const call = command => hook('pretool', 'Bash', { command });
    const outs = [call('node tools/run-tests.mjs --only export'), call('ls src'), call('git status'), hook('pretool', 'Edit', { file_path: path.join(c, 'src/export.js'), old_string: 'a', new_string: 'b' }),
      hook('posttool', 'Edit', { file_path: path.join(c, 'src/export.js'), old_string: 'a', new_string: 'b' })];
    fs.rmSync(c, { recursive: true, force: true });
    report(outs.every(o => !/additionalContext|Heads-up|still running/i.test(o)), 'pretool, posttool: with a background test run and a helper going and a new user message, no call during work gets a notice (quiet work)', outs.map(o => o.slice(0, 160)));
  }
  // (a send-back adds no line of its own for the user: they see one answer, not a notice and then a second one. Lesson
  // (the user, 2026-11-07): the answer goes out once, in its final version)
  {
    const { spawnSync } = await import('node:child_process');
    const c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-mark-'));
    fs.mkdirSync(path.join(c, 'tools/hooks/state'), { recursive: true }); fs.mkdirSync(path.join(c, 'docs/playbooks'), { recursive: true });
    fs.cpSync(path.join(repo, 'tools/hooks/v2'), path.join(c, 'tools/hooks/v2'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c, 'tools/hooks', f));
    fs.writeFileSync(path.join(c, 'docs/playbooks/export.md'), '---\nname: export\ntriggers: csv export\n---\n## Done when\n1. The answer says how it was checked (answer: How it was checked)\n');
    const tp = path.join(c, 't.jsonl'), at = new Date(Date.now() + 1000).toISOString();
    const env = { ...process.env, STARTER_ENGINE: 'v2', ANZUELO_ROOT: c, CLAUDE_PROJECT_DIR: c };
    const run = (cmd, extra) => spawnSync(process.execPath, [path.join(c, 'tools/hooks/hooks.mjs'), cmd], { cwd: c, encoding: 'utf8', input: JSON.stringify({ session_id: 'markline', transcript_path: tp, ...extra }), env }).stdout || '';
    run('prompt', { prompt: 'add a csv export' });
    fs.writeFileSync(tp, [{ type: 'user', timestamp: at, message: { role: 'user', content: 'add a csv export' } },
      { type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'tool_use', id: 'mk1', name: 'Read', input: { file_path: path.join(c, 'docs/playbooks/export.md') } }, { type: 'tool_use', id: 'mk2', name: 'Write', input: { file_path: path.join(c, 'src/export.js'), content: 'x' } }] } },
      { type: 'assistant', timestamp: at, message: { role: 'assistant', content: [{ type: 'text', text: 'Added.' }] } }].map(r => JSON.stringify(r)).join('\n') + '\n');
    const out = run('stop', { last_assistant_message: 'Added.' });
    fs.rmSync(c, { recursive: true, force: true });
    let j = {}; try { j = JSON.parse(out); } catch { }
    report(j.decision === 'block' && !j.systemMessage, 'stop: a send-back adds no line of its own for the user', out.slice(0, 300));
  }
  // (a new session never shows an "acknowledged" line from another session's old note; its own new one still shows.
  // Lesson (the user, in the desktop app): a plain question's first tool call showed another session's old issue)
  {
    const { spawnSync } = await import('node:child_process');
    const c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-ack-'));
    fs.mkdirSync(path.join(c, 'tools/hooks/state'), { recursive: true }); fs.mkdirSync(path.join(c, '.cache'), { recursive: true }); fs.mkdirSync(path.join(c, 'skills/learn-from-upset'), { recursive: true });
    fs.cpSync(path.join(repo, 'tools/hooks/v2'), path.join(c, 'tools/hooks/v2'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c, 'tools/hooks', f));
    fs.copyFileSync(path.join(repo, 'skills/learn-from-upset/SKILL.md'), path.join(c, 'skills/learn-from-upset/SKILL.md'));
    const notes = path.join(c, '.cache/turn-notes.md'), old = new Date(Date.now() - 3600_000);
    fs.writeFileSync(notes, 'Issue: the export dropped rows with commas | runbook: learn-from-upset | fixed when: every row is in the export\n'); fs.utimesSync(notes, old, old);
    const env = { ...process.env, STARTER_ENGINE: 'v2', ANZUELO_ROOT: c, CLAUDE_PROJECT_DIR: c };
    const run = (cmd, extra) => spawnSync(process.execPath, [path.join(c, 'tools/hooks/hooks.mjs'), cmd], { cwd: c, encoding: 'utf8', input: JSON.stringify({ session_id: 'freshack', transcript_path: path.join(c, 't.jsonl'), ...extra }), env }).stdout || '';
    run('prompt', { prompt: 'what does the setup runbook do' });
    const first = run('pretool', { tool_name: 'Bash', tool_input: { command: 'ls docs' } });
    fs.appendFileSync(notes, 'Issue: the summary named a file that does not exist | runbook: learn-from-upset | fixed when: every file named in the answer exists\n');
    const own = run('pretool', { tool_name: 'Bash', tool_input: { command: 'ls docs' } });
    fs.rmSync(c, { recursive: true, force: true });
    report(!/acknowledged/.test(first) && /acknowledged: the summary named a file/.test(own),
      'pretool: a new session shows no other session\'s old "acknowledged" line; its own new Issue line still shows', { first: first.slice(0, 200), own: own.slice(0, 200) });
  }
  // (the draft check: the health line alone is a pass on a first or a repeat check; a repeat's real item still fails)
  {
    const { previewOf } = await import('../hooks.mjs');
    const tail = '\nFix what isn\'t done. Then tell the user ...';
    const a = previewOf(`Not done yet:\n- (the health check would run here)${tail}`), b = previewOf(`Still not done (do it now):\n- (the health check would run here)${tail}`);
    const c2 = previewOf(`Still not done (do it now):\n- Run the tests${tail}`), d = previewOf(`Check that these items of x.md are really done:\n1. y${tail}`), e = previewOf(undefined);
    report(!a.real && !a.text && !b.real && !b.text && c2.real && /Run the tests/.test(c2.text) && !d.real && /really done/.test(d.text) && !e.real,
      'check preview: the health line alone passes on a first or a repeat check; a repeat\'s real item fails; a verify list alone does not', { a, b, c2, d });
  }
  // (a helper gets the rules line but never the parent's runbook checklist under v2; v1 still hands it over)
  {
    const { spawnSync } = await import('node:child_process'), c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-brief-'));
    fs.mkdirSync(path.join(c, 'tools/hooks/state'), { recursive: true }); fs.mkdirSync(path.join(c, '.cache'), { recursive: true }); fs.mkdirSync(path.join(c, 'docs/playbooks'), { recursive: true });
    fs.cpSync(path.join(repo, 'tools/hooks/v2'), path.join(c, 'tools/hooks/v2'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c, 'tools/hooks', f));
    fs.writeFileSync(path.join(c, 'docs/playbooks/export.md'), '---\nname: export\n---\n# Export\n## Done when\n- [ ] The tests pass (ran: npm test)\n');
    const brief = engine => {
      const at = new Date(Date.now() - 2000).toISOString();
      fs.writeFileSync(path.join(c, 'tools/hooks/state/turn.json'), JSON.stringify({ at }));
      fs.writeFileSync(path.join(c, 'tools/hooks/state/checklist-shown.json'), JSON.stringify({ at, files: ['docs/playbooks/export.md'] }));
      return spawnSync(process.execPath, [path.join(c, 'tools/hooks/hooks.mjs'), 'pretool'], { cwd: c, encoding: 'utf8',
        input: JSON.stringify({ session_id: 'brief', transcript_path: path.join(c, 't.jsonl'), tool_name: 'Agent', tool_input: { prompt: 'Check these five sources.', subagent_type: 'general-purpose' } }),
        env: { ...process.env, STARTER_ENGINE: engine, ANZUELO_ROOT: c, CLAUDE_PROJECT_DIR: c } }).stdout || '';
    };
    const v2 = brief('v2'), v1 = brief('v1');
    fs.rmSync(c, { recursive: true, force: true });
    report(/AGENTS\.md/.test(v2) && !/CHECKLIST/.test(v2) && /CHECKLIST/.test(v1),
      'subagent brief: under v2 a helper gets the rules line and no parent checklist; v1 still hands it over', JSON.stringify({ v2: v2.slice(-300), v1: v1.slice(-300) }));
  }
  // (the checks a project wrote itself are listed for its upgrade to turn into "Done when" lines; shipped ones are not)
  {
    const { projectChecks } = await import('../hooks.mjs');
    const c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-own-'));
    fs.mkdirSync(path.join(c, 'tools/hooks'), { recursive: true });
    fs.writeFileSync(path.join(c, 'tools/hooks/engine-checks.json'), JSON.stringify({ requirements: [{ tag: 'shipped-one', pack: 'app' }] }));
    fs.writeFileSync(path.join(c, 'tools/hooks/requirements.json'), JSON.stringify({ requirements: [{ tag: 'shipped-one', pack: 'app' }, { tag: 'totals-row-checked', message: 'Check the totals row.' }] }));
    const own = projectChecks(c).map(r => r.tag);
    fs.rmSync(c, { recursive: true, force: true });
    report(own.join() === 'totals-row-checked', 'upgrade: own-checks lists the checks the project wrote, not the ones the starter ships', own);
  }
  // (a v2 hook that cannot run shows its error to the agent once per session, never only on stderr)
  {
    const { spawnSync } = await import('node:child_process');
    const c = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-crash-'));
    fs.mkdirSync(path.join(c, 'tools/hooks'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c, 'tools/hooks', f));
    const hook = (cmd, extra = {}) => (spawnSync(process.execPath, [path.join(c, 'tools/hooks/hooks.mjs'), cmd], { cwd: c, encoding: 'utf8',
      input: JSON.stringify({ session_id: 'crashonce', prompt: 'add a recipe card', ...extra }), env: { ...process.env, STARTER_ENGINE: 'v2' } }).stdout || '').trim();
    const p1 = hook('prompt'), s1 = hook('stop'), s2 = hook('stop', { session_id: 'crashother', stop_hook_active: true });
    fs.rmSync(c, { recursive: true, force: true });
    report(/CRASHED/.test(p1) && /additionalContext/.test(p1) && s1 === '' && s2 === '',
      'crash: a v2 hook that cannot load tells the agent once per session; a Stop already held lets the session end', [p1.slice(0, 120), s1.slice(0, 80), s2.slice(0, 80)]);
    const c2 = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-crash-'));
    fs.mkdirSync(path.join(c2, 'tools/hooks'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c2, 'tools/hooks', f));
    const st = (spawnSync(process.execPath, [path.join(c2, 'tools/hooks/hooks.mjs'), 'stop'], { cwd: c2, encoding: 'utf8', input: JSON.stringify({ session_id: 'crashstop' }), env: { ...process.env, STARTER_ENGINE: 'v2' } }).stdout || '');
    fs.rmSync(c2, { recursive: true, force: true });
    report(/"decision":"block"/.test(st) && /CRASHED/.test(st), 'crash: a v2 Stop hook that cannot load blocks once with the error', st.slice(0, 160));
    // (an upgrade proves the engine runs in the project with its own hooks; the probe leaves no state behind)
    const { probeEngine } = await import('../hooks.mjs');
    const c3 = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-probe-'));
    fs.mkdirSync(path.join(c3, 'tools/hooks'), { recursive: true });
    for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(c3, 'tools/hooks', f));
    const broken = probeEngine(c3);
    fs.cpSync(path.join(repo, 'tools/hooks/v2'), path.join(c3, 'tools/hooks/v2'), { recursive: true });
    fs.rmSync(path.join(c3, 'tools/hooks/state'), { recursive: true, force: true });
    const fine = probeEngine(c3), left = (() => { try { return fs.readdirSync(path.join(c3, 'tools/hooks/state')).filter(f => /upgradeprobe/.test(f)); } catch { return []; } })();
    fs.rmSync(c3, { recursive: true, force: true });
    // (proving a check puts the fixed files back with their own modification time, so the end check does not take the
    // put-back for a change after the tests. Lesson (trial): the tests passed, prove ran, and the end check asked again)
    {
      const g = fs.mkdtempSync(path.join(os.tmpdir(), 'anzuelo-v2-prove-'));
      fs.mkdirSync(path.join(g, 'tools/hooks'), { recursive: true });
      for (const f of ['hooks.mjs', 'config.json']) fs.copyFileSync(path.join(repo, 'tools/hooks', f), path.join(g, 'tools/hooks', f));
      const gg = (...a) => spawnSync('git', a, { cwd: g, encoding: 'utf8' });
      gg('init', '-q'); fs.writeFileSync(path.join(g, 'menu.js'), 'broken\n'); gg('add', '-A'); gg('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'x');
      fs.writeFileSync(path.join(g, 'menu.js'), 'fixed\n');
      const old = new Date(Date.now() - 3600_000); fs.utimesSync(path.join(g, 'menu.js'), old, old);
      const before = fs.statSync(path.join(g, 'menu.js')).mtimeMs;
      const pr = spawnSync(process.execPath, [path.join(g, 'tools/hooks/hooks.mjs'), 'prove', `node -e "process.exit(require('fs').readFileSync('menu.js','utf8').includes('fixed')?0:1)"`], { cwd: g, encoding: 'utf8', env: { ...process.env, ANZUELO_SESSION_GATE: 'off' } });
      const after = fs.statSync(path.join(g, 'menu.js')).mtimeMs, body = fs.readFileSync(path.join(g, 'menu.js'), 'utf8');
      fs.rmSync(g, { recursive: true, force: true });
      report(body === 'fixed\n' && Math.abs(after - before) < 5, 'prove: the fixed files are put back with their own modification time', [pr.stdout.slice(0, 120), before, after]);
    }
    report(broken.length === 2 && broken.every(e => /v2|CRASHED/.test(e)) && !fine.length && !left.length,
      'upgrade: the engine probe names a v2 that cannot load, passes one that runs, and leaves no probe state', [broken.join(' | ').slice(0, 200), fine.join(' | '), left.join(',')]);
  }
  // (an upgrade's self-test never waits on other runs to time Stop, and the full run times v2's Stop, not only v1's)
  const np = fs.readFileSync(path.join(repo, 'tools/new-project.mjs'), 'utf8'), sc = fs.readFileSync(path.join(repo, 'tools/hooks/selfcheck.mjs'), 'utf8');
  const au = fs.readFileSync(path.join(repo, 'tools/audit.mjs'), 'utf8');
  report(/selfcheck\.mjs'\)\][^\n]*STARTER_NO_TIMING_WAIT: '1'/.test(np) && /selfcheck\.mjs'\), \.\.\.args\][^\n]*STARTER_NO_TIMING_WAIT: '1'/.test(au) && /STARTER_NO_TIMING_WAIT \? 0 : 600_000/.test(sc) && /STARTER_ENGINE: 'v2'[\s\S]{0,1200}stop-budget: engine v2/.test(sc.slice(sc.indexOf('const v2ms'))),
    'simple: an upgrade\'s or setup audit\'s self-test does not wait for other runs to time Stop, and the full self-test times v2\'s Stop');
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
