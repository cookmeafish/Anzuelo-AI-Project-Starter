---
name: docs
summary: Write or fix the project's docs - README, how-to guides, reference pages, docstrings - one Diataxis type per page, commands taken from the real config and run before they are written down
triggers: readme, write the readme, update the readme, document this, document the api, add docstrings, docstrings, write the docs, update the docs, api docs, api reference, how-to guide, write a tutorial
trigger_regex:
menu:
---
# Playbook: project docs

**Use when:** the task is the docs themselves: a README, a guide, a reference page, docstrings or comments. **Not
when:** docs are one step of a feature (`feature.md` step 5), or the text is release notes (`release.md`). A
stand-alone document for readers outside the code goes to `deliverable.md` (knowledge pack), edits to the user's own
prose to revise-text, and STATUS or CHANGELOG to the session-handoff skill.

## Steps
1. **Name the reader and the need,** then pick one Diataxis type per page and keep to it:
   - **tutorial:** a newcomer learns by doing one guided task to a first success;
   - **how-to guide:** a user with a goal follows numbered steps to reach it;
   - **reference:** exact facts about the interface (every option, parameter, return value, error), nothing else;
   - **explanation:** why it works this way, the design and its trade-offs.
   A page that mixes them gets split, with links between the parts. Name each changed page's type in the answer as
   `Type: <type>` (`Type: how-to`).
2. **Read the code and the config first.** Take every command, path, option name and default from the real files
   (package scripts, CLI help, config files), never from memory or the old docs.
3. **README:** keep the old one. When it has uncommitted changes or is not in git, copy it to
   `.cache/backups/README <stamp>.md` first (a committed one is kept by git). It covers, in this order: what this is
   in one or two lines, how to install and run it to a first success, which files to read first, how to test, who
   maintains it and where to get help, its status when it is deprecated or not released, and links to the detailed
   docs.
4. **Docstrings and reference** come from the public interface: every parameter, return value, error raised and side
   effect, with one short example. Private helpers get a comment only where the reason is not obvious.
5. **Link instead of copying.** Fix or delete every passage the change makes untrue (`git grep -n "<old name>"` for
   renamed or removed options), and remove stale TODOs and comments about deleted code.
6. **Run every safe command and code example** in the changed docs once, in a new terminal at the project root (no
   variables set by hand earlier); fix the docs (or report the bug, `bugfix.md`) where one fails. List them in the
   answer as `Ran: <command> - exit <code>`. Safe means read-only, help, build, lint or test. Never run one that
   installs, migrates, deploys, publishes or deletes: list it as `Not run: <command> - <why>`.
7. **Check the writing and the links:** `node tools/writing-check.mjs <changed .md files>` and `node tools/audit.mjs`
   (its "relative links resolve" line). Fix what they report.

## Done when
- [ ] Every safe command and example in the changed docs ran this turn and worked, unsafe ones not run, all listed in the answer (answer: Ran: .* - exit \d|Not run: |No commands in the changed docs).
- [ ] Each changed page has one Diataxis type, named in the answer (when file: README.md|**/README.md|docs/guides/**|docs/how-to/**|docs/reference/**|docs/tutorials/**|docs/explanation/**) (answer: Type: tutorial|Type: how-to|Type: reference|Type: explanation).
- [ ] Every public function, option or flag that changed is documented (judgment: needs comparing the interface with the docs).
- [ ] Docs that described removed or changed behaviour were fixed or deleted, or the answer says none did (judgment: needs a search of the docs).
- [ ] The writing check passed on the changed docs (when answer: Type: [a-z]) (ran: writing-check\.mjs).
- [ ] Relative links resolve (when answer: Type: [a-z]) (ran: audit\.mjs).
- [ ] The answer ends with a Finished section (hook: finished-summary).

## Pitfalls
- Commands copied from an old README: the script was renamed and every newcomer's first step fails. Run them.
- A reference page that drifts into a tutorial: readers looking up one option scroll past a story.

Sources: https://diataxis.fr/, https://google.github.io/styleguide/docguide/best_practices.html,
https://survey.stackoverflow.co/2025/ai, https://www.anthropic.com/research/how-ai-is-transforming-work-at-anthropic
