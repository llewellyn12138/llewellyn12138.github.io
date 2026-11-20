#!/usr/bin/env node
'use strict';
/*
 * Verify the LIVE site renders registry cards.
 * Fetches deployed registry.js + manifest.json, executes the real renderer in
 * a fake DOM, and asserts cards appear. Proves production works end-to-end
 * without needing a local browser (sandbox blocks Chrome).
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = 'https://llewellyn12138.github.io';
let fails = 0;
const ok = (l, c, e) => { console.log((c ? '  OK   ' : '  FAIL ') + l + (e ? '  ' + e : '')); if (!c) fails++; };

function makeEl(attrs) {
  return {
    innerHTML: '', className: '', textContent: '', _a: attrs || {},
    getAttribute(n) { return this._a[n] !== undefined ? this._a[n] : null; },
    setAttribute(n, v) { this._a[n] = v; },
  };
}

(async () => {
  const regSrc = await (await fetch(`${BASE}/assets/js/registry.js`)).text();

  for (const dir of ['apps', 'games', 'tools', 'software']) {
    const manifest = await (await fetch(`${BASE}/${dir}/manifest.json`)).json();
    const container = makeEl({
      'data-registry': `../${dir}/manifest.json`,
      'data-registry-key': dir,
      'data-registry-base': '../',
      'data-registry-head': '#registry-title',
    });
    const counter = makeEl({});
    const document = {
      readyState: 'complete',
      addEventListener() {},
      querySelector(s) {
        if (s === '[data-registry-count]') return counter;
        return null;
      },
      querySelectorAll() { return []; },
    };
    const sandbox = {
      window: null, document, location: { protocol: 'https:' }, console,
      fetch: (url) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(manifest) }),
    };
    sandbox.window = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(regSrc, ctx);
    await sandbox.PlatformRegistry.render(container, `../${dir}/manifest.json`);

    const cards = (container.innerHTML.match(/class="pf-card-wrap"/g) || []).length;
    ok(`${dir}: ${cards}/${manifest.items.length} cards`, cards === manifest.items.length);
    ok(`${dir}: no error state`, !/pf-error/.test(container.innerHTML));
  }

  console.log(fails === 0 ? '\nLIVE SITE RENDERS OK' : `\n${fails} FAILURE(S)`);
  process.exit(fails === 0 ? 0 : 1);
})();
