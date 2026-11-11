// Every child process the engine starts is hidden on Windows: this module makes windowsHide: true the default for each
// child_process function (spawn, spawnSync, exec, execSync, execFile, execFileSync, fork) and syncs the module's named
// exports, so every module that imports them gets it. A call that sets windowsHide itself keeps its own value. Each
// engine file that starts processes imports this first; importing it twice changes nothing. Lesson (the user, through
// oversight, 2026-11-11): console windows flashed up while the hooks and tests ran.
import cp from 'node:child_process';
import module from 'node:module';

const HIDDEN = Symbol.for('anzuelo.windowsHide');
// (the options object: the first plain object after the command; with none, one is put where the function reads it:
// after the arguments list (spawn, execFile, fork), or right after the command (exec, execSync))
export function withHidden(args, kind) {
  const a = [...args];
  const i = a.findIndex((x, k) => k > 0 && x && typeof x === 'object' && !Array.isArray(x));
  if (i >= 0) { if (!('windowsHide' in a[i])) a[i] = { ...a[i], windowsHide: true }; return a; }
  const pos = kind === 'exec' ? 1 : Array.isArray(a[1]) ? 2 : 1;
  while (a.length < pos) a.push(undefined);
  if (a.length > pos && a[pos] === undefined) a[pos] = { windowsHide: true };
  else a.splice(pos, 0, { windowsHide: true });
  return a;
}
if (!cp[HIDDEN]) {
  for (const [name, kind] of [['spawn', 'file'], ['spawnSync', 'file'], ['execFile', 'file'], ['execFileSync', 'file'], ['fork', 'file'], ['exec', 'exec'], ['execSync', 'exec']]) {
    const orig = cp[name];
    if (typeof orig !== 'function') continue;
    const hidden = function (...args) { return orig.apply(this, withHidden(args, kind)); };
    // (keeps what callers read off the function, such as util.promisify's custom form of exec and execFile)
    for (const k of Reflect.ownKeys(orig)) if (!['length', 'name', 'prototype'].includes(k)) try { Object.defineProperty(hidden, k, Object.getOwnPropertyDescriptor(orig, k)); } catch { }
    cp[name] = hidden;
  }
  cp[HIDDEN] = true;
  try { module.syncBuiltinESMExports(); } catch { }
}
