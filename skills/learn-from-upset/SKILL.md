---
name: learn-from-upset
description: When the user is upset, annoyed or complains, fixes the miss, says plainly what went wrong, then decides how important the lesson is and puts it where it will stop the next miss - a lesson in the skill or runbook that missed it, a rule, a hook check, a new skill, or feedback to the starter so every project gets the fix - and proves it with a test. Use whenever the user sounds frustrated or upset ("again?!", "you forgot", "why did you", "ugh", shouting in capitals), points out a mistake, or says something should not have needed saying.
runbook: docs/playbooks/project.md
---
# Learn from an upset user

A correction fixes this answer; a lesson stored in the right place fixes the next ones (hook: upset-learned). Writing
a rule is the **project-rule** skill; a lesson in a followed skill goes under its `## Project lessons` or
`## Pitfalls`; a new kind of work is **runbook-create**.

## Steps
**Decide first: is anything actually wrong?** Use this skill when the user is upset at the work, or when the same issue
keeps coming up even if they say it calmly (check `docs/lessons.md`, `tools/hooks/state/triggers.jsonl` and
`node tools/recall.mjs "<the issue>"` for earlier cases). Strong words alone are not a miss. Decide this before
anything else, also for a message typed while you work and for one asked as a question, and write the `Issue:` line
below first: it shows the user "acknowledged", and the end-of-turn check looks for it (hook: upset-acknowledged).
- **False alarm** (venting, a test of the hooks, something outside this work, nothing here went wrong): put
  `Issue: none - <why>` in `.cache/turn-notes.md`, say nothing about it, do what they asked, and stop following this
  skill. The user sees nothing.
- **A real issue, or a repeat:** pick the runbook or skill that finds its root cause and fixes it (DIRECTORY.md;
  **debug** for anything that behaves wrong). Put these in `.cache/turn-notes.md` before any fix, as your first step:
  1. `Issue: <the user's point in general terms, under 12 words> | runbook: <name> | fixed when: <a checkable outcome>`
  2. `Scope: <the point in general terms> - <every case it covers>` (their example is one case of the point, not the
     point)
  3. `Root cause: <why the earlier work missed it>` (hook: upset-acknowledged)

  These lines are notes for the engine: the answer never shows them, and says in plain words what went wrong and what
  changes. The user is shown "acknowledged" with all three at once, and "fixed" when the turn ends. Then follow that
  runbook to the end, and verify the outcome by running or opening what shows it; the end check has you go over the
  runbook's list. A new complaint in the same turn gets its own new lines.

