Inspired by the "architecture", "system-design" and "tech-debt" skills of the "engineering" plugin (version 1.2.0,
by Anthropic) in https://github.com/anthropics/knowledge-work-plugins, found at `engineering/skills/`. The repository
uses the Apache License 2.0 (see LICENSE).

What we changed:
- Three overlapping skills became one, in three parts: record a decision, design a system, pay down tech debt.
- All text is rewritten in our words and house style. Nothing is copied.
- Decisions are recorded as rows in this starter's `docs/DECISIONS.md` table, with a concrete "Reopen if", instead of
  separate numbered decision documents. A long comparison may still get its own file, linked from the row.
- Designs are saved next to the feature spec and built through the `feature` runbook. Debt is saved to
  `docs/tech-debt.md` and paid through the `bugfix` and `feature` runbooks, with tests pinning behaviour first.
- The debt ranking uses our own formula, (pain + risk) divided by effort, with security and data risks first.
- New: worked load math, a design checklist, "pick the simplest design that meets the numbers", hand-offs to the
  security-review, codebase-map and commit-archaeologist skills, and Done-when and Pitfalls sections.
- Left out: the optional tool connectors (knowledge base, project tracker) and the slash-command usage notes. Any
  agent can do the work with the project's own files.

Edit freely; this is our version now.
