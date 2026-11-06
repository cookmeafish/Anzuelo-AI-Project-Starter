#!/usr/bin/env node
// Starter-only. The verdict of a trial round (tools/starter/runbooks/improvement-loop.md): its judged findings, setup minutes,
// Stop blocks and failed turns against each project's baseline (its first recorded round) and against the previous
// round, over the same projects. "NOT WORSE" only when neither comparison is worse by these rules:
//   more high findings; more than MEDIUM_NOISE more medium findings (judges differ by about 3 between rounds);
//   median setup minutes more than SLOWER x the other; more failed turns (errors, timeouts); a share of turns the Stop
//   hook blocked more than BLOCKED_NOISE higher (counted from the trial records, not the judges: early rounds' judges
//   did not count Stop rounds, which once made a baseline look block-free).
// Efficiency counts too (the user pays for every step): cost per work turn or the median setup cost more than COSTLIER
// x the other (cost swings about 30% between rounds from the agent alone), more than DENIAL_NOISE more denied tool calls
// per turn (each one a full extra round), more than HOOK_TEXT x the hook text per turn (records from rounds that
// measured it), or more than REPEAT_NOISE more repeated steps per turn: a file read or a command run again with
// nothing changed since (repeats.mjs; the user's first fear is a starter that does work over and over).
//   node tools/starter/trials/compare.mjs <round> [--record] [--results <dir>] [--judge <dir>] [--engine <commit>]
// --record keeps the round in tools/starter/trials/rounds.json (committed: the history every later round compares to).
// Exit 0: NOT WORSE; 1: WORSE; 2: the round's records or judges are missing.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repeatsOf } from './repeats.mjs';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const HISTORY = process.env.ANZUELO_ROUNDS_FILE || path.join(HERE, 'rounds.json');
export const MEDIUM_NOISE = 3, SLOWER = 1.25, BLOCKED_NOISE = 0.15, COSTLIER = 1.3, DENIAL_NOISE = 0.25, HOOK_TEXT = 1.2, REPEAT_NOISE = 0.1;