0. **Check the complaint first, before you agree.** Open what the user saw: the last commit or what was delivered
   (`git log -- <file>`, `git show HEAD:<file>`), not only the working copy, and never from memory. Never say git has
   no earlier version without running `git log`. Split the complaint into its claims and check each one ("cold and
   threatening" is two). Open the answer with the verdict: "You're right: ..." plus a `Checked: <what you opened> -
   <what it showed>` line (Spanish: `Comprobado:`), "Partly: X was wrong, Y was already there (<path>)", or, when it
   doesn't hold, the plain fact and what you checked, once, with no concession. "Partly" is only about what the user
   complained about: don't hunt for another fault, and never blame files the user doesn't see (engine notes, hooks).
1. **Fix the miss now**, by the runbook or skill it belonged to, saved where the old result was. One plain sentence on
   what went wrong, no over-apologizing. A misread request: undo everything built on the misreading.
   **The example the user named is one case, not the whole miss:** find every other case of the same miss in the same
   result (every item of that kind, every slot it fills, every page it is on) and fix them all in this turn, before the
   answer says it is fixed or can't happen again. A check written for the lesson runs over the whole result, and passes
   on it, before you say so.
   **The simplest fix that removes the cause:** change one thing in the right place rather than add layers; extend an
   existing step, tool or check rather than add a new one. If the fix needs much more than that, say why in one line.
1a. **List everything wrong before fixing anything.** Write the user's complaint, every part of it and every message
   they sent while you worked, as a checklist (in the plan below, or your own notes): each item, what you
   checked, its root cause, and what will stop it. Fix from the list, so the answer covers all of it.
1b. **Upset again in the same session** (the hook knows; hook: upset-learned): patching has failed, so stop patching.
   - Write a plan in `docs/plans/` (plan skill) with everything wrong this session, each item's root cause, and the
     runbook, hook, check, skill or engine change that stops it. Work it box by box.
   - Write the rule the behavior must follow, not a fix for the moment shown. List every state and every kind of input
     it must handle, including the ones nobody complained about yet.
   - Sweep as in debug Phase 4: run the fix over the whole real record (every line of a log, every file, every saved
     result) against facts read independently, and say in the answer what ran over what, how many were checked and how
     many were wrong. The moments in the user's screenshots are a sample, not the test.
   - Turn the sweep into a self-test, so the next change can't break it again.
2. **Find the cause:** ask why until the answer is a step, check or rule you can change (often 3 to 5 whys), and
   note when several causes combined: "The <skill/runbook/check> did not <step>, so <what went wrong>."
   **Learned before?** Search the earlier lessons for this complaint's subject (`docs/lessons.md`,
   `docs/checks/user-requirements.md`, the skills' `## Project lessons`). If one covers it, its fix did not
   hold: the cause is why that rule or check let this through (it counted instead of judging each item, it let a
   generic case pass), and that is what gets fixed.
3. **Pick the lowest level that will reliably stop it:**

   | Level | When | Where it goes |
   |---|---|---|
   | one-off | A slip no procedure could prevent, that can't recur | `docs/lessons.md` (one dated line; create the file if missing) |
   | lesson | A step of a skill or runbook was missing, vague or out of order | That skill's `## Project lessons` / runbook's `## Pitfalls`, and the step fixed |
   | rule | A standing preference the project didn't know | AGENTS.md + user-requirements row, via project-rule |
   | check | It happened before, would be costly again, or a script can tell right from wrong | A checkable "Done when" line on the runbook it belongs to (or a `config.json` guard, or a test in the project's suite), via project-rule step 5 |
   | skill | A whole kind of work had no procedure | A runbook and its check, via runbook-create |
   | engine | The starter's hooks, checks or skills were wrong | `node tools/starter.mjs feedback "<lesson>"` (in the starter itself: fix the engine and add a self-test) |

   Go up a level for "again", real cost, safety, privacy or anything sent outside, or the same line already in
   `docs/lessons.md`.
4. **Write it there** in your own words, never the user's (hook: no-verbatim-examples), as what to do next time.
5. **Prove a new check** in one command (hook: check-proven): `node tools/hooks/hooks.mjs prove "<its command>"
   --edge "<a good edge case from this project's own words: a name, address, label, quoted text>"` runs it on git's
   version before the fix (it must fail) and on the fix (it must pass). Make the check run over its whole scope, prefer
   testing the result over a word list, and extend an existing check rather than adding a second. When the problem was
   never in the files, prove it on a sample written to `.cache/` (it fails) and the real files (they pass). Only then
   may the answer say it can't happen again (hook: claim-checked). A new check's scenarios pass:
   `node tools/hooks/selfcheck.mjs --tags <tag>`.
6. **Tell the user** in one sentence what changes from now on and where the lesson went. A complaint that didn't hold
   gets the evidence and no made-up lesson. Upset about something outside the project: say so. "Reported" means
   `node tools/starter.mjs report` ran (it creates `docs/starter-feedback.md`); otherwise say "noted in
   docs/starter-feedback.md".

## Done when
- [ ] The answer opens with whether the complaint holds, in full, in part or not, with the evidence (judgment: the
      user can tell at once what was actually wrong).
- [ ] The miss is fixed and verified (judgment: the user can see the corrected result).
- [ ] Every other case of the same miss in the same result was looked for and fixed, not only the one the user named
      (judgment: what counts as "the same kind" needs a reader).
- [ ] Each part of the complaint was checked on its own, and the answer says which parts held (judgment: whether a
      complaint has several parts needs a reader).
- [ ] The lesson is written in a file that changed this turn (the skill, runbook, rule or check that missed it), or
      the answer shows the complaint did not hold (hook: upset-learned).
- [ ] A lesson at level check has its scenarios and they pass (hook: hooks-tested).
- [ ] A new check failed on the complained-about state, passed on every existing file it governs and on good samples
      with an edge case from the project's own words (hook: check-proven).
- [ ] An engine lesson went to the starter (`docs/starter-feedback.md`), or into the engine itself in the starter
      (hook: upset-learned).
- [ ] Upset again in the same session: a plan in `docs/plans/` lists everything wrong with its root cause and fix, and
      the fix was run over the whole real record with 0 wrong (hook: upset-learned).

## Pitfalls
- A "lesson" that only says "be more careful": name the step and what to do differently.
- A rule for a one-off, or a one-off note for something that already happened twice.
- Fixing a complaint without checking it, or conceding a false one.
- A check tried only on made-up cases: it can pass the very work complained about and block good work that holds a
  flagged word.
- Fixing the screenshot, not the behavior: each fix tested only on the moment shown, while the cause breaks every
  other kind of moment. Sweep the whole real record.
- Waiving a check because another hook blocked the work: say the work is blocked, by what, and leave it for the user.
