# <!--name:STARTER_NAME-->Anzuelo<!--/name--> changelog

Changes to the starter itself. A project picks up engine changes with `node tools/starter.mjs upgrade` (or, from the
starter, `node tools/new-project.mjs "<project>" --upgrade`). Rule and runbook changes listed here are adopted by hand
(project-rule, runbook-create), because an upgrade never touches a project's own content. A change to what the hooks
print, or to a command or setting a project's own hooks or scripts may rely on, is marked **Breaking for project
hooks:**, and an upgrade lists each one as its own review item.

- 2026-11-05 (engine): quiet work. The engine now reminds the agent before the work and checks once after it.
  - During the work it refuses only what is unsafe (secrets, AI attribution, protected and versioned files, outward actions, risky git, people's data mixing, the project's own guards). The upset hold, repeat and polling refusals and the em dash refusal are gone (Stop still checks the writing and the upset follow-through).
  - Tool calls get no notices: the checklist on opening a runbook, STATUS, plan, security, publish and generated-file notes are gone. The background-run notice shows once per run, in the main session only, and not for a command that only reads a check's output.
  - Helpers are never routed or held.
  - Stop no longer asks for "Done N" or "Skip N" lines.
  - New read-only tools: `tools/starter/interrupts.mjs` and `tools/starter/stop-value.mjs`.
  - **Breaking for project hooks:** PreToolUse and PostToolUse print far less, and SubagentStop prints nothing.
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
