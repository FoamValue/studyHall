#!/usr/bin/env node
/**
 * Sprint 18（v2.9）封面花纹 tile 生成器。
 *
 * 口径（docs/design/ui-style-guide.md U18-6）：
 * - 1200×1200、纸白底 #FDFBF6、单色墨 #D9C9AE、每 tile 2×2 四个母题、单母题墨迹 ≤5%；
 * - 每本书只用 1 个母题（植物=叶 / 动物=爪印 / 昆虫=蝴蝶 / 恐龙=三趾脚印 /
 *   字母=Aa / 拼音=a / 数字=1 2 3 / 颜色=圆点）；
 * - 输出 /frontend/public/images/covers/{code}.jpg（cjpeg q82 渐进式）。
 *
 * 用法：node scripts/generate-covers.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const INK = '#D9C9AE';
const PAPER = '#FDFBF6';
const SIZE = 1200;
const OUT_DIR = resolve('frontend/public/images/covers');

// 2×2 四象限中心：tile 250px 显示时封面窗口仅 186×242（横向裁掉左右 32px），
// 故 x 取 377/823（映射到可见窗口 25%/75%），y 取 300/900（窗口高度几乎等于 tile）。
// 旋转角度轻微错落，避免呆板。
const CENTERS = [
  { x: 377, y: 300, r: -12 },
  { x: 823, y: 300, r: 10 },
  { x: 377, y: 900, r: 14 },
  { x: 823, y: 900, r: -8 },
];

const strokeStyle = `fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"`;

// 单个母题（以 (0,0) 为中心绘制，外接盒控制在 ≤ 480 内）
const MOTIFS = {
  // 一片叶子 + 主脉（线描）
  plant: `
    <path d="M0,-185 C110,-115 118,55 0,185 C-118,55 -110,-115 0,-185 Z" ${strokeStyle} stroke-width="24"/>
    <path d="M0,-150 L0,168" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
    <path d="M0,-95 L58,-126 M0,-35 L70,-64 M0,35 L64,6 M0,105 L46,76"
          ${strokeStyle} stroke-width="12"/>`,
  // 四趾爪印（扁平剪影）：1 掌垫 + 4 趾
  animal: `
    <ellipse cx="0" cy="62" rx="128" ry="100" fill="${INK}"/>
    <ellipse cx="-126" cy="-78" rx="48" ry="62" transform="rotate(-22 -126 -78)" fill="${INK}"/>
    <ellipse cx="-44" cy="-128" rx="46" ry="60" transform="rotate(-6 -44 -128)" fill="${INK}"/>
    <ellipse cx="44" cy="-128" rx="46" ry="60" transform="rotate(6 44 -128)" fill="${INK}"/>
    <ellipse cx="126" cy="-78" rx="48" ry="62" transform="rotate(22 126 -78)" fill="${INK}"/>`,
  // 蝴蝶（左右对称，线描）
  insect: `
    <ellipse cx="0" cy="0" rx="20" ry="118" fill="${INK}"/>
    <path d="M0,-42 C-118,-186 -252,-96 -34,6 Z" ${strokeStyle} stroke-width="22"/>
    <path d="M0,-42 C118,-186 252,-96 34,6 Z" ${strokeStyle} stroke-width="22"/>
    <path d="M0,10 C-128,52 -110,168 -28,86 Z" ${strokeStyle} stroke-width="22"/>
    <path d="M0,10 C128,52 110,168 28,86 Z" ${strokeStyle} stroke-width="22"/>
    <path d="M-8,-108 C-52,-168 -86,-192 -104,-198" ${strokeStyle} stroke-width="14"/>
    <path d="M8,-108 C52,-168 86,-192 104,-198" ${strokeStyle} stroke-width="14"/>`,
  // 三趾脚印（扁平剪影）
  dinosaur: `
    <ellipse cx="0" cy="58" rx="136" ry="100" fill="${INK}"/>
    <ellipse cx="-96" cy="-96" rx="52" ry="76" transform="rotate(-26 -96 -96)" fill="${INK}"/>
    <ellipse cx="0" cy="-138" rx="50" ry="80" fill="${INK}"/>
    <ellipse cx="96" cy="-96" rx="52" ry="76" transform="rotate(26 96 -96)" fill="${INK}"/>`,
  // 「Aa」字形
  letter: `
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="200" fill="${INK}"
          letter-spacing="-5">Aa</text>`,
  // 「a」字形
  pinyin: `
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="220" fill="${INK}">a</text>`,
  // 「1 2 3」字形组（整组计 1 个母题）
  number: `
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
          font-family="Georgia, 'Times New Roman', serif" font-size="140" fill="${INK}"
          letter-spacing="8">1 2 3</text>`,
  // 实心圆点
  color: `
    <circle cx="0" cy="0" r="150" fill="${INK}"/>`,
};

// 剪影母题墨迹偏重，按规范「单母题 ≤5%」等比微缩
const SCALES = { animal: 0.93, dinosaur: 0.92, insect: 0.68 };

function svgFor(code) {
  const motif = MOTIFS[code];
  if (!motif) throw new Error(`未知封面母题：${code}`);
  const s = SCALES[code] ?? 1;
  const groups = CENTERS.map(
    (c) =>
      `<g transform="translate(${c.x} ${c.y}) rotate(${c.r})${s !== 1 ? ` scale(${s})` : ''}">${motif}</g>`
  ).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>
  ${groups}
</svg>`;
}

const CODES = Object.keys(MOTIFS);

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
const results = [];

for (const code of CODES) {
  const svg = svgFor(code);
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${PAPER}">${svg}</body></html>`,
    { waitUntil: 'load' }
  );
  await page.evaluate(() => document.fonts?.ready);

  const png = resolve(OUT_DIR, `.tmp-${code}.png`);
  await page.screenshot({ path: png, type: 'png', clip: { x: 0, y: 0, width: SIZE, height: SIZE } });

  // 墨迹率（矢量渲染口径，用于核对 U18-6 留白 ≥80%）
  const inkRate = await page.evaluate(async (size) => {
    const svgEl = document.querySelector('svg');
    const xml = new XMLSerializer().serializeToString(svgEl);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      const d = Math.abs(data[i] - 253) + Math.abs(data[i + 1] - 251) + Math.abs(data[i + 2] - 246);
      if (d > 18) ink += 1;
    }
    return ink / (size * size);
  }, SIZE);
  const jpg = resolve(OUT_DIR, `${code}.jpg`);
  execFileSync('cjpeg', ['-quality', '82', '-progressive', '-outfile', jpg, png]);
  rmSync(png, { force: true });
  results.push({ code, jpg, bytes: statSync(jpg).size, inkRate });
}

await browser.close();

for (const r of results) {
  console.log(
    `${r.code.padEnd(9)} ${String(r.bytes).padStart(7)}B  ink=${(r.inkRate * 100).toFixed(2)}%  ${r.jpg}`
  );
}
