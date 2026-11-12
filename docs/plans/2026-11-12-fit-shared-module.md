---
status: done
---
# Plan: the fit checklist in one shared module, so v2 needs nothing from the old engine

Goal: engine v2 runs the fit checklist (at the request and after files are added) from a shared module that both engines
import. v2 takes no function from hooks-main.mjs. Behaviour stays exactly as it is now.

Why: the v2 port of the fit checklist (c58c058) works by passing the old engine's fitDueByRequest and fitProblems into
v2 from hooks-main.mjs. Phase B makes v2 stand alone, so the old engine can be retired; a function passed in from it ties
v2 to it (oversight, 2026-11-12).

Related: [engine v2 only](2026-11-07-engine-v2-only.md), [temp hygiene](2026-11-11-temp-hygiene.md).

## What moves
The fit section of tools/hooks/hooks-main.mjs (from "fit checklist: every candidate decided" to the plans section, about
310 lines), with projectSurvey, fitDueByRequest, findLibrary and starterSources, and the small helpers they use
(frontmatter, splitList), about 400 lines. Into tools/hooks/fit.mjs. hooks-main.mjs imports them back and re-exports
them, so tools/fit.mjs, the audit and the old engine keep their imports.

## Budget
The shared-module ceiling (base, v2 self-test "size") is at 3,500 of 3,500. Code moved out of hooks-main.mjs raised it
before (proof, trace, launchers); this move raises it by the moved lines only, with the reason in docs/DECISIONS.md.
First trim: helpers duplicated between v2 and the shared modules.

## Tasks
- [x] 1. List every name the fit section uses from the rest of hooks-main.mjs. All came from settings.mjs, paths.mjs and
      near.mjs except envOf, section, CONFIG (small copies in fit.mjs) and the old router `route`.
- [x] 2. tools/hooks/fit.mjs holds the moved code (404 lines, 46 declarations). hooks-main.mjs imports 27 names back and
      re-exports the 25 it exported. fitDueByRequest takes its matcher as an argument: the old engine passes its router,
      v2 uses fit.mjs's own triggerMatch (all key words present, close together).
- [x] 3. v2 start.mjs and fitstale.mjs import from fit.mjs; hooks-main.mjs passes nothing in.
- [x] 4. v2 test: no v2 file imports hooks-main.mjs, and onPrompt and onStop get nothing passed in.
- [x] 5. fit-checklist tag 17/17 under both engines; v2 self-test 368/0 with its speed test; audit PASS; fit.mjs in the
      engine lists, the proof hash and the fixtures; tools/fit.mjs check and tools/survey.mjs run.
- [x] 6. Base ceiling raised by the moved lines, 3,500 to 3,950, the reason in the ceiling's own comment (v2/selftest.mjs,
      where earlier raises are recorded; docs/DECISIONS.md is the template projects copy). Trimming duplicated helpers
      is left for Phase B's module split.
