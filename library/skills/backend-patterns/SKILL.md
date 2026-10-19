---
name: backend-patterns
description: Designs, builds or reviews server-side code in any language or framework (API endpoints, data access, business logic, errors, caching, background jobs, logging, access checks) using a small set of proven layering and data patterns, so the backend stays correct, fast and easy to change. Use when adding or changing an endpoint, a database query or schema, a cache, a queue or scheduled job, middleware, or error handling, and when a backend is slow, hard to test or keeps breaking in the same places.
triggers: backend, api endpoint, rest api, graphql, database query, server code, caching, background job, n+1
---
# Backend patterns: thin edges, clear layers, honest errors

**Pick the simplest pattern that fits the current size of the app.** Every layer, cache and queue costs something to
run and to understand. Add one when a real need shows up (a second caller, a measured slow path, a job that blocks a
request), not in advance.

These are principles for any stack. The examples name a few stacks only to show the shape; follow the patterns already
in the project first.

## 1. Before writing code
1. **Read the existing backend.** Find how routes, data access, errors and config are already done, and follow that.
   A second way of doing the same thing is a bug waiting to happen.
2. **Write down the contract** for what you add or change: input, output, error cases, who may call it, and what data
   it reads or writes. For a feature, this belongs in its spec (`feature.md` runbook).
3. **Check the baselines:** `docs/security.md`, `docs/foundation.md` (app security rows, performance budgets) and
   `docs/checks/app-standards.md` (data safety, security, performance). New code must stay inside them.
4. **Several steps or files?** Write a plan first (plan skill).

## 2. Layers
Keep three jobs apart, even when they live in one file in a small app:

| Layer | Does | Never does |
|---|---|---|
| Edge (route, handler, controller, CLI command) | parse and validate input, check who is calling, call one service function, map the result or error to a response | business rules, raw queries |
| Service (business logic) | rules, decisions, orchestration of several data calls, transactions | know about HTTP, request objects or response codes |
| Data access (repository, store) | queries, mapping rows to objects, one place per kind of data | business decisions, access checks that depend on the caller |

- Pass dependencies in (a store, a clock, a client) instead of importing globals, so services can be tested with fakes.
- The service talks to data access through a small interface (find one, find many with filters, create, update,
  delete, plus the specific lookups it needs). Swapping the database, adding a cache or using an in-memory fake in tests
  then touches one place.
- Cross-cutting concerns (authentication, request ids, logging, rate limits, size caps) go in middleware or one shared
  wrapper, applied to every route by default. A route that opts out says why.

## 3. API design
1. **Resources as nouns, actions as methods:** list, get, create, replace, update, delete on a collection and its items.
   Use a verb route only for real actions that are not a field change.
2. **Filtering, sorting and paging go in query parameters.** Every list endpoint has a maximum page size. Prefer cursor
   paging for large or changing data; offset paging skips and repeats rows when data moves.
3. **One response shape** for success and one for errors across the whole API. Status codes mean what they say: 400
   bad input, 401 not signed in, 403 not allowed, 404 not found (also for "exists but not yours"), 409 conflict, 429 too
   many requests, 500 our fault.
4. **Validate at the edge with a schema** (allowlist of fields, types, lengths, ranges). Reject unknown fields on
   writes. The service can then trust its input.
5. **Make writes safe to retry:** clients and proxies retry. Use idempotency keys or natural unique constraints for
   creates, and conditional updates (version or timestamp) where two writers can collide.
6. **Version or stay compatible.** Adding fields is fine; removing or renaming them breaks callers.
7. **GraphQL or RPC instead of REST:** the same layers apply behind the resolvers. Cap query depth and cost, batch
   per-field lookups per request (a loader) so nested fields do not turn into N+1, and check access in the resolver
   for every object returned, not only at the top query.

## 4. Data access
1. **Ask only for what you need:** named columns, a limit, an index behind every filter and sort used in a hot path.
2. **No query inside a loop (N+1).** Fetch the parents, collect the ids, fetch the children in one query, join in
   memory with a map. Or use the ORM's eager loading on purpose.
3. **Parameters, never string building**, for every query, including ORDER BY and LIMIT values (allowlist column names).
4. **Transactions around changes that must land together.** Keep them short, never wait on the network inside one, and
   let the database enforce what it can (unique, foreign keys, not null, checks). When the client library cannot hold a
   transaction open (some hosted or HTTP database APIs), put the multi-step write in one database function or stored
   procedure and call that; make it raise on failure rather than return a "failed" value the caller may ignore.
5. **Schema changes are migrations**: versioned, reviewed, reversible or with a restore path, and tested on a copy of
   real-shaped data (`data-change.md` runbook).
6. **Pool connections** and set timeouts on every query and outbound call.

## 5. Errors
1. **One error type for expected failures** (not found, invalid, conflict, forbidden) carrying a status and a safe
   message. Anything else is unexpected.
