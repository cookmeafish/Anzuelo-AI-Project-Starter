// REQ: no-verbatim-examples, under v2's end check. Files capture the principle and why, not the user's own words or
// examples: a run of the user's words copied into a changed file, or a name from the user's messages written into a
// rule, runbook, check, skill or test this turn. Ported from the old engine (verbatimHits, exampleNameHits); the
// patterns below are its own, copied.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const COMMON_NAMES = /^(I|OK|Windows|Linux|Mac|macOS|Android|iOS|English|Spanish|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|GitHub|Git|Google|Chrome|Edge|Firefox|Node|Python|JavaScript|TypeScript|Claude|Codex|Cursor|Copilot|Gemini|Markdown|Excel|Word|PowerShell)$/i;
const ACRONYM = /^(API|GUI|UI|UX|AI|CLI|SDK|JSON|YAML|TOML|XML|HTML|CSS|JS|TS|URL|URI|PDF|CSV|SQL|DB|ID|IDS|OK|PR|CI|CD|OS|USB|HTTP|HTTPS|SSH|DNS|IP|VPN|GPU|CPU|RAM|SSD|NPM|LLM|GPT|MCP|TODO|FYI|ASAP|README|CHANGELOG|STATUS|AGENTS|CLAUDE|BRIEF|DECISIONS|DIRECTORY|SKILL|PASS|FAIL|N\/A|US|UK|EU|UTC|PST|PDT|AM|PM|RPG|FAQ|PNG|JPG|JPEG|SVG|GIF|MP3|MP4|ENV|LTS|ESM|II|III|IV|VI)$/;
const USER_DECIDED = /\b(the )?(user|owner|client) (decided|chose|confirmed|asked for|approved|granted)\b|\bdecided by the (user|owner)\b|\bel usuario (decidi[oó]|eligi[oó]|confirm[oó])\b/i;
export const VERBATIM_ENGINE = ['tools/**', '.githooks/**', 'HOW-TO-USE.md', 'docs/recommended-tools.md', 'docs/playbooks/_TEMPLATE.md', 'docs/playbooks/_fallback.md',
  ...['session-checklist', 'finish-checklist', 'runbook-standards', 'writing-standards', 'layout-standards', 'better-or-worse'].map(n => `docs/checks/${n}.md`)];
