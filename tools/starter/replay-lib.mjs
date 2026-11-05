// Shared by the v2 replay tools (v2-replay.mjs, v2-recall.mjs). Read-only.

// The turn as it stood at the agent's first attempt to finish: up to the first Stop hook run. Later rows hold the fixes
// the old engine's block forced, so judging the whole turn would see a turn already repaired.
export const firstTry = slice => { const k = slice.findIndex(r => /^Stop$/.test(r.attachment?.hookEvent || '')); return k < 0 ? slice : slice.slice(0, k); };

// A live turn sees files changed by shell commands through their modification time. A replay can't (the times are
// today's), so a shell command that writes a code file stands in for an Edit of it: sed -i, a script that opens a file
// for writing, or output redirected into one. An estimate, for replay only.
const EXT = '(?:js|mjs|cjs|ts|tsx|jsx|py|go|rs|java|cs|rb|php|html|vue|svelte)';
// (only the file being written: the last argument of sed -i, a redirect target, or the path a script writes to. A
// script that is only run, "python build.py > out.txt", is not changed by it)
const TARGETS = [
  new RegExp(`\\bsed -i\\b[^\\n|&;]*?\\s([\\w./-]+\\.${EXT})\\s*(?:$|[|&;\\n])`, 'gm'),
  new RegExp(`>>?\\s*([\\w./-]+\\.${EXT})\\b`, 'g'),
  new RegExp(`\\b(?:p|path|f|fn)\\s*=\\s*(?:Path\\()?['"]([\\w./-]+\\.${EXT})['"][\\s\\S]*?(?:write_text|\\.write\\(|open\\([^)]*['"]w)`, 'g'),
];
export function withShellEdits(acts) {
  const calls = [];
  for (const c of acts.calls) {
    calls.push(c);
    const cmd = String(c.input.command || '');
    if (!/^(Bash|PowerShell)$/.test(c.name) || c.error) continue;
    const dir = /\bcd\s+"?([^"&;]+)"?/.exec(cmd)?.[1]?.trim() || '';
    const files = new Set(TARGETS.flatMap(rx => [...cmd.matchAll(rx)].map(m => m[1])));
    for (const f of files) if (!/^(tools\/hooks|\.cache)\//.test(f))
      calls.push({ name: 'Edit', input: { file_path: dir && !/^[/\\]|^\w:/.test(f) ? `${dir.replace(/^\/(\w)\//, '$1:/')}/${f}` : f }, error: false, out: '', done: c.done, shell: true });
  }
  return { ...acts, calls };
}
