#!/usr/bin/env node
'use strict';
/*
 * Test the light/dark theme runtime (assets/js/theme.js) in a fake DOM:
 *   - 3-state cycle: auto -> light -> dark -> auto
 *   - right-click returns to "follow system"
 *   - icons, aria labels and data-theme stay consistent
 *   - transition gate (pf-theme-ready) is deferred, never set during first paint
 *   - theme.css contains the expected dark-mode coverage
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'assets', 'js', 'theme.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    children: [], _attrs: {}, _h: {}, innerHTML: '', className: '', type: '', style: {},
    _classes: {},
    classList: {
      add: (c) => { el._classes[c] = 1; },
      remove: (c) => { delete el._classes[c]; },
      contains: (c) => !!el._classes[c],
    },
    setAttribute(n, v) { this._attrs[n] = v; },
    removeAttribute(n) { delete this._attrs[n]; },
    getAttribute(n) { return this._attrs[n] !== undefined ? this._attrs[n] : null; },
    appendChild(c) { el.children.push(c); c.parentNode = el; return c; },
    addEventListener(ev, fn) { el._h[ev] = fn; },
    click() { if (el._h.click) el._h.click({ preventDefault() {} }); },
    rightClick() { if (el._h.contextmenu) el._h.contextmenu({ preventDefault() {} }); },
  };
  return el;
}

function boot() {
  const shareRow = makeEl('ul');
  const rootEl = makeEl('html');
  const store = {};
  const timers = [];

  const document = {
    documentElement: rootEl,
    readyState: 'complete',
    body: makeEl('body'),
    createElement: makeEl,
    querySelector(sel) {
      if (sel === '.list-share-2') return shareRow;
      if (sel === '.pf-theme-toggle') {
        return shareRow.children.length ? shareRow.children[0].children[0] : null;
      }
      return null;
    },
    querySelectorAll(sel) {
      if (sel === '.pf-theme-toggle') {
        return shareRow.children.length ? [shareRow.children[0].children[0]] : [];
      }
      return [];
    },
    addEventListener() {},
    dispatchEvent() {},
  };

  const sandbox = {
    document,
    window: null,
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    setTimeout: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
    CustomEvent: function (n, o) { this.type = n; this.detail = o && o.detail; },
    requestAnimationFrame: () => 0,
    console,
  };
  sandbox.window = sandbox;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(src, ctx);

  return { T: sandbox.PlatformTheme, shareRow, rootEl, store, timers };
}

let fails = 0;
const ok = (l, c, e) => {
  console.log((c ? '  OK   ' : '  FAIL ') + l + (e ? '  ' + e : ''));
  if (!c) fails++;
};

const { T, shareRow, rootEl, store, timers } = boot();
const btn = () => shareRow.children[0].children[0];

console.log('[exposes API]');
ok('PlatformTheme present', !!(T && T.toggle && T.set && T.current));

console.log('\n[three-state cycle]');
ok('default mode is auto', store['pf-theme'] === undefined || store['pf-theme'] === 'auto');
ok('auto icon shown', /mdi-theme-light-dark/.test(btn().innerHTML));

T.toggle();
ok('auto -> light', T.current() === 'light',  store['pf-theme']);
ok('light shows moon', /mdi-weather-night/.test(btn().innerHTML));

T.toggle();
ok('light -> dark', T.current() === 'dark', store['pf-theme']);
ok('dark shows sun', /mdi-white-balance-sunny/.test(btn().innerHTML));
ok('html[data-theme] = dark', rootEl.getAttribute('data-theme') === 'dark');

T.toggle();
ok('dark -> auto', store['pf-theme'] === 'auto', store['pf-theme']);

console.log('\n[right-click resets to follow-system]');
T.toggle();                       // auto -> light
btn().rightClick();
ok('back to auto', store['pf-theme'] === 'auto', store['pf-theme']);

console.log('\n[transition gate]');
ok('not ready synchronously', !rootEl._classes['pf-theme-ready']);
timers.filter((t) => t.ms === 80).forEach((t) => t.fn());
ok('ready after deferral', !!rootEl._classes['pf-theme-ready']);

console.log('\n[theme.css coverage]');
const css = fs.readFileSync(path.join(root, 'assets', 'css', 'theme.css'), 'utf8')
  + fs.readFileSync(path.join(root, 'assets', 'css', 'platform.css'), 'utf8');
[
  ['dark palette', /:root\[data-theme='dark'\]/],
  ['navbar', /html\[data-theme='dark'\] \.rd-navbar/],
  ['footer', /html\[data-theme='dark'\] \.footer-modern/],
  ['cards', /html\[data-theme='dark'\] \.pf-card \{/],
  ['gallery', /html\[data-theme='dark'\] \.gl-item/],
  ['legacy cards', /services-terri-title/],
  ['forms', /html\[data-theme='dark'\] input/],
  ['scrollbar', /::-webkit-scrollbar-thumb/],
  ['inline style overrides', /\[style\*="background: #fff"\]/],
  ['transition gate', /html\.pf-theme-ready body/],
  ['display font declared', /--pf-font-display:\s*"Long Cang"/],
].forEach(([label, re]) => ok(label, re.test(css)));

console.log('\n' + (fails === 0 ? 'THEME TEST OK' : fails + ' FAILURE(S)'));
process.exit(fails === 0 ? 0 : 1);
