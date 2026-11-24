---
status: open
---
# Plan: the user sees only what matters from the engine

**Goal:** what the engine shows the user is only real and useful: the upset acknowledgement every time, no old notes, at
most one hold per answer with only proven items, and no venting turned into tasks.

**Approach:** fix each cause at its source in the v2 engine, prove each with a test built from the real hour of
2026-11-13 (session 76462ec3, 10:49 to 11:10), then replay that hour and release.

**Spec (user, 2026-11-13):** the user must be bothered as little as possible; the "acknowledged" line must show; what
the engine shows must be meaningful, not clutter.

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
      Sweep: every real Issue line in the notes of 14 project folders (106 lines, 318 write-form checks): the old
      comparison missed 3, the new one 0. The misses are lines whose first 40 characters hold a quote.

## Task 2: notes never shown again
**Files:** tools/hooks/hooks.mjs (a `note` command), the rules text, skills/learn-from-upset/SKILL.md
**Uses / provides:** none.
- [x] `node tools/hooks/hooks.mjs note "<line>"` appends quietly, with one short output line. The rules and
      learn-from-upset point to it. (c054a7a; selftest: appends, says "noted", usage without a line; 459/459)
- [x] Notes rotate per turn into an archive, so the live file holds only this turn's lines (v2/start.mjs rotateNotes,
      at a new turn: earlier lines to .cache/turn-notes-archive.md under a dated heading, kept to 512 KB; skipped while
      a peer session's turn is open). The repeat check keeps its own record (state/issues.json), so nothing that reads
      earlier turns loses them. Test: 3 turns, then the live file holds only turn 3 and the archive turns 1 and 2;
      with a peer turn open nothing moves (failed on the old code; 416/416).
- [x] Run `node tools/hooks/v2/selftest.mjs`. Expected: after 3 turns the live notes file holds only the last turn's
      lines, and acknowledgement and fix checks still read the archive; ALL PASS. (2026-11-24: ALL PASS 459/459, the
      rotation case among them)

## Task 3: one hold round, only proven items
**Files:** tools/hooks/v2/end.mjs
**Uses / provides:** uses the evidence record.
- [x] Rounds 2 and 3 are only for a safety item or for real work not done. (Decided 2026-11-24 after two independent
      reviews and the sweep: items are marked by source (H(...) in end.mjs: security, health, claims, tests, declared
      checks, open asks, failed self-runs, watchers, a lost, empty or mismatched answer, the upset acknowledgement).
      Round 2 still holds round 1's items, since 9 field lessons need it (a re-sent answer still missing what round 1
      asked, an owed lesson); round 3 holds only the marked ones. Test: a runbook item alone holds rounds 1-2, not 3;
      an unbacked claim holds round 3; v2 selftest 460/460, v2-sweep PASS.)
- [x] A repeat-problem or open-plan item holds only the session that owns it. Sending the problem to the owning
      session counts as handled. (Open plans: planOpenGaps holds only the session whose calls touched the plan, from
      2026-11-12. Repeats: a turn that sent the problem on (SendMessage, starter.mjs feedback) is handled. Repeats stay
      shared across sessions on purpose: the same complaint in a new session is still a repeat. Test; 460/460)
- [x] Status and changelog asks only when this turn changed a starter or project file of that kind. (a581589: a
      runbook's record item is met on a turn that changed no project file; the standalone changelog check already
      skipped records and other folders. Test: other-folder edit meets it, a src/ edit does not; 460/460)
- [x] (the "open the runbook" part: a runbook named as followed whose checkable items are all met by evidence is not
      sent back to be opened, and meets "no runbook was opened"; a runbook read in parts (sed, awk, head, tail) counts
      as opened, a grep does not. Tests failed on the old code; 419/419. The verify list for judgment items is kept.)
- [ ] When every "Done when" item of the routed runbook is met by evidence (a hook, a run, a file), "open the runbook"
      and "check the items are really done" don't hold: reading the file is a means, not an outcome. Test: the plan turn
      of the real hour (plan saved, `plan-tasks.mjs check` passed, plan linked) ends with no hold.
- [x] (done earlier, ticked 2026-11-24: while helpers or background runs are live, end.mjs asks nothing but a false
      push/commit claim, and keeps the full steps on record for the next Stop; old-suite scenarios "waiting end" (block:
      false with a live helper and a changed file) and "helpers still running" pass)
      Work that running background helpers own is waiting, not missing: no hold for their unfinished output (claims
      they haven't returned, a file still being written); it is judged on the turn that merges their results. Test: a
      turn with live background agents and partial files ends with no hold (a project, 2026-11-13: 3 rounds of 6, 5
      and 5 items while 8 helpers ran).
- [ ] In an adopted app, light mode and records off drop only the record asks (CHANGELOG, STATUS, DECISIONS), never
      rule enforcement: a rule request still needs one held line asking for an enforcement in the app's own way (a test
      in its suite, a check in its own scripts or hooks, or a Done when line in its own process file), never in
      .anzuelo (2026-11-15: a "make a rule to always" request got only a paragraph, no check, and nothing asked). Test:
      an adopted copy with light:true and records:false, plus a rule request, gets one held line asking for the
      enforcement.
