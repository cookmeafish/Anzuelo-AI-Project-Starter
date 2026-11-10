// REQ: skill-learn, shared by both engines: a runbook or skill followed this turn whose own check failed in an earlier
// round (or fails now) gets its lesson written into it. Moved here from hooks.mjs unchanged; what the engine knows (the
// checks, waivers, setup, complaint verdicts) comes in through io.
// io: { complaintDisproved(said, answer), learnedNone(): regex, promptGated(): Set, waived(tag, text), ownChecks(item, cfg),
// loadRequirements(): { reqs }, setupTurn(x), esc }
export function makeSkillLearn(io) {
  const { esc } = io;
  // REQ: skill-learn. Skills improve from use: when a check that belongs to a runbook or skill followed this turn fails
  // (now, or in an earlier block of this turn), the lesson goes into it, so the next run does not repeat the miss. It is
  // judged with every other check, so the first round already lists it. Lesson: it only appeared from round 2 on, so the
  // stop rounds kept bringing up steps the first round never mentioned.
  // Lesson: it fired on any block or complaint, also for runbooks that were only opened or wrongly matched.
  function skillLearnCheck(x, cfg, failingNow = []) {
    // A miss is a check of the runbook's own that blocked an earlier round and is met now: following it really fell
    // short, and the fix is known. A check failing for the first time is just being done, not a lesson yet.
    // Lesson: skill-learn fired in round 1 of ordinary turns and pushed "Skill lesson: none" filler into answers.
    // A runbook's own check failing right now is listed too, as "once it is fixed": every step shows in round 1, so a
    // later round never brings a new one. Lesson: the lesson step appeared only in round 2, one more round for the user.
    // A check waived this turn (N/A(<tag>) or "hooks.mjs waive") did not apply: it is no miss of the runbook it belongs to.
    // Lesson: a runbook matched by mistake had its check waived as a wrong route, and the next round still asked for a
    // lesson to be written into that runbook.
    // A complaint the answer showed does not hold ("Learned (none): ...") was no miss of the runbook that handled it: the
    // checks the complaint itself set off are not a lesson for it. Lesson: after a disproved complaint, Stop asked to
    // write a lesson into the project runbook, and the agent wrote one about its own process although nothing was missed.
    const disproved = io.complaintDisproved(x.said || '', x.answer || '') && io.learnedNone().test(x.said || '');
    const failing = new Set([...(x.failedBefore || []).filter(t => !failingNow.includes(t)), ...failingNow].filter(t => !io.waived(t, x.said) && !(disproved && io.promptGated().has(t))));
    const own = item => io.ownChecks(item, cfg);
    // Friction from a wording check (reworded to satisfy it) is the check's, not the runbook's: never a lesson to write.
    // Lesson: rewording twice for no-verbatim-examples made skill-learn demand a lesson from an innocent runbook.
    const WORDING = new Set(['no-verbatim-examples', 'plain-writing', 'finished-summary', 'empty-answer', 'count-honored']);
    // (so is a check the answer's text alone meets: a report table, a verification line. Lesson, trial round 9: a missing
    // security-report table in the answer had the agent write "lessons" about rewording answers into the security runbook)
    const reqs = io.loadRequirements().reqs;
    // (met by the answer's text alone: every condition is on the answer, or one of its anyOf ways is)
    const textOnly = c => !!c && typeof c === 'object' && Object.keys(c).length > 0 && Object.entries(c).every(([k, v]) => /^answer/.test(k) || (k === 'anyOf' && Array.isArray(v) && v.some(textOnly)));
    const answerOnly = tag => textOnly(reqs.find(r => r?.tag === tag)?.require);
    for (const tag of reqs.map(r => r?.tag).filter(answerOnly)) WORDING.add(tag);
    // A runbook or skill the agent says was the wrong one (its name or one of its checks on a line that says so) was only
    // matched by mistake: nothing to learn there.
    const misrouted = item => [item.name, item.skillName, ...own(item)].filter(Boolean).some(n => MISROUTED(n).test(x.said));
    // A check waived this turn did not apply: its runbook was matched by mistake, not followed and missed.
    // Lesson: a runbook only reached through a wrong route was asked for a lesson after its check was waived.
    const waivedHere = tag => new RegExp(`N/A\\(${esc(tag)}\\)`, 'i').test(x.said);
    const failedOwn = [...x.usedPb, ...x.usedSkills].filter(item => !misrouted(item) && own(item).some(tag => !WORDING.has(tag) && failing.has(tag) && !waivedHere(tag)));
    const followed = [...new Set(failedOwn.map(item => item.file.endsWith('SKILL.md') ? item.file.replace(/SKILL\.md$/, '') : item.file))];
    // setup meets each runbook's checks for the first time: that is setting it up, not a miss to learn from
    if (io.setupTurn(x)) return [];
    if (x.workTurn && followed.length && !x.changed.some(p => followed.some(f => p === f || p.startsWith(f))) && !/skill lesson:\s*none\b.{8,}/i.test(x.said))
      return [{ tag: 'skill-learn', fixes: followed.map(f => f.endsWith('/') ? `${f}SKILL.md` : f), msg: `This turn followed ${followed.join(', ')} and its own check failed this turn. Write the lesson into it (a step, a pitfall, or a check ` +
        'through the project-rule skill), so the next run gets it right. In an engine skill (one of the starter\'s core skills), put it under ' +
        '"## Project lessons" at the end, which upgrades keep. A lesson never loosens a rule the user set or a promise made to them: if the check was wrong, fix the check. ' +
        'If it was not the runbook\'s fault, write "Skill lesson: none - <why>".' }];
    // (Lesson (website trials): after a false alarm, a forced lesson rewrote "never make up amounts" to allow it)
    return [];
  }
  // A line that names a runbook, skill or check and says it was matched by mistake ("deliverable.md was the wrong
  // runbook", "N/A(deliverable-file): wrong route", "runbook equivocado").
  const MISROUTE_WORDS = String.raw`wrong(ly)?[ -]+(route|routed|runbook|playbook|skill|match(ed)?)|mis-?rout\w*|mis-?match\w*|(matched|routed) by mistake|did(n'?t| not) (apply|fit)|does(n'?t| not) (apply|fit)|not the right (runbook|playbook|skill)|(runbook|playbook|skill|ruta) equivocad[oa]|por error|no (aplica|aplicaba|corresponde)`;
  const MISROUTED = n => new RegExp(`^[^\\n]*(?<![\\w-])${esc(n)}(\\.md)?(?![\\w-])[^\\n]*(${MISROUTE_WORDS})|^[^\\n]*(${MISROUTE_WORDS})[^\\n]*(?<![\\w-])${esc(n)}(\\.md)?(?![\\w-])`, 'im');
  return { skillLearnCheck, MISROUTE_WORDS, MISROUTED };
}
