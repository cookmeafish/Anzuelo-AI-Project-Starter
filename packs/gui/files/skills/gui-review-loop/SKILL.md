---
name: gui-review-loop
description: Runs the mandatory visual review loop for any GUI change - takes screenshots by itself (web pages, local HTML, dev servers, desktop windows; desktop + phone, light + dark), looks at every screenshot, lists problems against a checklist, fixes them, and repeats until a full round finds nothing. Use whenever an app screen, web page, dashboard, HTML report, form or stylesheet was created or changed and is ready for review, when the Stop hook reports gui-review-loop, or when the user asks to check how something looks.
runbook: docs/playbooks/gui.md
---
# GUI review loop

The Stop hook enforces this loop. It blocks until screenshots newer than your last GUI edit exist, every one of them
has been opened with the Read tool, and the answer ends with a verdict. Any edit after a round makes that round stale,
so you must shoot again. That is the loop.

## Each round
1. **Shoot** the final state of everything you touched:
   - Static file: `node tools/screenshot.mjs --file outputs/report.html --name report`
   - App with a server: `node tools/screenshot.mjs --launch "python app.py --port {port}" --url http://127.0.0.1:{port}/ --name home`
     (a throwaway instance on a free port; it is stopped afterwards)
   - Already running somewhere you were told to use: `--url <url>`
   - A flow: `--steps .cache/flow.json` with `[{"type":"#q","text":"desks"},{"click":"#go"},{"wait":800},{"shot":"results"}]`
     (also `{"eval":"document.title"}` to check values)
   - A desktop window (Windows): `--window "<window title>" [--launch "<start command>"]`
   - The defaults are desktop 1400x900 and phone 390x844, each in light and dark. Use `--full` for long pages.
2. **Look.** Open EVERY `SCREENSHOT:` path with the Read tool. Read the `WARN` lines too (sideways scroll, console
   errors, broken images, blank page).
3. **Judge** against `docs/checks/visual-review.md`. Write the round line: `Round N: <problems seen> → <fixes>`.
4. **Fix** every problem, then start the next round. Never declare PASS from memory of an earlier round.

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
