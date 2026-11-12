#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const dbPath = path.join(repoRoot, 'blog-source', 'db.json');
const distDir = path.join(repoRoot, 'dist');
const outPath = path.join(distDir, 'blog-latest.json');
// Also keep a copy at the repo root so the homepage works when opened via
// file:// straight from the source tree (no dist/ involved).
const sourceOutPath = path.join(repoRoot, 'blog-latest.json');
const maxPosts = Number(process.env.BLOG_LATEST_LIMIT || 6);

if (!fs.existsSync(dbPath)) {
  console.error(`[blog-latest] db.json not found: ${dbPath}`);
  process.exit(1);
}
if (!fs.existsSync(path.join(distDir, 'blog'))) {
  console.error('[blog-latest] dist/blog not found; run build first');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const posts = (db.models && db.models.Post) || [];
const categories = (db.models && db.models.Category) || [];
const postCategories = (db.models && db.models.PostCategory) || [];
const categoryNameById = new Map(categories.map((c) => [c._id, c.name]));
const categoriesByPost = new Map();
postCategories.forEach((pc) => {
  const name = categoryNameById.get(pc.category_id);
  if (!name) return;
  if (!categoriesByPost.has(pc.post_id)) categoriesByPost.set(pc.post_id, []);
  categoriesByPost.get(pc.post_id).push(name);
});

const siteRoot = '/blog/';
const pad = (n) => String(n).padStart(2, '0');

// Hexo's permalink is :year/:month/:day/:title/ where :title comes from the
// source path under _posts (e.g. coding/markdown-guide). Dates are rendered in
// the generator's timezone (UTC on CI), so we probe +-1 day as a safety net.
function resolvePostUrl(p) {
  const d = new Date(p.date);
  const slug = (p.slug || '').replace(/^\/+|\/+$/g, '');
  for (const offset of [0, 1, -1]) {
    const probe = new Date(d.getTime() + offset * 86400000);
    const rel = `${probe.getUTCFullYear()}/${pad(probe.getUTCMonth() + 1)}/${pad(
      probe.getUTCDate()
    )}/${slug}/`;
    if (fs.existsSync(path.join(distDir, 'blog', ...rel.split('/'), 'index.html'))) {
      return siteRoot + rel;
    }
  }
  return null;
}

const items = posts
  .filter((p) => p.published !== false)
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .map((p) => ({
    title: p.title || 'Untitled',
    url: resolvePostUrl(p),
    date: new Date(p.date).toISOString(),
    description: p.description || '',
    cover: p.cover || p.image || '',
    categories: categoriesByPost.get(p._id) || [],
  }))
  .filter((p) => p.url)
  .slice(0, maxPosts);

const payload = JSON.stringify({ generatedAt: new Date().toISOString(), posts: items }, null, 2);
fs.writeFileSync(outPath, payload);
fs.writeFileSync(sourceOutPath, payload);
console.log(`[blog-latest] wrote ${items.length} posts -> dist/ and repo root`);
