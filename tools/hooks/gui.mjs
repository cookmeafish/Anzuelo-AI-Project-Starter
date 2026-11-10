// REQ: gui-review-loop, shared by both engines (moved from hooks.mjs unchanged). A changed GUI is screenshotted and
// looked at AFTER its last edit, so every fix round is re-shot and re-checked; the loop ends only when a full round finds
// nothing (or at guiMaxRounds, with what is left).
// x: { changed: [rel], since: ms, reads: Set<rel>, toolsKnown, said }; cfg: { guiFiles, guiIgnore, guiShotDir, packs };
// io: { list(rel): names, stat(rel): fs.Stats, read(rel): Buffer|null, exists(rel), match(rel, globs), shown(): the
// last round's record {at, files}, saveShown(v) }.
// Returns { gui: [rel], gaps: [{ tag, msg }], reviewed: a fresh round exists (then its report, flows and warnings are
// checked: guiRound) }.
import { createHash } from 'node:crypto';

export function guiReview(x, cfg, io) {
  const gaps = [], add = (tag, msg) => gaps.push({ tag, msg }); let reviewed = false;
  const gui = x.changed.filter(p => io.match(p, cfg.guiFiles) && !io.match(p, cfg.guiIgnore) && io.exists(p));
  // REQ: gui-pack. A project that starts making screens gets the whole GUI kit (runbook, review loop, screenshot tool).
  if (gui.length && !(cfg.packs || []).includes('gui'))
    add('gui-pack', `GUI files changed (${gui.slice(0, 3).join(', ')}) but this project has no gui pack, so nothing checks how they look. ` +
      'Tell the user, then install it (node tools/packs.mjs install gui) and run the review loop, or waive it: node tools/hooks/hooks.mjs waive gui-pack "<why these files are not a user interface>".');
  else if (gui.length) {
    const shots = [];
    const walkShots = d => { for (const n of io.list(d)) { const p = `${d}/${n}`; let s; try { s = io.stat(p); } catch { continue; } if (s.isDirectory()) walkShots(p); else if (/\.png$/i.test(n) && s.mtimeMs > (x.since || 0) - 1000) shots.push({ p, t: s.mtimeMs }); } };
    walkShots(cfg.guiShotDir);
    // (a file written again with the bytes it had when the last round was shot is no edit: what is on screen is the
    // same. Lesson (a field report): a build that rewrote the page unchanged after a reviewed round asked for another
    // round twice. Each round records what it showed, in gui-shot.json)
    const lastShot = Math.max(0, ...shots.map(s => s.t)), sumOf = p => { const b = io.read(p); return b == null ? null : createHash('sha1').update(b).digest('hex'); };
    const shown = io.shown(), mtimeOf = p => io.stat(p).mtimeMs;
    const editedAt = p => mtimeOf(p) > lastShot && shown.at >= lastShot && shown.files?.[p] && shown.files[p] === sumOf(p) ? 0 : mtimeOf(p);
    const lastEdit = Math.max(...gui.map(editedAt));
    if (lastShot && lastEdit <= lastShot && shown.at !== lastShot) io.saveShown({ at: lastShot, files: Object.fromEntries(gui.map(p => [p, sumOf(p)])) });
    // the same shot taken again by a later run (same file name) replaces the earlier one: all show the same files.
    // Lesson, trial round 12: the hook asked to look at an older run's folder as "the latest round" while a newer one existed.
    const seenName = new Set();
    // (a contact sheet, _sheet-N.png, is no screenshot to review: opening it counts for the shots of its round folder)
    const isSheet = p => /(^|\/)_sheet-\d+\.png$/i.test(p);
    // (a full round - its folder has a contact sheet - shows the screens as they are: shots from before it, like a one-off
    // debug shot, are behind it. Lesson (a field report): two debug shots from before a reviewed 169-shot round were
    // asked for in the last Stop round)
    const dirOf = p => p.replace(/\/[^/]+$/, '');
    const fullDirs = new Set(shots.filter(s => isSheet(s.p) && s.t >= lastEdit).map(s => dirOf(s.p)));
    // (the start of the newest full round: its first shot)
    const fullAt = Math.max(lastEdit, ...[...fullDirs].map(d => Math.min(...shots.filter(s => dirOf(s.p) === d && s.t >= lastEdit).map(s => s.t))));
    const fresh = shots.filter(s => s.t >= fullAt && !isSheet(s.p)).sort((a, b) => b.t - a.t).filter(s => { const n = s.p.split('/').pop(); return !seenName.has(n) && seenName.add(n); }).map(s => s.p);
    const sheetDirs = new Set(shots.filter(s => isSheet(s.p) && x.reads.has(s.p)).map(s => s.p.replace(/\/[^/]+$/, '')));
    const files = gui.slice(0, 5).join(', ') + (gui.length > 5 ? ', ...' : '');
    if (!fresh.length)
      add('gui-review-loop', `GUI files changed (${files}) and ${shots.length ? 'were edited again after the last screenshots, so this round has not been checked' : 'no screenshots were taken'}. ` +
        'Use the gui-review-loop skill: node tools/screenshot.mjs (--url/--file/--window, desktop + phone, light + dark), Read every screenshot, ' +
        'list what is wrong (docs/checks/visual-review.md), fix, and repeat until a full round finds nothing.');
    else {
      reviewed = true;
      // with tool history: each screenshot was opened; without it: the answer lists each one it looked at
      let unread = fresh.filter(p => x.toolsKnown ? !x.reads.has(p) && !sheetDirs.has(p.replace(/\/[^/]+$/, '')) : !x.said.includes(p.split('/').pop()));
      // (a shot identical, byte for byte, to one already opened this turn shows nothing new: the screen did not change.
      // Lesson (website trials): all 64 shots of an unchanged run were opened again, about 160 reads in one setup)
      if (unread.length && x.toolsKnown) {
        const seen = new Set(shots.map(s => s.p).filter(p => x.reads.has(p)).map(sumOf).filter(Boolean));
        if (seen.size) unread = unread.filter(p => !seen.has(sumOf(p)));
      }
      if (unread.length) add('gui-review-loop', `Look at the latest round before judging it: open its contact sheet (_sheet-1.png in the round's folder; screenshot.mjs makes it), or each screenshot${x.toolsKnown ? '' : ', and list each file name in the Visual review section'}: ${unread.slice(0, 8).join(', ')}${unread.length > 8 ? ` (+${unread.length - 8} more)` : ''}.`);
    }
  }
  return { gui, gaps, reviewed };
}

