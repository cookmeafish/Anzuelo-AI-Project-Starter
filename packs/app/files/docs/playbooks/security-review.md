---
name: security-review
summary: Review the app's security baseline - local server lockdown, input to paths, HTML sanitizing, secrets, process spawning - with evidence per item
triggers: security, secure, vulnerability, exploit, xss, csrf, injection, secrets, api keys, leak, safe to publish, before making it public
menu: A7
skill: skills/security-review/SKILL.md
---
# Playbook: security review

## Steps
Follow the **security-review** skill (`skills/security-review/`) for the threat model, the areas and the attacks.
This runbook adds the app items. A long list of fixes goes to the **security-hardening** library skill.
1. Go through `docs/foundation.md` section 1 and the Security section of `docs/checks/app-standards.md` item by item.
   For each one: PASS, FAIL or N/A, with evidence (the code path, a test, a request you tried).
2. Try the skill's attacks against an isolated instance. For an app these always include:
   - a cross-origin request to the local API;
   - a path with `../`;
   - HTML with an `onerror` handler;
   - a markdown image pointing to an outside server.
3. **Secrets:** `.gitignore` covers every key file. Search the history (`git log -p`) and the build output for key
   patterns.
4. Fix FAILs by `bugfix.md` (each one gets a test). Add a check where a pattern can be caught automatically (`codeRules`).

## Done when
- [ ] The answer has a table with every item, PASS/FAIL/N/A and evidence (hook: security-checklist).
