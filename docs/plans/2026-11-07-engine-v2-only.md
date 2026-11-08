# One engine, the agent picks the runbook: plan

status: open

Related: [[2026-11-07-only-the-simple-engine]], [[2026-11-05-engine-v2]], [[2026-11-07-engine-outside-the-project]],
[[2026-11-07-questions-follow-runbooks]]

**Goal:** the old engine is retired for good; everything lives in the new engine's own small modules, each rule lives
in one place, the agent chooses its runbook from a short menu, the engine stops growing, and tests are fast.
**Done when:**
- `git grep -n "STARTER_ENGINE\|hooks/hooks.mjs"` finds nothing outside the changelog, and both real projects pass
  their own tests after the upgrade.
- Every user requirement has at least one test on the one engine (an audit check enforces it).
- A replay over real sessions shows the agent-picked runbook share and a false-ask rate no higher than the keyword
  router's on the same turns.
- A fast test set runs in under 1 minute; the engine code stays under its line budget (a test).
**Approach:** inventory what the old file still does, move each kept part into a v2 module and point every importer at
it, port the tests off the old-engine pin, then delete the old file and the switch. Then one source per rule, the
runbook menu, the line budget and the fast test set.
**Built with:** Node, tools/hooks/v2.
**Spec:** the user's requests of 2026-11-07, drafted with the oversight terminal and approved as a whole: "full engine
migration, no old engine, only an expanded new engine"; "the AI agent decides what runbook to use rather than being
forced by a keyword". Folds in the old plan's Task 4 (retire v1) from docs/plans/2026-11-05-engine-v2.md.
**Assumptions:** the CLI keeps the same command names (begin, check, sync, why, ...) under one new entry file, so the
29 docs that name `tools/hooks/hooks.mjs` change only the path. Cost if wrong: one more doc sweep.
**Confidence:** 5/10. Main risk: hooks.mjs is 9,779 lines and the old suite pins the old engine; a behavior only the
old tests covered could be lost. The requirement-to-test audit check is the net.
**How to resume:** any session or agent: run `node skills/plan/scripts/plan-tasks.mjs next <this file>`, or find the
first unticked box by hand. Read the dated notes first. Ticked boxes are done; never redo them. When every box is
ticked and the checks pass, change the status line to `status: done`; to stop for good, `status: dropped - <why>`.
A run that is stuck sets `status: blocked - <reason>` with `Tried:` and `Options:` notes; read those first.

Order: starts after the current release (push and project upgrades), the engine-outside-the-project move and the
questions-follow-runbooks batch, and goes ahead of any new feature or trial round. Task 1, then 2 and 3 together (both
change the start and end hooks), then 4 and 5. Each ships with pre-flight, frozen chain, replay (totals only, no
project names), proof and a batched upgrade; the user sees one line per finished task.

## Context
Measured 2026-11-07 on HEAD (corrections to the draft are marked):
- `tools/hooks/hooks.mjs`: 9,779 lines, 753 "Lesson" comments. Under v2 it still runs the session, pretool and
  posttool hooks, the guards (`v2/guard.mjs` is a 4-line re-export), the user's lines (visibleLines, runningLine,
  acknowledgedLine), the CLI (begin, check, ignore-word, notices, prove, setting, sync, waive, why, ...) and the
  upgrade probe.
- Importers of hooks.mjs (corrected: 14 tools, not 12): tools/audit.mjs, dedupe.mjs, fit.mjs, integrity-check.mjs,
  new-project.mjs, packs.mjs, recall.mjs, skills.mjs, starter.mjs, survey.mjs, trial.mjs, writing-check.mjs,
  hooks/git-guard.mjs, hooks/v2/guard.mjs; plus the tests selfcheck.mjs and v2/selftest.mjs, and the starter-only
  tools/starter/trials/secjudge.mjs.
- `tools/hooks/selfcheck.mjs`: 9,119 lines; line 14 pins `STARTER_ENGINE ||= 'v1'`. v2 code (corrected): start 112,
  end 123, lib 673, guard 4, shadow 23 = 935 lines; v2 selftest 1,134 lines.
- 29 markdown files name `tools/hooks/hooks.mjs` 72 times (AGENTS.md, runbooks, skills); `.claude/settings.json` and
  `.codex/hooks.json` name it 11 times.
