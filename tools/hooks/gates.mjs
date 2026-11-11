// The gate judgment, shared by both engines: whether a configured gate (tests, build, lint, a project's own check)
// ran this turn and passed by its own result, or can't run here (refused outright, or its program missing) and the answer
// says so honestly. Moved here from hooks.mjs unchanged; the project's root and the shell helpers come in through io.
// io: { ROOT, rel(p), re(src, flags), esc(s), shellParts(cmd), cmdHead(cmd), neverRan(run), refusedOutright(run),
// MISSING_TOOL, envOf(name) }
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export function makeGates(io) {
  const { rel, re, esc, shellParts, cmdHead, neverRan, refusedOutright, MISSING_TOOL, envOf } = io;
  // What a command runs: its head without the text it only prints or appends (echo, printf). Lesson (a field report): an
  // echo naming a tool, appended to the notes file, was taken for the last run of that tool.
  const runPart = c => cmdHead(c).replace(/(^|[;&|(\n]\s*)(echo|printf|Write-Output|Write-Host)\b("[^"\n]*"|'[^'\n]*'|[^;&|\n])*/gi, '$1');
  // A gate that can't run here: its last attempt was refused outright, or its tool is missing (the program itself, or a
  // dependency whose install this turn was refused or failed). Returns '' (it can run), 'refused' or 'missing'.
  // Lesson: Go's commands and pytest's install needed an approval nobody could give; Stop asked three rounds in a row to
  // run the tests, the agent retried the refused command each time, and each turn showed the same answer three times.
  const NO_PROGRAM = /is not recognized as (an internal|the name)|command not found|: not found\b|executable file not found/i;
  const INSTALL_CMD = /\b(pip3?|python3?(\.exe)?\s+-m\s+pip|uv\s+pip|uv)\s+(install|sync)\b|\b(npm|pnpm|yarn)\s+(ci|install|i|add)\b|\b(poetry|bundle|composer)\s+install\b|\bgo\s+(mod\s+download|install|get)\b|\bcargo\s+(fetch|install)\b|\b(winget|choco|brew|apt(-get)?)\s+install\b/i;
  // The program a command starts ("go" in "go vet ./...", "npm" in "npm run build"; a path's last part).
  // A general interpreter's script says nothing about another script ("python -m pytest" refused is no refusal of
  // "python tools/check.py"), so it has no program here, except a module it runs ("pytest" in ".venv/Scripts/python -m
  // pytest -q").
  const INTERPRETER = /^(python\d*(\.\d+)?|py|node|bash|sh|pwsh|powershell|cmd)$/;
  const programOf = cmd => {
    const w = (shellParts(cmdHead(cmd)).parts.find(p => !/^\(?\s*(cd|Set-Location|pushd)\s/i.test(p)) || '').trim().split(/\s+/).map(s => s.replace(/^["'(]+|["']+$/g, ''));
    const p = (w[0] || '').split(/[\\/]/).pop().replace(/\.exe$/i, '').toLowerCase();
    return INTERPRETER.test(p) ? (w[1] === '-m' && /^[\w.-]+$/.test(w[2] || '') ? w[2].toLowerCase() : '') : p;
  };
  // A command that starts a program from inside another one (a node, python or shell one-liner), naming a program the
  // permission system held this turn ('' if none). (REQ: permission-respected)
  const RUNS_INSIDE = /\b(spawn|spawnSync|exec|execSync|execFile|execFileSync|child_process|subprocess|Popen|os\.system|Start-Process|Invoke-Expression|iex)\b|\b(bash|sh|cmd(\.exe)?|pwsh|powershell)(\.exe)?\s+(-c|\/c|-Command)\b/i;
  function heldSidestep(cmd, runs) {
    if (!RUNS_INSIDE.test(String(cmd))) return '';
    const held = [...new Set((typeof runs === 'function' ? runs() : runs).filter(refusedOutright).map(r => programOf(r.cmd)).filter(Boolean))];
    return held.find(p => new RegExp(`(^|["'\`\\s(\\[,=/\\\\])${esc(p)}(\\.exe)?(["'\`\\s,\\])]|$)`, 'i').test(String(cmd).replace(/^\s*\S+/, ''))) || '';
  }
  function cantRun(attempts, allRuns = [], gateCmd = '') {
    const last = attempts[attempts.length - 1];
    // never tried, but its program was refused outright or missing this turn, and never ran: "go build" after "go test"
    // was refused, or the gate's own form after "python -m pytest" found no pytest and its install was refused
    if (!last) {
      // (a line refused for its form says nothing about the program)
      const prog = programOf(gateCmd), same = prog ? allRuns.filter(r => programOf(r.cmd) === prog && (!neverRan(r) || refusedOutright(r))) : [];
      if (same.length && gateCmd) return cantRun(same, allRuns);
      // its program (the command's own first word, not a module run by an interpreter) is not on this machine at all: no
      // attempt is needed to know it can't run. Lesson (trial round 12): later turns ran "go test" again and again, each
      // refused, to show a tool everyone already knew was missing.
      const head = cmdHead(gateCmd).trim().split(/\s+/)[0]?.replace(/^["']|["']$/g, '').split(/[\\/]/).pop().replace(/\.exe$/i, '').toLowerCase();
      return prog && head === prog && onPath(prog) === false ? 'missing' : '';
    }
    if (refusedOutright(last)) return 'refused';
    if (neverRan(last)) return '';
    const out = String(last.out || '');
    if (!MISSING_TOOL.test(out)) return '';
    if (NO_PROGRAM.test(out)) return 'missing';
    return allRuns.some(r => INSTALL_CMD.test(cmdHead(r.cmd)) && (refusedOutright(r) || (r.error && !neverRan(r)))) ? 'missing' : '';
  }
  // The answer says honestly that this did not run: a "NOT VERIFIED: <what> - <why>" line, or a sentence that names the
  // tests, build or command and says it did not run.
  const NOT_RUN_SAID = /\b(not (been |yet )?(run|ran|compiled|built|tested|verified|checked)|n'?t (been )?(run|ran|compiled|built|tested)|nothing (has been |was |got )?(run|compiled|built|tested)|never (ran|run|compiled|built)|none (of (them|the \w+) )?(has|have) (been )?(run|ran)|could ?n[o']t (run|be run)|can'?t (run|be run)|requires? (an )?approval|needs? (your |an )?approval|wait(s|ed|ing)? for (an |your )?approval|(is|are)n'?t installed|not installed)\b/i;
  function saysNotRun(text, cmd = '') {
    const t = String(text || '');
    // ("Not done: <what> - <why>", the plain form rule 7 gives, counts as the honest line too. Oversight, 2026-11-09)
    if (/\bnot verified\b|\bunverified\b|^\W*not done\s*:/im.test(t)) return true;
    // (the program: "pytest" in ".venv/Scripts/python -m pytest -q", "go" in "go test ./...", "audit" in "node tools/audit.mjs")
    const prog = String(cmd).split(/\s+/).filter(w => !/^-/.test(w)).map(w => w.replace(/^["']|["']$/g, '').split(/[\\/]/).pop().replace(/\.(exe|cmd|bat|ps1|mjs|cjs|js|py)$/i, ''))
      .find(w => /^[A-Za-z][\w-]*$/.test(w) && !/^(python3?|py|node|npx|bash|sh|cmd|pwsh|uv|run)$/i.test(w)) || '';
    const what = new RegExp(`\\b(tests?|build|compil\\w*|lint\\w*|vet|type ?check\\w*|audit|self-?tests?|checks?|code${prog ? `|${esc(prog)}` : ''})\\b`, 'i');
    return t.split(/(?<=[.!?\n])\s+/).some(s => what.test(s) && NOT_RUN_SAID.test(s));
  }
  // What a gate that can't run asks for instead: one honest line, in round 1, never the same refused command again.
  // A refused command's program may not be installed at all: then the honest reason is "not installed", not "needs your
  // approval", which would send the user to approve a command that can only fail.
  // Lesson: every answer of a Go project said the Go commands only needed the user's approval; Go was not installed.
  function cantRunStep(kind, cmd) {
    const prog = missingProgram(cmd);
    const why = kind === 'refused' && prog ? `\`${prog}\` is not installed on this machine (not found on PATH), so \`${cmd}\` can't run here; the permission system refused it too`
      : kind === 'refused' ? `the permission system refused \`${cmd}\` this turn (\`${programOf(cmd) || String(cmd).split(/\s+/)[0]}\` is installed; the command needs an approval nobody can give here)`
      : prog ? `\`${prog}\` is not installed on this machine (not found on PATH), so \`${cmd}\` can't run here`
      : `\`${cmd}\` can't run here: its tool or a dependency is not installed, and installing it was refused or failed`;
    return { detail: `${why}. Don't run it again this turn. Say so once in the answer instead: "NOT VERIFIED: <what did not run> - <why it couldn't run>"${prog ? ` with the true reason: ${prog} is not installed (not "it needs your approval")` : ''}, and claim nothing it would have shown`,
      short: `Say what was NOT VERIFIED and why: ${String(cmd).slice(0, 28)} ${prog ? `(${prog} is not installed)` : kind === 'refused' ? 'was refused' : 'can\'t run here'}` };
  }
  // A command as a gate's pattern reads it: the project's own folder dropped from its paths, quotes around a single path
  // taken off and ".exe" cut, so "C:/.../proj/.venv/Scripts/python.exe" -m pytest is the gate ".venv/Scripts/python -m
  // pytest"; and an option's quoted value blanked, so a command that only names the gate (packs.mjs configure app --test
  // "<the gate>") is no run of it. (A shell's own -c / -Command / /c text is the command it runs, and stays.)
  // Lesson: in a Flask setup the configure command was read as the last test run, and the refused real run, written
  // with the full path to python.exe, was not read as a run at all, so the refused gate was asked for 3 rounds.
  // Inline script code that only holds a command as text runs nothing: "node -e" writing a doc that says "npm test", on
  // one line or several. Code that starts a process (execSync, spawn, subprocess, system) is kept. Lesson, trial rounds 14
  // and 15: such scripts counted as test and summary runs, so gates were wrongly met or asked for the real run again.
  const inlineCodeOut = c => String(c || '').replace(/(\b(?:node|deno|bun)(?:\.exe)?\s+(?:-e|--eval|-p|--print)|\b(?:python3?|py)(?:\.exe)?\s+-c)\s+("(?:[^"\\]|\\.)*"|'[^']*')/gi,
    (m, head, code) => /\b(execSync|execFileSync|spawnSync|spawn|exec|execFile|fork|subprocess|os\.system|system|Popen)\s*\(/.test(code) ? m : `${head} ""`);
  function gateText(cmd) {
    const root = io.ROOT.replace(/\\/g, '/').replace(/\/+$/, '');
    let s = inlineCodeOut(cmdHead(cmd)).replace(/"([^"\s]*)"|'([^'\s]*)'/g, (m, a, b) => a ?? b);
    s = s.replace(/[^\s"']+/g, w => { const f = w.replace(/\\/g, '/'); return f.toLowerCase().startsWith(root.toLowerCase() + '/') ? f.slice(root.length + 1) : w; });
    s = s.replace(/(\w)\.exe\b/gi, '$1');
    // a package manager pointed at this project's own folder is the plain command ("npm --prefix <project> test" is
    // "npm test"). Lesson (trial round 11): Stop asked again for tests and a build that had passed that way.
    const here = d => { const p = String(d || '').replace(/^["']|["']$/g, '').replace(/\\/g, '/').replace(/\/+$/, ''); return !p || p === '.' || p.toLowerCase() === root.toLowerCase(); };
    s = s.replace(/\b(npm|pnpm|yarn)(\s+)(?:--prefix[= ]|-C\s+|--cwd[= ]|--dir[= ])("[^"]*"|'[^']*'|\S+)\s+/gi, (m, pm, sp, d) => here(d) ? `${pm}${sp}` : m);
    return s.replace(/(\s--?(?!c\b|lc\b|command\b)[A-Za-z][\w-]*(?:=|\s+))("[^"\n]*\s[^"\n]*"|'[^'\n]*\s[^'\n]*')/gi, (m, flag) => `${flag}""`);
  }
  // Whether a program is on this machine: a scan of PATH (with PATHEXT on Windows, and Git's own tool folders next to
  // git.exe). true, false, or null when it can't be told (no plain program name).
  function onPath(prog) {
    if (!/^[\w.+-]+$/.test(String(prog || ''))) return null;
    const win = process.platform === 'win32';
    const exts = win ? ['', ...String(process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean).map(e => e.toLowerCase())] : [''];
    const dirs = String(process.env.PATH || '').split(path.delimiter).filter(Boolean);
    const has = d => exts.some(e => { try { return fs.statSync(path.join(d, prog + e)).isFile(); } catch { return false; } });
    if (dirs.some(has)) return true;
    if (win) for (const d of dirs) if (['git.exe', 'git.cmd'].some(g => { try { return fs.statSync(path.join(d, g)).isFile(); } catch { return false; } })) {
      const top = path.resolve(d, '..');
      if ([path.join(top, 'usr', 'bin'), path.join(top, 'mingw64', 'bin'), path.join(top, 'bin')].some(has)) return true;
    }
    return false;
  }
  // The program of a command that is not installed here ('' when it is, or can't be told).
  // Only a bare program name is looked up: a path ("./.venv/Scripts/python") or a module run by an interpreter
  // ("python -m pytest", installed inside the interpreter) is not on PATH by design.
  function missingProgram(cmd) {
    const w = (shellParts(cmdHead(cmd)).parts.find(p => !/^\(?\s*(cd|Set-Location|pushd)\s/i.test(p)) || '').trim().split(/\s+/)[0] || '';
    const prog = w.replace(/^["'(&]+|["']+$/g, '').replace(/\.exe$/i, '');
    if (!prog || /[\\/]/.test(prog) || INTERPRETER.test(prog.toLowerCase())) return '';
    return onPath(prog) === false ? prog : '';
  }
  // The answer gives approval as the reason a command didn't run, and never says its program is not installed.
  const APPROVAL_REASON = /\bapprov\w*|(?<!\p{L})aprob\w*|autoriz\w*|permiso(?!\p{L})/iu;
  const NOT_INSTALLED_SAID = /\b(not|isn'?t|aren'?t) installed\b|\bnot on (the |your )?path\b|\bno \w+ (toolchain|install\w*)\b|(?<!\p{L})no (est[aá]n?|viene) instalad\w*|sin instalar(?!\p{L})/iu;
  const blamesApproval = (answer, prog) => !!prog && APPROVAL_REASON.test(String(answer || '')) && !NOT_INSTALLED_SAID.test(String(answer || ''));
  // A command that only talks to the engine (a waiver, "why", "last"), with nothing else in it: no run of any project
  // check, whatever its text names. Lesson: a project check's command pattern matched a waiver's reason that named the
  // check's script, so the waiver became the check's "last run", which had no pass line.
  const engineNote = cmd => shellParts(cmdHead(cmd)).parts.every(p => /^\(?\s*(cd|Set-Location|pushd)\s/i.test(p) || /hooks\.mjs["']?\s+(waive|why|last|unwaive)\b/.test(p));
  // Whether one run of a gate passed, judged by the gate's own result. A pass pattern: its pass line in the output decides
  // (a later command in the same line can't fail it). No pass pattern (""): the exit code decides, but only when it is the
  // gate's own: the command ran alone, or in a chain of && that all succeeded. Lesson: "build && tests; echo" failed the
  // build gate because a later command failed.
  // A gate run whose output went into a file ("node tools/audit.mjs > .cache/audit.txt 2>&1") is judged by that file, when
  // it was written after the run started: the command's own output then holds only what the other commands printed.
  // Returns the run as the gate saw it ({ cmd: that part, out: the file }), or null. A relative file is read from the
  // folder the command changed into ("cd <dir> && ..."), else from the project.
  // Lesson: a background job ran the audit into a log file, and the audit gate read the job's own output ("sync: ...
  // current") as the audit's, so a passing audit could never count and a failing one was reported with the wrong lines.
  function redirectedRun(run, cmdRe, since = 0) {
    const { parts } = shellParts(run.cmd);
    let dir = io.ROOT;
    for (const p of parts) {
      const cd = /^\(?\s*(?:cd|Set-Location|pushd)\s+(?:\/d\s+)?("[^"]+"|'[^']+'|\S+)\s*$/i.exec(p);
      if (cd) { const d = cd[1].replace(/^["']|["']$/g, ''); dir = path.resolve(dir, /^\/[a-z]\//i.test(d) ? `${d[1]}:${d.slice(2)}` : d); continue; }
      if (!cmdRe.test(cmdHead(p))) continue;
      const m = /(?:^|\s)(?<![2&])1?>>?\s*("[^"]+"|'[^']+'|[^\s;&|)]+)/.exec(p);
      if (!m || /^&\d$/.test(m[1])) break; // (no file of its own: a group around it may have one)
      const f = path.resolve(dir, m[1].replace(/^["']|["']$/g, ''));
      try {
        const st = fs.statSync(f);
        if (st.mtimeMs < (since || 0) - 2000) return null;
        const t = fs.readFileSync(f, 'utf8');
        return { cmd: p.replace(/^\(\s*/, '').replace(m[0], ' ').trim(), out: t.length > 200000 ? t.slice(-200000) : t, error: false, file: rel(f) };
      } catch { return null; }
    }
    // (a gate of several commands run as one group, "(a && b) > out.txt", wrote its output to that file; a command of the
    // gate that sent its output to a file of its own was read above. Lesson (a field report): the group's file was never
    // read, and the build gate judged the tests printed after it. Lesson (this starter): "(selfcheck > sc.txt; ...) >
    // chain.txt" was judged on chain.txt, which never holds the self-test's pass line)
    for (const g of String(run.cmd).matchAll(/\(([^()]+)\)\s*1?>>?\s*("[^"]+"|'[^']+'|[^\s;&|)]+)/g)) {
      if (!cmdRe.test(gateText(g[1].trim())) || /^&\d$/.test(g[2])) continue;
      const before = String(run.cmd).slice(0, g.index), cd = [...before.matchAll(/(?:^|[;&|(]\s*)(?:cd|Set-Location|pushd)\s+(?:\/d\s+)?("[^"]+"|'[^']+'|[^\s;&|)]+)/gi)].pop();
      const d = cd ? cd[1].replace(/^["']|["']$/g, '') : '', base = d ? path.resolve(io.ROOT, /^\/[a-z]\//i.test(d) ? `${d[1]}:${d.slice(2)}` : d) : io.ROOT;
      try {
        const f = path.resolve(base, g[2].replace(/^["']|["']$/g, '')), st = fs.statSync(f);
        if (st.mtimeMs < (since || 0) - 2000) continue;
        const t = fs.readFileSync(f, 'utf8');
        return { cmd: g[1].trim(), out: t.length > 200000 ? t.slice(-200000) : t, error: false, file: rel(f) };
      } catch { }
    }
    return null;
  }
  function gateResult(run, spec = {}) {
    const pass = spec.pass ?? '\\bPASS', { parts, ops } = shellParts(run.cmd), alone = parts.length <= 1;
    if (pass) {
      const failRe = spec.fail ? re(spec.fail, 'm') : alone ? /\bFAIL\b/m : null;
      if (!re(pass, 'im').test(run.out)) return { ok: false, why: `its pass line /${pass}/ is not in the output` };
      if (failRe && failRe.test(run.out)) return { ok: false, why: 'the output reports a FAIL' };
      if (alone && run.error) return { ok: false, why: 'it exited with an error' };
      return { ok: true, why: '' };
    }
    if (alone) return run.error ? { ok: false, why: 'it exited with an error' } : { ok: true, why: '' };
    if (!run.error && ops.every(o => o === '&&')) return { ok: true, why: '' };
    // A gate inside a longer line has its own exit status where the line shows it: every part after it is joined by &&
    // and the line succeeded, or an "echo <text>" later in its && chain printed that text (it runs only if the gate
    // passed). Not after a || in its part of the line, which can skip the gate. Lesson: "tests | tail; compileall && echo
    // BUILD-OK; git status" printed BUILD-OK, and Stop still asked for the build to be run on its own.
    const i = spec.cmd ? parts.findIndex(p => re(spec.cmd, 'i').test(cmdHead(p))) : -1;
    if (i >= 0) {
      const start = ops.slice(0, i).reduce((s, o, k) => (o === ';' || o === '&' ? k + 1 : s), 0);
      if (!ops.slice(start, i).includes('||')) {
        if (!run.error && ops.slice(i).every(o => o === '&&') && ops.slice(start, i).every(o => o === '&&' || o === '|')) return { ok: true, why: '' };
        for (let k = i + 1; k < parts.length && ops[k - 1] === '&&'; k++) {
          const said = /^(?:echo|Write-Output|Write-Host|printf)\s+(?:-\w+\s+)*(["']?)([^"'\n]*?)\1\s*$/i.exec(parts[k])?.[2]?.trim() || '';
          if (said.length >= 3 && /[A-Za-z]/.test(said) && !/[$%`]/.test(said) && String(run.out || '').includes(said)) return { ok: true, why: '' };
        }
      }
    }
    return { ok: false, why: 'it ran with other commands after ; or |, or a command in its && chain failed, so its own result is unknown. Run the gate exactly as written, on its own (a gate that is an && chain stays one)' };
  }
  // The toolPassed requirement (c.toolPassed), judged on x, the old engine's turn record; r makes a regex of a pattern.
  // Returns false (it fails), true (it holds, and nothing after it is judged) or undefined (it holds: go on). Writes
  // x.detail, x.override and x.short for the message.
  function toolPassed(c, x, r) {
    if (c.toolPassed) {
      const spec = typeof c.toolPassed === 'string' ? { cmd: c.toolPassed } : c.toolPassed;
      // (quotes don't change which command ran: the configured form and the run are compared with and without them, since
      // gateText drops quotes around a word. Lesson (website trials): the gate 'node --test "tests/**/*.test.mjs"' never
      // matched its own passing runs, and 9 Stop rounds asked to run the tests)
      const exact = r(spec.cmd), bare = (() => { try { return r(String(spec.cmd).replace(/\\?["']/g, '')); } catch { return exact; } })();
      const cmdRe = { test: s => exact.test(s) || bare.test(String(s).replace(/["']/g, '')) };
      // (a command that only prints or appends text naming the tool runs nothing. Lesson (a field report): an echo of
      // "the tool's tests PASS" into the notes file was taken for the last run, the notes file for its output, and an old
      // FAIL line in it blocked a turn whose real run had passed)
      const ranIt = rn => cmdRe.test(gateText(runPart(rn.cmd)));
      const attempts = x.runs.filter(rn => cmdRe.test(gateText(rn.cmd)) && ranIt(rn) && !engineNote(rn.cmd));
      // (a run still going has no output yet: the check run from inside the same command ("audit | tail -1 && hooks.mjs
      // check") is judged on the last finished run. Lesson (efficiency trials): an audit that had printed "audit: PASS" was
      // reported as "pass line not in the output", and the whole audit ran again with nothing changed)
      const runs0 = attempts.filter(rn => !neverRan(rn)), done = runs0.filter(rn => !rn.pending), runs = done.length ? done : runs0;
      // no tool history (another agent, or no hooks): the run log holds what ran. With nothing logged, a quick validator
      // is run here (capped at 20 s); a slow one is left to the agent, with the command that records it.
      // A gate marked selfAuto (the project audit, seconds long) runs here itself when it is due and no run since the
      // last edit shows it: the agent spends no step on it, and no run is made twice. Lesson (a field report and the
      // efficiency trials): a one-line runbook fix made the agent run the audit, once twice in overlapping runs.
      const edits = (x.uses || []).filter(u => /^(Write|Edit|MultiEdit|NotebookEdit)$/.test(u.name)).length;
      const auto = !!(spec.selfAuto && spec.selfRun && x.toolsKnown && !envOf('BENCH') && !envOf('NO_SELF_AUDIT') && (!runs.length || (runs[runs.length - 1].editedBefore || []).length < edits));
      if ((!x.toolsKnown && !runs.length && spec.selfRun) || auto) {
        const res = spawnSync(spec.selfRun, { shell: true, cwd: io.ROOT, encoding: 'utf8', timeout: auto ? 120000 : 20000 });
        if (res.error?.code === 'ETIMEDOUT' || res.signal) { x.detail = `run it and let the hooks see the result: node tools/hooks/hooks.mjs run "${spec.selfRun}"`; return false; }
        runs.push({ cmd: spec.selfRun, out: (res.stdout || '') + (res.stderr || ''), error: res.status !== 0 });
      } else if (!x.toolsKnown && !runs.length) return true; // can't verify and can't re-run: don't block on missing evidence
      const lastRun = runs[runs.length - 1];
      // A gate that can't run here (refused outright, or its tool missing) asks once for an honest line instead, and
      // that line meets it, so no later round asks for the same refused command again (cantRun above).
      const lastTry = attempts[attempts.length - 1];
      const blocked = x.toolsKnown ? cantRun(lastTry && lastTry === lastRun ? [redirectedRun(lastRun, cmdRe, x.since) || lastRun] : attempts, x.runs, spec.selfRun || '') : '';
      // (the honest line gives the true reason: a program that is not installed is no matter of approval)
      const unverified = () => { const how = spec.selfRun || spec.cmd; if (saysNotRun(x.answer, how) && !blamesApproval(x.answer, missingProgram(how))) return true; const s = cantRunStep(blocked, how); x.override = s.detail; x.short = s.short; return false; };
      if (!lastRun) { if (blocked) return unverified(); const form = attempts.find(neverRan); x.detail = form ? `its only runs this turn were refused for their form ("${String(form.out).trim().slice(0, 90)}"): run it on its own, as one plain command` : `no run of /${spec.cmd}/ this turn`; return false; }
      // (its output sent into a file is read from that file: see redirectedRun)
      const last = (x.toolsKnown && redirectedRun(lastRun, cmdRe, x.since)) || lastRun;
      const g = gateResult(last, spec);
      if (!g.ok && blocked) return unverified();
      if (!g.ok) { x.detail =`last run did not pass, ${g.why}: ${last.out.trim().split(/\r?\n/).slice(-3).join(' | ').slice(0, 300)}` + (MISSING_TOOL.test(last.out) ? '. The tool or its dependencies are not installed: install them first (npm ci, pip install -r requirements.txt, or the project\'s setup command), then run it again. If the install is refused or fails, don\'t retry: say "NOT VERIFIED: <what did not run> - <why>" in the answer' : ''); return false; }
    }
  }
  return { runPart, NO_PROGRAM, INSTALL_CMD, INTERPRETER, programOf, RUNS_INSIDE, heldSidestep, cantRun, NOT_RUN_SAID, saysNotRun, cantRunStep, inlineCodeOut, gateText, onPath, missingProgram, APPROVAL_REASON, NOT_INSTALLED_SAID, blamesApproval, engineNote, redirectedRun, gateResult, toolPassed };
}
