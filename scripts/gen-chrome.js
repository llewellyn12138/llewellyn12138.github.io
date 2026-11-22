'use strict';
/*
 * Regenerates the shared chrome (top nav, footer quick links, navbar share row,
 * the address link and the canonical/og:url origin) on the hand-written pages.
 *
 * The four generated section pages are rebuilt by gen-sections.js / gen-gallery.js
 * from the very same scripts/site-chrome.js data, so everything stays in sync.
 *
 * Usage: node scripts/gen-chrome.js
 */

const fs = require('fs');
const path = require('path');
const chrome_ = require('./site-chrome');

const ROOT = path.resolve(__dirname, '..');
const SITE = chrome_.SITE;

const PAGES = [
  {
    file: 'index.html', prefix: '', active: 'index.html', path: '',
    title: 'Llewellyn 的个人站 - 博客 · 软件库 · 小游戏 · 工具',
    description: 'Llewellyn 的个人站点：技术博客、软件下载、小游戏与在线小工具，全部是点开就能用的静态页面。',
    keywords: 'Llewellyn,博客,软件库,小游戏,在线工具,Hexo,GitHub Pages',
  },
  {
    file: 'about-us.html', prefix: '', active: 'about-us.html', path: 'about-us.html',
    title: '关于 - Llewellyn 的个人站',
    description: '关于 Llewellyn：做过什么、在学什么，以及这个站点是怎么搭起来的。',
    keywords: 'Llewellyn,关于,个人主页',
  },
  {
    file: 'contacts.html', prefix: '', active: null, path: 'contacts.html',
    title: '联系方式 - Llewellyn 的个人站',
    description: '通过邮箱、Telegram、Twitter 找到 Llewellyn，或者直接看看我在地图上的位置。',
    keywords: 'Llewellyn,联系方式,邮箱,Telegram',
  },
  {
    file: 'media.html', prefix: '', active: null, path: 'media.html',
    title: '媒体中心 - Llewellyn 的个人站',
    description: '站内的视频与音乐入口，视频播放器基于 ArtPlayer 搭建，支持字幕与清晰度切换。',
    keywords: 'Llewellyn,媒体中心,视频播放器,ArtPlayer',
  },
  {
    file: 'lab.html', prefix: '', active: null, path: 'lab.html',
    title: '实验室 - Llewellyn 的个人站',
    description: '还没成型的小想法都放在实验室：地图服务已经上线，Web 小工具在做。',
    keywords: 'Llewellyn,实验室,地图服务,Web 工具',
  },
  {
    file: 'map.html', prefix: '', active: null, path: 'map.html',
    title: '位置 - Llewellyn 的个人站',
    description: 'Llewellyn 所在的位置：重庆市沙坪坝区，附高德地图。',
    keywords: 'Llewellyn,位置,重庆,沙坪坝',
  },
  {
    file: 'apps/media-player/index.html', prefix: '../../', active: null, path: 'apps/media-player/',
    title: '视频播放器 - Llewellyn 的个人站',
    description: '基于 ArtPlayer 的在线视频播放器，支持字幕切换、清晰度选择与缩略图预览。',
    keywords: 'Llewellyn,视频播放器,ArtPlayer,在线播放',
  },
];

const BOM = '\uFEFF';

function replaceBlock(html, re, build, closeIndent, eol, label, file) {
  if (!re.test(html)) {
    throw new Error(file + ': ' + label + ' block not found');
  }
  const body = String(build).split('\n').join(eol);
  return html.replace(re, (m, open) => open + eol + body + eol + closeIndent + '</ul>');
}

/**
 * Rewrite the <head> metadata of a hand-written page: language, title,
 * description, keywords, canonical, Open Graph block and icon.
 * Everything between <head> and the first stylesheet link stays untouched.
 */
