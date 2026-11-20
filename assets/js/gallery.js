/* ==========================================================================
 * gallery.js — image gallery backed by gallery/manifest.json
 *
 * Works over HTTP (fetch) and under file:// (window.PF_GALLERY snapshot).
 * Each tile: click to open a lightbox, with a "copy direct link" action.
 * ========================================================================== */
(function () {
  'use strict';

  var MAX_LABEL = 42;

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function prettyName(url) {
    var f = decodeURIComponent(url.split('/').pop() || '');
    f = f.replace(/^\d+_/, '').replace(/^b_/, '');
    if (f.length > MAX_LABEL) f = f.slice(0, MAX_LABEL - 1) + '…';
    return f;
  }

  function tile(item, i) {
    var url = item.url || '';
    var name = item.title || prettyName(url);
    return (
      '<figure class="gl-item" data-index="' + i + '">' +
        '<button class="gl-open" type="button" aria-label="查看 ' + esc(name) + '">' +
          '<img src="' + esc(url) + '" alt="' + esc(name) + '" loading="lazy" ' +
            "onerror=\"this.parentNode.parentNode.classList.add('is-broken')\"/>" +
          '<span class="gl-zoom mdi mdi-magnify-plus"></span>' +
        '</button>' +
        '<figcaption class="gl-cap">' +
          '<span class="gl-name" title="' + esc(url) + '">' + esc(name) + '</span>' +
          '<button class="gl-copy" type="button" data-url="' + esc(url) + '" title="复制直链">' +
            '<span class="mdi mdi-content-copy"></span>' +
          '</button>' +
        '</figcaption>' +
      '</figure>'
    );
  }

  function buildLightbox() {
    var box = document.createElement('div');
    box.className = 'gl-lightbox';
    box.innerHTML =
      '<div class="gl-lb-inner">' +
        '<img class="gl-lb-img" alt=""/>' +
        '<div class="gl-lb-bar">' +
          '<a class="gl-lb-link" target="_blank" rel="noopener noreferrer">打开原图</a>' +
          '<button class="gl-lb-copy" type="button">复制直链</button>' +
          '<button class="gl-lb-close" type="button" aria-label="关闭">×</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(box);
    return box;
  }

  function toast(msg) {
    var t = document.getElementById('gl-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'gl-toast';
      t.className = 'gl-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('is-on'); }, 1800);
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { toast('直链已复制'); });
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('直链已复制'); } catch (e) { toast('复制失败'); }
    document.body.removeChild(ta);
    return Promise.resolve();
  }

  function wire(host, items) {
    var box = buildLightbox();
    var img = box.querySelector('.gl-lb-img');
    var link = box.querySelector('.gl-lb-link');
    var copyBtn = box.querySelector('.gl-lb-copy');
    var current = '';

    function open(url, name) {
      current = url;
      img.src = url;
      img.alt = name;
      link.href = url;
      box.classList.add('is-on');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('is-on');
      document.body.style.overflow = '';
      img.src = '';
    }

    host.addEventListener('click', function (e) {
      var c = e.target.closest('.gl-copy');
      if (c) {
        e.preventDefault();
        e.stopPropagation();
        copy(c.getAttribute('data-url'));
        return;
      }
      var btn = e.target.closest('.gl-open');
      if (btn) {
        var fig = btn.closest('.gl-item');
        var idx = Number(fig.getAttribute('data-index'));
        var it = items[idx];
        open(it.url, it.title || prettyName(it.url));
      }
    });

    box.addEventListener('click', function (e) {
      if (e.target === box || e.target.closest('.gl-lb-close')) close();
      if (e.target.closest('.gl-lb-copy')) copy(current);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
  }

  function render(host, data) {
    var items = (data && data.items) || [];
    if (!items.length) {
      host.innerHTML = '<div class="pf-empty">图库还是空的。把图片地址加进 <code>gallery/manifest.json</code> 就会显示在这里。</div>';
      return;
    }
    host.className = 'gl-grid';
    host.innerHTML = items.map(tile).join('');
    wire(host, items);

    var count = document.querySelector('[data-gallery-count]');
    if (count) count.innerHTML = '共 <strong>' + items.length + '</strong> 张';
  }

  function run() {
    var host = document.getElementById('gallery-grid');
    if (!host) return;

    if (location.protocol === 'file:') {
      render(host, { items: window.PF_GALLERY || [] });
      return;
    }
    fetch('../gallery/manifest.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) { render(host, d); })
      .catch(function () { render(host, { items: window.PF_GALLERY || [] }); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
