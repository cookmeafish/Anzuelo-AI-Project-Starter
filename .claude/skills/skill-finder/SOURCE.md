Inspired by the "skill-lookup" skill in https://github.com/f/prompts.chat (MIT License, copyright Fatih Kadir
Akin and contributors; see LICENSE).

What we changed:
- It searches many places in a fixed order (local, official, the open skills CLI, community), not one registry.
- It treats every candidate as untrusted third-party code: every file, the license and the behavior get checked.
- It installs only with the user's OK, through `tools/skills.mjs`, and then makes the skill ours.
- It writes the "Existing skills checked" line the skill-reuse hook needs.

Edit freely; this is our version now.
