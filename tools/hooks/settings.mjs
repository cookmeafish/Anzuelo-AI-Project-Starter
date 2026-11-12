// The project's settings, the small file helpers every tool shares, and the names and secrets nothing may contain.
// Moved from hooks.mjs (plan: engine v2 only, step 1b); hooks.mjs and the tools import them from here. A base module
// like paths.mjs, outside v2/: the hook entry loads it before v2, so a v2 that cannot load is still reported.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PROJECT, where, listAll } from './paths.mjs';

// ROOT is the project; engine files are found through abs() (paths.mjs decides the root per path, and in the starter
// every root is this one folder).
export const ROOT = PROJECT;
const CONFIG = () => where('tools/hooks/config.json');

// ---------- small helpers ----------
export const read = (p, d = '') => { try { return fs.readFileSync(p, 'utf8'); } catch { return d; } };
export const readJSON = (p, d) => { try { return JSON.parse(read(p)); } catch { return d; } };
export const abs = p => where(p);
export const exists = p => { try { fs.statSync(abs(p)); return true; } catch { return false; } };
export const list = d => listAll(d);
// A folder walk never follows a link or junction (it throws, and the walker skips the entry). Lesson: a workspace link
// in packages/*/node_modules pointing back into the repo made the prompt hook loop past its timeout.
export const walkStat = p => { const s = fs.lstatSync(abs(p)); if (s.isSymbolicLink()) throw new Error('link'); return s; };
export const esc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Folders that are never the project's own work: installed dependencies, virtual environments (any name: they hold a
// pyvenv.cfg), tool caches (CACHEDIR.TAG), and, for kind "all", build output. "target", "vendor", "out", "bin" and "obj"
// count only next to the build file that makes them, since a project may name a folder of its own that way.
// Lesson: two setup audits walked a Python project's .venv for 19 minutes, and the session-start check reported merge
// markers inside it.
const DEP_DIRS = /^(node_modules|\.venv|venv|__pycache__|\.tox|\.nox|\.mypy_cache|\.pytest_cache|\.ruff_cache|\.gradle|\.dart_tool|\.terraform|\.next|\.nuxt|\.svelte-kit|\.turbo|\.parcel-cache|\.eggs|bower_components|jspm_packages|site-packages)$/;
const BUILD_FILES = /^(Cargo\.toml|pom\.xml|build\.gradle(\.kts)?|settings\.gradle(\.kts)?|go\.mod|composer\.json|Gemfile|[^.]+\.(csproj|fsproj|vbproj|sln))$/;
export function bulkDir(parentAbs, name, kind = 'all') {
  if (DEP_DIRS.test(name)) return true;
  const at = path.join(parentAbs, name);
  if (fs.existsSync(path.join(at, 'pyvenv.cfg')) || fs.existsSync(path.join(at, 'CACHEDIR.TAG'))) return true;
  if (/^vendor$/.test(name) && (fs.existsSync(path.join(at, 'modules.txt')) || fs.existsSync(path.join(at, 'autoload.php')))) return true;
  if (kind !== 'all') return false;
  if (/^(dist|build)$/.test(name)) return true;
  if (!/^(target|vendor|out|bin|obj)$/.test(name)) return false;
  try { return fs.readdirSync(parentAbs).some(n => BUILD_FILES.test(n)); } catch { return false; }
}
export const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const today = () => localDate(); // the user's calendar day, not UTC
// A tool's usage text: its whole header comment, so the help can never be cut short or include code.
export const usageOf = url => { const out = []; for (const l of read(fileURLToPath(url)).split(/\r?\n/).slice(1)) { if (!l.startsWith('//')) break; out.push(l); } return out.join('\n'); };

