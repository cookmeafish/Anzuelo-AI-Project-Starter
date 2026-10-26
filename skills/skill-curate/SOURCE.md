Our own skill. Section 4 (sharing skills as a bundle, and receiving one) draws on the "create-cowork-plugin" and "cowork-plugin-customizer" skills of the Plugin Management plugin 0.2.2 in https://github.com/anthropics/knowledge-work-plugins (Apache License 2.0, copyright Anthropic; see LICENSE).

What we kept:
- start with the smallest useful set of skills;
- a README that says what each one does and needs, with a version number;
- outside tools named by their kind, with the blanks a receiver fills in listed;
- paths relative to the skill, and secrets in environment variables;
- a structure check before handing it over;
- skill names kept when customizing, so later versions line up.

What we changed: the bundle is a plain folder of SKILL.md skills that any agent can read, not a product-specific plugin file, manifest or desktop-app flow; a vendor's packaging is an optional extra. The structure check is our own script, scripts/bundle-check.mjs. Receiving a bundle goes through our skill-finder vetting, and sharing or publishing needs the user's OK. Agents, hooks and connector setup from the originals were left out: the project's own hooks and the mcp-builder library skill cover those. All text is our own.

Edit freely; this is our version now.
