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
  // 获取首页顶图元素
  // Butterfly 主题的顶图 ID 通常是 page-header
  // 如果是文章页，也是这个 ID，但我们通常只想在首页轮播，或者全站顶图都轮播
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

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function () {
  console.log("[Top Image Slideshow] Script loaded.");
  preloadImages();
  changeBackground(); // 初始化显示一张
  setInterval(changeBackground, time_interval); // 定时切换

  // 初始化滚动条状态
  handleScrollbar();
  // 监听滚动事件
  window.addEventListener('scroll', handleScrollbar);
  // 监听窗口大小改变事件，重新计算阈值
  window.addEventListener('resize', handleScrollbar);
});
