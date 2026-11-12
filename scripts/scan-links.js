const fs = require('fs');
const path = require('path');
const dist = path.join(__dirname, '..', 'dist');
const bad = new Set();
const re = /(?:href|src)="(\/(?:css|js|fonts|images|assets|apps|games|tools|software|blog|blog-latest)[^"#?]*)"/g;
function exists(rel) {
  let decoded;
  try { decoded = decodeURIComponent(rel); } catch (e) { decoded = rel; }
  const r = decoded.replace(/^\//, '');
  const cands = [
    path.join(dist, r),
    path.join(dist, r.endsWith('/') ? r + 'index.html' : r + '/index.html'),
  ];
  return cands.some((c) => fs.existsSync(c));
}
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      const s = fs.readFileSync(p, 'utf8');
      for (const m of s.matchAll(re)) {
        if (!exists(m[1])) bad.add(m[1] + '  <-  ' + path.relative(dist, p));
      }
    }
  }
}
walk(dist);
console.log('real missing refs =', bad.size);
[...bad].slice(0, 30).forEach((x) => console.log('  MISSING', x));
