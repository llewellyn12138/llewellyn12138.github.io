#!/usr/bin/env node
'use strict';
/* One-off: replace nav + footer quick links on legacy root pages with the
   unified platform navigation. Assumes normalize-links.js already ran. */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const files = ['index.html', 'media.html', 'lab.html', 'about-us.html', 'contacts.html', 'map.html'];

// Which nav item is active on each page
const activeMap = {
  'index.html': '/',
  'media.html': '/media.html',
  'lab.html': '/lab.html',
  'about-us.html': '/about-us.html',
  'contacts.html': '/contacts.html',
  'map.html': '/map.html',
};

const NAV = [
  ['首页', '/'],
  ['博客', '/blog/'],
  ['软件库', '/software/'],
  ['小游戏', '/games/'],
  ['小应用', '/apps/'],
  ['工具', '/tools/'],
  ['关于', '/about-us.html'],
];

const FOOTER = [
  ['博客', '/blog/'],
  ['软件库', '/software/'],
  ['小游戏', '/games/'],
  ['小应用', '/apps/'],
  ['工具', '/tools/'],
  ['媒体中心', '/media.html'],
  ['实验室', '/lab.html'],
  ['关于我们', '/about-us.html'],
  ['联系我们', '/contacts.html'],
];

function navHtml(active) {
  return NAV.map(([label, href]) =>
    `                    <li class="rd-nav-item${href === active ? ' active' : ''}"><a class="rd-nav-link" href="${href}">${label}</a></li>`
  ).join('\n');
}

function footerHtml() {
  return FOOTER.map(([label, href]) => `                <li><a href="${href}">${label}</a></li>`).join('\n');
}

function replaceBlock(s, startMarker, endMarker, replacement) {
  const a = s.indexOf(startMarker);
  if (a === -1) return s;
  const b = s.indexOf(endMarker, a);
  if (b === -1) return s;
  return s.slice(0, a) + replacement + s.slice(b + endMarker.length);
}

for (const name of files) {
  const p = path.join(root, name);
  let s = fs.readFileSync(p, 'utf8');

  s = replaceBlock(s,
    '                  <ul class="rd-navbar-nav">',
    '                  </ul>',
    '                  <ul class="rd-navbar-nav">\n' + navHtml(activeMap[name]) + '\n                  </ul>'
  );

  s = replaceBlock(s,
    '              <ul class="footer-modern-list',
    '              </ul>',
    '              <ul class="footer-modern-list d-inline-block d-sm-block wow fadeInUp">\n' + footerHtml() + '\n              </ul>'
  );

  // Ensure shared platform CSS is loaded (needed by registry cards if used).
  if (!s.includes('/assets/css/platform.css')) {
    s = s.replace('  <link rel="stylesheet" href="/css/custom_fixes.css">',
      '  <link rel="stylesheet" href="/css/custom_fixes.css">\n  <link rel="stylesheet" href="/assets/css/platform.css">');
  }

  fs.writeFileSync(p, s, 'utf8');
  console.log('[nav] unified', name);
}
