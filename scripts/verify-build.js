#!/usr/bin/env node
'use strict';
/* Post-build integrity checks for dist/ (relative-path aware) */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
let fails = 0;
function ok(label, cond, extra) {
  console.log((cond ? '  OK   ' : '  FAIL ') + label + (extra ? '  ' + extra : ''));
  if (!cond) fails++;
}

// 0. Syntax-check every shipped JS file. A single bad character in a block
//    comment (e.g. "*/" inside prose) silently breaks the whole file and the
//    page then hangs on its loading state — catch it here, not in production.
console.log('[js syntax]');
const jsFiles = [
  'assets/js/registry.js', 'assets/js/latest-posts.js',
  'apps/manifest.js', 'games/manifest.js', 'tools/manifest.js', 'software/manifest.js',
  'blog-latest.js',
];
for (const rel of jsFiles) {
  const p = path.join(dist, rel);
  if (!fs.existsSync(p)) { ok(rel + ' exists', false); continue; }
  try {
    // Compile only (never run) — catches stray tokens such as an early "*/"
    // that silently swallows the rest of the file.
    new vm.Script(fs.readFileSync(p, 'utf8'), { filename: rel });
    ok(rel, true);
  } catch (e) {
    ok(rel, false, String(e.message).split('\n')[0]);
  }
}
function exists(rel) {
  let decoded;
  try { decoded = decodeURIComponent(rel); } catch (e) { decoded = rel; }
  const cands = [path.join(dist, decoded),
    path.join(dist, decoded.endsWith('/') ? decoded + 'index.html' : decoded + '/index.html')];
  return cands.some((c) => fs.existsSync(c));
}

// 1. Section pages must embed cards matching their current manifest (drift
//    guard: someone edited manifest.json without re-running the build).
console.log('[manifest -> static cards]');
for (const d of ['apps', 'games', 'tools', 'software']) {
  const htmlPath = path.join(dist, d, 'index.html');
  const manPath = path.join(dist, d, 'manifest.json');
  if (!fs.existsSync(htmlPath) || !fs.existsSync(manPath)) { ok(d, false, 'missing files'); continue; }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
  const cards = (html.match(/class="pf-card-wrap"/g) || []).length;
  const expected = (man.items || []).length;
  ok(d + ': ' + cards + '/' + expected + ' static cards', cards === expected);
  // Every item name must appear in the pre-rendered HTML.
  const missingNames = (man.items || []).filter((i) => !html.includes(i.name.replace(/&/g, '&amp;')));
  ok(d + ': all item names present', missingNames.length === 0,
    missingNames.map((i) => i.name).join(', '));
}

// 2. Every cover referenced by posts exists in dist/blog/images/
console.log('[covers]');
const db = JSON.parse(fs.readFileSync(path.join(root, 'blog-source', 'db.json'), 'utf8'));
for (const p of db.models.Post) {
  const c = p.cover || p.image;
  if (!c || /^(https?:)?\/\//.test(c)) continue;
  ok(p.title + ' -> ' + c, fs.existsSync(path.join(dist, 'blog', c.replace(/^\/+/, ''))));
}

// 2. blog-latest.json URLs resolve to generated index.html
console.log('[latest-posts urls]');
const latest = JSON.parse(fs.readFileSync(path.join(dist, 'blog-latest.json'), 'utf8'));
for (const p of latest.posts) {
  ok(p.title, exists(p.url.replace(/^\/+/, '')), p.url);
}

// 3. Manifests + their .js snapshots are valid
console.log('[manifests + snapshots]');
for (const d of ['apps', 'games', 'tools', 'software']) {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(dist, d, 'manifest.json'), 'utf8'));
    ok(d + '/manifest.json', Array.isArray(m.items) && m.items.length > 0, m.items.length + ' items');
  } catch (e) { ok(d + '/manifest.json', false, e.message); }
  const js = path.join(dist, d, 'manifest.js');
  ok(d + '/manifest.js snapshot', fs.existsSync(js) && /PF_MANIFEST/.test(fs.readFileSync(js, 'utf8')));
}
ok('blog-latest.js snapshot', fs.existsSync(path.join(dist, 'blog-latest.js')));

// 4. All local href/src in the portal + section pages resolve, resolving
//    relative to each page's own directory (works for both HTTP and file://)
console.log('[page links, relative to each page]');
const pages = ['index.html', 'about-us.html', 'contacts.html', 'map.html', 'media.html', 'lab.html',
  'apps/index.html', 'games/index.html', 'tools/index.html', 'software/index.html',
  'apps/media-player/index.html'];
let totalRefs = 0;
for (const rel of pages) {
  const file = path.join(dist, rel);
  if (!fs.existsSync(file)) { ok(rel + ' exists', false); continue; }
  const s = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  const missing = new Set();
  for (const m of s.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(u)) continue;
    totalRefs++;
    const clean = u.split('#')[0].split('?')[0];
    if (!clean) continue;
    let decoded; try { decoded = decodeURIComponent(clean); } catch (e) { decoded = clean; }
    const target = path.resolve(dir, decoded);
    const cands = [target, target + '/index.html', path.join(target, 'index.html')];
    if (!cands.some((c) => fs.existsSync(c))) missing.add(u);
  }
  ok(rel, missing.size === 0, missing.size ? [...missing].slice(0, 4).join(', ') : '');
}

// 5. Portal home essentials (relative versions)
console.log('[portal]');
const home = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
['blog/', 'software/', 'games/', 'apps/', 'tools/', 'latest-posts',
  'assets/js/latest-posts.js', 'assets/js/registry.js', 'blog-latest.js',
  'assets/css/platform.css', 'canonical', 'og:title'].forEach((k) =>
  ok('index.html contains ' + k, home.includes(k))
);
ok('home has no broken absolute /css/ ref', !/["'(]\/css\//.test(home));
ok('dist/.nojekyll', fs.existsSync(path.join(dist, '.nojekyll')));
ok('dist/blog/index.html', fs.existsSync(path.join(dist, 'blog', 'index.html')));
ok('dist/apps/media-player/index.html', fs.existsSync(path.join(dist, 'apps', 'media-player', 'index.html')));
ok('root player.html absent from dist', !fs.existsSync(path.join(dist, 'player.html')));
ok('dist/CNAME absent (custom-domain safety)', !fs.existsSync(path.join(dist, 'CNAME')));

console.log('\n' + totalRefs + ' local refs checked');
console.log(fails === 0 ? 'ALL CHECKS PASSED' : fails + ' CHECK(S) FAILED');
process.exit(fails === 0 ? 0 : 1);
