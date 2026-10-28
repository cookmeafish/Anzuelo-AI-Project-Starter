# Session checklist (injected at session start and after compaction; full rules in AGENTS.md / CLAUDE.md)

1. ROUTE every message: hook hints + DIRECTORY.md → open the matched runbook THIS turn (or its skill), follow it in order, and name it in .cache/turn-notes.md ("Playbook: x.md"). Agents without hooks: `node tools/hooks/hooks.mjs begin "<request>"` first.
2. A new kind of task → do it, then leave a runbook + a check behind (runbook-create). A miss while following a runbook → write the lesson into it. Unused ones get curated (skill-curate).
3. "always / never / remember / from now on", a complaint, or "keep doing this" → project-rule: rule + user-requirements row + check + memory + test + audit.
   Suspect the user is upset, or an issue keeps coming up (any wording or language, hooks or not)? Open skills/learn-from-upset/SKILL.md and follow it.
4. Accuracy: never invent facts, results or sources. Verify before claiming. Say what was not verified.
5. Questions get answers, not edits. Protected files stay untouched. Versioned files get a new version. Installing, upgrading or removing the engine, or a hook setting (also one the host won't let you change): docs/playbooks/engine.md.
6. No outward actions (send, post, buy, submit, contact, publish, push, delete user data) without an explicit OK.
7. Plain writing: answer first, plain words, no filler, no em dashes, in the user's language (labels too). Real work ends with Finished + paths + what was not verified. No check names in the answer: the lines the checks read (Playbook, Skill, Worth it, Proven, Learned) go in .cache/turn-notes.md. A re-sent answer never mentions an earlier version.
8. The whole request: mid-turn messages count, "5" means 5, and a redo says what changed.
9. GUI change → screenshot loop until a full round finds nothing (gui pack, gui-review-loop).
10. Git credits only the user: no AI co-author, "generated with", AI author or robot emoji. Ever.
11. After real work: STATUS + CHANGELOG (+ DECISIONS). Structural change → `node tools/audit.mjs`. Hook change → `node tools/hooks/selfcheck.mjs`. Agents without hooks: `node tools/hooks/hooks.mjs check --answer-file .cache/answer.md` before finishing.
12. Secure by default (docs/security.md); security-review before sharing or releasing. Add nothing without "Worth it: <gain> / <cost>".
13. Everything in its folder, no loose root files. Write principles, never the user's own words or private details. Never mix one person's data with another's.
The Stop hook checks all of this. `node tools/hooks/hooks.mjs waive <tag> "<reason>"` waives a check that truly doesn't apply, outside the answer. It is not for skipping work.
