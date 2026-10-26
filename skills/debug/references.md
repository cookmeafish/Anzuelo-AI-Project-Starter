# Debug techniques

## Boundary logging
When a problem crosses several parts (a CI job → a build script → a packaging step, or a page → an API → a database),
don't guess which part fails. Add temporary logging at every hand-over point, run once, and read where the data goes
bad.
- At each boundary, log what comes in and what goes out.
- Log whether each setting, secret or environment variable the next part needs actually arrived. For secrets, log
  only `SET` or `UNSET`, never the value.
- Log the state each part depends on: the working folder, the config file it read, the account or keys it sees.

```sh
# one line per layer, same tag everywhere so it is easy to filter
echo "[dbg build] API_TOKEN: $([ -n "${API_TOKEN:-}" ] && echo SET || echo UNSET), cwd=$(pwd)"
```
```js
console.error('[dbg api]', { input: req.body, configFile: cfg.path, token: process.env.API_TOKEN ? 'SET' : 'UNSET' });
```
The first layer where the log turns wrong is the one to investigate. Remove the logging once the cause is fixed, or
keep the useful parts as permanent diagnostics.

## Root-cause tracing
Bugs often surface deep in a chain of calls: a file written to the wrong folder, a command run in the wrong
directory, a database opened at the wrong path. Fixing where it surfaced only treats the symptom.

Use it when the error happens far from where input enters, the stack trace is long, or it is unclear where a bad
value came from.
1. **The symptom:** the exact error and where it appeared.
2. **The direct cause:** the line that did the wrong thing.
3. **What called it, with which values?** Walk up the chain, one caller at a time.
4. **Keep going** until you reach the place where the bad value was first created. A common example: an empty string
   used as a working directory quietly becomes "the current folder".
5. **Fix there**, then add defense in depth below.
6. **Dead end:** if you truly can't trace further up (the value comes from outside your code), fix at the deepest
   point you can reach and add the layered checks, so the bad value is stopped and reported clearly.

A fix that often works at the source: make the value fail loudly when it is read too early or left empty. For
example, a test helper that hands out a temp folder throws if it is read before setup has created the folder,
instead of returning an empty string.

### Instrumenting when reading isn't enough
- **Log before the risky operation,** not after it fails. By then the context is gone.
- **Include the context:** the values passed, the current directory, relevant environment variables, a timestamp.
- **Capture the call chain:** `new Error().stack` in JavaScript, `traceback.print_stack()` in Python,
  `Thread.dumpStack()` in Java, `debug.PrintStack()` in Go.
- **Write to stderr.** Test runners and app loggers often hide normal output.
- **Tag the line** (for example `[dbg mkdir]`) and filter the run: `npm test 2>&1 | grep "dbg mkdir"`
  (`findstr` on Windows cmd, `Select-String` in PowerShell).
- **Read the traces for a pattern:** which test file shows up, which line starts the chain, and whether it is always
  the same test or the same argument.

### Finding which test leaves something behind
A stray file, folder or changed state appears after the test suite, and nobody knows which test makes it.
1. Make sure the leftover is gone before you start.
2. Run the test files one at a time, checking for the leftover after each one.
3. The first file after which it appears is the one to read.

`skills/debug/scripts/find-polluter.mjs` does this for any test runner:
```sh
node skills/debug/scripts/find-polluter.mjs --leftover .git --tests "packages/**/*.test.ts" --cmd "npx vitest run {file}"
```
It refuses to start while the leftover exists and never deletes anything. Use `--dry-run` first to see the file list.

**Nothing found, but the leftover still appears in a full run?** Then it takes two tests together: one sets up state,
a later one acts on it. Run growing groups in the suite's own order (the first half, then the first quarter, and so
on) until the smallest group that still creates it is left. Also check for files created by global setup or teardown,
which run outside any single test file.

