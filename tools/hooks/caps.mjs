// How capitals and signs of trouble weigh in a message, shared by both engines (one definition). Words in capitals are
// emphasis; shouting needs a sign of trouble too; "NEVER" or "ALWAYS" in capitals marks a standing rule the user means.

// A message's own words, without quoted passages: code blocks, "> " quotes and long quotations are someone else's.
// (an apostrophe inside a word is no quote mark. Lesson (a field report): the text between "doesn't" and "don't" was
// taken for a quotation and dropped, and with it the request's "there might be other ones too")
export const unquoted = s => String(s || '').replace(/```[\s\S]*?(```|$(?![\s\S]))/g, ' ').replace(/^\s*>.*$/gm, ' ')
  .replace(/["“][^"”\n]{40,}["”]/g, ' ')
  .replace(/(?<![\p{L}\p{N}])['‘](?:[^'’\n]|(?<=\p{L})['’](?=\p{L})){40,}?['’](?![\p{L}\p{N}])/gu, ' ');

// A sign that a message in capitals is about something wrong: "??" or "!!", or a word for a problem, a repeat or blame,
// or for being misunderstood (Lesson (a field report): a reply shouted as "you don't understand" read as calm).
// ("!!" after a word of delight is excitement. Lesson (a field report): a rule explained with "which is crazy!!" and
// words in capitals for emphasis read as upset, and its rule hint was dropped)
export const TROUBLE = /\?\?|(?<!\b(crazy|awesome|amazing|great|cool|nice|wow|yes|yay|insane|love it|so good))!!|\b(again|(you )?(don'?t|do not|didn'?t|did not) (understand|get it|listen)|not listening|missed (my|the) point|still|why|stop|wrong|broke|broken|bug|bugs|error|errors|fail|fails|failed|failing|crash\w*|issue|issues|problem|ignor\w*|forgot|forget|supposed to|this time|hold up|wait|seriously|wtf|shit(?!\s*(tons?|loads?)\b)|fuck\w*|damn|hell|angry|pissed|pissing|unacceptable|terrible|sloppy|horrible|awful|ridiculous|dumb|stupid|useless|i (already )?(said|told you|asked)|what i (said|told you|asked)|not working|doesn'?t work|should not happen|no my|otra vez|por qu[eé]|basta|mal)\b/i;

// Words in capitals inside a message are emphasis: a run of 3 or more, or a word of frustration, is shouting; "NEVER" or
// "ALWAYS" is a standing rule the user means. Acronyms (API, JSON, README) are not emphasis. Lesson, the user: "ALL CAPS
// tend to signify frustration too or something that should be taken seriously"; only a message almost all in capitals
// counted.
export const ACRONYM = /^(API|GUI|UI|UX|AI|CLI|SDK|JSON|YAML|TOML|XML|HTML|CSS|JS|TS|URL|URI|PDF|CSV|SQL|DB|ID|IDS|OK|PR|CI|CD|OS|USB|HTTP|HTTPS|SSH|DNS|IP|VPN|GPU|CPU|RAM|SSD|NPM|LLM|GPT|MCP|TODO|FYI|ASAP|README|CHANGELOG|STATUS|AGENTS|CLAUDE|BRIEF|DECISIONS|DIRECTORY|SKILL|PASS|FAIL|N\/A|US|UK|EU|UTC|PST|PDT|AM|PM|RPG|FAQ|PNG|JPG|JPEG|SVG|GIF|MP3|MP4|ENV|LTS|ESM|II|III|IV|VI)$/;
export const CAPS_UPSET = /^(AGAIN|WHY|STOP|WRONG|SERIOUSLY|WTF|OTRA|VEZ|POR|QU[EÉ]|BASTA|MAL)$/;
export function capsWeight(prompt) {
  // (code and names in it are no emphasis: `quoted`, MAX_FILE_SIZE, H264)
  const words = unquoted(String(prompt || '')).replace(/`[^`]*`/g, ' ').replace(/[\w$]*[_\d][\w$]*/g, ' ').match(/[A-Za-zÁÉÍÓÚÑáéíóúñ'\/]+/g) || [];
  const caps = w => w.length >= 2 && w === w.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{2}/.test(w) && !ACRONYM.test(w);
  let run = 0, longest = 0;
  for (const w of words) { run = caps(w) ? run + 1 : 0; longest = Math.max(longest, run); }
  const capped = words.filter(caps);
  // (a message almost all in capitals is judged by the share test; a short one-word "OK" or "NO" is no emphasis)
  // (only "never" and "always" mark a standing rule: "change ONLY the header" or "it MUST work" is about this request)
  return { shouted: longest >= 3 || capped.some(w => CAPS_UPSET.test(w)), rule: capped.some(w => /^(NEVER|ALWAYS|NUNCA|SIEMPRE)$/.test(w)) };
}
// Capitals that read as upset: a message mostly in capitals, or shouting inside it, with a sign of trouble, and no
// delight. (capitals alone are emphasis. Lesson (two projects' trigger logs): eager requests such as "GO ALL OUT" or a
// request typed in capitals read as upset and held all work until an Issue line)
export function capsUpset(text) {
  const p = String(text || ''), letters = p.replace(/[^A-Za-z]/g, '');
  return ((letters.length > 20 && p.replace(/[^A-Z]/g, '').length / letters.length > 0.6) || capsWeight(p).shouted) && TROUBLE.test(p)
    && !/\b(i (really |just )?love|thank(s| you)|awesome|amazing|perfect|so good|great job|well done)\b/i.test(p);
}
