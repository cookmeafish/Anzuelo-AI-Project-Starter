---
name: web-app-patterns
description: Patterns for the code behind a web app's screens (React, Vue, Svelte or plain TypeScript) - where state lives, data requests with loading, error and stale-response handling, forms and validation, routes, typed props, component tests, bundle size, and keeping secrets out of the client bundle (VITE_, NEXT_PUBLIC_ and similar variables are public). Use when writing or changing client-side code (a component, hook, store, form, data request or route), when a screen shows stale or wrong data, when the bundle grows, or when asked how to structure the front end. The look and wording of screens belong to frontend-design, server code to backend-patterns.
triggers: react component, vue component, svelte component, state management, global state, context provider, useeffect, data fetching, fetch data, loading state, stale response, out of order responses, form validation, form handling, client-side routing, react router, vue router, typed props, prop types, component test, testing library, bundle size, code splitting, lazy load, import.meta.env, next_public_, env variable in the frontend
---
# Web app patterns: the code behind the screens

Screens break in the same few ways: an old response overwrites a new one, a form loses what the user typed, state is
copied in two places and drifts, or a key ends up in the bundle anyone can download. These habits prevent that, and a
test or a scan proves each change.

Say at the start: "Working on the client code (web-app-patterns skill)."

## What the other skills already cover
- **How it looks, the words on screen, accessibility:** the frontend-design skill, when enabled.
- **Server code, APIs, databases, sign-in on the server:** the backend-patterns skill, when enabled.
- **Screenshots of the result:** the gui-review-loop skill (gui pack), AGENTS.md rule 9.
- **A bug in a component:** the debug skill first, then the bugfix runbook (app pack).
- **A slow first load:** the perf runbook (app pack) owns the measuring; section **G** says what to change.
- **A full security review:** the security-review skill. Section **H** covers only what reaches the browser.

Framework commands and code shapes: [references.md](references.md). Secrets scan:
`skills/web-app-patterns/scripts/client-secrets.mjs` (Node only, nothing to install).

## Pick the situation
| Situation | Section |
|---|---|
| A new component, or a big one to split | **A** |
| Where a piece of state should live | **B** |
| Loading data from an API | **C** |
| A form | **D** |
| A new page or route | **E** |
| Tests for a component or hook | **F**, after every change |
| The bundle grew, or the first load is slow | **G** |
| A setting, key or URL the client needs | **H**, and before every build that ships |

## A. Components
1. One component, one job. A component that fetches, reshapes and draws is split: a hook or function for the data,
   a component for the drawing.
2. Props are typed (TypeScript types, or JSDoc in plain JavaScript). Required props have no default; optional ones
   state what happens without them.
3. Derive, don't copy: a value that can be computed from props or state is computed while drawing, not stored.
4. List items get a stable key from the data (an id), never the array index when items can move or be removed.

## B. Where state lives
Put state in the lowest place every reader can reach, and nowhere else:
1. **One component:** local state (`useState`, `ref`, a Svelte `let` or `$state`).
2. **A few related components:** lift it to their nearest shared parent and pass it down.
3. **Many distant screens:** one store or context with a small, named set of updates.
4. **Data from a server:** a server-data cache (TanStack Query, SWR, or one module of your own), not a copy in a store.
5. **What the address bar should remember:** filters, tabs, the selected item and the page number go in the URL, so
   reload, links and the back button work.

## C. Data requests
1. Every request draws three states: loading, error (plain words and a retry), and loaded. An empty result gets its
   own message.
2. **The newest request wins.** Cancel or ignore a response the user has moved past: an `AbortController` per
   request, or a request counter checked before setting state. Typing fast into a search box is the test.
3. Check the response's shape where it enters the app (a schema or a type guard) before the rest of the code trusts
   it.
4. Never one request per list item: fetch the list once, or batch.
5. A failed request never leaves a spinner running forever: set a timeout and show the error state.

