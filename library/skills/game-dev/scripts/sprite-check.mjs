#!/usr/bin/env node
// Every sprite sits on the project's grid: each PNG is <size> x <size> pixels, or a sheet of whole <size> x <size> frames.
//   node sprite-check.mjs <folder|file.png>... <size>      e.g. node sprite-check.mjs assets/sprites 32
//   node sprite-check.mjs <folder> <width>x<height>         for frames that are not square, e.g. 16x24
// Reads only the PNG header (signature and IHDR), so it is fast and needs nothing installed. Zero dependencies.
// Prints one line per sprite that is off the grid or not a real PNG, then RESULT: PASS or RESULT: FAIL <count>.
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const sizeArg = args.length > 1 ? args[args.length - 1] : '';
const m = /^(\d+)(?:x(\d+))?$/i.exec(sizeArg);
if (!m || !+m[1] || (m[2] && !+m[2])) { console.error('usage: node sprite-check.mjs <folder|file.png>... <size | WxH>'); process.exit(2); }
const fw = +m[1], fh = +(m[2] || m[1]);
const targets = args.slice(0, -1);

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? (/^(\.git|node_modules|\.import|\.godot)$/.test(e.name) ? [] : walk(path.join(d, e.name))) : /\.png$/i.test(e.name) ? [path.join(d, e.name)] : []);

let bad = 0, count = 0;
for (const t of targets) {
  if (!fs.existsSync(t)) { console.log(`missing: ${t}`); bad++; continue; }
  for (const f of fs.statSync(t).isDirectory() ? walk(t) : [t]) {
    count++;
    const fd = fs.openSync(f, 'r'); const b = Buffer.alloc(24); const n = fs.readSync(fd, b, 0, 24, 0); fs.closeSync(fd);
    if (n < 24 || !b.subarray(0, 8).equals(SIG) || b.toString('ascii', 12, 16) !== 'IHDR') { console.log(`${f}: not a PNG (wrong signature or header)`); bad++; continue; }
    const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
    if (w % fw || h % fh) { console.log(`${f}: ${w}x${h}, not whole ${fw}x${fh} frames`); bad++; }
  }
}
console.log(`checked ${count} sprite(s) against ${fw}x${fh}`);
console.log(bad ? `RESULT: FAIL ${bad} sprite(s) off the grid or unreadable` : 'RESULT: PASS');
process.exit(bad ? 1 : 0);
