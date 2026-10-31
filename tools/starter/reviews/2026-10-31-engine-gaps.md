# Engine gap analysis (2026-10-31)

How it was done: five read-only reviews of `tools/hooks/hooks.mjs` against two real projects' logs and transcripts
(project A: 95 requests in its Stop log, project B: 41; about 600 real prompts, about 50 complaints). Every finding
marked **confirmed** was reproduced in code, on real data or with a safe function call; the top ones were rechecked by
hand. Line numbers are `tools/hooks/hooks.mjs` at commit 5406d5f.

## The headline

The "checklist before, proof after" loop has four exits that let an unfinished answer through:

| Exit | What happens | Real data (project A) |
|---|---|---|
| Still running | While any background command or helper runs, Stop checks only truth and privacy (8197-8220). If the next prompt comes before the notice, the full check never runs at all. | 21 of 95 requests ended this way |
| Out of rounds | After the first block, record steps (upset lesson, rule request, requirement, plan) and the project's own checks are only carried over, never enforced (8239). A block made while helpers still ran uses up that one round. | 10 of 95 ended unresolved; 7 still owed the upset lesson |
| Carried over, then forgotten | A carried-over miss comes back only if the next request looks related (about 7971). | Reopened once in all of project A's logs |
| Taken on its word | A "Done N:" line needs no evidence; "Skip N:" drops a failing check with 8 characters of reason; a waiver counts even when the waive command refused it (2540). | "Done 1-12:" covering twelve items in one line |

Only 64 of project A's 95 requests passed the full check.

## Ranked gaps

### Tier 1: unfinished work reaches the user (high likelihood, high harm)

1. **Turns that end "waiting" are never fully checked.** Fix: when the next prompt arrives and the last Stop was
   "waiting", run the full check on that turn and carry its misses; a plain background shell command should not count
   as a helper still working. (confirmed)
2. **One block uses up enforcement.** Records and project checks are deferred from round 2 on, and a block during
   "waiting" counts as round 1. Fix: blocks while helpers run don't count; upset-learned, rule-request,
   requirement-enforced and project checks stay enforceable until round 3. (confirmed)
3. **Carried-over misses are forgotten** unless the next request is related. Fix: always carry them, first thing.
   (confirmed)
4. **Helpers get no checklist and nothing checks them when they finish.** Only the before-tool hook runs inside a
   helper; there is no SubagentStop hook. A helper's report ("all pass", "22 changed") is treated as read material,
   so its numbers count as sourced. Fix: the brief line carries the routed checklist and asks for one evidence row per
   rule; a SubagentStop check; hand-back text counts as a claim, not a source. (confirmed)
5. **No per-item proof for work over many items.** One "Done N" stands for 25 folders. Fix: an item may declare
   `(each: <glob>)`; Stop then needs one evidence line per changed item, or a command run this turn whose output names
   every one. (confirmed)
6. **Only one checklist enforced per turn** (fixed in the pending change for runbooks; skills opened beside a runbook,
   such as debug or research, are still not enforced). (confirmed)
7. **"Do ..." requests are treated as questions.** "do a deep analysis ..." gets the QUESTION hint, skips the
   must-follow hints, and at Stop the agent is told to undo changes the user asked for. Fix: "do/does" + a noun is an
   instruction; add do, check, look, go through, analyze, review, test to the instruction verbs. (confirmed, live in
   this session)
8. **Pasted text counts as the user's own words.** The closing tag carries an id (`</pasted_content id="...">`), which
   the strip pattern (677) never matches, so pasted logs drive upset, rule and routing detection. Fix: accept attributes
   in the closing tag. (confirmed, live in this session)

### Tier 2: wrong or noisy behavior (medium-high)

9. **Compaction mid-turn drops the request and resets the 3-round cap** (turn() takes the summary as the start).
   Fix: keep the prompt and start from turn.json. (confirmed by reproduction)
