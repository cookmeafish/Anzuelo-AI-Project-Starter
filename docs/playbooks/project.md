---
name: project
summary: The project itself - new rules, complaints about misses, praise to repeat, sweeps, gaps, runbooks, skills, hooks, packs, status, engine upgrades
triggers: clean up skills, prune skills, unused skills, retire a skill, show me the menu, menu codes, set up this project, enable a skill, remove a skill, library skills, update the project, update this project, from now on, new rule, make it a rule, remember, you forgot, i told you, why did you, i shouldn't have to, sweeps, sweep, audit, gaps, gap review, what's missing, runbook, runbooks, playbook, skill, skills, hook, hooks, add a pack, install a pack, packs, where are we, where were we, upgrade the engine, upgrade the starter
menu: E1
checks: core: rule-request, rule-memory, hooks-tested, runbook-complete
---
# Playbook: the project itself

**Use when:** the request is about how the project works rather than its subject. Menu codes E1 to E7 and E9.
**After a complaint**, also fix the original miss by its own runbook. A new rule only prevents the next miss.

## Steps
### §1 A rule, a complaint, or "keep doing this" (E2): the project-rule skill
1. Write down what the user asked as a principle in your own words, with today's date and why it matters (never paste
   their message or examples). Restate it as one testable rule. If it conflicts with an existing rule, ask which wins.
2. Write it into AGENTS.md / CLAUDE.md (the hooks keep the twins identical), the runbooks and checks it touches, and a
   "Pitfalls" line in the runbook where the miss happened.
3. Add rows to `docs/checks/user-requirements.md` and `docs/checks/rule-enforcement.md`.
4. Enforce it: an entry in `tools/hooks/requirements.json` plus a test scenario in `tools/hooks/test-hooks.mjs`, or
   "hook: N/A <reason>" in the answer. Write a memory note (the hook prints where).
5. Run `node tools/hooks/test-hooks.mjs` and `node tools/audit.mjs`. Both must PASS.

### §2 A new kind of task (no runbook): the runbook-create skill
Follow `_fallback.md`. Leave a runbook plus a check behind. The skill and the DIRECTORY row are generated.

### §3 Sweeps (E1): the project-sweeps skill
Run `node tools/audit.mjs --full`. Report each sweep and fix every FAIL by fixing the project, never by weakening a test.

### §4 Gaps review (E3)
Read BRIEF (typical requests), DIRECTORY, every runbook and `user-requirements.md`. List what the user could plausibly
ask that no runbook or check covers, rank by likelihood × harm, and fix the top ones by §2, unless the user only asked
for the list.

### §5 Harden skills (E4): the skill-harden skill
For every runbook the hooks say is due (used 3+ times and not hardened yet).

### §6 Status (E5): the session-handoff skill
Answer from `docs/STATUS.md`. If it is stale, rebuild it from CHANGELOG, DECISIONS and recent files.

### §7 Upgrade the engine (E6)
`node tools/starter.mjs upgrade` (needs the starter linked; run it with `--dry-run` first to see the list). It
replaces only the engine files (hooks, tests, audit, tools, core skills and checklists) and never touches this
project's content. It can't make the project worse unseen:
1. It audits and times the hooks before and after. A check that passed before and fails after rolls the whole upgrade
   back. `--accept-findings` keeps it and lists those checks to fix.
2. It writes `## Upgrade review (date)` into `docs/DECISIONS.md`: every new hard rule, every pack or library skill that
   fits the setup answers and was never decided, every new failing check, every hook that got much slower, and the
   self-tests.
3. Go through each line with the user. Adopt only what makes this project better (`adopted - Worth it: <gain> /
   <cost>`, then really add it: rules through the project-rule skill), and decline the rest with the reason
   (`declined - <why>`). Run `node tools/hooks/test-hooks.mjs` and write `passed`. The hooks hold work until every
   line is decided (REQ: upgrade-review).

### §8 Add a pack (E7)
`node tools/packs.mjs list` shows what can be added. Packs come from the kept copy in `.starter/` or the linked
starter folder (`node tools/starter.mjs status` shows which). Nothing available? Link the starter again:
`node tools/starter.mjs link "<starter folder>"`. Install with `node tools/packs.mjs install <name>`, run the audit,
and add the pack's typical requests to `docs/BRIEF.md`.

### §9 Set up or re-scope the project: the project-bootstrap skill
First session, `SETUP-PROMPT.md` still present, or the project's focus changes: follow the project-bootstrap skill. It
asks the focus questions, picks the packs and library skills, and routes every typical request to a runbook.

### §10 Skills: add, enable, remove
- **A library skill** (the starter's ready-made ones): `node tools/skills.mjs library` lists them (from `library/`
  during setup, then from the kept copy or the linked starter), and `node tools/skills.mjs enable <name>` adds one.
  Its triggers and checks come with it.
- **A skill from elsewhere:** the skill-finder skill (search, vet, bring in with `node tools/skills.mjs add`, rewrite
  in the project's style until `node tools/skills.mjs compare` finds no shared text).
- **Remove one:** `node tools/skills.mjs disable <name>` removes a library skill and the checks it brought.
- Every skill either belongs to a runbook (`runbook:` in its frontmatter) or has its own `triggers:` and a check
  (`"when": {"skillUsed": "<name>"}`). The audit and the Stop hook enforce it (REQ: skill-complete).

### §11 Skills improve and stay lean (E9): the skill-curate skill
The project grows its own skills: a new kind of task leaves a runbook (§2), a runbook used 3 times gets hardened
(§5), and a turn that followed a runbook or skill and still missed writes the lesson into it (REQ: skill-learn). In an engine skill the lesson goes under "## Project lessons", which upgrades keep.
The other half is pruning: a runbook or skill unused for `pruneAfterDays` shows up as SKILL CLEANUP DUE, and the
skill-curate skill keeps it with a reason, merges it, or retires it (`node tools/skills.mjs retire <name>`) with the
user's OK.

## Done when
- [ ] Rule requests: AGENTS/CLAUDE + user-requirements + rule-enforcement + a check (or hook: N/A) + memory; tests and audit PASS (hook: rule-request, rule-memory, hooks-tested, audit-run).
- [ ] The original miss behind a complaint is fixed, not just prevented.
- [ ] Skills added or removed: each one belongs to a runbook or has its own triggers and a check (hook: skill-complete).
- [ ] Skills due for cleanup: each kept with a reason, merged, or retired with the user's OK (skill-curate).
- [ ] CHANGELOG updated; Finished section.

## Pitfalls
- A rule written only in the docs gets forgotten. Every checkable rule needs a check.
- Write down the user's actual complaint, not a stricter rule than they said. An over-strict rule creates new misses.
- Waivers (`N/A(tag)`) are for checks that don't apply, never for skipping work that does.
