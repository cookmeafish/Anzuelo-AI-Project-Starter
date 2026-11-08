---
name: summarize
description: Summarize a meeting, thread, paper or document the user hands over: decisions and action items first, every claim pointing to where it is in the source. Use when this runbook's situation comes up (docs/playbooks/summarize.md), e.g. the user says: summarize this, summarise this, summarize the meeting, summarize the thread, summarize this paper, tl;dr, tldr, give me the key points, key points of, key points from, give me the gist, the gist of, action items from, sum up this.
runbook: docs/playbooks/summarize.md
generated: true
---
<!-- generated:start from docs/playbooks/summarize.md by tools/hooks/hooks.mjs: edit the runbook, not this block -->
# summarize a source

Open `docs/playbooks/summarize.md` and follow every step in order. It is the procedure, and the hooks check its "Done when" list.

## Done when
- [ ] The summary leads with decisions, then action items with owner and date, then open questions, or says the source
      has none (answer: Decisions:|No decisions|Decisiones:|Sin decisiones)
- [ ] Every claim carries its location in the source (judgment: location formats differ by source, and a file summary
      is not in the answer).
- [ ] Every quote was found word for word in the source this turn, and gaps are marked "not stated" (judgment: the
      source can be a pdf or pasted text no command reads).
- [ ] A saved summary is a new file and the writing check ran on it (when file: outputs/*summary*.md) (ran: writing-check\.mjs)
<!-- generated:end -->

<!-- Skill-only material goes below: notes for scripts/ and assets/ in this folder. Hardening moves repeatable steps into scripts/. -->
