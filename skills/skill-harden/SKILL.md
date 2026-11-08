---
name: skill-harden
description: Hardens a much-used runbook and its skill - repeated steps become scripts in skills/<name>/scripts, judgment-only "Done when" items become checks, and pitfalls seen so far are written down - then marks it hardened. Offers generic skills for global use with the user's OK. Use when the hooks say SKILL HARDENING DUE or skill-harden, when the user asks to make a procedure faster or more reliable, or for menu code E4.
runbook: docs/playbooks/project.md
---
# Harden a runbook and its skill

A runbook used 3 times (`promoteAfterUses`) is stable enough to harden, so the next use is faster and depends less on
judgment. Engine runbooks (the core ones listed in `CORE_SKILLS` in `tools/hooks/hooks.mjs`) are hardened in the
starter, not in each project: send the lesson with `node tools/starter.mjs feedback "<what, where>"`.

## 1. Review
Read the runbook, its generated skill (`skills/<name>/SKILL.md`), its checks (tags in `DIRECTORY.md` §1) and the usage
count (`tools/hooks/state/runbook-usage.json`). Note which steps were identical every time, which needed judgment, and
what went wrong.

## 2. Harden
1. **Scripts.** Each step that is the same every time (a calculation, a file layout, a validation, a fetch) becomes
   `skills/<name>/scripts/<step>.mjs`: Node, no dependencies, prints `RESULT: PASS` / `RESULT: FAIL` or its output.
   Run it on one real input and one bad input; the bad one must print `RESULT: FAIL`. Point the runbook step at it as `node skills/<name>/scripts/<step>.mjs`.
2. **Checks.** Each "Done when" item that can now be checked gets a marker the end check tests: `(file: ...)`,
   `(ran: ...)` or `(answer: ...)`. A script that validates the result is named in a `(ran: <script>)` marker.
3. **Pitfalls.** Write down what went wrong in the uses so far, dated, from the runbook's Pitfalls and
   `docs/CHANGELOG.md`.
4. **Notes for the skill.** Add skill-only material below the generated block in `SKILL.md`, after the line that ends it (it survives
   regeneration; the generator names that line in the file): what the scripts do and when to use them.
5. Set `hardened: YYYY-MM-DD` in the runbook frontmatter. If it should never be hardened, set
   `harden: never - <reason>` instead.

## 3. Global?
If the skill has nothing project-specific (no project paths, people or facts), it could help every project. **Ask the
user** before copying it to the agent's global skills folder (Claude Code: `~/.claude/skills/`; other agents: their own) (outside this project). If they agree, make a generic copy
there and keep the project copy. Note both in CHANGELOG.

Sharing skills with another project, a person or another AI agent as a bundle is the **skill-curate** skill's bundles.md.

## 4. Verify
Run `node tools/hooks/hooks.mjs sync`, `node tools/hooks/selfcheck.mjs --tags <its checks>` and
`node tools/audit.mjs`. Add a CHANGELOG line.

## Done when
- [ ] Each repeated step is a script (when file: docs/playbooks/*.md) (file: skills/*/scripts/*.mjs)
- [ ] The runbook has `hardened:` or `harden: never` set (when file: skills/*/scripts/*.mjs) (file: docs/playbooks/*.md)
- [ ] The audit ran after the last edit (when file: docs/playbooks/*.md) (ran: audit.mjs)
- [ ] The CHANGELOG has a line (when file: skills/*/scripts/*.mjs) (file: docs/CHANGELOG.md)
