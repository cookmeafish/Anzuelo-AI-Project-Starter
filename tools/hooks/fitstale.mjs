// REQ: fit-checklist (after setup), v2: files added this turn (not docs) that make a decided row stale (fitProblems, from
// hooks-main). Lesson: a new CSV left a "no data files" skip standing until the audit failed.
import fs from 'node:fs';
import path from 'node:path';
export const FIT_FILE = 'docs/fit-checklist.md';
export function fitStaleGaps({ root, changed, since, fitProblems }) {
  const on = f => fs.existsSync(path.join(root, f));
  if (!fitProblems || !on(FIT_FILE) || on('SETUP-PROMPT.md') || on('.starter-template')) return [];
  const born = f => { try { return fs.statSync(path.join(root, f)).birthtimeMs; } catch { return 0; } };
  if (!changed.some(f => !/^docs\/|\.md$/i.test(f) && on(f) && born(f) >= since)) return [];
  const stale = (() => { try { return fitProblems(); } catch { return []; } })().filter(m => /: the project has .*say why it still doesn't help|its condition is met now/.test(m));
  return stale.length ? [`Files added this turn change what ${FIT_FILE} was decided on: ${stale.slice(0, 3).join('; ')}. Update those rows (decision and reason) until node tools/fit.mjs check passes.`] : [];
}
