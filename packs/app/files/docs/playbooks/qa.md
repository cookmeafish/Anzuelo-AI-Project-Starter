---
name: qa
summary: QA - the user saying "QA" means QA failed (find the miss, fix it, harden the process); QA sweeps of the whole app with independent auditors; reviewing a change or pull request before merge; planning what to test; answering review comments and fixing failing CI
triggers: qa, quality assurance, qa failed, did you test, did you check, test everything, bug sweep, sweeps of the app, audit the app, review the app, look for bugs, find bugs, is it broken, code review, review this pr, review the pr, review my changes, review the diff, review this change, before i merge, test plan, test strategy, how should we test, what tests do we need, address review comments, review comments, reviewer comments, fix the pr comments, ci is failing, ci failed, failing ci, fix ci, checks failing on the pr, my pr, e2e test, end to end test, before launch, test this
trigger_regex: \bQA\b
menu: A3
---
# Playbook: QA incidents, sweeps, change reviews, test plans and review follow-up

## Steps
### §1 QA missed something (QA incident: "QA failed", "the tests missed it", "did you test this?", a bug in checked work)
1. **Find the miss:** what is wrong, and why QA didn't catch it (which of the three checks was skipped, too shallow,
   or measuring the wrong thing).
2. **Fix it,** then re-run the full triple check (`docs/checks/qa-standards.md`), not just the one item.
3. **Harden the process** so it can't slip again: a check in requirements.json, a codeRule, a test, a runbook step,
   or a line in qa-standards.md. Add a line to `docs/lessons.md`.
4. **Report** under these labels: What slipped, Why QA missed it, Fix, Process change.

### §2 QA sweep of the app ("bug sweep", "audit the app")
1. Split the app into areas. For each area, an independent auditor (a fresh agent with AGENTS.md, the area's specs and
   `app-standards.md`) looks for real problems.
2. **Every finding needs evidence:** a reproduction, a failing test, or the exact code path with the input that
   breaks it. Findings without evidence are dropped. False findings are retracted openly.
3. Each new round includes a review of the previous round's fixes.
4. Fix by priority (data loss and security first), each fix by `bugfix.md`. Record the sweep in `docs/lessons.md`
   (one line per real finding class).
5. Stop when a full round finds nothing new, or report what is left.

### §3 Review a change before it is merged (a diff, branch or pull request)
1. **Get the change and its goal:** the diff against the base branch (`git diff <base>...HEAD`), or the pull request
   through the code host's command-line tool when one is set up. Read the spec, issue or description it claims to
   meet.
2. **Read all of it,** with enough of the surrounding code to see how it is called. Run the tests.
3. **Look through each lens,** most harmful first:
   - **Does it work:** it meets the stated goal; odd inputs (empty, missing, very large, negative, duplicate,
     non-English text); boundaries and counting off by one; errors caught and passed on, never swallowed; two
     requests or retries at the same time; missing values and wrong types.
   - **Security:** anything touching input, sign-in, permissions, files, secrets or outside services gets the
     **security-review** skill for that part.
   - **Data:** migrations can be undone; nothing is lost or overwritten silently (`app-standards.md`).
   - **Speed:** a query or call per item inside a loop; lists, queries or loops with no limit or paging; a new query
     with no index behind it; heavy work on a path that runs often; files, connections or listeners never closed.
     Measured slowness goes to `perf.md`.
   - **Tests:** the new behaviour and its edge cases are tested, and those tests would fail without the change.
   - **Readability:** names say what things are; each function does one job; no copy of an existing helper; a short
     comment where the reason is not obvious; it follows the patterns already in the code.
4. **Each finding** gives the file and line, what is wrong, the evidence (the input that breaks it, or a failing
   test), a level (blocker, should fix, or minor) and a suggested fix. Without evidence it is a question, not a
   finding.
5. **Verdict:** SHIP, FIX (with the blockers listed) or DISCUSS (a design question for the user). Name briefly what
   is good, so it is kept.
