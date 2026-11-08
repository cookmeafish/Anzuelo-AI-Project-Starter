# Questions follow their runbook, and knowledge answers are backed by evidence: plan

status: open

Related: [[2026-11-07-engine-outside-the-project]], [[2026-11-07-only-the-simple-engine]]

**Goal:** a question that routes to a runbook is held to it at the end, and an answer from a knowledge runbook is
traced to sources read in the same turn, so it is accurate and not made up.
**Done when:**
- A routed knowledge-answer runbook and an answer turn that never opened it: blocked. An unrouted question: free.
- A made-up citation, an answer with no source read, and a quote not found in the source each block; a properly
  sourced answer passes.
- A replay over real sessions reports the extra question-turn blocks as totals, real vs false, before shipping.
**Approach:** end check only, nothing during work (AGENTS.md rule 18). Lift the "files changed" gate when a runbook
routed; add three evidence checks that knowledge runbooks get by default; the fresh reviewer judges the rest on
knowledge-runbook turns only.
**Built with:** Node, tools/hooks/v2 (end.mjs, lib.mjs), the knowledge pack runbooks.
**Spec:** the user's requests of 2026-11-07, relayed from another terminal: knowledge projects route questions to
runbooks to find the most useful information; knowledge runbooks need accuracy checks so the output is backed by
evidence, not inference.
**Assumptions:** questions with nothing routed stay free; question turns get no verify list, only checkable markers.
Cost if wrong: one config switch.
**Confidence:** 6/10. Main risk: broad triggers route casual questions and cause false blocks; the replay measures it,
and broad triggers get tightened rather than questions exempted.
**How to resume:** any session or agent: run `node skills/plan/scripts/plan-tasks.mjs next <this file>`, or find the
first unticked box by hand. Read the dated notes first. Ticked boxes are done; never redo them. When every box is
ticked and the checks pass, change the status line to `status: done`; to stop for good, `status: dropped - <why>`.
A run that is stuck sets `status: blocked - <reason>` with `Tried:` and `Options:` notes; read those first.

## Notes
- 2026-11-08, Task 1: a routed question is held to opening its runbook and to its answer items only (never file or
  command items). Replay over real project sessions: all 13 routed no-work turns it would have held were notes from
  another session (all false), so those are excluded; typed routed questions held: 0. Little real data yet on typed
  questions: measure again after the next upgrade.
