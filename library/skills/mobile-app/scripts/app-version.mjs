#!/usr/bin/env node
// Show a phone app's version and build number in every place it is set, and check they were bumped together.
//   node app-version.mjs [app-folder]                      list what is set where (default: the current folder)
//   node app-version.mjs [app-folder] --against <ref|dir>  compare with a git ref (read with git show) or an old copy
// Reads pubspec.yaml (Flutter), android/app/build.gradle(.kts) or app/build.gradle(.kts) (versionName/versionCode),
// ios/**/Info.plist and *.xcodeproj/project.pbxproj (MARKETING_VERSION/CURRENT_PROJECT_VERSION), and app.json /
// app.config.json (Expo: version, android.versionCode, ios.buildNumber). Zero dependencies, read-only.
// With --against: FAIL when the version changed but the build number did not grow, or the build number went down.
// Ends with RESULT: PASS or RESULT: FAIL <why>.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const ai = args.indexOf('--against');
const against = ai >= 0 ? args[ai + 1] : null;
const dir = args.find((a, i) => !a.startsWith('--') && (ai < 0 || i !== ai + 1)) || '.';

const SKIP = /^(node_modules|\.git|build|Pods|\.dart_tool|\.gradle|DerivedData)$/;
const walk = (d, depth = 0) => depth > 5 ? [] : (() => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch { return []; } })()
  .flatMap(e => e.isDirectory() ? (SKIP.test(e.name) ? [] : walk(path.join(d, e.name), depth + 1)) : [path.join(d, e.name)]);
const rel = f => path.relative(dir, f).replace(/\\/g, '/');
const KNOWN = /^(pubspec\.yaml|(android\/)?app\/build\.gradle(\.kts)?|ios\/.*Info\.plist|.*\.xcodeproj\/project\.pbxproj|app\.json|app\.config\.json)$/;

// Each reader returns { version, build } from a file's text (either may be missing).
function read(file, text) {
  if (/pubspec\.yaml$/.test(file)) { const m = /^version:\s*([\w.-]+)(?:\+(\d+))?/m.exec(text); return m ? { version: m[1], build: m[2] } : null; }
  if (/build\.gradle(\.kts)?$/.test(file)) {
    const v = /versionName\s*=?\s*["']([^"']+)["']/.exec(text), b = /versionCode\s*=?\s*(\d+)/.exec(text);
    return v || b ? { version: v?.[1], build: b?.[1] } : null;
  }
  if (/Info\.plist$/.test(file)) {
    const g = k => new RegExp(`<key>${k}</key>\\s*<string>([^<]+)</string>`).exec(text)?.[1];
    const v = g('CFBundleShortVersionString'), b = g('CFBundleVersion');
    // $(MARKETING_VERSION) and $(FLUTTER_BUILD_NUMBER) point elsewhere: the project file or pubspec.yaml holds the value
    return v || b ? { version: /^\$\(/.test(v || '') ? undefined : v, build: /^\$\(/.test(b || '') ? undefined : b } : null;
  }
  if (/project\.pbxproj$/.test(file)) {
    const v = [...new Set([...text.matchAll(/MARKETING_VERSION = ([^;]+);/g)].map(m => m[1].trim()))];
    const b = [...new Set([...text.matchAll(/CURRENT_PROJECT_VERSION = ([^;]+);/g)].map(m => m[1].trim()))];
    return v.length || b.length ? { version: v.join(','), build: b.join(',') } : null;
  }
  if (/app(\.config)?\.json$/.test(file)) {
    let j; try { j = JSON.parse(text); } catch { return null; }
    const e = j.expo || j;
    if (!e.version && !e.android && !e.ios) return null;
    const builds = [e.android?.versionCode, e.ios?.buildNumber].filter(x => x != null).map(String);
    return { version: e.version, build: [...new Set(builds)].join(',') || undefined };
  }
  return null;
}

function snapshot(getText, files) {
  const out = {};
  for (const f of files) { const t = getText(f); if (t == null) continue; const r = read(f, t); if (r && (r.version || r.build)) out[f] = r; }
  return out;
}

const files = walk(dir).map(rel).filter(f => KNOWN.test(f));
const now = snapshot(f => fs.readFileSync(path.join(dir, f), 'utf8'), files);
if (!Object.keys(now).length) { console.log(`no version found under ${dir} (pubspec.yaml, build.gradle, Info.plist, project.pbxproj, app.json)`); console.log('RESULT: FAIL no version files'); process.exit(1); }
for (const [f, r] of Object.entries(now)) console.log(`${f}: version ${r.version ?? '(elsewhere)'}, build ${r.build ?? '(elsewhere)'}`);

const probs = [];
const versions = new Set(Object.values(now).map(r => r.version).filter(Boolean));
if (versions.size > 1) probs.push(`version differs between files (${[...versions].join(' / ')})`);

if (against) {
  let getOld;
  if (fs.existsSync(against) && fs.statSync(against).isDirectory()) getOld = f => { try { return fs.readFileSync(path.join(against, f), 'utf8'); } catch { return null; } };
  else {
    const top = spawnSync('git', ['rev-parse', '--show-prefix'], { cwd: dir, encoding: 'utf8' });
    if (top.status !== 0) { console.log(`RESULT: FAIL ${against} is not a folder and ${dir} is not in a git repository`); process.exit(1); }
    const prefix = top.stdout.trim();
    getOld = f => { const r = spawnSync('git', ['show', `${against}:${prefix}${f}`], { cwd: dir, encoding: 'utf8' }); return r.status === 0 ? r.stdout : null; };
  }
  const old = snapshot(getOld, Object.keys(now));
  const num = s => (String(s || '').match(/\d+/g) || []).map(Number);
  for (const [f, r] of Object.entries(now)) {
    const o = old[f];
    if (!o) { console.log(`${f}: not in ${against}, nothing to compare`); continue; }
    const vChanged = (o.version || '') !== (r.version || '');
    const ob = Math.max(...num(o.build), -1), nb = Math.max(...num(r.build), -1);
    console.log(`${f}: ${o.version ?? '-'}+${o.build ?? '-'} -> ${r.version ?? '-'}+${r.build ?? '-'}`);
    if (r.build != null && o.build != null && nb < ob) probs.push(`${f}: build number went down (${o.build} -> ${r.build})`);
    if (vChanged && r.build != null && o.build != null && nb <= ob) probs.push(`${f}: version changed but the build number did not grow`);
  }
}
console.log(probs.length ? probs.map(p => `problem: ${p}`).join('\n') + `\nRESULT: FAIL ${probs[0]}` : 'RESULT: PASS');
process.exit(probs.length ? 1 : 0);
