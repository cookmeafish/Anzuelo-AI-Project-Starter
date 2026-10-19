#!/usr/bin/env node
// Screenshots for the GUI review loop (gui-review-loop skill; Stop hook REQ: gui-review-loop). No dependencies.
//
// Web pages, local HTML files and dev servers, in Playwright's BUNDLED Chromium over the DevTools protocol:
//   node tools/screenshot.mjs --url http://127.0.0.1:{port}/ --launch "python app.py --port {port}" [options]
//   node tools/screenshot.mjs --file outputs/report.html [options]
//   --launch "<cmd>"           start a throwaway instance first ({port} = a free port); stopped afterwards
//   --sizes 1400x900,390x844   viewports (default: desktop + phone)
//   --themes light,dark        prefers-color-scheme (default: both)
//   --full                     whole page height, not just the viewport
//   --steps flow.json          interactions: [{"click":"#go"},{"type":"#q","text":"hi"},{"wait":500},{"eval":"js"},{"shot":"after-search"}]
//   --flows [docs/checks/flows] every saved flow in the folder, one run each (named after the file). A flow file is a
//                              steps list, or {"page": "<url or file>", "steps": [...]}; without "page" it runs on
//                              --url / --file. --pages a,b runs only the flows named a.json, b.json (the pages touched)
//   --name home                file name prefix (default: page)
//   --settle 700               ms to wait before each shot (default 700)
//   --wait 20000               ms to wait for a launched app (default 20000; 3000 with --window)
// Desktop apps (Windows only): capture a window by its title.
//   node tools/screenshot.mjs --window "My App" [--launch "python gui.py"]
// Output: .cache/gui-review/<timestamp>/<name>-<w>x<h>-<theme>.png. Prints "SCREENSHOT: <path>" per image, "WARN ..."
// per measurable problem (sideways scroll, console errors, broken images, blank page), then a "GUI-SHOT:" summary.
// Then Read every screenshot: the Stop hook checks that you looked at them.
// SAFETY: never drives the installed Chrome or Edge (automating them can trigger failed Windows sign-ins that lock the
// account). Uses Playwright's bundled Chromium (headless shell), a throwaway profile and no OS password store.
// If that browser is missing: npx playwright install chromium-headless-shell
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const has = k => args.includes(k);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const warns = [], shots = [];
const warn = m => { warns.push(m); console.log('WARN ' + m); };

const round = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = path.join(ROOT, '.cache', 'gui-review', round);
fs.mkdirSync(outDir, { recursive: true });
const PAGE = (opt('--name', 'page')).replace(/[^\w.-]+/g, '-'), name = PAGE;

function freePort() {
  return new Promise((res, rej) => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => res(p)); }); s.on('error', rej); });
}
function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else { try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch { } } }
}

