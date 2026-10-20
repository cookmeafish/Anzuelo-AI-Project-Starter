---
name: project
summary: The project itself - new rules, complaints about misses, praise to repeat, sweeps, gaps, runbooks, skills, hooks, packs, status, engine upgrades
triggers: clean up skills, prune skills, unused skills, retire a skill, show me the menu, menu codes, set up this project, enable a skill, remove a skill, library skills, update the project, update this project, from now on, new rule, make it a rule, remember to always, remember from now on, you forgot, i told you, why did you, i shouldn't have to, sweeps, sweep, audit the project, run the audit, gaps, gap review, what's missing, runbook, runbooks, playbook, project skills, the skills, harden a skill, harden the skill, the hooks, hook change, add a pack, install a pack, packs, where are we, where were we, what's next, status, to-do list, todo list, remind me, handoff for the next session, what's on my plate, what am i waiting on, daily summary, standup update, share these skills, package skills, skill bundle, make a plugin, customize a plugin, upgrade the engine, upgrade the starter, update the starter, newest starter, new starter release, starter update
menu: E1
checks: core: rule-request, rule-memory, hooks-tested, runbook-complete
---
# Playbook: the project itself

**Use when:** the request is about how the project works rather than its subject. Menu codes E1 to E7 and E9.
**After a complaint**, also fix the original miss by its own runbook. A new rule only prevents the next miss.

## Steps
### §1 A rule, a complaint, or "keep doing this" (E2)
The user is upset or complains: follow the **learn-from-upset** skill (`skills/learn-from-upset/SKILL.md`); it fixes
the miss and decides where the lesson goes. A standing rule or praise: follow the **project-rule** skill
(`skills/project-rule/SKILL.md`).

### §2 A new kind of task (no runbook)
Follow the **runbook-create** skill: `_fallback.md`, then a runbook plus a check. The skill and the DIRECTORY row are
generated.

### §3 Sweeps (E1)
Follow the **project-sweeps** skill.

### §4 Gaps review (E3)
Follow the **project-sweeps** skill, step 5.

### §5 Harden skills (E4)
Follow the **skill-harden** skill for every runbook the hooks say is due. Sharing skills as a bundle, or making or
customizing a plugin, follows the **skill-curate** skill's §4.

### §6 Status, to-dos and handoff (E5)
Follow the **session-handoff** skill: "where are we", "what's next", reminders and to-dos, a daily summary or
standup update, a handoff for the next session, and `docs/glossary.md`.

### §7 Upgrade the engine (E6)
To get a newer release of the starter first, run `node tools/starter.mjs update`: it pulls the newest starter into the
linked copy (stopping if that copy has local changes or is a development copy), then upgrades as below. Otherwise:
`node tools/starter.mjs upgrade` (needs the starter linked; run it with `--dry-run` first to see the list). It
replaces only the engine files (hooks, tests, audit, tools, core skills and checklists) and never touches this
project's content. Files from installed packs and enabled library skills are refreshed only where this project never
edited them (a skill keeps the triggers and lessons it added); an edited one is kept, and named in the review when the
starter changed it since. It can't make the project worse unseen:
1. It audits and times the hooks before and after. A check that passed before and fails after rolls the whole upgrade
   back. `--accept-findings` keeps it and lists those checks to fix.
2. It writes `## Upgrade review (date)` into `docs/DECISIONS.md`: every new hard rule, a pack the setup answers call
   for that is missing, `fit: N new candidates` when `docs/fit-checklist.md` got new rows (new packs, library skills,
   tools or features, added as `?`), every new failing check, every hook that got much slower, setup questions added since
   setup (`interview:`), pack or library files kept because they were edited here (`file:`), and the self-tests.
3. **You decide; the user only sees a summary.** Decide the new fit rows yourself from the survey, the brief and the
   code (add, skip, or `later - when: <condition>`, each with its reason) until `node tools/fit.mjs check` passes,
   then write `decided` on the fit line. Ask the user only about what is truly theirs (money, privacy, outward
   actions), in one question with choices. Adopt other lines only when they make this project better (`adopted -
   Worth it: <gain> / <cost>`, then really add it: rules through the project-rule skill), and decline the rest with the
   reason (`declined - <why>`). Run `node tools/hooks/selfcheck.mjs` and write `passed`. Tell the user in one line
   (`node tools/fit.mjs summary`): "Added: x, y. Skipped: z (why). Later: w (when)." They can override any of it. The
   hooks hold work until every line is decided (REQ: upgrade-review).

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
  Its triggers and checks come with it. Record the decision in `docs/fit-checklist.md` (`node tools/fit.mjs decide`).
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

### §12 Tools at a glance
- `node tools/hooks/hooks.mjs why`: the full steps behind the last stop message. `restore <item>`: bring back a
  runbook, skill or check the friction rule suspended.
- `node tools/hooks/selfcheck.mjs --tags a,b`: only the scenarios of the checks you changed. `--route "<request>"`:
  where a request routes. `--ablation`: every required step of a golden workflow is load-bearing.
- `node tools/fit.mjs` / `check` / `summary` / `decide "<item>" <add|skip|later> "<reason>"`: the add-or-skip checklist.
- `node tools/starter.mjs feedback "<text>"`, then `report`: send a lesson about the engine back to the starter.
- `node tools/dedupe.mjs` (then `--apply`): remove exact duplicates from originals folders, keeping the referenced copy.
- `node tools/packs.mjs configure app --test "<cmd>" --test-pass "<regex>" --build "<cmd>" --build-pass "<regex>"`
  (also `--lint`, `--typecheck`, `--run`, `--code`, `--version-file`): the app pack's gates.

## Done when
- [ ] Rule requests: AGENTS/CLAUDE + user-requirements + rule-enforcement + a check (or hook: N/A) + memory; tests and audit PASS (hook: rule-request, rule-memory, hooks-tested, audit-run).
- [ ] The original miss behind a complaint is fixed, not just prevented (judgment: whether the miss itself is fixed needs a look at the result).
- [ ] Skills added or removed: each one belongs to a runbook or has its own triggers and a check (hook: skill-complete).
- [ ] Skills due for cleanup: each kept with a reason, merged, or retired with the user's OK (skill-curate; hook: skill-prune).
- [ ] CHANGELOG updated; Finished section (hooks: changelog, finished-summary).

## Pitfalls
- A rule written only in the docs gets forgotten. Every checkable rule needs a check.
- Write down the user's actual complaint, not a stricter rule than they said. An over-strict rule creates new misses.
- Waivers (`N/A(tag)`) are for checks that don't apply, never for skipping work that does.
