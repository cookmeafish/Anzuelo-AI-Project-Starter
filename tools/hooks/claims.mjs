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
