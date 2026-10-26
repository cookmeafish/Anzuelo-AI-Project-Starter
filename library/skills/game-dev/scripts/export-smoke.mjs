#!/usr/bin/env node
// Build, test, export and smoke-start a Godot 4 game headless, in one run. Zero dependencies.
//   node export-smoke.mjs --preset "<preset name>" --out builds/<target>/<Game>.<ext> [options]
// Options:
//   --project <dir>      folder with project.godot (default: the current folder)
//   --test "<command>"   the project's test command, e.g. "godot --headless -s addons/gut/gut_cmdln.gd -gexit"
//                        (default: "dotnet test" when a .csproj exists, otherwise no test step)
//   --debug              export a debug build (--export-debug) instead of a release build
//   --frames <n>         frames the smoke start runs before quitting (default 300)
//   --no-smoke "<why>"   skip the smoke start, for targets this machine cannot run (web, another OS)
//   --smoke-args "<a>"   arguments for the exported build (default: --headless --quit-after <frames>)
// GODOT_BIN names the Godot binary when it is not "godot" on PATH.
// Steps: preset check, dotnet build (C# projects), test, export, smoke start. The smoke step also fails when the
// output shows "SCRIPT ERROR", "Parse Error" or a crash, because Godot can exit 0 after a script error.
// Prints one line per step and ends with RESULT: PASS or RESULT: FAIL <step>.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const preset = arg('--preset'), out = arg('--out');
if (!preset || !out) { console.error('usage: node export-smoke.mjs --preset "<preset>" --out builds/<target>/<Game>.<ext> [--project <dir>] [--test "<cmd>"] [--debug] [--no-smoke "<why>"]'); process.exit(2); }
const project = path.resolve(arg('--project', '.'));
const frames = arg('--frames', '300');
const godot = process.env.GODOT_BIN || 'godot';
const outAbs = path.resolve(project, out);
const done = (ok, step, why = '') => { console.log(ok ? `RESULT: PASS${why ? ` (${why})` : ''}` : `RESULT: FAIL ${step}${why ? `: ${why}` : ''}`); process.exit(ok ? 0 : 1); };
const tail = s => String(s || '').trim().split(/\r?\n/).slice(-4).join(' | ');
const split = s => (s.match(/"[^"]*"|\S+/g) || []).map(x => x.replace(/^"|"$/g, ''));
// .js/.mjs wrappers run through node, so a stand-in binary works on every OS
const run = (cmd, args, opts = {}) => {
  const [c, a] = /\.(m?js)$/i.test(cmd) ? [process.execPath, [cmd, ...args]] : [cmd, args];
  return spawnSync(c, a, { cwd: project, encoding: 'utf8', timeout: 900000, shell: process.platform === 'win32' && /\.(cmd|bat)$/i.test(c), ...opts });
};
const step = (name, cmd, args, extra) => {
  const t0 = Date.now(); const r = run(cmd, args);
  const text = `${r.stdout || ''}\n${r.stderr || ''}`;
  let why = r.error ? r.error.message : r.status !== 0 ? `exit ${r.status}${r.signal ? ` (${r.signal})` : ''}: ${tail(text)}` : '';
  if (!why && extra) why = extra(text);
  console.log(`${why ? 'FAIL' : 'ok  '} ${name} (${Date.now() - t0} ms)${why ? `: ${why}` : ''}`);
  if (why) done(false, name, why.split(':')[0]);
};

// 1. the preset must exist: presets hold platform and signing choices made in the editor
if (!fs.existsSync(path.join(project, 'project.godot'))) done(false, 'project', `no project.godot in ${project}`);
const presetsFile = path.join(project, 'export_presets.cfg');
const presets = fs.existsSync(presetsFile) ? [...fs.readFileSync(presetsFile, 'utf8').matchAll(/^name="([^"]*)"/gm)].map(m => m[1]) : [];
if (!presets.includes(preset)) done(false, 'preset', `"${preset}" not in export_presets.cfg (found: ${presets.join(', ') || 'none'}); add it in the editor under Project > Export`);
console.log(`ok   preset "${preset}"`);

// 2. C# projects build first; 3. tests
const csproj = fs.readdirSync(project).some(f => /\.csproj$/i.test(f));
if (csproj) step('build', 'dotnet', ['build']);
const test = arg('--test', csproj ? 'dotnet test' : '');
if (test) { const [c, ...a] = split(test); step('test', c === 'godot' ? godot : c, a); } else console.log('--   test: no test command (pass --test "<cmd>")');

// 4. export (needs the export templates for this Godot version)
fs.mkdirSync(path.dirname(outAbs), { recursive: true });
try { fs.rmSync(outAbs, { force: true }); } catch { }
step('export', godot, ['--headless', argv.includes('--debug') ? '--export-debug' : '--export-release', preset, outAbs]);
if (!fs.existsSync(outAbs)) done(false, 'export', `no file at ${out} after export (export templates installed?)`);
const mb = (fs.statSync(outAbs).size / 1048576).toFixed(1);
console.log(`     built ${out} (${mb} MB)`);

// 5. smoke start of the exported build
if (argv.includes('--no-smoke')) done(true, 'smoke', `smoke skipped: ${arg('--no-smoke', 'no reason given')}`);
const smokeArgs = split(arg('--smoke-args', `--headless --quit-after ${frames}`));
step('smoke', outAbs, smokeArgs, text => {
  const m = /^.*(SCRIPT ERROR|Parse Error|ERROR: .*(Failed to load|Cannot|Invalid)|CrashHandlerException|Unhandled exception).*$/mi.exec(text);
  return m ? `error in output: ${m[0].trim().slice(0, 160)}` : '';
});
done(true);