- A rule can live in up to 7 places (AGENTS.md, CLAUDE.md, user-requirements.md, requirements.json, a runbook's Done
  when, a skill, memory); they drifted at least once this week.
- Keyword routing misfired on ordinary words and on scheduled or relayed prompts.

## Checks for this project
- Fast: `node tools/hooks/v2/selftest.mjs`; all: `node tools/hooks/selfcheck.mjs`, `node tools/trial.mjs`,
  `node tools/audit.mjs` on a frozen copy.

## Watch for
- Safety guards must keep working through every step (secrets, AI credit, protected files, outward actions).
- The projects' own hooks (`externalHooks`) read the engine's output contract: keep it, or bump the contract version.
- Projects lose deleted engine files only through the upgrade, after a backup.

## Constraints for every task
- Nothing during work but safety refusals; the end check asks at most 3 times a turn.
- No v1 file, wrapper or compatibility layer survives; nothing can switch the old engine back on.
- Starter files stay neutral: no real project names.

---

### Task 1: retire the old engine, permanently
**Files:** `tools/hooks/hooks.mjs` (deleted), `tools/hooks/v2/*.mjs` (new modules), the 14 importers, `.claude/settings.json`, `.codex/hooks.json`, `tools/hooks/selfcheck.mjs`
**Uses / provides:** provides the v2 modules Tasks 2 to 5 build on
- [x] 1a Inventory: every function in hooks.mjs that runs under v2 or that a tool imports, each marked keep (move),
      replace or delete, written into this plan. Nothing left unmarked. (2026-11-08: all 740 top-level names marked,
      in "Inventory for step 1a" below)
- [ ] 1b Modules: config and names, paths and host, the guards (code, not a re-export), user lines (status-lines
      toggle), the CLI. Point the 14 importers and secjudge.mjs at them; no module imports hooks.mjs.
      (2026-11-08: user lines started in `tools/hooks/v2/lines.mjs`: the toggle and the end-of-turn line, which v2 had
      dropped. Still in hooks.mjs: acknowledgedLine, runningLine, sessionUserLine. `V2_SHOWS` there lists each kind;
      the "open" ones, not shown under v2 yet, are rule, praise, pause, scope, left-open, new-task, asking and not-fit:
      each is brought over or dropped with the user's OK. "question" came back the same day as v2/midturn.mjs: a
      message typed while the agent works is answered first.)
- [ ] 1c One entry: hook settings and the no-hooks CLI call one v2 entry for session, prompt, pretool, posttool and
      stop. A test pipes every event through it as the claude-code host and checks the agent output and user line.
- [ ] 1d Tests: port each scenario for behavior v2 keeps, unpinned; delete v1-only ones. Every user-requirements row
      keeps a v2 test (audit check). The `engine` key and STARTER_ENGINE are gone; the suite runs under 5 minutes.
- [ ] 1e Delete hooks.mjs, the shadow, the switch, v1 docs and trial paths; update the 29 docs' paths. The upgrade
      removes files the starter no longer ships, after a backup.
- [ ] Run `node tools/hooks/v2/selftest.mjs` and the full chain. Expected: 0 failed, and the grep in "Done when" empty.

#### Inventory for step 1a (2026-11-08, hooks.mjs at 6e96b72, 9,833 lines)
How it was made: V8 coverage (NODE_V8_COVERAGE) over the v2 selftest, the audit and the trial forced onto v2
(`STARTER_ENGINE=v2`; the trial pins v1 by default). A function counts as run when V8 counted at least one call; a
constant counts when a function that ran names it. Static reach alone was no use: 721 of 740 names are reachable from
v2's entry points, because the shared handlers choose the engine at run time. Rules applied in order:
1. v1's prompt, stop, begin and check handlers, and the big functions only they call (callers checked by hand): delete.
2. The v1/v2 switch: replace (one engine needs none).
3. Ran under v2, or imported by another tool (the importer is named): keep.
4. Never ran, but a safety guard calls it directly or it names an IN_WORK_GUARDS rule: keep; 1d tests it or deletes it.
5. Anything else that never ran: delete. Then, to a fixed point, whatever kept code names moves to keep.
Limits: rule 4 and the fixed point lean to keep, so some v1 end-check helpers stay listed as keep until 1d. Under v2,
`pretoolHits` still computes three v1 rules (plain-writing, no-repeat, no-polling) and throws them away; 1b drops those
lines with the move. Rule 5 is proven in 1d by the full chain after the deletion.

