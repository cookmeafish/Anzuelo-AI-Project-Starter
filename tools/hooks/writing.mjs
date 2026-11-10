// REQ: plain-writing, shared by both engines (moved from hooks.mjs unchanged): what a reader would notice in the
// answer or a user-facing file.
import { config } from './settings.mjs';

// The lines of a letter, email or message to another person, where courtesy (cfg.courtesy) is warmth, not filler: the
// whole file when it is a draft in a drafts, letters, correspondence, emails or messages folder (the correspondence skill
// saves to outputs/drafts/), else each block from a greeting line ("Dear Sam,", "Hi Ana", "Hola Marta:") to the next
// sign-off line ("Kind regards,", "Thanks,", "Un saludo,"). A doc or an answer with neither keeps every filler rule.
const LETTER_DIR = /(^|\/)(drafts?|letters?|correspondence|e-?mails?|messages?)\//i;
const GREETING = /^\s*(\*\*)?(dear|hi|hello|hey|good (morning|afternoon|evening)|greetings|hola|estimad[oa]s?|querid[oa]s?|buen[oa]s (d[ií]as|tardes|noches))\b(\[[^\]\n]*\]|[^\n.!?[]){0,60}[,:!]?(\*\*)?\s*$/i;
const SIGN_OFF = /^\s*(\*\*)?((kind|best|warm|warmest|many|with)\s+(regards|wishes|thanks)|regards|best|yours( sincerely| faithfully| truly)?|sincerely|thanks( again)?|thank you|cheers|all the best|love|take care|saludos|un saludo|un abrazo|atentamente|cordialmente|gracias)\b(\[[^\]\n]*\]|[^\n.!?[]){0,25}[,.!]?(\*\*)?\s*$/i;
export function letterLines(lines, where = 'answer') {
  const out = new Set();
  if (where !== 'answer' && where !== 'text' && LETTER_DIR.test(String(where).replace(/\\/g, '/'))) { lines.forEach((_, i) => out.add(i)); return out; }
  for (let i = 0; i < lines.length; i++) {
    if (!GREETING.test(lines[i])) continue;
    const end = lines.findIndex((l, j) => j > i && SIGN_OFF.test(l));
    if (end < 0) continue;
    for (let j = i; j <= end; j++) out.add(j);
    i = end;
  }
  return out;
}
// Problems a reader would notice: em dashes, filler phrases, walls of text, run-on sentences. Code and quotes are skipped.
export function writingProblems(text, cfg = config(), where = 'answer') {
  const probs = [];
  const blank = m => m.replace(/[^\n]/g, ' '); // keeps line numbers
  let src = String(text || '');
  // In a page, only the text people read is writing: scripts, styles, comments and template literals are code.
  // Lesson: a page's inline script was measured as a 200-word "sentence".
  // Tags are markup too, so a line holding only tags reads as blank and ends a paragraph. Lesson (sent back by a
  // project through its starter feedback): a whole recipe page was measured as one 293-word paragraph.
  if (/\.html?$/i.test(where) || /^\s*<!doctype html|<html[\s>]/i.test(src))
    src = src.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, blank).replace(/<!--[\s\S]*?-->/g, blank).replace(/`[^`]*`/g, blank)
      // a block element starts its own item, like a Markdown list line, so list items don't run into one sentence
      .replace(/<(li|dt|dd|tr|td|th|h[1-6]|p|div|section|article|header|footer|nav|main|ul|ol|table|br|figcaption)\b[^>]*>/gi, m => '- ' + ' '.repeat(Math.max(0, m.length - 2)))
      .replace(/<[^>]*>/g, blank);
  const lines = src.replace(/```[\s\S]*?```/g, blank).replace(/`[^`\n]*`/g, '``').split(/\r?\n/);
  const at = i => where === 'answer' ? '' : `:${i + 1}`;
  // courtesy phrases (cfg.courtesy) are warmth, not filler, in a letter, email or message to another person
  const letter = letterLines(lines, where);
  lines.forEach((l, i) => {
    if (/^\s*>/.test(l)) return; // quoted text is the user's or a source's words
    if (/—/.test(l)) probs.push(`${where}${at(i)}: em dash ("—"). Use a period, comma, colon or parentheses instead`);
    else if (/\s–\s/.test(l)) probs.push(`${where}${at(i)}: en dash used as a dash (" – "). Use a period, comma or colon instead`);
    const low = l.toLowerCase().replace(/["“][^"”]*["”]/g, '');
    for (const f of cfg.fluff) if (low.includes(f) && !(letter.has(i) && (cfg.courtesy || []).includes(f))) probs.push(`${where}${at(i)}: filler "${f}". Cut it or say the actual point`);
  });
  // A blank quote line (">") ends a paragraph, and each quoted list item stands on its own. Lesson: a multi-line
  // blockquote with list items was counted as one long paragraph.
  // A line that is only an image, only a link, or a table row stands on its own too. Lesson: a gallery of image embeds,
  // one per line, was measured as one long sentence.
  const own = l => /^\s*>\s*([-*+]|\d+[.)])\s/.test(l) || /^\s*(!?\[[^\]]*\]\([^)]*\)\s*)+$/.test(l) || /^\s*\|/.test(l);
  // Length is measured on the prose only. In an answer, the markers line (Playbook:, Skill:, Worth it:, N/A(...)) is
  // for the checks, not the reader, and a short answer is never a wall of text. Code spans and file paths are not
  // words either. Lesson: a 2-line progress answer was sent back for plain writing: its first line had no final period,
  // so it ran into the markers line and the two were measured as one 47-word sentence.
  // The last line counts as the markers line whenever it holds a marker, whatever its label ("Footer: Playbook: x").
  // Lesson: a two-sentence answer was flagged because its "Footer:" markers line was measured as prose.
  const MARKERS = /^\s*(\*\*)?(playbook|skill|worth it|footer|markers)\s*:|^\s*(\*\*)?n\/a\(/i, HAS_MARKER = /\b(playbook|skill|worth it)\s*:|\bn\/a\(/i;
  const lastLine = lines.findLastIndex(l => l.trim());
  const prose = where === 'answer' ? lines.map((l, i) => MARKERS.test(l) || (i === lastLine && HAS_MARKER.test(l)) ? '' : l) : lines;
  const count = s => s.replace(/``/g, ' ').split(/\s+/).filter(w => w && !/^[(\["']*[\w.~-]*[\\/][^\s]*$/.test(w) && !/^[(\["']*[\w-]+\.(md|mjs|js|cjs|ts|tsx|json|py|ya?ml|html?|css|txt|csv)\b/i.test(w) && /\w/.test(w)).length;
  if (where === 'answer' && count(prose.join(' ')) < 40) return [...new Set(probs)];
  const paras = prose.map(l => /^\s*>\s*$/.test(l) ? '' : own(l) ? `\n${l}\n` : l).join('\n').split(/\n\s*\n/);
  for (const p of paras) {
    if (/^\s*(\||[-*]\s|\d+\.\s|#)/m.test(p) && p.split('\n').length > 1) continue; // tables and lists are already structured
    // (so is a plain list: 3+ lines, each short and none ending in punctuation, one item per line. Wrapped prose has
    // longer lines. Lesson, field report: an import list, one item per line, read as a 204-word sentence)
    const pl = p.split('\n').filter(l => l.trim());
    if (pl.length >= 3 && pl.every(l => count(l) <= 8 && !/[.!?,;:]\s*$/.test(l))) continue;
    const words = count(p);
    if (words > cfg.maxParagraphWords) probs.push(`${where}: a ${words}-word paragraph ("${p.trim().slice(0, 50)}..."). Split it, or use a list or table`);
    for (const s of p.replace(/\n/g, ' ').split(/(?<=[.!?])\s+/)) {
      const n = count(s);
      if (n > cfg.maxSentenceWords && !/\|/.test(s)) { probs.push(`${where}: a ${n}-word sentence ("${s.trim().slice(0, 50)}..."). Break it up`); break; }
    }
  }
  return [...new Set(probs)];
}

// The step for the problems found, naming where they are: "seen in" reaches the short line. Lesson, trial round 24: the
// short line named nothing, and an answer was rewritten three times for a sentence in a file.
export function plainWritingMsg(wp) {
  const wpWhere = [...new Set(wp.map(w => w.split(':')[0]))].slice(0, 3).map(w => w === 'answer' ? 'the answer' : w.split('/').pop());
  return `Make it plain and direct (docs/checks/writing-standards.md): ${wp.slice(0, 8).join('; ')}${wp.length > 8 ? `; +${wp.length - 8} more (node tools/writing-check.mjs <file>)` : ''}. (seen in ${wpWhere.join(', ')})`;
}
