---
name: perf
summary: Make something faster or smoother - measure before, change, measure after with the same tool, on the user's real conditions
triggers: slow, laggy, choppy, stutter, performance, faster, speed up, optimize, freezes, takes too long, memory usage, fps, frame rate, load time, takes forever, taking forever, janky, hangs, sluggish, so sluggish, so slow, lags, my ram, ram usage
menu: A5
---
# Playbook: performance

## Steps
1. **Measure before**, with a fixed, repeatable tool or script, on conditions that match the user's: their screen,
   refresh rate, data size, device. Write the numbers down.
2. **Find the real cost** (profile; don't guess). If smoothing the pipeline doesn't change what the user sees,
   question the content itself.
3. **Change one thing at a time.** Follow the performance rules in `docs/checks/app-standards.md`.
4. **Measure after** with the same tool. Keep the change only if the numbers improve and nothing else regresses.
5. **Verify the experience** in the real app (the gui-review-loop from the gui pack for anything visible).

## Done when
- [ ] The answer gives before and after numbers from the same tool (hook: perf-numbers), plus what was changed and why.
