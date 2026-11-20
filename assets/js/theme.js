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

  function icon(actual, mode) {
    if (mode === 'auto') return 'mdi-theme-light-dark';
    // Show the icon of the theme you'd switch TO.
    return actual === 'dark' ? 'mdi-white-balance-sunny' : 'mdi-weather-night';
  }

  function paintButton(btn) {
    var actual = root.getAttribute('data-theme') || 'light';
    var mode = stored();
    btn.innerHTML = '<span class="mdi ' + icon(actual, mode) + '"></span>';
    var label = mode === 'auto'
      ? '跟随系统（点击切换为黑夜）'
      : actual === 'dark' ? '切换到白天模式' : '切换到黑夜模式';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label + ' · 右键恢复跟随系统');
    btn.setAttribute('aria-pressed', actual === 'dark' ? 'true' : 'false');
    if (mode === 'auto') btn.setAttribute('data-mode', 'auto');
    else btn.removeAttribute('data-mode');
  }

  // Cycle: light -> dark -> auto -> light …
  function toggle() {
    var actual = root.getAttribute('data-theme') || 'light';
    var mode = stored();
    var next;
    if (mode === 'auto') next = 'light';
    else if (mode === 'light') next = 'dark';
    else next = 'auto';

    try { localStorage.setItem(KEY, next); } catch (e) { /* private mode */ }
    apply(next);
    refresh();
    var btn = document.querySelector('.pf-theme-toggle');
    if (btn) {
      btn.classList.add('is-switching');
      setTimeout(function () { btn.classList.remove('is-switching'); }, 460);
    }
    document.dispatchEvent(new CustomEvent('pf:themechange', {
      detail: { theme: current(), mode: next },
    }));
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

    var wire = function (btn) {
      btn.addEventListener('click', toggle);
      // Right click / long press -> jump straight back to "follow system".
      btn.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        set('auto');
        var b = document.querySelector('.pf-theme-toggle');
        if (b) {
          b.classList.add('is-switching');
          setTimeout(function () { b.classList.remove('is-switching'); }, 460);
        }
      });
    };

    // Preferred anchor: the navbar social icon row.
    var host = document.querySelector('.list-share-2');
    if (host) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pf-theme-toggle';
      wire(btn);
      li.appendChild(btn);
      host.appendChild(li);
      paintButton(btn);
      return;
    }
    // Fallback: a floating button in the corner of pages without a navbar row.
    var float = document.createElement('button');
    float.type = 'button';
    float.className = 'pf-theme-toggle is-floating';
    wire(float);
    document.body.appendChild(float);
    paintButton(float);
  }

  function init() {
    apply(stored());
    injectButton();
    refresh();
    // Enable colour transitions only after first paint, so switching is smooth
    // but the initial render never animates. A single deferred call is enough
    // and is more reliable than nested frames across browsers.
    setTimeout(function () { root.classList.add('pf-theme-ready'); }, 80);
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
