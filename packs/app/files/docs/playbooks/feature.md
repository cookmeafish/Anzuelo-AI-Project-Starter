---
name: feature
summary: Build a new feature or change behaviour - spec with acceptance criteria, written plan, build, triple-check QA, independent review, release notes
triggers: add a feature, new feature, implement, make it so, i want the app to, add support for, change how, new screen, new mode, new option, new setting, feature request, refactor, rename the function, rename the variable, rename the app, restructure, clean up the code, login, sign in, sign up, endpoint, rate limiting, add a column, new page, add a page, index page, add a section, add sorting, sort by, add a filter, add search, new field, new endpoint, add a button, add an option, add a setting, token expiry
trigger_regex: \b(let|allow) (users|people|customers|members|me)\b|\b(should|could) be able to\b|\ba way to\b|\b(it'?d|it would) be (nice|great|cool|good) if\b|\badd (a|an) (search|filter|sort|export|toggle|tab|field|button)\b|\bmake the app (remember|show|save|send|support|handle|keep|accept|let|do)\b
menu: A1
---
# Playbook: build a feature

**Use when:** the app should do something new or behave differently. **Not when:** something is broken (`bugfix.md`),
only speed changes (`perf.md`), or only the look changes (`gui.md`, gui pack). Screens changed here still go
through the gui-review-loop.

## Inputs
- What the user asked for and why, earlier preferences (AGENTS.md, `docs/checks/user-requirements.md`) and
  `docs/lessons.md`.
- Which parts of the code it touches, and the existing patterns there.

## Steps
**A small change** (up to 3 files and 40 edited lines: a label, a guard, one option): test it and check it in the real
app, then answer. Skip the spec, plan, review, verification section, release notes and version bump; the hooks don't
ask for them (REQ: small-change). Lesson: simple fixes took 20 minutes of a feature's ceremony.

Always: the **modular-code** skill (`skills/modular-code/SKILL.md`): the feature in its own module with one public entry,
names from `docs/names.json`, settings from config, an extension point when there will be "more of these". Library
skills, when the project has them: **frontend-design** for screens, **backend-patterns** for server code,
**mcp-builder** for an MCP server.
1. **Spec** in `docs/specs/<feature>.md` (copy `docs/specs/_TEMPLATE.md`):
   - what the user wants and why, as principles in your own words, dated;
   - numbered acceptance criteria (each one PASS/FAIL-able);
   - out of scope, edge cases, data touched;
   - for taste-driven work, a gold-standard example and anti-examples.

   Ask ONE question if a criterion can't be written without guessing. With `"autonomy": "auto"` (the user asked not to
   be asked) don't ask: take the safest choice (the narrower permission, the reversible change), write it into the spec
   as `Assumed: <choice> - <why> - <cost if wrong>`, build it, and name it in the answer.
2. **Plan:** for work with several tasks, use the plan skill (`docs/plans/`). Otherwise plan in the spec: the
   smallest set of changes, one sentence per part, what must be preserved, and how each criterion will be verified.
   A feature that adds a service, a data store or a new API, or crosses many modules, gets designed first (the
   **architecture** skill, part B, when enabled). Pick its tests by `qa.md` §4.
3. **Build test first, one thin slice at a time.** A slice is one behaviour carried through every layer it needs
   (screen, logic, storage), small enough to finish and check on its own. For each slice:
   - **Red:** a failing test first, for one acceptance criterion or edge case from the spec. Run it and see it fail
     for the reason you expect (the same bar as the debug skill's Phase 4). A test that passes at once proves nothing.
   - **Green:** the least code that makes it pass. Run it, then the rest of the suite.
   - **Refactor:** tidy names and remove duplication while every test stays green. No new behaviour here.

   Then the next slice. Follow `docs/checks/app-standards.md` (data safety, security, UX, surgical changes). Where an
   automated test truly can't be written (pure layout, a one-off script), say so and use the closest check instead.
4. **Triple check** (`docs/checks/qa-standards.md`):
   - (1) automated: tests, build, lint and checks pass after the last edit;
   - (2) the real app, isolated, every state touched (screens through the gui-review-loop);
   - (3) an independent review against the acceptance criteria until it says SHIP. With no person at hand, the
     reviewer is a sub-agent (the Agent or Task tool) with a read-only brief; "no other reviewer" is never a reason to
     skip it (hook: review-excuse). Wait for its verdict in the same turn: never end the turn with "I'll finish once it
     comes back" (the user gets an unfinished answer, then a second one).
5. **Docs that people rely on,** updated in the same change, each written for its reader with the most useful part
   first:
   - the README, when setup, configuration or the first steps change (a newcomer reaches a first success in minutes);
   - the API reference, for each new or changed endpoint: a request and response example, sign-in, error codes,
     limits and paging;
   - any runbook or setup note that describes the old behaviour.

   Link to a doc instead of copying it, and delete text that is no longer true.
6. **Release notes** in `docs/releases/<version or date>.md` (copy `docs/releases/_TEMPLATE.md`): what changed, how to
   try it fast, and how to try it for real.
7. **Version** bump as configured, then commit on the work branch. Where `approvalPaths` apply, show Before / Now and
   get the user's OK first.

## Done when
- [ ] A spec with numbered acceptance criteria exists and each criterion is marked PASS in it; the answer gives the count in one line and names any that failed (hook: spec-written).
- [ ] The Verification section covers automated, real app, independent review (SHIP) and still weak (hook: verification-report, review-verdict).
- [ ] New behaviour was built test first: each slice's test was seen failing before its code, and the whole suite passes after the last edit (judgment: no check sees each test fail before its code).
- [ ] Release notes written; version bumped as configured (hook: release-notes, version-bump).
- [ ] Docs that described the old behaviour were updated, or the answer says none did (judgment: which docs described the old behaviour needs reading them).
- [ ] Every new option, flag, setting or command the user can type is in the README or the user docs with what it does, and in `--help` for a CLI (judgment: what counts as user-facing needs reading the change). <!-- Lesson, trial round 15: --dry-run shipped without a README entry, and the user had to complain. -->

## Pitfalls
- Declaring done from the code or from one screenshot. Verify in the real app, every state.
- Checking only the criterion from the latest complaint. Check them all.

Ideas in steps 2 and 5 come from the system-design, testing-strategy and documentation skills of
anthropics/knowledge-work-plugins (Apache-2.0).

Credits: the test-first slices in step 3 draw on "tdd" in mattpocock/skills (MIT) and "test-driven-development" in
obra/superpowers (MIT).
