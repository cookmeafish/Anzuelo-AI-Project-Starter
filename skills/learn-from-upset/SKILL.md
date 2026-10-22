---
name: learn-from-upset
description: When the user is upset, annoyed or complains, fixes the miss, says plainly what went wrong, then decides how important the lesson is and puts it where it will stop the next miss - a lesson in the skill or runbook that missed it, a rule, a hook check, a new skill, or feedback to the starter so every project gets the fix - and proves it with a test. Use whenever the user sounds frustrated or upset ("again?!", "you forgot", "why did you", "ugh", shouting in capitals), points out a mistake, or says something should not have needed saying.
runbook: docs/playbooks/project.md
---
# Learn from an upset user

An upset user means something fell short. A correction fixes this answer; only a lesson stored in the right place
fixes the next ones. The Stop hook checks both (hook: upset-learned).

Say at the start: "Checking what happened first, then fixing it and making the project learn from it
(learn-from-upset skill)."

## What the other skills already cover
- **Writing a rule with its check, row and test:** the **project-rule** skill. This skill decides *whether* a rule is
  the right home for the lesson; project-rule does the writing.
- **A lesson inside a skill or runbook that was followed:** the hooks' skill-learn check. Write it under
  `## Project lessons` (engine skills) or `## Pitfalls` (the project's own).
- **A new kind of work that had no procedure:** the **runbook-create** skill.
- **A skill or check that keeps annoying the user:** the hooks suspend it after 3 of its last 6 turns
  (friction-suspend). This skill fixes the cause before it gets there.

## Steps
0. **Check the complaint against the files first, before you agree.** Open what the user is upset about as the user
   saw it: the last commit or what was delivered (`git log -- <file>`, then `git show HEAD:<file>`), not only the
   working copy. See which parts of the complaint hold. Don't agree from memory: what you remember writing is not
   what the file says. Never say that git has no earlier version, or that nothing is committed, without running
   `git log` first. Say it plainly at the start of the answer: "You're right: ...", "Partly: X was wrong, Y was
   already there (<path>)", or, when it doesn't hold, the plain fact and what you checked: `Checked: <what you
   opened> - the complaint doesn't hold: <evidence>`, with no concession. A lead in your own words ("The note is
   linked both ways.") is fine next to that line. A full "You're right" also adds `Checked: <file or output> - <what
   it showed>` on its own line (Spanish: `Comprobado:`; hook: upset-learned). "Partly" is only for the thing the user
   complained about: don't look for some other fault to concede, and never blame files the user doesn't see (the
   project's engine notes, hook files, `docs/starter-feedback.md`). A complaint that doesn't hold still gets its
   principle written down if it is one the user wants kept, but never a fix for a problem that isn't there.
1. **Fix the miss now.** Redo the work by the runbook or skill it belonged to, and save the corrected result where
   the old one was (a rewritten letter replaces the saved draft, not just the chat). No arguing, over-apologizing or
   promises: one plain sentence on what went wrong, then the fix.
2. **Find the cause, not the symptom.** Which step was missing, vague or skipped? Which rule was broken? Or was it
   something only the user knew? Write it as one sentence:
   "The <skill/runbook/check> did not <step>, so <what went wrong>."
3. **Weigh how important it is.** Pick the lowest level that will reliably stop it happening again:

   | Level | When | Where it goes |
   |---|---|---|
   | one-off | A one-time slip no procedure could have prevented, that can't recur | `docs/lessons.md` (one dated line) |
   | lesson | A step of a skill or runbook was missing, vague or out of order | That skill's `## Project lessons` / runbook's `## Pitfalls`, and the step itself fixed |
   | rule | A standing preference the project didn't know ("always", "never", a quality bar) | AGENTS.md + user-requirements row, through the project-rule skill |
   | check | It already happened before, it would be costly again, or a script can tell right from wrong | A check in `tools/hooks/requirements.json` (or a guard in `config.json`) with a blocked and a passing scenario, through project-rule step 5 |
   | skill | A whole kind of work had no procedure | A runbook and its check, through the runbook-create skill |
   | engine | The starter's own hooks, checks or skills were wrong (a false alarm, a missing guard, a confusing message) | `node tools/starter.mjs feedback "<lesson>"` (reaches the starter, and through its upgrades every project). In the starter itself: fix the engine and add a self-test |

   Go up a level when: the user says it happened before ("again"), the miss cost real work or money, it involves
   safety, privacy or something sent outside the project, or the same complaint is already in `docs/lessons.md`.
   Several levels can apply: a check usually comes with a lesson in the skill it guards.
4. **Write it down there** in your own words, never the user's (hook: no-verbatim-examples). Each lesson says what
   to do, not only what went wrong, so the next run can follow it.
5. **Prove it.** A check written now (a script, a test, a requirements.json entry) is proven on real samples, not
   only on made-up ones (hook: check-proven):
   - **It fails on the exact state the user complained about:** run it before your fix, on a copy saved before the
     fix (`cp <file> .cache/before/`), on the earlier version (`git show HEAD:<file> > .cache/before-<name>`), or on
     the real complained-about text. Any of these counts. A check that passes there would not have caught the miss:
     test the result itself, not that a function or a word exists.
   - **It passes on at least 2 realistic good samples**, one of them a valid edge case of this project: the words the
     user's language shares with a banned list ("once" and "he" are Spanish too), a legitimate text that must use a
     flagged term (a late-rent letter has to say "arrears"), real input in a strange but valid shape.
   - **Say it on one line:** `Proven: fails on <the complained-about sample>; passes on <good 1>, <good 2>` (Spanish:
     `Probado: falla con ...; pasa con ...`). Only with this may the answer say it can't happen again (hook:
     claim-checked). Without it, say what the check catches and what it does not.

   Its hook scenarios still recreate the defect (blocked) and the corrected work (passes):
   `node tools/hooks/selfcheck.mjs --tags <tag>`. For a lesson or rule: re-read the step and confirm the corrected
   work now follows it.
