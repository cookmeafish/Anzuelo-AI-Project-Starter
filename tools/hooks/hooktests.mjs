// REQ: hooks-tested, shared by both engines: a change to the hook engine or to the checks (requirements.json,
// config.json) needs the self-tests that cover it run and passing, or, when they can't run here, an honest line. Moved
// here from hooks.mjs unchanged; the turn-start copies, the run log and the state files come in through io.
// io: { read(rel), exists(rel), before(rel): the file's text at the turn's start or null, engineChecks(), stateFile(name),
// readJSON(file, fallback), statSync(file), testInputsHash(), esc, cmdHead, neverRan, runsScript, engineNote,
// refusedOutright, saysNotRun, cantRunStep }
export function makeHookTests(io) {
  const { esc, cmdHead, neverRan, runsScript, engineNote, refusedOutright, saysNotRun, cantRunStep } = io;
  // Which checks a change to requirements.json / config.json touched, against the copies taken at the turn's start:
  // { all } when there is no copy to compare with, { tags } otherwise (empty: no check logic changed), { error } when a
  // file does not parse. Wording (message, rule, notes) and tuning lists are not check logic.
  const CONFIG_TAGS = { changeWords: 'question-no-file', praise: 'praise-captured', aiAttribution: 'no-ai-attribution', aiAuthor: 'no-ai-attribution',
    outwardOk: 'outward-gate', ruleRequest: 'rule-request', complaint: 'upset-learned', letdown: 'upset-learned', frustration: 'friction-suspend', taskVerbs: 'runbook-exists', overwriteWords: 'no-overwrite', deleteWords: 'protect-originals',
    commitGate: 'commit-gate', codeRules: 'code-rules', forbiddenCommands: 'forbidden-command', writeOnlyVia: 'write-only-via', wholeOutputTools: 'whole-output',
    secretPatterns: 'no-secrets', approvalPaths: 'approval-gate', protectedOriginals: 'protect-originals', noOverwrite: 'no-overwrite', newVersionOnly: 'no-overwrite',
    watchedInputs: 'watched-inputs', guiFiles: 'gui-review-loop', scopesRoot: 'scope-separate' };
  function touchedChecks(files) {
    const tags = new Set();
    for (const f of files) {
      const name = f.split('/').pop(), now = io.read(f), was = io.before(f);
      let a, b;
      try { a = JSON.parse(now); } catch (e) { if (name === 'config.json') return { error: `tools/hooks/config.json does not parse (${e.message}): fix it; every setting falls back to its default until then.` }; continue; } // requirements.json: requirements-valid reports it
      if (was == null) return { all: true };
      try { b = JSON.parse(was); } catch { return { all: true }; }
      if (name === 'config.json') {
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) if (JSON.stringify(a[k]) !== JSON.stringify(b[k]) && CONFIG_TAGS[k]) tags.add(CONFIG_TAGS[k]);
      } else {
        const logicOf = q => JSON.stringify({ ...q, message: undefined, rule: undefined, _comment: undefined, pack: undefined });
        const old = new Map((b.requirements || []).filter(q => q?.tag).map(q => [q.tag, logicOf(q)]));
        // A check exactly as the starter ships it (a pack's, installed unchanged) was proven by the starter's own tests.
        // Not in the starter itself, whose shipped copy is generated from the file being changed. Lesson, trial round 20:
        // installing a pack asked a project to self-test 12 checks it had not touched (94 s).
        const shipped = io.exists('.starter-template') ? new Map() : new Map(io.engineChecks().requirements.filter(q => q?.tag).map(q => [q.tag, logicOf(q)]));
        for (const q of (a.requirements || []).filter(q => q?.tag)) if (old.get(q.tag) !== logicOf(q) && shipped.get(q.tag) !== logicOf(q)) tags.add(q.tag); // added or changed; a removed check has nothing left to test
      }
    }
    return { tags: [...tags] };
  }
  // The Stop check, on x (the old engine's turn record: changed, runs, said, since, toolsKnown). Returns the steps:
  // [{ tag, msg, short? }].
  function hooksTestedGaps(x) {
    const miss = [], add = (tag, msg, short) => miss.push(short ? { tag, msg, short } : { tag, msg });
    // REQ: hooks-tested. Core (not in requirements.json) so emptying requirements.json can't switch off its own guard.
    // The full self-test is for a change to hook logic (hooks.mjs, selfcheck.mjs, wire.mjs). A change to requirements.json
    // or config.json is validated and needs only the scenarios of the checks it touched (selfcheck.mjs --tags a,b), or
    // nothing when no check logic changed. Lesson: one new namesIgnore glob demanded the whole multi-minute self-test.
    const logic = x.changed.some(p => /^tools\/hooks\/(hooks|selfcheck|wire)\.mjs$/.test(p));
    const data = x.changed.filter(p => /^tools\/hooks\/(requirements|config)\.json$/.test(p));
    if (logic || data.length) {
      const need = logic ? { all: true } : touchedChecks(data);
      if (need.error) add('hooks-tested', need.error);
      else if (need.all || need.tags.length) {
        const how = need.all ? 'node tools/hooks/selfcheck.mjs' : `node tools/hooks/selfcheck.mjs --tags ${need.tags.join(',')}`;
        const covers = r => !/--route|--ablation/.test(r.cmd) && (!/--tags/.test(r.cmd) || (!need.all && need.tags.every(t => new RegExp(`--tags[= ]["']?[\\w,-]*\\b${esc(t)}\\b`).test(r.cmd))));
        // an audit that ran the whole self-test (--setup, --full) counts as that run, so setup runs the suite once
        // Lesson: setup ran the self-tests and then the audit, which ran them again, under load past the time limits.
        const viaAudit = r => /\baudit\.mjs\b[^\n]*--(setup|full)\b/.test(cmdHead(r.cmd)) && /hook self-tests\s+\((selfcheck: (ALL PASS|FAIL)|passed earlier)|FAIL\s+\d+\. hook self-tests/.test(r.out || '');
        const tests = x.runs.filter(r => !neverRan(r) && ((runsScript(r.cmd, 'selfcheck.mjs') && covers(r)) || viaAudit(r)));
        // A whole run that passed after the last change counts however it was started: the self-tests record their result
        // (tools/hooks/state/selftest.json, with the hash of everything they test), so a pass inside "audit.mjs --setup"
        // whose output went to a file, or a background run, is seen. Lesson: setup's audit had just run and passed the
        // self-tests, and Stop still asked for them, because its output went into .cache/audit.txt.
        const wholePass = () => { try { const f = io.stateFile('selftest.json'), st = io.readJSON(f, {}); return st.passed === true && !!st.inputs && io.statSync(f).mtimeMs >= (x.since || 0) - 2000 && st.inputs === io.testInputsHash(); } catch { return false; } };
        // (or, for changed checks, a tagged run that recorded a pass covering them: see selftest-tags.json in selfcheck.mjs)
        const tagsPass = () => { if (need.all) return false; try { const st = io.readJSON(io.stateFile('selftest-tags.json'), {}); return st.passed === true && !!st.inputs && Date.parse(st.at) >= (x.since || 0) - 2000 && st.inputs === io.testInputsHash() && need.tags.every(t => (st.tags || []).includes(t)); } catch { return false; } };
        const passedSince = () => wholePass() || tagsPass();
        // (a whole pass covers the scenarios of any changed check too. Lesson, trial round 9: setup's audit ran the whole
        // suite with its output cut by grep, and Stop still asked for the changed checks' scenarios: a second run)
        // without a transcript, x.runs is the run log (the self-tests record themselves), so the same rule applies
        // (its last try refused outright: the honest line instead, the same as a project gate. See cantRun.)
        const tries = x.runs.filter(r => runsScript(r.cmd, 'selfcheck.mjs') && covers(r) && !engineNote(r.cmd));
        const refused = x.toolsKnown && !passedSince() && tries.length && refusedOutright(tries[tries.length - 1]);
        if (refused) { if (!saysNotRun(x.said, 'selfcheck')) { const s = cantRunStep('refused', how); miss.push({ tag: 'hooks-tested', msg: `${s.detail}.`, short: s.short }); } }
        else if (!tests.length) { if (!passedSince()) add('hooks-tested',`${need.all ? 'The hook logic changed' : `The checks ${need.tags.join(', ')} changed`}: run ${how} and fix any FAIL (fix the hook, not the test) before finishing.`); }
        else if (tests[tests.length - 1].out && !/ALL PASS|hook self-tests\s+\(passed earlier/.test(tests[tests.length - 1].out) && !passedSince())
          add('hooks-tested', `The last run of ${how} did not print ALL PASS. Fix the failures (the hook, not the test) and run it again.`);
      }
    }
    return miss;
  }
  return { CONFIG_TAGS, touchedChecks, hooksTestedGaps };
}
