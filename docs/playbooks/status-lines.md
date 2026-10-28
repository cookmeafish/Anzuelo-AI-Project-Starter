---
name: status-lines
summary: Turn the "⚓" status lines the user sees on or off, all of them or one kind at a time.
triggers: turn off the icons, hide the icons, disable the icons, turn on the icons, show the icons again, too many icons, stop showing the anchor lines, hide the anzuelo lines, turn off the anzuelo lines, show the anzuelo lines, hide the praise line, hide the skill line, quitar los iconos, ocultar los iconos, mostrar los iconos
checks: none - a settings change the user sees on their next message
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
   | runbook | 📖 | the message matched a runbook |
   | skill | ⚡ | the message matched a skill |
   | checklist | ✅ | the runbook's checklist count |
   | passed | ✅ | a work turn passed its checks (the whole end-of-turn line) |
   | praise | 🌟 | what the user praised is kept |
   | pause | ⏸️ | the user asked to pause |
   | scope | 🔒 | one person's files are kept apart from another's |
   | left-open | 📌 | something was left open last time |
   | new-task | 🌱 | a new runbook was made for a new kind of task |
   | session | 🟢 | a session started |
   | resumed | 🔁 | files from before an interruption are intact |
   | critical | ❗ | a critical guard stopped an action |
   | blocked | 🛡️ | another guard stopped an action |
   | upgrade, plan, routine, inbox, feedback, harden, stale | 🔄 🗺️ ⏰ 📥 📨 🔧 🕰️ | session reminders |
   | not-fit | 🚫 | a runbook or skill the hooks pulled up didn't fit, and why |
   | lesson | 🧠 | a lesson was saved, or a word was whitelisted |
   | asking | ❓ | the answer asks the user something |

   "The reminders" means all seven session-reminder kinds. "✅" alone is open (checklist count or the whole "checks
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

## Pitfalls
- Hiding a line never turns off the check behind it: the guard, the checklist and the end-of-turn checks still run.
