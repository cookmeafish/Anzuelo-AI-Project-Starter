// REQ: plan-required, shared by both engines. A bigger addition (many new files) whose answer leaves work open has a
// checklist in docs/plans/ (or its STATUS.md line), so nothing is left half done and the next session or another agent can
// finish it. Moved here from hooks.mjs unchanged; what each engine knows comes in through x:
// x: { changed: [rel], said, workTurn, setup: bool, wroteSelf: Set<rel>, born(rel): bool, generated: Set<rel>,
//      notWork(rel): bool, exists(rel): bool }, newFiles: the config's planNewFiles.
// Setup has its own checklist (SETUP-PROMPT.md) for the rest.
// (the records a runbook itself asks for, like a spec, a review, release notes or a new runbook's skill, are not the
// work being planned. Lesson: a feature's own spec, review and notes tipped it over the limit after the fact.)
export const PLAN_FREE = /^(AGENTS\.md$|CLAUDE\.md$|docs\/checks\/|docs\/plans\/|docs\/(specs|releases|reviews|incidents|knowledge)\/|docs\/playbooks\/|skills\/[^/]+\/SKILL\.md$|\.cache\/|tools\/hooks\/state\/|\.memtest\/|\.claude\/|\.codex\/|\.agents\/)/;
// In setup only the app files the agent itself wrote count (the starter's own files, packs and scripts are the setup's
// checklist). Lesson: a setup that built a whole app got its plan demanded only after the work, when the final step
// deleted SETUP-PROMPT.md; the plan notice had stayed silent all through setup.
export const SETUP_OWN = /^(\.[^/]*(\/|$)|(tools|skills|docs|library|packs|inbox|outputs|sources|profiles)\/|[^/]+\.md$)/;
// (at Stop the work is done: a plan written now only describes it. It is still owed when the answer leaves work open
// and nothing records it, no plan and no STATUS.md line; during the work the PLAN notice asks for it in time. Lesson
// (a field report): a finished build was blocked for a plan, and the agent wrote one about work already done)
export const OPEN_WORK = /\b(still open|not (yet )?(done|finished)|left to do|to do next|next steps?|unfinished|remaining work|pendiente|falta(n)? por)\b/i;
export function planRequired(x, newFiles) {
  const born0 = x.changed.filter(p => !x.notWork(p) && !PLAN_FREE.test(p) && !x.generated.has(p) && x.exists(p) && x.born(p));
  const born = x.setup ? born0.filter(p => !SETUP_OWN.test(p) && x.wroteSelf.has(p)) : born0;
  const recorded = x.changed.some(p => /^docs\/plans\/.+\.md$/.test(p) || p === 'docs/STATUS.md');
  if (!(x.workTurn && born.length >= newFiles && OPEN_WORK.test(x.said) && !recorded)) return null;
  return `This turn added ${born.length} new files (${born.slice(0, 4).join(', ')}${born.length > 4 ? ', ...' : ''}) without a plan. Write or update one in docs/plans/ with the plan skill ` +
    '(a checkbox per task, ticked as they finish), so nothing is left half done and the next session can continue it.';
}
