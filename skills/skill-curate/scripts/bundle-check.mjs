#!/usr/bin/env node
// Checks a folder of skills packaged for sharing (a "bundle") before it leaves the project. Read-only.
//   node skills/skill-curate/scripts/bundle-check.mjs <bundle folder>
// Skills are found at <bundle>/skills/<name>/SKILL.md or <bundle>/<name>/SKILL.md.
// FAIL: no README or LICENSE, a SKILL.md without name/description or with a name that differs from its folder,
// absolute paths, likely secrets, broken relative links, a credited third-party skill without its license.
// WARN: a description with no "use when" part, mentions of files only this project has.
// Prints RESULT: PASS / FAIL. Exit codes: 0 pass, 1 fail, 2 usage problem.
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root || !fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error('usage: node bundle-check.mjs <bundle folder>');
  process.exit(2);
}
const fail = [], warn = [];
const rel = p => path.relative(root, p).replace(/\\/g, '/');
const files = [];
(function walk(d) {
  for (const n of fs.readdirSync(d)) {
    if (/^(\.git|node_modules|\.cache|\.DS_Store)$/.test(n)) continue;
    const p = path.join(d, n);
    fs.statSync(p).isDirectory() ? walk(p) : files.push(p);
  }
})(root);

const top = fs.readdirSync(root);
if (!top.some(n => /^readme(\.md)?$/i.test(n))) fail.push('no README.md at the top: say what each skill does, when it starts and what it needs');
if (!top.some(n => /^licen[cs]e/i.test(n))) fail.push('no LICENSE at the top: pick one before sharing');

// the skills
const skillDirs = [path.join(root, 'skills'), root].filter(d => fs.existsSync(d))
  .flatMap(d => fs.readdirSync(d).map(n => path.join(d, n)))
  .filter(d => fs.statSync(d).isDirectory() && fs.existsSync(path.join(d, 'SKILL.md')));
if (!skillDirs.length) fail.push('no skills found (expected <bundle>/skills/<name>/SKILL.md or <bundle>/<name>/SKILL.md)');
for (const d of skillDirs) {
  const name = path.basename(d), text = fs.readFileSync(path.join(d, 'SKILL.md'), 'utf8').replace(/\r\n/g, '\n');
  const fm = /^---\n([\s\S]*?)\n---/.exec(text)?.[1] || '';
  const fmName = /^name:\s*(.+)$/m.exec(fm)?.[1].trim(), desc = /^description:\s*(.+)$/m.exec(fm)?.[1].trim() || '';
  if (!fm) fail.push(`${rel(d)}/SKILL.md: no frontmatter (--- name / description ---)`);
  else {
    if (!fmName) fail.push(`${rel(d)}/SKILL.md: no name in the frontmatter`);
    else if (fmName !== name) fail.push(`${rel(d)}/SKILL.md: name "${fmName}" differs from its folder "${name}"`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) fail.push(`${rel(d)}: folder name should be lowercase words joined by hyphens`);
    if (!desc) fail.push(`${rel(d)}/SKILL.md: no description in the frontmatter`);
    else if (!/\buse (it )?(when|for|whenever)\b/i.test(desc)) warn.push(`${rel(d)}/SKILL.md: the description doesn't say when to use it ("Use when ...")`);
  }
  if (fs.existsSync(path.join(d, 'SOURCE.md')) && !fs.readdirSync(d).some(n => /^licen[cs]e/i.test(n)))
    fail.push(`${rel(d)}: credits a source in SOURCE.md but has no LICENSE file of its own`);
}

// every text file
const secret = /(sk-[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|xox[abpr]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"'\s]{12,}["'])/i;
const absPath = /(^|[\s"'`(=])([A-Za-z]:[\\/][^\s"'`)]*|\/(Users|home)\/[^\s"'`)]+)/;
const projectOnly = /\b(AGENTS\.md|CLAUDE\.md|DIRECTORY\.md|docs\/(playbooks|checks|plans|STATUS\.md|BRIEF\.md)|tools\/hooks\/)/;
for (const f of files.filter(p => /\.(md|mjs|js|cjs|ts|py|sh|json|ya?ml|txt|toml)$/i.test(p))) {
  if (/^licen[cs]e/i.test(path.basename(f))) continue;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((l, i) => {
    const at = `${rel(f)}:${i + 1}`;
    if (secret.test(l)) fail.push(`${at}: looks like a secret. Move it to an environment variable and document the name`);
    if (absPath.test(l)) fail.push(`${at}: absolute path (${absPath.exec(l)[2].slice(0, 50)}). Use a path relative to the skill folder`);
    if (projectOnly.test(l) && !/SOURCE\.md$/i.test(f)) warn.push(`${at}: mentions a file only this project has (${projectOnly.exec(l)[1]}). Make it optional or remove it`);
  });
  if (/\.md$/i.test(f)) for (const m of lines.join('\n').matchAll(/\]\(([^)\s#]+)(#[^)]*)?\)/g)) {
    const target = m[1];
    if (/^[a-z]+:/i.test(target)) continue; // a web or mail link
    if (!fs.existsSync(path.resolve(path.dirname(f), decodeURIComponent(target)))) fail.push(`${rel(f)}: broken link to ${target}`);
  }
}

for (const x of fail) console.log(`FAIL ${x}`);
for (const x of warn) console.log(`WARN ${x}`);
console.log(`${skillDirs.length} skill(s), ${files.length} file(s) checked.`);
console.log(fail.length ? `RESULT: FAIL (${fail.length} problem(s))` : `RESULT: PASS${warn.length ? ` with ${warn.length} warning(s)` : ''}`);
process.exit(fail.length ? 1 : 0);