6. Comments on a pull request are outward actions: draft them, and post only with the user's OK.

### §4 Plan the tests ("how should we test this", "what tests do we need")
1. **List what would hurt most if it broke:** money, data, security, the main user flows, error handling and the
   spec's edge cases. These get tests first. Skip trivial accessors, framework code and throwaway scripts.
2. **Pick the cheapest test that would catch each one:** many fast unit tests for logic, fewer integration tests
   where parts meet (database, HTTP, files), and a few end-to-end runs of the main flows (screens through the
   gui-review-loop, gui pack). By kind:

   | What | Tests |
   |---|---|
   | API | Unit tests for the rules; request-level tests for each endpoint, including refused and bad requests; contract tests when other apps call it |
   | Data jobs | Bad input rejected; output correct for known input; safe to run twice |
   | Screens | Component and interaction tests; every state (empty, loading, error); accessibility; screenshots |
   | Running service | A quick check of the key flows after each deploy; a load test against the `docs/foundation.md` budgets; switch off a dependency and see it recover |
3. **Find the gaps:** compare the list with the tests that exist. A coverage report is a hint, not a target. Flaky
   tests count as gaps (debug skill, waiting on a condition).
4. **Write the plan** into the spec's Plan section (`feature.md`) or `docs/specs/<area>-tests.md`: the risk, the test
   type, example cases and status. Report the gaps as findings, then write the tests in priority order.

### §5 Answer review comments and fix failing CI
CI (continuous integration) is the build server that runs the checks on every push or pull request.
1. **Collect everything first:** every open review comment and thread, and the log of every failing check, read to
   the first real error. The GitHub CLI (`gh pr view --comments`, `gh pr checks`, `gh run view --log-failed`) makes
   this quick but is optional (`docs/recommended-tools.md`); the code host's web page works too. A check run by an
   outside service: note its link and what it says.
2. **List them as findings,** one line each: the comment or check, what it claims, and what a fix would take.
3. **Verify each claim before agreeing.** Reproduce the bug the reviewer describes, or read the code path they point
   at. A reviewer can be wrong, and so can a flaky check. Agreeing with a wrong comment adds a bug; brushing off a
   right one ships one.
4. **Then fix or explain:**
   - claim holds: fix it at the root (a failing test first, as in the debug skill), one comment at a time;
   - claim doesn't hold: draft a short, polite reply with the evidence (the test, the line, the output);
   - unclear or a design choice: ask the user, as a DISCUSS item.
5. **Failing CI** goes through the debug skill: the log is Phase 1 evidence. Run the same command locally first. A
   check that passes locally but fails in CI is a difference to list (versions, environment values, caching, order).
   Never skip, disable or loosen a check to make it pass without the user's OK.
6. **Re-run the checks** locally, then confirm the CI results after the push.
7. **Outward steps need the user's OK** (rule 6): posting replies, resolving threads, pushing and re-running CI on the
   host. Draft the replies and show them with the diff first.

## Done when
- [ ] Incident: the answer has "What slipped", "Why QA missed it", "Fix", "Process change", and a lessons line was added (hook: qa-incident).
- [ ] Sweep: every finding has evidence; the answer lists rounds, findings, fixes and what is left (hook: qa-report).
- [ ] Change review: every finding has a file, line, evidence and level, and the answer ends with SHIP, FIX or DISCUSS (hook: qa-report).
- [ ] Test plan: risks ranked, a test type for each, and the gaps listed as findings (hook: qa-report).
- [ ] Review comments and CI: every comment and failing check is listed as a finding marked fixed, answered with evidence, or DISCUSS; checks pass locally; nothing was posted or pushed without the user's OK (hook: qa-report).

Ideas in §3 and §4 come from the code-review and testing-strategy skills of anthropics/knowledge-work-plugins
(Apache-2.0).

Credits: §5 draws on "gh-address-comments" and "gh-fix-ci" in openai/skills (Apache-2.0) and "receiving-code-review"
in obra/superpowers (MIT).
