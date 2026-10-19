---
name: modular-code
description: Keeps an app easy to grow and rename - features live in their own modules with one public entry each, names come from docs/names.json and settings from config files instead of being typed into the code, modules talk through small interfaces and registries so a new feature is added rather than wedged in, and files stay small enough to read. A script checks every changed code file. Use when starting an app, adding a feature, module, screen, service or integration, when a file or function grows large, when the user wants the app to be easy to extend, rename, white-label or reuse, or asks to refactor, split or restructure code.
triggers: modular, make it modular, easy to extend, easy to expand, app expansion, extensible, plugin system, add a module, new module, split this file, file is too big, god file, refactor into modules, separation of concerns, white label, rebrand the app, rename the app, reusable component, decouple
checks: core modular-code, name-var
---
# Modular code: built to grow and to be renamed

An app that works today but needs a rewrite to add the next feature, or a search-and-replace to change its name, was
built in the wrong shape. This skill keeps the shape right from the first file. The check runs by itself on every
changed code file (hook: modular-code), and names are checked everywhere (hook: name-var).

Say at the start: "Keeping it modular (modular-code skill)."

## What the other skills already cover
- **Names:** every name the user may change lives in `docs/names.json` (hard rule 17). Docs show it in a marker; code
  reads the file (or a constants module generated from it). This skill makes the code side concrete.
- **Folder layout of the whole project:** `docs/checks/layout-standards.md`.
- **The look of screens:** the gui runbook and the frontend-design skill (design tokens are the visual version of
  this skill: no raw colors or sizes in screens).
- **Server code patterns, web client patterns, mobile, games:** the backend-patterns, web-app-patterns, mobile-app
  and game-dev library skills, when enabled. They apply these principles to their stack.

## The principles
1. **One feature, one module.** A feature (orders, invoices, the map screen) lives in its own folder with its code,
   its tests and its private parts together. Adding a feature means adding a folder, not editing ten files across
   the app.
2. **One public entry per module.** Other modules import only from its entry (`index.ts`, `__init__.py`, `mod.rs`, a
   barrel file, a package's public API). Its insides can change without breaking anything else.
3. **Depend on interfaces, not on details.** Storage, network, payment, mail and clock sit behind a small interface
   the feature receives (dependency injection, a provider, a constructor argument). A test passes a fake; a new
   provider is a new implementation, not a rewrite.
4. **Extension points instead of switch statements.** When the app will have "more of these" (payment methods,
   export formats, screens, commands, plugins), keep a registry the new one adds itself to. A long `if/else` or
   `switch` over types is the sign one is missing.
5. **Nothing changeable is typed into the code.** Names and brand words come from `docs/names.json` (or a constants
   module made from it). URLs, hosts, ports, limits, feature flags and API versions come from config files or
   environment variables, with defaults in one place. Secrets only from the environment or a secret store.
6. **Data, logic and presentation apart.** Screens show, logic decides, data access stores. Business rules never live
   inside a click handler or an SQL string.
7. **Small units.** A file over about 400 lines or a function over about 60 lines is doing several jobs: split it by
   job. The check refuses making an oversized file bigger.
8. **No reaching across.** A module never imports another module's private files, and two modules never import each
   other. A shared need moves into a shared module both depend on.

## Steps
### A. Starting an app (with the app-foundation runbook)
1. Pick the module layout for the stack (references: `docs/checks/layout-standards.md`): `src/features/<name>/` (web,
   Node), `lib/features/<name>/` (Flutter), a package per feature (Python), a crate or module per feature (Rust),
   one scene folder per feature (Godot).
2. Make the config module and the names module first: one file each, read once at start. Record both paths in
   `docs/foundation.md` under "Kind of app".
3. Write down the extension points the app will need (what there will be "more of") in `docs/foundation.md`.

### B. Adding a feature, screen, service or integration
1. New folder for it, with its public entry. Import other features only through their entries.
2. Outside services behind an interface; config values from the config module; names from the names module.
3. If it is "one more of" something, register it in the existing registry. No registry yet and this is the second
   one: create the registry now and move the first one into it.
4. Run `node skills/modular-code/scripts/modularity.mjs <changed files>` (the Stop hook runs it on each changed code
   file anyway) and fix what it reports.

### C. A file or module that grew too big
1. List its jobs (one line each). Each job becomes its own file or module with a clear name.
2. Move one job at a time, running the tests after each move. Behaviour must not change (no feature work mixed in).
3. Keep the old entry point re-exporting the new parts until every caller is moved, then remove it.

## Done when
- [ ] Every changed code file passes the modularity script (hook: modular-code).
- [ ] No name the user may change is typed into code or docs (hook: name-var).
- [ ] A new feature lives in its own module and other code reaches it only through its entry (judgment: read the
      imports of the changed files).
- [ ] Settings that differ between machines or deployments come from config, with one place for defaults (judgment).

## Pitfalls
- A "utils" or "helpers" file that everything imports: it becomes the new god file. Name shared modules by what they
  do (`money.ts`, `dates.py`).
- Splitting by layer only (all controllers in one folder, all models in another) for a growing app: one feature then
  touches every folder. Group by feature, layer inside.
- Interfaces for things that will only ever have one implementation and no test fake: that is ceremony. Use one for
  outside services, storage and anything the brief says will multiply.
- Moving code and changing behaviour in the same step: a refactor must not change what the app does.
