---
name: trigger-words
summary: Whitelist a word so it no longer sets off the upset, praise or rule handling by itself, or take it off the whitelist.
triggers: whitelist the word, whitelist this word, whitelist that word, not me being upset, i'm not upset when i say, isn't me being upset, stop treating that word, that word isn't praise, that word isn't a rule, take it off the whitelist, trigger word, trigger words, palabra que no cuenta, no estoy enojado cuando digo
checks: none - a settings change the user sees at the end of the turn
---
# Whitelist a trigger word

The hooks notice when a message sounds upset, gives praise or sets a rule, partly from words. A word the user uses in
other ways ("that is sick", "damn, nice") can be whitelisted: it then sets nothing off by itself. Capitals and
every other trigger word in the same message still count. The engine never adds trigger words on its own.

## Steps
1. Find the word and its kind:
   - The word: the single trigger word the user names, not their whole sentence ("sick", not "that is sick"), unless
     they name a phrase on purpose. Case doesn't matter: it is stored in lowercase.
   - The kind: `upset`, `praise` or `rule`, as the user says it ("isn't me being upset" → upset). If they don't say:
     upset when they say they weren't upset or angry, praise when they weren't praising, rule when they weren't setting
     a rule. Still unclear: ask in one line ("whitelist 'sick' for upset, praise or both?"). For more than one kind,
     run step 2 once per kind.
2. From the project folder, run `node tools/hooks/hooks.mjs ignore-word <kind> "<word>"`; to take it off again, add
   `--remove`. It prints what changed and exits 0. Exit 2 prints why:
   - "already on the whitelist" (or, with `--remove`, "is not on the whitelist"): nothing to change; say so.
   - "kind must be one of …": fix the kind and run it again.
3. Tell the user in one line what changed and how to undo it ("say 'take damn off the whitelist'").

## Done when
- [ ] `node tools/hooks/hooks.mjs ignore-word` exited 0 for each word and kind (or printed that nothing needed to
      change), and `"ignoreWords"` in tools/hooks/config.json now lists the word, in lowercase, under each kind the
      user meant, or no longer lists it after `--remove` (judgment: which word and kind the user meant needs a reader).
- [ ] The answer says what changed and how to undo it (judgment: plain wording for the user).

## Pitfalls
- Never whitelist on your own because a message was calm: say it once ("'sick' set off the upset check; want me to
  whitelist it?") and let the user decide.
