---
name: commit-archaeologist
description: Explains why a file, function or block of code exists by reading the local git history - the commit that brought it in, every later change, reverts and earlier attempts, files that keep changing with it, who shaped it, and the intent words in commit messages - and turns that evidence into a short report with a confidence label and the risks of changing it. Uses a read-only, zero-install script. Use when someone asks why code exists, who wrote it and why, what the history of a function is, or before a rewrite, refactor or removal of code that looks odd, temporary or unexplained.
triggers: why does this code exist, why is this code here, why was this written, who wrote this and why, history of this function, history of this file, commit archaeology, code archaeology, before i rewrite this, is this deliberate, what could break if i change this
---
# Commit archaeologist: find out why the code is there

`git blame` says who touched a line last. That rarely says why the line exists. This skill follows the code back
through history, separates what the commits show from what they only suggest, and ends with what to check before
changing it.

Say at the start: "Tracing the history (commit-archaeologist skill)." Everything stays local: no fetch, no upload, no
writes to the repository.

**Not for:** printing raw blame or a plain commit list (just run git), rewriting history (squash, rebase, filter),
a repository that is not cloned here, or questions about the whole architecture (use the codebase-map skill if the
project has it).

## 1. Pin the target
1. Get the repository folder and the file. A block or function narrows it: a current line range (`40-72`) or a
   function name. Ask only for what is missing, in one question. Never search other repositories for it.
2. Line numbers refer to the last commit. If the file has uncommitted edits, say so and compare with `git diff`.
3. Check the history is complete: a shallow clone (`git rev-parse --is-shallow-repository` prints `true`) cuts the
   past short. Ask the user before running `git fetch --unshallow`, since it downloads.

## 2. Dig
Run the script from the project root (Node 18+, nothing to install):
- Lines: `node skills/commit-archaeologist/scripts/dig.mjs --repo ../api --lines 40-72 src/cache.py`
- Function: `node skills/commit-archaeologist/scripts/dig.mjs --func evict src/cache.py`
- Whole file: leave out `--lines` and `--func`.
- Add `--json` to read every field, and `--out .cache/archaeology/cache.json` to keep the evidence for later.

It prints the introducing commit, the timeline oldest first, companion files, authors, intent signals, ancestry
warnings and other reverts on the file. Field meanings and plain git fallbacks are in [references.md](references.md).
If the script rejects the path or range, pass its error on and ask for a corrected target.

## 3. Read the evidence
Before writing anything, read [references.md](references.md), "Confidence rules". Then:
1. **Origin.** The oldest commit in line or function mode is where these lines came in, not where the file was born.
   If the ANCESTRY section says the file or a line of the text is older, the code may have been moved, copied or
   rewritten: open that commit with `git show <hash>` and say the earlier trail is uncertain.
2. **Story.** Open the commits that changed behavior (`git show <hash> -- <file>`), not only the subjects. Skip
   commits marked `[bulk]` (formatting, mass renames) in the story, but note them.
3. **Undone attempts.** A revert, or a commit marked `[reverted by ...]`, means someone tried a change and backed it
   out. That is the strongest warning for a rewrite.
4. **Companions.** A file in the companion list moved with the target in many commits. Tests show what behavior is
   protected; schemas, migrations and config show data or deployment limits. A file in one commit is not a companion.
5. **Linked context.** Issue or PR numbers point to the discussion with the real reason. Name them; read them only if
   they are reachable without new access, and ask before using any outside service.
6. **Code itself.** Read comments, tests and call sites near the target. They often say what the messages do not.

## 4. Write the report
Lead with the answer, in this order, with short hashes (7 to 12 characters):
1. **Bottom line:** the most likely reason, in one or two sentences, and `Confidence: high`, `medium` or `low`.
2. **Origin:** hash, date, author and subject of the introducing commit, plus what came in with it.
3. **Timeline:** oldest to newest. Fold routine edits into one line; keep every fix, revert, workaround and change
   of behavior.
4. **Companion files** and what each one suggests.
5. **Evidence for intent:** short quotes of commit subjects or signal words, each with its hash. Mark anything beyond
   them as "inferred".
6. **Before you change it:** the constraints, companions to update, open temporary choices, and tests to run.

Don't paste the raw JSON unless asked. Keep author names to what the question needs.

## 5. Offer one next step
End with one fitting offer, for example: "Want me to judge whether this was deliberate?" or "Want me to list what
could break if this changes?" Don't edit code until asked (questions get answers, not edits).
- **Deliberate or accident:** weigh repeated edits that kept it, issue links, reverts that restored it, and explicit
  words such as "must", "required" or "do not".
- **What could break:** the companion files, the last commits that changed behavior, the tests that cover it, and the
  blast-radius steps of the codebase-map skill if the project has it.
- **A bug that came back:** hand over to the debug skill. `git bisect` belongs there, not here.
- **A durable reason worth keeping:** with the user's OK, record it in `docs/DECISIONS.md` (or as a short code comment
  next to the code) so the next person doesn't dig again.

## Done when
- [ ] The target (repository, file, and lines or function) was pinned, and nothing outside it was searched (judgment: the right target depends on the question).
- [ ] The report opens with a bottom line and a `Confidence:` label of high, medium or low (hook: history-confidence).
- [ ] The origin, an oldest-first timeline, the companion files and the intent evidence are each backed by commit hashes (hook: history-hashes sees hashes in the report; judgment: that each part has its own).
- [ ] Facts from the history and inferences are labeled apart; blame ownership is not presented as authorship (judgment: telling facts from inferences needs a reader).
- [ ] Ancestry warnings, shallow history and uncommitted edits, when present, are stated (judgment: only applies when the history shows them).
- [ ] The report ends with change risks and one offered next step, and no code was changed (judgment: the risks and next step need a reader).

## Pitfalls
- **Last toucher is not the author.** A reformat or rename makes blame point at whoever ran it. Compare the timeline
  authors, and use `.git-blame-ignore-revs` when the repository has one (the script does).
- **Line history loses the trail.** Big rewrites, moves between files and some renames break git's line tracking, so
  the origin looks too recent. The ANCESTRY section and file mode catch most of these.
- **Labels are guesses.** "fix", "refactor" and "feat" come from message words. A "refactor" can change behavior.
- **Messages lie by omission.** "update", "wip" and "misc" say nothing. Say "the history does not say why" instead of
  inventing a design story.
- **"Temporary" can be permanent.** A temporary workaround from years ago may still guard a real limit. Check whether
  the condition it names still holds before removing it.
- **Squashed or imported history.** One giant first commit means the real past lives elsewhere (an old repository, a
  vendor drop). Say so.
- **Merge commits.** They rarely change the lines themselves; the commits on the merged branch do.

Inspired by "commit-archaeologist" in Shubhamsaboo/awesome-llm-apps (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
