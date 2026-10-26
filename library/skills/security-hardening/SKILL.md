---
name: security-hardening
description: Runs a planned, staged hardening project on an existing app (threat model, inventory of what is exposed, fixes ranked by risk, then secrets, dependencies, input handling, authentication and authorization, transport, logging, and safe defaults), with a regression test for every fix and a verification pass at the end. Use after a security review (security-review skill) found problems, before making an app public or adding users, after an incident, or when the security baseline (docs/security.md plus the app rows in docs/foundation.md) is not met. This skill fixes; security-review finds.
triggers: harden the app, harden the server, harden the api, harden the site, security hardening, security overhaul, fix the vulnerabilities, lock it down, make it secure, security fixes
---
# Security hardening: fix by risk, prove every fix, keep it fixed

A review lists problems. Hardening removes them, biggest risk first, proves each fix with a test, and adds checks so
the same class of problem can't come back. It is a staged project, not a pass of quick patches.

Say at the start: "Hardening plan first (security-hardening skill)." Save the plan to
`docs/plans/YYYY-MM-DD-security-hardening.md` and update it as stages finish.

**Inputs:** the baseline (`docs/security.md` for the project, `docs/foundation.md` section 1 for the app rows), the
Security section of `docs/checks/app-standards.md`, and the latest security-review report (areas with result,
severity and evidence). No review yet, or older than the code? Run the **security-review** skill (a core skill) first.
Both skills use the same areas and severity scale; each review area maps to one stage below
([references.md](references.md)).

## 1. Threat model (short)
Start from the review's threat model when there is one; fill gaps rather than redo it.
1. What we protect: data, keys, the user's machine, other users, money, availability.
2. Who could attack, and from where: the internet, a web page in the same browser, other local apps, other users of
   the app, malicious files or content, a compromised dependency.
3. Trust boundaries: every place data crosses from less trusted to more trusted (network, file, IPC, plugin, model
   output, user content). At each one ask the review's six questions: pose as someone else, alter, deny, read, knock
   over, gain rights.
4. If the answers changed, update `docs/security.md` and `docs/foundation.md` section 1 with the user, and date it.

## 2. Inventory what is exposed
List every entry point and asset: listening ports and routes, file and URL inputs, uploads, spawned processes, stored
secrets, outbound calls, admin functions, auth flows, third-party dependencies. The codebase-map skill helps on a
large app. Each item gets an owner file and the boundary it sits on.

## 3. Rank the fixes
Merge the review findings and the inventory into one list. Score each on ease of attack, impact and reach, and give
it a severity: critical, high, medium or low (scale in [references.md](references.md), same as the review's). Order:
critical, then high, then the rest; within a level, cheap fixes first. Put the ranked list in the plan, one task per
fix (plan skill format), each naming its review area and stage. Ask the user before any fix that changes behavior
they rely on (logins, URLs, file locations, data formats). Record the starting numbers: open findings per severity,
and the lead count from the pattern sweep (`skills/security-review/scripts/risky-patterns.mjs`).

## 4. Fix in stages
One stage at a time. Each fix: a failing test that shows the hole, the fix at the source, that test and all others
pass. Then search for the same pattern elsewhere and fix it too. Per-stage checklists: [references.md](references.md).
Stages that touch separate files can go to parallel sub-agents (parallel-agents skill), each with its own failing
tests; a fresh agent checks every fix before it counts.
1. **Secrets:** out of code, logs, history and build output; rotate any that ever leaked; load from ignored files or
   a secret store.
2. **Dependencies and updates:** audit with the stack's tool, upgrade or replace what is vulnerable or unmaintained,
   pin with a lock file, remove what is unused, and make app updates come signed or from one trusted source.
3. **Input handling:** validate every input at the boundary against a schema (type, size, format, allowed values);
   no paths, shell commands, queries, code or HTML built from raw input; no unsafe merges or deserialization; outbound
   URLs on an allowlist; encode output for where it lands.
4. **Authentication, authorization and money:** strong password hashing (old hashes upgraded at next sign-in) or a
   trusted provider, generated credentials instead of default ones, safe sessions and tokens, a permission check on
   the server for every action and every object with deny by default, and amounts and signatures checked on the
   server before value moves.
5. **Transport and exposure:** TLS for anything off the machine, local servers on loopback with Host and Origin
   checks, strict CORS, security headers, request size and rate limits.
6. **Errors and logging:** no stack traces or secrets to users or logs; log security events (logins, denials,
   admin actions) with enough context to investigate.
7. **Safe defaults:** least privilege for processes, files and service accounts; features that widen exposure are
   off until switched on.
8. **Infrastructure, pipeline and recovery** (when the app is hosted): least-privilege roles and multi-factor for
   people, private data stores and admin ports, a locked-down build pipeline, automatic backups with a tested restore,
   and a short incident plan.

## 5. Keep it fixed
1. Turn each fixed pattern into an automatic check where possible: a lint rule, a code rule, a test, a CI audit step.
2. Fill the "Security scan" row of the quality gates in `docs/foundation.md` with the real command and cadence.
3. Record decisions and accepted risks (with the reason and who accepted them) in `docs/DECISIONS.md`.

## 6. Verify
Run the security-review skill again on the hardened app, plus the plan's attack tries against an isolated instance.
Every earlier FAIL is now PASS with evidence, or an accepted risk on record. Report before and after: open findings
per severity, the pattern sweep lead count, and the tests added (every fixed hole, plus an unauthenticated and a
wrong-user test for each protected route).

## Done when
- [ ] The plan in `docs/plans/` has a threat model, an inventory and a ranked fix list (severity, review area and stage per item) (hook: hardening-plan).
- [ ] No critical or high finding is left open: each is fixed, or an accepted risk the user signed off in `docs/DECISIONS.md` (judgment: severity and sign-off need a reviewer).
- [ ] Every fixed issue has a regression test that failed before the fix and passes now (judgment: no check sees each test fail before the fix).
- [ ] Leaked secrets were rotated, not just removed from the code (judgment: rotation happens outside the project).
- [ ] The dependency audit is clean or each remaining finding is an accepted risk with a reason (judgment: whether a risk is acceptable is a call).
- [ ] A fresh security-review pass shows PASS or accepted risk for every item, with evidence, and the before and after numbers are in the answer (judgment: the review verdicts need a reviewer).
- [ ] New automatic checks cover the fixed patterns, and `docs/security.md` and `docs/foundation.md` are current (judgment: which patterns a tool can catch needs a reviewer).

## Pitfalls
- **Fixing in the order found** instead of by risk. The worst hole stays open while easy items get done.
- **Deleting a leaked secret without rotating it.** It is still in history, backups and forks.
- **Blocklists.** Filtering known-bad input misses the next variant. Allow known-good instead.
- **Checking permissions in the client only.** Anything the client enforces, an attacker can skip.
- **Rolling your own crypto, hashing or session handling.** Use the platform's vetted libraries.
- **Big-bang rewrites.** Many fixes at once hide which one broke the app. One fix, one test, one commit.
- **Claiming it is secure.** Say what was checked and how. Hardening lowers risk; it does not prove absence.
- **Chasing a score.** A clean audit or a quiet sweep is a means. The measure is closed findings, each with a test.
- **A path check that compares text prefixes.** A base folder `/data/app` also matches `/data/app-old`; compare
  against the base plus a separator, after resolving links.
- **Fixing one instance.** The same hole usually sits in every place that copied the pattern; search before closing.

Inspired by "V3 Security Overhaul" in ruvnet/RuView (MIT, see LICENSE and [SOURCE.md](SOURCE.md)).
