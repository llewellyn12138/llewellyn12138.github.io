/* ==========================================================================
 * theme-sync.js — make the blog follow the portal's light/dark choice
 *
 * The portal stores the theme in localStorage under "pf-theme".
 * Butterfly stores its own under "theme" (values: "light" / "dark").
 *
 * This is injected into every blog page via the `injector` hook:
 *   - on load, translate pf-theme -> Butterfly's theme
 *   - when Butterfly's own button is used, write back to pf-theme
 *     so returning to the portal keeps the same preference
 * ========================================================================== */
const SCRIPT = `<script>
(function () {
  'use strict';
  var PF = 'pf-theme';
  var BF = 'theme';
  var html = document.documentElement;

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  // 1. Portal preference wins on first paint.
  var pf = read(PF);
  if (pf === 'dark' || pf === 'light') {
    var current = html.getAttribute('data-theme');
    if (current !== pf) {
      html.setAttribute('data-theme', pf);
      write(BF, pf);
      // Butterfly keeps the state on <html data-theme> and prefers a class
      // on body in some versions; cover both.
      if (pf === 'dark') html.classList.add('dark');
      else html.classList.remove('dark');
    }
  }

  // 2. Mirror Butterfly's own toggles back into the portal key.
  function mirror() {
    var v = read(BF);
    if (v === 'dark' || v === 'light') write(PF, v);
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && (t.closest('#darkmode') || t.closest('.darkmode') ||
              (t.getAttribute && /dark/i.test(t.getAttribute('onclick') || '')))) {
      setTimeout(mirror, 120);
    }
  }, true);

  // 3. Follow OS changes when neither side has an explicit choice.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener &&
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (!read(PF) || read(PF) === 'auto') mirror();
      });
  }
})();
</script>`;

hexo.extend.injector.register('body_end', SCRIPT, 'default');
