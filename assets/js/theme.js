/* ==========================================================================
 * theme.js — light / dark theme switch for the whole site
 *
 * Usage (each page):
 *   <head>
 *     <script>/* inline: apply saved theme before paint, avoid flash *\/</script>
 *     <link rel="stylesheet" href=".../theme.css">
 *   </head>
 *
 * Public API:
 *   PlatformTheme.toggle()   switch light <-> dark
 *   PlatformTheme.set('dark' | 'light' | 'auto')
 *   PlatformTheme.current()  'light' | 'dark'
 *
 * The button markup is injected into .list-share-2 (the navbar social row) so
 * every page gets it without hand-editing each HTML file.
 * ========================================================================== */
(function (global) {
  'use strict';

  var KEY = 'pf-theme';
  var root = document.documentElement;

  function stored() {
    try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; }
  }

  function systemPref() {
    return (global.matchMedia && global.matchMedia('(prefers-color-scheme: dark)').matches)
      ? 'dark' : 'light';
  }

  function resolve(mode) {
    return mode === 'auto' ? systemPref() : mode;
  }

  function apply(mode) {
    var actual = resolve(mode);
    root.setAttribute('data-theme', actual);
    // Keep the browser UI (form controls, scrollbars) in sync.
    root.style.colorScheme = actual;
    return actual;
  }

  function icon(actual) {
    // Show the icon of the theme you'd switch TO.
    return actual === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night';
  }

  function paintButton(btn) {
    var actual = root.getAttribute('data-theme') || 'light';
    btn.innerHTML = '<span class="mdi ' + icon(actual) + '"></span>';
    btn.setAttribute('aria-label', actual === 'dark' ? '切换到白天模式' : '切换到黑夜模式');
    btn.setAttribute('title', actual === 'dark' ? '白天模式' : '黑夜模式');
    btn.setAttribute('aria-pressed', actual === 'dark' ? 'true' : 'false');
  }

  function toggle() {
    var actual = root.getAttribute('data-theme') || 'light';
    var next = actual === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
    apply(next);
    refresh();
    var btn = document.querySelector('.pf-theme-toggle');
    if (btn) {
      btn.classList.add('is-switching');
      setTimeout(function () { btn.classList.remove('is-switching'); }, 460);
    }
    // Let other widgets (e.g. gallery lightbox) react if they want.
    document.dispatchEvent(new CustomEvent('pf:themechange', { detail: { theme: next } }));
  }

  function set(mode) {
    try { localStorage.setItem(KEY, mode); } catch (e) {}
    apply(mode);
    refresh();
  }

  function current() {
    return root.getAttribute('data-theme') || 'light';
  }

  function refresh() {
    var btns = document.querySelectorAll('.pf-theme-toggle');
    Array.prototype.forEach.call(btns, paintButton);
  }

  function injectButton() {
    if (document.querySelector('.pf-theme-toggle')) return;
    // Preferred anchor: the navbar social icon row.
    var host = document.querySelector('.list-share-2');
    if (host) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pf-theme-toggle';
      btn.addEventListener('click', toggle);
      li.appendChild(btn);
      host.appendChild(li);
      paintButton(btn);
      return;
    }
    // Fallback: a floating button in the corner of pages without a navbar row.
    var float = document.createElement('button');
    float.type = 'button';
    float.className = 'pf-theme-toggle is-floating';
    float.addEventListener('click', toggle);
    document.body.appendChild(float);
    paintButton(float);
  }

  function init() {
    apply(stored());
    injectButton();
    refresh();
    // Follow the OS while in "auto" mode.
    if (global.matchMedia) {
      var mq = global.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (stored() === 'auto') { apply('auto'); refresh(); }
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  global.PlatformTheme = { toggle: toggle, set: set, current: current, apply: apply };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
