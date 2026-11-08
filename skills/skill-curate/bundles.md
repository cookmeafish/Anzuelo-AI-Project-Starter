# Share skills as a bundle (step 4 of skill-curate)
When the user wants to hand skills to another project, a teammate or another AI agent, package them as a **bundle**:
a plain folder that any agent able to read SKILL.md files can use.
1. **Pick the set:** only skills that work together and that the receiver will use.
2. **Lay it out** in `.cache/bundles/<bundle-name>/` (lowercase words joined by hyphens):
   - `skills/<name>/` for each skill, copied whole (SKILL.md, `references`, `scripts`, LICENSE, SOURCE.md);
   - `README.md`: what each skill does, the phrases that start it, what it needs (tools, environment variables,
     connections), a version number starting at 0.1.0, and how to install it (copy the folders into the agent's
     skills folder, or `npx skills add <owner/repo>` once it is in a repository);
   - `LICENSE` for the bundle, chosen by the user. Each third-party skill keeps its own license and SOURCE.md.
3. **Make the copies generic.** Remove this project's paths, people, private facts and rules (AGENTS.md rule 14).
   Name outside tools by their kind ("the issue tracker", "the team chat") and list every such blank in a "Setup"
   table in the README: the blank, what fills it, an example. Paths inside a skill are relative to its own folder.
   Secrets are read from environment variables named in the README, never written in files.
4. **Extras for one agent are optional.** If the user names an agent with its own packaging format (a manifest file,
   a plugin folder), add that on top of the plain layout; never make the bundle depend on it.
5. **Check it:** `node skills/skill-curate/scripts/bundle-check.mjs .cache/bundles/<bundle-name>` must print
   `RESULT: PASS`, with each warning fixed or explained. Run `node tools/writing-check.mjs` on the README and the
   **security-review** skill before it leaves the machine.
6. **Hand it over:** a zip of the folder in `.cache/bundles/`, or a folder the user picks. Uploading, publishing or
   sending it anywhere is an outward action and needs the user's OK in this conversation (AGENTS.md rule 6).

**Receiving a bundle** someone else made is bringing in third-party skills: vet and adopt each with the
**skill-finder** skill. Fill its Setup blanks from what the project already knows (`docs/BRIEF.md`,
`docs/names.json`, `docs/recommended-tools.md`) and ask for the rest in one question. Keep its skill names, so later
versions of the bundle still line up.

The bundle steps draw on Anthropic's Plugin Management plugin (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
