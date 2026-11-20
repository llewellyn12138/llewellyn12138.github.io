/* ==========================================================================
 * registry.js — shared manifest-driven card renderer
 *
 * Usage:
 *   <div id="registry-grid" data-registry="../apps/manifest.json"
 *        data-registry-key="apps" data-registry-base="../"></div>
 *   <script src="../apps/manifest.js"></script>   <- file:// fallback snapshot
 *   <script src="../assets/js/registry.js"></script>
 *
 * Over HTTP  -> fetch() the live manifest.json (always fresh).
 * Under file:// -> fetch() is CORS-blocked, fall back to window.PF_MANIFEST[key]
 *                  loaded by the sibling <script>.
 *
 * Manifest schema: see the manifest.json inside each section directory.
 * ========================================================================== */
(function (global) {
  'use strict';

  var PLACEHOLDER_SVG =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#eef1f5"/><stop offset="1" stop-color="#dfe5ed"/>' +
        '</linearGradient></defs>' +
        '<rect width="640" height="360" fill="url(#g)"/>' +
        '<circle cx="320" cy="180" r="46" fill="none" stroke="#b9c2cf" stroke-width="6"/>' +
        '<path d="M300 180h40M320 160v40" stroke="#b9c2cf" stroke-width="6" stroke-linecap="round"/>' +
        '</svg>'
    );

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isExternal(link) {
    return /^(https?:)?\/\//i.test(link || '') || /^mailto:/i.test(link || '');
  }

  // Section pages sit one level below the site root. Manifest entries use
  // root-absolute URLs (/images/x, /apps/y/); convert them to relative.
  function localUrl(url, base) {
    if (!url || url === '#') return url || '#';
    if (/^(https?:)?\/\//i.test(url) || /^mailto:/i.test(url)) return url;
    if (url.charAt(0) !== '/') return url;          // already relative
    return base + url.replace(/^\/+/, '');
  }

  function buildCard(item, index, base) {
    var planned = item.status === 'planned';
    var external = !!item.external || isExternal(item.link);
    var href = planned ? '#' : localUrl(item.link || '#', base);
    var target = !planned && external ? ' target="_blank" rel="noopener noreferrer"' : '';
    var icon = item.icon || 'mdi-cube-outline';
    var image = item.image ? localUrl(item.image, base) : PLACEHOLDER_SVG;
    var badge = planned
      ? '<span class="pf-badge pf-badge-planned">敬请期待</span>'
      : external
        ? '<span class="pf-badge pf-badge-accent">外链</span>'
        : '';
    var extMark = external && !planned ? '<span class="pf-ext mdi mdi-open-in-new"></span>' : '';
    var tags = (item.tags || [])
      .map(function (t) { return '<span class="pf-tag">' + esc(t) + '</span>'; })
      .join('');
    var date = item.date ? esc(item.date) : '';
    var linkLabel = planned ? '待上线' : external ? '前往 ↗' : '打开 →';
    var imgHtml = item.image
      ? '<img src="' + esc(image) + '" alt="' + esc(item.name) + '" loading="lazy" ' +
          'onerror="this.onerror=null;this.style.display=\'none\'"/>'
      : '';
    var fallback = '<span class="pf-fallback-icon mdi ' + esc(icon) + '"></span>';

    return (
      '<div class="pf-card-wrap">' +
        '<article class="pf-card' + (planned ? ' is-planned' : '') + '">' +
          '<div class="pf-card-media">' +
            badge + extMark + imgHtml + fallback +
          '</div>' +
          '<div class="pf-card-body">' +
            '<span class="pf-card-icon mdi ' + esc(icon) + '"></span>' +
            '<h3 class="pf-card-title"><a href="' + esc(href) + '"' + target + '>' +
              esc(item.name) + '</a></h3>' +
            '<p class="pf-card-desc">' + esc(item.description || '') + '</p>' +
            (tags ? '<div class="pf-tags">' + tags + '</div>' : '') +
            '<div class="pf-card-foot">' +
              '<span>' + (date || (external ? 'GitHub Releases' : '本站')) + '</span>' +
              '<a class="pf-card-link" href="' + esc(href) + '"' + target + '>' + linkLabel + '</a>' +
            '</div>' +
          '</div>' +
        '</article>' +
      '</div>'
    );
  }

  function paint(container, data, base) {
    var items = (data && data.items) || [];
    if (!items.length) {
      container.innerHTML =
        '<div class="pf-empty">这里暂时还没有内容，位置已经留好啦 ✨</div>';
      return;
    }
    var head = container.getAttribute('data-registry-head');
    if (head && data.title) {
      var h = document.querySelector(head);
      if (h) h.textContent = data.title + '列表';
    }
    var counter = document.querySelector('[data-registry-count]');
    if (counter) {
      var online = items.filter(function (i) { return i.status !== 'planned'; }).length;
      counter.innerHTML = '共 <strong>' + items.length + '</strong> 项 · 已上线 <strong>' + online + '</strong>';
    }
    container.className = 'pf-grid';
    container.innerHTML = items.map(function (it, i) { return buildCard(it, i, base); }).join('');
  }

  function snapshot(container, key) {
    var bank = global.PF_MANIFEST || {};
    if (key && bank[key]) return bank[key];
    // Last resort: any single manifest snapshot on the page
    var keys = Object.keys(bank);
    return keys.length === 1 ? bank[keys[0]] : null;
  }

  function render(container, manifestUrl) {
    if (!container) return Promise.resolve();
    container.innerHTML =
      '<div class="pf-loading"><span class="pf-spinner"></span>正在加载内容…</div>';

    var key = container.getAttribute('data-registry-key');
    var base = container.getAttribute('data-registry-base') || '';
    var fallback = function (err) {
      var data = snapshot(container, key);
      if (data) {
        paint(container, data, base);
      } else {
        console.error('[registry] load failed:', manifestUrl, err);
        container.innerHTML =
          '<div class="pf-error">加载失败，请刷新重试。</div>';
      }
    };

    // file:// -> skip fetch entirely (CORS would reject it anyway)
    if (location.protocol === 'file:') {
      fallback(new Error('file:// uses local snapshot'));
      return Promise.resolve();
    }

    return fetch(manifestUrl, { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) { paint(container, data, base); })
      .catch(fallback);
  }

  function autoInit() {
    var nodes = document.querySelectorAll('[data-registry]');
    Array.prototype.forEach.call(nodes, function (el) {
      render(el, el.getAttribute('data-registry'));
    });
  }

  global.PlatformRegistry = { render: render, init: autoInit, escape: esc };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
})(window);
