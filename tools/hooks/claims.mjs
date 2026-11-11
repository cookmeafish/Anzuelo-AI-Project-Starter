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
// A shortened stand-in for a commit id, "commit 72c..." or "fbd…": 3 to 6 hex digits ending in an ellipsis after a
// commit word. No real id is that short, and a git range is full ids ("a8a0575..44c6b0c"), so this never names a real
// one. Lesson (oversight, 2026-11-10): two such placeholders were sent to a peer in place of the id, just under the
// 7-digit rule above.
// (letters alone, "fbd…", count only with a commit word within 30 characters, so a word like "bad..." never does)
export const cutIds = text => { const s = String(text || ''); return [...s.matchAll(/\b(commits?|committed(?: as)?|pushed(?: as)?|in|at|is)\s*[(`"']?([0-9a-f]{3,6})(\.{3}|…)/gi)]
  .filter(m => /[a-f]/i.test(m[2]) && (/\d/.test(m[2]) || /\b(commit|committed|pushed|sha)\b/i.test(s.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(m[0], ' '))))
  .map(m => `${m[2]}${m[3]}`); };

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

// The sentences of an answer that can make a claim: not its label lines ("Playbook:", "Learned:", "Proven:"...).
export const claimSentences = answer => String(answer || '').replace(/<!--[\s\S]*?-->/g, ' ').split(/(?<=[.!?])\s+|\r?\n/)
  .filter(s => !/^[\s>*_-]*(playbook|skill|worth it|learned|proven|gu[ií]a|habilidad|vale la pena|aprendido|probado)s?\b[^:\n]{0,20}:/i.test(s));
// A sentence in which the agent says it tested a page or app by hand (not one that asks the user to, nor a negation).
const BY_HAND = /\b(by hand|manually|hand-tested)\b|(?<!\p{L})(a mano|manualmente)(?!\p{L})/iu;
const UI_TEST = /\b(test(ed|ing)?|tried|clicked|clicking|browser|page|screen|mobile|desktop)\b|(?<!\p{L})(prob[eé]|probad[oa]|navegador|p[aá]gina|clic|m[oó]vil|escritorio|pantalla)(?!\p{L})/iu;
export function byHandClaim(answer) {
  // (a label line, "Lo probé a mano:", is read with the line after it)
  const lines = claimSentences(answer), at = i => /:\**\s*$/.test(lines[i]) ? `${lines[i]} ${lines[i + 1] || ''}` : lines[i];
  // ("by hand" after a word for making data says how the data was made, not how it was tested. Lesson (a field report):
  // "tested: ... keeps the rows written by hand" was blocked twice)
  const made = /\b(written|wrote|entered|typed|added|edited|filled( in)?|drawn|copied|kept|curated|maintained|labell?ed|sorted|made|created|built|set)\s+(in\s+)?(by hand|manually)\b|(?<!\p{L})(escrit|añadid|introducid|copiad|editad|hech)[oa]s?\s+(a mano|manualmente)(?!\p{L})/giu;
  // (a phrase in quotes is named, not claimed. Lesson, dogfood: an answer describing this check quoted the phrase)
  const quoted = /"[^"\n]{1,120}"|“[^”\n]{1,120}”|«[^»\n]{1,120}»/g;
  // (only a claim about this turn's own work: in the first person ("I tested", "lo probé") or as a result label ("Tested by
  // hand: works"), never a sentence describing a claim or a check. Lesson (a peer's live false hold): "makes an answer that
  // says a test was done by hand explain how it was run" was held as a hand test)
  const mine = /\b(I|I've|I'd|we|we've)\b|(?<!\p{L})(prob[eé]|comprob[eé]|verifiqu[eé]|revis[eé]|hice|abr[ií]|toqu[eé])(?!\p{L})|^[\s>*_-]*(tested|tried|checked|verified|probado|comprobado)\b[^:\n]{0,30}:/iu;
  return lines.map((_, i) => at(i)).find(full => { const s = full.replace(quoted, ' ').replace(made, ' '); return BY_HAND.test(s) && UI_TEST.test(s) && mine.test(s) && !describesClaim(s)
    && !/\b(you|your|the user|not|n't|never|nothing|should|could|can)\b|(?<!\p{L})(t[uú]|usted|puedes|prueba t[uú]|pru[eé]balo|no|nunca|nada)(?!\p{L})/iu.test(s.replace(BY_HAND, ' ')); }) || '';
}
// A sentence that describes a claim, a check or a rule rather than making the claim: "an answer that says...", "a claim
// like...", "checks that...", "the check holds...". Lesson (a peer's live false hold): a report of the engine's new checks
// was held for the claims it described.
export const describesClaim = s => /\b(an? (answer|reply|message|sentence|turn) (that|which|saying|says)|says? (that )?(a|the) (test|lesson|change|claim)|a claim (like|that)|claims? such as|checks? (that|whether|for)|the (check|rule|guard) (holds|asks|says|catches|flags)|is held for|holds? an answer)\b/i.test(String(s || ''));

// A sentence that says a group of items passed or is fine ("21 were fine", "the other 21 menus passed"), not a test
// run, and not one that says who judged them or what the check behind it tests. In a session where helpers did work,
// such a verdict may be theirs, or a check that only found a note for each item. Lesson (a field report): an answer
// said the rest "passed" after a check that only confirmed each item had a note written by a helper; asked later,
// the agent said it had never checked whether those verdicts were right.
const GROUP_VERDICT = /\b(all|every|each|the (other|rest|remaining)|remaining|\d+)\b.{0,80}?\b(passed|pass(es)?|(were|are|was|is) (all )?(fine|ok|okay|good|correct|right|verified|sound)|checked out|hold up|deserve[sd]?|earned)\b|(?<!\p{L})(todos?|todas?|cada|los dem[aá]s|las dem[aá]s|\d+)(?!\p{L}).{0,80}?(?<!\p{L})(pasaron|est[aá]n bien|estaban bien|son correct[oa]s|verificad[oa]s)(?!\p{L})/iu;
// (a pass count beside a fail count is a test run's result, also in a table row with no word for tests. Lesson,
// dogfood: a row "| 1522 passed, 0 failed |" was flagged)
const TEST_RUN = /\b(tests?|self-?tests?|selfcheck|suites?|builds?|lint|type-?checks?|audit|trial|CI|scenarios?)\b|\b\d+ passed\b.{0,30}\b\d+ fail(ed|ures?)\b|(?<!\p{L})pruebas?(?!\p{L})/iu;
// (what the user said is no verdict of the agent's, and a date, time or version is no count of items. Lesson (a field
// report): "on 2026-10-26 you said its draw was fine at 9" was blocked three times in one turn)
// ("I ran every check myself" says who judged. Lesson (a field report): it was flagged until the turn's last round)
const JUDGED_BY = /\b(you (said|wrote|told me|asked)|I (re-?)?ran [^.\n]{0,60}\bmyself|the user (said|wrote)|helpers?|sub-?agents?|agents?|I (re-?)?(checked|judged|read|compared|reviewed|scored) (each|every|all|them|it|this|these|that|those|one by one)|only (checks?|confirms?|found|means)|not (re-?)?(checked|judged|verified|read))\b|(?<!\p{L})(ayudantes?|sub-?agentes?|agentes?)(?!\p{L})/iu;
// (a requirement is no verdict: "must / should / has to / needs to / will pass" says what is to be true, not what
// passed. Lesson (oversight's live session, 2026-11-10): a plan line "every project must pass after upgrading" was held)
const REQUIREMENT = /\b(must|should|shall|has to|have to|needs? to|ought to|will|would|is to|are to|going to)\s+(?:(?:all|still|also|each|then|always|now|first|again)\s+)?(pass(es)?|be (all )?(fine|ok|okay|good|correct|right|verified|sound)|check out|hold up)\b|(?<!\p{L})(debe[n]?|deber[ií]a[n]?|tiene[n]? que|ha[n]? de|necesita[n]?)\s+(?:(?:todos?|todas?|tambi[eé]n|siempre)\s+)?(pasar|estar bien)(?!\p{L})/iu;
export const requirementSaid = s => REQUIREMENT.test(String(s || ''));
export function groupVerdictClaim(answer) {
  // (a phrase in quotes is named, not claimed. Lesson, dogfood: an answer that quoted the misleading claims was flagged)
  const quoted = /"[^"\n]{1,600}"|“[^”\n]{1,600}”|«[^»\n]{1,600}»/g, notCount = /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}:\d{2}\b|\bv?\d+(\.\d+)+\b/g;
  // (the sentence right after the verdict may say who judged it. Lesson (a field report): "The list passes the new checks.
  // I judged this myself this turn, with no helper." was flagged for two rounds after the correction said so)
  const ss = claimSentences(answer), clean = s => String(s || '').replace(quoted, ' ').replace(notCount, ' ');
  return ss.find((s, i) => { const t = clean(s); return GROUP_VERDICT.test(t) && !TEST_RUN.test(t) && !describesClaim(t) && !REQUIREMENT.test(t) && !JUDGED_BY.test(t) && !JUDGED_BY.test(clean(ss[i + 1])); }) || '';
}