- [x] (done 2026-11-24: verbatimGaps leaves out CLAUDE/AGENTS/GEMINI(.local).md in the .anzuelo layout; test in an app
      whose .anzuelo/engine links to the engine: its CLAUDE.md not flagged, its docs still are; fails on the old code)
      In an adopted app, the no-verbatim check never reads the app's own rules files: rule 14 is for text the starter
      shares, and an app may quote its user, dated, on purpose (2026-11-15: a false hold on the app's own CLAUDE.md).
      Test: an adopted copy whose CLAUDE.md gains a quoted line gets no hold.
- [ ] A real adopted-app hold of 3 items, all already met (2026-11-15), replays to no items: (1) in package.json only
      new or changed dependencies (dependencies, devDependencies, peer, optional) count as an addition for the
      worth-it check, never the version, scripts or metadata; (2) a review agent whose brief or report covers security
      meets the security item, not only the security-review skill by name; (3) with no gui pack in an adopted app,
      adoption item 12 really turns the screen items off, and screenshots the app's own scripts take count as
      evidence. Test: the replay of that hold gets no items.
- [x] (done 2026-11-24: route() and the rule note skip quoted text ("> " lines, quotations), and a prompt a schedule of
      the session fires is never a rule request (d9cac50 and this commit); test: quoted "always" gets no rule note, a
      plain "from now on always" does, the scheduled round none; fails on the old start.mjs. The scheduled check stands
      for "identical to one seen earlier": a typed repeat is the user saying it again)
      Rule detection at the prompt skips quoted text and a prompt identical to one seen earlier in the session (a
      scheduled repeat): a repeating scheduled round that quoted the user's past "make sure" and "always" got the
      rule-request reminder and the full checklist (2026-11-15). Test: the same prompt with quoted rule words, sent
      twice, gets no rule request either time; a fresh "from now on, always X" is flagged.
- [ ] One shared "action or data" helper for every command-text guard (git-safety, browser, outward actions, forbidden
      commands): a match counts only at a shell command position, inside bash/sh/cmd/pwsh -c arguments, or inside an
      inline script where the text is passed to exec/spawn/system/Start-Process; heredoc text written to a file, a
      quoted data value and a search pattern are data (2026-11-15: three false refusals of one family). Test: a probe
      holding a force-push string as a JSON value passes; a real force-push, one inside bash -c, and one passed to
      execSync still refuse; the browser cases replayed through the same helper.
- [ ] A closing yes/no question about doing something the user already asked for (an open work-log item from the user's
      own words with shared key terms) holds once. It holds even when the answer names a project rule that conflicts,
      as long as the user's own work-log item asks for that very thing (the user overruled the earlier exemption,
      2026-11-15): "the user asked for this (<item, time>): adjust the rule with its safety limits written in, and
      build it". It still passes for an ambiguous ask, and for a step that is outward, irreversible or deletes data.
      Test: a plain "should I build X?" after the user asked for X holds; the real pair (the user's subscription ask,
      the 14:23 question naming the rule) holds; a push question passes; a question about something never asked
      passes. After the helper above.
- [ ] A path the answer names is checked against the project roots named in the same sentence or paragraph, the roots of
      sessions that messaged this turn, and the starter's pack sources, before "does not exist" (2026-11-15: an answer
      about another project's tools/screenshot.mjs was held, though the file exists there). Test: that answer passes; a
      made-up path still flags.
- [x] (done 2026-11-24: wakeups.mjs watcherLeft clears a watcher when the answer says it waits on it and names a key
      word of what it watches; scenario fails on the old code; watcher-left 18/18, v2 460/460)
      An armed watcher the answer says it is waiting on is waiting, not missing: no "a watcher you started is still
      armed" hold when the answer names what it waits for (a session held 3 rounds while legitimately waiting on a
      one-minute startup check, 2026-11-15). Test: a turn that arms a watcher and says it waits on it ends with no
      hold; one that arms it and says nothing still gets the line.
- [ ] The agent isn't hounded for false alarms: each check keeps a running count of its holds that turned out real (the
      agent changed work because of them) and false (met already, waived with a reason, or the answer showed it didn't
      apply). A check whose holds are mostly false over its last 20 stops holding: it moves to the start-of-turn
      reminder, and the release replay reports it to be fixed. Safety guards are never demoted.
