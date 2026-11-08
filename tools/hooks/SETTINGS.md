# Hook settings

The defaults are in `defaults.json`. A project changes one in `tools/hooks/config.json` (or with
`node tools/hooks/hooks.mjs setting <key> <value>`). List settings marked "extends" add to the default list instead of
replacing it. Patterns are JavaScript regular expressions, written as JSON strings.

| Setting | What it does |
|---|---|
| engine | `v2`: a reminder before the work, one check after it, only safety during it. `v1` keeps the old engine. |
| workToolCalls | A turn with this many tool calls counts as work even if no file changed. |
| maxBlocksPerTurn | How many times the end check may ask again in one turn (one let a second miss through; unlimited can loop). |
| runbookLedger | The routed runbook's "Done when" list is the turn's checklist, kept as a record. |
| stopStyle | How the end check asks: `auto` (the calm form where the host supports it), `feedback` or `block`. |
| userLines | The "⚓" lines the user sees: `true`, `false`, or `{"hide": [kinds]}` (status-lines runbook). |
| ignoreWords | Words that set off nothing by themselves, per kind (`upset`, `praise`, `rule`); the trigger-words runbook changes it. |
| promoteAfterUses | A runbook followed this many times becomes a skill. |
| pruneAfterDays | A runbook or skill unused this long is reviewed (skill-curate). |
| autonomy | `ask`: setup waits for the user's answers. `auto`: the agent assumes them and records it. Outward actions and installs need an OK in both. |
| gitignoreMustIgnore / gitignoreMustKeep | Sample paths .gitignore must ignore, and files it must never ignore; checked before every push (extends). |
| injectionIgnore | Files that may discuss prompt injection itself (extends). |
| alwaysLoadedMaxChars, directoryMaxChars, alwaysLoadedOwnMaxChars, starterLoadedMaxChars | Size ceilings for CLAUDE.md, DIRECTORY.md, the project's own preferences and the starter's own rules. |
| knowledgeRows | DIRECTORY.md lists up to this many knowledge notes one by one; more go one row per folder. |
| smallFiles / smallLines | A small fix: at most this many files and lines; held to tests, security and accuracy only. |
| deleteOk | Globs a plain delete may remove without asking (drafts the user never saw). |
| externalStop / externalStopTimeoutMs | The project's own end-check command, run inside this one, and how long it may take. |
| planNewFiles | A work turn that creates this many new files needs a plan in docs/plans/. |
| hookBudgetMs / stopBudgetMs | Speed limits: a hook event (audit fails over it) and the end check's own work (self-tests fail over it). |
| harden | `block`: harden a skill in the turn it becomes due; `remind`: a hint only. |
| skillsDir / skillMirrors | Where skills live, and the generated copies agents read; a folder with `.mirror` markers counts too. |
| protectedOriginals | Globs of originals that are never changed. |
| noOverwrite | Globs of delivered files: a new version is a new file unless the request names the file. |
| newVersionOnly | Globs where every version is a new file, always (only a file this turn made may change). |
| ignoreForChanges | Never walked for changes; plain folders in the root .gitignore are added (extends). |
| notWork | Changing only these is not work. |
| guiFiles / guiIgnore | Screen files whose change needs the screenshot loop, and what is never one (extends). |
| guiShotDir, guiShotCommand, guiMaxRounds | Where screenshots go, the command that takes them, and the loop's round limit. |
| namesIgnore | Files where a name from docs/names.json may be typed out: history, licenses, manifests, outputs, test fixtures (extends). |
| memoryOnRuleRequest / memoryDir | Whether a rule request also writes a memory note (off: AGENTS.md already holds the rule), and where. |
| buildOutputs | Build output: neither the agent's edit nor a screen change. |
| promptDigest | A one-line rules digest on every prompt. |
| scopesRoot | Each person's data lives in `<scopesRoot>/<name>/`; one person's request never touches another's. |
| watchedInputs | Inputs the user updates; a change mid-turn must be reported. |
| wholeOutputTools | Commands whose output is read whole, never piped into a filter. |
| writeOnlyVia | `[{"glob", "tool"}]`: files only that tool may write. |
| volatileMaxAgeDays | Knowledge marked volatile older than this is reviewed. |
| knowledgeDirs | Where the project keeps what it knows; every knowledge check covers them (extends). |
| questionNoFileExempt | Files a question may change without quoting what asked for it (extends). |
| changeWords | Words that make a message a request for change. |
| praise, complaint, letdown, frustration | What reads as praise or as an upset user (checked against real messages; see the trigger-words runbook). |
| requirementWords / ruleRequest | What reads as a lasting requirement on the work, or as a standing rule for the project. |
| trivial | A touch-up that needs no runbook. |
| taskVerbs | Verbs that make a message a task. |
| overwriteWords / deleteWords | Words that let a delivered file be overwritten, or a file be deleted. |
| outwardOk | The user's OK for an outward action in this request ("send it", "push", "open a PR"). |
| pushOk | A push to a protected branch needs the user's OK: once per `session`, or in the same `request`. |
| aiAttribution / aiAuthor | What credits an AI in a commit, PR or release, or as its author. |
| protectedBranches / backupDir | Branches never pushed to unnamed; where the backup bundle goes before a history rewrite. |
| secretPatterns | Key prefixes and private key blocks never committed; each starts at a word boundary, not inside a path (extends). |
| forbiddenCommands | `[{"pattern", "reason"}]`: commands that never run here. |
| codeRules | `[{"files", "pattern", "message"}]`: code patterns to flag. |
| commitGate | `[{"cmd", "pass", "when"}]`: a command that must have passed this turn before committing those files. |
| quoteCheck | The end check names the user's own words quoted into a file; offered at setup, never forced. |
| subagentBrief | Sub-agent prompts must point at AGENTS.md. |
| instructionBudgetKB | The audit warns when AGENTS.md or CLAUDE.md grows past this. |
| rootAllowed | Files allowed in the project root (extends). |
| approvalPaths | Taste-driven paths: committing them needs the user's OK in this request. |
| verbatimWords / verbatimAllowed | A run of this many words copied from the user into a file is flagged, except in these folders. |
| userFacing / userFacingIgnore | Files the plain-writing check reads (extends). |
| maxParagraphWords / maxSentenceWords | Plain-writing limits. |
| fluff / courtesy | Filler phrases flagged in what the user reads; courtesy ones are fine inside a letter or message (extends; `fluffAllowed` removes some). |
| evidenceLabels | Labels a claim may carry for how it is known. |
