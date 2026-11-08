# How to use this project

You talk. The AI does the rest.

1. **Open this folder** with your AI agent (Claude Code, Codex, Cursor, or any other).
2. **First time only:** say **"set up this project"**. It asks a few questions, then builds everything.
3. **After that, just ask** for what you want, in your own words.

You don't need to read anything else.

## The three kinds of automatic check
| Kind | When | What it does | Can it stop the AI? |
|---|---|---|---|
| **Reminder** | When you send a message | Tells the AI which procedure fits and what "done" means for it | No |
| **Guard** | While the AI works | Refuses one unsafe action the moment it is tried: secrets, protected files, words you banned, sending or publishing anything, risky git | Yes, only that one action |
| **Check** | When the AI says it's done | Looks at what was really done, sends the AI back for anything missing (at most 3 times), and has it tell you plainly what isn't done | Yes, at the end only |

Nothing else interrupts the work. The small status lines you may see ("acknowledged", "running the X runbook") are
only for you; they never stop the AI.

## Good to know
- **If it gets something wrong, tell it.** It fixes the mistake, stores the lesson where it stops the next one (the
  skill that missed it, a rule, an automatic check), and tells you in plain words what changes. Lessons about the starter
  itself reach your other projects too.
- **Want something done the same way every time?** Say "from now on, always ...". It becomes a rule.
- **Short codes are optional.** Say "show me the menu" to see them.
- **Not sure where things stand?** Ask "where are we?"
- **Want it to check itself?** Say "run the sweeps".
- **It keeps itself lean.** It asks before removing skills you no longer use.
