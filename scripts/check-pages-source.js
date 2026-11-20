#!/usr/bin/env node
'use strict';
/*
 * Report whether the live site is still served from the `main` branch.
 *
 * Why it matters: while Pages serves `main`, everything committed there is
 * public (source .md, scripts, config) and the repo-root `blog/` mirror must
 * stay, otherwise the live blog 404s. Once Pages is switched to `gh-pages`,
 * that mirror becomes dead weight and can be removed.
 *
 * Usage:  node scripts/check-pages-source.js
 */
const probe = [
  ['DEPLOYMENT.md', 'main only'],
  ['scripts/build-site.js', 'main only'],
  ['posts/coding/markdown-guide.md', 'main only'],
  ['blog/index.html', 'both'],
  ['apps/media-player/index.html', 'both'],
];

(async () => {
  console.log('探测 https://llewellyn12138.github.io ...\n');
  const results = [];
  for (const [p, zone] of probe) {
    try {
      const r = await fetch(`https://llewellyn12138.github.io/${p}`, { cache: 'no-cache' });
      results.push({ p, zone, status: r.status });
      console.log(`  ${r.status}  /${p}  (${zone})`);
    } catch (e) {
      results.push({ p, zone, status: 'ERR' });
      console.log(`  ERR  /${p}  ${e.message}`);
    }
  }

  const mainOnlyExposed = results.filter((r) => r.zone === 'main only' && r.status === 200);
  console.log('');
  if (mainOnlyExposed.length) {
    console.log('结论：Pages 仍在服务 main 分支（' + mainOnlyExposed.length + ' 个 main 独有文件返回 200）');
    console.log('  -> 源文件仍对外公开');
    console.log('  -> 仓库根 blog/ 镜像必须保留，否则线上博客会 404');
    console.log('  -> 建议尽快在 Settings -> Pages 把 Source 切到 gh-pages');
  } else {
    console.log('结论：main 独有的源文件已不可访问，Pages 已切到 gh-pages');
    console.log('  -> 可以安全删除仓库根 blog/ 镜像（由 CI 构建产物提供）');
  }
})();
