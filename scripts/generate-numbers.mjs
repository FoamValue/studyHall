#!/usr/bin/env node
/**
 * Sprint 20（v3.1）数字卡片重绘生成器。
 *
 * 口径（docs/design/ui-style-guide.md U20-1 / PO 裁决 P20）：
 * - 1600×1600、纸白底 #FCF7ED、大号数字深棕墨 #3A2A22 圆润粗体居中偏上；
 * - 计数物 = 朱砂小苹果（果身 #B45B3E、叶/柄 #8A3E27、白 16% 高光），数量 = 数值；
 * - 分组：每排 ≤5 个，自上而下降序填满、末排余数、每排水平居中；
 *   1~5 单排 / 6~10 两排 / 11~15 三排 / 16~20 四排；0 无计数物；
 * - 苹果随排数自适应：1 排 a=230 / 2 排 a=200 / 3 排 a=175 / 4 排 a=160；
 * - 渲染通道沿用 generate-covers.mjs：Playwright 截图 → cjpeg q82 渐进式；
 *   输出 frontend/public/images/numbers/number-{0..20}.jpg（同名同路径覆盖）。
 *
 * 用法：node scripts/generate-numbers.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const PAPER = '#FCF7ED';
const DIGIT = '#3A2A22';
const APPLE = '#B45B3E';
const LEAF = '#8A3E27';
const SIZE = 1600;
const OUT_DIR = resolve('frontend/public/images/numbers');

const FONT = `"Arial Rounded MT Bold","Hiragino Maru Gothic ProN","PingFang SC",sans-serif`;
const SIZE_BY_ROWS = { 1: 230, 2: 200, 3: 175, 4: 160 };
const ZONE = { top: 760, bottom: 1520 };

// 单颗苹果：以果身中心为原点，a = 外接盒边长，r = 果身半径
function apple(cx, cy, a) {
  const r = a * 0.38;
  const body =
    `M 0 ${(-0.78 * r).toFixed(1)} ` +
    `C ${(0.28 * r).toFixed(1)} ${(-1.05 * r).toFixed(1)}, ${(0.85 * r).toFixed(1)} ${(-0.95 * r).toFixed(1)}, ${(0.98 * r).toFixed(1)} ${(-0.25 * r).toFixed(1)} ` +
    `C ${(1.08 * r).toFixed(1)} ${(0.35 * r).toFixed(1)}, ${(0.62 * r).toFixed(1)} ${(0.92 * r).toFixed(1)}, 0 ${(0.95 * r).toFixed(1)} ` +
    `C ${(-0.62 * r).toFixed(1)} ${(0.92 * r).toFixed(1)}, ${(-1.08 * r).toFixed(1)} ${(0.35 * r).toFixed(1)}, ${(-0.98 * r).toFixed(1)} ${(-0.25 * r).toFixed(1)} ` +
    `C ${(-0.85 * r).toFixed(1)} ${(-0.95 * r).toFixed(1)}, ${(-0.28 * r).toFixed(1)} ${(-1.05 * r).toFixed(1)}, 0 ${(-0.78 * r).toFixed(1)} Z`;
  return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">
    <path d="${body}" fill="${APPLE}"/>
    <rect x="${(-0.05 * r).toFixed(1)}" y="${(-1.32 * r).toFixed(1)}" width="${(0.1 * r).toFixed(1)}" height="${(0.5 * r).toFixed(1)}" rx="${(0.05 * r).toFixed(1)}" fill="${LEAF}"/>
    <ellipse cx="${(0.34 * r).toFixed(1)}" cy="${(-1.14 * r).toFixed(1)}" rx="${(0.32 * r).toFixed(1)}" ry="${(0.15 * r).toFixed(1)}" transform="rotate(-28 ${(0.34 * r).toFixed(1)} ${(-1.14 * r).toFixed(1)})" fill="${LEAF}"/>
    <ellipse cx="${(-0.34 * r).toFixed(1)}" cy="${(-0.26 * r).toFixed(1)}" rx="${(0.16 * r).toFixed(1)}" ry="${(0.27 * r).toFixed(1)}" transform="rotate(18 ${(-0.34 * r).toFixed(1)} ${(-0.26 * r).toFixed(1)})" fill="#FFFFFF" opacity="0.16"/>
  </g>`;
}

// 排布：自上而下降序填满（每排 5 个），末排余数，每排水平居中，排组在计数区内垂直居中
function layoutApples(n) {
  if (n === 0) return '';
  const rows = Math.ceil(n / 5);
  const a = SIZE_BY_ROWS[rows];
  const gapX = a * 0.18;
  const gapY = a * 0.25;
  const totalH = rows * a + (rows - 1) * gapY;
  const top = ZONE.top + (ZONE.bottom - ZONE.top - totalH) / 2;
  const parts = [];
  let placed = 0;
  for (let row = 0; row < rows; row++) {
    const k = Math.min(5, n - placed);
    const rowW = k * a + (k - 1) * gapX;
    const x0 = (SIZE - rowW) / 2 + a / 2;
    const cy = top + row * (a + gapY) + a / 2;
    for (let i = 0; i < k; i++) {
      parts.push(apple(x0 + i * (a + gapX), cy, a));
    }
    placed += k;
  }
  return parts.join('\n');
}

function svgFor(n) {
  const fontSize = n < 10 ? 560 : 460;
  const digitY = n === 0 ? 800 : 430;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${PAPER}"/>
  <text x="800" y="${digitY}" text-anchor="middle" dominant-baseline="central"
        font-family='${FONT}' font-weight="700" font-size="${fontSize}" fill="${DIGIT}">${n}</text>
  ${layoutApples(n)}
</svg>`;
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
const results = [];

for (let n = 0; n <= 20; n++) {
  const svg = svgFor(n);
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${PAPER}">${svg}</body></html>`,
    { waitUntil: 'load' }
  );
  await page.evaluate(() => document.fonts?.ready);

  const png = resolve(OUT_DIR, `.tmp-number-${n}.png`);
  await page.screenshot({ path: png, type: 'png', clip: { x: 0, y: 0, width: SIZE, height: SIZE } });

  const jpg = resolve(OUT_DIR, `number-${n}.jpg`);
  execFileSync('cjpeg', ['-quality', '82', '-progressive', '-outfile', jpg, png]);
  rmSync(png, { force: true });
  results.push({ n, bytes: statSync(jpg).size });
}

await browser.close();

for (const r of results) {
  console.log(`number-${String(r.n).padEnd(3)} ${String(r.bytes).padStart(8)}B`);
}
console.log(`共 ${results.length} 张，合计 ${(results.reduce((s, r) => s + r.bytes, 0) / 1024).toFixed(0)}KB`);
