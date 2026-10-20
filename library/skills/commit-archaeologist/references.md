# Commit archaeologist: reference

## What the script reports
`node skills/commit-archaeologist/scripts/dig.mjs [--repo <folder>] [--lines A-B | --func <name>] [--json] [--out <file>] [--no-pickaxe] <file>`

| Field (JSON) | Meaning |
|---|---|
| `region` | Repository, file, mode (`lines`, `function` or `file`), range or function, every earlier name of the file, the companion threshold, and the commit count |
| `notes` | Shallow clone, or uncommitted edits in the file |
| `introducedBy` | The oldest commit in the selected history |
| `timeline` | Oldest first: hash, date, author, subject, body, category, changed files, renames, `bulk` (over 50 files), `merge`, signal types, `reverts` and `revertedBy` |
| `coChanged` | Files in at least a third of the non-bulk, non-merge commits, and at least 2 of them. Old names of the target are left out |
| `authors` | Per name: lines the current blame gives them, and commits in the timeline. Two different facts |
| `signals` | Words in commit messages: `issue-ref`, `revert`, `workaround`, `temporary`, `todo`, `hack`, `compat`, `security`, `performance` |
| `ancestry` | `file-older`: the file's history starts before the selected lines. `text-older`: the longest line of the code first appeared in an earlier commit, maybe in another file (a move or copy) |
| `fileReverts` | Reverts on the whole file that are not in the selected history |

How it works: line mode uses `git log -L A,B:file`, function mode `git log -L :name:file` (git's function matcher
for the file's language), file mode `git log --follow`. Blame runs with `-w` (whitespace ignored) and the repository's
`.git-blame-ignore-revs` when present. The text-older check uses the pickaxe (`git log -S`), which can be slow on huge
repositories; `--no-pickaxe` turns it off. The script prints names, not emails.

An empty signal list means the messages give no reason, not that there was none.

## Plain git, when the script can't run
- Line history with patches: `git log -L 40,72:src/cache.py`
- Function history: `git log -L :evict:src/cache.py`
- File history across renames: `git log --follow --stat -- src/cache.py`
- First commit that added a string anywhere: `git log --reverse -S "exact text" --oneline`
- Blame through moves and copies: `git blame -w -M -C -L 40,72 -- src/cache.py`
- Files changed with one commit: `git show --stat <hash>`
- Reverts: `git log -i --grep=revert --oneline -- src/cache.py`

## Confidence rules
One label per answer: the lowest whose conditions fit.

| Label | When |
|---|---|
| **High** | A message states the reason or the constraint, and other evidence agrees (repeated companion changes, a revert that names the behavior it restores, a linked issue). |
| **Medium** | Category, changed files and timeline shape point the same way, but no message states the reason. |
| **Low** | Thin history, vague subjects, bulk rewrites, a lost trail (ancestry warning), or clues that disagree. |

How to word it:
- Fact: "The lines came in with `a1b2c3d` (2024-03-02)." "Blame gives 7 current lines to <author>."
- Inference: "<author> probably wrote it to keep the old integer type (inferred from the companion test)." Label it.
- Unknown: "The history does not say why." Then name what would confirm it: the linked issue, the author, a test.

What each kind of evidence can and cannot show:
- **Blame** shows who last shaped surviving lines. It does not show who designed the behavior.
- **The oldest commit in line mode** shows where these lines came in. The file can be much older.
- **Companion files** show correlation. Say "often changed with" until the code shows a real dependency. Generated
  files, lock files and formatting commits create false companions.
- **Categories** are keyword guesses from messages, not verified types.
- **Revert, workaround, temporary, TODO, hack** show how the author framed the change at the time. They don't show
  whether the condition still holds.
- **Issue references** point to where the reason was probably discussed. Quote the reference, not a guess at its
  content.

## Change-risk checklist
Before recommending a change, answer each one:
1. Was this change tried before and reverted?
2. Do tests, schemas, migrations or config files keep moving with this code?
3. Is an outside limit named by a workaround or temporary marker (a library bug, an API quirk, a customer)? Does that
   limit still exist?
4. Does blame hide an older author behind a mechanical commit?
5. Does file mode or the ANCESTRY section show history that line mode lost?
6. Which tests cover this code today, and do they pass before the change?

A good report keeps three things apart: what the history shows, what we infer, and what would prove it.

## Report template
```
Bottom line: <one or two sentences>. Confidence: <high|medium|low>.
Origin: <hash> <date> <author>: "<subject>". Came in with <files>.
Timeline:
- <hash> <date> <category>: <what changed and why it matters>
Companion files: <file> (<n> of <m> commits): <what it suggests>
Evidence for intent: "<quote>" (<hash>). Inferred: <...>
Before you change it: <constraints, companions to update, tests to run>
Next step: <one offer>
```
