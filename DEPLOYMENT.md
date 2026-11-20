# 站点构建与发布说明

本仓库现在是一个**静态多板块平台**，一次构建产出整个站点：

```
dist/
├── index.html              门户壳（首页）
├── about-us.html / contacts.html / map.html / media.html / lab.html
├── blog-latest.json        CI 生成的「最新文章」数据
├── blog-latest.js          file:// 预览用的数据快照
├── .nojekyll
├── assets/                 共享 CSS / JS（platform.css、registry.js、latest-posts.js）
├── css/ js/ images/ fonts/ 门户壳依赖的旧资源
├── apps/  games/  tools/  software/   四个板块（各自 index.html + manifest.json）
│   └── apps/media-player/  原 player.html 迁入
└── blog/                   Hexo 生成的博客（url root = /blog/）
```

## 本地构建

```bash
cd blog-source && npm ci --no-audit --no-fund && cd ..
node scripts/build-site.js     # 同步文章 + Hexo 生成 + 组装 dist/ + 刷新源码树快照
node scripts/verify-build.js   # 校验封面、链接、manifest、blog-latest.json
node scripts/scan-links.js     # 扫描所有 HTML 的站内引用（应输出 missing = 0）
node scripts/check-file-protocol.js  # 模拟 file:// 双击打开（应输出 missing = 0）
```

`dist/` 已加入 `.gitignore`，不会提交。

### 直接双击打开（file://）

所有 HTML 的资源链接都是**相对路径**，所以 `index.html` 可以直接双击打开，
CSS / 图片 / 字体 / 导航都正常。`file://` 下浏览器会因 CORS 拦截
`fetch()`，因此构建脚本额外生成了 `<script>` 可加载的数据快照：

| 文件 | 作用 |
| --- | --- |
| `*/manifest.js` | 四板块卡片的本地数据（`window.PF_MANIFEST`） |
| `blog-latest.js` / `blog-latest.json` | 首页「最新文章」本地数据（`window.PF_LATEST_POSTS`） |
| `blog/` | Hexo 输出的镜像，供首页「博客」链接跳转 |

**改了 `manifest.json` 或写了新文章后，跑一次 `build-site.js` 即可**
（它会自动重新生成板块页、刷新数据快照）；通过 HTTP 访问时卡片还会
`fetch()` 最新 JSON 覆盖静态内容，无需刷新。

## 静态兜底（重要）

四个板块页的卡片是**在构建时直接写进 HTML** 的，不是纯靠 JS 生成：

- JS 完全失效 / 被拦截 / 报错 → 页面仍然显示上一次构建的卡片（可被搜索引擎抓取）；
- JS 正常 → `registry.js` 拉取最新 `manifest.json`，成功后才重绘；
- 任何一步失败 → **保留静态卡片，绝不显示空白或错误横幅**。

因此编辑 `manifest.json` 后如果没重新构建，页面会显示旧卡片。
`build-site.js` 每次都会先跑 `gen-sections.js`，`verify-build.js` 还会校验
「静态卡片数 == manifest 条目数」，不一致直接构建失败。

卡片模板只有一份：[`scripts/card-template.js`](scripts/card-template.js)，
构建期与运行期共用，避免两边样式漂移。

`scripts/` 下保留的辅助脚本：

| 脚本 | 作用 |
| --- | --- |
| `build-site.js` | 统一构建入口（本地与 CI 共用） |
| `card-template.js` | 卡片 HTML 模板（构建期 + 运行期共用） |
| `gen-blog-latest.js` | 从 Hexo `db.json` 生成首页「最新文章」数据 |
| `gen-data-js.js` | 生成 `file://` 用的 `*.js` 数据快照 |
| `gen-sections.js` | 重新生成四个板块的 `index.html`（含静态卡片） |
| `unify-nav.js` | 一次性把旧页面的导航/页脚统一为平台导航（已执行，留作参考） |
| `verify-build.js` / `scan-links.js` / `check-file-protocol.js` | 构建产物完整性校验 |
| `verify-deploy.js` | 发布前把关：关键入口齐全、源文件不泄露 |
| `test-static-fallback.js` | 验证无 JS / 请求中 / 失败时卡片仍在 |
| `test-live.js` | 部署后抓线上真实文件跑渲染，确认线上正常 |

## GitHub Actions

`.github/workflows/update_posts.yml` 在 `main` 分支相关路径变更（或手动
`workflow_dispatch`）时执行：

1. `npm ci`（`blog-source/package-lock.json` 已解除忽略并纳入版本控制）；
2. `node scripts/build-site.js`：
   - 把 `posts/` 同步进 `blog-source/source/_posts/`（**唯一文章源**）；
   - `npx hexo clean && npx hexo generate`（输出到 `blog-source/public/blog`）；
   - 把门户壳、四个板块、`assets/`、`css/js/images/fonts` 组装进 `dist/`；
   - 从 `blog-source/db.json` 生成 `dist/blog-latest.json`；
3. `node scripts/verify-build.js` + `node scripts/scan-links.js` 做完整性校验；
4. `peaceiris/actions-gh-pages@v4` 把 `dist/` 推到 `gh-pages` 分支。

## ⚠️ Pages 源：当前是 main，建议切到 gh-pages

**现状（已实测，2026-11）**：Pages 同时在发布 `main` 分支，
`pages-build-deployment` 每次提交都会跑（#54/#55/#56 均成功）。

