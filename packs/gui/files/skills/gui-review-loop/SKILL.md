---
name: gui-review-loop
description: Runs the mandatory visual review loop for any GUI change - takes screenshots by itself (web pages, local HTML, dev servers, desktop windows; desktop + phone, light + dark), looks at every screenshot, lists problems against a checklist, fixes them, and repeats until a full round finds nothing. Use whenever an app screen, web page, dashboard, HTML report, form or stylesheet was created or changed and is ready for review, when the Stop hook reports gui-review-loop, or when the user asks to check how something looks.
runbook: docs/playbooks/gui.md
---
# GUI review loop

The Stop hook enforces this loop. It blocks until screenshots newer than your last GUI edit exist, every one has
been opened, and the answer gives a verdict. Any edit after a round makes that round stale: shoot again.

## Each round
1. **Shoot** the final state of everything you touched:
   - Static file: `node tools/screenshot.mjs --file outputs/report.html --name report`
   - App with a server: `node tools/screenshot.mjs --launch "python app.py --port {port}" --url http://127.0.0.1:{port}/ --name home`
     (a throwaway instance on a free port; it is stopped afterwards)
   - Already running somewhere you were told to use: `--url <url>`
   - A flow: `--steps .cache/flow.json` with `[{"type":"#q","text":"desks"},{"click":"#go"},{"wait":800},{"shot":"results"}]`
     (also `{"eval":"document.title"}` to check values)
   - **Saved flows:** a flow worth keeping goes in `docs/checks/flows/<page>.json`, named after the page file it drives
     (`index.json` for `site/index.html`), as a steps list or `{"page": "<url or file>", "steps": [...]}`. Every round
     reruns the saved flows of the pages you touched: `node tools/screenshot.mjs --flows --pages index,settings`
     (plus `--url` or `--file` when a flow has no `"page"`). The Stop hook asks for it (hook: gui-flows).
   - A desktop window (Windows): `--window "<window title>" [--launch "<start command>"]`
   - A mobile app on an emulator or simulator: save each shot as a PNG in `.cache/gui-review/` (the hooks look there):
     Android `adb exec-out screencap -p > .cache/gui-review/home-phone.png`, iOS
     `xcrun simctl io booted screenshot .cache/gui-review/home-phone.png`, Flutter `flutter screenshot -o .cache/gui-review/home-phone.png`.
     Shoot a small and a large screen, light and dark, and the states you changed (empty, loading, error, offline).
   - The defaults are desktop 1400x900 and phone 390x844, each in light and dark. Use `--full` for long pages.
2. **Look.** Open each `SHEET:` image (a contact sheet: up to 8 screenshots of the round, captioned); with no sheet,
   open every `SCREENSHOT:` image. Open a single screenshot full size only to check a detail the sheet can't show
   (small text, a 1-pixel border). Read the `WARN` lines too (sideways scroll, console errors, broken images, blank
   page). Each image you open stays in the conversation and is sent again with every later step, so open what you need.
3. **Judge** against `docs/checks/visual-review.md`. Write the round line: `Round N: <problems seen> → <fixes>`.
   A screenshot can't show keyboard use or what a screen reader says. If the project enabled the frontend-design
   skill, its section E (accessibility review) covers those, and section B is the deeper design critique.
4. **Fix** every problem, then start the next round. Never declare PASS from memory of an earlier round.
   A fix round shoots again only what the fix could change: the pages and states it touched, at all four looks (a
   change to a shared stylesheet, layout or component touches every page that uses it). Pages a fix could not reach
   keep their last round's verdict. <!-- Lesson, trial rounds 14 and 15: every round re-shot and re-read the whole
   flow, 292 image reads over three turns, six rounds for one new page. -->
   A preview server you start yourself listens on 127.0.0.1 only, and is stopped before the answer (`--launch` does
   both). <!-- Lesson, trial round 15: an `eleventy --serve` left running on all network addresses stayed reachable
   from the network, and its old pages were what the user later saw on port 8080. -->

## Ending
- **PASS:** a full round found nothing and printed no WARN (or each WARN is explained: "warnings accepted: ..."). Write
  `Visual review: PASS after N rounds`.
- **STOPPED:** only after 10 rounds. Write `Visual review: STOPPED after N rounds - remaining: ...` and tell the user
  what is left.

## Safety
`tools/screenshot.mjs` only drives Playwright's bundled Chromium, with a throwaway profile and no OS password store.
It never drives the installed Chrome or Edge (on some Windows machines, automating them triggers failed sign-ins that
lock the account). If the bundled browser is missing, ask the user to run `npx playwright install chromium-headless-shell`.
Never type into a Windows Security or sign-in prompt.