Totals: keep 549 (6,355 lines), replace 5 (36 lines), delete 186 (3,427 lines); 740 names.

- **keep** (runs under v2): 339 names, 3,795 lines.
  ROOT (audit.mjs, dedupe.mjs, fit.mjs, recall.mjs, skills.mjs, starter.mjs, survey.mjs), STATE, CONFIG, read (audit.mjs, fit.mjs, recall.mjs), readJSON, abs (audit.mjs, fit.mjs), absw, rel, exists (audit.mjs), rulesText (audit.mjs), list, walkStat, DEP_DIRS, BUILD_FILES, bulkDir (audit.mjs, dedupe.mjs, skills.mjs), esc, localDate, today (audit.mjs, new-project.mjs, skills.mjs), envOf, SID, DRY_STATE, NO_TRANSCRIPT, transcriptState, PER_SESSION, stateName, stateFile, BENCH_CACHES, writeState, STATE_KEEP_DAYS, SESSION_STATE, pruneState, TIMING, globRe, match (audit.mjs), gitignoreTest (audit.mjs), frontmatter (audit.mjs), splitList, triggersOf, DEFAULTS, EXTENDS, foundMirrors, config (audit.mjs, dedupe.mjs, fit.mjs, git-guard.mjs, skills.mjs, writing-check.mjs), re, secretHit (audit.mjs, git-guard.mjs), RESERVED_IP, PERSONAL, personalDetails (audit.mjs), folderKey, memo, playbooks (audit.mjs), playbooksRead, fold, STARTER_LINK (starter.mjs), starterLink (starter.mjs), sourcesWarned, starterSources (packs.mjs, starter.mjs), findPack, findLibrary (audit.mjs, packs.mjs, skills.mjs), routableSkills (audit.mjs), routableSkillsRead, markerChecked, skillHasCheck (audit.mjs), STOP, stem, keyWords (recall.mjs), GENERIC, OPINION, STARTER_UPGRADE, starterName, toPeer, WEAK, MAKE_REQUEST, HOOK_MARK, HOOK_LINE, HOOK_BLOCK, RELAYED, relayedOut, askedPushEarlier, userText, deadTriggers (audit.mjs), unquoted, keySpan, QUESTION_LED, keyOrdered, FILE_CAPS, fileCapsOut, EDIT_VERB, editsFileOf, POINTER, route (audit.mjs), menu (audit.mjs), SKIP, COMPACT, textOf, isToolResult, skipped, promptOf, CODEX_SKIP, codexRows, TAIL_START, transcriptRows, turn, WATCHER_TOOL, WATCH_END, watchersArmed, WAKE_KNOWN, WAKE_TOOL, WAKE_CANCEL, isWakeTool, WAKE_ASK, wakeupsPending, selfSent, MOVED_BG, backgroundRunning, fallbackTurn, TURN_END, WAKE_STATE, noticeKey, gitRun, runText, GIT_PUSH, gitPush, wordsOf, ENGINE_WRITES, engineWrites, flushEngineWrites (fit.mjs, packs.mjs, skills.mjs), SNAPSHOT, testInputsHash (audit.mjs, git-guard.mjs), RUN_LOG, logRun (audit.mjs), cmdHead, runPart, RUNS_INSIDE, heldSidestep, inlineCodeOut, gateText, NOTES_FILE, turnNotes, syncTwin, usage (audit.mjs), CORE_SKILLS (new-project.mjs, skills.mjs), CORE_RUNBOOKS, curateDue (audit.mjs), hardenDue (audit.mjs), GEN_START, GENERATED_WRITES, ENGINE_MTIME, stamps, mirrorFresh, stampMirror, saveStamps, writeIfChanged, firstHeading, doneWhen, generatedSkill (audit.mjs), mirrorText (audit.mjs), syncSkills, starterOnlyChars (audit.mjs), directoryBlock (audit.mjs), runbookHasCheck (audit.mjs), syncDirectory, NAMES_FILE, NAME_MARK, names, subjects, checkable, stampNames, nameProblems (audit.mjs), CODE_IDS, codeIdentifiers, NAME_DOCS, NAME_FILES, nameFiles (audit.mjs), syncNames, syncAll (skills.mjs, starter.mjs), RETIRED_TAGS (audit.mjs), syncRetiredTags, ENGINE_CHECKS, isEngineCheck (new-project.mjs), checkKey (new-project.mjs), ENGINE_CHECKS_HISTORY (new-project.mjs), syncEngineChecks, skillProblems (audit.mjs), playbookProblems (audit.mjs), checkText, knownCheck, aiAttributedCommits (audit.mjs, git-guard.mjs), VERBATIM_ENGINE (audit.mjs), homeDir, privateTermsPath (audit.mjs), privateTermsListFile (audit.mjs), forbiddenTerms, forbiddenRe (audit.mjs, git-guard.mjs), previewOf, FORBID_EXEMPT, countRe, BROWSER_CODE, LETTER_DIR, GREETING, SIGN_OFF, letterLines, writingProblems (audit.mjs, writing-check.mjs), memoryDir, ES_LABELS, labelsEsHint, people, personOf, pathsPeople, staleKnowledge (audit.mjs), section, INTERVIEW, INTERVIEW_AFTER, INTERVIEW_APP, setupInterview, unanswered, packsFor, setupPrompts, setupCompleteness (packs.mjs, starter.mjs), fitGaps, upgradeReview, upgradeProblems (audit.mjs), SURVEY_SKIP, SURVEY_STARTER, SURVEY_KINDS (survey.mjs), projectSurvey (fit.mjs, survey.mjs), FIT_FILE (audit.mjs, fit.mjs), gitHooksOn, FIT_FEATURES, FIT_SIGNALS, briefText, fitBrief, fitKey, fitSignals (fit.mjs), FIT_CODE_SECTIONS, fitCandidates (fit.mjs), fitToolListed, fitRows (audit.mjs, fit.mjs), fitDecision (audit.mjs, fit.mjs), FIT_KINDS, FIT_EXTS, FIT_NOT_NOUN, fitWhen, fitWhenOf (audit.mjs, fit.mjs), FIT_HELPER_DIRS, FIT_CODE_EXT, fitMetric, FIT_FILLER, FIT_BOILER, userVault, fitReasonProblem, FIT_WHEN_TAIL (fit.mjs), fitProblems (audit.mjs, fit.mjs), FIT_GENERATED, fitBoilerplate (fit.mjs), fitLaterNotice, openPlans, gitignoreProblems (audit.mjs, git-guard.mjs), suspendedItems, isSuspended, projectChecks, bench (audit.mjs), fastestBench (new-project.mjs), DAYS, dueRoutines, notices, DEV_EDIT_LINE, cmdSession, AUTONOMY_WORDS, LINE_KINDS, brand, visibleLines, sessionUserLine, deny, briefFileNamesRules, deletesOnlyNewFiles, sessionOwnFiles, madeThisTurn, removedPaths, SECRET_FILE, SECRET_IN_CMD, SECRET_ASKED, OUTWARD_MCP, outwardCommand, outwardWhat, PRETOOL_MAX, IN_WORK_GUARDS (guard.mjs), pretoolDecision (guard.mjs), inProjectParts, pretoolHits, sedInPlaceFiles, markAlive, cmdPretool, cdDropped, CHECK_RUN, probeEngine (new-project.mjs), overlapNotice, scopeNotice, BRIEF_LINE, briefLine, cmdPosttool, ACKED, lastIssue, issueParts, RUNNING, runningLine, UPSET_PENDING, READ_PART, cmdSubagentstop, upsetUnacknowledged, acknowledgedLine, doneWhenItems (audit.mjs), DONE_LABEL (audit.mjs), ledgerItems, CHECKLIST_SHOWN, checkRe (audit.mjs), BASE_REQUIREMENTS (audit.mjs), loadRequirements (audit.mjs), knowledgeRe, withKnowledgeDirs, REPEAT_CHECK, READ_ONLY, LAST_WRITE, repeatRun, duplicateWork, WAIT_CMD, pollWait, TEST_GLOBS (packs.mjs), hookHost, HOST, HOOK_OUTPUT_MAX (audit.mjs), fitOutput, contextOut, CONTRACT, SELF_ONLY_REVIEW, withReviewBlock (new-project.mjs), changelogSince (new-project.mjs), breakingItems (new-project.mjs), contractProblems, externalHookSizes (audit.mjs)