function findChromium() {
  const own = process.env.STARTER_CHROMIUM ?? process.env.KS_CHROMIUM; // KS_: the old name, still read for one release
  if (own && fs.existsSync(own)) return own;
  const bases = [process.env.PLAYWRIGHT_BROWSERS_PATH, path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright'),
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'), path.join(os.homedir(), '.cache', 'ms-playwright')].filter(Boolean);
  const exes = [
    ['chromium_headless_shell-', ['chrome-headless-shell-win64/chrome-headless-shell.exe', 'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-headless-shell-mac-arm64/chrome-headless-shell', 'chrome-headless-shell-mac-x64/chrome-headless-shell']],
    ['chromium-', ['chrome-win64/chrome.exe', 'chrome-win/chrome.exe', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium']]
  ];
  for (const base of bases) {
    let dirs = []; try { dirs = fs.readdirSync(base); } catch { continue; }
    for (const [prefix, rels] of exes) {
      for (const d of dirs.filter(d => d.startsWith(prefix)).sort().reverse()) {
        for (const r of rels) { const p = path.join(base, d, r); if (fs.existsSync(p)) return p; }
      }
    }
  }
  return null;
}

class CDP {
  constructor(url) { this.url = url; this.id = 0; this.wait = new Map(); this.handlers = []; }
  open() {
    return new Promise((res, rej) => {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = () => res();
      this.ws.onerror = e => rej(new Error('DevTools connection failed: ' + (e.message || e.type)));
      this.ws.onmessage = ev => {
        const m = JSON.parse(ev.data);
        if (m.id && this.wait.has(m.id)) { const { res, rej } = this.wait.get(m.id); this.wait.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
        else if (m.method) for (const h of this.handlers) h(m);
      };
    });
  }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.wait.set(id, { res, rej })); }
  once(method, ms = 15000) {
    return new Promise(res => {
      const t = setTimeout(() => { this.handlers = this.handlers.filter(x => x !== h); res(null); }, ms);
      const h = m => { if (m.method === method) { clearTimeout(t); this.handlers = this.handlers.filter(x => x !== h); res(m.params); } };
      this.handlers.push(h);
    });
  }
}

async function webShots(target, steps = [], name = PAGE) {
  const exe = findChromium();
  if (!exe) {
    console.log('ERROR no bundled Chromium found. Install it once with: npx playwright install chromium-headless-shell');
    console.log('       (never point this tool at the installed Chrome or Edge: automating it can lock the Windows account)');
    process.exit(2);
  }
  if (/\\(Google|Microsoft)\\(Chrome|Edge)\\Application\\/i.test(exe)) { console.log('ERROR refusing to drive installed Chrome/Edge: ' + exe); process.exit(2); }
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'starter-shot-'));
  const browser = spawn(exe, ['--headless', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--password-store=basic', '--use-mock-keychain', '--disable-sync', '--disable-extensions', '--disable-background-networking',
    '--disable-component-update', '--disable-features=Translate,MediaRouter,OptimizationHints', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  try {
    let port = null;
    for (let i = 0; i < 100 && !port; i++) { await sleep(100); try { port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split(/\r?\n/)[0]; } catch { } }
    if (!port) throw new Error('Chromium did not start (no DevToolsActivePort)');
    const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    const c = new CDP(tab.webSocketDebuggerUrl);
    await c.open();
    const consoleErrors = [];
    c.handlers.push(m => {
      if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails?.exception?.description?.split('\n')[0] || m.params.exceptionDetails?.text);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map(a => a.value ?? a.description ?? '').join(' '));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') consoleErrors.push(`${m.params.entry.text} ${m.params.entry.url || ''}`.trim());
    });
    await Promise.all(['Page.enable', 'Runtime.enable', 'Log.enable'].map(x => c.send(x)));
    const sizes = opt('--sizes', '1400x900,390x844').split(',').map(s => s.trim().split('x').map(Number));
    const themes = opt('--themes', 'light,dark').split(',').map(s => s.trim());
    const settle = Number(opt('--settle', '700'));

    const capture = async (label, w, h, theme) => {
      const m = await c.send('Runtime.evaluate', { returnByValue: true, expression:
        `({sw: document.documentElement.scrollWidth, iw: innerWidth, sh: document.documentElement.scrollHeight,
           broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src).slice(0, 3),
           text: (document.body && document.body.innerText || '').trim().length})` });
      const v = m.result.value || {};
      const tag = `${label} ${w}x${h} ${theme}`;
      if (v.sw > w + 1 || v.iw > w + 1) warn(`sideways scroll at ${tag}: content ${Math.max(v.sw, v.iw)}px wide in a ${w}px viewport`);
      if (v.broken?.length) warn(`broken image(s) at ${tag}: ${v.broken.join(', ')}`);
      if (!v.text) warn(`blank page (no visible text) at ${tag}`);
      let clip;
      if (has('--full')) { const H = Math.min(v.sh || h, 8000); await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: H, deviceScaleFactor: 1, mobile: w < 600 }); clip = undefined; }
      const { data } = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: has('--full'), ...(clip ? { clip } : {}) });
      if (has('--full')) await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
      const file = path.join(outDir, `${label}-${w}x${h}-${theme}.png`);
      fs.writeFileSync(file, Buffer.from(data, 'base64'));
      shots.push(file);
      console.log('SCREENSHOT: ' + path.relative(ROOT, file).split(path.sep).join('/'));
    };

    for (const [w, h] of sizes) {
      for (const theme of themes) {
        await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 600 });
        await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
        const loaded = c.once('Page.loadEventFired');
        const nav = await c.send('Page.navigate', { url: target });
        if (nav.errorText) { warn(`could not load ${target}: ${nav.errorText}`); continue; }
        await loaded; await sleep(settle);
        await capture(name, w, h, theme);
        for (const s of steps) {
          const q = JSON.stringify(s.click || s.type || '');
          if (s.click) { const r = await c.send('Runtime.evaluate', { returnByValue: true, expression: `(() => { const e = document.querySelector(${q}); if (!e) return false; e.scrollIntoView({block:'center'}); e.click(); return true; })()` }); if (!r.result.value) warn(`step click: no element ${s.click}`); }
          if (s.type) { const r = await c.send('Runtime.evaluate', { returnByValue: true, expression: `(() => { const e = document.querySelector(${q}); if (!e) return false; e.focus(); e.value = ${JSON.stringify(s.text || '')}; e.dispatchEvent(new Event('input', {bubbles:true})); e.dispatchEvent(new Event('change', {bubbles:true})); return true; })()` }); if (!r.result.value) warn(`step type: no element ${s.type}`); }
          if (s.eval) { const r = await c.send('Runtime.evaluate', { returnByValue: true, awaitPromise: true, expression: s.eval }); if (r.exceptionDetails) warn(`step eval threw: ${r.exceptionDetails.exception?.description?.split('\n')[0]}`); else if (r.result.value !== undefined) console.log(`EVAL ${JSON.stringify(r.result.value).slice(0, 300)}`); }
          await sleep(s.wait || 300);
          if (s.shot) await capture(`${name}-${String(s.shot).replace(/[^\w.-]+/g, '-')}`, w, h, theme);
        }
      }
    }
    for (const e of [...new Set(consoleErrors)].slice(0, 10)) warn(`console error: ${String(e).slice(0, 300)}`);
    c.ws.close();
  } finally {
    killTree(browser);
    await sleep(300);
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch { }
  }
}

