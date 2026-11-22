'use strict';
/*
 * Guards the shared site chrome so the two page families cannot drift apart:
 * seven generated-or-hand-written pages plus the four section pages must all
 * carry the same navigation, the same footer quick links, one Twitter handle,
 * an address link that opens the map page, and head metadata on the custom
 * domain. Exits non-zero when a page falls out of line, so a bad build never
 * reaches gh-pages.
 *
 * Usage: node scripts/verify-chrome.js
 */

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PAGES = [
  ['index.html', ''],
  ['about-us.html', ''],
  ['contacts.html', ''],
  ['media.html', ''],
  ['lab.html', ''],
  ['map.html', ''],
  ['apps/index.html', ''],
  ['apps/media-player/index.html', ''],
  ['games/index.html', ''],
  ['tools/index.html', ''],
  ['software/index.html', ''],
  ['gallery/index.html', ''],
];
let bad = 0;
function fail(f, m) { console.log('  FAIL ' + f + ': ' + m); bad++; }

PAGES.forEach(function (p) {
  const file = p[0];
  const abs = path.join(ROOT, file);
  let raw = fs.readFileSync(abs, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) fail(file, 'still has BOM');
  const html = raw.replace(/^\uFEFF/, '');

  // lang
  const lang = (html.match(/<html[^>]*lang="([^"]*)"/) || [])[1];
  if (lang !== 'zh-CN') fail(file, 'lang=' + lang);

  // meta uniqueness (apps/index.html is a redirect stub, skip head checks except lang/bom)
  const isStub = file === 'apps/index.html';
  if (!isStub) {
    const desc = (html.match(/<meta name="description"/g) || []).length;
    if (desc !== 1) fail(file, 'description x' + desc);
    const kw = (html.match(/<meta name="keywords"/g) || []).length;
    if (kw !== 1) fail(file, 'keywords x' + kw);
    const can = html.match(/<link rel="canonical" href="([^"]*)"/g) || [];
    if (can.length !== 1) fail(file, 'canonical x' + can.length);
    else if (!/https:\/\/llewellyn\.top\//.test(can[0])) fail(file, 'canonical host ' + can[0]);
    const og = (html.match(/<meta property="og:[a-z_:]+"/g) || []).length;
    if (og < 6) fail(file, 'og tags only ' + og);
    if (!/og:image/.test(html)) fail(file, 'no og:image');
    if (/llewellyn12138\.github\.io/.test(html)) fail(file, 'github.io origin left');
  }

  // nav
  const navM = html.match(/<ul class="rd-navbar-nav">([\s\S]*?)<\/ul>/);
  if (!navM) { if (!isStub) fail(file, 'no navbar nav'); }
  else {
    const n = (navM[1].match(/class="rd-nav-item/g) || []).length;
    if (n !== 7) fail(file, 'nav items ' + n);
    const offNav = ['contacts.html', 'media.html', 'lab.html', 'map.html', 'apps/media-player/index.html'];
    if (offNav.indexOf(file) === -1 && !/rd-nav-item active/.test(navM[1])) fail(file, 'no active nav item');
    if ((navM[1].match(/rd-nav-item active/g) || []).length > 1) fail(file, 'multiple active nav items');
  }

  // footer
  const ftM = html.match(/<ul class="footer-modern-list[^"]*"[^>]*>([\s\S]*?)<\/ul>/);
  if (!ftM) { if (!isStub) fail(file, 'no footer list'); }
  else {
    const n = (ftM[1].match(/<li>/g) || []).length;
    if (n !== 9) fail(file, 'footer items ' + n);
  }

  // share row + theme mount
  const shM = html.match(/<ul class="list-share-2">([\s\S]*?)<\/ul>/);
  if (!shM) { if (!isStub) fail(file, 'no list-share-2'); }
  else {
    if (!/twitter\.com\/llewellyn12138/.test(shM[1])) fail(file, 'share twitter wrong');
    if (/121225/.test(shM[1])) fail(file, 'share twitter still 121225');
  }
  if (!isStub && /121225/.test(html)) fail(file, 'leftover 121225 handle');

  // address link
  if (!isStub) {
    const ad = html.match(/<a class="address" href="([^"]*)"/);
    if (!ad) fail(file, 'no address link');
    else if (!/map\.html$/.test(ad[1])) fail(file, 'address href ' + ad[1]);
  }
});
if (bad === 0) {
  console.log('[chrome] ' + PAGES.length + ' pages share one nav / footer / handle / origin');
} else {
  console.error('[chrome] ' + bad + ' problem(s) found');
}
process.exit(bad === 0 ? 0 : 1);
