'use strict';
/*
 * Single source of truth for site-wide chrome: the top navigation, the footer
 * "quick links" list and the navbar share row.
 *
 * scripts/gen-sections.js (section landing pages), scripts/gen-gallery.js and
 * scripts/gen-chrome.js (the hand-written pages) all build their markup from
 * here, so the nav/footer can never drift apart again.
 *
 * Every href below is SITE-RELATIVE (no "./" and no "../"); callers pass the
 * prefix that matches their page depth ('' , '../' or '../../').
 */

const LINKS = [
  { label: '首页', href: 'index.html', nav: true },
  { label: '博客', href: 'blog/', nav: true },
  { label: '软件库', href: 'software/', nav: true },
  { label: '小游戏', href: 'games/', nav: true },
  { label: '工具', href: 'tools/', nav: true },
  { label: '图库', href: 'gallery/', nav: true },
  { label: '媒体中心', href: 'media.html' },
  { label: '实验室', href: 'lab.html' },
  { label: '关于', href: 'about-us.html', nav: true, footerLabel: '关于我们' },
  { label: '联系我们', href: 'contacts.html' },
];

const SITE = 'https://llewellyn.top';
const TWITTER = 'https://twitter.com/llewellyn12138';
const TELEGRAM = 'https://t.me/llewellyn12138';
const EMAIL = 'mailto:llewellyn@llewellyn.top';
const GITHUB = 'https://github.com/llewellyn12138';
const QQ = 'https://imgbed.llewellyn.top/file/1772161761189_b_8f542b9813c2887582ca456a1bd26d79.jpg';
const OG_IMAGE = SITE + '/images/banner-home-1.jpg';

function navItems() {
  return LINKS.filter((l) => l.nav);
}

function navHtml(prefix, active, indent) {
  return navItems()
    .map((l) => {
      const cls = 'rd-nav-item' + (active && l.href === active ? ' active' : '');
      return indent + '<li class="' + cls + '"><a class="rd-nav-link" href="' + prefix + l.href + '">' + l.label + '</a></li>';
    })
    .join('\n');
}

function footerHtml(prefix, indent) {
  return LINKS.filter((l) => l.href !== 'index.html')
    .map((l) => indent + '<li><a href="' + prefix + l.href + '">' + (l.footerLabel || l.label) + '</a></li>')
    .join('\n');
}

/* The navbar share row. theme.js injects the light/dark toggle into this
 * <ul>, so the class name is load-bearing — do not rename it. */
function shareHtml(indent) {
  return indent + '<li><a class="icon mdi mdi-twitter" href="' + TWITTER + '"></a></li>';
}

module.exports = {
  LINKS, SITE, TWITTER, TELEGRAM, EMAIL, GITHUB, QQ, OG_IMAGE,
  navItems, navHtml, footerHtml, shareHtml,
};
