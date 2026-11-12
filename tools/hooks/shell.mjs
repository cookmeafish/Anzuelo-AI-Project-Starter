// Reading a shell command: its parts, its text without here-documents or quoted strings, and what it would do (push,
// send, edit in place). Pure, shared by the safety guard, the end check and the old engine (plan step 1b).
// (a command without its here-document bodies. Lesson: a patch script naming a test file was taken as a run of that test)
export const cmdHead = c => String(c || '').replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2\b/g, '<<$2');
// A shell command's top-level parts and the operators between them (quotes and redirections like 2>&1 respected).
export function shellParts(cmd) {
  const parts = [], ops = []; let cur = '', q = null;
  const s = String(cmd || '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i], two = s.slice(i, i + 2);
    if (q) { cur += c; if (c === q) q = null; else if (c === '\\' && q === '"' && i + 1 < s.length) cur += s[++i]; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (two === '&&' || two === '||') { parts.push(cur); ops.push(two); cur = ''; i++; continue; }
    if (c === ';' || c === '\n' || c === '|' || (c === '&' && !/[<>]/.test(s[i - 1] || '') && s[i + 1] !== '>')) { parts.push(cur); ops.push(c === '\n' ? ';' : c); cur = ''; continue; }
    cur += c;
  }
  parts.push(cur);
  const out = { parts: [], ops: [] };
  parts.forEach((p, i) => { if (p.trim()) { if (out.parts.length) out.ops.push(ops[i - 1] || ';'); out.parts.push(p.trim()); } });
  return out;
}
// A command line without what it only quotes (a quoted argument, a heredoc's text); "bash -c '...'" and eval still run
// what they quote. Lessons, field reports: a waive reason and a feedback line that named a command were refused as it.
export const runText = c => cmdHead(c).replace(/(?<!(?:-c|eval)\s+)("[^"\n]*"|'[^'\n]*')/g, '""');
// A real "git push": git, its own options, then push ("git stash push" is local). Lesson, field report: "git stash push
// <file>" was held as an outward push.
const GIT_PUSH = /(?:^|[;&|(\n"']\s*)git(?:\s+-[cC]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+push\b[^\n;&|"']*/i;
export const gitPush = c => GIT_PUSH.exec(runText(c));
// Outward actions (rule 6) in a command: mail, messaging or web APIs written to (not localhost), GitHub issues, PRs,
// comments and reviews, and any git push. Returns the matched text, or null.
export function outwardCommand(cmd) {
  // (text a heredoc writes into a file is not a command that runs. Lesson, trial round 12: a DECISIONS.md entry saying
  // "git push to GitHub, then a workflow deploys" was blocked as a push)
  const c = String(cmd || '').replace(/<<-?\s*(['"]?)(\w+)\1[\s\S]*?\n\2\b/g, '');
  // (the commands themselves, not what is only quoted: a feedback line naming "git stash push" was held as a push)
  const run = runText(c);
  const pats = [
    /\bSend-MailMessage\b[^\n;&|]*/i, /\b(sendmail|mailx|msmtp|swaks)\b[^\n;&|]*/i, /(^|[\s;&|(])mail\s+-s\b[^\n;&|]*/i,
    /\bgh\s+(issue|pr)\s+(create|comment|close|reopen|merge|edit|review|ready)\b[^\n;&|]*/i, /\bgh\s+api\b[^\n;&|]*(-X|--method)\s*(POST|PUT|PATCH|DELETE)\b[^\n;&|]*/i,
    GIT_PUSH
  ];
  for (const p of pats) { const m = p.exec(run); if (m) return m[0].replace(/^[;&|(\n"'\s]+/, ''); }
  // web writes: curl / wget / Invoke-WebRequest / Invoke-RestMethod sending data or a writing method, to a non-local host
  for (const seg of c.split(/&&|\|\||[;\n]/)) {
    if (!/\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod|iwr|irm|http)\b/i.test(seg)) continue;
    const writes = /(-X|--request|-Method)\s*["']?(POST|PUT|PATCH|DELETE)\b|\s(-d|--data(-raw|-binary|-urlencode)?|-F|--form|--post-data|-Body)\b/i.test(seg);
    const url = (/https?:\/\/[^\s"']+/i.exec(seg) || [])[0] || '';
    if (writes && url && !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?\b/i.test(url)) return seg.trim();
  }
  return null;
}
// The files each "sed -i" in a command edits: its words after the flags, minus the script (the first word, unless -e
// or -f gave it). Quotes are removed, so a quoted path is still a file and a quoted script is never one.
export function sedInPlaceFiles(cmd) {
  const out = [], segs = [[]];
  // split on ; | & and newlines outside quotes only (a script like s|a|b| keeps its bars)
  for (const m of String(cmd).matchAll(/"((?:\\.|[^"\\])*)"|'([^']*)'|(&&|\|\||[;|&\n])|([^\s;|&"']+)/g))
    if (m[3]) segs.push([]); else segs[segs.length - 1].push(m[1] ?? m[2] ?? m[4]);
  for (const words of segs) {
    const i = words.indexOf('sed');
    if (i < 0) continue;
    const rest = words.slice(i + 1);
    if (!rest.some(w => /^-[^-]*i|^--in-place/.test(w))) continue;
    let script = false; const files = [];
    for (let k = 0; k < rest.length; k++) {
      const w = rest[k];
      if (/^-(e|f)$|^--(expression|file)$/.test(w)) { script = true; k++; continue; }
      if (/^-/.test(w)) continue;
      if (!script) { script = true; continue; }
      files.push(w);
    }
    out.push(...files);
  }
  return out;
}