function windowShot(title) {
  if (process.platform !== 'win32') { console.log('ERROR --window capture is Windows-only here; use --url for web UIs'); process.exit(2); }
  const file = path.join(outDir, `${name}-window.png`);
  const ps = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public class KsWin {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint f);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  public struct RECT { public int L, T, R, B; }
}
"@
[KsWin]::SetProcessDPIAware() | Out-Null
$p = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -like ('*' + $env:STARTER_TITLE + '*') } | Select-Object -First 1
if (-not $p) { Write-Output 'NOWINDOW'; exit 3 }
$h = $p.MainWindowHandle
if ([KsWin]::IsIconic($h)) { [KsWin]::ShowWindow($h, 9) | Out-Null; Start-Sleep -Milliseconds 400 }
$r = New-Object KsWin+RECT; [KsWin]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.R - $r.L; $hh = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap $w, $hh
$g = [System.Drawing.Graphics]::FromImage($bmp); $dc = $g.GetHdc()
[KsWin]::PrintWindow($h, $dc, 2) | Out-Null
$g.ReleaseHdc($dc); $g.Dispose()
$bmp.Save($env:STARTER_OUT, [System.Drawing.Imaging.ImageFormat]::Png); $bmp.Dispose()
Write-Output ("OK " + $p.MainWindowTitle + " " + $w + "x" + $hh)
`;
  const psFile = path.join(os.tmpdir(), `starter-winshot-${process.pid}.ps1`);
  fs.writeFileSync(psFile, ps);
  let out = '';
  for (let i = 0; i < 20; i++) {
    const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', psFile], { encoding: 'utf8', env: { ...process.env, STARTER_TITLE: title, STARTER_OUT: file } });
    out = (r.stdout || '') + (r.stderr || '');
    if (/^OK /m.test(out)) break;
    if (!/NOWINDOW/.test(out)) break;
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{},500)']);
  }
  try { fs.unlinkSync(psFile); } catch { }
  if (!/^OK /m.test(out)) { warn(`no window titled like "${title}" could be captured: ${out.trim().slice(0, 300)}`); return; }
  console.log(out.trim().split(/\r?\n/).pop().replace(/^OK/, 'WINDOW'));
  shots.push(file);
  console.log('SCREENSHOT: ' + path.relative(ROOT, file).split(path.sep).join('/'));
}

async function waitForUrl(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { try { const r = await fetch(url); if (r.status < 500) return true; } catch { } await sleep(300); }
  return false;
}

let app = null;
try {
  const port = await freePort();
  const sub = s => s && s.replaceAll('{port}', String(port));
  const launch = sub(opt('--launch'));
  if (launch) {
    // a throwaway instance on a free port, never the user's running one
    app = spawn(launch, { shell: true, cwd: ROOT, stdio: 'ignore', detached: process.platform !== 'win32' });
    console.log(`LAUNCHED ${launch} (pid ${app.pid})`);
  }
  if (opt('--window')) {
    if (launch) await sleep(Number(opt('--wait', '3000')));
    windowShot(opt('--window'));
  } else {
    const target = opt('--file') ? pathToFileURL(path.resolve(opt('--file'))).href : sub(opt('--url'));
    if (!target && !has('--flows')) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 25).join('\n')); process.exit(1); }
    if (launch && /^https?:/.test(target) && !(await waitForUrl(target, Number(opt('--wait', '20000'))))) warn(`${target} did not answer within the wait time`);
    // Saved flows (docs/checks/flows/<page>.json): the review loop reruns every flow of the pages it touched, so a fix to
    // one screen can't quietly break a click path saved earlier. Lesson: a flow checked once was never run again.
    if (has('--flows')) {
      const dir = path.resolve(ROOT, opt('--flows', 'docs/checks/flows'));
      const only = opt('--pages') ? opt('--pages').split(',').map(x => x.trim().replace(/\.json$/, '')) : null;
      const flows = (fs.existsSync(dir) ? fs.readdirSync(dir) : []).filter(f => f.endsWith('.json') && (!only || only.includes(f.slice(0, -5))));
      if (!flows.length) warn(`no saved flows in ${path.relative(ROOT, dir) || dir}${only ? ` for ${only.join(', ')}` : ''}`);
      for (const f of flows) {
        let flow; try { flow = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch (e) { warn(`flow ${f} is not valid JSON: ${e.message}`); continue; }
        const steps = Array.isArray(flow) ? flow : flow.steps || [];
        const page = !Array.isArray(flow) && flow.page ? (/^https?:/.test(sub(flow.page)) ? sub(flow.page) : pathToFileURL(path.resolve(ROOT, flow.page)).href) : target;
        if (!page) { warn(`flow ${f} has no "page" and no --url / --file was given`); continue; }
        console.log(`FLOW: ${f}`);
        await webShots(page, steps, f.slice(0, -5).replace(/[^\w.-]+/g, '-'));
      }
    } else await webShots(target, opt('--steps') ? JSON.parse(fs.readFileSync(path.resolve(opt('--steps')), 'utf8')) : []);
  }
} catch (e) {
  warn(`screenshot run failed: ${e.message}`);
} finally {
  killTree(app);
}
console.log(`GUI-SHOT: ${shots.length} screenshot(s), ${warns.length} warning(s) in ${path.relative(ROOT, outDir).split(path.sep).join('/')}`);
console.log(shots.length ? 'NEXT: Read every screenshot above, list what is wrong (docs/checks/visual-review.md), fix, and run this again until a full round finds nothing.' : '');
process.exit(shots.length ? 0 : 1);
