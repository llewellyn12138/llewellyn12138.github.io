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
 *   - also patch code-block colours, since Butterfly bakes a single
 *     highlight theme at build time and cannot switch it at runtime
 * ========================================================================== */

const STYLE = `<style>
/* Dark-mode code blocks: Butterfly generates a light highlight theme, so we
   re-tint the container and token colours when data-theme=dark is active. */
html[data-theme='dark'] figure.highlight,
html[data-theme='dark'] .highlight {
  background: #161a21 !important;
  border: 1px solid #232936 !important;
}
html[data-theme='dark'] figure.highlight table,
html[data-theme='dark'] .highlight table {
  background: transparent !important;
}
html[data-theme='dark'] figure.highlight .gutter,
html[data-theme='dark'] .highlight .gutter {
  background: #12161c !important;
  border-right: 1px solid #232936 !important;
}
html[data-theme='dark'] figure.highlight .gutter pre,
html[data-theme='dark'] figure.highlight .line,
html[data-theme='dark'] .highlight .line {
  color: #c8d0dc !important;
  background: transparent !important;
}
html[data-theme='dark'] figure.highlight .code pre,
html[data-theme='dark'] .highlight .code pre { background: transparent !important; }
/* Token palette (GitHub-dark-ish, tuned to the site's amber accent) */
html[data-theme='dark'] .highlight .comment,
html[data-theme='dark'] .highlight .quote { color: #7d8797 !important; }
html[data-theme='dark'] .highlight .keyword,
html[data-theme='dark'] .highlight .selector-tag,
html[data-theme='dark'] .highlight .doctag { color: #ff9d5c !important; }
html[data-theme='dark'] .highlight .string,
html[data-theme='dark'] .highlight .attr-value { color: #9ddc8a !important; }
html[data-theme='dark'] .highlight .number,
html[data-theme='dark'] .highlight .literal { color: #86c8f0 !important; }
html[data-theme='dark'] .highlight .title,
html[data-theme='dark'] .highlight .function .title { color: #f0c674 !important; }
html[data-theme='dark'] .highlight .attr,
html[data-theme='dark'] .highlight .variable,
html[data-theme='dark'] .highlight .template-variable { color: #e0a0f0 !important; }
html[data-theme='dark'] .highlight .built_in,
html[data-theme='dark'] .highlight .type { color: #6fd6d6 !important; }
html[data-theme='dark'] .highlight .meta { color: #9aa6b8 !important; }

/* Inline code */
html[data-theme='dark'] code:not(.highlight *) {
  background: rgba(255, 255, 255, .09) !important;
  color: #f0b47a !important;
}
/* Blockquote / tables / hr inside posts */
html[data-theme='dark'] blockquote {
  background: rgba(248, 147, 31, .08) !important;
  border-left-color: var(--pf-accent) !important;
  color: #b9c3d1 !important;
}
html[data-theme='dark'] #article-container table th { background: #1b2029 !important; }
html[data-theme='dark'] #article-container table td,
html[data-theme='dark'] #article-container table th { border-color: #262d3a !important; }
</style>`;

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
    if (html.getAttribute('data-theme') !== pf) {
      html.setAttribute('data-theme', pf);
      write(BF, pf);
      if (pf === 'dark') html.classList.add('dark');
      else html.classList.remove('dark');
    }
  } else if (pf === 'auto' || !pf) {
    // No explicit portal choice: let Butterfly's own value stand, but keep
    // the keys in sync so the next portal visit matches.
    var bf = read(BF);
    if (bf === 'dark' || bf === 'light') write(PF, bf);
  }

  // 2. Mirror Butterfly's own toggle back into the portal key.
  function mirror() {
    var v = read(BF);
    if (v === 'dark' || v === 'light') write(PF, v);
  }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t && (t.closest('#darkmode') || t.closest('.darkmode'))) setTimeout(mirror, 120);
  }, true);
})();
</script>`;

hexo.extend.injector.register('head_end', STYLE, 'default');
hexo.extend.injector.register('body_end', SCRIPT, 'default');;
