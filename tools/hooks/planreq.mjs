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

// The plans with unticked steps that are not closed ("status: done" or "status: dropped"). names: docs/plans file
// names; read(rel): a file's text. (Moved from hooks.mjs openPlans unchanged.)
export const openPlansOf = (names, read) => names.filter(n => /\.md$/i.test(n) && !/^readme\.md$/i.test(n)).map(n => {
  const p = `docs/plans/${n}`, t = read(p);
  return { p, left: (t.match(/^\s*[-*] \[ \]/gm) || []).length, done: (t.match(/^\s*[-*] \[[xX]\]/gm) || []).length, closed: /^status:\s*(done|dropped)/im.test(t) };
}).filter(x => x.left && !x.closed);

// REQ: plan-open, shared by both engines (moved from hooks.mjs unchanged). A work turn whose request continues a plan
// that was open when it began, and that neither touched the plan nor ran its status, is told to resume, tick or close it.
// x: { workTurn, prompt, changed: [rel], cmds: [cmd], relayed: bool, startPlans: [rel] }; io: { read(rel), planNames:
// [file names in docs/plans], runbookNames: [names], keyWords(s) }. The message, or null.
export function planOpen(x, io) {
  const startPlans = x.startPlans || [];
  if (!(x.workTurn && startPlans.length && !x.relayed)) return null;
  // (only a request that continues a plan is held to it: one that shares a word with the plan's name, title or open
  // tasks, or says to go on. Other work, or a message relayed from another session, leaves it for its own turn.
  // Lesson (a field report): an engine upgrade a peer handed over was stopped to resume an unrelated open plan)
  // (a word the project uses everywhere, in a runbook's name or in the names and titles of 3 or more of its plans, is
  // its subject, not a sign of one plan. Lesson (a field report): in a project about one game nearly every request
  // names the game's pieces, and each unrelated request was stopped twice to resume plans that shared one such word)
  const { read, keyWords } = io;
  const planHead = p => `${p.split('/').pop().replace(/\.md$/, '').replace(/^\d{4}-\d\d-\d\d-/, '')} ${(read(p).match(/^# .*$/m) || [''])[0]}`;
  const seen = {};
  for (const n of io.planNames.filter(n => /\.md$/i.test(n))) for (const w of new Set(keyWords(planHead(`docs/plans/${n}`)))) seen[w] = (seen[w] || 0) + 1;
  const everyday = new Set([...Object.keys(seen).filter(w => seen[w] >= 3), ...io.runbookNames.flatMap(n => keyWords(String(n).replace(/[-_]/g, ' ')))]);
  const wantWords = new Set(keyWords(x.prompt).filter(w => w.length > 2 && !everyday.has(w)));
  const continues = p => /\b(keep going|go on|continue|carry on|resume|next step|finish (it|the plan|up)|the plan|sigue|contin[uú]a)\b/i.test(x.prompt)
    || keyWords(planHead(p)).some(w => w.length > 2 && wantWords.has(w))
    // (an open task is a sentence full of common words: it takes two of its words. Lesson (a field report): one word
    // each from two plans' open tasks, such as "same", held an unrelated request to both)
    || new Set(keyWords((read(p).match(/^\s*- \[ \] .*$/gm) || []).join(' ')).filter(w => w.length > 2 && wantWords.has(w))).size >= 2;
  if (!startPlans.some(continues) || x.changed.some(p => /^docs\/plans\//.test(p)) || x.cmds.some(c => /plan-tasks\.mjs/.test(c))) return null;
  return `This turn started with ${startPlans.length > 1 ? 'open plans' : 'an open plan'} (${startPlans.slice(0, 3).join(', ')}) and did not touch ${startPlans.length > 1 ? 'them' : 'it'}. Tell the user, then resume it ` +
    '(node skills/plan/scripts/plan-tasks.mjs status <plan>), tick what this work finished, or close it with "status: done" or "status: dropped - <why>". ' +
    'If this request is unrelated and the plan stays open on purpose, waive it: node tools/hooks/hooks.mjs waive plan-open "<why>".';
}
