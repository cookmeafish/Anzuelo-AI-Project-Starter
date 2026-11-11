// Menu codes are optional shortcuts: a code (and flags) stands for the full request written in docs/MENU.md. Shared by
// both engines: hooks.mjs wraps these, and v2's reminder names each code and asks about an unknown one. Moved whole from
// hooks.mjs (2026-11-10), unchanged.
import fs from 'node:fs';
import path from 'node:path';

export function menuOf(root) {
  const codes = {}, flags = {};
  let text = ''; try { text = fs.readFileSync(path.join(root, 'docs/MENU.md'), 'utf8'); } catch { }
  for (const line of text.split(/\r?\n/)) {
    const m = /^\|\s*`?([A-Z]\d{1,2})`?\s*\|\s*([^|]+?)\s*\|\s*`?([\w.-]+\.md)`?\s*\|\s*([^|]*?)\s*\|/.exec(line);
    if (m) codes[m[1]] = { what: m[2], playbook: m[3], means: m[4] };
    const f = /^\|\s*`?--([\w-]+)`?\s*\|\s*([^|]+?)\s*\|/.exec(line);
    if (f) flags[f[1]] = f[2];
  }
  return { codes, flags };
}
// english: a Spanish request's English wording for routing, or null (the caller's own router).
export function expandMenuOf(prompt, { root, english = null }) {
  const { codes, flags } = menuOf(root);
  const known = [], unknown = [], kflags = [], uflags = [];
  // several codes at once ("A2 B4", "A2, B4", "A2+B4", "A2 and B4") each expand; an unknown one is asked about when it
  // sits in the leading run of codes. Lesson: a project's menu took only the first of two codes.
  const leadRun = /^\s*([A-Z]\d{1,2}(?:\s*(?:[,;/+&]|\band\b|\s)\s*[A-Z]\d{1,2})*)(?=$|[\s,.;:])/.exec(prompt || '');
  const lead = new Set(leadRun ? leadRun[1].match(/[A-Z]\d{1,2}/g) : []);
  for (const m of String(prompt || '').matchAll(/(?:^|[\s,;/+&])([A-Z]\d{1,2})(?=$|[\s,.;:/+&])/g)) {
    if (codes[m[1]]) { if (!known.includes(m[1])) known.push(m[1]); } else if (lead.has(m[1]) && !unknown.includes(m[1])) unknown.push(m[1]);
  }
  if (known.length || lead.size) {
    for (const m of String(prompt || '').matchAll(/(?:^|\s)--([\w-]+)(?:[ =]([^\s-][^\s]*))?/g)) {
      if (flags[m[1]]) kflags.push([m[1], m[2] || '']); else uflags.push(m[1]);
    }
  }
  const es = english ? english(prompt) : null;
  const expanded = [prompt, ...known.map(c => codes[c].means), ...kflags.map(([f]) => flags[f]), ...(es ? [es] : [])].join('\n');
  return { known, unknown, kflags, uflags, expanded, codes, flags };
}
// The reminder's lines for the codes and flags: each known code in full, each known flag, and one question for the
// unknown ones (the old engine's hint words, so a project's own hooks and habits read the same).
export function menuLines(m) {
  return [...m.known.map(c => `MENU CODE ${c} = "${m.codes[c].means}". Runbook: docs/playbooks/${m.codes[c].playbook}. Treat it exactly as if the user typed that in full; the rest of the message adds details.`),
    ...m.kflags.map(([f, v]) => `MENU FLAG --${f}${v ? ' ' + v : ''} = ${m.flags[f]}`),
    ...(m.unknown.length ? [`UNKNOWN MENU CODE ${m.unknown.join(', ')}: not in docs/MENU.md. Ask which one was meant; don't guess.`] : []),
    ...(m.uflags.length ? [`UNKNOWN FLAG ${m.uflags.map(f => '--' + f).join(', ')}: not in docs/MENU.md. Ask; don't guess.`] : [])];
}
