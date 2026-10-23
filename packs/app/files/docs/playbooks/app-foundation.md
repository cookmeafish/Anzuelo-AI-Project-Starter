---
name: app-foundation
summary: Set the app's foundation with the user before feature work - security baseline, performance budgets with numbers, usability and friendliness defaults, quality gates - then build the scaffolding that enforces them
triggers: foundation, from the ground up, secure from the start, security baseline, performance budget, budgets, usability baseline, user friendly from the start, set up the app, new app from scratch, scaffold the app, start a new app, new web app, groundwork, from nothing
menu: A0
---
# Playbook: the app's foundation

**Use when:** setting up an app project (SETUP-PROMPT Phase 3, before Phase 4), starting a new app, or when the user
wants the security, performance or usability baseline revisited. Run it before the first feature.

## Steps
1. **Read** `docs/BRIEF.md`, `docs/security.md` (the project-wide baseline; section 1 adds only app rows),
   `docs/checks/app-standards.md` and the existing code (if any).
2. **Propose** a filled-in `docs/foundation.md`: a default for every row, based on the brief and the stack, each with
   a one-line reason and real numbers for the budgets. Ask the user to confirm or change it in ONE message, following
   "Questions with choices" in `docs/checks/writing-standards.md`:
   - first say what the foundation is: "the app's ground rules for safety, speed and ease of use, which every later
     change is checked against";
   - then one line per default, in everyday terms, with why it suits this project: "Page size under 2 MB, so the
     guide opens in about a second on a phone";
   - offer "Let the AI decide".
3. **Write** the confirmed values into `docs/foundation.md`, set `status: set YYYY-MM-DD`, and record the key choices
   in `docs/DECISIONS.md`. **Who may do what** gives every destructive or sensitive action (delete, money, settings,
   other people's data) to the owner, unless the user named the role and granted it. Don't invent roles that carry
   such rights ("a manager may delete"), not even under `"autonomy": "auto"`: a permission is a security decision, so
   write "the owner only until you decide" and ask (or list it as an open question). A grant the user made is
   recorded in the row ("the user decided YYYY-MM-DD"). The setup gate refuses any other grant. Lesson: three setups
   of the same API made up a "manager" role that could delete, and the user complained each time.
4. **Shape it to grow** with the **modular-code** skill, section A: pick the module layout for the stack, make the
   config module and the names module (read from `docs/names.json`) first, and write the extension points into the
   Modules row of `docs/foundation.md`.
5. **Build the scaffolding that enforces it,** so the foundation holds without anyone remembering it:
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
     instruction points at it. A PowerShell script the user runs with `powershell` works in Windows PowerShell 5.1
     (the pitfalls are in `docs/playbooks/install-update.md`, Rules), or the instruction says `pwsh`.
   - **Gates:** `node tools/packs.mjs configure app --test "<cmd>" --build "<cmd>" --code "<globs>"` (add `--lint`,
     `--typecheck` and `--version-file` where they apply), plus `codeRules` for the project's own forbidden patterns.
6. **Verify:** each new test and script runs and passes. Every step the answer gives the user (a setup script, the
   start file) ran here the way the user is told to, or the answer says "NOT VERIFIED: <what> - <why>" for it (hook:
   instructions-run). Screens go through the gui-review-loop (gui pack).

## Done when
- [ ] `docs/foundation.md` has no `<...>` left and `status: set` (hook: foundation-set, and the setup gate).
- [ ] Destructive and sensitive actions belong to the owner, or to a role the user granted them, recorded in the row (hook: setup-gate).
- [ ] The security tests, the budget script and the gates exist and pass. The answer lists each one with its result (hook: foundation-set for the list; judgment: that each one passes).
