// Wakeups and scheduled jobs the agent left for itself, read by both engines (the old one in hooks.mjs, v2's end check).
const textOf = c => typeof c === 'string' ? c : Array.isArray(c) ? c.filter(x => x && x.type === 'text').map(x => x.text || '').join('\n') : '';
const isToolResult = c => Array.isArray(c) && c.some(x => x && x.type === 'tool_result');

// Wakeups the agent scheduled for itself that have not fired or been cancelled: ScheduleWakeup, CronCreate, and any
// later tool that sends a prompt back into this session at a later time (a name with wake, cron, schedule, timer,
// remind or alarm in it, and a "prompt" to send). Like a watcher, one left pending after the answer re-invokes the
// session later. A headless run (claude -p, the SDK) does not even end while one is pending: its caller waits until the
// run's time limit kills it, and gets no answer at all.
// Lesson: a setup scheduled a "just in case" 20-minute wakeup while its audit ran in the background, wrote the whole
// answer, and the headless run was killed at its 60-minute limit with the wakeup still pending: the user got nothing.
// Not counted: cloud routines (RemoteTrigger) and connected services' tools (mcp__...), which run elsewhere and keep
// nothing here alive. A wakeup has ended when its prompt came back (it fired), when its time is past (one-time only),
// or when it was cancelled: ScheduleWakeup with stop: true, or a delete or cancel tool given its id (CronDelete).
export const WAKE_KNOWN = { ScheduleWakeup: { kind: 'wakeup', cancel: 'call ScheduleWakeup with stop: true' }, CronCreate: { kind: 'cron', cancel: 'call CronDelete with its id' } };
const WAKE_TOOL = /wake|cron|schedul|timer|remind|alarm/i, WAKE_NOT = /^mcp__|list|delete|cancel|stop|get|read|remove|clear|remote|trigger/i;
const WAKE_CANCEL = /delete|cancel|stop|remove|clear/i;
export const isWakeTool = (name, input = {}) => !!name && !(input?.stop || input?.cancel) &&
  (WAKE_KNOWN[name] ? true : WAKE_TOOL.test(name) && !WAKE_NOT.test(name) && typeof input?.prompt === 'string');
