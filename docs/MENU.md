# Menu: optional short codes

Codes are a shortcut, never a requirement: plain requests work the same. Type a code plus details, for example
`E3 --brief`. A code means exactly its **Means** column, with every rule applied as if typed in full. An unknown code
or flag, or a flag that doesn't fit the code, gets a question instead of a guess. The hooks read this table, so
editing a row changes what is enforced. Installed packs add their own codes.

## Codes
| Code | What | Runbook | Means (the full request) |
|---|---|---|---|
| E1 | Sweeps | project.md | run the project sweeps (node tools/audit.mjs --full), report each result, and fix every FAIL |
| E2 | New rule | project.md | make this a standing rule: AGENTS.md / CLAUDE.md, a user-requirements row, a requirements.json check, a memory note, tests and audit |
| E3 | Gaps review | project.md | list what I could ask that no runbook or check covers, rank by risk, and fix the top ones |
| E4 | Harden skills | project.md | harden every skill that is due with the skill-harden skill |
| E5 | Status | project.md | tell me where things stand from docs/STATUS.md and update it if it is stale |
| E6 | Engine | engine.md | install, upgrade or remove the engine, or change a hook setting |
| E7 | Add a pack | project.md | show the available packs, recommend the ones that fit this project, and install the ones I confirm |
| E8 | Plan it first | plan.md | write a step-by-step plan for this in docs/plans/ and ask me to review it before starting |
| E9 | Clean up skills | project.md | review the runbooks and skills nobody has used lately, and keep, merge or retire each one with my OK |

## Flags
| Flag | Means |
|---|---|
| --brief | keep the answer short: the result and the reasons, not the process |
| --deep | go further than usual: more sources, alternatives, and what could make this wrong |
| --ask | ask me your clarifying questions before doing anything |
| --no-files | answer in chat only, change no files |
