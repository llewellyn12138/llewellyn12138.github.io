#!/usr/bin/env node
'use strict';
/*
 * Post-deploy smoke test for the gh-pages artifact.
 *
 * Runs in CI after build, against ./dist (the exact thing being published).
 * Purpose: when Pages serves ONLY gh-pages, a single missing file means the
 * live site breaks. This asserts the critical entry points are all present
 * before we publish, and fails the job loudly if not.
 */
const fs = require('fs');
const path = require('path');

const dist = path.resolve(__dirname, '..', 'dist');
let fails = 0;
const ok = (label, cond, extra) => {
  console.log((cond ? '  OK   ' : '  FAIL ') + label + (extra ? '  ' + extra : ''));
  if (!cond) fails++;
};

// Entry points a visitor can land on directly.
const REQUIRED_FILES = [
  'index.html',
  'about-us.html',
  'contacts.html',
  'map.html',
  'media.html',
  'lab.html',
  '.nojekyll',
  'blog/index.html',
  'blog-latest.json',
  'blog-latest.js',
  'apps/index.html',
  'apps/media-player/index.html',
  'games/index.html',
  'games/manifest.json',
  'tools/index.html',
  'tools/manifest.json',
  'gallery/index.html',
  'gallery/manifest.json',
  'software/index.html',
  'software/manifest.json',
  'assets/css/platform.css',
  'assets/js/registry.js',
  'assets/js/latest-posts.js',
  'css/bootstrap.css',
  'css/style.css',
  'js/core.min.js',
  'js/script.js',
  'js/artplayer.js',
  'js/player.js',
  'images/logo_78x66.png',
  'images/favicon.ico',
  'images/project-1-1200x800-original.jpg',
  'images/bg-1.jpg',
];

console.log('[required files]');
for (const f of REQUIRED_FILES) {
  const p = path.join(dist, f);
  const exists = fs.existsSync(p);
  const nonEmpty = exists && (f === '.nojekyll' ? true : fs.statSync(p).size > 0);
  ok(f, exists && nonEmpty, exists ? fs.statSync(p).size + ' B' : 'missing');
}

// Must NOT be published from gh-pages.
console.log('[must not be published]');
const FORBIDDEN = [
  'posts/coding/markdown-guide.md',
  'old/knowledge-loader.js',
  'blog-source/_config.yml',
  'scripts/build-site.js',
  'DEPLOYMENT.md',
  'player.html',
];
for (const f of FORBIDDEN) {
  ok(f + ' absent', !fs.existsSync(path.join(dist, f)));
}

// CNAME MUST be published, and must be plain ASCII with no BOM (a BOM makes
// GitHub Pages silently ignore the custom domain).
console.log('[custom domain]');
{
  const p = path.join(dist, 'CNAME');
  const exists = fs.existsSync(p);
  ok('CNAME published', exists);
  if (exists) {
    const buf = fs.readFileSync(p);
    const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
    ok('CNAME has no BOM', !hasBom);
    const domain = buf.toString('utf8').trim();
    ok('CNAME is a bare domain', /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain), domain);
  }
}

// Sanity: dist should look like a site, not an empty dir.
const count = (function walk(d, n = 0) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    n = e.isDirectory() ? walk(path.join(d, e.name), n) : n + 1;
  }
  return n;
})(dist);
console.log('\n[total] ' + count + ' files in dist');
// Lower bound guards against a catastrophically incomplete build (e.g. an
// empty dist). Exact counts change as images/assets are added or pruned.
ok('dist has a plausible file count (>= 120)', count >= 120, count + ' files');

console.log(fails === 0 ? '\nDEPLOY ARTIFACT OK' : '\n' + fails + ' PROBLEM(S)');
process.exit(fails === 0 ? 0 : 1);
