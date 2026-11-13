---
status: open
---
# Plan: a release gate made of real turns

**Goal:** what the user relies on seeing can't break again unnoticed. A suite of recorded real turns, one fixture per
user-visible behavior, gates every release and runs inside every project after its upgrade.

**Why (user, 2026-11-13, upset):** the "acknowledged" line broke on any Issue line that quotes something, and the
break passed the v2 self-test, the old suite, the sweep, the trial and two release chains. Root cause: every test of a
user-visible behavior used plain sample text (no quotes, escapes, non-ASCII, long lines), so nothing ran the shapes
real sessions produce, and no list said which behaviors the user relies on.

**Spec:** the request relayed from the user on 2026-11-13: a real-turn suite, a contract list the audit enforces, the
gate in both release chains, and the same suite after each project upgrade.

**Approach:** record real hook inputs from real session transcripts, scrubbed of private words but keeping their shape;
replay each through the hooks as Claude Code would call them; compare with the expected output. A contract file names
each behavior once with its fixture; the audit fails a behavior without one; both chains and the post-upgrade check run
the suite.

**Confidence:** 7/10. Main risk: scrubbing changes the shape that broke (a quote turned into a letter). The scrubber
keeps every character that is not a letter or digit, and Task 1's test checks that.

**How to resume:** `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-13-real-turn-suite.md`.

## Context
- The nearest example: `tools/starter/replay-fixes.mjs` replays recorded transcripts through the end check; the new
  runner calls `tools/hooks/hooks.mjs <event>` with the recorded JSON on stdin, as the host does.
- Hook events and where their output goes: `prompt` (reminder), `pretool` (guard, acknowledgement for a shell-written
  Issue line), `posttool` (acknowledgement for Edit and Write), `stop` (end check and its line).
- Transcripts: `~/.claude/projects/<folder>/<session>.jsonl`; hook outputs show there as attachments
  (`hook_system_message`, `hook_additional_context`, `hook_blocking_error`) with their `hookEvent`.
- Behaviors the user relies on (the contract): the acknowledgement in each write form (Edit, Write, a shell append, the
  note command once it exists); safety blocks; the "caught" and "blocked" lines (quiet-screen Task 4b); no hold and no
  line on a clean turn; the work log closing what the turn did; a commit and an upgrade going through (plain and
  `.anzuelo/engine` layouts, a folder name with a space).

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS), `node tools/audit.mjs` (PASS), `node tools/trial.mjs` (TRIAL: PASS).

## Constraints for every task
- No private words in a fixture: the scrubber replaces every letter and digit run with a same-length placeholder and
  keeps every other character (quotes, backslashes, punctuation, non-ASCII class, line breaks, length).
- No project or person names in starter files (rule 14); the starter's own name only in name markers.
- The suite runs in under a minute, so it fits the post-upgrade check.
- A contract output may change only in a commit that names the behavior change and updates its fixture.

## Watch for
- A fixture whose expected output was written from the code under test proves nothing: each expectation is written from
  what the user saw (the transcript's attachment), and checked against the old, broken code where one exists.

## Task 1: record and scrub
**Files:** tools/starter/real-turns/record.mjs (new), tools/starter/real-turns/fixtures/ (new)
**Uses / provides:** provides the fixture format Tasks 2-5 read.
- [ ] `record.mjs <transcript> <behavior> --at <timestamp>` writes one fixture: the hook event, its JSON input, the
      transcript rows it reads (scrubbed), the files it reads (the notes lines, scrubbed), and the expected output.
- [ ] Run `node tools/starter/real-turns/record.mjs --self-test`. Expected: scrubbing keeps every non-letter character
      and the length of a sample with quotes, backslashes, an emoji, accented letters and a 2,000-character line, and no
      word of the original remains.

## Task 2: replay
**Files:** tools/starter/real-turns/run.mjs (new)
**Uses / provides:** uses Task 1's fixtures; provides the runner Tasks 4-5 call.
- [ ] Each fixture runs in a fresh temp project (plain layout; `.anzuelo/engine` layout; a folder with a space) through
      `hooks.mjs <event>`, and its output is compared with the expected one. Prints `REAL TURNS: PASS (n)` or each FAIL.
- [ ] Run `node tools/starter/real-turns/run.mjs` with the old quote-unaware acknowledgement check put back. Expected:
      FAIL on the quoted Issue line in every write form, where the old tests passed. With the fix: `REAL TURNS: PASS`.

## Task 3: the contract
**Files:** tools/starter/user-contract.md (new), tools/audit.mjs
**Uses / provides:** uses Task 1's fixture names.
- [ ] The contract lists each behavior once with its fixture name(s); the audit fails a behavior with no fixture, and a
      fixture no behavior names.
- [ ] Run `node tools/audit.mjs` with one contract line's fixture removed. Expected: FAIL naming that behavior; with it
      back, PASS.

## Task 4: the gate
**Files:** the release chain, tools/hooks/selftest-cache.mjs (proof), tools/new-project.mjs (post-upgrade check)
**Uses / provides:** uses Task 2's runner.
- [ ] Both chains run `run.mjs`; a changed contract output fails the release unless the commit message names the
      behavior and the fixture changed in the same commit.
- [ ] The post-upgrade check runs the suite inside the project and says plainly which behavior broke there.
- [ ] Run `node tools/trial.mjs`. Expected: the upgraded sample projects run the suite, and `TRIAL: PASS`.

## Task 5: fixtures for every behavior
**Files:** tools/starter/real-turns/fixtures/, tools/starter/user-contract.md
**Uses / provides:** uses Tasks 1-4.
- [ ] One fixture per contract line, recorded from real sessions of the last 3 days (the acknowledgement in each form,
      a safety block, a clean turn, a work-log close, a commit and an upgrade in both layouts).
- [ ] Run `node tools/starter/real-turns/run.mjs` and `node tools/audit.mjs`. Expected: `REAL TURNS: PASS` with one
      fixture per contract line, and audit PASS.
- [ ] Release through both chains; the projects upgrade and run it. Expected: every chain step passes.
