// REQ: worth-it, shared by both engines (moved from hooks.mjs unchanged). An addition must make the project better: a
// new skill, pack or dependency comes with its gain and its cost, weighed. Lesson: "it fits" alone let additions in that
// made the project noisier or slower than before.
// x: { changed: [rel], runs: [{ cmd, error }], uses: [{ name, input }], toolsKnown, text: the answer and this turn's
// messages (in English) plus the turn notes }; cfg: { skillsDir }; io: { list(rel): names, read(rel): text,
// born(rel): made this turn, rel(path): project-relative, notesFile }.
// Returns [{ tag: 'worth-it', msg }].
import { WORTH_IT } from './labels.mjs';

export function worthGaps(x, cfg, io) {
  const newSkills = io.list(cfg.skillsDir).filter(n => { const f = `${cfg.skillsDir}/${n}/SKILL.md`; return x.changed.includes(f) && io.born(f) && !/^generated:\s*true/m.test(io.read(f)); });
  const added = x.runs.filter(r => !r.error && /\b(packs\.mjs\s+install|skills\.mjs\s+(enable|add)|npm\s+(i|install)\s+(-[DSE]\s+|--save(-dev)?\s+)?(?!-)[^\s;&|]|pnpm\s+add\s|yarn\s+add\s|pip3?\s+install\s+(?!-r\b|-e\b)[^\s;&|]|cargo\s+add\s|go\s+get\s|(flutter|dart)\s+pub\s+add\s|uv\s+add\s|poetry\s+add\s|bundle\s+add\s|gem\s+install\s|composer\s+require\s|dotnet\s+add\s+\S*\s*package\s)/.test(r.cmd)).map(r => r.cmd.slice(0, 60));
  // a dependency typed straight into a manifest counts too (Lesson: editing Cargo.toml or pubspec.yaml skipped the weighing)
  const DEP_LINE = { 'package.json': /^\s*"[@\w./-]+"\s*:\s*"[\^~>=<]?\d/, 'requirements.txt': /^\s*[A-Za-z][\w.-]*\s*([=<>~!]=?|$)/, 'Cargo.toml': /^\s*[\w-]+\s*=\s*("[\^~>=]?\d|\{)/,
    'pubspec.yaml': /^\s+[\w-]+:\s*["']?[\^~>=]?\d/, 'pyproject.toml': /^\s*"[A-Za-z][\w.-]*\s*([=<>~!]=|>|<)/, 'go.mod': /^\s*(require\s+)?[\w.-]+\/[\w./-]+\s+v\d/, 'Gemfile': /^\s*gem\s+["']/ };
  if (x.toolsKnown) for (const u of x.uses.filter(u => /^(Write|Edit|MultiEdit)$/.test(u.name))) {
    const f = io.rel(u.input.file_path || ''), rx = DEP_LINE[f.split('/').pop()];
    if (!rx) continue;
    const newText = [u.input.content, u.input.new_string, ...(u.input.edits || []).map(e => e.new_string)].filter(Boolean).join('\n');
    const oldText = [u.input.old_string, ...(u.input.edits || []).map(e => e.old_string)].filter(Boolean).join('\n');
    const fresh = newText.split(/\r?\n/).filter(l => rx.test(l) && !oldText.includes(l.trim()));
    // an edit adds what its new text has beyond its old; a whole-file write counts only for a manifest made this turn
    if (fresh.length && (u.input.content == null || io.born(f))) added.push(`${f}: ${fresh[0].trim().slice(0, 40)}`);
  }
  // the weighing may sit in any message of this turn (Lesson: every re-block demanded it again)
  // A plain sentence with the gain and the cost counts as much as the "Worth it: <gain> / <cost>" marker.
  // Lesson: setup answers carried stiff "Worth it: ... / cost: ..." lines in place of a sentence that said the same.
  if ((newSkills.length || added.length) && !WORTH_IT.test(x.text))
    return [{ tag: 'worth-it', msg: `You added ${[...newSkills.map(n => `the ${n} skill`), ...added].slice(0, 4).join(', ')}. Say why it makes this project better and what it costs ` +
      `(noise, upkeep, speed, conflicts, risk, and whether its license lets a project that uses it be sold): "Worth it: <gain> / <cost>" in ${io.notesFile}, or a plain sentence in the answer. If the cost is bigger, undo it and say why (hard rule 16).` }];
  return [];
}
