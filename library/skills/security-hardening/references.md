# Security hardening: stage checklists

Use the items that apply to the stack. Each fix gets a test that fails before it and passes after.

## Where a review finding goes
Each area of the security-review report maps to one stage, so every FAIL lands in a plan task.

| Review area | Stage |
|---|---|
| Secrets | 1. Secrets |
| Dependencies and updates, Downloads and third-party skills | 2. Dependencies and updates |
| Input validation, Injection, Output and XSS, File handling, Untrusted content | 3. Input handling |
| Authentication, Authorization, Money and signed actions | 4. Authentication, authorization and money |
| Request forgery, Abuse limits, Deployment | 5. Transport and exposure |
| Sensitive data, Private data and sharing | 6. Errors and logging |
| (cross-cutting: privileges, risky features) | 7. Safe defaults |
| Access to infrastructure, Build pipeline, Logging and recovery | 8. Infrastructure, pipeline and recovery |

## Ranking a fix (same scale as security-review)
| Factor | Low | High |
|---|---|---|
| Ease of attack | needs local access, rare conditions or insider knowledge | remote, no sign-in, a known technique |
| Impact | a minor leak of non-personal data | code execution, account takeover, data loss, key theft, money moved |
| Reach | one user, an opt-in feature | every user, the default setting |

- **Critical:** high on impact and on at least one other factor. First in the plan.
- **High:** high on two factors.
- **Medium:** high on one factor.
- **Low:** defense in depth, or an accepted risk on record.

Two more questions break ties: how easy is it to find (a public endpoint versus a buried option), and does it
reproduce every time? Easier to find and reliable to repeat goes first.

## 1. Secrets
- Search code, config, history and build output for key patterns: `git log -p | rg -i "api[_-]?key|secret|token|password|BEGIN .*PRIVATE KEY"`,
  or a scanner such as gitleaks or trufflehog if available.
- Rotate every secret that ever reached a commit, a log, a ticket or a shared build. Then remove it from the code.
- Secrets load from ignored files or a secret store at runtime. Client bundles and client-exposed env prefixes carry
  none.
- Generate keys, tokens and first-run passwords with a cryptographic random source, never a fixed, default or
  predictable value.
- Hosted apps: a rotation schedule, automatic rotation for database credentials where offered, and logged access.

## 2. Dependencies and updates
- Audit with the stack's tool: `npm audit`, `pip-audit`, `cargo audit`, `govulncheck`, `bundler-audit`, OWASP
  Dependency-Check, or the hosting platform's alerts.
- Upgrade, replace or remove each finding. Commit the lock file and install from it exactly in CI. Remove unused
  packages.
- Prefer maintained packages with a clear owner. Watch for install scripts and typo-squatted names.
- Set the cadence (the "Security scan" gate in `docs/foundation.md`) so the audit keeps running after this project.
- App updates and installers: signed, or served from one trusted source only (foundation.md, section 1).

## 3. Input handling
- One schema per input at the boundary: type, length, range, format, allowed values. Reject, don't repair.
- Paths: resolve against a fixed base directory (after following links) and reject anything outside it. Compare
  against the base plus a separator, not a bare text prefix. Never use client input as a path directly.
- Commands: spawn with an argument list and no shell; never interpolate input into a command string. Windows batch
  files need a shell, so call them only with fixed arguments, or call the real program. Give every spawned process
  an error handler.
- Queries: parameterized statements or the ORM's binding, never string concatenation, including inside the ORM's raw
  query helpers.
- Dynamic code: remove `eval`, function constructors and string timers that touch input. A fixed table from names to
  functions replaces most of them. If code must run, use a real sandbox with a time limit, not a language-level trick.
- Object merges: drop `__proto__`, `constructor` and `prototype` keys, validate with a schema before merging, or keep
  untrusted keys in a map or a prototype-free object.
- Deserialization: never deserialize untrusted data into executable types; use plain data formats and a schema.
- Outbound requests to user-given URLs: allowlist the hosts, block private, loopback and cloud metadata addresses, and
  check again after redirects.
- HTML and markdown: sanitize untrusted content; encode output for its context (HTML, attribute, URL, JS); no remote
  loads from rendered content.
- Uploads: cap the size before reading, allowlist both extension and the type detected from content, store under
  generated names outside the served folder, and check archives for traversal before extracting.

## 4. Authentication, authorization and money
- Passwords: a slow, salted hash made for passwords (Argon2, scrypt or bcrypt) with a work factor set to current
  guidance, or a trusted identity provider. Old fast hashes are replaced when each user next signs in, and accounts
  that never return get a forced reset.
- Default, shared or hardcoded credentials are removed and replaced with generated ones.
- Sessions and tokens: random, expiring, revocable; cookies `HttpOnly`, `Secure`, `SameSite`; CSRF protection for
  cookie-based state changes.
- Every server action checks who the caller is and whether they may touch this specific object. Deny by default;
  when rules conflict, a deny wins over an allow.
- Rate-limit logins and other expensive or sensitive endpoints, per address and per account. Lock or slow down
  repeated failures.
- Money and signed actions: compute prices on the server, check recipient, amount limits and balance before value
  moves, make payment calls idempotent, and verify every signature against the expected key and message.

## 5. Transport and exposure
- TLS for all traffic that leaves the machine, including from the edge to the server; no mixed content; certificate
  checks never turned off.
- Local servers bind to loopback, check Host and Origin, and cap request size.
- CORS allows only known origins. Security headers: Content-Security-Policy, X-Content-Type-Options,
  frame-ancestors or X-Frame-Options, Referrer-Policy, Permissions-Policy, and HSTS where served over HTTPS.
- Close debug endpoints, admin panels and directory listings in production.
- Rate limits and size caps in a shared store or at the gateway; a firewall or bot rules at the edge for public apps.

## 6. Errors and logging
- Users see a plain message; details go to the log. No stack traces, queries or secrets in responses.
- Logs never contain secrets, tokens or full personal data. Log logins, failures, permission denials and admin
  actions with time, actor, source, target and result.
- Logs go somewhere the app cannot rewrite, kept for a period chosen on purpose, with alerts on unusual patterns.

## 7. Safe defaults
- Processes, containers and service accounts run with the least privilege they need.
- Files with secrets or user data have tight permissions.
- Options that widen exposure (remote access, sharing, plugins, debug) start off.

## 8. Infrastructure, pipeline and recovery
- People: individual accounts, multi-factor on privileged access, the owner or root account kept for emergencies.
- Services: roles with short-lived credentials; policies name specific actions on specific resources, no wildcards.
- Network: data stores and caches private; SSH and RDP only through a VPN or bastion; firewall rules minimal both ways.
- Storage buckets private unless meant to be public.
- Infrastructure files reviewed like code and scanned for open ports, public storage and wildcard permissions.
- Pipeline: minimal token permissions, federated short-lived cloud credentials, secret scan and dependency audit on
  every run, image scans for containers, third-party steps pinned, protected main branch with required review.
- Recovery: automatic backups with set retention and deletion protection, a restore tested and timed, the acceptable
  data loss and downtime written down, and a short incident plan (who decides, how keys get revoked, how users hear).

## Measuring the result
| Number | Before | After |
|---|---|---|
| Open findings: critical / high / medium / low | from the review | from the fresh review |
| Pattern sweep leads | first run | last run, each remaining lead explained |
| Dependency audit: high and critical | first run | last run |
| Security tests | count | count, including unauthenticated and wrong-user tests per protected route |

Numbers show progress; they don't prove safety. The answer says what was checked and what was not.
