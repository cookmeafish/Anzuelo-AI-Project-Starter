# Dogfood log (starter only)

What the starter's engine did, or failed to do, while it governed the starter's own development. Each entry is a
field report from the inside (`tools/starter/runbooks/field-report.md`): confirm the cause, fix it in the engine with a
self-test, then mark it fixed with the commit. New projects never get this file.

| Date | What happened | Cause | Fix |
|---|---|---|---|
| 2026-10-23 | The user asked several times for "many tests until nothing is worse" before it became a runbook | The starter's own work had no runbooks, and the session ran outside the starter, so no hook routed or enforced anything | Maintainer runbooks in `tools/starter/runbooks/` route in the starter (`starter-runbooks:`) |
| 2026-10-23 | A whole session of engine work ran under none of the engine's rules | Claude Code was started in a parent folder; nothing noticed that this project's hooks never saw the session | Commits and pushes from an unseen Claude Code session are refused with the way through; `begin` records the session from its environment (`engine-bypassed`) |
| 2026-10-23 | `check` and every hook saw no tool calls for the current turn | The session's transcript was 568 MB, over the largest string a file can be read into, so `turn()` silently fell back to a record with no history | Transcripts are read from the end in a growing window (`transcript-tail`) |
| 2026-10-23 | `begin` from such a session recorded the request with no session and no transcript | It only knew sessions from hook input | It takes the session id from the environment and finds its transcript (`engine-bypassed`) |
| 2026-10-23 | `selfcheck --tags engine-bypassed` printed "no scenario proves" and never ran the new test; a fast run could not prove it | Every standalone test sat inside the full-run-only block, so their `--tags` gates (two older ones too) were dead code | Tag-gated standalone tests moved after that block; `STANDALONE_TAGS` lets the tag check know them |
| 2026-10-23 | A heredoc-written helper script lost a backslash and failed to parse | Known shell hazard (already in memory), repeated | Write scripts with the editor tool, not heredocs (no engine change) |
| 2026-10-23 | A `--tags answer-language` run said ALL PASS while the two tests just added under that tag never ran | Standalone tests inside the full-run-only block are skipped silently in tag mode; only the scenarios ran | Open: tag mode should say how many standalone tests for the tag wait for a full run (until then, tests meant to run by tag go after that block) |
