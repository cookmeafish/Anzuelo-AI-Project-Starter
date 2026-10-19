---
status: not set
---
# Foundation: secure, fast and friendly from the first line

Set by the `app-foundation` runbook during setup, with the user, before any feature work. Every feature is built and
verified against this page. Change it only with the user and date the change. Replace every `<...>` with a real value
or "N/A - <reason>". The setup gate fails while any are left.

Kind of app: <...> (web, mobile, desktop, game, CLI, library, service, ML or data pipeline). Rows that
don't fit the kind are "N/A - <reason>" (a CLI has no screens, a library has no first run, a pipeline has no clicks).

## 1. Security baseline (app rows)
The project-wide baseline is `docs/security.md`. These rows add what an app needs on top of it.

| Area | Decision for this app |
|---|---|
| Secrets: how the app reads them (environment or secret store), and it fails fast when one is missing | <...> |
| Network surface: what listens or calls out (local server: loopback only, Host + Origin checks, request size cap; public API: auth and rate limits; none) | <...> |
| Untrusted input: paths never built from it; HTML/markdown sanitized; no remote loads from rendered content | <...> |
| Dependencies: how they are audited (npm audit, pip-audit, cargo audit, dotnet list package --vulnerable, flutter pub outdated) and how often | <...> |
| Updates and distribution: signed or from one trusted source only (store, registry, release page) | <...> |
| Data the app keeps about people: what, where, for how long, and how it is deleted | <...> |

## 2. Performance budgets (numbers, measured with a fixed tool)
| Budget | Target | How it is measured |
|---|---|---|
| Cold start to usable (or: command finishes; a batch or training run finishes) | <e.g. 2 s> | <tool / script> |
| Response to a click, keypress or request | <e.g. 100 ms> | <...> |
| Animation frame time (if animated) | <e.g. 16 ms at 60 Hz; time-based motion> | <...> |
| Bundle, install, binary or package size | <...> | <...> |
| Memory at steady state | <...> | <...> |
| Slowest target device, phone, console or machine | <...> | <...> |

## 3. Usability and user friendliness defaults
| Area | Decision for this app |
|---|---|
| Who uses it, and what they must manage on day one without help | <...> |
| First run: what the user sees, and the one obvious next step | <...> |
| Empty, loading and error states: always explained in plain words, with what to do next | <...> |
| Language: plain words, no jargon, no internal names; translated? which languages | <...> |
| Accessibility: contrast (WCAG AA), keyboard use, focus visible, text scales | <...> |
| Screens: phone width, tablet, desktop, zoom; light and dark themes (a game: resolutions and aspect ratios; a CLI: --help and plain error messages) | <...> |
| Undo and safety: destructive actions confirmed in-app or undoable; nothing lost silently | <...> |
| Design tokens: the one file for colors (light and dark), type scale, spacing, radius, motion; screens use tokens, never raw values | <...> |
| Modules: the layout (one folder per feature, one public entry each), the config module, the names module (from docs/names.json), and the extension points (what there will be "more of": payment methods, export formats, screens, plugins) | <...> |
| Design direction: the look in one line, and the one thing people should remember (frontend-design skill, if enabled) | <...> |

## 4. Quality gates for this app
| Gate | Command | Required before |
|---|---|---|
| Tests | <...> | every commit of code |
| Build | <...> | every commit of code |
| Lint / typecheck | <...> | every commit of code |
| Security scan | <...> | every release |
| Budget check (section 2) | <...> | perf work and every release |
| Results check (ML or data: the metric against its baseline on a fixed dataset) | <...> | every model or pipeline change |
