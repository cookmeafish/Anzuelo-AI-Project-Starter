#!/usr/bin/env node
// Starter-only. The verdict of a trial round (tools/starter/IMPROVEMENT-LOOP.md): its judged findings, setup minutes,
// Stop blocks and failed turns against each project's baseline (its first recorded round) and against the previous
// round, over the same projects. "NOT WORSE" only when neither comparison is worse by these rules:
//   more high findings; more than MEDIUM_NOISE more medium findings (judges differ by about 3 between rounds);
//   median setup minutes more than SLOWER x the other; more failed turns (errors, timeouts); a share of turns the Stop
//   hook blocked more than BLOCKED_NOISE higher (counted from the trial records, not the judges: early rounds' judges
//   did not count Stop rounds, which once made a baseline look block-free).
// Efficiency counts too (the user pays for every step): cost per work turn or the median setup cost more than COSTLIER
// x the other (cost swings about 30% between rounds from the agent alone), more than DENIAL_NOISE more denied tool calls
// per turn (each one a full extra round), or more than HOOK_TEXT x the hook text per turn (records from rounds that
// measured it).
//   node tools/starter/trials/compare.mjs <round> [--record] [--results <dir>] [--judge <dir>] [--engine <commit>]
// --record keeps the round in tools/starter/trials/rounds.json (committed: the history every later round compares to).
// Exit 0: NOT WORSE; 1: WORSE; 2: the round's records or judges are missing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const HISTORY = process.env.ANZUELO_ROUNDS_FILE || path.join(HERE, 'rounds.json');
export const MEDIUM_NOISE = 3, SLOWER = 1.25, BLOCKED_NOISE = 0.15, COSTLIER = 1.3, DENIAL_NOISE = 0.25, HOOK_TEXT = 1.2;