`gh-pages` 分支也已由 CI 正常推送，内容与本地 `dist/` **完全一致**
（208 个文件，逐文件清单比对通过）。所以两条发布路径都在工作，
但由此带来两个问题：

1. **源文件被公开**：`main` 直接作为站点源，导致以下路径都能直接下载：

   | 路径 | 状态 |
   | --- | --- |
   | `/posts/coding/markdown-guide.md` | 200（文章源文件） |
   | `/old/knowledge-loader.js` | 200（旧代码） |
   | `/blog-source/_config.yml` | 200（站点配置） |
   | `/scripts/build-site.js` | 200（构建脚本） |
   | `/DEPLOYMENT.md` | 200（本文档） |
   | `/.github/workflows/*` | 404（Actions 目录本就不发布） |

2. **内容重复发布**：同一份产物既在 `main` 又在 `gh-pages`，
   而且 CI 的 `dist/` 校验实际上不影响线上（线上走的是 `main`）。

### 建议切换

`Settings → Pages → Build and deployment → Source` 选
**Deploy from a branch** → branch `gh-pages`、folder `/ (root)`。

切换后：

- 只有 `dist/` 产物对外可见，上表所有源文件路径变成 404；
- CI 的 `verify-deploy.js` 才真正起到发布前把关作用；
- `main` 上的 `blog/` 镜像（1.47 MB）可以不再需要。

切换是**低风险**的：`gh-pages` 内容已验证与 `dist/` 一致，且每次构建都会
先过 `verify-deploy.js`（检查 32 个关键入口存在、7 个不该发布的文件确实不在、
总文件数合理），不通过就不发布。

### ✅ 已完成切换

Pages 源已改为 `gh-pages`。实测确认：

| 路径 | 状态 |
| --- | --- |
| `/DEPLOYMENT.md` | **404**（已不再暴露） |
| `/scripts/build-site.js` | **404** |
| `/posts/coding/markdown-guide.md` | **404** |
| `/blog/index.html` | 200（正常） |
| `/apps/media-player/index.html` | 200（正常） |

随之完成：仓库根 `blog/` 镜像已删除，构建不再生成第二份副本；
`draft/` 加入 `.gitignore`（保留本地草稿与截图，不提交）。

随时可用 `node scripts/check-pages-source.js` 复查当前状态。

### 验证是否生效

- `https://llewellyn12138.github.io/` → 出现「站点板块」八宫格与「最新文章」；
- `/blog-latest.json` 返回 JSON；`/software/`、`/apps/`、`/games/`、`/tools/` 返回列表页；
- `/posts/...`、`/old/...` 之类的源文件路径应当 **404**（不再暴露源文件）。

## ⚠️ 关于 CNAME / 自定义域名

根目录 `CNAME` 内容是 `old.llewellyn.top`，但：

- `old.llewellyn.top` 解析到 Cloudflare 的 A 记录（104.21.2.135 / 172.67.129.65），
  **不是**指向 GitHub Pages 的 CNAME；
- 当前 `gh-pages` 分支里没有 `CNAME`，线上 `old.llewellyn.top` 也是独立代理的旧站。

因此 **构建脚本刻意不把 `CNAME` 复制进 `dist/`**：一旦发布到 `gh-pages`，
GitHub Pages 会把 `llewellyn12138.github.io` 重定向到 `old.llewellyn.top`，
很可能导致访问异常。若日后确实要绑定自定义域名，请先确认 DNS 与
Cloudflare 配置，再手动把 `CNAME` 加入发布物。

## 内容维护

| 想做的事 | 改哪里 |
| --- | --- |
| 写博客 | `posts/<分类>/<文件名>.md`（**只改这里**）；`blog-source/source/_posts/` 是自动同步的镜像，已 gitignore |
| 新增小应用 / 游戏 / 工具 | 页面放 `apps/<name>/index.html` 等，再在对应 `manifest.json` 的 `items` 加一条 |
| 软件库 | 大文件传 GitHub Releases，`manifest.json` 里 `external: true` + Releases 链接；<10 MB 单文件放 `software/files/` |
| 改板块页外观 | `assets/css/platform.css` + `assets/js/registry.js`；四个 `index.html` 由 `node scripts/gen-sections.js` 重新生成 |
| 改导航 / 页脚 | `scripts/unify-nav.js`（一次性脚本）或直接编辑各 HTML |

`manifest.json` 字段：`name` / `description` / `link` / `image` / `icon` /
`tags[]` / `status`(`online`|`planned`) / `external` / `date`。

## 已修复的历史问题

- `public_dir` 从 `../blog` 改为 `public/blog`，配合 `root: /blog/`，与 `publish_dir` 对齐；
- 博客封面图复制到 `blog-source/source/images/`（含 `default.jpg`、`markdown-guide.jpg`），
  生成后落在 `/blog/images/...`，不再 404；
- `posts/ffmpeg/ffmpeg-guide.md` 的 `category:` 改为 `categories:` 并补 `cover`；
- `scaffolds/post.md` 的默认图改为实际存在的 `images/default.jpg`；
- 删除重复的 `blog-source/scripts/scripts/auto_category.js`；
- `player.html` 迁入 `apps/media-player/`，所有资源链接改为根绝对路径，
  `media.html` 的入口同步指向新位置。
