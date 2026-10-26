#!/usr/bin/env node
// Writes one attack-analysis prompt per website trial project of a round, for a security sub-agent each:
//   node tools/starter/trials/secjudge.mjs <round>
// The agent attacks a copy of the site the trial built (on 127.0.0.1 only), reads its code, and traces every gap back to
// what in the starter should have prevented it. Findings: .cache/trials/judge/<round>-sec-<id>.json.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const round = process.argv[2];
if (!round) { console.error('usage: secjudge.mjs <round>'); process.exit(1); }
const res = path.join(ROOT, '.cache/trials', `results-${round}`);
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, '.cache/trials', `round-${round}.json`), 'utf8'));
const out = path.join(ROOT, '.cache/trials/judge');
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(res).filter(f => f.endsWith('.json'))) {
  const r = JSON.parse(fs.readFileSync(path.join(res, f), 'utf8'));
  const id = r.id, sids = r.turns.map(t => t.sid).filter(Boolean);
  const scratch = path.join(os.tmpdir(), `sec-${round}-${id}`);
  const body = `# Attack analysis: ${id} (round ${round})

You are a security tester. A user asked an AI agent, working under a project starter, to build a website, and never
mentioned security. Find out which attacks the site is open to, whether the agent prevented them without being asked,
and, for every gap, why the starter's process did not catch it.

## What you have
- The project as the agent left it: ${r.dir} (READ ONLY: never change, run or install anything in it)
- What the user asked, turn by turn: ${r.turns.map((t, i) => `${i + 1}. "${t.prompt}"`).join(' ')}
- The agent's session transcripts: find <sid>.jsonl under ${path.join(os.homedir(), '.claude', 'projects')} for sids ${sids.join(', ')}.
  Only rows of type "assistant" are the agent's calls (rows of type "api-request-*" are copies).
- The starter the agent worked under: ${meta.starter}. What should have caught gaps: skills/security-review/SKILL.md,
  docs/security.md, packs/app/files/docs/foundation.md, packs/app/files/docs/playbooks/*.md, tools/hooks/hooks.mjs
  (search it for "security-"), tools/hooks/requirements.json, library/skills/*/SKILL.md (security-hardening and others).

## Rules
- Copy the project to ${scratch} (create it fresh) and work only there. Install its declared dependencies there.
- Run it only on 127.0.0.1. Attack only that local copy. Never contact any outside host except package registries.
- Never automate the installed Chrome or Edge; use curl, node or Python for requests.
- Do not "fix" anything in the copy beyond what you need to run it.

## Steps
1. Read the code and map the attack surface: every route, form, upload, login, admin page, file it serves, data it
   stores, header it sends, dependency, and secret.
2. For each attack below that applies, try it against the running copy and read the code that handles it. Record
   blocked, vulnerable, or not testable (and why). Use real requests, not guesses:
   stored and reflected XSS (form fields, captions, event names, file names); HTML or formula injection in exports
   (CSV cells starting with = + - @); SQL or command injection; CSRF on every state-changing form; login brute force and
   credential stuffing (rate limits, lockout), weak password storage, session fixation, cookie flags (HttpOnly,
   Secure, SameSite), logout; authorization (admin pages and APIs without a session, IDOR); spam and flooding of
   public forms (the same person 300 times, bots, honeypot or rate limit, size limits); uploads (type by content not
   name, size, SVG with script, path traversal in names, served with a safe content type, EXIF location left in
   photos); path traversal in static serving; open redirects; security headers (CSP, X-Content-Type-Options,
   frame-ancestors, Referrer-Policy); error pages that leak stack traces; secrets in the repo or client code; default
   or hard-coded credentials; personal data (who can read the email list, is it in a public folder or in git);
   dependency audit (npm audit or pip-audit); denial of service by large bodies.
3. For every vulnerable or partly protected item, find why the agent missed it: was the security-review skill run,
   and did its checklist cover this? Did docs/security.md or foundation.md ask for it? Did a hook check exist and fire?
   Did the agent decide against it, and say so to the user? Quote the starter file and line that should have caught
   it, or say that nothing in the starter covers it.
4. Note good security choices the agent made unasked, and anything it did that cost time with no security gain.

## Output
Write ${path.join(out, `${round}-sec-${id}.json`)}:
{"project":"${id}","surface":["..."],"attacks":[{"attack":"...","result":"blocked|vulnerable|partial|not-testable|n/a","severity":"critical|high|medium|low","evidence":"the request you sent and what came back, or file:line","why_missed":"... (only when not blocked)","starter_gap":"file:line or 'nothing covers it'","fix_in_starter":"..."}],"good":["..."],"waste":["..."],"summary":"..."}
Then reply with the counts by result and severity, and the top 3 starter gaps.
`;
  fs.writeFileSync(path.join(out, `${round}-sec-${id}.prompt.md`), body);
  console.log(path.join(out, `${round}-sec-${id}.prompt.md`));
}