- [x] (the list part: the first hold records its items in the turn state, firstItems; a later round of the request
      keeps only those still unmet. Test: round 2's reply sets off a new item, which is not listed; failed on the old
      code; 417/417.)
- [ ] A hold's list never grows between the rounds of one turn: round N lists only round 1's items still unmet. Opening
      a file by any read counts as opening it (a shell print or `sed` of the skill, not only the Read tool). A plan
      written and committed this turn meets the "upset again: plan and sweep" item. Seen 2026-11-13 19:05 on an upset
      turn: 5, then 4, then 10 items, after the Issue, Scope and Root cause lines, the skill read and a committed plan.
      Test from that turn: at most one hold, and it never grows.
- [x] (done: a phrase of 12+ characters from anywhere in the item, or most of the given words; several matches are
      named and none closed; done also closes a waiting item. Test failed on the old code; 420/420.)
- [x] (done: quoted passages and disclaiming sentences are left out before the never-again and enforced-claim
      patterns run; test from the reported pair failed on the old code; 421/421.)
- [ ] A claim inside quotes, or in a sentence that disclaims it (not verified, haven't run, X's report, per X), is no
      claim; on a round after the hold, an answer that names the source or says it is unverified meets the item. Seen
      2026-11-14 20:53: "another session reported a check now enforces it" held, then the correction quoting the phrase
      and saying it was not run held again. Test from that pair.
- [ ] `hooks.mjs log done|wait "<words>"` finds the item by words from anywhere in it (a phrase from its middle, or
      most of the given words in order), not only its opening words; when several items match, it names them instead of
      picking one. Seen 2026-11-14: a long ask could be closed only by its first words, so an answered ask held the turn
      after two tries. Test: a long item closed by a phrase from its middle; an ambiguous phrase lists the candidates.
- [x] (done: tools/hooks/state/stop-holds.jsonl, one line per hold with its time, session and whole reason, the newest
      500 once it passes 2 MB; test failed on the old code; 422/422.)
- [x] (shell-hygiene, a field report: an inline script that only reads a code file goes through; the write test read the
      opening quote of a path starting with "w" as a write mode. Now the mode must be open()'s second argument, and
      write_text, write_bytes, createWriteStream, shutil and os moves and removes count as writes. Tests from the two
      real refusals failed on the old code.)
- [x] (done: requirement kind releaseProven, met when tools/hooks/engine-proof.json names a commit and the turn's
      engine files equal it byte for byte (one git diff, only when the self-test ask applies); the self-test ask accepts
      it beside a passing run. Test on a throwaway repository: proof and same files met; an edit after it, or no proof,
      not; failed on the old code.)
- [x] (and the 21-item hold: follow-on items ("Then, once <file> is written") go under "Also noted, not held"; a
      runbook a later message routed brings its steps only when the turn touched its kind, else one line asks to do it
      or say why not, and only on a work turn. Tests failed on the old code; v2-sweep has no regressions, 1664 passed.)
- [ ] A release proof written this turn (tools/hooks/engine-proof.json naming the tested commit, or the chain's result
      files) counts as test evidence for that commit's files: after a release whose two chains passed every test, the
      end check held twice for tests not run, since the chain runs them in a frozen copy (2026-11-15). Test: a turn that
      only commits a proof for a passed chain gets no "tests" item.
- [ ] A long turn's hold lists only what applies to the work done (a real hold of 21 items, 2026-11-14 21:51): a
      runbook routed by some message of the turn holds only when the turn changed a file or ran a command of its kind;
      an item conditional on an output ("once outputs/x is written") is left out while that output was never written;
      at most 5 items per hold, safety and unfinished work first, the rest in the details file. Test: replay that hold;
      it drops to the few real items (the fresh review, the visual-review line, the audit failure, the security check).
- [ ] Each hold's full item list is kept in a per-session history (not only the newest stop-details file), so a
      replay reads every item. The review of 149 real holds could read only the first two of each
      (tools/starter/reviews/2026-11-14-real-holds.md).
- [x] (done for `why`: it prints the saved list without the work-log items closed since, and says when the list was
      saved and how many were left out (worklog stillOpen; test failed on the old code; 423/423). The Stop itself always
      read the log as it is.)
- [x] (done: `why` passes the saved list through worklog.mjs stillOpen, which drops items closed since; selftest
      "why leaves out the work-log items closed since the list was saved". Ticked 2026-11-24)
      What is open is read from the work log as it is now, never a saved list: `hooks.mjs why` printed the list saved
      at the last Stop, so items just closed with `log done` still showed as open (2026-11-14). `why` recomputes from
      the current log, or says the time of the list it shows. Test: close 3 items, then Stop and `why`; neither lists
      them.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the two answers from the real hour pass with at most one hold
      each; ALL PASS.

