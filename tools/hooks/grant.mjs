// REQ: setup-gate (permissions). docs/foundation.md's "Who may do what" row gives each destructive or sensitive
// action (delete, money, settings, other people's data) to the owner until the user decides. A role the agent made up
// gets none of them on its own say, not even under autonomy "auto" (security-sensitive: AGENTS.md step 0.5). A grant to
// anyone else stands only with the user's decision on record ("the user decided 2026-10-21").
// Lesson: three rounds of a bookshop API setup invented a delete-capable "manager" role, the security review passed it,
// and the user complained each time that someone other than the owner could delete.
// With userWords (what the user wrote, at Stop when the row changed this turn), a decision on record must quote the
// user's own words naming the role: the agent can't write "the user decided" for itself. Lesson, trial round 20: asked
// only to "add an endpoint that deletes a book", the agent let every staff account delete, removed the test that kept
// it owner-only, and wrote "the user decided" in the row.
const DESTRUCTIVE = /\b(delet\w*|remov\w*|destroy\w*|eras\w*|wip(e|es|ing)\b|purg\w*|refund\w*|pay(ment|ments|outs?)?\b|charg(e|es|ing)\b|money|billing|settings?|permissions?|roles?\b[^.;]{0,20}\b(assign|grant|change)\w*|other (people|users)'?s? data|borrar|eliminar)/i;
const ACTOR = /\b(manager|admin\w*|staff|editor|member|moderator|employee|user|clerk|operator|supervisor|any (signed[- ]in|logged[- ]in|authenticated) \w+|anyone|everyone|all (users|staff|accounts)|role)s?\b/i;
export const USER_DECIDED = /\b(the )?(user|owner|client) (decided|chose|confirmed|asked for|approved|granted)\b|\bdecided by the (user|owner)\b|\bel usuario (decidi[oó]|eligi[oó]|confirm[oó])\b/i;
export function grantProblems(text, userWords = null) {
  const row = String(text || '').split(/\r?\n/).find(l => /^\|\s*who may do what/i.test(l));
  if (!row) return [];
  const value = row.split('|').filter(s => s.trim()).pop() || '';
  if (/^\s*(<\.\.\.>|n\/?a\b)/i.test(value)) return [];
  // (test names and other parentheses are evidence, not grants; "staff cannot delete" denies, it does not grant)
  const notOwner = s => s.replace(/\bowner(['’]s)?( account| role)?\b/gi, ' ');
  const clauses = value.replace(/`([^`]*)`/g, '$1').replace(/\([^)]*\)/g, ' ').split(/;|\.\s+|<br\s*\/?>/i);
  const bad = clauses.filter(c => DESTRUCTIVE.test(c) && ACTOR.test(notOwner(c)) && !/\b(cannot|can'?t|never|not|no|refused|denied|only the owner|owner only)\b/i.test(c));
  if (!bad.length) return [];
  const flat = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim(), said = flat(userWords ?? '');
  const quoted = [...value.matchAll(/"([^"]{8,})"|“([^”]{8,})”/g)].map(m => flat(m[1] || m[2]));
  if (USER_DECIDED.test(value) && (userWords == null || quoted.some(q => said.includes(q) && ACTOR.test(notOwner(q))))) return [];
  return [`docs/foundation.md "Who may do what" gives a destructive or sensitive action to someone other than the owner ("${bad[0].trim().slice(0, 80)}") without the user's decision: until the user decides, the owner only. ` +
    (userWords == null ? 'Set it to the owner and ask the user, or record the user\'s own decision in the row ("the user decided <date>")'
      : 'A request for a feature is no grant to a role. Set it back to the owner and ask the user in one line, or quote the user\'s own words that name the role (the user decided <date>: "<their words>")')];
}
