---
name: app-foundation
summary: Set the app's foundation with the user before feature work - security baseline, performance budgets with numbers, usability and friendliness defaults, quality gates - then build the scaffolding that enforces them
triggers: foundation, from the ground up, secure from the start, security baseline, performance budget, budgets, usability baseline, user friendly from the start, set up the app, new app, start the app, scaffold, architecture, tech stack
menu: A0
---
# Playbook: the app's foundation

**Use when:** setting up an app project (SETUP-PROMPT Phase 3, before Phase 4), starting a new app, or when the user
wants the security, performance or usability baseline revisited. Run it before the first feature.

## Steps
1. **Read** `docs/BRIEF.md`, `docs/security.md` (the project-wide baseline; section 1 adds only app rows),
   `docs/checks/app-standards.md` and the existing code (if any).
2. **Propose** a filled-in `docs/foundation.md`: a sensible default for every row, based on the brief and the stack,
   each with a one-line reason. Ask the user to confirm or change it in ONE message. Use real numbers for the budgets.
3. **Write** the confirmed values into `docs/foundation.md`, set `status: set YYYY-MM-DD`, and record the key choices
   in `docs/DECISIONS.md`.
4. **Build the scaffolding that enforces it,** so the foundation holds without anyone remembering it:
   - **Security:**
     - `.gitignore` covers every secret file;
     - a local server binds to loopback and checks Host and Origin (with a test that a cross-origin request is refused);
     - a path-safety helper and a sanitizer helper (each with a test);
     - the dependency audit command recorded in section 4.
   - **Performance:** a small, repeatable measurement script for the section 2 budgets (prints the numbers and
     `RESULT: PASS`/`FAIL` against the targets), wired into `tools/hooks/requirements.json` with `toolPassed` + `selfRun`
     for `perf.md` and `release.md`.
   - **Usability:** a design-token file (colours, spacing, type) with both themes, shared components for the empty,
     loading and error states and for confirm/undo, and an i18n layer if the app will be translated. Add a contrast
     check if the stack allows it.
   - **Layout and the start file:** organize the code into folders (docs/checks/layout-standards.md) and create ONE
     obvious start file in the root (e.g. `Start <App>.bat` plus `start.sh`) that calls `scripts/`. The README's first
     instruction points at it.
   - **Gates:** `node tools/packs.mjs configure app --test "<cmd>" --build "<cmd>" --code "<globs>"` (add `--lint`,
     `--typecheck` and `--version-file` where they apply), plus `codeRules` for the project's own forbidden patterns.
5. **Verify:** each new test and script runs and passes. Screens go through the gui-review-loop (gui pack).

## Done when
- [ ] `docs/foundation.md` has no `<...>` left and `status: set` (hook: foundation-set, and the setup gate).
- [ ] The security tests, the budget script and the gates exist and pass. The answer lists each one with its result.
