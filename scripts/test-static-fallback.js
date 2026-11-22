#!/usr/bin/env node
'use strict';
/*
 * Verify the static-fallback contract for section pages:
 *
 *   1. Every section index.html ships its cards pre-rendered (works with JS off).
 *   2. registry.js does NOT blank that content while fetching.
 *   3. If the manifest fetch fails, the pre-rendered cards survive.
 *   4. If the fetch succeeds, cards are repainted from live data.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

let fails = 0;
const ok = (l, c, e) => {
  console.log((c ? '  OK   ' : '  FAIL ') + l + (e ? '  ' + e : ''));
  if (!c) fails++;
};

const dirs = ['games', 'tools', 'software'];

// --- 1. Static cards present with scripts stripped -------------------------
console.log('[static fallback: JS disabled]');
for (const d of dirs) {
  const file = path.join(dist, d, 'index.html');
  const raw = fs.readFileSync(file, 'utf8');
  const noJs = raw.replace(/<script[\s\S]*?<\/script>/g, '');
  const cards = (noJs.match(/class="pf-card-wrap"/g) || []).length;
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, d, 'manifest.json'), 'utf8'));
  ok(`${d}: ${cards}/${manifest.items.length} cards without JS`, cards === manifest.items.length);
  ok(`${d}: no "loading" placeholder in static HTML`, !noJs.includes('正在加载内容'));
  ok(`${d}: counter pre-filled`, /共 <strong>\d+<\/strong> 项/.test(noJs));
}

// --- 2/3/4. Runtime behaviour ---------------------------------------------
function makeEl(attrs, html) {
  return {
    innerHTML: html || '',
    className: '',
    textContent: '',
    _a: attrs || {},
    getAttribute(n) { return this._a[n] !== undefined ? this._a[n] : null; },
    setAttribute(n, v) { this._a[n] = v; },
  };
}

function runCase(dir, fetchImpl, staticHtml) {
  const container = makeEl({
    'data-registry': `../${dir}/manifest.json`,
    'data-registry-key': dir,
    'data-registry-base': '../',
    'data-registry-head': '#registry-title',
  }, staticHtml);
  const counter = makeEl({});
  const document = {
    readyState: 'complete',
    addEventListener() {},
    querySelector(s) { return s === '[data-registry-count]' ? counter : null; },
    querySelectorAll() { return []; },
  };
  const sandbox = {
    document, location: { protocol: 'https:' }, console,
    fetch: fetchImpl, console: { log() {}, debug() {}, error() {}, warn() {} },
  };
  sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(dist, 'assets', 'js', 'registry.js'), 'utf8'), ctx);
  return { promise: sandbox.PlatformRegistry.render(container, `../${dir}/manifest.json`), container, counter };
}

(async () => {
  const dir = 'software';
  const staticHtml = fs.readFileSync(path.join(dist, dir, 'index.html'), 'utf8')
    // A manifest with categories renders a "pf-grouped" container, without
    // categories a flat "pf-grid" one - accept both.
    .match(/<div class="pf-(?:grid|grouped)" id="registry-grid"[^>]*>([\s\S]*?)<\/div>\s*<div class="pf-note">/)[1];
  const manifest = JSON.parse(fs.readFileSync(path.join(dist, dir, 'manifest.json'), 'utf8'));
  const staticCards = (staticHtml.match(/class="pf-card-wrap"/g) || []).length;

  console.log('\n[no blank-out while loading]');
  {
    let resolveFetch;
    const pending = new Promise((r) => { resolveFetch = r; });
    const c = runCase(dir, () => pending, staticHtml);
    ok('cards still visible during in-flight fetch',
      (c.container.innerHTML.match(/class="pf-card-wrap"/g) || []).length === staticCards);
    ok('no spinner swapped in', !c.container.innerHTML.includes('正在加载内容'));
    resolveFetch({ ok: true, status: 200, json: () => Promise.resolve(manifest) });
    await c.promise;
    ok('repainted from live data after resolve',
      (c.container.innerHTML.match(/class="pf-card-wrap"/g) || []).length === manifest.items.length);
  }

  console.log('\n[fetch failure keeps static cards]');
  {
    const c = runCase(dir, () => Promise.reject(new Error('network down')), staticHtml);
    await c.promise;
    const cards = (c.container.innerHTML.match(/class="pf-card-wrap"/g) || []).length;
    ok('static cards survive fetch error', cards === staticCards, cards + '/' + staticCards);
    ok('no error banner replacing content', !c.container.innerHTML.includes('pf-error'));
  }

  console.log('\n[HTTP 500 keeps static cards]');
  {
    const c = runCase(dir, () => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }), staticHtml);
    await c.promise;
    ok('static cards survive 500',
      (c.container.innerHTML.match(/class="pf-card-wrap"/g) || []).length === staticCards);
  }

  console.log(fails === 0 ? '\nSTATIC FALLBACK OK' : `\n${fails} FAILURE(S)`);
  process.exit(fails === 0 ? 0 : 1);
})();
