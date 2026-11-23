#!/usr/bin/env node
'use strict';
/*
 * Inject (or refresh) the light/dark theme wiring in every page.
 *
 * Adds, per page and idempotently:
 *   1. an inline <script> in <head> that applies the saved theme BEFORE paint
 *      (prevents a flash of the wrong theme)
 *   2. <link rel="stylesheet" .../assets/css/theme.css>
 *   3. <script src=".../assets/js/theme.js"> before </body>
 *
 * Handles both root-level pages (prefix "") and one/two-level pages
 * (prefix "../" / "../../").
 *
 * Run: node scripts/inject-theme.js
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const PAGES = [
  ['index.html', ''],
  ['media.html', ''],
  ['lab.html', ''],
  ['about-us.html', ''],
  ['contacts.html', ''],
  ['map.html', ''],
  ['games/index.html', '../'],
  ['tools/index.html', '../'],
  ['software/index.html', '../'],
  ['gallery/index.html', '../'],
  ['apps/index.html', '../'],
  ['apps/media-player/index.html', '../../'],
];

// Inline snippet: must be tiny and dependency-free. Reads localStorage and
// falls back to the OS preference.
const INLINE = [
  '<script>',
  '(function(){try{',
  'var k="pf-theme",m=localStorage.getItem(k)||"auto";',
  'var d=m==="auto"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;',
  'var r=document.documentElement;',
  'r.setAttribute("data-theme",d);r.style.colorScheme=d;',
  '}catch(e){document.documentElement.setAttribute("data-theme","light");}})();',
  '</script>',
].join('');

const MARK_START = '<!-- pf-theme:start -->';
const MARK_END = '<!-- pf-theme:end -->';

let changed = 0;

for (const [rel, prefix] of PAGES) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) { console.warn('skip (missing):', rel); continue; }

  let html = fs.readFileSync(p, 'utf8');
  const before = html;

  // Remove any previous injection so re-runs stay clean.
  html = html.replace(
    new RegExp('\\s*' + MARK_START + '[\\s\\S]*?' + MARK_END + '\\s*', 'g'),
    '\n'
  );

  const headBlock =
    `${MARK_START}\n` +
    `  ${INLINE}\n` +
    `  <link rel="stylesheet" href="${prefix}assets/css/theme.css">\n` +
    `  <!-- pf-theme:end -->`;

  // 1. Insert after the platform.css link (so our overrides come last).
  const platformLink = new RegExp(
    `<link rel="stylesheet" href="${prefix.replace(/\./g, '\\.')}assets/css/platform\\.css">`
  );
  if (platformLink.test(html)) {
    html = html.replace(platformLink, (m) => m + '\n  ' + headBlock);
  } else if (/<\/head>/.test(html)) {
    // Page without platform.css (e.g. legacy pages): inject before </head>.
    html = html.replace(/<\/head>/, '  ' + headBlock + '\n</head>');
  }

  // 2. Load theme.js just before </body>.
  const jsTag = `${MARK_START}\n  <script src="${prefix}assets/js/theme.js"></script>\n  <!-- pf-theme:end -->`;
  const bodyEnd = html.lastIndexOf('</body>');
  if (bodyEnd !== -1) {
    html = html.slice(0, bodyEnd) + jsTag + '\n' + html.slice(bodyEnd);
  }

  if (html !== before) {
    fs.writeFileSync(p, html, 'utf8');
    changed++;
    console.log('themed:', rel);
  } else {
    console.log('unchanged:', rel);
  }
}

console.log('\n更新页面数:', changed);
