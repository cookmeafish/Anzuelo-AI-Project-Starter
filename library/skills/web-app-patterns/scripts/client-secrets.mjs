#!/usr/bin/env node
// Finds secrets that would reach the browser. Zero dependencies, read-only.
//   node client-secrets.mjs <project dir> [--max-mb 5]
// Looks at three places:
//   1. .env files: public build-time variables (VITE_, NEXT_PUBLIC_, REACT_APP_, PUBLIC_, NUXT_PUBLIC_, EXPO_PUBLIC_,
//      GATSBY_, VUE_APP_) whose name says secret (SECRET, PRIVATE, PASSWORD, SERVICE_ROLE, DATABASE_URL ...) or whose
//      value has a known secret-key shape.
//   2. Source files: code that reads a public variable with a secret-looking name (import.meta.env.VITE_X_SECRET).
//   3. Built bundles (dist, build, out, .next/static, .output/public, .svelte-kit/output/client): known secret-key
//      shapes anywhere in the shipped files.
// Values are never printed in full. Prints FAIL and WARN lines, then RESULT: PASS or RESULT: FAIL <why>. Exit 1 on FAIL.
// WARN (no FAIL): a public variable named like a key or token; many are public on purpose (publishable keys,
// anonymous keys, map tokens), so a person decides.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const root = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--max-mb');
const maxMb = Number(args[args.indexOf('--max-mb') + 1]) || 5;
if (!root || !fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error('usage: node client-secrets.mjs <project dir> [--max-mb 5]');
  process.exit(2);
}

