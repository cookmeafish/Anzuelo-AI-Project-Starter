// REQ: instructions-run, shared by both engines: what the answer tells the user to run, double-click or open, when
// this turn made or changed it, ran here and worked, or the answer says it is not verified. Moved here from hooks.mjs
// unchanged, with the refusal test it uses and its Stop message.
// io: { shellParts, cmdHead, wordsOf, neverRan, esc }
export function makeLaunchers(io) {
  const { shellParts, cmdHead, wordsOf, neverRan, esc } = io;
  // REQ: instructions-run. What the answer tells the user to run, double-click or open, when this turn made or changed
  // it (a setup script, a launcher, an npm script, a make target): the turn ran it the way the user is told to and it
  // worked, or the answer names it in a "NOT VERIFIED: <what> - <why>" line. "powershell" starts Windows PowerShell 5.1,
  // so a run under pwsh is no run of a "powershell ..." instruction.
  // Lesson: an answer's first step was "powershell -ExecutionPolicy Bypass -File scripts\setup.ps1". The script was never
  // run; it used "Out-File -Encoding utf8NoBOM", which 5.1 rejects, so .env was never made and every later step failed.
  const RUN_WORDS = /\b(run|running|double[- ]?click|open|start|launch|execute|type|paste)\b|(?<!\p{L})(ejecut[aeo]\w*|corr[ae]|correr|haz doble ?clic|doble ?clic|abr[ae]|abrir|lanz[ae]|inici[ae]|escrib[ae]|pega)(?!\p{L})/iu;
  const LAUNCHER = /[\w.\\/~:-]*[\w-]\.(?:ps1|bat|cmd|sh|command|py|mjs|cjs|js|ts|rb|pl)\b/gi;
  const EXECUTOR = /^(powershell(\.exe)?|pwsh(\.exe)?|cmd(\.exe)?|bash|sh|zsh|node(\.exe)?|python\d*(\.\d+)?(\.exe)?|py|call|start|&|\.|source|ruby|perl|deno|bun|tsx|ts-node|-file|\/c|\/k|-c|-command)$/i;
  // (the verb is read outside code and file names: "start" in `start.bat` is no instruction; nor is a verb whose subject
  // is a thing, "modules both engines run", "the tests run", "which runs": that describes code. Lesson (this starter's
  // own answer): "shared modules both engines run: `proof.mjs`, `trace.mjs`" asked the user to run those files)
  const DESCRIBES_RUN = /\b(engines?|both|they|it|that|which|who|tests?|checks?|hooks?|modules?|code|scripts?|jobs?|servers?|tools?|everything|nothing)\s+(also\s+|now\s+|still\s+)?(runs?|running|starts?|opens?|launch(es)?|executes?)\b/gi;
  const runSaid = l => RUN_WORDS.test(String(l).replace(/`[^`\n]*`/g, ' ').replace(/[\w.\\/~:-]*[\w-]\.[A-Za-z]{1,8}\b/g, ' ').replace(DESCRIBES_RUN, ' '));
  // The launchers an answer tells the user to run that this turn created or changed: { id, base, npm, make, ps51, said }.
  function instructedLaunchers(answer, changed) {
    // (the whole answer: some put everything under "## Finished". A list of files, "Start and setup: `start.bat`,
    // `scripts/setup.ps1`", tells the user to run nothing)
    const fileList = l => { const rest = l.replace(/^[^`:\n]{0,40}:/, ''), spans = rest.match(/`[^`\n]+`/g) || [];
      return spans.length >= 2 && !runSaid(rest.replace(/\([^)\n]*\)/g, ' ')); };
    // (a list entry that names a file and then says what it is, "- `x.mjs`: how a test run is judged", tells the user to
    // run it only when a clause of the description starts with the verb: "- `start.bat`: double-click it". Lesson (the
    // starter's own work): "run" as a noun in a Finished entry for a changed engine file asked for that file to be run)
    const entry = l => /^\s*[-*+]\s+`[^`\n]+`\s*[:,-]\s*(.*)$/.exec(l)?.[1];
    const entryOnly = l => { const d = entry(l); if (d == null) return false;
      return !d.split(/[;:.,]\s*|\b(?:then|and|to|you|please|just)\s+/i).some(c => runSaid((/^\s*(dob\w+\s+\S+|\S+)/i.exec(c || '') || [])[1] || '')); };
    const body = String(answer || '').split(/\r?\n/).filter(l => !fileList(l) && !entryOnly(l)).join('\n');
    const ch = (changed || []).map(p => String(p).replace(/\\/g, '/'));
    const lower = ch.map(p => p.toLowerCase());
    const pkg = ch.some(p => /(^|\/)package\.json$/i.test(p)), mk = ch.some(p => /(^|\/)(GNU)?makefile$/i.test(p));
    const out = new Map();
    let fence = false, fenceRun = false, prev = '';
    for (const line of body.split(/\r?\n/)) {
      if (/^\s*```/.test(line)) { fence = !fence; fenceRun = fence && (runSaid(prev) || /:\s*$/.test(prev)); continue; }
      if (!fence && line.trim()) prev = line;
      // (only the sentence that says to run: "The check in `routes.py` refuses others. Accounts are staff unless you type
      // `--role owner`." asks to run nothing in routes.py. Lesson (trial v28): a changed file named beside it was flagged)
      const said = fence ? (fenceRun ? line : '') : line.split(/(?<=[.!?])\s+/).filter(s => runSaid(s)).join(' ');
      if (!said.trim()) continue;
      // the code span that holds it, when there is one: the exact command the user is told to type
      const spans = [...said.matchAll(/`([^`\n]+)`/g)].map(m => m[1]);
      const cmdOf = tok => spans.find(s => s.includes(tok)) || said.trim();
      for (const m of said.matchAll(LAUNCHER)) {
        const tok = m[0].replace(/\\/g, '/').replace(/^\.\//, '').replace(/^["'(]+/, '').toLowerCase();
        if (/^https?:|:\/\//.test(tok)) continue;
        const i = lower.findIndex(p => p === tok || p.endsWith('/' + tok) || (!tok.includes('/') && p.split('/').pop() === tok));
        if (i < 0) continue;
        const cmd = cmdOf(m[0]);
        out.set(ch[i], { id: ch[i], base: ch[i].split('/').pop(), ps51: /(^|[\s"'&])powershell(\.exe)?\b/i.test(cmd) && !/\bpwsh\b/i.test(cmd), said: cmd });
      }
      if (pkg) for (const m of said.matchAll(/\b(?:npm|pnpm|yarn)\s+(?:run(?:-script)?\s+)?([\w:.-]+)/gi)) {
        if (/^(install|i|ci|add|remove|uninstall|update|init|exec|x|create|-\S*)$/i.test(m[1])) continue;
        out.set(`npm:${m[1]}`, { id: `npm run ${m[1]}`, base: m[1], npm: m[1], said: cmdOf(m[0]) });
      }
      if (mk) for (const m of said.matchAll(/\bmake\s+([\w.-]+)/g)) out.set(`make:${m[1]}`, { id: `make ${m[1]}`, base: m[1], make: m[1], said: cmdOf(m[0]) });
    }
    return [...out.values()];
  }
  // A command that runs the launcher (not one that only reads, greps, lints or syntax-checks it). For a "powershell ..."
  // instruction, only a run under powershell (5.1) counts.
  function runsLauncher(cmd, t) {
    return shellParts(cmdHead(cmd)).parts.some(part => {
      if (t.npm) return new RegExp(`\\b(npm|pnpm|yarn)(\\.cmd)?\\s+(run(-script)?\\s+)?${esc(t.npm)}\\b`, 'i').test(part);
      if (t.make) return new RegExp(`\\bmake\\s+(-\\S+\\s+)*${esc(t.make)}\\b`).test(part);
      const w = wordsOf(part.replace(/^\(\s*/, ''));
      const i = w.findIndex(x => x.replace(/\\/g, '/').split('/').pop().toLowerCase() === t.base.toLowerCase());
      if (i < 0) return false;
      const before = w.slice(0, i);
      if (before.some(x => /^(--check|-n|--syntax-check|-NoExecute)$/i.test(x))) return false;
      if (t.ps51 && !before.some(x => /^powershell(\.exe)?$/i.test(x.split(/[\\/]/).pop()))) return false;
      // the word that starts it comes right before it, past flags and their values ("-ExecutionPolicy Bypass -File"):
      // a name inside a node -e script or an echo is no run. Lesson: a "node -e" edit of a file that named start.cmd
      // counted as running start.cmd.
      let j = i - 1;
      while (j >= 0 && (/^[-/]/.test(w[j]) || (j > 0 && /^-(ExecutionPolicy|ep|WindowStyle|Version)$/i.test(w[j - 1])))) j--;
      return j < 0 || EXECUTOR.test(w[j].split(/[\\/]/).pop());
    });
  }
  const LAUNCH_FAILED = /Cannot validate argument|is not recognized as|Traceback \(most recent call last\)|\bParserError\b|FullyQualifiedErrorId|\bnpm ERR!|^\s*Error:|^make: \*\*\*/m;
  const NOT_RUN_LINE = /\bnot verified\b|\bunverified\b|\b(not|n'?t|never) (been |yet )?(run|ran|tried|tested|executed|started|launched)\b|\buntested\b|(?<!\p{L})(sin (verificar|probar|ejecutar)|no (lo |la )?(he |hemos )?(ejecutad|probad|verificad)\w*|no verificad\w*)(?!\p{L})/iu;
  // Each launcher the answer sends the user to that neither ran well this turn nor is named as not verified:
  // [{ ...launcher, refused, failed }].
  function launcherGaps(x) {
    const ls = instructedLaunchers(x.answer, x.changed);
    if (!ls.length) return [];
    const lines = String(x.answer || '').split(/(?<=[.!?])\s+|\r?\n/);
    const names = t => new RegExp(`(?<![\\w-])${esc(t.base.replace(/\.[^.]+$/, ''))}(?![\\w-])`, 'i');
    return ls.flatMap(t => {
      const runs = (x.runs || []).filter(r => runsLauncher(r.cmd, t));
      const ok = runs.some(r => !neverRan(r) && !r.error && !LAUNCH_FAILED.test(String(r.out || '')));
      if (ok || lines.some(l => NOT_RUN_LINE.test(l) && (names(t).test(l) || l.includes(t.id)))) return [];
      return [{ ...t, refused: runs.length > 0 && runs.every(r => refusedOutright(r)), failed: runs.some(r => !neverRan(r)) }];
    });
  }
  // A refusal of the command itself (an approval nobody can give in this session, or the user said no), as against a
  // refusal of its form (several commands in one line, a cd with a redirect, a line too long, a variable the tool can't
  // check), which the same command run on its own gets past, and a hook's denial, which says what to fix.
  const FORM_REFUSED = /contains multiple operations|change directories and write via output redirection|malformed syntax|can'?t be checked before it runs|command line is too long|obfuscation|^\s*PreToolUse:/i;
  const refusedOutright = run => neverRan(run) && !FORM_REFUSED.test(String(run.out || '').slice(0, 400));
  // The Stop message for the launchers launcherGaps found.
  function launcherMessage(gaps) {
  const list = gaps.slice(0, 3).map(g => `\`${g.said.slice(0, 80)}\``).join(', ');
  const ps = gaps.some(g => g.ps51) ? ' "powershell" starts Windows PowerShell 5.1, not pwsh: run it with powershell, or tell the user "pwsh" (5.1 has no -Encoding utf8NoBOM, no ?? or ?. operators, no ternary, no && or ||).' : '';
  return gaps.every(g => g.refused)
    ? `The answer tells the user to run ${list}, which this turn wrote, and running it here was refused. Don't run it again this turn. Say it once in the answer: "NOT VERIFIED: <what> - <why it couldn't run>", naming it.${ps}`
    : `The answer tells the user to run ${list}, which this turn wrote or changed, but ${gaps.some(g => g.failed) ? 'its run here failed' : 'it never ran here'}. Run it this turn exactly as the user is told to (one that starts a server: in the background, stopped once it answers) and fix what fails, or say in the answer "NOT VERIFIED: <what> - <why>", naming it.${ps}`;
  }
  return { RUN_WORDS, LAUNCHER, EXECUTOR, runSaid, instructedLaunchers, runsLauncher, LAUNCH_FAILED, NOT_RUN_LINE, launcherGaps, FORM_REFUSED, refusedOutright, launcherMessage };
}
