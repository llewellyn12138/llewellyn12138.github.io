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

**改了 `manifest.json` 或写了新文章后，要重新跑一次 `build-site.js`**
（或单独跑 `gen-data-js.js`）刷新这些快照，否则双击打开时看到的还是旧数据；
通过 HTTP 访问则始终 `fetch()` 最新的 JSON，无需刷新。

`scripts/` 下保留的辅助脚本：

| 脚本 | 作用 |
| --- | --- |
| `build-site.js` | 统一构建入口（本地与 CI 共用） |
| `gen-blog-latest.js` | 从 Hexo `db.json` 生成首页「最新文章」数据 |
| `gen-data-js.js` | 生成 `file://` 用的 `*.js` 数据快照 |
| `gen-sections.js` | 重新生成四个板块的 `index.html`（改版式后跑） |
| `unify-nav.js` | 一次性把旧页面的导航/页脚统一为平台导航（已执行，留作参考） |
| `verify-build.js` / `scan-links.js` / `check-file-protocol.js` | 构建产物完整性校验 |

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

## ⚠️ 必须做的一次性设置（否则线上不会更新）

**当前线上站点并不是由 `gh-pages` 分支提供的。** 实测：

- `https://llewellyn12138.github.io/posts/coding/markdown-guide.md`、`/old/knowledge-loader.js`、
  `/blog-source/_config.yml` 都返回 200 —— 这些是 `main` 分支上的源文件；
- `gh-pages` 分支的树（[API](https://api.github.com/repos/llewellyn12138/llewellyn12138.github.io/git/trees/gh-pages?recursive=1)）里只有 `.nojekyll`；
- 仓库 Pages API 返回 404（无 Pages 站点配置），`/blog/` 是历史遗留的陈旧产物。

也就是说：**GitHub Pages 目前是把 `main` 分支根目录当作站点源直接暴露**，
所以过去「构建成功但线上没变化」。要让新架构真正上线，二选一：

- **推荐**：`Settings → Pages → Build and deployment → Source` 选 **GitHub Actions**
  （本 workflow 推送 `gh-pages` 后由 Pages 部署）；或
- 选 **Deploy from a branch** → branch `gh-pages`、folder `/ (root)`。

改完后手动跑一次 `Actions → Build and Deploy Site → Run workflow`。

### 验证是否生效

- `https://llewellyn12138.github.io/` → 出现「站点板块」八宫格与「最新文章」；
- `/blog-latest.json` 返回 JSON；`/software/`、`/apps/`、`/games/`、`/tools/` 返回列表页；
- `/posts/...` 之类的源文件路径应当 404（不再暴露源文件）。

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