2. **One central handler** turns errors into responses: expected ones as they are, unexpected ones as a generic 500
   with a request id. The full error and stack go to the server log only.
3. **Never swallow an error.** Catch only to add context, retry, or translate. An empty catch block hides data loss.
4. **Retry only what is safe to repeat**, only transient failures (timeouts, 429, 503), with exponential backoff plus
   jitter and a cap. Never retry a non-idempotent write blindly.
5. **Fail closed on reads you depend on.** A store that cannot be read is an error, never "no data"
   (app-standards.md, data safety).

## 6. Caching
1. **Measure first.** Cache only a path that is slow or expensive by numbers (`perf.md` runbook).
2. **Cache-aside by default:** read the cache, on a miss read the source and store it with a time-to-live.
3. **Every cache has an invalidation plan:** what write clears which key, and the longest stale time that is
   acceptable. Keys include everything that changes the answer (user, tenant, locale, version).
4. **Never cache per-user data under a shared key**, and never cache error results as if they were data.
5. Use HTTP caching headers for public, read-only responses before building your own cache.
6. **Put the cache in one place:** a caching wrapper with the same interface as the data access it wraps, so callers
   do not know it is there and every write path through it can clear the right keys.

## 7. Background work
1. **Move slow or failure-prone work out of the request:** sending email, calling slow services, indexing, reports. The
   request records the job and returns.
2. **Use a durable queue** for anything that must not be lost. An in-memory list is gone on restart or deploy.
3. **Jobs are idempotent** (safe to run twice), have a timeout, a retry limit with backoff, and a place where failed jobs
   land for inspection.
4. **Scheduled jobs take a lock** or run in one place only, so two instances do not run them twice.

## 8. Shared state and scale
- **Anything that must be shared across processes lives in a shared store**: sessions, rate-limit counters, locks,
  caches that must agree. Per-process memory resets on deploy and splits across instances.
- Keep request handlers stateless so the app can run more than one copy.

## 9. Access control
1. **Authenticate once, in middleware.** Verify tokens or sessions with the library, never by hand: signature,
   expiry and audience, with the key read from config. A missing or invalid credential gets 401 and the handler never
   runs.
2. **Authorize every operation on the server**, per resource: "is this caller allowed to do this to this record?"
   Checking only "is signed in" lets any user read anyone's data.
3. **Roles map to permissions in one table** in code; routes ask for a permission, not a role name.
4. **Rate-limit per caller at the edge**, by account when signed in and by address when not, tighter on sign-in and
   costly endpoints. Keep the counters in a shared store, the gateway or the platform's limiter (section 8), and answer
   429 with a hint of when to retry.
5. For a full review of these and other risks, use the security-review skill (core, in every project).

## 10. Logging and observability
1. **Structured logs** (one JSON object or key=value line per event) with time, level, message, request id, method
   and path, and the ids needed to trace a problem. Errors add the error message and stack, server side only.
2. **A request id on every log line** of a request, returned to the client on errors.
3. **Never log secrets, tokens, passwords or full personal data.** Log ids, not contents.
4. A health endpoint that checks real dependencies, and the numbers that matter (latency, error rate, queue depth)
   where the project has metrics.

## Done when
- [ ] The change follows the project's existing patterns, or the answer explains why a new one was needed (judgment: the project's patterns need a reviewer).
- [ ] Input is validated at the edge, every operation checks authorization, and errors go through the central handler (judgment: needs a code review).
- [ ] No query in a loop, every list is paged with a maximum, and every query and outbound call has a timeout (judgment: needs a code review).
- [ ] Multi-step writes are in a transaction; retried writes are idempotent (judgment: needs a code review).
- [ ] Every cache has an invalidation rule; every background job is durable, idempotent and has a retry limit (judgment: needs a code review).
- [ ] Tests cover the service logic and at least one success and one failure per endpoint (hook: backend-tested), and pass
  (`docs/checks/qa-standards.md`).
- [ ] Still within the budgets in `docs/foundation.md`; performance claims come with before and after numbers (judgment: which budgets apply depends on the change).

## Pitfalls
- Business rules in route handlers. They get copied into the next route and drift apart.
- Adding a cache to hide a slow query instead of fixing the query or adding the index.
- In-memory counters, sessions or queues in a service that runs more than one process.
- Returning raw database or exception messages to clients.
- Retrying a payment, email or create call without an idempotency key, so it happens twice.
- Abstractions with one caller "for later". Inline them until a second caller exists.
- Debugging a broken backend by changing things until it works. Use the debug skill.
- A queue that is a list in memory. Jobs vanish on restart, and a failed job is logged and forgotten.
- A "transaction" made of separate calls from the app with no rollback, so a failure halfway leaves half the data.

Inspired by "backend-patterns" in affaan-m/ECC (MIT, see LICENSE and [SOURCE.md](SOURCE.md)).
