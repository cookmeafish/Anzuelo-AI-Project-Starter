---
name: project-sweeps
description: Runs the project's quality sweeps (tools/audit.mjs structure, routing, rules, skills, packs, publish safety, plus the hook self-tests and ablation tests), reports each result, fixes every failure, and does a gaps review of requests no runbook or check covers. Use when the user asks for sweeps, an audit, QA of the project, a health check, a gaps review, "what's missing", "make sure everything is enforced", or menu codes E1 / E3.
runbook: docs/playbooks/project.md
---
# Project sweeps

## Steps
1. Run `node tools/audit.mjs --full`. It runs every structural sweep, the publish-safety scan, the hook self-tests and
   the ablation tests (every required step of a workflow, removed one at a time, must be blocked).
2. Report every sweep: PASS / WARN / FAIL plus one line. If the user asked for a number of sweeps, report exactly that
   many, adding gaps-review sweeps to reach it.
3. **Fix every FAIL** in the project or the hook. Never weaken a test or delete a check to make it pass. Re-run until
   PASS. Fix WARNs that are cheap to fix or risky to leave.
4. **SKILL CLEANUP DUE** in the session notice: handle it with the skill-curate skill.
5. **Gaps review** (E3, or when the sweeps are asked for in depth):
   - Is every typical request in `docs/BRIEF.md` and every row of `docs/checks/user-requirements.md` routed to a
     runbook and enforced by a tag?
   - Does every runbook "Done when" item that could be checked have a check?
   - Route the user's last ~10 real requests: `node tools/hooks/selfcheck.mjs --route "<request>"`. Any that match
     nothing, or the wrong runbook, need triggers.
   - Which rules are judgment-only (`doc`)? Could any be checked now?
   - Rank gaps by likelihood × harm, and fix the top ones (runbook-create, project-rule) unless the user only wants
     the list.
6. Add a CHANGELOG line, update STATUS if anything changed, and end with a Finished section.
