Inspired by the "incident-response" skill of the "engineering" plugin (version 1.2.0, by Anthropic) in
https://github.com/anthropics/knowledge-work-plugins, found at `engineering/skills/incident-response/`. The
repository uses the Apache License 2.0 (see LICENSE).

What we changed:
- All text is rewritten in our words and house style. Nothing is copied.
- A "limit the harm" phase comes before the fix, and every production action and every message to people needs the
  user's OK first (AGENTS.md rule 6). Updates are drafts until then.
- The fix goes through this starter's debug skill, `bugfix` runbook and `release` runbook. Data repairs go through
  the `data-change` runbook, with a snapshot first.
- The incident is logged as it happens in `docs/incidents/`, and the post-mortem lives in the same file. Its actions
  are typed (prevent, notice sooner, recover faster) and should become checks, and each incident adds a row to
  `docs/lessons.md`.
- Our own severity table, with the update pace for each level, and level 4 handed to the `bugfix` runbook.
- New: Done-when and Pitfalls sections, the gap between start and notice as a finding, and the security-review
  hand-off for breaches.
- Left out: the optional tool connectors (monitoring, paging, chat). When such tools are connected, the agent may
  read from them; otherwise the user pastes the data. The slash-command modes became the skill's sections.

Edit freely; this is our version now.
