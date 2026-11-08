---
status: done
---
# Plain answers: no engine words in what the user reads

Related: [[2026-11-05-engine-v2]]

The user was upset twice in one session about answers they could not understand.

## Everything wrong, with the cause and the fix
- [x] A decision for the user was copied from the plan's notes in engine words. Cause: the improvement loop had no
      step for how a decision is written. Fix: a pitfall in `tools/starter/runbooks/improvement-loop.md` (86653f3).
- [x] An `Issue: ... | runbook: ... | fixed when: ...` note opened the answer. Cause: rule 3 in AGENTS.md did not say
      where the line goes, and the agent put it in the answer instead of `.cache/turn-notes.md`. Fix: rule 3 and the
      learn-from-upset skill say "notes file, never the answer"; the end check names an Issue note in any message of
      the turn (`noteGaps`, v2 selftest "an Issue engine note in the answer is named").
- [x] The plain rewrite still leaned on internal terms (setup, the end step, project-made checks). Cause: the same
      habit as the first item. Fix: the answer explains with an everyday example, no internal names.

- [x] "The old engine" was used as if the user knew it. Cause: the same habit; covered by the improvement-loop
      pitfall (every internal name gets a plain description or is left out). Fix: explained in the answer.

## Sweep
`noteGaps` over every assistant message in the starter's own transcripts: 2525 messages, 3 with an Issue note, all
this session's.
