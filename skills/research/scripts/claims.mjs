#!/usr/bin/env node
// The research ledger: every source screened, every claim traced. Zero dependencies; never contacts anything.
//   node skills/research/scripts/claims.mjs new "<question>" [--slug <topic>]
//                                                               create .cache/research/<slug>.md from the template, or
//                                                               reuse the ledger that already has that slug. The slug is
//                                                               --slug, else the question's first 5 key words.
//   node skills/research/scripts/claims.mjs check <ledger.md>    validate it (exit 0 = pass, 1 = errors, 2 = usage or read error)
// The format and the rules are in ../references.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2), si = argv.indexOf('--slug');
const slugArg = si >= 0 ? argv[si + 1] : null;
const [cmd, arg] = argv.filter((a, i) => si < 0 || (i !== si && i !== si + 1));
const usage = () => { for (const l of fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split(/\r?\n/).slice(1)) { if (!l.startsWith('//')) break; console.log(l); } process.exit(2); };
const TYPES = ['primary', 'secondary', 'forum', 'social', 'wiki', 'aggregator', 'ai', 'project'];
const NOT_EVIDENCE = ['forum', 'social', 'wiki', 'aggregator', 'ai'];
const USES = ['evidence', 'lead only', 'excluded'];
const STATUS = ['confirmed', 'primary', 'single source', 'conflict', 'unverified'];
const PAID = /sponsor|affiliate|paid|advert|\bads?\b|#ad|press release|partner content|commission|\bsells?\b|\bselling\b|boost(ing)?\s+service|carr(y|ies)\s+service/i;
// Display ads on the page are how most free sites pay for themselves: an honest label, not a reason to reject the
// source. So are stated absences ("no sponsorship"). Only sponsored or affiliate content, sellers and paid services count.
// Lesson: "site ads only, no sponsored content" failed while "none found" passed, which taught agents the vaguer label.
const NEUTRAL_AD = /\b(no|not|without|none)\s+(\w+\s+){0,2}(sponsor\w*|affiliate\w*|paid\s+\w+|advert\w*|ads?|commissions?|partner content)\b|\b(display|site|banner|page|sidebar)\s+(ads?|advertising)\b|\bads?[- ](only|supported|funded)\b|\b(runs?|shows?|has)\s+(display\s+)?(ads?|advertising)\b|\badvertising[- ](supported|funded)\b/gi;
const paid = inc => PAID.test(String(inc).replace(NEUTRAL_AD, ''));
// Outlets owned by the same company are one owner, not two independent sources. Write the parent in brackets
// ("GameRant (Valnet)"); these well-known groups are recognized by name or site even without it.
// Lesson: two sites of one media group counted as two independent sources.
const GROUPS = {
  valnet: ['game rant', 'gamerant', 'thegamer', 'cbr', 'screen rant', 'screenrant', 'collider', 'dualshockers', 'xda', 'android police', 'androidpolice', 'how-to geek', 'howtogeek', 'makeuseof'],
  future: ['pc gamer', 'pcgamer', 'gamesradar', 'techradar', "tom's guide", 'tomsguide', "tom's hardware", 'tomshardware', 'windows central', 'windowscentral', 'android central', 'androidcentral'],
  fandom: ['fandom', 'gamespot', 'metacritic', 'gamefaqs'],
  gamurs: ['dot esports', 'dotesports', 'destructoid', 'the escapist', 'escapistmagazine', 'twinfinite', 'siliconera', 'prima games', 'primagames', 'pro game guides', 'progameguides', 'gamepur'],
  'ign entertainment': ['ign', 'eurogamer', 'rock paper shotgun', 'rockpapershotgun', 'vg247'],
};
const ownerKey = (owner, link) => {
  const o = String(owner).toLowerCase(), paren = /\(([^)]+)\)\s*$/.exec(o);
  if (paren) return paren[1].trim();
  const h = host(link).toLowerCase(), plain = o.replace(/[^a-z0-9' -]/g, ' ').trim();
  for (const [g, names] of Object.entries(GROUPS)) if (names.some(n => plain === n || new RegExp(`(^|\\.)${n.replace(/[^a-z0-9]/g, '')}\\.`).test(h))) return g;
  return o || h;
};

if (cmd === 'new' && arg) {
  // A short slug of the topic, so helpers researching the same thing share one ledger. Lesson: two agents with the same
  // topic named their ledgers after their own wording of the question and made two ledgers.
  const STOPWORDS = new Set('a an the of for to in on at by and or is are was were be what which who how why when where does do did can could should would i we you it its this that these those with about from best vs versus'.split(' '));
  const words = String(slugArg || arg).toLowerCase().split(/[^a-z0-9]+/).filter(w => w && (slugArg || !STOPWORDS.has(w)));
  const slug = words.slice(0, 5).join('-').slice(0, 60) || 'research';
  const d = new Date(), day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const file = path.join('.cache', 'research', `${slug}.md`);
  if (fs.existsSync(file)) { console.log(`exists: ${file} (reusing it: add your sources and claims there)`); process.exit(0); }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `# Research: ${arg}\ndate: ${day}\nscope: \n\n## Sources\n| ID | Link | Owner | Type | Incentive | Date | Use |\n|---|---|---|---|---|---|---|\n\n` +
    '## Claims\n| Claim | Sources | Quote or data | Status |\n|---|---|---|---|\n\n## Verdict\n\n');
  console.log(`created: ${file}`);
} else if (cmd === 'check' && arg) {
  let text;
  try { text = fs.readFileSync(arg, 'utf8'); } catch (e) { console.error(`cannot read ${arg}: ${e.message}`); process.exit(2); }
  check(text);
} else usage();

