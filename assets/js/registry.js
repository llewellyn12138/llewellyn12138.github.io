/* ==========================================================================
 * registry.js — shared manifest-driven card renderer
 *
 * Usage:
 *   <div id="registry-grid" data-registry="../apps/manifest.json"
 *        data-registry-key="apps" data-registry-base="../"></div>
 *   <script src="../apps/manifest.js"></script>   <- file:// fallback snapshot
 *   <script src="../assets/js/registry.js"></script>
 *
 * Over HTTP  -> fetch() the live manifest.json and repaint only on success.
 * Under file:// -> fetch is CORS-blocked; the cards pre-rendered into the
 *                  HTML at build time are kept as-is (no "loading" flash).
 *
 * Resilience: section pages ship their cards pre-rendered, so they still show
 * content even if this script fails to load, throws, or the manifest is down.
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
          'onerror="this.onerror=null;this.parentNode.classList.add(\'pf-media-fallback\')"/>'
      : '';
    var fallback = '<span class="pf-fallback-icon mdi ' + esc(icon) + '"></span>';

    // The whole card is the link; planned items stay a non-clickable article.
    var cardOpen = planned
      ? '<article class="pf-card is-planned">'
      : '<a class="pf-card' + (external ? ' is-external' : '') + '" href="' + esc(href) + '"' + target + '>';
    var cardClose = planned ? '</article>' : '</a>';

    return (
      '<div class="pf-card-wrap">' +
        cardOpen +
          '<div class="pf-card-media">' +
            badge + extMark + imgHtml + fallback +
          '</div>' +
          '<div class="pf-card-body">' +
            '<span class="pf-card-icon mdi ' + esc(icon) + '"></span>' +
            '<h3 class="pf-card-title">' + esc(item.name) + '</h3>' +
            '<p class="pf-card-desc">' + esc(item.description || '') + '</p>' +
            (tags ? '<div class="pf-tags">' + tags + '</div>' : '') +
            '<div class="pf-card-foot">' +
              '<span>' + (date || (external ? '外链' : '本站')) + '</span>' +
              '<span class="pf-card-link">' + linkLabel + '</span>' +
            '</div>' +
          '</div>' +
        cardClose +
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

    // Group into category sections when the manifest defines categories.
    var groups = groupItems(items, data.categories);
    container.className = groups ? 'pf-grouped' : 'pf-grid';
    if (!groups) {
      container.innerHTML = items.map(function (it, i) { return buildCard(it, i, base); }).join('');
      return;
    }
    container.innerHTML = groups.map(function (g) {
      return (
        '<section class="pf-cat">' +
          '<h3 class="pf-cat-title"><span class="mdi ' + esc(g.icon) + '"></span>' +
            esc(g.name) + '<em>' + g.items.length + '</em></h3>' +
          (g.desc ? '<p class="pf-cat-desc">' + esc(g.desc) + '</p>' : '') +
          '<div class="pf-grid">' +
            g.items.map(function (it, i) { return buildCard(it, i, base); }).join('') +
          '</div>' +
        '</section>'
      );
    }).join('');
  }

  // Split items into category groups. Returns null when the manifest has no
  // categories (single flat grid is nicer for a handful of entries).
  function groupItems(items, categories) {
    if (!categories || !categories.length) return null;
    var byName = {};
    items.forEach(function (it) {
      var k = it.category || (categories[0] && categories[0].name) || '其他';
      (byName[k] = byName[k] || []).push(it);
    });
    var order = categories.map(function (c) { return c.name; });
    return order.filter(function (n) { return byName[n] && byName[n].length; })
      .map(function (n) {
        var meta = categories.filter(function (c) { return c.name === n; })[0] || {};
        return {
          name: n,
          icon: meta.icon || 'mdi-folder',
          desc: meta.desc || '',
          items: byName[n],
        };
      });
  }

  // True when the build already pre-rendered cards into the HTML.
  function hasStaticCards(container) {
    return /class="pf-card-wrap"/.test(container.innerHTML || '');
  }

  function render(container, manifestUrl) {
    if (!container) return Promise.resolve();

    var key = container.getAttribute('data-registry-key');
    var base = container.getAttribute('data-registry-base') || '';
    var preRendered = hasStaticCards(container);

    // Never blank out pre-rendered content: if anything fails, the static
    // cards stay visible (graceful degradation).
    if (!preRendered) {
      container.innerHTML =
        '<div class="pf-loading"><span class="pf-spinner"></span>正在加载内容…</div>';
    }

    var fallback = function (err) {
      if (preRendered) {
        // Static cards are already correct for the last build; keep them.
        if (window.console && console.debug) {
          console.debug('[registry] using pre-rendered cards:', err && err.message);
        }
        return;
      }
      var data = snapshot(container, key);
      if (data) {
        paint(container, data, base);
      } else {
        console.error('[registry] load failed:', manifestUrl, err);
        container.innerHTML = '<div class="pf-error">加载失败，请刷新重试。</div>';
      }
    };

    // file:// -> fetch is CORS-blocked; keep the pre-rendered cards.
    if (location.protocol === 'file:') {
      fallback(new Error('file:// keeps pre-rendered cards'));
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
