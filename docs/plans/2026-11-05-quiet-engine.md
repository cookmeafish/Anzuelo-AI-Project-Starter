# Quiet engine: a reminder before the work, one check after it, and only safety in between

status: in progress

The user's model of the engine: one hook reminds the agent what to do when a request arrives, one hook checks the work
when the agent finishes. Everything else the engine did during the work (notices on tool calls, refusals for style or
cost, checklist bookkeeping, gates on helpers) made answers worse or stopped the agent from doing the task. Linked:
[[2026-11-05-v30-findings]].

## Measured on real sessions (since 2026-10-25)
Script: `node tools/starter/interrupts.mjs <transcript folder> [since]`.
- Larger project (516 user turns, 6742 main and 8466 helper tool calls): "a test or sweep run is still running" 182
  times (48 in helpers that never started a run), "past 15 tool calls, update STATUS" 70, checklist reminders on tool
  calls 52, piped-output refusals 24 (21 in helpers), upset refusals 27, duplicate-helper refusals 6, Stop rounds
  asking for "Record item N" lines, and a helper's text-only hand-back refused until it wrote 6 "Skip" lines.
- Smaller project (53 turns): checklist reminders 49, the background-run notice 51, the STATUS nag 10.

## The rule
- **Before the work** (prompt hook): route, checklist, warnings. This is the reminder.
- **During the work** (tool hooks): silent. A tool call is refused only to stop what can't be undone, leaks, or breaks
  a protection the user set: secrets, AI attribution, protected and versioned files, outward actions, risky git,
  people's data mixing, forbidden commands and the project's own guards, a headless run left hanging. Never for
  style, cost, bookkeeping, or an unacknowledged complaint. No notices are added to tool results, with two
  exceptions shown once each: another test run of this session still running (main session only, once per run), and
  a new user message while helpers still run (main session only, once per message).
- **After the work** (Stop): one check of the result. It asks only for what is actually missing or wrong, never for
  a line that says an item was done or skipped.
- **Helpers:** no gates and no checklists. Their result is checked with the main turn.

## Root cause
Each lesson was fixed by adding a check or a notice where the miss happened, often during the work. Nothing limited
what may interrupt, and the improvement loop measured answer quality and missed checks, never the interruptions it
added. So friction grew with every version and the loop never saw it.

### Task 1: tool hooks are silent except safety
- [x] pretoolDecision keeps only the safety guards; upset-acknowledged, no-repeat, no-polling and the em dash fast
  path move to Stop (the Stop checks already cover them).
- [x] cmdPretool adds no notices: no checklist on reading a runbook, no Issue checklist, no helper route.
- [x] The background-run notice: main session only, once per run. The new-message notice: main session only. A command that only reads a check's output gets no notice. (Matching on quoted words stays as is: v2 replaces the notice.)
- [x] cmdPosttool adds no notices (STATUS nag, plan nag, security hint, publish hint); syncing and the user's visible
  lines stay.
### Task 2: helpers are never gated
- [x] No SubagentStop or hand-back gate, no route for a message sent to a helper.
### Task 3: no bookkeeping lines
- [x] Stop no longer asks for "Done N" or "Skip N" lines for checklist items no script can check; the checklist is the
  reminder. A "Skip N" line with a reason still drops a failing check, as a waiver does.
- [x] The prompt checklist hint stops asking for those lines.
### Task 4: tests that fail on the old engine
- [x] One self-test runs a busy turn through the tool hooks (runbook read, background run, helper with a user message,
  16+ tool calls, upset prompt, piped lookup, em dash, duplicate helper) and asserts no notice and no refusal.
- [x] Safety refusals still happen (secret, AI attribution, protected file).
- [x] Stop with an unrecorded judgment item passes.
### Task 5: never again
- [x] The rule in AGENTS.md (hard rule 18) and the improvement loop: a fix may not add an interruption during work;
  each round counts interruptions on real sessions, and any non-safety one is a finding.
- [x] Project upgrades are batched (at most once a day, or for a real fix). The runbook usage file goes in v2, which drops it: no v1 change for it.
### Task 6: ship
- [ ] Full chain, commit (never push), upgrade both projects, measure again on their next sessions.
