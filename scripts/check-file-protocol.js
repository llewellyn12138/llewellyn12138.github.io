#!/usr/bin/env node
'use strict';
/*
 * Check that the repo *source tree* is coherent enough to preview locally by
 * double-clicking index.html (file:// protocol).
 *
 * Scope note: since Pages serves gh-pages, the repo root no longer mirrors the
 * generated blog (blog/). So "local preview" covers the portal shell and the
 * four section pages — the blog itself is a build artifact that only exists
 * after `node scripts/build-site.js` (in dist/).
 */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

// Portal + section pages that live in the source tree.
const pages = ['index.html', 'media.html', 'lab.html', 'about-us.html', 'contacts.html', 'map.html',
  'apps/index.html', 'games/index.html', 'tools/index.html', 'software/index.html',
  'apps/media-player/index.html', 'gallery/index.html'];

// Links that intentionally point at build output and cannot resolve in the
// raw source tree. They work once the site is built/served.
const BUILD_ONLY = [/^blog\//, /\.\.\/blog\//];

const bad = new Set();
const deferred = new Set();
let refs = 0;

for (const rel of pages) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { bad.add(rel + ' (page missing)'); continue; }
  const s = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  for (const m of s.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(u)) continue;
    refs++;
    const clean = u.split('#')[0].split('?')[0];
    if (!clean) continue;
    if (BUILD_ONLY.some((re) => re.test(clean))) { deferred.add(rel + ' -> ' + u); continue; }
    let d; try { d = decodeURIComponent(clean); } catch (e) { d = clean; }
    const t = path.resolve(dir, d);
    if (![t, t + '/index.html', path.join(t, 'index.html')].some((c) => fs.existsSync(c))) {
      bad.add(rel + '  ->  ' + u);
    }
  }
}

console.log('SOURCE TREE (file:// double-click)');
console.log('  checked refs      :', refs);
console.log('  resolvable now    :', refs - bad.size - deferred.size);
console.log('  blog links (build):', deferred.size, '(resolved after build-site.js)');
console.log('  missing           :', bad.size);
[...bad].forEach((x) => console.log('  MISSING', x));

// JS data snapshots used when fetch() is CORS-blocked under file://
const required = ['games/manifest.js', 'tools/manifest.js',
  'software/manifest.js', 'gallery/manifest.js', 'blog-latest.js', 'blog-latest.json'];
const missingData = required.filter((f) => !fs.existsSync(path.join(root, f)));
missingData.forEach((f) => { console.log('  MISSING DATA', f); bad.add(f); });

console.log(bad.size === 0
  ? 'SOURCE TREE OK — portal + sections preview locally; blog needs a build'
  : 'SOURCE TREE HAS GAPS');
process.exit(bad.size === 0 ? 0 : 1);
