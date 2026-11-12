---
status: open
---
# Plan: the end-of-turn ⚓ line says only what really happened

**Goal:** the line shown after a turn (`⚓ Anzuelo 🚨 … / ✅ checks passed · 📖 … · 🧠 …`) carries only proven parts, each
whole and plain, and nothing at all when nothing proven happened.

**Approach:** each part of the line gets its own proof from this session's own turn, using the evidence record of
[the evidence-model plan](2026-11-12-evidence-model.md). A part without proof is dropped. Real lines from 2026-11-12
become the tests.

**Spec (user, 2026-11-12):** show an item only when it really happened; drop it otherwise; never claim "fixed" for
something not fixed.

**Confidence:** 8/10. Main risk: per-session notes change where the agent writes its Issue line, and every reader of the
notes has to move with it.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-12-end-line-truth.md`, or find
the first unticked box.

## Context
How the line is built today (`tools/hooks/v2/lines.mjs`, `passText`; released engine 7bc9bc7):
- **Notes:** reads `.cache/turn-notes.md`, the whole file when its mtime is after the turn start (released), or what it
  gained since the turn start (`notesOf`, unreleased). The file is shared by every session in the folder.
- **🚨 issue:** the last `Issue:` line in those notes, cut at 110 characters (`slice(0, 110)`), so it breaks mid-word.
  Another session's Issue line, written to the same file, shows up as this session's.
- **"fixed" or "acknowledged":** "fixed" when the turn made any Edit, Write or commit (`work`). Writing the Issue line
  itself counts, so acknowledging made it "fixed". (Unreleased stopgap 266fdba: always "acknowledged".)
- **✅ checks passed:** shown whenever `work` is true, even when the end check had nothing to check (a turn that only
  wrote notes or memory).
- **📖 runbook followed:** shown when any tool call's path or command contains the routed runbook's path, which is reading
  it, not following it.
- **🧠 lesson saved in X:** any `learned (…) → X` line in the answer or the notes, with no check that X changed this turn.
  The released engine reads the whole notes file, so weeks-old lines name files nobody touched today.
- **The acknowledgement shows twice:** at PostToolUse (`acknowledgedLine`) when the Issue line is written, and again in the
  Stop line.

Real examples, all false (2026-11-12):
- "🚨 fixed: the slowdown was called fixed and came back": nothing was fixed, and another session wrote it.
- "🧠 lesson saved in tools/starter/STATUS.md, tools/hooks/hooks.mjs": neither file changed that day.
- "…instead of all of it under .anzuelo/, and I ans": cut mid-word.

## Constraints for every task
- The user's rule: verify first; show if proven; drop if not. Immediate exceptions are safety refusals, the upset
  acknowledgement and a clear mess-up, and even they must be accurate.
- Writing standards: docs/checks/writing-standards.md. No line cut mid-word.
- Each fix has a test from a real example that fails without it.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- Projects on the old engine show their own lines; they are fixed by upgrading, not here.

## Task 1: notes belong to one session
**Files:** tools/hooks/v2/lib.mjs (notesOf, notesMark), tools/hooks/v2/lines.mjs, the rules text that tells the agent where
to write its Issue line
**Uses / provides:** provides this session's own notes to Tasks 2-4.
- [ ] Each Issue, waiver and learned line is tied to its session (a per-session notes file, or each line carries the
      session id); readers take only this session's lines added since the turn began.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a test where session B appends an Issue line during session A's
      turn shows nothing of B's in A's lines; ALL PASS.

## Task 2: the acknowledgement is shown once, short and whole
**Files:** tools/hooks/v2/lines.mjs (acknowledgedLine, passText, issueOf)
**Uses / provides:** uses Task 1.
- [ ] The 🚨 line shows once, when the Issue line is written. The Stop line repeats it only as "fixed", and only when the
      evidence model has verified its fixed-when.
- [ ] The summary is the problem's first clause, cut at a word boundary with "…" if still long.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: tests for "acknowledged once", "no fixed without proof" and "no
      mid-word cut", built from the real examples above; ALL PASS.

## Task 3: each other part needs its own proof
**Files:** tools/hooks/v2/lines.mjs (passText)
**Uses / provides:** uses the evidence record.
- [ ] ✅ "checks passed" only when the end check really checked something this turn (runbook items, required checks)
      and it all passed; a turn of only notes, memory or scratch writes shows no ✅.
- [ ] 📖 "runbook followed" only when the routed runbook's Done-when items were verified; reading it is not following it.
- [ ] 🧠 "lesson saved in X" only when this turn's own tool calls changed X.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: one failing-without-fix test per part, from the real examples;
      ALL PASS.

## Task 4: replay and release
**Files:** the text-audit replay (docs/plans/2026-11-12-user-facing-text-audit.md, Task 4)
**Uses / provides:** uses Tasks 1-3.
- [ ] Run the replay over the collected real lines. Expected: no pass line with an unproven part; the count of pass lines
      shown before and after is reported.
- [ ] Run `node tools/audit.mjs`, then release with the evidence-model work through the usual release chain. Expected:
      audit PASS and a chain with every step passing.
