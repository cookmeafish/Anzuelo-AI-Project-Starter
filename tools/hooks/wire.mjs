#!/usr/bin/env node
// Connect this folder to every supported agent, on this machine. Run once after cloning (new-project.mjs runs it too):
//   node tools/hooks/wire.mjs
// The rules live in AGENTS.md, the neutral file that most agents read. Agent-specific files are made here and kept out
// of git, so the repository names no vendor: CLAUDE.md (a copy of AGENTS.md; the hooks keep the two in sync),
// .claude/settings.json (Claude Code's hooks), the .claude/skills
// mirrors, .codex/hooks.json (Codex needs this folder's real path), the git hooks (core.hooksPath) and Obsidian's
// link settings. Existing files are merged or kept, never replaced.
import './hidewin.mjs'; // child processes start hidden (no console windows)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { roots, resolver } from './paths.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const GITIGNORE_MARK = '# The project engine and its wiring (made on each machine, never committed)';
// (the skill folders are not in it whole: a project's own new skill there must show in git. Each engine skill copy is
// listed on its own by the mirror sync (hooks-main.mjs excludeCopies). Lesson (oversight, 2026-11-13): a project with
// its own skill under .claude/skills/ would have had every new skill hidden from git)
export const GITIGNORE_BLOCK = `${GITIGNORE_MARK}\n.anzuelo/\nCLAUDE.local.md\n.claude/settings.local.json\n.codex/hooks.json\n`;
const WHOLE_SKILL_DIRS = /^(\.claude\/skills\/|\.agents\/skills\/)\r?\n/gm;

const HOOK_FILES = ['pre-commit', 'commit-msg', 'pre-push'];
// The script files a hook command runs: a quoted path, or a bare word, ending in a script extension ("$CLAUDE_PROJECT_DIR/"
// read as the project folder). "python own_check.py" runs own_check.py, never "python own_check.py".
export const scriptsIn = cmd => [...String(cmd || '').matchAll(/"([^"]+\.(?:mjs|cjs|js|py|sh|ps1))"|(?:^|\s)([^\s"]+\.(?:mjs|cjs|js|py|sh|ps1))(?=\s|$)/g)]
  .map(m => (m[1] ?? m[2]).replace(/^\$CLAUDE_PROJECT_DIR[\\/]/, ''));
const gitHooksDir = (dir, hp) => path.resolve(dir, hp);
const hasHooks = d => HOOK_FILES.some(f => fs.existsSync(path.join(d, f)));
// What is broken in this folder's wiring: git's hooks path at a folder that is gone or holds no hooks (commits then run
// without the AI-credit and secret checks), and agent settings whose hook or status-line command runs a file that is
// not there. Read at every session start and by the upgrade probe. Lesson (two field reports): a rolled-back move left
// git's hooks path at a deleted folder, and nothing said so, so commits went unchecked.
export function wiringProblems(dir) {
  const out = [], at = (...p) => path.join(dir, ...p);
  if (fs.existsSync(at('.git'))) {
    const hp = (spawnSync('git', ['config', 'core.hooksPath'], { cwd: dir, encoding: 'utf8' }).stdout || '').trim();
    if (hp && !(fs.existsSync(gitHooksDir(dir, hp)) && hasHooks(gitHooksDir(dir, hp))))
      out.push(`git's hooks path "${hp}" ${fs.existsSync(gitHooksDir(dir, hp)) ? 'holds no hook scripts' : 'points at a folder that does not exist'}, so commits run without the AI-credit and secret checks`);
  }
  for (const f of ['.claude/settings.json', '.claude/settings.local.json', '.codex/hooks.json']) {
    let j; try { j = JSON.parse(fs.readFileSync(at(f), 'utf8')); } catch { continue; }
    const cmds = [...Object.values(j.hooks || {}).flat().flatMap(g => [].concat(g?.hooks || [])).map(h => h?.command), j.statusLine?.command].filter(c => typeof c === 'string');
    for (const p of cmds.flatMap(scriptsIn)) if (!fs.existsSync(path.isAbsolute(p) ? p : at(p))) out.push(`${f} runs ${p}, which does not exist`);
  }
  return [...new Set(out)];
}

