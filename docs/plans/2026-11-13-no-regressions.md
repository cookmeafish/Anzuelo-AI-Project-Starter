---
status: open
---
# Plan: what the user relies on can't silently break in a release

**Goal:** no release changes a behavior the user sees or relies on unless the change is named on purpose.

**Approach:** test every user-visible behavior with recorded real turns instead of simplified samples, list those
behaviors in one contract file the audit enforces, and run the suite in both release chains and after every project
upgrade.

**Spec (user, 2026-11-13):** Anzuelo must not regress again; the user doesn't want things to break.

**Confidence:** 7/10. Main risk: real turns hold private text, so fixtures keep the shape (quotes, backslashes,
non-ASCII, length, images, helpers) with the words replaced.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-13-no-regressions.md`, or find
the first unticked box.

## Context
On 2026-11-13 a release stopped the upset acknowledgement from showing for any Issue line containing quotes, which is
most real ones. Every test used plain sample text with no quotes, so the selftest, the sweep, the trial and two release
chains all passed. The user found it before anyone else. Earlier the same week, the v2 selftest had never run inside a
project, and folder names with spaces broke engine checks. Each time the tests didn't look like real use.

## Constraints for every task
- Fixtures never carry the user's words or names: the shape stays, the text is replaced.
- Fast: the suite fits in the post-upgrade check's time.
- The user's rules: fix at the source; show only what's proven.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- A deliberate behavior change updates its fixture in the same commit and names the change in the commit message.

## Task 1: the contract
**Files:** tools/starter/user-contract.md, tools/audit.mjs
**Uses / provides:** provides the list for Tasks 2-3.
- [ ] One line per behavior the user sees or relies on: the acknowledgement for each write form, safety blocks, the
      caught and blocked lines, no hold on a clean turn, the work log closing items, routine commits and upgrades,
      installs into `.anzuelo/`. Each line names its fixture.
- [ ] Run `node tools/audit.mjs`. Expected: it fails when a contract line has no fixture, and passes when each has one.

## Task 2: real-turn fixtures
**Files:** tools/starter/real-turns/, a scrubber script
**Uses / provides:** uses Task 1.
- [ ] Record hook inputs from real sessions with their shape kept and their words replaced, one per contract line,
      with the expected output.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: putting the old quote-unaware acknowledgement check back makes
      the suite fail on the quoted Issue line, where the old tests passed.

## Task 3: run it everywhere
**Files:** the release chain scripts, the post-upgrade check
**Uses / provides:** uses Tasks 1-2.
- [ ] Both release chains run the suite. A changed contract output fails the release unless the commit names it and
      updates the fixture.
- [ ] The post-upgrade check runs the suite inside the project (folder names with spaces, the `.anzuelo` layout, git
      hooks).
- [ ] Run `node tools/audit.mjs`, then a release through both chains. Expected: audit PASS and the suite passing in
      both chains and in each upgraded project.
