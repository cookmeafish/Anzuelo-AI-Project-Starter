#!/usr/bin/env node
// Check a drafted email, message or letter before the user sends it. Zero dependencies, read-only.
//   node skills/correspondence/scripts/draft-check.mjs <draft.md> [--facts <file> <file> ...]
// Lists every figure in the draft (amounts, quantities, dates, order and invoice numbers) and whether it appears in
// one of the --facts files (the order, invoice, price list or earlier message it came from). Also lists the visible
// placeholders left for the user ([order number?]), the word count, a missing subject or greeting, words that read as
// a legal threat, and anything that looks like a password, card or account number.
// RESULT: PASS when every figure is found in a facts file (or is a placeholder) and nothing secret-looking is in it.
// RESULT: FAIL <why> otherwise. Without --facts, every figure is reported as unchecked and the result is FAIL.
import fs from 'node:fs';

const args = process.argv.slice(2);
const draft = args[0];
const fi = args.indexOf('--facts'), di = args.indexOf('--derived');
const facts = fi >= 0 ? args.slice(fi + 1).filter((a, i) => !a.startsWith('--') && args.slice(fi + 1).slice(0, i + 1).every(x => !x.startsWith('--'))) : [];
// --derived 2,140: figures worked out from sourced ones (12 ordered - 10 delivered = 2); the answer must say how
const derived = di >= 0 ? String(args[di + 1] || '').split(',').map(s => s.trim()).filter(Boolean) : [];
if (!draft || draft.startsWith('--')) { console.error('usage: node draft-check.mjs <draft.md> [--facts <file> <file> ...] [--derived 2,140]'); process.exit(2); }
for (const f of [draft, ...facts]) if (!fs.existsSync(f)) { console.error(`not found: ${f}`); process.exit(2); }

const raw = fs.readFileSync(draft, 'utf8');
// the file's own header (frontmatter, a "Date:" or "To:" line written by the agent) is not part of the message's facts
const text = raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
const body = text.split(/\r?\n/).filter(l => !/^\s*(date|to|from|cc|bcc|status)\s*:/i.test(l)).join('\n');
const flat = s => s.replace(/(\d)[,\s.'](?=\d{3}\b)/g, '$1'); // 1,250 / 1.250 / 1 250 -> 1250
const source = flat(facts.map(f => fs.readFileSync(f, 'utf8')).join('\n'));

const placeholders = [...body.matchAll(/\[[^\]\n]{1,60}\?\]|\[(?:TODO|TBD|XX+|\?+)[^\]\n]*\]/gi)].map(m => m[0]);
const noPh = body.replace(/\[[^\]\n]{1,60}\?\]|\[(?:TODO|TBD|XX+|\?+)[^\]\n]*\]/gi, ' ');
// figures: numbers with optional currency, decimals, separators, and codes that contain digits (INV-2041, #5532)
const figures = [...new Set([...flat(noPh).matchAll(/(?:[#A-Z]{1,6}[-#]?)?\d[\d.:/-]*\d|\b\d\b/g)].map(m => m[0].replace(/[.:/-]+$/, '')))];
const missing = [], found = [];
// a figure counts as sourced only as a whole token there: "9" is not found inside "2026-10-09"
const tokens = new Set([...source.matchAll(/(?:[#A-Z]{1,6}[-#]?)?\d[\d.:/-]*\d|\b\d\b/g)].map(m => m[0].replace(/[.:/-]+$/, '').replace(/^#/, '')));
const same = (a, b) => a === b || a.replace(/\.0+$/, '') === b.replace(/\.0+$/, '');
const fromDerived = [];
for (const f of figures) {
  const bare = f.replace(/^[#]/, '');
  if (derived.some(d => same(flat(d), bare))) { fromDerived.push(f); continue; }
  ([...tokens].some(t => same(t, bare)) ? found : missing).push(f);
}

const words = (body.match(/\S+/g) || []).length;
const notes = [];
if (!/^\s*\**subject\**\s*:/im.test(text) && /email|mail/i.test(draft + raw.slice(0, 200))) notes.push('no "Subject:" line');
if (!/^\s*(dear|hi|hello|hey|good (morning|afternoon|evening)|estimad[oa]s?|hola|buenos d[ií]as|buenas)\b/im.test(body)) notes.push('no greeting');
if (words > 250) notes.push(`${words} words: long for a message, check that the ask is in the first two sentences`);
if (/\b(lawsuit|legal action|sue you|my (lawyer|attorney)|court|small claims|demanda|abogado)\b/i.test(body)) notes.push('reads as a legal threat: only if the user asked (legal-review skill for anything contractual)');
const secrets = [];
if (/\b(password|passcode|contrase[nñ]a|pin)\s*[:=]\s*\S+/i.test(body)) secrets.push('a password or PIN');
if (/\b(?:\d[ -]?){13,19}\b/.test(noPh.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ''))) secrets.push('a long number that may be a card or account number');
if (/\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}\b/.test(body)) secrets.push('what looks like an IBAN');

console.log(`Draft: ${draft} (${words} words)`);
console.log(`Figures found in the facts files (${found.length}): ${found.join(', ') || 'none'}`);
if (fromDerived.length) console.log(`Figures worked out from sourced ones (${fromDerived.length}): ${fromDerived.join(', ')}  (say how in the answer)`);
console.log(`Figures NOT found (${missing.length}): ${missing.join(', ') || 'none'}${facts.length ? '' : '  (no --facts files given)'}`);
console.log(`Placeholders for the user (${placeholders.length}): ${placeholders.join(', ') || 'none'}`);
for (const n of notes) console.log(`Note: ${n}`);
for (const s of secrets) console.log(`Secret: the draft contains ${s}`);
const why = [];
if (missing.length) why.push(`${missing.length} figure(s) not in the facts files: replace each with the sourced value or a [placeholder?]`);
if (secrets.length) why.push(`secret-looking content (${secrets.join(', ')})`);
console.log(why.length ? `RESULT: FAIL ${why.join('; ')}` : 'RESULT: PASS');
process.exit(why.length ? 1 : 0);
