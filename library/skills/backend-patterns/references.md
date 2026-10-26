# Backend patterns: short examples

Sketches only, to show the shape in a few stacks. Use the project's own libraries and conventions.

## Layers: edge, service, data access
```text
route POST /orders
  input  = schema.parse(request.body)          # 400 on failure
  caller = auth.current(request)               # 401 if none
  order  = orders_service.place(caller, input) # rules live here
  return 201, order

orders_service.place(caller, input)
  require caller.can("order:create")           # 403
  in transaction:
    stock.reserve(input.items)                 # data access only
    order = orders_repo.insert(caller.id, input)
  queue.enqueue("send_receipt", order.id)      # slow work leaves the request
  return order
```

## Data access behind an interface, cache as a wrapper
```text
interface OrdersStore
  get(id) -> Order or none
  list(filters, cursor, limit) -> page of Order
  insert(fields) -> Order
  update(id, fields, expected_version) -> Order   # conflict if the version moved

SqlOrdersStore implements OrdersStore           # real database
MemoryOrdersStore implements OrdersStore        # tests
CachedOrdersStore(inner, cache) implements OrdersStore
  get(id):    cache-aside around inner.get (see below)
  update(...): result = inner.update(...); cache.delete(key(id)); return result
```
The service receives an `OrdersStore` and never knows which one it got.

## Access check as a wrapper
```text
require(permission)(handler):
  return (request) ->
    caller = auth.verify(request)          # 401 when missing or invalid; handler never runs
    if not caller.has(permission): 403
    return handler(request, caller)

permissions = { admin: [read, write, delete, manage], editor: [read, write], viewer: [read] }

route DELETE /items/:id = require("item:delete")(delete_item)
```
The record-level check ("is this item theirs?") still happens inside the service.

## Rate limit per caller
```text
key   = "rl:" + route_group + ":" + (caller.id or client_address)
count = shared_store.increment(key, expires_in = window)
if count > limit: respond 429, header Retry-After: seconds left in the window
```
A per-process counter resets on deploy and is multiplied by the number of instances.

## No query in a loop
TypeScript:
```ts
const posts = await db.posts.list({ limit: 50 });
const authors = await db.users.byIds([...new Set(posts.map(p => p.authorId))]);
const byId = new Map(authors.map(a => [a.id, a]));
for (const p of posts) p.author = byId.get(p.authorId);
```
Python:
```python
posts = repo.posts.list(limit=50)
authors = {a.id: a for a in repo.users.by_ids({p.author_id for p in posts})}
for p in posts:
    p.author = authors.get(p.author_id)
```
Go:
```go
posts, _ := repo.ListPosts(ctx, 50)
ids := uniqueAuthorIDs(posts)
authors, _ := repo.UsersByIDs(ctx, ids) // map[id]User
for i := range posts { posts[i].Author = authors[posts[i].AuthorID] }
```

## Central error handling
```text
class AppError(status, safe_message, code)

handler(error, request):
  if error is AppError:        respond error.status, {error: error.code, message: error.safe_message}
  if error is ValidationError: respond 400, {error: "invalid_input", fields: error.fields}
  log.error("unexpected", request_id, error, stack)
  respond 500, {error: "internal", request_id}
```

## Retry with backoff and jitter
```text
for attempt in 1..max_attempts:
  try: return call()
  except error if is_transient(error) and attempt < max_attempts:
    sleep(min(cap, base * 2^(attempt-1)) * random(0.5, 1.0))
raise last error
```
Transient: timeouts, connection resets, 429, 502, 503, 504. Not transient: 400, 401, 403, 404, 409, validation errors.

## Cache-aside with invalidation
```text
get(id):
  key = "item:v2:" + tenant + ":" + id
  if cached = cache.get(key): return cached
  item = repo.get(id) or raise NotFound      # do not cache the miss as data
  cache.set(key, item, ttl = 5 minutes)
  return item

update(id, changes):
  repo.update(id, changes)
  cache.delete("item:v2:" + tenant + ":" + id)
```

## Idempotent create
```text
POST /payments  with header Idempotency-Key: <client-generated id>
  if saved = idempotency_store.get(caller, key): return saved.response
  response = payments_service.charge(...)
  idempotency_store.put(caller, key, response, ttl = 24 hours)
  return response
```

## Structured log line
```json
{"time":"2026-01-01T12:00:00Z","level":"error","msg":"charge failed","request_id":"r-81f2","user_id":"u-123","provider_status":503,"attempt":3}
```
