---
status: open
---
# Plan: an orchestrator session the user can start with one command

**Goal:** the user can start a second Claude Code session that watches and steers their other sessions (the starter's
coding session, and the projects), so they never have to babysit them. It keeps every session working through its
work log, catches false or noisy engine output and leaks, and sends root-cause fixes. It only bothers the user for real
decisions.

**Approach:** build it from documented Claude Code features:
- a custom agent run as the main thread (`claude --agent orchestrator`);
- cross-session messaging (ListAgents, SendMessage, and an inbox socket that hooks can post to);
- session-scoped schedules as a backup only.

Anzuelo writes a small event log per project in its own stable format, so the orchestrator never depends on Claude
Code's internal transcript format.

**Spec (user, 2026-11-12):** Anzuelo can launch an orchestrator agent or terminal that orchestrates effectively; the
plan is researched and thought through, and the feature is available whenever the user wants to use it.

**Confidence:** 7/10. Checked on this machine (2026-11-12): Claude Code 2.1.323 has `--agent`, `--agents`,
`--append-system-prompt` and `-n/--name`, and Windows Terminal (`wt.exe`) is installed. Remaining risks, each with a
fallback below:
- Monitor watches end after 30 minutes at most (the inbox socket is the main signal, not Monitor).
- The transcript line format is internal (Anzuelo's own event log is the main input).

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-12-orchestrator.md`, or find the
first unticked box.

## Context
Researched against the Claude Code docs on 2026-11-12 (claude-code-guide; not yet tried in a run):
- **Fixed role:** `claude --agent <name>`, with the agent in `.claude/agents/<name>.md`. Its prompt, tools and model
  become the main thread's, an `initialPrompt` field is sent as the first turn, hooks apply, and resume restores it
  (sub-agents.md, sessions.md). `-n/--name` names the session (cli-reference.md).
- **Messaging:** ListAgents and SendMessage (cross-session-messaging.md).
  - Delivery is local, through each session's named pipe; native Windows needs v2.1.234 or later.
  - Plain text only. Bursts to one session are refused, and a session holds up to 100 messages.
  - A message can't approve a permission.
  - A hook or a shell command can post into a session's inbox with `CLAUDE_CODE_MESSAGING_SOCKET` and
    `CLAUDE_CODE_MESSAGING_TOKEN` (on Windows, the auth line first).
- **Monitor:** streams a command's output as events; each watch ends after at most 30 minutes; needs Git Bash on
  Windows (tools-reference.md).
- **Schedules:** CronCreate, ScheduleWakeup and /loop are session-scoped, run only while the session is idle, have no
  catch-up, and expire after 7 days (scheduled-tasks.md).
- **Transcripts:** the location is documented (`~/.claude/projects/<dir>/<session>.jsonl`); the line format is internal.
  Documented ways in: the `transcript_path` hook field, /export, and the Agent SDK.
- **Terminal tabs:** nothing documented. Windows Terminal's own `wt new-tab -d <dir> <command>` is the natural opener;
  `start "" cmd /k <command>` is the fallback.

Lessons from orchestrating by hand (2026-11-10 to 2026-11-12):
- Sessions stall after a report.
- Asks get lost when an agent switches tasks.
- Engine lines and holds are often false.
- Leaks build up until the machine slows.
- A message isn't a fix.
- The user's names for projects must never reach starter files.
- The orchestrator's own turns are reports, not work, so they mustn't be held as work.
- Its state lived in a scratch folder and died with the session.

## Constraints for every task
- The user's rules: show only proven items; fix root causes, not symptoms; make safe calls without asking; never park
  work on the user; nothing in a project outside its `.anzuelo/` (the starter excepted); no leaks.
- The orchestrator writes no engine or project code. It writes only its own state, plans and messages.
- Opening a terminal happens only after the user's OK in that conversation. It never drives a browser.
- Project names stay out of starter files; the watch list is local and git-ignored.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- WSL and native Windows sessions can't message each other: the start command must run the orchestrator on the same
  side as the watched sessions.
- A burst of events must not flood a session's inbox: one message per finished turn at most, and only when there's
  something worth acting on.

## Task 1: an event log per project, in Anzuelo's own format
**Files:** tools/hooks/v2/end.mjs, tools/hooks/v2/start.mjs, tools/hooks/v2/guard.mjs, a new events module
**Uses / provides:** provides the orchestrator's main input.
- [ ] Each hook appends one JSON line to `.anzuelo/local/state/events.jsonl` (in the starter: `tools/hooks/state/`), with
      a size cap and rotation. Events: turn started (with asks), turn finished (open work-log items, holds shown, ⚓ lines
      shown), guard refusal, upset acknowledged, check run and result, leftover counts.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a scripted turn writes the expected events; the file never
      grows past its cap; ALL PASS.

## Task 2: the orchestrator agent and its start command
**Files:** `.claude/agents/orchestrator.md` (generated), tools/starter.mjs (`orchestrator` command), a new runbook
`docs/playbooks/orchestrator.md`
**Uses / provides:** uses Task 1; provides the running session.
- [ ] The agent file holds the role, rules and tools, and an `initialPrompt` that: reads the watch list, registers its
      inbox (Task 3), sets a 15-minute backup schedule, and reports in one line.
- [ ] `node tools/starter.mjs orchestrator [--watch <paths>]` writes the local watch list. Once the user has said OK in
      the conversation, it opens `wt new-tab -d <dir> claude --agent orchestrator -n "Anzuelo orchestrator"` (fallback:
      `start "" cmd /k ...`). Without an OK, it prints the command for the user to run.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the agent file is generated with every rule above; the command
      prints the exact launch line in dry-run mode; ALL PASS.

## Task 3: event-driven, not polling
**Files:** the events module, tools/hooks/v2/end.mjs
**Uses / provides:** uses Tasks 1-2.
- [ ] On start, the orchestrator writes its inbox socket and token to a local, git-ignored file readable only by the user
      (`~/.anzuelo/orchestrator.json`).
- [ ] A watched session's Stop hook posts one short line to that inbox, only when something needs attention: open
      work-log items at "finished", a hold or refusal shown, an upset message, leftover growth. At most one message per
      turn; nothing when the orchestrator isn't running.
- [ ] The backup schedule reads the event logs every 15 minutes in case a message was missed. The 7-day expiry is
      renewed at each start.
- [ ] Run `node tools/hooks/v2/selftest.mjs` with a fake inbox. Expected: an attention event posts once; a quiet turn
      posts nothing; a missing orchestrator is skipped silently; ALL PASS.

## Task 4: the orchestrator's tools
**Files:** tools/orchestrator/ (reader, stall, leaks, judge)
**Uses / provides:** uses Task 1 and the work log.
- [ ] `reader`: new events and new user messages per watched session, from the event log first, and from transcripts
      only through `transcript_path` with a tolerant parser.
- [ ] `stall`: a session idle with open work-log items and nothing running.
- [ ] `leaks`: tools/starter/leaks.mjs plus the kernel pool reading, with growth per hour.
- [ ] `judge`: each ⚓ line and hold against its evidence (the show-only-proven rule), and each relayed claim checked
      against git or files before it reaches the user.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: each tool has a test from a real case of 2026-11-12 (the stalled
      session, the 3 lost asks, the false "fixed" line, the compile-cache growth); ALL PASS.

## Task 5: its turns don't trip the end check
**Files:** tools/hooks/v2/end.mjs
**Uses / provides:** uses Task 2.
- [ ] A session running `--agent orchestrator` is a reporting session: messages, plans and its own state aren't work, so
      no Finished, open-plan or changelog items are asked of it. Safety guards still apply.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: an orchestrator turn that sends 3 messages and edits its state
      ends with no hold; ALL PASS.

## Task 6: offer it, then prove it
**Files:** packs (an optional orchestrator pack), docs/playbooks/orchestrator.md
**Uses / provides:** uses Tasks 1-5.
- [ ] Offered at setup and upgrade as optional, off by default, with one line on its gain and cost.
- [ ] Run `node tools/audit.mjs` (expected: PASS), then use it for one working day on the starter and the linked
      projects. Measure: stalls caught before the user noticed them, lost asks recovered, false lines found, leaks
      caught, and interruptions to the user, compared with the hand-run orchestrator of 2026-11-12. Report to the user.