6. **Tell the user** in the answer, on its own line:
   `Learned (<level>): <the lesson in one sentence> → <file it went into>`, in the user's language (Spanish:
   `Aprendido (regla): ...`). Several lessons: one line each. If the upset was about something outside the project (a
   service outage, the user's own day), say so in plain words and waive the check outside the answer:
   `node tools/hooks/hooks.mjs waive upset-learned "<why there is nothing to learn>"`.

## Done when
- [ ] The answer opens with whether the complaint holds, in full, in part or not, with the evidence (judgment: the
      user can tell at once what was actually wrong).
- [ ] The miss is fixed and verified (judgment: the user can see the corrected result).
- [ ] A `Learned (<level>): ... → <file>` line names a file that changed this turn (hook: upset-learned).
- [ ] A lesson at level check has its scenarios and they pass (hook: hooks-tested).
- [ ] A new check failed on the complained-about state and passed on 2 realistic good samples, said in a `Proven:`
      line (hook: check-proven).
- [ ] An engine lesson went to the starter (`docs/starter-feedback.md`), or into the engine itself in the starter
      (hook: upset-learned).

## Pitfalls
- Apologizing at length instead of fixing. One sentence, then the fix.
- A "lesson" that only says "be more careful". Name the step and what to do differently.
- Writing a rule for a one-off, or a one-off note for something that already happened twice.
- Copying the user's angry words into a rule. Write the principle.
- Learning in the wrong place: a lesson about the engine buried in one project's notes never reaches the others.
- Fixing a complaint without checking it. Reviews of trial sessions found agents "fixing" things that were already
  right, and building rules around a letter whose corrected version was never saved.
- Conceding a false complaint. An agent found the user's note linked both ways, still opened with "Partly right",
  and blamed an internal file the user never sees. Another said the README "in git" lacked an option, because
  nothing was committed, while the last commit had it: it had checked only the working copy.
- A new check that overlaps one the project has: extend the existing check instead of adding a second one, and
  prefer a check that tests the result over a list of forbidden words.
- A check tried only on made-up bad cases. Trial projects shipped checks that passed the very code the user had
  complained about, flagged ordinary words of the user's language, and banned words every legitimate letter needs.
- "Reported to the makers" when the lesson was only noted: `starter.mjs feedback` writes `docs/starter-feedback.md`,
  and only `node tools/starter.mjs report` sends it. Say "noted in docs/starter-feedback.md for the starter".
- Waiving a check with N/A because another hook blocked the work. That is not "does not apply": say the work is
  blocked, by what, and leave it for the user.
