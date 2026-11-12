const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', 'media.html', 'lab.html', 'about-us.html', 'contacts.html', 'map.html',
  'apps/index.html', 'games/index.html', 'tools/index.html', 'software/index.html',
  'apps/media-player/index.html'];
const bad = new Set();
let refs = 0;
for (const rel of pages) {
  const file = path.join(root, rel);
  const s = fs.readFileSync(file, 'utf8');
  const dir = path.dirname(file);
  for (const m of s.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|\/\/)/i.test(u)) continue;
    refs++;
    const clean = u.split('#')[0].split('?')[0];
    if (!clean) continue;
    let d; try { d = decodeURIComponent(clean); } catch (e) { d = clean; }
    const t = path.resolve(dir, d);
    if (![t, t + '/index.html', path.join(t, 'index.html')].some((c) => fs.existsSync(c))) {
      bad.add(rel + '  ->  ' + u);
    }
  }
}
console.log('SOURCE TREE (file:// double-click) : ' + refs + ' refs, missing = ' + bad.size);
[...bad].forEach((x) => console.log('  MISSING', x));

// Also check the JS data snapshots referenced by pages exist
['apps/manifest.js', 'games/manifest.js', 'tools/manifest.js', 'software/manifest.js',
  'blog-latest.js', 'blog-latest.json'].forEach((f) => {
  if (!fs.existsSync(path.join(root, f))) { console.log('  MISSING DATA', f); bad.add(f); }
});
console.log(bad.size === 0 ? 'SOURCE TREE OK — double-click will render' : 'SOURCE TREE HAS GAPS');
