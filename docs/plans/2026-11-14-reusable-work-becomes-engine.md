---
status: open
---
# Plan: reusable procedures built outside project files become engine runbooks

**Goal:** any reusable procedure (a script, a multi-session workflow, a repeated instruction to other sessions) is
recognized as a new kind of task and lands in the engine as a runbook, a skill and a check, the same turn.

**Approach:** widen the end check's "new kind of task" test to work done outside project files, route multi-project
procedures to the engine, and sweep oversight's own scratch tools now.

**Spec (user, 2026-11-14):** the engine should have seen by itself that pausing and reopening all sessions was a gap
worth filling for any multi-agent setup.

**Confidence:** 7/10. Main risk: flagging one-off scratch work. The test includes a one-off case that must not flag.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-14-reusable-work-becomes-engine.md`.

## Context
- **Root cause:** the runbook-exists check (tools/hooks/v2/end.mjs, REQ runbook-exists) skips turns made of peer
  messages and counts only changed project files, so work done through messages, scratch scripts and memory never
  counts as a new kind of task. Nothing asks whether a procedure would help other projects.
- **Sweep of oversight's scratch tools (2026-11-14), each reusable and none in the engine yet:**
  1. pause all sessions, then reopen them after a restart (reopen-sessions.cmd): queued as orchestrator Task 0;
  2. the session feed reader, which reads every session's user messages, answers, holds and away notes since the
     last run (feed.js and collect.js);
  3. the folder fingerprint before and after an install or upgrade, proving no app file changed (fingerprint.mjs);
  4. pooltags.ps1, already in tools/starter/.
- Release scripts had the same blind spot and are now in tools/starter/release/.

## Constraints for every task
- No new interruption during work: one held line at most.
- Starter files never name the projects the lessons came from.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- One-off scratch work (a single calculation) must not be flagged.
- Setups differ (user, 2026-11-14): all sessions in one window or in separate windows, other terminals, tmux,
  editor terminals, other agent harnesses that manage sessions themselves. Reopen never assumes one launcher: it
  records how each session was started when it can tell, uses a launcher the user configured
  (`"sessionLauncher"` in config), hands off to a harness's own resume when one manages the sessions, and otherwise
  prints the exact per-session resume commands instead of guessing.

## Task 1: the end check sees reusable work anywhere (coding session)
**Files:** tools/hooks/v2/end.mjs, skills/runbook-create/SKILL.md
**Uses / provides:** none.
- [ ] A turn that writes a script or command file anywhere, or sends the same structured instruction to 2+ peer
      sessions, with no runbook routed for it, gets one held line asking for a runbook (an engine runbook when it is not
      project-specific) or a one-line reason it is one-off.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: today's pause and reopen turns are flagged, a one-off scratch
      calculation is not; ALL PASS.

## Task 1b: a repeat run reviews its own output for speed (coding session, after Task 1)
**Why:** a project's repeated job kept taking long and waiting on screens it had already learned to get past; the user
had to ask for the time analysis (2026-11-15). Nothing makes the agent compare a repeat run with the last one.
- [ ] After a run of something the project runs repeatedly (a job, a routine, a script with a run log), the end check
      asks once, unless the answer already says it: "Compared with the last run: what was slowest, what repeated a
      solved step, and what changed to fix it."
- [ ] The goal-loop skill and the job runbooks record per-run time, so the comparison has data.
- [ ] Test: a turn that ran a logged job twice with the same slow step and no comparison gets one held line; a turn
      with the comparison gets nothing.

## Task 2: the swept tools become engine runbooks (coding session)
**Files:** tools/starter/ (the tools), docs/playbooks/ (runbooks), skills/ (generated)
**Uses / provides:** uses Task 1.
- [ ] Sessions pause/reopen (orchestrator Task 0), the session feed reader, and the install fingerprint check each
      become a tool with a runbook and a test.
- [ ] Run `node tools/audit.mjs`. Expected: PASS, each new runbook routed and its skill generated.
