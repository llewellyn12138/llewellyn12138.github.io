/* ==========================================================================
 * latest-posts.js — portal homepage "最新文章" widget
 *
 * Over HTTP  -> fetch() the CI-generated blog-latest.json (always fresh),
 *               with a fallback to parsing the legacy blog/index.html.
 * Under file:// -> fetch() is CORS-blocked: use window.PF_LATEST_POSTS
 *                  (snapshot loaded by blog-latest.js) instead.
 * ========================================================================== */
(function () {
  'use strict';

  var SOURCE = 'blog-latest.json';      // relative to the homepage
  var MAX = 6;

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function coverUrl(p) {
    var c = p.cover || '';
    if (!c) return '';
    if (/^(https?:)?\/\//i.test(c)) return c;
    return 'blog/' + String(c).replace(/^\/+/, '');
  }

  // blog-latest.json holds root-absolute /blog/... links -> relative on home
  function pageUrl(u) {
    if (!u) return 'blog/';
    if (/^(https?:)?\/\//i.test(u)) return u;
    return u.replace(/^\/+/, '');
  }

  function card(p) {
    var thumb = coverUrl(p);
    var img = thumb
      ? '<img class="pf-post-thumb" src="' + esc(thumb) + '" alt="" loading="lazy" ' +
          'onerror="this.onerror=null;this.src=\'blog/img/404.jpg\'"/>'
      : '<div class="pf-post-thumb"></div>';
    var cat = (p.categories && p.categories[0]) || '博客';
    return (
      '<div class="pf-post">' +
        '<a class="pf-post-inner" href="' + esc(pageUrl(p.url)) + '">' +
          img +
          '<div class="pf-post-info">' +
            '<h4 class="pf-post-title">' + esc(p.title) + '</h4>' +
            '<p class="pf-post-desc">' + esc(p.description || '') + '</p>' +
            '<span class="pf-post-meta"><span class="pf-post-cat">' + esc(cat) +
              '</span> · ' + esc(fmtDate(p.date)) + '</span>' +
          '</div>' +
        '</a>' +
      '</div>'
    );
  }

  function render(host, posts) {
    if (!posts.length) {
      host.innerHTML = '<div class="pf-empty">还没有文章，<a href="blog/">去博客逛逛 →</a></div>';
      return;
    }
    host.className = 'pf-latest-list';
    host.innerHTML = posts.slice(0, MAX).map(card).join('');
  }

  // Fallback: the legacy committed blog/index.html contains the same posts.
  function fromLegacyHtml(text) {
    var doc = new DOMParser().parseFromString(text, 'text/html');
    var out = [];
    var nodes = doc.querySelectorAll('#recent-posts .recent-post-item');
    Array.prototype.forEach.call(nodes, function (el) {
      var a = el.querySelector('a.article-title');
      if (!a) return;
      var img = el.querySelector('img.post-bg');
      var cat = el.querySelector('.article-meta__categories');
      var time = el.querySelector('time[datetime]');
      var desc = el.querySelector('.content');
      var cover = img ? (img.getAttribute('src') || img.getAttribute('data-lazy-src') || '') : '';
      out.push({
        title: a.textContent.trim(),
        url: a.getAttribute('href') || 'blog/',
        date: time ? time.getAttribute('datetime') : '',
        description: desc ? desc.textContent.trim().slice(0, 120) : '',
        cover: /^\/blog\//.test(cover) ? cover.replace(/^\/blog\//, '') : '',
        categories: cat ? [cat.textContent.trim()] : [],
      });
    });
    return out;
  }

  function run() {
    var host = document.getElementById('latest-posts');
    if (!host) return;

    // file:// -> use the local snapshot directly (fetch is CORS-blocked)
    if (location.protocol === 'file:') {
      render(host, window.PF_LATEST_POSTS || []);
      return;
    }

    fetch(SOURCE, { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) { render(host, (data && data.posts) || []); })
      .catch(function () {
        return fetch('blog/', { cache: 'no-cache' })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
          .then(function (t) { render(host, fromLegacyHtml(t)); })
          .catch(function (e) {
            console.warn('[latest-posts] unavailable:', e.message);
            render(host, window.PF_LATEST_POSTS || []);
          });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
