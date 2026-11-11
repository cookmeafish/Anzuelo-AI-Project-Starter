// The git-level checks (no AI credit in commits, a .gitignore that keeps private files in) and the hash of everything
// the self-tests read. Moved from hooks.mjs (plan: engine v2 only, step 1b).
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { kind, split } from './paths.mjs';
import { ROOT, read, abs, exists, list, walkStat, config, re } from './settings.mjs';

// Everything the self-tests read, as one hash: the engine, the project's checks, rules, runbooks and skills, and its
// decisions and security log as the test copies keep them. A full self-test pass stays valid while it is unchanged
// (audit --setup reuses it). The test copies drop the setup interview, upgrade reviews and dropped rules from
// DECISIONS.md, the review rows from security.md, and use a placeholder names.json, so those parts don't count.
// Lesson: the setup interview and the security review changed the hash at every setup step, so the reuse never applied.
export function testInputsHash() {
  // (line endings don't count: git keeps a file the same with either, and a checkout may hold Windows ones. Lesson: a
  // frozen worktree's pass of the exact commit hashed differently from the main folder over one CRLF runbook)
  const h = createHash('sha1'), addText = (p, t) => { h.update(p + '\0'); h.update(String(t).replace(/\r\n/g, '\n')); }, add = p => { try { addText(p, fs.readFileSync(abs(p), 'utf8')); } catch { } };
  const walk = (d, rx) => { for (const n of list(d).sort()) { const p = `${d}/${n}`; let s; try { s = walkStat(p); } catch { continue; } if (s.isDirectory()) { if (n !== 'state') walk(p, rx); } else if (rx.test(n) && !/\.local\.json$/.test(n) && n !== 'engine-proof.json') add(p); } }; // (machine-local files (*.local.json) are this machine's settings and watch lists, not test inputs: Lesson: updating the starter's watch list voided a fresh self-test pass) (the proof is a result of the tests, not an input)
  walk('tools', /\.(mjs|json)$/); walk('docs/checks', /\.md$/); walk('docs/playbooks', /\.md$/); walk(config().skillsDir, /\.(md|mjs)$/);
  add('AGENTS.md');
  const tidy = t => t.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
  addText('docs/DECISIONS.md', tidy(read(abs('docs/DECISIONS.md')).replace(/^## (Setup interview|Upgrade review|Dropped rules)[^\n]*\n(?:(?!## )[^\n]*\n?)*/gm, '')));
  addText('docs/security.md', tidy(read(abs('docs/security.md')).replace(/^\|\s*\d{4}-\d{2}-\d{2}\s*\|.*$/gm, '')));
  return h.digest('hex').slice(0, 16);
}

// ---------- git: no AI attribution, ever ----------
// Commits not yet on any remote (or made since `sinceMs`), with message + author + committer, that credit an AI.
export function aiAttributedCommits(cfg = config(), sinceMs = null) {
  // (since a time: every local branch, not only HEAD's, so a commit made onto another branch is seen. Lesson (oversight,
  // 2026-11-10): one made with update-ref on a side branch passed the end check)
  const range = sinceMs ? ['--since', new Date(sinceMs - 1000).toISOString(), 'HEAD', '--branches'] : ['HEAD', '--not', '--remotes'];
  const r = spawnSync('git', ['log', '-n', '200', '--format=%H%x1f%an <%ae>%x1f%cn <%ce>%x1f%B%x1e', ...range], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout) return [];
  return r.stdout.split('\x1e').map(s => s.trim()).filter(Boolean).map(s => { const [h, a, c, m] = s.split('\x1f'); return { h, a, c, m: m || '' }; })
    .filter(x => re(cfg.aiAttribution).test(x.m) || re(cfg.aiAuthor).test(x.a) || re(cfg.aiAuthor).test(x.c))
    .map(x => `${x.h.slice(0, 8)} "${x.m.split('\n')[0].slice(0, 60)}"`);
}

// ---------- .gitignore: ready before every push (REQ: gitignore-ready) ----------
// What must never leave the machine is ignored (secrets, local state, caches, the private-terms list), what the project
// needs is not, and nothing already committed matches an ignore rule. Checked by the pretool hook and the git pre-push
// hook, so it holds for every agent and for manual pushes. Lesson in advance: a .gitignore written once and never
// checked drifts, and the first sign is a key or someone's notes on GitHub.
export function gitignoreProblems(cfg = config()) {
  const git = (args, input) => spawnSync('git', args, { cwd: ROOT, encoding: 'utf8', input, maxBuffer: 256 * 1024 * 1024 });
  if (git(['rev-parse', '--is-inside-work-tree']).status !== 0) return [];
  if (!exists('.gitignore')) return ['.gitignore is missing: start from the starter\'s tools/starter/gitignore.project'];
  const probs = [];
  // (with the engine in .anzuelo/, only the project's own files are the project git's business: the engine's records
  // and state sit in .anzuelo/, which the project ignores as a whole)
  const mine = p => !split || kind(p) === 'project';
  cfg = { ...cfg, gitignoreMustIgnore: cfg.gitignoreMustIgnore.filter(mine), gitignoreMustKeep: cfg.gitignoreMustKeep.filter(mine) };
  const all = [...cfg.gitignoreMustIgnore, ...cfg.gitignoreMustKeep];
  const ignored = new Set((git(['check-ignore', '--no-index', '--stdin'], all.join('\n')).stdout || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean));
  // a vault the user keeps in git owns its .obsidian settings (Lesson: adopting a tracked vault failed hygiene over them)
  const ownVault = (git(['ls-files', '.obsidian']).stdout || '').trim() !== '';
  const leak = cfg.gitignoreMustIgnore.filter(p => !ignored.has(p) && !(ownVault && p.startsWith('.obsidian/')));
  if (leak.length) probs.push(`.gitignore does not cover: ${leak.join(', ')} (secrets, local state or caches would be pushed)`);
  // (the starter never ships its own hook state: that state is from working on the starter, not a project's)
  const hidden = cfg.gitignoreMustKeep.filter(p => ignored.has(p) && exists(p) && !(exists('.starter-template') && p.startsWith('tools/hooks/state/')));
  if (hidden.length) probs.push(`.gitignore hides files the project needs: ${hidden.join(', ')}`);
  // (the same exception here: a tracked vault's .obsidian settings are meant to be committed, even where .gitignore
  // lists .obsidian/ for other projects. Lesson: an adopted vault's setup failed on "already committed but meant to be
  // ignored: .obsidian/app.json", and 20 minutes went into reruns of the self-test)
  // (every private file the engine keeps, as it is on disk now, not only the sample names above: its state, caches and
  // turn notes, upgrade backups, the private word list, the machine's own settings. One that git would push, or that is
  // already committed, is named; gitignoreMustKeep is how the user chooses to share one. Lesson (the user): "make sure
  // all anzuelo files are on .gitignore unless the user wants to intentionally include it", "solid steel proof")
  // (git lists the untracked files it would add itself: a folder of thousands of files never passes through a buffer.
  // Lesson: a list of 16,000 cache files overflowed the output and read as "none ignored")
  const keep = new Set(cfg.gitignoreMustKeep), PRIVATE = ['.cache', 'tools/hooks/state', '.starter', '.private-terms', 'tools/starter.local.json', '.claude/settings.local.json', '.claude/skills', '.codex', '.gemini', '.agents'];
  const exposed = (git(['ls-files', '--others', '--exclude-standard', '--', ...PRIVATE]).stdout || '').split(/\r?\n/).map(s => s.trim())
    .filter(f => f && !keep.has(f) && !(exists('.starter-template') && f.startsWith('tools/hooks/state/')));
  if (exposed.length) probs.push(`the engine's private files would be pushed: ${exposed.slice(0, 6).join(', ')}${exposed.length > 6 ? ` +${exposed.length - 6} more` : ''} (add their folders to .gitignore; to share one on purpose, list it in "gitignoreMustKeep" in tools/hooks/config.json and un-ignore it: the folder as <folder>/* plus !<path> in .gitignore)`);
  const tracked = (git(['ls-files', '-ci', '--exclude-standard']).stdout || '').split(/\r?\n/).filter(f => f && !(ownVault && f.startsWith('.obsidian/')));
  const privTracked = (git(['ls-files', '--', ...PRIVATE]).stdout || '').split(/\r?\n/).filter(f => f && !keep.has(f) && !tracked.includes(f));
  if (privTracked.length) probs.push(`the engine's private files are committed: ${privTracked.slice(0, 6).join(', ')}${privTracked.length > 6 ? ' ...' : ''} (git rm --cached <file>, then commit; to share one on purpose, list it in "gitignoreMustKeep")`);
  if (tracked.length) probs.push(`already committed but meant to be ignored: ${tracked.slice(0, 6).join(', ')}${tracked.length > 6 ? ' ...' : ''} (git rm --cached <file>, then commit)`);
  // generated folders no project commits on purpose (dist/ and build/ are left out: some sites publish from them).
  // Lesson, trial round 13/14: an Eleventy blog's _site/ went into git, and the Pages workflow builds it anyway
  const lsAll = (git(['ls-files']).stdout || '').split(/\r?\n/);
  const built = [...new Set(lsAll.map(f => /^(?:.*\/)?(_site|\.next|\.nuxt|\.svelte-kit|\.astro|__pycache__|\.pytest_cache|node_modules|\.parcel-cache|\.turbo)\//.exec(f)?.[0]).filter(Boolean))];
  if (built.length) probs.push(`generated folders are committed: ${built.slice(0, 4).join(', ')} (add them to .gitignore, then git rm -r --cached <folder> and commit)`);
  const secretish = lsAll.filter(f => /(^|\/)\.env(\.(?!example$)[^/]+)?$|\.(pem|key|p12|pfx)$|(^|\/)id_(rsa|ed25519|ecdsa)$/i.test(f));
  if (secretish.length) probs.push(`committed files that look like secrets: ${secretish.slice(0, 6).join(', ')} (remove them from git and rotate the secrets)`);
  return probs;
}

// How far a starter copy is behind its upstream: from the refs on disk, and when they show nothing, the upstream asked
// once (ls-remote, 10 s, no fetch; nothing when offline). behind: a count, -1 when it has newer commits not yet here.
// Lesson (a field report): a plain upgrade said "nothing changed" from a copy 20 commits behind, whose refs were stale.
export function behindUpstream(dir) {
  const g = (...a) => spawnSync('git', a, { cwd: dir, encoding: 'utf8', timeout: 10000 }), o = (...a) => (g(...a).stdout || '').trim();
  const head = o('log', '-1', '--format=%h (%cs)'), up = o('rev-parse', '--abbrev-ref', '@{u}');
  let behind = up ? Number(o('rev-list', '--count', 'HEAD..@{u}')) || 0 : 0;
  if (up && !behind) {
    const [remote, ...branch] = up.split('/'), sha = o('ls-remote', remote, `refs/heads/${branch.join('/')}`).split(/\s/)[0];
    if (/^[0-9a-f]{40}$/.test(sha) && g('merge-base', '--is-ancestor', sha, 'HEAD').status !== 0) behind = Number(o('rev-list', '--count', `HEAD..${sha}`)) || -1;
  }
  return { head, up, behind };
}
