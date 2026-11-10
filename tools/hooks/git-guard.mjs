#!/usr/bin/env node
// Git-level guard (REQ: no-ai-attribution), so the rule holds for every agent and for manual commits too.
// Wired by .githooks/commit-msg and .githooks/pre-push. Enable once per clone: git config core.hooksPath .githooks
//   node tools/hooks/git-guard.mjs commit-msg <message-file>   reject a message that credits an AI
//   node tools/hooks/git-guard.mjs pre-commit                  reject staged secrets and reserved-name files
//   node tools/hooks/git-guard.mjs pre-push                    reject a push while unpushed commits credit an AI,
//                                                              or while .gitignore lets private files out
//   node tools/hooks/git-guard.mjs scan                        list unpushed commits that credit an AI
import fs from 'node:fs';
import { config, secretHit, forbiddenRe } from './settings.mjs';
import { fileURLToPath } from 'node:url';
import { aiAttributedCommits, gitignoreProblems } from './repo.mjs';
import { proofCovers, PROOF_FILE } from './selftest-cache.mjs';

const cfg = config();
const [mode, file] = process.argv.slice(2);
const attribution = new RegExp(cfg.aiAttribution, 'i');
// REQ: forbidden-terms, for commits too: a name the user asked to keep out of the project never enters git history,
// by message or by staged lines, whoever commits. The rejection never repeats the name. Lesson (a trial): the edit
// hooks kept the name out of files, while a commit message or a hand-staged line could still carry it.
const forbidHit = s => !!forbiddenRe(cfg)?.test(s);
const FORBID_MSG = 'commit rejected (forbidden-terms): it contains a name the user asked to keep out of the project. Replace it with a neutral word, then commit again.';

