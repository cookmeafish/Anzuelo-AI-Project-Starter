---
name: orchestrate
description: Coordinates a longer run of multi-step or multi-agent work from start to verified finish. The coordinator breaks the goal into tasks, assigns each to a worker with a brief and its own workspace, keeps a written ledger as the single source of truth, checks on workers in a real loop, resumes, re-briefs or escalates stalled ones, queues work that shares a resource, and accepts a task only after checking the result itself. Use when work spans many tasks or sessions, runs several agents over time, or must survive context loss. For one-shot parallel work use parallel-agents; for writing the task list use plan.
triggers: orchestrate, coordinate the agents, coordinate agents, supervise agents, track the agents, agent fleet, long run, many agents
---
# Orchestrate: coordinate a long run to a verified finish

The coordinator does not do the tasks. It keeps the goal, the list, and the judgment of what counts as done. Workers
lose context, stall, crash and report "done" too early; the coordinator notices and acts.

Say at the start: "Coordinating this run (orchestrate skill)."

## What the other skills already cover
- **The task list:** the plan skill. Write or reuse a plan in `docs/plans/` first; this skill runs it.
- **Splitting and briefing a batch of independent tasks:** the parallel-agents skill. Use it for every batch here.
- **A worker stuck on a failure:** the debug skill, named in the worker's brief.
- **Separate working copies per worker:** the repo-setup skill, step 9.

This skill adds what happens over time: the ledger, workspaces, the check-in loop, intervening, shared-resource
queues, the acceptance gate, and releasing workspaces. Templates and message wording: [references.md](references.md).
`skills/orchestrate/scripts/ledger.mjs` reads the ledger and lists what needs action (read-only).

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
1. Agree with the user on the goal and what "finished" means, in checkable terms.
2. Take the tasks from the plan. Mark dependencies and shared resources (a port, a database, a device, an external
   account with rate limits).
3. Create the **ledger** (template in references.md): one row per task with owner and workspace, resume handle,
   required steps, steps reported, state, nudges, last seen and evidence, plus the run budget (step 3). Keep it in
   `.cache/orchestrate/` (ignored by git) while the run is live. It is the coordinator's memory, not a deliverable.
   Never put task notes in a worker's workspace, where they can end up in a commit.
4. Write the ledger to a temporary file next to it, then rename it over the old one, so a crash never leaves half a
   ledger. If it does not parse, repair it before acting on it.
5. Add one line to `docs/STATUS.md` (Now) pointing at the plan and the ledger, so a new session can pick up the run.
6. **Two layers, one judge.** Chores that need no judgment (restarting an exited worker, answering a routine prompt
   inside its workspace) may run in a small watcher. Everything needing judgment stays with you, in this session.
   Don't start a second coordinator agent: it has none of your context and is hard to see.
7. Anything that must outlive this session (a terminal multiplexer, a watcher, long-running workers) must be started
   by the user or the system, not as a child of your process, or it dies with your session. Ask the user to start it.

## 2. Assign work
1. Start only tasks whose dependencies are accepted. Independent ones go out together (parallel-agents).
2. **Workspaces:** a task that edits files gets its own workspace from the free pool. Pick it yourself; don't ask the
   user. Never hand out the workspace that holds the coordinator's own files or tools, and keep watcher scripts
   outside every workspace, so a branch switch can't delete them.
3. Every brief adds to the parallel-agents brief (wording in references.md):
   - **Required steps** in order, each reported on its own line as it finishes.
   - **How to recover:** where the ledger and plan are, so a worker that loses context rereads them instead of guessing.
   - **The finish signal**, on its own line, meaning "ready to check", not "accepted".
   - **Honesty rules:** nothing is marked resolved, fixed or passing unless the change or run really happened.
4. Pass pictures and long material as file paths, not pasted text. Record the paths in the ledger row for re-briefs.
5. Record a **resume handle** for each worker when it starts (session id, job id, window address), so a crashed worker
   resumes with its context instead of starting over.
6. Wait until a new worker is ready for input before sending the brief. If not ready after about a minute, send anyway
   and note it.
7. Write the assignment into the ledger before moving on. Re-tasking a worker updates its row at once.

## 3. Check in, in a real loop
A promise to "check every few minutes" does nothing without a trigger. Use a timer, a background wait or a scheduled
check that wakes you, and set the next one each time. Start with gaps of a few minutes, lengthen them while nothing
changes, and shorten them again as soon as anything happens or a worker waits for you. Each round:
1. Read the task list **from the ledger**, not memory, and look at every active worker. Run
   `node skills/orchestrate/scripts/ledger.mjs check <ledger>` for the rows that need action.
