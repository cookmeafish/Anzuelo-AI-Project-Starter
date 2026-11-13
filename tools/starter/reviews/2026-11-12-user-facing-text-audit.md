# User-facing text audit, 2026-11-12

Task 2 of [the user-facing text plan](../../../docs/plans/2026-11-12-user-facing-text-audit.md). Input: the 2,309 shown rows
Task 1 collected (⚓ status lines, Stop feedback, prompt and guard lines), from 2026-10-19 05:49 to 2026-11-12 22:56 UTC:
the starter 851 rows, project one 913, project two 517, project three 28.

**The answer in short:**
- Most shown text fails on plainness and once-only, and many lines claim things the transcript does not back.
- The biggest groups, by rows hit: jargon or internal names (2,038 rows), agent-only text shown to the user (626),
  the same item shown again in the same request (624), the same Stop block shown twice (432 of 968 Stop moments),
  and "running / pulled up / brought in" lines with nothing behind them (289).
- The worst truth failures: "🚨 fixed" was never proven (48 of 48), and 41 of them were an old note shown again;
  "🧠 lesson saved" named files the turn never wrote in 43 of 45; "📖 running the X runbook" was backed in only 171 of 398.
- Every row predates release c2f1528 (made 2026-11-12 20:01 -0800, which is 2026-11-13 04:01 UTC). The release claims
  fixes for the truth groups (D, E, F, G in part, I in part, N). I checked those claims in the code, not by a replay.
- Second pass on 20 random items: 14 of 20 agree on every mark (70%), below the plan's 18 of 20.

## How it was judged

- Each row was split into items: each line of a ⚓ block, and the header and each listed step of a Stop feedback block.
  2,309 rows gave 5,894 items in 50 line kinds.
- For each item, the turn's evidence came from the session transcript (`~/.claude/projects/<folder>/<session>.jsonl`):
  the user's last real prompt before the line, every tool call from that prompt up to the line, the last text the agent
  wrote before it, the messages typed mid-task (queue records), scheduled wakeups, and what the agent did after it.
