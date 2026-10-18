---
name: gui
summary: Build or change anything visual (an app screen, web page, dashboard, HTML report, form) and prove it looks right with the screenshot review loop
triggers: gui, ui, user interface, dashboard, web page, webpage, layout, styling, css, looks, look nicer, look better, more modern, user friendly, user-friendly, mobile view, dark mode, light mode, redesign the screen, how it looks
menu: U1
checks: core: gui-review-loop, gui-review-report, gui-warnings
---
# Playbook: build or change a GUI

**Use when:** anything a person will look at changes: app screens, web pages, dashboards, HTML deliverables, forms,
styles. **The loop is mandatory.** The Stop hook (REQ: gui-review-loop, gui-review-report, gui-warnings) blocks the
answer until fresh screenshots of the final state were taken AND looked at, and the answer gives a verdict.

## Inputs
- Who uses it and what they need to get done (docs/BRIEF.md). A first-time user should know what to do without help.
- What the user asked for and why, and any earlier GUI preferences (AGENTS.md standing preferences,
  docs/checks/user-requirements.md).

## Steps
If the project enabled the **frontend-design** library skill, use it for the design decisions before building. This
runbook and the gui-review-loop then prove the result.
1. **Read before changing:** the files involved, how the app runs (README or tools/), and existing styles and components.
   Reuse them; don't fork a second design system.
2. **Make the change.** Keep it to plain words in the main UI and show options progressively (main task first, details
   behind expanders). Support both themes, phone width without sideways scrolling, keyboard use, and readable contrast.
3. **Run the review loop** (gui-review-loop skill):
   1. Screenshot every screen or state you touched with `node tools/screenshot.mjs`: desktop + phone, light + dark. For
      a server app, use `--launch "<start command with {port}>" --url http://127.0.0.1:{port}/` so it gets its own
      instance on a free port, never the user's running one. For flows, use `--steps`. For a desktop window, use
      `--window "<title>"`.
   2. Read EVERY screenshot. List what is wrong, using `docs/checks/visual-review.md`.
   3. Fix, and go back to 1. Stop only when a full round finds nothing, or at 10 rounds (report what is left).
4. **Test behaviour, not just looks:** drive the main flow with `--steps` (type, click, check the result with `eval`).
   Syntax-check the scripts you changed.
5. **Answer** with a "Visual review" section: one line per round (what you saw, what you fixed), then
   `Visual review: PASS after N rounds`. Tell the user how to see it (restart the app, or open the file).

## Done when
- [ ] Fresh screenshots of the final state, taken after the last edit, all Read (hook: gui-review-loop).
- [ ] "Visual review: PASS after N rounds" with a line per round; tool warnings fixed or explained (hook: gui-review-report, gui-warnings).
- [ ] The main flow works when driven, not just when looked at.

## Pitfalls
- Declaring it done from the code alone. Layout bugs only show up in the picture.
- Screenshotting only desktop/light. Phone width and dark mode are where most breakage hides.
