---
status: open
---
# Plan: the check a project runs after an upgrade passes in every real project

**Goal:** `node tools/hooks/v2/selftest.mjs`, the check a project runs after an upgrade, passes in every real project
(fresh, adopted, engine in `tools/` or in `.anzuelo/engine`), and every release proves it.

**Why a plan:** the third report of the same failure (2026-11-13). Two rounds of patches each fixed the one case shown.
Rule 3: a repeat gets a plan and a sweep over real data.

**The sweep:** each real project copied read-only (a git clone of its last commit, or a copy of its working folder
without its run outputs when it has no commit), the current engine put on it, and the v2 self-test run there.

## Everything wrong, with its cause

| What failed | Where | Cause | Fix |
|---|---|---|---|
| ~70 reminder and end-check tests, then a crash | engine in `.anzuelo/engine` | v2's `LAYOUT` took the split layout from the engine's place, for any ROOT: a plain test folder's runbooks were looked for in `ROOT/.anzuelo/local` | ROOT is judged by its own layout (split only with its own `.anzuelo/`) |
| Every commit of a session the hooks saw, refused (engine-bypassed) | engine in `.anzuelo/engine` | git-guard looked for the turn file beside its code; v2 writes it to `.anzuelo/local` | git-guard looks in the layout's state folder too. A real bug in that layout, not only a test |
| Held-answer text, wakeups, state hygiene | a project with its own Stop command | test copies of the engine took the host project's `config.json`: its own Stop command ran (and failed) in every copy | test copies get the engine's settings only (`fixtureCopy`) |
| AGENTS.md length, rules wording, record lines, hidden child processes | adopted projects | tests of the starter's own text read the project's own files | starter-only (`STARTER_REPO`) |
| Install, uninstall, remove, wiring, the upgrade convert, the gui pack copy, the sweep, leak and trial tools | every project | tests of the starter's own tools; a project has no `tools/starter/` or `packs/` | starter-only |
| Speed (76-79 ms against 75) | every project, sometimes the starter | the starter's speed gate, judged in its release with the machine quiet; noisy elsewhere | starter-only; a project's hooks are timed by the upgrade's bench against its budget |
| `STARTER_REPO` true inside `.anzuelo/engine` | engine in `.anzuelo/engine` | the engine there is a starter clone with the same tools | not the starter repo when it sits in `.anzuelo/engine` |
| `update` said "already runs the newest" | a linked project | it compared five engine files; a release that changed only a skill or the self-test passed as current | the release proof (`engine-proof.json`) is compared too (test reproduces the message) |
| A rebuild writing a page byte for byte the same held the turn for screenshots | a project | a file counted as changed by its time alone | a tracked file git sees unchanged, and no commit touched this turn, is no change |
| The trial ran the v2 self-test in one fresh project only | the release | a fresh project has none of an adopted one's own rules, hooks and settings | the trial runs it in every sample project |

## Tasks
- [x] Sweep the three real projects; list every failure above.
- [x] Fix each at its cause (the table's last column).
- [x] After the fixes: the v2 self-test passes in a copy of each real project (387, 387, 388) and in the starter (406).
- [x] The trial, with the v2 self-test in every sample project, passes (156/156).
- [x] The release chain passes (released 5cff447, pushed).
- [ ] The projects upgrade and run it for real (one project done: on 5cff447, 390/390, nothing to decide; two wait on
      the user). Their notices say `update --force` once: the old starter.mjs that runs the comparison lacks the fix.
- [ ] An adopted project with the engine in `.anzuelo/engine` joins the trial's samples, so that layout is proven by
      every release too.
- [ ] Found on the way: the audit's count of tags with a v2 test counts any mention in selftest.mjs, so a comment
      naming a tag passes as its test (engine-readonly did, until the comment went; it has a real test now). Count only
      tags named in a report's text or a `REQ:` test marker.
- [x] Explained (no engine gap): in a fresh empty project the ask sits at character 598 of the check's output, past
      the test's 300-character cut. The test now reads the whole output and runs in projects again. Was:
      Open, not understood yet: `check --answer-file` after `begin`, in a copy of two sample projects (empty folder,
      notes and data), did not ask for the self-tests after an engine hook file changed; in a copy of the python sample
      it did. The test is starter-only now (in a project the engine-readonly guard refuses that edit), but an agent
      without hooks in such a project may get no hooks-tested ask for its own hook changes. Find why before closing.
      Likely cause (to confirm with the full output): the test kept only the first 300 characters of the check's
      output, and the reproduction 600; in the sample projects a long upgrade-review item comes first, so the ask
      may have been there, past the cut. If so, the test reads the whole output and runs in projects again.
