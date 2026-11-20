// Richer banner backgrounds: vivid layered glows + fine dot grid + light streaks.
const fs = require('fs');
const path = require('path');

const OUT = path.join(process.cwd(), 'images');
const W = 1920, H = 753;

const THEMES = [
  {
    file: 'banner-home-1.jpg',
    stops: [[7, 9, 26], [24, 18, 62], [64, 26, 96]],
    glow: [
      [255, 150, 30, 0.80, 0.14, 0.34, 0.46],   // warm amber, left
      [140, 96, 255, 0.62, 0.80, 0.62, 0.44],   // violet, right
      [30, 210, 200, 0.34, 0.46, 0.06, 0.34],   // teal, top-mid
      [255, 110, 180, 0.28, 0.94, 0.16, 0.30],  // pink, corner
    ],
  },
  {
    file: 'banner-home-2.jpg',
    stops: [[6, 14, 22], [10, 38, 54], [12, 64, 78]],
    glow: [
      [255, 150, 30, 0.72, 0.86, 0.30, 0.44],   // amber, right
      [60, 200, 210, 0.46, 0.18, 0.56, 0.42],   // cyan, left
      [150, 90, 255, 0.40, 0.52, 0.88, 0.34],   // violet, bottom
      [255, 255, 255, 0.14, 0.62, 0.18, 0.26],  // soft white top
    ],
  },
];

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];

function build(theme) {
  const buf = Buffer.alloc(W * H * 3);
  const [c0, c1, c2] = theme.stops;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = (x / W) * 0.6 + (y / H) * 0.4;
      let col = t < 0.5 ? mix(c0, c1, t / 0.5) : mix(c1, c2, (t - 0.5) / 0.5);
      let r = col[0], g = col[1], b = col[2];

      // Glows: [r,g,b, alpha, cx, cy, radiusFraction]
      for (const [gr, gg, gb, ga, fx, fy, fr] of theme.glow) {
        const cx = fx * W, cy = fy * H, rad = fr * Math.max(W, H);
        const dx = x - cx, dy = y - cy;
        let f = 1 - Math.sqrt(dx * dx + dy * dy) / rad;
        if (f <= 0) continue;
        f = f * f * (3 - 2 * f);        // smoothstep
        f = Math.pow(f, 1.7);           // tighter core
        const a = f * ga;
        r += (gr - r) * a;
        g += (gg - g) * a;
        b += (gb - b) * a;
      }

      // Diagonal light streaks (subtle, adds "premium" sheen)
      const streak = Math.sin((x * 0.9 + y * 0.45) * 0.0038);
      const sheen = Math.max(0, streak) * 9;
      r += sheen; g += sheen; b += sheen * 1.15;

      // Fine dot grid overlay
      const gx = x % 32, gy = y % 32;
      if (gx < 1 && gy < 1) {
        r += 16; g += 18; b += 26;
      }

      // Vignette
      const nx = (x / W - 0.5) * 2, ny = (y / H - 0.5) * 2;
      const vig = 1 - 0.34 * Math.min(1, (nx * nx + ny * ny) * 0.46);
      r *= vig; g *= vig; b *= vig;

      const o = (y * W + x) * 3;
      buf[o] = Math.max(0, Math.min(255, r | 0));
      buf[o + 1] = Math.max(0, Math.min(255, g | 0));
      buf[o + 2] = Math.max(0, Math.min(255, b | 0));
    }
  }
  return buf;
}

for (const theme of THEMES) {
  const raw = build(theme);
  fs.writeFileSync(path.join(OUT, theme.file.replace('.jpg', '.raw')), raw);
  console.log('rendered', theme.file);
}