export function wire(dir, { dry = false } = {}) {
  // (engine files (the hooks, the shared rules, settings) are found where paths.mjs says, for this folder's layout)
  // With the engine in .anzuelo/engine (split), every file made here is one the project's git ignores: the hooks go
  // in .claude/settings.local.json, the rules come in through CLAUDE.local.md, and .gitignore gets one block, once.
  // A project's own .claude/settings.json is never touched. Plan: engine outside the project, Task 3.
  const eh = path.join(dir, '.anzuelo', 'engine', 'tools', 'hooks'), split = fs.existsSync(eh), { where } = resolver(split ? roots(eh, {}) : { ENGINE: dir, PROJECT: dir, LOCAL: dir });
  const log = [], at = (...p) => path.join(dir, ...p), eng = (...p) => where(path.join(...p)), write = (p, text) => { if (!dry) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); } };
  const HOOKS_REL = split ? '.anzuelo/engine/tools/hooks/hooks.mjs' : 'tools/hooks/hooks.mjs', GITHOOKS = split ? '.anzuelo/engine/.githooks' : '.githooks';
  // (in git's own exclude file; .gitignore only if agreed at install ("gitignore": true) or already there. 2026-11-12)
  if (split) {
    const gi = at('.gitignore'), have = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
    let agreed = false; try { agreed = JSON.parse(fs.readFileSync(eng('tools', 'hooks', 'config.json'), 'utf8')).gitignore === true; } catch { }
    const ex = (spawnSync('git', ['rev-parse', '--git-path', 'info/exclude'], { cwd: dir, encoding: 'utf8' }).stdout || '').trim();
    const target = agreed || have.includes(GITIGNORE_MARK) || !ex ? gi : path.resolve(dir, ex), now = target === gi ? have : (() => { try { return fs.readFileSync(target, 'utf8'); } catch { return ''; } })();
    if (!now.includes(GITIGNORE_MARK)) { write(target, `${now}${now && !now.endsWith('\n') ? '\n' : ''}${now ? '\n' : ''}${GITIGNORE_BLOCK}`); log.push(`updated  ${target === gi ? '.gitignore' : "git's local exclude file"} (the engine and its wiring stay out of git)`); }
    // (an earlier install's block hid the skill folders whole: narrowed to the engine's own copies, listed one by one)
    else { const i = now.indexOf(GITIGNORE_MARK), head = now.slice(0, i), blk = now.slice(i).split(/\n(?=\s*\n)/)[0], rest = now.slice(i + blk.length);
      if (WHOLE_SKILL_DIRS.test(blk)) { write(target, head + blk.replace(WHOLE_SKILL_DIRS, '') + rest); log.push(`updated  ${target === gi ? '.gitignore' : "git's local exclude file"} (the skill folders no longer hidden whole; the engine's copies are listed one by one)`); } WHOLE_SKILL_DIRS.lastIndex = 0; }
  }
  // Which agents to wire on this project: "wireAgents" in tools/hooks/config.json (default: all). Lesson: a Codex-only
  // user got CLAUDE.md and .claude/ back on every upgrade, with no way to say no.
  let agents = ['claude', 'codex', 'gemini'];
  try { const w = JSON.parse(fs.readFileSync(eng('tools', 'hooks', 'config.json'), 'utf8')).wireAgents; if (Array.isArray(w)) agents = w.map(String); } catch { }
  const on = a => agents.includes(a);
  // CLAUDE.md: Claude Code reads only this name. It starts as a copy of AGENTS.md; the hooks keep the twins in sync.
  // (split: CLAUDE.local.md imports the rules, so nothing is copied: the project's local copy when it changed them, as
  // the hooks read it (local wins), else the engine's)
  if (split && on('claude')) {
    const text = `@.anzuelo/${fs.existsSync(path.join(dir, '.anzuelo', 'local', 'AGENTS.md')) ? 'local' : 'engine'}/AGENTS.md\n`;
    // (a CLAUDE.local.md the user already has keeps every line: only the engine's import line is added, or switched
    // between engine and local. Lesson (a review of a large app, 2026-11-13): an existing file was replaced whole)
    const had = fs.existsSync(at('CLAUDE.local.md')) ? fs.readFileSync(at('CLAUDE.local.md'), 'utf8') : null, IMPORT = /^@\.anzuelo\/(?:engine|local)\/AGENTS\.md\r?$/m;
    const next = had === null ? text : IMPORT.test(had) ? had.replace(IMPORT, text.trim()) : `${text}${had.startsWith('\n') ? '' : '\n'}${had}`;
    if (next !== had) { write(at('CLAUDE.local.md'), next); log.push(`${had === null ? 'wrote   ' : 'updated '} CLAUDE.local.md (Claude Code reads the engine's rules from here${had === null ? '' : '; your own lines kept'}; it may ask once to allow the import)`); }
  } else if (on('claude') && !fs.existsSync(at('CLAUDE.md')) && fs.existsSync(eng('AGENTS.md'))) { write(at('CLAUDE.md'), fs.readFileSync(eng('AGENTS.md'), 'utf8')); log.push('created  CLAUDE.md (a copy of AGENTS.md for Claude Code)'); }
  // Claude Code's hooks: merged into any settings the folder already has
  const sp = at('.claude', split ? 'settings.local.json' : 'settings.json');
  let mine = {};
  if (on('claude') && fs.existsSync(sp)) { try { mine = JSON.parse(fs.readFileSync(sp, 'utf8')); } catch (e) { throw new Error(`${sp} does not parse (${e.message}); fix it, then run wire again`); } }
  // Claude Code expands $CLAUDE_PROJECT_DIR itself, so its wiring is the same on every machine
  const cc = (cmd, timeout, extra = {}) => [{ ...extra, hooks: [{ type: 'command', command: `node "$CLAUDE_PROJECT_DIR/${HOOKS_REL}" ${cmd}`, timeout }] }];
  // (the tools that schedule a prompt back into the session, too: their prompt is noted, and a headless run gets no
  // fallback wakeup. Lesson: a wakeup left pending kept a headless run alive until its time limit killed it.)
  const theirs = { hooks: { SessionStart: cc('session', 60), UserPromptSubmit: cc('prompt', 30), PreToolUse: cc('pretool', 30, { matcher: 'Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell|Read|Skill|Agent|Task|SubagentHandback|mcp__.*|ScheduleWakeup|CronCreate|.*(Wake|Schedule|Remind|Alarm|Timer).*' }),
    PostToolUse: cc('posttool', 30, { matcher: 'Write|Edit|MultiEdit' }), Stop: cc('stop', 300), SubagentStop: cc('subagentstop', 60) } };
  const before = JSON.stringify(mine);
  mine.includeCoAuthoredBy = false;
  mine.attribution = { commit: '', pr: '' };
  mine.hooks ||= {};
  // (split: a status line left on the in-project engine path moves to the engine's. Lesson (a field report): it kept
  // running a file the move had removed)
  const SL = /(?<!engine[\\/])tools[\\/]hooks[\\/]statusline\.mjs/;
  if (split && typeof mine.statusLine?.command === 'string' && SL.test(mine.statusLine.command)) { mine.statusLine = { ...mine.statusLine, command: mine.statusLine.command.replace(SL, '.anzuelo/engine/tools/hooks/statusline.mjs') }; log.push('repointed the status line at .anzuelo/engine'); }
  if (on('claude')) for (const [ev, v] of Object.entries(theirs.hooks)) {
    if (!JSON.stringify(mine.hooks[ev] || []).includes('hooks.mjs')) { mine.hooks[ev] = [...(mine.hooks[ev] || []), ...v]; log.push(`wired    ${ev} hook (Claude Code)`); }
    else if (ev === 'PreToolUse') mine.hooks[ev] = mine.hooks[ev].map(m => JSON.stringify(m).includes('hooks.mjs') ? { ...m, matcher: v[0].matcher } : m);
  }
  if (on('claude') && JSON.stringify(mine) !== before) write(sp, JSON.stringify(mine, null, 2) + '\n');
  // Codex can't expand a project variable in hook commands, so its wiring carries this folder's real path.
  const hp = at(...HOOKS_REL.split('/')).split(path.sep).join('/');
  const ev = (cmd, extra = {}) => [{ ...extra, hooks: [{ type: 'command', command: `node "${hp}" ${cmd}`, timeout: cmd === 'stop' ? 300 : 30 }] }];
  const codex = JSON.stringify({ hooks: { SessionStart: ev('session'), UserPromptSubmit: ev('prompt'), PreToolUse: ev('pretool', { matcher: 'apply_patch|Write|Edit|MultiEdit|Bash|PowerShell|Read|Agent|Task|mcp__.*' }), PostToolUse: ev('posttool', { matcher: 'apply_patch|Write|Edit|MultiEdit' }), Stop: ev('stop') } }, null, 2) + '\n';
  const cp = at('.codex', 'hooks.json');
  if (!on('codex')) { /* not wired for Codex on this project (wireAgents) */ }
  else if (fs.existsSync(cp) && !fs.readFileSync(cp, 'utf8').includes('hooks.mjs')) log.push('kept     .codex/hooks.json (exists; add the hooks.mjs entries by hand)');
  // Codex runs project hooks only after they are trusted, and asks again whenever the file changes.
  else {
    // the project's own hook commands in the file stay: only the engine's entries are replaced (Lesson: an adopted project
    // with its own hook engine lost every one of its Codex hooks the second time wire ran)
    // A group that runs both the engine and a project command keeps the project's command (only the engine's entry goes),
    // and a file that does not parse is left alone, never replaced. Lesson: a mixed group, or one stray comma, lost every
    // project hook in the file.
    let merged = codex;
    if (fs.existsSync(cp)) {
      let old; try { old = JSON.parse(fs.readFileSync(cp, 'utf8')); } catch (e) { throw new Error(`${cp} does not parse (${e.message}); fix it, then run wire again`); }
      const mine = JSON.parse(codex);
      for (const [e, groups] of Object.entries(old.hooks || {})) {
        const keep = [].concat(groups || []).flatMap(g => {
          if (!JSON.stringify(g).includes('hooks.mjs')) return [g];
          const rest = Array.isArray(g?.hooks) ? g.hooks.filter(h => !JSON.stringify(h).includes('hooks.mjs')) : [];
          return rest.length ? [{ ...g, hooks: rest }] : [];
        });
        if (keep.length) mine.hooks[e] = [...keep, ...(mine.hooks[e] || [])];
      }
      for (const [k, v] of Object.entries(old)) if (k !== 'hooks') mine[k] = v;
      merged = JSON.stringify(mine, null, 2) + '\n';
    }
    if (!fs.existsSync(cp) || fs.readFileSync(cp, 'utf8') !== merged) { log.push(`${fs.existsSync(cp) ? 'updated' : 'created'}  .codex/hooks.json (Codex: run /hooks in Codex once to trust them; it asks again after a change)`); write(cp, merged); }
  }
  // Gemini CLI reads GEMINI.md unless told otherwise: point it at AGENTS.md (merged into any settings it has).
  // Its hooks are not wired: their input format isn't documented. A Gemini agent runs hooks.mjs begin / check by hand.
  const gp = at('.gemini', 'settings.json');
  let gem = {}; if (fs.existsSync(gp)) { try { gem = JSON.parse(fs.readFileSync(gp, 'utf8')); } catch { gem = null; } }
  // (split: Gemini reads context files by name, and the rules sit in .anzuelo/engine; a Gemini agent runs begin / check)
  if (!split && on('gemini') && gem &&!JSON.stringify(gem.context?.fileName || gem.contextFileName || '').includes('AGENTS.md')) {
    gem.context = { ...(gem.context || {}), fileName: [...new Set(['AGENTS.md', ...[].concat(gem.context?.fileName || gem.contextFileName || 'GEMINI.md')])] };
    write(gp, JSON.stringify(gem, null, 2) + '\n'); log.push('wired    .gemini/settings.json (Gemini CLI reads AGENTS.md)');
  }
  // git checks commits and pushes for every agent and for manual git use
  // A project's own git hooks (another hooks folder, or real hooks in .git/hooks) are never switched off: pointing git at
  // .githooks would silently disable them. Then the starter's checks are offered to chain in, not forced.
  // (a hooks path at a folder that is gone, or holds no hooks, is no one's hooks: it is repaired; and git is pointed only
  // at a folder that exists and holds the hook files. Lesson (two field reports): a rolled-back move left the path at a
  // deleted folder, and commits ran unchecked)
  let hooksPath = fs.existsSync(at('.git')) ? (spawnSync('git', ['config', 'core.hooksPath'], { cwd: dir, encoding: 'utf8' }).stdout || '').trim() : null;
  if (hooksPath && !hasHooks(gitHooksDir(dir, hooksPath))) {
    if (!dry) spawnSync('git', ['config', '--unset', 'core.hooksPath'], { cwd: dir });
    log.push(`repaired git's hooks path (it pointed at ${hooksPath}, which has no hook scripts)`); hooksPath = '';
  }
  // (a hook manager the project declares is its own hooks too, installed or not yet: lefthook, husky, pre-commit,
  // simple-git-hooks. Lesson (an adoption trial, 2026-11-12): a fresh clone of a lefthook project had only sample hooks,
  // the path was taken, and lefthook's checks would never run)
  const pkg = (() => { try { return fs.readFileSync(at('package.json'), 'utf8'); } catch { return ''; } })();
  const manager = ['lefthook.yml', 'lefthook.yaml', '.lefthook.yml', 'lefthook.json', '.husky', '.pre-commit-config.yaml'].find(f => fs.existsSync(at(f)))
    || (/"(simple-git-hooks|husky|lefthook)"\s*:/.test(pkg) ? 'package.json' : '');
  const ownHooks = hooksPath === '' && (!!manager || (fs.existsSync(at('.git', 'hooks')) && fs.readdirSync(at('.git', 'hooks')).some(n => !n.endsWith('.sample'))));
  if (hooksPath !== null && hooksPath !== GITHOOKS) {
    if ((hooksPath && hooksPath !== '.githooks') || ownHooks) log.push(`kept     your git hooks (${hooksPath || '.git/hooks'}). To add the starter's checks (AI attribution, secrets, .gitignore), call .githooks/pre-commit, commit-msg and pre-push from yours.`);
    else if (!hasHooks(at(GITHOOKS))) log.push(`not set  git's hooks path: ${GITHOOKS} holds no hook scripts here`);
    // (a repository with git LFS set up, or with worktrees, keeps git's hooks path as it is: a relative path leaves the
    // worktrees unchecked, and LFS would put its hooks into the engine's folder, which then refuses upgrades. The agent's
    // commits are still checked by the in-session guard. Lesson (a review of a large app, 2026-11-13))
    // (the repository's own LFS: its local config, its lfs folder or a filter=lfs line; Git for Windows turns LFS
    // filters on for the whole system, which says nothing about this repository)
    else if (split && (/filter\.lfs\./.test(spawnSync('git', ['config', '--local', '--get-regexp', '^filter\\.lfs\\.'], { cwd: dir, encoding: 'utf8' }).stdout || '')
      || fs.existsSync(path.join(dir, '.git', 'lfs')) || /filter=lfs/.test((() => { try { return fs.readFileSync(at('.gitattributes'), 'utf8'); } catch { return ''; } })())
      || (spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: dir, encoding: 'utf8' }).stdout || '').split(/\n(?=worktree )/).length > 1))
      log.push('not set  git\'s hooks path: this repository uses git LFS or worktrees, so it stays as it is; the agent\'s commits are checked by the in-session guard');
    else {
      if (!dry) spawnSync('git', ['config', 'core.hooksPath', GITHOOKS], { cwd: dir });
      log.push(`git      core.hooksPath = ${GITHOOKS} (commits and pushes are checked for AI attribution, secrets and .gitignore)`);
    }
  }
  // Obsidian (obsidian skill): new links are relative markdown links, which GitHub and every agent follow too
  // A vault the user already had keeps its notes in front: the engine's own folders are hidden from its search, graph
  // and quick switcher (Obsidian's "Excluded files"), added to whatever the user excludes already.
  // Lesson: adopting a vault put 72 engine files among the user's notes.
  const op = at('.obsidian', 'app.json');
  const ENGINE_APP = ['alwaysUpdateLinks', 'newLinkFormat', 'useMarkdownLinks'];
  if (fs.existsSync(op)) {
    try {
      const app = JSON.parse(fs.readFileSync(op, 'utf8'));
      const users = fs.readdirSync(at('.obsidian')).some(f => f !== 'app.json') || JSON.stringify(Object.keys(app).filter(k => k !== 'userIgnoreFilters').sort()) !== JSON.stringify(ENGINE_APP);
      if (!users) throw 0;
      let mine = ['tools/', 'skills/', '.claude/', '.agents/', '.codex/', '.gemini/', '.githooks/', '.starter/', 'docs/checks/', 'docs/playbooks/'];
      // A vault that was there before the starter came (.starter/original-files.txt lists its .obsidian/) also hides the
      // engine's records, rule files and work folders, so the vault shows only the user's notes. Anything the user
      // already had under one of those names stays visible; for docs/, then only the engine's own docs are hidden.
      // Lesson: an adopted vault showed AGENTS.md, CLAUDE.md, DIRECTORY.md, HOW-TO-USE.md, README.md, docs/, inbox/,
      // outputs/ and sources/ among the user's notes, and they topped its search and related-note suggestions.
      const orig = (() => { try { return fs.readFileSync(eng('.starter', 'original-files.txt'), 'utf8').split(/\r?\n/).filter(Boolean); } catch { return []; } })();
      if (orig.some(f => f.startsWith('.obsidian/'))) {
        const users = e => orig.some(f => e.endsWith('/') ? f.startsWith(e) : f === e);
        const ROOT_FILES = ['AGENTS.md', 'CLAUDE.md', 'DIRECTORY.md', 'HOW-TO-USE.md', 'README.md', 'SETUP-PROMPT.md', 'AGENTS.starter.md', 'CLAUDE.starter.md', 'README.starter.md'];
        const DOCS = ['docs/plans/', 'docs/reviews/', 'docs/specs/', 'docs/releases/', 'docs/knowledge/', 'docs/feedback-inbox/', 'docs/BRIEF.md', 'docs/STATUS.md', 'docs/CHANGELOG.md',
          'docs/DECISIONS.md', 'docs/MENU.md', 'docs/security.md', 'docs/foundation.md', 'docs/glossary.md', 'docs/lessons.md', 'docs/recommended-tools.md', 'docs/fit-checklist.md', 'docs/starter-feedback.md', 'docs/names.json'];
        const more = [...ROOT_FILES, ...(users('docs/') ? DOCS : ['docs/']), 'inbox/', 'outputs/', 'sources/'];
        mine = [...mine.filter(m => !(users('docs/') ? false : /^docs\//.test(m))), ...more].filter(m => !users(m));
      }
      const have = Array.isArray(app.userIgnoreFilters) ? app.userIgnoreFilters : [], add = mine.filter(m => !have.includes(m));
      if (add.length) { log.push(`updated  .obsidian/app.json (the engine's folders hidden from the vault's search and graph: ${add.length})`); if (!dry) write(op, JSON.stringify({ ...app, userIgnoreFilters: [...have, ...add] }, null, 2) + '\n'); }
    } catch { }
  }
  // (split: a vault setting would be a new project file; only a vault the project already has is adjusted)
  if (!split && !fs.existsSync(at('.obsidian'))) { write(at('.obsidian', 'app.json'), JSON.stringify({ useMarkdownLinks: true, newLinkFormat: 'relative', alwaysUpdateLinks: true }, null, 2) + '\n'); log.push('created  .obsidian/app.json (Obsidian: markdown links, relative paths)'); }
  // the generated skill mirrors and DIRECTORY.md
  if (!dry && fs.existsSync(eng('tools', 'hooks', 'hooks.mjs'))) spawnSync(process.execPath, [eng('tools', 'hooks', 'hooks.mjs'), 'sync'], { cwd: dir, encoding: 'utf8' });
  return log;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = roots(HERE, {}).PROJECT;
  // --check: list what is broken in the wiring, change nothing (exit 1 when something is)
  if (process.argv.includes('--check')) { const p = wiringProblems(dir); console.log(p.length ? p.map(x => `broken   ${x}`).join('\n') : 'wire: the wiring is sound'); process.exit(p.length ? 1 : 0); }
  try { const log = wire(dir); console.log(log.length ? log.join('\n') : 'wire: everything was already connected'); console.log('wire: this folder works with Claude Code, Codex, Gemini CLI and any agent that reads AGENTS.md'); }
  catch (e) { console.error(`wire: ${e.message}`); process.exit(1); }
}
