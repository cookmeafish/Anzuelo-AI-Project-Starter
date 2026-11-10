// REQ: review-excuse, shared by both engines (moved from hooks.mjs unchanged). "No other reviewer" is no reason to skip
// an independent review where sub-agents exist: a reviewer sub-agent is one. Lesson: a setup shipped a whole site
// unreviewed "because this session has no other reviewer", and the next turn of the same session started a reviewer
// sub-agent.
// "No reviewer available" as the reason a review was skipped (English and Spanish), on a line about the review
const REVIEW_EXCUSE = /\b(no|without( an?)?|lacks? an?|there (is|was|are) no)\s+(other|second|separate|independent|available|another|extra)\s+(reviewers?|agents?|person|people|pair of eyes)\b|\bno (independent |second |other )?reviewer (is |was )?(available|here|in this session)|\bno one else\b[^.\n]{0,40}\b(review|available|session)|\bnobody (else )?(is |was )?(available|here)\b|\bno hay (otro|otra|ning[uú]n|un segundo|una segunda)\s+(revisor|revisora|agente|persona)\b|\bno hay nadie m[aá]s\b|\bsin (otro |un segundo )?revisor\b|\bno (hay|tengo) (qui[eé]n|a nadie) que (lo |la )?revise\b/i;
// reviewExcuse(answer, subagents): the message for an answer line that skips the review for want of a reviewer, or "".
export function reviewExcuse(answer, subagents) {
  const excuse = subagents && String(answer || '').split(/\r?\n/).find(l => /\breview|\brevis/i.test(l) && REVIEW_EXCUSE.test(l));
  return excuse ? `The answer skips the independent review because no other reviewer is available ("${excuse.trim().slice(0, 80)}"). A reviewer sub-agent is one: ` +
    'start it with the Agent (or Task) tool and a read-only brief (read AGENTS.md, the request or spec and the changed files; report SHIP or FIX with evidence), fix what it finds until SHIP, and report its verdict. ' +
    'Only an agent that truly cannot start sub-agents may say so: node tools/hooks/hooks.mjs waive review-excuse "<why>".' : '';
}
