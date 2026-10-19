---
name: user-research
description: Learns from people instead of from documents. Plans interviews, surveys, usability tests, card sorts and diary studies around the decision they inform, runs them without leading questions, and turns transcripts, session notes, survey exports, support tickets and reviews into findings where every theme has an "n of N" count, every quote is traced to the notes by participant ID, observations are kept apart from interpretations, and the limits are stated. People's names and contact details stay out. Use when planning user research or turning interview notes, survey results, usability sessions or feedback into findings.
triggers: user research, research plan, user interview, customer interview, interview guide, interview questions, usability test, usability testing, survey questions, design a survey, survey results, card sort, diary study, research synthesis, synthesize interviews, synthesize feedback, interview notes, affinity map, user feedback themes, jobs to be done
---
# User research: findings that trace to what people said

People are a source like any other, and the research skill's rule holds: **every finding traces to notes someone
actually took.** A quote is word for word from a transcript or note, or it isn't a quote. Formats for the plan, the
guide and the report are in [references.md](references.md).

**People's data is private.** Give each participant an ID (P1, P2) and keep names, contact details and recordings
out of the findings, out of git unless the project says otherwise, and out of every web query. Get consent before
recording. Recruiting, sending a survey or contacting anyone is an outward action: draft it, then wait for the
user's OK (AGENTS.md rule 6).

## Pick the situation
| Situation | Do |
|---|---|
| Deciding what to study, and how | **A** |
| Writing the interview guide, the usability tasks or the survey | **B** |
| Turning notes, results or feedback into findings | **C** |

Then always the research skill's section **D** (did I make that up?), and in a knowledge project its section **E**
(record it).

## A. Plan the study
1. **Write the decision it informs** and three to five questions the study must answer. A study with no decision
   behind it produces interesting notes and no change.
2. **Pick the method that fits the question.** Sample sizes are common rules of thumb, not laws:

   | Question | Method | People |
   |---|---|---|
   | Why do they do it this way, what do they need | Interviews | Until new sessions stop adding themes, often 5 to 12 |
   | Can they do the task with this design | Usability test | About 5 per round per kind of user, then fix and test again |
   | How many feel or do X | Survey | Depends on the margin of error wanted: about 100 answers gives roughly plus or minus 10 points (calculated, 95% confidence, simple random sample) |
   | How do they group and name things | Card sort | About 15 or more |
   | What happens over days or weeks | Diary study | A small group, kept going for the whole period |
   | Which of two versions does better | A/B test | Enough traffic to reach a planned significance level; size it before starting |

3. **Say who takes part and why**, and who is missing. Five enthusiasts don't stand for every user.

## B. Run it without steering
- **Interview guide:** a short opening (who you are, how notes are used, consent), questions about how they work
  today, a deep part on the topic, an optional reaction to a sketch or prototype, and a close ("anything I didn't ask
  that I should have?"). Ask about past events ("tell me about the last time you..."), not wishes or predictions.
  Open questions, no leading words, then silence and "what happened next?".
- **Usability test:** give a goal, not instructions ("book a table for Friday", not "click Reserve"). Watch and note
  what they do and say; don't help. Record success, time and where they got stuck.
- **Survey:** one idea per question, neutral wording, balanced answer scales, an "other" or "not sure" choice, and a
  test run with two or three people before it goes out.

## C. Synthesize what they said
Inputs can be transcripts, session notes, survey exports, support tickets, reviews or satisfaction scores. Read all
of it before grouping anything.
1. **Pull observations into a list**, one per line, each tagged with its participant and the file it came from.
   Keep **observed** ("4 of 6 missed the save button") apart from **interpreted** ("the button is hard to see").
2. **Group into themes** (an affinity map: similar observations clustered, then named). A theme needs support from
   more than one person; a striking one-off stays a one-off and is labeled so.
3. **Count, don't guess.** Write prevalence as "n of N" for every theme. Never "most users" or "everyone" without the
   count. Survey numbers come from the data with the question wording, base size and any filter.
4. **Back each theme with quotes** copied exactly from the notes, with the participant ID. Shortening a quote is
   marked with "...". Never polish, merge or invent one.
5. **Turn themes into insights and options:** what it means for the product, and what could be done, with a rough
   impact and effort. Segments (groups with different needs) only when the data shows them; give their size as a
   count, not a guess.
6. **Say the limits:** who took part and who didn't, how they were found, the method's blind spots, and what is
   still unknown. Suggest the next question to study.
7. **Check it with the research skill's section D:** every count recounted from the notes, every quote matched
   character by character.

Write the report with the synthesis format, recommendations first. If the project connects to a feedback tool,
analytics or a research wiki, use them to add evidence or compare with earlier studies, and cite them like any
source. Facts about the market or the world that the study did not measure go through the **research** skill.

## Done when
- [ ] **A:** the plan names the decision it informs and the questions (hook: user-research-counted).
- [ ] **C:** every theme has an "n of N" count and quotes traced to notes by participant ID (hook: user-research-counted).
- [ ] Observations are kept apart from interpretations, and the limits are stated (judgment: telling observation from interpretation needs a reader).
- [ ] No names or contact details in the findings. Nobody was contacted without the user's OK (judgment: names and contact are in the conversation, not a pattern).
- [ ] Every count and quote passes the research skill's section D (judgment: research section D runs only in knowledge projects or after web research).

## Pitfalls
- Leading questions ("wouldn't it be easier if...?") and asking people to predict what they would use.
- A theme from one vivid participant presented as a pattern. A tidied-up quote presented as their words.
- "Most users" with no count behind it.

Inspired by the "design" plugin in anthropics/knowledge-work-plugins (Apache 2.0, see LICENSE). Details in
[SOURCE.md](SOURCE.md).
