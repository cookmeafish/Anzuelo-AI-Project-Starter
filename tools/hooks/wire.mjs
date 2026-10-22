#!/usr/bin/env node
// Connect this folder to every supported agent, on this machine. Run once after cloning (new-project.mjs runs it too):
//   node tools/hooks/wire.mjs
// The rules live in AGENTS.md, the neutral file that most agents read. Agent-specific files are made here and kept out
// of git, so the repository names no vendor: CLAUDE.md (a copy of AGENTS.md; the hooks keep the two in sync),
// .claude/settings.json (Claude Code's hooks), the .claude/skills
// mirrors, .codex/hooks.json (Codex needs this folder's real path), the git hooks (core.hooksPath) and Obsidian's
// link settings. Existing files are merged or kept, never replaced.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export function wire(dir, { dry = false } = {}) {
  const log = [], at = (...p) => path.join(dir, ...p), write = (p, text) => { if (!dry) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); } };
  // Which agents to wire on this project: "wireAgents" in tools/hooks/config.json (default: all). Lesson: a Codex-only
  // user got CLAUDE.md and .claude/ back on every upgrade, with no way to say no.
  let agents = ['claude', 'codex', 'gemini'];
  try { const w = JSON.parse(fs.readFileSync(at('tools', 'hooks', 'config.json'), 'utf8')).wireAgents; if (Array.isArray(w)) agents = w.map(String); } catch { }
  const on = a => agents.includes(a);
  // CLAUDE.md: Claude Code reads only this name. It starts as a copy of AGENTS.md; the hooks keep the twins in sync.
  if (on('claude') && !fs.existsSync(at('CLAUDE.md')) && fs.existsSync(at('AGENTS.md'))) { write(at('CLAUDE.md'), fs.readFileSync(at('AGENTS.md'), 'utf8')); log.push('created  CLAUDE.md (a copy of AGENTS.md for Claude Code)'); }
  // Claude Code's hooks: merged into any settings the folder already has
  const sp = at('.claude', 'settings.json');
  let mine = {};
  if (on('claude') && fs.existsSync(sp)) { try { mine = JSON.parse(fs.readFileSync(sp, 'utf8')); } catch (e) { throw new Error(`${sp} does not parse (${e.message}); fix it, then run wire again`); } }
  // Claude Code expands $CLAUDE_PROJECT_DIR itself, so its wiring is the same on every machine
  const cc = (cmd, timeout, extra = {}) => [{ ...extra, hooks: [{ type: 'command', command: `node "$CLAUDE_PROJECT_DIR/tools/hooks/hooks.mjs" ${cmd}`, timeout }] }];
  // (the tools that schedule a prompt back into the session, too: their prompt is noted, and a headless run gets no
  // fallback wakeup. Lesson: a wakeup left pending kept a headless run alive until its time limit killed it.)
  const theirs = { hooks: { SessionStart: cc('session', 60), UserPromptSubmit: cc('prompt', 30), PreToolUse: cc('pretool', 30, { matcher: 'Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell|Read|Agent|Task|mcp__.*|ScheduleWakeup|CronCreate|.*(Wake|Schedule|Remind|Alarm|Timer).*' }),
    PostToolUse: cc('posttool', 30, { matcher: 'Write|Edit|MultiEdit' }), Stop: cc('stop', 300) } };
  const before = JSON.stringify(mine);
  mine.includeCoAuthoredBy = false;
  mine.attribution = { commit: '', pr: '' };
  mine.hooks ||= {};
  if (on('claude')) for (const [ev, v] of Object.entries(theirs.hooks)) {
    if (!JSON.stringify(mine.hooks[ev] || []).includes('hooks.mjs')) { mine.hooks[ev] = [...(mine.hooks[ev] || []), ...v]; log.push(`wired    ${ev} hook (Claude Code)`); }
    else if (ev === 'PreToolUse') mine.hooks[ev] = mine.hooks[ev].map(m => JSON.stringify(m).includes('hooks.mjs') ? { ...m, matcher: v[0].matcher } : m);
  }
  if (on('claude') && JSON.stringify(mine) !== before) write(sp, JSON.stringify(mine, null, 2) + '\n');
  // Codex can't expand a project variable in hook commands, so its wiring carries this folder's real path.
  const hp = at('tools', 'hooks', 'hooks.mjs').split(path.sep).join('/');
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
  if (on('gemini') && gem && !JSON.stringify(gem.context?.fileName || gem.contextFileName || '').includes('AGENTS.md')) {
    gem.context = { ...(gem.context || {}), fileName: [...new Set(['AGENTS.md', ...[].concat(gem.context?.fileName || gem.contextFileName || 'GEMINI.md')])] };
    write(gp, JSON.stringify(gem, null, 2) + '\n'); log.push('wired    .gemini/settings.json (Gemini CLI reads AGENTS.md)');
  }
  // git checks commits and pushes for every agent and for manual git use
  // A project's own git hooks (another hooks folder, or real hooks in .git/hooks) are never switched off: pointing git at
  // .githooks would silently disable them. Then the starter's checks are offered to chain in, not forced.
  const hooksPath = fs.existsSync(at('.git')) ? (spawnSync('git', ['config', 'core.hooksPath'], { cwd: dir, encoding: 'utf8' }).stdout || '').trim() : null;
  const ownHooks = hooksPath === '' && fs.existsSync(at('.git', 'hooks')) && fs.readdirSync(at('.git', 'hooks')).some(n => !n.endsWith('.sample'));
  if (hooksPath !== null && hooksPath !== '.githooks') {
    if (hooksPath || ownHooks) log.push(`kept     your git hooks (${hooksPath || '.git/hooks'}). To add the starter's checks (AI attribution, secrets, .gitignore), call .githooks/pre-commit, commit-msg and pre-push from yours.`);
    else {
      if (!dry) spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: dir });
      log.push('git      core.hooksPath = .githooks (commits and pushes are checked for AI attribution, secrets and .gitignore)');
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
      const mine = ['tools/', 'skills/', '.claude/', '.agents/', '.codex/', '.gemini/', '.githooks/', '.starter/', 'docs/checks/', 'docs/playbooks/'];
      const have = Array.isArray(app.userIgnoreFilters) ? app.userIgnoreFilters : [], add = mine.filter(m => !have.includes(m));
      if (add.length) { log.push(`updated  .obsidian/app.json (the engine's folders hidden from the vault's search and graph: ${add.length})`); if (!dry) write(op, JSON.stringify({ ...app, userIgnoreFilters: [...have, ...add] }, null, 2) + '\n'); }
    } catch { }
  }
  if (!fs.existsSync(at('.obsidian'))) { write(at('.obsidian', 'app.json'), JSON.stringify({ useMarkdownLinks: true, newLinkFormat: 'relative', alwaysUpdateLinks: true }, null, 2) + '\n'); log.push('created  .obsidian/app.json (Obsidian: markdown links, relative paths)'); }
  // the generated skill mirrors and DIRECTORY.md
  if (!dry && fs.existsSync(at('tools', 'hooks', 'hooks.mjs'))) spawnSync(process.execPath, [at('tools', 'hooks', 'hooks.mjs'), 'sync'], { cwd: dir, encoding: 'utf8' });
  return log;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.resolve(HERE, '..', '..');
  try { const log = wire(dir); console.log(log.length ? log.join('\n') : 'wire: everything was already connected'); console.log('wire: this folder works with Claude Code, Codex, Gemini CLI and any agent that reads AGENTS.md'); }
  catch (e) { console.error(`wire: ${e.message}`); process.exit(1); }
}
