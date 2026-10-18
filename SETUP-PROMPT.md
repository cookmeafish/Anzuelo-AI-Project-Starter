# Setup prompt: build this project from the ground up

**To the AI agent:** this project was just made from the starter. Turn it into a project that knows its purpose, has
runbooks, skills and checks for its work, and enforces its own rules. Work through the phases in order. The hooks
enforce each gate:
- nothing is installed before the user has answered the questions (REQ: setup-interview);
- the starter's leftovers go only once the project has everything that fits it (REQ: setup-complete);
- this file is deleted only when `node tools/audit.mjs --setup` passes (REQ: setup-gate).

No hooks in your agent (anything but Claude Code or Codex)? Run `node tools/hooks/hooks.mjs begin "<the user's
message>"` for every user message, and `node tools/hooks/hooks.mjs check --answer-file .cache/answer.md` before every
answer. If the user only wants a quick answer first, answer it, then come back here.

**The rule for every choice: give the project everything that fits it.** Every pack the answers call for is installed
whole. Every library skill that fits those packs is enabled. Something that fits is left out only when the user says
so, and the reason is recorded.

## If this is an existing project
The starter was added around work that already exists (`config.json` has `adopted`). Improve it without breaking it:
- **Learn it first:** the README, docs and old instruction files (`*.starter.md` are the starter's versions, the
  others are the user's), the layout, the build and test commands, recent git history, open TODOs. Write a
  `## Current state` section in `docs/STATUS.md` before changing anything (the setup gate checks it).
- **Keep what works.** Existing rules move into AGENTS.md / CLAUDE.md as principles with a user-requirements row.
  Existing scripts and tests become gates (`toolPassed` + `selfRun`, or `commitGate`). Existing procedures become
  runbooks. Merge each `*.starter.md` into the user's file (their README stays theirs), then delete it.
- **Ask before moving things.** New work follows the layout standard at once. Moving existing files is a proposal:
  list the moves and why, and do them only with the user's OK, in small verified steps.
- **Measure first** (app pack): record which tests and builds pass today. Gates start from that baseline; old failures
  go into `docs/STATUS.md` as known issues.
- **Fill baselines from reality:** `docs/security.md` and (app pack) `docs/foundation.md` record the current state.
  Gaps become follow-up items ranked by risk, not silent rewrites.
- **Library skills:** `codebase-map` and `repo-setup` come first for an existing codebase.
- The final summary lists what was added, kept, moved (only if approved), and the improvement backlog.

## Phase 1: Learn the engine (no questions yet)
Read `AGENTS.md`, `DIRECTORY.md`, `docs/checks/runbook-standards.md`, `docs/checks/writing-standards.md`,
`tools/hooks/config.json` and `tools/hooks/requirements.json`. Run `node tools/packs.mjs list` and
`node tools/skills.mjs library`. For an existing project, also read its files as above.

## Phase 2: Ask the questions, and wait for the answers
**No questions wanted** (`"autonomy": "auto"` in `tools/hooks/config.json`, or the user said to just run): answer every
question yourself from the folder, the request and sensible defaults, write each answer as `- Key: assumed - <answer>`,
list them in your final answer so the user can correct any, and go on without waiting.

Ask in ONE message, grouped, with a multiple-choice tool if your agent has one. Skip only what the folder or the
conversation already answers, and say what you inferred so the user can correct it.
1. **Focus:** what is this project for, and what does "useful" look like a month from now?
2. **Kind of work:** a) know things and answer from them (research, records, planning, notes, decisions); b) build
   and ship software (an app, a site, a tool, a game); c) both.
3. **Visual interface:** will people look at screens, web pages, dashboards or HTML reports this project makes?
4. **Typical requests:** the 3 to 8 things you will ask most often, in your own words.
5. **Inputs:** where the knowledge, data or code comes from, and what is trusted.
6. **People:** one person, or several whose data must stay separate?
7. **Sensitive data:** what here is private or secret, and what must never leave this machine?
8. **Constraints:** budget, location or jurisdiction, deadlines, platforms, language.
9. **Quality bar:** what a great result looks like (length, tone, format, certainty, testing).
10. **Always / never:** anything the agent must always or never do.

For software, also ask: the test, build, lint and run commands and the code folders; the work branch, and the
branches, ports or running instances never to touch; whether visual or taste-driven work needs sign-off before commit;
how it is released.

**Then stop and wait.** The answers must come from the user in a later message. When they arrive, record them in
`docs/DECISIONS.md` (the hooks read this section):

```
## Setup interview (YYYY-MM-DD)
- Focus: ...
- Kind of work: knowledge | software | both  (then a few words)
- Visual interface: yes | no  (then what: app screens, web pages, HTML reports ...)
- Typical requests: see docs/BRIEF.md
- Inputs: ...
- People: one | several (names go in profiles/)
- Sensitive data: ...
- Constraints: ...
- Quality bar: ...
- Always/never: ... | none
- Commands: ...          (software only, and the next three)
- Branches: ...
- Sign-off: ...
- Release: ...
- Packs: ...             (added in Phase 3)
- Library skills: enabled a, b; left out c (the user's reason)
- Starter: link | keep | remove, because ...
```

