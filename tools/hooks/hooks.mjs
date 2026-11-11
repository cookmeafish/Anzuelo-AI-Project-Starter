// The hook entry every agent host runs (node tools/hooks/hooks.mjs <event>). It turns on Node's compile cache, then
// loads the engine body (hooks-main.mjs), so the body and its modules are compiled once and read from the cache after
// that. The cache lives in Node's default temp folder, never in the project. Older Node has no compile cache: the
// call is skipped and the body is compiled as before; a cache folder that is broken or unwritable does the same.
// Code that uses the engine's functions imports hooks-main.mjs. Lesson: each hook spent most of its time compiling
// about 7,000 lines before doing any work.
import module from 'node:module';
try { module.enableCompileCache?.(); } catch { }
await import('./hooks-main.mjs');