2. Classify each worker, in this order (first match wins), and act:

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

3. Measure "output unchanged", don't guess it: keep a fingerprint of each worker's last output lines
   (`node skills/orchestrate/scripts/ledger.mjs fingerprint <captured output>`) and compare with the last round.
4. Update the ledger: state, last seen, nudges, steps reported (record each step the first time you see it; old
   output scrolls away).
5. Stop scheduling rounds when no task is active.

**Sending a message:** only to an idle worker; text sent into a busy one can be lost or mangled. Leave a few minutes
between re-briefs of the same worker. After 3 nudges (restarts and re-briefs) on one task without progress, mark it
**escalated** and tell the user what blocks it.

**A cap for the whole run.** At setup, write a run budget in the ledger: the most re-briefs, restarts and failed
acceptance rounds the run may use (default: twice the number of tasks, unless the user names one). When it runs out,
start no new rounds: finish what is running, mark the rest **escalated**, and report. The per-task limit stops one
task looping; the run cap stops many tasks each looping a little, which costs as much.

**Decisions on the user's behalf** (answering a worker's question, approving an unfamiliar prompt, settling a
finding) go in the plan as one dated line in the plan skill's format:
`YYYY-MM-DD Ruling (task N): <what> - <why> - <cost if wrong>` (skills/plan/references.md, "Decide, don't stall").
List them all in the Finished section.

**Read states, not totals.** "Active" includes workers waiting for your approval or answer. If the count stays up but
nothing moves, look at the states.

**When the ledger and reality disagree,** repair the ledger first. Signs: a "running" worker is gone, a named watcher
doesn't exist, or "last seen" is hours old. Compare what exists row by row, mark gone workers exited so they get
resumed, restart a missing watcher, then check the ledger again (method in references.md).

## 4. Queue shared resources
Work on the same port, database, device, build cache or external quota runs one at a time. The coordinator owns the
queue, as a checklist in the ledger: workers do the parts safe in parallel, and the coordinator runs (or releases) the
shared step one task at a time and feeds the result back. Take the task closest to done first. If a shared check
gives a vague or thin result, rerun it with the objective, the key files and the behaviors it must confirm.

## 5. Accept only what you checked
The finish signal and any script that says "pass" are reasons to look, not proof.
1. **Steps:** every required step was reported, and the evidence the brief asked for is there.
2. **Automated gate, in order** (for work through hosted CI and review; details in references.md): checks finished
   (none pending), checks green, a check run newer than the worker's start (proof it pushed), no open review threads
   (count every page of results), no change request newer than the last commit. If any of this can't be fetched, the
   answer is "not complete", never "pass".
3. **Your own checks** on the current state: tests, build, the app gates or the knowledge checks.
4. **Read the change against the objective.** Anything missing or half-done fails. Look for checks rerun until they
   passed, and for an empty description or test plan.
5. **Partial is fail.** A headline behavior that works only in part goes back with the specific gap. A mix of passes
   and partials fails.
6. **Verify claims a worker could fake.** A resolved review comment needs a reply naming the change that resolved it;
   "acknowledged" or "deferred" is not a fix. "All tests pass" needs a run you saw. Count open items yourself.
7. Pass: mark it **accepted** and tell the user. Fail: re-brief with the exact gap, set it back to **running**, count
   the attempt, and rerun the whole gate after the next finish signal.

Never mark a task accepted to unblock the run, or on a script's word alone: you hold the objective, the script
doesn't.

## 6. Release workspaces
Accepted is not released. Keep a worker's workspace, branch and session until its work is merged or the user says to
free it, so it can still be resumed or asked about.
1. Confirm the work is pushed or merged and nothing uncommitted that matters is left.
2. Close the worker, end any half-done rebase or merge, clean the workspace, and park it on its spare branch.
3. Mark the row **released**. The workspace is free for the next task.

## 7. Integrate and finish, or stop
1. Merge accepted work in dependency order and run the full checks on the combined result (parallel-agents, step 4).
2. The run is finished when every task is accepted or escalated and surfaced to the user, the combined checks pass,
   and no accepted task has open review items or a red check from after its last push.
3. Tell the user when a task is accepted and when the run is done, here or by local notification. An outside channel
   (chat webhook, email) only if the user set it up and agreed (AGENTS.md rule 6). A failed notification never stops
   the run.
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
