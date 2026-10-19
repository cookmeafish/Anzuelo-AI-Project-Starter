Inspired by the "frontend-design" skill in https://github.com/anthropics/skills (Apache License 2.0, copyright
Anthropic; see LICENSE).

What we changed:
- It works for any interface (web, desktop, mobile) and any agent.
- It adds a usability floor the design never trades away: contrast, keyboard use, both themes, phone and desktop
  sizes, and the empty, loading and error states. All of it is built on the project's design tokens.
- It hands the result to the gui-review-loop skill for screenshot proof.

Sections B to F are inspired by the "design" plugin, version 1.2.0, in
https://github.com/anthropics/knowledge-work-plugins (folder `design`; Apache License 2.0, copyright Anthropic; see
LICENSE-design-plugin). Its design-critique, design-system, ux-copy, accessibility-review and design-handoff skills
were merged here as one skill split by situation, and rewritten in our own words.

What we changed from the plugin:
- One skill instead of five, so a design request has one place to go, sharing the usability floor and the tokens.
- No slash commands, no Figma or other connector requirement: connected tools are optional extras.
- The accessibility check uses WCAG 2.2 AA (the plugin used 2.1), and target size is corrected: 24 CSS px is the AA
  minimum (2.5.8), 44 is the AAA level (2.5.5).
- Critiques of built screens use the project's screenshot tool; audits count raw values by searching the code.
- No scores out of 100 and no emoji severity markers: plain severity words and evidence instead.
- The plugin's user-research and research-synthesis skills went into the user-research library skill instead.

Edit freely; this is our version now.
