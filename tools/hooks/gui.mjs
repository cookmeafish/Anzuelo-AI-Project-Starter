// REQ: gui-review-loop, shared by both engines (moved from hooks.mjs unchanged). A changed GUI is screenshotted and
// looked at AFTER its last edit, so every fix round is re-shot and re-checked; the loop ends only when a full round finds
// nothing (or at guiMaxRounds, with what is left).
// x: { changed: [rel], since: ms, reads: Set<rel>, toolsKnown, said }; cfg: { guiFiles, guiIgnore, guiShotDir, packs };
// io: { list(rel): names, stat(rel): fs.Stats, read(rel): Buffer|null, exists(rel), match(rel, globs), shown(): the
// last round's record {at, files}, saveShown(v) }.
// Returns { gui: [rel], gaps: [{ tag, msg }], reviewed: a fresh round exists (the old engine then checks its report,
// flows and warnings, which stay in hooks.mjs) }.
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
