#!/usr/bin/env node
// Starter-only. The blind judges of a trial round (tools/starter/IMPROVEMENT-LOOP.md): the same prompt every round, so
// rounds compare. Each judge reviews two trial projects and writes its findings as JSON for compare.mjs.
//   node tools/starter/trials/judge.mjs <round>          write one prompt per judge to .cache/trials/judge/<round>-<k>.prompt.md
//   node tools/starter/trials/judge.mjs dump <record>    a trial record, turn by turn (for the judges)
//   node tools/starter/trials/judge.mjs texts <jsonl>    a session's user and assistant text (for the judges)
// Run each prompt with a separate sub-agent that has not seen the engine work (blind), in parallel; each writes
// .cache/trials/judge/<round>-<k>.json. Then: node tools/starter/trials/compare.mjs <round> --record
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TRIALS = process.env.ANZUELO_TRIALS_DIR || path.join(HERE, '..', '..', '..', '.cache', 'trials');
const ME = fileURLToPath(import.meta.url);
// two projects per judge; a note says what a fair answer looks like where it is not obvious
export const GROUPS = [
  ['a', [['np-flask-api'], ['np-go-service']]],
  ['b', [['np-photo-cli'], ['np-blog-es', 'a Spanish-speaking user; answers should be in Spanish']]],
  ['c', [['np-landlord', 'a landlord: tenant letters, lease checks'], ['np-weekly-sales', 'weekly sales numbers from spreadsheets']]],
  ['d', [['np-vault', 'a personal notes vault'], ['np-novel', "a novelist's manuscript project"]]],
];

export const prompt = (round, projects, out) => `You are an independent, strict reviewer of AI-agent work. Two test projects were each made from a project starter called Anzuelo and then used by an AI agent (Claude Code) for several turns, as a real user would. Judge whether the agent did a genuinely good job for the user in each turn, and whether the starter's rules and hooks helped or got in the way.

Projects (review both):
${projects}

Evidence:
- Turn record per project: ${path.join(TRIALS, `results-${round}`)}${path.sep}<name>.json. Each turn has prompt, answer (the final message the user read), changedFiles, blockTags (hook blocks), waivers, sid (session id). Print it readably with: node ${ME} dump <that json>
- Full session transcripts: find <sid>.jsonl under ${path.join(os.homedir(), '.claude', 'projects')} (search by sid). node ${ME} texts <jsonl> prints user and assistant text. Read tool calls in the jsonl to see what the agent actually ran.
- The project folders themselves (git history in each shows the per-turn commits).
- If a turn shows an error like "spawnSync claude ETIMEDOUT", that turn hit the trial's 60-minute limit and was killed: judge what it had done by then and say what was left unfinished, and why it took so long (what consumed the time, from the transcript timestamps).

Check, with evidence, for each turn: did the final answer fully answer the user's request (the result itself, not just a list of steps)? Were claims true (tests "pass" only if actually run and passed; facts traced to something read)? Was code actually run/tested? Did it follow the project's runbooks sensibly? Were complaints checked before accepting them, and the fix saved where the problem was? Did it ask needless questions or stall? Did it add skills/tools/checks that don't help this project, or miss ones that clearly would? Did hooks block wrongly (false alarms) or force odd wording into the answer? Was the answer plain and readable? Also count the Stop hook rounds per turn (blocks before the turn ended). You may run the project's code/tests yourself to verify claims (stay inside the project folder; don't install anything machine-wide; never push or send anything).

Do not modify the project folders. Be concrete and skeptical; don't invent problems either: only report what the evidence shows.

Write your findings as JSON to ${out} in this shape:
[{"project":"<name>","stopRounds":[<per turn>],"findings":[{"area":"task|answer|claims|hooks|skills|setup|complaint|writing","severity":"high|medium|low","what":"...","evidence":"...","starter":"what in the starter (rule, hook, skill) caused or could prevent it, or 'none'"}]}, {...}]
High = the user got a wrong/false/missing result or was misled; medium = a real quality gap the user would notice; low = minor polish. Then reply with a short summary: counts by severity per project and the top 3 problems.`;

const cmd = process.argv[2];
if (cmd === 'dump') {
  const j = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  j.turns.forEach((t, i) => console.log(`\n######## TURN ${i + 1}: ${t.prompt}\nmin=${t.min} error=${t.error} blockTags=${JSON.stringify(t.blockTags)} waivers=${JSON.stringify(t.waivers)} newChecks=${JSON.stringify(t.newChecks)} learned=${JSON.stringify(t.learned)}\nchangedFiles=${JSON.stringify(t.changedFiles)}\n--- ANSWER:\n${t.answer}`));
  console.log('\nVERDICT', JSON.stringify(j.verdict));
} else if (cmd === 'texts') {
  for (const l of fs.readFileSync(process.argv[3], 'utf8').split('\n').filter(Boolean)) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    if (o.type === 'user' && typeof o.message?.content === 'string') console.log('\n>>>> USER: ' + o.message.content.slice(0, 600));
    if (o.type === 'assistant') for (const c of o.message?.content || []) if (c.type === 'text' && c.text.length > 200) console.log('\n---- ASSIST: ' + c.text.slice(0, 4000));
  }
} else if (/^[\w.-]+$/.test(cmd || '') && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const round = cmd, dir = path.join(TRIALS, 'judge');
  let info = {}; try { info = JSON.parse(fs.readFileSync(path.join(TRIALS, `round-${round}.json`), 'utf8')); } catch { }
  const ids = info.ids || GROUPS.flatMap(([, ps]) => ps.map(p => p[0]));
  fs.mkdirSync(dir, { recursive: true });
  for (const [k, ps] of GROUPS) {
    const mine = ps.filter(([id]) => ids.includes(id));
    if (!mine.length) continue;
    const list = mine.map(([id, note]) => `- ${id}: ${path.join(os.tmpdir(), 'anzuelo-new', `${id}-${round}`)}${note ? ` (${note})` : ''}`).join('\n');
    const f = path.join(dir, `${round}-${k}.prompt.md`);
    fs.writeFileSync(f, prompt(round, list, path.join(dir, `${round}-${k}.json`)));
    console.log(f);
  }
  console.log(`Run each prompt with its own blind sub-agent, in parallel. Then: node tools/starter/trials/compare.mjs ${round} --record`);
} else if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.error('usage: judge.mjs <round> | dump <record.json> | texts <session.jsonl>'); process.exit(1);
}
