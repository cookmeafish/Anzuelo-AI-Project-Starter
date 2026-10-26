# QA standards ("done" means verified)

QA runs on every change, unasked. When the user says "QA" about delivered work, QA already failed: run the incident
procedure (`docs/playbooks/qa.md` §1).

## The triple check (every change)
1. **Automated:** tests, build, lint/typecheck and the project's own check scripts pass, run AFTER the last edit
   (hooks: app-<gate>-pass, set up by `node tools/packs.mjs configure app`, and commit-gate). An earlier green run
   doesn't count.
2. **The real thing:** run the app in an isolated instance (its own port and data, never the user's running one) and
   exercise what changed:
   - desktop and phone width, both themes, a couple of zoom levels;
   - every state touched: empty, loading, error, long text, many items, first run;
   - look at every screenshot (gui-review-loop, from the gui pack when the app has screens).

   Logic with no screen gets a scripted run with real inputs instead.
3. **Independent review:** a fresh agent that did not write the change, given the user's intent and the acceptance
   criteria, read-only. It takes its own screenshots and runs, checks the maker's claims against reality, and writes
   a PASS/FAIL table plus a verdict, **SHIP** or **FIX**, to `.cache/reviews/<date>-<topic>.md`. FIX → fix → review again.
   For code, the reviewer also reads the diff through the lenses in `docs/playbooks/qa.md` §3.

## The answer's Verification section (hook: verification-report)
```
## Verification
- Automated: <commands> → <results>
- Real app: <what was exercised, screenshot paths>
- Budgets: <only when the change can affect speed or size: still within docs/foundation.md, with numbers>
- Independent review: <SHIP/FIX, file path>
- Still weak: <what isn't verified or could still be wrong>
```
The Finished section's "Not done or not checked" list counts as Still weak, so the answer says it once. Lesson: answers
carried a "Speed: not affected" line for every change and listed the same gaps twice.

## Judge it the way the user will see it
- Check the exact screen and flow the user will open, not a close-up or a dev page.
- Write PASS/FAIL for EVERY acceptance criterion and standing preference, never only the one from the latest complaint.
- Checks gate the work but never prove quality: a change can pass every check and still be wrong. When a fix doesn't
  change what the user sees, question the content, not just the pipeline.
- Before claiming a bug exists, reproduce it and show the evidence. Retract false findings openly.

## Subjective and taste-driven work (visuals, copy, game feel)
- Spec first: what the user wants and why, a gold-standard example, and anti-examples (versions that were rejected and why).
- Plan in writing before making: one sentence per unit of the intent, and what must be preserved.
- Build on the version the user picked: change it step by step instead of starting over, and keep every detail that
  made it good. A redesign adds polish; it never strips the work down.
- One unit at a time. No parallel waves of redesigns.
- At least 3 self-review rounds (render → written critique → fix) before anyone else looks.
- Show Before and Now side by side. Paths in `approvalPaths` need the user's OK before commit (hook: approval-gate).

## Interrupted work (limit, crash, compaction)
Before resuming: run `node tools/integrity-check.mjs` (files complete and well-formed), the tests, and a fresh
screenshot. Re-read the request and the spec: resumed work drifts toward finishing instead of toward what was asked.

## Every failure becomes a lesson
One line in `docs/lessons.md` per rejected result or escaped bug: what happened → the rule or check it created. Add an
automated check the first time a measurable complaint happens.
