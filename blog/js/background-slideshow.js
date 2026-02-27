// 动态顶图图片切换
var back_img = [
  "https://imgbed.llewellyn.top/file/1758453819476_wallhaven-3lg5pv.jpg",
  "https://imgbed.llewellyn.top/file/1758453786860_wallhaven-5g7ew7.jpg"
];

// 轮播时间间隔（毫秒），默认 5 秒
var time_interval = 5000;

// 预加载图片
function preloadImages() {
  for (var i = 0; i < back_img.length; i++) {
    var img = new Image();
    img.src = back_img[i];
  }
}

// 切换背景函数
function changeBackground() {
  // 检查是否在首页
  // Butterfly 主题首页通常有 id="site_title" 或者 class="full_page" 的元素
  // 或者我们可以检查 URL 路径
  if (window.location.pathname !== '/' && window.location.pathname !== '/blog/') {
    console.log("[Top Image Slideshow] Not homepage, skipping.");
    return;
  }

  // 获取首页顶图元素
  var page_header = document.getElementById("page-header");

  if (!page_header) {
    console.log("[Top Image Slideshow] #page-header not found.");
    return;
  }

  // 添加过渡效果
  page_header.style.transition = "background-image 1s ease-in-out";

  // 随机选择一张图片
  var random_index = Math.floor(Math.random() * back_img.length);
  var bg_url = back_img[random_index];

  // 设置背景图片
  page_header.style.setProperty("background-image", "url('" + bg_url + "')", "important");

  console.log("[Top Image Slideshow] Changed to: " + bg_url);
}

// 滚动条控制函数
function handleScrollbar() {
  // 获取可视区域高度
  var vh = window.innerHeight;
  // 阈值设置为视口高度的 2/3
  var threshold = vh * 0.66;

  if (window.scrollY < threshold) {
    document.body.classList.add('at-top');
  } else {
    document.body.classList.remove('at-top');
  }
}

// 动态注入波浪 SVG
function injectWaves() {
  if (window.location.pathname !== '/' && window.location.pathname !== '/blog/') {
    return;
  }

  var page_header = document.getElementById("page-header");
  if (!page_header) return;

  // 检查是否已经注入
  if (document.getElementById("waves-container")) return;

  var waveHTML = `
  <div id="waves-container" class="waves-area">
    <svg class="waves-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none" shape-rendering="auto">
      <defs>
        <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
      </defs>
      <g class="parallax">
        <use xlink:href="#gentle-wave" x="48" y="0" fill="rgba(152, 216, 230, 0.7)" />
        <use xlink:href="#gentle-wave" x="48" y="3" fill="rgba(152, 216, 230, 0.5)" />
        <use xlink:href="#gentle-wave" x="48" y="5" fill="rgba(152, 216, 230, 0.3)" />
        <use xlink:href="#gentle-wave" x="48" y="7" fill="#98d8e6" />
      </g>
    </svg>
  </div>
  `;

  // 插入到 page-header 内部的最后
  page_header.insertAdjacentHTML('beforeend', waveHTML);
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
  console.log("[Top Image Slideshow] Script loaded.");

  // 仅在首页执行轮播逻辑
  if (window.location.pathname === '/' || window.location.pathname === '/blog/') {
    preloadImages();
    changeBackground(); // 初始化显示一张
    setInterval(changeBackground, time_interval); // 定时切换
    injectWaves(); // 注入波浪效果
  }

  // 初始化滚动条状态
  handleScrollbar();
  // 监听滚动事件
  window.addEventListener('scroll', handleScrollbar);
  // 监听窗口大小改变事件，重新计算阈值
  window.addEventListener('resize', handleScrollbar);
});
