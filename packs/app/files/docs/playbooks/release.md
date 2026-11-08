---
name: release
summary: Ship a version - gates pass, risky parts checked, rollback plan and triggers decided first, version and release notes, the right branch, no AI attribution, nothing secret, user's OK, then deploy and watch
triggers: release, ship it, publish, deploy, cut a version, new version, push to main, push to master, merge to main, tag a release, make a build, deploy checklist, ready to deploy, before we deploy, rollback plan, onto the app store
trigger_regex: \b(ship|cut|tag)\s+v?\d+(\.\d+)*\b|\b(push|put|take) (it|this) live\b|\bgo(ing)? live\b
menu: A4
---
# Playbook: release

**Outward action:** pushing, tagging, publishing and deploying need the user's explicit OK in this conversation
(AGENTS.md rule 6). Prepare everything, then ask.

## Steps
0. **A package for a registry** (a library or command-line tool on npm, PyPI, crates.io and the like): open the
   **package-release** skill too and follow it alongside this runbook (`node tools/skills.mjs enable package-release`
   if it is not in `skills/`). It decides the version from what changed for users and writes the changelog entry
   with breaking changes first (Keep a Changelog headings: Added, Changed, Deprecated, Removed, Fixed, Security).
1. **Gates:** all configured commands pass (test, build, lint, typecheck), plus the release gates in
   `docs/foundation.md` section 4 and `install-update.md` when the app installs or updates itself. Every change in
   the release was reviewed (the independent review, or `qa.md` §3). Run the **security-review** skill on what
   changed since the last release (hard rule 15).
   **First time online** (or a new host): check what only matters online, on the deployed site itself with real
   requests (`curl -sI https://<site>`), not from the code: HTTPS only (HTTP redirects), the security headers (CSP,
   X-Content-Type-Options, frame-ancestors, Referrer-Policy; for a static site, the host's headers file the project
   ships), `Strict-Transport-Security` with a long `max-age` (add `preload` only after reading its rules: a mistake
   locks users out until it expires), a `Permissions-Policy` turning off unused features, cookies Secure, HttpOnly and
   SameSite=Lax or Strict, the settings that are only safe online turned on (the app refuses to start on a
   public address without them), and no admin page, data file or `.env` reachable. Run here each one the security review
   left NOT RUN until going live.
2. **Risky parts,** each one that applies:
   - **data migration:** run it on a copy with realistic data, time it, and have a way back (a down migration or a
     backup to restore), following `data-change.md`;
   - **feature flags:** each flag is set to its intended state in each environment; each new release flag has a
     removal task or an expiry date;
   - **breaking change** to an API, file format or setting that others rely on: list who uses it, and either keep
     the old way working for a while or put the migration steps in the release notes. With semantic versioning it is
     a new MAJOR version, and the old way is first marked deprecated in a MINOR release.
3. **Rollback plan, decided before the deploy:** how to undo it (the previous version, the exact command, and the
   data restore if a migration ran), and the triggers that mean "roll back now", as numbers. Default: error rate above
   2x the pre-release rate for 5 minutes, or any key flow failing; replace it with the project's numbers from
   `docs/foundation.md` section 2 (response times beyond the budgets). Write both into the release notes.
4. **Release notes:** merge the dated feature notes in `docs/releases/` since the last tag into
   `docs/releases/<version>.md` (what changed, try it fast, try it for real), and add the rollback plan.
5. **Version** set as configured, and shown in the app if it shows one.
6. **Git:**
   - `git status` is clean except the release;
   - the current branch is the right one;
   - no AI attribution in any commit to be pushed (`node tools/hooks/git-guard.mjs scan`);
   - no secrets: the security-review skill's secrets item, or a grep over `git diff <last-tag>..HEAD` (hook:
     no-secrets);
   - pushing to a protected branch needs the user to name it.
7. **Build outputs:** no keys, debug flags or local paths inside them.
8. **Ask** for the OK with a summary (version, notes, branch, what gets published, the rollback triggers). Then push,
   tag or publish.
9. **Deploy and watch** (only for a service or site that goes live):
   - a staging or preview environment first, where one exists, with a quick run of the key flows;
   - a gradual rollout when the host supports it;
   - watch the error rate, response times and the key flows for at least 15 minutes after going live;
   - a trigger is hit: roll back first, with the user's OK, then investigate (debug skill, and the
     **incident-response** skill if users were hurt);
   - afterwards: update `docs/CHANGELOG.md`, and draft any announcement for the user to send.

## Done when
- [ ] Gates passed after the last change; release notes written; scan PASS (hook: release-ready, no-ai-attribution, commit-gate).
- [ ] The answer says the security review ran on the changes since the last release and, for a first online deploy, lists each online check result; a registry package is versioned and its changelog sorted per package-release (judgment: needs the review output).
- [ ] The release notes hold the rollback plan and its triggers, written before the deploy (hook: release-rollback checks the answer names it; judgment: whether the plan is sound).
- [ ] The user approved the outward step in this conversation (hook: git-safety for pushes to the protected branch; judgment: other outward steps).
- [ ] For a live deploy, the answer gives the numbers watched after it went live (judgment: which numbers matter depends on the release).
- [ ] Followed whenever a version is tagged or published, even unasked (hook: release-trigger).

## Pitfalls
- Deciding when to roll back during the outage. Under pressure every bad sign looks temporary. Set the numbers first.
- A migration tested only on an empty database, which then locks a large table in production for minutes. Set a
  lock timeout (PostgreSQL `SET lock_timeout = '5s'`) and build large indexes with `CREATE INDEX CONCURRENTLY`
  (outside a transaction).
- Calling it done at "deploy succeeded". A deploy can succeed while the key flow is broken.

Ideas in steps 2, 3 and 9 come from the deploy checklist in the engineering plugin of
anthropics/knowledge-work-plugins (Apache-2.0).
