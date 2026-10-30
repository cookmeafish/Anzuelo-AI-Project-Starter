# Plan: a status bar and "acknowledged" line the user can trust, and upsets handled with a plan

status: done
Started: 2026-10-28. Why: the user complained six times in one session that the status bar or the acknowledged line was
wrong, and each fix patched only the screenshot in front of it. Related: [status-lines runbook](../playbooks/status-lines.md),
[learn-from-upset](../../skills/learn-from-upset/SKILL.md), [plan skill](../../skills/plan/SKILL.md).

## Checklist
- [x] 1. Root cause of the bar, written down: it guessed where a turn starts (a typed message only) and read only the
      last 1.5 MB, so work started by a background notice, long turns and early agent launches all read wrong.
- [x] 2. Bar rebuilt on one rule: the newest entry decides (a final reply with nothing after it = ended; anything else
      = working), whole transcript read (25 ms for 7 MB), background agents and commands counted until their notice.
- [x] 3. Bar shows the end message's result line ("checks passed", "N steps not done"), never an extra line like
      "rule saved".
- [x] 4. The engine says so when a turn ends with checks still unfinished (third round or a pause), instead of ending
      silently: the user and the bar both see it.
- [x] 5. "Acknowledged" fixed: the newest Issue line is read, not the first one in the notes file; self-test added,
      fails before the fix, passes after.
- [x] 6. Bar moved into the starter (`tools/hooks/statusline.mjs`) with a self-test (tag `status-bar`) that runs it on
      a recorded session covering every state: no turn, working, almost done, working on the steps, waiting on
      background tasks, a notice-started turn, finished with checks passed, ended with steps left.
- [x] 7. Sweep over the user's real session: every tool call and every turn end, 0 wrong.
- [x] 8. The user's other project runs its own copy of the bar (tools/hooks/statusline.mjs), not a temporary job folder.
- [x] 9. Upsets get a plan by default (learn-from-upset): the agent lists everything that is wrong, each item's root
      cause, and the runbook, hook, check, skill or engine change that stops it, as a checklist in `docs/plans/`. A
      repeat complaint about the same thing also needs a sweep over real data, in a `Sweep:` line. The hook
      (upset-learned) blocks a turn whose user is upset again in the same session with no plan and no sweep.
- [x] 10. status-lines runbook: a "status bar" section with these states and the sweep as its Done when.
- [x] 11. Self-tests for every changed tag pass; audit has no new failure; changelog and starter status updated.
      Full self-test: 1443 passed; 2 failed, both checked: the DIRECTORY row length (fixed, passes) and a
      stop-follow-on case that fails the same way on the last commit (a private-term list, open in tools/starter/STATUS.md).

## Not done
- The engine's setup (wire.mjs) does not write the statusLine setting yet: a project gets the bar by hand.

## Assumed
- Assumed: the bar keeps the "almost done" line while the agent works on the steps - it is the bar's one view of what
  the checks want - cost if wrong: one more line to hide.
