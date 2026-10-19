# Better or worse?

Before adding or changing anything in a project (a pack, skill, tool, rule, check, dependency or engine upgrade),
answer these questions. Hard rule 16 sums them up as `Worth it: <gain> / <cost>`. Where a check answers a question
automatically, it is named. When an answer is unclear, ask the user, in plain words, following "Questions with
choices" in [writing-standards.md](writing-standards.md).

## Questions the checks answer
| Question | Answered by |
|---|---|
| Did it change or delete any of the user's files? | the starter's trial (run before every release of the starter) and the upgrade guard |
| Are the user's own rules kept? | the trial; setup merges `*.starter.md` instead of replacing rules |
| Are secrets and private files still out of git? | gitignore-ready, the git pre-push hook, the trial |
| Do the project's own tests and git hooks still work? | the trial; wire.mjs keeps a project's own git hooks |
| Did anything that passed before fail after? | the upgrade guard (rolls back) |
| Is it slower? | `hooks.mjs bench` and the "hooks stay fast" sweep |
| Does a second upgrade change anything? | the trial (an upgrade must be repeatable) |
| Did anything private from the starter leak in? | the trial and the publish-safety sweep |
| Did a check start annoying the user? | friction-suspend (hard rule 18) |

## Questions that need judgment
Ask yourself first. If you can't answer from the project, ask the user.
1. **What gets better, for this project?** Name the concrete gain: fewer mistakes, less to explain, faster work.
   "Could be useful" is not a gain.
2. **Where is the project heading?** Judge by what it is becoming (more code, more history, more people), not only
   what it is today.
3. **What does it cost?** Reading time each session, extra steps per task, upkeep, speed, conflicts with what is
   there, and risk.
4. **Does something here already do this?** Then improve that instead of adding a second one.
5. **Can it be undone?** Prefer changes that can be removed cleanly (packs, library skills and checks can).
6. **Would the user be surprised?** If yes, ask before doing it.
7. **Is the license fine if the project is sold?** It must allow commercial use.
8. **Will it still make sense to the next session, or to another agent?** If it needs this conversation to be
   understood, write down why.

## Asking the user when unsure
Say what you would change and why, in one plain sentence, then give the choices:
- **Add it:** what gets better and what it costs, for this project.
- **Leave it out:** what stays as it is.
- **Let the AI decide:** what you would pick and why.

Record the answer in `docs/DECISIONS.md` with the reason, so the same question is not asked twice.
