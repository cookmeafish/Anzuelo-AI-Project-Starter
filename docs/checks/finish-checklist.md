# Finish checklist (before every answer that did real work)

Go through it top to bottom. Items marked (hook: tag) are also checked automatically. The rest need judgment.

## The request
- [ ] Every part of the request is done, including messages typed while you worked (hook: queued-messages).
- [ ] "N things" means N (hook: count-honored). A redo says what changed (hook: redo-changes).
- [ ] The runbook you followed is named, and its "Done when" items pass (hook: runbook-read, playbook-named).
- [ ] A new kind of task left a runbook and a check behind (hook: runbook-exists, runbook-complete).
- [ ] A miss while following a runbook or skill left its lesson in that file (hook: skill-learn).
- [ ] Anything added (skill, pack, dependency) says "Worth it: <gain> / <cost>" (hook: worth-it).
- [ ] Anything ambiguous was asked about, or stated as an assumption. Nothing was silently guessed.

## Accuracy
- [ ] Every claim is backed by a file, a source, or something you ran. Nothing invented.
- [ ] "It works" means you ran it and saw it work. Otherwise it says "not verified".
- [ ] Volatile facts (prices, versions, laws, schedules) were checked recently, and the date is given.
- [ ] One or two lines on what could make this wrong, when the stakes justify it.

## Files
- [ ] Only files the user asked to change were changed (hook: question-no-file). Protected and versioned files respected (hook: protect-originals, no-overwrite).
- [ ] Project-specific validators were run and PASSED, not just run (requirements.json `toolPassed` / `runEach`).
- [ ] CHANGELOG updated; STATUS updated after substantial work; decisions logged (hook: changelog, status-handoff, decision-logged).
- [ ] Structural change → `node tools/audit.mjs` PASS. Hook change → `node tools/hooks/test-hooks.mjs` ALL PASS (hook: audit-run, hooks-tested).
- [ ] GUI change → screenshot loop done, with a verdict (hook: gui-pack, gui-review-loop, gui-review-report).
- [ ] Commits credit only the user (hook: no-ai-attribution).
- [ ] Before a push: `.gitignore` keeps secrets, local state, caches and private files out, and keeps everything the
      project needs in; nothing ignored is already committed (hook: gitignore-ready).

## The answer
- [ ] It leads with the result. Plain words, no filler, no em dashes, formatted to scan (hook: plain-writing).
- [ ] It ends with **Finished**: what was done, exact paths, and what wasn't done or verified (hook: finished-summary).
- [ ] No outward action was taken without an explicit OK. Drafts are labeled as drafts.
