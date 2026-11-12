#!/usr/bin/env node
'use strict';
/*
 * Dev-time generator for the four static section landing pages.
 * Run: node scripts/gen-sections.js
 *
 * All URLs are RELATIVE (prefix "../") so the pages render both over HTTP
 * and when opened directly via file:// (double-click).
 * The generated index.html files are committed; CI only copies them.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const P = '../';                       // section pages live one level deep
const D = 'assets/js/registry.js';

const NAV = [
  { label: '首页', href: P + 'index.html' },
  { label: '博客', href: P + 'blog/' },
  { label: '软件库', href: P + 'software/' },
  { label: '小游戏', href: P + 'games/' },
  { label: '小应用', href: P + 'apps/' },
  { label: '工具', href: P + 'tools/' },
  { label: '关于', href: P + 'about-us.html' },
];

const SECTIONS = [
  {
    dir: 'apps',
    title: '小应用',
    eyebrow: 'Apps',
    subtitle: '纯前端的小应用，打开即用',
    description: '不依赖后端、不收集数据的小应用：播放器、转换器、可视化页面等，全部可以直接在浏览器里跑。',
    icon: 'mdi-apps',
    note: '新增应用时：把页面放到 <code>apps/&lt;name&gt;/index.html</code>，然后在 <code>apps/manifest.json</code> 里加一条记录即可。改完 manifest 后跑一次 <code>node scripts/gen-data-js.js</code> 刷新本地预览快照。技术栈建议保持零构建的原生 HTML + ESM。',
  },
  {
    dir: 'games',
    title: '小游戏',
    eyebrow: 'Games',
    subtitle: '纯前端小游戏，摸鱼片刻',
    description: '用 Canvas / DOM 写的小游戏，无需安装、无需登录，点开即玩。',
    icon: 'mdi-gamepad-variant',
    note: '技术栈尚未定，位置已预留。建议长期方向：原生 HTML + ESM + Canvas，零构建。新增游戏放入 <code>games/&lt;name&gt;/</code> 并登记到 <code>games/manifest.json</code>。',
  },
  {
    dir: 'tools',
    title: '工具',
    eyebrow: 'Tools',
    subtitle: '常用在线小工具',
    description: '编码转换、格式化、计算器等随手可用的网页小工具，全部本地运算。',
    icon: 'mdi-tools',
    note: '技术栈尚未定，位置已预留。新增工具放入 <code>tools/&lt;name&gt;/</code> 并登记到 <code>tools/manifest.json</code>。',
  },
  {
    dir: 'software',
    title: '软件库',
    eyebrow: 'Software',
    subtitle: '我发布过的软件与下载',
    description: '自己写的小工具、脚本与安装包。大文件走 GitHub Releases 外链，小文件直接放在本站仓库里。',
    icon: 'mdi-package-variant-closed',
    note: '分发约定：体积较大或需要版本管理的安装包上传到 <strong>GitHub Releases</strong>，在 <code>software/manifest.json</code> 里用 <code>"external": true</code> + Releases 链接登记；小于 10 MB 的单文件可以放进 <code>software/files/</code> 直接由本站提供下载。',
  },
];

function navHtml(active) {
  return NAV.map((n) => {
    const cls = 'rd-nav-item' + (n.href === P + active + '/' ? ' active' : '');
    return `                    <li class="${cls}"><a class="rd-nav-link" href="${n.href}">${n.label}</a></li>`;
  }).join('\n');
}

function footerHtml() {
  return NAV.filter((n) => !n.href.endsWith('index.html'))
    .map((n) => `                <li><a href="${n.href}">${n.label === '关于' ? '关于我们' : n.label}</a></li>`)
    .join('\n') + `\n                <li><a href="${P}contacts.html">联系我们</a></li>`;
}

function page(s) {
  const canonical = `https://llewellyn12138.github.io/${s.dir}/`;
  return `<!DOCTYPE html>
<html class="wide wow-animation" lang="zh-CN">

<head>
  <title>${s.title} - Llewellyn 的个人站</title>
  <meta name="description" content="${s.description}">
  <meta name="keywords" content="${s.title},Llewellyn,${s.eyebrow},个人站">
  <meta name="format-detection" content="telephone=no">
  <meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta charset="utf-8">
  <meta name="author" content="Llewellyn">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${s.title} - Llewellyn 的个人站">
  <meta property="og:description" content="${s.description}">
  <meta property="og:url" content="${canonical}">
  <link rel="icon" href="${P}images/favicon.ico" type="image/x-icon">
  <!-- Stylesheets-->
  <link rel="stylesheet" href="${P}css/bootstrap.css">
  <link rel="stylesheet" href="${P}css/fonts.css">
  <link rel="stylesheet" href="${P}css/style.css">
  <link rel="stylesheet" href="${P}css/custom_fixes.css">
  <link rel="stylesheet" href="${P}assets/css/platform.css">
</head>

<body>
  <div class="page">
    <header class="section page-header">
      <!-- RD Navbar-->
      <div class="rd-navbar-wrap">
        <nav class="rd-navbar rd-navbar-modern" data-layout="rd-navbar-fixed" data-sm-layout="rd-navbar-fixed"
          data-md-layout="rd-navbar-fixed" data-md-device-layout="rd-navbar-fixed" data-lg-layout="rd-navbar-static"
          data-lg-device-layout="rd-navbar-fixed" data-xl-layout="rd-navbar-static"
          data-xl-device-layout="rd-navbar-static" data-xxl-layout="rd-navbar-static"
          data-xxl-device-layout="rd-navbar-static" data-lg-stick-up-offset="56px" data-xl-stick-up-offset="56px"
          data-xxl-stick-up-offset="56px" data-lg-stick-up="true" data-xl-stick-up="true" data-xxl-stick-up="true">
          <div class="rd-navbar-inner-outer">
            <div class="rd-navbar-inner">
              <div class="rd-navbar-panel">
                <button class="rd-navbar-toggle" data-rd-navbar-toggle=".rd-navbar-nav-wrap"><span></span></button>
                <div class="rd-navbar-brand"><a class="brand" href="${P}index.html"><img class="brand-logo-dark"
                      src="${P}images/logo_78x66.png" alt="Llewellyn" width="74" height="66" /></a></div>
              </div>
              <div class="rd-navbar-right rd-navbar-nav-wrap">
                <div class="rd-navbar-aside">
                  <ul class="rd-navbar-contacts-2">
                    <li>
                      <div class="unit unit-spacing-xs">
                        <div class="unit-left"><span class="icon mdi mdi-map-marker"></span></div>
                        <div class="unit-body"><a class="address" href="${P}map.html">重庆市·沙坪坝区</a></div>
                      </div>
                    </li>
                  </ul>
                  <ul class="list-share-2">
                    <li><a class="icon mdi mdi-twitter" href="https://twitter.com/llewellyn121225"></a></li>
                  </ul>
                </div>
                <div class="rd-navbar-main">
                  <ul class="rd-navbar-nav">
${navHtml(s.dir)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>

    <!-- Section hero -->
    <section class="pf-hero">
      <div class="container">
        <span class="pf-eyebrow"><span class="mdi ${s.icon}"></span> ${s.eyebrow}</span>
        <h1>${s.title}</h1>
        <p>${s.description}</p>
        <div class="pf-hero-meta">
          <span class="pf-pill"><span class="mdi ${s.icon}"></span> ${s.subtitle}</span>
          <span class="pf-pill" data-registry-count>加载中…</span>
        </div>
      </div>
    </section>

    <!-- Cards -->
    <section class="pf-section">
      <div class="container">
        <div class="pf-section-head">
          <div>
            <h2 id="registry-title">${s.title}列表</h2>
            <p>由 <code>${s.dir}/manifest.json</code> 驱动，改数据即改页面。</p>
          </div>
          <a class="pf-latest-all" href="${P}index.html">← 返回首页</a>
        </div>
        <div id="registry-grid" data-registry="${P}${s.dir}/manifest.json" data-registry-key="${s.dir}" data-registry-base="${P}" data-registry-head="#registry-title"></div>
        <div class="pf-note"><strong>维护说明：</strong>${s.note}</div>
      </div>
    </section>

    <footer class="section footer-modern context-dark footer-modern-2" style="padding: 15px 0 0 0;">
      <div class="footer-modern-line" style="padding-bottom: 15px;">
        <div class="container">
          <div class="row row-50" style="margin-bottom: 0;">
            <div class="col-md-6 col-lg-6">
              <h5 class="footer-modern-title oh-desktop" style="margin-bottom: 5px;"><span
                  class="d-inline-block wow slideInLeft">快速链接</span></h5>
              <ul class="footer-modern-list d-inline-block d-sm-block wow fadeInUp">
${footerHtml()}
              </ul>
            </div>
            <div class="col-md-6 col-lg-6">
              <div class="group-xmd group-sm-justify" style="justify-content: flex-end; align-items: center; height: 100%;">
                <div class="wow slideInRight">
                  <ul class="list-inline footer-social-list footer-social-list-2 footer-social-list-3">
                    <li><a class="icon fa fa-twitter" href="https://twitter.com/llewellyn12138" title="Twitter"></a></li>
                    <li><a class="icon fa fa-telegram" href="https://t.me/llewellyn12138" title="Telegram"></a></li>
                    <li><a class="icon fa fa-qq" href="https://imgbed.llewellyn.top/file/1772161761189_b_8f542b9813c2887582ca456a1bd26d79.jpg" target="_blank" title="QQ"></a></li>
                    <li><a class="icon fa fa-envelope" href="mailto:llewellyn@llewellyn.top" title="Email"></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-modern-line-3">
        <div class="container">
          <div class="row row-10 justify-content-between">
            <div class="col-md-6"><span>重庆市·沙坪坝区</span></div>
            <div class="col-md-auto">
              <p class="rights"><span>&copy;&nbsp;</span><span class="copyright-year"></span><span></span><span>.&nbsp;</span><span>All Rights Reserved.</span><span> Design&nbsp;by&nbsp;<a href="https://github.com/llewellyn12138">Llewellyn</a></span></p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
  <div class="snackbars" id="form-output-global"></div>
  <!-- Javascript-->
  <script src="${P}js/core.min.js"></script>
  <script src="${P}js/script.js"></script>
  <!-- Local data snapshot: works under file:// where fetch() is CORS-blocked -->
  <script src="${P}${s.dir}/manifest.js"></script>
  <script src="${P}${D}"></script>
</body>

</html>
`;
}

for (const s of SECTIONS) {
  const dir = path.join(root, s.dir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'index.html');
  fs.writeFileSync(file, page(s), 'utf8');
  console.log('[sections] wrote', path.relative(root, file));
}
