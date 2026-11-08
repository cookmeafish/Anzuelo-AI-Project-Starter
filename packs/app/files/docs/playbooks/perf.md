---
name: perf
summary: Make something faster or smoother - measure before, change, measure after with the same tool, on the user's real conditions
triggers: slow, laggy, choppy, stutter, performance, faster, speed up, optimize, freezes, takes too long, memory usage, fps, frame rate, load time, takes forever, taking forever, janky, hangs, sluggish, so sluggish, lags, my ram, ram usage
menu: A5
---
# Playbook: performance

**Use when:** something is slow, laggy or heavy but gives the right result. **Not when:** it gives a wrong result,
crashes or hangs for good (`bugfix.md`).

## Steps
1. **Measure before**, with a fixed, repeatable tool: the project's budget script if it exists (made by
   `app-foundation.md`), else your own script. Use conditions that match the user's (their screen, refresh rate, data
   size, device); if unknown, use the `docs/foundation.md` section 2 budgets and say so. Run each measurement at least 5 times and write down the median and the
   spread (lowest to highest); for real-user page metrics use the 75th percentile.
   Measure what the user waits for, end to end (the real command on real-sized input, a real page load), not an inner
   function: a PASS on part of the path says nothing about the rest.
2. **Find the real cost** (profile; don't guess). If smoothing the pipeline doesn't change what the user sees, check
   the content: data size, image size, item count. Report what you find as an option.
3. **Change one thing at a time.** Follow the performance rules in `docs/checks/app-standards.md`.
4. **Measure after** with the same tool and the same input size. Keep the change only if the numbers improve (by more
   than the run-to-run spread) and nothing else gets slower. Stop when the `docs/foundation.md` budget is met.
5. **Verify the experience** in the real app (the gui-review-loop from the gui pack for anything visible).

## Done when
- [ ] The answer gives before and after numbers from the same tool (hook: perf-numbers) (answer: \d+\s?ms|\d+\s?MB|\d+\s?fps|\d+\s?s\b), plus what was changed and why.
- [ ] Before and after use the same command and input size, and the answer says whether anything else got slower (judgment: needs the numbers).
