Inspired by the "commit-archaeologist" skill in https://github.com/Shubhamsaboo/awesome-llm-apps, found at
`agent_skills/commit-archaeologist/`. The repository uses the Apache License 2.0 (see LICENSE). The license file names
no copyright holder. The skill's own metadata names Matt Van Horn as its author.

What we changed:
- All text is rewritten in our words and house style.
- The Python script is replaced by our own Node script, `skills/commit-archaeologist/scripts/dig.mjs`. It is
  read-only and needs nothing installed.
- New in the script: a function mode (`--func`), notes for shallow clones and uncommitted edits, bulk commits left out
  of companion counts, revert links between commits, more intent signals, `.git-blame-ignore-revs` support, names
  without emails, and ancestry checks for code that was moved or copied in.
- New in the skill: a step that reads the commits behind the summary, a report template, a change-risk checklist with
  a test question, hand-offs to the debug and codebase-map skills, and an offer to record a lasting reason in
  `docs/DECISIONS.md`.
- Left out: the original's README, install notes and eval files. They describe how to install and test the original,
  not how to do the work. Their trigger and near-miss cases became the "Not for" line and the triggers.

Edit freely; this is our version now.
