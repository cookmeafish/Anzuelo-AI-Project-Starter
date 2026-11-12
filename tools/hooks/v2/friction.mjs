// REQ: friction-reported. A check the user keeps complaining about is reported, never switched off silently. The agent's
// own Issue lines (learn-from-upset) name the check; when the same check is named in 3 of the last 6 turns, the end check
// asks once to log it in docs/starter-feedback.md, so the starter fixes it for every project, and the reminder tells the
// agent to offer the user to turn it off (only the user turns a check off: rule 18, 2026-11-07). Oversight 2026-11-10:
// the old engine's automatic suspension is retired; its report and its offer are kept.
import fs from 'node:fs';
import path from 'node:path';
import { at, ROOT } from './lib.mjs';

const WINDOW = 6, TIMES = 3;
// (the project's state folder as v2 maps it: tools/hooks/state, or .anzuelo/local/... with the engine outside the project.
// Lesson (a release run): a direct path wrote hook state into a project whose engine sits in .anzuelo/engine)
const file = root => root === ROOT ? at('tools/hooks/state/v2-friction.json') : path.join(root, 'tools/hooks/state/v2-friction.json');
const load = root => { try { return JSON.parse(fs.readFileSync(file(root), 'utf8')); } catch { return { turns: [], asked: [], offered: [] }; } };
const save = (root, s) => { if (process.env.STARTER_BENCH || process.env.KS_BENCH || process.env.V2_NO_STATE) return; /* (a timing or hand run keeps no state) */ try { fs.mkdirSync(path.dirname(file(root)), { recursive: true }); fs.writeFileSync(file(root), JSON.stringify(s)); } catch { } };
// (a check is named by its tag, or by its tag's words: "plain-writing" or "plain writing")
const named = (text, tags) => tags.filter(t => new RegExp(`(?<![\\w-])${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/-/g, '[- ]')}(?![\\w-])`, 'i').test(text));
const issues = text => [...String(text || '').matchAll(/^[\s>*_-]*Issue:\s*(.+)$/gim)].map(m => m[1]).filter(l => !/^none\b/i.test(l.trim())).join('\n');
// The checks named in at least 3 of the last 6 turns.
const sore = s => { const n = {}; for (const t of s.turns.slice(-WINDOW)) for (const g of t.tags) n[g] = (n[g] || 0) + 1; return Object.keys(n).filter(g => n[g] >= TIMES); };

// End check: record this turn's named checks (once per turn), then ask once per check to log it for the starter.
export function frictionGaps(root, turnAt, text, tags) {
  if (!turnAt) return [];
  const s = load(root), here = named(issues(text), tags);
  const at = s.turns.findIndex(t => t.at === turnAt);
  if (at >= 0) s.turns[at].tags = [...new Set([...s.turns[at].tags, ...here])]; else s.turns.push({ at: turnAt, tags: here });
  s.turns = s.turns.slice(-WINDOW);
  let feedback = ''; try { feedback = fs.readFileSync(root === ROOT ? at('docs/starter-feedback.md') : path.join(root, 'docs/starter-feedback.md'), 'utf8'); } catch { }
  const due = sore(s).filter(g => !s.asked.includes(g) && !named(feedback, [g]).length);
  s.asked = [...new Set([...s.asked, ...due])];
  save(root, s);
  return due.map(g => `The user's complaints named the ${g} check in ${TIMES} of the last ${WINDOW} turns. Log it once in docs/starter-feedback.md (what it held, and why that did not fit this project) so the starter can fix it for every project. Only the user turns a check off here: offer it, don't do it.`);
}

// Reminder: once per check, the offer to make to the user.
export function frictionHint(root) {
  const s = load(root), due = sore(s).filter(g => !(s.offered || []).includes(g));
  if (!due.length) return '';
  s.offered = [...new Set([...(s.offered || []), ...due])];
  save(root, s);
  return `Friction: the user's complaints named the ${due.join(', ')} check${due.length > 1 ? 's' : ''} in ${TIMES} of the last ${WINDOW} turns. Ask the user once whether to turn ${due.length > 1 ? 'them' : 'it'} off ("enabled": false on its entry in tools/hooks/requirements.json); only they decide.`;
}
