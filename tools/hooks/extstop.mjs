// REQ: external-stop, shared by both engines (moved from hooks.mjs). A project's own Stop command (config
// "externalStop") runs inside this Stop: its numbered steps become steps here.
import { spawnSync } from 'node:child_process';

// REQ: external-stop. The project's own Stop command, run with this Stop's input; its numbered steps become steps here.
// A command that crashes is one step (so the project sees it broke); one that passes adds nothing.
export function externalStopSteps(data, cfg, { ROOT, bench = false } = {}) {
  const cmd = String(cfg.externalStop || '').trim();
  if (!cmd || bench) return [];
  const why = cmd.replace(/\s+stop\s*$/i, ' why');
  const limit = Number(cfg.externalStopTimeoutMs) > 0 ? Number(cfg.externalStopTimeoutMs) : 180000;
  const r = spawnSync(cmd, { cwd: ROOT, shell: true, input: JSON.stringify(data), encoding: 'utf8', timeout: limit, env: { ...process.env, ANZUELO_MERGED_STOP: '1' } });
  // (a command that ran out of time is not broken: it runs again at the next Stop. Removing it would turn off every
  // check it runs. Lesson (a field report): under load from helpers, a project's Stop command passed the fixed 60 s
  // and the answer was told to fix it or remove it)
  if (r.error?.code === 'ETIMEDOUT') return [{ tag: 'external-stop', external: true, short: "The project's own Stop command ran out of time: it runs again at the next Stop",
    msg: `The project's own Stop command (${cmd}, config "externalStop") ran out of time after ${Math.round(limit / 1000)} s, likely because the machine was busy (helpers or other runs). Nothing is wrong with it: let any helper runs finish, then end the turn again so it reruns. If it keeps running out of time with the machine quiet, raise "externalStopTimeoutMs" in tools/hooks/config.json or make the command faster.` }];
  const last = String(r.stdout || '').trim().split(/\r?\n/).filter(Boolean).pop() || '';
  let d = null; try { d = last ? JSON.parse(last) : null; } catch { }
  if (r.error || (r.status && !d)) return [{ tag: 'external-stop', external: true, short: "Fix the project's own Stop command: it failed",
    msg: `The project's own Stop command (${cmd}, config "externalStop") failed: ${String(r.error?.message || r.stderr || `exit ${r.status}`).slice(0, 300)}. Fix it, or remove "externalStop" from tools/hooks/config.json.` }];
  if (d?.decision !== 'block') return [];
  const reason = String(d.reason || '');
  const lines = [...reason.matchAll(/^\s*\d+\.\s+(.+?)\s*$/gm)].map(m => m[1]);
  const more = /\.\.\.\s*and\s+(\d+)\s+more\b/.exec(reason);
  const steps = lines.length ? lines : [reason.split('\n')[0].slice(0, 120)];
  const slug = s => `project-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)}`;
  // (a project's command may name each step's check in "tags", one per step, so a runbook item can cover it)
  const own = Array.isArray(d.tags) && d.tags.length === steps.length ? d.tags.map(String) : null;
  const out = steps.map((s, i) => ({ tag: own?.[i] && /^[a-z][\w-]*$/.test(own[i]) ? own[i] : slug(s), external: true, short: s, msg: `${s} (the project's own check; its full list: ${why})` }));
  if (more) out.push({ tag: 'project-more', external: true, short: `${more[1]} more of the project's own steps`, msg: `${more[1]} more of the project's own steps: run ${why} for the full list.` });
  return out;
}