- Marks:
  - **Proven:** did what the line names really happen (or, for a "not done" step, was it really not done)? "Not checked"
    where the transcript could not decide it.
  - **Whole:** not cut. "Cut" means cut mid-word (checked against the agent's own Issue text for 🚨 lines); "shortened"
    means it ends in "…" or "...".
  - **Plain:** a term list (runbook, skill, checklist, wakeup, Finished section, round N of N, file paths, commands,
    "Names:", waive, helper, sub-agent, open plan). Automated, so it over-counts a little.
  - **Useful:** judged per kind: would the user act on it or learn something new from it?
  - **Once:** shown again in the same request (a later round showing the same item), and separately, shown twice in the
    same Stop (the ⚓ copy and the feedback copy at the same second).
- "Proven" was checked against the transcript for 36 of the 43 kinds that make a claim. Of the 40 most frequent kinds,
  6 make no claim of their own (block headers, agent tails, details paths), 31 were checked, and 3 were not (kinds 1, 9
  and 28), so this falls short of the 40 asked for.
- Limits:
  - A "request" is cut at each real prompt and after each end line (passed or ended). Peer messages and wakeups split
    requests in the engine but not always here, so round counts and "once" are close, not exact.
  - Tool text was read up to 700 characters per call, and edit bodies up to 300. A step's tool result (pass or fail) was
    not read, so "run X until it passes" steps after a run are "not checked".
  - Which engine (old or v2) each project ran at each time was not checked row by row.

## Line kinds

One table per kind, largest first. Counts are items. "Doubled" counts items whose Stop moment showed both the ⚓ copy
and the feedback copy. Session ids are the first 8 characters; times are UTC.

### 1. Long tail of other end-check steps (about 300 distinct texts)
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 1,044 | not checked 1,044 | shortened 40 | jargon in 414 | no: agent to-dos | again in request 403; doubled 823 | starter 76462ec3 11-10 19:18 | end-check step labels; project one's own hook |

Most frequent: "and N more" (40), "Say where the new facts in the knowledge base came from" (39), project one's own rule
steps (38 and more), "Check accessibility and say what you found" (28), "Say how the work was verified" (24).

### 2. Stop block header, old engine: "almost done, N steps left (round r of 3)" and "Almost done: N steps are left..."
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 756 | from its steps | yes | jargon in 756 ("round r of 3") | partly: says the turn is not finished | again in request 304; doubled 714 | starter 76462ec3 11-05 15:36 | hooks-main.mjs:4786 (feedback) and :5002 (⚓ copy): one block printed twice |

### 3. Agent instructions at the end of a block ("For the agent: ...", "Fix what isn't done...")
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 496 | no claim | yes | jargon in 484 | no: written for the agent | again in request 78; doubled 420 | starter 76462ec3 11-05 15:36 | hooks-main.mjs:4786 tail; v2/end.mjs:650 and :765 tails |

### 4. "📖 running the X runbook (✅ N items to check off)"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 398 | yes 171 / no 203 / not checked 24 | yes | jargon in 398 | partly | again in request 40 | starter 76462ec3 11-12 22:54 (a "no") | hooks-main.mjs runningLine (about :2960): until 2026-11-12 any Read, `sed -n`, grep or `git add` naming the runbook path counted |

Why "no": the call only read part of the runbook, grepped it, committed it, or named it in a test.

### 5. "✅ checks passed [after N fix rounds] · 📖 runbook followed · ✅ checklist N/N · 🧠 lesson saved in ..."
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 301 | yes 189 / no 112 | yes | jargon in 265 | yes when true | 143 repeat the previous pass line word for word | starter 76462ec3 11-05 15:52 (a "no") | hooks-main.mjs about :2686-2697 (old); v2/lines.mjs passText |

Why "no": the fix-round count did not match the blocks since the last end (69); "🧠 lesson saved" named files this
turn never wrote (43 of 45, one old lesson shown on many turns in project one); "📖 runbook followed" for a runbook not
opened this turn (9 of 142).

### 6. Stop block header, v2 and October forms ("N things left before this is done", "N steps left before done: a; b...")
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 246 | from its steps | shortened 122 ("...") | jargon in 86 | partly | again in request 76; doubled 141 | starter 76462ec3 11-11 02:36 | hooks-main.mjs:5054 stopLine (v2 text); the one-line October form came from an older engine copy |

### 7. Step: "End with a Finished section that lists every changed file"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 160 | yes 152 / no 8 | shortened 26 | jargon in 127 | no: agent to-do | again in request 59; doubled 101 | project one 501e86a8 10-24 19:19 (a "no") | end-check finished-summary step |

Why "no": the answer before the hold already had a Finished section.

### 8. Step: "Run the hook self-tests until they pass" / "Hooks.py changed"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 131 | yes 20 / not checked 111 | yes | jargon in 131 | no | again in request 62; doubled 122 | starter 76462ec3 11-05 15:36 | end-check hooks-tested step |

"Not checked": a run happened in the turn, and its result was not read.

### 9. Project one's own checks (its own icon, from its own hook)
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 125 | not checked 125 | shortened 5 | jargon in 22 | no | again in request 43; doubled 125 | project one 501e86a8 10-23 19:12 | project one's own hook, not the engine |

### 10. Step: "Run the project's health check until it passes"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 122 | yes 42 / not checked 80 | yes | jargon in 122 | no | again in request 55; doubled 114 | starter a87eadd2 10-29 02:40 | end-check audit-run step |

### 11. Reason header shown as a step: "Code changed", "The starter's engine changed", "Hooks.py changed"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 115 | yes 115 | yes | yes | no: it is a reason, not a step | again in request 36; doubled 115 | starter 76462ec3 11-05 15:36 | end-check group label printed as a line |

### 12. Guard refusal: "🛡️ / ❗ stopped an action: <first line of the rule>"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 93 | yes 60 / no 10 / not checked 23 | yes | jargon in 41 | partly: yes for ❗ safety stops, no for quality rules | again in request 17 | starter a87eadd2 10-30 02:17 (a "no") | hooks-main.mjs:2709; the upset rule text at :3072 |

Why "no": 10 of the 27 "The user sounds upset" refusals came on messages that were not upset (a pasted report, a
summary after a context reset, an agreement, a plain request). 9 refusals were for helper briefs, a quality rule.

### 13. "📖 pulled up the X runbook (✅ N items to check off)" at the prompt
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 92 | yes 30 / no 62 | yes | jargon in 92 | partly | again in request 15 | starter 76462ec3 11-05 15:39 (a "no") | hooks-main.mjs promptUserLine :2589 |

Why "no": the agent never opened that runbook in the turn.

### 14. "(details: tools/hooks/state/stop-details.<id>.md)"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 92 | no claim | yes | jargon in 92 | no: an agent file path | again in request 62 | starter 76462ec3 11-11 02:36 | hooks-main.mjs:5054 |

### 15. Step: "Correct the answer: a claim in it is not backed by this turn" (and v2 "the answer says ...")
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 91 | not checked 91 (hand sample of 5: 1 yes, 2 no, 2 unclear) | shortened 2 | jargon in 4 | no: the old form names no claim | again in request 36; doubled 82 | starter 76462ec3 11-10 18:55 | end-check claim-backed step |

In the hand sample, one hold flagged the very "Corrected:" label the engine asks for, and one flagged a claim the answer
had already said was a helper's and not re-checked.

### 16. "🚨 acknowledged: <problem> · <runbook> · fixed when: <outcome>"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 85 | yes 71 / no 14 | cut 45, not checked 9 | jargon in 72 | yes when true | yes | starter 76462ec3 11-08 03:09 (a "no") | hooks-main.mjs acknowledgedLine: the "fixed when" part is cut at a fixed length, mid-word |

Why "no": the Issue line was written by another session in the same folder (the oversight session showed the coding
session's issue), or it was an old Issue line shown on a later, unrelated turn.

### 17. "⚡ running the X skill (✅ N items to check off)"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 79 | yes 11 / no 66 / not checked 2 | yes | jargon in 79 | partly | again in request 3 | starter 76462ec3 11-09 00:17 (a "no") | hooks-main.mjs runningLine (same rule as runbooks) |

Why "no": a grep, sed or notes command only named the skill's file.

### 18. Step: "Screenshot the changed screens and look at every shot"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 78 | yes 16 / not checked 62 | yes | yes | no | again in request 46; doubled 78 | project one 501e86a8 10-25 20:12 | end-check gui-review-loop step |

"Yes": no screenshot was taken in the turn. "Not checked": shots were taken; whether each was looked at was not judged.

### 19. Step: "Note the change in docs/CHANGELOG.md"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 74 | yes 54 / no 20 | yes | jargon in 74 | no | again in request 13; doubled 56 | starter a87eadd2 10-29 02:23 (a "no") | end-check changelog step |

Why "no": the changelog was written in the turn (the order against the last change was not checked), or the starter
wrote its own changelog (`tools/starter/STARTER-CHANGELOG.md`) and the step still named `docs/CHANGELOG.md`.

### 20. Step: "Open the matching runbook and check the work against it"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 73 | yes 35 / no 38 | yes | jargon in 73 | no | again in request 10; doubled 70 | starter a87eadd2 10-31 14:32 (a "no") | end-check runbook-read step |

Why "no": a runbook or skill file was read in the turn.

### 21. Step: "Update docs/STATUS.md so the next session can pick it up"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 70 | yes 40 / no 30 | yes | jargon in 70 | no | again in request 16; doubled 52 | starter a87eadd2 10-30 06:21 (a "no") | end-check status-handoff step |

Why "no": `docs/STATUS.md` was written in the turn, or the starter wrote its own status file
(`tools/starter/STATUS.md`) and the step named a file the starter does not use.

### 22. Step: "Learn from what upset the user, and say where the lesson went"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 70 | yes 38 / no 32 | yes | yes | no | again in request 32; doubled 70 | project one 3e2c8bfc 10-30 02:27 (a "no") | end-check upset step; upset guessed from words |

Why "no": every distinct prompt behind it was read; the "no" ones were a summary after a context reset, a pasted
report, an agreement, a one-character reply, or a plain request.

### 23. Step: "Resume or close the open plan, or say why it stays open"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 68 | not checked 68 (no plan file was touched in 59; whether an open plan fit the request was not checked) | shortened 4 | jargon in 53 | no | again in request 5; doubled 55 | starter 76462ec3 11-10 19:38 | end-check plan-open step (shared-word matching) |

### 24. "🔧 improving the X runbook / skill"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 66 | yes 52 / not checked 14 | yes | jargon in 66 | yes: the user asked for it | yes (1 repeat) | starter a87eadd2 10-30 02:36 | hooks-main.mjs runningLine, edit branch |

### 25. v2 and project headers: "Still not done (...)", "Not done yet:", "Project rules not met yet (tools/hooks/hooks.py ...)"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 65 | from its steps | yes | jargon in 24 | no | again in request 33; doubled 24 | starter 76462ec3 11-10 18:55 | v2/end.mjs:650 and :765; project one's own hook |

### 26. "💬 question: it gets answered first."
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 64 | yes 46 / no 18 | yes | yes | no: the user sees the answer anyway | again in request 10 | starter a87eadd2 10-29 04:07 (a "no") | hooks-main.mjs:2583, set by a word guess |

Why "no": the message had no question in it (a complaint, a pasted report, a plain request).

### 27. Step: "Run the security review: this turn wrote security-sensitive code"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 61 | yes 28 / not checked 33 | yes | jargon in 7 | no | again in request 30; doubled 58 | starter a87eadd2 10-30 04:06 | end-check security step |

"Yes": the review was not run in the turn. Whether the code was really security-sensitive was not judged.

### 28. Step: "These files copy the user's own words"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 58 | not checked 58 | shortened 2 | yes | no: names no file | again in request 31; doubled 52 | starter a87eadd2 11-11 07:37 | end-check no-verbatim-examples step |

### 29. Step: "Record N of the checklist"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 57 | yes 24 / not checked 33 | yes | jargon in 57 | no | again in request 4; doubled 55 | starter a87eadd2 10-29 21:38 | the optional v1 runbook ledger |

### 30. "💬 your message reached Claude mid-task[: it answers you first]"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 55 | yes 55 | yes | jargon in 55 | no: the user sees their own message | again in request 31 | starter 76462ec3 11-08 21:41 | old engine mid-task line, no longer in the code |

### 31. Step: "Name the runbook that was followed"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 52 | yes 42 / no 10 | yes | jargon in 52 | no | again in request 24; doubled 51 | project one 501e86a8 10-23 19:12 (a "no") | end-check runbook-named step |

Why "no": the answer already named a runbook or playbook.

### 32. Step: "State the root cause of the failure that was fixed"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 49 | yes 36 / no 13 | shortened 2 | yes | no | again in request 18; doubled 46 | starter a87eadd2 10-29 21:49 (a "no") | end-check root-cause step |

Why "no": the answer already said "root cause".

### 33. "🚨 fixed: <problem>"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 48 | no 41 / not checked 7 (no check ever proved a fix) | cut 2 | jargon in 2 | no: never proven | yes within a request; one line on 36 requests | starter 76462ec3 11-12 22:36 (a "no") | hooks-main.mjs:2690 says "fixed" once the issue was acknowledged earlier; v2/lines.mjs before 266fdba |

One project one issue written on 2026-11-04 was shown as "fixed" on 36 requests from 2026-11-08 to 2026-11-12, in two
sessions. No Issue line for it was written in any of those turns.

### 34. Step: "Run the build until it passes"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 48 | not checked 48 (a build ran each time; results not read) | yes | yes | no | again in request 30; doubled 48 | project two 3ad38cb6 10-20 01:59 | end-check build step |

### 35. Step: "Cancel the wakeup you left scheduled" / "A wakeup you scheduled is still pending..."
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 47 | yes 42 / no 5 | yes | jargon in 47 | no: in 42 the schedule was the user's standing job | again in request 19; doubled 24 | starter 76462ec3 11-10 19:48 (a "no") | end-check wakeup-left step |

Why "no": the last schedule had already been deleted. One schedule made on 2026-10-30 was held 10 times.

### 36. Step: "Make the writing plain: no em dashes, filler or walls of text"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 41 | yes 8 (an em dash in the answer) / not checked 33 | yes | yes | no | again in request 20; doubled 36 | project one 3e2c8bfc 10-30 04:22 | end-check plain-writing step |

### 37. Step: "Run the tests until they pass"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 40 | yes 2 / not checked 38 | yes | yes | no | again in request 24; doubled 40 | project two 3ad38cb6 10-20 12:07 | end-check tests step |

### 38. "⚠️ ended with N steps not done: <first step> (+N more: node tools/hooks/hooks.mjs why)"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 39 | from its first step (not checked separately) | yes | jargon in 32 | yes: tells the user what is open | yes | starter 76462ec3 11-05 19:22 | hooks-main.mjs:4752 |

### 39. Step: "Fix the checks the last turn left failing"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 38 | yes 33 / no 4 / not checked 1 | yes | yes | no: names no check | again in request 8; doubled 36 | starter 76462ec3 11-05 15:54 (a "no") | end-check unresolved-carryover step |

Why "no": the turn before had ended with checks passed.

### 40. "📌 something left open last time comes first"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 38 | yes 35 / no 3 | yes | yes | partly: does not say what | yes | starter a87eadd2 11-05 09:46 (a "no") | hooks-main.mjs:2597 |

Why "no": the turn before had ended with checks passed.

### 41. Step: "Projects learn what changed from STARTER-CHANGELOG.md"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 37 | yes 13 / no 24 | shortened 2 | jargon in 37 | no | again in request 5; doubled 32 | starter a87eadd2 10-29 02:23 (a "no") | end-check starter-changelog step |

Why "no": the starter changelog was edited in the turn (its order against the last change was not checked).

### 42. "➕ N more [(node tools/hooks/hooks.mjs why)]" and "and N more"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 35 | no claim | yes | jargon in 15 | no: hides steps behind a command | again in request 9; doubled 35 | starter a87eadd2 10-29 21:38 | hooks-main.mjs:5003 |

### 43. "⚡ brought in the X skill" at the prompt
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 28 | yes 14 / no 14 | yes | jargon in 23 | partly | yes | starter a87eadd2 10-29 03:50 (a "no") | hooks-main.mjs:2592 |

Why "no": the skill was not used later in the turn.

### 44. "💬 Claude answered your message"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 23 | no 2 / not checked 21 (a typed message existed; the answer to it was not judged) | yes | yes | no | again in request 6 | starter 76462ec3 11-12 22:54 (a "no") | old engine mid-task line, no longer in the code |

### 45. Step: "This was a question, but files changed"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 12 | yes 12 | yes | yes | no | again in request 2; doubled 12 | starter a87eadd2 10-29 02:23 | end-check question-edit step |

### 46. "🟢 on duty: N runbooks, N skills and the project's checks"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 11 | not checked | yes | jargon in 11 | no: the user asked for it to go | yes | starter a87eadd2 10-29 02:20 | old session-start line, removed (hooks-main.mjs:2623 note) |

### 47. "🔁 your files from before the interruption are intact"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 8 | not checked | yes | yes | no: the user asked for it to go | yes | starter a87eadd2 10-29 07:36 | hooks-main.mjs:2150 |

### 48. "🔧 a much-used runbook is ready to harden"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 7 | not checked | yes | jargon in 7 | no: a chore | yes | project one 3e2c8bfc 10-29 01:30 | hooks-main.mjs:2078 |

### 49. "❓ Claude is asking you something"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 5 | yes 4 / no 1 | yes | yes | yes | yes | starter 43a3aa1b 11-02 01:33 (a "no") | hooks-main.mjs:2698 (the answer's last line ends with "?") |

### 50. "🔄 a starter upgrade needs a look"
| Count | Proven | Whole | Plain | Useful | Once | Example | Cause |
|---|---|---|---|---|---|---|---|
| 3 | not checked | yes | yes | partly | yes | project one 3e2c8bfc 10-29 20:41 | old session-start line |

## Problem groups, ranked by rows hit

Rows are of 2,309; items are of 5,894. Two real examples each (session, time UTC). Groups overlap: one row can be in
several.

| Rank | Group | Rows | Items | Examples | Code that makes it |
|---|---|---|---|---|---|
| 1 | L. Jargon or internal names on screen (runbook, skill, checklist, round N of 3, wakeup, file paths, commands) | 2,038 | 3,890 | starter 76462ec3 11-05 15:36; starter 76462ec3 11-10 18:55 | every line builder; step labels come from check names |
| 2 | A. Agent-only text shown to the user (For the agent tails, details paths, `node tools/hooks/hooks.mjs why`, Names:, waive syntax, "N more") | 626 | 675 | starter 76462ec3 11-05 15:36; starter 76462ec3 11-10 18:55 | hooks-main.mjs:4786, :5003, :5054; v2/end.mjs:650, :765 |
| 3 | C. The same item shown again in the same request (rounds 2 and 3 repeat round 1) | 624 | 1,719 | starter 76462ec3 11-05 15:36; starter 76462ec3 11-10 18:55 | Stop rounds resend the whole list; nothing remembers what was shown |
| 4 | B. The same Stop block shown twice (⚓ copy plus feedback copy at the same second) | 432 | 2,460 | starter 76462ec3 11-05 15:36; starter a87eadd2 10-29 02:23 | hooks-main.mjs:4786 and :5002 both print the block |
| 5 | D. "running / pulled up / brought in" with nothing behind it | 289 | 345 | starter 76462ec3 11-05 15:39; starter 76462ec3 11-12 22:54 | runningLine counted any command naming the file; promptUserLine shows the route before the agent acts |
| 6 | H. Shortened with "…" or "..." (whole words, but the sentence is cut) | 195 | 205 | starter 76462ec3 11-10 20:25; starter a87eadd2 11-10 21:48 | writing.mjs clip (90 characters); the older "..." header |
| 7 | I. A trigger fired without its cause (question with no question, upset with no upset, claim false alarms, carryover after a pass, runbook already opened or named) | 116 | 118 | starter 43a3aa1b 11-02 01:33; starter 76462ec3 11-05 15:54 | word guesses at the prompt; end-check steps that do not read the answer |
| 8 | J. Pass line parts unproven (fix rounds 69, lesson files 43, runbook followed 9) | 112 | 112 | starter 76462ec3 11-05 15:52; starter 76462ec3 11-11 02:36 | hooks-main.mjs about :2686-2697; v2/lines.mjs passText |
| 9 | E. Old or other-session notes shown as this turn's (fixed 41, acknowledged 14, lesson 43) | 59 | 98 | starter 76462ec3 11-08 03:09; starter 76462ec3 11-12 22:35 | the whole shared `.cache/turn-notes.md` was read, not this turn's lines |
| 10 | F. "fixed" said with no proof | 48 | 48 | starter 76462ec3 11-08 23:42; starter 76462ec3 11-12 22:35 | hooks-main.mjs:2690 |
| 11 | G. Cut mid-word | 47 | 47 | starter 76462ec3 11-10 19:36; starter a87eadd2 10-29 19:34 | hooks-main.mjs:2642 and :2680 (`slice(0, 110)`), and the acknowledged line's "fixed when" cut |
| 12 | K. A wakeup held though the user asked for the schedule | 42 | 42 | starter 76462ec3 11-05 15:40; starter 76462ec3 11-10 19:34 | end-check wakeup-left step |
| 13 | M. A step names a record file the starter does not use (`docs/STATUS.md`, `docs/CHANGELOG.md`) | 22 | 24 | starter a87eadd2 10-29 02:23; starter a87eadd2 10-31 08:16 | status-handoff and changelog steps read fixed paths |
| 14 | N. A quality rule refused a helper launch (brief rules) | 9 | 9 | starter 76462ec3 11-12 22:52; project one 3e2c8bfc 10-30 20:04 | old guard subagent-brief rule |

## What release c2f1528 claims to fix

Range read: `git log 7bc9bc7..c2f1528` (76 commits). How I checked each claim: I read the commit message, then the
code it names in the current tree, and looked for a test that names the behavior. I did not run the self-tests and did
not replay the engine over these rows. All 2,309 rows were shown before the release, so no row shows the fixed behavior.

| Group | Claimed by | What I checked | Result |
|---|---|---|---|
| D running / pulled up | 65b0057, a442cfd, 488aa5c | runningLine in hooks-main.mjs now needs a Skill call or the routed runbook (comment "Lesson (2026-11-12)"); selfcheck.mjs:9841 test comment; the v2 code has no "pulled up" or "brought in" text | Claimed for "running". "pulled up" and "brought in" stay in the old engine (promptUserLine :2589, :2592) and are not claimed |
| E old notes | 5d93bf1, 4d6127c, 65b0057 | v2/lines.mjs passText reads notesOf (only this turn's part of the notes file); v2/selftest.mjs:826-838 tests notesOf and notesMark; the lesson part counts only files this turn wrote | Claimed for v2. The old engine's line (hooks-main.mjs:2680-2690) still reads `x.notes` whole. Lines another session writes to the same notes file during the turn: claimed in 65b0057 ("notes in a shared folder count only lines this session's calls wrote"); not verified in code |
| F "fixed" | 266fdba, 65b0057 | v2/lines.mjs passText never says "fixed"; v2/selftest.mjs:2702 names it | Claimed for v2. hooks-main.mjs:2690 still says "fixed" |
| G cut mid-word | 65b0057 ("short and whole (writing.mjs clip)") | writing.mjs clip cuts at a word and adds "…" | Mid-word cuts fixed in v2. Lines still end in "…" (group H), and the old engine still uses `slice(0, 110)` |
| I triggers, in part | bbe1a99 (no 💬 lines), e476667 (prompt checks read only the user's own words) | V2_SHOWS marks the question line as dropped; no "reached Claude mid-task" or "answered your message" text is left in tools/hooks; v2/start.mjs relayedRx skips cross-session messages; v2/guard.mjs:581 strips pasted blocks | The 💬 lines are gone. Pasted reports: handled in the v2 guard; the upset step at the prompt was not traced. Agreements and plain requests read as upset: not claimed |
| K wakeup | e476667, 6c2c7bf ("a recurring schedule never holds") | the phrase was not found in v2/end.mjs or v2/lib.mjs | Claimed; not verified in code |
| Format steps (kinds 7 and 36) | e476667, 6c2c7bf ("format items never hold") | v2/end.mjs:743 comment | Claimed for v2 |
| N helper brief | bbe1a99 | v2/guard.mjs:301 ("REQ: subagent-brief is never a refusal") | Claimed and present |
| A, B, C, H, J (rounds), L, M | none | | Not claimed. Plan Task 3 |

## Second pass: 20 random items

20 items were drawn from the 5,894 with a fixed seed and judged again from the transcript evidence alone, without the
first pass's rules. The second pass was done by the same reviewer, not a second agent as the plan asks.

| Item | Kind | First pass | Second pass | Agree |
|---|---|---|---|---|
| 4325 | 2 (project one's own header) | from steps, plain no | not checked, plain no | yes |
| 4810 | 21 STATUS step | yes | yes (written right after the hold) | yes |
| 4961 | 4 running runbook | yes | yes (read whole) | yes |
| 5679 | 21 STATUS step | no (written earlier in the turn) | yes (no write in the last calls) | no |
| 4809 | 15 claim step | not checked | not checked | yes |
| 2822 | 1 project one rule step | not checked | not checked | yes |
| 4113 | 2 header, round 2 | from steps, again in request | same | yes |
| 238 | 14 details path | no claim | no claim | yes |
| 2461 | 23 plan step | not checked (no plan touched) | yes (an open plan existed) | no |
| 741 | 4 running runbook | yes, shown again | yes, once | no |
| 880 | 5 checks passed | yes | yes | yes |
| 3813 | 24 improving | not checked | yes (the runbook was edited) | no |
| 1373 | 8 self-tests step | not checked | no (the full run passed in a frozen copy) | no |
| 2413 | 5 checks passed | yes | yes | yes |
| 5346 | 1 self-test failed step | not checked | yes (the run was stopped partway) | no |
| 1531 | 12 guard refusal | yes | yes | yes |
| 1773 | 26 question line | yes | yes | yes |
| 5881 | 3 agent tail | no claim, again in request | same | yes |
| 3373 | 28 own-words step | not checked | not checked | yes |
| 491 | 11 reason header | yes | yes | yes |

Agreement: 14 of 20 on every mark (70%). By mark: proven 15 of 20, whole 20 of 20, plain 20 of 20, useful 20 of 20,
once 19 of 20. This misses the plan's 18 of 20. Four of the six disagreements are first-pass "not checked" items that a
hand read could decide, so the first pass is cautious more than wrong; item 5679 is a real conflict about where the turn
starts.

## Not done or not verified

- No self-test, audit or replay was run; the release claims were checked by reading code only.
- Step results ("until it passes") were not read, so 277 such items stay "not checked".
- Kinds 1, 9, 28, 46 to 48 and 50 were not checked against the transcript.
- The plan's `plan-tasks.mjs check` step was not run, and the plan does not link this report yet; this task changed no
  file but this report.
- The 20-item re-judge was done by the same reviewer, not a second agent.
