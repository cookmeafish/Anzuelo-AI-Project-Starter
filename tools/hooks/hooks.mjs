// The hook entry every agent host runs (node tools/hooks/hooks.mjs <event>). It turns on Node's compile cache, then
// loads the engine body (hooks-main.mjs), so the body and its modules are compiled once and read from the cache after
// that. Older Node has no compile cache: the call is skipped and the body is compiled as before; a cache folder that is
// broken or unwritable does the same. Code that uses the engine's functions imports hooks-main.mjs. Lesson: each hook
// spent most of its time compiling about 7,000 lines before doing any work.
// (only for an installed engine, in its own folder the suites prune (pruneCompileCache): entries are per file path, so
// each test copy added a set. Lesson (2026-11-12): Node's default cache held about 2.65 million files, 22 GB)
import module from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.resolve(fileURLToPath(import.meta.url)).toLowerCase(), tmp = path.resolve(os.tmpdir()).toLowerCase();
// (a release's frozen copies keep it: few (the newest 3 stay) and the cache is capped, and its timed tests run there)
if (!process.env.ANZUELO_NO_COMPILE_CACHE && !here.startsWith(tmp + path.sep))
  try { module.enableCompileCache?.(path.join(os.tmpdir(), 'anzuelo-compile-cache')); } catch { }
await import('./hooks-main.mjs');
