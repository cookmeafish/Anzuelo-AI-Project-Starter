// Trial rounds leave three things outside the repository: each trial's temp project (<temp>/anzuelo-new/<id>-<round>),
// the host's transcript folder for it (~/.claude/projects/<that path, non-alphanumerics as "-">), and the round's frozen
// starter copy (<temp>/anzuelo-frozen-<commit>, a git worktree). The judge and the analysis scripts read them after a
// round, so they are kept for the newest `keep` rounds and removed for older ones when a new round starts.
// User rule, 2026-11-12: no leaks that slow the computer; 714 transcript folders from trial projects had piled up.
import '../../hooks/hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const slug = p => path.resolve(p).replace(/[^A-Za-z0-9]/g, '-');

// trials: the folder with round-<name>.json records; returns what was removed, by kind
export function pruneRounds({ trials, keep = 2, tmp = os.tmpdir(), home = os.homedir(), repo } = {}) {
  const rm = p => { try { fs.rmSync(p, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); return true; } catch { return false; } };
  const rounds = fs.readdirSync(trials).filter(f => /^round-.+\.json$/.test(f)).map(f => { try { return JSON.parse(fs.readFileSync(path.join(trials, f), 'utf8')); } catch { return null; } })
    .filter(r => r?.round).sort((a, b) => String(b.started).localeCompare(String(a.started)));
  const kept = rounds.slice(0, keep), old = rounds.slice(keep), keepStarters = new Set(kept.map(r => path.resolve(r.starter || '')));
  const out = { projects: 0, transcripts: 0, starters: 0 };
  for (const r of old) {
    for (const id of r.ids || []) {
      const dir = path.join(tmp, 'anzuelo-new', `${id}-${r.round}`);
      if (fs.existsSync(dir) && rm(dir)) out.projects++;
      const tr = path.join(home, '.claude', 'projects', slug(dir));
      if (fs.existsSync(tr) && rm(tr)) out.transcripts++;
    }
    // (only a frozen copy this code made in the temp folder, and none a kept round still uses)
    const st = r.starter && path.resolve(r.starter);
    if (st && !keepStarters.has(st) && path.basename(st).startsWith('anzuelo-frozen-') && path.dirname(st) === path.resolve(tmp) && fs.existsSync(st)) {
      if (repo) spawnSync('git', ['worktree', 'remove', '--force', st], { cwd: repo, encoding: 'utf8' });
      if (!fs.existsSync(st) || rm(st)) out.starters++;
    }
  }
  if (repo) spawnSync('git', ['worktree', 'prune'], { cwd: repo, encoding: 'utf8' });
  return out;
}
