# <!--name:STARTER_NAME-->Anzuelo<!--/name--> changelog

Changes to the starter itself. A project picks up engine changes with `node tools/starter.mjs upgrade` (or, from the
starter, `node tools/new-project.mjs "<project>" --upgrade`). Rule and runbook changes listed here are adopted by hand
(project-rule, runbook-create), because an upgrade never touches a project's own content.

- 2026-10-18: Upgrades and additions can't make a project worse unseen.
  - **Renamed Anzuelo** (Spanish for fishing hook, after the hooks that hold the agent to its work). "Roe" is also an
    AI agent company. The name lives only in `docs/names.json`.
  - **Upgrade guard:** an upgrade audits and times the project before and after. A check that passed before and fails
    after rolls it all back (`--accept-findings` keeps it and lists them to fix).
  - **Upgrade review:** every new hard rule, every pack or library skill that fits the setup answers and was never
    decided, every new failing check and every much slower hook goes into `docs/DECISIONS.md` to adopt (with "Worth
    it") or decline (with the reason), plus a passing self-test run. The hooks hold work until it is done
    (upgrade-review).
  - **Speed budget:** `node tools/hooks/hooks.mjs bench` times the hooks; the audit fails when one is over
    `hookBudgetMs` (1000 ms).
  - Fixed: making a project filled the placeholders inside the engine's own code (it now fills docs and data only).
  - **One research skill** replaces web-search and the knowledge pack's research and answer-question runbooks, with
    a section per situation: from the project's files, a quick lookup, full research, and recording. Full research
    uses a ledger (`claims.mjs`): every source screened for paid or biased content, claims confirmed only by
    independent owners. Checks: research-verified, research-ledger, research-cited, and answer-traced ("did I make
    that up?": every number in a factual answer or written into the knowledge base appears in something read that
    turn, and every cited project file was opened). Upgrades retire web-search and offer to merge the old runbooks.
  - **Only improvements, never friction:** hard rule 18. A runbook, skill or check that preceded the user's
    frustration in 3 of its last 6 turns is suspended and announced (friction-suspend); safeguards are flagged
    instead. `hooks.mjs restore <item>` brings one back. A pending upgrade review blocks once a day at most.
  - **Recall:** finished work turns are remembered locally; a similar request gets a RECALL hint, and
    `node tools/recall.mjs` searches past work and the project's records (recall-hint).
  - **Autonomy:** `"autonomy": "auto"` (or `new-project.mjs --auto`) runs without questions: setup records assumed
    answers, the agent decides the upgrade review. Outward actions and third-party installs still need an OK.
  - **Obsidian:** a core obsidian skill and `notes.mjs` (links, backlinks, suggestions, orphans, open in Obsidian). New
    notes link to related notes (note-linked); new projects get `.obsidian/app.json` for markdown links; the audit
    warns about orphans, and the starter maps every one of its files.
  - **Safety and size:** kept files may not carry hidden instructions or invisible characters (injection-guard); the
    audit warns when the files loaded every session grow past `alwaysLoadedMaxChars`.
  - **.gitignore before every push** (gitignore-ready): the pretool hook, the git pre-push hook and the audit check
    that secrets, local state, caches and private files are ignored, that what the project needs is not, and that
    nothing ignored is already committed. Projects get it from the engine; upgrades add `.codex/` to their ignores.
  - **No vendor files in git:** the rules live in `AGENTS.md`. `CLAUDE.md`, `.claude/` and `.codex/` are made on each
    machine by `node tools/hooks/wire.mjs` (new projects and upgrades run it) and ignored by git. Upgrades don't
    force this on projects that already commit `CLAUDE.md`.
  - **Commercial use:** every skill's license must allow commercial use without copyleft (audit), and the weighing
    in hard rule 16 includes the license. New library skill: teach (our own, original wording).

- 2026-10-17: Named Roe. Complete setup, a gui pack, security for every project, self-improving skills.
  - **Setup gates:** the user answers the setup questions before anything is installed (setup-interview). The answers
    are recorded in `docs/DECISIONS.md`, and the packs must match them. Every library skill that fits is enabled or
    left out with the user's reason, before the starter's leftovers go (setup-complete).
  - **gui pack:** the GUI runbook, review loop, screenshot tool and visual checklist moved out of the core into a pack,
    with the frontend-design skill. A project that changes GUI files without it is asked to add it (gui-pack).
    Upgrading a project that had the GUI runbook adds the pack.
  - **Security for every project:** `docs/security.md` in every project, set during setup. security-review is a core
    skill that covers private data, untrusted content and downloads too. Hard rule 15.
  - **Skills improve and stay lean:** a miss while following a runbook or skill writes the lesson into it
    (skill-learn). Runbooks and skills unused for 60 days are announced (skill-prune) and curated with the new
    skill-curate skill; `node tools/skills.mjs retire <name>` removes one with its checks and menu code.
  - **Only what makes it better:** hard rule 16. A new skill, pack or dependency needs "Worth it: <gain> / <cost>"
    (worth-it).
  - **References sweep:** the audit fails when a doc names a file, command or skill that does not exist.
  - Removed `tools/skills.mjs prune-library` (it skipped the setup checks; `tools/starter.mjs` replaces it).
  - **New library skills:** commit-archaeologist (why code exists, from its git history) and compress-for-ai (shorter
    AI-facing files, with a check that nothing was lost).
  - **Found by an end-to-end test in real projects, and fixed:**
    - a fake key in a test file made every project's first full commit fail the secret check (the audit now fails
      on any secret-shaped string);
    - the self-tests failed inside finished projects (they now start from a neutral copy);
    - an upgrade overwrote lessons a project wrote into core skills (it now keeps their triggers and a
      "## Project lessons" section, and backs up every replaced file);
    - two app pack check patterns had lost their backslashes and could never pass (a test now guards all patterns,
      and upgrades repair old copies);
    - agents without hooks could install packs before the interview (the tools now check it themselves);
    - the brief template's guidance counted as answers, typical requests were misread, dates used UTC, edited
      runbooks looked new, and routing needed the exact phrase (now key words in any order also match).
  - **Every name is a variable:** hard rule 17. Names live once in `docs/names.json`; docs show them in
    `<!--name:KEY-->` markers that sync refills, code reads the file, and a check catches names typed out elsewhere
    (name-var). Setup sets PROJECT_NAME; upgrades add the file with the project's current name.
  - `.gitattributes` keeps line endings the same on every machine.

