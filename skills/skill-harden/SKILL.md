---
name: skill-harden
description: Hardens a much-used runbook and its skill - repeated steps become scripts in skills/<name>/scripts, judgment-only "Done when" items become checks, and pitfalls seen so far are written down - then marks it hardened. Offers generic skills for global use with the user's OK. Use when the hooks say SKILL HARDENING DUE or skill-harden, when the user asks to make a procedure faster or more reliable, or for menu code E4.
runbook: docs/playbooks/project.md
---
# Harden a runbook and its skill

A runbook used 3 times (`promoteAfterUses`) is stable enough to harden, so the next use is faster and depends less on
the agent's memory or judgment.

## 1. Review
Read the runbook, its generated skill (`skills/<name>/SKILL.md`), its checks (tags in `DIRECTORY.md` §1) and the usage
count (`tools/hooks/state/runbook-usage.json`). Note which steps were identical every time, which needed judgment, and
what went wrong.

## 2. Harden
1. **Scripts.** Each step that is the same every time (a calculation, a file layout, a validation, a fetch) becomes
   `skills/<name>/scripts/<step>.mjs`: Node, no dependencies, prints `RESULT: PASS` / `RESULT: FAIL` or its output.
   Test it once. Point the runbook step at it as `node skills/<name>/scripts/<step>.mjs`.
2. **Checks.** Each "Done when" item that can now be checked gets a requirements.json entry. A script that validates the
   result goes in `toolPassed` with `selfRun`, or `runEach`. Add test scenarios.
3. **Pitfalls.** Write down what went wrong in the uses so far, dated.
4. **Notes for the skill.** Add skill-only material below the generated block in `SKILL.md` (it survives regeneration):
   what the scripts do and when to use them.
5. Set `hardened: YYYY-MM-DD` in the runbook frontmatter. If it should never be hardened, set
   `harden: never - <reason>` instead.

## 3. Global?
If the skill has nothing project-specific (no project paths, people or facts), it could help every project. **Ask the
user** before copying it to the agent's global skills folder (outside this project). If they agree, make a generic copy
there and keep the project copy. Note both in CHANGELOG.

Sharing skills with another project, a person or another AI agent as a bundle is the **skill-curate** skill's §4.

## 4. Verify
Run `node tools/hooks/hooks.mjs sync`, `node tools/hooks/selfcheck.mjs --tags <its checks>` and `node tools/audit.mjs`. Add a CHANGELOG
line.