- **keep** (kept code uses it, never ran: 1d gives it a test or deletes both): 120 names, 891 lines.
  NOTE_META, noteMeta, RESERVED_MAIL, CODE_END, PUBLIC_TEST_IP, starterRunbooks, routablePlaybooks, STOP_STEMS, coreRunbook, ES_EN, closestRunbook, RELAY, PEER_NOUN, PEER, makesFile, CHOICE_Q, OWN_THING, OWNED, routeSkills, expandMenu, ROUTE_ES, UB, ROUTE_ES_U, routeEnglish, RELAYED_TURN, HANDBACK, wakeFamily, bornThisTurn, committedBefore, NOT_IN_GIT, ABOUT_SAVED, gitHolds, namedPaths, pathKey, DESTRUCTIVE, ACTOR, USER_DECIDED, NO_PAGE, openedText, toolResultsList, turnText, textAfterLastChange, finalText, changedFiles, sha, ROUTED_DOC, bodySha, sameAsTurnStart, ownChanges, shellWindows, readsOf, NEVER_RAN, FORM_REFUSED, NO_PROGRAM, INSTALL_CMD, NOT_RUN_SAID, APPROVAL_REASON, NOT_INSTALLED_SAID, carriedRuns, SRC_EXT, COMMON_NAMES, vocabSet, LOCAL_MEMORY, LABELS_ES, EM, LABEL_LINE, plainLabel, EN_COPIES, inEnglish, ES_WORDS, EN_WORDS, writtenWords, isSpanish, FIT_GENERIC, fitStems, fitReasonNamesItem, isUpset, TROUBLE, ignoredWords, withoutIgnored, TRIGGERS, wordChangesSince, ACRONYM, CAPS_UPSET, capsWeight, RELAY_PART, ownWords, isRuleRequest, isWhQuestion, isRequirement, isPraise, RELAY_START, PASTE_LONG, ALWAYS_ON, LOOP_PART, READ_SCRIPT, ledgerLines, turnRecords, ledgerRunbook, WAITS_FOR_AGENTS, waitsForAgents, PROBLEM_WORDS, NOT_A_SOURCE, FIG, figNum, HISTORY_KEYS, HISTORY, RECALL_WEAK, recallClose, unresolvedAnnounced, STOP_LOG, clock, SHORT, UPSET_SHORT, shortStep, STEP_ICON, userLine, hookedSession, eachLine, costOf
