// REQ: done-when-labeled, shared by both engines: the "Done when" items of a runbook or skill, how each is proven, and
// the end check that a runbook or skill changed this turn labels every item with a real check or a judgment. Moved here
// from hooks.mjs unchanged; the project's files come in through io.
// The checklist items under "## Done when" in a runbook or skill (REQ: done-when-labeled)
export function doneWhenItems(text) {
  const sec = (/^##\s+Done when[^\n]*\n([\s\S]*?)(?=^##\s|(?![\s\S]))/m.exec(text) || [])[1] || '';
  // an item's wrapped continuation lines (indented, until the next item, a blank line or a heading) belong to it,
  // so a label at the end of a wrapped item counts. Lesson: labels on a wrapped item's last line were reported missing.
  const items = [];
  let cur = null;
  for (const l of sec.split(/\r?\n/)) {
    if (/^\s*[-*] \[[ xX]\]/.test(l)) { cur = l.replace(/^\s*[-*] \[[ xX]\]\s*/, '').trim(); items.push(cur); continue; }
    if (cur !== null && /^\s+\S/.test(l) && !/^\s*[-*] /.test(l) && !/^\s*#/.test(l)) { items[items.length - 1] = cur = `${cur} ${l.trim()}`; continue; }
    cur = null;
  }
  return items;
}
// one or more tags: "(hook: a)", "(hook: a, b)", "(hooks: a, b)"
// (or a marker the end check tests, "(file: ...)", "(ran: ...)", "(answer: ...)"; "(when file: ...)" alone is a condition,
// not a proof. Lesson (audit): the runbook template asks for markers, and an item written that way was called unproven)
export const DONE_LABEL = /\bhooks?\s*:\s*`?[a-z][\w-]*(?:`?\s*,\s*`?[a-z][\w-]*)*|\bjudgment\b|\bjudgement\b|\((?:file|ran|answer)\s*:/i;
export function ledgerItems(text) {
  return doneWhenItems(text).map((raw, i) => {
    const tags = (/\bhooks?\s*:\s*([^)]*)/i.exec(raw)?.[1] || '').split(',').map(s => s.replace(/`/g, '').trim()).filter(s => /^[a-z][\w-]*$/.test(s));
    return { n: i + 1, text: raw.replace(/\s*\((hooks?|judge?ment)\s*:[^)]*\)\s*/gi, ' ').trim(), tags, judgment: /\bjudge?ment\b/i.test(raw) };
  });
}
// The end check on the runbooks and skills changed this turn. io: { read(rel), exists(rel), knownCheck(tag) }.
export function doneWhenGaps(changed, io) {
  const out = [];
  // REQ: done-when-labeled. Every "Done when" item in a runbook or skill changed this turn says how it is proven: the
  // check that enforces it ("hook: <tag>") or why only judgment can ("judgment: <why>"). Lesson: the user's requirements
  // were written into a runbook as plain items, nothing enforced them, and the agent moved on until the user asked.
  const unlabeled = changed.filter(p => /^(docs\/playbooks\/[^/_][^/]*\.md|(skills|library\/skills|packs\/[^/]+\/files\/skills)\/[^/]+\/SKILL\.md|packs\/[^/]+\/files\/docs\/playbooks\/[^/_][^/]*\.md)$/.test(p) && io.exists(p))
    .flatMap(p => doneWhenItems(io.read(p)).filter(i => !DONE_LABEL.test(i)).map(i => `${p}: "${i.slice(0, 60)}"`));
  if (unlabeled.length)
    out.push(`Every "Done when" item needs its proof: add a check and write "(hook: <tag>)" (one or more tags: "(hook: a, b)"), or write "(judgment: <why no check can tell>)". ` +
      `Unlabeled: ${unlabeled.slice(0, 4).join('; ')}${unlabeled.length > 4 ? ` and ${unlabeled.length - 4} more` : ''}. Add the checks now; don't ask (hard rule 3).`);
  // (a check name no hook defines is an item that passes with no evidence: the runbook's checklist would lie. Lesson
  // (the user): "the runbooks must be accurate")
  const procs = changed.filter(p => /^(docs\/playbooks\/[^/_][^/]*\.md|(skills|library\/skills|packs\/[^/]+\/files\/skills)\/[^/]+\/SKILL\.md|packs\/[^/]+\/files\/docs\/playbooks\/[^/_][^/]*\.md)$/.test(p) && io.exists(p));
  const badNames = procs.flatMap(p => ledgerItems(io.read(p)).flatMap(it => it.tags.filter(tg => !io.knownCheck(tg)).map(tg => `${p} item ${it.n}: "${tg}"`)));
  if (badNames.length)
    out.push(`A "Done when" item names a check that doesn't exist, so it would pass with no evidence: ${badNames.slice(0, 4).join('; ')}. Fix the name, or add the check (runbook-create skill, step 3).`);
  return out;
}