// The rows of the table under a "## <heading>", as objects keyed by lowercased column names.
function table(text, heading) {
  const m = new RegExp(`^##\\s+${heading}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, 'im').exec(text);
  const rows = (m ? m[1] : '').split(/\r?\n/).filter(l => l.trim().startsWith('|'));
  if (rows.length < 2) return [];
  const cells = l => l.trim().replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim());
  const head = cells(rows[0]).map(h => h.toLowerCase());
  return rows.slice(1).filter(l => !/^\|?\s*:?-{3,}/.test(l.trim())).map(l => { const c = cells(l); return Object.fromEntries(head.map((h, i) => [h, c[i] || ''])); });
}
function col(row, start) { return row[Object.keys(row).find(k => k.startsWith(start))] || ''; }
function host(link) { try { return new URL(link).hostname.replace(/^www\./, ''); } catch { return link.split('/').slice(0, 3).join('/'); } }

function check(text) {
  const errors = [];
  const sources = table(text, 'Sources'), claims = table(text, 'Claims'), byId = {};
  if (!sources.length) errors.push('no Sources table rows');
  for (const s of sources) {
    const id = col(s, 'id'), link = col(s, 'link') || col(s, 'url'), owner = col(s, 'owner'), type = col(s, 'type').toLowerCase();
    const inc = col(s, 'incentive'), use = col(s, 'use').toLowerCase(), at = id || link || '(a row)';
    byId[id] = { link, owner: ownerKey(owner, link), type, use };
    if (!id) errors.push(`${at}: no ID`);
    if (!link) errors.push(`${at}: no link (a web address or a project file)`);
    if (!owner) errors.push(`${at}: no owner (who publishes it)`);
    if (!TYPES.includes(type)) errors.push(`${at}: type "${type}" must be one of ${TYPES.join(', ')}`);
    if (!inc) errors.push(`${at}: incentive is empty: look for what the owner gains (or write "none found")`);
    if (!USES.includes(use)) errors.push(`${at}: use "${use}" must be one of ${USES.join(', ')}`);
    if (use === 'evidence' && NOT_EVIDENCE.includes(type)) errors.push(`${at}: a ${type} source is a lead, not evidence: follow it to its source`);
    if (use === 'evidence' && paid(inc) && type !== 'primary') errors.push(`${at}: "${inc}" is paid or biased content: it can't be evidence`);
  }
  if (!claims.length) errors.push('no Claims table rows');
  for (const c of claims) {
    const claim = col(c, 'claim'), status = col(c, 'status').toLowerCase(), at = `claim "${claim.slice(0, 50)}"`;
    const ids = (col(c, 'sources').match(/\bS\d+\b/gi) || []).map(x => x.toUpperCase());
    if (!STATUS.includes(status)) errors.push(`${at}: status "${status}" must be one of ${STATUS.join(', ')}`);
    if (!col(c, 'quote')) errors.push(`${at}: no quote or data from its sources`);
    if (status !== 'unverified' && !ids.length) errors.push(`${at}: no source IDs`);
    for (const id of ids) {
      if (!byId[id]) errors.push(`${at}: source ${id} is not in the Sources table`);
      // a claim only a lead backs is logged as "unverified", citing that lead (Lesson: there was no way to record it)
      else if (byId[id].use !== 'evidence' && !(status === 'unverified' && byId[id].use === 'lead only')) errors.push(`${at}: source ${id} is ${byId[id].use}, not evidence${byId[id].use === 'lead only' ? ' (a claim only a lead backs is "unverified")' : ''}`);
    }
    const ev = ids.map(id => byId[id]).filter(s => s && s.use === 'evidence');
    if (status === 'confirmed' && new Set(ev.map(s => s.owner)).size < 2) errors.push(`${at}: "confirmed" needs two evidence sources with different owners`);
    if (status === 'primary' && !ev.some(s => s.type === 'primary' || s.type === 'project')) errors.push(`${at}: "primary" needs a primary source`);
  }
  const owners = new Set(Object.values(byId).filter(s => s.use === 'evidence').map(s => s.owner));
  const limit = /^\s*(<!--\s*)?sources limit:\s*(.{10,})$/im.exec(text);
  if (owners.size < 3 && !(limit && !limit[1])) errors.push(`only ${owners.size} independent evidence source(s): find at least 3, or add a "Sources limit: <why no more exist>" line`);
  if (!/^##\s+Verdict[^\n]*\n\s*\S/im.test(text)) errors.push('no verdict under "## Verdict"');
  const count = s => claims.filter(c => col(c, 'status').toLowerCase() === s).length;
  for (const e of errors) console.log(`ERROR ${e}`);
  const summary = `${claims.length} claims (${count('confirmed')} confirmed, ${count('primary')} primary, ${count('single source')} single source, ${count('conflict')} conflict, ${count('unverified')} unverified); ` +
    `${owners.size} independent evidence sources, ${Object.values(byId).filter(s => s.use === 'excluded').length} excluded`;
  console.log(errors.length ? `CLAIMS: FAIL (${errors.length} error(s)) - ${summary}` : `CLAIMS: PASS - ${summary}`);
  process.exit(errors.length ? 1 : 0);
}