- 2026-11-08, Task 2: the "(evidence)" marker on a runbook or skill item (the research skill has it; runbook-create
  explains it). It applies to typed questions only, never work turns (facts written into files keep knowledgeGaps).
  Checks: something was read; a cited file or link exists or was read, fetched or found by a search this turn; a quote on
  a line with a source the turn read is that source's words; the answer names a source or says "not found in ...".
  Replay of the strict first version on every question turn of two projects: 94 of 113 flagged, mostly false (files
  read in earlier turns, quotes of the user or of screens, status notes). After narrowing: 9 "made up" citations (files
  missing now, maybe deleted since; can't be settled) and 54 "names no source", which apply only where a runbook asks
  for evidence. Real routed or research-skill question turns in the data: 0, so measure live after the next upgrade.
- 2026-11-08, after Task 2: a live false block. A scheduled status prompt routed to the broad project runbook was held to
  it under Task 1, and a plain "the project runbook doesn't fit" never cleared the ask to open it (all 3 rounds used).
  Fixed: a question is held only to a routed runbook made for answers (one with an "(evidence)" item), and a not-fit
  line naming the runbook (path, file name or "the <name> runbook") clears its Open ask and all its items.

## Context
- `tools/hooks/v2/end.mjs`: missing() and the others return nothing unless worked(acts) (lib.mjs, edits only).
- `tools/hooks/v2/lib.mjs`: knowledgeGaps checks only facts written into knowledge files.
- `tools/hooks/v2/selftest.mjs`: the test asserting question turns are exempt gets flipped.
- AGENTS.md step 0.4: "A quick question ... needs no runbook" gets reworded.
- Trap: starts only after the 475922a batch is pushed and the projects upgraded.

## Checks for this project
- v2: `node tools/hooks/v2/selftest.mjs`; all: `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs`, `node tools/audit.mjs`

## Watch for
- Broad triggers that route small talk; a question answered from a file the user pasted (counts as read).

## Constraints for every task
- End check only; at most 3 blocks a turn; no notice during work.

---

### Task 1: questions are held to a routed runbook
**Files:** `tools/hooks/v2/end.mjs`, `tools/hooks/v2/selftest.mjs`, `AGENTS.md`
**Uses / provides:** provides the question-turn path Task 2 uses
- [x] Test first: routed knowledge-answer runbook, answer turn that never opened it: one block naming the runbook.
- [x] With a runbook routed, missing() runs whether or not files changed; no verify list on question turns.
- [x] Reword step 0.4: a question no runbook matches needs none; a question a runbook matches follows it.
- [x] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS, the flipped test included.

### Task 2: evidence checks for knowledge answers
**Files:** `tools/hooks/v2/lib.mjs`, `tools/hooks/v2/end.mjs`, `packs/knowledge/files/docs/playbooks/*.md`, `tools/hooks/v2/selftest.mjs`
**Uses / provides:** uses Task 1
- [x] Read before answering: a knowledge or web source was read (Read, Grep, WebFetch) before the final answer.
- [x] Every file path or URL the answer cites was read this turn; quoted text appears in what was read.
- [x] No source named in a factual answer: one ask to cite each fact, or label it as inference or not found.
- [x] Knowledge pack question runbooks get these as "Done when" items; judgment beyond them goes to the fresh reviewer
      on knowledge-runbook turns only.
- [x] Tests: made-up citation, no source read, quote not in the source each block; a sourced answer passes.
- [x] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS.

### Task 2b: answers from several sources (user, 2026-11-07: "very critical all output is accurate")
**Files:** `tools/hooks/v2/lib.mjs`, `tools/hooks/v2/end.mjs`, `packs/knowledge/files/docs/playbooks/*.md`, `tools/hooks/v2/selftest.mjs`
**Uses / provides:** uses Task 2
- [x] Checkable: each factual sentence or bullet carries its own source (not one list at the bottom); when no read
      this turn matched the question, the answer says "not found in <sources searched>".
- [x] Reviewer-judged (knowledge-runbook turns only): conflicting sources shown side by side with their sources, never
      merged or picked silently; inference only when labeled and kept apart from sourced facts.
- [x] Tests: one source list for a whole answer, a best guess where nothing was found, each block; a per-fact sourced
      answer and a correct "not found" pass.
- [x] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS.

### Task 2c: apps the projects build that answer from sources (app pack)
**Files:** `packs/app/files/docs/playbooks/feature.md`, a trial project under `tools/starter/trials/`
**Uses / provides:** none
- [ ] feature.md gets conditional "Done when" items for a feature that answers end users' questions from sources:
      answers only from retrieved sources with citations; "not found" instead of a guess; conflicts shown; an
      evaluation suite of real questions with expected source and answer, plus unanswerable ones that must return
      "not found", run as the project's test command.
- [ ] Research the method first (retrieval-augmented generation evaluation practice, 2+ primary sources) and cite it.
- [ ] Measure on a trial project before shipping: run `node tools/trial.mjs` with a source-answering app case.
      Expected: the items fire on that case and not on unrelated features.

### Task 2d: a project's own accuracy hooks (user, 2026-11-07)
**Files:** `SETUP-PROMPT.md` (adoption review), `docs/playbooks/engine.md` (upgrade review)
**Uses / provides:** uses Tasks 2 and 2b
- [ ] Established knowledge projects may already double- or triple-check answers with their own hooks. Adoption and
      upgrade list each one and convert it to the engine's end-check markers only when that is measurably more
      efficient (time and tokens per answer turn, from the project's own sessions) and checks no less; otherwise it
      stays as it is (surgery, rule 16). Each conversion is an `- improve:` line in the adoption review.
- [ ] Run `node tools/writing-check.mjs SETUP-PROMPT.md`. Expected: PASS.

### Task 3: replay and ship
**Files:** none new
**Uses / provides:** uses Tasks 1 and 2
- [ ] Replay real sessions: extra question-turn blocks as totals, real vs false; tighten broad triggers behind false ones.
- [ ] Run `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs` and `node tools/audit.mjs` on a frozen copy. Expected: 0 failed.
