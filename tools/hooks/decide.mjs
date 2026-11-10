// REQ: autonomy-decide, shared by both engines (moved from hooks.mjs unchanged). A user who asked not to be asked gets
// decisions, not a closing question, except for what AGENTS.md step 0.5 keeps for them (outward actions, installs,
// anything irreversible, security, money). Lesson: under autonomy auto an answer ended by asking whether to keep or
// archive deleted records.
// endsAsking(answer): the answer (its English copy cut off) ends by asking the user something it could decide itself.
import { EN_COPIES } from './labels.mjs';

export function endsAsking(answer) {
  // (the whole answer: the writing rules put a question last, after the Finished section. Lesson (a trial): two
  // answers to a user who said "do not ask me anything" ended with "Question for you:" below Finished, unseen)
  const body = String(answer || '').split(EN_COPIES)[0].trim(), parts = body.split(/^(?=#{1,6}\s*\**finished\b)/im);
  const lastOf = s => s.split(/\n\s*\n/).filter(b => b.trim() && !/^\s*(playbook|skill|n\/a\(|worth it|#{1,6}\s*\**finished\b)/i.test(b)).pop() || '';
  // (the last block before Finished, or a question after it)
  const after = parts.length > 1 ? lastOf(parts.slice(1).join('')) : '', tail = /\?\s*\**\s*$/.test(after) ? after : lastOf(parts[0]);
  // (a labeled question, or a closing "reply with a number", asks too; what it is about is the question itself, not
  // the options under it. Lesson, trial round 9: "Question for you: who should be able to delete a book?" with four
  // options and "Reply with a number" stalled a turn the user had said to decide, and an option's mention of a leaked
  // password would have exempted it anyway)
  const labeled = /\*\*\s*(question for you|pregunta para ti)\s*:?\s*\*\*\s*:?\s*([^\n]*)/i.exec(body);
  const asks = /\?\s*\**\s*$/.test(tail) || !!labeled || /^\W*(reply|answer|tell me|choose|pick|let me know|responde|dime|elige)\b[^\n]*$/im.test(tail.split('\n').pop() || '');
  const about = labeled ? `${labeled[2]} ${tail.split('\n').pop()}` : tail;
  return asks && !OUTWARD.test(about);
}
// What stays the user's to answer: outward actions, installs, money, security, anything irreversible.
export const OUTWARD = /\b(publish|push|send|deploy|release|install|irreversible|money|pay|buy|password|secret|security|legal)\w*|\b(delete|wipe|erase) (it|them|this|that|your|all|the \w+ now)\b/i;