- **keep** (a guard calls it, but it never ran: 1d gives it a test or deletes it): 83 names, 1,235 lines.
  timed, secretRes, relayedTurn, helperRows, deniedIds, gitClaimContradicted, CHECK_FILE, TEST_FILE, removedLines, grantProblems, toolUses, toolResults, otherSessionActive, loggedRuns, neverRan, refusedOutright, INTERPRETER, programOf, cantRun, saysNotRun, cantRunStep, missingProgram, blamesApproval, engineNote, backgroundLaunches, runsOf, shellParts, redirectedRun, gateResult, inTimeOrder, context, ownChecks, knowledgeFromFiles, words, projectVocab, userNames, exampleNameHits, peopleIn, settingUp, setupTurn, FOLLOW_BACK, peopleFor, lostRules, ONE_LEAD, ME_LEAD, SEVERAL_LEAD, NOT_SEPARATE, peopleAnswer, localRepoAnswer, WORD_KINDS, wordsRe, triggerRows, ignoreWord, setting, logWordChange, decidedLines, secretReadMsg, patchFiles, issueCount, readOnlyChain, helperTranscript, ROOT_TOOLCHAINS, ledgerSteps, reportsProblem, FAILED_RUN, MISSING_TOOL, ADDED_MAX_FILES, addedContentHit, CHANGE_ASK, NEW_COPY, FOLDER_NOUN, asksToChange, citesOpened, citeWhy, figureProblems, routingOnlyEdits, holds, overlappingCalls, needsHistory, waived, stopLog, stopLogLine, cmdCost
