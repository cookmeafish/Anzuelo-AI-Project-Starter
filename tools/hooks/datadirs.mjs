// REQ: changelog (data folders). Shared by upgrade and setup: which top-level folders look like the user's own data.
import fs from 'node:fs';
import path from 'node:path';

// Top-level folders that look like the user's own data: a data-like name, or 5+ files, at least 4 in 5 of them data
// files (tables, documents, images, plain text), none of them code. Engine, docs and tooling folders never count.
// (Markdown in an item folder that also holds data files counts as that item's data: a content folder of items, each
// with its files and its own CHANGELOG.md or notes, is data. Item folders of Markdown alone stay notes. And a folder the
// project protects (protectedOriginals or newVersionOnly in its config) is data. Lesson (a field report, 2026-11-10): a
// project's main content folder, with a CHANGELOG.md per item, was not offered)
export function dataLikeDirs(dir) {
  const NAME = /^(data|datasets?|sources|catalogs?|collections?|exports?|imports?|inputs?|inbox|raw|records|archive)$/i;
  const SKIP = /^(\.|node_modules$|docs$|tools$|skills$|packs$|library$|src$|lib$|app$|tests?$|dist$|build$|profiles$)/i;
  const DATA = /\.(csv|tsv|json|jsonl|xlsx?|ods|txt|pdf|docx?|png|jpe?g|gif|webp|xml|ya?ml)$/i, CODE = /\.(m?js|cjs|ts|tsx|jsx|py|go|rs|java|cs|rb|php|sh|ps1|dart|swift|kt)$/i;
  const protectedTops = new Set();
  for (const f of ['tools/hooks/config.json', '.anzuelo/local/config.json']) {
    try { const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); for (const g of [].concat(c.protectedOriginals || [], c.newVersionOnly || [])) { const top = String(g).replace(/\\/g, '/').replace(/^\.\//, '').split('/')[0]; if (top && !/[*?[]/.test(top)) protectedTops.add(top); } } catch { }
  }
  const out = [];
  let names = []; try { names = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && !SKIP.test(e.name)).map(e => e.name); } catch { }
  for (const n of names) {
    // (each file with whether its own folder, below the top one, also holds a data file)
    const files = []; const walk = (p, depth) => { if (files.length > 400 || depth > 3) return; let es = []; try { es = fs.readdirSync(p, { withFileTypes: true }); } catch { return; }
      const here = es.filter(e => !e.isDirectory()).map(e => e.name), withData = depth > 0 && here.some(f => DATA.test(f));
      for (const f of here) files.push({ f, withData });
      for (const e of es) if (e.isDirectory()) walk(path.join(p, e.name), depth + 1); };
    walk(path.join(dir, n), 0);
    if (files.some(x => CODE.test(x.f))) continue;
    const data = files.filter(x => DATA.test(x.f) || (x.withData && /\.md$/i.test(x.f))).length;
    if (protectedTops.has(n) ? files.length > 0 : NAME.test(n) ? files.length > 0 : files.length >= 5 && data >= files.length * 0.8) out.push(n);
  }
  return out.sort();
}
