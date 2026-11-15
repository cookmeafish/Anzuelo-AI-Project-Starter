# What the hooks show is accurate

status: open
From oversight's review of every alert the engine showed in an adopted large app over one hour (2026-11-15); the user
asked for special care with the accuracy of what the hooks show. Related: [[2026-11-13-quiet-screen]],
[[2026-11-13-project-boundary]], [[2026-11-14-reusable-work-becomes-engine]].

## Constraints for every task
- Each fix gets a test built from the real lines (in general terms, no project names), failing on the old code first.
- Paths shown to the agent are real for the layout it runs in (.anzuelo/engine included).
- Order: A-D first (accuracy of what the user sees), then H, then E-G and I.

## Task A: routing guesses that are right, with real paths
- [ ] Printed runbook paths resolve in the project's layout (in .anzuelo/engine projects the engine copy's path).
- [ ] A project is never routed to tools/starter/runbooks (the starter's own runbooks).
- [ ] Filler words (every, being, test, time, multi, trans and the like) never count toward the overlap; a guess needs
      a meaningful match. Real misses: a large content build guessed revise-text (every, trans); a test question
      guessed the starter's improvement loop (test, multi, time); a rule question guessed trigger-words (rule, being).
- [ ] In light mode no "closest runbook" guess unless it is confident.

## Task B: an adopted app's rule request maps to its own enforcement
- [ ] The project runbook's starter file set (user-requirements, rule-enforcement) is not routed to an adopted app; a
      rule request there asks for the app's own enforcement (the quiet-screen box for adopted apps).

## Task C: a mid-turn message flagged once
- [ ] The same mid-turn message is reminded once (it was flagged three times in a minute), and "still unanswered" is
      shown at most once, only when the answer did not address it.

## Task D: work-log items in the user's own words
- [ ] A message with a pasted block is still logged as an ask, from the user's own words.
- [ ] Pasted text never becomes an item's text: pasted blocks are stripped before the item is made.

## Task H: code that reads a git-ignored path is flagged
- [ ] When a turn adds code that reads from a path git ignores, one line: "this feature reads <path>, which git
      ignores; a fresh clone won't have it". Test: code fetching from an ignored folder is flagged; from a tracked one
      it is not.

## Task E: a long multi-ask message is split
- [ ] A message holding several separate demands is logged as one item per demand, so the end check sees each (a real
      message of about 8 demands was logged as 1-2 items).

## Task F: done items do not pile up
- [ ] Items close by evidence (a commit or the answer naming them); otherwise one compact line at the end. In light
      mode 6 done items stayed "open".

## Task G: open asks survive a compaction
- [ ] After a compaction mid-request, the session start re-injects the open asks. Test from a compacted session.

## Task I: third-party text saved in a repo with a remote
- [ ] The security review lists pasted third-party text marked as copyrighted that is saved in a repo with a remote,
      so it stays out of git or is paraphrased.
