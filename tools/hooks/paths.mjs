// The engine's three roots, found in one place (plan: docs/plans/2026-11-07-engine-outside-the-project.md).
//   ENGINE   where the engine's code is: the folder that holds tools/hooks/
//   PROJECT  the project root: the folder above .anzuelo/ when the engine sits in .anzuelo/engine, else the engine's own
//   LOCAL    where engine files made for this project live: .anzuelo/local in a project, the root itself in the starter
// roots(dir, env): ANZUELO_ROOT in env (tests, the v2 tools run against another folder) names the project outright.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
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

// Which root a project-relative path lives under (in the starter all three are one folder): the engine's code is the
// engine's, all it makes for the project is local (its notes and records too: the user's rule, 2026-11-12, nothing of
// the starter outside .anzuelo/), runbooks, skills and rules are in both (local wins), anything else is the project's.
const ENGINE_ONLY = /^(tools|packs|library|\.githooks)(\/|$)/;
// (tools/screenshot.mjs comes from a pack and is installed for this project)
const LOCAL_ALWAYS = /^(tools\/hooks\/state|tools\/hooks\/config\.json|tools\/screenshot\.mjs|\.cache|\.starter|DIRECTORY\.md|SETUP-PROMPT\.md|HOW-TO-USE\.md)(\/|$)/;
const BOTH = /^(skills|docs\/playbooks|docs\/checks|tools\/starter\/runbooks|AGENTS\.md|tools\/hooks\/requirements\.json|tools\/packs-registry\.json)(\/|$)/;
const ENGINE_NOTES = /^docs\/(STATUS\.md|plans|glossary\.md|reviews|MENU\.md|names\.json|recommended-tools\.md|starter-feedback\.md|fit-checklist\.md|lessons\.md|routines\.md)(\/|$)/;
const norm = p => String(p || '').replace(/\\/g, '/').replace(/^\.\//, '');
// (the records: local, so an app's own CHANGELOG or docs never mix with them; an older install's copies stay in use)
export const RECORDS = /^docs\/(BRIEF|CHANGELOG|DECISIONS|security|foundation)\.md$/;
export function kind(p) {
  const r = norm(p);
  if (LOCAL_ALWAYS.test(r) || ENGINE_NOTES.test(r) || RECORDS.test(r)) return 'local';
  if (BOTH.test(r)) return 'both';
  if (ENGINE_ONLY.test(r)) return 'engine';
  return 'project';
}
const exists = f => { try { fs.statSync(f); return true; } catch { return false; } };
// Paths the project keeps in its own folder ("keepInProject" in .anzuelo/local/config.json, files or folders): read
// there, else from the engine, and written there. Lesson (a field report): its own scripts read them by path.
export const keepList = local => { try { return [].concat(JSON.parse(fs.readFileSync(path.join(local, 'config.json'), 'utf8')).keepInProject || []).map(s => norm(s).replace(/\/+$/, '')).filter(Boolean); } catch { return []; } };
// A record kept in the project's own equivalent ("recordPaths", { "docs/CHANGELOG.md": "CHANGELOG.md" }), per the adoption review.
export const stateOutside = (local, project) => { try { if (JSON.parse(fs.readFileSync(path.join(local, 'config.json'), 'utf8')).stateOutside !== true) return null; } catch { return null; }
  // (a project in the temp folder is a test copy: its state goes under the tests' own root, which their clean-up removes,
  // never into the user's profile. Lesson (2026-11-13): test installs left state folders in the real profile)
  // (named by its whole place under the temp folder, so removing a test folder removes the state of every project in it:
  // testtmp.mjs. Lesson (release chain, 2026-11-13): state kept an hour after its test grew the temp folder past budget)
  const t = testStateName(project); if (t) return path.join(os.tmpdir(), 'anzuelo-tests', 'state', t);
  return path.join(os.homedir(), '.anzuelo-state', `${path.basename(project).replace(/[^\w.-]+/g, '-')}-${createHash('sha1').update(path.resolve(project).toLowerCase()).digest('hex').slice(0, 8)}`); };
export const testStateName = p => { const tmp = path.resolve(os.tmpdir()), r = path.relative(tmp, path.resolve(p)); return !r || r.startsWith('..') || path.isAbsolute(r) ? null : r.toLowerCase().replace(/[\\/]+/g, '~').replace(/[^\w.~-]+/g, '-'); };
// When the engine came into the project (the install's record, else its file time): a turn or ask from before was never under it. Field report, 2026-11-13: held 4 rounds on asks from before the install
export const engineSinceAt = local => { const f = path.join(local, 'pre-install.json'); try { return JSON.parse(fs.readFileSync(f, 'utf8')).at || fs.statSync(f).mtime.toISOString(); } catch { return ''; } };
export const recordMap = local => { try { const m = JSON.parse(fs.readFileSync(path.join(local, 'config.json'), 'utf8')).recordPaths || {}; return Object.fromEntries(Object.entries(m).filter(([k, v]) => RECORDS.test(norm(k)) && v).map(([k, v]) => [norm(k), norm(v)])); } catch { return {}; } };
// resolver(r) gives where(p) (to read: local copy, else engine copy, else local) and whereWrite(p) (always local for
// engine-made files, so an upgrade never meets a change of the project's).
export function resolver(r = { ENGINE, PROJECT, LOCAL }) {
  const at = (root, p) => path.resolve(root, norm(p));
  const keep = r.keep || (r.LOCAL !== r.PROJECT ? keepList(r.LOCAL) : []);
  const kept = p => { const q = norm(p); return keep.some(k => q === k || q.startsWith(k + '/')); };
  const recs = r.LOCAL !== r.PROJECT ? (r.records || recordMap(r.LOCAL)) : {}, back = Object.fromEntries(Object.entries(recs).map(([k, v]) => [v, k]));
  // (the engine's churn (hook state, caches, notes) outside the project, in the user's profile, for an app whose dev
  // server watches its own folder: "stateOutside" in .anzuelo/local/config.json, set at adoption. Review of a large app,
  // 2026-11-13: state written under a polled, served root would reload the app while its owner uses it)
  const out = r.LOCAL !== r.PROJECT ? stateOutside(r.LOCAL, r.PROJECT) : null, churn = p => !!out && /^(tools\/hooks\/state|\.cache)(\/|$)/.test(norm(p));
  const record = p => { const q = norm(p); if (r.LOCAL === r.PROJECT || !RECORDS.test(q)) return null; return recs[q] ? at(r.PROJECT, recs[q]) : !exists(at(r.LOCAL, q)) && exists(at(r.PROJECT, q)) ? at(r.PROJECT, q) : null; }; // (mapped, an older install's copy, else local)
  const where = p => {
    if (path.isAbsolute(String(p))) return path.resolve(String(p));
    if (churn(p)) return at(out, p);
    const rec = record(p); if (rec) return rec;
    const k = kind(p);
    if (kept(p) && k !== 'project') return k === 'both' && !exists(at(r.PROJECT, p)) && exists(at(r.ENGINE, p)) ? at(r.ENGINE, p) : at(r.PROJECT, p);
    if (k === 'engine') return at(r.ENGINE, p);
    if (k === 'project') return at(r.PROJECT, p);
    if (k === 'both' && r.LOCAL !== r.ENGINE && !exists(at(r.LOCAL, p)) && exists(at(r.ENGINE, p))) return at(r.ENGINE, p);
    return at(r.LOCAL, p);
  };
  const whereWrite = p => path.isAbsolute(String(p)) ? path.resolve(String(p)) : churn(p) ? at(out, p) : record(p) || (kind(p) === 'project' || kept(p) ? at(r.PROJECT, p) : kind(p) === 'engine' ? at(r.ENGINE, p) : at(r.LOCAL, p));
  // The project-relative name of an absolute path under any root (the most specific root first: local and engine sit
  // inside the project).
  const relOf = a => {
    const f = path.resolve(r.PROJECT, String(a || ''));
    { const q = path.relative(r.PROJECT, f).split(path.sep).join('/'); if (back[q]) return back[q]; } // (the project's own changelog is "docs/CHANGELOG.md")
    for (const root of [r.LOCAL, r.ENGINE, r.PROJECT, ...(out ? [out] : [])].sort((x, y) => y.length - x.length)) {
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
    const from = top || r0 === 'docs' ? [r.PROJECT, r.LOCAL] : kept(r0) ? [r.PROJECT, ...(k === 'both' ? [r.ENGINE] : [])] : k === 'both' ? [r.LOCAL, r.ENGINE] : k === 'engine' ? [r.ENGINE] : k === 'local' ? [r.LOCAL] : [r.PROJECT];
    for (const root of new Set(from)) { try { for (const n of fs.readdirSync(at(root, d || '.'))) if (!(top && r.LOCAL !== r.PROJECT && n === '.anzuelo')) out.add(n); } catch { } }
    return [...out];
  };
  return { where, whereWrite, relOf, listAll, kept };
}
export const { where, whereWrite, relOf, listAll, kept } = resolver();
