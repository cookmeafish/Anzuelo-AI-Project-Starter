---
name: orchestrate
description: Coordinates a longer run of multi-step or multi-agent work from start to verified finish. The coordinator breaks the goal into tasks, assigns each to a worker with a brief and its own workspace, keeps a written ledger as the single source of truth, checks on workers in a real loop, resumes, re-briefs or escalates stalled ones, queues work that shares a resource, and accepts a task only after checking the result itself. Use when work spans many tasks or sessions, runs several agents over time, or must survive context loss. For one-shot parallel work use parallel-agents; for writing the task list use plan.
triggers: orchestrate, coordinate the agents, coordinate agents, supervise agents, track the agents, agent fleet, long run, many agents
---
# Orchestrate: coordinate a long run to a verified finish

The coordinator does not do the tasks. It keeps the goal, the list, and the judgment of what counts as done. Workers
lose context, stall, crash, and report "done" too early; the coordinator's job is to notice each of these and act.

Say at the start: "Coordinating this run (orchestrate skill)."

## What the other skills already cover
- **The task list:** the plan skill. Write or reuse a plan in `docs/plans/` first; this skill runs it.
- **Splitting and briefing one batch of independent tasks:** the parallel-agents skill (independence test, brief
  contents, merge checks). Use it for every batch you start here.
- **A worker stuck on a failure:** the debug skill, in the worker's brief.
- **Separate working copies per worker:** the repo-setup skill, step 9.

This skill adds what happens over time: the ledger, workspaces, the check-in loop, intervening, shared-resource
queues, the acceptance gate, and releasing workspaces. Templates, message wording and detailed methods are in
[references.md](references.md). `skills/orchestrate/scripts/ledger.mjs` reads the ledger and lists what needs action (read-only).

## Requests during a run
| The user asks for | Do this |
|---|---|
| Status, "what's running" | Run `node skills/orchestrate/scripts/ledger.mjs check <ledger>` and summarize each task's state and last step |
| Capacity, "how many are free" | List free and busy workspaces (references.md, "Workspace pool") |
| Start work on several tasks | Steps 1 and 2 |
| Add one more task | Step 2 for that task, if a workspace is free; otherwise say so |
| Check now | One round of step 3 |
| Free a workspace | Step 6, only if its task is accepted and merged, or the user says so |
| Stop | Step 7 |

If the request is unclear, show capacity first and ask which tasks to run (one question).

## 1. Set up the run
1. Confirm the goal and what "finished" means with the user, in checkable terms.
2. Take the tasks from the plan. Mark which ones depend on others and which use a shared resource (a port, a
   database, a device, an external account with rate limits).
3. Create the **ledger** (template in references.md): one row per task with owner and workspace, resume handle,
   required steps, steps reported, state, nudges, last seen, and evidence, plus the run budget (step 3). Keep it in `.cache/orchestrate/` (ignored
   by git) while the run is live. It is the coordinator's memory, not a deliverable. Never put task notes inside a
   worker's workspace, where they can end up in a commit.
4. Write the ledger safely: write a temporary file next to it, then rename it over the old one, so a crash mid-write
   never leaves half a ledger. If the ledger does not parse, stop and repair it before acting on it.
5. Put one line in `docs/STATUS.md` (Now) that points at the plan and the ledger, so a new session can pick up the run.
6. **Two layers, one judge.** Mechanical chores that need no judgment (restarting a worker whose process exited,
   answering a routine prompt inside its workspace) may run in a small watcher. Everything that needs judgment stays
   with you, in this session. Don't start a second coordinator agent: it has none of your context and is hard to see.
7. Anything that must outlive this session (a terminal multiplexer, a watcher, long-running workers) is started by the
   user or the system, not as a child of your own process, or it dies when your session ends. Ask the user to start
   it when needed.

## 2. Assign work
1. Start only tasks whose dependencies are accepted. Independent ones go out together (parallel-agents).
2. **Workspaces:** a task that edits files gets its own workspace from the free pool. Pick it yourself; never ask the
   user to choose one. Never hand out the workspace that holds the coordinator's own files or tools, and keep any
   watcher scripts in a place outside every workspace, so switching a branch can't delete them.
3. Every brief adds to the parallel-agents brief (wording in references.md):
   - **Required steps** in order, and the instruction to report each one on its own line as it finishes.
   - **How to recover:** where the ledger and the plan are, so a worker that loses its context reorients by reading
     them instead of guessing.
   - **The finish signal**, on its own line, and that it means "ready to check", not "accepted".
   - **Honesty rules:** nothing is marked resolved, fixed or passing unless the change or the run really happened.
