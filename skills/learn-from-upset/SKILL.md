---
name: learn-from-upset
description: When the user is upset, annoyed or complains, fixes the miss, says plainly what went wrong, then decides how important the lesson is and puts it where it will stop the next miss - a lesson in the skill or runbook that missed it, a rule, a hook check, a new skill, or feedback to the starter so every project gets the fix - and proves it with a test. Use whenever the user sounds frustrated or upset ("again?!", "you forgot", "why did you", "ugh", shouting in capitals), points out a mistake, or says something should not have needed saying.
runbook: docs/playbooks/project.md
---
# Learn from an upset user

An upset user means something fell short. A correction fixes this answer; only a lesson stored in the right place
fixes the next ones. The Stop hook checks both (hook: upset-learned).

Say at the start: "Fixing it first, then making sure it doesn't happen again (learn-from-upset skill)."

## What the other skills already cover
- **Writing a rule with its check, row and test:** the **project-rule** skill. This skill decides *whether* a rule is
  the right home for the lesson; project-rule does the writing.
- **A lesson inside a skill or runbook that was followed:** the hooks' skill-learn check. Write it under
  `## Project lessons` (engine skills) or `## Pitfalls` (the project's own).
- **A new kind of work that had no procedure:** the **runbook-create** skill.
- **A skill or check that keeps annoying the user:** the hooks suspend it after 3 of its last 6 turns
  (friction-suspend). This skill fixes the cause before it gets there.

## Steps
0. **Check the complaint against the files first.** Open what the user is upset about (the file, the output, the
   commit) and see which parts of the complaint hold. Say it plainly in the first line of the answer: "You're right:
   ...", "Partly: X was wrong, Y was already there (<path>)", or "That isn't what happened: <evidence>". A complaint
   that doesn't hold still gets its principle written down if it is one the user wants kept, but never a fix for a
   problem that isn't there.
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
5. **Prove it.** For a check: its "blocked" scenario recreates the exact defect the user complained about (the card
   with no time, the link never opened, the wrong total, the change missing from the changelog) and the check must
   fail it; a near miss that still has the defect must fail too. Then `node tools/hooks/selfcheck.mjs --tags <tag>`
   (blocked when skipped, passes when followed). A check that only looks for a word or a format lets the same miss
   through: test the result itself. For a lesson or rule: re-read the step and confirm the corrected work now follows it.
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
- A new check that overlaps one the project has: extend the existing check instead of adding a second one, and
  prefer a check that tests the result over a list of forbidden words.
- Waiving a check with N/A because another hook blocked the work. That is not "does not apply": say the work is
  blocked, by what, and leave it for the user.