## Task 3b: a bulk close after a hold is confirmed, not taken on trust
**Files:** tools/hooks/v2/worklog.mjs, tools/hooks/v2/end.mjs; test in tools/hooks/v2/selftest.mjs
Seen in a project (2026-11-13): after a hold listing many open items, the agent closed them all at once with
`log done`, among them an upset ask only partly done (its own count left many items without the result asked).
`log done` takes any item with no evidence, so a mass close looks the same as real completion. No new interruption.
- [ ] When one turn closes 3 or more items right after a hold, the end check lists them once, asking the answer to
      give each as done (with what proves it), partly done (what is left) or declined (why).
- [ ] An upset ask closed that way with no line in the answer stays open, marked partly done.
- [ ] Test, from the real sequence in a neutral subject: a hold with 14 items, a bulk `log done`, an answer that
      leaves out the remaining gap of the upset ask. Expected: that ask stays open, "partly"; the others closed
      with their lines in the answer pass.

## Task 4: one message, one ask
**Files:** tools/hooks/v2/worklog.mjs
**Uses / provides:** none.
- [ ] A user message is one item unless it lists separate instructions. Venting and complaints are not tracked
      sentence by sentence; the turn's work closes them.
- [x] (done as: an "I'll ..." the turn went on to carry out with later tool calls, with no word putting it off (next,
      later, then, after that, once, when), is narration and not held; a deferred one still is. Test from the real
      turn: the two narrated lines are not held, "I'll add it to the changelog right after that" is; failed on the old
      code; 418/418.)
- [ ] A promise is tracked only from what a turn hands on: its final answer ("next turn I'll ..."), never the agent's
      step-by-step narration between tool calls that the same turn then carries out. Seen 2026-11-14: two holds for
      "I'll strip the status letters ..." and "I'll put the comment at the end of the line", both done in the commit a
      few steps later. Test from that turn: two narrated "I'll" lines, then the commit, end with no hold; a final answer
      saying "I'll do X next turn" is tracked.
- [x] (done: a promise naming an item still open or waiting adds nothing; one with its own condition after the verb (as
      soon as, once, when, if, unless, until, after <an event>) waits; "right after that" stays open. Test: a waiting
      item, then "I'll do them as soon as it's pushed" and "I'll upgrade the three projects once the release is out",
      leave only a new promise open; failed on the old code with 3; 419/419.)
- [ ] A promise that restates an item already open or waiting attaches to it, never a new item: before adding one,
      match it against the open and waiting items (shared key words). Seen 2026-11-14: an item set to wait ("upgrade
      the projects after the next release"), then the answer said so ("as soon as it's pushed"), and the restatement
      held the turn as a new promise. Test: an item in wait, then an answer restating it: no new item, no hold.
- [ ] The "deliver exactly N" ask comes only from the user's own request. A number in a peer session's message, a
      resumed-session summary or the agent's own text ("why it allowed 4 rounds", "9 rounds" in a description) is no
      ask. Seen 2026-11-13: two holds for "4 rounds" and "9 rounds" that no one asked for.
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: the real upset message makes 1 item, and a 3-instruction
      message makes 3; ALL PASS.

## Task 4b: show value, not activity
**Files:** tools/hooks/v2/lines.mjs, tools/hooks/v2/end.mjs
**Uses / provides:** uses Task 3's evidence.
- [ ] The routine "✅ checks passed (after N fix rounds) · 📖 …" line is gone. In its place, one line only when the engine
      changed the outcome this turn: "⚓ <brand> caught: <what, in plain words>" (a real miss the agent then fixed), or
      "🛡️ blocked: <unsafe action>". A turn where nothing was caught shows nothing.
- [ ] Once a day, at the first prompt of the day, one line sums up the day before: "⚓ <brand> yesterday: caught N
      misses, blocked M unsafe actions". Shown only when N + M > 0, and it can be turned off (status-lines).
- [ ] Run `node tools/hooks/v2/selftest.mjs`. Expected: a turn with a real catch shows one "caught" line naming it; a
      clean turn shows nothing; the daily line appears once and only with nonzero counts; ALL PASS.
- [x] After a compaction, the reminder brings back the one-line file-edit rule once with the summary (start.mjs). Oversight's
      replay, 2026-11-15: three refused shell edits in three minutes right after a compaction.
- [ ] After a second shell-hygiene refusal in a session, the next prompt's reminder carries the same line once (the guard
      counts its refusals per session in its state; no new interruption during work). Replay: the post-compaction turns
      of that session get the line once, not on every prompt.

## Task 5: replay and release
**Files:** the replay tool
**Uses / provides:** uses Tasks 1-4.
- [ ] Replay the real hour. Expected: the acknowledgement shows each time, no old notes are shown, at most one hold per
      answer, and 0 venting items.
- [ ] Run `node tools/audit.mjs`, then release through both chains and upgrade the projects. Expected: audit PASS and
      every chain step passing.
