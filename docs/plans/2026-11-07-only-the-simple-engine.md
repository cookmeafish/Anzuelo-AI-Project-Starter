---
status: active
---
# Only the simple engine: reminder, quiet work, a check that makes sure

Related: [[2026-11-05-engine-v2]], [[2026-11-07-plain-answers]]

The user (2026-11-07) confirmed the engine is only this: a short reminder at the start, nothing during work but safety
refusals, one check at the end that makes sure everything got done. They chose to check a project's rules through
the "Done when" lists, and asked for the three reported gaps fixed.

## Tasks
- [x] 1. Quiet work: no notice during work under v2. The background-run notice is gone (hooks.mjs pretool); the
      scope notice goes too. Test: v2 selftest "quiet work" feeds pretool and posttool non-safety calls and asserts
      no notice.
- [x] 2. The end check makes sure: after a block, a later stop in the same request re-checks only the checkable
      items and blocks again with what is still missing, at most 3 blocks per request; the last says to tell the user
      plainly what is not done. The verify list comes once. Test: an agent that ignores the first block gets a second
      naming the same item, none once it is met, and no 4th. Replay since 2026-11-01 (turns with something still
      missing at the turn's end, each up to 2 more blocks): 30 of 136 requests in real sessions, 106 of 363 in the
      starter's own. The reminder averages 7.7 to 8 lines (630 to 690 characters), so the 113-line figure was a
      counting artifact.
      Re-blocks in real sessions, by item in those 30 turns: 23 false, all fixed (a dry-run upgrade asked for an
      upgrade review and a commit: the engine runbook's items now fit only a real upgrade, test "engine runbook: its
      upgrade items fit a real upgrade and never a dry run"; two file names joined by a slash read as a missing path,
      test "two file names joined by a slash are a pair"); about 15 real (a missing changelog line, Finished section,
      screenshots after a screen change, the security review after sensitive code, a runbook never opened); 4 not
      settled from the replay alone (a project runbook's own markers, one commit named from another repository).
      Live in the starter: a docs/CHANGELOG.md item (the starter's template) and an Issue line read from an answer
      sent before the block, both fixed with tests.
- [x] 3. A project's rules are checked through the "Done when" lists: AGENTS.md rule 3 and the project-rule,
      runbook-create and project-bootstrap skills write a `(ran:)`, `(file:)` or `(answer:)` marker on the runbook
      item, or a test in the project's suite, never a new Stop check. The engine runbook's upgrade section has each
      project convert the checks it wrote (`hooks.mjs own-checks`: 13 in real sessions' projects), with the count
      before and after.
- [ ] 3b. The checks the starter ships (82: 16 core, 30 in the app and knowledge packs, 36 in library skills; most of
      the 94 found in real sessions' projects) don't run under v2 either. Each becomes a marker on the "Done when" item of
      the runbook or skill it guards, in the starter, so every project gets it by upgrade.
- [x] 3c. A false demand now costs up to 3 blocks: in the starter, the project runbook's `(file: docs/CHANGELOG.md)`
      item asks for the template every project gets, while the starter's own changelog is
      `tools/starter/STARTER-CHANGELOG.md` (seen live 2026-11-07, blocked twice after the change). The starter's
      changelog counts for that item in the starter.
- [ ] 4. Chain, proof, commit; upgrade message for the projects at the next batch.
