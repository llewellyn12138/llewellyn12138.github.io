#!/usr/bin/env node
'use strict';
/* Prints every character that appears inside <h1>–<h3> across the source
   pages, plus the manifest titles/categories that are rendered into them.
   Used to rebuild the Old Maruko subset (see fonts/old-maruko/README.md). */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const pages = [];
(function walk(dir, depth) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (['node_modules', 'dist', 'blog-source', '.git'].includes(e.name) || e.name[0] === '.') continue;
      if (depth < 2) walk(path.join(dir, e.name), depth + 1);
    } else if (e.name.endsWith('.html')) {
      pages.push(path.join(dir, e.name));
    }
  }
})(root, 0);

const chars = new Set();
for (const file of pages.sort()) {
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<h[123]\b[^>]*>([\s\S]*?)<\/h[123]>/gi)) {
    const text = m[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
    for (const ch of text) chars.add(ch);
  }
}
for (const dir of ['software', 'tools', 'games', 'gallery']) {
  const p = path.join(root, dir, 'manifest.json');
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const add = (v) => { if (typeof v === 'string') for (const ch of v) chars.add(ch); };
  add(data.title);
  for (const item of data.items || []) add(item.name);
  for (const cat of data.categories || []) { add(cat.name); add(cat.desc); }
}
// Latin/punctuation rides along so the subset stays useful if a heading ever
// mixes scripts, even though Asfalto normally wins for those codepoints.
for (let i = 32; i < 127; i++) chars.add(String.fromCharCode(i));
for (const ch of '·、。，：；…—–“”‘’《》！？（）【】©®™°') chars.add(ch);

process.stdout.write([...chars].sort().join(''));
