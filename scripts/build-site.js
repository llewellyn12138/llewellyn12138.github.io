#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const blogDir = path.join(repoRoot, 'blog-source');
const distDir = path.join(repoRoot, 'dist');
const isWin = process.platform === 'win32';

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: isWin });
  if (res.status !== 0) {
    console.error(`[build] failed: ${cmd} ${args.join(' ')}`);
    process.exit(res.status || 1);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.cpSync(src, dest, { recursive: true });
}

function copyFileIfExists(name) {
  const src = path.join(repoRoot, name);
  if (fs.existsSync(src) && fs.statSync(src).isFile()) {
    fs.copyFileSync(src, path.join(distDir, name));
  }
}

const skipHexo = process.argv.includes('--skip-hexo');

console.log('[build] 0/6 regenerate section pages from manifests');
// Section pages embed their cards as static HTML (graceful degradation), so
// they must be regenerated whenever a manifest changes — do it every build so
// the two can never drift apart.
run(process.execPath, [path.join(repoRoot, 'scripts', 'gen-sections.js')], repoRoot);
// The gallery page reuses the section shell, so it must be generated after it.
run(process.execPath, [path.join(repoRoot, 'scripts', 'gen-gallery.js')], repoRoot);
// The hand-written pages (index, about-us, contacts, media, lab, map and the
// media player) share the same nav/footer/share data as the generated ones, so
// rewrite their chrome too — otherwise the two families drift apart.
run(process.execPath, [path.join(repoRoot, 'scripts', 'gen-chrome.js')], repoRoot);
// robots.txt / sitemap.xml are build artifacts: the sitemap is derived from
// blog-latest.json, so regenerate it once the section pages are settled.
run(process.execPath, [path.join(repoRoot, 'scripts', 'gen-sitemap.js')], repoRoot);
// Re-apply the light/dark wiring last: generators rebuild section HTML and
// would otherwise drop the injected theme tags.
run(process.execPath, [path.join(repoRoot, 'scripts', 'inject-theme.js')], repoRoot);

console.log('[build] 1/5 sync posts -> blog-source/source/_posts');
const srcPosts = path.join(repoRoot, 'posts');
const dstPosts = path.join(blogDir, 'source', '_posts');
fs.rmSync(dstPosts, { recursive: true, force: true });
copyDir(srcPosts, dstPosts);

console.log('[build] 2/5 hexo clean && generate' + (skipHexo ? ' (skipped, already built)' : ''));
if (!skipHexo) {
  run('npx', ['hexo', 'clean'], blogDir);
  run('npx', ['hexo', 'generate'], blogDir);
}

console.log('[build] 3/5 assemble dist');
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const blogOut = path.join(blogDir, 'public', 'blog');
if (!fs.existsSync(blogOut)) {
  console.error('[build] blog output missing; check public_dir/root in blog-source/_config.yml');
  process.exit(1);
}
copyDir(blogOut, path.join(distDir, 'blog'));

// NOTE: we intentionally do NOT mirror blog output into the repo-root blog/.
// Pages now serves gh-pages, where this build's dist/ is the single source.
// Keeping a second copy on main only duplicated 1.5 MB of generated HTML.

// CNAME binds the site to llewellyn.top. It MUST ship with the artifact,
// otherwise GitHub Pages serves the github.io URL and ignores the custom
// domain. build-site verifies it has no BOM (a BOM breaks domain detection).
const cnamePath = path.join(repoRoot, 'CNAME');
if (fs.existsSync(cnamePath)) {
  const raw = fs.readFileSync(cnamePath);
  if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    console.error('[build] CNAME starts with a UTF-8 BOM; GitHub Pages will ignore it');
    process.exit(1);
  }
  fs.writeFileSync(path.join(distDir, 'CNAME'), raw);
  console.log('[build] CNAME -> ' + raw.toString('utf8').trim());
}

['index.html', 'about-us.html', 'contacts.html', 'map.html', 'media.html', 'lab.html'].forEach(
  copyFileIfExists
);
// robots.txt and sitemap.xml must ship with the site; Pages serves them from
// the artifact root, and search engines fetch them over the custom domain.
['robots.txt', 'sitemap.xml'].forEach((f) => {
  const src = path.join(repoRoot, f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, f));
});
['css', 'js', 'fonts', 'images', 'assets', 'apps', 'games', 'tools', 'software', 'gallery'].forEach((d) =>
  copyDir(path.join(repoRoot, d), path.join(distDir, d))
);
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

console.log('[build] 4/6 generate blog-latest.json');
run(process.execPath, [path.join(repoRoot, 'scripts', 'gen-blog-latest.js')], repoRoot);

console.log('[build] 5/6 generate file:// data snapshots');
run(process.execPath, [path.join(repoRoot, 'scripts', 'gen-data-js.js')], repoRoot);
// The snapshot generator writes into the source tree; copy the new .js files
// into dist/ so the deployed site has them too.
['games', 'tools', 'software'].forEach((d) => {
  const src = path.join(repoRoot, d, 'manifest.js');
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, d, 'manifest.js'));
});
const latestJs = path.join(repoRoot, 'blog-latest.js');
if (fs.existsSync(latestJs)) fs.copyFileSync(latestJs, path.join(distDir, 'blog-latest.js'));

console.log('[build] 6/6 done -> dist/');
