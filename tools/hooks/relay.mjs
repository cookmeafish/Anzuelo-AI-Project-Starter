// A message meant for someone else (another session, terminal or agent), shared by both engines (one definition).
// What it asks for is that message, not the domain job its words describe.

// Passing a message to another session or agent is not a new kind of task. Lesson: "tell the other terminal" got NO RUNBOOK.
export const RELAY = /\b(tell|ask|message|ping|notify|update|let)\b[^.?!\n]{0,40}\b(terminal|session|agent|window|instance|other claude)\b|\bpass (this|it|that|them) (on|along)\b|\brelay (this|it|that)\b/i;
// A message meant for someone else: another session, terminal or agent ("dile a la otra sesión"). Lesson: "write a report
// to <starter> on how to improve it" routed to the deliverable runbook (outputs/) and to a project runbook whose triggers
// had "improve".
export const PEER_NOUN = String.raw`(terminal|session|agent|window|instance|chat|sesi[oó]n|agente|ventana)`;
export const PEER = new RegExp(String.raw`\b(to|for|with|para|a|al|con)\s+(the\s+|la\s+|el\s+)?(other|another|otra|otro)\s+(\w+\s+)?${PEER_NOUN}` +
  String.raw`|\b(to|for|para|a|al)\s+(the\s+|la\s+|el\s+)?\w+\s+${PEER_NOUN}s?\s+(coding|working|running|that|que)\b` +
  String.raw`|(^|[^\wáéíóú])(dile|diles|p[ií]dele|p[ií]deles|av[ií]sale|av[ií]sales|cu[eé]ntale|menci[oó]nale|recu[eé]rdale)(?![\wáéíóú])`, 'i');
// ...unless it also asks for work ("tell the terminal, then fix the export")
export const ALSO_WORK = /\b(and|then|also|but)\b[^.?!\n]{0,15}\b(fix|add|make|build|write|create|change|update|edit|remove|run)\b/i;
// A message to pass on to another session or agent, asking for no work here.
export const toOtherSession = t => (RELAY.test(String(t || '')) || PEER.test(String(t || ''))) && !ALSO_WORK.test(String(t || ''));

// ---------- a message relayed from another session or agent (moved from hooks.mjs, shared with engine v2) ----------
import { TASK_ES, fold } from './near.mjs';
// An upgrade of this project's engine from its starter: the starter command, or "upgrade/update the engine/starter".
export const STARTER_UPGRADE = /\bstarter\.mjs\s+(update|upgrade)\b|\b(upgrade|update)\s+(the\s+|this\s+|your\s+)?(engine|starter)\b|\bactualiza\w*\s+(el\s+)?(motor|starter)\b/i;

// A helper this session launched, handing back its report: part of the task that launched it, not a new request (no
// turn of its own, no hints, no cost row). Lesson (a field report): each hand-back of a build's own helpers got RELAYED,
// NO RUNBOOK and SHARED STEPS hints, and the cost command split one 40-minute request into five rows.
export const HANDBACK = /\[Subagent hand-back\]|a subagent this session delegated to|an agent working inside this same session/i;

