---
name: security-review
summary: Review the app's security baseline - local server lockdown, input to paths, HTML sanitizing, secrets, process spawning - with evidence per item
triggers: security, vulnerability, exploit, xss, csrf, injection, secrets, api keys, leak, safe to publish, before making it public, is it secure, is this secure, make it secure, safe to put online, someone hack, hack into, hacked, leaking, admin page, api key
trigger_regex: \bis (the|this|our|my) (\w+ ){0,3}(form|page|app|site|login|sign ?in|upload|endpoint|api|server|database|db|password|repo)s? (safe|secure)\b
menu: A7
skill: skills/security-review/SKILL.md
---
# Playbook: security review (app items)

## Steps
Follow the **security-review** skill (`skills/security-review/SKILL.md`): the threat model, every area, the attacks,
the fixes and the report table all come from there. This runbook only adds the app's own items:
1. Add every row of `docs/foundation.md` section 1 and of the Security section in `docs/checks/app-standards.md` to
   the skill's report table, each PASS, FAIL or N/A with evidence (the code path, a test, a request you tried).
2. Fix each FAIL by `bugfix.md`, so it gets a regression test.

## Done when
- [ ] The skill's report table in docs/reviews/ also covers every foundation and app-standards security item (hooks: security-report, security-checklist), each PASS, FAIL or N/A
  with evidence. The answer gives its one summary line and one line per FAIL, not the table.
