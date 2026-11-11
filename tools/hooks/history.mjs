// REQ: recall-hint. The project never forgets how it solved a problem: every finished work turn leaves one line in
// tools/hooks/state/history.jsonl (the request, what was followed, what changed, the answer's opening), and a new
// request much like an earlier one starts from how that one was done; node tools/recall.mjs searches it all. Shared by
// both engines. Moved whole from hooks.mjs (2026-11-10), unchanged; v2 writes the same lines on a passing work turn.
import fs from 'node:fs';
import path from 'node:path';
import { keyWords, stem, GENERIC } from './near.mjs';

export const HISTORY_MAX = 2000;
const readText = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };
// One line per finished work turn; a turn already written (same key) is not written twice.
export function appendHistory(file, entry) {
  const lines = readText(file).split('\n').filter(Boolean);
  if (lines.length && lines[lines.length - 1].includes(JSON.stringify(entry.key).slice(1, -1))) return;
  lines.push(JSON.stringify(entry));
  try { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, lines.slice(-HISTORY_MAX).join('\n') + '\n'); } catch { }
}
// The past turns most like this text: shared key words, weighted toward the request itself.
export function recallMatchesIn(file, text, limit = 3) {
  const want = new Set(keyWords(text).filter(w => w.length > 2));
  if (want.size < 2) return [];
  return readText(file).split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean)
    .map(h => { const p = new Set(keyWords(h.prompt)), rest = new Set(keyWords(`${h.answer} ${(h.used || []).join(' ')} ${(h.changed || []).join(' ')}`)); let score = 0; for (const w of want) score += p.has(w) ? 2 : rest.has(w) ? 1 : 0; return { h, score, share: [...want].filter(w => p.has(w)).length / want.size }; })
    .filter(r => r.score >= 4).sort((a, b) => b.score - a.score || (b.h.at > a.h.at ? 1 : -1)).slice(0, limit)
    .map(r => ({ ...r, close: recallClose(want, r.h) }));
}
// The RECALL hint needs a close match: at least two words that name the subject (not common words, not a verdict like
// "good" or "bad", not Spanish small words) shared with the earlier request, covering half of the new one's.
// Lesson: "is it doing a good job?" recalled an unrelated edit whose request said "good and bad".
// (time and effort words too. Lesson, field report: "what took so long" recalled an unrelated git-clone request)
const RECALL_WEAK = new Set(['good', 'bad', 'job', 'great', 'nice', 'better', 'worse', 'best', 'worst', 'well', 'right', 'wrong', 'okay', 'fine',
  'took', 'take', 'takes', 'taking', 'long', 'longer', 'time', 'slow', 'fast', 'quick', 'much', 'many', 'tokens', 'cost', 'done', 'finished', 'still',
  'terrible', 'awful', 'poor', 'bien', 'mal', 'bueno', 'buena', 'malo', 'mala', 'trabajo', 'las', 'los', 'del', 'que', 'una', 'uno', 'unos', 'unas',
  'para', 'por', 'con', 'est', 'esta', 'este', 'esto', 'eso', 'esa', 'ese', 'como', 'muy', 'pero', 'les', 'sus', 'mis', 'tus', 'hac', 'haciendo', 'hecho'].map(stem));
export function recallClose(want, h) {
  const content = [...want].filter(w => !GENERIC.has(w) && !RECALL_WEAK.has(w));
  const p = new Set(keyWords(h.prompt));
  const shared = content.filter(w => p.has(w));
  return shared.length >= 2 && shared.length / content.length >= 0.5;
}
// The reminder's line for the closest earlier request, or ''.
export function recallLine(file, text) {
  const best = recallMatchesIn(file, text, 3).find(r => r.share >= 0.5 && r.close);
  return best ? `RECALL: on ${best.h.at} a similar request ("${best.h.prompt.slice(0, 90)}") was done${best.h.used.length ? ` with ${best.h.used.join(', ')}` : ''}${best.h.changed.length ? `, changing ${best.h.changed.slice(0, 4).join(', ')}` : ''}. Start from that; more: node tools/recall.mjs "<key words>".` : '';
}
