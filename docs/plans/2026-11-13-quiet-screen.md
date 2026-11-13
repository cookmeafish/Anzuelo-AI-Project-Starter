---
status: open
---
# Plan: the user sees only what matters from <!--name:STARTER_NAME-->Anzuelo<!--/name-->

**Goal:** what <!--name:STARTER_NAME-->Anzuelo<!--/name--> shows the user is only real and useful: the upset acknowledgement every time, no old notes, at
most one hold per answer with only proven items, and no venting turned into tasks.

**Approach:** fix each cause at its source in the v2 engine, prove each with a test built from the real hour of
2026-11-13 (session 76462ec3, 10:49 to 11:10), then replay that hour and release.

**Spec (user, 2026-11-13):** the user must be bothered as little as possible; the "acknowledged" line must show; what
<!--name:STARTER_NAME-->Anzuelo<!--/name--> shows must be meaningful, not clutter.

**Confidence:** 7/10. Main risk: one hold round at most could hide a real miss, so the rounds that stay are the ones
for safety and for real work not done.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-13-quiet-screen.md`, or find
the first unticked box.

## Context
What the user saw in that hour, and why:
- **No "acknowledged" line.** Issue lines were written with the Edit tool. The last releases changed the rule for
  which writes count as this session's own, and nothing showed.
- **Old notes shown again and again.** `.cache/turn-notes.md` never empties. Each Edit makes Claude Code show a diff
  full of earlier Issue lines, 3 times in an hour.
- **3 holds per answer** (8, 5, then 2 items; 2, 5, then 3), each forcing a new answer fragment. Most items were
  false: another session's repeat problem, another session's open plans, a status or changelog ask on a turn that
  changed no starter file.
- **Venting split into tasks:** "IM A BUSY GUY." and similar sentences became work-log items.
- **What works:** the short progress lines, and Claude Code's own safety blocks.

## Constraints for every task
- The user's rules: show only what's proven; fix at the source; bother the user as little as possible.
- No new interruption during work.
- Each fix has a test from the real hour that fails without it.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- Safety guards and the acknowledgement stay immediate; this plan never quiets them.

## Task 1: the acknowledgement always shows (release first, on its own)
**Files:** tools/hooks/v2/lines.mjs, tools/hooks/v2/lib.mjs
**Uses / provides:** none.
- [x] An Issue line written by Edit, Write, a shell append or the note command shows "🚨 acknowledged" at that tool
      call, once. Root cause: the own-line check looked for the text in the call's JSON, where a quote is escaped, so
      any Issue line quoting something showed nothing in every form (the fix is in tools/hooks/hooks-main.mjs). The
      note command comes with Task 2.
- [x] Run `node tools/hooks/v2/selftest.mjs`. Expected: one test per write form, failing on the old code; ALL PASS.
      (412/412; the forms test fails on the old code with Edit, Write and Bash all false)

## Task 2: notes never shown again
**Files:** tools/hooks/hooks.mjs (a `note` command), the rules text, skills/learn-from-upset/SKILL.md
**Uses / provides:** none.
- [ ] `node tools/hooks/hooks.mjs note "<line>"` appends quietly, with one short output line. The rules and
      learn-from-upset point to it.
- [ ] Notes rotate per turn into an archive the engine still reads, so the live file holds only this turn's lines.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: after 3 turns the live notes file holds only the last turn's
      lines, and acknowledgement and fix checks still read the archive; ALL PASS.

## Task 3: one hold round, only proven items
**Files:** tools/hooks/v2/end.mjs
**Uses / provides:** uses the evidence record.
- [ ] Rounds 2 and 3 are only for a safety item or for real work not done.
- [ ] A repeat-problem or open-plan item holds only the session that owns it. Sending the problem to the owning
      session counts as handled.
- [ ] Status and changelog asks only when this turn changed a starter or project file of that kind.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the two answers from the real hour pass with at most one hold
      each; ALL PASS.

## Task 4: one message, one ask
**Files:** tools/hooks/v2/worklog.mjs
**Uses / provides:** none.
- [ ] A user message is one item unless it lists separate instructions. Venting and complaints are not tracked
      sentence by sentence; the turn's work closes them.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the real upset message makes 1 item, and a 3-instruction
      message makes 3; ALL PASS.

## Task 5: replay and release
**Files:** the replay tool
**Uses / provides:** uses Tasks 1-4.
- [ ] Replay the real hour. Expected: the acknowledgement shows each time, no old notes are shown, at most one hold per
      answer, and 0 venting items.
- [ ] Run `node tools/audit.mjs`, then release through both chains and upgrade the projects. Expected: audit PASS and
      every chain step passing.
