#!/usr/bin/env node
// First-sweep finder for a security review. Lists lines that match known risky patterns (dynamic code, shell
// commands, string-built queries, raw HTML, unsafe merges, secrets in source, weak hashing, loose network settings).
// Read-only, zero dependencies. A hit is a lead to check by hand, not a verdict; no hits proves nothing.
//   node risky-patterns.mjs [folder] [--json] [--max-per-rule N]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const root = path.resolve(args.find(a => !a.startsWith('--')) || '.');
const asJson = args.includes('--json');
const maxIdx = args.indexOf('--max-per-rule');
const maxPerRule = maxIdx >= 0 ? Number(args[maxIdx + 1]) || 50 : 50;

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', 'coverage', 'vendor', '.next', '.venv',
  'venv', '__pycache__', 'target', '.cache', '.turbo']);
const CODE = /\.(m?[jt]sx?|cjs|vue|svelte|py|rb|php|go|rs|java|kt|cs|sh|ps1|sql|html?|ya?ml|toml|tf|json|env)$/i;
const MAX_BYTES = 1_000_000;

// area matches the security-review checklist areas, so each hit lands in the right row of the report
const RULES = [
  { area: 'Injection', id: 'dynamic-code', re: /\beval\s*\(|new\s+Function\s*\(|set(Timeout|Interval)\s*\(\s*['"`]/, hint: 'code built from strings; remove or replace with a fixed dispatch table' },
  { area: 'Injection', id: 'shell-string', re: /\b(exec|execSync)\s*\(\s*[`'"][^`'"]*(\$\{|['"]\s*\+)|shell\s*:\s*true|os\.system\s*\(|subprocess\.\w+\([^)]*shell\s*=\s*True/, hint: 'command through a shell; use an argument list without a shell, never input in the string' },
  { area: 'Injection', id: 'sql-string', re: /\b(SELECT|INSERT|UPDATE|DELETE)\b[^;\n]*(\$\{|['"]\s*\+\s*\w|%s['"]\s*%|\.format\()/i, hint: 'query text built from values; use parameters' },
  { area: 'Injection', id: 'raw-query-escape', re: /\$queryRawUnsafe|\$executeRawUnsafe|\.raw\s*\(\s*[`'"][^`'"]*\$\{|sequelize\.literal\s*\(/, hint: 'ORM raw-query escape hatch; check every value is a parameter' },
  { area: 'Injection', id: 'path-from-input', re: /(readFile|writeFile|createReadStream|sendFile|open)\w*\s*\([^)]*(req\.|request\.|params|query|body)/, hint: 'file path from request data; map ids to paths and check the result stays inside the base folder' },
  { area: 'Injection', id: 'unsafe-merge', re: /__proto__|\[\s*['"]constructor['"]\s*\]|Object\.assign\s*\(\s*\w+\s*,\s*(req\.|request\.|body|JSON\.parse)/, hint: 'possible prototype pollution; reject __proto__, constructor and prototype keys, or use a map' },
  { area: 'Injection', id: 'unsafe-deserialize', re: /pickle\.loads?|yaml\.load\s*\((?![^)]*SafeLoader)|unserialize\s*\(|BinaryFormatter|ObjectInputStream/, hint: 'deserializing data that may be untrusted into live objects' },
  { area: 'Injection', id: 'outbound-url-from-input', re: /(fetch|axios\.\w+|requests\.\w+|http\.get|urlopen)\s*\([^)]*(req\.|request\.|params|query|body)/, hint: 'outbound request to a caller-supplied URL; allowlist hosts and block internal addresses' },
  { area: 'Output and XSS', id: 'raw-html', re: /\.innerHTML\s*=|outerHTML\s*=|insertAdjacentHTML|dangerouslySetInnerHTML|v-html|\{@html|\|\s*safe\b|mark_safe\s*\(/, hint: 'raw HTML sink; untrusted content must pass a sanitizer' },
  { area: 'Output and XSS', id: 'csp-unsafe', re: /'unsafe-inline'|'unsafe-eval'/, hint: 'content security policy escape hatch; plan its removal' },
  { area: 'Request forgery', id: 'cors-open', re: /Access-Control-Allow-Origin['"]?\s*[:,]\s*['"]\*|origin\s*:\s*(true|['"]\*['"])/, hint: 'CORS open to every origin; allow known origins only' },
  { area: 'Request forgery', id: 'bind-all', re: /['"]0\.0\.0\.0['"]|host\s*=\s*['"]::['"]/, hint: 'server listens on every interface; a local server belongs on loopback' },
  { area: 'Authentication', id: 'weak-hash', re: /createHash\s*\(\s*['"](md5|sha1|sha256)['"]\s*\)[^\n]*(pass|pwd)|hashlib\.(md5|sha1|sha256)\s*\([^)]*pass/i, hint: 'fast hash used on a password; use a slow, salted password hash' },
  { area: 'Authentication', id: 'token-in-storage', re: /localStorage\.setItem\s*\(\s*['"][^'"]*(token|jwt|session)/i, hint: 'session token readable by scripts; prefer an HttpOnly cookie' },
  { area: 'Authentication', id: 'jwt-unverified', re: /jwt\.decode\s*\(|verify\s*\([^)]*algorithms?\s*:\s*\[?\s*['"]none['"]/i, hint: 'token read without verifying its signature' },
  { area: 'Secrets', id: 'secret-literal', re: /(api[_-]?key|secret|token|passw(or)?d|private[_-]?key)\s*[:=]\s*['"][^'"\s$]{12,}['"]|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(sk|pk|rk)_(live|test)_[0-9a-zA-Z]{10,}|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[0-9A-Za-z]{30,}/i, hint: 'looks like a credential in source; move it out and rotate it' },
  { area: 'Sensitive data', id: 'stack-to-client', re: /(json|send|write)\s*\([^)]*\b(err|error|e)\.stack/, hint: 'stack trace sent to the caller; log it server side, return a request id' },
  { area: 'Sensitive data', id: 'log-secret', re: /(console\.\w+|log(ger)?\.\w+|print)\s*\([^)]*\b(password|passwd|token|secret|card(number)?|cvv)\b/i, hint: 'a secret or card data may reach the logs' },
  { area: 'Deployment', id: 'tls-off', re: /rejectUnauthorized\s*:\s*false|verify\s*=\s*False|InsecureSkipVerify\s*:\s*true|NODE_TLS_REJECT_UNAUTHORIZED/, hint: 'certificate checks turned off' },
  { area: 'Deployment', id: 'public-infra', re: /publicly_accessible\s*=\s*true|cidr_blocks\s*=\s*\[\s*"0\.0\.0\.0\/0"\s*\][^\n]*|acl\s*=\s*"public-read/, hint: 'infrastructure open to the internet; confirm it is meant to be public' },
];

const hits = [];
const counts = Object.fromEntries(RULES.map(r => [r.id, 0]));
let files = 0;

function walk(dir) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); continue; }
    if (!e.isFile() || !(CODE.test(e.name) || /^\.env/.test(e.name))) continue;
    let text;
    try { if (fs.statSync(p).size > MAX_BYTES) continue; text = fs.readFileSync(p, 'utf8'); } catch { continue; }
    files++;
    const lines = text.split(/\r?\n/);
    lines.forEach((line, i) => {
      if (line.length > 2000) return; // minified or generated
      for (const r of RULES) {
        if (r.re.test(line) && counts[r.id]++ < maxPerRule) {
          hits.push({ area: r.area, rule: r.id, file: path.relative(root, p).split(path.sep).join('/'), line: i + 1, text: line.trim().slice(0, 160), hint: r.hint });
        }
      }
    });
  }
}

walk(root);
if (asJson) {
  console.log(JSON.stringify({ root, files, counts, hits }, null, 2));
} else {
  for (const area of [...new Set(RULES.map(r => r.area))]) {
    const inArea = hits.filter(h => h.area === area);
    if (!inArea.length) continue;
    console.log(`\n## ${area}`);
    for (const h of inArea) console.log(`${h.file}:${h.line}  [${h.rule}] ${h.text}\n    -> ${h.hint}`);
  }
  const capped = RULES.filter(r => counts[r.id] > maxPerRule).map(r => `${r.id} (${counts[r.id]})`);
  console.log(`\nscanned ${files} file(s) under ${root}; ${hits.length} lead(s) to check by hand.`);
  if (capped.length) console.log(`more hits than shown for: ${capped.join(', ')}. Re-run with --max-per-rule N.`);
  console.log('No hits does not mean secure: dataflow, access checks and logic flaws need reading and the attack tries.');
}
