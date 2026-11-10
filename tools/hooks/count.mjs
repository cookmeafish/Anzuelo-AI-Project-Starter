// REQ: count-honored, shared by both engines (moved from hooks.mjs unchanged). countGaps(prompt, said): the messages
// for each count the request asked for that the agent's words never state.
export function countGaps(prompt, said) {
  const out = [], add = (tag, msg) => out.push(msg), x = { prompt: String(prompt || ''), said: String(said || '') }, re = (s, f = 'i') => new RegExp(s, f);
  // REQ: count-honored. "Do 10 sweeps" means 10, reported as 10. "A couple of ideas" is 2; "a few options, like 4" takes
  // the number said just after. Lesson: both were asked for and never counted.
  const NUM = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, 'a couple of': 2 };
  const low = x.prompt.toLowerCase();
  for (const m of low.matchAll(/\b(\d{1,3}|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|a couple of|a few|several)\s+(?:more\s+)?(sweeps?|passes|checks|rounds|options|ideas|examples|alternatives|variations|versions|drafts|sources|questions|suggestions)\b/g)) {
    const n = NUM[m[1]] || Number(m[1]) || Number(/^[^.?!\n]{0,20}?\b(\d{1,3})\b/.exec(low.slice(m.index + m[0].length))?.[1]);
    if (!n) continue; // "a few" with no number after it: no count to honor
    // (a number describing items that exist is no count asked for: "all 261 groups", "the 4 drafts", "these 3 checks";
    // and a plural number before a singular noun makes it a modifier, "261 sweep groups". Lesson (a live false hold,
    // 2026-11-10): "port all 261 sweep groups to v2" was held as a request for 261 sweeps)
    if (/\b(all|the|these|those|each of the|every one of the|of the|its|our|my|your|their|remaining|existing|other)\s+$/.test(low.slice(Math.max(0, m.index - 20), m.index))) continue;
    if (n > 1 && !/s$/.test(m[2])) continue;
    const word = Object.keys(NUM).find(k => NUM[k] === n);
    if (n > 1 && !re(`\\b(${n}${word ? '|' + word : ''})\\b`).test(x.said))
      add('count-honored', `The user asked for ${n} ${m[2]}. Deliver exactly that many and say so with the number (e.g. "${n} ${m[2]}: ...").`);
  }
  return out;
}
