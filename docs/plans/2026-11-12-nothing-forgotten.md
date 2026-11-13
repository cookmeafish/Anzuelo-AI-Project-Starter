---
status: open
---
# Plan: nothing the user asked, or the agent promised, gets forgotten

**Goal:** every ask from the user (in the first message, typed mid-task, or several turns back) and every promise the
agent makes ("I'll do X after Y") is tracked until it's done, declined with a reason, or handed to the user. It survives
long sessions and summaries.

**Approach:** one work log is the single list of what's left:
- what the user asked or pointed out, in any message;
- the agent's own promises;
- the open tasks of every active plan (with their plan files);
- the queue the project keeps.

When the agent thinks it's finished, the end check reads the log. If anything is open and doesn't wait on the user, the
agent gives a one-line update and goes on to the next item, so the user never has to slow down for it. The reminder
lists open items only when there are any. Items close on evidence.

**Spec (user, 2026-11-12):** when the user says several things, or points something out a bit earlier, the agent must
not forget it, nor forget what it was doing before.

**Confidence:** 6/10. Main risk: telling "done" from "mentioned" without guessing. Under the show-only-proven rule, an
item counts as forgotten only when no later text of the agent's mentions it, and no file or command touched it.

**How to resume:** run `node skills/plan/scripts/plan-tasks.mjs next docs/plans/2026-11-12-nothing-forgotten.md`, or
find the first unticked box.

## Context
What the engine does today (tools/hooks/v2/midturn.mjs, late.mjs, end.mjs):
- A message typed mid-task triggers a reminder at the next tool call ("answer it now in a line or two").
- The end check holds the turn only for a mid-task **question** no later text answered. Mid-task **instructions** are
  excluded on purpose (late.mjs, `INSTRUCTS`/`ORDER`), so "also fix X" gets a one-line "will do" and is never
  checked again.
- Nothing tracks an ask from an earlier turn. When the agent moves on, or the session is summarized, the ask is gone.
- An agent's own promise ("I'll apply them after the app work") is not tracked anywhere.
- Rule 8 ("the whole request, exactly") and the debug skill's "list everything wrong first" are written rules with no
  check behind them.

## Constraints for every task
- The user's rule: verify first, show only what's proven, drop the rest.
- No new interruptions during work: the ledger shows in the reminder and at the end only.
- The agent is pointed to the log and helped by it, never slowed by it:
  - The session-start text and the rules say in two lines what the log is and that it's read at "finished".
  - The engine fills it itself from the user's messages, the agent's promises and the plans, with no bookkeeping steps
    required.
  - One short command (`node tools/hooks/hooks.mjs log add|done|wait "<item>"`) lets the agent add, close or park an item
    when it wants to.
- Writing standards: docs/checks/writing-standards.md.

## Checks for this project
- `node tools/hooks/v2/selftest.mjs` (ALL PASS) and `node tools/audit.mjs` (PASS).

## Watch for
- Chit-chat and thanks are not asks. A question already answered in the same message is closed at once.
- Peer messages (cross-session) are not the user's asks.

## Task 1: the ledger
**Files:** tools/hooks/v2/lib.mjs (state), tools/hooks/v2/start.mjs, tools/hooks/v2/midturn.mjs
**Uses / provides:** provides the open-items list to Tasks 2-3.
- [ ] Per session, a state file of items: each user message split into its asks (instructions and questions), plus the
      agent's own promises ("I'll …", "next I'll …", "after X I'll …") from its answers. Each item has its text, its time
      and its status: open, done, declined (with the reason) or waiting on the user.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a 3-ask message makes 3 items, a mid-task instruction makes 1, a
      peer message makes 0; ALL PASS.

## Task 2: closing items on evidence
**Files:** tools/hooks/v2/end.mjs, tools/hooks/v2/late.mjs
**Uses / provides:** uses Task 1.
- [ ] An item closes when a later text of the agent's addresses it (shared key words) and, for instructions, a file or
      command of the turn touches what it names; or when the answer says it's declined or waiting, with a reason.
- [ ] Mid-task instructions are checked like questions, no longer excluded.
- [ ] Run `node tools/hooks/v2/selftest.mjs` with real cases (a mid-task "use emojis too" acknowledged and never done; an
      ask from 3 turns back). Expected: both stay open; done ones close; ALL PASS.

## Task 3: shown only when something is open
**Files:** tools/hooks/v2/start.mjs, tools/hooks/v2/lines.mjs
**Uses / provides:** uses Tasks 1-2.
- [ ] The prompt reminder lists open items (at most 5, oldest first), only when there are any.
- [ ] A turn that ends with open items it didn't address is held once, naming them. With the keep-working rule, the agent
      goes on to them. If the user must decide, the final line says "⚓ Waiting on you: …" in plain words.
- [ ] The ledger survives a summary: after "This session is being continued…", open items come back in the reminder.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: no reminder line with no open items; a held turn names only
      proven-open items; items survive a resumed session; ALL PASS.

## Task 4: replay and release
**Files:** the text-audit replay
**Uses / provides:** uses Tasks 1-3.
- [ ] Run the replay over the real sessions. Expected: the count of asks that were never addressed, before and after,
      and 0 items shown that were in fact done.
- [ ] Run `node tools/audit.mjs`, then release with the next chain. Expected: audit PASS and every chain step passing.
