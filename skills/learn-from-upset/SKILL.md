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
   working copy. Don't agree from memory: what you remember writing is not what the file says, and don't write "You're
   right" anywhere, even in a progress note, before the file is open. Never say that git has no earlier version, or
   that nothing is committed, without running `git log` first.
   **Split the complaint into its parts and check each one on its own.** "It sounds like a robot and threatens them"
   is two claims: cold wording and a threat. Look for each in the file: the letter can be cold and still have no
   threatening word. Concede only the parts that hold, and say plainly which part did not, with what you found (one
   `Checked:` line per part, or "Partly: ..."). Lesson: a cold rent letter was conceded as "threatening" too, and the
   lesson stored said so, though the letter had no threatening wording.
   Say it plainly at the start of the answer: "You're right: ...", "Partly: X was wrong, Y was
   already there (<path>)", or, when it doesn't hold, the plain fact and what you checked, in your own words and with
   no concession ("I checked the note and its last commit: it is linked both ways."), with `Checked: <what you
   opened> - <what it showed>` lines if that helps. Say once that it doesn't hold, never as a phrase pasted into every
   bullet; the turn notes get `Learned (none): the complaint didn't hold - <evidence>`. A full "You're right" also adds `Checked: <file or output> - <what
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
   - **It passes on every existing file it governs**, apart from the one complained about: all the posts, letters,
     notes or source files its scope covers, as the last commit has them (its `requirements.json` "when" and "require"
     globs, or the folder and file type it runs on). Run it on all of them at once (the folder, a glob, or with no
     file so it checks its whole scope). A check that blocks real work it has never seen is worse than none.
   - **It passes on realistic good samples, one an edge case made from this project's own words.** Build it from the
     project's real vocabulary, not from the examples in this skill: its addresses, headings and labels, product,
     place and people's names, and the text it really writes. Word lists misfire on these traps:
     - proper nouns and addresses that contain a flagged word (a building called "... Court" in a tenant letter);
     - words the user's language shares with the flagged list (an "English word" list that holds words Spanish uses
       too, like a label "Tiempo total" or a "Menú" link);
     - quoted text, titles and names of things, which keep their own words;
     - a legitimate text that must use a flagged term (a firm letter the user asked for, a late-rent letter that has
       to say "arrears").
     A rule with an exception ("firm wording when asked") needs that exception in the check, or the answer must not
     promise it.
   - **Say it on one line in `.cache/turn-notes.md`:** `Proven: fails on <the complained-about sample>; passes on
     all <N> existing <files>, <good 1>, and an edge case: <what it holds>` (Spanish: `Probado: falla con ...; pasa
     con los <N> ... existentes, ... y un caso límite: ...`). Only with this may the answer say it can't happen again
     (hook: claim-checked). Without it, say what the check catches and what it does not.

   Its hook scenarios still recreate the defect (blocked) and the corrected work (passes):
   `node tools/hooks/selfcheck.mjs --tags <tag>`. For a lesson or rule: re-read the step and confirm the corrected
   work now follows it.
6. **Tell the user** in one plain sentence what changes from now on ("Every letter to a tenant is now checked for
   tone before it is saved"). The bookkeeping line goes into `.cache/turn-notes.md`, not the answer:
   `Learned (<level>): <the lesson in one sentence> → <file it went into>` (several lessons: one line each). When the
   complaint did not hold there is nothing to learn: `Learned (none): the complaint didn't hold - <evidence>`, and no
   made-up lesson or extra check (a principle the user wants kept still goes through project-rule). If the upset was
   about something outside the project (a service outage, the user's own day), say so in plain words and waive the
   check outside the answer: `node tools/hooks/hooks.mjs waive upset-learned "<why there is nothing to learn>"`.

## Done when
- [ ] The answer opens with whether the complaint holds, in full, in part or not, with the evidence (judgment: the
      user can tell at once what was actually wrong).
- [ ] The miss is fixed and verified (judgment: the user can see the corrected result).
- [ ] Each part of the complaint was checked on its own, and the answer says which parts held (judgment: whether a
      complaint has several parts needs a reader).
- [ ] A `Learned (<level>): ... → <file>` line in `.cache/turn-notes.md` names a file that changed this turn, or
      `Learned (none): ...` for a complaint that did not hold (hook: upset-learned).
- [ ] A lesson at level check has its scenarios and they pass (hook: hooks-tested).
- [ ] A new check failed on the complained-about state, passed on every existing file it governs and on good samples
      with an edge case from the project's own words, said in a `Proven:` line (hook: check-proven).
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
- An edge case copied from this skill's examples instead of made from the project's words. A language check passed
  the skill's own example words and still flagged the site's real labels; a tone check passed four hand-made letters
  and blocked a warm letter to a flat whose building name held a "legal" word.
- "Reported to the makers" when the lesson was only noted: `starter.mjs feedback` writes `docs/starter-feedback.md`,
  and only `node tools/starter.mjs report` sends it. Say "noted in docs/starter-feedback.md for the starter".
- Waiving a check with N/A because another hook blocked the work. That is not "does not apply": say the work is
  blocked, by what, and leave it for the user.
