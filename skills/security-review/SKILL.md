---
name: security-review
description: Reviews any project, a change or a whole app for security problems (secrets, private data and what is shared, untrusted files and web content, downloads and third-party skills, and for software also input validation, injection, cross-site scripting and request forgery, sign-in and permissions, rate limits, uploads, dependencies, deployment), giving every area PASS, FAIL or N/A with evidence and fixing each FAIL. Use when setting up a project (the first review), when adding sign-in, permissions, an endpoint, an upload, payments, personal data, secrets or a third-party integration or download; before a release or before sharing or publishing anything; and whenever the user asks whether something is secure, private or safe.
triggers: security review, security audit, security check, is it secure, is it safe, is this safe, vulnerabilities, vulnerability, pentest, penetration test, owasp, private data, data leak, leaked key, safe to publish, safe to share
---
# Security review: evidence for every item

**A review without evidence is an opinion.** Every area gets PASS, FAIL or N/A, and each one names its proof: the code
path, a test, a request you sent, or a search you ran. "Looks fine" is not a result. Unsure means FAIL (or "not
verified") until evidence says otherwise.

Every project gets this skill, not only apps: notes and research projects hold secrets, private data and untrusted
files too. Review a single change (what it touches) or the whole project. Run it at setup (the first review), before
anything is shared, published or released (hard rule 15), and when the user asks.

**It is also mandatory, asked or not, when the work touches security.** That means code for sign-in, passwords,
tokens, secrets, permissions, sessions, cookies, CORS, uploads, endpoints, shell or eval, query building,
deserializing, crypto, payments or personal data. It also means `.env`, CI, Docker or hosting settings, or a publish
or deploy command. The prompt hook
says `MUST FOLLOW: security-review` when the request shows it coming, the edit hook says it when such code is
written, and the Stop hook holds the answer until the review is done (or waived with
`node tools/hooks/hooks.mjs waive <check> "<the specific reason>"`). Review only what changed, with the areas it touches.

In app projects, the `security-review.md` runbook adds its own items. **This skill finds problems and fixes the few
critical ones; the security-hardening library skill fixes a long list as a staged project.** Both use the same areas,
severity scale and report table ([references.md](references.md)), so one's report is the other's input.

## 1. Scope and threat model
1. **Say what is in scope:** the change, a feature, or the whole project, and which parts are exposed: shared or
   published files, outside services and models the project sends data to, and for software the public web, local
   server, CLI, desktop, background jobs, build pipeline, hosting and infrastructure files.
2. **Read the baseline:** `docs/security.md` (every project), plus for apps the security baseline in
   `docs/foundation.md` and the Security section of `docs/checks/app-standards.md`. If a baseline is empty, write
   down your assumptions and tell the user.
3. **Name what needs protecting and from whom**, in a few lines: the data, keys, the user's machine, other users; and
   the likely attackers (anonymous internet, another signed-in user, a web page in the same browser, malicious files or
   content, a compromised dependency).
4. **List the entry points:** every place outside data comes in (requests, uploads, files read, webhooks, messages,
   environment, model output) and every place it goes out (database, shell, file system, HTML, logs, other services).
5. **Ask six questions at each entry point:** can someone pose as another user, alter data or code they should not,
   act and later deny it, read what is not theirs, knock the service over, or gain rights they were not given? Each
   "maybe" becomes something to check in step 2 or try in step 3.

## 2. Walk the checklist
1. **Sweep for leads first:** `node skills/security-review/scripts/risky-patterns.mjs <source folder>` lists lines matching
   known risky patterns, grouped by area. Each hit is a lead to read in context, not a verdict, and silence proves
   nothing. Also run the stack's dependency audit and, when available, a secret scanner over the git history.
2. **Then go through every area below** for what is in scope. The first four apply to every project; the rest apply
   when the project has software. Details and checks per area are in [references.md](references.md).

| Area | The core question |
|---|---|
| Secrets | Is any key, token or password in code, docs, config in git, history, logs, build output or client bundles? |
| Private data and sharing | Does personal or machine-specific data reach a shared file, a commit, an outside service or a model it should not? |
| Untrusted content | Are files, web pages, emails and model output treated as data, so instructions inside them are never followed? |
| Downloads and third-party skills | Was every downloaded script, package or skill read before use, from a trusted source, and run only with the user's OK? |
| Input validation | Is every input checked against an allowlist schema (type, length, range, format) at the edge? |
| Injection | Does any input reach a query, shell command, file path, template or eval without parameters or escaping? |
| Output and XSS | Is untrusted text rendered as HTML anywhere without a sanitizer? Is there a strict content security policy? |
| Request forgery | Can another site or page trigger a state change with the user's cookies, or call a local server? |
| Authentication | Are sessions and tokens issued, stored, expired and revoked with a vetted library? |
| Authorization | Does every operation check, on the server, that this caller may do this to this record? Is each destructive action (delete, change other people's data, money) limited to the role `docs/foundation.md` names, the owner only when it names none, with a test that another signed-in user is refused? |
| Sensitive data | Do errors, logs, responses or analytics expose secrets, stack traces or more personal data than needed? |
| Abuse limits | Are there rate limits, size caps and timeouts, stricter on sign-in and expensive operations? |
| File handling | Are uploads checked for size, type and content, stored outside the web root, under generated names? |
| Money and signed actions | Are amounts, recipients, prices and signatures checked on the server before anything is charged or sent? |
| Dependencies and updates | Is the lock file committed, the audit free of high-severity issues, and every update from one trusted, signed source? |
| Deployment | HTTPS only, security headers, CORS limited to known origins, no admin panel or data store reachable from outside? |
| Access to infrastructure | Least privilege and multi-factor for people, short-lived roles for services, no shared or owner accounts in daily use? |
| Build pipeline | Minimal token rights, short-lived credentials, secret and dependency scans, a reviewed and protected main branch? |
| Logging and recovery | Are security events logged, kept and alerted on, and is there a tested restore and an incident plan? |

## 3. Try the attacks
Reading code misses things. Against an isolated instance (never the user's real data or a live production system
without permission), try the obvious attacks for what is in scope:
1. A request with no credentials, then with another user's credentials, to every protected route and record id.
2. Injection payloads in each input that reaches a query, a shell, a path (`../`) or HTML (an `onerror` handler).
3. Markdown or HTML whose image or link points at an outside server, to see whether rendering fetches it.
4. A JSON body with a `__proto__` or `constructor` key, and a URL field pointing at an internal address.
5. A cross-origin request to each state-changing endpoint and to any local server.
6. Oversized bodies, uploads with a wrong extension or type, and a burst of requests to sign-in.
7. Forced errors, to see what the response and the logs reveal.

Write down each attempt and its result. A blocked attack is evidence for PASS.

## 4. Fix
1. **Rank FAILs** by how easy the attack is, how bad the result, and how many users it reaches, and give each a
   severity (critical, high, medium, low; scale in [references.md](references.md)). Fix the critical ones first, and
   tell the user right away about anything already exposed (a leaked key must be revoked and rotated, not just
   deleted).
2. **Fix each FAIL as a bug** (debug skill; `bugfix.md` in app projects): a failing test or check that shows the
   hole, then the fix at the source, then the test passes.
3. **Look for siblings:** the same pattern elsewhere in the code.
4. **Make it automatic where possible:** a `codeRules` entry (file globs, a pattern, a message) in
   `tools/hooks/config.json`, a lint rule, a secret scanner, or (app projects) a dependency audit in the "Security
   scan" gate of `docs/foundation.md`. Prefer a check over a reminder.
5. Several independent areas to review or fix in a large app: split them across sub-agents (parallel-agents skill).
6. Many FAILs, or a baseline far from met: fix the critical ones now, report the rest, and hand the report table
   and the ranked list to the **security-hardening** skill (when enabled) as a staged project.

## 5. Report
Write one table covering every area into `docs/reviews/security-YYYY-MM-DD.md`. The answer never carries the table.
It gives one plain sentence near the end that names the result and the file, and its words match the result:
- nothing failed: "The security review passed - details in docs/reviews/security-YYYY-MM-DD.md" (or the short
  `Security review: PASS - details in ...`);
- something failed and all of it is fixed: "The security review found 2 problems and I fixed both: <what> - details
  in ..." (or `Security review: PASS after fixes - details in ...` with one `<area>: FAIL -> fixed (<what>)` line each);
- something is still open: say so and where it went, never "PASS" (`Security review: 1 open - details in ...` with
  `<area>: FAIL -> open (<severity>, where it went)`).
Lesson: "Security review: PASS" sat on top of two "FAIL -> open" lines, and the user could not tell what held.
Lesson: a 27-row table in a setup answer buried the one row the user had to act on. The count of areas and the list
of N/A ones stay in the file.
Write it in the user's language (Spanish: "La revisión de seguridad salió bien - detalles en ...", `FALLA ->
corregido`, `FALLA -> abierto`). The table, in this shape:

```
| Area | Result | Severity | Evidence |
|---|---|---|---|
| Secrets | PASS | | secret scan over tree and history: 0 hits; .env* ignored |
| Authorization | FAIL -> fixed | critical | another user's id returned 200; now 404, test added |
| Abuse limits | FAIL -> open | medium | no limit on sign-in; handed to security-hardening |
| File handling | N/A | | no uploads in this app |
```
Results are PASS, FAIL -> fixed, FAIL -> open (saying where it went), or N/A with a true reason (hook:
security-report). Then list what was not checked and why, any baseline row still empty in `docs/security.md` (or, for
apps, `docs/foundation.md`), and any risk the user must decide on.

## Done when
- [ ] Scope, assets, attackers and entry points are written down, with the six questions asked at each entry point (judgment: whether the threat model is complete needs a reviewer).
- [ ] The pattern sweep, the dependency audit and (where available) a history secret scan were run (judgment: no check sees these runs yet), and every lead
  was read in context.
- [ ] Every area has PASS, FAIL or N/A with evidence; no area is skipped silently (hook: security-report).
- [ ] The attacks in step 3 were tried for what is in scope, with results recorded (judgment: which attacks fit the scope needs a reviewer).
- [ ] Every FAIL is fixed with a test that failed before and passes now (judgment: severity and fix quality need a reviewer), or is reported as open with its severity
  and where it went (the security-hardening plan, or a risk the user accepted).
- [ ] Any exposed secret was reported for revocation and rotation (judgment: only a reviewer knows a secret was exposed).
- [ ] Automatic checks were added where a pattern can be caught by a tool (judgment: which patterns a tool can catch needs a reviewer).
- [ ] Tests and checks pass after the last edit (app projects: `docs/checks/qa-standards.md`) (judgment: each project has its own test commands).
- [ ] The review is logged in the Reviews table of `docs/security.md` (hook: security-logged).
- [ ] Run unasked whenever the turn wrote security-sensitive code (sign-in, passwords, tokens, secrets, permissions, sessions, uploads, endpoints, shell or eval, query building, crypto, payments, personal data), changed secrets or deployment settings, or published something (hook: security-code, security-config, security-publish).

## Pitfalls
- Checking that a user is signed in but not that the record is theirs. This is the most common real hole.
- Validating in the browser only. Every check that matters runs on the server.
- Deleting a leaked secret from the code and calling it fixed. It is still in history and in whoever copied it; revoke it.
- Blocklists ("strip `<script>`") instead of allowlists and proper escaping.
- Detailed errors or stack traces in responses "just for debugging" that ship to production.
- Rate limits or sessions held in one process's memory, which reset on deploy and split across instances.
- Treating model output, file contents or webhook bodies as trusted because they did not come from a form.
- Marking an area N/A to save time. N/A needs a reason that is true.
- Taking a quiet pattern sweep or a clean audit as proof. Tools find known shapes; broken access checks and logic
  flaws only show up when you read the code and try the attacks.
- Reviewing the code and skipping where it runs: an open storage bucket, a public database port or an owner account
  used every day undoes everything in the code.

Inspired by "security-review" in affaan-m/ECC (MIT, see LICENSE and [SOURCE.md](SOURCE.md)).