## Phase 3: Install everything that fits
1. **Packs** follow from the answers, and the setup gate checks they match:

   | Answer | Pack | What it brings |
   |---|---|---|
   | Kind of work: knowledge or both | `knowledge` | research, sources, evidence labels, ingest, deliverables |
   | Kind of work: software or both | `app` | specs, triple-check QA, gates, foundation, release safety |
   | Visual interface: yes | `gui` | the GUI runbook, the screenshot review loop and tool, visual-review checklist, the frontend-design skill |

   Tell the user which packs and why, in one line each, then run:
   ```
   node tools/packs.mjs install <packs>
   node tools/packs.mjs configure app --test "<cmd>" --build "<cmd>" --code "<globs>" --version-file <file>   (app only)
   ```
2. **Library skills:** `node tools/skills.mjs library` lists them with the pack each fits. Every skill that fits an
   installed pack (or "any") is enabled unless the user declines it. Ask each fitting skill's question in one
   message, recommending yes. Then `node tools/skills.mjs enable <names>`. Add the phrases people use for these jobs
   to each skill's `triggers:` and check them with `node tools/hooks/test-hooks.mjs --route "..."`.
3. **The starter's leftovers:** ask the user, with a recommendation:

   | Choice | What happens | Fits when |
   |---|---|---|
   | **Link** (recommended) | `packs/` and `library/` are removed. The project remembers where the starter is (`tools/starter.local.json`, ignored by git), so packs, skills and engine upgrades can be added later | The starter folder stays on this machine |
   | **Keep a copy** | The pack payloads and the skill library move into `.starter/` (ignored by git) | The project may move, work offline, or grow in scope |
   | **Remove** | Everything from the starter goes, including the link | The scope is fixed |

   Run `node tools/starter.mjs link | keep | remove`. It refuses while anything that fits is still missing.
4. **App pack:** run `docs/playbooks/app-foundation.md` with the user before Phase 4. It sets the performance budgets,
   the usability defaults and the app's security rows, and builds the scaffolding that enforces them.

## Phase 4: Build it
1. `docs/BRIEF.md`: fill every section from the answers, as principles in your own words with the date and why. Set
   `status: bootstrapped YYYY-MM-DD`.
2. `docs/names.json`: check `PROJECT_NAME`, and add every other name the project uses (products, brands, companies).
   `AGENTS.md` / `CLAUDE.md`: replace `{{ONE_LINE}}`; the name heading fills itself from `docs/names.json`. Each
   always/never answer goes through the project-rule skill (a rule, a user-requirements row, and a check where one can
   be written). Record the rest under "standing preferences", or write `- (none stated, YYYY-MM-DD)`.
3. `docs/security.md`: fill it from the "Sensitive data" and "Inputs" answers, run the **security-review** skill over
   what exists today, log it in the Reviews table, and set `status: set`.
4. **Runbooks for every typical request:** route each one to an existing runbook or skill by adding the user's wording
   to its `triggers`, or create a runbook with its check (runbook-create skill). Before writing one, look for an
   existing skill that does the job (skill-finder skill), read every file of it, and install third-party skills only
   with the user's OK. Every request must show a ROUTE or SKILL in `node tools/hooks/test-hooks.mjs --route "<request>"`.
5. **Guards** in `tools/hooks/config.json`, as the answers require: `protectedOriginals`, `noOverwrite`,
   `writeOnlyVia`, `protectedBranches`, `forbiddenCommands` (e.g. never stop the user's own app or port), `codeRules`,
   `commitGate`, `watchedInputs`, `approvalPaths` (sign-off), `userFacing`.
6. **Validators:** anything that can be checked deterministically (a data format, a calculation, a naming rule) gets a
   small script in `tools/` that prints `RESULT: PASS` or `FAIL`, wired in with `toolPassed` + `selfRun` or `runEach`,
   plus a test scenario.
7. **People:** several people → `profiles/<name>/PROFILE.md` for each (with `aliases:`). The scope guard switches on.
8. **Knowledge** the user already gave goes into `docs/knowledge/` (knowledge pack). No empty placeholder files.
9. `docs/STATUS.md` (Now / Next / Open questions), `docs/CHANGELOG.md` (a "set up" line).
10. **Git**, if the folder is a repo or the user wants one: `git config core.hooksPath .githooks`, and confirm the git
    identity is the user's own name and email.

## Phase 5: Verify everything is really there
1. `node tools/hooks/test-hooks.mjs`: ALL PASS.
2. `node tools/audit.mjs --setup`: PASS. It checks the interview, that the packs match the answers and are complete,
   that every fitting library skill is enabled or declined with a reason, the brief, routing, placeholders, the
   security baseline, pack purity, publish safety, and that the hooks ran live here.
3. One dry run: take the most typical request, route it, and walk its runbook without changing anything. Report what
   would happen.
4. Show the user a short summary: the focus, the packs and skills and why, what was left out and why, the runbooks
   and menu codes, the rules and guards, and how to use the project ("just ask; codes are optional").

## Phase 6: Delete this file
In the same turn as a passing `node tools/audit.mjs --setup`: `rm SETUP-PROMPT.md`, add a CHANGELOG line ("setup
complete"), and end with a Finished section.
