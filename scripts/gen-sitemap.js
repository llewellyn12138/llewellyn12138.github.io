'use strict';
/*
 * Generates robots.txt and sitemap.xml for the custom domain.
 *
 * The page list is derived from the same places the build uses: the static
 * root pages, the three manifest-driven section pages, the gallery, the media
 * player, and whatever posts blog-latest.json currently knows about. Running it
 * as part of the build keeps the sitemap from going stale when a post ships.
 *
 * Usage: node scripts/gen-sitemap.js
 */

const fs = require('fs');
const path = require('path');
const chrome_ = require('./site-chrome');

const ROOT = path.resolve(__dirname, '..');
const SITE = chrome_.SITE;

// Root-level pages that exist as plain files.
const STATIC_PAGES = [
  { loc: '/', file: 'index.html', priority: '1.0' },
  { loc: '/blog/', file: 'blog-source/index.html', priority: '0.9' },
  { loc: '/software/', file: 'software/index.html', priority: '0.8' },
  { loc: '/games/', file: 'games/index.html', priority: '0.7' },
  { loc: '/tools/', file: 'tools/index.html', priority: '0.8' },
  { loc: '/gallery/', file: 'gallery/index.html', priority: '0.7' },
  { loc: '/media.html', file: 'media.html', priority: '0.6' },
  { loc: '/lab.html', file: 'lab.html', priority: '0.5' },
  { loc: '/about-us.html', file: 'about-us.html', priority: '0.6' },
  { loc: '/contacts.html', file: 'contacts.html', priority: '0.5' },
  { loc: '/map.html', file: 'map.html', priority: '0.4' },
  { loc: '/apps/media-player/', file: 'apps/media-player/index.html', priority: '0.6' },
];

function lastmod(file) {
  const abs = path.join(ROOT, file);
  if (!fs.existsSync(abs)) return null;
  return fs.statSync(abs).mtime.toISOString().slice(0, 10);
}

function readPosts() {
  // Prefer the copy produced by THIS build (dist/blog-latest.json); the repo-root
  // snapshot only exists so the homepage works under file://. Reading the root
  // file after a build would silently drop posts that were added in the same run.
  const candidates = [
    path.join(ROOT, 'dist', 'blog-latest.json'),
    path.join(ROOT, 'blog-latest.json'),
  ];
  for (const snap of candidates) {
    if (!fs.existsSync(snap)) continue;
    try {
      const data = JSON.parse(fs.readFileSync(snap, 'utf8'));
      const posts = Array.isArray(data.posts) ? data.posts : [];
      console.log('[sitemap] posts from ' + path.relative(ROOT, snap) + ' (' + posts.length + ')');
      return posts;
    } catch (err) {
      console.warn('[sitemap] cannot read ' + snap + ': ' + err.message);
    }
  }
  return [];
}

const urls = STATIC_PAGES.map(function (p) {
  return { loc: SITE + p.loc, lastmod: lastmod(p.file), priority: p.priority };
});

readPosts().forEach(function (post) {
  if (!post || typeof post.url !== 'string') return;
  const u = post.url.charAt(0) === '/' ? post.url : '/' + post.url;
  // Prefer the date baked into the permalink (that is the published day on the
  // site); fall back to the raw front-matter date.
  const m = u.match(/\/blog\/(\d{4})\/(\d{2})\/(\d{2})\//);
  const day = m ? m[1] + '-' + m[2] + '-' + m[3]
    : (typeof post.date === 'string' ? post.date.slice(0, 10) : null);
  urls.push({ loc: SITE + u, lastmod: day, priority: '0.6' });
});

// Sitemap <loc> values must be ASCII-safe; blog permalinks may contain CJK
// characters (e.g. /blog/2026/03/05/coding/cmd命令/). encodeURI keeps the
// slashes and existing percent-escapes intact while escaping the rest.
function enc(loc) {
  return loc.replace(/[^\x00-\x7F]+/g, function (chunk) { return encodeURIComponent(chunk); });
}

const body = urls.map(function (u) {
  return [
    '  <url>',
    '    <loc>' + enc(u.loc) + '</loc>',
    u.lastmod ? '    <lastmod>' + u.lastmod + '</lastmod>' : null,
    '    <priority>' + u.priority + '</priority>',
    '  </url>',
  ].filter(Boolean).join('\n');
}).join('\n');

const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  body + '\n' +
  '</urlset>\n';

const robots = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /apps/index.html',
  '',
  'Sitemap: ' + SITE + '/sitemap.xml',
  '',
].join('\n');

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots, 'utf8');
console.log('[sitemap] wrote sitemap.xml (' + urls.length + ' urls) and robots.txt');
