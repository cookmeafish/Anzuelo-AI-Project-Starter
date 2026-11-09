import { spawnSync } from 'node:child_process';
// Commit ids a text names, read by both of v2's checks (the guard on messages, the end check on the answer).
// REQ: claim-checked. Lesson (2026-11-08): two made-up commit ids were sent to a peer session, each written before the
// commit had returned.

// Placeholders and examples are no claims: a well-known placeholder, or an id in quotes or backticks presented as an
// example ("like", "e.g.", "such as"). Lesson (a peer's live false hold): an answer explaining the guard with
// "commit abc1234" was held as a made-up commit.
const PLACEHOLDERS = /^(abc1234|abcdef0|1234567|0000000|deadbeef|cafebabe)/i;
export function exampleId(text, i, id) {
  if (PLACEHOLDERS.test(id) || new Set(id).size <= 2) return true;
  const s = String(text || ''), before = s.slice(Math.max(0, i - 60), i), after = s.slice(i + id.length, i + id.length + 2);
  const quoted = /["'`“‘][^"'`”’\n]{0,30}$/.test(before) && /^[^"'`”’\n]{0,30}["'`”’]/.test(s.slice(i + id.length, i + id.length + 31)) || /^["'`”’]/.test(after);
  return quoted && /(?<!\w)(like|e\.g\.?|eg|such as|for example|for instance|say|example|placeholder|sample)(?!\w)/i.test(before);
}
// Any 7-40 digit hex id with letters and digits (the end check's wide rule: it only asks).
export const hexIds = text => [...String(text || '').matchAll(/(?<![\w/#-])([0-9a-f]{7,40})(?![\w-])/g)]
  .filter(m => /\d/.test(m[1]) && /[a-f]/.test(m[1]) && !exampleId(text, m.index, m[1])).map(m => m[1]);
// Commit context only, for the guard, which refuses during work and must never refuse falsely: after "commit", "pushed",
// "HEAD", "main is", "in", or opening a git-log line; never after "#", in a path, or after "sha256"/"hash".
export const commitIds = text => [...new Set([...String(text || '').matchAll(/(?<![\w/#.:-])([0-9a-f]{7,40})(?![\w/.-]*\/)(?![\w-])/g)].filter(m => {
  const h = m[1]; if (!/\d/.test(h) || !/[a-f]/.test(h) || exampleId(text, m.index, h)) return false;
  const before = text.slice(Math.max(0, m.index - 40), m.index), line = before.slice(before.lastIndexOf('\n') + 1);
  if (/\b(sha-?256|sha-?1|hash|digest|checksum|uuid|guid|id:)\W{0,3}$/i.test(line)) return false;
  return /\b(commits?|committed(?: as)?|pushed(?: as)?|push|head(?: is| at)?|merged?(?: as)?|landed in|lands in|main is|main at|is at|in|at|on top of|reverts?|cherry-picked|commit id is|commit is|the id is)\W{0,4}(?:the )?(?:commit )?$/i.test(line) || /^\s*[-*]?\s*$/.test(line) && /^[0-9a-f]{7,40} \S/.test(text.slice(m.index));
}).map(m => m[1]))];

// io: { root, exists(rel), pathKey(s) }
// REQ: claim-checked (git). A claim that git holds nothing, or no earlier version of a file: "nothing is committed yet",
// "never committed", "not in git", "no earlier version in git" (Spanish too). It counts only when the sentence is
// about the saved or earlier version, not "nothing from this turn is committed yet".
export const NOT_IN_GIT = /\b(never (been |was |were )?committed|nothing (is |was |has been |had been )?(yet )?committed|(is|was|are|were) (still )?not (yet )?committed|(isn'?t|wasn'?t|aren'?t|weren'?t|hasn'?t been|haven'?t been) (yet )?committed|not (yet )?(in|saved in|stored in) git|(isn'?t|wasn'?t|aren'?t) (yet )?(in|saved in|stored in) git|no (earlier|previous|older|old|committed) versions?|git (holds|has|keeps) (nothing\b|no ([\w-]+ ){0,2}(versions?|commits?|history|cop(y|ies)|records?|trace)\b)|no commits? (yet|so far))|(?<!\p{L})(nunca (se )?(confirm[oó]|guard[oó] en git|hizo commit|se subi[oó] a git)|no (est[aá]|estaba|est[aá]n) en git|no hay (ning[uú]n )?commit|no hay (una )?versi[oó]n anterior)(?!\p{L})/iu;
const ABOUT_SAVED = /\b(version|saved|stored|earlier|previous|older|history|in git)\b|(?<!\p{L})(versi[oó]n|guardad[oa]|historial|anterior|en git)(?!\p{L})/iu;
// What git holds: the last commit, and the last commit of each named file ('' when git never had it). null outside a
// repository or before the first commit.
export function gitHolds(paths = [], io) {
  if (!io.exists('.git')) return null;
  const g = a => { try { return (spawnSync('git', a, { cwd: io.root, encoding: 'utf8', timeout: 5000 }).stdout || '').trim(); } catch { return ''; } };
  const head = g(['log', '-1', '--format=%h %s']);
  if (!head) return null;
  const files = {};
  for (const p of paths.slice(0, 6)) files[p] = g(['log', '-1', '--format=%h', '--', p]);
  return { head, files };
}
// The file paths a sentence names (backticked or path-like), as project paths.
export const namedPaths = (s, io) => [...new Set([...String(s).matchAll(/`([^`\s]+\.[\w]{1,6})`|(?<![\w/.-])((?:[\w.-]+\/)*[\w-]+\.[a-z]{1,6})(?![\w/])/gi)].map(m => io.pathKey(m[1] || m[2])))]
  .filter(p => p.includes('/') || io.exists(p) || /\.(md|txt|py|js|mjs|cjs|ts|tsx|go|rs|json|html|njk|css|ya?ml|toml|rb|sh|java|kt|cs|php|csv)$/i.test(p));
// A git claim the repository contradicts: the sentence, and what git holds. A sentence that names only files git never
// had is true. Lesson: an answer said "the version saved in git doesn't mention the option, because nothing is committed
// yet", while the last commit had it; the agent had looked only at the working copy.
export function gitClaimContradicted(answer, io) {
  // (judged per clause: the files a waiver reason lists as samples are not the file it says git never had)
  const s = String(answer || '').split(/(?<=[.!?\n])\s+|;\s+/).find(t => NOT_IN_GIT.test(t) && ABOUT_SAVED.test(t.replace(NOT_IN_GIT, '')) && !/\b(if|whether|unless)\b/i.test(t));
  if (!s) return null;
  const paths = namedPaths(s, io), git = gitHolds(paths, io);
  if (!git) return null;
  const had = paths.filter(p => git.files[p]);
  if (paths.length && !had.length) return null;
  return { sentence: s.trim(), head: git.head, had: had.map(p => `${p} (${git.files[p]})`) };
}

// A claim that a change only makes projects better ("only improvements", "not worse"), and one that a lesson reached
// the starter's makers ("reported to the makers", Spanish too): both engines check them (claim-checked).
export const IMPROVE_CLAIM = /\bonly (makes? (it|things|projects?|the projects?) )?(better|improve(s|ments?)?)\b|\b(isn'?t|is not|aren'?t|are not|never|nothing|no) (any |made |got )?worse\b|\bnot (any )?worse\b|\b(makes?|made) (new |every )?(projects?|it) (only )?better\b|\bsolo mejora|\bno (lo |la )?empeora/i;
export const REPORTED = /\b(reported|sent|passed on|forwarded|submitted|filed)\b[^.\n]{0,40}\bto the (tool'?s |starter'?s |engine'?s )?(makers?|authors?|developers?|maintainers?|starter)\b|\b(the )?(makers?|developers?|maintainers?) (were|was|have been|has been) (told|notified|informed)\b|\b(report[eé]|reportad[oa]|envi[eé]|enviad[oa]|avis[eé])\b[^.\n]{0,40}\b(a los|al) (creador(es)?|autor(es)?|desarrollador(es)?|starter)\b/i;
