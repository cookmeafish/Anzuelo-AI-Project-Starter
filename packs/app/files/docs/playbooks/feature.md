---
name: feature
summary: Build a new feature or change behaviour - spec with acceptance criteria, written plan, build, triple-check QA, independent review, release notes
triggers: add a feature, new feature, build a, implement, make it so, i want the app to, add support for, change how, new screen, new mode, new option, new setting, feature request
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
Library skills, when the project has them: **frontend-design** for screens, **backend-patterns** for server code,
**mcp-builder** for an MCP server.
1. **Spec** in `docs/specs/<feature>.md` (copy `docs/specs/_TEMPLATE.md`):
   - what the user wants and why, as principles in your own words, dated;
   - numbered acceptance criteria (each one PASS/FAIL-able);
   - out of scope, edge cases, data touched;
   - for taste-driven work, a gold-standard example and anti-examples.

   Ask ONE question if a criterion can't be written without guessing.
2. **Plan:** for work with several tasks, use the plan skill (`docs/plans/`). Otherwise plan in the spec: the
   smallest set of changes, one sentence per part, what must be preserved, and how each criterion will be verified.
3. **Build** in small steps. Follow `docs/checks/app-standards.md` (data safety, security, UX). New logic gets tests,
   including the edge cases from the spec.
4. **Triple check** (`docs/checks/qa-standards.md`):
   - (1) automated: tests, build, lint and checks pass after the last edit;
   - (2) the real app, isolated, every state touched (screens through the gui-review-loop);
   - (3) an independent review against the acceptance criteria until it says SHIP.
5. **Release notes** in `docs/releases/<version or date>.md` (copy `docs/releases/_TEMPLATE.md`): what changed, how to
   try it fast, and how to try it for real.
6. **Version** bump as configured, then commit on the work branch. Where `approvalPaths` apply, show Before / Now and
   get the user's OK first.

## Done when
- [ ] A spec with numbered acceptance criteria exists and each criterion is PASS in the answer (hook: spec-written).
- [ ] The Verification section covers automated, real app, independent review (SHIP) and still weak (hook: verification-report, review-verdict).
- [ ] Release notes written; version bumped as configured (hook: release-notes, version-bump).

## Pitfalls
- Declaring done from the code or from one screenshot. Verify in the real app, every state.
- Checking only the criterion from the latest complaint. Check them all.
