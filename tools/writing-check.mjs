#!/usr/bin/env node
// Plain-writing check for anything the user reads (same rules as the Stop hook, REQ: plain-writing).
//   node tools/writing-check.mjs outputs/guide.md README.md     check files
//   node tools/writing-check.mjs --text "some answer text"      check a piece of text
// Exit 1 and one line per problem, or "WRITING: PASS".
import fs from 'node:fs';
import { writingProblems, config } from './hooks/hooks.mjs';

const args = process.argv.slice(2);
const cfg = config();
let probs = [];
if (args[0] === '--text') probs = writingProblems(args.slice(1).join(' '), cfg, 'text');
else {
  if (!args.length) { console.log('usage: node tools/writing-check.mjs <file>... | --text "..."'); process.exit(1); }
  for (const f of args) {
    if (!fs.existsSync(f)) { probs.push(`${f}: not found`); continue; }
    probs.push(...writingProblems(fs.readFileSync(f, 'utf8'), cfg, f.replace(/\\/g, '/')));
  }
}
for (const p of probs) console.log('PROBLEM ' + p);
console.log(probs.length ? `WRITING: FAIL (${probs.length} problem(s))` : 'WRITING: PASS');
process.exit(probs.length ? 1 : 0);
