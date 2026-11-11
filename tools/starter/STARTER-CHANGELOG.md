# <!--name:STARTER_NAME-->Anzuelo<!--/name--> changelog

Changes to the starter itself. A project picks up engine changes with `node tools/starter.mjs upgrade` (or, from the
starter, `node tools/new-project.mjs "<project>" --upgrade`). Rule and runbook changes listed here are adopted by hand
(project-rule, runbook-create), because an upgrade never touches a project's own content. A change to what the hooks
print, or to a command or setting a project's own hooks or scripts may rely on, is marked **Breaking for project
hooks:**, and an upgrade lists each one as its own review item.

- 2026-11-10 (the old suite under v2: name-var, rule 17): v2's end check now holds a changeable name from docs/names.json typed out in a file the turn changed, as the old engine did: outside its marker in docs, in text people read in code (not imports, identifiers, package manifests or the code's own package name), in the lines the turn wrote only. The check moved whole from hooks.mjs into tools/hooks/names.mjs, shared by both engines and the audit (the old engine's results are unchanged: name-var 17 of 17). 2 listed tests now pass; v2 self-test added; mutation caught. The new module is in the engine proof's hash and the files a new project gets.
- 2026-11-10 (the old suite under v2: note-linked): v2's end check now holds a new note that links to nothing, as the old engine did: a note in docs/knowledge, docs/notes, docs/*.md or a vault folder (knowledgeDirs), made this turn, with no markdown link to a .md file, no [[wiki link]] and no "## Related" reason. The starter's own documents and a saved edit to an old note don't count. 2 listed tests now pass; v2 self-test added; mutation caught.
- 2026-11-10 (the speed self-test failing about half its runs): under v2 the end-of-turn scans of what the turn wrote (forbidden words, secrets, code rules, planted instructions, the user's words copied) skip a turn whose calls can't write (reads, searches, messages). They walked the whole project on every plain question: about 55 ms in a 3,000-file project, now 2 to 3 ms. The speed test now times 3 fresh turns and judges the best against 30 ms; it reused one turn before, whose cached walk hid the cost. Mutation caught.
- 2026-11-10 (the v2 sweep): a runbook written this turn and named as followed is no longer asked to be opened by the leave-a-runbook check. v2 self-test case added; mutation caught.
- 2026-11-10 (the v2 list): the 4 open check-proven tests ask for the "Proven:" record line (its counts, samples and edge case), retired 2026-11-05 (user-requirements row 40); they move to v2-retired.txt (triage row 80). v2 proves a new check from its runs.
- 2026-11-10 (rule 2 under v2: leave a runbook behind): v2's end check now asks once (round 1 only) when work past the small-fix size opened no runbook or skill and made none: open the closest runbook (the top 3 are named), leave a new one for this kind of task, or say in one line why none fits (a one-off). Work that followed _fallback.md is asked to leave a runbook, and a runbook the answer names as followed but never opened is asked for. Not for a relayed message, setup, a small fix, or a message that goes on with the same request (an image alone, "again", "continue", an interrupted request resumed) after a runbook was opened for it. A new request opens its runbook in its own turn (rule 1), even one read earlier in the session. This is the form the v2-only plan approved (Task 3). Replay over three projects' real sessions, first tries only: 2 asks in 245 work turns, both deserved by a hand read (a runbook that covered the work was not opened). New v2 self-test; mutation caught.
- 2026-11-10 (a shortened commit id in a message): v2's guard now refuses a message to another session that names a shortened stand-in for a commit id ("commit 72c..." or "fbd…") instead of the id; a git range of full ids, a plain ellipsis and "the next commit" go. The guard's line cap is raised once, from 600 to 800, as decided in advance for parity ports. New v2 self-test; mutation caught.

- 2026-11-10 (the old suite under v2: the check preview): the reminder's "Also checked at the end if files change" line keeps each item whole while the line stays short, and cuts items only when it would run long. 8 preview tests now check v2's own form: the project's own checks as always.md items by their text, the rule runbook's own items, and no handoff for a one-line notes edit (the 2026-10-25 small-change rule). The 2 runbook-exists preview tests stay listed: runbook-exists is a port still to do (triage rows 144 and 147). 9 tests leave the v2 list.

- 2026-11-10 (a field report: a background test run asked for again): under v2 a command run in the background is done when its completion notice comes, not when it started. Files it writes while running (a self-test that sets files aside and puts them back) are no longer "code changed after the tests"; a file written after it ended still is. The same holds for gate, screenshot and audit runs. 1 test; it failed before the change.

- 2026-11-10 (a field report: the self-test in the .anzuelo layout): a self-test fixture that adds a hook to the project's .claude/settings.json no longer crashes when the project has none (the engine's hooks live in settings.local.json there). The tool-flags test calls each script by its full path and prints its detail as text, not "[object Object]". Not verified in that layout here: the project's own rerun will show it.

- 2026-11-10 (a field report: the audit in the .anzuelo layout): with the engine in .anzuelo/engine and the project's own skills in a folder of its own ("skillsDir"), the audit's references sweep called the engine's skills (project-rule, session-handoff and others) missing and failed. It now knows every skill folder the project can use. The layout test covers it; it failed with the old audit.

- 2026-11-10 (a live false hold: files outside the project): the plan check no longer counts files written outside the project folder (another checkout, a scratch folder) as the project's new files. 1 test; it failed under v2 before the change.

- 2026-11-10 (a field report: the data-folder guess missed the main content folder): the folders setup and upgrade offer as "dataDirs" now include a content folder of item folders, each with its data files and its own CHANGELOG.md or notes (Markdown beside data files counts as that item's data), and any folder the project protects (protectedOriginals or newVersionOnly). Item folders of Markdown alone are still notes, not data. The test failed before the change.

- 2026-11-10 (the AI-credit end check, every branch): a commit made this turn onto a branch that is not checked out (update-ref, another worktree) that credits an AI is now named too. The scan covers every local branch, not only HEAD's history, and v2's quick skip reads the newest reflog of HEAD and every local branch, not HEAD's alone. 1 test; it failed before, and again with the skip reading HEAD's reflog only.

- 2026-11-10 (two field reports: runs stopped for a restart): a test run cut off before it finished is no longer a failing run (both engines): an error exit with no failure line that says it was interrupted, or a self-test, trial or audit run with no summary line. A failure that a rerun of the same command passed, with no code file changed between them (Markdown, docs/, .cache/ and memory/ are records, not code), needs no root cause. The self-test hold names a run that did not finish as such, and accepts a plain "stopped for <reason>, rerun after" in the answer. Shared in tools/hooks/base-checks.mjs (interruptedRun, rerunPassed). 5 tests; each failed before the change.

- 2026-11-10 (a live false hold: a job kept on purpose): the end check for a wakeup or scheduled job left on (both engines) now accepts an answer that says the job stays on and when it runs ("stays on", "keeps running", "every half hour", "every 30 minutes", "next run 11:58", and the Spanish "sigue activo", "cada 30 minutos"), as its own message asks. Before, only the words wakeup, reminder, cron, scheduled or recurring counted. The word list is shared in tools/hooks/wakeups.mjs. 2 tests; the old engine failed the new one before it shared the list.

- 2026-11-10 (the held-answer note, short and plain): Claude Code always shows a Stop hook's feedback to the user and has no way to hide it, so under v2 that text is now a heading and at most 3 short items, for example "⚓ Anzuelo: 2 things left before this is done", "- add a dated line to docs/CHANGELOG.md for what changed in the project this turn", "(details: tools/hooks/state/stop-details.md)". The full steps and the instructions to the agent go in that file (node tools/hooks/hooks.mjs why prints it, as under the old engine); a Stop that passes clears it. The draft check (hooks.mjs check --answer-file) still prints everything. **Breaking for project hooks:** a script that reads v2's Stop text for its full steps should read tools/hooks/state/stop-details.md instead. Replayed on 20 real held turns: at most 5 lines, no instruction text, the item count kept. Mutation caught.
- 2026-11-10 (a field report: a dry run that upgraded): with the engine in .anzuelo/engine, "starter.mjs upgrade --dry-run" ignored the flag, pulled and merged for real. It now fetches only, lists the commits, merges and clashes the upgrade would make, and changes nothing in the project, .anzuelo/local or the engine's checkout. Tested in both layouts (the trial checks that the plain layout's dry run changes no file); the new test failed on the old code.

- 2026-11-10 (a live false hold: a described number read as a count asked for): the count check (rule 8, both engines) no longer reads a number that describes existing items as a request: "all 261 sweep groups", "the 4 drafts", "these 3 checks", and a plural number before a singular noun ("261 sweep groups"). A real ask beside one is still held. 2 tests; mutation caught.

- 2026-11-10 (the old suite under v2: a false "pushed" while helpers run): while helpers or a background command of the turn still run, v2 still asks nothing else, but now holds an answer saying a git push or commit happened when the turn's last one was refused or failed, once, as the old engine did. 1 test left the v2 list.

- 2026-11-10 (v2 Stop speed): a quiet bench found v2's Stop 17% slower than at 433a5f7 (191 vs 163 ms, fastest of 6), over the 10% bar. Two costs are cut. The AI-credit scan now skips its git log when git's reflog shows no commit since the turn began (any commit, whoever makes it, writes the reflog; a worktree's git folder is followed). The runbook list is parsed once per hook run instead of once per check, keyed on each file's path, time and size, so a changed, added or removed runbook is read fresh. The end check's own time on the bench sample went from 149 to 94 ms. New: ANZUELO_V2_TIMING=1 prints each end-check step's time to stderr (off by default). New v2 self-test; mutation caught.

- 2026-11-10 (starter only: a REQ tag needs its test at commit time): the starter's pre-commit guard now refuses a commit that adds a "REQ: <tag>" to engine code under tools/hooks/ with no test naming the tag in the same commit (tools/hooks/v2/selftest.mjs, selfcheck.mjs or the project scenarios), the audit's own rule checked on the staged files. Projects are not affected. A release run lost about 35 minutes to such a tag. New v2 self-test; it failed before the change.

- 2026-11-10 (v2: how a held answer reaches the agent): **Breaking for project hooks:** under v2, Claude Code now gets a held answer as non-error Stop feedback (hookSpecificOutput.additionalContext), so the user no longer sees a "Stop hook blocking error"; the turn still goes on, with the same round limit. Codex and unknown hosts keep the classic block ({"decision":"block"}); "stopStyle": "block" or "feedback" in tools/hooks/config.json forces either. No line of its own for the user either way. This is the form the old engine already used. A project script that reads v2's Stop output for "decision" sees the new form on Claude Code. Mutation caught.
- 2026-11-10 (v2 release fix): the release checks (release notes and attribution scan, rollback plan) fired again under v2 for "prepare a release" with the release runbook opened. A check's words-only branch is now dropped only when the rest of the check is words too; next to an act such as the runbook opened, the words narrow it (a release run caught 2 tests). A round-2 fixture now writes its runbook lesson by an Edit, as the transcript would show.

- 2026-11-10 (the old suite under v2: who may delete): v2's end check now holds a "Who may do what" row in docs/foundation.md changed this turn that gives a destructive or sensitive action (deleting, money, settings, other people's data) to someone other than the owner without the user's own quoted words naming that role, as the old engine did; a request for a feature is no grant to a role. Always on. The rule moved unchanged to tools/hooks/grant.mjs, shared by both engines. 1 test left the list; mutation caught.
- 2026-11-10 (v2: the agent's own failing audit is the health check's result): when the agent ran the audit after its last change and it failed, v2's end check names the failure from that output instead of running the audit again (a few seconds saved per such turn). A new runbook or skill that is not well-formed (no check, no triggers or sections, an invalid name) is held by that health check under v2; 4 old tests now say so. Also: the friction record is written where v2 keeps hook state, so a project with the engine in .anzuelo/engine keeps it in .anzuelo/local (a release run caught it). New v2 self-test; mutation caught.
- 2026-11-10 (the old suite under v2: look for a skill before writing one): a new hand-written runbook or skill made this turn now needs, under v2, the search for an existing skill first (rule 2): the skill-finder skill used this turn, or the answer saying where it looked ("Existing skills checked: ..."); a procedure only this project can have says so in its frontmatter. Not for files the starter or a pack ships, or generated mirrors. 3 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: the count asked for): "give me 5 options" means 5, said with the number (rule 8): v2's end check now holds an answer whose words never state the count the user asked for, as the old engine did. The rule moved unchanged to tools/hooks/count.mjs, shared by both engines. 1 test left the list; mutation caught.
- 2026-11-10 (v2: a check the user keeps complaining about is reported, not switched off): when the agent's own Issue lines name the same check in 3 of the last 6 turns, v2's end check asks once to log it in docs/starter-feedback.md for the starter, and the reminder has the agent offer the user once to turn it off. The old engine's automatic suspension is retired (a check that is on runs every time; only the user turns one off). Also: the self-tests' temp-folder cleanup retries on Windows file locks, which crashed one test shard in a release run. New v2 self-test; mutation caught.
- 2026-11-10 (v2: a changelog line after real work, in any folder): rule 12 as written. Under v2, work past the small-fix size (3 files, 40 edited lines) in any folder now needs a dated line in docs/CHANGELOG.md, not only changes to rules, runbooks, checks, skills and tools; asked once. Never for engine state or the engine's own folder (.anzuelo/), for the user's own data folders (new config "dataDirs"), or in a project with no docs/CHANGELOG.md. A replay of real sessions found about 4% of work turns newly held before those exemptions, the clear false asks being an engine install and data edits. Setup offers "dataDirs" for folders that look like data (tools/hooks/datadirs.mjs), and an upgrade lists them as a "data-dirs" item to decide. **Breaking for project hooks:** a project whose work turns change code without a changelog line is now asked for one; set "dataDirs" for data folders. New v2 self-test; mutation caught.
- 2026-11-10 (v2: a moved or copied file is a change): a file a command of the turn moved or copied into place (mv, cp, git mv, Move-Item, Copy-Item) now counts as changed this turn under v2, though it keeps its old file time, as the old engine counted it. Before, a scan moved into sources/ set off no ingest check. 1 test left the list; mutation caught.
- 2026-11-10 (v2: no check set off by the request's words inside a mixed trigger): a check whose trigger is "any of" an action or some words in the request is now set off under v2 only by the action, as keyword forcing was retired (2026-11-07). Before, "do a security review before we make it public" was told "Something was published or deployed this turn" with nothing published. New v2 self-test case; mutation caught. Also: the security-checklist fixture under v2 looks for the check's own message.
- 2026-11-10 (the old suite under v2: checks that wait for helpers): while helpers started in the background this turn still run, v2's end check skips the checks on their merged results (flagged "waitsForAgents", or parallel-merged and research-cited in a project's copy written before the flag), as the old engine did. Also: the gate-redirect fixtures under v2 use the runbook marker form; v2 already judged a run by the file its output went to. 2 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: plain writing): v2's end check now holds em dashes, filler phrases, walls of text and run-on sentences in the answer and in every user-facing file the turn changed (rule 7), naming where each is, as the old engine did; warmth in a letter is not filler. Before, v2 checked none of it. The rules moved unchanged to tools/hooks/writing.mjs, shared by both engines, with the old settings reader (extended lists, "fluffAllowed"). 3 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: shared steps once): a request with several tasks (three or more list items, or two or more "and also") now hears in v2's reminder to list each task's steps, merge the ones they share and do each once, as the old engine did (rule 8). The detection moved unchanged to tools/hooks/near.mjs, shared by both engines. 2 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: no watcher left armed): v2's end check now holds a turn that ends with a watcher (the Monitor tool) still armed and not named in the answer, as the old engine did: a leftover watcher wakes the session later, and its reply replaces the answer the user reads. The detection moved unchanged to tools/hooks/wakeups.mjs, beside the wakeup check, shared by both engines. 2 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: no excuse for a skipped review): where sub-agents exist, v2's end check now holds an answer that skips the independent review because "no other reviewer is available" (English or Spanish), as the old engine did: a reviewer sub-agent is one. The rule moved unchanged to tools/hooks/excuse.mjs, shared by both engines. 2 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: a project's own Stop command): v2's end check now runs a project's own Stop command (config "externalStop"), as the old engine did: its numbered steps join the list, a crash is one step to fix, and a run past its time limit is named as one to rerun, never to remove. Before, v2 never ran it, so a project that had merged its own Stop hook lost those checks. Not on a turn the user paused. The code moved to tools/hooks/extstop.mjs, shared by both engines. 2 tests left the list; mutation caught.
- 2026-11-10 (v2: the gui pack by the project's packs): v2 asks a project that changes screens to get the gui pack whenever the pack is not among its packs, as the old engine does, even when a screenshot tool is on disk; before, a copied or leftover tool made it ask for screenshots instead. Found by the release run's v2 sweep. Also: the pass-line test under v2 writes and checks its plan, as a real turn does (fixture only).
- 2026-11-10 (the old suite under v2: examples of a wider point): when the user names items as cases of a wider point ("or something else that doesn't fit", "there might be others"), v2's reminder says the work covers every case, and its end check holds a turn that changed files until a "Scope: <the point> - <every case, and how many checked>" line is in a message, the answer or the turn notes, as the old engine did. The pattern moved unchanged to tools/hooks/near.mjs, shared by both engines. 3 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: AI credit caught at the end of the turn): v2's end check now names a commit made this turn that credits an AI (in its message or as its author), made around the guard by an alias, an editor, another tool or a helper, so it is reworded before more commits pile on; before, v2 caught it only at push time. Same scan as the push guard. Always on. 1 test left the list; mutation caught.
- 2026-11-10 (v2 reminder: "Must follow" only when an action sets the check off): a check that can apply on the request's words alone is named as "Likely fits: <skill>"; "Must follow" stays for checks held on what the turn does (files changed, their content, a command run or failed). All 3 shipped such checks are action-set. New test; mutation caught. The v2 self-test prints each part's size on every run.
- 2026-11-10 (the old suite under v2: pasted logs are not the user upset): in a long message (over 3,000 characters), v2 now reads only its first and last 600 characters for upset, as the old engine did, so complaint words inside a pasted log no longer send the agent to the upset handling. The self-tests now match the old "upset" expectation to v2's wording, which showed this false alarm (it had passed only because v2 never printed the old wording). The rule moved to tools/hooks/near.mjs (ownEnds), shared by both engines. 1 test left the list; mutation caught.
- 2026-11-10 (the old suite under v2: mandatory reviews named up front): when a request shows work that a check makes mandatory (sign-in or payment code and the security review, and every other trigger with "forces"), v2's reminder now names it before work starts ("Must follow: ..."), as the old engine did; before, v2 said it only at the end. Not for a request that only asks, a relayed message or words inside quotes. 2 tests left the list; mutation caught.
- 2026-11-10 (self-tests: a project's own files are no engine code): the self-tests search only the engine's modules to decide whether a check exists. A project's scenario file named a missing check, so its scenario no longer failed with "no check named"; the release run caught it. Also: 4 incident and commit-history fixtures under v2 now have the file or the git history their answers name (the verdict tests still block).
- 2026-11-10 (the old suite under v2: deciding instead of asking): under "autonomy": "auto", v2's end check now also holds a work answer that ends by asking something the agent could decide (a closing question, one below the Finished section, "reply with a number"), as the old engine did; before, only a "Questions for you" label was caught. A labeled question about an outward action, an install, money or security is no longer held: that stays the user's. The judgment moved unchanged to tools/hooks/decide.mjs, shared by both engines. 4 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: weighing an addition): v2's end check now asks for the gain and the cost of a new skill, pack or dependency (installed by a command, or typed into a manifest such as Cargo.toml or pubspec.yaml), in the answer, a message of the turn or the turn notes. The rule moved unchanged to tools/hooks/worth.mjs, shared by both engines. 4 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: handing the work over): when the user says to go on without them ("without my input", "do not ask me anything", "no me preguntes"), v2's reminder now says to set "autonomy": "auto", record it in docs/DECISIONS.md, and from then on decide and record each choice as an Assumed line; outward actions, third-party installs and anything irreversible still need an OK. Not for relayed messages, and not when autonomy is already auto. The word list moved unchanged to tools/hooks/near.mjs, shared by both engines. 4 tests left the list; mutation caught.
- 2026-11-10 (self-tests: no silent skips after a move): the self-tests decide whether a scenario's checks exist by searching every shared engine module, not only hooks.mjs. A rule moved to a shared module had its blocking scenario skipped as "packs not installed here"; the covers test caught it in the release run.
- 2026-11-10 (the old suite under v2: screens): v2's end check now asks for the newest round of screenshots to be the one looked at (its contact sheet or its shots, not an older round's or a debug shot from before a full round; a page rewritten with other content after a reviewed round needs a new round), counts Flutter screen files, and tells a project with no gui pack that changes screens to get it. The rule moved unchanged to tools/hooks/gui.mjs, shared by both engines. Also: a note ("Added:", ...) after an earlier answer that passed is not taken for a note with no answer. 9 tests left the list; mutation caught. Later the same day: a reviewed round's checks too (the one-line verdict, saved flows rerun, the latest run's measured warnings fixed or answered), from the same shared module (guiRound); the verdict is not asked twice when the gui runbook's own item asks it. The engine's shared-module budget is 3,500 lines for the whole move (it was 2,600 and counted in v2's own 6,000).
- 2026-11-10 (hook timing sees the trial): the trial registers as a running test suite, so another suite's hook timing taken during it notes the shared machine (or waits for it) instead of reporting a loaded number as clean. It steps aside while its own child suite runs (--deep), which registers itself. Found by a project's upgrade report: 14 test processes were running and no "shared the machine" note was printed. The v2 sweep's driver needs no entry: the self-test it starts registers.
- 2026-11-10 (v2: acknowledged from the chat): an Issue line the agent wrote in its visible text, with none in the notes, now gives the user the "acknowledged" line under v2, as the old engine did. The end check still reads only the notes and file writes, so a line dropped after a block holds nothing. The agent-neutral covers test (begin and check without hooks) passes under v2. Mutation caught.
- 2026-11-10 (the old suite under v2: covers): v2 runs the development-copy check that a change to how projects are made, linked or upgraded needs the trial (dev-new-project, moved to tools/hooks/base-checks.mjs, shared). The covers tests under v2 cite the v2 test the triage names for each requirement settled another way, and need none for the two retired by the user's dated decisions. The changelog covers test passes under v2 with the turn's own edit in its fixture.
- 2026-11-10 (the old suite under v2: plan-open): v2's end check now holds, once, a work turn whose request continues a plan that was open when the turn began, when the turn neither touched the plan nor ran its status; the prompt hook records the open plans with the turn. The rule moved unchanged to tools/hooks/planreq.mjs (with the key-word helper, now in near.mjs), shared by both engines; a project that switched it off is not held. 4 tests left the list; mutation caught.
- 2026-11-10 (release runs: the v2-test counter is a record): the count of requirement tags with no v2 test moved from tools/audit.mjs to tools/starter/reviews/v2-untested.txt. The audit lowers it itself when it goes down (a warning, not a failure), and the push guard takes it as a record only when it went down, as it does the list of tests v2 may still fail. Two release runs had passed every step and then failed only for want of a commit lowering the number.
- 2026-11-10 (the old suite under v2: check-preview, part 1): the guard now holds under v2 too: every line the end check's round 1 holds was named in the reminder (its runbook's list or the "Also checked at the end if files change" line), and the reminder names nothing the turn can't set off outside that conditional line. It found that a long runbook list pushed the "Also checked" line out, so a runbook fix was held to the project's own check unannounced: when the line has no room of its own, it now goes at the end of the last line, within the 10-line cap. The self-check the reminder advertises ("check --answer-file") now finds its request in a hook-wired session whose shell has no session id (the newest turn of the last day, or --session <id>, as the old engine), and reads the transcript the prompt hook recorded with the turn.
- 2026-11-10 (the old suite under v2: answer-resent): v2 now holds a last message that is only a note on an answer ("Added:", "Corrected:", "Answer unchanged") when no full answer was sent earlier in the turn, and a correction that quotes words the earlier answer does not hold, as the old engine did: the user would read a note about an answer they never got. The block's own wording stays v2's (always a short note of what changed, the user's rule of 2026-11-07). 8 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: answer-traced): v2 now traces the figures an answer states as data (money, percentages, numbers with thousands separators, counts with a data unit, a figure after a word like sales or total, a comparison like "520 more than"), whatever the request asked: each must come from something read or run in the session, or be marked as worked out, an estimate or not verified. Incidental numbers (list items, steps, line numbers, versions, dates, times, test counts) never start it. A request about numbers gets one reminder line on where figures come from; the prompt's words never hold a turn. A figure read earlier in the session counts, including tool results sent as text parts and results more than the end check's usual 5 MB back (the whole session is read only before a hold). A "Corrected:" note after a block is applied to the earlier answer, as the old engine does (correct.mjs, shared). Replay over five projects' real sessions: 3 holds of about 1,830 answers, each a figure found nowhere before it, 0 false asks. Mutation caught.
- 2026-11-10 (the old suite under v2: research-verified): v2's end check now holds a turn that used the web (a web search or fetch, or curl to a site that is not this machine) through the research skill or in a knowledge project, until the research ledger's check passes and the answer ends with its "Verified:" line, or says "Quick lookup:" (outside knowledge projects) or "Searched: ... nothing found (<where>, <date>)". A notes line that only names the ledger check is no run of it. The rule moved unchanged to tools/hooks/trace.mjs, shared by both engines; a project that switched it off is not held. 4 tests left the list; mutation caught.
- 2026-11-10 (the old suite under v2: relayed messages): a message relayed from another session or agent routes under v2 only on the sentences that ask for work, as the old engine (what it quotes, runs or reports as done is left out, and its "from now on" sets no rule of the user's); a helper's hand-back, a peer's idle or delivery notice and a message that only reports get no reminder. Before, v2 routed the wrapper's own words ("cross-session message" reached the field-report runbook) and gave small talk the generic line. The helpers moved unchanged to tools/hooks/relay.mjs, shared by both engines. The old suite now reads the old check preview as either v2 form (the runbook's list, or the "Also checked at the end" line).
- 2026-11-10 (the old suite under v2: praise): v2's reminder now has one line when the user's own words praise the work: write what exactly worked into the runbook or skill it came from, and "keep doing this" is a standing rule. A hint only: the end check never holds a turn for praise. The detector moved unchanged to tools/hooks/praise.mjs with the whitelist it reads, shared by both engines; a relayed message's praise sets off nothing. 11 tests left the list of tests v2 may still fail; mutation caught. The reminder stays within its 10 lines.
- 2026-11-10 (v2 honors switched-off checks): an engine check the project switched off after friction (the friction-suspend step) no longer holds the turn under v2 nor shows in the reminder's preview line, as under the old engine; v2 had honored only "disabled". The old test for this passed under v2 without testing it, because its check (count-honored) is not run by v2.
- 2026-11-10 (check preview, v2: the plan rule): a task's "Also checked at the end if files change" line also names the plan rule with the project's own new-file limit. A project that switched the plan check off (the friction-suspend step) is neither told of it nor held by it under v2, as under the old engine; v2 had ignored the switch. Mutation caught on both sides.
- 2026-11-10 (the old suite under v2: plan-required): v2's end check now asks for a plan when a turn added many new files and the answer leaves work open with nothing recording it (no plan in docs/plans/, no STATUS.md line), the same rule as the old engine. The rule moved unchanged to tools/hooks/planreq.mjs, shared by both engines. Its 3 tests pass under v2 and left the list of tests v2 may still fail; mutation caught in both engines.
- 2026-11-10 (v2 skill hint, relayed messages): the reminder's skill hint reads only the user's own words, so a message relayed from another session suggests no skill ("the three judges ran in parallel" named the parallel-agents skill). Found by the release run once the suite read the old labels in v2's words; mutation caught.
- 2026-11-10 (check preview, v2): a task's reminder ends with one line naming what the end check also asks if files change: the engine checks that name the routed runbook or skill and apply once files change, and the project's own always.md items that apply when a file changes ("Also checked at the end if files change: ..."), each by its own tag or item text, four at most and "+N more". A hint only; added only when it fits under the line cap, so it never pushes a "Done when" item out; none for a question. The interactive self-check stays shown in every session, a deliberate difference (the rule to check a draft first holds in every session). The plan-first preview waits for its check (plan-required) to be ported. Tested; 3 mutations each caught.
- 2026-11-10 (the old suite under v2: own-question routing): v2's reminder now routes as the old engine did, as hints only, within its line cap. A task no trigger matches is told its closest runbook (by shared content words, Spanish too) in the same line as "pick the runbook in DIRECTORY.md", so the reminder gains no line. A one-word skill trigger counts as the request's first word when it is the skill's own name ("research ...", "investiga ...") or a label typed with its colon ("note: ..."); a generic verb ("compare ...") still does not. On equal triggers the project's own skill beats one a pack or the library ships. Routing reads only the user's words: the hooks' own output pasted back, and relayed messages, never route; a question that asks to make nothing does not route on a one-word trigger; a message for another session gets no closest runbook. The closest-runbook matcher and the request-kind patterns moved whole into the shared tools/hooks/near.mjs. The suite reads the old reminder labels in v2's words (SKILL, ROUTE, CLOSEST RUNBOOK, NO RUNBOOK, CHECKS). Own-question: 10 to 21 of 28 pass (the rest need the check preview); 55 listed tests pass in all; 8 mutations each caught.
- 2026-11-10 (the v2 list ships with its release): the list of tests v2 may still fail (tools/starter/reviews/v2-failing.txt) counts as a proof record when it only shrank since the tested commit, so the release run's shortened list goes out in the same push; a test added to it would weaken the run and is refused. Tested both ways; each mutation caught. (Lesson: the 2026-11-10 release had to keep the longer list, since the push guard refused the shortened one.)
- 2026-11-10 (the old suite under v2: skill-learn): a runbook or skill followed this turn whose own check held an earlier round of the request (and is met now), or fails now, gets its lesson asked for: written into it, or "Skill lesson: none - <why>". The check moved whole into the shared tools/hooks/skilllearn.mjs with all its exclusions (waived checks, runbooks matched by mistake, wording and answer-only checks, disproved complaints, setup). Under v2 the earlier rounds come from its Stop log, each step mapped to its check (an engine check by its message, a runbook's "Done when" item as its own, the rule and complaint asks by their words), and what the agent said includes its turn notes. User requirement row 18. 3 mutations each caught.
- 2026-11-10 (plans are proof records): a commit that differs from the tested one only in docs/plans/*.md is still the tested engine, like the status and changelog notes, so a plan note written while a release runs does not undo its proof. Tested: a plan-only commit is pushed; an engine file still is refused.
- 2026-11-10 (the old suite under v2, judged honestly): under v2, a repeat-round scenario now gets the turn record v2 keeps (blocked already, its rounds), and any scenario v2 did not judge fails unless ending early is what it tests (`ends: true`). Before, about 50 repeat-round scenarios passed without v2 judging them. That surfaced 3 real v2 gaps, fixed: a repeat round judges the answer sent before the block together with the short note v2 itself asks for ("Added:", "Corrected:", a line or two), not the note alone; a message typed during the work is asked about once, not in every round; and a record line (changelog, status, decisions) sets off no follow-on, since it is the step itself. Fixture: the Finished section's example file exists from before the turn. 4 mutations each caught.
- 2026-11-10 (v2 check with no transcript): for an agent with no transcript (any but Claude Code), `hooks.mjs check --answer-file` now judges the turn with the same end check as a Stop, from the request `begin` recorded, the run log since then, and the files changed since then (tools/hooks/v2/manual.mjs). Before, it judged nothing: an edited hook file got CHECK: PASS. Tested: an edited hook file asks for the self-tests until the run log holds a passing run; removing either part makes the test fail.
- 2026-11-10 (the old suite under v2: stop-follow-on): an ask whose fix writes files now names, in the same round, what those files will set off, judged as if they were written: a rule written down (CLAUDE.md, the requirements table) brings the runbook's changelog item and the self-tests if the rule's check goes into the hook; a lesson brings what its file sets off, unless the turn changed nothing or says "Learned (none)"; a "Done when" item or engine check that asks for files brings the checks on those files (data written brings the validator). Shown as "Then, once <files> are written: <the ask>". The old engine's audit step is not named, since v2 runs the health check itself. 9 more listed tests pass; 4 mutations each caught.
- 2026-11-09 (release rule: speed judged once alone): a push of the starter now needs its time limits proven on the tested commit, not only noted beside other runs. The proof (tools/hooks/engine-proof.json) gains `speed: { stop, v2 }`: the old suite's Stop timing within budget for both engines, and the v2 self-test's release run (ANZUELO_RELEASE=1), which first waits up to 10 minutes, adding no load, for the machine to itself and the timing turn, and is judged only when it got that window and noted nothing. The pre-push guard refuses a commit whose proof lacks either. A time within its limit beside other runs still counts (load only adds time). Tested: a proof with v2 speed only noted, and one with no speed record, are both refused; removing the check makes the test fail.
- 2026-11-09 (v2 speed tests under load): the v2 self-test now lists its run with the machine's other self-test runs, as the old suite does, and its two time limits (prompt and pretool over a bare node start; a question turn's end check under 60 ms) fail only when it runs alone; beside another working run, an over-limit time is printed and not judged. What a time cannot hide (no files walked on a question turn, patterns built only on first use) is judged always. Measured while a release run shared the machine: prompt 61 to 75 ms and pretool 58 to 82 ms over bare, and one question-turn check at 244 ms, all load. Test work no longer has to wait for a release run to end.
- 2026-11-09 (v2 size test): the shared part of the engine is now counted from what the new engine really loads, followed through each module's own imports, instead of a hand list that had missed six moved modules. Measured: about 2,340 of 2,600 lines (was about 1,890 counted), whole engine about 5,390 of 6,000.
- 2026-11-09 (the old suite under v2, harm 4: hooks-tested): a change to the hook engine or to the checks (requirements.json, config.json) needs the self-tests that cover it run and passing, in v2 too: the whole suite for engine code, only the changed checks' scenarios for a check file, nothing for a setting no check reads. The turn-start snapshot now also keeps those files' text as it was, so the change is judged against the turn's start. The check moved whole into the shared tools/hooks/hooktests.mjs.
- 2026-11-09 (the release chain): the v2 sweep takes a listed test that now passes off the list in the same run and passes; only a test that fails and is not listed fails it, and a failing run leaves the list as it was. The list still only shrinks.
- 2026-11-09 (a false hold, v2): the end check's own send-back, which arrives as a user message, is no longer read as the user's words, so the copied-words check stops flagging the engine's own message strings in its files (the old engine already skipped it).
- 2026-11-09 (a project's upgrade report, speed): v2's trace check reads the session's history only when the turn has something to trace; on a long session that was 7 to 10 ms of every Stop (measured 0.1 ms now). Side by side with the release before it, prompt and pretool did not move here; Stop was 5 to 15 ms slower, and this takes most of it back.
- 2026-11-09 (the old suite under v2: done-when-labeled): a runbook or skill changed this turn labels every "Done when" item with its proof, a check that exists or a judgment, in v2 too. The check and its item parser moved whole into the shared tools/hooks/donewhen.mjs.
- 2026-11-09 (speed): v2's test check works out whether the project has tests (a walk for test files) only when code changed, so a plain question's end check no longer walks the tree for it (measured 45 to 73 ms down to under 1 ms in a large project).
- 2026-11-09 (a false hold, both engines): "run what you tell the user to run" no longer reads a verb whose subject is a thing as an instruction: "modules both engines run: `a.mjs`" describes code; "Run `node a.mjs`" still asks for the run.
- 2026-11-09 (the old suite under v2, harm 4: app-test-pass): the gate judgment moved whole out of hooks.mjs into the shared tools/hooks/gates.mjs, and v2 judges a declared check's run with it: by the check's own result, not an echo after "||", a script or a configure line that only names it, or a run refused for its form. A check that can't start here (refused, or its program not installed) is asked once for an honest line, "NOT VERIFIED: <what> - <why>" or the plain "Not done: <what> - <why>", and never for another run.
- 2026-11-09 (the old suite under v2, harm 3: answer-traced): "Did I make that up?" moved whole out of hooks.mjs into the shared tools/hooks/trace.mjs (with the cited-claims check and the page reader), and v2 now runs it: numbers in a factual answer, and numbers written into the knowledge base, trace to something read this session; a cited project file or web page was opened; a claim cited to a note shares its key words with it. The session's tool results and the agent's own writes stay apart, so a number written into a note never traces to its own write. The path the prompt's words started (a question about the project's numbers) is left out under v2. A "can't happen again" promise is caught in Spanish too ("para que no vuelva a pasar").
- 2026-11-09 (the old suite under v2, harm 3: instructions-run): what the answer tells the user to run (a setup script, a launcher, an npm script, a make target) made or changed this turn, ran here the way the user is told and worked, or the answer says it is not verified; "powershell" means 5.1, so a run under pwsh is no run of it. The check moved whole out of hooks.mjs into the shared tools/hooks/launchers.mjs, with its message, and v2 now runs it.
- 2026-11-09 (a field report): the upgrade's closing report prints what changed in the starter first, as "changelog:" lines marked as nothing to decide, and the items to decide last, next to the summary line. Before, changelog entries bulleted like the items came right after them and read as more items to decide.
- 2026-11-09 (the old suite under v2, harm 3: check-proven and claim-checked): the proof code moved whole out of hooks.mjs into the shared tools/hooks/proof.mjs, so both engines run one copy. v2 now judges it like the old engine: in a complaint turn (the agent's Issue line this turn or earlier this session, never prompt words), a check written this turn must be shown failing on the state before the fix and passing on the files it governs, and a "can't happen again" promise needs that proof; in any turn, "checked automatically" must name files a check that runs on its own covers. v2 asks for no "Proven:" line: the runs prove it. A file the turn first edited (not wrote) counts as already there. The improvement-loop item "a status report never ends the work" is now a judgment item: its word marker passed any answer saying "next".
- 2026-11-09 (the v2 sweep): reverted "a turn's own command-written files make it a work turn" from 671f92a: it held 24 passing old scenarios whose fixtures change files with no edit call. The 3 gui-review-report tests it closed are back on the list, with an open triage row; the answer read in English and the gui verdict marker stay. A notes-vault test the runEach port fixed comes off. Old-suite list 432 -> 434.
- 2026-11-09 (the old suite under v2, harm 3: claim-checked, helpers' verdicts): in a session where helpers worked (this turn or earlier), v2 holds "the other 21 passed" unless the answer says who judged them or the turn's own run passed with nothing failing or missing; a description of the check is no claim. The check moved to claims.mjs for both engines. Shared-module ceiling during the move: 1,100 lines (code moved out of hooks.mjs lands there). Old-suite list 434 -> 432.
- 2026-11-09 (a peer's live false hold): a sentence describing a claim or a check ("an answer that says a test was done by hand", "the check holds...") is no claim, in both engines: the hand-test claim needs the first person or a result label about this turn's work, and the reported-to-the-starter and only-makes-projects-better claims skip descriptions too (claims.mjs describesClaim).
- 2026-11-09 (the old suite under v2, harm 3: claim-checked, by hand): v2 holds an answer that says a test was done by hand ("tested by hand", "lo probé a mano"): it says how it ran, or that it is for the user to try; data "written by hand" and asking the user are not held. The check and its sentence splitter moved to claims.mjs for both engines. Old-suite list 436 -> 434.
- 2026-11-09 (the old suite under v2, harm 3: claim-checked): v2 holds "reported to the starter's makers" when no report was sent this turn (node tools/starter.mjs report, or a message to the starter's session), and, in the starter, "only makes projects better" with no judged trial round printing NOT WORSE; both patterns moved to claims.mjs for both engines. Old-suite list 438 -> 436.
- 2026-11-09 (the old suite under v2, harm 3: claim-checked, verification): a turn that waived its own test or build gate and says the work ships or passes is held until it says one "NOT VERIFIED: <what> - <how to verify>" line, as the old engine did; a condition ("until the tests pass") and claims about the hook self-tests are not held. Old-suite list 440 -> 438.
- 2026-11-09 (the old suite under v2, harm 3: claim-checked, git): v2's end check holds an answer that says git holds no earlier version ("nothing is committed", "not in git") while git has commits, or has the file it names; the check moved to claims.mjs for both engines. Old-suite list 442 -> 440.
- 2026-11-09 (the old suite under v2: modular-code, vault-backlinks): v2 reads "runEach": the end check runs a validator on each changed file that matches and names a failing run, so the modularity and backlink checks are enforced; it runs only a command the engine ships (engine-checks.json), never one a project file adds or rewrites. Every key the engine's checks use is now read by v2 (the audit's to-port list is empty). Old-suite list 443 -> 442.
- 2026-11-09 (the old suite under v2, harm 3: gui-review-report): a turn whose own command or helper changed project files is work for v2's runbook items, not only one with edit-tool calls (a page changed and screenshotted by commands was never held to its verdict line); an answer marker is met by an answer in the user's language read with its labels in English; the gui runbook's verdict marker takes a bold label and one round. Old-suite list 446 -> 443.
- 2026-11-09 (the old suite under v2, harm 3: research-cited): a held check that uses citations says why, in its own message, as the old engine's details file did: the marker with no source line, the link nothing opened this turn, a file the turn wrote itself (citeWhy). Old-suite list 448 -> 446.
- 2026-11-09 (a project's field note): when the linked starter copy's refs show it up to date, the upgrade asks its upstream once (git ls-remote, 10 s, no fetch; silent offline), so a copy with stale refs is reported as behind with "node tools/starter.mjs update" instead of a quiet "nothing changed" (repo.mjs behindUpstream).
- 2026-11-09 (a project's upgrade report): the check converter's "pack check(s) this project set" counts only pack checks the engine does not ship, as own-checks does (it counted every pack row the install copied: 32 where the project had set 2).
- 2026-11-09 (the old suite under v2, harm 3: data-computed): v2 reads "answerFiguresComputed" (every figure in the answer printed or read this turn, or following from its other figures; a named script ran; worked sums add up), with the problems named in the message; the logic moved to knowledge.mjs for both engines. Both engines: a number followed by a comma ("692, up 213") is read as a number, so a change worked out from it is no longer named as coming from nowhere. Shared-module ceiling during the move: 900 lines. Old-suite list 451 -> 448.
- 2026-11-09 (the old suite under v2, harm 3: knowledge-source-trigger): v2 reads the knowledge pack's "knowledgeFromFiles" condition (each fact written into the knowledge files labeled, dated and sourced from a project file that exists), so that row is enforced; before, v2 skipped it as an unknown key. The logic moved to tools/hooks/knowledge.mjs, shared by both engines (a new engine file: on the install, proof and copy lists). Shared-module ceiling during the move: 800 lines. Old-suite list 455 -> 451.
- 2026-11-09 (the old suite under v2, harm 3: answer-language): a Spanish request's reminder lists the Spanish labels every answer may use, and a held Spanish turn is told the Spanish labels of what it is held to, as the old engine did (one list, now in labels.mjs for both engines). The old suite reads v2's JSON reminder decoded, so expected text with quotes is found. Old-suite list 457 -> 455.
- 2026-11-09 (the old suite under v2, harm 3: debug-trigger): v2's shared "ranFailing" condition judges a failed run as the old engine does: a failure line in the output counts like an error exit, a missing tool does not, and it counts when the turn found it (no edit before the run) or the request reports a problem, not when the turn's own edits caused it mid-work or in the setup turn. The failure and problem patterns moved to base-checks.mjs for both engines. Size ceilings during the move: end check 3,200 lines, all of it 4,800 (the speed tests are the hard limit; both come down to the measured size when the move ends). Old-suite list 460 -> 457.
- 2026-11-09 (a peer's review): the turn-start snapshot records when it ended, and says nothing about a file last written while it ran (that write may be in it); it is skipped past 2,000 uncommitted files or 5 s, and snapshots over a day old are removed. It narrows only "(when file: ...)" items: the safety checks still see every file changed since the turn began.
- 2026-11-09 (a peer's review of the touched-file fix): a new turn notes its uncommitted files' git hashes in the background (a detached process the prompt hook starts; git repos only), so a file already changed before the turn and only touched during it meets no "(when file: ...)" marker either. A commit in the turn's first second counts as the turn's (git keeps whole seconds).
- 2026-11-09 (a project's upgrade report: its upgrade's bench read stop 155 -> 207 ms): v2 reads the project config once per state of its files instead of in every check (about 15 reads, 11 ms per Stop). Bench (hooks.mjs bench, 4 rounds, ms) against that project's previous engine 65c2856: prompt 96-106 -> 78-91, pretool 76-83 -> 63-66, stop 151-173 -> 132-157.
- 2026-11-09 (a project's upgrade report): v2's "(when file: ...)" marker no longer counts a file that was only touched this turn: its time moved, but its content is git's last commit, made before the turn (a test that touches its own files, run by the upgrade, held the turn to run that test again). A file whose content changed, or that was edited and committed this turn, still counts; outside git nothing changes.
- 2026-11-09 (a project's upgrade report): the check converter's count line compared checks as objects, so every check counted as both "already there" and "to convert"; it now compares by tag, and the two add up to the project's own checks.
- 2026-11-09 (a project's upgrade report: prompt 131 -> 160 ms, pretool 86 -> 96 ms): the Spanish routing patterns are built on first use instead of at load, in both engines' code; compiling them took about 15 ms of every hook run. Measured on one machine, fastest of 15 side by side: prompt 106 ms (old engine) and 114 ms (before) -> 81 ms, pretool 90 and 87 ms -> 68 ms. The v2 selftest times the prompt and pretool hooks against a bare node start, and checks the patterns are not built at load.
- 2026-11-09 (a project's upgrade report): the upgrade's check converter now names the pack checks a project set (such as its app test gate), kept as they are and run as approved self-runs, so its count of own checks matches `hooks.mjs own-checks`, which lists those too.
- 2026-11-09 (the old suite under v2, harm 3: claim-checked, narrow form): v2's end check holds an answer that says a git push or commit happened when the last one this turn was refused or failed (refused by the guard or host, exited with an error, or git printed "fatal:", "error:" or "rejected"), unless the answer says plainly it did not happen or a later run worked. Git counts only when run as a command, never as words in a here-document or quoted text. Under v2 the old suite gives scenarios using the shared Finished line the file it names, dated before the turn.
- 2026-11-09 (the old suite under v2, harm 2: upset-acknowledged): an Issue line the agent wrote in its own text, not the notes file, starts v2's complaint checks too (the note check already asks to move it into the notes); the old engine's copying of it during work stays retired under quiet work.
- 2026-11-09 (the old suite under v2, harm 2: upset-learned): once the agent wrote an Issue line, v2's end check asks for the verdict and the lesson even on a turn that changed nothing, so an apology with no fix and no verdict is held (opening the skill alone, on a turn of no work, still owes nothing). The old suite's complaint scenarios record the agent's Issue line under v2 ("issue: true"), as the old engine read the complaint from the prompt.
- 2026-11-09 (the old suite under v2, harm 2: bg-moved): v2 judges a command run in the background, or moved there after its time limit, by its output file once its completion notice arrives: the file's text joins the run's output and a non-zero exit code fails it, so a gate or a "Done when" (ran: ... => pass) line reads the real result (before, only the line saying where the output went was read).
- 2026-11-09 (the old suite under v2, harm 2: notice-answer): in a headless run, v2's end check holds, once, a reply to a background notice or a fired wakeup that came after the turn's answer, unless it carries that answer again (the caller gets only the last message). The earlier answer is read from the transcript, with no state kept. Interactive sessions are not held.
- 2026-11-09 (the old suite under v2, harm 2: headless-resume): in a headless run (claude -p or the SDK), v2's end check no longer waits silently while a helper it resumed with SendMessage still runs (the run ends with its answer and the helper's work is lost): it holds the turn, naming the agent, and asks for the rest of the work done here or in a new helper the turn waits for. Interactive sessions still wait.
- 2026-11-09 (a peer session, live): a message relayed from another session, a helper or a task notice gets no "This sounds upset" line in v2's reminder, and its words set no standing-rule route (a report quoting a capital "NEVER" read as upset); typed by the user, the same words still do.
- 2026-11-09 (the old suite under v2, harm 2: route-precision, status-first, question-answered): in a project, a message that names the starter (docs/names.json STARTER_NAME, unless it is the project's own subject) gets the project runbook in v2's reminder, whatever generic word a domain runbook shares with it. A message to pass on to another session or agent ("tell the other session ...", "dile a la otra sesión ...") gets no runbook, unless it opens with a standing-rule cue or also asks for work here. The patterns live in tools/hooks/relay.mjs, shared by both engines. The old suite counts v2's "Runbook: open" lines where it counted ROUTE lines, and its status and mid-turn question reminders are checked in v2's wording.
- 2026-11-09 (the old suite under v2, harm 2: caps-weight): v2's reminder reads capitals as the old engine does: a message mostly in capitals, or a run of 3 or more capital words or a word like AGAIN inside one, is upset only with a sign of trouble, never for eager capitals ("GO ALL OUT") or acronyms; a capital NEVER or ALWAYS routes the reminder to the project runbook as a standing rule; "do you ever think ..." reads as upset. The capitals rules now live in tools/hooks/caps.mjs, shared by both engines.
- 2026-11-09 (the old suite under v2, harm 2: watched-inputs, decision-logged, owned folders, setup dry run): v2's end check names a file matching "watchedInputs" that changed during the turn without the turn writing it, until the answer names it and what the new data changed. The knowledge pack's deliverable runbook gains a "Done when" line: a choice the user made is logged in docs/DECISIONS.md. A runbook opened this turn owns the folders in its "owns:" frontmatter, so another runbook's trigger (such as ingest for sources/) does not count files there. In setup, a runbook only opened for the dry run is not followed unless the answer names it as followed. The old suite's stop scenarios no longer give a synthetic write to a file whose time the scenario sets, and a step that throws in the engine-in-.anzuelo upgrade test fails that test, not the whole suite.
- 2026-11-09 (the old suite under v2, harm 2: prompt-visible): under v2, the line a passing work turn shows names a runbook the turn wrote new as "🌱 new runbook made: <file>", never as one it pulled up and followed.
- 2026-11-09 (the old suite under v2, harm 2: pause-stops, version-bump): under v2, a request to pause, stop or restart (typed first or mid-turn) gets the wrap-up reminder, keeping the upset line when it sounds upset, and the end check asks nothing more that turn; the pattern now lives in tools/hooks/pause.mjs, shared by both engines. The version-bump check counts a version raised in an earlier turn of the session when nothing was released since (no tag, release or publish), as the old engine did.
- 2026-11-09 (the old suite under v2, harm 2: question-no-file): v2's end check holds a turn whose every typed message only asks (the request and any typed mid-turn) and that changed files outside "questionNoFileExempt", until the changes are undone or the answer quotes the words that asked for them ("Asked for: "..."") (rule 5). With "autonomy": "auto", "what should we do?" asks for the fix; news typed first with a question queued after it is no question.
- 2026-11-09 (the old suite under v2, harm 2: empty-answer): v2's end check holds a turn that changed files and ended with an empty answer, asking for what was done and what is left, then the Finished section.
- 2026-11-09 (the old suite under v2): under v2 the old suite's stop scenarios give each fixture file the edit call that wrote it (v2 counts a file as the turn's work only when a call of the turn wrote it), except files git ignores, files already there with the same content, and files set to before the turn; tests whose work was only fixture files no longer read as turns that changed nothing.
- 2026-11-09 (the old suite under v2, harm 2: image): a message sent with an image or file and text is a request under v2: it starts the turn, and its text is heard by every check that reads the user's words (before, only plain-text messages were, so a request with a screenshot started no turn). A row of tool results is still never a request.
- 2026-11-09 (the old suite under v2, harm 2: upset-acknowledged): after a complaint that held, with an Issue line written, v2's end check also asks that the runbook the Issue line names was opened this turn, that the answer gives the point in general terms with every case it covers, and the root cause of the miss (in plain words or as "Scope:" / "Root cause:"; no done or skipped record lines). A shouted rule request owes no scope or root cause.
- 2026-11-09 (a peer's review: idle waits): `tools/starter/v2-sweep.mjs` runs the old suite on a frozen copy of the folder as it is (a detached worktree under ~/.anzuelo-frozen holding the uncommitted and new files, wired), so engine edits in the main folder go on while it runs; inside a frozen copy, such as the release chain's, it runs in place (`--here` forces that). Each copy is removed when its run ends, pass or fail, and only the last failed run's copy is kept for debugging. The improvement-loop runbook says so, and that each chain's copy goes once its proof is pushed.
- 2026-11-09 (the old suite under v2, harm 2: rule-request): v2's end check holds a turn where the agent took on a standing rule (it opened the project-rule skill, ran `hooks.mjs rule`, or its notes or answer record one, "Rule: ..." or "rule added") until the rule is in AGENTS.md with its dated row in docs/checks/user-requirements.md, the answer says how it is enforced (a test counts only when a check runs it), and, with "memoryOnRuleRequest", a memory note is saved. It never starts from "always", "never" or "from now on" in the prompt; "Rule: none - <why>" owes nothing. The reminder now names the project runbook for a rule said as an order ("never <do X> again", "de ahora en adelante ...", "nunca más ..."), and not for an apology or "always" in passing. Old-suite stop scenarios can carry v2 setup, as prompt scenarios could.
- 2026-11-09 (a peer session's live false hold): with two sessions in one folder, a file changed while this turn's shell command ran counts as this turn's work (the Finished section, the changelog and the other work items) unless every part of that command is a known reader (git log/status/diff, cat, grep, ls and the like, or a script reading a session transcript) with no redirect; an unknown command counts as writing. A `git log`, a search or a transcript reader running while the other session edits no longer gets this turn held. The safety checks (forbidden names, code rules, planted instructions, copied user words, security-sensitive code) read every file changed since the turn began, whatever wrote it, and a new end-check scan names a file a command wrote that now holds something that looks like a secret (the guard saw only the edit tools and staged changes).
- 2026-11-09 (a peer's review): the upset-learned check starts only on the agent's own judgment, an Issue line it wrote this turn or the learn-from-upset skill it opened, never on words in the user's message (keyword-forced handling was retired on 2026-11-07); "Issue: none - <why>" owes nothing, and "upset again" is an Issue line the agent wrote in an earlier turn of the session.
- 2026-11-09 (the old suite under v2, harm 2: upset-learned): v2's end check holds a turn after a complaint that changed files until the answer says whether the complaint held (owning the miss in plain words counts; "Checked: <what> - <what it showed>" too) and, when it fully held, what was checked; the lesson is written where it stops the next miss (a skill, runbook, rule, check, test or memory note changed this turn); a complaint about the engine itself, in a project, goes to the starter; and upset again in the session needs a plan in docs/plans/ and a sweep of the real data. A complaint shown not to hold, a calm request, a shouted new rule (for the plan and the verdict), a relayed message and a resumed session's summary owe none of it. Replayed on two real projects' sessions before shipping: the false asks found there (relayed reports, summaries, rule requests, "you were right", the user's own project hooks read as the engine) are fixed and each has a test.
- 2026-11-09 (a peer's security review of the self-run): the end check runs a self-test only when its exact command is on the user's approved list, `tools/hooks/config.json` "selfCommands"; any other is not run, and its check asks the agent to run it as before. Only the user adds to the list: `node tools/hooks/hooks.mjs self-allow "<command>"` (a dated line goes in docs/DECISIONS.md). The guard refuses the agent's run of it, an edit or write of the config that adds a command (judged on the parsed file), and a shell write that names the list. Only the list as it stood in the last commit made before the session began counts, so an edit, a script or a commit made during the session approves nothing until the next session. An upgrade keeps what worked with no step for the user: its `node tools/always.mjs convert` puts every self-run the last commit held (a requirements.json `selfRun` with `selfAuto`, a pack check's own version included, or an always.md `(self: ...)`) on the list, each with a dated DECISIONS line, and the upgrade's commit makes them count from the next session. Review: tools/starter/reviews/security-2026-11-09-self-run.md.
- 2026-11-09 (a profile on a real project's clone, a peer's review): v2's end check runs a project's own declared self-test that the turn needed and never ran: a `requirements.json` toolPassed with `selfRun` and `selfAuto: true` (any tag, a pack check's project override included) whose condition holds, or an always.md item with `(self: <command>)`. It runs once, only in the real end check (never in a draft preview), and its output is judged like the agent's own run; a failure is named with its last lines. Before, a project's own app-test-pass with a self-run never ran under v2, because v2 replaced that check with its own. `node tools/always.mjs convert` now keeps a self-run as `(self: <command>)`.
- 2026-11-08 (the old suite under v2, the last open regression): v2 holds the upgrade review as the old engine did: each item of the latest "## Upgrade review" in docs/DECISIONS.md decided with its reason ("later" needs "later - when: <moment>"), an adopted pack, skill or rule really in; only on a work turn about the project itself, at most once a day, never on the user's own work. It runs inside the project health check, so the end check stays at 15 checks. All 8 known open regressions are off the v2 list.
- 2026-11-08 (the old suite under v2, open regressions): v2's end check counts a draft that passed `hooks.mjs check --answer-file` for what the answer must say, so a sent answer that rewords it is not held for a label (what it must not say is still judged on the answer sent). A check shipped off (`"enabled": false`, such as the version bump) stays off under v2, as under the old engine; before, every project with the app pack was asked to raise its version. `npm --prefix <the project>` (and `pnpm -C`, `yarn --cwd`) counts as the project's own test run, one at a subfolder as another package's. A test run that failed for a missing module after a refused install is not asked for again. A run whose time is unknown is not taken as coming before the last code change.
- 2026-11-08 (the old suite under v2, open regressions): v2 routes a request to change a runbook itself ("fix the <name> playbook so ...", "arregla el playbook de <name>") to the project runbook, not to that runbook's own job; "with" or "follow" the runbook still uses it. A Spanish request routes by the better of its Spanish and English wording, so a rule cue that leads the sentence ("de ahora en adelante") is no longer hidden by a trigger found mid-sentence. v2's Stop logs each decision (round, result, steps, request start) to the capped log `hooks.mjs last` reads; before, it logged none. Old-suite prompt scenarios can state their v2 expectations in v2's wording.
- 2026-11-08 (a peer's review of the push fix): the starter's pre-push check reads the proof inside each pushed commit, not a record of the last run on this machine. A whole passing run on a clean checkout writes the commit it tested into `tools/hooks/engine-proof.json`; a push goes only for that commit or one differing from it only in the release records (proof, status, changelog, trial log). No proof naming a commit, or an engine change since, is refused, whatever engine ran last. Replays read session transcripts line by line through the new `tools/hooks/jsonl.mjs` (the efficiency-review skill keeps its own copy, so it stays standalone), so no session is skipped for its size; an 833 MB one was. The push OK check reads the whole session the same way, not its last 64 MB. The engine proof's hash now covers every module the hooks import (paths, settings, repo, people, labels, base-checks, wakeups, injection, claims, jsonl, statusline), so a change to one no longer reuses an old pass.
- 2026-11-08 (a push that took four rounds, the user): a push now goes after the user's "yes" to the agent's own push question, or a standing OK earlier in the session ("you have permission to push whenever"), not only after a request that names the branch; a "yes" to another question still does not count. The starter's own pre-push check no longer fails on a stale record: only an old-engine selfcheck run writes the record it reads, so a v2 sweep run in between no longer overwrites it. Replayed on real sessions: 6 real pushes refused before, all 6 with an OK on record now.
- 2026-11-08 (the starter's tooling held for a security review, a peer's review): the security check's ignore list now covers `tools/starter/**` and `tools/always.mjs`, the starter's own release and test tooling (fixed commands, no outside input); a turn that changed a test-runner script was held three rounds for a review.
- 2026-11-08 (an install held for a security review, the user): the security check no longer reads generated skill mirrors (.claude/skills, .agents/skills) or .anzuelo/engine: an install copies the engine's own skill scripts there, and the turn was held three rounds for them.
- 2026-11-08 (starting a project from a plain clone, the user): `git clone` inside a new project's folder makes a subfolder named after the repository; `new-project.mjs --self-install` now takes its parent as the project, installs the engine into the parent's `.anzuelo` (keeping the folder's own files) and removes the clone, where it used to stop and the agent asked where the project should go.
- 2026-11-08 (refused runs, from the v2 re-sweep): a test or build run the host refused (it needs an approval, or it was denied) never ran, so it is no failing run under v2, and no root cause is asked for it.
- 2026-11-08 (skills only read, from the v2 re-sweep): a skill read counts as used, except during setup or in a turn that read 3 or more skills; then only when the answer names it ("Skill: x") or one of its scripts ran (setup was held to a letter skill's draft; a dictated note to the research skill's sources).
- 2026-11-08 (a check that crashes, a peer's review): each of v2's end checks runs on its own: one that throws is named once, "A check crashed (<name>): <error>, <file:line>", counts as passed and is dropped on a repeat round, and the others still run (before, one crash took the whole end check down).
- 2026-11-08 (declared self-tests under v2, harm 2): a check's gate passes by the output a command sent to a file this turn ("> log", "| tee log"; an older log is an older run), and a project's declared self-test the turn never ran (toolPassed selfRun with selfAuto) is run by the end check once, within two minutes, and judged on its output; the audit is left to the health check, which runs it.
- 2026-11-08 (v2 parity, round 2, from the re-sweep): a check counting calls "running at once" (toolCount overlap) counts each from its call to its result, or to the turn's end in the background, so helpers run one after another are no parallel work; a background helper whose launch printed no id runs until a notice comes after it, and the end check waits for it.
- 2026-11-08 (made-up commit ids, round 3, a peer's live false hold): placeholder ids (abc1234, abcdef0, 1234567, 0000000, deadbeef, cafebabe) and ids in quotes or backticks given as an example ("like", "e.g.", "such as") are no claims, for the guard and the end check alike; the id rules moved to `tools/hooks/claims.mjs`, read by both.
- 2026-11-08 (made-up commit ids, round 2): the guard judges only ids in commit context ("commit", "pushed", "HEAD", "main is", "in", a git-log line), never one after "#", in a path, or after "sha256"/"hash": a citation anchor, a color, a content hash, a GUID or a hex-looking word is never refused. The end check keeps its wider rule, since it only asks.
- 2026-11-08 (made-up commit ids, a peer's report of a repeat miss): v2's guard refuses a message to another session that names a commit the repository does not have and that no tool output or received message showed, before it goes; the end check no longer takes a sent message as evidence for a commit the answer names.
- 2026-11-08 (v2 evaluator parity, from the re-sweep): an answer naming the project file or web page it took its facts from, opened this turn, meets the cite checks (answerCites, the old engine's rule); a condition with a part v2 can't read yet is not judged, unless another branch holds (answers that cited their files were held); a small fix (3 files, 40 lines) skips the feature ceremony checks under v2 too (changelog, STATUS, spec and the like). The release chain now runs the old suite under v2 against tools/starter/reviews/v2-failing.txt (614 names, those that also failed at 496355d): a new v2 failure, or a listed test that passes, fails the chain.
- 2026-11-08 (false holds found by the v2 re-sweep, and a peer's live report): a turn is held only for files that changed while one of its own commands or helpers ran (another session's edits in the same folder are never its work); what a check requires is met by any file written since the turn began, even after a turn of reads (22 turns were held for a security report on disk); Skill counts as a possible writer, messages do not; a step waived with `hooks.mjs waive` counts by the confirmation it printed.
- 2026-11-08 (question first, under v2, harm 2): the reminder tells the agent to answer a question first, in plain words; one typed while a turn runs is answered in the very next message and gets no runbook of its own; a request phrased "can you ...?" with a change word is no question.
- 2026-11-08 (waiver tally under v2, harm 1): v2's end check records each check a turn clears with a reason ("doesn't fit", "not done, because"), in the same tools/hooks/state/waivers.json the old engine kept; a check cleared in 3 or more earlier turns is named in the next block that lists it, asking the agent to tell the user so the check gets fixed instead of skipped.
- 2026-11-08 (globs, v2): the guard's approved-list paths read "**/" as any number of folders, none included, like the end check's and the old engine's ("old/**" covered one level, "**/*.bak" no file at the root; both refused an approved cleanup); one test checks every v2 glob converter on root and nested files.
- 2026-11-08 (copied words under v2, harm 1): v2's end check holds files changed this turn that copy a run of the user's own words, or a rule, runbook, check, skill or test that names something from the user's messages, with the old engine's exceptions (the project's description in its brief, required wordings, templates, text the file had at the last commit). Also, a file at the project root that a command wrote now counts as changed (v2's "**/" matched only inside a folder).
- 2026-11-08 (Stop speed, a field report from an upgrade): v2's end check walks and dates the project's files once per turn for all its checks, and not at all on a turn whose calls can't write (reads, searches, questions). Before, each check walked and dated the whole tree again, and an upgrade read Stop 74 ms slower in a large project. Read-only profile there, fastest of 5: 130 ms before that upgrade, 220 ms after it, 102 ms now. A v2 test fails if a question turn walks files or its end check passes 60 ms in a 3,000-file project.
- 2026-11-08 (always list, round 5, a field report from an upgrade): `tools/always.mjs convert` (run by every upgrade) now rewrites "runbook or skill used" markers an older convert wrote in the edit-or-read form to the read form, once, so projects converted before round 4 need no hand edits; and it prints how many of the project's own checks were already there (in always.md, in a runbook) and how many it converted.
- 2026-11-08 (injection under v2, harm 1): v2's end check holds a kept file (docs, skills, profiles, the rule files) left holding text aimed at an AI or invisible characters, and a turn that read such text from outside the project's own rules and tools without warning the user in the answer. The patterns moved to `tools/hooks/injection.mjs`, read by both engines.
- 2026-11-08 (code rules under v2, harm 1): v2's end check holds a turn whose changed files break one of the project's code rules (config `codeRules`, from packs and setup), naming the file and line; test files are skipped unless the rule says `"tests": true` or gives its own `ignore`.
- 2026-11-08 (release checks, both engines): release-ready and release-rollback (app pack) hold on a release action (a tag, gh release, a publish or deploy), or when the release runbook was opened for a request that asks for a release; opening it to read it, or for a question, holds nothing. Projects with the app pack pick it up on upgrade.
- 2026-11-08 (routed means opened, under v2): a check's `playbookRouted` now means the agent opened that runbook this turn (keyword routing is retired, 2026-11-07); the audit fails a check routed by its runbook alone with no action key (toolRan, filesChanged, ...).
- 2026-11-08 (forbidden names written by a command, under v2, harm 1): v2's end check now holds a turn whose commands wrote a name the user asked to keep out of the project into a file (the guard sees only the edit tools), naming the file and the name; a name the file had at git's last commit, ignored files and the engine's own state don't count. It reads the project's own config and private list.
- 2026-11-08 (wakeups left behind, under v2, harm 1): v2's end check now holds a turn that leaves a wakeup or scheduled job pending once its work is done (ScheduleWakeup, CronCreate, any later tool that sends a prompt back), unless it was cancelled or the answer says what it will do; in a headless run saying so is not enough, unless the request asked for a reminder or a schedule. The wakeup helpers moved to `tools/hooks/wakeups.mjs`, read by both engines.
- 2026-11-08 (built-in checks under v2, harm 1): the engine's built-in checks (installs vetted, the Finished section, a changelog line, a redo that changes something, self-improvement) now live in `tools/hooks/base-checks.mjs`, read by both engines, and v2's end check evaluates them with the same evaluator as requirements.json (a project's entry with the same tag replaces the built-in one; `disabled` turns one off). A built-in check whose condition is only the user's words never holds (decision-logged and praise-captured, retired 2026-11-07). The evaluator also reads `minToolCalls`, and "a command ran" ignores quoted text with a space (a recorded reason that names an install is not one; `bash -c "..."` still runs).
- 2026-11-08 (engine checks under v2, round 2): an engine check whose condition is only the user's words never holds a turn (keyword forcing, retired 2026-11-07), and the audit fails on one that is not retired with its date. The evaluator reads more keys (a failed run, N helpers and a look at what they made, a file read, a routed runbook, a screen file changed, added content); the audit fails on any check using a key it does not read, but for the listed ones still to port (`V2_KEYS_TO_PORT` in tools/audit.mjs, which may only shrink). Test: "end: an engine check never holds on the prompt's words alone ...".
- 2026-11-08 (engine checks under v2, harm 1): v2's end check now evaluates the engine's own checks in requirements.json (the engine-checks.json tags) with one evaluator, as rows of one table: skill and runbook used (read), files changed, answer, prompt, command run or passed, work turn, any-of; an unknown key skips the check, never blocks. An answer in the user's language is read with the English labels copied in (the label table moved to `tools/hooks/labels.mjs`, shared by both engines). Security-sensitive code: the message names the file and the words that set it off, a file changed another way counts by what it gained, only opening the review is no review (its result given, logged or written counts), and a specific "does not apply: <reason>" line or a headless `N/A(<tag>): <reason>` in .cache/turn-notes.md clears it. Of the old suite's security tests, 62 of 63 pass under v2 (the last is another behavior), 22 fewer than before; they fail again with the ports off. Test: "end: engine checks from requirements.json hold ...".
- 2026-11-08 (people kept apart, round 2, from the old suite run under v2): the setup exception now matches the old engine's (a setup prompt in a project, not the starter's template, or one this turn removed: a template copy skipped every check), and a person's files changed since the turn began count however they changed. The old suite recognizes a ported behavior by what its v2 message asks (`V2_ASKS`), keeping each scenario and verdict; the old tests of the two ports pass under v2 and fail with the port switched off.
- 2026-11-08 (always list, round 4, two field reports): a converted "runbook or skill used" condition now means read (`(when tool: ^Read\b.*playbooks[\\/]+<name>\.md)`): an upgrade turn that only edited the runbook was held to its answer checks, and the old pattern never matched a Windows path in the tool input. A `<!-- req: <tag> -->` on a runbook item counts as converted (the audit called a check moved by hand missing). "Items 8 and 9 of docs/checks/always.md don't fit: <why>" clears those items only ("don't" was not read, and naming the list would have cleared all of it). The trial now upgrades a sample project with its own saved checks, plain, every release. Tests: "always: a converted \"runbook used\" condition holds when the runbook was read ...", "always: a check tagged on a runbook item ...", "end: \"items 8 and 9 of docs/checks/always.md don't fit ...", the trial's "a plain upgrade moves the project's own saved checks ...".
- 2026-11-08 (always list, round 3, a field report from an upgrade): the upgrade runs `tools/always.mjs convert` itself before its after-check, so a project's own checks never roll the upgrade back (the after-check asked for a convert only the upgrade brings); one it cannot convert is a finding for the review, not a regression. A check a runbook's "Done when" already says with the same marker is not written twice; a converted message keeps its brackets. The same engine line on the same day goes into docs/DECISIONS.md once (three refused upgrades wrote three). Tests: "upgrade: the project's own requirements.json checks move into docs/checks/always.md during the upgrade ...", "engine-change: ... a repeated rollback the same day only once".
- 2026-11-08 (people kept apart under v2, harm 1): the end check holds a turn that changed files of someone the request is not about, or whose answer about one person brings in another's details (a line saying why they belong clears it); a follow-up that names nobody is about the person the last request named. The people helpers moved to `tools/hooks/people.mjs`, shared by both engines. A v2 test now fails when hooks.mjs calls a base-module function it does not import (a moved `localDate` had broken the "last" command). Tests: "end: another person's files changed ... (scope-separate)", "base: every function hooks.mjs still calls from a base module is imported there".
- 2026-11-08 (always list, round 2, from a replay of two projects' own checks): `(ran: <cmd> => <output>)` also needs the run to print that line, read from the file its output went to as well; a work-turn condition, a "not this" pattern, a test's pass line and a bracket inside a character class now convert and read back exactly (markers hold three levels of brackets); a marker whose regex does not compile is skipped, never a crash of the end check. All 12 own checks of the two projects replayed convert. Not ported yet: the old engine running a project's declared test itself at the end (triage, toolPassed). Tests: "always: a pass line, a work turn, ...", "end: \"(ran: cmd => line)\" needs the run to print that line ...".
- 2026-11-08 (always list): a project's own checks in `tools/hooks/requirements.json` were never read by v2. Now `docs/checks/always.md` holds the project's standing rules that belong to no single runbook; the end check reads its "Done when" every turn. New markers `(prompt: ...)` and `(tool: ...)`, several `(when ...)` conditions on one item, and `(file: a|b)`. `node tools/always.mjs convert` moves each own check there and lists any it cannot; the audit fails while one is left. The project-rule skill and the engine runbook say so. Tests: "end: the project-wide always list is checked every turn...", "always: a requirements.json check converts...".
- 2026-11-08 (approved cleanup of originals): the protected-originals guard accepts a typed approval ("do it", "yes, go ahead") for exactly the paths and actions the list it answers names: the text pasted with it, or the agent's own last message. Each path must sit in a line naming that action (a file listed to rename is not one to delete). A paste alone, an unlisted path or another action is still refused. Test: "guard: a typed approval of a listed cleanup ...". The end check's unanswered-question code moved to v2/late.mjs (it runs only at the end), keeping the guard within its line budget.
- 2026-11-08 (typed mid-task, round 3; a regression of REQ queued-messages): under v2 the end check holds a turn until a question the user typed mid-task has a text answer, and the typed message is part of the request; at the next tool calls the agent is told once, then once more after 2 further calls with no reply; the user's line says only what is true ("reached Claude mid-task", then "answered your message"), never "it answers you first". The audit now counts REQ tags in every v2 module, not only the guard. Rule 8: runs over about a minute go in the background. Tests: "stop: a question typed mid-turn holds the turn until a text answers it...", "late: an unanswered message is told once more after 2 more tool calls...".
- 2026-11-08 (not run, with why): a plain "not run yet" with its reason in the same or next sentence clears the runbook item it is about (two shared words), so a test run left for the release is not held 3 rounds. Test: "end: a plain "not run yet" with its reason clears the item it is about...".
- 2026-11-08 (quote check): the end check's "user's own words as a quote" finding judges each file as it is now, so a quote already reworded in the same turn is not named again at every re-check. Scenario: "end: the user's own words written into a file as a quote are named once; one reworded since...".

- 2026-11-08 (self-install): a clone of the starter made straight into a new project's folder installs itself: `node tools/new-project.mjs --self-install --git` (run by the agent, which the session start now tells) turns that folder into the project, with everything of the engine in its `.anzuelo` folder (the engine's own clone in `.anzuelo/engine`, what it makes for the project in `.anzuelo/local`, as `starter.mjs install` does). `--beside` makes a classic project instead, linked to a starter copy next to it (`<repository>-<project>`). A clone with changes of its own, a development copy, or a folder named as a starter copy is left alone. Scenario: "self-install: a starter clone in a project folder becomes that project...".
- 2026-11-08 (typed mid-task, round 2): each typed message is handed over once, told apart by its text as well as its time (two at the same moment are two), each session keeps its own record of what it was told, and a typed message that carries a picture is read too. Scenario: "late: two messages typed at the same time are both handed over...".

- 2026-11-08 (status bar): a message that never started a turn (a helper's "finished" notice arriving after the last reply, with no call to the model after it) no longer leaves the bar on "⏳ working" for good: it clears once the host marks the session idle or a minute passes. A long step inside a real turn still shows working.
- 2026-11-08 (v2, what the user sees): a work turn that passes the v2 end check shows its line again under Claude Code: "🚨 fixed: <the issue>" when the turn wrote an Issue line, "✅ checks passed" (with the fix rounds), the runbook it pulled up and any lesson saved. A question turn shows nothing. Before, a project on v2 lost these lines, and the engine looked switched off though it ran. The status-lines settings still hide any of them. The v2 user lines live in `tools/hooks/v2/lines.mjs`, with `V2_SHOWS`: each kind of line the old engine showed has a recorded status (still shown, retired with its reason, or still to port), and a self-test fails on a kind with none (REQ: engine-parity). Rule 16 now says an engine upgrade never quietly takes away what the user saw working.
- 2026-11-08 (typed while the agent works, `tools/hooks/v2/midturn.mjs`): a message the user types while an agent works is handed to it at its next tool call, once: answer it in a line or two first, then go on; the user sees "💬 your message reached ... it answers you first". Before, under v2, a helper worked on for minutes with the user's questions waiting. And pictures pasted into a busy helper's chat, which reach it as text only ("[Image #45]"), are named by their saved files (Claude Code keeps each as `images/<N>.png` in the session's temp folder), so it never asks for them again.
- 2026-11-08 (size budget): the v2 size test now uses the v2-only plan's budget, 2,000 lines over `tools/hooks/v2/`, `paths.mjs` and `git-guard.mjs`, in place of 1,500 over `v2/` alone.
- 2026-11-08 (upgrade, ignore list): an older release shipped bare `build/` and `dist/` lines, which also hide a folder of that name deeper down, such as a skill named build. An upgrade now anchors such a line to the top folder (`/build/`) when it hides something, and says so.
- 2026-11-08 (engine changes recorded): every engine install, move, upgrade, rollback and removal writes one dated line to the project's `docs/DECISIONS.md` ("- <date>: engine upgraded to <commit>: ..."), and the next session start shows the newest one once, so the project's agent knows its engine changed. Before, a move and its rollback left no trace, and the project's next session did not know.
- 2026-11-08 (wiring, safety): every session start and the upgrade probe check the wiring (REQ: wiring-sound). Git's hooks path must point at a folder that exists and holds the hook scripts, or commits run without the AI-credit and secret checks. Every hook and status-line command in the Claude and Codex settings must run a file that exists. A problem is told once at session start with its repair (`node tools/hooks/wire.mjs`), and in the upgrade review. `wire.mjs` repairs a hooks path at a missing folder, never points git at a folder with no hooks, moves a status line left on the old in-project path in a `.anzuelo/` project, and has `--check`. The `.anzuelo/` install now saves git's hooks path and the untracked wiring files, and uninstall puts them back, so it works as a full rollback with no git command the guard refuses. The audit counts tests in `tools/hooks/v2/selftest.mjs` too. Tests: v2 selftest "wiring: ..." and "remove (.anzuelo/): ... puts back git's hooks path and the wiring files ...".
- 2026-11-08 (leaving the engine): `starter.mjs uninstall` keeps the project's own hooks, skills and scripts working. An engine file the project's own code or hook settings use stays, with the engine files it loads, and so does an engine runbook or skill the project changed; only the engine's own hook commands are unwired (a project hook that runs `hooks.mjs jobs`, or shares a group with the engine, keeps its command). With the engine in `.anzuelo/`, `node .anzuelo/engine/tools/starter.mjs uninstall [--dry-run]` works with no link: it unwires the local settings, CLAUDE.local.md, git's hooks path and the .gitignore block, brings the project's own runbooks, skills and records back from `.anzuelo/local/`, names files that still point at `.anzuelo/`, and backs everything up. The engine runbook's removal section says step by step what to keep and how to check it. Tests: v2 selftest "remove: leaving the engine keeps what the project's own scripts and hooks use ..." and "remove (.anzuelo/): ...".
- 2026-11-08 (engine runbook): moving an established project into `.anzuelo/` now says, in the engine runbook, to list the paths the project's own code reads in `keepInProject` before the install; before, only this changelog named it, so a project's agent waited for a fix that already existed. Test: v2 selftest "the engine runbook tells a project moving into .anzuelo/ ...".
- 2026-11-08 (settings): every setting's default is now in `tools/hooks/defaults.json`, and what each one does is in `tools/hooks/SETTINGS.md`; a project still changes them in `tools/hooks/config.json`. hooks.mjs needs `defaults.json` next to it (an upgrade brings it with the rest of `tools/`). Both are in the engine list new projects and upgrades copy. Test: v2 selftest "every file hooks.mjs reads next to itself is in the engine list"; the JSON was checked equal to the old object.
- 2026-11-08 (guard module): the safety guard is now its own file, `tools/hooks/v2/guard.mjs`, loaded by the tool hook; a guard that cannot load is told to the agent once per session instead of stopping the hook. The upset-acknowledged rule no longer runs during the work (only the old engine ever set it). **Breaking for project hooks:** `pretoolDecision`, `pretoolHits`, `IN_WORK_GUARDS`, `deletesOnlyNewFiles`, `patchFiles`, `asksToChange` and the secret and outward patterns are no longer exported by hooks.mjs; import them from `tools/hooks/v2/guard.mjs` after calling its `use(hooks)`. Test: v2 selftest guard block.
- 2026-11-08 (guard): the tool hook no longer works out three rules no engine refuses during the work (em dashes, a check run again, waiting by polling) and then discards them; the end check still covers what is missing. **Breaking for project hooks:** `repeatRun`, `duplicateWork` and `pollWait` are no longer exported by hooks.mjs, and `last-write.json` is no longer written. Test: v2 selftest "rules no engine refuses during the work ... are not computed".
- 2026-11-08 (paths, engine outside the project): a project whose own code reads its runbooks, checklists or status by path keeps them in place: `"keepInProject": ["docs/playbooks", ...]` in `.anzuelo/local/config.json`. A kept runbook is read from the project, else from the engine's default, and written in the project; install respects the list. Test: paths keepInProject (v2 selftest).
- 2026-11-08 (end check): a path git ignores (a machine's own file, such as local agent settings) is no longer held as made up when it is missing here; a missing tracked path still is. Test: end, missing ignored path (v2 selftest).
- 2026-11-08 (upgrade, engine outside the project): with the engine in `.anzuelo/engine/`, `starter.mjs upgrade` (and `update`) is a git pull there plus rewiring, and never writes what the project made. `starter.mjs override <path>` copies a default runbook, skill, checklist or the rules into `.anzuelo/local/`, where it wins; an upgrade merges the default's later changes into the copy and lists any clash for the user. An edit inside `.anzuelo/engine/` is refused (REQ: engine-readonly). Scenario: engine-readonly.
- 2026-11-08 (install, engine outside the project): `node tools/starter.mjs install "<folder>" [--private yes|no]` clones the engine into `.anzuelo/engine/`, puts the files made for the project into `.anzuelo/local/` (a file the project already has is never replaced), and wires it. Setup asks once whether `.anzuelo/local/` gets a private git repository of its own (`starter.mjs local-repo yes|no`), and holds until the answer is recorded. Scenario: layout-split.
- 2026-11-08 (wiring, engine outside the project): with the engine in `.anzuelo/engine/`, `wire.mjs` puts the hooks in `.claude/settings.local.json`, brings the rules in through `CLAUDE.local.md` (`@.anzuelo/engine/AGENTS.md`, plus `.anzuelo/local/AGENTS.md` when there is one), points git at the engine's `.githooks`, and adds one block to `.gitignore`, once. A project's own `.claude/settings.json` and `CLAUDE.md` are left alone, no CLAUDE.md copy or Obsidian setting is made, and git status after wiring shows only `.gitignore`. The audit checks the wiring there. Scenario: layout-split.
- 2026-11-08 (settings guard): reading a setting followed by another command (`setting <key>; ...`) is no longer refused as a write.
- 2026-11-08 (starter development copy only): session start says to change files with Edit/Write only, never sed, a heredoc or shell redirection. Projects do not get this line.
- 2026-11-08 (audit, split layout): the audit walks folders by project names and resolves links from them, and git hygiene checks only the project's own files when the engine sits in `.anzuelo/`.
- 2026-11-08 (paths, engine outside the project): every engine tool finds its files through tools/hooks/paths.mjs. With the engine in `.anzuelo/engine/`, engine code is read there, the changelog, brief and decisions stay in the project, the engine's records and settings go to `.anzuelo/local/`, and runbooks, skills, checklists and the rules are read from the local copy first and written only there. In the starter and in projects on the current layout every path is where it was.
- 2026-11-08 (setup, upgrade): a project's own accuracy hooks are converted to the engine's markers only when its sessions show that is faster or cheaper per answer turn and checks no less; otherwise they stay.
- 2026-11-08 (app pack, feature runbook): a feature that answers people's questions from documents or data must answer only from cited sources, say "not found" instead of guessing, show disagreeing sources side by side, and run an evaluation set (expected source and answer, plus unanswerable questions) with the project's tests; method from RAGAS, ARES and SQuAD 2.0.
- 2026-11-08 (engine runbook, upgrade): an upgrade adds `(evidence)` to each of the project's runbooks that answer questions from sources and reports the counts, so the evidence check reaches the projects (no project runbook had it).
- 2026-11-08 (end check, evidence): every fact line of an answer needs a source beside it or the label inference or not found (headings and questions to the user are not fact lines); an answer from 2 or more sources on an answer runbook gets one fresh review for conflicts shown side by side and labeled inference.
- 2026-11-08 (end check, field report): a command that only reads a runbook an upgrade just rewrote no longer makes it the turn's own work, so the runbook the agent followed is the one it is held to; only a command that writes counts. The engine runbook says to run nothing else until an upgrade prints its result.
- 2026-11-08 (end check, answers): a turn counts as a question held to evidence only when its first sentence asks for facts (a question mark, a question word near the start, or research, look up, find out, compare); a session-continuation summary never does. Replay of typed questions matching the research skill's triggers in two projects: 3 held, 0 clearly false.
- 2026-11-08 (end check, misroutes): a question is held to its routed runbook only when that runbook is made for answers (it carries an `(evidence)` item), so routine and scheduled prompts on a broad route stay free; a line saying a runbook does not fit, naming it by path, file name or "the <name> runbook", clears the ask to open it and all its items.
- 2026-11-08 (end check, evidence): a new "Done when" marker, `(evidence)`, for runbooks and skills that answer from sources (the research skill has it). On a typed question it holds the answer to: something read this turn, no cited file or link that does not exist and was never read or found, quotes beside a source matching it word for word, and a source named or "not found in <sources searched>". Work turns are not held to it.
- 2026-11-08 (end check, questions): a question that its routed runbook fits must open that runbook and meet its answer items (never its file or command items); an unrouted question, and a note from another session, stay free. AGENTS.md step 0.4 says so. Replay: 13 of 13 routed no-work turns were notes from another session (now excluded), 0 typed questions held.
- 2026-11-08 (end check, routing, field report): the end check waits while a background command of the turn still runs, as it does for a helper (a server or watcher left running does not hold it off); an upgrade message that names only the version ("upgrade to <commit>", or a linked "starter copy") routes to the engine runbook. Two self-tests, each failing without its fix.
- 2026-11-07 (end check, field report): a turn that edits its own routed runbook, with an edit tool or a script, is no longer held to that runbook's items; a runbook item the answer names in one line as not fitting, by number or by the path it names, with a plain reason ("does not fit", "was not part of this request"), is cleared; "Done when" items are read from raw Windows line endings everywhere; a marker's value may hold one level of brackets, such as `(answer: build (one|two) ready)`. Six self-tests, each failing without its fix.
- 2026-11-07 (security-review skill): also picked for "make it more secure / harden / lock it down", and it says which fits: itself for a change or one area, then the security-hardening library skill for a whole app or server.
- 2026-11-07 (runbooks, skills, security): every method in the security files, core method skills, pack runbooks, the six new runbooks and the library skills was checked against primary sources (OWASP, NIST, RFCs, MDN, official tool docs, the cited papers), and each fix was confirmed by at least 2 sources before it went in; one-source fixes were left out. Main fixes: CSRF defense, session cookies and timeouts, CI pinned to a commit SHA, slowdown instead of account lockout, strict CSP, Argon2id first, plus sign-in items that were missing (new session id, server-side sign-out, MFA, reset tokens, JWT algorithm pinning); an undo recipe in write-tests and refactor that could lose staged work was replaced by one tested in scratch repositories; ORDER BY values use an allowlist; marketing claims need proof before publishing; goal-loop measures with a warm-up and at least 10 timed runs.
- 2026-11-07 (weigh, rule 16): the six runbooks added today (revise-text, summarize, write-tests, refactor, docs, git-chores) came from the user's gaps request. Gain: common requests that had no procedure now get one with a check. Cost: about 350 lines and more trigger words to keep apart, all inside packs or routed only on their own phrases. Fit: core ones for any project, the four code ones only in the app pack.
- 2026-11-07 (git-safety): a push to a protected branch the user OK'd earlier in the session, in their own typed words, runs without asking again (main and master name the same default branch; pasted and relayed text never count). The restriction stays: a push nobody OK'd is refused, and "pushOk": "request" keeps the old rule (the OK in the same message). Test: "pretool: a push to main OK'd earlier in the session counts".
- 2026-11-07 (quote check): offered, never forced: off in a project until the user turns it on ("quoteCheck": true) at setup or upgrade, after the agent analyzes the project and recommends for or against it with why (knowledge projects that must keep exact quotes: recommend no); on in the starter itself. Test: "end: the quote check is off in a project until the user turns it on".
- 2026-11-07 (reminder): a turn likely to write a lesson down (upset, or the project, learn-from-upset, runbook-create or project-rule runbook) is told inside its existing reminder line to write the lesson in general terms, not in the user's own words; other turns get nothing, and quoteCheck false turns it off with the end check. Test: "start: an upset turn gets write any lesson in general terms".
- 2026-11-07 (rule 18, setup, upgrade): checks are offered, not forced. Each optional check is named at setup (SETUP-PROMPT.md question 11) and in the upgrade that adds it, the user may turn it off in tools/hooks/config.json, and one that is on runs every time. The quote check is the first: "quoteCheck", on by default. Safety guards stay mandatory. Test: "end: with quoteCheck false the user turned the quote check off".
- 2026-11-07 (end check): a file the turn wrote that quotes six or more of the user's own typed words in a row, on a line naming the user as the source, is named once at the end, asking for the lesson in general terms (AGENTS.md rule 14). Nothing during work; pasted and relayed text, numbers, scratch and .cache files do not count; messages typed mid-turn do. Swept over 40 days of real turns: 10 flagged, all real, no false ones. Test: "end: the user's own words written into a file as a quote are named once".
- 2026-11-07 (setup, goal-loop): adding the engine to an established project opens with a one-minute overview (kept, added, small changes made) and asks at most 5 big questions, most important first; small changes are reported, not asked. The goal-loop skill, every project's self-improvement loop, is off by default and runs only when the user starts or resumes it in the current chat, never on a timer. The trial's runbook-label check accepts the file:, ran: and answer: markers, and a research-skill pointer that only existed in the starter now names the installed path.
- 2026-11-07 (improvement loop): off by default and started by events, never by a timer: a project report, the end check repeatedly sending work back in a project, an upset user, or an ask. One full chain and one trial round per batch, never per small fix (tools/starter/runbooks/improvement-loop.md).
- 2026-11-07 (engine): helpers no longer get the parent turn's runbook checklist under v2 (AGENTS.md rule 18); read-only helpers were ending every report with "N/A" evidence lines. Test: "subagent brief: under v2 a helper gets the rules line and no parent checklist".
- 2026-11-07 (audit): the starter's size warning leaves out DIRECTORY.md section 5, which only the starter has. Test: "audit size: only the starter-only section 5 is left out".
- 2026-11-07 (fixes from the run on c132371): two "Done when" items inserted mid-list in project.md renumbered the items tests cite (moved to the end; runbook-create pitfall added), and trigger words a helper dropped from project.md, efficiency-review and deliverable were restored, since tests expect them to route.
- 2026-11-07 (runbooks): four new app pack runbooks from researched practice (sources listed in each): write-tests (tests for existing code, flaky tests), refactor (behavior kept, tests before and after; refactor phrases moved from feature.md), docs (README, guides, reference, by Diataxis; only safe commands run, the old README kept), git-chores (conflicts, commit messages, undo, with the conflicted files and the branch backed up first). Each starts from a checkpoint so every change can be undone, and was read cold and fixed.
- 2026-11-07 (runbooks, skills, docs): every runbook and skill was reviewed by independent helpers and tightened: dead pointers marked as pack-only, contradictions fixed (feature.md small changes, install-update, field-report vs improvement-loop chains), measures given where a step left the choice open, triggers that sent ordinary requests to the wrong place removed, "Done when" sections with conditional markers added to runbook-create, project-rule, skill-harden, project-bootstrap and project-sweeps. AGENTS.md is 11.6k characters (was 14.7k) with every rule kept; it and README now say the end check asks up to 3 times.
- 2026-11-07 (setup): an established project gets surgery, not replacement (AGENTS.md rule 16, SETUP-PROMPT.md): its own hooks, runbooks, skills and rules are listed in a "## Adoption review" and kept, winning where they overlap; each improvement is a line marked small or big, and the big ones are the user's call (ok, no, explore). The setup gate fails until the review lists what the project has and every line is decided. Test: "adoption-review: an adopted project's setup fails with no list...".
- 2026-11-07 (runbooks): two new core runbooks. revise-text: proofread, edit, shorten, change the tone of or translate text the user already has, every fact kept, the original never overwritten, the answer saying what changed. summarize: meetings, threads, papers and documents, decisions and action items first, each claim pointing to its place in the source, quotes checked word for word.
- 2026-11-07 (skills): new core skill goal-loop: works toward a goal the user sets in measured rounds (one change, measure the real result, keep it only if it helped and the project's tests and checks still pass, else undo), until the bar is met, the round limit is reached or two rounds bring no gain. It suggests goals fitted to the project and ones any project gains from, and keeps a resumable log in docs/plans/ checked by `skills/goal-loop/scripts/goal.mjs check`. Tests: "goal-loop: the log check fails an unfilled log...", the three goal-loop routing cases.
- 2026-11-07 (engine): a skill or runbook whose "Done when" list has a marker the end check tests (file:, ran: or answer:) now counts as checked in the audit; before, only a requirements.json entry or "checks:" front matter did, against the rule that checks are markers. Test: "skills-valid, runbooks-checked: a Done when marker is a check...".
- 2026-11-07 (runbooks): improvement-loop pitfall: never tell the user they did, chose or added something without a record that shows it; look it up and say who and when.
- 2026-11-07 (engine): the draft check (`hooks.mjs check --answer-file`) on a repeat: with only the health line it now passes instead of printing an empty "Still not done" heading, and a real missing item exits 1 as on a first check (it exited 0). Test: "check preview: the health line alone passes on a first or a repeat check; a repeat's real item fails...".
- 2026-11-07 (engine): under v2 the "acknowledged" line reads the turn's start from v2's own record. Before, v2 wrote no record where that line looked, so a new session (seen in the desktop app) read the whole shared notes file and showed another session's old issue at its first tool call. Test: "pretool: a new session shows no other session's old "acknowledged" line; its own new Issue line still shows".
- 2026-11-07 (engine): a "Done when" item proven by a marker the end check tests, "(file: ...)", "(ran: ...)" or "(answer: ...)", counts as proven, as the runbook template asks; before, the audit and the done-when-labeled check called it unproven. A "(when ...)" condition alone still does not count. Tests: "done-when-labeled: items proven by markers ...", "done-when-labeled: an item with only a when condition and no proof: blocked".
- 2026-11-07 (skills): efficiency-review proves a change made the project no worse: the project's tests and full checks run before and after, and a change after which something fails that passed before is undone or fixed. Its "Done when" list checks that the full checks ran when rules, runbooks or hooks changed.
- 2026-11-07 (engine): a turn that checked its draft with `hooks.mjs check --answer-file` has seen the items to verify, so the end check no longer sends the work back just to list them again; anything really missing still sends it back. Test: "end: after a check on the draft, the real stop does not send the verify list back again; the draft check shows it".
- 2026-11-07 (engine): a fresh reviewer where it pays: the end check asks for one helper that has not seen the agent's reasoning (one for all of it, a cheaper model, a brief of under 150 words back) when the user was upset this turn, when security-sensitive work or a release is being called done, and when the chosen runbook says `review: helper` (the deliverable runbook does). A turn that already had a fresh review is not asked. Test: "end: a fresh reviewer is asked for on an upset turn, a release and a runbook with \"review: helper\"...".
- 2026-11-07 (engine): the reminder's "Done when" line says to check the draft before answering, so the first answer is already the final one and a send-back never shows the user a second version. Test: "reminder: names the runbook and its Done when list...".
- 2026-11-07 (engine): the hooks are named by kind for the user and the agent: Reminder (before the work), Guard (during it, the only kind that stops anything, one unsafe action at a time), Check (after it). AGENTS.md, the session note and a new table in HOW-TO-USE.md say so. Test: "rules: AGENTS.md, HOW-TO-USE.md and the session note name the three kinds of hook".
- 2026-11-07 (engine): the answer goes out once: on real work the agent runs `node tools/hooks/hooks.mjs check --answer-file <draft>` first, a preview that records nothing, and a block asks for a line or two on only what changed instead of the whole answer again. Test: "end: a preview on a draft records nothing...; a block asks for a short note on what changed".
- 2026-11-07 (engine): the end check also holds a turn to the checkable "Done when" items of each skill with its own route that the turn opened (its judgment items stay the skill's own), so a rule a skill carries is checked like a runbook's. Test: "end: a skill the turn opened is held to its checkable items".
- 2026-11-07 (engine): the end check makes sure the work gets done: a stop after a block re-checks what a script can check and blocks again with only what is still missing, at most 3 times per request; the last block has the agent say plainly what is not done. The verify list comes once. Before, one block let an agent that ignored it end the turn with the work undone. Replay since 2026-11-01 (turns still missing something at their end, each up to 2 more blocks): 30 of 136 requests in real sessions. Tests: "end: an agent that ignores the block gets a second naming the same item...", "end: once the missing work is done, the next stop passes".
- 2026-11-07 (engine): the end check reads the final answer the host hands over (`last_assistant_message`), as the old engine did: the transcript may not hold it yet when the Stop hook runs, and an answer that ended with its Finished section was blocked for lacking one. Test: "end: the final answer the host hands over meets an answer item the transcript does not hold yet".
- 2026-11-07 (engine): false repeat blocks removed before the repeat block ships: a repeat block reads only what the agent said after the last block, and asks for the fix or one line on why the item does not fit; in the starter its own changelog meets a docs/CHANGELOG.md item; the engine runbook's upgrade items fit a real upgrade, never a dry run; two file names joined by a slash are a pair, not a missing path. In real sessions 23 of the replayed repeat-block items were false, all of these kinds. Tests: "end: after a block, an Issue line only in the answer before it blocks no more...", "end: in the starter, its own changelog meets a docs/CHANGELOG.md item...", "engine runbook: its upgrade items fit a real upgrade and never a dry run", "end: two file names joined by a slash are a pair...".
- 2026-11-07 (engine): under v2 nothing is said during work but safety refusals: the notice about a new user message while helpers run is gone too. Test: "pretool, posttool: ... no call during work gets a notice (quiet work)".
- 2026-11-07 (rules): a project's rule is checked by a marker on a "Done when" item of its runbook (`(file: ...)`, `(ran: ...)`, `(answer: ...)`, with `(when ...)`), or by a test, never by a new requirements.json check, which the end check does not run (AGENTS.md rule 3, project-rule, runbook-create, skill-harden, learn-from-upset, the runbook template and fallback). An upgrade converts the checks the project wrote, listed by the new `node tools/hooks/hooks.mjs own-checks` (docs/playbooks/engine.md). Test: "upgrade: own-checks lists the checks the project wrote, not the ones the starter ships".
- 2026-11-07 (engine): under v2 no call during work gets a notice about a background run still going (the end check already waits for runs). In the starter's own sessions that notice came about 5 times a turn, and work is to be quiet except for safety refusals. Test: "pretool: with a background test run going, no call during work gets a notice about it (quiet work)".
- 2026-11-07 (engine): the `Issue:` line for an upset user goes in `.cache/turn-notes.md`, never in the answer (AGENTS.md rule 3, learn-from-upset), and the end check names one shown in any message of the turn. An Issue line at the top of an answer read as gibberish to the user. Test: "end: an Issue engine note in the answer is named".
- 2026-11-06 (engine): `hooks.mjs prove` counts a run as failed only on a failure count above 0, a line that starts with FAIL or "not ok", or "RESULT: FAIL". In trial round v46 a passing run's "0 FAIL" was read as a failure and took 3 prove runs. Test: the "rule and prove commands" fixture now prints "RESULT: PASS (3 PASS, 0 FAIL)" on a pass.
- 2026-11-06 (engine): the end check's source test for new knowledge accepts "user reported" (and "the user says") as a source. In trial round v46 a note labelled "(user reported, <date>)" was asked for a source, and the fix wrote "Source: the user" beside the label. Test: "end: a link, a project file or the user as the source passes, "user reported" too".

- 2026-11-06 (engine): the end check reads the app pack's `"app": { "test", "build" }` in `tools/hooks/config.json` as the project's declared commands, like the top-level `"test"` and `"build"`. In trial round v46 a Go project's test command was there, so the check named no command and asked for go test although Go is not installed. Replay: blocks unchanged in both real projects. Test: "end: the app pack's "app": { "test" } is the declared test command too".

- 2026-11-06 (engine): the reminder's Spanish line also covers "any file you point them to", not only the answer (+30 characters on Spanish requests only). In trial round v45 Spanish answers sent the user to a spec and release notes written in English. Test: "start: a Spanish request routes like its English wording and is told to answer in Spanish, files it points to too; a Spanish complaint is upset".

- 2026-11-06 (rules): AGENTS.md, Step 0 item 5 (installs): a held install stays held, "never script around the hold". In trial round v45 a setup helper wrote a script that ran the install the host had held five times, which the rule's "still run the project's own test command once" seemed to invite. Adopt by hand in each project's AGENTS.md (same sentence). Test: "rules: a held install is never scripted around".

- 2026-11-06 (engine): a routed runbook the agent never opened, while it opened another runbook, gives way to that one in the end check (its items and its verify list); with no other runbook opened, the routed one is still asked for. In trial round v45 a page request routed to a recipe runbook on a broad trigger, the agent rightly followed the feature runbook, and the check held it to the recipe items. Replay: blocks unchanged in both real projects. Test: "end: a routed runbook the agent never opened gives way to the runbook it opened; with none opened it is still asked for".

- 2026-11-06 (engine): on a turn that changed no code, an answer's test pass count that an earlier run in the session printed ("no code changed since the 81 passed") is no longer asked to be rerun; a count no run printed, or any code change, still is. In trial round v45 a true statement made the agent rerun the whole suite. Replay: blocks unchanged in both real projects. Test: "end: a pass count an earlier run in the session printed backs the claim on a turn with no code change; another count, or a code change, does not".

- 2026-11-06 (engine): the reminder's skill line also needs its trigger phrase in the request's first sentence, where the request says what it asks: everyday phrases like "find out" came up later in long scheduled instructions and named the research skill. Replay of two projects and the starter: 4 of 455 requests get the line, all 4 a fit (was 8, 7 a fit). Test: "start: with no runbook routed, a skill whose trigger phrase of two or more words fits the first sentence is named; beside a runbook, on one word, later in the request, or a generated skill, not".

- 2026-11-06 (engine): the reminder's skill line comes only when no runbook routed, and only on a trigger phrase of two or more words. Beside a runbook it was mostly noise (a one-word "compare" in a scheduled request named the research skill), and every miss alone was one word. Replay of two projects and the starter: 8 of 455 requests get the line, 7 of them a fit; routed reminders are back to 8.24 and 7.76 lines; blocks unchanged. Test: "start: with no runbook routed, a skill whose trigger phrase of two or more words fits is named; beside a runbook, on one word, or a generated skill, not".

- 2026-11-06 (engine): in a project whose engine results are reused, the engine smoke scenarios run once a day per engine stamp: a second self-test run that day (each `audit --setup` retry) runs only the project's own scenarios and checks. The smoke set runs in a base made from the engine's fixtures alone, so the project's own changes cannot change its result. In trial round v44 setups ran `audit --setup` two or three times, each redoing the 238 smoke scenarios (about 2 minutes) for a change to one of the project's own scenarios. Test: "engine-cache: a project reuses a recorded engine pass despite new notes and own scenarios, still runs those scenarios and a smoke set (once a day), and runs everything with --full or a changed engine file".

- 2026-11-06 (engine): the reminder before a request names a skill whose own triggers fit (`Skill: open skills/<name>/SKILL.md and follow it.`), alone or beside the runbook; v2 read only the runbooks, so skills like data-analysis, research and efficiency-review were never named. A runbook's generated mirror or a skill that is part of a runbook is not. The end check is unchanged. In trial round v44 "what was our best week, and what drove it?" got no reminder, and its figures were worked out by hand. Replay: 5 of 135 real requests in one project get a skill line, each a fit; reminders when routed grow from 8.24 to 8.43 lines; blocks unchanged. Test: "start: a skill whose own triggers fit is named, alone or beside a runbook; a generated skill is not".

- 2026-11-06 (engine): with a declared test command (`tools/hooks/config.json` "test"), the end check's test ask names it, and only a held or failed-to-start run of that command excuses the tests: a hand-made test command the host held no longer does. A declared command whose program is not installed here is not asked for. In trial round v44 four hand-made test commands were held while the project's own, which needed no approval, was never tried; and a project without Go was asked to run go test. Replay: blocks unchanged in both real projects. Test: "end: with a declared test command, only a held run of that command excuses the tests, the ask names it, and a command whose program is not installed is not asked for".

- 2026-11-06 (engine): when the user asked for no questions ("autonomy": "auto", or "do not ask me" in the request), the end check names any message of the turn that still asks "Questions for you": each choice is made and noted as assumed, and a step only the user can take goes under a heads-up. In trial round v44 three setups told not to ask ended a message with questions. Replay: blocks unchanged in both real projects. Test: "end: with "autonomy": "auto" or "do not ask me" in the request, any message of the turn that asks "Questions for you" is named; a heads-up is not".

- 2026-11-06 (engine): `selfcheck.mjs`, `audit.mjs` and `trial.mjs` refuse a flag they don't know: they print their usage and exit 2, running nothing; `--help` prints the usage. A mistyped flag had started a 20-minute self-check twice. Test: "tool flags: selfcheck, audit and trial refuse an unknown flag with the usage and exit 2, running nothing".

- 2026-11-06 (engine): the end check's block now asks for the same answer again, changed only where a fix changed something and with nothing about the check in it. In trial round v43 every resent answer was reworded and gained lines about the checklist that meant nothing to the user. Test: "end: a block asks for the same whole answer again, in the user's language, changed only where a fix changed it and with nothing about the check".

- 2026-11-06 (engine): a setup Branches answer the agent only assumed ("assumed - work on master directly") no longer asks to unprotect main, so the push guard stays on. The user's own answer still unprotects it. Test: "setup interview: a Branches answer marked "assumed" keeps main protected; the user's own "I work on master" still asks to unprotect it".

- 2026-11-06 (engine): a rule stated as a sentence that ends ", always" or ", never" (in Spanish ", siempre", ", nunca") now routes to the project runbook, so its rule items get checked. Replay: no change in routed requests or blocks in either real project. Test: "start: a sentence that ends ", always" (", siempre") is a standing rule request; "always" inside a question is not".

- 2026-11-06 (engine): when no runbook was routed, the end check no longer holds a turn to a runbook that the same turn wrote or edited and then read back. That runbook is the turn's work, not the procedure it chose. Replay: 82 to 77 blocks in one real project, 11 to 11 in the other. Test: "end: with none routed, a runbook the turn wrote and then read is not the one the turn is held to".

- 2026-11-06 (engine): fixes from trial round v38. Each one has a test that fails without it.
  - The letter draft check no longer fails a phrase the correspondence skill says to keep, such as a plain good wish. Test: "correspondence draft check: ... or with a good wish the skill says to keep, passes".
  - The vault link check fails a new note that links to no note, and the notes-vault skill no longer names a check that does not exist. Test: "vault backlinks: ... a new note that links to no note fails".
  - The end check no longer asks for a source for lines that only link to notes ("Related: [[note]]"), and counts only the lines an edit added. Test: "end: link lines added below a note's old text ask for no source; a new fact added the same way still does".
  - `hooks.mjs check` run by a helper judges the helper's own transcript, not the session's, so the helper's own test runs count. Test: "check: run by a helper, the manual check reads that helper's transcript; run by the session, its own".
  - `hooks.mjs prove` says to prove on a sample when the fix changed the check itself, instead of a false NOT PROVEN. Test: "rule and prove commands: ...".
  - The notes link check skips `docs/starter-feedback.md`, so an example link quoted there is not a broken link. Test: "notes link check: an example link quoted in the project's report to the starter is not a broken link".
  - A comment inside a runbook's "Done when" item is no longer shown in the reminder or the end check. Test: "start: a comment in a runbook item, one line or several, is never shown".
  - A standing rule stated plainly ("every new note links to ...") routes to the project runbook, and a complaint like "you made X without Y" gets the upset notice. A replay of two real projects' sessions on the shipped engine and on this one routes the same requests (130 and 75), with the same end-check blocks. Tests: "start: a standing rule stated plainly ... routes to the project runbook", "start: an upset message (capitals, frustration words, or "you made X without Y") ...".
  - A message from another session says "only if this message asks for work here" in its runbook line, not in a line of its own. On a replay of two real projects, routed reminders now average 661 and 663 characters (shipped engine: 633 and 623; with the separate line: 688 and 711). Test: "start: a relayed message gets its runbook only for when it asks for work, in the runbook line itself ...".
  - The publish-safety sweep in a git worktree of the starter reads the main folder's `.private-terms` (git-ignored), and in the starter with no list at all it fails instead of passing unchecked. Test: "publish-safety: a worktree of the starter reads the main folder's .private-terms ...".
  - Trial verdicts (starter only): findings in a skill's own check are counted and judged apart from the engine's, and the judges name each finding's layer. Test: "improvement-loop: a high finding in a skill's own check is counted and judged apart ...".
  - A failing project test that ran in a self-test helper process is reported as the project's, not as an engine failure to send to the starter. Test: "selfcheck: a project test is named in PROJECT_TESTS's own list, so a failure in a helper process is still the project's".
  - The status-bar tests run in one self-test helper process, not in each one, so the total no longer changes with the number of helpers. A whole run that has fewer tests than the last whole run names the tests that did not run.
  - Trial rounds (starter only) refuse a starter copy passed in TRIAL_STARTER that is not an "Engine proof" commit. Without the proof, every trial setup reruns the whole self-test and the round measures that. Test: "improvement-loop: a round refuses a starter copy that is not an "Engine proof" commit ...".
  - The end check counts the commands the session's helpers ran during the turn, so tests, project checks and screenshots a setup helper already ran are not asked for again. A replay of two real projects' sessions on the shipped engine and on this one: routing is the same, blocks go from 83 to 82 and 11 to 11, test-run asks from 6 to 3 and runbook items asked for from 92 to 86; nothing new is asked. The screenshots a helper looked at count too (trial v41). Test: "end: screenshots a helper took and looked at after the last screen change count for the session". Test: "end: a test run a helper made after the last change, in this turn, counts for the session ...".
  - A complaint about a repeated miss ("you keep putting X under Y!!", "why does it keep ...", "wrong again!!") gets the upset notice; "can you keep working on it?" does not. On the two real projects' 307 requests it matches one message, already flagged for its capitals. Test: "start: an upset message (capitals, frustration words, ... or "you keep doing X") ...".
  - The end check no longer reports a path the answer gives as an example ("for example ...") or says was filed or taken in elsewhere. A replay of two real projects asks for no missing path before or after. Test: "end: a path given as an example, or said to be filed or taken in elsewhere, asks for nothing ...".
  - The security check recognises Go web code (http.ResponseWriter, http.HandleFunc, ServeHTTP) and Go commands (exec.Command), so a Go endpoint asks for the security review. Test: "security-code: a Go web handler: fired".
  - A standing rule stated plainly ("every option has to be documented") routes to the project runbook even when a work trigger appears later in the message; a request that starts with the trigger still goes to its runbook. A replay of two real projects routes the same requests before and after (130 and 75). Test: "start: a standing rule stated plainly comes before a work trigger found mid-sentence ...".
  - The obsidian skill keeps a vault's own [[wikilinks]] style instead of saying never to use them, as the notes-vault skill says. Test: "obsidian skill: a vault that already links with [[wikilinks]] keeps its style ...".
  - Reading a skill the routed runbook hands its steps to (its own skill, or one its text names, such as learn-from-upset for a complaint) counts as opening that runbook. A turn with no runbook routed is still held only to a runbook it opened itself. A replay of two real projects gives the same blocks before and after (82 and 11). Test: "end: reading a skill the runbook hands its steps to counts as opening the runbook; another skill does not".
  - A complaint about what was let through ("you let any visitor cancel orders!") gets the upset notice, and "that should never happen again" also routes to the project runbook as a rule request. A replay of two real projects routes the same requests with the same reminders and blocks before and after. Tests: "start: an upset message ...", "start: "that should never happen again" is a standing rule request ...".
  - A new project's .gitignore ignores build/ and dist/ only at the top, so a code folder such as src/build/ stays in git. An upgrade adds the anchored lines and leaves the project's own lines as they are. Test: "new project .gitignore: build/ and dist/ at the top are ignored; a src/build/ or src/dist/ code folder is not".
  - A copy the turn made with a shell command (cp, copy, Copy-Item, as the copy's target) counts as the turn's own file, so the versioned-file guard lets the agent edit or remove it; copying the original away still opens nothing. Tests: "no-overwrite: editing a v2 copy this turn made with cp: allowed", "no-overwrite: copying chapter 2 away does not open it for edits: denied".
  - Setup no longer asks to write an always/never answer marked "assumed" (the agent's own guess while deciding alone) as the user's standing preference. Test: "setup interview: an always/never answer marked "assumed" is kept as the agent's guess ...".
  - The app pack's feature runbook caps the independent review at two rounds, with what is still open listed under "still weak", and marks each acceptance criterion PASS, FAIL or NOT VERIFIED (PASS only when a test or run this turn showed it). Test: "feature runbook: at most two review rounds ...".
  - The notes-vault link check finds a note given by its name alone ("Steeping" finds Tea/Steeping.md), and a name that is no note fails instead of passing with nothing checked. Test: "vault backlinks: ... a note given by its name alone is checked, and a name that is no note fails".
- 2026-11-05 (engine): engine v2 fixes from its first live use and trial round v32. Each one has a self-test that fails without it.
  - The background-run notice works from the session's own running jobs, not from command text.
  - Pasted text no longer routes a message or marks it as upset.
  - Another session's file changes are no longer counted as this turn's.
  - A turn started by a message from another session starts there. Before, it reached back to the last typed request, and a turn of read-only commands was held to that request's edits.
  - An answer that relays a test result this turn heard or read (another session's message, a project's report file) is not asked to run the tests itself. A summary that also counts failures still backs nothing. The replay tool splits turns the same way the live check does.
  - The end check no longer asks for tests that already passed after the last code change. The host's request copies in the transcript repeat each tool result with no time, and v2 read them, which erased when each run ended. Found in 4 trial projects (v32), in turns where a run passed after the change.
  - The full self-test times engine v2's Stop hook too, as its own test with its own line ("stop timing (engine v2, the default)"). Before, it timed only v1's, which its own tests pin.
  - An upgrade's self-test, and the setup audit's, no longer waits up to 10 minutes for other self-test runs to finish before timing the Stop hook. A shared machine only marks that timing as shared.
  - A "Done when" check marker counts anywhere in its item, not only at the very end of a wrapped item.
  - A "Done when" item for one branch of a runbook can say when it applies: `(when ran: <regex>)`, `(when file: <glob>)` or `(when answer: <regex>)`. On other turns it is neither checked nor listed to verify. The engine runbook uses it: an upgrade turn's items are all script-checked, so upgrade turns get no verify list (17 of 17 engine turns in one project's history had one).
  - The end check takes the turn from the time the prompt hook saw the request, not from a guess based on kinds of transcript rows (that guess stays for replays). A message that arrives mid-turn joins the turn, keeping its start and runbook; the turn ends when its Stop passes. And one block per request: a turn that goes on after its block and stops again is not blocked again (a trial request got the same list 3 times).
  - A helper agent's report back is not a request either: no reminder, and the turn keeps its runbook. Before, the words of a review helper's report routed the turn to the project runbook.
  - A background job's notice that arrives mid-turn no longer clears the runbook the turn was routed to, and adds no reminder. Before, the end check held the turn to whichever runbook a command had read.
  - An engine upgrade message goes to the engine runbook again, as under v1, whatever words its list of fixes uses. Under v2, 26 of 27 such messages in one project's history went to the project runbook.
  - A request that opens with a runbook's trigger goes to that runbook, ahead of a longer trigger found later in the text.
  - The health check asks only about failures in files the turn touched, or failures that name no file.
  - **Upgrades now install engine v2** (every file of tools/hooks/v2). Before, an upgraded project's prompt and Stop hooks failed to load v2 once it became the default, and ran no reminder and no end check. The self-test's v2 Stop timing now fails on a hook error instead of timing it. Trial: "an upgrade installs engine v2 in a project made before it, and its prompt hook loads"; self-test: "engine v2's Stop hook loads and runs without an error".
  - The end check's block asks for the whole answer again, in the user's language, with any fix in it, instead of "finish with only what changed": the last message is the one the user reads (trials v33 and v34: it became "nothing changed" or a checklist report, in English to a Spanish-speaking user). Self-test: "end: a block asks for the whole answer again, in the user's language".
  - A declared check that is a test run is met by any passing test run after the change, however it is spelled (trial v34: a quoted glob in the config, an unquoted one in the run). Self-test: "end: a declared test check is met by a passing test run spelled another way".
  - Only a pass count ("16 passed") is read as a claim that tests passed; wording such as "I don't know whether your tests pass" is not (trial v34). Self-test: "end: wording about tests passing, with no pass count, is not a claim".
  - With a Finished section, the missing-file check reads only the files listed there; a path given above it as an example is not a claim (trial v34). Self-test: "end: with a Finished section, only the files it lists are checked".
  - While a helper agent started in the turn still works, the end check waits: no check, and the turn stays open, so the Stop after the helper reports back judges all of it (trial v33). Self-test: "end: while a helper started this turn still works there is no check".
  - The live end check now reports a commit only the answer names. The answer itself had counted as its evidence, so this check never fired live. Self-test: "end: live, a commit only the answer names is reported".
  - A test run that could not start (held for approval, or its program not installed) is not asked for again; a failing run still is (trial v33: about ten tries each). Self-test: "end: a test run that could not start ... is not asked for again".
  - `hooks.mjs prove` puts the fixed files back with their own modification time, so the end check no longer takes the put-back for code changed after the tests and asks for them again (trial v33). Self-test: "prove: the fixed files are put back with their own modification time".
  - A turn with no saved start (the first one after an upgrade installs v2) starts at its request's own time. A file a script wrote since then counts for a "(file: ...)" item, and the request is blocked once, not again. Self-test: "end: a turn with no saved start begins at its request".
  - A hook run with no session id (the upgrade's hook timing, a hand run) leaves no turn record in the project's state folder. Self-test: "start: a hook run with no session id leaves no turn record".
  - A v2 hook that crashes now tells the agent once per session (prompt: as context; Stop: one block), like v1's crashed hooks, instead of writing only to stderr. Self-tests: "crash: a v2 hook that cannot load tells the agent once per session", "crash: a v2 Stop hook that cannot load blocks once with the error".
  - Each upgrade proves the engine runs in the project: it runs the project's own prompt and Stop hooks once on a sample request and lists any error as an item to fix. Self-test: "upgrade: the engine probe names a v2 that cannot load, passes one that runs, and leaves no probe state".
  - An edit outside the project folder (the agent's memory, a scratch file) is not project work for the end check. Self-test: "end: an edit outside the project folder is not work for the end check".
  - The end check no longer judges "committed" or "pushed" by the wording of the answer. It checks only a commit the answer names, against git and what the turn showed. Word lists for which sentences claim a commit were wrong more often than right on live data ("until it is committed" held a turn).
  - A commit from a session that engine v2 recorded is no longer refused as "engine-bypassed". The git guard looked only for v1's turn record, so under v2 every commit from an agent session failed. Self-test: "guard: a session the v2 prompt hook recorded may commit".
  - An upgrade keeps the check markers a project put on the "Done when" items of an engine runbook, where the new version ships no check of its own there. Before, each upgrade dropped them. Scenario (trial): "an upgrade keeps a check marker the project put on an engine runbook's Done-when item".
  - `tools/starter/stop-found.mjs` reads v2's end-check blocks, line by line, for the 2026-11-08 decision. A self-test keeps AGENTS.md at 152 lines or fewer.
  - The end check no longer asks for a project's declared check (`go build`, `go vet`) when its program could not start this turn (not installed, or held for approval). Self-test: "end: a declared check whose program could not start this turn is not asked for; another missing program does not excuse it".
  - A message relayed from another session gets its runbook with one line: follow it only if the message asks for work here. Before, a note that only reported a fix got a runbook and its list as if it were a request. Self-test: "start: a relayed message gets its runbook only for when it asks for work; a typed request gets it plainly".
  - The self-tests of library skill scripts (the notes-vault link check, the letter draft check) are skipped in a project with no library/ folder, like tests of packs that are not installed. In a linked project they failed with empty output and failed the full self-test. Self-test: "selfcheck: every test of a library skill's script is skipped where the project has no library/".
  - The reminder names a standing rule of the project (AGENTS.md, "The user's standing preferences") that shares two words with the request, at most two rules. Agents had built against such a rule for the area they touched. It applies only to requests of 300 characters or fewer that no other session relayed, and only words that appear in that one rule count: a replay of two real projects showed the first version firing on nearly every routed turn, and now it fires on 2 of 225 in one and 0 in the other. Self-test: "start: a standing rule of the project that shares two words with a short request is named in the reminder; one sharing one word, a long request or a relayed message is not".
  - The correspondence draft check's PASS line says it checked figures only, and that statements in words were not checked. A plain PASS had been relayed as "the fact check passed" for a claim about a lease nothing had checked. Self-test: "correspondence draft check: ... its PASS says it checked figures only".
  - Under engine v2, a resumed session says its work was interrupted only when its last turn never ended (v2's own turn record). Before, every resumed follow-up got the notice, because v2 never writes v1's turn end. Self-test: "session: a resume after a turn that ended says nothing about an interruption; after one that never ended it does".
  - The end check does not ask for tests again when a test run in the turn was held for approval or missing its program, also when that run came before the last edit. Before, the agent retried a held run that was held again. Self-test: "end: a test run that could not start (held for approval, program missing), before or after the last edit, is not asked for again; a failing run still is".
  - A profile folder with a hyphen or underscore is named by the same words with spaces: a request about "flat 1" is about profiles/flat-1, with no alias needed. Before, the scope guard refused that work. Self-test: "scope-separate: "unit 1" names the folder unit-1 with no alias: allowed".
  - Engine v2 routes a Spanish request like its English wording, when it matches no trigger of its own. The reminder tells the agent to answer in Spanish, labels included, and Spanish complaints get the upset notice. Before, Spanish requests got no runbook under v2. Self-test: "start: a Spanish request routes like its English wording and is told to answer in Spanish; a Spanish complaint is upset".
  - The end check waits for a helper that was resumed after its report, until it reports again. Before, it counted as done from its first report, and the answer went out while it was still checking. Self-test: "end: a helper resumed after its report counts as working until its next report".
  - The notes-vault link-back check says how many new links it checked and that older links were not checked. Its old PASS line ("every note these link to links back") was relayed as a claim about every link. Self-test: "vault backlinks: the PASS line says how many new links it checked, and that older links were not".
  - `selfcheck.mjs --help` prints its usage and runs nothing. It used to start the whole suite. Self-test: "selfcheck --help prints the usage and runs no test".
  - The correspondence skill's draft check fails a draft that copies a phrase the skill quotes as an example, and the skill no longer offers a ready-made sentence for a notice period. Its examples had been copied into letters three times. Self-test: "correspondence draft check: a draft that copies a phrase the skill quotes as an example fails; one in its own words passes".
  - The end check no longer asks for screenshots when a build rewrote its output folder (`_site`, `.svelte-kit`, `.nuxt`, `.output`, `coverage`, `storybook-static`, and `dist` or `build` at any depth). Self-test: "end: build output (_site, .svelte-kit) is not a changed screen".
  - The engine proof now covers engine v2's files. Before, a release that changed only v2 kept the previous proof, so a project reused a self-test run that never tested its v2 code, and an edited v2 file in a project did not count as a changed engine. Self-test: "engine-proof: ... a changed engine file (engine v2 included) ...".
- 2026-11-05 (engine): **engine v2 is now the default.** The engine reminds before the work, refuses only unsafe actions during it, and checks once after it, with the agent verifying the runbook's list itself.
  - The rules, README, runbooks and skills no longer ask for record lines, turn notes or waivers.
  - Session start is three plain sentences.
  - `"engine": "v1"` brings the old engine back.
  - v2's end check has the agent verify the runbook items no script can check, once at the end of a work turn, in its single block. Nothing is added during the work.
  - A full self-test that passes on a frozen worktree of the commit now counts in the main folder. The pass is recorded there too, and the tested-files fingerprint ignores Windows line endings, so the end check stops asking for the run again.
- 2026-11-05 (engine): engine v2 runs in shadow beside v1. It logs what it would have shown or blocked to tools/hooks/state/v2-shadow.jsonl and prints nothing, so nothing changes for the user. Off with `"v2shadow": false` in tools/hooks/config.json.
  - v2's start reminder: an upset message points to the learn-from-upset skill, and when no trigger fits, one line asks the agent to pick and open the fitting runbook. The end check then holds the turn to the runbook it opened.
  - v2's end check 3: when a screen file changed, screenshots taken after the change must be looked at (projects with tools/screenshot.mjs only). Tests and fixtures in a gui folder are not screens.
  - v2's end check 4: after a change to rules, runbooks, checks, skills or hook settings with no passing health check after it, the end check runs `tools/audit.mjs` and asks only about a failure not reported before. In shadow it is never run.
  - v2's end check 5: new text in the knowledge folders names its source (a link, a project file or the user), or the sources list changed with it. Files a script changed are read from their git diff.
  - v2's end check 6: new code matching the project's security pattern (requirements.json "security-code") asks for the security review unless the turn ran it or wrote its report.
  - v2's end check 7: the answer's commits exist or showed up in the session, the files it names exist, and "committed" or "pushed" stated as done is backed by a command or a commit made since the turn began.
  - Runbook "Done when" items can carry v2's check after v1's marker, as in "(hook: plan-saved) (file: docs/plans/*.md)". Four of the starter's runbooks now do (engine, plan, project, trigger-words). A project adopts this by hand: add `(file: ...)`, `(ran: ...)` or `(answer: ...)` only to items that hold on every work turn of that runbook. `node tools/starter/done-when-coverage.mjs <project> --list` shows the candidates.
  - The v2 plan's boxes now match the commits, and the plan has a replay baseline table for the 2026-11-08 decision.
  - v2 has its own guard module, which uses v1's safety refusals and does not copy them. Tests prove each refusal under v2 and silence on a busy ordinary turn.
  - v2 reads Codex transcripts, including the newer `exec` calls (commands and patches inside code), and reads long transcripts from their tail.
  - v2 sees changes in projects with large .cache folders: the file walk skips bulk folders and runs once per turn.
  - v2's tests check now honors the project's declared "test", "build" and "commitGate" commands in config.json. In a live turn it also counts code changed by helpers and scripts since the turn began. Scratch scripts in .cache are not project code.
- 2026-11-05 (engine): engine v2 started, off by default. `"engine": "v2"` in tools/hooks/config.json turns it on.
  - With it on, the start reminder and the end check come from tools/hooks/v2/. The reminder is at most 10 lines: the runbook and its "Done when" list. The end check covers the runbook's checkable items and tests run after code changes.
  - A "Done when" item becomes checkable with `(file: <glob>)`, `(ran: <regex>)` or `(answer: <regex>)`.
  - Self-test: `node tools/hooks/v2/selftest.mjs`. Replay on real sessions: `node tools/starter/v2-replay.mjs <project> <transcripts>`.
- 2026-11-05 (engine): quiet work. The engine now reminds the agent before the work and checks once after it.
  - During the work it refuses only what is unsafe (secrets, AI attribution, protected and versioned files, outward actions, risky git, people's data mixing, the project's own guards). The upset hold, repeat and polling refusals and the em dash refusal are gone (Stop still checks the writing and the upset follow-through).
  - Tool calls get no notices: the checklist on opening a runbook, STATUS, plan, security, publish and generated-file notes are gone. The background-run notice shows once per run, in the main session only, and not for a command that only reads a check's output.
  - Helpers are never routed or held.
  - Stop no longer asks for "Done N" or "Skip N" lines.
  - New read-only tools: `tools/starter/interrupts.mjs` and `tools/starter/stop-value.mjs`.
  - **Breaking for project hooks:** PreToolUse and PostToolUse print far less, and SubagentStop prints nothing.
  - Commit 45a94c2. Its self-test names all carry "REQ quiet-work":
    - "upset-acknowledged: an upset message holds nothing during work";
    - "helper-turn-checked: a helper is never routed, held or given notices";
    - "overlap: a helper never gets the heads-up";
    - "overlap: a command that only names a check file";
    - "runbook-ledger: a judgment item with no record line asks for nothing";
    - the no-repeat, no-polling and plain-writing "allowed during work" tests.
  - Confirmed failing on the old engine: 21 tests.
- 2026-11-05 (engine): machine-local files (*.local.json) are left out of the self-test fingerprint, so updating this machine's settings or watch list keeps a fresh self-test pass current.
- 2026-11-05 (engine): turn notes with new lines inserted above an earlier turn's lines count only this turn's lines (the notes at the start of the turn are kept and subtracted), so an old lesson no longer asks for work in a turn that changed nothing.
- 2026-11-05 (engine): trial v30 findings: the purpose line of AGENTS.md and CLAUDE.md and a project's decisions log may use the user's own description; read-only loops and the vault's read scripts count as reads while a complaint waits for its Issue line; the rule hint asks for the new check's own tests, not the whole self-test; a screenshot warning on one address is not hidden by a clean run on another; the checklist and new-runbook steps say exactly what to record; one more trial wording removed (keepOut for the meals trial).
- 2026-11-05 (engine): trial v29 findings fixed: figures worked out from two traced ones count in knowledge writes; a one-word name matches only capitalized and only if still in the file; "found 2 open issues" accepted by the security report; a bulleted bold verification label counts; the plan-format check joins the repeat guard; new no-polling guard (a helper launches helpers in the foreground, no sleep-waits or quick re-reads of a running job's output); trial names and note titles removed from the engine, with a self-test that keeps them out.
- 2026-11-05 (engine): the committed runbook usage file changes only when what its readers use changes (a use under the hardening count, a new day, a new session); the turn already counted is kept in an ignored state file. Before, it changed on every turn and projects made a commit of it alone again and again. Scenario: usage-quiet.
- 2026-11-05 (engine): three more false alarms from trial v28q fixed. While a helper of this turn still runs, a file it wrote with its edit tools counts as changed (a security report it wrote was refused 3 times). The security-report sentence may put the verb first ("left two problems open"). A call the tool refused before it started (a PowerShell line too long) is no run for the repeat guard. Scenarios: helper-work-counts (files), security-report "left two problems open", no-repeat refused PowerShell call.
- 2026-11-05 (engine): four false alarms from trial v28 fixed. The skill-search report accepts words between "checked" and the colon ("Existing skills checked first:"), and its label shows the line it wants. A notes line written with echo or printf that names the research ledger check is no run of it. A checklist record may put the runbook name first ("project Done 2:"). Only the sentence that says to run something makes a changed file an instruction to run.
- 2026-11-05 (engine): a user message that reaches a helper agent is routed at the helper's next tool call (route, checklist, upset hint), and its hand-back (SubagentHandback, and SubagentStop, now wired) is held until the routed checklist is recorded; the improvement loop checks helper turns. Test: helper-turn-checked.
- 2026-11-04 (engine): each part of the upset-learned check has its own Stop label (Verified, Scope, Root cause, the checklist, Learned line, ...) instead of one generic line; test: upset-learned every part has its own round label (reads all 15 messages from the engine).
- 2026-11-04 (engine): the upset guard's refusal says an Issue line written in the same reply is not visible yet (a reply's text reaches the transcript only after its tool calls, confirmed with a headless probe) and asks to copy that same line; scenario: upset-acknowledged chat line (extended).
- 2026-11-04 (engine): security-report accepts "security check" as well as "security review"; scenarios: security-report "Security check: ... passed" passes, "has not passed" blocked.
- 2026-11-04 (engine, app pack): security-checklist no longer asks for the table in the answer (its Stop line names the report file instead), and accepts the report named with a Windows path; scenarios: security review without the item table (says), Windows path meets both security checks.
- 2026-11-04 (engine): the user's quoted decision in a "Who may do what" row (the quote grant-decided asks for) is no longer flagged as a copied example; the same words anywhere else still are. Scenarios: grant-decided long quote passes, copy outside the row blocked.
- 2026-11-04 (engine): install-vetted accepts a license named by its id ("Vetted: <tool> (BSD-3-Clause)") and its Stop line shows the "Vetted: <tool> <version> (license <name>)" form; scenarios: install-vetted license id, round shows the form.
- 2026-11-04 (app pack): verification-report accepts an honest real-app line ("Running the app: not done", "the server was not run", "could not run it") and a "Gaps" line; scenarios: verification-report honest not-run (2), no real-app line blocked.
- 2026-11-04 (engine): a Stop round blocked only on the checklist record offers the one-line "Answer unchanged; also updated" reply instead of asking for the whole answer again (its step label was read as an answer line).
- 2026-11-04 (engine): runbook-create: a validator's tests keep their own sample files and never read the project's live data.
- 2026-11-04 (engine): a "checks passed" verdict right after the agent's own passing run is no helper's verdict (claim-checked); legal-review section I: an open choice goes in the answer, never as a bracketed note inside the letter.
- 2026-11-04 (engine): the starter changelog and trial records no longer count as an engine change that asks for the self-test.
- 2026-11-04 (engine): the trial gate counts a run of node tools/trial.mjs, not a command that only names the file (a git add).
- 2026-11-04 (engine): an upgrade dry run names refreshed checks with their file (tools/hooks/requirements.json) instead of counting them as a root file. Trial: "a dry-run upgrade lists refreshed checks by name and file".
- 2026-11-04 (engine): the carry-over check reads an earlier turn's background launches from the rows before that turn, so a self-test started earlier and passed in it is no "no run".
- 2026-11-04 (engine): the security sentence counts with any few words before "passed" (not a negation), a backslash report path, or the report named further down the answer.
- 2026-11-04 (engine): a background run started in an earlier turn that ends in this one counts as this turn's run.
- 2026-11-04 (engine): a gate step whose run passed but was piped or filtered says why it did not count and to run it as one plain command.
- 2026-11-04 (engine): the claim check names the claim it means; a short lead-in ending in a colon routes a long pasted message, not the material; an Issue line shown in the chat counts as the acknowledgement and is copied to the notes.
- 2026-11-04 (no-verbatim-examples): the user's example names are kept out of the project's own test files too, not only rules, runbooks and skills. An obedience trial's fix for a complaint put the user's product name into two test files.
- 2026-11-04 (forbidden-terms in git): the git guard refuses a commit message or staged line that holds a name the user asked to keep out of the project, without repeating the name. The edit hooks already kept it out of files; a commit could still carry it into history (found by an obedience trial).
- 2026-11-04 (upset-learned): a complaint shown not to hold ("Learned (none)" with its evidence) no longer owes the whole checklist of the runbook its Issue line named; the Verified line still is. A trial agent was asked for a chapter check's checklist about chapters nobody changed.
- 2026-11-04 (upset-acknowledged): quoted text in a shell line is an argument: a "|" or ">" inside quotes no longer makes a chain of reads look like a change. Trial agents were held 4 times in 3 projects for grep -E "a|b" and echo "---" while writing up a complaint.
- 2026-11-04 (selfcheck): a --tags run in a project reuses the engine's proven results like a plain run: it runs the project's own scenarios and the engine smoke ones under those tags. Trial setups spent 4 to 10 minutes per targeted run rerunning 57 engine scenarios for two engine guards they named.
- 2026-11-04 (stop rounds): a block made while background work runs counts toward the same 3 rounds, so a turn is blocked at most 3 times in all. A trial turn was blocked 5 times, the last 4 all labelled "round 2 of 3".
- 2026-11-04 (autonomy-decide): a question after the Finished section counts. Two trial answers to a user who said not to be asked ended with "Question for you:" below Finished, unseen.
- 2026-11-04 (routing): an engine upgrade message routes to the engine runbook (its upgrade checklist) when the project has one, not to the project runbook.
- 2026-11-04 (correspondence skill): the warm-letter example no longer names the lease as the reason for the news; a trial letter copied it and the user called it cold.
- 2026-11-04 (runbook-ledger): with more than one runbook in play, every "Record N of the checklist" step names its runbook, the first one too. A project turn with four runbooks open answered an unnamed ask for the wrong one, three rounds running.
- 2026-11-04 (replay of real messages): an apostrophe inside a word is no quote mark (text between "doesn't" and "don't" was dropped as a quotation); "make sure", "make sense" and "make certain" make nothing; "time" is a common word, so an everyday "at the same time" routes only typed exactly, and parallel-agents no longer has it as a trigger; a trigger holding its own "don't" ("totals don't add up") reads the words as typed. Upset: "still has a ton of issues", "because you're not following", "do you ever think" count; "!!" after a word of delight and "a shit ton" do not. Scenarios: route: *, scope-general: text between two contractions, upset-learned: *.
- 2026-11-04 (toolPassed): a command that only prints or appends text naming a gate tool (echo "... PASS" >> notes) is no run of it; it was judged on the notes file and blocked a passing turn. Scenario: toolPassed: an echo naming the validator ...
- 2026-11-04 (route, negated verb): a trigger's verb right after "don't", "do not" or "never" counts for nothing ("don't make the plugin slower" is no request to make a plugin). Scenarios: route: "don't make the plugin slower" ..., route: "make a plugin" still routes.
- 2026-11-04 (scope-general): a request that names examples of a wider point ("or something else", "there might be other ones too") gets an EXAMPLES hint and, when it changes files, a Stop step asking for a Scope line and every case changed, as a complaint already did. Scenarios: scope-general: *.
- 2026-11-04 (learn-from-upset, learned before): step 2 searches the earlier lessons; a complaint an earlier lesson covered means that fix did not hold, and its root cause is fixed. The Root cause step says so too.
- 2026-11-04 (turn notes, line endings): a notes file rewritten during the turn with other line endings (CRLF) still counts only this turn's records; before, the turn start was lost and every earlier turn's "Learned ... -> <file>" line was asked for again.
- 2026-11-04 (claim-checked, who judged): a verdict about a group counts as attributed when the next sentence says who judged it, or says "I judged this/these myself"; before, a corrected answer that said so was still flagged.
- 2026-11-03 (open plans, task words): a request is held to an open plan by one distinctive word of its name or title, or by two words of its open tasks; one common word of a task line no longer counts. Tests: "plan-open: a request sharing one common word with an open task is not held to the plan", "plan-open: a request naming two words of an open task is held to the plan".
- 2026-11-03 (upgrade review): an upgrade review updated in place keeps the replaced review's engine commits in its heading ("(earlier: <commit> <date>, ...)", the last 6), so a second same-day upgrade no longer drops the first one's record. Test: "upgrade-review-block: a review updated in place keeps the earlier engine commits named in its heading".
- 2026-11-03 (question-no-file): with autonomy "auto", a message asking "what should we do?" or "how should we fix" about a problem asks for the work, so a fix is no unrequested edit; with autonomy "ask" it stays a question.
- 2026-11-03 (open plans): a request is held to an open plan only by a word that marks that plan, not by a word in a runbook name or in the names of 3 or more plans; a message shouted with "you don't understand" or "not listening" counts as upset.
- 2026-11-03 (field report): after helpers worked, "I ran every check myself" counts as saying who judged a group verdict, and the combined-result check accepts plain wording ("every check", "after the last change"). Both blocked one turn until its last round. Scenarios: "claim-checked: \"I ran every check myself ... and all of them passed\", after helpers worked: passes", "parallel work whose answer says every check ran again after the last change: passes".
- 2026-11-03 (field report): a trigger phrase routes only when its key words sit in one clause. "commit your work first; run the tests" matched a "first run" trigger and held the turn to an unrelated runbook's checks. Scenario: "route: a trigger's words split by a semicolon do not route".
- 2026-11-03 (project-watch): a work turn that names an existing runbook in its notes or answer but never opened it is asked to open that runbook. It was told to write a new runbook for a "new kind of task", with three follow-on steps, and the agent waived all four. Scenario: "runbook-exists: work that names an existing runbook it never opened is asked to open it, not to write one: blocked".
- 2026-11-02 (field report): every Stop check reads only the turn-notes lines written this turn. The file keeps earlier turns' lines when agents append to it, and an earlier lesson line made the lesson step ask for files this turn never touched. Scenario: "upset-learned: an earlier turn's lesson line left in the notes file is not this turn's: passes". A reply with both an "Added:" part and "Corrected:" lines applies the corrections too (they were read as more added text, so the fixed sentence was flagged again). Scenario: "answer-resent: a reply with an Added: part and a Corrected: line applies the correction too: passes".
- 2026-11-02 (project-watch): a correction line whose quoted text itself holds quotes is read as the correction. It parsed as none, the line was checked as the whole answer, and the em dash in its quoted old text blocked the turn again. Scenario: "answer-resent: a Corrected: line whose quoted text holds quotes is read as the correction: passes".
- 2026-11-01 (project-watch runbook): upgrade handoffs tell the project to open its engine runbook and record its checklist, which its hooks route the message to (two Stop rounds per upgrade turn before).
- 2026-11-01 (trial round 24 findings): While an upset message waits for its "Issue:" line, a shell line counts as a read
  only when every part of it reads ("cd", "sed -n", pipes of plain readers) and nothing goes to a file. A chain of
  reads was held as a change, and "cat a > b" passed as a read. Scenario: "upset-acknowledged: a chain of reads goes
  through while the Issue line is owed ...". The writing step names the files its problems are in, so an answer is no
  longer rewritten for a sentence in a file. Scenario: "plain-writing: the short step names the file with the
  problem". The meal-plan trial now starts with the family notes its complaint relies on (a trial setup gap: the
  complaint was false in rounds 23 and 24). The headless-resume step's short line says what to do (finish the resumed
  helper's work, or wait for a new helper): a headless run sees only the short lines, and "This run is headless" alone
  ended three rounds with "not done yet". Scenario: "headless-resume: a headless run ending while a resumed helper runs:
  blocked" (now also checks the short line).
- 2026-11-01 (trial round 23 findings): A headless run that ends while a helper it resumed by message still works is
  stopped (new step: headless-resume): the run ends with its answer and the resumed helper with it, so "the setup is
  still running" was the whole result. Scenarios: "headless-resume: a headless run ending while a resumed helper runs:
  blocked", "... the same in an interactive session waits, no steps asked". A trigger ending in "to" or "from" ("add
  the starter to") needs that word after its key words, so a note about adding a sourdough starter to dough no longer
  routes to the engine runbook. Scenarios: "route: "adding the starter makes the dough" is no engine install", "...
  "add the starter to this folder" still routes...", "... "remove the old starter from my project" still routes...".
  "Security review: it passed, and the report is ..." meets the security report check (a few plain words may stand
  before the result; "it has not passed" still does not). Scenarios: "security-report: "Security review: it passed"
  with the report path: passes", "... "it has not passed" is no pass: blocked". The short cited-claim step names the
  claim it doubts (it read "... cites characters.md for"). Scenario: "answer-traced: the short step names the cited
  claim it doubts". A requirements row typed the starter's name outside its marker, which failed every new project's
  setup audit once; the row is fixed and a new audit sweep, "shipped docs write names in markers", catches the next.
- 2026-11-01 (yes/no questions typed mid-turn): A yes/no question typed while the agent works is answered by a later
  text that opens with yes or no, even with no shared word ("was this intentional?" answered "No, it wasn't on
  purpose" was called unanswered). Scenarios: "question-answered: a yes/no question typed mid-turn, answered "No,
  ..." in other words: passes", "... with no reply opening yes or no and no shared word: blocked".
- 2026-11-01 (waivers with their output thrown away): A waive command this turn ran counts by its record in the run
  log too, not only by the "waived for this turn" line in the tool output. A waiver run as "waive x ... >/dev/null &&
  git commit" was asked for again in two more Stop rounds, and the turn ended unresolved. Scenarios: "waive: a
  waiver whose output went to /dev/null counts by its record in the run log", "waive: the same command with no record
  in the run log waives nothing".
- 2026-11-01 (trial rounds and the account limit): run.mjs and compare.mjs share one pattern for a turn the account's
  limit answered, in any "hit your ... limit" wording ("5-hour" was missed, so a round ran on into the limit
  unmarked), and run.mjs refuses a round name used before, before any trial starts. Test: "improvement-loop: a trial
  turn answered by the account's limit, in any wording, is void; an answer that mentions a limit is not".
- 2026-11-01 (Stop timing under load): In the starter, a Stop timing over budget also times the previous engine on
  the same turn in the same run; no slower than it (within 10% and 20 ms), the machine is slow, not the change: reported,
  not failed. It failed 3 of 6 full runs in one day under other projects' load. Scenario: "stop-budget: over budget but
  as fast as the previous engine on the same run is reported, not failed; slower than it fails".
- 2026-11-01 (timed testing sessions): The improvement-loop runbook covers a testing session with a time budget:
  rounds back to back with the drift probes, the real projects watched between rounds, every finding fixed with a
  test and retested, a report of rounds, verdicts and fixes at the end. Its step 6 commits and pushes only with the
  user's OK. Two drift probes (np-reading-rule, np-garden-parts) and judge groups i and j check that a rule or fact
  from an earlier turn still holds, every part of a request is done, and a change reaches every dependent file.
  Scenario: "starter-runbooks: in the starter, "tests for hours, did it keep it on track or forget things" routes
  to the improvement loop".
- 2026-11-01 (dates and the user's words): A date, time or version is no count of items, what the user said earlier
  is no verdict of the agent's, and a quoted phrase up to 600 characters is named, not claimed. A real answer that
  recalled the user's own earlier verdict, with its date, was blocked three times in one turn. Scenario:
  "claim-checked: a date and what the user said earlier (...), after helpers worked: passes".
- 2026-11-01 (pass and fail counts): A pass count beside a fail count ("1522 passed, 0 failed", in a table row
  too) is a test run's result, not a group verdict. Scenario: "claim-checked: a table row with a pass and fail count,
  after helpers worked: passes".
- 2026-11-01 (project Stop time limit): The project's own Stop command (config "externalStop") may run for
  "externalStopTimeoutMs" (new key, default 180000, was a fixed 60000). One that runs out of time is named as out of
  time, to rerun at the next Stop, not as broken with advice to remove it (which turned off every check it runs).
  Scenario: "external-stop: a project Stop command that runs past its time limit is named as out of time, to rerun,
  not to remove".
- 2026-11-01 (helpers' verdicts): In a session where helpers worked, an answer that calls a group of items passed or
  fine ("the other 21 menus passed") says who judged them and what the check behind it tests, or claim-checked blocks
  it. A check that only finds a helper's note per item had been reported as the items passing. Scenarios:
  "claim-checked: "the other 21 menus passed" after helpers reviewed them ...", "... saying the helpers judged the
  rest ...", "... no helpers: passes".
- 2026-11-01 (hook run ending): A self-test whose hook run ended badly (a status other than 0, a signal, or a process
  that never started) says so in its failure, with the error output, also when it reports a missing tag. Two projects
  saw Stop tests pass that should block, once each, with no error output; the cause is not found yet.
- 2026-11-01 (relayed labels): In a message from another session, a label before a colon ("Test: ... fails on the
  old engine") is no task verb, so that line no longer routes (it had set off the debug skill); the words after the
  label still route when they start with one (`relay-request-text`).
- 2026-11-01 (file entries): A list entry that names a file and says what it is ("- `x.mjs`: how a test run is
  judged") no longer tells the user to run it because "run" appears as a noun; it does when a clause of the
  description starts with the verb (`a Finished entry for a script changed this turn`).
- 2026-11-01 (proof run counts): A proof run of a new check that printed a failure count ("45 passed, 2 failed") or
  an exit code ("exit 1") counts as failing, though the command's last part succeeded, and a run with failures is no
  passing run. Such a run read as a pass, so the check's failing run on the earlier version never counted
  (`printed its failure count and exit code`).
- 2026-11-01 (grouped gate, commit names): A gate of several commands run as one group with its output sent to a file,
  `(a && b) > out.txt`, is judged on that file. It was judged on what the command printed after it, which lacked the
  gate's pass line, and a passing build blocked a round. A gate command inside the group that sent its output to a file
  of its own is judged on that file first (`its own file inside a group`). A claim cited to a file no longer counts the digits of a
  commit name in code (`e348b41`) as figures the file lacks: code spans are taken out first, and a number inside a
  word is no figure. Self-tests: `run as one group`, and the cited-claims test (`a commit name pass`).

- 2026-11-01 (timing turns): Self-test runs on one machine take turns to time the Stop hook. Two runs that reached
  the timing test together waited for each other for the full 10 minutes, then timed at the same moment, and one,
  counting the other as gone, failed the 500 ms budget on the other's load. A run waiting for its turn is no load now,
  and a lock gives the turn to one run at a time (`markWaiting`, `timingLock` in selftest-cache.mjs). Self-test:
  `timing-turns` (full run).

- 2026-11-01 (helpers, debug shots, data named like tests): Three false blocks from one field report.
  A helper's tool calls are now read in the order they happened, with the session's own: a helper's early failing test
  run was "the last run" after the session's later passing runs, and its check blocked all 3 rounds (`inTimeOrder`).
  A full screenshot round (its folder has a contact sheet) taken after the last edit leaves earlier one-off shots
  behind: two debug shots from before a reviewed round were asked for. A test file is code: a data file named
  `*.spec.json` is no new check to prove. Self-tests: `helper-runs-in-time` (full run), `a debug shot taken`,
  `file named like a test`.

- 2026-11-01 (layout is not a fact): Where a mark goes on a picture or a page, in a data file written into the
  knowledge folder (a box's corners, a label's point, a size, a crop), is no longer flagged as a made-up fact. Helpers
  that drew markup on pictures had their box corners called invented, and the agent had to waive the check twice.
  Figures beside the layout (a price, a width in a sentence) are still traced. Self-tests: `in a drawing file in
  docs/knowledge, is layout` and `a figure in a data file in docs/knowledge, beside layout`.

- 2026-10-31 (notes rewritten): A notes file rewritten during the turn, not appended to, keeps this turn's records.
  The turn's records were read from the file's length at the turn start, so a rewrite at least that long was cut in
  the middle, and the records before the cut were asked for again. The turn start now also keeps the file's last
  lines (`notesTail` in `turn.json`), and the records start after them, or with them gone, the whole file counts.
  Self-test: `a notes file rewritten during the turn`.

- 2026-10-31: A recurring job that has fired already is a standing schedule, not a wakeup left behind. An hourly job
  the user asked for was flagged at the end of every short turn between its runs. Headless runs still have to cancel
  it. Self-test: `a recurring cron job that has fired already is a standing schedule`.

- 2026-10-30 (two field reports): Unnamed record lines count for the checklist the prompt gave, and the upgrade says
  what it is doing.
  - Stop routed the raw message again, while the prompt had routed a relayed message by its own words only, so the
    order could differ: the checklist that came with the prompt was read as the second one, and its unnamed "Done N:"
    lines counted for the other runbook. The prompt's routes are kept in `turn.json` (`routes`) and come first at
    Stop. Self-test: `the checklist the prompt gave first keeps its unnamed record lines at Stop`.
  - The upgrade prints a line as each long step starts (the audit and hook timing before and after, the self-tests).
    It ran silent for over 10 minutes, and the caller took it for hung.
  - The review heading names the starter commit, `## Upgrade review (<date>) to <commit>`, so two reviews of one day
    are told apart. Self-test: `the upgrade says each long phase as it starts`.

- 2026-10-31 (self-test time): The starter's reused-engine self-test gets 20 minutes instead of 10. With other full
  runs on the machine it was killed mid-run and read as a failure. Starter only; projects need nothing.

- 2026-10-31 (closing the exits): No answer ends with a lesson, rule or project step unfinished, and no turn skips
  the full check. Plan: `docs/plans/2026-10-31-unfinished-work-exits.md`.
  - The lesson after an upset message, a rule request, a requirement check and the project's own Stop checks keep
    blocking in round 2 and 3. Before, they were deferred as "records" after one block and the answer went out.
  - What the cap leaves of those steps carries to the next turn whatever the request, and the next prompt says they
    come first. Before, it came back only if the request "looked related". Record steps (changelog and the like) still
    carry to related work only.
  - A turn that ends while background work runs leaves its full check on record, and the next Stop runs it. A block
    made while background work runs has its own counter and does not use up the turn's 3 rounds.
  - A waiver counts only when the waive command confirmed it. "Skip N" drops a failing check only with a reason of 3
    or more words.
  - A helper launched after a runbook checklist was handed over gets that checklist and is asked for one evidence line
    per item.
  - **Breaking for project hooks:** a project Stop command that fails in round 2 now blocks again, where before its
    steps were deferred. `unresolved.json` gains `must` (steps owed whatever the request) and `waiting`.
  - Field data from two projects: 25 answers had ended "waiting" and 12 unresolved (8 of them owing a lesson or rule
    step). Each would now be held. Self-tests: `records-once`, `owed lesson`, `waiting end`, `refused`, `skip without`,
    `helper launched after`.

- 2026-10-31 (later): A runbook opened mid-turn hands over its checklist at once, and four prompt readers are fixed.
  - Opening a runbook during the turn gives its "Done when" checklist then, with its name in the record lines
    ("Done <runbook> N:"), so a second runbook's items are known before the work, not only at Stop. The checklist the
    prompt routed to stays the first one. Self-test: `opening a runbook mid-turn hands over its checklist`.
  - A request opening with "do" ("do a review of ...") is work, not a question: it got the question hint, and its
    changes were called unasked. "do you ...", "does it ..." and anything ending in "?" still ask.
  - A paste closed with an id (`</pasted_content id="...">`) is no longer read as the user's own words.
  - "???" alone is eagerness, not upset; it needs a word of trouble with it. Spanish questions with an accented first
    word, and Spanish complaints ("no revisaste", "te dije"), are read. Self-test: `classifiers: "do ..." requests`.
  - The "acknowledge first" block says that an Edit of the notes file, or a shell append to it, goes through.
  - gui pack: the visual review asks that the main action is on screen without scrolling at every size, a laptop
    size included, and the review loop shoots that size for pages with a main button or Next/Back controls.
  - The engine gap review is in `tools/starter/reviews/2026-10-31-engine-gaps.md`; the rest of its list is open.

- 2026-10-31: Every runbook a turn follows keeps its checklist, and a peer's idle notice starts its own turn.
  - The after-work checklist (runbook ledger) held only the first runbook the turn used. A turn that opened a rules
    runbook and then a per-item runbook (followed for many items through helpers) was never asked for the second
    one's judgment items. Now each followed runbook's items need records; a later one's lines name it, "Done
    <runbook> N:". A runbook the turn edited is not counted as followed. Self-test: `a second runbook followed in the
    turn has its judgment items asked for too`.
  - A "[Cross-session idle notice]" or delivery notice now starts a turn of its own, like a peer's message. Before,
    the one-line reply to it was held to the earlier turn's changed files and Finished section. Self-test: `a peer's
    idle notice after the turn ended starts a turn`.

- 2026-10-31: News followed by a question typed mid-turn is no longer treated as a question only.
  - The "question, but files changed" check now needs every message of the turn to be only asking. A statement of new
    facts, with a question queued while the turn ran, made recording those facts look unasked and cost a Stop round.
    Self-test: `news typed first, a question queued mid-turn`.

- 2026-10-30 (late): A rule written early in a long turn still counts, and a quoted phrase is no claim.
  - **The turn's start is its first snapshot:** a message relayed mid-turn takes a new snapshot while the turn runs on
    from its own prompt; a snapshot taken more than a minute after the turn began no longer decides which files are
    unchanged. Before, a rule written early in a long turn was dropped as unchanged and asked for again. Scenario:
    `rule-request: a snapshot taken mid-turn, after the rule was written, is not the turn start: passes`.
  - **"Root causes:" over a list counts:** the root-cause line accepts the plural ("Root causes:", "Causes:",
    "Causas:"), so two fixes can share one heading. Scenario: `debug-trigger: "Root causes:" over a list of two: passes`.
  - **A quoted phrase is named, not claimed:** the hand-test check skips text in quotes. Scenario: `claim-checked: the
    phrase only quoted, as an example of what is flagged: passes`.

- 2026-10-30: Helpers on different folders are no longer refused as duplicates, and a finished read no longer counts as a run still going.
  - **"By hand" about the data is no hand-test claim:** a sentence that says a test kept rows "written by hand" is
    not read as "tested by hand"; "tested the page by hand" still is. Scenarios: `claim-checked: "by hand" describing
    the data a script test kept: passes` and `claim-checked: "tested by hand" next to data written by hand: blocked`.
  - **Different targets are different work:** two helper briefs that each name a file or folder the other does not
    are not near-duplicates, even when they share a brief file and most words. Before, one helper per folder was
    refused beside the first one still running. Scenarios: `no-repeat: a helper on another folder with the same shared
    brief: allowed` and `no-repeat: a helper on the same folder with the same shared brief: denied`.
  - **Only a helper's own result says it launched:** a foreground command whose output quoted a helper's launch line
    counted as a run still going, so every later test run got a false "still running in the background" heads-up.
    Scenario: `overlap: a finished read whose output quotes a helper launch is not running: no heads-up`. Nor is a
    background run told that it is itself still running: `overlap: a background check run, already in the transcript
    with no result, is not running beside itself: no heads-up`.
  - **A page written again with the same bytes is no new edit:** each reviewed screenshot round records what the
    changed screens held (`gui-shot.json`), and a later rewrite with that content asks for no new round. Before, a
    build that rewrote an unchanged page after the review asked for another round twice. Scenarios: `gui-review-loop:
    the page written again after a reviewed round, with the same bytes: passes` and `... with other content: blocked`.
  - **Accessibility in a plain sentence counts:** "Accessibility passed." or "the accessibility check passed" meets
    the accessibility check, not only "Accessibility: ...". Scenarios: `a11y-checked: accessibility reported in a plain
    sentence: passes` and `a11y-checked: accessibility only promised: blocked`.
  - **A runbook changed by a shell command regenerates its skill:** a command that names a runbook, check, skill or
    `requirements.json` and does more than read syncs the generated files, as an editor change does. Before, a script
    edit left the skill stale and the next audit failed. Test: `generated-current: a shell command that names a
    runbook regenerates its skill; one that names none leaves it`.

- 2026-10-29: "Acknowledged" can no longer be skipped, and the status bar keeps the user's own bar.
  - **Soft complaints count as upset:** "weren't you supposed to", "you were supposed to", "you dropped the ball" and
    "why the hell" now set off the upset handling. Before, a complaint with no swearing, capitals or "???" got no
    acknowledged line. Swept over 3,190 real typed messages: 6 hits, all real complaints. Scenario: `upset-acknowledged:
    a soft complaint ... is upset; a calm question with the same words is not`.
  - **The checklist counts only this turn, and reads ranges:** "Done 1-12:" and "Skip 2, 4:" cover each item named;
    records left in the notes file by earlier turns no longer count (the prompt saves where the notes ended). The end
    line says "checklist N/N done", counting items a script checked. Before, a turn showed "checks passed · checklist
    11/12 recorded": its "Done 1-12" read as item 1, and 10 more came from earlier turns. Scenario:
    `upset-acknowledged: a record covers a range or list of items ...`.
  - **The session start shows the user nothing obvious:** no "🟢 on duty", no "files intact", and no reminders of the
    agent's own chores (an upgrade to review, an open plan, a runbook to harden, the inbox, feedback, stale notes, work
    left open); the agent still gets each as a notice and acts on it, hardening without asking. The user sees what
    Anzuelo does instead: "🔧 improving the X runbook" once per turn when the agent changes a runbook or skill. Only
    "❗ files from before the interruption need fixing first" still shows at the start. Scenarios: `session: the user
    sees nothing at the start ...`, `session: the user sees "improving the X runbook" ...`.
  - **An upset turn starts from the general point and the root cause:** besides the checklist and `Verified:`, the end
    of an upset turn needs `Scope: <the user's point in general terms> - <every case it covers>` (their example is one
    case) and `Root cause: <why the earlier work missed it>`; the acknowledged hint asks for both before fixing. Before,
    an issue was acknowledged as the user's example, fixed in that narrow form, and the user had to repeat that it
    meant every case. Scenarios: `upset-acknowledged: ... no general point ...: blocked`, `... no root cause ...: blocked`.
  - **Starter only: project-watch runbook** (`tools/starter/runbooks/project-watch.md`): the starter session watches
    the projects that run the engine (performance, self-tests, what the user met), fixes the engine here and gets each
    project upgraded. The list of projects stays in an ignored local file. Projects never get this runbook.
  - **From a project's field report:** (1) a project's own scenarios no longer get the starter author's private word
    list in the self-test (the base sets an empty list unless the project names one); (2) `efficiency-review` is now a
    core skill, so an upgrade installs it: it shipped outside the core list, never reached existing projects, and the
    engine's routing tests for it failed there (new test `core-skills: every skill the engine's own routing tests
    expect is a core skill`); (3) a scenario that blocks when it should pass names each check and its step, not only
    "1 step is left"; (4) run in a project, the self-tests that link a test copy to the starter now link it to the
    project's linked starter, not to the project itself. Before, the copy took the project's own config, its own Stop
    command failed on a script the base had removed, and the engine-cache test failed in every project with one.
  - **Capitals alone are emphasis, not anger; praise words on a thing or a goal are not praise:** a message in
    capitals, or with a run of capital words, counts as upset only with a sign of trouble ("??", "!!", or a word for a
    problem, a repeat or blame such as again, still, why, wrong, broken, issue, "I already said"). "amazing",
    "awesome" or "perfect" before a noun ("an amazing recipe") or after a goal ("until it is amazing", "make it
    perfect") no longer counts as praise. Before, eager requests such as "GO ALL OUT" held all work until an
    acknowledged line. Swept over 1,182 real typed messages: 21 false upset alarms and 1 false praise gone, no real
    complaint lost. Scenarios: `caps-weight: capitals that stress a wish are not upset ...`, `... with a sign of
    trouble are upset ...`, `praise: a praise word on a thing or a goal is not praise ...`.
  - **Hook timing keeps the caches it rebuilds:** `hooks.mjs bench` still writes no session state, but now keeps the
    hooks' caches (generated-file stamps, the names list, the setup checklist's checks), so the run after an upgrade, or
    in a fresh copy, is not timed cold every time. Before, an upgrade read Stop about 80 ms and the prompt hook up to 2 s
    slower than the same engine once warm (2.4 s against 254 ms in a copy of a real project). Test: `bench-caches: a
    timing run keeps the caches it rebuilt and writes no session state`.
  - **The upgrade times each hook as its fastest of three runs:** before and after alike, so a machine still busy right
    after the upgrade's audit no longer reads as a slower engine. Before, three upgrades in a row reported Stop 87 to
    131 ms slower, and the next upgrade timed the same engine back down. Test: `upgrade timing: each hook is timed as
    the fastest of several bench runs`.
  - **An open plan holds only the work that continues it:** a work turn is stopped to resume an open plan only when
    the request shares a word with the plan's name, title or open tasks, or says to go on ("keep going", "continue");
    other work and messages relayed from another session leave the plan for its own turn. Before, an engine upgrade a
    peer handed over was stopped to resume an unrelated plan. Scenarios: `plan-open: a request about other work ...`,
    `plan-open: a request relayed from another session ...`, `plan-open: "keep going" continues the open plan: blocked`.
  - **A correction stays applied for the rest of the turn:** a `Corrected: "<old>" -> "<new>"` message is applied in a
    question turn too once an answer was blocked, and the corrected answer is what a later short note in the same turn
    ("Added:", after a background helper's notice) is read with. Before, the number a correction took out was flagged
    as made up a round later, and the agent had to waive the check. Scenario: `answer-traced: an Added: note after a
    passing correction is read with the corrected answer: the withdrawn number is not flagged`.
  - **Starter only: the self-test check counts runs, not mentions:** committing or copying `selfcheck.mjs` no longer
    reads as the last self-test run, and the engine proof the self-test writes when it passes no longer counts as an
    engine change (a background run that finished made the next turn ask for the self-test and a changelog line),
    and neither are the starter's own status notes (`tools/starter/STATUS.md`, `dogfood-log.md`). Test: `dev mode:
    only the engine proof or the starter status notes changed ...`. Before, a full pass earlier in the turn was not seen and the check was waived turn
    after turn. Scenario: `dev mode: committing the self-test file after a passing run is no failed run of it ...`.
  - **The Stop speed test waits for other self-test runs:** it times the hook only once no other self-test run is going
    on the machine (up to 10 minutes), and a time over budget while one still is gets reported, not failed. Before, it
    failed at 540 to 726 ms in runs beside another suite, while the same engine takes about 160 ms alone. Scenario:
    `stop-budget: over budget fails when the run is alone, and is reported, not failed, ...`.
  - **A push never carries the engine's private files:** before every push (the agent's hook and git's pre-push hook),
    git itself lists every untracked or committed file under the engine's private paths (`.cache/`, its state, upgrade
    backups, the private word list, this machine's settings and agent folders) that would go out, not only a few
    sample names. Sharing one on purpose: list it in `gitignoreMustKeep` and un-ignore it (`<folder>/*` plus `!<path>`).
    Before, a `.gitignore` that covered the sample names passed while 3,000 cache files and the turn notes would have
    been pushed. Scenario: `gitignore-ready: every private engine file on disk ... stays out of a push ...`.
  - **Engine runbook pitfall:** an upgrade run from another folder while a session works in the project is handed to
    that session instead: under its load the timing check rolled the upgrade back, and files it was writing could not
    be put back exactly.
  - **A new rule searches the whole project for what says the opposite:** project-rule step 3 and a new "Done when"
    item in the project runbook ask for several searches over every file, each hit fixed or kept with a reason, and a
    `Conflicts: ... - N found, N fixed` line, before the rule is called in place. Before, only the main rules, the
    runbooks and the brief were checked, and a rule was called "already enforced" while 15 files said the opposite.
  - **Acknowledged first, enforced (REQ upset-acknowledged):** when the user sounds upset (also in a question, or a
    message typed mid-turn), every change and command is refused until the agent writes its `Issue:` line, which shows
    "acknowledged" at once; `Issue: none - <why>` for a false alarm. Reads still work. Before, it was only a hint, and
    upset questions got no upset handling at all.
  - **Acknowledged names the runbook and the outcome:** the line is
    `Issue: <problem> | runbook: <name> | fixed when: <outcome>`, accepted only with an existing runbook or skill and
    an outcome; the user sees all three, and the agent gets that runbook's checklist. At the end of the turn the
    runbook must have been opened, every "Done when" item recorded (`Done N:` / `Skip N: <why>`), and the outcome
    checked (`Verified:`). **Breaking for project hooks:** a plain `Issue: <problem>` line no longer shows
    "acknowledged".
  - **The checklist for every runbook, on by default:** `runbookLedger` now defaults to `true`. Every runbook the agent
    follows gives it its "Done when" checklist; items a script checks are checked, and each judgment item needs a
    `Done N:` or `Skip N: <why>` record before the turn can end. **Breaking for project hooks:** turns that follow a
    runbook with judgment items now need those records; set `"runbookLedger": false` to go back.
  - **"Running the X runbook (✅ N items to check off)":** every runbook or skill the agent opens (Read, a command, the
    Skill tool) is shown to the user once per turn, with its checklist count. `Skill` is added to the PreToolUse matcher (wire.mjs; an existing project adds it by hand
    or rewires, engine runbook).
  - **Two checklists in one turn:** a record line may name its runbook (`Done debug 3: ...`) and then counts only for
    that runbook; a plain `Done 3:` counts for either. The self-test's scenario copies keep the checklist off unless a
    scenario turns it on, so scenarios written for other checks are not held to records they never kept.
  - **Debug skill:** list everything wrong first with the rule and a table of states; verify with a sweep over all the
    real data, a check that nothing the user already had broke, and the promised outcome (`Verified:`).
  - **Status bar:** any other status line (the project's `.claude/settings.json`, else the user's
    `~/.claude/settings.json`, e.g. model, context, folder) is printed first, unchanged; the engine never overrides or
    disables a status line but its own; the project's line is added under it only while a turn is in progress
    (working, almost done, waiting on background tasks, ended with steps not done). A finished turn shows nothing.
    **Breaking for project hooks:** "✅ checks passed" and "✅ done" are no longer shown on the bar.
- 2026-10-28: A status bar you can trust, "acknowledged" for every complaint, and repeat complaints handled with a plan.
  - **Status bar (new, `tools/hooks/statusline.mjs`, shipped):** one line under the prompt, how the session stands:
    working, almost done (N steps left), waiting on N background tasks, checks passed, ended with N steps not done, or
    done. One rule: the newest transcript entry decides (a final reply with nothing after it = ended). It reads the
    whole transcript and never repeats what the chat shows. Self-test `status-bar` walks a recorded session through
    every state, including a background command the agent stopped itself; sweeps over real sessions found 0 wrong
    (the first version: 95 wrong of 507). Wire it in
    a project's `.claude/settings.local.json`: `"statusLine": {"type": "command", "command": "node \"<project>/tools/hooks/statusline.mjs\""}`.
  - **"Acknowledged" for every complaint:** the newest `Issue:` line is read, not the first in the notes file. Before,
    only a session's first complaint was ever acknowledged. Scenario: `upset-learned: a later complaint appended below
    an earlier Issue line is acknowledged, once`.
  - **A turn that ends with steps not done says so:** after the third Stop round or a pause, the user sees
    `⚠️ ended with N steps not done: ...` at once, instead of a silent end that looked finished. Scenario:
    `unresolved-carryover: block cap reached: the user is told at once ...`.
  - **Upset again in the same session (upset-learned):** the Stop hook asks for a plan in `docs/plans/` listing
    everything wrong with each root cause and fix, and a `Sweep:` line proving the fix over the whole real record.
    The trigger log now records the session id. learn-from-upset gains steps 1a (list everything wrong first) and 1b
    (repeat: plan, rule, sweep, self-test). The status-lines runbook gains a status bar section (states, rule, sweep).

- 2026-10-28: Examples, tests and lessons use neutral subjects only.
  - About 40 comments, test cases, trigger phrases and changelog lines had kept the subject of the projects their
    lessons came from. They now use neutral subjects (trips, invoices, kitchen shifts, tax rules). The research
    ledger no longer treats one game-specific paid-service wording as a seller.
  - The field-report runbook (step 3) says to retell each case in a neutral subject, and to add a new project's
    subject words to the private list, so the audit catches what slips through.
- 2026-10-27: One runbook installs, upgrades and removes the engine; settings the host refuses; "acknowledged" at once.
  - **Engine runbook (`docs/playbooks/engine.md`, core, menu E6):** install (new or adopt), upgrade (moved from
    `project.md` §7, which now points here), remove, and hook settings, with "commit the project's work first".
  - **Remove:** `node tools/starter.mjs uninstall [--dry-run]` (from the starter: `new-project.mjs "<folder>" --remove`)
    unwires only the engine's hooks, removes its files, core skills, the skills made from its runbooks and their
    mirrors, backs them up in `.cache/engine-removed/`, and keeps the project's own files. `--adopt` puts it back.
  - **Settings:** `node tools/hooks/hooks.mjs setting <key> [<value>]` reads or writes one setting, refusing an unknown
    key or a wrong type. When the host refuses the agent's edit to `tools/hooks/config.json`, the agent ends its answer
    with that one line for the user to paste (`! ...` in Claude Code). The agent's own use of the write form is denied
    (permission-respected): a refused edit is never done another way. Field report: the user was told to open
    config.json and add a line by hand, and had to take it to the starter's session.
  - **"Acknowledged" at once:** the user sees `🚨 acknowledged: <issue>` as soon as the agent writes its `Issue:` line
    (an edit, or from the shell at the next tool call), not only when the turn ends; the end-of-turn line then says
    `fixed`. An issue from an earlier turn, still in the notes file, is never shown again. learn-from-upset now writes
    the line first, before any fix.
  - **Every status line probed in real sessions** (new `tools/starter/trials/probe.mjs`: one real headless turn, the
    lines read from its transcript). Four independent agents found 23 of 24 kinds shown. Fixed what they found: the 🌱
    new-runbook line never showed and the end of the turn claimed the hooks "pulled up" a runbook made that turn
    (routing at the end now uses only the runbooks there when the turn began); a resume repeated every reminder and
    claimed an interruption after a turn that ended normally; the ❗ line showed a guard's raw pattern.

- 2026-10-27: Pointers, not procedures, and starter-only false alarms.
  - **The upset hint is a pointer:** about 1,500 characters became one line naming the learn-from-upset skill (the
    opening words stay for project hooks). The skill starts with a gate: a false alarm (venting, a test, nothing
    wrong) records `Learned (none): nothing was wrong` and stops; a real issue, or one that keeps coming up even said
    calmly, writes `Issue:` and goes on. The session checklist line is a pointer too.
  - **The simplest fix that removes the cause:** learn-from-upset and debug now say it: one change in the right place,
    extending what exists rather than adding layers.
  - **Starter-only false alarms (dogfood):** in the starter itself, the changelog and status checks accept its own
    records under `tools/starter/` (new `tools/starter/STATUS.md`) instead of the templates new projects start from;
    naming the starter no longer routes every message to the project runbook there (projects keep it).
  - **Round v20 fixes:**
    - **No invented permission grants (REQ grant-decided):** when a turn changes the "Who may do what" row in
      `docs/foundation.md`, a destructive right given beyond the owner needs the user's own quoted words naming the
      role. A request for a feature is not such a grant. In the trial, the agent was asked only to add a delete
      endpoint, let all staff delete, and wrote "the user decided".
    - **Figures read earlier in the session are traced (answer-traced):** two right totals read one turn earlier were
      flagged as made up, and the forced rewrite of the answer added a wrong claim.
    - **The setup helper checks its own answer:** it writes the answer to `.cache/answer.md` and runs the answer check
      on it, and the main session passes that answer on unchanged. In 3 of 4 judged pairs, the Stop hook found 5 to 9
      more steps after the hand-back.
    - **Checks installed as shipped need no self-test (hooks-tested):** a pack check identical to the starter's copy
      was already proven by the starter's tests. Installing a pack had asked for 12 of them to be tested again.
    - **The starter's push no longer asks it to commit its own hook state (gitignore-ready):** that state comes from
      working on the starter, so the starter ignores it on purpose. Projects still must commit theirs.

- 2026-10-27: The user can see Anzuelo work, runbooks become the checklist, and creation gets stricter.
  - **⚓ Anzuelo lines (REQ prompt-visible):** under Claude Code, the hooks show the user a short line with an icon each
    time Anzuelo itself does something: 📖 pulled up a runbook, ⚡ brought in a skill, 💬 a question answered first,
    🛡️/❗ stopped an action (❗ for the critical guards), ✅ checks passed, 🟢 on duty at session start, and more. Only
    what Anzuelo set off is credited: a runbook the agent opened on its own is not. The user chose the icons.
  - **Guesses from words are never shown, only what the agent confirms:** an upset message, a rule, a requirement,
    praise or a new kind of task shows nothing when the message arrives; the end of the turn shows only a confirmed
    result: "🚨 acknowledged: <issue> → fixed" (from the agent's `Issue:` notes line, also when no hook fired: the
    session checklist asks the agent to judge upset itself, in any wording or language), "📜 rule saved", "🌟 what
    worked is kept", "🌱 new runbook made". Venting or a complaint that didn't hold shows nothing. A runbook or skill
    Anzuelo pulled up that didn't fit says so: "🚫 the <x> runbook didn't fit: <why>".
  - **The lines can be turned off:** config `userLines` (true, false, or {"hide": [kinds]}), changed by the new engine
    runbook `docs/playbooks/status-lines.md` ("turn off the icons", "hide the praise line").
  - **Trigger words, checked against a real user's 585 messages (REQ trigger-words):** cursing and an angry user's
    words count (wtf, bullshit, disappoint, misspelled too; angry, annoyed, fed up, "ain't working"); words that fired
    mostly on calm messages are out ("shit" as in "a shit ton", "terrible", "!!" in praise, a bare "I told you", "so you
    never forget"), as are generic ones ("damn", "seriously"); praise in capitals is not upset. A whitelist per user
    (config `ignoreWords`, `hooks.mjs ignore-word <upset|praise|rule> "<word>" [--remove]`, the new engine runbook
    `docs/playbooks/trigger-words.md`) stops a word counting by itself, while capitals and other trigger words in the
    same message still count. The engine never adds trigger words on its own. A local trigger log
    (`tools/hooks/state/triggers.jsonl`) keeps each message a word hook fired on and what the agent decided, as
    evidence for trimming further. Venting with nothing wrong is recorded as `Learned (none): nothing was wrong -
    <what>` and owes no verdict or lesson. learn-from-upset now fixes every case of the same miss in the result, not
    only the one named.
  - **Runbook checklist (trial, config `runbookLedger`, off by default):** the routed runbook's (or skill's) "Done when"
    is handed over with the route; the agent records "Done N: ..." / "Skip N: <why>" in the turn notes and works
    without being stopped; at Stop the checks each item names judge the record, a skip with a reason drops that item's
    checks, and a judgment item needs its line. Always-on checks and guards are never covered. A project's own Stop
    command may name each step's check in `tags`, so an item can cover it.
  - **Runbooks must be accurate:** the audit fails a "Done when" item naming a check that doesn't exist (one with no
    proof label stays its warning), and the Stop check names both for a changed runbook; a new runbook or skill is read cold by a helper before it is relied on (REQ runbook-cold-read,
    runbook-create step 5, with "what makes a runbook good").
  - **Breaking for project hooks:** hook output contract 4: session, prompt, a denied pretool and a passing Stop may
    carry a `systemMessage` for the user. Nothing was removed.

- 2026-10-25: Efficiency: measured against the same projects with no starter (new `TRIAL_BARE=1` trial mode,
  `tools/starter/trials/efficiency.mjs`, `tokens.mjs`, `overhead.mjs`). Before this batch, setup took 10x the time and
  13x the cost of no starter, and work turns 7.7x the time and 16x the cost: each request after an in-session setup
  carried about 195k tokens of context against 37k. The owner's bar: "almost as fast and not too many more tokens",
  with the starter's benefits kept.
  - **Setup in one helper agent:** the setup notice asks to run SETUP-PROMPT.md in one helper where the host has them,
    so its reading, writing and tests stay out of the conversation every later request re-sends.
  - **Helper work counts (REQ helper-work-counts):** the tool calls of helpers started in the turn count for the
    checks (what they read, ran, wrote, waived); their text is never the answer.
  - **Fit checklist:** setup runs `fit.mjs --auto-skip`, so library skills and tools with no sign of need are skipped
    for it (about 90 of 102 rows); "the first code file appears" now counts the project's own code, not helper
    scripts under `tools/` or `scripts/` (one validator script reopened about 60 code-tool rows).
  - **Screenshots:** `screenshot.mjs` makes contact sheets (`_sheet-N.png`, up to 8 captioned shots each); opening a
    round's sheet counts for its shots. A round of 12 projects had 228 screenshot reads, about 10 million characters.
  - **Quiet self-tests:** `selfcheck.mjs` prints failures and the summary; every test line goes to
    `.cache/selfcheck-last.txt` (`--verbose` prints them). Agents re-ran the suite with `tail` or `grep` to find failures.
  - **One Stop for both engines (REQ external-stop):** config `"externalStop"` names a project's own Stop command; it
    runs inside this Stop, its steps join the list (one banner, each step once), block in round 1 only, then carry over.
    A project that sets it removes its own Stop entry from `.claude/settings.json`.
  - **No plan written after the fact:** at Stop, plan-required asks only when the answer leaves work open and nothing
    records it (no plan, no STATUS.md line).
  - **Only what changed:** in a session the user watches, a later round or a long answer ends with "Added:" (the new
    parts) or "Corrected:" lines, not the whole answer again.
  - **A plain list is no sentence:** 3+ short lines with no end punctuation (an import list, one item per line) are
    read as a list by plain-writing; wrapped prose is still measured. From a field report.
  - **A narrow originals glob guards only what it matches:** with `protectedOriginals` like `items/**/Original/**`,
    the command guard protected all of `items/`, so writing a changelog beside the originals was denied while the Edit
    tool allowed it. Commands are now judged by the full glob; a folder that may hold originals still counts. From a
    field report.
  - **Checks rerun after sub-agents count as the combined check:** parallel-trigger now passes when a check, test or
    build command ran after the last sub-agent started and the answer gives its result; the word "combined" is no
    longer needed. New condition key `checkedAfterAgents`. From a field report.
  - **"Useless" about the request's objects is not upset:** "replace the 2 most useless items" no longer reads as a
    complaint; "it's useless" still does. From a field report.
  - **A curl to this machine is not the web:** polling the project's own local server (localhost, 127.x, ::1) no longer
    sets off research-verified. From a field report.
  - **Fewer false alarms, no off switch (from a field report, 20 headless builds):** a one-sentence question led by
    "what/why/how" gets no NO RUNBOOK or lasting-requirement hint, a context summary that resumes the turn gets no hints,
    and while another session works in the project the turn notes count only when this session wrote them. A check
    waived in 3+ earlier turns asks the agent to tell the user, so the check gets fixed instead of skipped (REQ:
    waiver-tally). The copied-words check skips text a file already had at the last commit. Asked-for "task profiles" that silence checks were not added: false alarms are fixed in the check.
  - **From a field report (10 headless builds):** a headless run that schedules a wake-up is told at once that nothing
    would wake it and that a helper reports back by itself in the turn (REQ: headless-no-wakeup); the efficiency report
    lists files edited 4+ times in one turn (write a file once, when its content is final).
  - **Rule obedience, tested without memory:** `tools/starter/trials/obedience.json` scenarios give a rule in one session
    and tempt fresh sessions to break it (a forbidden name, the user's example, a question, a secret, commit credit, a
    standing naming rule, tests for new behavior, the answer's language); `obedience.mjs <round>` checks each mechanically.
  - **Names the user keeps out stay out, in every project** (the user: "projects with anzuelo will also forget
    things"; "the rule is to never use my examples in the code too"): "never mention / don't reference / keep X out of
    the code" routes to the project-rule skill, and `hooks.mjs rule ... --forbid "X"` makes X an enforced term in one
    step (`forbiddenTerms` in config.json; `--private` keeps it in a list outside the repository). Writing X is denied,
    a file a command changed is checked at Stop, and the audit sweeps every file (REQ: forbidden-terms). And the user's
    own examples (names from their messages) may not appear in a rule, runbook, check, skill or rule test written that
    turn (REQ: no-verbatim-examples); in the starter itself, its engine files count too.
  - **What is shared names no project it learned from** (the user: "make sure that this project does not reference"
    the projects it was improved for; "everything should be generic and help any project"): rule 14 now says so for
    starters, templates and libraries, and the audit holds it. A list of private names and words sits outside the
    repository (`privateTermsFile` in config.json; the starter reads ~/.anzuelo/private-terms.txt), and any shared file
    that contains one fails the audit with its line. Every lesson, comment and test in the starter was rewritten with
    neutral examples.
  - **Another session's edits are not this turn's** (a field report: a headless build that wrote one helper under
    .cache/ was held to a 12-step security review for code the owner's terminal session saved meanwhile): while another
    session works in the project (its state files moved during the turn; a busy session marks itself alive at most
    once a minute), a changed file counts only when this session wrote it, named it in a command, or changed it during
    one of its commands. A step set off by what a file says now names the file and the words, so a false alarm shows.
  - **Headless runs waive without a shell:** their Stop message offers `N/A(<name>): <reason>` in .cache/turn-notes.md
    (it always counted), since a headless run's allowed tools may refuse `node tools/hooks/hooks.mjs waive`.
  - **The efficiency report counts wasted steps:** refused calls, --help lookups, outputs too big to read whole.
  - **The efficiency report shows steps against tool time, and waiting after the answer** (a field report's builds:
    52 minutes = about 11 of model steps, 5 of tools and 27 waiting on background sweeps after the answer): a STEPS
    VS TOOL TIME line (model requests, seconds each, minutes against command minutes), the most-called commands (each
    call also costs a model round trip: batch them), and WAITING AFTER THE ANSWER.
  - **Retired checks never roll an upgrade back** (a field report: the 49eb606 upgrade rolled back because a project's
    copy of rule-enforcement.md still named playbook-named): `RETIRED_TAGS` in the engine; sync takes a retired check
    out of the project's checklists and runbook hook lists, and the audit never fails on one.
  - **New skill: efficiency-review** (the user: "what if anzuelo had a runbook/skill to check the projects own hooks and
    stuff for efficiency"): `skills/efficiency-review/scripts/efficiency.mjs` reads the project's own Claude Code
    sessions and reports the turns in numbers, the slowest commands with the rule, runbook or hook file that names each,
    steps done again with nothing changed, records edited on most turns, and end-of-answer blocks, steps and hook time
    by source (the starter's engine or the project's own hooks). The skill traces each cost to its source, proposes
    changes ranked by time saved with what each loses, changes the project's rules only with the user's OK, and sends
    engine costs to the starter. "So many sweeps", "too slow", "20 minutes", "wasting tokens" route to it. On a real
    project it found the GUI sweep at 4 minutes a run, called after every app change by its CLAUDE.md.
  - **Small fixes stay small** (the user: "anzuelo makes my project simple fixes turn into 20 minute things"):
    - New **small-change** lane: a turn that changed at most 3 project files and 40 edited lines (config `smallFiles`,
      `smallLines`, counted from the turn's own edits) is held to tests, security, accuracy, the screenshot loop,
      guards and the audit, and to none of a feature's ceremony: spec, review, verification section, release notes,
      version bump, plan, STATUS, changelog line, new runbook. A SMALL FIX hint says so before the work; the feature
      runbook and AGENTS.md rule 12 say it too.
    - **The audit runs itself**: when the audit is due at Stop and no run since the last edit shows it, the hooks run
      `node tools/audit.mjs` themselves (seconds); a pass needs no step, a FAIL shows its lines. No more agent runs of
      it, or overlapping second runs (a field report: one small app change ran both engines' sweeps, some twice).
  - **Questions get answered** (a study of 117 real questions in two projects: with the starter, 57% were not fully
    answered and 15 of 58 got no answer at all, against 33% and 2 of 57 before; most were typed while the agent worked):
    - A question typed mid-turn gets one hint, "answer it in your very next message", and no runbook, skill or upset
      work of its own; a question that opens a turn is answered first, and a runbook named for it is reference.
    - New Stop check **question-answered**: a mid-turn question no later message answers holds the turn once (a
      sentence or an "Added:" line meets it; a turn already held for it ends anyway).
  - **Efficiency research and fixes** (attribute.mjs: a work turn was 14.2 requests against 3.4 without the starter):
    - **No marker steps:** the "playbook-named" step is gone. The hooks see the runbook read; without hooks a runbook
      counts only when named (runbook-read). Nearly every turn spent a step writing "Playbook: x.md".
    - **`hooks.mjs rule`:** one command writes a standing rule to AGENTS.md, user-requirements.md and, with
      `--check`, requirements.json (validated) and rule-enforcement.md, so rule turns no longer read those files
      (49k + 23k characters carried on every later request).
    - **`hooks.mjs prove`:** one command runs a new check on git's version before the fix (it must fail) and on the
      fix (it must pass), always puts the fix back, and writes the Proven line (4 to 12 hand-built steps before).
    - **STATUS.md only when work is left open** (status-handoff), and **release notes count as the changelog** for app
      work (app-changelog no longer asks for a second record of the same change).
    - **compare.mjs counts each turn's own cost** (it read the session's running total), and new tools
      `attribute.mjs` (requests and token cost by cause), `steplist.mjs`, `setuptime.mjs`, `setupwrites.mjs`.
  - **No steps for work that didn't happen:** the app pack's spec-written and review-verdict checks apply only when the
    turn changes the app's code (like release-notes); a turn that finds the feature already there is held to none of
    them. The CHECKS line names every check that needs a file change under "If it changes files", not "will be held
    to" (an already-done feature was told it needed a spec, a review and notes, and waived six checks).
  - **Repeated work is measured and gates every round:** `trials/repeats.mjs` counts files read again and commands
    run again with nothing changed since; `compare.mjs` reports repeats per turn and a round with more than the
    one it is compared with is WORSE (round e5: 0.13 per turn; plain Claude Code: 0).
  - **The name check reads git once:** name-var read each changed file's committed version with its own `git show`
    (182 files, about 2.6 s of a 3.3 s Stop in a project full of gitignored data files); now one `git cat-file --batch`
    reads them all, and a project with no names to check skips git entirely.
  - **Upgrade names its source:** `starter.mjs upgrade` prints the linked starter copy's commit and, when that clone
    is behind its upstream branch, says so and points to `update` (a field report: "nothing changed" came from a clone
    two releases behind).
  - **Round 5 of the efficiency loop** (work turns 5.7x the cost of no starter, from 14.3x; 4.0x the time; blind
    judges found 0 high on all four projects):
    - **A new output needs no changelog line:** knowledge-changelog fires on `docs/knowledge/**` only. A dated file
      in `outputs/` is its own record; every weekly summary and letter cost a read and an edit of the changelog.
    - **A passed audit isn't run again:** a check run from inside the same command as an audit ("audit | tail -1 &&
      hooks.mjs check") saw that command still going, read its empty output as a failure, and the audit ran again.
      Runs still going no longer count when a finished one exists.
    - **The security result is one sentence:** the step's label said "End with the security review table" while the
      rule wants one sentence naming the report, so answers carried 6 to 17-row tables (one grew from 2.9k to 6.5k
      characters).
  - **Round 4 of the efficiency loop** (an ordinary letter turn took 14 steps against 3 without the starter):
    - **No pre-check in sessions the user watches:** the "Self-check first" clause (which wrote every answer twice,
      once to `.cache/answer.md`) is offered only in headless runs (`CLAUDE_CODE_ENTRYPOINT` sdk-*) and agents that
      aren't Claude Code; in a Claude Code session the Stop hook checks for free and a later round sends only what
      changed.
    - **Skills read by section:** legal-review (15.4k to 8.2k characters) and research (11.2k to 7.1k) keep their
      shared rules in SKILL.md and each situation in `sections/<letter>.md`, read only when needed.
  - **From a headless field report** (a GUI build, 33.5 minutes, one Stop block):
    - **Numbered rounds are not duplicates:** a helper for "round 3" beside a running "round 2" of the same procedure
      is allowed (it was refused twice); the brief overlap needed for a duplicate rose from 75% to 85%.
    - **Upset detection reads the user's words, not a long paste:** a message over 3,000 characters is judged on its
      start and end (a pasted transcript with two calm lines read as upset).
    - **`deleteOk` in config.json:** globs a plain delete may remove without asking (drafts the user never saw);
      moving or rewriting stays guarded.
    - **`waive` says when it can't help:** a tool-call guard (no-overwrite, protect-originals, the gates) prints "not
      waived" with what does lift it, instead of "waived" and the same denial again.
  - **Fresh hash base and honest bench** (a field report with a CPU profile): the change snapshot now reuses the newest
    snapshot of any session, not an old one named for the run, so a project with about 1,250 pictures no longer
    re-hashes them (the bench read 690 ms for a prompt that takes about 300 ms). The upgrade's speed check runs the
    bench once untimed before timing it.
  - **Tried and reverted: setup in three helpers.** Splitting setup into three helpers in a row made it slower
    (45 to 60 minutes against 17 to 38, one setup timed out at 60) at the same cost: each helper read the setup
    instructions and the project again. Setup runs in one helper again.
  - **Round 2 of the efficiency loop** (after the first measured round: work turns 16x to 8.8x the cost of no starter):
    - **Rules enforced once, at the cheapest level:** the project-rule skill now extends an existing test or check
      first, then a test in the project's suite, then a guard, and only then adds a new check. A "never a percentage
      against zero" complaint about a script that already handled it took about 45 steps: a new check script,
      fixtures, a test, a check, a scenario, three record tables, memory, changelog, status, audit and a pre-check.
    - **No memory note per rule by default** (`memoryOnRuleRequest: false`): the rule is in AGENTS.md, which every
      session of the project loads.
    - **learn-from-upset skill halved** (12.9k to 6.3k characters, same steps and checks): it is read on every
      complaint turn and stays in the context after.
    - **Setup reads less:** AGENTS.md and DIRECTORY.md are already in the context; `requirements.json` (about 60k
      characters) is listed with the new `node tools/hooks/hooks.mjs checks` instead of read whole.
    - **Hooks fast again** (a field report after the upgrade: Stop 447 to 573 ms, pre-tool 58 to 84 ms): helper
      transcripts are read only when a check needs them, and a helper file not written to since the turn began is
      skipped unread.
    - **"any regressions" is no bug report:** the bugfix runbook's bare "regression" trigger now needs a report ("there's
      a regression", "it regressed"); "a regression test" and a question about regressions route nowhere.
    - **Helper work counts everywhere:** the setup gate counts a helper's passing audit, and the data and tracing
      checks read a helper's results and writes (three judges: a setup helper's passing audit was run 4 to 5 more
      times, and figures its script wrote were called made up). The setup helper waits for its own helpers before it
      returns.
- 2026-10-25: Less redundant Stop work (field reports from an adopted project; the owner asked "are you doing things
  twice?").
  - **Records once (REQ records-once):** after the first Stop round, steps that only keep records (the lesson line, the
    changelog, the Finished list, naming the runbook, plan and note records) no longer block again: they go to the
    next turn's notice and its first Stop. Work and truth (tests, the audit, a wrong answer) still block in every round.
    A user watched the same answer four times for one lesson record and said it "looks broken". `"repeatStopRounds":
    true` in `tools/hooks/config.json` brings back blocking in every round.
  - **A lesson in the agent's memory counts:** "Learned (...) → <file>" may name a file outside the project that the
    agent wrote this turn (its memory notes); before, it was asked for three rounds.
  - **A mid-turn `begin` keeps the turn (REQ begin-keeps-turn):** in a session whose prompt hook recorded the turn,
    `hooks.mjs begin` now shows the routing and keeps the turn's start; before, it retook the snapshot, so a security
    report already written counted as unchanged and Stop blocked three times for it (trial round 19).
  - Two trial scenarios that provoke repeated rounds: `np-meals-upset` (a complaint in capitals, then a pause to
    restart) and `np-study-paste` (a 4,000-character pasted transcript, then a frustrated follow-up).
  - **Waivers made in a loop count:** Stop also reads the waive command's own "waived for this turn: <name>" lines, so
    `for n in ...; do ... waive $n ...; done` sticks (six waived steps came back in the next two rounds).
  - **File-only rounds end with one line:** when every step is met by files or runs, the instruction is now "end with
    one line: Answer unchanged; also updated: ..." instead of "end with the whole answer again", which made the user
    hear the answer twice.
  - **One line per check:** a check found by two paths is listed once.
  - **The pause holds for the follow-up:** "why did you tell me it was okay to restart" keeps the pause ("is it okay
    to restart the server?" does not).
  - **Fewer false triggers:** a long message (over 3,000 characters, usually pasted material) routes only on its start
    and end (pasted transcripts set off four unrelated skills); the security review's trigger needs a security use of
    "permission" ("user permissions", "permission to edit"), not "stop asking me for permission".
  - **Deletes the user asked for:** a plain delete of a versioned or delivered file goes ahead when the request asks to
    delete that file or the old files, versions or drafts ("get rid of the old file"); "remove the tulips from the
    list" is still a change inside the file, and moving or rewriting stays blocked.
  - **Quoted prose is no command:** a quoted string of four or more words (a feedback line that says "rm") no longer
    trips the originals guard.
  - Scenarios: `waive:`, `answer-resent` (file-only), `records-once` (two whole-turn flows), `begin-keeps-turn`,
    `pause-stops`, `paste-routing`, `no-overwrite`,
    `protect-originals`.
- 2026-10-25: Website retest (round w2 on 5e117a8): 4 high findings to 0, timed-out setups 3 to 0, setup 60 to 36.5
  minutes. Attack analysis found 1 real hole in 4 sites, now covered:
  - **Stack traces to visitors:** an oversized login post failed before the app's own setup ran, the error page then
    failed too, and Express in development mode sent the stack trace with the server's file paths. `app-standards.md`
    asks for production mode by default, an error page that uses nothing set per request, and a test that oversized,
    malformed and missing requests show no stack trace; the security review forces an error at every stage; a new
    `debug-mode` lead in risky-patterns.mjs.
  - **Security checklist:** a page check catches inline event attributes, `javascript:` links and scripts in SVG files;
    every public form answers "can one person send it 300 times with different values?" (cap per connection and per
    target); owner pages get a session login with sign-out, rate limited rather than locked out.
  - **Honest claims:** "Likely cause: ..., not reproduced here" for an unproven cause (debug-trigger's message), and
    performance budgets are measured on realistic inputs, with a speed claim naming what was measured.
  - **Lessons never loosen a user rule:** skill-learn says a lesson never loosens a rule the user set or a promise made
    to them; a wrong check gets fixed instead (a forced lesson had allowed made-up recipe amounts).
  - **Screenshots:** a newer screenshot identical, byte for byte, to one already opened counts as seen (64 unchanged
    shots were opened again).
  - **Trials:** compare.mjs skips the attack analyses (they wiped the judges' counts).
- 2026-10-25: A pause or restart request ends the turn (field report; the owner was upset).
  - **pause-stops:** when the request, or a message typed during the turn, asks to pause, stop or restart ("get to a
    good pausing point, I will restart the computer", "para aquí, voy a reiniciar"), Stop asks for nothing more: the
    open steps go to the next session (the unresolved-carryover notice), as for a turn out of rounds. A `PAUSE` hint
    says to start nothing new, stop background jobs and helpers, update docs/STATUS.md and only then say it is safe.
    Before, Stop blocked 3 more rounds after the answer had said it was safe to restart, and the work went on.
    Scenarios: `pause-stops`.
- 2026-10-24: Website security trials (round w1: a bakery order form, a photo portfolio with uploads, an RSVP list of
  names and emails, a static recipe site; the user never mentioned security). Security agents attacked each site on a
  local copy: 0 exploitable holes in 4 sites, and the security review ran unasked every time. What they traced back to
  the starter, now fixed:
  - **Going online was never checked:** reviews marked deployment "N/A" or "NOT RUN", and nothing ran it at release.
    `release.md` now checks the deployed site itself the first time it goes online (HTTPS, security headers or the
    static host's headers file, Secure cookies, the settings only safe online, nothing private reachable), and the
    security review's Deployment row says "not online yet" is NOT RUN with that release step, never N/A.
  - **Rules the agents got right without a written rule:** the security review now asks for photo metadata (EXIF
    location) stripped, spreadsheet exports that neutralize formula cells, a way to sign out, Secure cookies by
    default, and a spam trap that browsers' autofill can't set off and that never silently drops a real person.
    `foundation.md` gains rows for files and for going online. Adopt by hand in existing projects.
  - **debug:** list every path that ends in the reported symptom and rule each out; "likely cause" until it is
    reproduced (a "fixed" form complaint never checked the spam-trap path that gives the same symptom).
  - **code-rules:** test files are skipped unless a rule says `"tests": true` (an XSS payload in a test needed a
    waiver every turn).
  - **App gates with quotes:** a gate configured as `node --test "tests/**/*.test.mjs"` now matches its own runs (quotes
    around a word were dropped from the run but not from the gate, and 9 Stop rounds asked for tests that had passed).
  - **Trials:** `run.mjs --freeze` refuses a commit that is not an "Engine proof" commit (its setups ran the whole
    self-test suite and two ran out of time); `judge.mjs` stops when a project has no judge group, and the website
    projects have groups g and h; `secjudge.mjs <round>` writes an attack-analysis prompt per project.
- 2026-10-24: Round 18 fixes (the no-repeat guard's false blocks, and fewer false alarms).
  - **no-repeat after edits:** the after-edit hook records each write (`tools/hooks/state/last-write.json`), and a
    check may run again after one, since Claude Code writes the transcript a moment late (three edits made just before
    a test run were not in it yet).
  - **no-repeat on a first helper:** only helpers whose launch came back count as running; the call being checked is
    already in the transcript and was taken for a duplicate of itself.
  - **hooks-tested:** a tagged self-test run records its result (`tools/hooks/state/selftest-tags.json`), so a pass in
    the background or into a file counts for the checks it covered (98 scenarios were re-run for nothing).
  - **Commands:** quoted text with spaces is an argument, not a command, for every "a command ran" condition, unless it
    is a script handed to a shell (`-c`, `eval`, `-Command`): a reason that named "pip install" set off install-vetted.
  - **Hook messages:** `docs/checks/writing-standards.md` says how a project's own hooks print to the user (one
    headline, short numbered steps, the details in a file). Adopt by hand.
- 2026-10-24: Capitals count, and own helpers' reports are part of the task (the user; a field report).
  - **Capitals for weight:** a run of 3 or more words in capitals ("DO NOT TOUCH THE CONFIG"), or "AGAIN" or "WHY" in
    capitals, inside an otherwise normal message, now reads as upset (learn-from-upset), and "NEVER" or "ALWAYS" in
    capitals as a standing rule (project-rule). Before, only a message almost all in capitals counted. Acronyms
    (API, README) and constant names (MAX_FILE_SIZE) are no emphasis. Scenarios: `caps-weight`.
  - **Own helpers' hand-backs:** a report from a helper this session launched ("[Subagent hand-back]") starts no turn,
    gets no RELAYED, NO RUNBOOK or SHARED STEPS hints, and starts no row in `hooks.mjs cost`. Scenario: `handback`.
  - **cost:** helper tokens are fresh input, cache writes and output; cache reads are shown apart ("1 (186k, 7.6M
    read)"), since each call re-reads the helper's whole context.
  - **FIT at the request:** one trigger alone no longer re-opens a "later - when: <condition>" row unless the request
    shares a word with the condition; two or more triggers still do.
- 2026-10-24: Round 17 fixes.
  - **Tool calls counted once:** newer Claude Code transcripts log each request again in `api-request-*` rows. The
    hooks now skip those rows, so the "update docs/STATUS.md" notice comes after 15 calls, not about 8.
  - **No compound `cd` into the project:** a command that starts with `cd <the project folder> &&` runs without that
    `cd` (changed in place, no denial). About 10 such commands per setup were held for approval and sent again.
  - **A passed pre-check counts at Stop:** a draft that passed `hooks.mjs check --answer-file`, and that the sent answer
    carries, answers the core checks it passed, so rewording it no longer costs a Stop round. Truth and privacy checks
    still read the sent text.
  - **Fewer false alarms:** the knowledge pack's own `outputs/**` guard no longer fails the first audit (the default
    `overwriteWords` read as a change); a check run on a folder holding a sample made this turn proves a check after a
    complaint that did not hold; re-deciding a fit checklist row on a question is neither an unasked edit nor work that
    needs a Finished section.
  - **Security review:** a check that could not run is `NOT RUN (<why>)`, never `FAIL`.
  - **Library releases:** the app pack's `release.md` sends a package for a registry to the `package-release` skill
    (Breaking, Added, Fixed); its triggers now include "on npm" and "to pypi". Adopt by hand in projects that copied
    `release.md`.
  - **Judges:** told that `api-request-*` rows are not calls sent again.
  - Scenarios: `status-handoff`, `cd-dropped`, `instructions-run` (pre-check), `check-sampled`, `security-report`,
    `check-proven` (folder), "a question that only re-decided a fit checklist row".
- 2026-10-24: Nothing twice (efficiency).
  - **No reruns with nothing changed:** a test, build, lint, audit or self-test run again this turn is refused when no
    file was written or edited, and no file-changing command or helper ran, since its last run. A user who asks for
    the repeat ("again", "twice", "otra vez"), a held or failed first run, or `# rerun: <why>` lets it through.
  - **No duplicate work in progress:** a helper launched with nearly the brief of one still running, or a check started
    while the same check runs in the background, is refused ("not a duplicate: <how>" or `# rerun:` lets it through).
  - **Shared steps once:** a request with several tasks gets a `SHARED STEPS` hint, and the plan skill and rule 8 say
    to merge the steps tasks share and do each once. Rule 8 changed: adopt by hand. Scenarios: `no-repeat`,
    `shared-steps`.
- 2026-10-21: Fewer retries and Stop rounds (field report from an adopted project).
  - **Quieter decisions file and notices:** an upgrade with nothing to decide (only the self-tests, which passed)
    updates the last review in `docs/DECISIONS.md` in place when that one also held only the self-tests, instead of
    adding a block each time (a project had 9 such blocks in a row). The host's "[Cross-session idle notice]" and
    "[Cross-session delivery notice]" messages get no hints, like task notifications. Scenarios:
    `upgrade-review-block`, `relay-preview:` (notices).
  - **Field report from an upgraded project:** a version number as the text to write ("change the trip notes file to
    say v2") no longer reads as a request for a new copy, so no-overwrite lets the edit through; "save it as v2" still
    asks for a new file. The audit's no-overwrite hint says which requests the guard lets through. `claim-checked` judges
    a commit, push, publish or send by the tool's own error lines (`error:`, `fatal:`, `[rejected]`, a denial), not by
    any such word in the output: a commit followed by `git log --oneline -1`, whose subject held "denied", and git's
    CRLF warnings, had been read as a failed commit. An upgrade names each check that newly fails in its last line
    and lists it as a review item. Scenarios: `no-overwrite:` (v2), `claim-checked:` (commit output).
    A relayed message routes on its own words: quoted text, code in backticks and command lines are left out (they
    describe or cite work), and a starter upgrade (`starter.mjs update`, "upgrade the engine") routes to the project
    runbook first. A report of fixes had routed to bugfix, a deliverable and two library skills on the words it quoted.
    Scenarios: `relay-route-text`, `relayed turn:` (report of fixes).
  - **Field report 8, first part:** an unfinished upgrade review holds only a turn about the project
    itself (routed to the project runbook, or one that changed `docs/DECISIONS.md`, the engine or its rules); on the
    user's own work the session notice reminds. A project question had become a 45-minute maintenance turn. A review line
    may say "later - when: <moment>", as fit rows may, and the cut-short Stop line no longer reads "not reviewed
    yet.: the decision". New config `newVersionOnly`: globs where every version is a new file whatever the request
    says (only a file this turn created can be fixed), with no "plain request allowed" scenario asked by the audit. A
    message sent to the starter's session this request (SendMessage) counts as reporting to it. Scenarios:
    `upgrade-review:` (own work, later), `no-overwrite:` (newVersionOnly), `claim-checked:` (reported by message).
    An upgraded project now reuses the starter's proven engine run: the "changed engine file" test counted the
    project's old `tools/new-project.mjs`, a starter tool upgrades never refresh, so every upgraded project ran all
    1,100 engine tests (over 10 minutes) on its first self-test run. Only what the proof covers counts now.
    Scenario: `engine-proof` (an old starter tool).
    Routing: a command the user names (in backticks or as a command line) and work reported as done ("fixed and
    pushed:", "already released") no longer route, in typed and relayed messages alike: "fixed and pushed: GitHub
    main" had added the release runbook and its checks, and "upgrade with node tools/starter.mjs update" the
    dependency-update skill. `selfcheck.mjs --route` routes a relayed message the way the prompt hook does. A "note:"
    label in a relayed message ("Separate note: ...") is the sender's aside and sets off no note capture; typed by
    the user it still does. Scenarios: `route:` (done reports), `relayed turn:` (fixes, note label).
  - **Field report 8 (headless turns):**
    - A runbook or skill whose only change is its `triggers:` line (new routing words, the same procedure) sets off
      no `filesChanged` check. The turn-start snapshot keeps a hash of each one without that line; git is the
      fallback. A project question had taught a runbook its Spanish wording, and the project's sweeps for changed
      runbooks held the turn for 30 minutes. Scenario: `routing-only`.
    - A headless run's first prompt keeps its turn record and snapshot while the host's transcript (named after the
      session) is still empty, so Stop no longer falls back to an older shared one. Scenario: `state-no-transcript`.
    - The edit that finds a turn past 15 tool calls, with `docs/STATUS.md` unchanged, says once: "Before you answer:
      ... update docs/STATUS.md". Agents had skipped it in 3 of 6 turns. Scenario: `status-handoff`.
    - `protect-originals` reads only the parts of a command that run in the project: after a `cd` (chdir,
      Set-Location, pushd) to a folder outside it, `rm -rf items/...` in a scratch copy is allowed, unless the
      project is named by its absolute path. Scenarios: `protect-originals:` (cd).
    - The Spanish label hint lists only the labels of the checks this turn is held to (about 300 characters on a
      plain question, not 1,200). With the project's own hooks (`externalHooks`), the CHECKS line says a runbook
      they name counts for runbook-exists. Scenarios: `answer-language:`, `check-preview:` (own hooks).
    - A session's first prompt always starts a new turn (only its session start showed anything yet, or nothing of
      its own was recorded), and a continued turn extends only the session's own record. A headless first prompt had
      been taken for the middle of a turn and extended the shared record setup left three days earlier, so its turn
      "began" then and the STATUS.md reminder never came. A compaction's session start still continues the turn.
      Scenario: `state-no-transcript` (a new turn).
    - Words joined by a hyphen in a trigger are a phrase: "on-call" (whose "on" is a small word) no longer matches
      "tool calls". Scenario: `route:` (hyphenated trigger).
    - A relayed message routes only on its sentences that ask for something (one that starts with a task verb, or
      "please", "can you", "I need you to", "por favor"); reports and explanations route nothing, a phrase of common
      words in it never does, and it gets no FIT hint (another session's report is no evidence the user needs a
      skill). A bare "upgrade when ..." in it is the starter upgrade. A report of fixes had routed to a refresh
      runbook on "had changed since then", and named skills and "checked against a copy" brought two FIT hints.
      Scenario: `relay-request-text`.
    - A `run_in_background` gate run counts by its output file once its notice arrives, also when the host records
      the notice as a queued attachment rather than a user message. A passing hooks self-test had been read as empty
      output and blocked the turn. Scenarios: `bg-moved:` (queued attachment).
    - **The starter's improvement loop** (starter only; new projects get none of it): `tools/starter/runbooks/improvement-loop.md`
      with `tools/starter/trials/` (`run.mjs` runs a round of eight real new projects on a frozen copy, `judge.mjs`
      writes the blind judges' prompts, `compare.mjs` gives the verdict against each project's baseline and the
      previous round and keeps the history in `rounds.json`, rounds v2 to v8 included). The audit sweep "improvement
      loop is current" warns when the last judged round was worse or the engine changed since it; in the starter, an
      answer that says a change only makes projects better needs a compare.mjs NOT WORSE verdict that turn
      (`claim-checked`). Stop blocks are counted from the trial records: the first round's judges had not counted
      them. Scenarios: `improvement-loop`, `claim-checked:` (improvement claims).
    - **Efficiency** (measured on round 8: hook text grew from about 4,500 to 5,600 characters per turn since the
      baseline, while turns got about twice as fast and slightly cheaper):
      - A helper launched without the brief line gets it added in front of its prompt (the host's `updatedInput`)
        instead of a denial: each denial cost a full extra round that resent the whole prompt. The user's permission
        settings still decide the call. Scenarios: `sub-agent brief` (added in place).
      - The `[rules]` digest is left out of the prompts of a session whose start gave the whole session checklist
        (about 230 characters a turn). Scenario: `prompt-digest`.
      - The Stop block's closing paragraph is about half as long (it came with every block and was two thirds of all
        Stop text).
      - The improvement loop measures efficiency: each trial turn records the hook text, denied tool calls and Stop
        blocks it cost; compare.mjs calls a round WORSE for a costlier work turn or setup, more denials or more hook
        text per turn; the judges report waste with no benefit as area "efficiency". Scenario: `improvement-loop`.
    - **The starter improves its own development**: maintainer runbooks in `tools/starter/runbooks/`
      (`improvement-loop`, `field-report`) route like any runbook, only in the starter, and are never copied into a
      project or made into skills. Another session's message routes to `field-report` when nothing else fits. The
      user had asked for repeated testing several times before it became a procedure. Scenarios: `starter-runbooks:`.
    - **Less hook text per turn**: a resumed session that was already shown the session checklist gets one line
      instead of the whole checklist again (2,300 characters on every resumed turn, the largest part of the hook
      text, which had risen a quarter above the first round's). New sessions and compactions still get it whole.
      Scenario: `session-checklist`.
    - **Field report (df95418):** the user's language comes from their own words, not a pasted list or block (an
      English question with a pasted Spanish item list got Spanish hints); `starter.mjs feedback --help` prints the
      usage instead of saving "--help" (`feedback-usage`); the fallback runbook and runbook-create check an unfamiliar
      key word before building a runbook or trigger around it; learn-from-upset undoes what a misreading created.
    - **More round 9 findings fixed:** a recorded whole self-test pass after a change counts for the changed checks'
      scenarios too (setup ran them twice); a whole note folder in a skill's check (`Baking/**`) no longer makes
      writing a note count as that skill's report (a dictated note set off research and citation checks).
    - **selfcheck**: standalone tests gated by tag now run with `--tags` (they sat inside the full-run-only block).
    - **The starter is pushed only after a passing self-test**: its pre-push hook refuses unless the last whole self-test
      passed on exactly the files it tests now (`starter-tested`). A push had run in the same command as a failing run.
    - **Cited web sources are pages a person can open** (round 12, a high finding): an article's DOI link counts as opened
      when that DOI was read by any route (an API query, a mirror); an API or data address in the sources is flagged
      with the page to cite instead; research-cited's message asks for that page. An agent had swapped working doi.org
      links for the API addresses it fetched, and the user could not open half of them. Scenarios: `answer-traced: a
      DOI link cited`, `answer-traced: the API address itself`.
    - **Missing tools are named, not retried** (round 12): a held program run another way is denied with whether it is
      installed at all ("not on PATH: say it is not installed, not that it only needs approval"); a gate whose program
      is not on this machine asks only for the NOT VERIFIED line, with no refused attempt needed first. The Go answers had
      said Go only needed approval, and later turns ran `go test` again and again. Scenarios: `permission-respected: a
      held program that is not installed`, `app-test-pass: a gate whose program is not installed, never tried`.
    - **Round 12 findings fixed:** "hasn't been sent" counts as saying a draft was not sent (the user got an answer
      twice); the project-scenarios template shows `has: [...]` (it said `says`), and a string where a list belongs no
      longer crashes the self-tests; `starter.mjs link` refuses a starter in the temp folder and points to `keep`;
      text a heredoc writes into a file is no outward command ("git push" in a decision note was blocked); budget
      scripts and the perf runbook time the real command end to end, not an inner function; trial records count
      waivers given with the waive command. Scenarios: `correspondence: "hasn't been sent"`, `outward-gate: a heredoc`,
      `starter: refuses to link to a starter in the temp folder`.
    - **More round 12 findings fixed:** the security summary's "no open FAIL" test is case-sensitive (a check pattern
      may start with `(?c)`), so "rolled back if the smoke test fails" is no open FAIL; a heredoc that only writes
      "npm publish" into a file is no publish; a question that only asks ("which payment provider should we use?")
      makes no skill mandatory, so a research turn is not held to the security review; the screenshot check takes a
      later run's copy of the same shot as the one to look at, so it no longer asks for an older run's folder; an edit
      to the generated `engine-checks.json` says where its source is. Scenarios: `security-report: the plain word
      "fails"`, `publish-gate: a heredoc`, `event-hint: a question that only asks`, `gui-review-loop: two runs`,
      `generated-file`.
    - **A relayed message makes a skill mandatory only by what it asks** (field report): the sentences of another
      session's message that ask for something are matched, not the commands it names or quotes. An upgrade notice that
      named "npm publish" as a fixed false alarm had made the security review mandatory. Scenarios: `relayed turn: a
      notice that only names "npm publish"`.
    - **Field report (4566b73):** the publish gate ignores a quoted argument such as a waive reason
      ("bash -c '...'" still counts); after a round that needs a sentence or two of the answer changed, the answer may
      end with `Corrected: "<old>" -> "<new>"` lines, checked on the earlier answer with them applied, instead of the
      whole answer again; a "(judgment: why)" Done when item in any changed runbook file, plain bullet or checkbox,
      meets requirement-enforced; in a relayed message one trigger word alone suggests no skill, and RECALL skips
      relayed messages and time words ("what took so long" recalled a clone request); a short "is it done?" gets a
      STATUS QUESTION hint to lead with the status; `node tools/hooks/hooks.mjs cost [--last N]` prints each recent
      request's minutes, tool calls, tokens (fresh, cache read, cache write, output) and helper tokens. Scenarios:
      `publish-gate: a waive reason`, `answer-resent: a sentence fix`, `requirement-enforced: a "(judgment: why)"`,
      `relayed turn: one status word`, `recall: "what took so long"`, `status-first:`, `cost:`.
    - **Push checks see real pushes only** (field report): "git stash push" is local, and a quoted argument that only
      names a push (a feedback line) runs nothing, for the outward gate, the protected-branch, .gitignore and
      attribution checks alike; "git -C <dir> push" and "bash -c '...'" still count. A relayed message makes no skill
      mandatory at all (a line starting "Publish gate:" did); the Stop checks still hold what the turn changes or runs.
      Scenarios: `outward-gate: "git stash push`, `outward-gate: a feedback line`, `relayed turn: a line that starts`.
- 2026-10-24: Round 16 findings fixed (verdict NOT WORSE: no high, mediums 12, v15 20; setup median 13 min).
  - **Self-test copies are fresh again on Windows:** the reused scenario copy (round 13) let a file deleted and made
    again under the same name keep its old creation time (NTFS tunnelling), so "new check" scenarios read the last
    scenario's file; six check-proven scenarios failed in tag mode, and the full run had passed only by its order.
    Other systems keep the reuse.
  - **Setup with "don't ask me":** until autonomy is set, the setup gate says to set it and decide, not to ask the
    user and wait. Scenario: `setup-interview: the user said not to ask`.
  - **check-proven counts a sample made by a shell command** (a redirect, tee, writeFileSync, Out-File) like one made
    with the Write tool. Scenario: `check-proven: a sample ... written by a shell command`.
  - **Fewer false alarms:** knowledge-source-trigger accepts notes made by the notes-vault skill (dictated) and the
    manuscript skill (from the book's chapters); verification-report takes "How I checked it" and similar headings;
    the audit's reference sweep knows a linked starter's library files. Scenarios: `knowledge-source-trigger: a note
    the user dictated`, `verification-report: a "How I checked it" heading`.
- 2026-10-24: Round 15 findings fixed (verdict WORSE on mediums: 20, v14 12; no high; setup median 14.4 min).
  - **The self-test keeps a project's own copy of an enabled library skill** in the base its own scenarios run in, so
    triggers it added still route there (three rounds lost setup minutes to this); the engine's fixtures keep the
    shipped copies. Checked on round 15's novel project with its workaround removed.
  - **Citation checks:** an English copy of a label line carries no citation markers, so "**Done:** ... [1]" above the
    Sources list no longer fails research-cited (it had sent agents into the engine's code twice); a fetch answered by a
    redirect, an error or a block counts as no read of that link. Scenarios: `research-cited: a bold "**Done:**" line`,
    `answer-traced: a link whose only fetch got a redirect back`.
  - **Inline script code is no command:** `node -e` / `python -c` code that only holds "npm test" or a summary command
    as text (on one line or several) meets no gate and sets off no check. Scenario: `app-test-pass: a multi-line node -e`.
  - **A passed draft is judged on its own**, as the pre-check judged it, so a check on every figure no longer reads
    numbers from the turn's progress notes.
  - **Fewer false alarms and less ceremony:** protect-originals means the folder at the project root, not a "sources"
    folder nested in test fixtures; the fit checklist decides code tools "later" when the only code is a helper script
    under tools/ or scripts/; `packs.mjs configure app` warns when a gate's program is not installed; `starter.mjs link`
    warns about a starter in the temp folder even when allowed. Scenarios: `protect-originals: a "sources" folder nested
    elsewhere`, `fit: with no code files (a helper script under tools/ is none)`.
  - **Runbooks:** a gui fix round re-shoots only what the fix could change, and a preview server listens on 127.0.0.1
    and is stopped; a bugfix names any other behaviour change as a change; a feature documents every new option.
- 2026-10-24: Round 14 findings fixed (verdict NOT WORSE: setup median 13 min, v13 20.7; mediums 12, v13 13; one high).
  - **The app test gate watches test files** (the high): a changed test file anywhere asks for the test run, also in
    projects configured before (the engine widens their gate when it checks). A node:test file under tools/ had broken
    `npm test`, and so `npm publish`, with nothing asking for a run. Scenario: `app-test-pass: only a test file changed`.
  - **A draft that passed `hooks.mjs check` counts:** when the sent answer rewords it (and still carries most of it), the
    labels in the checked draft count, so a Stop round no longer exists only to put "Reconciled:" or "SHIP" back.
    Scenarios: `answer-resent: a draft that passed the pre-check`.
  - **review-verdict reads the report:** a review in docs/reviews/ changed this turn whose verdict line says SHIP or
    APPROVE(D) meets it; check patterns on changed content take the `(?c)` prefix too. Scenarios: `review-verdict: the
    review report changed this turn`.
  - **Fewer false alarms:** a Grep run on the cited file counts as opening it (answer-traced); a Python decorator or a
    file name after an @ is no email address and the public resolvers tests use (8.8.8.8, 1.1.1.1) are no personal IP;
    generated folders committed to git (`_site/`, `.next/`, `__pycache__/`, not `dist/`) are named by gitignore-ready.
 A heading no
  release shipped, with its text, moves under "## Project lessons" one level down, and the upgrade review names it
  ("sections: ... the section "<heading>" this project added moved ..."). An adopted project's "### §11b Performance" in
  project.md had been dropped while the upgrade said only "kept the project's triggers and lessons". Trial check: "an
  upgrade keeps a section the project added to an engine runbook".
- 2026-10-24: Round 13 findings fixed (verdict WORSE on setup time: median 20.7 min, v12 15.7; mediums 13, v12 15).
  - **Faster self-tests:** each scenario runner reuses one copy of the fixture base and puts back only what the
    scenario touched, instead of copying the whole base per scenario (a tag run went from 37 s to 23 s; the full
    starter run passes all 1,243 tests). `SELFCHECK_FRESH=1` copies afresh.
  - **Setup gate reads a redirected audit:** `audit.mjs --setup > file` counts when the file says "audit: PASS"; three
    setups had run the 1.5 to 3 minute audit again for the gate. Scenarios: `setup-gate: a passing audit whose output
    went into a file`.
  - **A false "checked automatically" in a complaint turn is caught again:** "you made a new note without linking it"
    is a complaint and "every new note links to ..." a standing rule, so the claim is held to a covering check.
    Scenario: `claim-checked: "you made a new note without linking it"`.
  - **Fewer false alarms:** "Why it happened:", "Cause:" and Spanish "Causa:" state a root cause; reading feature.md
    for setup's dry run arms none of its checks, even when setup built the app; `packs.mjs configure app` refuses a
    version file that holds no version (go.mod) and takes `--version-file none`; the decisions record may describe the
    project in the user's words. Scenarios: `debug-root-cause: "Why it happened:"`, `runbook-look: setup that opened
    feature.md for its dry run and built the app`, `version-bump: configure refuses`, `no-verbatim-examples: the
    decisions record`.
  - **research-cited says why:** a marker with no Sources line, a link nothing opened, a file written this turn, or the
    numbered form it needs. Scenarios: `research-cited: [2] used in the text`, `research-cited: unnumbered links`.
  - **Stop text:** the re-send instruction no longer claims the user never saw the earlier version (in a terminal they
    do); it says the last message may be the only one read.
  - **Library:** correspondence letters to people the user keeps dealing with have no "Re:" line or "I am writing to"
    opener, name a clause in plain words, and a tone check is tested on a warm letter; data-pipeline registers a
    project script that validates its own inputs as meeting `pipeline-schema-checked`.
    - **Helpers on an old scope are named when the user changes it** (field report): a message from the user that
      arrives while helpers launched before it still run gets a one-time heads-up with the next call, naming them, to
      stop the ones it makes obsolete before new work. Three helpers had judged a free-only plan after the user allowed
      paid options, and 447,423 tokens were thrown away. The plan skill now orders work for cost: expensive repeated steps
      (judging rounds, fan-outs, full runs) run once on the final inputs, research first, a fan-out's size is written
      in the plan. Scenarios: `scope-change:`.
    - **Round 11 findings fixed:** the setup gate counts the interview answers written by the same command that
      installs (it had denied that very command); when the audit's self-tests fail only on the project's own tests, it
      names the targeted `selfcheck.mjs --tags` rerun and says to run the audit once at the end (setups reran a 2 to 5
      minute audit 3 or 4 times); the verification report accepts plain wording ("Tests", "Against the real tool");
      `npm --prefix <the project> test` counts as `npm test`; answer-traced accepts rounded forms of traced figures and
      totals of figures in one tool result (field report). Scenarios: `setup-interview: one command`,
      `verification-report: plain wording`, `app-test-pass: npm --prefix`, `answer-traced: rounded forms`.
    - **Spanish requests route like English ones**: a Spanish request is routed with its common task words in English
      added (routing only, the way answer labels already work), so runbooks need no Spanish triggers. "configura este
      proyecto" routes to the project runbook, and "agrega una página de índice" to the feature runbook. The autonomy
      hint knows Spanish ("decide todo tú", "no me preguntes nada") and the plain English "do not ask me". Spanish
      complaints and "..., always" requirements (in both languages) set off the upset handling and the rule request.
      "add an index page" now routes to the feature runbook too. A Spanish setup request had got no route and no
      autonomy hint, so the setup gate asked it questions the user had said not to ask. Scenarios: `upset-es`,
      `autonomy-hint: a Spanish setup request`, `route: a Spanish request routes like its English wording`.
    - **Trials**: the account's usage limit voids a trial; the round stops, and compare and judge skip void records
      (round v10 had sent all its turns into the limit and had them judged).
    - **Helpers the host runs in the background by itself are waited on** (field report): an Agent call with no
      background flag whose result says "Async agent launched" counts as running until its notice arrives, so
      parallel-trigger no longer asks for merged results that cannot exist yet. Scenario: `parallel-trigger: helpers
      launched async`. Tests and trials also clear the outer Claude Code session from their environment.
    - **Round 9 judges' findings fixed:**
      - A program held for the user's approval is not run another way (a node, python or shell one-liner): the
        call is denied with the honest "NOT VERIFIED" line to write instead. A Go project had run `go test` through
        node's spawnSync after it was held. Scenarios: `permission-respected:`.
      - skill-learn asks for no lesson when the failing check is one the answer's text alone meets (a report table,
        a verification line). A missing table had "lessons" about rewording answers written into a security runbook.
        Scenario: `skill-learn: only an answer-text check`.
      - Under autonomy auto, the feature runbook decides (safest choice, an `Assumed:` line) instead of asking; a
        labeled "Question for you:" or a closing "reply with a number" counts as asking, and an option's mention of a
        password no longer exempts it. A Flask turn built nothing and waited on a four-option question. Scenarios:
        `autonomy-decide:`.
      - Turning the project's git hooks on and reading the setting back is no longer denied as re-pointing them
        (two setups were). Scenarios: `git-safety: turning the project's git hooks on`.
      - The visual review line passes in the user's own Spanish ("está bien después de 2 rondas", "correcta a la
        primera") and in English "on the first try"; Spanish users are asked for Spanish progress updates too.
      - A passing self-check says to send the checked text as it stands: answers that passed were shortened when sent
        and blocked at the end, so the whole answer went out twice.
      - The feature review waits for the reviewer's verdict in the same turn, instead of ending with "I'll finish
        once it comes back".
    - **Sessions that bypass the engine are caught** (found by running the engine on the starter's own work): a
      commit or push from a Claude Code session that this project's hooks never saw (it was started in another
      folder) is refused, with the way through (`git-guard`, both hooks). `hooks.mjs begin` from such a session records
      the request under that session, with its transcript, so `check` sees the turn's real tool calls. A person's
      commit never meets it; test harnesses turn it off (`ANZUELO_SESSION_GATE=off`). Scenario: `engine-bypassed`.
    - **Long sessions keep their history**: hooks read a transcript from its end, in a window that grows until it
      holds the turn's prompt. A 568 MB transcript had been over the largest string a file can be read into, so every
      hook silently lost the session's tool calls, and every hook call parsed the whole file. Scenario:
      `transcript-tail`.
    - The starter keeps a dogfood log (`tools/starter/dogfood-log.md`): what its engine gets wrong while governing
      its own development, handled like a field report.
    - A test, check or sweep run that starts while another one still runs in the background gets a heads-up with the
      call (a notice, not a denial): two at once can see each other's temporary files and fail falsely (a field
      report: a sweep failed twice that way, and passed alone). Scenarios: `overlap:`.
    - Spanish debugging requests get the debug skill ("depura", "por qué falla", "las pruebas fallan", "causa raíz",
      "no compila"), and "depura" counts as a Spanish task. Scenarios: `route:` (Spanish debug).
    **Breaking for project hooks:** bookkeeping lines (`Playbook:`, `Skill:`, `Worth it:`, `Proven:`, `Learned`) may
    be in `.cache/turn-notes.md` written this turn instead of the answer; a project hook that asks for them in the
    answer should also accept that file. The upgrade-review Stop step no longer fires on the user's own work turns.
  - **Guards let the agent fix its own fresh drafts, and existing checks stop false alarms (trials of 8 new projects,
    round 8):** the no-overwrite and protect-originals guards let an edit through to a file the turn itself created
    (missing from the turn-start snapshot and from git, or created by the agent's own Write this turn): two agents had
    been denied the fix of a draft written seconds earlier, one shipped a stiff line and one got past the guard with
    rm and Write. Deleting or moving away a delivered output that was there at the turn start (rm, del, Remove-Item,
    mv, a wildcard or its folder) is now denied like writing over it, unless the request names it; an original named
    by a pattern alone ("**/*.pdf") gets the same. `upset-learned` accepts a disproved complaint in plain words with
    "Learned (none)" in the notes ("none of them makes him left-handed", "nothing was missing", "no encontré ...") and
    the notes' own "didn't hold", which it had missed, so no "the complaint doesn't hold:" pasted into every bullet;
    its step no longer sets off "Then:" changelog and audit steps in a turn that changed no file. `check-proven` judges
    every "Proven:"/"Probado:" line, notes first, reads a label's text from the list items under it, and its message
    gives the line filled in from the runs it saw: a Spanish answer's own "**Probado:**" heading had hidden the full
    notes line for 3 rounds. `security-code` no longer reads a RegExp `.exec(` or a Python `re` call as code
    execution (bare exec, eval, child_process, subprocess and os.system still fire). The fit checklist drops the
    8-word minimum: a short reason that names something about the item passes ("Not a game: a terminal photo
    renamer."), and `fit.mjs check`/`decide` note 5 or more reasons that end with the same tail (an agent had glued
    one 11-word tail onto 31 rows). `no-verbatim-examples` lets docs/BRIEF.md, docs/STATUS.md and README.md describe
    the project in the sentence where the user said what it is ("It is my Obsidian vault of notes on ..."); a sample
    sentence is still caught. App gates read a run written with the project's full path, quotes or ".exe" as the
    gate, and no longer read `packs.mjs configure app --test "<gate>"` as a run, so a refused test run gets the
    one honest line in round 1 (a Flask setup was asked to run refused tests 3 rounds); "none of the tests have run"
    counts as that line. `security-report` accepts open items said plainly ("two items are open, both in
    docs/STATUS.md") with the report file named. `claim-checked` (git) no longer reads "git has no name or email set"
    as a claim about history, the research skill's question triggers ("what are the options") need their question
    word first, so "add a --dry-run option that only prints what would be renamed" stays a feature, and
    `parallel-trigger` counts only sub-agents that ran at the same time, not reviews run one after another.
    **Breaking for project hooks:** `toolCount` in requirements.json takes `"overlap": true`; the upset-learned and
    check-proven messages changed their wording. Scenarios: `no-overwrite:` (own draft, rm, Remove-Item, named),
    `protect-originals:` (pattern, own file), `upset-learned:` (plain words, Spanish), `stop-follow-on:` (no file
    changed), `check-proven:` (Probado label), `security-code:` (regex exec), `fit-reasons`, `no-verbatim-examples:`
    (brief), `app-test-pass:` (configure line, full path), `security-report:` (plain open items), `claim-checked:`
    (git identity), `route:` (option), `parallel-trigger:` (one after another).
  - **What the answer tells the user to do or believe is backed by this turn (trials of 8 new projects, round 8):**
    new core check `instructions-run`. A script, launcher or command the answer tells the user to run, double-click or
    open ("run", "double-click", "ejecuta", "doble clic"), that this turn made or changed (a `.ps1`, `.bat`, `.cmd`,
    `.sh` or `.py`, an npm script, a make target), ran here the way the user is told to and worked, or the answer names
    it in "NOT VERIFIED: <what> - <why>"; a refused run asks once for that line. "powershell" is Windows PowerShell
    5.1, so a pwsh run does not count for it. A setup answer had said to run `powershell ... scripts\setup.ps1`, never
    run, whose `Out-File -Encoding utf8NoBOM` 5.1 rejects, so `.env` was never made. A `.ps1` written with what only
    PowerShell 7 has (`-Encoding utf8NoBOM`, `??`, `?.`, the ternary, `&&` and `||`) is named at the edit, and
    writing-standards, the install-update and app-foundation runbooks list the 5.1 pitfalls. `claim-checked` now holds
    "already enforced" claims ("checked automatically", "can't get through", "se comprueba sola") to a check that runs
    on its own over the files the claim is about and, in complaint turns, was shown failing on the case this turn
    (its scenarios passing, or "Proven: fails on ..." with a failing run); a vault answer had promised that about notes
    no check read. `note-linked` covers the folders in `"knowledgeDirs"` (templates and attachments aside), so the
    obsidian skill's "(hook: note-linked)" holds for a vault. `claim-checked` also flags a test "done by hand" (the
    Spanish labels hint had offered "Lo probé a mano:" for an automated browser run). A gate refused while its program
    is not installed (a PATH scan) says so, and an answer that blames approval for it is asked for the true reason; the
    app gates' message says to check. The library `data-computed` checks (new requirement key `answerFiguresComputed`)
    ask that each figure appears in what a run printed or follows from the answer's other figures, that the script
    the "How it was computed" line names ran, that "(calculated: ...)" arithmetic is right, and that a list of worked
    sums gives the figures it stands for (a "315" for 315 + 125 had passed). `answer-traced` flags a claim cited to a
    project file (`[n]` footnotes, "from <file>") in the answer, notes or `outputs/` when under a third of its key words
    are in that file (an inference after "so" or ":" is judged on its own); "my guess:" or "inferido:" marks it.
    Measured on the round 6 to 8 transcripts: 147 cited claims, 5 flags (3 true, 2 borderline); 8 launcher instructions,
    6 flags, all launchers never run nor marked; 8 "How it was computed" answers, 1 flag (the real error). The legal
    triggers cover rent increases, notices, evictions, deposits, dismissals and terminations in English and Spanish,
    and a "notice banner" stays quiet; the legal-review skill gains a section for letters with legal effect.
    Scenarios: `instructions-run:` (12), `claim-checked:` (enforced, by hand), `note-linked:` (vault), `app-test-pass:`
    (not installed), `data-computed:` (sums, figures, calculated), `answer-traced:` (cited claims), trigger cases.
  - **Gates that can't run ask once for an honest line, and Stop reads labels and command lines as written (trials of
    8 new projects, round 7):** a test, build or lint gate (and the audit and hook self-tests) whose last try the
    permission system refused outright, or whose tool is missing (the program, or a dependency whose install was
    refused or failed), now asks in round 1 for "NOT VERIFIED: <what> - <why it couldn't run>" instead of another run,
    and that line, or a sentence saying the tests never ran, meets it. A gate never tried counts as refused when its
    program ("go", or the module in "python -m pytest") was refused this turn and never ran. Two Go and Flask turns had
    spent Stop rounds 2 and 3 re-asking for refused commands, so each showed the same answer three times. A command
    refused for its form (several commands in one line, a cd with a redirect) still asks for a plain rerun. A refused
    run is no failed test, so `debug-trigger` no longer forces "Root cause: the feature did not exist yet" into a
    feature answer, and the tool's own "malformed syntax" refusals count as never run. Every label a check reads now
    meets it in **bold**, *italic*, __bold__ and as a list item (`inEnglish` adds a plain copy of each label line,
    after a marker that the writing and closing-question checks cut off): "**Revisión visual:** correcta tras 5
    rondas" had been blocked four times and pushed out of its list. A gate run inside a longer line counts where its own
    result shows: the rest of its line joined by && and the line passed, or an `echo <text>` after it in its && chain
    printed that text ("tests | tail; build && echo BUILD-OK" was asked for again). A waiver command is no run of any
    project check, so a check whose pattern names a script no longer reads a waiver's reason as its last run.
    `check-proven` counts a failing run on a sample written this turn when the answer says the problem the user named
    is not in the project ("No encontré texto en inglés"), and its message shows runs without their leading "cd ... &&".
    A security review carried out (its report written, or its sweep run without editing the sweep) counts even when the
    same turn edited the skill's triggers. **Breaking for project hooks:** a refused gate's Stop step reads "Say what
    was NOT VERIFIED and why", and new app gates' messages no longer say "as its own command". Scenarios:
    `app-test-pass:` (refused, form, missing tool, install refused, chains), `debug-trigger:` (refused), `toolPassed:`
    (waiver), `hooks-tested:` (refused), `review-evidence:` (maintained), `check-proven:` (not found),
    `gui-review-report:` (bold list item), `label-format`.
  - **Checks written for a project are proven on its real files, complaints are checked part by part, and the
    bookkeeping leaves the answer (trials of 8 new projects, round 7):** `check-proven` now asks a new blocking check
    (one `tools/hooks/requirements.json` runs) to pass on every existing file it governs, as the last commit has them
    (its entries' "when"/"require" globs, or the folder and file type it was run on), apart from the files it failed on
    as the complained-about state: a passing run over all of them (named, a folder, a glob, or no file for its whole
    scope), and the count in the `Proven:` line ("passes on all 14 existing posts"). The line also names an edge case
    made from the project's own words ("an edge case: ..."; Spanish "caso límite"). A Spanish-only check had flagged
    "total", "error" and "menu", and a tenant-tone check blocked a warm letter to a flat in a building named "... Court";
    both passed 2 hand-picked samples, and the Spanish one used the skill's own example words as its edge case. A
    complaint the answer shows does not hold has no complained-about state, so a failing sample proves the check.
    The learn-from-upset and project-rule skills list the traps (proper nouns and addresses, words shared across
    languages, quoted text, a text that must use a flagged term), say to check each part of a complaint on its own
    (a cold letter was conceded as "threatening" too, after "You're right" was typed before the draft was opened),
    and say that an exception promised to the user must be in the check. `upset-learned` accepts `Learned (none): the
    complaint didn't hold - <evidence>` when the answer shows it does not hold, and `skill-learn` then asks no lesson
    for the checks the complaint set off; `rule-request` counts an existing check that runs the test or check script
    this turn extended (or "hook: <its tag>"), so no duplicate check is added. New turn notes: the lines the checks
    read but the user can't act on (`Playbook:`, `Skill:`, `Worth it:`, `Proven:`, `Learned (...)`) go into
    `.cache/turn-notes.md`, written this turn, which the checks read like the answer, with or without hooks (the same
    lines in the answer still count). `answer-traced` counts a figure that is the sum, difference or percent change of
    two traced figures in the same answer (213 = 692 - 479 was flagged), and a file the agent wrote this turn as opened
    (its own text still never traces facts written into the knowledge base); `answerCites` counts a path a command
    printed as it read it. Setup no longer follows a runbook the setup itself wrote just because the setup request
    routes to it, and `deliverable-trigger` ignores `outputs/README.md` and `.gitkeep` files. The setup gate refuses a
    `docs/foundation.md` "Who may do what" row that gives a destructive or sensitive action to anyone but the owner
    without the user's recorded decision; the security-review skill marks such a grant FAIL -> open, and the
    app-foundation runbook and foundation template say a role the user didn't name gets no such rights (a bookshop
    API invented a delete-capable "manager" in three rounds, and the review passed it). The runbook-create skill says
    to make a check's `when` fire on the work itself (`toolRan`), not on the runbook being opened. Scenarios:
    `check-proven:` (existing files blocked, covered, folder loop, no count, no edge case, disproved complaint),
    `upset-learned:` (Learned none, both ways), `turn-notes:` (runbook and lesson in notes, stale notes, Worth it),
    `rule-request:` (existing check runs the test, both ways), `skill-learn:` (disproved complaint, both ways),
    `answer-traced:` (difference, made-up figure, note written this turn, both ways), `answer-cites:` (printed path,
    both ways), `setup:` (runbook written in setup, both ways), `deliverable-trigger:` (README, report) and the
    `setup-gate` permissions test. Adopt by hand: AGENTS.md step 0.2, rules 3 and 7, docs/checks/session-checklist.md,
    docs/checks/writing-standards.md, HOW-TO-USE.md, the learn-from-upset, project-rule, runbook-create, research,
    skill-finder, project-bootstrap and security-review skills, the app pack's app-foundation runbook and foundation
    template.
  - **Setup no longer waits for the whole engine suite, and the writing and citation checks read letters and paths
    right (trials of 8 new projects, round 6):** a passing whole self-test run in the starter writes
    `tools/hooks/engine-proof.json`, the hash of the engine as its tests saw it, and new-project and upgrades copy it.
    In a project whose engine hashes the same (no engine file changed, and a linked starter that proved the same
    engine), the self-tests reuse that run and add only the project's own scenarios and checks and a smoke set: one
    scenario per check family, the ones that touch the platform (git, wiring, links, background jobs, shell
    validators) and every 40th. A fresh project's `audit.mjs --setup` went from 300 s to about 100 s on the same
    machine; setups had waited 12 to 16 minutes under load. `--full` and `--deep` (and `trial.mjs --deep`) run
    everything, and the starter always does. SETUP-PROMPT.md phase 5 now says to run the setup audit in the
    foreground and wait for it in the same turn. The writing check keeps courtesy ("I hope you", "feel free to") in a
    letter, email or message: a draft in a drafts, letters, emails or messages folder, or the lines from a greeting to
    a sign-off (new `courtesy` setting; writing-standards.md says warmth in a letter is not filler), after a tenant
    letter lost its only warm line and the user called it robotic. `answerCites` read a path in backticks with its
    backticks, so "(from `exports/2026-W42.csv`)" never counted although the message offered that form; fixed, and a
    new test makes every example a check's message quotes meet that check. Setup false alarms: a skill only read
    during setup is not a skill used (no draft asked of the correspondence skill), `scope-separate` skips the setup
    turn also when it ends by deleting SETUP-PROMPT.md, a command the tool refused never counts as a run of a gate,
    `hooks-tested` counts the self-tests' own record of a pass after the last change (a run inside `audit --setup`
    with its output in a file) and no longer takes a grep of selfcheck.mjs for a run, and `deliverable-file` accepts
    `profiles/<name>/outputs/`. Scenarios: `answer-cites:` (backticks), `plain-writing:` (letters), `deliverable-file:`,
    `setup-turn:`, `audit-run:` (refused), `hooks-tested:` (record, grep), `message-example`, `engine-proof`. Adopt by
    hand: SETUP-PROMPT.md phase 5 (a new project gets it).
  - **Honest proofs count, and complaints are answered without a forced concession (trials of 8 new projects, round
    6):** `check-proven` counts a failing run on a copy saved before the fix (`cp`, `copy`, `Copy-Item`, or a copy of
    such a copy), on a version from git (`git show <rev>:<file> > <copy>`), or on a sample file holding text the fix
    took out, besides a run before the fix. A script that `tools/hooks/requirements.json` runs is a check whatever its
    name (a check named in the user's language was missed), and a test file's name without its test affix names its
    script. Its message now says which runs it saw (FAIL on the earlier state, FAIL after the fix, PASS) and what is
    missing. Three agents had proved their check and were blocked until they waived it, once with a false reason. The
    `waive` command refuses a reason that says git has no earlier version (or nothing is committed) while git has
    commits of that file. `claim-checked` flags such a sentence in the answer too, when it is about the saved or
    earlier version ("the version in git lacks it, because nothing is committed yet"); "nothing is committed yet"
    about this turn's own work is fine. `upset-learned` accepts a lead in the agent's own words with a `Checked: <what
    you opened> - the complaint doesn't hold: <evidence>` line, so a false complaint gets no forced "That isn't what
    happened:" and no "Partly"; the learn-from-upset skill says to check the version the user saw (the last commit),
    to concede only what the user complained about, and never to blame files the user doesn't see. `debug-trigger` no
    longer asks for a root cause when the only failure was a hook self-test of the project's own new check, run after
    editing it. Smaller rewrites: a waived test gate no longer flags a condition ("stays blocked until the tests
    pass"), and asks for one NOT VERIFIED line for the whole answer; the Finished section needs no list of the
    project's records ("plus the usual records"); the autonomy hints ask for a plain "I assumed ... because ..."
    sentence in the answer (the form line stays for plans); and one `Visual review: PASS after N rounds - ...` line may
    be the only place the rounds appear (the gui pack's runbook says so too). Scenarios: `check-proven:` (cp,
    Copy-Item, copy after the fix, Spanish-named script, sample text), `claim-checked:` (git claim, condition, one NOT
    VERIFIED line), `upset-learned:` (natural lead), `debug-trigger:` (own self-test), `finished-summary:`,
    `gui-review-report:`, the `waive command` and `answer-language` (Assumed hint) tests. Adopt by hand: AGENTS.md
    step 0.5 and rule 7, the learn-from-upset skill step 0 and 5, the gui runbook step 5.
  - **Nothing left scheduled after the answer (trials of 8 new projects, round 5):** new check `wakeup-left`. A wakeup
    or cron job the session scheduled for itself (ScheduleWakeup, CronCreate, and any later tool whose name says wake,
    cron, schedule, timer, remind or alarm and that is given a prompt to send back) and still pending once the turn's
    work is done is cancelled (ScheduleWakeup with `stop: true`, CronDelete with its id), or, interactively, the answer
    says what it will do. A headless run (claude -p, the SDK) does not end while one is pending, so there it must be
    cancelled unless the request asked for a reminder, a loop or a schedule; and while a background job of the session
    runs, a headless fallback wakeup is refused before the call (the job's notice wakes the session by itself). Cloud
    routines (RemoteTrigger) and connected services' tools are not counted. A setup had left a "just in case" wakeup
    pending, and the run was killed at its 60-minute limit with no answer. New rule `self-sent-prompt`: a wakeup's or
    cron job's own prompt is not the user's, so it starts no turn, takes no new turn-start snapshot and counts as no
    setup answer; files changed before it still count (Stop had asked again for the status and changelog lines written
    before a wakeup fired). A wakeup firing after a clean end is a notice like a task's (`notice-answer`). The Claude
    Code PreToolUse matcher now includes the scheduling tools. SETUP-PROMPT.md phase 5, the project runbook and the
    orchestrate skill say a background job's end wakes the agent by itself, with no timer needed, and that timers are
    cancelled when the work is done. Scenarios: `wakeup-left:`, `self-sent-prompt:`, `notice-answer:` (wakeup).
    Adopt by hand: SETUP-PROMPT.md phase 5 (a new project gets it). **Breaking for project hooks:** the PreToolUse
    matcher in `.claude/settings.json` changes on the next wire, and a project's own hook that reads `turn.json` no
    longer sees a wakeup's prompt as the request.
  - **Setup costs less and its gates read answers right (trials of 8 new projects, round 5):** in a project, the
    engine's self-test base now has every file under `docs/` as the starter or a pack ships it, and none of the
    project's own (its plans index, reviews, specs, feedback). A line in `docs/plans/README.md` naming the project's own
    script failed the audit that one self-test runs in that base, nothing was recorded for reuse, and two setups reran
    the 10-minute self-test up to five times; those files also no longer change the engine stamp, so later runs reuse
    the first pass. That self-test (`audit-selftests`) runs the self-test sweep even when another sweep fails in its
    copy (`STARTER_AUDIT_SELFTESTS=always`). A failed run in a project now says whose failure it is: a project test
    (fix it here), an engine test after the project changed an engine file (the files are named), or the engine as
    shipped (report it with `starter.mjs feedback`; the audit warns instead of failing, so setup can finish). The setup
    gate's People answer is read by its leading word: "Me (owner), plus maybe a helper later" or "one - the staff are
    app accounts, sharing one inventory" is one person, while a list of names or a count is several; a comma alone no
    longer asks for profiles. `skill-reuse` skips runbooks and skills the starter ships (core, a pack's, a library
    skill), also when the install ran this turn. In a vault the user had before the starter, `wire.mjs` also hides the
    rule files, `docs/`, `inbox/`, `outputs/` and `sources/` from Obsidian (merged after the user's own exclusions, no
    other setting touched, the user's own files of those names still shown). notes-vault: every note a note newly links
    to gets a link back where it makes sense; new `vault.mjs backlinks` and check `vault-backlinks` (the hook runs it on
    each changed note).
  - **Stop false alarms and stiff wording (trials of 8 new projects, round 5):** a skill opened and carried out counts
    as followed without the Skill tool: one of its scripts ran, or the turn wrote the dated report its own checks ask
    for (the security review's sweep, or docs/reviews/security-*.md), also when a pack's runbook owns the skill. The
    security line: "fail" as an ordinary word no longer counts as a FAIL (only status tokens do), a plain sentence that
    names the result and the file passes ("The security review passed - details in ...", "found one problem and I
    fixed it"), and "PASS" may not sit on top of open FAIL lines ("PASS after fixes" only when every FAIL is fixed).
    `worth-it` accepts a plain sentence with the gain and the cost. Citations: new condition `answerCites` (a plain
    "from exports/x.csv" naming a project file opened this turn and not written this turn, or a web page opened this
    turn), used by `research-cited` and `answer-cites`, so footnotes are no longer required and a note written this turn
    is no source. Spanish: plain forms for the security sentence, the foundation words ("rendimiento", "fácil de usar")
    and the Verification parts ("Pruebas", "Sitio real", "Lo probé"); the answer-language test now also asks a second,
    differently worded Spanish sample for every check that accepts a list of words. `no-overwrite` allows a change when
    the request names the file (its name, a word of its name, or "chapter 2" for chapters/02-x.md) and asks for a
    change, not a new version; its denial no longer pushes a "v2" copy when the user may have meant this file. New audit
    sweep `check-sampled`: each check or no-overwrite guard added since the last commit needs a project scenario where a
    realistic good sample passes (a warning without a commit to compare with). Scenarios: `review-evidence:`,
    `security-line:`, `answer-language:`, `worth-it:`, `answer-cites:`, `no-overwrite:`, `check-sampled:`.
    **Breaking for project hooks:** the no-overwrite denial text changed, the security-report message asks for a plain
    sentence, `research-cited` and `answer-cites` take `anyOf` branches, and `tools/packs-registry.json` entries gain
    `noOverwrite`.
  - **Guards and false alarms (trials of 8 new projects, round 4):** a follow-up that names nobody ("make the letter
    friendlier") keeps the person of the latest of the last 3 requests that named one, so a question in between no
    longer cuts it off. A `waive scope-separate "<why>"` logged this turn now counts before tool calls too: it covers
    the people its reason names (or, naming nobody, a call that touches one person), never several people at once, and
    the waive command itself is not checked for the folder it names. The scope denial says how to go on without asking:
    the waive command, or the folder to work in. The self-test runs a project's own scenarios against the project's own
    checks: one expecting a block was looked up in the fixtures-only base, where those checks are off, and was skipped as
    "packs not installed"; now it runs, and one that cannot run (no such check) FAILs with the reason. `claim-checked`
    counts only git run as a command (not words in quotes or a here-document) and judges each clause, in English and
    Spanish, so "nothing was committed" is not a claim. `knowledge-source-trigger` also passes when every fact written
    is labeled, dated and sourced from a file of the project that exists (new condition `knowledgeFromFiles`; a web link
    still needs research). The `.gitignore` check accepts a tracked vault's `.obsidian/` files in "already committed"
    too. Publish safety skips reserved addresses (private, shared, link-local, documentation and special IPv4 ranges;
    example domains and `.example`/`.test`/`.invalid`). `name-var` does not flag, in code, a name that is the code's own
    package or command (a root or `src/` code folder, or the manifest's name), so a CLI keeps its program name.
    `version-bump` is met when the version was raised earlier in the session and nothing was tagged, released or
    published since. Scenarios: `scope-separate:`, `own-scenarios-run:`, `claim-checked:`, `knowledge-source-trigger:`,
    `gitignore-ready:`, `publish-safety:`, `name-var:`, `version-bump:`.
    **Breaking for project hooks:** the scope-separate denial text changed (it ends with the waive command and the
    folder to work in instead of "ask if unsure"), and a project's own scenario that cannot run is now a FAIL.
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
  - **The last message is the answer (judges of 8 more trial projects):**
    - New check `watcher-left`: a turn whose background work is done does not end with a watcher (the Monitor tool)
      still armed. Stop names it and asks the agent to stop it, or to say in the answer what it watches. A watcher on a
      job that still runs is part of the wait, and one the answer names is kept. Before, a reviewer's watcher outlived
      the review, expired after a clean end, and the reply to its notice became the result of a headless run.
    - New check `notice-answer`: the answer a turn ends with is kept (`turn-end.json`, `answer`). In a headless run
      (`claude -p`, the SDK), a reply to a background notice after that clean end must carry the whole answer again;
      it is asked once and costs no round. Interactively a short reply is still fine.
    - `review-verdict` and `spec-written` need a work turn, so a feature request that turns out to exist already gets
      no spec, no review, and none of the doc edits they set off.
    - Shorter answers: the security line is `Security review: PASS - details in docs/reviews/security-...md`, without
      the count of areas and the N/A list; the evidence for a new package goes in `docs/DECISIONS.md` with one short
      `Vetted:` line for all of them; the app pack's Verification section needs Budgets only when speed or size can
      change, and the Finished section's "Not done or not checked" list counts as its Still weak part.
    - Not changed, after checking the transcript: a turn that ends while its own background job runs (the "waiting"
      end) still ends. Both the interactive host and `claude -p` deliver the job's notice and the full answer after it.
      The "three identical audits at once" were one run and two launches the permission system refused; `audit
      --setup` already shares the self-test lock, so a second run waits for the first and reuses its result.
    Scenarios: `watcher-left:`, `notice-answer:`, `feature-noop:`, `answer-length:`.
    **Breaking for project hooks:** the Stop hook can name `watcher-left` and `notice-answer`, `turn-end.json` has an
    `answer` field, and `review-verdict`, `spec-written` and `verification-report` changed in the app pack.

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
  - **Field report 3 (live project tasks):** steps can be waived with `node tools/hooks/hooks.mjs waive <name> "<reason>"`,
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
  - security-code no longer fires on the word "formidable" in prose or product names (only the library imported by name),
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
    media group as one owner (`Screen Rant (Valnet)`, and known groups by name), and logs a lead-only claim as
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
  - **Re-check of an adopted project's reports (each item now has a test):**
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
    - The closest-runbook hint matches plurals to singular words ("invoices" and "invoice").
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
    longer forces the security review (team roles; "user roles", "admin roles", RBAC still do); a stated requirement
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
  - **From a project adopted with its own hook engine**: a project's own menu codes are not taken
    for an uninstalled pack's; `wire` keeps the project's own Codex hook commands; `"fluffAllowed"` takes words off the
    filler list (a subject's real terms); an upgrade keeps an adopted project's `_fallback.md` lessons; runbook-usage
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
  - **A runbook can own folders.** `owns: sources/trips/**` in a runbook's frontmatter: in a turn that follows it,
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
    - A fit "later - when:" condition counts what its noun names ("trip files" are files with "trip" in the path,
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
    - a project named after its subject had every mention flagged: `"_subjects"` in `docs/names.json`;
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
