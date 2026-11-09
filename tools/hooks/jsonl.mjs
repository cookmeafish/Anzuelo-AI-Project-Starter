// Session transcripts (.jsonl) read line by line, in chunks, so a transcript of any size is read whole. Every tool
// that replays real sessions reads them through here.
// Lesson: a replay read each transcript into one string, and an 833 MB session went past the largest string Node
// allows (ERR_STRING_TOO_LONG): it was skipped, so the totals left a real session out without saying so.
import fs from 'node:fs';
import { StringDecoder } from 'node:string_decoder';

// Each line of `file` (without its line ending), in order.
export function* lines(file, chunk = 1 << 20) {
  const fd = fs.openSync(file, 'r'), buf = Buffer.alloc(chunk), dec = new StringDecoder('utf8');
  let rest = '';
  try {
    for (let n; (n = fs.readSync(fd, buf, 0, chunk, null)) > 0;) {
      const parts = (rest + dec.write(buf.subarray(0, n))).split('\n');
      rest = parts.pop();
      for (const p of parts) yield p.replace(/\r$/, '');
    }
    rest += dec.end();
    if (rest) yield rest.replace(/\r$/, '');
  } finally { fs.closeSync(fd); }
}
// Each row that parses as JSON (a broken or partial line is skipped), optionally only those `keep` accepts.
export function* rows(file, keep = null) {
  for (const l of lines(file)) {
    if (!l) continue;
    let r; try { r = JSON.parse(l); } catch { continue; }
    if (r && (!keep || keep(r))) yield r;
  }
}
// All the rows, as an array. Unreadable: [].
export const readRows = (file, keep = null) => { try { return [...rows(file, keep)]; } catch { return []; } };
// All the lines, as an array (for a tool that indexes lines). Unreadable: [].
export const readLines = file => { try { return [...lines(file)]; } catch { return []; } };
