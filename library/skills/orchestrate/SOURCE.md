Inspired by the "orchestrate" skill in https://github.com/Significant-Gravitas/AutoGPT, found at
`.claude/skills/orchestrate/`. That folder is outside `autogpt_platform/`, so the repository's MIT License applies
(copyright Toran Bruce Richards; see LICENSE).

The original supervises agents in terminal windows through shell scripts and a code host's review and CI checks.
Ours keeps its mechanisms in neutral terms for any agent and any kind of work: a ledger as the single source of
truth, step checkpoints, a real check-in loop, state classification, queues for shared resources, escalation, and
verify-before-accept. Its scripts are replaced by our own read-only helper, `skills/orchestrate/scripts/ledger.mjs`. The plan and
parallel-agents skills cover task lists and briefs. Edit freely; this is our version now.