## D. Forms
1. Validate on the client for speed and on the server for truth. The client check is a convenience, never the guard.
2. Each field shows what is wrong next to it, in plain words, and keeps what the user typed.
3. The submit button is disabled while sending, a double click sends once, and a failed send keeps the form filled.
4. Destructive actions ask to confirm or can be undone (`docs/foundation.md`, usability defaults).

## E. Routes
1. Each route has a page title, a loading state and a not-found state.
2. A route that needs sign-in is also checked on the server. Hiding a link is not access control.
3. Large or rarely used routes load lazily (**G**).

## F. Tests and type check
1. Test what the user sees and does: render, click or type, then check the text on screen. Not internal state.
2. Fake data requests at the network edge (a fake `fetch` or a mock server), so the component code runs for real.
3. A bug fixed in a component gets a test that failed before the fix.
4. Use the project's own runner. Run it, and the type check, after every client change (commands in references.md):
   - Vite projects: `npx vitest run`; Jest projects: `npx jest`; plain modules: `node --test`.
   - Types: `npx tsc --noEmit`, `npx vue-tsc --noEmit` (Vue) or `npx svelte-check` (Svelte).
5. No test runner yet: say so, and propose one with its cost (`Worth it: <gain> / <cost>`). Install only with the
   user's OK.

## G. Bundle size and first load
1. Measure first: the build's own size report (`npx vite build` prints each chunk; `next build` prints each route),
   against the budget in `docs/foundation.md`, section 2.
2. Split by route, and load heavy, rarely used parts (charts, editors, maps) only when they are opened.
3. Import only what you use (`import { debounce } from 'lodash-es'`, not the whole library).
4. A new dependency is weighed like any other addition, including its size (`Worth it: <gain> / <cost>`), and
   installed only with the user's OK.

## H. Settings and secrets
1. **Everything in the client bundle is public.** Variables with a public prefix (`VITE_`, `NEXT_PUBLIC_`,
   `REACT_APP_`, `PUBLIC_` in SvelteKit, `NUXT_PUBLIC_`, `EXPO_PUBLIC_`) are copied into the files every visitor
   downloads. Keys, tokens, passwords and database URLs never go there. A call that needs a secret goes through the
   app's own server (backend-patterns).
2. Some keys are public on purpose (a payment provider's publishable key, an anonymous database key protected by
   row rules, a map key restricted to your domain). Say which ones and why in the answer.
3. Each setting is read in one place, and the app stops with a clear message when a required one is missing.
4. `.env` files stay out of git. `.env.example` lists the names with fake values (AGENTS.md rule 15).
5. Run `node skills/web-app-patterns/scripts/client-secrets.mjs .` from the project root. It checks `.env` files,
   source code that reads public variables, and the build output (`dist`, `build`, `out`, `.next/static`,
   `.output/public`, `.svelte-kit/output/client`, `www`), and prints `RESULT: PASS` or `RESULT: FAIL`. Build first so
   the shipped files are checked too. A WARN line is a public
   key-like variable: confirm it is meant to be public. Fix every FAIL before anything ships.
6. A secret that already shipped is exposed: tell the user it must be rotated at its provider. Removing it from the
   code does not take it back.

## Done when
- [ ] After client code changed, the component tests or the type check ran, or the secrets scan (hook: client-verified).
- [ ] Every request in the change draws loading, error and loaded states, and the newest request wins (judgment: whether each state shows needs a look at the screen; the gui-review-loop screenshots them).
- [ ] `client-secrets.mjs` prints `RESULT: PASS` on the project before a build ships (judgment: whether a WARN value is really public needs a person).
- [ ] New or changed components have a test that checks what the user sees (judgment: whether the test checks behavior, not internals).

## Pitfalls
- A search box that showed results for an older query, because the slower request finished last (**C** 2).
- A server response copied into a store, so two copies drift and the screen shows the stale one (**B** 4).
- A "temporary" key put in a `VITE_` or `NEXT_PUBLIC_` variable for testing, then built and deployed.
- Tests that check a component's internal state, so they break on every refactor and miss real bugs.
- The array index as a list key, so typing into one row's field moves the text to another row after a delete.