4. Pass pictures and long material as file paths the worker can open, not pasted into the message. Record the paths
   in the ledger row, so a re-brief can point at them again.
5. Record a **resume handle** for each worker when it starts (a session id, a job id, a window address), so a crashed
   worker can be resumed with its context instead of starting over.
6. Wait until a new worker is ready for input before sending the brief. If it never becomes ready in about a minute,
   send anyway and note it.
7. Write the assignment into the ledger before moving on. Re-tasking a worker updates its row at once.

## 3. Check in, in a real loop
A promise to "check every few minutes" does nothing without a trigger. Use a timer, a background wait, or a scheduled
check that wakes you, and set the next one each time. Start with short gaps (a few minutes), lengthen them while
nothing changes, and go back to short gaps as soon as anything happens or a worker waits for you. Each round:
1. Read the task list **from the ledger**, not from memory, and look at every active worker. Run
   `node skills/orchestrate/scripts/ledger.mjs check <ledger>` for the list of rows that need action.
2. Classify each worker, in this order (the first match wins), and act:

| What you see | State | What to do |
|---|---|---|
| The finish signal **on its own line** (the brief contains the same words, so a match inside the brief text doesn't count) | ready-to-check | Step 5 |
| A prompt waiting for approval | waiting-approval | Approve only routine actions inside its workspace. Anything destructive, outside its workspace, or unfamiliar: decide yourself, or ask the user |
| The worker's process has exited | exited | Resume it with its resume handle; don't send the brief again. Count it as a nudge |
| Asking a question | needs-answer | Answer it if the plan or the user already decided; otherwise ask the user, one question |
| Process alive, output unchanged past the threshold (default 5 minutes) | stuck | Re-brief with the step it was on, or send the exact error and a next step |
| Idle at its prompt without the finish signal | stalled | Re-brief: the objective from the ledger, the step it was on, where to look |
| Rate-limited or throttled | running | Tell it to pause for the stated time, then continue more slowly. Don't nudge again while it waits |
| Lost its context | running | Point it at the ledger row and the plan |
| Working (tools running, output moving) | running | Nothing. Never interrupt a busy worker |

3. "Output unchanged" is measured, not guessed: keep a fingerprint of the last lines of output per worker
   (`node skills/orchestrate/scripts/ledger.mjs fingerprint <captured output>`) and compare it with the last round.
4. Update the ledger: state, last seen, steps reported (record each step the first time you see it; old output scrolls
   away), nudges.
5. Stop scheduling rounds when no task is active.

**Sending a message:** only to an idle worker, never into one that is still busy (the text can be lost or mangled).
Leave a few minutes between re-briefs of the same worker. After 3 nudges (restarts and re-briefs) on the same task
without progress, mark it **escalated** and tell the user what is blocking it.

**A cap for the whole run.** At setup, write a run budget in the ledger: the most re-briefs, restarts and failed
acceptance rounds the whole run may use (default: twice the number of tasks, unless the user names one). Count each
against it. When it runs out, start no new rounds: finish what is running, mark the rest **escalated**, and report.
The per-task limit stops one task from looping; the run cap stops many tasks from each looping a little, which costs
as much.

**Decisions on the user's behalf** (answering a worker's question, approving an unfamiliar prompt, settling a
finding) go in the plan as one dated line in the plan skill's format:
`YYYY-MM-DD Ruling (task N): <what> - <why> - <cost if wrong>` (skills/plan/references.md, "Decide, don't stall").
List them all in the Finished section.

**Read states, not totals.** A count of "active" workers includes ones waiting for your approval or an answer. If the
count stays up but nothing moves, look at the states.

**When the ledger and reality disagree,** repair the ledger before acting on it. Signs: a worker it calls running is
gone, a watcher it names doesn't exist, or "last seen" is hours old. List what actually exists and compare it row by
row. Mark gone workers exited so they get resumed, and restart a missing watcher. Then check the whole ledger again
(method in references.md).

## 4. Queue shared resources
Work that uses the same port, database, device, build cache or external quota runs one at a time. The coordinator
owns that queue, as a checklist in the ledger: workers do the parts that are safe in parallel, and the coordinator
runs (or releases) the shared step one task at a time, then feeds the result back. When several are waiting, take
the one closest to done first. If a shared check gives a vague or thin result, run it again with the objective, the
key files and the behaviors it must confirm.

