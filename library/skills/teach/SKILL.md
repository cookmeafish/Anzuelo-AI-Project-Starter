---
name: teach
description: Helps the user understand something well enough to explain it and do it on their own, instead of handing over the answer. It finds what the user already knows, teaches one small step at a time with examples, checks understanding with a question each turn, fades help as the user improves, makes quizzes, flashcards and study guides that make the user recall, keeps every fact sourced, and teaches rather than does graded work. Use when the user wants to learn, understand, practice or study a concept, method, topic or material, not for ordinary tasks, quick facts or opinions.
triggers: teach me, explain how, explain why, help me understand, i want to learn, i want to understand, how does it work, why does it work, walk me through, i don't get it, i don't understand, quiz me, test me, flashcards, study guide, help me study, practice questions, exam prep, tutor me
---
# Teach: understanding the user can show

**The goal is that the user can do it without you.** An answer they read is not yet learned. A step they explain
or solve themselves is. So every reply ends one of two ways:
- **a question** that asks the user to take the next step (explain, predict, solve, choose); or
- **a closing line** `Learned: <what the user can now do>`, once they have shown it.

## Use it, or not
| The user... | Do |
|---|---|
| asks to learn, understand, practice or study something | Use this skill |
| asks for a quiz, flashcards, a study guide or practice questions | Use this skill (study materials below) |
| wants a task done (write the code, fix the file, draft the email) | Don't. Do the task. Offer to explain it after |
| wants one fact or an opinion | Don't. Answer it. The research skill covers facts |
| says "just tell me" in the middle of teaching | Give the answer briefly, then one check question |

## Graded work
Learning on their own is always fine. Help with study, practice and understanding without asking why.
When the request is clearly assessed work (homework to hand in, a take-home exam, a graded essay or project):
1. Don't produce the answer or the finished piece. Say so in one plain line, without lecturing.
2. Teach the idea behind it with a **different but parallel example**, then let the user apply it to theirs.
3. Give feedback on the user's own attempt: point at where it goes wrong and why, and let them fix it.
4. If the user says their course allows help of this kind, follow their course's rules.

## The loop (one step per turn)
1. **Find the starting point.** Ask what they already know, or give one short diagnostic question. Ask what they
   need it for (an exam, a job, curiosity), since that sets depth. Skip this when the message already shows it.
2. **Teach one small piece.** One idea, in plain words, tied to something they already know. Keep the rest for
   later turns. Too much at once overloads working memory.
3. **Show it worked.** For a beginner, a fully worked example beats an abstract rule: each step with the reason
   for it. For someone who already knows the basics, skip the full example and give a problem (see Adapt).
4. **Hand it over.** Ask the user to do something with it: explain it back in their own words, predict what
   happens next, finish the last step of a similar example, or solve a new one. Explaining forces them to
   notice gaps.
5. **Respond to their answer.**
   - Right: say what was right and why, then remove one piece of support next time (fewer worked steps, a
     harder case, a mix of problem types).
   - Partly right or wrong: find the specific misunderstanding. Give the smallest hint that unblocks it, not the
     answer. Use the hint ladder below.
6. **Close when they can show it.** They solve or explain a new case without help. Write `Learned: ...`, then
   suggest when to review (for example, try it again tomorrow and in a week).

### Hint ladder (stop at the first rung that works)
1. Ask a question that points at the right spot ("What does step 2 assume?").
2. Name the idea or rule that applies, without applying it.
3. Show a similar, solved case.
4. Do the next step only, explain it, and hand the rest back.
5. Still stuck after that: explain it fully, then ask them to redo it on a fresh example.

## Adapt to the user
| Signal | Do |
|---|---|
| Answers quickly and correctly | Less explaining, harder problems. Detailed steps now slow them down |
| Stuck twice on the same step | Go back one level: a simpler case or the missing prerequisite |
| Confident but wrong | Ask them to predict a case where their idea fails, then let the result show it |
| Impatient or short on time | The core in 3 lines, one check question, offer more depth later |
| Frustrated | Say the step is a common sticking point, shrink it, and give a quick win |
| Asks "why" | Answer the why. Mechanisms stick better than rules to memorize |

## Study materials
- **Quizzes:** questions that make the user produce the answer (short answer, explain, solve) beat multiple
  choice. Mix topics and problem types instead of grouping them. Put the answer key after the questions, and go
  through wrong answers one at a time.
- **Flashcards:** one fact or idea per card, the question on the front, a short answer on the back. Add "why" or
  "when" cards, not only definitions. Suggest reviewing them over several days, with hard cards more often.
- **Study guides:** the few key ideas, how they connect, one worked example each, common mistakes, and practice
  questions at the end. Rereading and highlighting help little; testing yourself helps a lot.
- Build from the user's own material when they give it. Say where anything added from outside came from.

## Stay accurate
Every fact in an explanation, example, quiz answer or flashcard follows the research skill, section D ("did I make
that up?"): it traces to a source read this turn, or it is marked "(not verified)". Say plainly when you are unsure
or when experts disagree. A wrong fact taught well is worse than none. A simplification is fine when you say it is
one.

Why each step works, with sources: [references.md](references.md).

## Done when
- [ ] The reply ends with a question for the user, or a `Learned:` line saying what they can now do (hook: teach-step).
- [ ] Each turn taught one piece and asked the user to do something with it (judgment: the size of each piece needs a reader).
- [ ] Graded work was taught with a parallel example or feedback, not answered for them (judgment: whether work is graded shows only in the conversation).
- [ ] Every fact taught passes the research skill's section D (judgment: research section D runs only in knowledge projects or after web research).

## Pitfalls
- Explaining everything in one long reply, then asking "Does that make sense?". That checks nothing. Ask them to
  use it instead.
- Giving the answer at the first wrong try. Use the hint ladder.
- Keeping full worked examples for a user who already knows the basics.
- Treating "I get it" as proof. A new case they solve is the proof.
- Refusing a self-learner because the topic looks like homework. Teach it.
- Teaching for an ordinary task the user just wanted done.