- 2026-10-17: First release.
  - **Core:**
    - a hook engine for session start, every prompt, before and after tool calls, and stop;
    - a baseline of checks that can't be switched off by editing a file;
    - declarative project checks (`toolPassed`, `runEach` and more).
  - **Routing:** a generated `DIRECTORY.md`, and every runbook with a generated skill and a required check.
  - **Agents:** works with any agent (hooks for Claude Code and Codex; `begin` / `check` for the rest).
  - **Packs:** knowledge and app, chosen during setup, with a purity check.
  - **Setup:** a setup prompt that deletes itself only after verification, and an adopt path for existing projects.
  - **Safety:** git guards (no AI attribution, no secrets, backups before history rewrites, protected branches), a
    browser guard, originals and outputs protected, people's data kept apart.
  - **Quality:** a GUI screenshot loop, plain writing, principles instead of the user's literal examples, a tidy
    layout, an app foundation (security, performance budgets, usability).
  - **Skills:** core skills for every project (plan, debug, parallel-agents, web-search, skill-finder) and a library
    picked during setup (security-review, security-hardening, backend-patterns, frontend-design, codebase-map,
    repo-setup, orchestrate, mcp-builder). Each one is our own rewrite of an open-source skill: it covers everything
    the original does, shares no text with it (`tools/skills.mjs compare`), and carries the original's license and
    credit.
  - **Skills are first-class:** a skill that is not part of a runbook routes by its own `triggers:` (`SKILL:` hint),
    must be opened when matched (skill-read), and proves its "Done when" with its own check (`skillUsed`). Library
    skills bring their checks when enabled and take them away when disabled.
  - **Tests:** 200 hook self-tests and ablation tests (every required step of a golden workflow must be load-bearing).
  - **Found in live testing:** the Stop hook must read the final answer from the agent, because the transcript lags
    behind. Generated files must not count as the agent's edits. An emptied checks file must not disable the baseline.
