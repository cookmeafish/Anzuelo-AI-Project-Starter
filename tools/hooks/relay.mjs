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
