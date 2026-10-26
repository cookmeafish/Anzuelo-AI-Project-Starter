---
name: efficiency-review
description: Finds where this project's turns spend time and tokens, from its own sessions, and traces each cost to what asks for it - a project rule in CLAUDE.md, a runbook step, a project hook or check, or the starter's engine. Proposes changes ranked by the time they save, each with what it would lose, changes the project's own rules only with the user's OK, and sends engine costs back to the starter. Use when the user says the project is slow, wasteful, does too many sweeps or checks, takes too long for small fixes, burns tokens, repeats work, or asks why something takes so long.
checks: none - its evidence is the report command's output, and tracing costs to their sources and weighing what a change loses are judgment
triggers: too slow, so slow, takes too long, taking too long, took too long, too many sweeps, so many sweeps, too many checks, wasting tokens, waste of tokens, token waste, inefficient, efficiency, efficient, too long for, 20 minutes, redundant, doing things twice, over and over, why does it take, why is it slow, speed it up, make it faster, lento, muy lento, tarda mucho, demasiado tiempo, demasiadas comprobaciones, gasta tokens, ineficiente, redundante
---
# Efficiency review: find what makes turns slow, and who asks for it

The user pays for every step in time and tokens. A rule that runs four minutes of sweeps after a one-line fix costs
that every time, and the user can't see why. Measure first, then trace each cost to the file that asks for it.

## Steps
1. **Measure** the recent turns: `node skills/efficiency-review/scripts/efficiency.mjs --turns 30` (more turns for a
   wider view). It reads this project's own sessions and prints the turns in numbers, the slowest commands with the
   files that name them, steps done again with nothing changed, records edited on most turns, and the end-of-answer
   blocks and steps by source (the starter's engine, or the project's own hooks).
2. **Trace each big cost to its source.** Open the lines the report names (`CLAUDE.md:128`, a runbook step, a check in
   the project's hook) and say, for each: what it runs, when (after every change, or only some), how long, and what it
   protects against. A cost from the starter's engine (`tools/hooks/hooks.mjs`, its checks) is the starter's to fix:
   `node tools/starter.mjs feedback "<cost, evidence, what would fix it>"`, then `report`.
3. **Propose changes, ranked by the time they save**, one line each: the change, the minutes saved per turn (from the
   report), and what is lost. Prefer, in order:
   - **Scope a check to what it guards:** a sweep that runs after every change runs only when its files change (a GUI
     sweep after GUI changes, data checks after data changes).
   - **Proportion:** a small fix (a few files and lines) skips the heavy sweeps and records; the full set runs before a
     release or on request.
   - **Run once:** one run at the end of a batch of edits, not after each edit; never a second run with nothing changed.
   - **Merge duplicates:** two checks or records that say the same thing become one.
   - **Make it a tool:** a step the agent rebuilds by hand each time becomes one command.
   Never propose dropping a check that guards correctness, security or the user's data without saying so plainly.
4. **Ask the user** which to apply: the project's rules are theirs. With `"autonomy": "auto"`, apply the ones that lose
   nothing and list the rest as questions.
5. **Apply** each approved change at its source (the rule, the runbook step, the hook's condition), with its tests, and
   a CHANGELOG line. Then **measure again** after a few turns and report before and after.

## Done when
- [ ] The report ran this turn and the answer gives its main numbers (judgment: which numbers matter depends on the report).
- [ ] Each cost proposed for change names its source file and line, its time per turn, and what changing it loses (judgment: tracing needs reading the sources).
- [ ] The project's own rules changed only with the user's OK or within "autonomy": "auto" for changes that lose nothing (judgment: the OK is in the conversation).
- [ ] Engine costs went to the starter with `starter.mjs feedback` (judgment: which costs are the engine's needs the trace).

## Pitfalls
- Blaming the starter or the project from memory. The report says which hook blocked and which file names each command.
- Cutting a check because it is slow when it guards something real: scope it instead.
- Waiting loops (`until ...; do sleep`) show as slow commands; they are time spent waiting on background work, not work.
