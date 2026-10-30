---
name: status-lines
summary: Turn the "⚓" status lines the user sees on or off, all of them or one kind at a time.
triggers: status bar, the bar says, statusline, turn off the icons, hide the icons, disable the icons, turn on the icons, show the icons again, too many icons, stop showing the anchor lines, hide the anzuelo lines, turn off the anzuelo lines, show the anzuelo lines, hide the praise line, hide the skill line, quitar los iconos, ocultar los iconos, mostrar los iconos
checks: core: status-bar, hooks-tested
---
# Turn the status lines on or off

The hooks show the user short "⚓ <!--name:STARTER_NAME-->Anzuelo<!--/name-->" lines with an icon for each kind of thing they did. They are on by default.
The user decides which ones stay.

## Steps
1. Find which kinds the user means, by icon or by name:

   | Kind | Icon | Shown when |
   |---|---|---|
   | upset | 🚨 | the agent confirmed a real issue the user is upset about ("acknowledged: <issue> → fixed"); nothing is shown otherwise |
   | question | 💬 | the message asks something: it gets answered first |
   | rule | 📜 | a standing rule was saved, or a requirement is now enforced |
   | runbook | 📖 | the message matched a runbook, and each runbook the agent runs ("running the X runbook", with its checklist count) |
   | skill | ⚡ | the message matched a skill, and each skill the agent runs |
   | checklist | ✅ | the runbook's checklist count |
   | passed | ✅ | a work turn passed its checks (the whole end-of-turn line) |
   | praise | 🌟 | what the user praised is kept |
   | pause | ⏸️ | the user asked to pause |
   | scope | 🔒 | one person's files are kept apart from another's |
   | left-open | 📌 | (not shown: the agent picks up what was left open itself) |
   | new-task | 🌱 | a new runbook was made for a new kind of task |
   | session | 🟢 | (not shown: being on duty is implied) |
   | resumed | 🔁 | (not shown: intact files are implied; ❗ shows when they are broken) |
   | critical | ❗ | a critical guard stopped an action |
   | blocked | 🛡️ | another guard stopped an action |
   | upgrade, plan, routine, inbox, feedback, stale | 🔄 🗺️ ⏰ 📥 📨 🕰️ | (not shown: session reminders go to the agent, which acts on them) |
   | harden | 🔧 | the agent changes a runbook or skill ("improving the X runbook") |
   | not-fit | 🚫 | a runbook or skill the hooks pulled up didn't fit, and why |
   | lesson | 🧠 | a lesson was saved, or a word was whitelisted |
   | asking | ❓ | the answer asks the user something |

   "The reminders" means the six session-reminder kinds. "✅" alone is open (checklist count or the whole "checks
   passed" line): ask in one line which. "Too many icons" names no kind: ask in one line which to keep, offering
   this table's icons.
2. Read the current value: `"userLines"` in `tools/hooks/config.json`; when the key is missing, it is `true` (all on).
   Write the new value there (add the key when it is missing; if the host refuses the edit, `engine.md` §5):
   - all off: `"userLines": false`
   - all on again: `"userLines": true`
   - some off: `"userLines": { "hide": [<kinds>] }`. Start from what is hidden now: from `true`, the kinds the user
     named; from `false` (all off) with "show X", every kind in the table except X; from a `hide` list, add or remove
     only what the user named. A `hide` list left empty is written as `true`.
3. Tell the user in one line which lines are now hidden and how to bring them back ("say 'show the icons again'").

## Done when
- [ ] `"userLines"` in tools/hooks/config.json changed from its old value (git diff shows both) only by what the user
      asked: `false` for all off, `true` for all on, otherwise a `hide` list with exactly the named kinds added or
      removed (judgment: which kinds the user meant needs a reader).
- [ ] The answer says which lines are hidden now and how to bring them back (judgment: plain wording for the user).
- [ ] A change to the status bar (below): its self-test passes and failed before the fix (hook: hooks-tested).
- [ ] A change to the status bar: a sweep over real session logs shows 0 wrong, in a `Sweep:` line (judgment: the log is the user's, outside the project).
- [ ] A change to the status bar: every other status line (the project's, the user's) still shows first and unchanged, in the status-bar self-test (hook: hooks-tested).

## Pitfalls
- Hiding a line never turns off the check behind it: the guard, the checklist and the end-of-turn checks still run.
- The status bar (below) is not one of these lines: it has its own section, and a fix to it follows that section.

## The status bar
`tools/hooks/statusline.mjs` draws one line under the prompt (Claude Code's "statusLine" setting, in the project's
`.claude/settings.local.json`: `node "<project>/tools/hooks/statusline.mjs"`). It never repeats what the chat shows.
Any other status line (the `statusLine` in the project's `.claude/settings.json`, else in `~/.claude/settings.json`,
often from another app: model, context, folder) is printed first, unchanged, and this line goes under it. The engine
never overrides or disables a status line but its own.
It reads the session's whole transcript and follows one rule: **the newest entry decides**. A final reply (any stop
but a tool call: `end_turn`, or `stop_sequence` when the usage limit cut it) with nothing after it means the turn
ended; anything newer (a tool call, a tool result, a typed message, a background agent's notice, a message from
another session, a queued message) means work is going on.

| State | Shows |
|---|---|
| no turn yet | nothing |
| the agent is busy | ⏳ working |
| the Stop hook sent it back for steps, while it does them | almost done, N steps left |
| the reply is written, background agents or commands still run | ⏳ waiting on N background tasks |
| ended, the checks passed | nothing (the chat says it) |
| ended with steps not done (third round, or a pause) | ⚠️ ended with N steps not done: ... |
| ended, no end message | nothing |

A change to the bar:
1. Change the rule or the table above first, then the code. A state the table lacks is the bug.
2. Add the case to its self-test (`node tools/hooks/selfcheck.mjs --tags status-bar`, a recorded session that walks
   through every state) and see it fail before the fix.
3. Sweep a real session log: run the bar on every prefix that ends at a tool call or a turn end, against facts read
   independently (a tool call is busy; Claude Code's own `turn_duration` entry is an end), and write
   `Sweep: ... - <N checked, N wrong>` in `.cache/turn-notes.md`. 0 wrong, or it isn't fixed.

Its checklist is in "Done when" above (the items that start "A change to the status bar").

Pitfalls (bar):
- Fixing the moment in the screenshot: six fixes in one session each passed their screenshot and broke other moments.
  The cause was a guess about where a turn starts (only a typed message), while notices and messages from other
  sessions start work too. A sweep of the first fix found 95 wrong moments out of 507.
- Reading only the end of the transcript: a long turn pushed its start and its background agents' launches out of the
  window. The whole file reads in about 25 ms at 7 MB.
- A finished-agent notice can sit in a plain message, a list of parts or a queued command; copies of requests
  (`api-request-blob`) hold old notices too and are skipped. A command the agent stopped itself (TaskStop) gets no
  notice at all, only a "Successfully stopped task" result: without it the bar waited for the rest of the session.
  Sweep more than one session: the first one swept had no stopped commands, and no turn cut by the usage limit
  (it ends with `stop_sequence`, not `end_turn`: any stop but a tool call ends the turn).
- Replacing the user's own bar: a project's statusLine setting overrides the user's, so model, context and folder
  vanished. The bar runs the user's command first; the self-test checks it stays first and unchanged.
- Pointing a project at a bar in a temporary folder: it vanishes when the folder is cleaned. The project's own
  `tools/hooks/statusline.mjs` (shipped by the engine) is the one to use.