10. **Two sessions in one project share state:** upset-pending, unresolved, waivers and the turn notes file are not
    per session, so one session's upset blocks the other, and one's "Done N" lines count for the other. (confirmed in
    code; 7 overlapping session pairs in 14 days)
11. **Waivers are too easy:** a bare `N/A(tag)` anywhere in the turn works; the hint itself hands over a ready-made
    reason ("one-off, only for this task", seen about 70 times). (confirmed)
12. **Checklist items whose tag is a hint or a guard, not a Stop check,** pass silently; 17 items in project B are
    proven only by words in the answer. (confirmed)
13. **Facts that aren't numbers are never traced** (names, translations, terms), and tracing runs only for knowledge
    or data questions. Behind several complaints of "you said X exists, it doesn't". (confirmed)
14. **"Done" or "safe to restart" said while work still runs** passes, because the waiting exit doesn't check it.
    (confirmed)
15. **No check that a recommendation was compared against the full candidate set**, the most frequent complaint class
    (about 13 cases). Fix: a generic "Compared: N candidates from <command run this turn>" line, checked against the
    run. (confirmed as a gap; the fix is new)
16. **Spanish:** accented question words and Spanish complaints are missed (no Unicode word boundary); short Spanish
    requests don't route. (confirmed)
17. **"???" alone counts as upset,** blocking edits on eager questions. (confirmed)
18. **The project's own Stop command has a fixed 60 s limit;** a large batch can time out into a deferred step.
    (suspected)
19. **A helper's interim "completed" notice counts as finished** while its own nested helpers still write.
    (confirmed in code and logs)

### Tier 3: safety guards with holes (low likelihood for an honest agent, high harm)

20. **The starter's own hook wiring is stale:** no `mcp__.*`, wakeup or cron tools in its matcher, so connector
    sends aren't gated here (the projects are wired correctly). Fix: rewire, and warn at session start when the
    wiring differs from what wire.mjs writes. (confirmed)
21. **Tools no matcher covers:** Grep and Glob (can print secret files or another person's data), WebFetch, Artifact
    publish, SendMessage. (confirmed)
22. **Connector outward check is a name list with gaps** (document create or update tools pass). Fix: allow only
    read verbs, gate the rest. (confirmed)
23. **A crash or timeout in the before-tool hook lets the call through**; AGENTS.md says crashes block once, but only
    Stop does. (confirmed)
24. **An agent can switch guards off** by editing config.json (`suspended` is not filtered against the safeguards) or
    the hook files. (confirmed)
25. **Command spelling slips past guards:** quoted or `.exe` program names for push, curl upload and JSON flags,
    `gh api -f`, inline-code network writes, `git restore .`, `stash drop`, `find -delete` or `cp` onto protected
    files, `grep` of a secret file, `--channel chrome` browser launch. (confirmed)
26. **File changes made by shell commands skip after-edit work** (the after-tool hook matches only Write and Edit), so
    an em dash or a mirror edit written by a shell command goes unchecked until Stop. (confirmed)
27. **Smaller:** em dash check misses `&mdash;`; mirror guard is case-sensitive on Windows; state files are written
    non-atomically and reset silently when corrupt; the upgrade replaces engine files whole and a project's own hook
    script depends on engine output with no contract test. (confirmed / suspected)

### Tier 4: test and performance

28. **Most self-test scenarios run with the checklist off** (selfcheck.mjs:313), so its interplay with waiting,
    skips and later rounds is barely tested. (confirmed)
29. **Checks that fit the project badly** (security or sweeps on content work) are switched off only after 3 upset
    turns of 6. (confirmed as complaints)
30. **Times shown in UTC**, and long turns re-read the transcript on each hook. (confirmed / suspected)

## Suggested order

1. The four exits (1, 2, 3, plus waivers that count when refused): they decide whether any other check matters.
2. Helpers and per-item proof (4, 5, 6): the case behind the latest complaint.
3. Classifier bugs seen live (7, 8, 9, 10, 16, 17).
4. Safety holes (20 to 26), starting with the stale wiring and the crash pass-through.
5. The rest, each with a self-test that fails first.