## 5. Accept only what you checked
The finish signal and any script that says "pass" are reasons to look, not proof.
1. **Steps:** every required step was reported, and the evidence asked for in the brief is there.
2. **Automated gate, in order** (when the work goes through hosted CI and review; details in references.md): checks
   finished (none pending), checks green, a check run newer than the worker's start (proof it pushed), no open review
   threads (count every page of results), and no change request newer than the last commit. If any of this can't be
   fetched, the answer is "not complete", never "pass".
3. **Your own checks** on the current state: tests, build, the app gates, or the knowledge checks.
4. **Read the change against the objective.** Anything missing or half-done is a fail. Look for checks that were
   rerun until they passed, and for a description or test plan left empty.
5. **Partial is fail.** If a headline behavior works only in part, the task goes back with the specific gap. A mix of
   passes and partials is a fail.
6. **Verify claims a worker could fake.** A resolved review comment needs a reply that names the change that resolved
   it; "acknowledged" or "deferred" is not a fix. "All tests pass" needs a run you saw. Count open items yourself.
7. Pass: mark it **accepted** in the ledger and tell the user it is ready. Fail: re-brief with the exact gap, set it
   back to **running**, count the attempt, and run the whole gate again after the next finish signal.

Never mark a task accepted to unblock the run, and never on a script's word alone: you hold the objective, the script
doesn't.

## 6. Release workspaces
Accepted is not released. Keep a worker's workspace, branch and session until its work is merged or the user says
to free it, so it can still be resumed or asked about.
1. Confirm the work is pushed or merged, and nothing uncommitted is left that matters.
2. Close the worker, end any half-done rebase or merge, clean the workspace, and park it on its spare branch.
3. Mark the row **released**. The workspace is free for the next task.

## 7. Integrate and finish, or stop
1. Merge accepted work in dependency order and run the full checks on the combined result (parallel-agents, step 4).
2. The run is finished when every task is accepted or escalated and surfaced to the user, the combined checks pass,
   and no accepted task has open review items or a red check from after its last push.
3. Tell the user when a task is accepted and when the whole run is done. A local notification or this chat is fine;
   an outside channel (chat webhook, email) only if the user set it up and agreed (AGENTS.md rule 6). A failed
   notification never stops the run.
4. A stop request ends the run at any point: mark the ledger stopped, stop any watcher, and leave unfinished workers
   and their workspaces untouched. Say what is still open.
5. Update `docs/STATUS.md` and `docs/CHANGELOG.md` (AGENTS.md rule 12), then report per task in the Finished section.

## Done when
- [ ] Every task in the ledger is accepted, or escalated with the user told why (hook: ledger-checked).
- [ ] The run stayed within its budget, or stopped and reported when the budget ran out (judgment: the budget is set per run).
- [ ] Each accepted task passed the gate in step 5, checked by the coordinator, not only by the worker's report (judgment: whether the coordinator ran the gate shows only in the work).
- [ ] Shared-resource steps ran one at a time (hook: ledger-checked).
- [ ] The combined result passes the full checks (judgment: each project has its own full checks).
- [ ] `node skills/orchestrate/scripts/ledger.mjs check <ledger>` reports no active task and nothing that needs action (hook: ledger-checked).
- [ ] `docs/STATUS.md` and `docs/CHANGELOG.md` reflect the run, and only merged or user-approved workspaces were released (hook: status-handoff; judgment: the CHANGELOG line and which workspaces were released).

## Pitfalls
- Tracking workers in your head: after a context loss the run forgets tasks. The ledger is the truth.
- Accepting the finish signal as done, or accepting "mostly works".
- Counting the finish signal when it only appears inside the brief you sent.
- Running shared-resource steps in parallel, so results corrupt each other and the failures look random.
- Nudging a busy worker, nudging again during a rate-limit wait, or nudging forever instead of escalating after 3 tries.
- No run budget, so a long run re-briefs its way through hours of cost with nothing accepted.
- Re-sending the whole brief to a crashed worker instead of resuming it, so it starts over and loses its work.
- Saying you will check back without setting anything that wakes you.
- Approving every prompt automatically, including a destructive one outside the worker's workspace.
- Counting review threads or results from the first page only.
- The coordinator doing tasks itself and losing the overview.
- Releasing a workspace before its work is merged, or handing out the one that holds the coordinator's own tools.

Inspired by "orchestrate" in Significant-Gravitas/AutoGPT (MIT, see LICENSE and [SOURCE.md](SOURCE.md)). The run
budget draws on ideas from snarktank/ralph (MIT) and Anthropic's article "Effective harnesses for long-running agents".
