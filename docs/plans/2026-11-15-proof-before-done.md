---
status: open
---
# Plan: "done" and "tested" only with proof the user would accept

**Goal:** an agent never calls work tested, accurate or done unless the proof covers the real path the user will
use: real input through the feature, an independent accuracy check for content, the default screen for "obvious"
asks, and every sub-ask of a long request.

**Approach:** the end check and claim check ask for the missing proof once (no new interruption), the gui and testing
runbooks get recipes, and each item is proven by a replay of real turns from an adopted app (2026-11-15).

**Spec (user, 2026-11-15, upset twice):** the coding agent kept shipping features that failed on first use, and the user
no longer trusts the course content; the engine must stop such misses, and guide the agent to success.

**Confidence:** 7/10. Main risk: proof asks that become noise. Each item asks once and is met by the evidence named.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-15-proof-before-done.md`.

## Context: every miss this session, with its root cause
1. A voice feature shipped as "tested" and failed on first use. Root cause: unit tests, a review and screenshots
   counted as proof; no run fed audio through it; "tested" passed beside "try it with your real mic".
2. A sign-in feature asked to be "obvious" was hidden behind a tab. Root cause: the screen review checked looks, not
   whether it could be found from the default screen.
3. A long request with about eight demands was logged as one or two items; its parts had no checklist of proof.
4. Content accuracy ("check every card several times") was checked only by the agent's own helpers. Nothing asked for
   an independent sample audit with an error rate. The user now doubts all of it.
5. A new standing rule got a paragraph and no enforcement (already in quiet-screen as its own box).
6. The routing reminders named wrong runbooks and paths (hook-text-accuracy plan, item A, committed).
7. An ask about the default state ("the default selected must be X") shipped as a fix on a click path ("starting the
   course switches to X"), was marked done in the answer's table, and passed the end check; the user opened the app
   and met the old default. Root cause: a done claim is never compared with the ask's own condition (default, on
   launch, first screen, existing data), and the proof came from a state the user never starts in. A sweep of the same
   answer found two more asks with no matching proof (one never mentioned, one dismissed without a measurement).
   Covered by Tasks 3 and 4: the proof must come from the ask's own state, for a fresh and an existing profile.
8. A session ended on "should I build X? (it lifts a project rule)" although the user had asked for X twice, and
   oversight relayed the question instead of the user's words. Root cause: neither the end check nor the watch
   runbook compared a closing question with the user's open asks. Fix: the closing-question hold (quiet-screen plan)
   and the project-watch Pitfall.
9. New additions shipped without the obvious paths a user takes (no way out of a new mode, the default never
   changed, saved data never tried). The user was disappointed that nothing brought an outside view, and asked for
   one always. Root cause: reviews judged the work against the agent's own description, never against independent
   users' angles, and oversight only reacted. Fix: Task 6.
10. A device feature (voice) passed "16 of 16 checks" on English test audio. The user's active mode was a
    Spanish-learning one: the speech was heard as English and the replies were long padded paragraphs. Root cause: proof
    ran on the developer's default setup and checked mechanics, not the output's quality for this user. Fix: the
    device-proof hold (real setup named, output judged) and a "## Quality verdict" in the journey walk (be0b538).
11. Oversight passed routine steps (an engine upgrade refused by a session's own permission check, a project rule the
    user had already asked for) back to the user as commands to type. Root cause: oversight treated "the session can't"
    as "the user must". Fix: oversight runs routine local steps itself after a dry run (project-watch, never-park
    memory). The user is asked only about pushes, purchases, publishing or deleting their data.

## Task 6: a third perspective on every new addition (coding session, standing rule, 2026-11-15)
**Files:** skills/plan/SKILL.md, docs/playbooks/gui.md, the gui-review-loop skill, tools/hooks/v2/lib.mjs, AGENTS.md
**Uses / provides:** Task 3.
- [ ] Before building a new addition, the plan step runs independent angle agents in parallel (first-time user, saved
      data, phone, keyboard, what can go wrong, power user; 3 for small, 6 for a new mode or flow) and merges a
      "User journey" section. After building, a fresh agent walks the app against every item.
- [ ] The rule is in AGENTS/CLAUDE with its date and a user-requirements row. The end check holds once on a new addition
      without the section (3+ angles) and a walk report. Bug fixes are exempt.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: today's new-mode turn holds; with the section and walk it
      passes; a bug fix passes; ALL PASS.

## Constraints for every task
- One held line per missing proof, at most. No new interruption during work.
- Starter files never name the project the lessons came from.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- Proof asks must accept the app's own way of testing (its suite, its scripts), not only the engine's tools.

## Task 1: real-path proof for device-dependent features
**Files:** tools/hooks/v2/end.mjs, tools/hooks/v2/lib.mjs, docs/playbooks/gui.md
**Uses / provides:** none.
- [ ] Code using microphone, camera, audio, speech, file pickers or a real account sign-in needs one end-to-end run
      (fake-device browser flags or a stub server), or the answer says "not run end to end: <why>". The gui runbook
      gets the fake-device recipe.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the real turn (mic code, unit tests only, "tested") holds
      once; with a fake-audio run it passes; ALL PASS.
- [x] The proof run uses the user's real setup (the active mode's language and data, their provider), not the
      developer's defaults: an answer claiming a device feature works on "default settings", or naming no setup,
      holds once (end.mjs deviceProofGaps, REQ: device-proof, rule 4). Replay (2026-11-15): "a recorded sentence
      through a fake mic ... default settings ... 16 of 16 checks pass" in a mode for another language holds.
- [x] The journey walk ends with a `## Quality verdict` from an independent judge of real outputs in the user's real
      setup ("is this what a user would want?", failures listed); a walk without it holds on a new feature.