const CORE_SKILLS = ['project-bootstrap', 'project-rule', 'runbook-create', 'skill-harden', 'skill-curate', 'project-sweeps',
  'session-handoff', 'security-review', 'plan', 'debug', 'parallel-agents', 'research', 'skill-finder', 'obsidian', 'learn-from-upset', 'efficiency-review', 'goal-loop'];

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const globRe = g => { let s = ''; for (let i = 0; i < g.length; i++) { const c = g[i]; if (c === '*') { if (g[i + 1] === '*') { i++; if (g[i + 1] === '/') { s += '(?:.*/)?'; i++; } else s += '.*'; } else s += '[^/]*'; } else if (c === '?') s += '[^/]'; else s += esc(c); } return new RegExp('^' + s + '$', 'i'); };
const match = (p, globs) => [].concat(globs || []).some(g => globRe(g).test(p));
const words = s => String(s || '').toLowerCase().replace(/[`*_>#|"'“”‘’()[\]{}]/g, ' ').match(/[a-z0-9]+(?:'[a-z]+)?/g) || [];
// the subject sentence: where the user says what the project is ("it is my ...", "será un ...")
const ABOUT = /\b(it|this|the project|this project|my project|this repo)\s*(is|will be|'s)\s+(my|a|an|our|the|for)\b|\b(it|this)\s+(holds|has|keeps)\s+my\b|(?<!\p{L})(ser[aá]|es)\s+(un|una|mi|mis|nuestr[oa]s?)(?!\p{L})/iu;
const DESCRIBES = /^(docs\/(BRIEF|STATUS|DECISIONS)\.md|README\.md|AGENTS\.md|CLAUDE\.md)$/i;

export function userNames(prompts) {
  const out = new Set();
  for (const p of prompts || []) {
    for (const s of String(p).replace(/```[\s\S]*?```/g, ' ').replace(/<[^>\n]{1,80}>/g, ' ').split(/(?<=[.!?:;])\s+|\n+/)) {
      const letters = s.replace(/[^\p{L}]/gu, ''), shouting = letters.length && (letters.match(/\p{Lu}/gu) || []).length / letters.length > 0.5;
      const first = s.search(/\p{L}/u);
      for (const m of s.matchAll(/(?<![\p{L}\p{N}_./\\-])(\p{Lu}[\p{Ll}\p{N}'-]{2,}(?:\s+\p{Lu}[\p{Ll}\p{N}'-]{2,})*|\p{N}+\p{L}[\p{L}\p{N}]+|\p{Lu}[\p{Lu}\p{N}]{2,})(?![\p{L}\p{N}_-])/gu)) {
        if (m.index === first && !/\s/.test(m[1])) continue; // a sentence's first word is capitalized anyway
        if (shouting && /^[\p{Lu}\p{N}]+$/u.test(m[1])) continue; // capitals for emphasis, not a name
        out.add(m[1]);
      }
    }
  }
  return [...out].filter(n => !COMMON_NAMES.test(n) && !ACRONYM.test(n));
}

// t = { root, cfg, prompts (every message of the session), changed (files changed this turn), calls (the turn's tool calls) }
export function verbatimHits(t) {
  const { root, cfg } = t, n = cfg.verbatimWords;
  // (a turn that changed nothing copied nothing: no file is read. Speed: Stop on a plain question)
  if (!t.changed.length && !t.calls.some(c => /^(Write|Edit|MultiEdit)$/.test(c.name))) return [];
  const rel = p => path.relative(root, path.resolve(root, String(p || ''))).split(path.sep).join('/');
  const read = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch { return ''; } };
  const exists = f => fs.existsSync(path.join(root, f));
  const head = f => spawnSync('git', ['show', `HEAD:${f}`], { cwd: root, encoding: 'utf8' }).stdout || '';
  const hits = [];
  if (n && t.prompts.length) {
    const grams = new Map();
    for (const p of t.prompts) { const w = words(p); for (let i = 0; i + n <= w.length; i++) grams.set(w.slice(i, i + n).join(' '), true); }
    // (wordings the writing rules require are the rules' words, not the user's)
    const std = ` ${words(read('docs/checks/writing-standards.md')).join(' ')} `;
    for (const g of [...grams.keys()]) if (std.includes(` ${g} `)) grams.delete(g);
    const subject = new Set();
    for (const p of t.prompts) for (const s of String(p).split(/(?<=[.!?;:])\s+|\n+/)) {
      if (!ABOUT.test(s)) continue;
      const w = words(s.replace(/["“][^"”]*["”]|'[^'\n]{12,}'/g, ' '));
      for (let i = 0; i + n <= w.length; i++) subject.add(w.slice(i, i + n).join(' '));
    }
    const RECORD = !exists('.starter-template') ? /^docs\/DECISIONS\.md$/i : /(?!)/;
    const engine = [...VERBATIM_ENGINE, ...CORE_SKILLS.map(s => `${cfg.skillsDir}/${s}/**`), ...(cfg.skillMirrors || []).map(m => `${m}/**`)];
    if (grams.size) for (const f of t.changed.filter(p => !RECORD.test(p) && !match(p, cfg.verbatimAllowed) && !match(p, engine) && exists(p) && /\.(md|mdx|txt|html?|js|mjs|cjs|jsx|ts|tsx|py|json|ya?ml|css|vue|svelte)$/i.test(p))) {
      const text = read(f);
      if (/SKILL\.md$/.test(f) && /^generated:\s*true/m.test(text)) continue;
      const w = words(text.replace(/```template[\s\S]*?```/g, ' ').replace(/^\s*(>\s*)?[-*]?\s*template:.*$/gim, ' ')
        .replace(/^\|\s*who may do what.*$/gim, l => USER_DECIDED.test(l) ? l.replace(/"[^"]*"|“[^”]*”/g, ' ') : l));
      let before = null;
      const hadIt = g => { before ??= ` ${words(head(f)).join(' ')} `; return before.includes(` ${g} `); };
      for (let i = 0; i + n <= w.length; i++) {
        const g = w.slice(i, i + n).join(' ');
        if (grams.has(g) && !(DESCRIBES.test(f) && subject.has(g)) && !hadIt(g)) { hits.push(`${f} ("${g}...")`); break; }
      }
    }
  }
  // names: a name from the user's messages written this turn into a rule, runbook, check, skill or test
  if (t.prompts.length) {
    const starter = exists('.starter-template');
    const files = ['AGENTS.md', 'CLAUDE.md', 'docs/playbooks/**', 'docs/checks/**', `${cfg.skillsDir}/**`, 'tools/hooks/requirements.json', 'tools/hooks/project-scenarios.mjs',
      'tests/**', 'test/**', '**/*.test.*', '**/*.spec.*', '**/test_*.*', '**/*_test.*', ...(starter ? ['tools/**', 'packs/**', 'library/**', 'docs/**', '*.md'] : [])];
    const vocab = new Set(words(['AGENTS.md', 'DIRECTORY.md', 'HOW-TO-USE.md', 'README.md', 'docs/names.json', 'docs/glossary.md',
      'docs/checks/writing-standards.md', 'docs/checks/rule-enforcement.md', 'docs/checks/user-requirements.md'].map(read).join('\n')));
    const names = userNames(t.prompts).filter(x => !x.toLowerCase().split(/\s+/).every(w => vocab.has(w)));
    const multi = names.filter(x => /\s/.test(x)), single = names.filter(x => !/\s/.test(x));
    const part = (ns, flags) => ns.length ? new RegExp(`(?<![\\p{L}\\p{N}_-])(${ns.map(esc).join('|')})(?![\\p{L}\\p{N}_-])`, flags) : null;
    const rxM = part(multi, 'iu'), rxS = part(single, 'u');
    const rx = { exec: s => (rxM && rxM.exec(s)) || (rxS && rxS.exec(s)) || null, test: s => !!((rxM && rxM.test(s)) || (rxS && rxS.test(s))) };
    if (names.length) for (const u of t.calls) {
      if (!/^(Write|Edit|MultiEdit)$/.test(u.name)) continue;
      const f = rel(u.input.file_path || '');
      if (!match(f, files) || match(f, cfg.verbatimAllowed)) continue;
      const pairs = u.name === 'Write' ? [[u.input.content, null]] : u.name === 'Edit' ? [[u.input.new_string, u.input.old_string]] : (u.input.edits || []).map(e => [e.new_string, e.old_string]);
      for (const [added, removed] of pairs) {
        const m = rx.exec(String(added || ''));
        if (!m || (removed != null && rx.test(String(removed)))) continue;
        if (u.name === 'Write' && rx.test(head(f))) continue; // (a Write over a file that had the name keeps what was there)
        if (!rx.test(read(f))) continue; // (a name a later edit took out again)
        hits.push(`${f} (the user's example "${m[1]}": use a neutral one)`);
        break;
      }
    }
  }
  return [...new Set(hits)];
}
