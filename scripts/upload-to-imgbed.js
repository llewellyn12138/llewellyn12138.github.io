#!/usr/bin/env node
'use strict';
/*
 * Upload local images to Llewellyn ImgHub and rewrite references to the CDN.
 *
 * ImgHub (sanyue_imghub) requires an authenticated admin token to write;
 * anonymous GET works, POST /api/manage/upload returns 401. So this script
 * needs a token you provide:
 *
 *   IMGHUB_TOKEN=<token> node scripts/upload-to-imgbed.js images/banner-home-1.jpg
 *
 * The token is the one your browser stores after logging into
 * https://imgbed.llewellyn.top/admin — take it from devtools (Authorization
 * header or the `token` entry in localStorage), do NOT commit it.
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://imgbed.llewellyn.top';
const TOKEN = process.env.IMGHUB_TOKEN;
const files = process.argv.slice(2).filter((f) => !f.startsWith('-'));

if (!files.length) {
  console.log('用法: IMGHUB_TOKEN=<token> node scripts/upload-to-imgbed.js <图片...>');
  process.exit(0);
}
if (!TOKEN) {
  console.error('缺少 IMGHUB_TOKEN 环境变量。先从浏览器 devtools 里取登录 token。');
  process.exit(1);
}

const ENDPOINTS = [
  '/api/manage/upload',
  '/api/upload',
  '/api/manage/image/upload',
  '/api/manage/file/upload',
];

async function tryUpload(file, endpoint) {
  const buf = fs.readFileSync(file);
  const form = new FormData();
  form.append('file', new Blob([buf]), path.basename(file));

  const r = await fetch(BASE + endpoint, {
    method: 'POST',
    headers: { token: TOKEN, Authorization: TOKEN },
    body: form,
  });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: r.status, ok: r.ok, json, text: text.slice(0, 300) };
}

(async () => {
  for (const file of files) {
    if (!fs.existsSync(file)) { console.log('跳过（不存在）:', file); continue; }
    let done = false;
    for (const ep of ENDPOINTS) {
      try {
        const res = await tryUpload(file, ep);
        console.log(`${path.basename(file)} -> ${ep}  HTTP ${res.status}  ${res.ok ? 'OK' : ''}`);
        if (res.status === 401 || res.status === 403) {
          console.log('  鉴权失败：token 可能过期或字段名不同。');
          continue;
        }
        if (res.ok && res.json) {
          console.log('  响应:', JSON.stringify(res.json).slice(0, 400));
          done = true;
          break;
        }
        if (res.status !== 404) console.log('  ' + res.text);
      } catch (e) {
        console.log(`  ${ep} 失败: ${e.message}`);
      }
    }
    if (!done) console.log('  ⚠ 未能自动上传，请在 ImgHub 网页手动上传后把直链填进 gallery/manifest.json');
  }
})();
