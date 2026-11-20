#!/usr/bin/env node
'use strict';
/*
 * Execute the REAL assets/js/registry.js against the REAL manifest.json files
 * inside a minimal fake DOM, then assert that cards were actually produced.
 *
 * This catches runtime errors (bad escapes, broken comments, typos) that a
 * syntax check alone would miss, without needing a browser.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');

let fails = 0;
const ok = (label, cond, extra) => {
  console.log((cond ? '  OK   ' : '  FAIL ') + label + (extra ? '  ' + extra : ''));
  if (!cond) fails++;
};

function makeEl(attrs) {
  const el = {
    innerHTML: '',
    className: '',
    textContent: '',
    _attrs: attrs || {},
    getAttribute(n) { return this._attrs[n] !== undefined ? this._attrs[n] : null; },
    setAttribute(n, v) { this._attrs[n] = v; },
  };
  return el;
}

const manifestUrlFor = (d) => path.join(root, d, 'manifest.json');

// Minimal DOM: the container plus a lookup for data-registry-count / head.
function runFor(dir) {
  const container = makeEl({
    'data-registry': `../${dir}/manifest.json`,
    'data-registry-key': dir,
    'data-registry-base': '../',
    'data-registry-head': '#registry-title',
  });
  const counter = makeEl({});
  const heading = makeEl({});

  const document = {
    readyState: 'complete',
    addEventListener() {},
    querySelector(sel) {
      if (sel === '[data-registry-count]') return counter;
      if (sel === '#registry-title') return heading;
      return null;
    },
    querySelectorAll(sel) {
      return sel === '[data-registry]' ? [container] : [];
    },
  };

  const sandbox = {
    window: {},
    document,
    location: { protocol: 'https:' },
    console,
    fetch: (url) => {
      // Serve the real manifest from disk, mimicking an HTTP JSON response.
      const p = path.resolve(path.dirname(path.join(root, 'apps', 'index.html')),
        url.replace(/^\.\.\//, '../'));
      const abs = path.isAbsolute(url) ? url : path.join(root, 'apps', decodeURI(url));
      const candidate = fs.existsSync(abs) ? abs : path.join(root, dir, 'manifest.json');
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(JSON.parse(fs.readFileSync(candidate, 'utf8'))),
      });
    },
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;

  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(root, 'assets', 'js', 'registry.js'), 'utf8'), ctx);

  const reg = sandbox.PlatformRegistry;
  if (!reg) return { error: 'PlatformRegistry not exposed' };

  const p = reg.render(container, `../${dir}/manifest.json`);
  return { promise: p, container, counter };
}

(async () => {
  const dirs = ['apps', 'games', 'tools', 'software'];
  const results = dirs.map((d) => ({ dir: d, ...runFor(d) }));

  // render() sets a loading state synchronously, then paints after the promise
  for (const r of results) {
    if (r.error) { ok(r.dir, false, r.error); continue; }
    ok(r.dir + ' render() started', /正在加载内容/.test(r.container.innerHTML));
  }

  await Promise.all(results.map((r) => r.promise));

  for (const r of results) {
    const html = r.container.innerHTML;
    const cards = (html.match(/class="pf-card-wrap"/g) || []).length;
    const manifest = JSON.parse(fs.readFileSync(manifestUrlFor(r.dir), 'utf8'));
    ok(r.dir + ' cards rendered', cards === manifest.items.length,
      cards + '/' + manifest.items.length);
    ok(r.dir + ' no error state', !/pf-error/.test(html));
    ok(r.dir + ' container class set', r.container.className === 'pf-grid', r.container.className);
    ok(r.dir + ' counter filled', /共 <strong>/.test(r.counter.innerHTML), r.counter.innerHTML);
  }

  // Spot-check a known card and a relative image path
  const appsHtml = results.find((r) => r.dir === 'apps').container.innerHTML;
  ok('apps card has title', /视频播放器/.test(appsHtml));
  ok('apps image path relative', /src="\.\.\/images\/project-4-1200x800-original\.jpg"/.test(appsHtml));
  ok('apps link relative', /href="\.\.\/apps\/media-player\/"/.test(appsHtml));
  ok('planned badge present', /pf-badge-planned/.test(appsHtml));

  console.log(fails === 0 ? '\nREGISTRY RENDER OK' : '\n' + fails + ' FAILURE(S)');
  process.exit(fails === 0 ? 0 : 1);
})();
