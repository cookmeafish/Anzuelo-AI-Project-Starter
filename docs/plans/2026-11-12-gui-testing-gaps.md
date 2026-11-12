---
status: open
---
# Plan: GUI checks prove that every control works and that a new user can find their way

**Goal:** the gui pack proves three things about a screen: it looks right, every control on it works, and a first-time
user can do the main tasks without help.

**Approach:** keep what works (the screenshot review loop and the visual checklist), and add three missing pieces
to the screenshot tool and the gui runbook:
- a crawl of every control;
- assertions in saved flows;
- a fresh-eyes task test.

Add an automated accessibility scan and a before/after picture comparison. Make native desktop windows drivable, not
only viewable.

**Spec (user, 2026-11-12):** the engine must have the tools, runbooks and checks to test GUI apps, so that they look
great, are intuitive, and everything in them works as expected.

**Confidence:** 7/10. Main risk: crawling every control can trigger destructive actions (delete, send, pay), so the
crawl must stay in a safe mode and never click those.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-12-gui-testing-gaps.md`, or find
the first unticked box.

## Context
What the gui pack has today (packs/gui/files):
- `tools/screenshot.mjs`: screenshots at phone and desktop sizes in light and dark mode, through bundled Chromium only.
  It warns on sideways scroll, console errors, broken images and blank pages. It drives steps (click, type, wait, eval,
  shot) and reruns saved flows. Native windows: screenshot only, on Windows.
- `docs/checks/visual-review.md`: a good checklist for breakage, clarity, craft and data.
- `docs/playbooks/gui.md` and the `gui-review-loop` skill: the loop runs until a round finds nothing.
- Hooks: the screenshots are fresh and looked at, the verdict line, warnings, saved flows rerun.

The gaps:
1. **"Everything works" is not checked.** Only "the main flow" is driven, and whether it works is a judgment item. No
   step lists every button, link, menu and input and confirms each one does something without an error.
2. **Flows can't fail on a wrong result.** `eval` prints a value, but nothing compares it with an expected one. A flow
   fails only on a missing element or a console error.
3. **"Intuitive" is judged by the agent that built the screen.** No one tries the tasks fresh.
4. **Accessibility is eyeballed.** Contrast, labels and keyboard order have no automated scan.
5. **Untouched screens can change unseen.** No comparison with the last approved pictures.
6. **Native desktop apps can be photographed but not driven.**

## Constraints for every task
- Destructive controls (delete, remove, send, pay, buy, sign out, submit to outside services) are never clicked by the
  crawl; they are listed and skipped.
- Bundled Chromium only; never the installed browser (the existing browser guard).
- New dependencies are vetted (rule: install-vetted) and widely used, with licenses that allow commercial use.
- Nothing new interrupts the agent during work; results reach the end check (the user's show-only-proven rule).

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- Apps that need a login or a running server: the crawl uses the app's own launch command (`--launch`), the same way
  flows do today.

## Task 1: crawl every control (safe mode)
**Files:** packs/gui/files/tools/screenshot.mjs, its tests
**Uses / provides:** provides the control report to Task 6.
- [ ] `--crawl`: on each page, list every visible button, link, menu item, tab, checkbox and input. Exercise each safe
      one (click, toggle, type a sample value) and record what happened: navigation, a DOM change, a network request, or
      nothing. Flag dead controls (nothing happens), errors, and controls that land on a broken or blank state.
- [ ] Run `node tools/hooks/v2/selftest.mjs` with a fixture page that has one working, one dead, one erroring and one
      destructive control. Expected: the report flags the dead and erroring ones, skips the destructive one, and passes
      the working one.

## Task 2: flows that assert
**Files:** packs/gui/files/tools/screenshot.mjs, packs/gui/files/docs/playbooks/gui.md
**Uses / provides:** none.
- [ ] Add an `expect` step: a selector with its expected text, count, value or visibility, or an `eval` with an expected
      value. A mismatch fails the flow with "expected X, got Y".
- [ ] Run `node tools/hooks/v2/selftest.mjs` with a fixture flow whose expectation is wrong. Expected: the flow fails with
      the mismatch named; with it corrected, it passes.

## Task 3: a fresh-eyes task test for "intuitive"
**Files:** packs/gui/files/skills/gui-review-loop/SKILL.md, packs/gui/files/docs/checks/visual-review.md
**Uses / provides:** none.
- [ ] For a new screen or a redesign: a separate helper gets only the user's goal and the running page (no code, no
      explanation). It tries the 3 main tasks from the brief, and reports each task's steps, where it hesitated and
      what it misread. Each confusion point is fixed or explained.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the skill's steps and its Done-when line pass the audit's runbook
      checks; ALL PASS.

## Task 4: automated accessibility scan
**Files:** packs/gui/files/tools/screenshot.mjs
**Uses / provides:** none.
- [ ] Vet a widely used scanner (for example axe-core) and run it in the page on each shot. Contrast, missing labels and
      alt text, and keyboard-trap failures become WARN lines. If vetting fails, write a small built-in contrast and label
      check instead.
- [ ] Run `node tools/hooks/v2/selftest.mjs` with a fixture page that has a low-contrast label and an unlabeled input.
      Expected: both are reported.

## Task 5: before-and-after picture comparison
**Files:** packs/gui/files/tools/screenshot.mjs
**Uses / provides:** none.
- [ ] Keep the last approved shot per page and size in `.cache/gui-review/approved/`. Compare each new shot with it,
      and report pages that changed although this turn didn't touch them.
- [ ] Run `node tools/hooks/v2/selftest.mjs` with a fixture where an untouched page shifts. Expected: it's reported; an
      unchanged page isn't.

## Task 6: native windows and the end check
**Files:** packs/gui/files/tools/screenshot.mjs, packs/gui/files/docs/playbooks/gui.md, the gui checks
**Uses / provides:** uses Tasks 1-5.
- [ ] Native Windows apps: drive them through Windows UI Automation (list controls, invoke the safe ones), with the
      same report as the crawl. Electron and web views use the existing browser path.
- [ ] Replace the gui runbook's judgment-only item ("the main flow works") with evidence: on a changed screen, a crawl
      or an asserting flow ran in this turn and passed. Nothing is shown to the user unless it really failed.
- [ ] Run `node tools/hooks/v2/selftest.mjs`, then `node tools/audit.mjs`. Expected: ALL PASS and audit PASS. Then use
      it on one real project's GUI and report what it found.