// ---------- configuration ----------
// Every setting's default (what each does: SETTINGS.md); a project's tools/hooks/config.json overrides them.
export const DEFAULTS = JSON.parse(fs.readFileSync(new URL('./defaults.json', import.meta.url), 'utf8'));
// List settings in config.json EXTEND the defaults (a pack adding root files must not drop AGENTS.md from the list).
export const EXTENDS = ['knowledgeDirs', 'gitignoreMustIgnore', 'gitignoreMustKeep', 'rootAllowed', 'namesIgnore', 'injectionIgnore', 'fluff', 'secretPatterns', 'userFacing', 'userFacingIgnore', 'verbatimAllowed', 'ignoreForChanges', 'guiFiles', 'guiIgnore', 'evidenceLabels', 'questionNoFileExempt', 'notWork'];
let foundMirrors = null, ignoredDirs = null;
export function config() {
  const c = readJSON(CONFIG(), {});
  const out = { ...DEFAULTS, ...c };
  for (const k of EXTENDS) if (Array.isArray(c[k])) out[k] = [...new Set([...DEFAULTS[k], ...c[k]])];
  // words that are filler elsewhere but real terms in the project's subject (a technical term that shares its name with a
  // filler word). Lesson: an adopted project's docs and answers about such a rule were flagged as filler
  if (Array.isArray(c.fluffAllowed)) out.fluff = out.fluff.filter(f => !c.fluffAllowed.includes(f));
  // A skills folder the engine once generated (its skills carry a .mirror marker) stays a mirror, so it is refreshed,
  // pruned and protected like the configured ones. Lesson: .agents/skills was left out of skillMirrors, and its copy
  // of the plan skill kept a link that pointed one folder short.
  foundMirrors ??= list('.').filter(d => /^\.[\w-]+$/.test(d) && d !== '.git').map(d => `${d}/skills`).filter(m => list(m).some(n => exists(`${m}/${n}/.mirror`)));
  for (const m of foundMirrors) if (!out.skillMirrors.includes(m)) out.skillMirrors = [...out.skillMirrors, m];
  // Plain folders the root .gitignore names ("dist/", "/target/") hold build output and caches: never walked for changes.
  // Lesson: a monorepo's dist/ and nested caches were walked on every prompt and stop, which tripled the hook time.
  ignoredDirs ??= read(abs('.gitignore')).split(/\r?\n/).map(l => l.trim()).filter(l => /^\/?[\w.-]+\/$/.test(l) && !l.startsWith('.') && !l.startsWith('/.'))
    .map(l => l.startsWith('/') ? `${l.slice(1)}**` : `**/${l}**`);
  out.ignoreForChanges = [...new Set([...out.ignoreForChanges, ...ignoredDirs])];
  return out;
}
export const re = (s, f = 'i') => new RegExp(s, f);
// The secret patterns, compiled. A pattern that starts with a letter or digit and has no boundary of its own gets one, so
// an older project's own patterns (config.json extends the list) don't match inside words either. REQ: no-secrets
export const secretRes = (cfg = config()) => [...new Set(cfg.secretPatterns)].map(s => {
  const src = /^[A-Za-z0-9]/.test(s) ? `(?<![A-Za-z0-9])${s}` : s;
  try { return { s, rx: new RegExp(src) }; } catch { return null; }
}).filter(Boolean);
export const secretHit = (text, cfg = config()) => secretRes(cfg).find(p => p.rx.test(text))?.s;

// REQ: forbidden-terms. Names and words the user said must never appear in the project (a client, a project, a person):
// "forbiddenTerms" in config.json, and private ones in a list outside the repository ("privateTermsFile"; the starter
// itself reads ~/.anzuelo/private-terms.txt), so the project never holds the names it must avoid. Writing one is denied
// (pretool), a file a command changed is checked at Stop, and the audit sweeps every shared file. Lesson (2026-10-25): a
// rule written only as prose was forgotten.
export const homeDir = () => process.env.USERPROFILE || process.env.HOME || '';
export const privateTermsPath = (cfg = config()) => cfg.privateTermsFile ? String(cfg.privateTermsFile).replace(/^~(?=[\\/])/, homeDir())
  : exists('.starter-template') && homeDir() ? path.join(homeDir(), '.anzuelo', 'private-terms.txt') : '';
// The folder's .private-terms, or in a git worktree without one (the file is git-ignored) the main folder's.
export function privateTermsListFile(root) {
  const own = path.join(root, '.private-terms');
  if (fs.existsSync(own)) return own;
  const c = spawnSync('git', ['rev-parse', '--path-format=absolute', '--git-common-dir'], { cwd: root, encoding: 'utf8' });
  return c.status === 0 && c.stdout.trim() ? path.join(path.dirname(c.stdout.trim()), '.private-terms') : own;
}
export const FORBID_EXEMPT = /^(tools\/hooks\/config\.json|tools\/hooks\/state\/|\.cache\/|\.git\/)/; // (the list itself and the engine's state never count)
export const countRe = (rx, s) => rx ? (String(s || '').match(rx) || []).length : 0;
export const settingUp = () => exists('SETUP-PROMPT.md') && !exists('.starter-template');
export function forbiddenTerms(cfg = config()) {
  const list = [].concat(cfg.forbiddenTerms || []), f = privateTermsPath(cfg);
  if (f) { try { list.push(...fs.readFileSync(f, 'utf8').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'))); } catch { } }
  return [...new Set(list.map(String).filter(Boolean))];
}
export function forbiddenRe(cfg = config()) {
  const t = forbiddenTerms(cfg);
  return t.length ? new RegExp(`(?<![\\p{L}\\p{N}_-])(${t.map(esc).join('|')})(?![\\p{L}\\p{N}_-])`, 'giu') : null;
}
// (checks the user switched off, in config.json "suspended")
export const suspendedItems = () => (readJSON(where('tools/hooks/config.json'), {}).suspended || []).filter(s => s && s.item);
export const isSuspended = item => suspendedItems().some(s => s.item === item);
// (a markdown file's "## <name>" section, up to the next "## " heading)
export const section = (text, name) => (new RegExp(`^##\\s+${esc(name)}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'im').exec(text) || [, ''])[1];
// The engine's own files (what tools/new-project.mjs --upgrade replaces): written by the starter, not from the user's words.
export const VERBATIM_ENGINE = ['tools/**', '.githooks/**', 'HOW-TO-USE.md', 'docs/recommended-tools.md', 'docs/playbooks/_TEMPLATE.md', 'docs/playbooks/_fallback.md',
  ...['session-checklist', 'finish-checklist', 'runbook-standards', 'writing-standards', 'layout-standards', 'better-or-worse'].map(n => `docs/checks/${n}.md`)];
