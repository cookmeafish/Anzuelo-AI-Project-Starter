---
name: project-watch
summary: Watch the projects that run the engine - how they perform, what breaks - fix the engine here and upgrade them
triggers: project watch round, project watch, check up on the projects, check on the projects, watch the projects, in charge of the projects, performance of the projects, how are the projects doing, keep the projects running well, update anzuelo on the projects, upgrade the projects, projects bug free
---
# Project watch (starter only)

The starter session looks after every project that runs the engine (the list, with each project's folder, linked
starter copy, session name and engine commit, is in `tools/starter/watch.local.json`, which git ignores: project names
and paths never go into the starter): it checks how they run, fixes what is wrong in the engine here, and brings each project up to
date. A project's own content is its session's; this runbook changes only the engine. New projects never get this file.

## Steps
1. **Look, per project, without touching its files:**
   - Its session: busy or idle (the host's list of sessions). Messages it sent and its `docs/starter-feedback.md`.
   - Which engine it runs: its upgrade commits (`git log --grep "Engine upgrade"`) against the starter's `main`.
   - Hook speed: the newest upgrade log or `tools/hooks/state/runs.jsonl` (prompt, pretool and Stop times against
     their budgets).
   - Its self-test: the last full run (`.cache/selfcheck-last.txt`); run it again only when nothing else is running.
   - What the user met: upset messages and false alarms in `tools/hooks/state/triggers.jsonl`, hook errors and blocked
     turns in its newest session transcripts.
2. **Each problem gets a confirmed cause** from that evidence (the field-report runbook, steps 2 to 4): the engine's
   are fixed here with a self-test that fails without the fix; one in the project's own files goes to its session
   as what to change, never edited from here.
3. **Ship it:** the full self-test and the audit, then commit (the user's standing OK; never push without asking).
4. **Upgrade each project, in batches:** at most once a day, or sooner only for a fix the project is paying for now.
   Engine upgrades were about 45% of one project's commits (2026-11-05). Fast-forward its linked starter copy from this folder
   (`git -C <copy> pull --ff-only <starter> main`), then hand the upgrade to its session (open
   `docs/playbooks/engine.md` and record its checklist, which its hooks route the message to: without that line each
   upgrade turn spent two Stop rounds on it; commit its own work,
   `starter.mjs upgrade --dry-run`, `upgrade`, `node tools/hooks/selfcheck.mjs --full`, report back; the plain
   self-test reuses the engine's recorded results, so a handoff that means every test names `--full`). Upgrade from here only when no session works there and
   it has nothing uncommitted (engine runbook, Pitfalls).
5. **Confirm** each project's report: new engine commit, no checks failing that passed before, hook times. A
   regression is a new problem: back to step 2.
6. **Repeat until a round finds nothing:** every issue found goes back through step 2 (the matching runbook or
   skill: debug for anything that behaves wrong), is fixed, retested here and in the project, and the round runs
   again. The job is done only when a full round over every project finds no issue. (The user, 2026-10-29: "fix them
   and retest and repeat until issues gone")

## Done when
- [ ] Each watched project was looked at on every point of step 1, or the answer says which could not be (judgment: what each project exposes differs).
- [ ] Every problem found has a confirmed cause, and each engine cause a fix with a self-test that fails without it (hook: hooks-tested).
- [ ] The fixes were committed with the user as the only author, not pushed (hook: no-ai-attribution).
- [ ] Each project runs the newest engine, or the answer says what it waits on (judgment: a project's session decides when its own work is committed).

## Pitfalls
- A full run that restarts on every newer commit never finishes, and the projects never get the upgrade. Freeze the
  commit under test as the release candidate: let its run finish and ship it, and test later fixes together in the
  next batch.
- A release ships with its own engine proof, or every project's upgrade runs the whole self-test (over 10 minutes on a
  shared machine, 2026-11-05). After the frozen run passes, commit its `tools/hooks/engine-proof.json` in the frozen
  worktree ("Engine proof", on top of the candidate), merge that commit into `main`, and fast-forward the linked
  copies to it.
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
