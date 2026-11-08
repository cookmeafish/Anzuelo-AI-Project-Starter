---
name: summarize
summary: Summarize a meeting, thread, paper or document the user hands over: decisions and action items first, every claim pointing to where it is in the source
triggers: summarize this, summarise this, summarize the meeting, summarize the thread, summarize this paper, tl;dr, tldr, give me the key points, key points of, key points from, give me the gist, the gist of, action items from, sum up this, sum up the thread, what did they decide, meeting recap, resume este, hazme un resumen
trigger_regex:
menu:
checks:
---
# Playbook: summarize a source

**Use when:** the user hands over a meeting transcript or notes, an email or chat thread, a paper or a document and
wants the gist, key points, decisions or action items. **Not when:** a new report or one-pager from the project's facts
(deliverable, knowledge pack); filing sources into the knowledge base (ingest); where the project itself stands
(session-handoff); shortening the user's own text (revise-text).

## Inputs
- The whole source. A pdf or other file: read its text with the agent's file reader; a long one is read in parts,
  all of them.
- What the summary is for (a decision, a catch-up, a record) and its length. Default: a catch-up of at most 200
  words; a record keeps every decision and action item with no word cap. Ask ONE question only when the purpose would
  change what goes in; with `"autonomy": "auto"`, use the default and write an `Assumed:` line.

## Steps
1. **Read all of it.** Note what it is, who wrote it or took part, and its date.
2. **Pick the location format** the source allows: page (`p. 4`), timestamp (`[12:30]`), message (`msg 7` or
   sender and time), or section heading. Every claim gets one.
3. **Write in this order,** under a first line naming the source (what it is, its title, who wrote it or took
   part, its date):
   1. **Decisions:** (heading `Decisions:`) what was decided, by whom when stated.
   2. **Action items:** owner, task, due date ("no date given" when none).
   3. **Open questions:** what was raised and not settled.
   4. **Key points:** the rest, most important first, within the length.
   A section with nothing says so in one line (`No decisions in the source.`). A paper has no action items: say so,
   and lead with its findings.
4. **Stay with the source.** Quotes are word for word. Keep its uncertainty ("proposed", "maybe", "to confirm"). What
   the source does not say is marked "not stated", never filled in.
5. **Verify:** search the source for every quote and spot-check 3 claims at their location; fix any miss.
6. **Deliver** in the answer. When the user wants it kept, or it runs past about 300 words, save it as a new file
   `outputs/<source name> summary.md` (the next free `v2` if it exists), run
   `node tools/writing-check.mjs "outputs/<source name> summary.md"`, and give the path. `<source name>` is the file's
   name, or for pasted text a short subject and date (`team call 2026-11-07`). With the knowledge pack, add the
   summary's path to the source's row in `docs/knowledge/SOURCES.md`.

## Done when
- [ ] The summary leads with decisions, then action items with owner and date, then open questions, or says the source
      has none (answer: Decisions:|No decisions|Decisiones:|Sin decisiones)
- [ ] Every claim carries its location in the source (judgment: location formats differ by source, and a file summary
      is not in the answer).
- [ ] Every quote was found word for word in the source this turn, and gaps are marked "not stated" (judgment: the
      source can be a pdf or pasted text no command reads).
- [ ] A saved summary is a new file and the writing check ran on it (when file: outputs/*summary*.md) (ran: writing-check\.mjs)

## Pitfalls
- A smooth summary that adds a decision nobody made: step 5 checks claims at their location, not by memory.

Sources: https://assets.publishing.service.gov.uk/media/68adbe409e1cebdd2c96a19d/dbt-microsoft-365-copilot-evaluation.pdf,
https://www.nber.org/papers/w34255,
https://raw.githubusercontent.com/anthropics/skills/main/skills/doc-coauthoring/SKILL.md