- **keep** (imported by another tool): 6 names, 134 lines.
  usageOf (dedupe.mjs, fit.mjs, new-project.mjs, packs.mjs, recall.mjs, skills.mjs, starter.mjs, survey.mjs), onPath (packs.mjs), shippedChecks (new-project.mjs), knowledgeProblems (audit.mjs), setupProblems (audit.mjs), recallMatches (recall.mjs)
- **keep** (the CLI and hook dispatch; 1c makes it one v2 entry): 1 name, 300 lines.
  isMain
- **replace** (the v1/v2 switch: one engine needs none): 5 names, 36 lines.
  V2_SESSION, V2_PRETOOL, V2_TURN, engineOf, v2Cli
- **delete** (never ran under v2: selftest, audit, v2 trial): 178 names, 1,775 lines.
  HOOKS, lapper, isRelay, recordTurn, sizeOf, handoffNotice, transcriptMidTurn, selfSentPrompt, turnNotices, shippedByStarter, CLAIMED, NOT_DONE, claimClauses, ACTION_FAILED, actionAttempts, NEVER_AGAIN, IMPROVE_CLAIM, REPORTED, RUN_WORDS, LAUNCHER, EXECUTOR, runSaid, instructedLaunchers, runsLauncher, LAUNCH_FAILED, NOT_RUN_LINE, launcherGaps, ENFORCED, claimSentences, enforcedClaim, GROUP_VERDICT, TEST_RUN, JUDGED_BY, groupVerdictClaim, BY_HAND, UI_TEST, byHandClaim, autoScopes, noteDirs, enforcementGaps, NOT_PROJECT_CHECK, SCRIPT_PATH, requirementScripts, newProjectChecks, savedCopies, headFiles, argPaths, runCovers, governedFiles, NOT_FOUND, checkProof, EDGE_CASE, COMPLAINT_DOESNT_HOLD, NOT_WRONG, complaintDisproved, outsideReads, snapshotBase, takeSnapshot, runsScript, toolsKnownRuns, PROVEN_HINT, verbatimHits, WORTH_IT, assumedHint, LABELS_ES_HINT, BRIEF_SIGNALS, FRICTION_WINDOW, SAFEGUARDS, noteFriction, logTrigger, upsetBefore, decideTrigger, projectOwnCheck, noteEngineFeedback, scoreFriction, fitDueByRequest, relayedBody, CMD_LINE, asRoute, DONE_REPORT, relayRouteText, relayRequestText, typedRouteText, STATUS_ASK, hostSeesTools, TASK_ES, isTaskEs, PROMPT_GATED, checkPreview, PREVIEW_MAX, groupTags, globSummary, MAKE_VERB, namedEdits, promptNotices, DIGEST, promptUserLine, STOP_PASS, passLine, SHARED_HINT, multiPart, ASK_OPENER, isQuestion, YES_NO_Q, YES_NO_A, unansweredQuestions, askingOnly, HELPER_ASK, helperAsk, helperState, helperRoute, helperGate, issueChecklist, staleIssue, generatedNotice, PS7_ONLY, ps51Notice, SETUP_OWN, planNotice, publishNotice, eventHintAfterEdit, REVIEW_EXCUSE, rootToolchainFile, skillLearnCheck, MISROUTE_WORDS, MISROUTED, RUNBOOK_SLOT, FIX_FILES, sampleOf, filesOfCond, EXAMPLE_CLASS, LEARNED_NONE, learnedLines, fixFilesOf, fileTriggered, followOnSteps, CONFIG_TAGS, touchedChecks, ledgerHint, checklistShown, checklistNotice, usesCites, CITE_STOP, CITE_OWN, stemOf, citedFile, citedClaimGaps, ENGINE_FILES, SELF_WRITTEN, DEV_REQUIREMENTS, passedDrafts, declarativeChecks, BUMP_CMD, bumpedThisSession, recordHistory, USAGE_SEEN, recordUsage, FOLLOW_UP, relatedRequest, MUST_CARRY, owedTags, WAIT_SKIP, waitTags, logStop, PAUSE_ASK, paused0, externalStopSteps, SMALL_SKIP, smallChange, correctionsOf, additionOf, isUnchangedNote, CORE_FILE_FIX, carriesAnswer, answerWords, fileFixable, writeDetails, stopOutput
