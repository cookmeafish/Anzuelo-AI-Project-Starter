# The user's requirements → where each is enforced (keep this complete)

Every standing instruction or complaint from the user goes here as a principle in your own words (never a paste of
their message, examples or private details), with the date, the rule it became, and the REQ tag that enforces it. A
judgment-only row gets the tag `doc` and says why it can't be checked. `node tools/audit.mjs` FAILS if a tag listed
here is missing from the hooks. Add rows with the project-rule skill.

The rows below are the starter's own design requirements. A project keeps them and adds its own below.

| # | Date | What was asked (the principle) | Rule / doc | REQ tag |
|---|---|---|---|---|
| 1 | 2026-10-17 | Work that has no procedure yet leaves behind a runbook, a skill and a check, automatically | 2 | runbook-exists, runbook-complete, skill-valid |
| 2 | 2026-10-17 | Standing instructions are enforced by the project itself, so the user never has to repeat them | 3, Enforcement | rule-request, runbook-read |
| 3 | 2026-10-17 | Robust across situations: interruptions, compaction, mid-turn messages, crashes, repeated misses | Engine | crash-visible, stop-reblock, queued-messages, compaction-summary, unresolved-carryover |
| 4 | 2026-10-17 | Visual work is screenshotted, reviewed and fixed in a loop until a full round finds nothing | 9 | gui-review-loop, gui-review-report, gui-warnings |
| 5 | 2026-10-17 | A setup prompt builds the project, then removes itself only once checks prove everything is in place | SETUP-PROMPT.md | setup-gate |
| 6 | 2026-10-17 | Everything the user reads is direct, accurate, free of filler, well formatted, without em dashes | 7 | plain-writing |
| 7 | 2026-10-17 | Works with any AI agent, not one vendor's | Enforcement | agent-neutral |
| 8 | 2026-10-17 | One directory tells every agent which runbook or skill handles which situation | 2 | directory-current |
| 9 | 2026-10-17 | Nothing in git credits an AI agent; the work is solely the user's | 10 | no-ai-attribution |
| 10 | 2026-10-17 | A project carries only the packs it needs; knowledge projects get no app machinery | packs | pack-purity |
| 11 | 2026-10-17 | Apps start secure, fast and easy to use from the first line | app pack | foundation-set |
| 12 | 2026-10-17 | Files are organized in folders that make sense; the app still starts from the root | 13 | root-tidy |
| 13 | 2026-10-17 | Docs and code capture principles, never the user's literal examples or personal details | 14 | no-verbatim-examples |
| 14 | 2026-10-17 | Reuse an existing skill before writing a new one | 2 | skill-reuse |
| 15 | 2026-10-17 | Setup asks the user first, then gives the project everything that fits its answers; leaving something out needs the user's reason | SETUP-PROMPT.md | setup-interview, setup-complete |
| 16 | 2026-10-17 | A project with a visual interface gets the whole GUI kit: runbook, review loop, screenshot tool and design skill | 9 | gui-pack |
| 17 | 2026-10-17 | Every project is secure by default, not only apps | 15 | security-report, no-secrets |
| 18 | 2026-10-17 | Skills improve from their own misses, and skills nobody uses are reviewed and retired | 2 | skill-learn, skill-prune |
| 19 | 2026-10-17 | Nothing is added unless it makes the project better; the gain and the cost are weighed first | 16 | worth-it |
| 20 | 2026-10-17 | Every name is a variable, defined in one place, so it can be changed easily | 17 | name-var |
| 21 | 2026-10-18 | Setting up or upgrading a project never makes it worse or slower for no reason, and still gives it everything that fits | 16 | upgrade-review, worth-it, setup-complete |
| 22 | 2026-10-18 | Research uses several independent sources, screens out sponsored and biased ones, weighs them together into one verdict, and never states a made-up fact, whether it comes from the web or the project's own files | 4 | research-verified, answer-traced, research-ledger |
| 23 | 2026-10-18 | A skill, runbook or check that keeps frustrating the user is removed automatically: only improvements, never degradation | 18 | friction-suspend |
| 24 | 2026-10-18 | The checks keep the agent honest and make it finish the work, but never stall it in a loop or block progress | 18 | stop-reblock, upgrade-review |
| 25 | 2026-10-18 | Everything in the starter can be used in projects that are sold: only licenses that allow commercial use | 16 | worth-it |
| 26 | 2026-10-18 | Notes are linked to what they relate to, so Obsidian's graph shows the project's relationships; the starter itself is mapped too | 12 | note-linked |
| 27 | 2026-10-18 | The project remembers how it solved earlier requests and starts from that | 2 | recall-hint |
| 28 | 2026-10-18 | The agent can run without asking questions when the user wants that | 5 | setup-interview |
| 29 | 2026-10-18 | .gitignore is checked before every push, in this starter and in every project made from it | 15 | gitignore-ready |
| 30 | 2026-10-18 | Setup, adopting and upgrading explain every choice in plain words (what it does, what you will notice), and always offer to let the AI decide | SETUP-PROMPT.md | setup-interview, setup-complete |
| 31 | 2026-10-18 | Setup reads the project (documents, code, data, earlier AI instructions) to understand it before asking anything | SETUP-PROMPT.md | setup-interview |
