---
status: not set
---
# Foundation: secure, fast and friendly from the first line

Set by the `app-foundation` runbook during setup, with the user, before any feature work. Every feature is built and
verified against this page. Change it only with the user and date the change. Replace every `<...>` with a real value
or "N/A - <reason>". The setup gate fails while any are left.

## 1. Security baseline (app rows)
The project-wide baseline is `docs/security.md`. These rows add what an app needs on top of it.

| Area | Decision for this app |
|---|---|
| Secrets: how the app reads them (environment or secret store), and it fails fast when one is missing | <...> |
| Local server: loopback only, Host + Origin checks, request size cap | <...> |
| Untrusted input: paths never built from it; HTML/markdown sanitized; no remote loads from rendered content | <...> |
| Dependencies: how they are audited (e.g. npm audit / pip-audit) and how often | <...> |
| Updates and distribution: signed or from one trusted source only | <...> |

## 2. Performance budgets (numbers, measured with a fixed tool)
| Budget | Target | How it is measured |
|---|---|---|
| Cold start to usable | <e.g. 2 s> | <tool / script> |
| Response to a click or keypress | <e.g. 100 ms> | <...> |
| Animation frame time (if animated) | <e.g. 16 ms at 60 Hz; time-based motion> | <...> |
| Bundle / install size | <...> | <...> |
| Memory at steady state | <...> | <...> |
| Slowest target device or screen | <...> | <...> |

## 3. Usability and user friendliness defaults
| Area | Decision for this app |
|---|---|
| Who uses it, and what they must manage on day one without help | <...> |
| First run: what the user sees, and the one obvious next step | <...> |
| Empty, loading and error states: always explained in plain words, with what to do next | <...> |
| Language: plain words, no jargon, no internal names; translated? which languages | <...> |
| Accessibility: contrast (WCAG AA), keyboard use, focus visible, text scales | <...> |
| Screens: phone width, desktop, zoom; light and dark themes | <...> |
| Undo and safety: destructive actions confirmed in-app or undoable; nothing lost silently | <...> |
| Design tokens: the one file for colors (light and dark), type scale, spacing, radius, motion; screens use tokens, never raw values | <...> |
| Design direction: the look in one line, and the one thing people should remember (frontend-design skill, if enabled) | <...> |

## 4. Quality gates for this app
| Gate | Command | Required before |
|---|---|---|
| Tests | <...> | every commit of code |
| Build | <...> | every commit of code |
| Lint / typecheck | <...> | every commit of code |
| Security scan | <...> | every release |
| Budget check (section 2) | <...> | perf work and every release |
