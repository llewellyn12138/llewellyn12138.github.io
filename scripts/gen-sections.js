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
const { renderCards, renderGrouped, esc } = require('./card-template');
const chrome_ = require('./site-chrome');

const root = path.resolve(__dirname, '..');
const P = '../';                       // section pages live one level deep
const D = 'assets/js/registry.js';
const SITE = chrome_.SITE;

/**
 * Read <dir>/manifest.json and pre-render its cards into static HTML.
 * The page therefore has real content even if JS never runs; registry.js
 * later replaces it only if a newer manifest is successfully fetched.
 */
function loadStatic(dir) {
  const p = path.join(root, dir, 'manifest.json');
  let data = { title: '', items: [] };
  try {
    data = JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.warn('[sections] cannot read ' + dir + '/manifest.json: ' + e.message);
  }
  const items = Array.isArray(data.items) ? data.items : [];
  const online = items.filter((i) => i.status !== 'planned').length;
  const grouped = renderGrouped(data, P);
  return {
    cards: grouped || (items.length ? renderCards(items, P) : ''),
    grouped: !!grouped,
    countLabel:
      '共 <strong>' + items.length + '</strong> 项 · 已上线 <strong>' + online + '</strong>',
    title: data.title || '',
  };
}

const SECTIONS = [
  {
    dir: 'games',
    title: '小游戏',
    eyebrow: 'Games',
    subtitle: '纯前端小游戏，摸鱼片刻',
    description: '用 Canvas / DOM 写的小游戏，无需安装、无需登录，点开即玩。',
    icon: 'mdi-gamepad-variant',
    note: '目前还没有上线的小游戏，位置先占住。新增游戏时，把页面放进 <code>games/&lt;name&gt;/</code>，再到 <code>games/manifest.json</code> 里登记一条，列表与计数会自动更新。',
  },
  {
    dir: 'tools',
    title: '工具',
    eyebrow: 'Tools',
    subtitle: '顺手就用的网页工具',
    description: '编码转换、格式化、计算器等随手可用的网页小工具，全部在本地运算，不上传任何数据。',
    icon: 'mdi-screwdriver',
    note: '上面的工具多数是在线服务，点开即用，不由本站托管。写了新工具时，把页面放进 <code>tools/&lt;name&gt;/</code>，再登记到 <code>tools/manifest.json</code>。',
  },
  {
    dir: 'software',
    title: '软件库',
    eyebrow: 'Software',
    subtitle: '软件、小应用与下载',
    description: '自己写的软件、小应用、脚本与安装包。大文件走 GitHub Releases 外链，小文件直接放在本站仓库里。',
    icon: 'mdi-package-variant-closed',
    note: '分发约定：体积较大或需要版本管理的安装包上传到 <strong>GitHub Releases</strong>，在 <code>software/manifest.json</code> 里用 <code>"external": true</code> + Releases 链接登记；小于 10 MB 的单文件可以放进 <code>software/files/</code> 直接由本站提供下载。小应用（纯前端页面）也登记在这里。',
  },
];

function page(s) {
  const canonical = SITE + '/' + s.dir + '/';
  const ogImage = chrome_.OG_IMAGE;
  const st = loadStatic(s.dir);
  const staticCards = st.cards;
  const countLabel = st.countLabel;
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
  <meta property="og:site_name" content="Llewellyn 的个人站">
  <meta property="og:title" content="${s.title} - Llewellyn 的个人站">
  <meta property="og:description" content="${s.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${P}images/favicon.ico" type="image/x-icon">
  <!-- Stylesheets-->
  <link rel="stylesheet" href="${P}css/bootstrap.css">
  <link rel="stylesheet" href="${P}css/fonts.css">
  <link rel="stylesheet" href="${P}css/style.css">
  <link rel="stylesheet" href="${P}css/custom_fixes.css">
  <link rel="stylesheet" href="${P}assets/css/platform.css">
  <!-- pf-theme:start -->
  <script>(function(){try{var k="pf-theme",m=localStorage.getItem(k)||"auto";var d=m==="auto"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;var r=document.documentElement;r.setAttribute("data-theme",d);r.style.colorScheme=d;}catch(e){document.documentElement.setAttribute("data-theme","light");}})();</script>
  <link rel="stylesheet" href="${P}assets/css/theme.css">
  <!-- pf-theme:end -->
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
${chrome_.shareHtml('                    ')}
                  </ul>
                </div>
                <div class="rd-navbar-main">
                  <ul class="rd-navbar-nav">
${chrome_.navHtml(P, s.dir + '/', '                    ')}
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
          <span class="pf-pill" data-registry-count>${countLabel}</span>
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
        <div class="${st.grouped ? 'pf-grouped' : 'pf-grid'}" id="registry-grid" data-registry="${P}${s.dir}/manifest.json" data-registry-key="${s.dir}" data-registry-base="${P}" data-registry-head="#registry-title">${staticCards}</div>
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
${chrome_.footerHtml(P, '                ')}
              </ul>
            </div>
            <div class="col-md-6 col-lg-6">
              <div class="group-xmd group-sm-justify" style="justify-content: flex-end; align-items: center; height: 100%;">
                <div class="wow slideInRight">
                  <ul class="list-inline footer-social-list footer-social-list-2 footer-social-list-3">
                    <li><a class="icon fa fa-twitter" href="${chrome_.TWITTER}" title="Twitter"></a></li>
                    <li><a class="icon fa fa-telegram" href="${chrome_.TELEGRAM}" title="Telegram"></a></li>
                    <li><a class="icon fa fa-qq" href="${chrome_.QQ}" target="_blank" title="QQ"></a></li>
                    <li><a class="icon fa fa-envelope" href="${chrome_.EMAIL}" title="Email"></a></li>
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
              <p class="rights"><span>&copy;&nbsp;</span><span class="copyright-year"></span><span></span><span>.&nbsp;</span><span>All Rights Reserved.</span><span> Design&nbsp;by&nbsp;<a href="${chrome_.GITHUB}">Llewellyn</a></span></p>
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
  <!-- pf-theme:start -->
  <script src="${P}assets/js/theme.js"></script>
  <!-- pf-theme:end -->
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
