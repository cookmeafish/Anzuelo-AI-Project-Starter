# Helper turns get routing and the final check

status: done

Problem: work the user asks for inside a helper agent (a background helper the user talks to directly) gets no
request routing and no final check. Only the before-each-tool hook and session start run in a helper; it ends through
its hand-back, which nothing checks. A runbook step (research before an upgrade) was skipped and nothing held it.
The user also says the engine sometimes does not do its job, so the whole question "where can a turn end unchecked?"
gets a sweep, not only this case.

Facts (probe, 2026-11-05): a helper's tool calls reach PreToolUse with `agent_id` and `agent_type`, and
`transcript_path` is the main session's; its end fires SubagentStop with `agent_transcript_path`. The helper's own
transcript is `<session>/subagents/agent-<agent_id>.jsonl`. A user message reaches a helper as a user row that starts
"The user sent a new message while you were working:".

### Task 1: route a user message that reaches a helper
- [x] At a helper's tool call, find the newest user message in its transcript that was not routed yet.
- [x] Give it the same hints as a prompt (ROUTE, CHECKLIST), once, and remember the runbook and where the notes were.
- [x] Test: a helper transcript with a user message gets the ROUTE hint at its next tool call; one without gets none.

### Task 2: hold the hand-back until the routed checklist is recorded
- [x] SubagentHandback (pretool) and SubagentStop (new hook event) check the routed runbook's "Done when" items
      against the Done/Skip lines written since the message.
- [x] Missing items: the hand-back is refused (SubagentStop: blocked) with the items named; at most 3 times.
- [x] Wire SubagentStop and the SubagentHandback matcher in tools/hooks/wire.mjs.
- [x] Tests: hand-back with items open is refused; with every item recorded it passes; a helper with no user message
      is never held. Each fails on the old engine.

### Task 3: sweep the real sessions for turns that ended unchecked
- [x] Over both projects' session transcripts and their helpers: every user message that reached a helper, and
      whether it was routed and checked. Record the count in a `Sweep:` line.

### Task 4: the loop tests this from now on
- [x] Add "helper turns" to the test kinds in tools/starter/runbooks/improvement-loop.md.

### Task 5: ship
- [x] Full chain, commit, both projects upgraded (handed out).