// One project's numbers from its trial record and its judged findings.
export function projectStats(record, judged) {
  const turns = record?.turns || [];
  // (efficiency findings are counted on their own: rounds judged before the judges looked for them still compare)
  const all = judged?.findings || [], f = all.filter(x => x.area !== 'efficiency'), eff = all.filter(x => x.area === 'efficiency');
  const n = s => f.filter(x => x.severity === s).length;
  const caused = s => f.filter(x => x.severity === s && !/^\s*(none|n\/a)?\s*$/i.test(String(x.starter ?? 'none'))).length;
  const stops = (judged?.stopRounds || []).reduce((a, b) => a + (Number(b) || 0), 0);
  const work = turns.slice(1), measured = turns.length > 0 && turns.every(t => t.overhead);
  const over = k => measured ? turns.reduce((a, t) => a + (t.overhead[k] || 0), 0) : null;
  return {
    setupCost: turns[0]?.cost ?? null, workCost: work.reduce((a, t) => a + (t.cost || 0), 0), workTurns: work.length, workMin: work.reduce((a, t) => a + (t.min || 0), 0),
    hookChars: over('hookChars'), denials: over('denials'), stopBlocks: over('stopBlocks'),
    effHigh: eff.filter(x => x.severity === 'high').length, effMedium: eff.filter(x => x.severity === 'medium').length,
    high: n('high'), medium: n('medium'), low: n('low'), starterHigh: caused('high'), starterMedium: caused('medium'),
    turns: turns.length, stops, blocked: turns.filter(t => (t.blockTags || []).length).length, setupMin: turns[0]?.min ?? null, errors: turns.filter(t => t.error).length,
  };
}
const median = xs => { const a = xs.filter(x => typeof x === 'number').sort((p, q) => p - q); return a.length ? (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : null; };
export function totals(projects, ids) {
  const ps = ids.map(id => projects[id]).filter(Boolean);
  const sum = k => ps.reduce((a, p) => a + (p[k] || 0), 0);
  const turns = sum('turns'), work = sum('workTurns'), m = ps.filter(p => p.hookChars != null), mTurns = m.reduce((a, p) => a + p.turns, 0);
  const r2 = x => Math.round(x * 100) / 100;
  return { costPerWorkTurn: work ? r2(sum('workCost') / work) : null, setupCostMedian: (x => x == null ? null : r2(x))(median(ps.map(p => p.setupCost))), minPerWorkTurn: work ? r2(sum('workMin') / work) : null,
    denialsPerTurn: mTurns ? r2(m.reduce((a, p) => a + p.denials, 0) / mTurns) : null, hookCharsPerTurn: mTurns ? Math.round(m.reduce((a, p) => a + p.hookChars, 0) / mTurns) : null,
    effHigh: sum('effHigh'), effMedium: sum('effMedium'),
    projects: ps.length, high: sum('high'), medium: sum('medium'), low: sum('low'), starterHigh: sum('starterHigh'), starterMedium: sum('starterMedium'),
    errors: sum('errors'), blockedShare: turns ? Math.round(sum('blocked') / turns * 100) / 100 : 0, setupMedian: median(ps.map(p => p.setupMin)) };
}
// What makes "now" worse than "then" (both totals over the same projects)
export function worseThan(now, then, label) {
  const out = [];
  if (now.high > then.high) out.push(`${now.high} high findings, ${label} had ${then.high}`);
  if (now.medium > then.medium + MEDIUM_NOISE) out.push(`${now.medium} medium findings, ${label} had ${then.medium} (noise allows +${MEDIUM_NOISE})`);
  if (now.setupMedian != null && then.setupMedian != null && now.setupMedian > then.setupMedian * SLOWER) out.push(`setup median ${now.setupMedian} min, ${label} ${then.setupMedian} min (over x${SLOWER})`);
  if (now.errors > then.errors) out.push(`${now.errors} failed or timed-out turns, ${label} had ${then.errors}`);
  if (now.blockedShare > then.blockedShare + BLOCKED_NOISE) out.push(`${Math.round(now.blockedShare * 100)}% of turns blocked at Stop, ${label} ${Math.round(then.blockedShare * 100)}% (noise allows +${BLOCKED_NOISE * 100} points)`);
  const both = k => now[k] != null && then[k] != null;
  if (both('costPerWorkTurn') && now.costPerWorkTurn > then.costPerWorkTurn * COSTLIER) out.push(`cost per work turn $${now.costPerWorkTurn}, ${label} $${then.costPerWorkTurn} (over x${COSTLIER})`);
  if (both('setupCostMedian') && now.setupCostMedian > then.setupCostMedian * COSTLIER) out.push(`median setup cost $${now.setupCostMedian}, ${label} $${then.setupCostMedian} (over x${COSTLIER})`);
  if (both('denialsPerTurn') && now.denialsPerTurn > then.denialsPerTurn + DENIAL_NOISE) out.push(`${now.denialsPerTurn} denied tool calls per turn, ${label} ${then.denialsPerTurn} (noise allows +${DENIAL_NOISE})`);
  if (both('hookCharsPerTurn') && now.hookCharsPerTurn > then.hookCharsPerTurn * HOOK_TEXT) out.push(`${now.hookCharsPerTurn} characters of hook text per turn, ${label} ${then.hookCharsPerTurn} (over x${HOOK_TEXT})`);
  return out;
}
export function betterThan(now, then) {
  const out = [];
  if (now.high < then.high) out.push(`high ${then.high} -> ${now.high}`);
  if (now.medium < then.medium - MEDIUM_NOISE) out.push(`medium ${then.medium} -> ${now.medium}`);
  if (now.setupMedian != null && then.setupMedian != null && now.setupMedian * SLOWER < then.setupMedian) out.push(`setup median ${then.setupMedian} -> ${now.setupMedian} min`);
  if (now.errors < then.errors) out.push(`failed turns ${then.errors} -> ${now.errors}`);
  if (now.blockedShare + BLOCKED_NOISE < then.blockedShare) out.push(`turns blocked at Stop ${Math.round(then.blockedShare * 100)}% -> ${Math.round(now.blockedShare * 100)}%`);
  const both = k => now[k] != null && then[k] != null;
  if (both('costPerWorkTurn') && now.costPerWorkTurn * COSTLIER < then.costPerWorkTurn) out.push(`cost per work turn $${then.costPerWorkTurn} -> $${now.costPerWorkTurn}`);
  if (both('setupCostMedian') && now.setupCostMedian * COSTLIER < then.setupCostMedian) out.push(`median setup cost $${then.setupCostMedian} -> $${now.setupCostMedian}`);
  if (both('denialsPerTurn') && now.denialsPerTurn + DENIAL_NOISE < then.denialsPerTurn) out.push(`denied tool calls per turn ${then.denialsPerTurn} -> ${now.denialsPerTurn}`);
  if (both('hookCharsPerTurn') && now.hookCharsPerTurn * HOOK_TEXT < then.hookCharsPerTurn) out.push(`hook text per turn ${then.hookCharsPerTurn} -> ${now.hookCharsPerTurn} characters`);
  return out;
}
// The verdict of a round against the history: each project's baseline is its first recorded round.
export function verdict(round, history) {
  const ids = Object.keys(round.projects);
  const earlier = (history.rounds || []).filter(r => r.round !== round.round);
  const base = {}, baseFrom = {};
  for (const id of ids) { const r = earlier.find(x => x.projects?.[id]); if (r) { base[id] = r.projects[id]; baseFrom[id] = r.round; } }
  const prev = [...earlier].reverse().find(r => ids.some(id => r.projects?.[id]));
  const withBase = ids.filter(id => base[id]), withPrev = prev ? ids.filter(id => prev.projects[id]) : [];
  const now = totals(round.projects, ids);
  const b = withBase.length ? { now: totals(round.projects, withBase), then: totals(base, withBase) } : null;
  const p = withPrev.length ? { now: totals(round.projects, withPrev), then: totals(prev.projects, withPrev) } : null;
  const worse = [...(b ? worseThan(b.now, b.then, 'the baseline') : []), ...(p ? worseThan(p.now, p.then, prev.round) : [])];
  const better = [...(b ? betterThan(b.now, b.then).map(s => `vs baseline: ${s}`) : []), ...(p ? betterThan(p.now, p.then).map(s => `vs ${prev.round}: ${s}`) : [])];
  return { now, base: b, prev: p && { round: prev.round, ...p }, baseFrom, worse, better, ok: !worse.length, first: !b && !p };
}

const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  const name = process.argv[2];
  const opt = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  if (!/^[\w.-]+$/.test(name || '')) { console.error('usage: compare.mjs <round> [--record] [--results <dir>] [--judge <dir>] [--engine <commit>]'); process.exit(2); }
  const resDir = opt('--results') || path.join(TRIALS, `results-${name}`), judgeDir = opt('--judge') || path.join(TRIALS, 'judge');
  const info = readJSON(path.join(TRIALS, `round-${name}.json`)) || {};
  const judged = {};
  let judgeFiles = []; try { judgeFiles = fs.readdirSync(judgeDir).filter(f => f.startsWith(`${name}-`) && f.endsWith('.json')); } catch { }
  for (const f of judgeFiles) for (const p of [].concat(readJSON(path.join(judgeDir, f)) || [])) if (p?.project) judged[p.project] = p;
  let recs = []; try { recs = fs.readdirSync(resDir).filter(f => f.endsWith('.json')); } catch { }
  const projects = {}, unjudged = [];
  for (const f of recs) { const r = readJSON(path.join(resDir, f)); if (!r?.id) continue; if (!judged[r.id]) { unjudged.push(r.id); continue; } projects[r.id] = projectStats(r, judged[r.id]); }
  if (!Object.keys(projects).length) { console.log(`compare: no judged trial records for round ${name} (records in ${resDir}: ${recs.length}; judge files: ${judgeFiles.length}). Run the round and its judges first.`); process.exit(2); }
  const history = readJSON(HISTORY) || { rounds: [] };
  const round = { round: name, engine: opt('--engine') || info.engine || '', date: (info.started || new Date().toISOString()).slice(0, 10), projects };
  const v = verdict(round, history);
  const row = (label, t) => `${label.padEnd(22)} ${String(t.high).padStart(4)} ${String(t.medium).padStart(4)} ${String(t.low).padStart(4)} ${`${t.starterHigh}/${t.starterMedium}`.padStart(9)} ${`${Math.round(t.blockedShare * 100)}%`.padStart(10)} ${String(t.setupMedian ?? '-').padStart(9)} ${String(t.errors).padStart(7)}`;
  console.log(`round ${name}${round.engine ? ` (engine ${round.engine})` : ''}: ${Object.keys(projects).length} judged projects${unjudged.length ? `; not judged: ${unjudged.join(', ')}` : ''}`);
  console.log(`${''.padEnd(22)} high  med  low  starter h/m     blocked  setup min  failed`);
  console.log(row('this round', v.now));
  if (v.base) { console.log(row('  same projects', v.base.now)); console.log(row(`  baseline (${[...new Set(Object.values(v.baseFrom))].join(', ')})`, v.base.then)); }
  if (v.prev) { console.log(row('  same projects', v.prev.now)); console.log(row(`  previous (${v.prev.round})`, v.prev.then)); }
  for (const [id, s] of Object.entries(projects)) console.log(`  ${id.padEnd(18)} high ${s.high} med ${s.medium} low ${s.low} | blocked ${s.blocked}/${s.turns} turns | setup ${s.setupMin ?? '-'} min${s.errors ? ` | ${s.errors} failed` : ''}`);
  const eff = t => `$${t.costPerWorkTurn ?? '-'} per work turn, ${t.minPerWorkTurn ?? '-'} min per work turn, setup $${t.setupCostMedian ?? '-'}, denials ${t.denialsPerTurn ?? '-'}/turn, hook text ${t.hookCharsPerTurn ?? '-'} chars/turn`;
  console.log(`efficiency, this round: ${eff(v.now)}${v.now.effHigh + v.now.effMedium ? `; the judges found ${v.now.effHigh} high and ${v.now.effMedium} medium waste findings (area "efficiency")` : ''}`);
  if (v.base) console.log(`  baseline, same projects: ${eff(v.base.then)}`);
  if (v.prev) console.log(`  ${v.prev.round}, same projects: ${eff(v.prev.then)}`);
  if (v.better.length) console.log(`better: ${v.better.join('; ')}`);
  console.log(v.first ? 'VERDICT: FIRST ROUND (nothing to compare with yet; it becomes the baseline)'
    : v.ok ? 'VERDICT: NOT WORSE' : `VERDICT: WORSE - ${v.worse.join('; ')}`);
  if (process.argv.includes('--record')) {
    round.verdict = v.first ? 'first' : v.ok ? 'not worse' : 'worse';
    round.totals = v.now;
    history.rounds = [...(history.rounds || []).filter(r => r.round !== name), round];
    const note = 'Written by tools/starter/trials/compare.mjs --record: each judged trial round of the improvement loop (tools/starter/IMPROVEMENT-LOOP.md). Each project\'s first round is its baseline.';
    fs.writeFileSync(HISTORY, JSON.stringify({ _comment: note, rounds: history.rounds }, null, 2) + '\n');
    console.log(`recorded in ${path.relative(process.cwd(), HISTORY) || HISTORY}`);
  }
  process.exit(v.first || v.ok ? 0 : 1);
}
