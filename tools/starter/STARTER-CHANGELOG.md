# <!--name:STARTER_NAME-->Anzuelo<!--/name--> changelog

Changes to the starter itself. A project picks up engine changes with `node tools/starter.mjs upgrade` (or, from the
starter, `node tools/new-project.mjs "<project>" --upgrade`). Rule and runbook changes listed here are adopted by hand
(project-rule, runbook-create), because an upgrade never touches a project's own content. A change to what the hooks
print, or to a command or setting a project's own hooks or scripts may rely on, is marked **Breaking for project
hooks:**, and an upgrade lists each one as its own review item.

- 2026-10-21: Fewer retries and Stop rounds (field report from an adopted project).
  - **Checks written after a complaint are proven (round-4 trials):** new check `check-proven`. When a complaint,
    rule or requirement turn (or one that ends with a `Learned (...)` line) adds a check script or test, Stop wants a
    run of it that failed on the state the user complained about (before the turn changed a file that was already
    there, or after a `git show`/`stash`/`archive` brought the earlier version back), a run that passed, and a line
    `Proven: fails on <bad>; passes on <good 1>, <good 2>` (Spanish `Probado: falla con ...; pasa con ...`).
    `claim-checked` now also catches "can't happen again" / "now enforces this on its own" / "no volverá a pasar"
    without that proof, and "reported to the makers / developers / starter" without a `starter.mjs report` that sent
    it; `starter.mjs feedback` says to word it "noted in docs/starter-feedback.md for the starter". `upset-learned`:
    a full "You're right" needs a `Checked: <what you opened> - <what it showed>` line (Spanish `Comprobado:`), and
    the upset hint now says to check before fixing. learn-from-upset step 0 and 5, project-rule step 6, runbook-create
    §3 and the RULE REQUEST and REQUIREMENT hints say how to prove a check (2 realistic good
    samples, one a valid edge case of the project). Spanish answers get "lista para publicar" / "veredicto: corregir"
    for the review verdict and `**Aviso:**` for Heads-up (writing-standards.md, LABELS_ES). AGENTS.md step 0.5: when
    the agent's tool holds the install of the project's own declared dependencies, the project's own test command
    still runs once. Scenarios: `check-proven:`, `claim-checked:` (promise, reported), `upset-learned:`
    (Checked line), `answer-language:`. Adopt by hand: AGENTS.md step 0.5.
    **Breaking for project hooks:** `starter.mjs feedback` prints a longer line, the upset and rule hints are longer,
    and a project's own scenarios whose answer says a full "You're right" need a `Checked:` line.
  - **Checks fire on the right turn (trials of 8 new projects):** a runbook only opened (read, its skill not invoked)
    counts as followed only when the request routed to it, the answer names it, the turn changed files its own checks
    watch, or, outside setup, it is the one the agent picked for an unrouted work turn, so a setup dry run of
    `feature.md` no longer asks for a spec and a review. The setup turn stays setup after its last step deletes
    `SETUP-PROMPT.md` (`setupTurn`). `debug-trigger` asks for a root cause only when the request reports a problem or the
    failure came before the turn edited the watched files, not for a test the agent wrote first or its own slips.
    `release-ready` and `release-rollback` need a routed release request or a publish command. A helper resumed with
    `SendMessage` counts as running, so Stop waits for it instead of spending its rounds. `root-tidy` reads a data list
    of what each ecosystem needs in the root (`ROOT_TOOLCHAINS`: Go, Rust, Python, Node, Java and Gradle, .NET, Flutter,
    Godot, Docker, CI and more), with source files such as `*.go` allowed only next to their marker (`go.mod`); the
    toolchain entries left `rootAllowed`'s defaults. The plan notice also fires in setup for the app files it writes,
    and mentions the feature's spec, review and release notes; the `CHECKS:` line names `plan-required`. New check
    `review-excuse`: "no other reviewer" is no reason to skip an independent review where sub-agents exist.
    Scenarios: `runbook-look:`, `root-tidy:`, `plan-required:`, `debug-trigger:`, `release-ready:`, `release-rollback:`,
    `stop-wait:`, `review-excuse:`, `check-preview:`.
    **Breaking for project hooks:** the `CHECKS:` line can name `plan-required`, and the default `rootAllowed` no longer
    lists toolchain files (they are in `ROOT_TOOLCHAINS`).
  - **One complete denial before a tool call:** when one tool call breaks several rules (for example git-safety and
    no-ai-attribution in one commit, or plain-writing and no-overwrite in one write or `apply_patch`), the denial names
    them all, numbered, in one message, so the retry does not hit the next one. Every rule is weighed in one pass, so a
    denial costs no more than an allowed call. One broken rule gives exactly the same text as before
    (`tools/hooks/hooks.mjs`, `pretoolDecision`).
  - **Self-check offered at the prompt:** a `CHECKS:` line naming more than 2 checks ends with
    `Self-check first: node tools/hooks/hooks.mjs check --answer-file <file with your answer>.` The `check` command now
    works in a hook-wired session too: it finds the request the prompt hook recorded for the session (or `--session
    <id>`), reads that session's transcript, and writes none of the session's Stop state (round count, turn end, logs).
    Before, it said "no request recorded" there. The turn record now keeps the transcript path.
    **Breaking for project hooks:** a PreToolUse denial for a call that breaks several rules names them all, numbered,
    in one `permissionDecisionReason`, and the prompt's `CHECKS:` line can end with "Self-check first: ...".
  - **Self-tests pass in host projects (field report 7):** inside a project, the engine's scenarios run in a base made
    from fixtures only: the project's own runbooks, hand-written skills, checks, config, hook files listed in
    `"externalHooks"` and hook commands that are not the engine's are left out, and the engine's runbooks and skills are
    as the starter ships them, without the triggers the project added. The project's own scenarios
    (`project-scenarios.mjs`) still run in a copy of the project as it is. Before, a route test failed on a project's
    own "the hooks" and starter-name triggers, and the hook-contract test counted the project's real hook file.
    `selfcheck.mjs --fixture-base` shows what of the project each base holds. Scenario: `host-fixtures:`.
  - **Upgrade review lists the breaking notes:** an upgrade compares the starter's changelog with its copy at the commit
    the project's engine came from, so a note in an entry dated before the project's last review (a re-check written
    later) is listed too. Before, entries were picked by date, and a project got none of the three notes. The notes are
    review items when the project has `"externalHooks"`, and only shown otherwise. "What changed in the starter" now
    shows `(re-check)` entries too. Scenario: `upgrade-breaking:`.
  - **No session state without a transcript:** a hook run with a session id but no readable transcript (no path, a
    missing file at a prompt or stop, an empty or blank file, or a folder) writes no per-session state, no snapshot and
    no Stop log line. At session start, a path whose file does not exist yet still counts, since a new session's
    transcript may be written after that hook. Before, a dry run with made-up ids and an empty transcript left 27 files.
    Scenario: `state-no-transcript:`.
  - **The CHECKS line predicts Stop (field report 7, part 2):** a request that names the file to edit ("fix the
    <name> playbook", "arregla el playbook de <name>", or a path after an edit verb) is previewed with that edit made:
    the checks it sets off are held now, the project's own `requirements.json` checks included, with the writing and
    format checks the file meets, and the runbook's checks that edit can't set off (the hook self-tests,
    runbook-complete) are left out. A request that names no file lists the project's own file checks as "If it changes
    <files>: <tag>", and an edit to a routed runbook adds the format checks its file fails now. With nothing routed, the
    line says playbook-named replaces runbook-exists once a runbook is followed. The line stays within 400 characters
    (tags with one prefix are grouped, "research-(cited, ledger)", then the rest become "+N more"). On 255 real blocked
    requests, precision went from 17.6% to 17.9% and recall from 25.7% to 28.3% (most misses are checks set off by
    what the work did, not by the request); on the replayed field turns, from 51.6% / 61.5% to 70.3% / 100%.
    Scenarios: `check-preview:`, `check-preview guard:`.
  - **Block rounds count per request:** a Stop that only waits for background jobs adds no block, and the Stop after a
    job's notice goes on from the same count, so the 3-block cap ends a long turn and `hooks.mjs last` shows the real
    rounds. Before, every wait reset the count to round 1. A new request still starts at round 1. Scenario:
    `stop-reblock:`.
  - **Background jobs and gate runs read right:** a command moved to the background is waited on although its notice
    says it "will be stopped" after a time limit (that sentence made it count as stopped, so round 1 asked for results
    still being made). A gate run whose output went into a file (`node tools/audit.mjs > .cache/audit.txt`) is judged by
    that file when it was written this turn, not by what the other commands printed. Scenarios: `bg-moved:`,
    `gate-redirect:`.
    **Breaking for project hooks:** the `CHECKS:` line can name a check as "If it changes <files>: <tag>", group tags
    as "<prefix>-(a, b)" and end its list with "+N more"; Stop log rows after a wait keep the request's round number.
  - **Self-tests cost far less in projects (two setups were killed at 60 minutes):** in a project, a whole
    `selfcheck.mjs` run reuses the engine's results when its stamp matches a full pass recorded on this machine (in
    `~/.cache/project-starter/engine-passes.json`, shared by every project made from the same engine). The stamp hashes
    every file of the fixtures-only base, the research claims script, whether git tracks `.obsidian`, the Node major
    version, the platform and the day. The fixtures-only base now takes the project's rules and records (AGENTS.md,
    brief, status, changelog, decisions, menu, checks docs, security, `.gitignore`, `project-scenarios.mjs`) from the
    starter, leaves out the project's own tools, holds only the engine's core checks, and skips dependency folders at
    any depth, so notes and setup steps no longer change it. With results reused, the project's own scenarios, the
    check of its check patterns and every 40th engine scenario (a smoke set) still run: about 20 seconds instead of 4
    to 20 minutes. `--full`, a changed engine file, or another Node major, platform or day runs everything; the first
    line says which mode ran and why. Tool: `tools/hooks/selftest-cache.mjs`. Scenarios: `engine-cache:`.
  - **One self-test run at a time per project:** a second whole run waits for the running one and prints its result; a
    lock whose process is gone or that is 3 hours old is taken over. Helper processes follow the CPU count shared with
    the other self-test runs on the machine (`os.loadavg` is always 0 on Windows), instead of 12 each. Scenarios:
    `selftest-lock:`, `selftest-shards:`.
  - **audit --setup:** a self-test run that times out (now after 45 minutes, not 15) or is killed is a warning that says
    to run `selfcheck.mjs` alone, not a false FAIL; a crash still fails. Failing tests are named under the sweep and
    again after the last line (`failing self-tests: ...`), and `selfcheck.mjs` repeats them after its summary. Its reuse
    of an earlier pass ignores the setup interview, upgrade reviews and security review rows, and holds the same day
    only. An audit that ran the self-tests counts for REQ: hooks-tested, so setup runs the suite once
    (SETUP-PROMPT.md Phase 5, project runbook §12). Scenarios: `audit-selftests:`, `test-inputs:`, `hooks-tested:`.
  - **Dependency folders are skipped:** the audit, the interrupted-work check, dedupe, skill retire, the survey and the
    obsidian notes walk skip installed dependencies and virtual environments (any name: a `pyvenv.cfg`), tool caches
    (`CACHEDIR.TAG`), and `target`, `vendor`, `out`, `bin`, `obj` next to the build file that makes them. Publish
    safety still reads build output. Before, two setup audits walked a `.venv` for 19 minutes. Scenario: `bulk-dirs:`.
  - **Less noise in the answer the user reads (judges of 8 trial projects):**
    - The Stop hook's re-answer instruction no longer asks for "these steps as a short note after it". It now says the
      user never saw the earlier version or the steps, so the answer says nothing about them (no "Note: this version
      ...", no "the earlier answer ...", no check names). The short line for an unchanged answer is now "Answer
      unchanged; also updated: <files>". Scenarios: `answer-noise:`.
    - Every waiver in one command counts: `hooks.mjs waive a "..." && hooks.mjs waive b "..."` waived only `a`, so
      agents wrote the rest into the answer as `N/A(...)` lines. Every hint, Stop message, shipped check message and
      core skill that said "write N/A(<check>)" now gives the waive command. `N/A(<check>)` in an answer still works.
      Scenarios: `waive command:`, `answer-noise:`.
    - Spanish labels for every label a check reads (Finished, Root cause, Assumed, Visual review, Accessibility, the
      security review line and its FAIL lines, Sources, Vetted and license, Playbook/Skill/Worth it markers, backup and
      restore, rollback, before/after, confidence and more). A Spanish request gets a `LANGUAGE:` hint and, at Stop, the
      Spanish forms of the labels; "Visual review: PASS after N round(s)". Scenarios: `answer-language:`.
    - Long content goes to files: the security review answer is one line plus one line per FAIL (fixed or open), never
      the table; the app pack's `security-checklist` accepts that line with the table in `docs/reviews/`;
      `spec-written` asks for one count line, `foundation-set` one line each, a Finished section groups files by folder
      past about 10, and a root cause is one or two sentences. Scenarios: `answer-length:`.
    - The legal-review library skill puts "Not legal advice" once, at the end of a legal reading, never as a banner or
      inside a draft for someone else, and no longer opens with "Working on this with the legal-review skill".
      Scenarios: `legal-disclaimer:`.
    **Breaking for project hooks:** the Stop reason's re-answer sentence changed (no "short note"), the short line is
    "Answer unchanged; also updated: ...", a Spanish request's Stop reason and prompt hints carry a Spanish label list,
    and hints say `node tools/hooks/hooks.mjs waive <tag> "<reason>"` where they said `N/A(<tag>): <reason>`.

- 2026-10-20 (re-check): Fixes from an independent review of six new trial projects (no serious findings left).
  - **Accurate prompt hints (field report 6):** one primary `ROUTE`; other specific matches show as `ALSO ROUTE`, and a
    runbook matched only by a generic word ("improve", "report", "review", "mejorar") shows as `WEAK MATCH, not routed`
    when anything specific matched. A message that names the starter routes to `project.md` first. A message meant for
    another session or the starter ("a report to <starter>", "tell the other session", "dile ...") never routes to the
    runbook that makes a file in `outputs/` or on a generic word. `PRAISE` skips questions and "if/whether" clauses and
    knows Spanish praise. `RULE REQUEST` and `REQUIREMENT` ignore what is passed on to someone else, and know Spanish
    rules ("de ahora en adelante", "nunca más", "cada ... debe"). `RECALL` needs two shared subject words (not "good",
    "bad" or common words) covering half of the request. Scenarios: `route-precision:`, `praise:`, `rule-request:`,
    `recall:`, `relayed turn:` and `manual path:`, in English and Spanish. `tools/trial.mjs` upgrades with
    `--no-selftest`: with the self-test run, each trial upgrade passed its 5-minute limit on a busy machine.
  - **Prompt hints that fit the request (field report 7, items 3 to 6).** A best-choice question ("what is the best",
    "which is better") about the user's own thing ("my", "mi") that one of the project's own runbooks covers no longer
    routes to research; "research", "look up", "current prices" and "what do sources say" still do. A skill is not
    routed on a noun that belongs to something else ("its notes", "sus notas") or on a word typed in capitals as a file
    name ("its NOTES"), and a trigger ending in a colon ("note:") matches only as typed. Spanish requests route like
    English ones: accents are folded before matching, Spanish small words are left out, Spanish question words and
    pointers count, Spanish infinitives and "quiero que añadas" forms are work, and the closest runbook knows common
    Spanish words. The closest runbook now prefers a word only it has, or one in its own name. "Fix the <name>
    playbook so ...", or "arregla el playbook de <name>", edits that file: it routes to `project.md`, not to that
    runbook's job. The `CHECKS:` line lists rule-request and rule-memory only when the request states a rule.
    **Breaking for project hooks:** a message relayed from another session or agent (`<cross-session-message>`,
    `<agent-message>`, "Another Claude session sent a message") that asks for work now gets the prompt hints a typed
    request gets, after a first `- RELAYED: ...` line, and without rules, requirements, praise, upset, autonomy or menu
    codes. Its preview leaves out checks keyed on the request, which its Stop does not hold it to. Scenarios:
    `own-question:`, `runbook-edit:` and `relay-preview:`, in English and Spanish, in a host-like fixture with its own
    runbooks, skills and an `externalHooks` file.
  - **No drip-feed in Stop rounds** (field report 6, item 1). A round now also names what its own fixes will set off,
    as "Then:" steps: the audit, hook self-tests and changelog after a lesson goes into a runbook, skill, rule or check,
    a data check after a data file is written, and the format and writing checks a fixed file will meet
    (REQ: stop-follow-on; a check in requirements.json can name the files its fix edits with `"fixes"`). Work requests
    get one `CHECKS:` line at the prompt, in English or Spanish, naming the checks the turn will be held to
    (REQ: check-preview). skill-learn no longer asks for a lesson in a runbook whose check was waived, or that the answer
    calls the wrong one. After a round that only asked for file changes, an unchanged answer may end with one line,
    "Answer unchanged; done: ..." (REQ: answer-resent; not in headless runs, whose caller gets only the last message); the full answer is still required when it had to change or was
    never sent. A foreground command moved to the background after its timeout is waited on like a background launch,
    judged by its output file and exit code, and files a running job makes do not count as the turn's.
    **Breaking for project hooks:** the Stop reason can list "Then:" steps and their tags in "Names:", and the prompt
    output can carry a `CHECKS:` line.
  - **Answers in the user's language:** Spanish labels ("Terminado", "Causa raíz:", "Aprendido (regla):", "Tienes
    razón", "En parte:") meet the checks that look for the English ones; `"labelAliases"` in config adds other
    languages. AGENTS.md rule 7: the block labels are in the user's language (adopt by hand).
  - **People's folders:** a follow-up that names nobody ("that letter sounds cold") is about the person the previous
    request named, so its fix can be saved there; setup may create everyone's folder (REQ: scope-separate).
  - **Fewer false alarms:** a local `npm version ... --no-git-tag-version` is not a release (release-trigger); setup
    turns are not asked for a root cause, a skill lesson or a plan; the claim check no longer calls "hook self-tests
    pass" false when the app's tests were waived; package manifests and `python -m <pkg>` are not typed-out names
    (name-var); only the screenshot run's own warnings count (gui-warnings).
  - **Under autonomy "auto"** a work answer that ends with a question gets "decide it yourself" unless the question is
    about an outward action, an install, money, security or something irreversible (REQ: autonomy-decide), and stop
    steps that say "with the user" are decided and recorded as Assumed.
  - A stop round's repeated answer starts straight with the answer, not with notes about the fix.
  - **Friendlier terminal:** when an answer is held back, the user sees a heading ("⚓ Anzuelo: almost done, 3 steps
    left (round 1 of 3)") and one short line per step with an icon for its kind (🧪 tests, 📖 runbook, 📝 summary, 🔒
    safety, 🔎 sources, 🐞 root cause...), at most six; the agent gets the details separately.
  - **Waiting on background work:** while helpers or background commands of this turn still run, only truth and privacy
    are checked; the full list runs when their results arrive (no more restarting rounds while waiting). A launch counts
    only when it started, and a stopped or killed job is not waited on.
  - **Field report 3 (live deck tasks):** steps can be waived with `node tools/hooks/hooks.mjs waive <name> "<reason>"`,
    which keeps check names out of the user's answer; an unrelated request no longer inherits the last turn's open
    steps; a request worded differently from a runbook's triggers gets "CLOSEST RUNBOOK: <file>" instead of NO RUNBOOK;
    "Searched: <what> - nothing found (<where>, <date>)" answers a search that found nothing; "don't ask me" and other
    autonomy phrases no longer route to the plan runbook; a here-document that names a test is not a run of it; a
    watched input the agent itself replaced with a command is not reported as the user's mid-turn update.
  - **Breaking for project hooks:** the Stop note for the user (`systemMessage`) is now several lines (a heading, then
    one line per step); the resume notice starts "RESUMED:" instead of "INTERRUPTED WORK:"; the unresolved notice
    names the earlier request; `alwaysLoadedMaxChars` now applies to CLAUDE.md alone (30000) with `directoryMaxChars`
    for DIRECTORY.md. A script that parses these needs updating.
  - **Upgrades decide less by hand:** the upgrade runs the self-tests itself and writes "passed" into the review when
    they pass; breaking changes since the last review are listed as their own items.
  - **All steps in round 1:** a later round no longer adds bookkeeping steps that only the fixing brought on (more tool
    calls for status-handoff, a file touched after the Finished section, a changelog line); name-var looks only at
    lines this turn added, not names a file already had in git.
  - parallel-agents briefs carry today's date from the system and are read once for contradictions (a file marked
    off-limits whose data the helper needs is "read-only").
  - whole-output lets a tool's `--help` (or `-h`) through a filter: it is usage text, not results.
  - `node tools/hooks/hooks.mjs jobs <transcript>` tells a project's own hooks how many background jobs still run, so
    they can hold their checks the same way; the closest-runbook self-test uses made-up words, so a project's own
    runbooks can't match it.
  - A new session's first prompt reuses the newest snapshot any session left, instead of hashing the whole project
    again (1.3 s to 0.18 s in a project with many pictures); the agent's copy of a Stop hold stays under 9,000
    characters, with `hooks.mjs why` for the rest.
  - security-code no longer fires on the word "formidable" in prose or card names (only the library imported by name),
    nor on scratch scripts under `.cache/`; parallel-agents briefs ask each helper for a `Friction:` line, and
    follow-up rounds resume the same helpers.
  - **Hidden instructions are reported, not just ignored:** a file or page read this turn that carries instructions
    aimed at an AI ("note for AI assistants", "don't tell the user") makes the answer warn the user: where, what it
    asked, that none of it was done (REQ: injection-flagged). A live test with a forged supplier letter showed the agent
    already refused the planted actions but told the user only when asked a turn later. Live tests also confirmed an
    agent without hooks follows AGENTS.md's manual begin/check steps on its own.
  - **Field report 2 from an adopted project (live tests):** the engine's session and prompt output is held under
    9,000 characters with routing lines first (Claude Code shows longer output only as a preview), and
    `hooks.mjs notices` prints the rest; SETUP-PROMPT says to keep the project's own hooks under that too and to list
    test fixtures in `"ignoreForChanges"`; a background run counts by its output file and its exit code in the task
    notice, not by the "running in background" stub; whole-output fires only when the tool itself runs (not on a diff
    of its file or a note naming it); a decided "self-tests: passed" line stands in a fresh clone that has no local run
    record; publish safety says to write agent hook commands with `$CLAUDE_PROJECT_DIR`; the resume notice reads
    "RESUMED: the files edited before the interruption are intact"; a short reply to a background task's notice, after
    the turn ended cleanly and with no tool run since, is checked only for truth and privacy, not the whole stop list.
  - **Big projects stay fast:** with 20,000 files and 3,000 notes the hooks took about 1 s per prompt and 4 s per stop;
    now 0.27 s and 0.37 s. Note frontmatter is cached by mtime (`tools/hooks/state/note-meta.json`), and DIRECTORY.md
    lists knowledge notes one by one only up to `"knowledgeRows"` (40), then one row per folder.
  - **Shorter answers:** a security review where every area passed is one line in the answer, with its table in
    `docs/reviews/security-<date>.md` (the whole table only when something failed); the setup summary stays about 25
    lines; writing-standards.md: process stays in files, the answer says the outcome.
  - **Two sessions in one project:** the stop round count, earlier failures, hints shown, the plan nudge and the
    frustration record are kept per session, so one session no longer resets or reads another's.
  - **Field report fixes from an adopted project:** a project scenario with an unknown key fails and names the known
    ones (it used to check nothing); the size sweep holds the starter to its own share (`starterLoadedMaxChars`) and a
    project to its preferences (`alwaysLoadedOwnMaxChars`), with ceilings for CLAUDE.md (30000, loaded every session) and DIRECTORY.md (25000, read when routing; counted
    with CLAUDE.md only when @imported); an upgrade names each failing check and marks new candidates as expected; `--password-store`
    is not security code; modular-code skips `http://*` wildcards and lines marked `modular-ok: <reason>`; a file this
    session brought into a protected folder and nothing cites yet may be removed or renamed (protect-originals); the
    research ledger takes "display ads only" as an honest incentive, catches sellers and boosting services, counts one
    media group as one owner (`GameRant (Valnet)`, and known groups by name), and logs a lead-only claim as
    `unverified`; the commit gate shows the command to run and says its own && chain is fine.
  - **New tools are vetted before use:** a package or tool installed in a turn needs a `Vetted:` line (legitimate per
    two or more independent sources, free with a license that allows the use, maintained and well regarded);
    reinstalling the declared requirements is exempt (REQ: install-vetted). AGENTS.md step 0.5 says so (adopt by hand).
  - Correspondence skill: tone fits the relationship (warm for tenants and customers by default); a friendlier
    rewrite adds no new promises or motives; counts in the answer come from the saved draft.
  - **A versioned hook output contract (field report 6):** `node tools/hooks/hooks.mjs contract` prints what each hook
    event prints (session, prompt, pretool, stop, and the commands for project hooks) with its version, now 3, and
    its history; `CONTRACT` is exported. `node tools/hooks/selfcheck.mjs --contract` checks the files in
    `"externalHooks"`: one that reads the Stop `reason` without `additionalContext`, or looks for a marker the engine no
    longer prints, is named, and so is a `"hookContract"` in config older than the engine's. An upgrade lists each
    finding as a `contract:` review item. No output shape changed in this release, so the contract stays at 3.
  - **Context budget across engines:** the always-loaded sweep also runs the project's own SessionStart and
    UserPromptSubmit hooks from `.claude/settings.json` (only those whose file is in `"externalHooks"`, once each with
    a sample input, 20 s timeout) and warns when one prints over 9,000 characters. `node tools/hooks/hooks.mjs shown
    <key> --session <id>` lets a project hook print a long checklist once: exit 1 the first time (recorded), 0 after;
    a compaction resets it for that session.
  - **State hygiene:** every per-session state file, and the shared ones from before sessions were told apart, goes
    after 7 days at session start (was some kinds after 2 days); `node tools/hooks/hooks.mjs prune --dry` lists what
    would go. A hook run by hand with a made-up session id and no readable transcript takes no snapshot.
  - **Stop decisions are inspectable:** the Stop hook appends each decision to a capped
    `tools/hooks/state/stop-log.jsonl`; `node tools/hooks/hooks.mjs last [N] [--json]` prints the last N with time,
    request start, round, passed / blocked / waiting / ended-unresolved, the steps and the waivers.
  - **A Stop timing budget:** with `STARTER_TIMING=1` the Stop hook prints `STOP-TIMING {json}` on stderr with each
    phase, each group of core checks and each requirements.json check timed; the self-tests time Stop on a realistic
    work turn after the parallel runs finish (the fastest of 5 runs, node start not counted) and fail over
    `"stopBudgetMs"` (500 ms), naming the 3 slowest. The trial's sample upgrades skip the full self-tests
    (`--no-selftest`; `--deep` still runs them), so a sample's upgrade no longer passes its 5-minute limit.
  - **Cheaper upgrades:** new fit candidates (packs, skills, tools) that are not in the project and have no sign of
    need are decided "skip" with an `auto:` reason (`fit.mjs --auto-skip`, used only by upgrades), so only the real
    decisions are left; the upgrade ends with one line: `Upgrade <commit>: 0 regressions, 2 decisions needed.`
  - **Feedback status:** in the starter, `node tools/starter.mjs feedback-status docs/feedback-inbox/<name>.md`
    writes or refreshes `<name>.status.md` with one row per reported item (`### N.` headings or dated lines): "open",
    "fixed in <commit>" or "declined: <why>" (`--set <item> "<status>"`), keeps every status, adds new items as open
    and lists the open ones; a linked project's `starter.mjs status` prints "your reports: N fixed, M declined, K open".
  - **Re-check of an adopted deck project's reports (each item now has a test):**
    - `wire` keeps a project's own Codex hook command even when it shares a group with the engine's, and leaves a
      `.codex/hooks.json` that does not parse alone (it used to be replaced).
    - The audit reads more ways to name several checks in a project's own hooks (`"externalHooks"`): "REQ: a and b",
      "REQ: a + REQ: b", "REQ:a; b", and `_` for `-`.
    - Publish safety: an account named "User" is personal in macOS and Git Bash form too (`/Users/User`,
      `/c/Users/User`), and a Windows home path is named once, not twice. Without git, `.gitignore` is read the way git
      reads it (`*.log`, `/notes/*.md`, `!keep.md`), not only its plain folder lines.
    - Menu codes joined by `+`, `/` or `&` all expand, and an unknown code among the leading codes is asked about.
    - `starter.mjs update` passes `--verbose` on like `upgrade` does. Local changes in the linked starter clone are
      explained, and `update --keep-local` keeps them on top of the newest starter; if they clash, nothing is upgraded
      and they stay in git's stash.
    - `"researchCoveredBy"` in config: a regex for the line the project's own research rule asks for (sources and a
      date). An answer with that line meets research-verified.
    - The closest-runbook hint matches plurals to singular words ("lands" and "land").
    - `hooks.mjs waive` works for agents without hooks too (check reads it from the run log). AGENTS.md rule 7 says to
      waive with the command instead of writing `N/A(...)` into the answer (adopt by hand).
    - A question that asks whether something did a good job no longer gets the PRAISE hint. Feedback the user wants
      passed on to someone else no longer gets REQUIREMENT or RULE REQUEST.
    - skill-learn no longer asks for a lesson from a runbook whose failed check was waived as not applying.
    - Turn files past the 7-day keep period are removed at session start, including the unsuffixed ones older releases left.
      A question turn writes only under `tools/hooks/state/`: skill mirrors found current keep their file times (a
      fresh clone's first session used to touch every mirror file).
    - `starter.mjs report` recognizes a line it already sent after small edits (same date, mostly the same words), so
      an edited line is not sent again; `status` counts the same way.
    - Upgrades refresh a pack runbook whose only change is its `triggers_removed:` line, and keep the removal.
- 2026-10-19 (gap sweep): Fixes from simulating nine kinds of projects end to end (a notes vault, a bakery's office
  work, a Godot game, a web app, a monorepo, an adopted Python pipeline, Flutter, Rust and ML projects, and upgrades).
  - **No more slow stops.** The self-tests and the audit write their results to a run log
    (`tools/hooks/state/runs.jsonl`); the Stop hook reads it instead of running them inside the hook.
    `node tools/hooks/hooks.mjs run "<command>"` logs any other check. `audit --setup` reuses a passing full self-test
    run when nothing it tests has changed, and skips the self-tests while other sweeps still fail.
  - **Setup could not finish** when a security review was logged the same day: the self-tests' copy now drops it.
    Self-tests also keep the project's own tools and skill scripts, so their checks can run.
  - **Outward actions wait for your OK:** mail, posts, `gh issue|pr create`, API POSTs, pushes to other remotes and
    connected services (MCP tools) that send or create (REQ: outward-gate, `"outwardOk"` in config). An answer that says
    "pushed" or "sent" after the action was refused or failed is caught (REQ: claim-checked). `--no-verify`,
    `HUSKY=0` and re-pointing `core.hooksPath` need the user's own words.
  - **Secrets:** reading `.env` and other secret files, printing them (`cat .env`), writing a live key into a tracked
    file and `git add -f` of an ignored secret are refused before they run.
  - **Codex:** `apply_patch` gets every file guard, its transcript is read like Claude Code's (tool calls, results and
    failures reach the checks), and `.agents/skills` is a default mirror. **Gemini CLI:** `.gemini/settings.json` makes
    it read AGENTS.md. `"wireAgents"` limits the wiring to the agents you use. Audits read AGENTS.md when there is no
    CLAUDE.md.
  - **Two sessions in one folder** keep separate turn records, snapshots and notices (by session id).
  - **Change detection:** files moved or copied in with an old date count as new; workspace symlinks and junctions are
    never followed (a monorepo hung); folders `.gitignore` lists are skipped; nested `node_modules`, `.venv`, `.next`
    and build folders are ignored anywhere.
  - **Notes in your own folders:** `"knowledgeDirs"` points the knowledge checks, citations and sweeps at a vault or
    notes folder in place. Citations accept `[1] [title](link)`, `<url>` and paths with spaces.
  - **Fewer false alarms:** a typo fix or rename needs no runbook; complaints become rules (or a lesson in the skill
    that missed); a phrase of common words ("fix it") only backs up a real match; quoted text and code fences don't
    route; files the pack installer copies are not the agent's own new work; root-tidy only flags new files;
    names in code are checked in strings and comments, not identifiers or imports; gitignored and generated files are
    not name-checked; records (DECISIONS, the fit checklist, release notes) are history, not notes to link or rename;
    plan-required ignores a feature's own spec and release notes; the version bump ignores test-only and refactor
    changes; the verification report accepts a bold line.
  - **Routing:** bugs described as "keeps crashing", "feels floaty" or "can't log in" reach bugfix, and a runbook is
    followed through the skill it names; refactors, renames, endpoints, sprints, roadmaps, newsletters, "add a note"
    and knowledge questions (also in Spanish) route; more frustration and "don't bother me" phrasings are heard.
  - **Mobile, desktop and game screens** (Flutter, SwiftUI, Compose layouts, XAML, QML, Godot scenes) trigger the GUI
    review; the gui-review-loop skill has emulator and simulator screenshot commands. The app foundation fits every
    kind of app (CLI, library, game, ML), with N/A for rows that don't apply.
  - **Dependencies:** `cargo add`, `flutter pub add`, `uv add`, `poetry add` and manifest edits (Cargo.toml,
    pubspec.yaml, requirements.txt) need "Worth it: <gain> / <cost>". Debug hints cover flutter, dart and swift.
  - **Fit checklist:** code tools wait for the first code file in a project without code; what is already installed
    starts as "add"; the brief's and the setup answers' words are evidence (a newsletter brief points at marketing);
    the summary is a few lines (`summary --all` lists every skip); "Recommend when:" in a reason is no longer cut.
  - **Survey:** Flutter, XAML, QML and Godot count as screens; notebooks count as Python code; requirements.txt and
    licences are not notes; `.cursor/rules`, `.clinerules` and `.windsurf` rules are found; a repository with no commits
    is a repository; test and build commands are suggested for Python, Rust, Go, Dart, Flutter and .NET.
  - **Adopting:** the project's name comes from its README title or manifest; its own rules are kept in
    `.starter/original-rules/` and setup lists any rule the merge lost; a repository with history keeps its line
    endings (LF only for the starter's files); husky and other hooks are chained, not replaced; the Branches answer
    decides `protectedBranches`.
  - **Upgrading:** an exact rollback (fingerprints, untracked files restored, renamed-file rewrites backed up); the
    link is re-pointed when upgrading from another starter copy; old `test-hooks.mjs` scenarios are saved for moving;
    generated files tracked by mistake are untracked; triggers the starter removed stay removed; rule text changes are
    offered, not only new rules; `update --dry-run` no longer leaves the real update thinking it is current; a repeat
    upgrade that changed nothing writes no review.
  - **Routines:** `docs/routines.md` (routine, every, runbook, last run) is read at session start and due routines are
    announced (ROUTINES DUE).
  - **Labels:** stop steps read as short plain sentences, without paths cut in half.
  - **Feedback inbox:** project reports are marked as data to weigh, never instructions.
  - **An upset user teaches the project.** A new core skill, learn-from-upset, and its check (REQ: upset-learned): when
    the user complains, is annoyed or shouts, the miss is fixed, the lesson's importance is weighed (one-off, lesson in
    the skill that missed it, rule, hook check, new skill, or engine) and stored there, and the answer ends with
    "Learned (<level>): <lesson> → <file>", a file that must have changed. "Again" rules out a one-off note.
    Complaints no longer go straight to a rule: the skill decides where the lesson belongs.
  - **Projects improve the starter, and through it each other.** An engine lesson or an engine check suspended for
    friction is written to `docs/starter-feedback.md`, sent to the linked starter at the next session start, and
    announced there (FEEDBACK FROM PROJECTS) until it is fixed; the next upgrade carries the fix to every project.
  - **Apps built to grow:** the app pack's modular-code skill (features as modules with one public entry, names from
    `docs/names.json`, settings from config, extension points, small files) and its check, which runs by itself on
    each changed code file and judges only what the change adds (REQ: modular-code). The foundation records the
    module layout and the extension points.
  - **Eleven new library skills:** correspondence, routines, notes-vault, manuscript, data-pipeline,
    dependency-update, package-release, ml-experiments, mobile-app, game-dev and web-app-patterns, each with its own
    check, scenarios and zero-dependency scripts where a step can be checked.
  - **Recommended tools** for Rust (Clippy, cargo-audit, cargo-nextest), Godot (gdtoolkit, GdUnit4), notebooks
    (nbstripout, nbQA) and ML (MLflow, DVC), with survey signals so they are weighed where they fit.
  - **Smaller fixes:** "reply to this email" is not an OK to send; drafts in `outputs/drafts/` are not deliverables;
    the Obsidian checks read `knowledgeDirs`; dry runs (`cargo publish --dry-run`) pass the publish gate; every
    stop step shows in round 1.
  - **Adopted vaults pass their own self-tests**: the tests no longer use a folder name a project's notes can claim, and
    a vault that tracks `.obsidian/` keeps it tracked in the test copy. The survey suggests the knowledge pack too when
    notebooks sit next to data. Monorepos set `--version-file "packages/*/package.json"` (SETUP-PROMPT says so).
  - **Security review of the sweep:** feedback from projects (`docs/feedback-inbox/`) is ignored by the starter's git
    and the audit fails if it is ever committed, since it names the user's projects; the survey drops `__proto__`
    keys from a manifest's scripts.
  - **Upgrades refresh pack and library files**: a file from an installed pack or an enabled library skill that the
    project never edited takes the starter's newer version (a skill keeps its added triggers and lessons); an edited one
    is kept and named in the review (`file:`) when the starter changed it since. Setup questions added since setup are
    named too (`interview:`). A typed name held by several keys in `docs/names.json` is one finding, and a new
    project's one-line placeholder no longer types the name out.
  - **Refreshes bring what they link to, and rollbacks are exact again**: a file an installed pack or enabled skill
    has and the project lacks comes with the upgrade (a refreshed skill linked `templates.md`, the app runbooks named
    the modular-code skill). A rollback regenerates skills, mirrors and `DIRECTORY.md` with the restored engine, and
    leads with `ROLLED BACK` instead of printing the change log it undid. The files an upgrade writes are recorded as
    the engine's, so the next Stop doesn't ask for a plan for them. The prompt hook reuses its check of a decided fit
    checklist until the checklist, config or brief changes (about 35 ms less per prompt after an upgrade).
  - **Routing false alarms from real use**: a one-word trigger in a question that asks for nothing to be made no longer
    routes on its own ("no images in any guide???" went to the deliverable runbook), and passing a message to another
    session or terminal is not a new kind of task (no NO RUNBOOK, no runbook-exists), unless it also asks for work.
  - **Triggers fire on how people really talk.** An audit sent 363 realistic messages (questions, typos, complaints,
    indirect asks) and 117 near misses: 53% missed. Fixed in the engine (plurals of short words match, an exactly
    typed phrase routes alone, skills can use `trigger_regex`), in every runbook and skill's triggers, and in the
    forced checks' patterns; realistic recall is now 98.9% with no blocking false alarm. `tools/hooks/trigger-cases.mjs`
    keeps it so: the self-tests fail below 95% recall or on a near miss that would block.
  - **Every MUST is enforced.** New Stop checks: `autonomy-recorded` ("you decide" sets autonomy), `plan-open` (an
    open plan is resumed or waived), and a carry-over that re-checks last turn's unresolved steps. Word-triggered
    MUST FOLLOW hints for legal, data changes, architecture and publishing now block when ignored; file-triggered
    ones also warn right after the edit. A requirement said in passing ("there needs to be ...", "keep in mind that
    every ...") is enforced like any other.
  - **Found by live trials** (real sessions in scratch projects, complaining like a user): empty `__init__.py` files no
    longer count as broken after a resume, and the references sweep no longer reads a path argument after a script
    as a subcommand. One project's agent, told a check fired for nothing, found the cause (an edited old note counted
    as new because its creation time reset), fixed it with a test, and sent it back as starter feedback; that fix and
    its test are now in the engine, so every project gets them.
  - **Hooks about twice as fast with every skill on**: the Stop hook went from about 780 to 360 ms and the prompt
    hook from 290 to 240 ms in a project with all packs and library skills. Sync skips a skill mirror that still has
    the time it stamped (any other change is refreshed), runbooks and skills are read once per hook run unless a file
    changes, and `hooks.mjs bench` times the real path (with a transcript) instead of the no-hooks fallback.
  - **From real projects' feedback** (a live project and a brand-new trial project sent these back): "roles" alone no
    longer forces the security review (game roles; "user roles", "admin roles", RBAC still do); a stated requirement
    no longer also suggests knowledge-capture; the "later - when:" fit notice measures once a day, not every prompt
    (~600 ms per prompt in a project with many images); an HTML page's tags are no longer counted as words by the
    writing check, and block elements end a sentence; self-tests no longer collide with a project's own runbooks,
    pages, Playwright or feedback inbox (fixtures use a made-up name, website projects pass).
  - **From the trial reruns:** a plain code edit no longer prints "MUST FOLLOW: debug" (that check needs a failing
    test or build first); an email address, personal path or IP address written into a tracked file is named at the
    edit (PUBLISH SAFETY), not first at the next audit; triggers only route when their key words sit close together
    ("one command on a new machine" reaches install-update, not app-foundation); "npm package" and "one command
    install" wordings route. Pack triggers that could not route alone ("fix it", "build a", "write me", "save it",
    "i added") are gone, and a self-test checks every shipped trigger (they warned in projects' audits only). In docs,
    the name check skips code spans, fenced blocks and paths, so a project named after its package can write
    `python -m <package>` as it is.
  - **Fit checklist stays true after setup:** a turn that adds files which contradict a decided skip (a first CSV, a
    first web page) or meet a "later - when:" condition is blocked until those rows are updated (REQ: fit-checklist).
  - **From new-project trials' feedback:** the app foundation asks who may do each destructive action (the owner only
    until the user decides) and the security review checks it; the Verification report may be written in Spanish;
    the manuscript names script reads only the style sheet's "## Names" section; a file name in a message routes to
    ingest only next to hand-over words ("here is", "attached", "I added"); `starter.mjs feedback` adds its line to
    the dated list, not below the links; two self-test fixtures no longer collide with real projects.
  - **From a live project:** a trigger that is itself a question ("how do i do", "what do i do in") routes when the
    user types the question mark; a runbook or skill an earlier turn snapshot already listed is never checked as new
    (an edited runbook in a project without git was, when the turn started without a prompt hook); the setup gate
    routes a typical request written in quotes by the words inside them (a quote of 40+ characters read as pasted
    text, so it routed to nothing; the words around the quotes count too). A message from another session after a
    turn ended starts a turn of its own, with no user request: a session driven by a peer for hours no longer re-checks
    work from the user's last prompt.
  - **From a project adopted with its own hook engine** (a deck project): a project's own menu codes are not taken
    for an uninstalled pack's; `wire` keeps the project's own Codex hook commands; `"fluffAllowed"` takes words off the
    filler list (a game's real terms); an upgrade keeps an adopted project's `_fallback.md` lessons; runbook-usage
    stores a hash, not a home-folder path; a Windows home path of an account named "User" is personal too (only
    placeholders pass); `triggers_removed:` takes a starter trigger out of a runbook or skill for good, upgrades
    included; `"externalHooks"` makes the `REQ: <tag>` checks of the project's own hooks count in the audit; a
    runbook may name several menu codes; `starter.mjs upgrade` passes `--verbose`; `update` names the local changes
    that block it; without git, publish safety skips the plain folders `.gitignore` lists; the self-test sandbox
    resets the project's scopes root, verbatim and filler lists, and its "Dropped rules"; the setup prompt covers
    projects with their own hooks.
  - **From an independent review of 23 trial projects (190 findings):**
    - the last message carries the answer: after a Stop round the agent ends with the whole answer again, in the
      user's language, with the steps as a note after it;
    - a complaint is checked against the files first and the answer says plainly whether it holds (REQ:
      upset-learned blocks without that line); a learned check must fail a scenario that recreates the exact defect;
    - a turn that waived its own test or build gate cannot say SHIP or "tests pass": it says NOT VERIFIED (REQ:
      claim-checked); toolchains (Go, Rust, Flutter, Godot) and Go and PowerShell linters are fit candidates;
    - autonomy "auto" no longer stops for the project's own dependencies installed into the project (unless the
      project's own dependency rule in docs/foundation.md or docs/security.md says to ask first; adopt the new
      wording only if that rule agrees), and security-sensitive parts use a maintained library, never hand-written
      code;
    - a "later" that waits for the user's OK is rejected under autonomy "auto"; "already in the project" is no reason;
      the engine's own `.obsidian/app.json` is not counted as the user's vault;
    - setup does not do the user's first tasks and changes no product code, manifests or versions;
    - a turn adding new files hears it needs a plan before the limit, not after (REQ: plan-required);
    - skill hardening waits for use in a second session; release notes are asked for only when shipped code changed;
    - web sources in an answer must have been opened this turn, not only listed by a search (REQ: answer-traced);
    - adopting an Obsidian vault hides the engine's folders from the vault's search and graph;
    - the engine's self-tests run with the project's own checks off and the packs' checks as shipped, so a project's
      own rules (a Spanish-only site, saved browser flows) no longer fail them;
    - an upgrade is not rolled back when the only new failure is new candidates to decide: they go into its review
      (Lesson: adding tools to the catalog rolled back a real project's upgrade);
    - under autonomy "auto", a tool installed on the machine itself may still wait for the user's OK when the reason
      says so; anything installed into the project does not wait.
  - **A deferred skill is decided again when the request is for it:** a library skill the fit checklist left for
    "later" (or skipped) is named when a request matches its triggers (Lesson: a sales project answered "what was our
    best week" without the data-analysis skill it had deferred for exactly that); data-analysis also routes everyday
    sales questions ("best week", "sold the most", "compared to last week").
  - **Self-test about a third faster:** the standalone tests are shared across the helper processes too, and up to 12
    run at once (about 10 to 6.5 minutes in the starter while other work ran).
- 2026-10-19 (later): Fixes from the same project's next upgrade.
  - **No false "kept your edited version".** An older shipped check is not a local edit. The starter now ships
    `tools/hooks/engine-checks-history.json`, the fingerprint of every version of every check it ever released
    (backfilled from git history, grown by sync). A project entry equal to any of them is refreshed, even in a project
    from before `engine-checks.json` existed, and so is one an older upgrade wrongly marked `"custom"`. The `pack` and
    `skill` labels older releases didn't write no longer count as differences. To take the newer version of a check
    you did edit, replace the entry with the one in `engine-checks.json` (removing `"custom"` alone kept it again).
  - **Lessons survive a runbook becoming engine-owned.** Lines a project wrote under `## Pitfalls` of an engine runbook
    or core skill (lines in neither the new file nor any shipped version of it) move to its `## Project lessons`
    section, and the upgrade review lists the file. Before, `project.md` turning engine-owned dropped them silently.
  - **A stale mirror is refreshed.** A skills folder the engine generated (its skills carry `.mirror`) stays a mirror
    even when it is missing from `skillMirrors`, so it is synced, pruned and protected; one left out kept a link that
    pointed one folder short.
  - **A runbook can own folders.** `owns: sources/raids/**` in a runbook's frontmatter: in a turn that follows it,
    another runbook's trigger skips files there, so research downloads don't call for ingest. In any other turn the
    trigger still fires.
  - **`sed -i` is judged by the files it edits.** protect-originals denied a `sed -i` on a runbook because the script's
    text named `sources/`. Only sed's file arguments count now; a `sed -i` on a file in an originals folder is still
    denied.
  - **A labeled markers line is not prose.** The last line counts as the markers line whenever it holds a marker
    (`Footer: Playbook: ...`), so plain-writing no longer measures it as part of the answer.
  - The mirror-link self-test looks only at its own fixture's links, so a project's own runbooks (whose content the
    test base removes) no longer fail it.

- 2026-10-19: Fixes from a real project's upgrade.
  - **Pack and library checks are upgraded too.** `tools/hooks/engine-checks.json` now ships every check: the core
    skills', each pack's (tagged `pack`) and each library skill's (tagged `skill`). An upgrade runs the same 3-way merge
    on the checks of the packs the project installed and the library skills it enabled: missing ones are added with
    their `docs/checks/rule-enforcement.md` rows, unedited ones are refreshed, edited ones are kept and marked
    `"custom": true`, and the upgrade review lists every added check. Switching a check off and the app pack's own code
    folders and version file count as settings, not edits. Before, the live hooks skipped new pack and library checks
    that the self-tests ran.
  - **Skill mirrors keep working links.** A mirror (`.claude/skills`, `.agents/skills`, any `skillMirrors` entry) sits
    at a different depth than `skills/`, so its Markdown links are re-pointed from the mirror's folder to the same
    target. Links inside the skill's own folder and code stay as they are, and the audit compares mirrors the same way.
  - **The engine's runbooks are upgraded.** `docs/playbooks/project.md` was in neither upgrade list, so projects kept
    an old copy with unlabeled "Done when" items and done-when-labeled fired on it. `project.md` and `plan.md` are now
    engine files like `_fallback.md` and `_TEMPLATE.md`: replaced on upgrade, keeping the project's added triggers, its
    `## Project lessons` section and its `hardened`, `harden` and `keep` marks (older copy in `.cache/upgrade-backup/`).
  - **No plain-writing alarm on short answers.** A 2-line progress answer whose first line had no final period ran into
    the markers line and was measured as one 47-word sentence. Length now counts prose only: the answer's markers line
    (`Playbook:`, `Skill:`, `Worth it:`, `N/A(...)`), code spans and file paths are left out, and an answer under 40
    words is never too long. Em dashes and filler are still caught everywhere.
  - **See every check a scenario trips at once.** `node tools/hooks/selfcheck.mjs --explain "<scenario name>"` runs the
    matching scenarios and prints each check that fires, with its short label, what satisfies it and how to waive it,
    so a project writing pass scenarios fixes them in one go instead of one stop round at a time.

- 2026-10-18: Runbooks and skills come up when the work needs them, not only when the request names them.
  - **Event triggers.** What the agent did now makes a runbook or skill mandatory, even if nobody asked. Code written
    for sign-in, passwords, tokens, secrets, permissions, sessions, CORS, uploads, endpoints, shell or eval, query
    building, crypto, payments or personal data needs the security review (security-code). So do `.env`, CI, Docker
    and hosting changes (security-config), and publish or deploy commands, which now wait for the review before they
    run (security-publish). A test or build that failed and was then fixed needs its root cause (debug-trigger), and
    two or more sub-agents need their results checked together (parallel-trigger). Library skills and packs got their
    own: accessibility for screen changes, MCP server code, dependencies and schemas (architecture), production down
    (incident-response), numbers from data files, privacy policies and contracts, migrations (data-change), version
    tags (release), installers (install-update), new originals (ingest), outputs (deliverable) and facts written into
    the knowledge base. The full matrix, with what stays judgment and why, is in `docs/checks/rule-enforcement.md`.
  - **Told early, not only at the end.** The prompt hook prints `MUST FOLLOW: <skill>` when the request shows the
    event coming ("add a login page"), and the edit hook prints it the moment an edit writes what a trigger watches,
    once per turn. The security waivers need a real reason of a few words. New check conditions: `changedContentMatches`
    (what this turn added to the changed files, from the agent's own edits, capped), `anyOf`, `filesIgnore`,
    `ranFailing`, `toolCount` and `guiChanged`; a check names what it makes mandatory with `forces` and its prompt hint
    with `hint`.
  - **Stop rounds no longer alternate.** The first round lists every step, including the lesson for a skill whose own
    check failed. A waiver, a `Playbook:` or `Skill:` marker, or a Finished section written in an earlier message of
    the turn still counts (the Finished section only while no file changed after it).
  - **Upgrades keep checks you edited.** The core checks ship as `tools/hooks/engine-checks.json`. An upgrade refreshes
    an entry only when it still equals the copy shipped last time; an entry edited in the project stays, is marked
    `"custom": true` and goes into the upgrade review.
  - **Fixes from real projects.** A sub-agent prompt may name a brief file that tells it to read AGENTS.md. "Without my
    input" or "don't ask me" prompts a hint to set `"autonomy": "auto"` and record it, after which the fit row passes
    as add. The writing check skips scripts, styles and template literals in pages, and treats image, link-only and
    table lines as their own blocks. `tools/hooks/project-scenarios.mjs` may use fixture names. A new runbook or skill
    that only this project could have says `reuse: none - project-specific: <why>` instead of a skill search, and new
    hand-written skills need the search too. The gui pack saves click-through flows as `docs/checks/flows/<page>.json`,
    `screenshot.mjs --flows --pages <page>` reruns them, and gui-flows asks for it when that page changes. Key prefixes
    such as `sk-` count as secrets only at the start of a word. The user-words check skips engine files and relayed
    agent or session messages. `dedupe.mjs` keeps the copy the project refers to (else the better name, then the
    oldest), never deletes a referenced copy, skips folders written in the last 10 minutes, and takes `--path`.
    `claims.mjs new --slug <topic>` lets helpers on one topic share a ledger. A file created during this turn in an
    originals folder may be deleted again. The self-tests strip a real project's own content from their sandbox, and a
    scenario that judges nothing fails with a hint.
- 2026-10-18: Upgrades and additions can't make a project worse unseen.
  - **A calm display when the checks ask for more, used where the agent's host documents it.** Claude Code (it sets
    `CLAUDE_PROJECT_DIR` for its hooks) gets the steps as feedback for the agent instead of an error, plus one short
    line for the user (an anchor, the starter's name, then `2 steps left before done: ...`), and the session and prompt
    notices as hidden context. Codex (its hook input has `turn_id`) documents no non-error way to continue a turn, so
    it keeps the classic block, with the same short line as its documented user message. Any other host gets the
    classic block. `"stopStyle"` in `tools/hooks/config.json` is `auto` (the default), `feedback` or `block`. Agents
    without hooks get the same short steps from `hooks.mjs check`, followed by the full ones. Not verified in a live
    Codex session: whether Codex also shows the block's reason to the user.
  - **Answers cite like a research assistant, and more "Done when" items are checked.** Research answers end each fact
    with a numbered citation `[1]`, `[2]` and close with a `Sources:` list, one `[n] <link or project file>` line per
    number (research-cited blocks a bare link list and a number with no line; answer-traced ignores citation numbers).
    Longer research turns show short activity lines (`🔍 search: ...`, `📖 read: ...`). New checks: debug-test-added
    (code fixed with the debug skill needs a test change, or an N/A when there is no test framework), security-logged
    (a full security review is logged in `docs/security.md`), skill-compared (a third-party skill brought in passes
    `skills.mjs compare`), incident-root-cause and history-hashes (library skills), release-rollback (app pack), and
    plan-open now has its own tag. A "Done when" label may wrap over several lines and name several tags.
  - **The fit checklist: the AI decides every candidate, the user only sees a summary.** `node tools/fit.mjs` keeps
    `docs/fit-checklist.md` in each project: one row per pack, library skill, recommended tool and optional feature
    (Obsidian vault, git hooks, autonomy auto, recall and memory, plans), each decided add, skip or "later - when:
    <condition>" with a reason. `node tools/fit.mjs check` (fit-checklist) fails a "?", a boilerplate or copied
    reason, an "add" that is not really in the project, a "skip" that ignores what the survey found (web, data, git,
    code, Python files and more), and a "later" without a condition or whose condition is already met. Setup, the
    upgrade review ("fit: N new candidates") and the audit wait for FIT: PASS; the session start announces a measurable
    "later" once it comes due. Setup no longer asks the user about each library skill: only choices that cost money,
    touch privacy or act outside the project go to the user. `fit.mjs decide` and `fit.mjs summary` record decisions
    and print "Added: ... Skipped: ... Later: ...". `tools/survey.mjs` now reads its counts from the engine
    (`projectSurvey`).
  - **compress-for-ai** shortens notes between helper agents and, on request, answers too; its check accepts
    `protect-check.mjs <before> <after>` for agent notes.
  - **Found in a real project, and fixed** (each has a self-test now):
    - Routing needs real evidence: triggers made only of common words ("fix it", "i added") never route, a phrase with
      one key word needs a second one, and questions asking the agent's opinion route nowhere.
    - Pasted text (`<pasted_content>`) and the hooks' own output pasted back are not the request: they don't route and
      don't count for counts, `qa-incident` or any `promptMatches` check.
    - The prompt hook says each notice once per turn, not with every message typed mid-turn. Last turn's misses are
      said once, then dropped. Checks marked `"waitsForAgents": true` are never carried over.
    - After the last allowed block, Stop ends quietly and the misses carry over in plain words (checked, kept).
    - Editing a runbook or skill is maintaining it, not following it. `skill-learn` asks for a lesson only when a
      followed runbook's or skill's own check failed earlier in the turn, never for a wording check.
    - Files changed by background helpers that are still running are not the main turn's changes.
    - The self-tests pass inside a project mid-setup: their sandbox drops the project's own fit checklist, plans and
      hook state, and uses the starter's current core skill checks when the starter can be reached. The merge and
      citation checks wait for background helpers even in a project whose checks predate `"waitsForAgents"`.
    - A fit "later - when:" condition counts what its noun names ("raid files" are files with "raid" in the path,
      "html files" end in .html, "commits" is the git history); one it can't read is not measured, and the sweeps
      revisit it.
    - A file rewritten byte for byte is not a change (the prompt hook keeps each file's hash at the turn's start), and
      build outputs (`buildOutputs` in config) are generated, not GUI changes.
    - Gates are judged by their own result: their pass line, or their exit code when run as their own command.
      `packs.mjs configure app` takes `--build-pass` and `--test-pass`.
    - Numbers the agent wrote into files earlier in the session are not flagged as made up.
    - A quoted list in Markdown is a list, not one long paragraph.
    - A change to `requirements.json` or `config.json` needs only the scenarios of the checks it touched
      (`selfcheck.mjs --tags a,b`), or none for tuning such as a `namesIgnore` glob. The full self-test is for hook code.
    - `DIRECTORY.md` has one short line per runbook and skill; the descriptions live in each file.
    - `new-project.mjs --dry-run` prints a summary and the collisions; `--verbose` lists every file.
    - `hooks.mjs sync` deletes files from skill mirrors that are gone from the skill.
    - Environment names use `STARTER_` (the old `KS_` names still work for one release).
    - The memory folder for rule notes is agent-neutral: `memoryDir` in config, else Claude Code's folder when Claude
      Code runs the hooks, else `tools/hooks/state/memory/` (ignored by git).
    - Engine lessons travel back: `starter.mjs feedback "<text>"` and `starter.mjs report`; the starter's audit warns
      about unreviewed lines in `docs/feedback-inbox/`; `starter.mjs status` says how far the starter is behind.
    - The Finished section is asked for only when real work files changed, not engine state or a helper's files.
    - Wordings the writing standards require word for word are not counted as copies of the user's words.
    - The Stop message shows one short line per step; `node tools/hooks/hooks.mjs why` prints the full steps.
  - **Messages show their kind in the terminal:** "In the terminal" in `docs/checks/writing-standards.md` gives
    each block a bold lead word (`Question for you:`, `Done:`, `Heads-up:`, `Problem:`), keeps questions last and
    lines short. `audit.mjs` and `trial.mjs` color PASS, FAIL and WARN at a terminal (plain when piped or `NO_COLOR`).
  - **Renamed Anzuelo** (after the hooks that hold the agent to its work). "Roe" is also an
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
  - **Setup understands the project first, and speaks plainly:** `node tools/survey.mjs` reads the folder (documents,
    earlier AI instructions, code, data) before any question. Question 0 asks how involved the user wants to be: let
    the AI decide everything, only the important questions, or everything. Every choice is offered in plain words
    (what it does, what you'll notice) with "Let the AI decide" as an option; packs and library skills carry that
    wording, and the audit requires it. The upgrade review uses the same wording.
  - **Questions anyone can answer:** "Questions with choices" in `docs/checks/writing-standards.md`: plain names, what
    each option does, why it is good or bad for THIS project (judged by where it is heading), every technical word
    explained, numbers in everyday terms, one decision per question, and "Let the AI decide". Packs and library skills
    carry "Good when" and "Costs" lines (the audit requires them). The app foundation is asked row by row.
  - **Better or worse?** `docs/checks/better-or-worse.md` lists the questions to answer before adding anything, each
    tied to the check that answers it. Hard rule 16 links it.
  - **Trial (starter only):** `node tools/trial.mjs` builds sample projects (empty, notes and data, a node app with
    git, its own rules, secrets and Husky hooks, a python app), runs new, adopt and two upgrades, and proves every
    promise: no user file changed, rules kept, secrets ignored, the project's tests and git hooks still work, no
    commit made, nothing private leaked, hooks within budget, a second upgrade changes nothing. `audit --full` runs it.
  - **Found by the trial and in a real adoption, and fixed:**
    - wiring switched off a project's own git hooks (Husky, or hooks in `.git/hooks`); they are now kept, and the
      audit warns until they call ours;
    - the audit failed adopted projects for rules files that setup merges later (now warnings until setup);
    - the setup gate counted the instruction "Replace every `<...>`" as an unfilled value;
    - app tests failed in projects whose code lives outside `src/`;
    - four-part version numbers were flagged as IP addresses;
    - a project named after its subject (a game) had every mention flagged: `"_subjects"` in `docs/names.json`;
      setup answers written with a name marker stopped counting;
    - writing "starter.mjs link" into a file with a heredoc was blocked as if it ran.
  - **Development copies:** a `.starter-dev` file marks a copy being worked on. Projects can't be made from it or
    linked to it (`--dev` for throwaway tests), so unfinished changes never reach real projects. In it, the app
    pack's gates apply to the starter itself: self-tests, this changelog, the trial, and a verification line.
  - **Plans that outlive the session:** a work turn that adds 5+ files needs a plan in `docs/plans/`
    (plan-required); unfinished plans are announced at every session start, for any agent, until closed with
    `status: done` or `status: dropped - <why>`. The plan skill gained context, checks per task, a confidence
    score, "How to resume" and `plan-tasks.mjs next`. The starter's own plans never ship to projects.
  - **Recommended tools:** `docs/recommended-tools.md` lists 47 optional tools (Playwright, status lines, linters,
    secret scanners, Pillow for marking up screenshots, data tools and more), each with when to recommend it, when
    to skip it, pros, costs, license and the official install command. Setup recommends only what improves the project.
  - **New skills, merged from imported plugins (all rewritten in our words, credited, Apache-2.0 or MIT):**
    - library: architecture (decisions, system design, tech debt), incident-response, data-analysis (with a
      zero-install `profile.mjs`), legal-review (never legal advice), marketing;
    - frontend-design now also critiques, keeps a design system, writes interface text, reviews accessibility
      (WCAG 2.2 AA) and writes developer handoffs; research gained research with people (interviews, surveys);
    - debug, plan (PRP-style context and checks), session-handoff (to-dos, standups, a glossary in
      `docs/glossary.md`), skill-harden (share skills as a bundle, `bundle-check.mjs`), and the app pack's qa
      (code review, test planning), release (deploy checklist, rollback) and feature (docs) runbooks;
    - the knowledge pack's deliverable runbook gained a prose review.
  - **Requirements enforce themselves:** a lasting requirement the user states ("every picture must have a diagram")
    is enforced in the same turn without being asked: a "Done when" item that names its check, the check and its test,
    or "(judgment: <why>)" when no script can tell (requirement-enforced). Every "Done when" item in a runbook or skill
    changed in a turn says how it is proven (done-when-labeled; older ones get an audit warning). An answer may not end
    by offering to add checks, runbooks, tests or skills instead of adding them (self-improve).
  - **Update from GitHub:** `node tools/starter.mjs update` gets the newest starter into the linked copy (it stops if
    that copy has local changes or is a development copy), then upgrades the project the safe way.
  - **Docs checked for accuracy and compression:** every Markdown file was checked against the code (8 fixes, e.g.
    project test scenarios belong in `tools/hooks/project-scenarios.mjs`, which upgrades keep). The 82 AI-facing files
    were tried at the light compression level with the protect check: none changed, since each would shrink under 5%
    (they are already short; most of their length is commands, tags and tables that must not change).
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