## Defense in depth
One check at one place gets bypassed by another code path, a refactor or a test mock. Check at every layer the data
passes through, so the bug becomes impossible:
| Layer | Checks |
|---|---|
| Entry point | Reject clearly invalid input at the boundary (empty, missing, wrong type, a path that doesn't exist or isn't a folder) |
| Business logic | The value makes sense for this specific operation |
| Environment guard | Refuse dangerous actions in the wrong context (e.g. writing outside a temp folder during tests) |
| Logging | Record enough context (values, folder, call chain) to see it quickly if it happens again |

How to apply it:
1. Trace where the bad value starts and everywhere it is used.
2. List every point it passes through.
3. Add the check that fits each layer.
4. Test each layer on its own: get the bad value past the first layer (call the inner function directly, or through a
   mock) and confirm the next layer stops it.

Each layer tends to catch something the others miss: another code path skips the entry check, a mock skips the
business check, a different operating system needs the environment guard, and the log reveals misuse nobody planned
for.

For an environment guard that compares paths, resolve both to absolute, normalized paths first, and compare without
case on Windows and macOS. Otherwise `../tmp/x`, a trailing slash or a different drive-letter case slips through.
```js
const inside = (child, parent) => {
  const rel = path.relative(path.resolve(parent), path.resolve(child));
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
};
if (process.env.NODE_ENV === 'test' && !inside(dir, os.tmpdir())) throw new Error(`refusing to write outside the temp folder in tests: ${dir}`);
```

## Waiting on a condition, not a guess
Fixed delays (`sleep`, `setTimeout`, `time.sleep`) make tests flaky: they pass on a fast machine and fail under load,
on CI or when tests run in parallel. Wait for the thing you care about instead.

Signs you need it: a test with a fixed delay, a test that fails now and then, tests that time out only when run
together, or any wait for background work to finish.
```js
async function waitFor(check, what, timeoutMs = 5000, everyMs = 10) {
  const start = Date.now();
  let last;
  for (;;) {
    last = check();
    if (last) return last;
    if (Date.now() - start > timeoutMs) throw new Error(`Timed out after ${timeoutMs}ms waiting for ${what} (last: ${JSON.stringify(last)})`);
    await new Promise(r => setTimeout(r, everyMs));
  }
}
```
| Waiting for | Condition |
|---|---|
| an event | `() => events.find(e => e.type === 'DONE')` |
| a state | `() => job.state === 'ready'` |
| a count | `() => results.length >= 3 && results` |
| a file | `() => fs.existsSync(outFile)` |
| several things | `() => conn.open && queue.length === 0` |

- Read the state fresh inside the check on every loop. A copy taken before the loop never changes.
- Always have a timeout, and say in its message what was awaited and what was last seen ("waited for 3 results,
  got 1"). That message is half the diagnosis next time.
- Poll about every 10 ms. Polling every 1 ms burns CPU and can slow down the very work you are waiting for.
- Wrap repeated waits in small named helpers (wait for an event of a type, wait for N events, wait for an event
  matching a test), so every test uses the same well-tested loop.
- Other languages use the same shape. Many test tools already have one (`waitFor` in Testing Library, `expect.poll`
  in Playwright, `Awaitility` in Java).

**When a fixed delay is right:** only when timing itself is what's tested (a debounce, a throttle, a tick interval).
Even then, first wait for the starting condition, then wait a delay worked out from the known interval (two ticks of
100 ms = 200 ms, not "about half a second"), and write that reasoning in a comment.

## Testing the skill itself
To check that this skill holds up, give an agent a scenario with pressure toward a quick fix and see whether it still
investigates first. Useful kinds of pressure:
- **Urgency and cost:** an outage where every minute is expensive, and a quick fix that worked for a similar problem
  before.
- **Sunk cost and fatigue:** hours already spent on attempts that didn't work, and a fix that "seems to work" if you
  stop now.
- **Authority:** a more senior person names a fix and wants to move on, and asking for investigation feels awkward.

A pass is an answer that names the shortcut, says why it is risky, and proposes the smallest real investigation step.
Where the situation is truly urgent, a pass may first limit the damage (for example a rollback), but it never calls the
mitigation the fix and keeps the root-cause work on the list.