// A message relayed from another session or agent, as the whole prompt: "<cross-session-message ...>BODY</...>",
// "<agent-message ...>BODY</...>" or "Another Claude session sent a message: BODY". Its body ('' if it is not one).
export const RELAY_START = /^\s*(<(cross-session-message|agent-message)\b[^>]*>|Another Claude session sent a message\b[:.]?)/i;
export function relayedBody(prompt) {
  const s = String(prompt || ''), m = RELAY_START.exec(s);
  if (!m) return '';
  let body = s.slice(m[0].length);
  if (m[2]) { const end = body.search(new RegExp(`</${m[2]}>`, 'i')); if (end >= 0) body = body.slice(0, end); }
  return body.trim();
}
// What of a relayed message routes: its own words, not what it quotes or runs. Quoted text, code in backticks and
// command lines describe or cite work (a test's name, the old behaviour, a command to run), so they are left out; a
// starter upgrade command is kept as "upgrade the starter". Lesson: a message reporting fixes ("the old check read it as
// a failure", test names in quotes, "node tools/starter.mjs update") routed to the bugfix runbook, a deliverable and
// two library skills, while its job was a starter upgrade.
// (a command, by its shape: "go to the store" or "a node in the graph" is prose)
const CMD_LINE = /\b(?:node\s+[\w./\\-]+\.[cm]?[jt]s\b|(?:npm|pnpm|yarn)\s+(?:run|install|i|test|ci|publish)\b|npx\s+\S+|git\s+(?:add|commit|push|pull|fetch|log|status|diff|show|checkout|switch|merge|rebase|tag|stash|reset|clone|init)\b|python3?\s+(?:-m\s+\S+|[\w./\\-]+\.py\b)|py\s+(?:-m\s+\S+|[\w./\\-]+\.py\b)|pip3?\s+install\b|(?:pwsh|powershell)(?:\.exe)?\s+(?:-\w+|[\w./\\-]+\.ps1\b)|go\s+(?:build|test|run|vet|mod|get|install)\b|cargo\s+(?:build|test|run|install|publish)\b|dotnet\s+(?:build|test|run|publish)\b|(?:bash|sh)\s+[\w./\\-]+\.sh\b)(?:[^\n;.]|\.(?=\S))*/gi;
const asRoute = c => STARTER_UPGRADE.test(c) ? ' upgrade the starter ' : ' ';
// Work reported as done ("fixed and pushed:", "already released") is no request for that work. Lesson: "fixed and
// pushed: GitHub main" routed to the release runbook and held the turn to its release checks.
const DONE_REPORT = /\b(?:and|been|is|are|was|were|already|now|all|got)\s+(?:pushed|released|published|deployed|merged|tagged|shipped)\b|\b(?:pushed|released|published|deployed|merged|shipped)\s*:/gi;
export const relayRouteText = s => String(s || '')
  .replace(/```[\s\S]*?(```|$(?![\s\S]))/g, asRoute).replace(/`[^`\n]*`/g, asRoute)
  .replace(/["“][^"”\n]*["”]/g, ' ').replace(CMD_LINE, asRoute).replace(DONE_REPORT, ' ')
  // (a "note:" label is the sender's aside, not the user's shorthand for "save this". Lesson: "Separate note: your
  // state file ..." set off the skill that records notes)
  .replace(/\b(?:(?:side|separate|small|quick|one|a|another|final|last)\s+)?(?:notes?|nota|aviso)\s*:/gi, ' ').replace(/\s{2,}/g, ' ').trim();
// The sentences of a relayed message that ask for something: one that starts with a task verb ("make me a report",
// "please replay it"), or asks ("can you", "I need you to", "por favor"). The rest reports or explains, and routes
// nothing. Lesson: "STATUS.md had changed since then" in a report of fixes routed to the refresh runbook.
export function relayRequestText(s, cfg = {}) {
  const lead = String.raw`^(?:[\s\-*>\d.)]*(?:hey|ok(?:ay)?|now|also|next|then|so|and|y|ahora|tambi[eé]n|luego|from now on|always|never|de ahora en adelante|siempre|nunca)\b[,\s]*)*(?:please\s+|por favor,?\s+)?`;
  const startsEn = new RegExp(`${lead}(?:${cfg.taskVerbs || '(?!)'})`, 'i'), startsEs = new RegExp(`${lead}(?:${TASK_ES.source})`, 'i');
  const starts = { test: x => startsEn.test(x) || startsEs.test(fold(x)) }, asks = /\b(can|could|would) you\b|\bplease\b|\bi (need|want) you to\b|\bpor favor\b|\b(puedes|podr[ií]as|necesito que)\b/i;
  // (a bare "upgrade" from another session, with no object, is the engine's: "Upgrade when convenient" had routed to a
  // project's own upgrade runbook)
  const bare = /^(?:please\s+)?(?:upgrade|update|actualiza)\s*(?=$|[.!,]|\s+(?:when|once|now|again|after|before|at|if|whenever|cuando|ahora)\b)/i;
  // (a label before a colon is no task verb: "Test: (fails on the old engine)" names a test, "Steps: commit ..." starts
  // with its verb after it. Lesson (a field report): a relayed upgrade note's "Test:" line routed to the debug skill)
  const unlabeled = x => x.trim().replace(/^[\s\-*>]*\**\p{L}[\p{L} ]{0,20}\**:\s*/u, '');
  return String(s || '').split(/(?<=[.!?])\s+|\r?\n/).map(x => bare.test(x.trim()) ? 'upgrade the starter.' : x)
    .filter(x => starts.test(unlabeled(x)) || asks.test(x) || /upgrade the starter/.test(x)).join(' ').trim();
}
// The user's own message routes on its words too: a command it names (in backticks or as a command line) and work it
// reports as done are no request for that work; what it quotes stays (a user quotes the thing they mean). Lesson:
// "upgrade with node tools/starter.mjs update" set off the dependency-update skill on "upgrade node".
export const typedRouteText = s => String(s || '').replace(/`[^`\n]*`/g, asRoute).replace(CMD_LINE, asRoute).replace(DONE_REPORT, ' ').replace(/\s{2,}/g, ' ').trim();
