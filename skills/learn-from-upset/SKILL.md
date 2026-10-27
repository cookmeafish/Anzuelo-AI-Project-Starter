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
`node tools/recall.mjs "<the issue>"` for earlier cases). Strong words alone are not a miss.
- **False alarm** (venting, a test of the hooks, something outside this work, nothing here went wrong): put
  `Learned (none): nothing was wrong - <what they were describing>` in `.cache/turn-notes.md`, say nothing about it,
  do what they asked, and stop following this skill. The user sees nothing.
- **A real issue, or a repeat:** put `Issue: <the problem in the user's terms, under 12 words>` in
  `.cache/turn-notes.md` (the user is shown "acknowledged" with it at the end of the turn), then follow the steps below.

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
   on it, before you say so. Lesson: one weak pick was swapped and a narrow check added, while the same result still
   held other weak picks of the same kind, and the user found them next.
   **The simplest fix that removes the cause:** change one thing in the right place rather than add layers; extend an
   existing step, tool or check rather than add a new one. If the fix needs much more than that, say why in one line.
2. **Find the cause** in one sentence: "The <skill/runbook/check> did not <step>, so <what went wrong>."
3. **Pick the lowest level that will reliably stop it:**

   | Level | When | Where it goes |
   |---|---|---|
   | one-off | A slip no procedure could prevent, that can't recur | `docs/lessons.md` (one dated line) |
   | lesson | A step of a skill or runbook was missing, vague or out of order | That skill's `## Project lessons` / runbook's `## Pitfalls`, and the step fixed |
   | rule | A standing preference the project didn't know | AGENTS.md + user-requirements row, via project-rule |
   | check | It happened before, would be costly again, or a script can tell right from wrong | `tools/hooks/requirements.json` (or a `config.json` guard) with a blocked and a passing scenario, via project-rule step 5 |
   | skill | A whole kind of work had no procedure | A runbook and its check, via runbook-create |
   | engine | The starter's hooks, checks or skills were wrong | `node tools/starter.mjs feedback "<lesson>"` (in the starter: fix the engine, add a self-test) |

   Go up a level for "again", real cost, safety, privacy or anything sent outside, or the same line already in
   `docs/lessons.md`.
4. **Write it there** in your own words, never the user's (hook: no-verbatim-examples), as what to do next time.
5. **Prove a new check** in one command (hook: check-proven): `node tools/hooks/hooks.mjs prove "<its command>"
   --edge "<a good edge case from this project's own words: a name, address, label, quoted text>"` runs it on git's
   version before the fix (it must fail) and on the fix (it must pass), and writes the `Proven:` line. Make the check
   run over its whole scope, prefer testing the result over a word list, and extend an existing check rather than adding
   a second. When the problem was never in the files, prove it on a sample written to `.cache/` (it fails) and the
   real files (they pass), in a `Proven:` line in `.cache/turn-notes.md`. Only then may the answer say it can't happen
   again (hook: claim-checked). A new check's scenarios pass: `node tools/hooks/selfcheck.mjs --tags <tag>`.
6. **Tell the user** in one sentence what changes from now on. In `.cache/turn-notes.md`, not the answer:
   `Learned (<level>): <lesson> → <file>`; for a complaint that didn't hold, `Learned (none): the complaint didn't hold -
   <evidence>` and no made-up lesson. Upset about something outside the project: say so, and
   `node tools/hooks/hooks.mjs waive upset-learned "<why>"`. "Reported" means `node tools/starter.mjs report` ran;
   otherwise say "noted in docs/starter-feedback.md".

## Done when
- [ ] The answer opens with whether the complaint holds, in full, in part or not, with the evidence (judgment: the
      user can tell at once what was actually wrong).
- [ ] The miss is fixed and verified (judgment: the user can see the corrected result).
- [ ] Every other case of the same miss in the same result was looked for and fixed, not only the one the user named
      (judgment: what counts as "the same kind" needs a reader).
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
- A "lesson" that only says "be more careful": name the step and what to do differently.
- A rule for a one-off, or a one-off note for something that already happened twice.
- Fixing a complaint without checking it, or conceding a false one (trial agents "fixed" work that was right and
  blamed internal files).
- A check tried only on made-up cases: trial checks passed the very work complained about and blocked a warm letter
  whose building name held a flagged word.
- Waiving a check because another hook blocked the work: say the work is blocked, by what, and leave it for the user.
