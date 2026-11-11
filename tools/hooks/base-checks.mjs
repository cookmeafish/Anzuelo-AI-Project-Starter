// The engine's built-in checks, the same table form as requirements.json, read by both engines (v2's evaluator,
// v2/lib.mjs holdsReq). Moved from hooks.mjs (plan: engine v2 only, step 1b). A base module like settings.mjs.

// What a failed run and a reported problem look like, for both engines' "ranFailing": a failure line in the output
// counts like an error exit; a missing tool is setup, not a bug; problem words in the request make it a fix.
export const FAILED_RUN = /^\s*(FAIL(ED)?\b|not ok\b)|\b[1-9]\d* (tests? )?(failed|failing|errors?)\b|Traceback \(most recent call last\)|AssertionError|\bERR!/m;
export const MISSING_TOOL = /is not recognized as (an internal|the name)|command not found|: not found\b|No such file or directory.*(node_modules|bin)|Cannot find module|No module named|ModuleNotFoundError|could not determine executable|not installed/i;
// (a run stopped or killed before it finished failed nothing: an error exit with no failure line that says it was
// interrupted, or a self-test, trial or audit run cut off before its summary line; and a failure that a rerun of the
// same command passed, with no code file changed between them, was no fix. Record files (Markdown, docs/, .cache/,
// memory/) are not code. Lesson (two field reports, 2026-11-10): a self-test killed for a restart, then a clean rerun
// after only STATUS and CHANGELOG lines, was asked for a root cause)
export const INTERRUPTED_RUN = /\b(interrupted|killed|terminated|aborted|SIGINT|SIGTERM|SIGKILL|was stopped|stopped by|cancell?ed)\b|\bexit (code|status) (130|137|143)\b/i;
const RUN_SUMMARY = [[/\bselfcheck\.mjs\b/, /^selfcheck: /m], [/\bv2[\\/]selftest\.mjs\b/, /^v2 selftest: /m], [/\btrial\.mjs\b/, /^TRIAL: /m], [/\baudit\.mjs\b/, /^audit: /m]];
export function interruptedRun(cmd, out) {
  const o = String(out || '');
  if (FAILED_RUN.test(o)) return false;
  if (INTERRUPTED_RUN.test(o)) return true;
  const s = RUN_SUMMARY.find(([c]) => c.test(String(cmd || '')));
  return !!s && !s[1].test(o);
}
export const RECORD_FILE = /\.md$|^(docs|\.cache|memory)\//i;
// runs: [{ cmd, out, error }] in order; editedBetween(i, j): the files edited after run i and before run j
export function rerunPassed(runs, i, editedBetween) {
  const same = c => String(c || '').trim().replace(/\s+/g, ' ');
  return runs.some((r, j) => j > i && same(r.cmd) === same(runs[i].cmd) && !r.error && !FAILED_RUN.test(r.out || '') && !editedBetween(i, j).some(f => !RECORD_FILE.test(f)));
}
export const PROBLEM_WORDS = /\b(bugs?|broken|breaks?|crash(es|ed|ing)?|errors?|exceptions?|traceback|fail(s|ed|ing|ures?)?|doesn'?t work|does not work|not working|wrong|regression|fix(es)?|make (the )?(tests?|build) pass)\b|\b(falla|fallan|fallo|errores|roto|rota|no funciona|arregla|corrige)\b/i;

// REQ: dev-new-project. In a development copy of the starter (.starter-dev), a change to how projects are made, linked or
// upgraded needs the trial on sample projects. Both engines (moved from hooks.mjs DEV_REQUIREMENTS unchanged).
export const DEV_NEW_PROJECT = { tag: 'dev-new-project', rule: '12', when: { filesChanged: ['tools/new-project.mjs', 'tools/starter.mjs', 'tools/hooks/wire.mjs', 'tools/packs.mjs', 'tools/skills.mjs'] },
  // (a run of the script, not a command that names it: a "git add tools/trial.mjs" after a passing trial was its last run)
  require: { toolPassed: { cmd: String.raw`\bnode\s+(\S*[\\/])?trial\.mjs`, pass: 'TRIAL: PASS' } },
  message: 'Making, linking or upgrading projects changed: run node tools/trial.mjs until it prints "TRIAL: PASS". It proves on sample projects that nothing gets worse (files, rules, secrets, tests, git hooks, speed, repeat upgrades).' };
// The rest of the development copy's checks (.starter-dev), so the starter is held to what it asks of every project.
// They never ship: projects are made without .starter-dev. Both engines (moved from hooks.mjs DEV_REQUIREMENTS).
export const ENGINE_FILES = ['tools/**', 'packs/**', 'library/**', 'skills/**', '.githooks/**', 'AGENTS.md', 'SETUP-PROMPT.md', 'docs/checks/**', 'docs/playbooks/**'];
// (the proof the self-test writes when it passes, and the starter's own records of where work stands, are no engine
// change. Lesson (this starter's own turns): a status line asked for the self-test and a changelog entry)
export const SELF_WRITTEN = ['tools/hooks/engine-proof.json', 'tools/starter/STATUS.md', 'tools/starter/dogfood-log.md', 'tools/starter/STARTER-CHANGELOG.md', 'tools/starter/trials/rounds.json'];
// (a run of the self-test, not a command that only names the file: "git add tools/hooks/selfcheck.mjs" read as a failed
// run. Under v2 its own self-test, tools/hooks/v2/selftest.mjs, counts too: the release chain runs the whole old suite)
export const DEV_SELF_TESTS = { tag: 'dev-self-tests', rule: '12', when: { filesChanged: ['tools/**', 'packs/**', 'library/**', 'skills/**', '.githooks/**'], filesIgnore: SELF_WRITTEN },
  require: { toolPassed: { cmd: String.raw`\bnode\s+(\S*[\\/])?(selfcheck|selftest)\.mjs`, pass: 'ALL PASS' } },
  message: 'The starter\'s engine changed: run its self-test (node tools/hooks/v2/selftest.mjs, or node tools/hooks/selfcheck.mjs) until it prints "ALL PASS".' };
export const DEV_CHANGELOG = { tag: 'dev-changelog', rule: '12', when: { filesChanged: ENGINE_FILES, filesIgnore: SELF_WRITTEN }, require: { filesChanged: ['tools/starter/STARTER-CHANGELOG.md'] },
  message: 'Projects learn what changed from tools/starter/STARTER-CHANGELOG.md: add what this turn changed to today\'s entry.' };
export const DEV_VERIFICATION = { tag: 'dev-verification', rule: '4', when: { filesChanged: ['tools/*.mjs', 'tools/**/*.mjs', 'skills/**/*.mjs', 'library/**/*.mjs', 'packs/**/*.mjs'] },
  require: { answerMatches: String.raw`\b(verif\w*|tests? (pass|ran)|ALL PASS|audit: PASS|checked by running)\b` },
  message: 'Code changed: say how it was verified (the commands run and what they printed), like the app pack\'s verification report.' };
export const DEV_CHECKS = [DEV_SELF_TESTS, DEV_CHANGELOG, DEV_NEW_PROJECT, DEV_VERIFICATION];

// The baseline checks live here, not in requirements.json, so they can't be switched off by editing that file
// (found by the ablation tests: an emptied requirements.json silently disabled every declarative check).
// requirements.json adds checks or overrides one of these by tag; turning one off takes an explicit
// "disabled": [{ "tag": "...", "reason": "..." }] entry, which the audit reports.
// REQ: finished-summary, REQ: changelog, REQ: status-handoff, REQ: audit-run, REQ: decision-logged, REQ: redo-changes, REQ: praise-captured
export const BASE_REQUIREMENTS = [
  // REQ: install-vetted. A new package or tool is vetted before it is used: legitimate per independent sources, truly free, maintained.
  // Reinstalling the declared requirements (-r, -e ., npm install / npm ci) is not a new tool.
  // The evidence goes in docs/DECISIONS.md and the answer gets one short line for all of them. Lesson: three 250-character
  // "Vetted:" lines (stars, release dates, sources) filled a setup answer with detail the user does not act on.
  { tag: 'install-vetted', rule: '15', when: { toolRan: String.raw`\b(pip3?|python3?\s+-m\s+pip|uv\s+pip)\s+install\s+(?!(?:[^\n;&|]*\s)?(-r|--requirement|-e)\s)(?!--upgrade\s+pip\b)(-\S+\s+)*[A-Za-z]|\b(npm|pnpm|yarn)\s+(install|i|add)\s+(-\S+\s+)*[@A-Za-z]|\bInstall-Module\b|\bwinget\s+install\b|\bchoco\s+install\b|\bcargo\s+install\b|\bgo\s+install\b` },
    require: { answerMatches: String.raw`[Vv]etted:[^\n]*([Ll]icen[cs]e|\b(MIT|BSD|Apache|GPL|LGPL|AGPL|MPL|ISC|HPND|ZPL|PSF|Unlicense|CC0|0BSD|Zlib)\b)` }, // (a license named by its id counts. Lesson (a trial): "Vetted: <tool> (BSD-3-Clause)" was refused twice for lacking the word "license")
    message: 'A tool or package was installed this turn. Vet each one first: legitimate per 2+ independent sources, free with a license that allows this use, maintained and well regarded. Write that evidence in docs/DECISIONS.md, and give the user one short line for all of them: "Vetted: <tool> <version> (license <name>), <tool> <version> (license <name>) - details in docs/DECISIONS.md". A tool that fails any of these is removed again and not used.' },
  { tag: 'finished-summary', rule: '7', when: { filesChanged: ['**'], filesIgnore: ['docs/fit-checklist.md'] }, require: { answerMatches: String.raw`^\s*(#{1,6}\s*|\*\*)?finished\b` },
    // (Lesson: a setup answer listed about 40 files one by one, burying the few the user would open)
    // (Lesson: complaint answers listed STATUS, CHANGELOG, plans and rule files one by one around a one-line fix.)
    message: "End the answer with a 'Finished' section: what was done, and the exact path of each file the user will open or care about. With more than about 10, group the rest by folder with a count (\"docs/playbooks/: 6 runbooks\"). The project's own records (docs/STATUS.md, docs/CHANGELOG.md, docs/DECISIONS.md, plans, specs, reviews, the rule and check files) need no list: \"plus the usual records\" is enough." },
  // (in the starter itself, docs/CHANGELOG.md and docs/STATUS.md are the templates new projects start from: its own
  // records are under tools/starter/, which projects never get. Lesson (dogfood): both checks asked to edit the templates)
  { tag: 'changelog', rule: '12', when: { filesChanged: ['CLAUDE.md', 'AGENTS.md', 'docs/playbooks/**', 'docs/checks/**', 'skills/**', 'tools/**'] }, require: { filesChanged: ['docs/CHANGELOG.md', 'tools/starter/STARTER-CHANGELOG.md'] },
    message: 'Add a dated line to docs/CHANGELOG.md for what changed in the project (rules, runbooks, checks, skills, tools). In the starter itself: tools/starter/STARTER-CHANGELOG.md.' },
  // (only when work is left open: finished work is in the CHANGELOG, and a handoff with nothing to hand off is churn.
  // Lesson (efficiency trials): STATUS.md was edited on nearly every turn, two or three times in one feature turn)
  { tag: 'status-handoff', rule: '12', when: { workTurn: true, minToolCalls: 15, answerMatches: String.raw`\b(still open|not (yet )?(done|finished|fixed|tested|verified)|left to do|to do next|next steps?|unfinished|remaining (work|items?|steps?)|blocked (on|by)|waiting (on|for) (you|the user|your)|NOT VERIFIED|pendiente|falta(n)? por|sin terminar|queda(n)? por)\b` }, require: { filesChanged: ['docs/STATUS.md', 'tools/starter/STATUS.md'] },
    message: 'Work is left open: update docs/STATUS.md (Now / Next / Open questions) so the next session can pick it up cold. In the starter itself: tools/starter/STATUS.md.' },
  { tag: 'audit-run', rule: '12', when: { filesChanged: ['CLAUDE.md', 'AGENTS.md', 'docs/MENU.md', 'docs/playbooks/**', 'docs/checks/**', 'skills/**', 'tools/hooks/requirements.json', 'tools/hooks/config.json'] },
    require: { toolPassed: { cmd: String.raw`audit\.mjs`, pass: 'audit: PASS', selfRun: 'node tools/audit.mjs', selfAuto: true } },
    message: 'Project structure changed, and the audit (run by the hooks at the end) reports a FAIL: fix each one; the hooks run it again when you finish.' },
  // REQ: self-improve. Turning what the user already asked for into checks, runbooks, tests or skills is the agent's
  // job (rule 3), not a question for the user. Lesson: an agent listed six unenforced requirements and asked "should I add
  // those checks?", and the user had to point out that the project is meant to improve itself.
  { tag: 'self-improve', rule: '3', when: { answerMatches: String.raw`\b(should|shall|can|may) i\b[^\n?]{0,60}\b(add|create|write|set up|turn)\b[^\n?]{0,80}\b(checks?|runbooks?|tests?|skills?|hooks?|rules?)\b[^\n]*\?|\b(want|like) me to\b[^\n?]{0,60}\b(add|create|write|set up|turn)\b[^\n?]{0,80}\b(checks?|runbooks?|tests?|skills?|hooks?|rules?)\b[^\n]*\?` },
    require: { answerNotMatches: String.raw`\b(should|shall|can|may) i\b[^\n?]{0,60}\b(add|create|write|set up|turn)\b[^\n?]{0,80}\b(checks?|runbooks?|tests?|skills?|hooks?|rules?)\b[^\n]*\?|\b(want|like) me to\b[^\n?]{0,60}\b(add|create|write|set up|turn)\b[^\n?]{0,80}\b(checks?|runbooks?|tests?|skills?|hooks?|rules?)\b[^\n]*\?` },
    message: "Don't ask whether to add checks, runbooks, tests or skills for what the user already asked for: add them now, then say what you added (hard rule 3). Ask only about money, privacy or outward actions." },
  // (Lesson: "ok we'll use stripe", "decided: postgres", "go with the blue one", "I pick the second design" and "fine,
  // monthly billing it is" were decisions nobody logged)
  { tag: 'decision-logged', rule: '12', when: { promptMatches: String.raw`\b(we|i)('ve| have)? decided\b|\bdecided\s*:|\blet'?s go with\b|\bfinal decision\b|\bi('m| am) going with\b|\b(we'?ll|we will|let'?s) (use|go with|pick|stick with)\b|(^|[.!,]\s*)(ok,?\s*)?go with\b|\bi('ll)? (pick|choose|chose) (the|option)\b|\b\w+ it is\s*[.!]?\s*$` },
    require: { filesChanged: ['docs/DECISIONS.md'] }, message: 'The user made a decision: record it in docs/DECISIONS.md (date, decision, why, what it rules out, what would reopen it).' },
  // (re-run / re-check count only for the last answer's work: "rerun the pipeline on the new batch" is a new run.
  // Lesson: a monthly pipeline run was asked to say what changed from the last answer)
  // (Lesson: "have another go at it" and "verify your answer" were redos that never said what changed)
  { tag: 'redo-changes', rule: '8', when: { workTurn: true, promptMatches: String.raw`\b(redo|re-do|double.?check|try again|one more time|second look|another (go|try|look|pass)|verify (it|this|that|them|your (work|answer))|re-?(run|check) (it|this|that|them|your (work|answer|check))\b|(do|check|look|go|run|try) (it |this |that |them )?(over |through )?again)\b` },
    require: { answerMatches: 'what changed|changes from (the|my) (earlier|previous|last)|same result|nothing changed|no changes|differences from' },
    message: "This is a redo or re-check: add 'What changed from the earlier answer, and why' (old → new → reason for each change), or say 'same result' if nothing changed." },
  // (Lesson: "more like this please", "stick with this style" and "this format is great, use it from now on" were lost)
  { tag: 'praise-captured', rule: '3', when: { promptMatches: String.raw`\bkeep (doing|making) (this|that|these|it)\b|\b(do|make) (it|them) like this (every time|from now on)\b|\bthis is (exactly )?how i want\b|\bmore like (this|that|these)\b|\bstick with (this|that|these)\b|\b(great|perfect|love|awesome)\b[^.!?\n]{0,30}\b(from now on|every time|going forward)\b` },
    require: { filesChanged: ['docs/playbooks/**', 'skills/**', 'CLAUDE.md', 'AGENTS.md', 'docs/checks/**'] },
    message: "The user wants this repeated: write down what exactly worked (as steps or a 'What works' line) in the runbook or skill it came from, or in the standing preferences." }
];
