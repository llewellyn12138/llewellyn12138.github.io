#!/usr/bin/env node
'use strict';
/*
 * card-template.js — single source of truth for section card markup.
 *
 * Used by BOTH:
 *   - scripts/gen-sections.js  (build time -> static HTML fallback)
 *   - assets/js/registry.js    (runtime  -> JS enhancement)
 *
 * Keeping one implementation prevents the static and dynamic renders from
 * drifting apart in class names / structure.
 */
const PLACEHOLDER_SVG =
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

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isExternal(link) {
  return /^(https?:)?\/\//i.test(link || '') || /^mailto:/i.test(link || '');
}

// Manifest entries may use root-absolute URLs (/images/x). Convert to a
// path relative to the page, so both HTTP and file:// work.
function localUrl(url, base) {
  if (!url || url === '#') return url || '#';
  if (/^(https?:)?\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  if (url.charAt(0) !== '/') return url;
  return base + url.replace(/^\/+/, '');
}

function buildCard(item) {
  const base = item.__base || '';
  const planned = item.status === 'planned';
  const external = !!item.external || isExternal(item.link);
  const href = planned ? '#' : localUrl(item.link || '#', base);
  const target = !planned && external ? ' target="_blank" rel="noopener noreferrer"' : '';
  const icon = item.icon || 'mdi-cube-outline';
  const image = item.image ? localUrl(item.image, base) : PLACEHOLDER_SVG;
  const badge = planned
    ? '<span class="pf-badge pf-badge-planned">敬请期待</span>'
    : external
      ? '<span class="pf-badge pf-badge-accent">外链</span>'
      : '';
  const extMark = external && !planned ? '<span class="pf-ext mdi mdi-open-in-new"></span>' : '';
  const tags = (item.tags || [])
    .map((t) => '<span class="pf-tag">' + esc(t) + '</span>')
    .join('');
  const date = item.date ? esc(item.date) : '';
  const linkLabel = planned ? '待上线' : external ? '前往 ↗' : '打开 →';
  const imgHtml = item.image
    ? '<img src="' + esc(image) + '" alt="' + esc(item.name) + '" loading="lazy" ' +
      "onerror=\"this.onerror=null;this.style.display='none'\"/>"
    : '';
  const fallback = '<span class="pf-fallback-icon mdi ' + esc(icon) + '"></span>';

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

function renderCards(items, base) {
  return items
    .map((it) => buildCard(Object.assign({}, it, { __base: base || '' })))
    .join('');
}

/**
 * Render cards grouped by category, mirroring registry.js.
 * Returns '' when the manifest defines no categories (flat grid is used).
 */
function renderGrouped(manifest, base) {
  const items = (manifest && manifest.items) || [];
  const categories = (manifest && manifest.categories) || [];
  if (!categories.length || !items.length) return '';

  const byName = {};
  items.forEach((it) => {
    const k = it.category || categories[0].name;
    (byName[k] = byName[k] || []).push(it);
  });

  return categories
    .filter((c) => byName[c.name] && byName[c.name].length)
    .map((c) => {
      const list = byName[c.name];
      return (
        '<section class="pf-cat">' +
          '<h3 class="pf-cat-title"><span class="mdi ' + esc(c.icon || 'mdi-folder') + '"></span>' +
            esc(c.name) + '<em>' + list.length + '</em></h3>' +
          (c.desc ? '<p class="pf-cat-desc">' + esc(c.desc) + '</p>' : '') +
          '<div class="pf-grid">' + renderCards(list, base) + '</div>' +
        '</section>'
      );
    })
    .join('');
}

module.exports = { esc, isExternal, localUrl, buildCard, renderCards, renderGrouped, PLACEHOLDER_SVG };
