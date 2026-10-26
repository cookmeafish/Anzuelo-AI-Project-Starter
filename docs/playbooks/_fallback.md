---
name: _fallback
summary: What to do when no runbook covers a request, and how to leave one behind so the next time is a known procedure
---
# Playbook: no runbook fits

**Use when:** the prompt hook says NO RUNBOOK, or nothing in `DIRECTORY.md` §1 fits a piece of real work. A quick
question needs none of this.

## Steps
1. **Look for a near match.** Skim `DIRECTORY.md` §1 and each runbook's triggers. If one is close, use it and EXTEND
   it: add the new trigger phrases and a branch for this case.
2. **Understand the request.** Re-read it, plus any messages typed meanwhile. Check `docs/BRIEF.md` for constraints and
   `docs/DECISIONS.md` for anything already settled. Ask ONE focused question only if a wrong guess would waste real
   work or cause harm. A key word you don't know, or one that could mean several things (a term of the user's domain, a
   word from their other language, a likely typo): look it up in `docs/glossary.md` and the project's own sources
   first, and name the reading you took. Build no runbook or trigger around a word whose meaning you have not checked.
3. **Do the task carefully**, by the hard rules. Note the steps you actually take: that list is the draft runbook.
4. **Leave it behind** (runbook-create skill): a runbook named after the task, with short trigger phrases for the task,
   steps in order, a "Done when" list and pitfalls, plus at least one check in `tools/hooks/requirements.json`
   (`"when": {"playbookUsed": "<name>"}`). The skill and the DIRECTORY row are generated. Add a menu code in
   `docs/MENU.md` if the task will be common.
5. **Finish** with the finish checklist. Say in the answer that a runbook was created or extended, with its path.

## Done when
- [ ] The task is done, or what blocked it is said plainly (judgment: only a look at the result tells).
- [ ] A runbook covering this task exists, has a check, and is named in the answer (hook: runbook-exists, runbook-complete).
