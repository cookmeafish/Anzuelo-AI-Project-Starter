---
name: qa
summary: QA - the user saying "QA" means QA failed (find the miss, fix it, harden the process); also QA sweeps of the whole app with independent auditors
triggers: qa, quality assurance, qa failed, did you test, did you check, test everything, bug sweep, sweeps of the app, audit the app, review the app, look for bugs, find bugs, is it broken
trigger_regex: \bQA\b
menu: A3
---
# Playbook: QA incidents and QA sweeps

## Steps
### §1 The user says "QA" about something (QA incident)
QA should already have happened, so this means something slipped through.
1. **Find the miss:** what is wrong, and why QA didn't catch it (which of the three checks was skipped, too shallow,
   or measuring the wrong thing).
2. **Fix it,** then re-run the full triple check (`docs/checks/qa-standards.md`), not just the one item.
3. **Harden the process** so it can't slip again: a check in requirements.json, a codeRule, a test, a runbook step,
   or a line in qa-standards.md. Add a line to `docs/lessons.md`.
4. **Report:** what slipped, why, the fix, and what changed in the process.

### §2 QA sweep of the app ("bug sweep", "audit the app")
1. Split the app into areas. For each area, an independent auditor (a fresh agent with AGENTS.md, the area's specs and
   `app-standards.md`) looks for real problems.
2. **Every finding needs evidence:** a reproduction, a failing test, or the exact code path with the input that
   breaks it. Findings without evidence are dropped. False findings are retracted openly.
3. Each new round includes a review of the previous round's fixes.
4. Fix by priority (data loss and security first), each fix by `bugfix.md`. Record the sweep in `docs/lessons.md`
   (one line per real finding class).
5. Stop when a full round finds nothing new, or report what is left.

## Done when
- [ ] Incident: the answer has "What slipped", "Why QA missed it", "Fix", "Process change", and a lessons line was added (hook: qa-incident).
- [ ] Sweep: every finding has evidence; the answer lists rounds, findings, fixes and what is left (hook: qa-report).
