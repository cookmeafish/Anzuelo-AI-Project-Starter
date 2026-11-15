---
name: gui
summary: Build or change anything visual (an app screen, web page, dashboard, HTML report, form) and prove it looks right with the screenshot review loop
triggers: gui, user interface, dashboard, web page, webpage, layout, styling, css, look nicer, look better, more modern, user friendly, user-friendly, mobile view, dark mode, light mode, redesign the screen, how it looks, screenshot the page, screenshot the screens, take screenshots, restyle, appearance, look and feel, looks bad, looks off, looks ugly, looks wrong, colours, too small, hard to read, fonts, button size, on my phone, on mobile, cramped, visuals, cluttered, misaligned, overlaps, ugly
trigger_regex: \b(look|looks|make [\w' ]{0,30}) prettier\b
menu: U1
checks: core: gui-review-loop, gui-review-report, gui-warnings, gui-flows
---
# Playbook: build or change a GUI

**Use when:** anything a person will look at changes: app screens, web pages, dashboards, HTML deliverables, forms,
styles. **The loop is mandatory.** The Stop hook (REQ: gui-review-loop, gui-review-report, gui-warnings, gui-flows)
blocks the answer until fresh screenshots of the final state were taken AND looked at, and the answer gives a verdict.

## Inputs
- Who uses it and what they need to get done (docs/BRIEF.md). A first-time user should know what to do without help.
- What the user asked for and why, and earlier GUI preferences (AGENTS.md standing preferences,
  docs/checks/user-requirements.md).

## Steps
If the project enabled the **frontend-design** library skill, use it for the design decisions before building; this
runbook and the gui-review-loop then prove the result.
1. **Read before changing:** the files involved, how the app runs (README or tools/), and existing styles and components.
   Reuse them; don't fork a second design system.
2. **Make the change.** Plain words in the main UI, options shown progressively (main task first, details behind
   expanders). Support both themes, phone width without sideways scrolling down to 320 CSS px, text enlarged to 200%
   without losing content, keyboard use with a visible focus, contrast of at least 4.5:1 for text (3:1 for large text,
   icons and borders), and touch targets of at least 44x44 px on phone (WCAG minimum 24x24).
3. **Run the review loop:** follow the **gui-review-loop** skill (`skills/gui-review-loop/SKILL.md`) until a full
   round finds nothing.
4. **Test behaviour, not just looks:** drive the main flow with `--steps` (type, click, check the result with `eval`).
   Save a flow worth repeating as `docs/checks/flows/<page>.json`; every later change to that page reruns it
   (`node tools/screenshot.mjs --flows --pages <page>`). Syntax-check the scripts you changed (`node --check <file>`
   for JS, otherwise the project's linter).
   **A new feature starts from its plan's `## User journey`** (plan skill, step 3: fresh sub-agents in parallel, one
   angle each, merged), and ends with a fresh agent walking the built app against every item (`# Journey walk` in
   `docs/reviews/`, each pass, fail or missing, with a `## Quality verdict` from an independent judge of real outputs
   in the user's real setup; fails fixed before done). A device feature (mic, camera, speech, audio) is proven in the
   user's active mode, language and provider, never the developer's defaults.
   **A new mode, screen or flow gets its journey walked**, each step with a shot or a test: get in from where a user
   starts, get out, switch to each sibling mode and back with progress kept, what the app opens on at the next launch,
   and what a user with saved data from before sees. Then list 5 things a first-time user would try next on the new
   screen, and check each. <!-- Lesson (a project, 2026-11-15): a new mode was built and shot, but nobody walked the
   way out to its sibling mode, and the user had to point it out. -->
5. **Answer** with one line: `Visual review: PASS after N rounds - <what the rounds fixed>`. That line can be the
   only place the rounds appear. Tell the user how to see it (restart the app, or open the file).

## Done when
- [ ] Fresh screenshots of the final state, taken after the last edit, all opened and looked at (hook: gui-review-loop).
- [ ] "Visual review: PASS after N rounds" in one line; tool warnings fixed or explained (hook: gui-review-report, gui-warnings) (answer: Visual review:\**\s*\**[A-Z]+ after [0-9]+ rounds?)
- [ ] A new mode, screen or flow has its journey in a `Journey:` line, each step with its shot or test (enter, leave,
      switch to each sibling and back with state kept, relaunch, a user with saved data), or says which was not walked (when answer: \bnew (mode|screen|flow|view|page)\b) (answer: Journey:)
- [ ] The main flow works when driven, not just when looked at (judgment: which flow is the main one, and that it works, needs a person to drive it).
- [ ] Every saved flow of a changed page (docs/checks/flows/<page>.json) was rerun in the last round (hook: gui-flows).

## Pitfalls
- Declaring it done from the code alone. Layout bugs only show up in the picture.
- Screenshotting only desktop/light. Phone width and dark mode are where most breakage hides.
