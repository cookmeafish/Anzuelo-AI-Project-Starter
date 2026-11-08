---
name: revise-text
description: Edit, proofread, shorten, change the tone of or translate text the user already has, keeping every fact, with the original left untouched. Use when this runbook's situation comes up (docs/playbooks/revise-text.md), e.g. the user says: proofread this, proofread my, edit this text, edit this paragraph, make this shorter, make it shorter, shorten this, tighten this up, fix the grammar, fix the spelling, rewrite this more formally, make it more formal, make it more casual, change the tone.
runbook: docs/playbooks/revise-text.md
generated: true
---
<!-- generated:start from docs/playbooks/revise-text.md by tools/hooks/hooks.mjs: edit the runbook, not this block -->
# revise text the user already has

Open `docs/playbooks/revise-text.md` and follow every step in order. It is the procedure, and the hooks check its "Done when" list.

## Done when
- [ ] The user's original is unchanged and the revision is a new version or in the answer (hook: no-overwrite)
      (judgment: the user's file can sit anywhere, so no glob names it).
- [ ] Every number, name, date, link, quote and "not" of the original is in the revision, or the change note lists it
      as cut (judgment: meaning, not spelling, decides whether a fact survived a rewrite or translation).
- [ ] The writing check ran on the new version (judgment: the new version sits next to the user's file, anywhere, and
      pasted text has no file, so no glob names it).
- [ ] When length was the goal, the answer gives the word count before and after (when answer: Shortened:|Acortado:) (answer: Shortened: \d+ to \d+ words|Acortado: \d+ a \d+ palabras)
- [ ] The answer has its "What changed" note (answer: What changed|Qué cambió|Que cambio)
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
