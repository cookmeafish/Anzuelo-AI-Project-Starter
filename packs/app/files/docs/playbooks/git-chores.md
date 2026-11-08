---
name: git-chores
summary: Everyday git work - resolve merge conflicts, write commit messages, undo commits, rebase and clean up branches - always with a backup branch first, the tests run after, and nothing pushed without the user's OK
triggers: merge conflict, merge conflicts, resolve the conflicts, conflict markers, write a commit message, commit message, undo my last commit, revert the commit, amend the commit, rebase onto main, clean up branches, delete old branches, i messed up git, detached head, cherry-pick
trigger_regex:
menu:
---
# Playbook: git chores

**Use when:** a merge conflict, a commit message, undoing a commit, a rebase, lost work or branch clean-up. **Not
when:** pushing, tagging or releasing (`release.md`), reviewing a pull request (`qa.md` §3), failing CI (`qa.md` §5),
or why some code exists (commit-archaeologist skill, when enabled).

**Rules (AGENTS.md):** git credits only the user (no AI co-author, "generated with" line or AI author); never
`--no-verify` or skipping hooks: fix what the hook reported; pushing, force-pushing and deleting remote branches are
outward actions that need the user's OK in this conversation.

## Steps
1. **Look first:** `git status` and `git log --oneline -10`. Name the branch, what is uncommitted and what is pushed
   (`git status -sb`). `<default>` below is `git symbolic-ref --short refs/remotes/origin/HEAD`, after a `git fetch`
   (it names a remote-tracking branch). When it fails, run `git remote set-head origin --auto` and try again; no
   remote, or still failing: ask.
2. **Backup branch first,** before any merge, rebase, reset, amend, revert or branch delete:
   `git branch backup/<yyyymmdd-hhmm>` (uncommitted work: `git stash push -u -m "backup <date>"` first,
   `git stash pop --index` once the operation is done, and name the stash in the answer; a bundle does not hold
   uncommitted work). Before a history rewrite (`reset --hard`, `branch -D`, force push) also make a bundle, which the safety hook requires:
   `git bundle create .cache/git-backups/backup-<stamp>.bundle --all`. Name the backup in the answer.
3. **Merge conflict:** `git diff --name-only --diff-filter=U` lists the files. A merge or rebase already under way
   (`git status` says "unmerged paths"): do not restart it; take the backup branch and the copies below, then go on.
   Copy every conflicted file as it is now: `mkdir -p .cache/git-backups/<stamp>` and
   `cp --parents <files> .cache/git-backups/<stamp>/`, before any `checkout --conflict` or reset. For each file, show
   the base too (`git checkout --conflict=zdiff3 <file>`, or `diff3` on git older than 2.35), read base, ours and
   theirs (`git show :1:<file>`, `:2:`, `:3:`) and combine the intent of both sides; never pick one side blindly. In a
   rebase the sides swap: ours (`:2:`) is the branch being rebased onto, theirs (`:3:`) is your commit. When a stage
   is missing (`git ls-files -u <file>` lists the ones there): add/add has no base, so compare `:2:` and `:3:`;
   delete/modify and binary files cannot be combined, so ask the user which side to keep. Then
   `git diff --check` (leftover markers), run the project's tests, `git add`, and only then `git merge --continue`
   (or `git rebase --continue`). The way out is `git merge --abort` / `git rebase --abort`.
4. **Commit message:** follow the style in `git log --oneline -20` (Conventional Commits when used: `type(scope): `,
   `!` or `BREAKING CHANGE:` for breaks). A summary line of about 50 characters in the imperative, a blank line, a body
   wrapped at about 72 saying why. No AI credit.
5. **Undo, by situation:**
   - last commit, not pushed, keep the changes: `git reset --soft HEAD~1`;
   - fix the last commit's message or add a file, not pushed: `git commit --amend`;
   - a pushed commit: `git revert <sha>` on a clean working tree (a new commit, history stays); a merge commit
     needs `git revert -m 1 <sha>` and the user's OK, since later merges of that branch will not bring its changes
     back;
   - lost commits or a bad reset: `git reflog`, then `git branch rescue/<date> <sha>`;
   - throwing away uncommitted work or `reset --hard`: only when the user asks in their own words.
6. **Rebase and branches:** `git rebase <default>` (non-interactive; `-i` is not available here). Clean-up lists
   `git branch --merged <default>` and deletes those with `git branch -d`, never the current branch, the default branch or `backup/` and `rescue/`
   branches (they show up in that list too); an unmerged branch (`-D`) or a remote branch
   needs the user's OK.
7. **Report:** the backup's name, what changed, the test result, and the push command for the user to approve.

## Done when
- [ ] A backup branch existed before any history-changing command (when ran: git merge [^-]|git merge$|git rebase [^-]|git rebase$|git reset|git commit --amend|git revert [^-]|git branch -d|git branch -D) (ran: git branch backup/).
- [ ] The conflicted files were copied before they were rewritten (when ran: checkout --conflict) (ran: \.cache/git-backups/).
- [ ] No conflict markers are left (when ran: merge --continue|rebase --continue) (ran: git diff.*--check).
- [ ] The tests passed after the resolution, before continuing (when ran: merge --continue|rebase --continue) (ran: npm test|npm run test|npx jest|npx vitest|pytest|go test|cargo test|node --test|dotnet test|yarn test|pnpm test|make test).
- [ ] Commit messages follow the project's style and carry no AI attribution (hook: no-ai-attribution; judgment: style).
- [ ] Nothing was pushed or deleted on the remote without the user's OK in this conversation (hook: git-safety; judgment: other remotes).
- [ ] The answer ends with a Finished section (hook: finished-summary).

## Pitfalls
- Resolving a conflict by taking "ours" for the whole file: the other side's fix silently disappears.
- `git reset --hard` to "start clean": uncommitted work is gone for good. Stash or branch first.

Sources: https://git-scm.com/docs/git-merge, https://www.conventionalcommits.org/en/v1.0.0/,
https://survey.stackoverflow.co/2025/ai