- **delete** (v1's prompt, stop, begin and check handlers, or only they call it): 8 names, 1,652 lines.
  promptHints, cmdPrompt, coreChecks, carryoverChecks, stopDecision, cmdStop, cmdBegin, cmdCheck

Done ahead of 1b (2026-11-08): the three v1 rules `pretoolHits` worked out on every tool call and threw away
(plain-writing, no-repeat, no-polling) are gone, with repeatRun, duplicateWork, pollWait and the after-edit write
record: hooks.mjs 9,833 to 9,678 lines. v2 selftest test "rules no engine refuses during the work ... are not computed"
fails on the old code.

#### Budget for step 1b (2026-11-08)
"keep" means "still needed", not "port as is": 6,355 kept lines against a 2,000-line budget (Task 4) cannot move
unchanged. Counted with the same inventory; line counts include comments (about 30% of hooks.mjs is comment-only lines).
- Budget: 2,000 lines of engine code without tests, counted over tools/hooks/ (hooks entry, v2/, paths.mjs,
  git-guard.mjs). Code only another tool uses moves into that tool and counts there, not here: 59 names, 690 lines
  (audit, fit, survey, recall and new-project helpers).
- Already spent: v2 lib 744, start 117, end 185, paths 87, git-guard 90 = 1,223 (shadow.mjs and the guard re-export go
  in 1e). Room left for what comes out of hooks.mjs: 777 lines, unless v2's own files shrink.
- The 5,665 kept lines on the hook path, by job, with the target each is rewritten to:

| Part | Kind | Now (lines) | Target | How |
|---|---|---|---|---|
| Safety guards (pretoolHits and its helpers) | (a) must keep | 1,034 | 420 | one table of guard rules, one lesson line each; special cases only with a test |
| Paths, config, state, transcript reading | (a) must keep | 575 | 150 | DEFAULTS (218 lines) becomes a JSON file; transcript readers shared with v2 lib, not copied |
| CLI commands projects or tools call | (a) must keep | 425 | 110 | a dispatch table in place of the 300-line main block; v1-only commands go |
| The user's lines (acknowledged, running, session) | (a) must keep | 183 | 70 | one line builder with the status-lines toggle |
| Session start (notices, status, setup questions) | (b) simplify | 517 | 80 | the reminder text and STATUS head; setup and upgrade checks stay in audit |
| Generated files (skill mirrors, DIRECTORY, names) | (b) simplify | 530 | 0 here | moves to tools/skills.mjs, run by the session hook as a command |
| Everything else the hook path reaches (v1 end-check, routing and claim helpers kept by the safe-side rules) | (c) used only by (b) or by leftovers | 2,401 | 0 | deleted with the code that uses it; any piece a v2 test needs moves into v2 lib inside the targets above |
| Total from hooks.mjs | | 5,665 | 830 | |

- 1,223 + 830 = 2,053: 53 over. v2's own files give it back: shadow.mjs (23) and lib.mjs's long lesson comments
  become one line each (Task 4), at least 60 lines. If a target can't be met without losing a guard, the guard wins and
  the overrun is reported, not hidden.
- Order: (a) moves first, each part rewritten small with its tests ported; (b) next; (c) is deleted last, after the
  full chain shows nothing still calls it.
- Conditions (confirmed 2026-11-08): the scope is tools/hooks/, what runs on hook events. Code moved into another
  tool must not grow there: each commit that moves some reports every receiving tool's line count before and after,
  and the moved total stays at or under 690. Tests are not counted, but a selfcheck or selftest scenario for deleted
  code goes in the same commit as the code.
- Progress (2026-11-08), guards: the guard code is now `tools/hooks/v2/guard.mjs` (476 lines), taking hooks.mjs's
  helpers through `use(hooks)` because a static import back would be a cycle; hooks.mjs 9,678 to 9,137. No guard was
  dropped; upset-acknowledged no longer runs in the tool hook because only v1 ever sets it. v2 lib 744 to 709 and end
  185 to 163 (lesson comments one line each). Still over the 420 target: the guard helpers left in hooks.mjs (secrets,
  gitignore, push, held runs, browser, people's folders) move or shrink with the table rewrite.
- Guards, decision (2026-11-08): 569 lines (guard.mjs 477 + 92 of helpers in hooks.mjs) against 420. Every remaining
  line is a refusal or a special case with its own scenario; a table form would save under 50 lines and lose none of
  them only by moving text into data. Overrun of about 150 reported; the guard wins.
- Paths/config (2026-11-08): DEFAULTS became tools/hooks/defaults.json (86 settings, checked equal to the old object),
  with one line per setting in tools/hooks/SETTINGS.md: hooks.mjs 9,137 to 8,922.

### Task 2: one place for each rule
**Files:** `AGENTS.md`, `docs/checks/user-requirements.md` (generated), `tools/hooks/requirements.json` (retired), `skills/project-rule/SKILL.md`, `tools/audit.mjs`
**Uses / provides:** uses Task 1
- [ ] A rule's text lives in AGENTS.md only (CLAUDE.md stays generated); its check is a Done when marker or a test.
- [ ] user-requirements.md becomes a generated index (rule, date, where checked); requirements.json's safety items
      move into the v2 guard config; memory notes point to the rule instead of restating it.
- [ ] Audit fails on a rule with no check, or a check whose rule text says otherwise; project-rule writes two sources.
- [ ] Run `node tools/audit.mjs`. Expected: PASS.

### Task 3: the agent picks the runbook
**Files:** `tools/hooks/v2/start.mjs`, `tools/hooks/v2/end.mjs`, runbook front matter
**Uses / provides:** uses Task 1; merges with the questions-follow-runbooks end check
- [ ] Start: no keyword-forced runbook; a menu of the 3 closest by description with one-line purposes and "pick the
      one that fits, or none". Upset and question hints stay; safety reminders unchanged.
- [ ] End: held to the runbook(s) opened; a work turn, or a knowledge question, that opened none is asked once to
      open the closest (listed) or say in one line why none fits. Triggers shrink to a few phrases that rank the menu.
- [ ] Ease off trigger words (user, 2026-11-07). Principle: a word match may force (refuse or require) something only
      where skipping it could cause harm that is hard to undo: safety, privacy, other people, or an irreversible or
      outward action. Everything else is a hint the agent may ignore (runbooks, skills, upset and rule handling).
      Guards that pass today: protected and versioned files, generated mirrors, mixing people's data, risky git,
      outward actions, forbidden commands, the installed browser, the setup file, secrets, AI credit, private terms,
      the user's own words kept out of shared files.
- [ ] Inventory every word match in the engine into this plan: keep each that passes, with its reason; turn the rest
      into hints. Cases to cover: a message that only mentions "trigger words" was routed to that runbook twice; an
      upgrade message naming only the version ("upgrade to <hash>") went to the project runbook on words in its list
      of fixes, and the end check held it to that runbook's items (patched with a pattern on 2026-11-08; the menu
      should make that pattern unneeded).
- [ ] Replay over real sessions (totals): picked-and-opened share, "why none" asks, false asks, against the keyword
      router on the same turns.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: ALL PASS, menu and ask cases included.

### Task 4: stop the pile-up
**Files:** `tools/hooks/v2/selftest.mjs`, `tools/starter/runbooks/improvement-loop.md`
**Uses / provides:** uses Task 1
- [ ] One lesson line per fix (runbook Pitfalls or the commit), not a paragraph in code; a fix tries delete or
      simplify first; a new special case gives a one-line reason in the commit.
- [ ] A line-budget test: v2 engine code without tests under 2,000 lines; crossing it means removing code first.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the budget test passes.

### Task 5: faster tests
**Files:** `tools/hooks/v2/selftest.mjs`, `tools/starter/runbooks/release.md` or the improvement-loop runbook
**Uses / provides:** uses Tasks 1 and 4
- [ ] A fast set (v2 selftest, guard and routing scenarios) under 1 minute on every commit; the full chain before a
      release only; trial rounds only when the user starts them.
- [ ] Both commands and their times written in the runbook the release uses.
- [ ] Run `node tools/hooks/v2/selftest.mjs` (the fast set) and time it. Expected: under 60 seconds.
