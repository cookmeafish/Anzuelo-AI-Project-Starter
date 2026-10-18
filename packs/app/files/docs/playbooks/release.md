---
name: release
summary: Ship a version - gates pass, version and release notes, the right branch, no AI attribution, nothing secret, user's OK for protected branches
triggers: release, ship it, publish, deploy, cut a version, new version, push to main, push to master, merge to main, tag a release, make a build
menu: A4
---
# Playbook: release

**Outward action:** pushing, tagging, publishing and deploying need the user's explicit OK in this conversation
(AGENTS.md rule 6). Prepare everything, then ask.

## Steps
1. **Gates:** all configured commands pass (test, build, lint, typecheck), plus the release gates in
   `docs/foundation.md` section 4 and `install-update.md` when the app installs or updates itself. Run the
   **security-review** skill on what changed since the last release (hard rule 15).
2. **Release notes:** `docs/releases/<version>.md` collects the feature notes since the last release (what changed,
   try it fast, try it for real).
3. **Version** set as configured, and shown in the app if it shows one.
4. **Git:**
   - `git status` is clean except the release;
   - the current branch is the right one;
   - no AI attribution in any commit to be pushed (`node tools/hooks/git-guard.mjs scan`);
   - no secrets (hook: no-secrets);
   - pushing to a protected branch needs the user to name it.
5. **Build outputs:** no keys, debug flags or local paths inside them.
6. **Ask** for the OK with a summary (version, notes, branch, what gets published). Then push, tag or publish.

## Done when
- [ ] Gates passed after the last change; release notes written; scan PASS (hook: release-notes, no-ai-attribution, commit-gate).
- [ ] The user approved the outward step in this conversation.
