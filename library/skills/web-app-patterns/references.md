# Web app patterns: commands and code shapes

Companion to [SKILL.md](SKILL.md). Use the project's own package manager: swap `npx` for `pnpm exec`, `yarn` or
`bunx` when the project uses one of those (look for `pnpm-lock.yaml`, `yarn.lock` or `bun.lockb`).

## Tests, type check and build, per stack
| Stack | Component tests | Type check | Build with size report |
|---|---|---|---|
| React + Vite | `npx vitest run` (with Testing Library) | `npx tsc --noEmit` | `npx vite build` |
| Next.js | `npx vitest run` or `npx jest` | `npx tsc --noEmit` | `npx next build` |
| Vue + Vite | `npx vitest run` (with Vue Test Utils or Testing Library) | `npx vue-tsc --noEmit` | `npx vite build` |
| Nuxt | `npx vitest run` | `npx nuxi typecheck` | `npx nuxi build` |
| SvelteKit | `npx vitest run` | `npx svelte-check` | `npx vite build` |
| Plain TypeScript or JavaScript | `node --test` | `npx tsc --noEmit` | the project's bundler |

A `test`, `typecheck` or `check` script in `package.json` comes first: `npm test`, `npm run typecheck`.
End-to-end tests (`npx playwright test`) are slower; run them for flows that cross pages.

## The newest request wins
React:
```tsx
useEffect(() => {
  const ctrl = new AbortController();
  setState({ status: 'loading' });
  fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then(data => setState({ status: 'loaded', data }))
    .catch(err => { if (err.name !== 'AbortError') setState({ status: 'error', err }); });
  return () => ctrl.abort(); // the next query, or leaving the screen, cancels this one
}, [q]);
```
Vue: the same body in `watch(q, (value, old, onCleanup) => { ...; onCleanup(() => ctrl.abort()); })`.
Svelte 5: the same body in `$effect(() => { ...; return () => ctrl.abort(); })`.
Without `AbortController`: keep a counter, increase it per request, and set state only when the response's number
still equals the counter.

A server-data library (TanStack Query, SWR, Vue Query) handles this, caching and retries for you; prefer it when the
project already has one.

## A test that checks what the user sees
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
test('shows an error with a retry when the search fails', async () => {
  globalThis.fetch = async () => new Response('', { status: 500 });
  render(<Search />);
  await userEvent.type(screen.getByRole('searchbox'), 'tea');
  expect(await screen.findByText(/could not load/i)).toBeTruthy();
  expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
});
```
Query by role and visible text, the way a user finds things. Avoid test ids unless nothing visible fits.

## Public variable prefixes
| Tool | Public prefix | Server-only |
|---|---|---|
| Vite (React, Vue, Svelte) | `VITE_` via `import.meta.env` | anything without the prefix (not exposed) |
| Next.js | `NEXT_PUBLIC_` | other `process.env` names, read in server code only |
| Create React App | `REACT_APP_` | none: everything it reads is public |
| SvelteKit | `PUBLIC_` (`$env/static/public`) | `$env/static/private` |
| Nuxt | `NUXT_PUBLIC_` (`runtimeConfig.public`) | `runtimeConfig` outside `public` |
| Expo | `EXPO_PUBLIC_` | none in the app: use a server |
| Vue CLI | `VUE_APP_` | none: everything it reads is public |
| Gatsby | `GATSBY_` | other names, build-time only |

## What the secrets scan looks for
`scripts/client-secrets.mjs` fails on:
- a public variable named like a secret (`SECRET`, `PRIVATE`, `PASSWORD`, `SERVICE_ROLE`, `DATABASE_URL` and similar)
  in a `.env` file or read by source code;
- a public variable, or a file in the build output, holding a known secret shape: payment secret keys, cloud access
  key ids, code-host and chat tokens, AI provider keys, mail service keys, private key blocks, database URLs with a
  password, and JWTs whose role is a service or admin role.

It warns (no fail) on public variables named like a key or token, because many of those are public on purpose. It
never prints a full value. It skips `node_modules` and `.git`, and files over 5 MB (`--max-mb` changes that).
It cannot know every key format: a clean scan is evidence, not a guarantee.
