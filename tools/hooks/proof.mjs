// The proof machinery, shared by both engines: whether a new check was shown failing on what the user complained about
// and passing on good samples (check-proven), and whether an answer that says a miss can't come back, or that something
// is enforced automatically, has a covering check behind it (claim-checked). Moved here from hooks.mjs unchanged; the
// project's files, globs and requirements come in through io, so engine v2 runs it with its own root.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { claimSentences } from './claims.mjs';
import { esc } from './settings.mjs';

// io: { ROOT, read(abs), abs(rel), exists(rel), rel(p), match(p, globs), bornThisTurn(file, since), loadRequirements(),
// namedPaths(text), LEARNED_NONE, NOT_A_SOURCE, NOTES_FILE } (the regexes may be getters: read when used)
import { cmdHead, shellParts } from './shell.mjs';
export function makeProof(io) {
  const { read, abs, exists, rel, match, bornThisTurn, loadRequirements, namedPaths } = io;
  // REQ: claim-checked. Promises that a miss can't come back, and claims that a lesson was sent to the starter's makers.
  // (Spanish too: "para que no vuelva a pasar". Lesson (the old suite under v2): the Spanish promise went unchecked)
  const NEVER_AGAIN = /\b(can(?:no|')?t|cannot|won'?t|will not|will never|doesn'?t|does not)\s+(happen|recur|come back|slip (?:through|by|past)|repeat)\b[^.\n]{0,25}\bagain\b|\bnow enforces (this|it)\b|\benforces (this|it) on its own\b|\b(stops?|prevents?|blocks?) (this|it|that) from (ever )?(happening|recurring|coming back)\b|\bno (vuelva|volver[aá]) a (pasar|ocurrir|suceder|repetirse)|\bya no (puede|podr[aá]) (volver a )?(pasar|ocurrir)/i;
  // REQ: claim-checked (enforced). "This is checked automatically", "an unlinked note can't get through", "it is
  // enforced" (Spanish too) is a claim about a check: one that runs on its own (not only when a skill or runbook is used)
  // and whose scope holds the files the claim is about, shown failing on the case this turn.
  // Lesson: an answer told the user their rule was already checked automatically, so an unlinked new note "can't get
  // through". The note check never looked at the vault's own folders, and the vault check ran only with its skill.
  const ENFORCED = /\b(is|are|gets?|will be|now) (already )?(checked|enforced|blocked|caught|validated|rejected) (automatically|on (its|their) own|by (a|the|its) (hook|check)s?)\b|\b(checked|enforced|caught|blocked|rejected) automatically\b|\bautomatically (checked|enforced|caught|blocked|rejected)\b|\b(can(no|')?t|cannot|won'?t|will not) (get|slip|go) (through|past|by)\b|\b(is|are) (already )?enforced\b|\bthe (hooks?|checks?) (already )?(enforces?|blocks?|catch(es)?) (this|it|that|them)\b|(?<!\p{L})(se (comprueba|verifica|revisa|bloquea)n? (sol[oa]s?|autom[aá]ticamente)|ya no (puede|pueden|podr[aá]n?) (pasar|colarse)|no (puede|pueden|podr[aá]n?) (pasar|colarse)|(est[aá]|queda) (ya )?(garantizad|forzad|bloquead)[oa])(?!\p{L})/iu;
  // The answer's sentences that speak to the user: one per sentence or line, without the markers lines the checks read
  // ("Playbook:", "Skill:", "Worth it:", "Learned (...)", "Proven:", Spanish too) or HTML comments.
  function enforcedClaim(answer) {
    const all = new RegExp(ENFORCED.source, 'giu');
    return claimSentences(answer).find(s => ENFORCED.test(s) && !/\b(not|n'?t|never|no longer|if|unless|whether|would|could|might|how)\b|(?<!\p{L})(si|no|nunca)(?!\p{L})/iu.test(s.replace(all, ' '))) || '';
  }
  // The checks that run on their own when a file changes, with their file scope: the project's validators
  // (requirements.json entries that run something or match changed content, with no skill, runbook or prompt condition)
  // and the engine's note check (the knowledge folders, docs/notes, notes in docs/).
  function autoScopes(cfg) {
    const out = [{ tag: 'note-linked', globs: [...noteDirs(cfg).map(d => `${d}/**/*.md`), 'docs/notes/**/*.md', 'docs/*.md'], ignore: [] }];
    const manual = w => !!w && typeof w === 'object' && ['skillUsed', 'playbookUsed', 'playbookRouted', 'promptMatches', 'answerMatches'].some(k => w[k] != null);
    const globsOf = c => !c || typeof c !== 'object' ? [] : [...[].concat(c.filesChanged || []), ...[].concat(c.runEach?.files || [])];
    for (const q of loadRequirements().reqs) {
      if (!q || q.enabled === false || !q.when || manual(q.when)) continue;
      const req = q.require || {};
      if (!(req.runEach || req.toolPassed || q.when.changedContentMatches)) continue;
      const globs = [...globsOf(q.when), ...globsOf(req)];
      if (globs.length) out.push({ tag: q.tag, globs, ignore: [].concat(q.when.filesIgnore || []) });
    }
    return out;
  }
  // The note folders: the knowledge base and every folder in "knowledgeDirs" (a vault's own folders).
  const noteDirs = cfg => [...new Set(['docs/knowledge', ...[].concat(cfg.knowledgeDirs || [])].map(d => String(d).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')).filter(Boolean))];
  // What an enforcement claim lacks: the files it is about that no automatic check covers, and whether a run this turn
  // proved a covering check (its scenarios passing, or a "Proven: fails on <sample>" line with a run that failed).
  // The files a claim is about: the ones its sentence names, and in a complaint turn (wide) also the ones the answer
  // names and the turn changed. (A setup answer's "Rules, each checked automatically" is about the engine's guards, not
  // about every file setup wrote. Lesson: judged on all of them, it flagged a true list of guarded rules.)
  // (lines: false, engine v2, which reads no record lines: a failing run proves the check only when it is a run of a
  // covering check, its tag in the command or its output, never any failing command of the turn)
  function enforcementGaps(x, cfg, sentence, wide = true, { lines = true } = {}) {
    const scopes = autoScopes(cfg);
    const about = [...new Set(wide ? [...namedPaths(sentence), ...namedPaths(String(x.answer || '')), ...(x.changed || [])] : namedPaths(sentence))]
      .filter(p => exists(p) && !io.NOT_A_SOURCE.test(p) && !/^(docs\/(CHANGELOG|STATUS|DECISIONS|MENU|BRIEF|glossary)\.md|docs\/(plans|reviews|specs|releases)\/|\.cache\/|tools\/|\.githooks\/)/.test(p));
    const covering = scopes.filter(s => about.some(p => match(p, s.globs) && !match(p, s.ignore)));
    const uncovered = about.filter(p => !scopes.some(s => match(p, s.globs) && !match(p, s.ignore)));
    const tags = (covering.length ? covering : scopes).map(s => s.tag);
    const runs = x.runs || [];
    const scenariosPassed = runs.some(r => /selfcheck\.mjs/.test(r.cmd) && /ALL PASS/.test(r.out || '') && tags.some(t => new RegExp(`--tags[ =]["']?[\\w,-]*\\b${esc(t)}\\b`).test(r.cmd)));
    const proofLine = /^[^\n]*\b(proven|probad[oa])\s*:[^\n]*\b(fails? on|falla (con|en|sobre))\s+\S/im.test(`${x.answer || ''}\n${x.notes || ''}`);
    const failedRun = runs.some(r => !neverRan(r) && !/^\s*node\s+\S*hooks\.mjs["']?\s+(waive|why|last)\b/.test(cmdHead(r.cmd)) && (r.error || /\bFAIL(ED|S)?\b|\bnot ok\b/.test(r.out || '') || tags.some(t => String(r.out || '').includes(`[${t}]`))));
    const checkFailed = () => runs.some(r => !neverRan(r) && !/^\s*node\s+\S*hooks\.mjs["']?\s+(waive|why|last)\b/.test(cmdHead(r.cmd)) && (r.error || /\bFAIL(ED|S)?\b|\bnot ok\b/.test(r.out || ''))
      && tags.some(t => String(r.cmd).includes(t) || String(r.out || '').includes(`[${t}]`)));
    return { sentence, about, uncovered, proven: scenariosPassed || (lines ? proofLine && failedRun : checkFailed()) };
  }
  // (REQ: check-sampled, the light version for every new blocking check, outside complaint and rule turns too, lives in
  // tools/audit.mjs: each check the project adds passes a realistic good sample in its own scenarios.)
  // REQ: check-proven. The project's own checks born this turn: a script named for checking, or a test file. Engine
  // files and scratch copies are not the project's checks.
  const CHECK_FILE = /(^|\/)[^/]*(check|guard|lint|valid|verif|enforce)[^/]*\.(mjs|cjs|js|ts|py|go|rs|rb|sh|ps1|cs|java|kt|php)$/i;
  // (a test is code: "x.spec.json" is data, like a picture's drawing spec. Lesson (a field report): drawing files named
  // that way were "new checks" to prove)
  const TEST_FILE = /(^|\/)(tests?|__tests__|spec)\/[^/]+\.(mjs|cjs|js|ts|py|go|rs|rb|cs|java|kt|php)$|[._-](test|spec)\.(mjs|cjs|js|jsx|ts|tsx|py|go|rs|rb|cs|java|kt|php|sh|ps1|dart|swift|exs?)$|(^|\/)test_[^/]+\.py$/i;
  const NOT_PROJECT_CHECK = /^(tools\/hooks\/|tools\/(audit|trial|fit|starter|skills|packs|recall|survey|dedupe|integrity-check|writing-check|new-project)\.mjs$|library\/|packs\/|\.cache\/)/;
  // A script that tools/hooks/requirements.json runs is a check whatever its name. Lesson: a check named in the user's
  // language ("revisar-idioma.mjs") was not seen as one, so only its test file was asked to be proven, and the failing
  // run of the script itself on the old page never counted.
  const SCRIPT_PATH = /(?:^|[\s"'`(=])((?:[\w.-]+\/)+[\w.-]+\.(?:mjs|cjs|js|ts|py|go|rs|rb|sh|ps1))\b/g;
  function requirementScripts() {
    const out = new Set();
    for (const m of read(abs('tools/hooks/requirements.json')).matchAll(SCRIPT_PATH)) out.add(m[1].replace(/^\.\//, ''));
    return out;
  }
  function newProjectChecks(x) {
    const registered = requirementScripts();
    return (x.changed || []).filter(p => (CHECK_FILE.test(p) || TEST_FILE.test(p) || registered.has(p)) && !NOT_PROJECT_CHECK.test(p) && exists(p) && bornThisTurn(p, x.since));
  }
  // The copies a command saves: { dest, srcs, git } for each cp / copy / Copy-Item part, and for each "git show
  // <rev>:<file> > <dest>" (git: the copy came from git, so it holds an earlier version whenever it was made).
  const wordsOf = s => (String(s).match(/"[^"]*"|'[^']*'|\S+/g) || []).map(w => w.replace(/^["']|["']$/g, ''));
  const pathKey = s => rel(String(s || '').replace(/\\/g, '/')).replace(/\/+$/, '');
  function savedCopies(cmd) {
    const out = [];
    for (const part of shellParts(cmdHead(cmd)).parts) {
      const w = wordsOf(part.replace(/^\(\s*/, ''));
      const verb = (w[0] || '').toLowerCase();
      if (/^(cp|copy|copy-item|cpi)$/.test(verb)) {
        let dest = null; const args = [];
        for (let i = 1; i < w.length; i++) {
          if (/^-destination$/i.test(w[i])) { dest = w[++i]; continue; }
          if (/^-(literal)?path$/i.test(w[i])) { args.push(w[++i]); continue; }
          if (/^-/.test(w[i]) || /^\/[a-z]$/i.test(w[i])) continue;
          args.push(w[i]);
        }
        if (!dest) dest = args.pop();
        if (dest && args.length) out.push({ dest, srcs: args, git: false });
      } else if (verb === 'git' && /\b(show|cat-file)\b/.test(part)) {
        const dest = /(?:^|\s)>\s*("[^"]+"|'[^']+'|[^\s;&|]+)/.exec(part)?.[1];
        if (dest) out.push({ dest: dest.replace(/^["']|["']$/g, ''), srcs: [], git: true });
      }
    }
    return out;
  }
  // Lines the turn's edits took out of a file that was already there: the text the user complained about.
  function removedLines(entries, fixes) {
    const out = new Set();
    for (const r of entries || []) {
      const c = r.type === 'assistant' && r.message?.content;
      if (!Array.isArray(c)) continue;
      for (const u of c) {
        if (u?.type !== 'tool_use' || !/^(Edit|MultiEdit)$/.test(u.name) || !fixes.has(rel(u.input?.file_path || ''))) continue;
        for (const e of u.input.edits || [u.input]) {
          const keep = String(e?.new_string || '');
          for (const l of String(e?.old_string || '').split('\n').map(s => s.trim())) if (l.length >= 12 && !keep.includes(l)) out.add(l);
        }
      }
    }
    return [...out];
  }
  // The files git's last commit holds (none without git or a commit).
  function headFiles() {
    if (!exists('.git')) return [];
    try { return (spawnSync('git', ['ls-tree', '-r', '-z', '--name-only', 'HEAD'], { cwd: io.ROOT, encoding: 'utf8', timeout: 5000 }).stdout || '').split('\0').filter(Boolean); } catch { return []; }
  }
  // The paths a run of a check names after the check itself ("node tools/x.mjs a.md drafts/*.md" -> a.md, drafts/*.md).
  // None: it ran on its own default scope (its whole folder, the built site, npm test).
  const argPaths = (cmd, stems) => {
    const w = wordsOf(cmdHead(String(cmd || '')));
    const i = w.findIndex(t => stems.some(s => t.includes(s)));
    return (i < 0 ? [] : w.slice(i + 1)).filter(t => !/^-/.test(t) && !/^(&&|\|\||;|\||>|2>&1)$/.test(t) && /[\\/*]|\.\w{1,6}$/.test(t)).map(pathKey);
  };
  // A run covers a file when it ran on its whole default scope, named the file, or named its folder or a glob matching it.
  const runCovers = (r, p, stems) => {
    const a = argPaths(r.cmd, stems);
    if (!a.length) return true;
    return a.some(t => { const k = t.replace(/\/\*\*?(\/\*[^/]*)?$/, '').replace(/\/$/, ''); return p === k || p.startsWith(k + '/') || (/\*/.test(t) && match(p, [t])); });
  };
  // REQ: check-proven (every governed file). The files a new blocking check governs, as git's last commit has them: what
  // tools/hooks/requirements.json runs it on (the file globs of each entry that names it), or, when its entry names no
  // files, the folders and file types it was run on. null when nothing in requirements.json runs it: not a blocking check.
  // Lesson: two hand-picked good samples were not enough. A Spanish-only check flagged "total", "error" and "menu", and a
  // tenant-tone check blocked any letter to a flat in a building named "... Court"; both had passed 2 good samples.
  function governedFiles(check, runs, stems) {
    const reqs = loadRequirements().reqs.filter(q => q && q.enabled !== false && JSON.stringify(q).includes(check));
    if (!reqs.length) return null;
    const globsOf = c => !c || typeof c !== 'object' ? [] : [...[].concat(c.filesChanged || []), ...[].concat(c.runEach?.files || []), ...(c.anyOf || []).flatMap(globsOf)];
    const ignoreOf = c => !c || typeof c !== 'object' ? [] : [...[].concat(c.filesIgnore || []), ...(c.anyOf || []).flatMap(ignoreOf)];
    let globs = reqs.flatMap(q => [...globsOf(q.when), ...globsOf(q.require)]);
    const ignore = reqs.flatMap(q => [...ignoreOf(q.when), ...ignoreOf(q.require)]);
    const listed = headFiles();
    if (!globs.length) globs = [...new Set(runs.flatMap(r => argPaths(r.cmd, stems)).filter(p => listed.includes(p))
      .map(p => `${p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : ''}*${path.extname(p)}`))];
    if (!globs.length) return [];
    return listed.filter(p => match(p, globs) && !match(p, ignore) && p !== check && !NOT_PROJECT_CHECK.test(p));
  }
  // Whether a new check was proven: the answer's "Proven: fails on <bad>; passes on <good>, <good>" line (Spanish
  // "Probado: falla con ...; pasa con ..."), a run of the check that failed on the complained-about state (before the
  // turn changed any file that was already there, or after a command took the earlier version from git), and a run that
  // passed. Returns { checks, missing[] }: missing is empty when it is proven.
  // Lesson: checks written after a complaint passed the exact code complained about (tried only on made-up junk), or
  // failed ordinary words of the user's own language and legitimate letters (never run on a good sample).
  // The answer says the problem the user named is not in the project: "I couldn't find any English on the pages",
  // "No encontré texto en inglés".
  const NOT_FOUND = /\b(could ?n[o']t|could not|did ?n[o']t|did not|can'?t|cannot) (find|reproduce|see|spot)\b|\bnot reproduc\w*|\b(found|finds|shows?) (no|nothing|none)\b|\bnothing (was )?found\b|(?<!\p{L})(no (encontr[eé]|hall[eé]|vi|veo|aparece)|no (pude|he podido|logr[eé]) (encontrar|reproducir|ver|hallar)|no (hay|había) (ningún |ninguna )?rastro)(?!\p{L})/iu;
  // (lines: false, engine v2, which reads no record lines: proven by the runs alone, a failing run on the earlier state
  // and passing runs on every governed file, with no "Proven:" line asked for)
  function checkProof(x, { lines = true } = {}) {
    const checks = newProjectChecks(x);
    if (!checks.length) return { checks, missing: [] };
    const missing = [];
    // (the line may sit in the turn's notes file, or in a footer with other markers: "Proven: ... · Learned (...): ...")
    // Every "Proven:"/"Probado:" line counts, the notes first, and the most complete one is judged. A label whose text
    // sits in the list items under it ("- **Probado:**" then "  - **Falla** con ...") reads them as its text.
    // Lesson: a Spanish answer's own "**Probado:**" heading, with its text in sub-items, was read as an empty proof line
    // and hid the full "Proven:" line in the notes; check-proven blocked all 3 rounds of a proven check.
    const candidates = [];
    for (const src of [x.notes || '', x.answer || '']) {
      const ls = String(src).split(/\r?\n/);
      ls.forEach((l, i) => {
        const m = /^([ \t]*)[^\n]*?\b(proven|probad[oa])\b[*_]*\s*:([^\n]*)$/i.exec(l);
        if (!m) return;
        let text = m[3];
        if (text.replace(/[\s*_`]/g, '').length < 8) for (let j = i + 1; j < ls.length && /^\s+[-*+]\s|^\s{2,}\S/.test(ls[j]) && ls[j].search(/\S/) > m[1].length; j++) text += ' ' + ls[j].trim().replace(/^[-*+]\s+/, '');
        candidates.push(text.replace(/[*_`]+/g, '').split(/\s+·\s+(?=[\p{L} ()-]{2,30}:)/u)[0]);
      });
    }
    const lineProblems = line => {
      const out = [];
      const goods = (/\b(?:pass(?:es)? on|pasa (?:con|en|sobre))\s+([^\n]+)/i.exec(line)?.[1] || '').split(/\s*(?:[,;]|\band\b|\by\b)\s*/).filter(s => s.replace(/\W/g, '').length >= 3);
      if (!/\b(fails? on|falla (con|en|sobre))\s+\S/i.test(line)) out.push('the "Proven:" line does not name the complained-about sample it fails on');
      if (goods.length < 2) out.push('the "Proven:" line names fewer than 2 good samples it passes on');
      // An edge case made from the project's own words, where word lists misfire: a name or an address (a flat in "Rose
      // Court"), a heading or label ("Tiempo total"), a word the user's language shares with a banned list, quoted text.
      // Lesson: the edge cases agents tried were the skill's own examples, copied, so the project's real vocabulary never
      // met the check.
      if (!EDGE_CASE.test(line)) out.push('the "Proven:" line names no edge case made from this project\'s own words ("an edge case: <a real address, heading, product or person\'s name, a word the user\'s language shares with the flagged list, or quoted text>")');
      return out;
    };
    const judged = candidates.filter(c => c.trim()).map(c => ({ c, p: lineProblems(c) }));
    const best = judged.reduce((a, b) => (b.p.length < a.p.length ? b : a), judged[0] || { c: '', p: [] });
    const line = best.c;
    if (!lines) { /* no record lines in v2 */ } else if (!line.trim()) missing.push(`no "Proven: fails on <the complained-about sample>; passes on <good 1>, <good 2>, and an edge case: <...>" line (in ${io.NOTES_FILE} or the answer)`);
    else missing.push(...best.p);
    // a test file's name without its test affix ("idioma.test" -> "idioma") also names the script it tests
    const stems = [...new Set(checks.map(p => path.basename(p).replace(/\.[^.]+$/, '')).flatMap(s => [s, s.replace(/^test_|[._-](test|spec)$/i, '')]))].filter(s => s.length >= 4);
    const tests = checks.some(p => TEST_FILE.test(p));
    // (a "hooks.mjs prove" run is both runs at once: its check failed on git's version before the fix and passed after)
    const proved = (x.runs || []).filter(r => typeof r.cmd === 'string' && /hooks\.mjs["']?\s+prove\b/.test(r.cmd)).flatMap(r => {
      const inner = (wordsOf(r.cmd.slice(r.cmd.search(/\bprove\b/) + 5)).find(w => !w.startsWith('--')) || r.cmd);
      return [...(/^BEFORE THE FIX[^\n]*: FAIL\b/m.test(r.out || '') ? [{ cmd: inner, out: 'FAIL (before the fix)', error: true, before: true }] : []),
        ...(/^AFTER THE FIX: PASS\b/m.test(r.out || '') ? [{ cmd: inner, out: 'PASS', error: false }] : [])];
    });
    const runs = [...proved, ...(x.runs || []).filter(r => typeof r.cmd === 'string' && !/selfcheck\.mjs|hooks\.mjs/.test(r.cmd)
      && (stems.some(s => r.cmd.includes(s)) || (tests && /\b(test|tests|pytest|unittest|jest|vitest|mocha|rspec|phpunit)\b/i.test(r.cmd))))];
    // (a count of failures or an exit code the command printed fails it too, though its last command succeeded. Lesson (a
    // field report): "check > out.txt; echo exit $?" printed "exit 1" and "45 passed, 2 failed", and read as a pass)
    const failCount = /\b[1-9]\d* (failed|failing|failures?|errors?)\b|^exit(?: code)?:? *[1-9]\d*\s*$/im;
    const failed = r => r.error || /\b(FAIL(ED|S|URES?)?|not ok|MAL)\b|✖/.test(r.out || '') || failCount.test(r.out || '');
    const passed = r => (/\b(PASS(ED|ES)?|OK)\b|✔/.test(r.out || '') || (/\b\d+ passed\b/.test(r.out || '') && !failCount.test(r.out || ''))) || (!r.error && !failed(r));
    // the state the user complained about: nothing that was already there had been changed yet, or git gave the old version
    const fixes = new Set((x.changed || []).filter(p => !checks.includes(p) && !/^(docs\/|tools\/hooks\/|\.cache\/)|(^|\/)(AGENTS|CLAUDE|SKILL)\.md$/.test(p) && !bornThisTurn(p, x.since)));
    const all = x.runs || [];
    const gitOld = i => all.slice(0, i + 1).some(r => /\bgit\s+(show|stash|archive|worktree|checkout|restore)\b/.test(String(r.cmd)));
    // Saved copies of the earlier state: a copy made before the turn edited any file it fixes, a copy from git, a copy of
    // such a copy, and a sample file written with text the fix took out. A run that names one ran on the earlier state.
    // Lesson: agents saved the files with cp before the fix, ran the new check on that copy after the fix (FAIL) and on
    // the fixed file (PASS), and were still blocked until they waived the check, once with a false reason.
    const saved = [];
    const isSaved = p => saved.some(s => p === s || p.startsWith(s + '/'));
    const removed = removedLines(x.entries, fixes);
    for (const r of x.entries || []) {
      const c = r.type === 'assistant' && r.message?.content;
      if (Array.isArray(c)) for (const u of c) if (u?.type === 'tool_use' && u.name === 'Write' && removed.some(l => String(u.input?.content || '').includes(l))) saved.push(pathKey(u.input.file_path));
    }
    // (a sample made by a shell command (a redirect, tee, writeFileSync, Out-File) counts like one made with the Write
    // tool: a file new this turn, read as it is now. Lesson, trial round 16: a bad sample written with a shell command did
    // not count, and check-proven cleared only after the agent wrote the same file again with the Write tool)
    const shellWrote = p => (x.cmds || []).some(c => new RegExp(`(>{1,2}\\s*["']?(\\./)?${esc(p)}|\\btee\\b[^;&|\\n]*${esc(p)}|(writeFileSync|write_text|Out-File|Set-Content|Add-Content)\\b[^;&|\\n]*${esc(p)})`).test(c.replace(/\\/g, '/')));
    const shellSamples = (x.changed || []).filter(p => !checks.includes(p) && !fixes.has(p) && exists(p) && shellWrote(p) && bornThisTurn(p, x.since));
    for (const p of shellSamples) if (removed.some(l => read(abs(p)).includes(l))) saved.push(pathKey(p));
    const namesSaved = r => { for (const cp of savedCopies(r.cmd)) if (cp.git || !(r.editedBefore || []).some(p => fixes.has(p)) || cp.srcs.some(s => isSaved(pathKey(s)))) saved.push(pathKey(cp.dest));
      return wordsOf(cmdHead(r.cmd)).some(w => /[\\/.]/.test(w) && isSaved(pathKey(w))); };
    const oldRuns = new Set(all.filter(namesSaved));
    // The problem the user named is not in the project at all, and the answer says so: the earlier state can't fail, so a
    // sample of that problem written this turn stands for it. Lesson: a user said there was English on the Spanish blog;
    // the agent found none, proved its new check on a written English page (FAIL) and on real pages (PASS), and was
    // blocked twice and waived the check, because only copies of the earlier state counted.
    const notFound = NOT_FOUND.test(String(x.answer || ''));
    const written = new Set();
    if (notFound) for (const r of x.entries || []) { const c = r.type === 'assistant' && r.message?.content; if (Array.isArray(c)) for (const u of c) if (u?.type === 'tool_use' && u.name === 'Write' && u.input?.file_path) written.add(pathKey(u.input.file_path)); }
    if (notFound) for (const p of shellSamples) written.add(pathKey(p)); // (made by a command: see shellSamples)
    // (a folder of samples counts too, and so does a sample a command made in a scratch folder such as .cache/: a file
    // there new this turn. Lesson, trial round 17: an English page written by "node -e" into .cache/muestra-ingles/, and
    // the check run on that folder, read as "after the fix, not on a saved copy" for 3 rounds)
    const newOnDisk = p => { try { const st = fs.statSync(abs(p)); const born = f => { try { return fs.statSync(f).birthtimeMs > +x.since; } catch { return false; } };
      return st.isDirectory() ? fs.readdirSync(abs(p)).some(n => born(path.join(abs(p), n))) : born(abs(p)); } catch { return false; } };
    const sampleAt = p => !checks.includes(p) && !fixes.has(p) && (written.has(p) || [...written].some(s => s.startsWith(`${p}/`)) || (/^\.cache\/|sample|muestra|fixture|ejemplo|te?mp/i.test(p) && newOnDisk(p)));
    const onSample = r => notFound && wordsOf(cmdHead(r.cmd)).some(w => /[\\/.]/.test(w) && sampleAt(pathKey(w)));
    const onOld = r => !(r.editedBefore || []).some(p => fixes.has(p)) || gitOld(all.indexOf(r)) || oldRuns.has(r) || onSample(r);
    // A complaint the answer showed does not hold has no complained-about state: a failing run on a sample of what the
    // rule forbids proves the check then. Lesson: a check written for a rule kept after a disproved complaint was blocked
    // twice for a "failing run on the earlier state" that could not exist, and was waived.
    const disproved = complaintDisproved(`${x.answer || ''}\n${x.said || ''}`, x.answer || '');
    if (!runs.some(r => failed(r) && (onOld(r) || disproved))) missing.push('no run of the check failed on the state the user complained about');
    if (!runs.some(passed)) missing.push('no run of the check passed');
    // Every existing file a blocking check governs (from git's last commit), apart from the ones complained about, passes
    // it: a run on all of them, and the count in the "Proven:" line.
    const complained = new Set(runs.filter(r => failed(r) && onOld(r)).flatMap(r => argPaths(r.cmd, stems)));
    const scripts = checks.filter(p => !TEST_FILE.test(p));
    const need = [...new Set(scripts.flatMap(c => governedFiles(c, runs, stems) || []))].filter(p => !complained.has(p) && !fixes.has(p));
    const uncovered = need.filter(p => !runs.some(r => passed(r) && runCovers(r, p, stems)));
    if (uncovered.length) missing.push(`no passing run covers ${uncovered.length} of the ${need.length} existing file(s) it governs (${uncovered.slice(0, 4).join(', ')}${uncovered.length > 4 ? ', ...' : ''}): run it on all of them (the folder, a glob, or with no file to check its whole scope)`);
    else if (lines && need.length && line.trim() && !/\b(all|every|both|tod[oa]s|ambos|ambas|cada)\b[^;\n]{0,30}?\b\d+\b|\b\d+\s+(of|de)\s+\d+\b/i.test(line))
      missing.push(`the "Proven:" line does not say it passes on all ${need.length} existing file(s) it governs ("passes on all ${need.length} existing ...")`);
    // what was seen, so the message says what counted and what did not (and the agent need not guess a waiver reason)
    // (without a leading "cd <project> &&", which filled the 70 characters. Lesson: every run read only as "cd" and the start of the project's path)
    const shown = c => shellParts(cmdHead(c)).parts.filter(p => !/^\(?\s*(cd|Set-Location|pushd)\s/i.test(p)).join(' ; ') || cmdHead(c);
    const seen = runs.slice(-4).map(r => `"${shown(r.cmd).replace(/\s+/g, ' ').slice(0, 70)}" ${failed(r) ? (onOld(r) ? (onSample(r) ? 'FAIL on a sample of the problem' : 'FAIL on the earlier state') : 'FAIL, but after the fix and not on a saved copy') : 'PASS'}`);
    // The line to write, filled in with the runs the engine saw, so the next round can meet it by copying it: only the
    // edge case is left to the agent when its own line had none. Lesson: a check proven in every way was blocked for 3
    // rounds by a message that said only which part of a fixed line was missing.
    const argsOf = rs => [...new Set(rs.flatMap(r => { const a = argPaths(r.cmd, stems); return a.length ? a : ['its whole default scope']; }))].slice(0, 4);
    const bad = argsOf(runs.filter(r => failed(r) && (onOld(r) || disproved)));
    const good = argsOf(runs.filter(r => passed(r) && !failed(r))).filter(p => !bad.includes(p));
    const edge = /\b(?:edge[- ]cases?|casos? l[ií]mite)\s*:?\s*([^;\n]+)/i.exec(line)?.[1]?.trim();
    const example = `Proven: fails on ${bad.join(', ') || '<the complained-about sample>'}; passes on ${need.length ? `all ${need.length} existing files it governs, ` : ''}` +
      `${good.length ? good.join(', ') : '<good 1>, <good 2>'}${good.length + (need.length ? 1 : 0) < 2 ? ', <one more realistic good sample>' : ''}, and an edge case: ${edge || '<this project\'s own words it holds: a real name, heading or label, or a word shared with the flagged list>'}`;
    return { checks, missing, seen, stems, need, example };
  }
  const EDGE_CASE = /\bedge[- ]cases?\b|\bcasos? (l[ií]mite|extremo|borde|dif[ií]cil)\b|\btricky\b/i;
  // The answer showed the complaint does not hold ("Checked: ... - the complaint doesn't hold: ...", or "didn't hold",
  // the form the hook's own messages suggest for the "Learned (none)" line).
  const COMPLAINT_DOESNT_HOLD = /\b(the )?complaint(:\s*|\s+)(does|did|has)(n'?t| not) hold\b|\bthat (isn'?t|is not|wasn'?t|was not) what happened\b|\bthat'?s not what happened\b/i;
  // The same verdict in the agent's own words: what it looked at was not wrong ("none of them makes him left-handed",
  // "nothing was missing", "the README already documents it", "I checked ... and found no ...", "no encontré ...").
  const NOT_WRONG = /\bnone of (them|these|those|the \w+)\b[^.\n]{0,80}\b(says?|shows?|makes?|has|have|is|are|uses?|contains?|gives?|calls?|mentions?)\b|\b(no|not a single|not one) (file|line|page|chapter|note|place|commit|row|entry)s?\b[^.\n]{0,40}\b(was|is|were|are)\s+(wrong|missing|broken|incorrect)\b|\bnothing (was|is|had been) (wrong|missing|broken|left out|incorrect)\b|\b(already|still) (says|documents|lists|has|shows|covers|there|in place|correct)\b|(?<!\p{L})(ning[uú]n[oa]? (archivo|fichero|cap[ií]tulo|p[aá]gina|nota|l[ií]nea)\b[^.\n]{0,60}\b(dice|muestra|tiene|usa)|nada (faltaba|estaba mal)|ya (lo )?(dice|documenta|recoge|incluye))(?!\p{L})/iu;
  // A disproved complaint: the fixed phrase, or a "Learned (none): ..." line (in the answer or the turn notes) next to a
  // verdict in plain words, as long as the answer does not concede the whole complaint. Lesson: two agents that had
  // checked a false complaint properly were made to paste "the complaint doesn't hold:" into three bullets of the reply
  // to an upset author, because their notes said "didn't hold" and their answers said it in their own words.
  function complaintDisproved(said, answer = said) {
    if (COMPLAINT_DOESNT_HOLD.test(said)) return true;
    if (!io.LEARNED_NONE.test(said)) return false;
    if (/\b(you'?re right|you are right)\b/i.test(answer) && !/\b(partly|partially|in part)\b/i.test(answer)) return false;
    return NOT_FOUND.test(said) || NOT_WRONG.test(said);
  }
  // A command the agent's tool refused before it started (a permission prompt, a hook's denial) never ran: it is no run of
  // any gate, passing or failing. Lesson: a refused command whose inline script only mentioned "audit.mjs --setup" was
  // taken as the last audit run, so Stop asked for the audit that had just passed.
  // (the tool's own refusals of a line it can't check count too. Lesson: "go version" refused as "malformed syntax ...
  // the command line is too long" read as a run that failed)
  const NEVER_RAN = /^\s*(PreToolUse:\w+ hook (error|denied)|This (Bash |PowerShell )?command (contains multiple operations|requires approval)|Commands? that [^\n]{0,80}require[s]? (explicit )?approval|Permission to use \w+ (has been )?denied|The user doesn'?t want to (proceed|take this action)|Claude requested permissions|Command contains malformed syntax that cannot be parsed|A variable in this command can'?t be checked before it runs|Contains [^\n]{0,60}\(expansion obfuscation\)|cd in '[^'\n]*' was blocked)/i;
  const neverRan = run => !!run && !!run.error && NEVER_RAN.test(String(run.out || ''));
  return { NEVER_AGAIN, ENFORCED, enforcedClaim, autoScopes, noteDirs, enforcementGaps, CHECK_FILE, TEST_FILE, NOT_PROJECT_CHECK, SCRIPT_PATH, requirementScripts, newProjectChecks, wordsOf, pathKey, savedCopies, removedLines, headFiles, argPaths, runCovers, governedFiles, NOT_FOUND, checkProof, EDGE_CASE, COMPLAINT_DOESNT_HOLD, NOT_WRONG, complaintDisproved, cmdHead, NEVER_RAN, neverRan, shellParts };
}
