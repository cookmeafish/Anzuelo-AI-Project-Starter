#!/usr/bin/env node
// Git-level guard (REQ: no-ai-attribution), so the rule holds for every agent and for manual commits too.
// Wired by .githooks/commit-msg and .githooks/pre-push. Enable once per clone: git config core.hooksPath .githooks
//   node tools/hooks/git-guard.mjs commit-msg <message-file>   reject a message that credits an AI
//   node tools/hooks/git-guard.mjs pre-commit                  reject staged secrets and reserved-name files
//   node tools/hooks/git-guard.mjs pre-push                    reject a push while unpushed commits credit an AI,
//                                                              or while .gitignore lets private files out
//   node tools/hooks/git-guard.mjs scan                        list unpushed commits that credit an AI
import fs from 'node:fs';
import { config, aiAttributedCommits, gitignoreProblems, secretHit } from './hooks.mjs';

const cfg = config();
const [mode, file] = process.argv.slice(2);
const attribution = new RegExp(cfg.aiAttribution, 'i');

if (mode === 'commit-msg') {
  const msg = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => !l.startsWith('#')).join('\n');
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
  return fs.existsSync(new URL(`./state/turn.${sid}.json`, import.meta.url)) ? null : sid;
}
const UNSEEN = (what, sid) => `${what} rejected (engine-bypassed): this comes from a Claude Code session (${sid.slice(0, 8)}) that this project's hooks have never seen: it was started in another folder, so none of the project's rules, runbooks or checks ran on its work.\n` +
  `Run node tools/hooks/hooks.mjs begin "<the user's request>" in this project first (it records the request for this session and prints the routing and checks), and node tools/hooks/hooks.mjs check --answer-file .cache/answer.md before answering. Or start the session in this project's folder.`;

if (mode === 'pre-commit') {
  { const sid = unseenSession(); if (sid) { console.error(UNSEEN('commit', sid)); process.exit(1); } }
  // REQ: no-secrets and stray files, enforced by git itself for every agent and for manual commits
  const { spawnSync } = await import('node:child_process');
  const git = (...a) => spawnSync('git', a, { encoding: 'utf8' }).stdout || '';
  const added = git('diff', '--cached', '-U0').split('\n').filter(l => l.startsWith('+') && !l.startsWith('+++')).join('\n');
  const hit = secretHit(added, cfg);
  if (hit) { console.error(`commit rejected (no-secrets): staged changes contain something that looks like a secret (pattern ${hit}). Move it to an ignored file such as .env.`); process.exit(1); }
  const stray = git('diff', '--cached', '--name-only', '--diff-filter=A').split(/\r?\n/).filter(f => /(^|\/)(nul|con|aux|prn|com\d|lpt\d)(\.[a-z0-9]+)?$/i.test(f));
  if (stray.length) { console.error(`commit rejected (shell-hygiene): Windows reserved-name files staged: ${stray.join(', ')}. Delete them; they come from "> nul" in Bash.`); process.exit(1); }
  process.exit(0);
}
if (mode === 'pre-push' || mode === 'scan') {
  if (mode === 'pre-push') { const sid = unseenSession(); if (sid) { console.error(UNSEEN('push', sid)); process.exit(1); } }
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
