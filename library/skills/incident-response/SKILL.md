---
name: incident-response
description: Runs a live-software incident from the first alert to a written post-mortem. It rates how bad it is, limits the harm first (roll back, switch off, block, fail over) with the user's OK, keeps a timeline as it goes, drafts updates for the people affected, fixes the root cause through the debug skill and the bugfix runbook, and writes a blameless post-mortem to docs/incidents whose actions become checks. Use when the live app or service is down, broken or slow for its users, an alert fires, data may be lost or exposed, or after an outage to write the post-mortem.
triggers: incident, outage, production is down, prod is down, site is down, service is down, the app is down, alert fired, on call, on-call, sev1, sev 1, post-mortem, postmortem, incident report
---
# Incident response: stop the harm, then find the cause

**Users first.** While people are hurt, the fastest safe way to stop the harm comes before any search for the cause.
Then the cause gets found and fixed properly, because a rollback is not a fix and the problem returns with the next
release.

Say at the start: "Handling this as an incident (incident-response skill)."

**Not for:** a bug seen in development, a test run or by one user with nothing live at stake: the `bugfix` runbook.
A suspected breach or leaked key is an incident too, and also goes through the **security-review** skill (revoke and
rotate, not just delete).

**Outward actions need the user's OK in this conversation** (AGENTS.md rule 6): status posts, emails to customers,
paging people, and every change to production (rollback, deploy, config, data). In a hurry, keep the ask short: the
exact command, what it does and how to undo it.

## 1. Triage (the first minutes)
1. **Open the incident file now:** `docs/incidents/YYYY-MM-DD-<topic>.md` ([references.md](references.md), incident
   file). Log every finding and action in its timeline as it happens, with the time and its zone. A timeline written
   from memory afterwards is wrong.
2. **Get the facts by measuring:** what users see, since when, how many are affected, and which parts. Use error rates,
   logs, health checks and a request you send yourself. If monitoring, error-tracking or paging tools are connected,
   pull their data from just before the start; if not, ask the user to paste it.
3. **Rate it:**

   | Level | Means | Pace |
   |---|---|---|
   | 1 Critical | Down for all or most users, or data or money being lost or exposed | Everything else stops. Update every 30 minutes |
   | 2 Major | A core feature broken or very slow for many users | Work on it now. Update every hour |
   | 3 Minor | Part of it broken for some users, with a workaround | Today. Update at each milestone |
   | 4 Low | Cosmetic or rare | Not an incident: the `bugfix` runbook |

   When unsure, pick the higher level and lower it later with evidence.
4. **Roles,** when several people help: one person leads and decides, one writes the updates, the rest investigate.
   Working alone with the agent, the user leads and the agent keeps the log and drafts.
5. **What changed just before?** The last release, a config change, a new dependency, a data migration, a traffic jump,
   an outside service's status page. A change whose time matches the start is the first suspect.

## 2. Limit the harm
1. **Pick the fastest safe action** that stops the harm, preferring ones that can be undone: roll back the last release
   (the rollback plan in its release notes), switch off a feature flag, block the abusive traffic, add capacity, turn
   on a maintenance page, or fail over.
2. **Data at risk:** stop the writes first, and snapshot the current state before any repair (the `data-change`
   runbook). A repair without a snapshot can make the loss permanent.
3. **Ask for the OK** for each production action, then log it with its time.
4. **Confirm it worked** with the same measurement used in triage. Status becomes "monitoring".

## 3. Keep people informed
1. **Draft every update; the user sends it.** Each one says what is wrong in the user's terms, who is affected, what
   is being done, any workaround, and when the next update comes ([references.md](references.md), update).
2. **Facts only.** No guessed causes, and no promised fix times that may have to be taken back.
3. **Two audiences:** internal updates carry the detail; user-facing ones use plain words and no internal names.
4. **The next-update time is a promise.** Keep it, even when the update is "no change yet".
5. Status words, in order: investigating, identified, monitoring, resolved.

## 4. Fix the cause
1. Once the harm is contained, follow the **debug** skill and the `bugfix` runbook: root cause with evidence, a failing
   test, the fix, its siblings, and the triple check.
2. Ship the fix through the `release` runbook, with a rollback plan.
3. **Resolved** means the measurement has been normal for a while at normal traffic (for example 30 minutes), and the
   temporary mitigation has been undone or deliberately made permanent.

## 5. Post-mortem
Write it in the incident file within a few days, for every level 1 or 2 incident and any level 3 that taught something
([references.md](references.md), post-mortem).
1. **Summary** in two or three plain sentences, and the **impact** in numbers: users, duration, data, money.
2. **Timeline** from the first sign to resolved. Mark when it started and when it was noticed: the gap between them is
   a finding of its own.
3. **Why-chain:** ask "why" until the answer is a gap in a process, a tool or the design, with evidence for each step.
4. **What made it worse** or slower to notice, what worked well, and what did not.
5. **Actions,** each with an owner, a due date and its type: prevent, notice sooner, or recover faster. Prefer actions
   that become checks (a test, a `tools/hooks/requirements.json` check, a codeRule, an alert) over reminders.
6. **Blameless:** describe the decisions and what people knew at the time. Never name a person as the cause.
7. **Close the loop:** a row in `docs/lessons.md`, the actions in `docs/STATUS.md` (Next), and any missing runbook
   step written into that runbook (AGENTS.md rule 2). Review it with the user.

## Done when
- [ ] `docs/incidents/<file>.md` exists with the level, a timeline with times, and the impact.
- [ ] The harm was stopped and the measurement confirms it. Each production action had the user's OK and is logged.
- [ ] Updates were drafted at the promised pace, and nothing was sent without an OK.
- [ ] The answer states `Root cause: <what and why>`, and a regression test covers it (debug skill, `bugfix` runbook).
- [ ] Level 1 and 2: the post-mortem has impact numbers, the why-chain and actions with owner, date and type, and
  `docs/lessons.md` has its row.

## Pitfalls
- Debugging for an hour while users are still down, when a rollback would have stopped the harm in minutes.
- Calling the rollback the fix and never finding the cause, so it comes back with the next release.
- Updates that guess the cause or promise a time, then have to be taken back.
- Repairing data without a snapshot first.
- Rebuilding the timeline from memory, which gets times wrong and hides how long nobody noticed.
- Actions like "be more careful". That is not an action: make it a check, an alert or a tool.
- A post-mortem that names a person as the cause, which teaches everyone to hide the next mistake.

Inspired by the incident-response skill of the engineering plugin in anthropics/knowledge-work-plugins (Apache-2.0,
see LICENSE and [SOURCE.md](SOURCE.md)).
