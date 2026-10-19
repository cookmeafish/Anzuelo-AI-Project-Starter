---
name: architecture
description: Makes and records the big technical choices in software. (A) A decision is compared across real options and written as a row in docs/DECISIONS.md with a concrete "reopen if". (B) A new system or large feature is designed from numbers (load, data, latency, cost) to components, contracts and failure handling before anyone builds it. (C) Tech debt is collected from evidence, ranked, and paid down in small steps alongside feature work. Use when choosing between technologies or approaches, when designing a service, API, data model or major feature, or when asked what to refactor, about code health or tech debt.
triggers: architecture decision, tech stack, choose the stack, app architecture, design decision, adr, choose between, which database, which framework, system design, design a system, design the service, how should we architect, data model design, service boundaries, tech debt, technical debt, what should we refactor, code health, refactoring priorities
---
# Architecture: decide on purpose, design before building, pay debt on a schedule

Big choices made by accident cost the most to undo. This skill has three parts. Pick the one that fits and say it at
the start: "Using the architecture skill, part A (decision)", "part B (design)" or "part C (tech debt)".

**Not for:**
- the app's first ground rules (security baseline, budgets, gates): the `app-foundation` runbook;
- building the feature once it is designed: the `feature` runbook (spec, plan, triple check);
- learning how existing code fits together: the **codebase-map** skill, when enabled;
- finding out why code is the way it is: the **commit-archaeologist** skill, when enabled.

**Read first, every part:** `docs/BRIEF.md`, `docs/DECISIONS.md`, `docs/foundation.md` (app projects) and
`docs/codebase-map.md` if it exists. A settled decision stays settled unless its "Reopen if" condition is met. Say so
when it is.

## A. Record a decision
1. **Frame it** in one line: the question, why it has to be decided now, and who decides (the user, unless
   `"autonomy": "auto"` is set in `tools/hooks/config.json`).
2. **Write down the limits** that shape the answer: deadline, budget, expected load with numbers, what the people who
   will maintain it already know, and the stack already in place.
3. **Find at least two real options.** Keeping things as they are counts when it is workable. A weak option added only
   to lose is not an option.
4. **Compare them on the same rows** ([references.md](references.md), comparison table): effort to build, running
   cost, fit for the expected load, familiarity, how hard it is to undo, and the main risk. Use numbers where you have
   them and mark guesses as guesses.
5. **Recommend one** and name the trade-off that decided it. Say what gets easier, what gets harder, and what to keep
   an eye on.
6. **Get the choice** from whoever decides. Lead with the recommendation and offer the alternatives in one message.
7. **Record it** as a new top row of `docs/DECISIONS.md`: Date, Decision, Why, Rules out, Reopen if.
   - "Reopen if" is an observable condition ("the job queue stays above 10,000 items for a day"), never "if needed".
   - A long comparison goes to `docs/decisions/YYYY-MM-DD-<topic>.md`, linked from the Why cell.
   - A decision that replaces an older one: the old row's Decision cell gets "Replaced YYYY-MM-DD", and is kept.
8. **Follow-up work** goes into `docs/STATUS.md` (Next) or a plan (plan skill).

## B. Design a system or a large feature
1. **Requirements with numbers.** What it must do, and how well: users, requests per second at peak, data size per
   year, response time, uptime, cost ceiling. Estimate unknown numbers to the nearest power of ten and label them as
   estimates. Ask ONE question when a missing number would change the design.
2. **Rough load math**, written out so others can check it. For example: 5,000 daily users doing 40 actions each is
   200,000 requests a day, about 2 per second on average and perhaps 20 at peak. One server handles that easily.
3. **The shape:**
   - the parts and what each one owns, in a diagram (Mermaid or plain text);
   - the main flows from request to stored data;
   - the contract between each pair of parts (endpoints or messages, with request and response shapes);
   - where each kind of data lives, and why that store.
4. **Go deep only where the risk is** ([references.md](references.md), design checklist): the data model and the
   indexes its main queries need, caching and how it stays fresh, background work (retries, safe to run twice),
   timeouts and errors at every call to another service.
5. **Growth and failure:** what breaks first at 10 times the load, which single part takes everything down when it
   fails, how the system recovers, and what is measured and alerted on.
6. **Security:** for every new entry point, run step 1 of the **security-review** skill (scope and threat model).
7. **Pick the simplest design that meets the numbers.** Every extra service, queue or store adds deployment, failure
   and debugging work for as long as it exists. Each significant choice in the design becomes a part A decision.
8. **Write it down** in `docs/specs/<feature>-design.md` (app projects; the feature's spec links to it), with the
   assumptions and a "revisit when" list. Then build it through the `feature` runbook.

## C. Find and pay down tech debt
1. **Collect evidence, not impressions:**
   - files that change most often and get the most fix commits (`node skills/codebase-map/scripts/hotspots.mjs` when
     enabled, or `git log`);
   - rows in `docs/lessons.md` that point at the same area;
   - TODO, FIXME and HACK comments;
   - slow or flaky tests, and gaps in test coverage around risky code;
   - the dependency audit and outdated-package list;
   - manual release steps, missing monitoring or backups, stale README or setup notes.
2. **Sort each item by kind:** code, design, tests, dependencies, docs, or operations ([references.md](references.md),
   debt kinds).
3. **Score it** from 1 to 5 on three counts: pain now (how much it slows changes or causes bugs), risk if left, and
   effort to fix. Priority is (pain + risk) divided by effort. Security holes and risks to data go to the top whatever
   their score.
4. **Plan the payments.** Most items ride along with feature work: fix the debt in the area a feature touches anyway.
   Give the top few their own small tasks. For each one, say in plain words what the user gets (fewer bugs in X,
   faster changes to Y).
5. **Save the list** to `docs/tech-debt.md` as a dated table ([references.md](references.md), debt table).
6. **Pay each item safely.** A clean-up changes no behaviour: the tests pass before it and the same tests pass after
   it. Add tests first where the area has none. Never bundle a clean-up with a behaviour change (`bugfix` and
   `feature` runbooks).
7. **Re-rank** when the list is revisited, and move paid items to a "Paid" section with the date.

## Done when
- [ ] A: `docs/DECISIONS.md` has the new row with all five cells filled, at least two real options were compared (judgment: whether the options were real needs a reviewer), and
  the answer says who chose.
- [ ] B: the design file has numbers, a diagram, the contracts, failure handling, assumptions and a revisit list (judgment: the quality of the design needs a reviewer), and
  its significant choices are recorded as in part A.
- [ ] C: `docs/tech-debt.md` has a ranked table where every item names its evidence, and the top items have a plan (judgment: whether the evidence and ranking hold needs a reviewer).
- [ ] The answer names the file written (`docs/DECISIONS.md`, the design file or `docs/tech-debt.md`) (hook: architecture-recorded).
- [ ] Followed unasked when a dependency, a service or a data model is added, and the decision recorded (hook: architecture-trigger).

## Pitfalls
- Designing before the numbers are known, then building for a scale that never comes, or one that is far too small.
- Comparing one real option against a weak one, so the "decision" was made before the comparison.
- A vague "Reopen if", so every later discussion reopens the decision.
- Splitting into many services for a small team. Each boundary costs deployment, failure handling and debugging time.
- Rewriting a module as debt payment with no tests pinning its behaviour first.
- A debt list built from opinions, or one that is never re-ranked and goes stale.

Inspired by the architecture, system-design and tech-debt skills of the engineering plugin in
anthropics/knowledge-work-plugins (Apache-2.0, see LICENSE and [SOURCE.md](SOURCE.md)).
