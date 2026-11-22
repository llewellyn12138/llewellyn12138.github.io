#!/usr/bin/env node
'use strict';
/*
 * Generate gallery/index.html from the shared section shell.
 *
 * The gallery reuses the exact nav / hero / footer markup of the section
 * pages (source: tools/index.html) and swaps the card grid for the image
 * gallery driven by gallery/manifest.json.
 *
 * Run: node scripts/gen-gallery.js   (build-site.js runs it automatically)
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const shellPath = path.join(root, 'tools', 'index.html');
const manifestPath = path.join(root, 'gallery', 'manifest.json');
const outPath = path.join(root, 'gallery', 'index.html');

if (!fs.existsSync(shellPath)) {
  console.error('[gallery] tools/index.html not found; run gen-sections.js first');
  process.exit(1);
}

const shell = fs.readFileSync(shellPath, 'utf8');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const count = (manifest.items || []).length;

let html = shell;

// --- head / metadata -------------------------------------------------------
html = html
  .replace(/<title>[^<]*<\/title>/, '<title>图库 - Llewellyn 的个人站</title>')
  .replace(/<meta name="description" content="[^"]*">/,
    '<meta name="description" content="Llewellyn ImgHub 图床图库：点击查看大图，一键复制图片直链。">')
  .replace(/<meta name="keywords" content="[^"]*">/,
    '<meta name="keywords" content="图库,图床,ImgHub,Llewellyn,图片直链">')
  .replace(/<link rel="canonical" href="[^"]*">/,
    '<link rel="canonical" href="https://llewellyn.top/gallery/">')
  .replace(/<meta property="og:title" content="[^"]*">/,
    '<meta property="og:title" content="图库 - Llewellyn 的个人站">')
  .replace(/<meta property="og:description" content="[^"]*">/,
    '<meta property="og:description" content="Llewellyn ImgHub 图床图库。">')
  .replace(/<meta property="og:url" content="[^"]*">/,
    '<meta property="og:url" content="https://llewellyn.top/gallery/">');

// --- hero ------------------------------------------------------------------
html = html.replace(
  /<span class="pf-eyebrow">[\s\S]*?<\/div>\s*<\/div>\s*<\/section>/,
  `<span class="pf-eyebrow"><span class="mdi mdi-image-multiple"></span> Gallery</span>
        <h1>图库</h1>
        <p>存在 Llewellyn ImgHub 上的图片。点开看大图，一键复制直链，可以直接贴进文章。</p>
        <div class="pf-hero-meta">
          <span class="pf-pill"><span class="mdi mdi-cloud-outline"></span> imgbed.llewellyn.top</span>
          <span class="pf-pill" data-gallery-count>共 <strong>${count}</strong> 张</span>
        </div>
      </div>
    </section>`
);

// --- body: replace the ENTIRE card section with the gallery ----------------
// A regex like /<div class="pf-section-head">[\s\S]*?<\/section>/ stops at the
// first </section>, which can sit inside nested category blocks — leaving the
// tools cards behind. Cut between two stable markers instead and keep only up
// to the section that wraps the cards.
const bodyStart = html.indexOf('<section class="pf-section">');
if (bodyStart === -1) {
  console.error('[gallery] could not locate <section class="pf-section"> in the shell');
  process.exit(1);
}
// Find the </section> that closes the section containing the registry grid by
// counting nested <section> tags from bodyStart.
let depth = 0;
let i = bodyStart;
let bodyEnd = -1;
while (i < html.length) {
  if (html.startsWith('<section', i)) { depth++; i += 8; continue; }
  if (html.startsWith('</section>', i)) {
    depth--;
    if (depth === 0) { bodyEnd = i; break; }
    i += 10; continue;
  }
  i++;
}
if (bodyEnd === -1) {
  console.error('[gallery] could not find the closing </section> of the card section');
  process.exit(1);
}

const replacement = `<section class="pf-section">
      <div class="container">
        <div class="pf-section-head">
          <div>
            <h2 id="page-title">全部图片</h2>
            <p>由 <code>gallery/manifest.json</code> 驱动。</p>
          </div>
          <a class="pf-latest-all" href="../index.html">← 返回首页</a>
        </div>
        <div class="gl-grid" id="gallery-grid"></div>
        <div class="pf-note"><strong>怎么加图片：</strong>先把图片传到
          <a href="https://imgbed.llewellyn.top" target="_blank" rel="noopener">ImgHub</a> 并复制直链，
          然后往 <code>gallery/manifest.json</code> 的 <code>items</code> 里加一条
          <code>{"url": "https://imgbed.llewellyn.top/file/xxx.jpg", "title": "说明"}</code>，
          重新构建即可。</div>
      </div>
    </section>`;
html = html.slice(0, bodyStart) + replacement + html.slice(bodyEnd + '</section>'.length);

// --- scripts ---------------------------------------------------------------
html = html
  .replace(/\s*<script src="\.\.\/(tools|games|software)\/manifest\.js"><\/script>/, '')
  .replace(/<script src="\.\.\/assets\/js\/registry\.js"><\/script>/,
    '<script src="../gallery/manifest.js"></script>\n  <script src="../assets/js/gallery.js"></script>');

// The gallery reuses the tools shell, so clear its active state and mark the
// gallery entry instead.
html = html.replace(/ class="rd-nav-item active"/g, ' class="rd-nav-item"');
html = html.replace(/(<li class="rd-nav-item"><a class="rd-nav-link" href="\.\.\/gallery\/">)/, '<li class="rd-nav-item active"><a class="rd-nav-link" href="../gallery/">');

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html, 'utf8');
console.log('[gallery] wrote gallery/index.html (' + html.length + ' bytes, ' + count + ' images)');