// the request asks for a reminder, a loop or a schedule: a wakeup it leaves is the work itself
export const WAKE_ASK = /(^|\s)\/loop\b|\b(remind me|wake me|every \d+\s*(s|secs?|seconds?|m|mins?|minutes?|h|hours?|days?)\b|on a schedule|schedul(e|ed|ing)\b|cron\b|recu[eé]rdame|av[ií]same|cada \d+\s*(min|minutos?|horas?|segundos?|d[ií]as?)\b)/i;
export const wakeFamily = n => String(n).replace(/Create|Delete|Cancel|Stop|Remove|Clear|Add|Set|Schedule|Unschedule/g, '');
export function wakeupsPending(rows, now = Date.now()) {
  const pending = [], results = new Map();
  rows.forEach(r => { const c = r.message?.content; if (r.type === 'user' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_result') results.set(x.tool_use_id, { text: textOf(x.content) || String(typeof x.content === 'string' ? x.content : ''), err: !!x.is_error, extra: r.toolUseResult }); });
  rows.forEach((r, i) => {
    const c = r.message?.content, ts = Date.parse(r.timestamp || '') || 0;
    if (r.type === 'assistant' && Array.isArray(c)) for (const x of c) {
      if (x?.type !== 'tool_use') continue;
      const input = x.input || {}, res = results.get(x.id), known = WAKE_KNOWN[x.name];
      if (isWakeTool(x.name, input)) {
        // (a call that was refused or failed scheduled nothing)
        if (!res || res.err || /\b(error|denied|refused|failed|invalid|not (allowed|available|scheduled))\b/i.test(res.text)) continue;
        // one wakeup at a time: a new ScheduleWakeup replaces the one before it
        if (known?.kind === 'wakeup') for (let k = pending.length - 1; k >= 0; k--) if (pending[k].tool === x.name) pending.splice(k, 1);
        const id = /\bid\b\W{0,3}([\w-]{4,})/i.exec(res.text)?.[1] || (typeof res.extra?.id === 'string' ? res.extra.id : '');
        const delay = Number(input.delaySeconds ?? input.delay_seconds ?? /\bin (\d+)\s*s\b/.exec(res.text)?.[1] ?? NaN);
        const at = Number(res.extra?.scheduledFor) || (ts && delay > 0 ? ts + delay * 1000 : 0);
        const recurring = known?.kind === 'cron' ? input.recurring !== false : !known && !at;
        pending.push({ tool: x.name, id, prompt: String(input.prompt || ''), at, recurring, i, cancel: known?.cancel || 'cancel it with the tool that deletes or cancels it, given its id' });
      } else if (known && (input.stop || input.cancel)) {
        for (let k = pending.length - 1; k >= 0; k--) if (pending[k].tool === x.name) pending.splice(k, 1);
      } else if (WAKE_CANCEL.test(x.name) && res && !res.err) {
        const s = JSON.stringify(input);
        for (let k = pending.length - 1; k >= 0; k--) {
          const p = pending[k];
          if (p.id ? s.includes(p.id) : wakeFamily(p.tool) && wakeFamily(p.tool) === wakeFamily(x.name)) pending.splice(k, 1);
        }
      }
    }
    // it fired: its prompt came back as a message (Claude Code adds it as a meta user row)
    if (r.type === 'user' && !isToolResult(c)) {
      const t = textOf(c).trim();
      if (t) for (let k = pending.length - 1; k >= 0; k--) if (pending[k].i < i && t === pending[k].prompt.trim()) { if (pending[k].recurring) pending[k].fired = true; else pending.splice(k, 1); }
    }
  });
  // a one-time wakeup whose time is past has fired (its prompt may not be in the transcript yet)
  return pending.filter(p => p.recurring || !p.at || now < p.at + 60_000).map(({ i, ...p }) => p);
}

// REQ: wakeup-left. The end check's step: once the turn's own work is done, a wakeup or job the session scheduled for
// itself is cancelled, or the answer says what it will do (its id, or the words wakeup, reminder, cron, scheduled). In
// a headless run saying so is not enough (the run does not end while it is pending), unless the request asked for a
// reminder, a loop or a schedule. A recurring job that has fired already is a standing schedule, kept on purpose.
const WAKE_SAID = /\b(wake-?ups?|reminders?|cron|scheduled|recurring|recordatorios?|programad[oa]s?)\b/i;
export function wakeGaps(rows, answer = '', prompt = '', now = Date.now()) {
  const headless = rows.some(r => /^sdk/.test(String(r?.entrypoint || ''))), forced = headless && !WAKE_ASK.test(prompt);
  const left = wakeupsPending(rows, now).filter(w => forced || (!(w.recurring && w.fired) && !((w.id && answer.includes(w.id)) || WAKE_SAID.test(answer))));
  if (!left.length) return [];
  const hhmm = ms => { const d = new Date(ms); return Number.isNaN(+d) ? '' : d.toTimeString().slice(0, 5); };
  return [`${left.length > 1 ? `${left.length} wakeups you scheduled are` : 'A wakeup you scheduled is'} still pending: ` +
    left.map(w => `"${w.prompt.replace(/\s+/g, ' ').slice(0, 70)}" (${w.tool}${w.id ? ` ${w.id}` : ''}${w.at ? `, due ${hhmm(w.at)}` : w.recurring ? ', recurring' : ''}; to cancel: ${w.cancel})`).join(', ') + '. ' +
    (forced ? 'This run is headless (claude -p or the SDK): it does not end while a wakeup is pending, so its caller waits until the time limit stops the run and gets no answer at all. Cancel it now, then end with the whole answer. Background jobs and helpers wake you by themselves when they end; they need no fallback wakeup.'
      : 'It re-invokes the session later, and the reply to it becomes the last message the user reads. Cancel it now, then end with the whole answer. If it must stay on purpose, say in the answer what it will do and when.')];
}

// Watchers the agent armed (the Monitor tool: "Monitor started (task <id>, expires in 10m ...)") that have not ended yet.
// A watcher does no work of its own: it only waits for something and wakes the session when it sees it. One left armed
// after the turn ends wakes the session later, and the agent's reply to that notice becomes the last message the user
// reads. Lesson: a reviewer's watcher outlived the review, expired 7 minutes after a clean end, and "Nothing has
// changed, that notice came from a leftover watcher" replaced the whole answer of a headless run.
// It has ended when a notice names it with a final status or says it expired or its stream ended, or when the agent
// stopped it (TaskStop, KillShell) by its id.
const WATCHER_TOOL = /^Monitor$/;
const WATCH_END = /<status>\s*(completed|stopped|failed|killed|cancell?ed)\s*<\/status>|\bMonitor expired\b|\bstream ended\b/i;
export function watchersArmed(rows) {
  const armed = new Map(), results = new Map();
  rows.forEach(r => { const c = r.message?.content; if (r.type === 'user' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_result') results.set(x.tool_use_id, textOf(x.content)); });
  rows.forEach(r => {
    const c = r.message?.content;
    if (r.type === 'assistant' && Array.isArray(c)) for (const x of c) {
      if (x?.type !== 'tool_use') continue;
      const res = results.get(x.id) || '';
      if (WATCHER_TOOL.test(x.name)) {
        // (a watcher that never started, refused or failed, is not armed)
        const m = /\btask[ _]?(?:id)?\s*[:(]?\s*["']?([\w-]{4,})/i.exec(res);
        if (m && /\b(started|armed|watching)\b/i.test(res)) armed.set(m[1], { id: m[1], toolUseId: x.id, desc: String(x.input?.description || '').slice(0, 80) });
      } else if (/^(TaskStop|KillShell|KillBash)$/.test(x.name)) {
        const s = JSON.stringify(x.input || {});
        for (const id of [...armed.keys()]) if (s.includes(id)) armed.delete(id);
      }
    }
    const t = r.type === 'attachment' ? textOf(r.attachment?.prompt ?? r.attachment?.content ?? '') : r.type === 'user' ? textOf(c) : '';
    if (/<task-notification>/.test(t) && WATCH_END.test(t)) for (const [id, w] of [...armed]) if (t.includes(id) || t.includes(w.toolUseId)) armed.delete(id);
  });
  return [...armed.values()];
}

// REQ: watcher-left. The watchers the answer does not name (its id or what it watches), as one step: stop each, or say
// in the answer why it keeps running. A watcher the answer names is kept on purpose.
export function watcherLeft(watchers, raw = '') {
  const left = (watchers || []).filter(w => !raw.includes(w.id) && !(w.desc.length >= 8 && raw.toLowerCase().includes(w.desc.toLowerCase())));
  return left.length ? [`${left.length > 1 ? 'Watchers you started are' : 'A watcher you started is'} still armed: ${left.map(w => `${w.desc ? `"${w.desc}" ` : ''}(task ${w.id})`).join(', ')}. ` +
    'A watcher left armed after the turn wakes the session later, and the reply to its notice becomes the last message the user reads. Stop it now (TaskStop with its id), then end with the whole answer. ' +
    'If it must keep running on purpose, say in the answer what it watches and why.'] : [];
}
