# Security review: the end check's self-runs (2026-11-09)

Scope: the change that lets v2's end check run a project's declared self-test itself (`tools/hooks/v2/lib.mjs`
autoRuns, `tools/hooks/v2/end.mjs`), the `(self: <command>)` marker in `docs/checks/always.md`, the converter
(`tools/always.mjs`), and the approved list that gates it (`tools/hooks/selfcmds.mjs`, the guard in
`tools/hooks/v2/guard.mjs`, `hooks.mjs self-allow`). Raised by a peer's review before the push.

Related: [v2 triage](2026-11-08-v2-triage.md).

## Threat model

- What needs protecting: the user's machine. The Stop hook runs outside the host's permission prompts, so a command it
  runs is not shown to the user first.
- Attackers: content the agent reads (a web page, a file, a pasted or cloned `always.md`) carrying instructions; an
  agent that follows them.
- Entry points: `docs/checks/always.md` (markdown agents edit often), `tools/hooks/requirements.json` (selfRun),
  `tools/hooks/config.json` (the approved list), the agent's tool calls that write those files.
- Exit point: `spawnSync(<command>, { shell: true })` in the end check.
- Six questions: posing as the user (adding to the user's list): checked below. Tampering (an injected self line):
  checked. Repudiation: each approval is a dated line in `docs/DECISIONS.md`. Reading data: the command runs with the
  user's rights, same as any approved one. Denial of service: one run per command per Stop, 120 s timeout, output capped
  at 16 MB. Elevation: running a command without the user's prompt: this is the hole the gate closes.

## Results

| Area | Result | Severity | Evidence |
|---|---|---|---|
| Untrusted content | FAIL -> fixed | high | before: any `(self: ...)` line ran at Stop. Now only a command on `config.json` "selfCommands" runs, matched exactly; v2 test: an injected line that writes a file runs nothing (`pwned.txt` not created), an unlisted command is not run, a listed one is |
| Injection | FAIL -> fixed | high | the shell gets only the user's approved string, never text taken from markdown; mutation: with the list check removed, the v2 test fails |
| Authorization (who may approve) | FAIL -> fixed | high | the guard refuses an agent edit, write or multi-edit of the config that adds a command (judged on the parsed JSON, an escaped key included), a shell write naming the list or using an escape, and the agent's run of `self-allow`; v2 tests, unit and wired; mutation: with the guard rule off, the wired test fails |
| Secrets | N/A | | no keys or tokens involved |
| Private data and sharing | PASS | | no new file leaves the machine; the approved list sits in the project's own config |
| Downloads and third-party skills | N/A | | nothing downloaded |
| Input validation | PASS | | the list is read as an array of strings and compared word for word after trimming; a config that will not parse is treated as adding when it names the list |
| Abuse limits | PASS | | one run per command per Stop, 120 s timeout, 16 MB output cap, at most 3 Stops per request |
| Logging and recovery | PASS | | `self-allow` and the converter each write a dated line to `docs/DECISIONS.md` |
| Output and XSS, request forgery, authentication, sensitive data, file handling, money, dependencies, deployment, infrastructure, build pipeline | N/A | | no web surface, accounts, uploads, payments or deployment in this change; no dependency added |

Pattern sweep (`skills/security-review/scripts/risky-patterns.mjs` over the new and changed lines): 0 leads.

## Attacks tried

1. An injected always.md line whose command writes a file: not run, file not created (v2 test).
2. A listed command next to an unlisted one: only the listed one ran (v2 test).
3. The agent adding to the list by Edit, Write, MultiEdit, `sed -i`, `Set-Content`, `node -e` with an escaped key,
   and `hooks.mjs self-allow`: each refused (v2 tests).
4. An edit that adds an escaped duplicate key while the real key stays: JSON keeps the last key, so the list does not
   grow and nothing new runs; not refused, and correctly so.
5. A search or read naming the list (`grep`, `cat`): not refused.

## Open, for the user to decide

- **A script the agent writes, then runs, could change the config without naming the list in the command** (for example
  a file written with the Write tool, then `node that-file.mjs`). The guard sees neither step as a change to the list.
  That run still goes through the host's own permission prompt for shell commands, like any command the agent runs, so
  it is no worse than the agent running the command itself. Severity: low. A stronger form (only commands that were on
  the list in the last commit run) would also stop it within a session; not done.
- **The converter keeps a self-run that is in the last commit.** A commit the agent made earlier in the same session
  counts. Severity: low; the commit and its DECISIONS line are visible to the user.

## Not run

- Whether the host runs PreToolUse hooks for the user's own `!` commands was not checked. If it does, the guard would
  refuse the user's `! node tools/hooks/hooks.mjs self-allow "..."`; the user can then add the command to
  `tools/hooks/config.json` "selfCommands" by hand. NOT RUN (needs the user at the keyboard).
