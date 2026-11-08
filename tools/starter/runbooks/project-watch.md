---
name: project-watch
summary: Watch the projects that run the engine - how they perform, what breaks - fix the engine here and upgrade them
triggers: project watch round, project watch, check up on the projects, check on the projects, watch the projects, in charge of the projects, performance of the projects, how are the projects doing, keep the projects running well, update anzuelo on the projects, upgrade the projects, projects bug free
---
# Project watch (starter only)

The starter session looks after every project that runs the engine. The list (each project's folder, linked starter
copy, session name and engine commit) is in `tools/starter/watch.local.json`, which git ignores: project names and
paths never go into the starter. It checks how they run, fixes what is wrong in the engine here, and brings each
project up to date. A project's own content is its session's; this runbook changes only the engine. New projects
never get this file.

## Steps
1. **Look, per project, without touching its files:**
   - Its session: busy or idle (the host's list of sessions). Messages it sent and its `docs/starter-feedback.md`.
   - Which engine it runs: its upgrade commits (`git log --grep "Engine upgrade"`) against the starter's `main`.
   - Hook speed: the newest upgrade log or `tools/hooks/state/runs.jsonl` (prompt, pretool and Stop times) against
     the budgets `hookBudgetMs` (1000 ms median per event) and `stopBudgetMs` (500 ms) in `tools/hooks/hooks.mjs`.
   - Its self-test: the last full run (`.cache/selfcheck-last.txt`); run it again only when nothing else is running.
   - What the user met: upset messages and false alarms in `tools/hooks/state/triggers.jsonl`, hook errors and blocked
     turns in its newest session transcripts.
2. **Each problem gets a confirmed cause** from that evidence (the field-report runbook, steps 2 to 4): the engine's
   are fixed here with a self-test that fails without the fix; one in the project's own files goes to its session
   as what to change, never edited from here.
3. **Ship it:** `node tools/hooks/selfcheck.mjs --full && node tools/audit.mjs`, then commit (the user's standing OK;
   never push without asking). Any figure quoted for a change (how often it fires, how much longer the reminder gets)
   comes from the replay tool run on the real commits, shipped engine against candidate (`node
   tools/starter/v2-replay.mjs` in a worktree of each, diffed), never from a side measurement of the idea.
4. **Upgrade each project, in batches:** at most once a day, or sooner only for a fix the project is paying for now
   (engine upgrades were about 45% of one project's commits, 2026-11-05).
   - a. Fast-forward its linked starter copy from this folder: `git -C <copy> pull --ff-only <starter> main`.
   - b. Hand the upgrade to its session: it opens `docs/playbooks/engine.md` and records its checklist (its hooks route
     the message there; without that line each upgrade turn spent two Stop rounds on it).
   - c. The session commits its own work, then runs `starter.mjs upgrade --dry-run`, `upgrade`, and
     `node tools/hooks/selfcheck.mjs --full` (the plain self-test reuses recorded results, so a handoff that means
     every test names `--full`).
   - d. It reports back. Upgrade from here only when no session works there and it has nothing uncommitted (engine
     runbook, Pitfalls).
   - e. Never ask the user to start an upgrade: this job is the authority for it. Check the project's processes that
     the upgrade started; if its session has not picked it up, chase it, or run it from here when the rule in d allows.
     Lesson (2026-11-08): the answer told the user to type the upgrade into a project, and they were upset.
5. **Confirm** each project's report: new engine commit, no checks failing that passed before, hook times. A
   regression is a new problem: back to step 2.
6. **Repeat until a round finds nothing:** every issue found goes back through step 2 (the matching runbook or
   skill: debug for anything that behaves wrong), is fixed, retested here and in the project, and the round runs
   again. Done only when a full round over every project finds no issue.

## Done when
- [ ] Each watched project was looked at on every point of step 1, or the answer says which could not be (judgment: what each project exposes differs).
- [ ] Every problem found has a confirmed cause, and each engine cause a fix with a self-test that fails without it (hook: hooks-tested).
- [ ] The fixes were committed with the user as the only author, not pushed (hook: no-ai-attribution).
- [ ] Every figure quoted for a change came from a replay of the shipped and candidate commits (judgment: which figure a change needs differs).
- [ ] Each project runs the newest engine, or the answer says what it waits on (judgment: a project's session decides when its own work is committed).
- [ ] The last full round found no issue, or the answer lists what is open (judgment: the answer is the record).

## Pitfalls
- A full run that restarts on every newer commit never finishes. Freeze the commit under test as the release
  candidate (improvement-loop.md step 1), ship it, and test later fixes together in the next batch.
- Before every frozen run, upgrade a scratch project made from the starter (with `tools/hooks/v2` deleted first) using
  `--no-selftest`, and read its output for errors and "ENGINE DOES NOT RUN HERE". It takes seconds, and on 2026-11-05 it
  caught an upgrade crash that cost a 20-minute frozen run.
- A release ships with its own engine proof, or every project's upgrade runs the whole self-test (over 10 minutes on a
  shared machine, 2026-11-05). After the frozen run passes, commit its `tools/hooks/engine-proof.json` in the frozen
  worktree ("Engine proof", on top of the candidate), merge that commit into `main`, and fast-forward the linked
  copies to it. A passing run that prints no `proof:` line left the proof unchanged: the files the release changed are
  outside `PROOF_PATHS` (tools/hooks/selftest-cache.mjs). Add them there with a test; never ship that release
  (2026-11-05: a release that changed only engine v2 kept the old proof).
- A figure measured beside the code is no proof of what the code does. A reminder line was shipped on a side count of
  "a few of 38 requests"; a replay of the shipped commit showed it on nearly every routed turn, with reminders about
  30% longer until the next batch (2026-11-06). A wait of a day is acceptable for extra reminder text. A wrong block
  justifies shipping the fix early.
- A hook time or a quiet log is no proof the engine runs. A crashed hook is fast and silent: v2 could not load in two
  projects for days while their reports showed a 67 ms Stop and no false asks (2026-11-05). A project's engine report
  counts only with at least one real reminder or block seen in its newest transcript, and the transcripts are searched
  for `[hooks` errors and `CRASHED` each round.
- An upgrade run while the project's session works there rolls back under its load and can't put back files the
  session is writing.
- A test that fails only in one project usually traces to what that project lacks (a skill the upgrade never
  installed, a list that only fits the starter): compare the project with the starter before blaming the code.

## Related
- [field-report](field-report.md), [improvement-loop](improvement-loop.md), [engine](../../../docs/playbooks/engine.md)
