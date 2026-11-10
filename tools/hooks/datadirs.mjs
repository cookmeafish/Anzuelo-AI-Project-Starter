// REQ: changelog (data folders). Shared by upgrade and setup: which top-level folders look like the user's own data.
import fs from 'node:fs';
import path from 'node:path';

// Top-level folders that look like the user's own data: a data-like name, or 5+ files, at least 4 in 5 of them data
// files (tables, documents, images, plain text), none of them code. Engine, docs and tooling folders never count.
export function dataLikeDirs(dir) {
  const NAME = /^(data|datasets?|sources|catalogs?|collections?|exports?|imports?|inputs?|inbox|raw|records|archive)$/i;
  const SKIP = /^(\.|node_modules$|docs$|tools$|skills$|packs$|library$|src$|lib$|app$|tests?$|dist$|build$|profiles$)/i;
  const DATA = /\.(csv|tsv|json|jsonl|xlsx?|ods|txt|pdf|docx?|png|jpe?g|gif|webp|xml|ya?ml)$/i, CODE = /\.(m?js|cjs|ts|tsx|jsx|py|go|rs|java|cs|rb|php|sh|ps1|dart|swift|kt)$/i;
  const out = [];
  let names = []; try { names = fs.readdirSync(dir, { withFileTypes: true }).filter(e => e.isDirectory() && !SKIP.test(e.name)).map(e => e.name); } catch { }
  for (const n of names) {
    const files = []; const walk = (p, depth) => { if (files.length > 400 || depth > 3) return; let es = []; try { es = fs.readdirSync(p, { withFileTypes: true }); } catch { return; }
      for (const e of es) e.isDirectory() ? walk(path.join(p, e.name), depth + 1) : files.push(e.name); };
    walk(path.join(dir, n), 0);
    if (files.some(f => CODE.test(f))) continue;
    if (NAME.test(n) ? files.length > 0 : files.length >= 5 && files.filter(f => DATA.test(f)).length >= files.length * 0.8) out.push(n);
  }
  return out.sort();
}