if (mode === 'commit-msg') {
  const msg = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => !l.startsWith('#')).join('\n');
  if (forbidHit(msg)) { console.error(FORBID_MSG); process.exit(1); }
  if (attribution.test(msg)) {
    console.error('commit rejected (no-ai-attribution): the message credits an AI agent. Commits are solely the user\'s.');
    console.error('Remove co-author trailers, "generated with" lines, AI emails and robot emoji, then commit again.');
    process.exit(1);
  }
  const ident = `${process.env.GIT_AUTHOR_NAME || ''} ${process.env.GIT_AUTHOR_EMAIL || ''}`;
  if (new RegExp(cfg.aiAuthor, 'i').test(ident)) {
    console.error(`commit rejected (no-ai-attribution): the author identity "${ident.trim()}" is an AI. Use the user's own git identity.`);
    process.exit(1);
  }
  process.exit(0);
}
// REQ: engine-bypassed. A commit or push from a Claude Code session that this project's hooks never saw: the session was
// started in another folder, so none of the project's rules ran on its work. Claude Code marks its shells (CLAUDECODE,
// CLAUDE_CODE_SESSION_ID); a person committing by hand is never asked. Test harnesses turn it off for their sample
// projects (ANZUELO_SESSION_GATE=off). Lesson: the starter's own engine work was done for days from a session started
// in a parent folder, and none of its runbooks, checks or lessons applied to it.
function unseenSession() {
  const sid = String(process.env.CLAUDE_CODE_SESSION_ID || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  if (process.env.CLAUDECODE !== '1' || !sid || process.env.ANZUELO_SESSION_GATE === 'off') return null;
  // (engine v2 keeps its turn in v2-turn.<sid>.json. Lesson: under v2 a session's begin and prompt hooks wrote only
  // that file, so every commit from a session started under v2 was refused)
  return ['turn', 'v2-turn'].some(k => fs.existsSync(new URL(`./state/${k}.${sid}.json`, import.meta.url))) ? null : sid;
}
const UNSEEN = (what, sid) => `${what} rejected (engine-bypassed): this comes from a Claude Code session (${sid.slice(0, 8)}) that this project's hooks have never seen: it was started in another folder, so none of the project's rules, runbooks or checks ran on its work.\n` +
  `Run node tools/hooks/hooks.mjs begin "<the user's request>" in this project first (it records the request for this session and prints the routing and checks), and node tools/hooks/hooks.mjs check --answer-file .cache/answer.md before answering. Or start the session in this project's folder.`;

if (mode === 'pre-commit') {
  { const sid = unseenSession(); if (sid) { console.error(UNSEEN('commit', sid)); process.exit(1); } }
  // REQ: no-secrets and stray files, enforced by git itself for every agent and for manual commits
  const { spawnSync } = await import('node:child_process');
  const git = (...a) => spawnSync('git', a, { encoding: 'utf8' }).stdout || '';
  const added = git('diff', '--cached', '-U0').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  if (forbidHit(added)) { console.error(FORBID_MSG); process.exit(1); }
  const hit = secretHit(added, cfg);
  if (hit) { console.error(`commit rejected (no-secrets): staged changes contain something that looks like a secret (pattern ${hit}). Move it to an ignored file such as .env.`); process.exit(1); }
  const stray = git('diff', '--cached', '--name-only', '--diff-filter=A').split(/\r?\n/).filter(f => /(^|\/)(nul|con|aux|prn|com\d|lpt\d)(\.[a-z0-9]+)?$/i.test(f));
  if (stray.length) { console.error(`commit rejected (shell-hygiene): Windows reserved-name files staged: ${stray.join(', ')}. Delete them; they come from "> nul" in Bash.`); process.exit(1); }
  // REQ: req-tested. In the starter, a "REQ: <tag>" added to the engine's code in this commit is named by a test in the
  // same commit (the audit's "every REQ tag is tested", checked at commit time on the staged files). Lesson (oversight,
  // 2026-11-10): a release run lost about 35 minutes to a REQ tag with no test, which a commit could have caught.
  if (fs.existsSync(new URL('../../.starter-template', import.meta.url))) {
    const TESTS = ['tools/hooks/selfcheck.mjs', 'tools/hooks/v2/selftest.mjs', 'tools/hooks/project-scenarios.mjs', 'tools/hooks/legacy-scenarios.txt'];
    const tags = new Set(); let cur = '';
    for (const l of git('diff', '--cached', '-U0', '--', 'tools/hooks').split('\n')) {
      if (l.startsWith('+++ ')) cur = l.slice(4).replace(/^b\//, '');
      else if (l.startsWith('+') && /\.mjs$/.test(cur) && !TESTS.includes(cur)) for (const m of l.matchAll(/REQ: ([a-z0-9]+(?:-[a-z0-9]+)*)/g)) tags.add(m[1]);
    }
    if (tags.size) {
      const src = TESTS.map(f => git('show', `:${f}`)).join('\n'), miss = [...tags].filter(t => !src.includes(t));
      if (miss.length) { console.error(`commit rejected (req-tested): REQ tag${miss.length > 1 ? 's' : ''} ${miss.join(', ')} added with no test naming ${miss.length > 1 ? 'them' : 'it'}. Name the tag in its test in tools/hooks/v2/selftest.mjs or tools/hooks/selfcheck.mjs, stage it, and commit again.`); process.exit(1); }
    }
  }
  process.exit(0);
}
if (mode === 'pre-push' || mode === 'scan') {
  if (mode === 'pre-push') { const sid = unseenSession(); if (sid) { console.error(UNSEEN('push', sid)); process.exit(1); } }
  // REQ: starter-tested. The starter is pushed only when the commit pushed is the one its whole self-test passed on
  // (the proof inside that commit names it; proofCovers). Every project gets this engine. Lesson: a push ran in the
  // same command as a failing self-test run, and an engine with a failing test reached main.
  if (mode === 'pre-push' && fs.existsSync(new URL('../../.starter-template', import.meta.url)) && process.env.ANZUELO_SESSION_GATE !== 'off') {
    // (git gives each pushed ref as "<local ref> <local sha> <remote ref> <remote sha>"; a deletion pushes no commit)
    let lines = ''; try { lines = fs.readFileSync(0, 'utf8'); } catch { }
    const shas = lines.split('\n').map(l => l.trim().split(/\s+/)[1]).filter(s => s && !/^0+$/.test(s));
    const dir = fileURLToPath(new URL('../..', import.meta.url));
    for (const sha of shas) {
      const v = proofCovers(dir, sha);
      if (!v.ok) { console.error(`push rejected (starter-tested): ${v.why}. Run the whole self-test on that exact commit (a clean checkout) until it prints ALL PASS, commit the proof it writes (${PROOF_FILE}), then push.`); process.exit(1); }
    }
  }
  const bad = aiAttributedCommits(cfg);
  if (bad.length) {
    console.error(`${mode === 'scan' ? 'found' : 'push rejected'} (no-ai-attribution): unpushed commits credit an AI agent:`);
    for (const b of bad) console.error('  ' + b);
    console.error('Reword those commits (message and author) so they are solely the user\'s, then push.');
    process.exit(1);
  }
  // REQ: gitignore-ready
  const gi = mode === 'pre-push' ? gitignoreProblems(cfg) : [];
  if (gi.length) { console.error('push rejected (gitignore-ready): fix .gitignore first:'); for (const g of gi) console.error('  ' + g); process.exit(1); }
  if (mode === 'scan') console.log('no-ai-attribution: PASS');
  process.exit(0);
}
console.log('usage: git-guard.mjs commit-msg <file> | pre-commit | pre-push | scan');
process.exit(1);
