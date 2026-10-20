---
name: parallel-agents
description: Splits work into independent parts and runs one sub-agent per part at the same time, each with a focused, self-contained brief, then checks and merges the results. Use when there are 2 or more tasks that share no files, state or order, such as unrelated failures, separate research questions, or reviews of different areas. Not for related problems or work that edits the same files.
triggers: in parallel, parallel agents, sub-agents, subagents, fan out, split the work, at the same time, several agents, multiple agents
---
# Run independent work in parallel

Unrelated problems handled one after another waste time, and one agent holding all of them loses focus. Give each
independent part its own sub-agent, run them at once, and keep your context for checking and merging. A sub-agent
does not inherit your session: its brief gives it exactly what its part needs.

## 1. Is it really independent?
First group the work by what it concerns: failures by the area or feature that breaks, research by question, reviews
by part of the codebase. Then split only when every answer is yes:
- Each part can be understood without the others.
- No two parts edit the same files or use the same running resource (a port, a database, a device, a build folder).
- Fixing one part is unlikely to fix or break another.
- The order doesn't matter.

| Situation | Do this |
|---|---|
| Parts related, or one fix may fix the rest | One agent (or you) looks at them together first |
| Understanding needs the whole system in view | One agent, or you, with the full picture |
| Independent but sharing state or files | One after another, not at the same time |
| Independent and nothing shared | In parallel, one agent per part |
| You don't yet know what is wrong | Investigate first (debug skill). Split once you can name the parts |

Many small edits of the same kind (one rename across ten files, the same field added to five forms) are one part, not
ten. Give them to one agent as a single list.

## 2. Write one brief per part
Each brief carries:
- **The rules:** "Read AGENTS.md first and follow it" (hook: subagent-brief), plus the runbook that applies.
- **Scope:** exactly which files, area or question are its own.
- **Goal:** what done looks like, checkable ("these 3 tests pass", "a cited answer to X").
- **Facts:** the error messages, test names, expected and actual values, paths and findings so far. Paste them; don't
  make it rediscover them.
- **Approach hints**, when you have them: where to look first, and the tempting shortcut to avoid, named ("don't just
  raise the timeout; find out why it is slow").
- **Limits:** what it must not touch ("change only the tests", "don't edit shared config", "no commits"), and no
  sub-agents of its own.
- **Return:** a status (done, done with concerns, needs information, blocked) and a short report: the cause found,
  what changed (file paths), what was verified, what is still open. Long output goes in a file it names.

A good brief is focused (one area), self-contained (no "as discussed") and clear about what comes back. Weak briefs
are too broad ("fix all the tests"), missing context ("fix the race condition"), unbounded (nothing stops a rewrite),
or vague about the result ("fix it"). A filled-in example is in [references.md](references.md).

## 3. Start them together
Launch all the sub-agents in the same step so they run at the same time; one per step runs them in order. A handful
of focused agents beats many overlapping ones.
- Pick the model per part where your agent allows it: the cheapest capable one for mechanical work, a stronger one
  for judgment. Say it explicitly, or every agent runs on the most expensive default.
- While they run, do your own work. Don't poll in a tight loop. If one is silent far longer than the others, check
  on it.

## 4. Check and merge
When they report back:
1. Read every report. Don't trust a "done" without the evidence asked for. Act on each status: answer "needs
   information", unblock or re-scope "blocked", read the concerns behind "done with concerns".
2. Check for overlap: did two of them touch the same file or make conflicting assumptions?
3. Run the full checks (tests, build, audit) on the combined result, not just each part.
4. Spot-check the changes yourself. Sub-agents make the same mistake the same way.
5. Report in the Finished section, per part, and say what the full checks on the combined result showed (hook:
   parallel-merged).

## Done when
- [ ] Every brief pointed at AGENTS.md and had scope, goal, facts, limits and a return format (hook: subagent-brief for AGENTS.md; judgment: whether the rest of the brief is clear).
- [ ] Every report was read and its status acted on (judgment: acting on each report needs reading it).
- [ ] The full checks passed on the combined result, after the last change (hook: parallel-merged).
- [ ] Also unasked: a turn with two or more sub-agents checks their results together and reports it (hook: parallel-trigger).

## Pitfalls
- Splitting connected problems: the agents each patch a symptom of one shared cause.
- Two agents editing the same file: the last one silently undoes the other.
- Pasting your whole session history into each brief: it costs context and blurs the scope.
- Merging without running the full checks on the combined result.

Adapted from "dispatching-parallel-agents" in obra/superpowers (MIT, see LICENSE and [SOURCE.md](SOURCE.md)).
