Inspired by the "setup-repo" skill in https://github.com/Significant-Gravitas/AutoGPT, found at
`.claude/skills/setup-repo/`, with its sibling `.claude/skills/worktree/` read for context. Both are outside
`autogpt_platform/`, so the repository's MIT License applies (copyright Toran Bruce Richards; see LICENSE).

The original creates parallel git worktrees for one product. Ours gets any repository on any stack to build, run and
pass its tests, keeps worktrees as an optional step, and ties the result into this starter's start file, app gates
and `docs/STATUS.md`. The careful handling of env files (keep, copy from a template, or report as missing) and
skipping what already exists come from the original. Edit freely; this is our version now.
