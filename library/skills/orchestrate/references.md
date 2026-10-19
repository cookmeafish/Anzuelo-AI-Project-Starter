# Orchestrate: templates and methods

## Ledger (`.cache/orchestrate/<topic>.md`)
```markdown
# <Topic>: run ledger
Goal: <one sentence>. Finished means: <checkable>.
Plan: docs/plans/<file>.md. Started: <date>. Last round: <YYYY-MM-DD HH:MM>. Run: active | stopped.
Run budget: <N> re-briefs, restarts and failed acceptance rounds (default: twice the tasks). Used: <n>.

| Task | Owner (worker, workspace) | Resume handle | Depends on | Shared resource | Required steps | Steps reported | State | Nudges | Last seen | Evidence / notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 <name> | <id>, <path> | <session or job id> | - | - | test, build | test | running | 0 | 2026-01-05 14:20 | |

## Shared-resource queue
- [ ] <task> waiting for <resource> (closest to done first)

## Escalated
- <task>: <what blocks it>, told the user <date>
```
`node skills/orchestrate/scripts/ledger.mjs check <ledger>` reads this table and changes nothing. It lists the tasks that need you:
- ready to check, waiting for approval or an answer, exited, stuck or stalled, or due for escalation;
- active without an owner, or not seen for a while;
- accepted without evidence or with unreported steps;
- two active tasks in one workspace, or on one shared resource.

## States
| State | Meaning |
|---|---|
| waiting | Dependencies not accepted yet |
| running | A worker has it and is working |
| waiting-approval | The worker is stopped at a prompt that needs a yes or no |
| needs-answer | The worker asked something the coordinator must answer or pass on |
| stuck | The worker's process is alive but its output has not changed past the threshold |
| stalled | The worker is idle at its prompt without the finish signal |
| exited | The worker's process is gone; resume it with its handle |
| ready-to-check | Finish signal received; the coordinator has not checked it yet |
| accepted | Checked by the coordinator and passed |
| escalated | 3 nudges without progress, or blocked on the user |
| released | Work merged (or the user said so); the workspace is free again |

## Workspace pool
- A free workspace is a working copy parked on a spare branch with nothing else in it. `git worktree list` shows each
  copy and its branch; the free ones are those on spare branches (name them in a pattern, such as `spare/<n>`).
- Busy workspaces are the ledger rows whose state is anything but released.
- Starting a task: in the free workspace, create the task branch from the base (or switch to it if it exists).
- Releasing (step 6), only after the work is merged or the user says so: close the worker; end any half-done rebase
  or merge; discard leftover changes; switch back to the spare branch. Discarding is destructive, so check first that
  everything that matters is pushed.
- The workspace that holds the coordinator's own files or tools is never in the pool.

## Brief additions (on top of the parallel-agents brief)
```text
Required steps, in order: <step>, <step>. After each, write on its own line: STEP DONE: <step>.
If you lose track, read <ledger path> (your row: <task>) and <plan path>, then continue.
Context files to open first: <paths, if any>.
When everything is done and verified, write on its own line: READY TO CHECK. The coordinator then checks your work;
it is not accepted until then. Do not mark anything resolved, fixed or passing that you did not actually change or
run. To close a review comment: make the change, commit and push it, reply naming the commit, then resolve it.
When posting many replies or other writes to an outside service, leave a few seconds between them.
```

## Re-brief message
```text
You seem stalled on <task>. Objective: <from ledger>. Last step reported: <step>. Next: <step>.
Read <ledger path> and <plan path> to reorient, then continue.
```

## Fail message after a check
```text
Not accepted yet: <the specific behavior or check that failed, with the output>. Fix that, re-run <check>, then write
READY TO CHECK again.
```

## Driving workers in a terminal
When workers run in terminal windows or panes that the coordinator types into:
- Check that the worker is idle at its prompt (no busy indicator in the last lines) before typing. If it is busy,
  wait 10 to 15 seconds and look again.
- Send a long message as two actions: the text, a short pause, then the key that submits it. Sent together, the
  submit can arrive before the text has landed, and the message sits unsent.
- Read enough scrollback (hundreds of lines) to see earlier step reports, and strip color codes before matching text.
- A dialog at startup (settings, trust, first-run) can block a new worker. Look for it before sending the brief.
- Validate a window or job address before using it in a command, so a damaged ledger can't inject one.

## Approving prompts
| Prompt | Who answers |
|---|---|
| A routine tool or edit confirmation for files inside the worker's own workspace | The watcher or the coordinator, yes |
| Install, build or test commands the plan already expects | The coordinator, yes |
| Anything that deletes, rewrites history, touches another workspace, or reaches outside the machine | The coordinator decides; if in doubt, escalate to the user |
| A prompt it can't read or doesn't recognize | The coordinator looks; never answered blind |

## Repairing a stale ledger
1. List what really exists: workers and their windows or jobs, the watcher, workspaces and their branches.
2. Compare row by row with the ledger.
3. Fix: a row "running" whose worker is gone becomes exited (it gets resumed); a missing watcher is restarted and its
   new address recorded; a resumed worker's new address replaces the old one.
4. Run `node skills/orchestrate/scripts/ledger.mjs check <ledger>` and act only once it matches reality.

## Acceptance gate for work that goes through hosted CI and review
Check in this order. Later checks depend on earlier ones being final.
1. **Steps:** every required step reported.
2. **Checks finished:** none pending. Review bots often post comments and change requests after their own check ends,
   so reading reviews before the checks finish misses them.
3. **Checks green:** none failing. A check that failed and was rerun until it passed is a question to ask.
4. **Fresh run:** the newest check run on the branch started after the worker began. An older one means the worker
   never pushed.
5. **Open review threads:** zero, counted across every page of results (lists are paged; the first page alone
   undercounts on large changes).
6. **Change requests:** take each reviewer's latest review. One that asks for changes blocks only if it came after the
   last commit; an older one was already answered by later commits. A review with no date counts as blocking.
7. **Resolutions are real:** each resolved thread's last reply names the change (a commit or the fix). Resolved
   threads whose last reply only says acknowledged, accepted or later are reopened with the worker.
8. If any of this data can't be fetched, the result is "not complete".

## Rate limits on outside services
| Kind | Typical sign | Recovery |
|---|---|---|
| Burst limit on writes (too many comments or changes in a short time) | A refusal mentioning abuse or a secondary limit | Stop all writes, wait a few minutes (one minute is often too short), then continue with a few seconds between writes |
| Hourly quota | A "rate limit exceeded" error with a reset time | Wait until the stated reset time |

Tell the worker once. A second nudge during the wait makes it act early and can restart the clock. For a long list of
replies, put the spacing in the brief from the start.