const PUBLIC = '(?:VITE_|NEXT_PUBLIC_|REACT_APP_|NUXT_PUBLIC_|EXPO_PUBLIC_|GATSBY_|VUE_APP_|PUBLIC_)';
const SECRET_NAME = /SECRET|PRIVATE|PASSWORD|PASSWD|SERVICE_ROLE|SERVICE_KEY|ADMIN_KEY|MASTER_KEY|DATABASE_URL|DB_URL|DB_PASS|CONNECTION_STRING|SIGNING_KEY|WEBHOOK_SECRET|SMTP_PASS/;
const KEYISH_NAME = /API_KEY|APIKEY|ACCESS_KEY|TOKEN|AUTH_KEY|CREDENTIAL/;
const PUBLIC_OK_NAME = /PUBLISHABLE|ANON_KEY|PUBLIC_KEY|SITE_KEY|MEASUREMENT_ID|DSN/;
// Known shapes of secret values. Publishable ones (Stripe pk_, Mapbox pk.) are left out on purpose.
const SHAPES = [
  ['Stripe secret key', /\b[sr]k_(live|test)_[A-Za-z0-9]{16,}/],
  ['AWS access key id', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['GitHub token', /\b(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/],
  ['Slack token', /\bxox[abposr]-[A-Za-z0-9-]{10,}/],
  ['OpenAI or Anthropic key', /\bsk-(proj-|ant-)?[A-Za-z0-9_-]{20,}/],
  ['SendGrid key', /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/],
  ['Twilio auth token pair', /\bAC[0-9a-f]{32}:[0-9a-f]{32}\b/],
  ['private key block', /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/],
  ['database URL with a password', /\b(postgres(ql)?|mysql|mariadb|mongodb(\+srv)?|redis|amqp):\/\/[^\s:@/'"`]+:[^\s@/'"`]+@/],
];
// A JWT whose payload says it is a service or admin key (a Supabase service_role key, for example).
const JWT = /\beyJ[A-Za-z0-9_-]{10,}\.(eyJ[A-Za-z0-9_-]{10,})\.[A-Za-z0-9_-]{10,}/g;
function serviceJwt(text) {
  for (const m of text.matchAll(JWT)) {
    try {
      const p = JSON.parse(Buffer.from(m[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
      if (/service_role|admin|supabase_admin/i.test(String(p.role || ''))) return m[0];
    } catch { /* not a JWT after all */ }
  }
  return null;
}
const mask = v => (v.length <= 8 ? '****' : `${v.slice(0, 4)}...(${v.length} chars)`);
function shapeHit(text) {
  for (const [what, re] of SHAPES) { const m = re.exec(text); if (m) return { what, value: m[0] }; }
  const j = serviceJwt(text);
  return j ? { what: 'service or admin JWT', value: j } : null;
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.cache', 'coverage', '.turbo', '.vercel', '.netlify']);
const BUNDLE_DIRS = ['dist', 'build', 'out', '.next/static', '.output/public', '.svelte-kit/output/client', 'www'];
const SOURCE_EXT = /\.(m?[jt]sx?|vue|svelte|astro)$/;
const BUNDLE_EXT = /\.(m?js|cjs|html|json|map|txt)$/;
const fails = [], warns = [];
let envFiles = 0, sourceFiles = 0, bundleFiles = 0;

function walk(dir, onFile) {
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, onFile); }
    else if (e.isFile()) onFile(p, e.name);
  }
}
const rel = p => path.relative(root, p).split(path.sep).join('/');
const readSmall = p => { try { return fs.statSync(p).size <= maxMb * 1024 * 1024 ? fs.readFileSync(p, 'utf8') : null; } catch { return null; } };
const isBundle = p => BUNDLE_DIRS.some(d => rel(p) === d || rel(p).startsWith(d + '/'));

walk(root, (p, name) => {
  const r = rel(p);
  // 1. .env files (an example file with a public secret name is still a design mistake: the real value would ship)
  if (/^\.env(\..+)?$/.test(name)) {
    const text = readSmall(p); if (text === null) return;
    envFiles++;
    text.split(/\r?\n/).forEach((line, i) => {
      const m = new RegExp(`^\\s*(?:export\\s+)?(${PUBLIC}[A-Z0-9_]*)\\s*=\\s*(.*)$`).exec(line);
      if (!m) return;
      const [, key, raw] = m, value = raw.trim().replace(/^['"]|['"]$/g, '');
      const hit = value && shapeHit(value);
      if (hit) fails.push(`${r}:${i + 1}: ${key} holds a secret-shaped value (${hit.what}: ${mask(hit.value)}); public variables ship to every visitor`);
      else if (SECRET_NAME.test(key) && !PUBLIC_OK_NAME.test(key)) fails.push(`${r}:${i + 1}: ${key} is named like a secret but has a public prefix; move it to the server`);
      else if (KEYISH_NAME.test(key) && !PUBLIC_OK_NAME.test(key) && value) warns.push(`${r}:${i + 1}: ${key} is public; confirm it is meant to be (a publishable or restricted key), or move it to the server`);
    });
    return;
  }
  // 3. built bundles
  if (isBundle(p)) {
    if (!BUNDLE_EXT.test(name)) return;
    const text = readSmall(p); if (text === null) return;
    bundleFiles++;
    const hit = shapeHit(text);
    if (hit) fails.push(`${r}: the built bundle contains a secret-shaped value (${hit.what}: ${mask(hit.value)})`);
    return;
  }
  // 2. source files that read a public variable named like a secret
  if (SOURCE_EXT.test(name)) {
    const text = readSmall(p); if (text === null) return;
    sourceFiles++;
    const re = new RegExp(`\\b(${PUBLIC}[A-Z0-9_]*)\\b`, 'g');
    const seen = new Set();
    for (const m of text.matchAll(re)) {
      const key = m[1];
      if (seen.has(key) || !SECRET_NAME.test(key) || PUBLIC_OK_NAME.test(key)) continue;
      seen.add(key);
      const line = text.slice(0, m.index).split('\n').length;
      fails.push(`${r}:${line}: reads ${key}, a secret-named variable with a public prefix; it ends up in the bundle`);
    }
  }
});

for (const w of warns) console.log(`WARN ${w}`);
for (const f of fails) console.log(`FAIL ${f}`);
console.log(`Scanned ${envFiles} .env file(s), ${sourceFiles} source file(s), ${bundleFiles} bundle file(s)` +
  (bundleFiles ? '' : ' (no build output found: build first to check the shipped files)') + '.');
if (fails.length) { console.log(`RESULT: FAIL ${fails.length} secret(s) would reach the browser`); process.exitCode = 1; }
else console.log(`RESULT: PASS${warns.length ? ` (${warns.length} warning(s) to confirm)` : ''}`);
