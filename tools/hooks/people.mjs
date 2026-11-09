// The people (or units, clients, tenants) whose data the project keeps apart: one folder each under the scopes root
// (config "scopesRoot", profiles/ by default). Moved from hooks.mjs (plan: engine v2 only, step 1b), so the v2 end
// check and the guards share one reading. A base module like settings.mjs, outside v2/.
import fs from 'node:fs';
import { config, list, abs, read, esc, re } from './settings.mjs';

const aliasesOf = text => { const fm = /^﻿?---\r?\n([\s\S]*?)\r?\n---/.exec(text || '')?.[1] || ''; return (/^aliases:\s*(.*)$/m.exec(fm)?.[1] || '').replace(/^["']|["']$/g, '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean); };
// (io: how the caller lists and reads project files; v2's end check passes its own, which follows the project it runs in)
const IO = { list, read: f => read(abs(f)), path: f => abs(f) };
export function people(cfg = config(), io = IO) {
  return io.list(cfg.scopesRoot).filter(n => !/^[_.]/.test(n) && !/\.md$/i.test(n)).filter(n => { try { return fs.statSync(io.path(`${cfg.scopesRoot}/${n}`)).isDirectory(); } catch { return false; } })
    // (a folder name's hyphens and underscores read as spaces too: profiles/flat-1 is "flat 1". Lesson (trials): "flat 1"
    // named nobody, and the guard refused the work for that flat)
    .map(n => ({ name: n, words: [...new Set([n.toLowerCase(), n.toLowerCase().replace(/[-_]+/g, ' ')])].filter(Boolean).concat(aliasesOf(io.read(`${cfg.scopesRoot}/${n}/PROFILE.md`))) }));
}
export const personOf = (p, cfg = config()) => { const m = new RegExp(`^${esc(cfg.scopesRoot)}/([^/]+)/`, 'i').exec(p); return m && !/^[_.]/.test(m[1]) ? m[1] : null; };
export const peopleIn = (text, ppl) => ppl.filter(x => x.words.some(w => re(`(^|[^a-z0-9])${esc(w)}($|[^a-z0-9])`).test(String(text).toLowerCase()))).map(x => x.name);
// A follow-up that names nobody ("that letter sounds cold") is about whoever the latest request that named someone was
// about, at most FOLLOW_BACK requests back. Lessons: a complaint about one tenant's letter could not save the fix in
// that tenant's folder; a question in between broke the link.
const FOLLOW_BACK = 3;
export const peopleFor = (prompt, allPrompts, ppl) => {
  const named = peopleIn(prompt, ppl);
  if (named.length) return named;
  const earlier = (allPrompts || []).filter(p => p && p.trim() !== String(prompt).trim()).slice(-FOLLOW_BACK);
  for (let i = earlier.length - 1; i >= 0; i--) { const n = peopleIn(earlier[i], ppl); if (n.length) return n; }
  return [];
};
export const pathsPeople = (s, cfg) => [...new Set([...String(s).replace(/\\/g, '/').matchAll(new RegExp(`(?:^|[\\s"'/=])${esc(cfg.scopesRoot)}/([^/\\s"']+)/`, 'gi'))].map(m => m[1]).filter(n => !/^[_.]/.test(n)))];
