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
      missing at the turn's end, each up to 2 more blocks): 25 of 77 and 5 of 59 in the two real projects, 106 of 363
      in the starter. The reminder averages 7.7 to 8 lines (630 to 690 characters), so the 113-line figure was a
      counting artifact.
- [x] 3. A project's rules are checked through the "Done when" lists: AGENTS.md rule 3 and the project-rule,
      runbook-create and project-bootstrap skills write a `(ran:)`, `(file:)` or `(answer:)` marker on the runbook
      item, or a test in the project's suite, never a new Stop check. The engine runbook's upgrade section has each
      project convert the checks it wrote (`hooks.mjs own-checks`: 4 and 9 in the two real projects), with the count
      before and after.
- [ ] 3b. The checks the starter ships (82: 16 core, 30 in the app and knowledge packs, 36 in library skills; most of
      the 35 and 59 in the real projects) don't run under v2 either. Each becomes a marker on the "Done when" item of
      the runbook or skill it guards, in the starter, so every project gets it by upgrade.
- [ ] 4. Chain, proof, commit; upgrade message for the projects at the next batch.