## Task 2: claims match the proof
**Files:** tools/hooks/v2/lib.mjs
**Uses / provides:** none.
- [ ] "Tested", "works" or "verified" in the same answer as "try it with your real <device>", or with no matching run
      this turn, is flagged as an unbacked claim.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the real answer is flagged; an answer naming its run passes.

## Task 3: findable from the default screen
**Files:** docs/playbooks/gui.md, the gui-review-loop skill
**Uses / provides:** none.
- [ ] For an "obvious", "visible" or onboarding ask, the review includes a default-state shot showing the entry point.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: only post-click shots hold once; a default shot meets it.
- [x] A new mode, screen or flow gets its journey walked (enter, leave, switch to each sibling and back with progress
      kept, relaunch, a user with saved data), each with a shot or a test, plus "list 5 things a first-time user would
      try next on this screen, and check each" (gui.md step 4, gui-review-loop step 5).
- [x] gui.md "Done when": a new mode, screen or flow names its journey in a `Journey:` line, or the step not walked.
      Selftest: the runbook's item applies to a new-mode answer, is met by a Journey line, skips a small change.
- [ ] The end check lists the journey steps with no proof, at most five, once (end.mjs is at its size budget: fold
      first). Replay: the real new-mode turns hold on "leave / switch to sibling" before the user's complaint.

## Task 4: long requests become checklists with proof
**Files:** tools/hooks/v2/worklog.mjs, tools/hooks/v2/end.mjs
**Uses / provides:** hook-text-accuracy item E.
- [ ] A message with several demands becomes sub-items; the end check lists the sub-items with no proof in the
      answer (a test, a count, a run), at most five.
- [x] (first part, d1b6590) A work-log ask naming a default or startup state, claimed done, holds once until proof
      from that state (a fresh and an existing profile) or a plain "not verified from launch" line. Fails on the old code.
- [ ] A sub-item naming a state (default, on launch, first screen, existing data, when I open) is met only by proof
      from that state, for a fresh and an existing profile. A fix on another path is held once, with the item and its
      condition. A sub-item the answer never mentions is listed.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the real 8-demand message gives 8 sub-items; the real
      default-state ask with its click-path answer holds once; a launch-state screenshot meets it; ALL PASS.

## Task 5: independent accuracy audit for content
**Files:** docs/playbooks/ (a content-accuracy section), skills/research/SKILL.md
**Uses / provides:** none.
- [ ] Content the user asked to be accurate (cards, facts, guides) is checked by a reviewer that did not write it,
      on a stated random sample, with an error rate reported; errors found widen the audit to the whole set.
- [ ] Run `node tools/audit.mjs`. Expected: PASS, the section routed from the research and content runbooks.

## Task 6: routine local steps are never parked on the user
**Files:** AGENTS.md rule 6, docs/playbooks/engine.md
**Uses / provides:** none. The user's decision, 2026-11-15.
- [x] Rule 6 and engine.md §1: committing the project's work locally (no push) and the engine upgrade through
      starter.mjs need no extra OK; pushing, publishing, deleting the user's data and anything outward still do; a
      tool call the host's permission settings refuse is said in one line, never worked around.
- [x] engine.md "Done when": a reply to an upgrade notice comes after the commit and the upgrade.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the real "needs the user's OK first ... 8 modified files"
      reply holds once; a reply after the commit and the upgrade does not.

## Task 7: a turn the host's usage limit cut is not held again and again
**Files:** tools/hooks/v2/end.mjs
**Uses / provides:** none.
- [ ] When the last assistant text is the host's limit notice, or the answer says the limit stopped it and lists what
      is undone, the end check passes after that one answer. Open items stay in the work log for the resumed session.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the real cut turn passes after its first answer; a normal
      turn with the same open items still holds.