// One project's numbers from its trial record and its judged findings.
// A trial the account's usage limit stopped: marked by run.mjs, or (older records) a turn whose whole answer is the limit
// (one pattern for run.mjs and this file, any "hit your ... limit" wording. Lesson: "You've hit your 5-hour limit" ran a
// whole round into the limit unmarked, since run.mjs and this file each kept their own, older list)
export const LIMIT_ANSWER = /\b(hit your [\w -]{0,24}limit|usage limit (reached|exceeded)|session limit · resets|rate limit reached)\b/i;
export const isVoid = r => !!r?.void || (r?.turns || []).some(t => LIMIT_ANSWER.test(t.answer || '') && String(t.answer || '').trim().length < 300);
// Which part of the starter a finding is about: "skill" (a skill's, pack's or library's own check or script), "none"
// (the agent's own slip) or "engine" (hooks, reminder, end check, engine commands). The judge says so in "layer"; older
// findings are read from their "starter" text. Lesson (round v38): one high finding in a skill's own check flipped the
// whole round to WORSE while the engine's numbers improved, so the verdict no longer said whether the engine got better.
export function layerOf(x) {
  if (/^(engine|skill|none)$/.test(x?.layer || '')) return x.layer;
  const s = String(x?.starter ?? 'none');
  if (!s.trim() || /^\s*(none|n\/a)\b/i.test(s)) return 'none';
  if (/^\s*tools\//i.test(s)) return 'engine';
  return /\b(library skill|skills?\/[\w-]+\/scripts|library\/|packs?\/|[\w-]+ (skill|pack)('s)?\b|(skill|pack)'s)/i.test(s) && !/\b(tools\/hooks|hooks\.mjs|end check|stop (hook|check)|reminder|userpromptsubmit|routing)\b/i.test(s) ? 'skill' : 'engine';
}
export function projectStats(record, judged) {
  const turns = record?.turns || [];
  // (efficiency findings are counted on their own: rounds judged before the judges looked for them still compare. So
  // are a skill's own checks, below)
  const every = judged?.findings || [], all = every.filter(x => layerOf(x) !== 'skill'), skill = every.filter(x => layerOf(x) === 'skill' && x.area !== 'efficiency');
  const f = all.filter(x => x.area !== 'efficiency'), eff = every.filter(x => x.area === 'efficiency');
  const n = s => f.filter(x => x.severity === s).length;
  const caused = s => f.filter(x => x.severity === s && !/^\s*(none|n\/a)?\s*$/i.test(String(x.starter ?? 'none'))).length;
  const stops = (judged?.stopRounds || []).reduce((a, b) => a + (Number(b) || 0), 0);
  const work = turns.slice(1), measured = turns.length > 0 && turns.every(t => t.overhead);
  const over = k => measured ? turns.reduce((a, t) => a + (t.overhead[k] || 0), 0) : null;
  // A turn's cost is the session's running total minus the turn before it (a new session starts over), as
  // efficiency.mjs counts it. Lesson: each work turn was charged the whole session's cost so far, setup included.
  let prev = 0, prevSid = null;
  const own = turns.map(t => { const c = Number(t.cost) || 0, o = t.sid && t.sid === prevSid ? Math.max(0, c - prev) : c; prev = c; prevSid = t.sid; return o; });
  return {
    setupCost: turns[0]?.cost ?? null, workCost: own.slice(1).reduce((a, c) => a + c, 0), ownCost: true, workTurns: work.length, workMin: work.reduce((a, t) => a + (t.min || 0), 0),
    hookChars: over('hookChars'), denials: over('denials'), stopBlocks: over('stopBlocks'),
    effHigh: eff.filter(x => x.severity === 'high').length, effMedium: eff.filter(x => x.severity === 'medium').length,
    high: n('high'), medium: n('medium'), low: n('low'), starterHigh: caused('high'), starterMedium: caused('medium'),
    skillHigh: skill.filter(x => x.severity === 'high').length, skillMedium: skill.filter(x => x.severity === 'medium').length,
    turns: turns.length, stops, blocked: turns.filter(t => (t.blockTags || []).length).length, setupMin: turns[0]?.min ?? null, errors: turns.filter(t => t.error).length,
  };
}
const median = xs => { const a = xs.filter(x => typeof x === 'number').sort((p, q) => p - q); return a.length ? (a.length % 2 ? a[(a.length - 1) / 2] : (a[a.length / 2 - 1] + a[a.length / 2]) / 2) : null; };
export function totals(projects, ids) {
  const ps = ids.map(id => projects[id]).filter(Boolean);
  const sum = k => ps.reduce((a, p) => a + (p[k] || 0), 0);
  const turns = sum('turns'), work = sum('workTurns'), m = ps.filter(p => p.hookChars != null), mTurns = m.reduce((a, p) => a + p.turns, 0);
  const r2 = x => Math.round(x * 100) / 100;
  // (rounds recorded before costs were per turn hold running totals: those are not compared with per-turn costs)
  return { costPerWorkTurn: work && ps.every(p => p.ownCost) ? r2(sum('workCost') / work) : null, setupCostMedian: (x => x == null ? null : r2(x))(median(ps.map(p => p.setupCost))), minPerWorkTurn: work ? r2(sum('workMin') / work) : null,
    denialsPerTurn: mTurns ? r2(m.reduce((a, p) => a + p.denials, 0) / mTurns) : null, hookCharsPerTurn: mTurns ? Math.round(m.reduce((a, p) => a + p.hookChars, 0) / mTurns) : null,
    effHigh: sum('effHigh'), effMedium: sum('effMedium'),
    // (repeated work: a step done again with nothing changed since, see repeats.mjs; rounds recorded before it have none)
    repeatsPerTurn: (r => r.length ? r2(r.reduce((a, p) => a + p.repeats, 0) / r.reduce((a, p) => a + p.turns, 0)) : null)(ps.filter(p => typeof p.repeats === 'number')),
    projects: ps.length, high: sum('high'), medium: sum('medium'), low: sum('low'), starterHigh: sum('starterHigh'), starterMedium: sum('starterMedium'),
    // (null for rounds recorded before the split: their skill findings are in high and medium)
    skillHigh: ps.every(p => typeof p.skillHigh === 'number') ? sum('skillHigh') : null, skillMedium: ps.every(p => typeof p.skillMedium === 'number') ? sum('skillMedium') : null,
    errors: sum('errors'), blockedShare: turns ? Math.round(sum('blocked') / turns * 100) / 100 : 0, setupMedian: (x => x == null ? null : Math.round(x * 10) / 10)(median(ps.map(p => p.setupMin))) };
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
  if (both('repeatsPerTurn') && now.repeatsPerTurn > then.repeatsPerTurn + REPEAT_NOISE) out.push(`${now.repeatsPerTurn} repeated steps per turn (done again with nothing changed), ${label} ${then.repeatsPerTurn} (noise allows +${REPEAT_NOISE})`);
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
  if (both('repeatsPerTurn') && now.repeatsPerTurn + REPEAT_NOISE < then.repeatsPerTurn) out.push(`repeated steps per turn ${then.repeatsPerTurn} -> ${now.repeatsPerTurn}`);
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
  // the skills' own checks get their own verdict, against the previous round that recorded them apart
  const sk = (n, t) => n.skillHigh != null && t.skillHigh != null;
  const skillWorse = p && sk(p.now, p.then) ? [...(p.now.skillHigh > p.then.skillHigh ? [`${p.now.skillHigh} high, ${prev.round} had ${p.then.skillHigh}`] : []),
    ...(p.now.skillMedium > p.then.skillMedium + MEDIUM_NOISE ? [`${p.now.skillMedium} medium, ${prev.round} had ${p.then.skillMedium}`] : [])] : null;
  return { now, base: b, prev: p && { round: prev.round, ...p }, baseFrom, worse, better, ok: !worse.length, first: !b && !p, skillWorse };
}

// Why a starter copy can't run a round: its HEAD is not an "Engine proof" commit, so the proof it ships may not name its
// engine ('' when it is).
export function proofProblem(dir) {
  const s = spawnSync('git', ['log', '-1', '--format=%s'], { cwd: dir, encoding: 'utf8' });
  if (s.status !== 0) return `${dir} is not a git copy of the starter`;
  return s.stdout.trim() === 'Engine proof' ? '' : `is at "${s.stdout.trim().slice(0, 60)}", not an "Engine proof" commit`;
}
const readJSON = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '')) {
  const name = process.argv[2];
  const opt = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  if (!/^[\w.-]+$/.test(name || '')) { console.error('usage: compare.mjs <round> [--record] [--results <dir>] [--judge <dir>] [--engine <commit>]'); process.exit(2); }
  const resDir = opt('--results') || path.join(TRIALS, `results-${name}`), judgeDir = opt('--judge') || path.join(TRIALS, 'judge');
  const info = readJSON(path.join(TRIALS, `round-${name}.json`)) || {};
  const judged = {};
  // (attack analyses, <round>-sec-<id>.json, are another report: they name the project but carry no judge findings, and
  // read here they wiped its counts. Lesson: website round w2 showed 0 findings)
  let judgeFiles = []; try { judgeFiles = fs.readdirSync(judgeDir).filter(f => f.startsWith(`${name}-`) && f.endsWith('.json') && !f.startsWith(`${name}-sec-`)); } catch { }
  for (const f of judgeFiles) for (const p of [].concat(readJSON(path.join(judgeDir, f)) || [])) if (p?.project) judged[p.project] = p;
  let recs = []; try { recs = fs.readdirSync(resDir).filter(f => f.endsWith('.json')); } catch { }
  const projects = {}, unjudged = [], voided = [];
  // a void trial (the account's usage limit answered its turns) is no result, judged or not (Lesson: round v10)
  for (const f of recs) { const r = readJSON(path.join(resDir, f)); if (!r?.id) continue; if (isVoid(r)) { voided.push(r.id); continue; } if (!judged[r.id]) { unjudged.push(r.id); continue; } projects[r.id] = { ...projectStats(r, judged[r.id]), ...(rep => rep ? { repeats: rep.length } : {})(repeatsOf(r)) }; }
  if (voided.length) console.log(`void (usage limit, not results): ${voided.join(', ')}`);
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
  const eff = t => `$${t.costPerWorkTurn ?? '-'} per work turn, ${t.minPerWorkTurn ?? '-'} min per work turn, setup $${t.setupCostMedian ?? '-'}, denials ${t.denialsPerTurn ?? '-'}/turn, repeats ${t.repeatsPerTurn ?? '-'}/turn, hook text ${t.hookCharsPerTurn ?? '-'} chars/turn`;
  console.log(`efficiency, this round: ${eff(v.now)}${v.now.effHigh + v.now.effMedium ? `; the judges found ${v.now.effHigh} high and ${v.now.effMedium} medium waste findings (area "efficiency")` : ''}`);
  if (v.base) console.log(`  baseline, same projects: ${eff(v.base.then)}`);
  if (v.prev) console.log(`  ${v.prev.round}, same projects: ${eff(v.prev.then)}`);
  if (v.better.length) console.log(`better: ${v.better.join('; ')}`);
  console.log(v.first ? 'VERDICT: FIRST ROUND (nothing to compare with yet; it becomes the baseline)'
    : v.ok ? 'VERDICT: NOT WORSE' : `VERDICT: WORSE - ${v.worse.join('; ')}`);
  console.log(`SKILLS (their own checks and scripts, not in the verdict above): ${v.now.skillHigh ?? 0} high, ${v.now.skillMedium ?? 0} medium${v.skillWorse == null ? ' (no earlier round counted them apart)' : v.skillWorse.length ? `: WORSE - ${v.skillWorse.join('; ')}` : ': NOT WORSE'}`);
  if (process.argv.includes('--record')) {
    round.verdict = v.first ? 'first' : v.ok ? 'not worse' : 'worse';
    if (v.skillWorse) round.skillVerdict = v.skillWorse.length ? 'worse' : 'not worse';
    round.totals = v.now;
    history.rounds = [...(history.rounds || []).filter(r => r.round !== name), round];
    const note = 'Written by tools/starter/trials/compare.mjs --record: each judged trial round of the improvement loop (tools/starter/runbooks/improvement-loop.md). Each project\'s first round is its baseline.';
    fs.writeFileSync(HISTORY, JSON.stringify({ _comment: note, rounds: history.rounds }, null, 2) + '\n');
    console.log(`recorded in ${path.relative(process.cwd(), HISTORY) || HISTORY}`);
  }
  process.exit(v.first || v.ok ? 0 : 1);
}
