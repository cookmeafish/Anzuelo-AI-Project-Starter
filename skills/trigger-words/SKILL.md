---
name: trigger-words
description: Whitelist a word so it no longer sets off the upset, praise or rule handling by itself, or take it off the whitelist. Use when this runbook's situation comes up (docs/playbooks/trigger-words.md), e.g. the user says: whitelist the word, whitelist this word, whitelist that word, not me being upset, i'm not upset when i say, isn't me being upset, stop treating that word, that word isn't praise, that word isn't a rule, take it off the whitelist, trigger word, trigger words, palabra que no cuenta, no estoy enojado cuando digo.
runbook: docs/playbooks/trigger-words.md
generated: true
---
<!-- generated:start from docs/playbooks/trigger-words.md by tools/hooks/hooks.mjs: edit the runbook, not this block -->
# Whitelist a trigger word

Open `docs/playbooks/trigger-words.md` and follow every step in order. It is the procedure, and the hooks check its "Done when" list.

## Done when
- [ ] `node tools/hooks/hooks.mjs ignore-word` exited 0 for each word and kind (or printed that nothing needed to
      change), and `"ignoreWords"` in tools/hooks/config.json now lists the word, in lowercase, under each kind the
      user meant, or no longer lists it after `--remove` (judgment: which word and kind the user meant needs a reader).
- [ ] The answer says what changed and how to undo it (judgment: plain wording for the user).
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