// The checks on a reviewed round (moved from hooks.mjs unchanged): its one-line verdict, the saved flows of the pages it
// changed, and the warnings its latest run measured. x: { afterChange: the answer, runs: [{ cmd, out }], results: the
// turn's tool output, toolsKnown, said }; gui: the changed GUI files; exists(rel). Returns [{ tag, msg }].
const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function guiRound(x, cfg, gui, exists) {
  const gaps = [], add = (tag, msg) => gaps.push({ tag, msg });
  // REQ: gui-review-report
  const verdict = /visual review:\s*(pass|stopped)/i.exec(x.afterChange);
  if (!verdict || !/\bround|\bfirst (try|round|pass|attempt)\b/i.test(x.afterChange))
    // (one line may be the only place the rounds appear. Lesson: answers listed the rounds, then repeated "Visual
    // review: PASS after 5 rounds" right under them.)
    add('gui-review-report', 'Say how the visual review went in one line: "Visual review: PASS after N round(s) - <what the rounds fixed>" ' +
      `(a full round found nothing) or, only after ${cfg.guiMaxRounds} rounds, "Visual review: STOPPED after N rounds - remaining: ...". That line can be the only place the rounds appear; a list of rounds is optional. ` +
      'Write it in the user\'s language (Spanish: "Revisión visual: correcta tras N rondas" / "detenida tras N rondas").');
  // REQ: gui-flows. A page with a saved flow (docs/checks/flows/<page>.json) gets that flow rerun when it changes, so a
  // fix can't quietly break a click path checked earlier. Lesson: flows driven once were never driven again.
  const flowFor = [...new Set(gui.map(p => p.split('/').pop().replace(/\.[^.]+$/, '')))].filter(n => exists(`docs/checks/flows/${n}.json`));
  const shotRuns = x.runs.filter(r => new RegExp(cfg.guiShotCommand, 'i').test(r.cmd));
  const rerun = n => shotRuns.some(r => (/--flows\b/.test(r.cmd) && (!/--pages\b/.test(r.cmd) || new RegExp(`--pages[= ]["']?[\\w.,-]*\\b${escRe(n)}\\b`).test(r.cmd))) || new RegExp(`--steps[= ]["']?[^\\s"']*flows[\\\\/]${escRe(n)}\\.json`).test(r.cmd));
  const stale = x.toolsKnown ? flowFor.filter(n => !rerun(n)) : [];
  if (stale.length) add('gui-flows', `Saved flows exist for the pages you changed (${stale.map(n => `docs/checks/flows/${n}.json`).join(', ')}): rerun them in this round with node tools/screenshot.mjs --flows --pages ${stale.join(',')} (plus --url or --file), and look at their screenshots.`);
  // REQ: gui-warnings. Measured problems (sideways scroll, console errors, broken images) from the latest run are fixed or answered.
  const runs = x.results.split(/GUI-SHOT:/);
  const lastRun = runs.length > 1 ? runs[runs.length - 2].split(/NEXT: Read every screenshot/).pop() : '';
  // the run's own summary says how many were its warnings; other tools' WARN lines in between are not
  // (Lesson: an audit warning printed between two screenshot runs was counted as a screenshot warning.)
  const counted = [...x.results.matchAll(/GUI-SHOT: \d+ screenshot\(s\), (\d+) warning/g)].pop();
  let w = counted && +counted[1] ? [...lastRun.matchAll(/^WARN (.+)$/gm)].map(m => m[1]).slice(-counted[1]) : [];
  // (each address keeps its own latest run: a clean run of the preview server does not clear a warning the same
  // site gave opened as files. Lesson (trial v30): a blank page seen as files was hidden by a later clean run, and
  // the user found it)
  const target = cmd => (/--url[= ]["']?([^\s"']+)/.exec(cmd) || [])[1] || '';
  const latest = new Map();
  for (const r of shotRuns) if (/GUI-SHOT:/.test(r.out || '')) latest.set(target(r.cmd), r);
  for (const [t, r] of latest) {
    const n = +((/GUI-SHOT: \d+ screenshot\(s\), (\d+) warning/.exec(r.out || '') || [])[1] || 0);
    if (n && t && r !== shotRuns.filter(q => /GUI-SHOT:/.test(q.out || '')).pop()) w = [...w, ...[...String(r.out).matchAll(/^WARN (.+)$/gm)].map(m => `${m[1]} (${t})`).slice(-n)];
  }
  if (verdict && /pass/i.test(verdict[1]) && w.length && !/warn(ing)?s?\b[^\n]*(accepted|expected|not a problem|intentional|n\/a)/i.test(x.said))
    add('gui-warnings', `The latest screenshot run reported ${w.length} warning(s) (e.g. ${w[0].slice(0, 140)}). Fix them and re-shoot, or say in the answer why each is accepted ("warnings accepted: ...").`);
  return gaps;
}
