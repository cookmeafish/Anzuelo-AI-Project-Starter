// The engine's three roots, found in one place (plan: docs/plans/2026-11-07-engine-outside-the-project.md).
//   ENGINE   where the engine's code is: the folder that holds tools/hooks/
//   PROJECT  the project root: the folder above .anzuelo/ when the engine sits in .anzuelo/engine, else the engine's own
//   LOCAL    where engine files made for this project live: .anzuelo/local in a project, the root itself in the starter
// roots(dir, env): ANZUELO_ROOT in env (tests, the v2 tools run against another folder) names the project outright.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function roots(hooksDir, env = process.env) {
  const ENGINE = path.resolve(hooksDir, '..', '..');
  const split = path.basename(ENGINE) === 'engine' && path.basename(path.dirname(ENGINE)) === '.anzuelo';
  const PROJECT = env.ANZUELO_ROOT ? path.resolve(env.ANZUELO_ROOT) : split ? path.dirname(path.dirname(ENGINE)) : ENGINE;
  const LOCAL = split ? path.join(PROJECT, '.anzuelo', 'local') : PROJECT;
  return { ENGINE, PROJECT, LOCAL, split };
}

// (the engine's own scripts go by where they sit, never by an inherited ANZUELO_ROOT: a hook run in one project sets
// it, and a test copy it spawns would otherwise read that project's files)
export const { ENGINE, PROJECT, LOCAL, split } = roots(path.dirname(fileURLToPath(import.meta.url)), {});

// Which root a project-relative path lives under. In the starter all three are one folder, so this changes nothing
// there. The records that describe the project (changelog, brief, decisions) and anything unknown (the project's code)
// stay in the project; the engine's code is the engine's; what the engine makes for this project is local; runbooks,
// skills, checklists and the rules exist in both, the local copy winning and every new or changed one going local.
const ENGINE_ONLY = /^(tools|packs|library|\.githooks)(\/|$)/;
// (tools/screenshot.mjs comes from a pack and is installed for this project)
const LOCAL_ALWAYS = /^(tools\/hooks\/state|tools\/hooks\/config\.json|tools\/screenshot\.mjs|\.cache|\.starter|DIRECTORY\.md|SETUP-PROMPT\.md|HOW-TO-USE\.md)(\/|$)/;
const BOTH = /^(skills|docs\/playbooks|docs\/checks|tools\/starter\/runbooks|AGENTS\.md|tools\/hooks\/requirements\.json|tools\/packs-registry\.json)(\/|$)/;
// (only the engine's working notes leave the project's docs/: its knowledge, specs, releases, security baseline and
// anything else it keeps there stay in its git)
const ENGINE_NOTES = /^docs\/(STATUS\.md|plans|glossary\.md|reviews|MENU\.md|names\.json|recommended-tools\.md|starter-feedback\.md|fit-checklist\.md|lessons\.md|routines\.md)(\/|$)/;
const norm = p => String(p || '').replace(/\\/g, '/').replace(/^\.\//, '');
export function kind(p) {
  const r = norm(p);
  if (LOCAL_ALWAYS.test(r) || ENGINE_NOTES.test(r)) return 'local';
  if (BOTH.test(r)) return 'both';
  if (ENGINE_ONLY.test(r)) return 'engine';
  return 'project';
}
const exists = f => { try { fs.statSync(f); return true; } catch { return false; } };
// resolver(r) gives where(p) (to read: local copy, else engine copy, else local) and whereWrite(p) (always local for
// engine-made files, so an upgrade never meets a change of the project's).
export function resolver(r = { ENGINE, PROJECT, LOCAL }) {
  const at = (root, p) => path.resolve(root, norm(p));
  const where = p => {
    if (path.isAbsolute(String(p))) return path.resolve(String(p));
    const k = kind(p);
    if (k === 'engine') return at(r.ENGINE, p);
    if (k === 'project') return at(r.PROJECT, p);
    if (k === 'both' && r.LOCAL !== r.ENGINE && !exists(at(r.LOCAL, p)) && exists(at(r.ENGINE, p))) return at(r.ENGINE, p);
    return at(r.LOCAL, p);
  };
  const whereWrite = p => path.isAbsolute(String(p)) ? path.resolve(String(p)) : kind(p) === 'project' ? at(r.PROJECT, p) : kind(p) === 'engine' ? at(r.ENGINE, p) : at(r.LOCAL, p);
  // The project-relative name of an absolute path under any root (the most specific root first: local and engine sit
  // inside the project).
  const relOf = a => {
    const f = path.resolve(r.PROJECT, String(a || ''));
    for (const root of [r.LOCAL, r.ENGINE, r.PROJECT].sort((x, y) => y.length - x.length)) {
      const q = path.relative(root, f);
      if (q === '' || (!q.startsWith('..') && !path.isAbsolute(q))) return q.split(path.sep).join('/');
    }
    return path.relative(r.PROJECT, f).split(path.sep).join('/');
  };
  // A folder's entries from every root that may hold it, each name once (the local copy of a runbook folder and the
  // engine's; docs/ in the project and local).
  const listAll = d => {
    const out = new Set(), k = kind(d || '.'), r0 = norm(d || '.');
    // (the project's top folder lists the local folder's entries in place of .anzuelo/, so a walk from the top finds
    // docs/STATUS.md under that name)
    const top = r0 === '.' || r0 === '';
    const from = top || r0 === 'docs' ? [r.PROJECT, r.LOCAL] : k === 'both' ? [r.LOCAL, r.ENGINE] : k === 'engine' ? [r.ENGINE] : k === 'local' ? [r.LOCAL] : [r.PROJECT];
    for (const root of new Set(from)) { try { for (const n of fs.readdirSync(at(root, d || '.'))) if (!(top && r.LOCAL !== r.PROJECT && n === '.anzuelo')) out.add(n); } catch { } }
    return [...out];
  };
  return { where, whereWrite, relOf, listAll };
}
export const { where, whereWrite, relOf, listAll } = resolver();
