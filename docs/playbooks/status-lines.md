---
name: status-lines
summary: Turn the "⚓ Anzuelo" lines the user sees on or off, all of them or one kind at a time.
triggers: turn off the icons, hide the icons, disable the icons, turn on the icons, show the icons again, too many icons, stop showing the anchor lines, hide the anzuelo lines, turn off the anzuelo lines, show the anzuelo lines, hide the praise line, hide the skill line, quitar los iconos, ocultar los iconos, mostrar los iconos
checks: none - a settings change the user sees on their next message
---
# Turn the status lines on or off

The hooks show the user short "⚓ Anzuelo" lines with an icon for each kind of thing they did. They are on by default.
The user decides which ones stay.

## Steps
1. Find which kinds the user means, by icon or by name:

   | Kind | Icon | Shown when |
   |---|---|---|
   | upset | 🚨 | the message sounds upset ("noticed"), and at the end what the agent found ("acknowledged: <issue> → fixed", "nothing to fix", "checked") |
   | question | 💬 | the message asks something: it gets answered first |
   | rule | 📜 | a standing rule or requirement was heard |
   | runbook | 📖 | the message matched a runbook |
   | skill | ⚡ | the message matched a skill |
   | checklist | ✅ | the runbook's checklist count |
   | passed | ✅ | a work turn passed its checks (the whole end-of-turn line) |
   | praise | 🌟 | praise was noted |
   | autonomy | 🚀 | the agent works on its own |
   | pause | ⏸️ | the user asked to pause |
   | scope | 🔒 | one person's files are kept apart from another's |
   | small-fix | 🪶 | a small fix gets the light process |
   | left-open | 📌 | something was left open last time |
   | new-task | 🌱 | a new kind of task, no runbook yet |
   | session | 🟢 | a session started |
   | resumed | 🔁 | files from before an interruption are intact |
   | critical | ❗ | a critical guard stopped an action |
   | blocked | 🛡️ | another guard stopped an action |
   | upgrade, plan, routine, inbox, feedback, harden, stale | 🔄 🗺️ ⏰ 📥 📨 🔧 🕰️ | session reminders |
   | not-fit | 🚫 | a runbook or skill Anzuelo pulled up didn't fit, and why |
   | lesson | 🧠 | a lesson was saved |
   | asking | ❓ | the answer asks the user something |

2. Edit `tools/hooks/config.json`, key `"userLines"`:
   - all off: `"userLines": false`
   - some off: `"userLines": { "hide": ["praise", "skill"] }` (keep the kinds already hidden; add or remove only what
     the user named)
   - all on again: `"userLines": true`
3. Tell the user in one line which lines are now hidden and how to bring them back ("say 'show the icons again'").

## Done when
- [ ] `"userLines"` in tools/hooks/config.json hides exactly the kinds the user named, and keeps the rest as they were
      (judgment: which kinds the user meant needs a reader).
- [ ] The answer says which lines are hidden now and how to bring them back (judgment: plain wording for the user).

## Pitfalls
- Hiding a line never turns off the check behind it: the guard, the checklist and the end-of-turn checks still run.