function rewriteHead(html, page, eol) {
  const P = page.prefix;
  const url = SITE + '/' + page.path;
  const iconPrefix = page.path.includes('/') ? '../../' : '';

  let out = html.replace(/<html([^>]*)lang="[^"]*"/, '<html$1lang="zh-CN"');

  // Drop whatever description / keywords are already there so the page never
  // ends up with two of each after the rewrite.
  out = out.replace(/[ \t]*<meta name="description"[^>]*>\r?\n/g, '');
  out = out.replace(/[ \t]*<meta name="keywords"[^>]*>\r?\n/g, '');

  out = out.replace(/<title>[\s\S]*?<\/title>/,
    '<title>' + page.title + '</title>' + eol +
    '  <meta name="description" content="' + page.description + '">' + eol +
    '  <meta name="keywords" content="' + page.keywords + '">');

  const og = [
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Llewellyn 的个人站">',
    '<meta property="og:title" content="' + page.title + '">',
    '<meta property="og:description" content="' + page.description + '">',
    '<meta property="og:url" content="' + url + '">',
    '<meta property="og:image" content="' + chrome_.OG_IMAGE + '">',
    '<meta name="twitter:card" content="summary_large_image">',
  ].join(eol + '  ');

  // Drop an existing canonical / og / twitter block, then re-insert a fresh one
  // right before the icon link.
  out = out.replace(/[ \t]*<link rel="canonical"[^>]*>\r?\n/g, '');
  out = out.replace(/[ \t]*<meta property="og:[^"]*"[^>]*>\r?\n/g, '');
  out = out.replace(/[ \t]*<meta name="twitter:card"[^>]*>\r?\n/g, '');

  const iconRe = /[ \t]*<link rel="icon"[^>]*>/;
  const hasIcon = iconRe.test(out);
  if (hasIcon) {
    out = out.replace(iconRe, (m) => '  <link rel="canonical" href="' + url + '">' + eol +
      '  ' + og + eol + '  <link rel="icon" href="' + iconPrefix + 'images/favicon.ico" type="image/x-icon">');
  } else {
    throw new Error(page.file + ': no <link rel="icon"> found');
  }
  return out;
}
let changed = 0;

PAGES.forEach((page) => {
  const abs = path.join(ROOT, page.file);
  let raw = fs.readFileSync(abs, 'utf8');
  const hadBom = raw.charAt(0) === BOM;
  if (hadBom) raw = raw.slice(1);
  const eol = raw.indexOf('\r\n') !== -1 ? '\r\n' : '\n';
  const before = raw;

  let html = raw;

  // 1) Top navigation
  html = replaceBlock(
    html,
    /(<ul class="rd-navbar-nav">)([\s\S]*?)(<\/ul>)/,
    chrome_.navHtml(page.prefix, page.active, '                    '),
    '                  ', eol, 'navigation', page.file
  );

  // 2) Footer quick links
  html = replaceBlock(
    html,
    /(<ul class="footer-modern-list[^"]*"[^>]*>)([\s\S]*?)(<\/ul>)/,
    chrome_.footerHtml(page.prefix, '                '),
    '              ', eol, 'footer', page.file
  );

  // 3) Navbar share row (theme.js mounts the light/dark toggle here)
  html = replaceBlock(
    html,
    /(<ul class="list-share-2">)([\s\S]*?)(<\/ul>)/,
    chrome_.shareHtml('                    '),
    '                  ', eol, 'share row', page.file
  );

  // 4) Address always opens the map page
  html = html.replace(/<a class="address" href="[^"]*">/g,
    '<a class="address" href="' + page.prefix + 'map.html">');

  // 5) One Twitter handle everywhere
  html = html.replace(/https:\/\/twitter\.com\/llewellyn121225/g, chrome_.TWITTER);

  // 6) Head metadata: lang, title, description, canonical, Open Graph
  html = rewriteHead(html, page, eol);


  if (html !== before) {
    fs.writeFileSync(abs, html, 'utf8');
    changed += 1;
    console.log('[chrome] updated ' + page.file + (hadBom ? ' (BOM removed)' : ''));
  }
});

console.log('[chrome] ' + changed + ' file(s) written');
