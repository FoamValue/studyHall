#!/usr/bin/env node
// Sprint 2: 为 22 种新植物生成 44 张部位简笔画 SVG。
// 风格对齐 Sprint 1 样例（sunflower-flower / ginkgo-leaf）：
// viewBox 512x512，粗描边（主轮廓 9，叶脉 6，茎 10），平涂无渐变，主体居中饱满。
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../frontend/public/images/plants');
mkdirSync(OUT, { recursive: true });

const GF = '#66BB6A', GS = '#388E3C', GV = '#2E7D32'; // 叶：填/描/脉
const J = 'stroke-linejoin="round" stroke-linecap="round"';

const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">\n${body}\n</svg>\n`;

// ---- 基础模板 ----
// 放射花瓣环（向日葵式）：顶部花瓣距中心 dist，按角度旋转复用
function petalRing({ rx, ry, dist, fill, stroke, sw = 9, angles, id = 'p' }) {
  const cy = 256 - dist;
  const def = `  <defs>\n    <ellipse id="${id}" cx="256" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${J}/>\n  </defs>`;
  const uses = angles.map(a => a === 0 ? `  <use href="#${id}"/>` : `  <use href="#${id}" transform="rotate(${a} 256 256)"/>`).join('\n');
  return `${def}\n${uses}`;
}
// 圆形花瓣环（梅花/梨花式）
function circleRing({ r, dist, fill, stroke, sw = 9, angles, id = 'p' }) {
  const cy = 256 - dist;
  const def = `  <defs>\n    <circle id="${id}" cx="256" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${J}/>\n  </defs>`;
  const uses = angles.map(a => a === 0 ? `  <use href="#${id}"/>` : `  <use href="#${id}" transform="rotate(${a} 256 256)"/>`).join('\n');
  return `${def}\n${uses}`;
}
// 花心点阵（1 中心 + 6 环绕）
function centerDots(cx, cy, color, dist = 42, r = 8) {
  let s = `  <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="${color}"/>`;
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / 3;
    s += `\n  <circle cx="${(cx + dist * Math.cos(a)).toFixed(1)}" cy="${(cy - dist * Math.sin(a)).toFixed(1)}" r="${r}" fill="${color}"/>`;
  }
  return s;
}
// 星形多边形路径
function star(cx, cy, n, ro, ri, rot = -90) {
  const pts = [];
  for (let k = 0; k < 2 * n; k++) {
    const r = k % 2 === 0 ? ro : ri;
    const a = ((rot + (k * 180) / n) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}
// 锯齿叶（玫瑰/桂花/梨）：主轴竖直，两侧锯齿，含中脉+侧脉+叶柄
function serratedLeaf({ len = 380, w = 180, teeth = 8, fill = GF, stroke = GS }) {
  const top = 256 - len / 2, step = len / teeth;
  let d = `M256 ${top}`;
  for (let i = 1; i <= teeth; i++) {
    const o1 = (w / 2) * Math.sin((Math.PI * i) / teeth);
    const om = Math.max(o1, (w / 2) * Math.sin((Math.PI * (i - 1)) / teeth));
    d += ` L${(256 + om).toFixed(1)} ${(top + step * (i - 0.5)).toFixed(1)} L${(256 + o1).toFixed(1)} ${(top + step * i).toFixed(1)}`;
  }
  for (let i = teeth; i >= 1; i--) {
    const o1 = (w / 2) * Math.sin((Math.PI * i) / teeth);
    const om = Math.max(o1, (w / 2) * Math.sin((Math.PI * (i - 1)) / teeth));
    d += ` L${(256 - om).toFixed(1)} ${(top + step * (i - 0.5)).toFixed(1)} L${(256 - o1).toFixed(1)} ${(top + step * i).toFixed(1)}`;
  }
  d += ' Z';
  let veins = `  <path d="M256 ${top + 8} L256 ${top + len - 6}" fill="none" stroke="${GV}" stroke-width="7" stroke-linecap="round"/>`;
  for (let i = 2; i < teeth; i += 2) {
    const y = top + step * i;
    const o = (w / 2) * Math.sin((Math.PI * i) / teeth) * 0.82;
    veins += `\n  <path d="M256 ${y.toFixed(1)} L${(256 + o).toFixed(1)} ${(y - 20).toFixed(1)}" fill="none" stroke="${GV}" stroke-width="5" stroke-linecap="round"/>`;
    veins += `\n  <path d="M256 ${y.toFixed(1)} L${(256 - o).toFixed(1)} ${(y - 20).toFixed(1)}" fill="none" stroke="${GV}" stroke-width="5" stroke-linecap="round"/>`;
  }
  veins += `\n  <path d="M256 ${top + len} L256 ${Math.min(492, top + len + 46)}" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>`;
  return `  <path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="9" ${J}/>\n${veins}`;
}
// 莲座波浪叶（菊花/西瓜）：n 个圆凸波的叶片
function wavyLeaf(bumps, fill = GF, stroke = GS) {
  return `  <path d="${bumps}" fill="${fill}" stroke="${stroke}" stroke-width="9" ${J}/>\n` +
    `  <path d="M256 448 C 254 350 254 200 256 96" fill="none" stroke="${GV}" stroke-width="7" stroke-linecap="round"/>\n` +
    `  <path d="M256 340 C 222 330 190 316 162 296" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
    `  <path d="M256 340 C 290 330 322 316 350 296" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
    `  <path d="M256 240 C 228 232 200 220 176 202" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
    `  <path d="M256 240 C 284 232 312 220 336 202" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
    `  <path d="M256 448 C 258 464 259 476 258 490" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>`;
}
// 绒球（含羞草花）：r0→r1 放射绒丝 + 端点
function puffball(cx, cy, r0, r1, n, lineColor, dotColor) {
  let s = '';
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n;
    const x1 = (cx + r1 * Math.cos(a)).toFixed(1), y1 = (cy + r1 * Math.sin(a)).toFixed(1);
    s += `  <line x1="${(cx + r0 * Math.cos(a)).toFixed(1)}" y1="${(cy + r0 * Math.sin(a)).toFixed(1)}" x2="${x1}" y2="${y1}" stroke="${lineColor}" stroke-width="5" stroke-linecap="round"/>\n`;
    s += `  <circle cx="${x1}" cy="${y1}" r="7" fill="${dotColor}"/>\n`;
  }
  return s;
}
// 花芯放射雄蕊 + 端点（梅花）
function stamens(cx, cy, r0, r1, n, lineColor, dotColor, offset = 0) {
  let s = '';
  for (let k = 0; k < n; k++) {
    const a = (2 * Math.PI * k) / n + offset;
    const x1 = (cx + r1 * Math.cos(a)).toFixed(1), y1 = (cy + r1 * Math.sin(a)).toFixed(1);
    s += `  <line x1="${(cx + r0 * Math.cos(a)).toFixed(1)}" y1="${(cy + r0 * Math.sin(a)).toFixed(1)}" x2="${x1}" y2="${y1}" stroke="${lineColor}" stroke-width="5" stroke-linecap="round"/>\n`;
    s += `  <circle cx="${x1}" cy="${y1}" r="6" fill="${dotColor}"/>\n`;
  }
  return s;
}

// ---- 各植物部位 ----
const F = {};

// 玫瑰：层叠圆瓣 + 中心旋纹
F['rose-flower'] =
  circleRing({ r: 95, dist: 92, fill: '#F48FB1', stroke: '#D81B60', angles: [0, 72, 144, 216, 288] }) + '\n' +
  `  <circle cx="256" cy="256" r="108" fill="#F06292" stroke="#D81B60" stroke-width="9"/>\n` +
  `  <circle cx="256" cy="256" r="64" fill="#EC407A" stroke="#AD1457" stroke-width="8"/>\n` +
  `  <path d="M256 232 C 274 232 286 244 286 258 C 286 276 272 288 254 288 C 230 288 214 272 216 248" fill="none" stroke="#AD1457" stroke-width="6" stroke-linecap="round"/>`;
F['rose-leaf'] = serratedLeaf({ len: 380, w: 185, teeth: 9 });

// 牡丹：双层圆瓣 + 黄心
F['peony-flower'] =
  petalRing({ rx: 55, ry: 85, dist: 105, fill: '#F8BBD0', stroke: '#F06292', angles: [0, 45, 90, 135, 180, 225, 270, 315], id: 'op' }) + '\n' +
  petalRing({ rx: 40, ry: 60, dist: 62, fill: '#F48FB1', stroke: '#EC407A', sw: 8, angles: [36, 108, 180, 252, 324], id: 'ip' }) + '\n' +
  `  <circle cx="256" cy="256" r="42" fill="#FFCA28" stroke="#F9A825" stroke-width="8"/>\n` + centerDots(256, 256, '#FF8F00', 24, 6);
F['peony-leaf'] =
  `  <defs>\n    <ellipse id="plobe" cx="256" cy="268" rx="58" ry="105" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n  </defs>\n` +
  `  <use href="#plobe" transform="rotate(-48 256 380)"/>\n  <use href="#plobe" transform="rotate(48 256 380)"/>\n  <use href="#plobe"/>\n` +
  `  <path d="M256 380 L256 170" fill="none" stroke="${GV}" stroke-width="7" stroke-linecap="round"/>\n` +
  `  <path d="M256 300 C 232 294 210 284 192 270" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 300 C 280 294 302 284 320 270" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 380 L256 472" fill="none" stroke="${GS}" stroke-width="10" stroke-linecap="round"/>`;

// 菊花：双层细长瓣
F['chrysanthemum-flower'] =
  petalRing({ rx: 18, ry: 120, dist: 116, fill: '#FFD54F', stroke: '#F9A825', sw: 8, angles: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330], id: 'op' }) + '\n' +
  petalRing({ rx: 16, ry: 76, dist: 76, fill: '#FFCA28', stroke: '#F57F17', sw: 7, angles: [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5], id: 'ip' }) + '\n' +
  `  <circle cx="256" cy="256" r="52" fill="#FF8F00" stroke="#E65100" stroke-width="9"/>\n` + centerDots(256, 256, '#BF360C', 28, 6);
F['chrysanthemum-leaf'] = wavyLeaf(
  'M256 64 C 300 70 330 96 336 130 C 370 138 388 168 380 200 C 408 216 416 250 400 278 C 420 300 420 336 398 356 C 400 392 372 420 336 416 C 320 442 288 452 256 444 C 224 452 192 442 176 416 C 140 420 112 392 114 356 C 92 336 92 300 112 278 C 96 250 104 216 132 200 C 124 168 142 138 176 130 C 182 96 212 70 256 64 Z');

// 梅花：5 圆瓣 + 放射雄蕊
F['plum-blossom-flower'] =
  circleRing({ r: 92, dist: 130, fill: '#F8BBD0', stroke: '#EC407A', angles: [0, 72, 144, 216, 288] }) + '\n' +
  `  <circle cx="256" cy="256" r="44" fill="#FFFDE7" stroke="#F9A825" stroke-width="7"/>\n` +
  stamens(256, 256, 18, 70, 10, '#F9A825', '#FF6F00', 0.31);
F['plum-blossom-leaf'] = serratedLeaf({ len: 370, w: 150, teeth: 10 });

// 郁金香：三尖杯形
F['tulip-flower'] =
  `  <path d="M256 400 C 170 380 130 280 136 150 L 196 212 L 256 120 L 316 212 L 376 150 C 382 280 342 380 256 400 Z" fill="#EF5350" stroke="#C62828" stroke-width="9" ${J}/>\n` +
  `  <path d="M256 380 C 240 320 232 260 236 200" fill="none" stroke="#B71C1C" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 380 C 272 320 280 260 276 200" fill="none" stroke="#B71C1C" stroke-width="6" stroke-linecap="round"/>`;
F['tulip-leaf'] =
  `  <path d="M236 470 C 220 340 210 210 250 60 C 262 50 278 54 284 66 C 262 210 268 340 292 466 C 274 482 250 482 236 470 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M262 440 C 244 320 240 200 264 84" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>`;

// 百合：6 尖被片 + 长雄蕊
F['lily-flower'] =
  petalRing({ rx: 28, ry: 122, dist: 122, fill: '#FCE4EC', stroke: '#F06292', angles: [0, 60, 120, 180, 240, 300] }) + '\n' +
  (() => {
    let s = '';
    for (const a of [-60, -30, 0, 30, 60]) {
      const rad = (a * Math.PI) / 180;
      const x = (256 + 92 * Math.sin(rad)).toFixed(1), y = (256 - 92 * Math.cos(rad)).toFixed(1);
      s += `  <line x1="256" y1="256" x2="${x}" y2="${y}" stroke="#F9A825" stroke-width="5" stroke-linecap="round"/>\n`;
      s += `  <ellipse cx="${x}" cy="${y}" rx="7" ry="14" fill="#FF6F00" transform="rotate(${a} ${x} ${y})"/>\n`;
    }
    return s;
  })() +
  `  <circle cx="256" cy="256" r="16" fill="#F48FB1"/>`;
F['lily-leaf'] =
  `  <path d="M256 40 C 300 120 316 260 300 430 C 280 452 232 452 212 430 C 196 260 212 120 256 40 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M256 60 C 252 180 252 320 254 428" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M238 80 C 226 190 224 310 232 420" fill="none" stroke="${GV}" stroke-width="5" stroke-linecap="round"/>\n` +
  `  <path d="M274 80 C 286 190 288 310 280 420" fill="none" stroke="${GV}" stroke-width="5" stroke-linecap="round"/>`;

// 牵牛花：喇叭五裂面 + 星纹
F['morning-glory-flower'] =
  `  <path d="M256 66 C 320 66 372 96 400 146 C 440 170 452 224 436 272 C 452 322 428 376 380 396 C 352 440 296 458 256 446 C 216 458 160 440 132 396 C 84 376 60 322 76 272 C 60 224 72 170 112 146 C 140 96 192 66 256 66 Z" fill="#BA68C8" stroke="#7B1FA2" stroke-width="9" ${J}/>\n` +
  `  <path d="${star(256, 256, 5, 112, 34)}" fill="#E1BEE7" stroke="#8E24AA" stroke-width="6" ${J}/>\n` +
  `  <path d="M256 256 L256 96 M256 256 L408 208 M256 256 L350 384 M256 256 L162 384 M256 256 L104 208" fill="none" stroke="#8E24AA" stroke-width="5" stroke-linecap="round"/>\n` +
  `  <circle cx="256" cy="256" r="20" fill="#FFF8E1"/>`;
F['morning-glory-leaf'] =
  `  <path d="M256 440 C 120 340 76 220 116 140 C 148 76 232 72 256 132 C 280 72 364 76 396 140 C 436 220 392 340 256 440 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M256 440 C 254 340 254 240 256 150" fill="none" stroke="${GV}" stroke-width="7" stroke-linecap="round"/>\n` +
  `  <path d="M256 320 C 220 300 190 276 168 246" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 320 C 292 300 322 276 344 246" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 440 C 258 460 259 474 258 490" fill="none" stroke="${GS}" stroke-width="10" stroke-linecap="round"/>`;

// 茉莉：六瓣星形 + 黄心
F['jasmine-flower'] =
  petalRing({ rx: 26, ry: 116, dist: 118, fill: '#FFF9C4', stroke: '#F9A825', angles: [0, 60, 120, 180, 240, 300] }) + '\n' +
  `  <circle cx="256" cy="256" r="36" fill="#FFCA28" stroke="#F57F17" stroke-width="7"/>\n` + centerDots(256, 256, '#E65100', 20, 5);
// 茉莉叶：枝上对生小叶 + 顶叶
F['jasmine-leaf'] =
  `  <defs>\n    <ellipse id="jl" cx="256" cy="256" rx="32" ry="56" fill="${GF}" stroke="${GS}" stroke-width="8" ${J}/>\n  </defs>\n` +
  `  <path d="M140 380 L380 140" fill="none" stroke="${GS}" stroke-width="10" stroke-linecap="round"/>\n` +
  `  <use href="#jl" transform="translate(-34 126) rotate(-45 256 256)"/>\n` +
  `  <use href="#jl" transform="translate(50 41) rotate(-45 256 256)"/>\n` +
  `  <use href="#jl" transform="translate(-62 -13) rotate(-45 256 256)"/>\n` +
  `  <use href="#jl" transform="translate(22 -97) rotate(-45 256 256)"/>\n` +
  `  <use href="#jl" transform="translate(161 -153) rotate(45 256 256)"/>`;

// 桂花：橙黄十字小花簇
F['osmanthus-flower'] = (() => {
  const petal = `fill="#FFB300" stroke="#FF8F00" stroke-width="7"`;
  const g = `  <defs>\n    <g id="osm">\n` +
    `      <circle cx="0" cy="-30" r="32" ${petal}/>\n      <circle cx="30" cy="0" r="32" ${petal}/>\n      <circle cx="0" cy="30" r="32" ${petal}/>\n      <circle cx="-30" cy="0" r="32" ${petal}/>\n` +
    `      <circle cx="0" cy="0" r="10" fill="#FF6F00"/>\n    </g>\n  </defs>`;
  const pos = [[256, 126], [126, 256], [386, 256], [256, 386], [256, 256]];
  return g + '\n' + pos.map(([x, y]) => `  <use href="#osm" transform="translate(${x} ${y})"/>`).join('\n');
})();
F['osmanthus-leaf'] = serratedLeaf({ len: 380, w: 165, teeth: 8, fill: '#7CB342', stroke: '#558B2F' });

// 康乃馨：锯齿皱边圆盘
F['carnation-flower'] = (() => {
  const pts = [];
  for (let k = 0; k < 36; k++) {
    const r = k % 2 === 0 ? 190 : 158;
    const a = (2 * Math.PI * k) / 36;
    pts.push(`${k === 0 ? 'M' : 'L'}${(256 + r * Math.cos(a)).toFixed(1)} ${(256 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `  <path d="${pts.join(' ')} Z" fill="#F48FB1" stroke="#C2185B" stroke-width="9" ${J}/>\n` +
    `  <path d="M160 220 C 200 200 240 240 280 216 C 310 198 340 214 356 236" fill="none" stroke="#AD1457" stroke-width="6" stroke-linecap="round"/>\n` +
    `  <path d="M156 300 C 196 280 236 320 276 296 C 306 278 336 294 352 316" fill="none" stroke="#AD1457" stroke-width="6" stroke-linecap="round"/>\n` +
    `  <circle cx="256" cy="256" r="30" fill="#F06292" stroke="#AD1457" stroke-width="6"/>`;
})();
F['carnation-leaf'] =
  `  <path d="M240 460 C 210 300 200 160 230 50 C 244 44 258 48 262 60 C 246 170 252 310 284 452 C 270 466 250 468 240 460 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M270 450 C 300 320 330 200 380 90 C 392 84 404 92 402 104 C 350 210 322 330 306 458 C 294 466 278 462 270 450 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M252 420 C 236 300 232 180 246 76" fill="none" stroke="${GV}" stroke-width="5" stroke-linecap="round"/>\n` +
  `  <path d="M292 420 C 314 310 344 210 384 118" fill="none" stroke="${GV}" stroke-width="5" stroke-linecap="round"/>`;

// 枫叶：掌状五裂
F['maple-leaf'] =
  `  <path d="M256 36 L286 150 L380 90 L330 210 L446 230 L330 290 L370 400 L290 350 L266 380 L266 470 L246 470 L246 380 L222 350 L142 400 L182 290 L66 230 L182 210 L132 90 L226 150 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M256 360 L256 70 M256 360 L366 108 M256 360 L428 232 M256 360 L356 384 M256 360 L156 384 M256 360 L84 232 M256 360 L146 108" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>`;

// 柳叶：垂枝 + 下垂细叶
F['willow-leaf'] = (() => {
  let s = `  <defs>\n    <ellipse id="wl" cx="256" cy="256" rx="15" ry="80" fill="${GF}" stroke="${GS}" stroke-width="7" ${J}/>\n  </defs>\n`;
  s += `  <path d="M120 56 C 260 86 360 176 400 300" fill="none" stroke="${GS}" stroke-width="10" stroke-linecap="round"/>\n`;
  const leaves = [[168, 148, -15], [232, 178, -2], [292, 220, 12], [344, 272, 26], [384, 332, 40]];
  for (const [x, y, r] of leaves) s += `  <use href="#wl" transform="translate(${x - 256} ${y - 256}) rotate(${r} 256 256)"/>\n`;
  return s;
})();

// 竹叶：竹节枝 + 窄长叶扇
F['bamboo-leaf'] =
  `  <defs>\n    <ellipse id="bl" cx="256" cy="256" rx="14" ry="112" fill="${GF}" stroke="${GS}" stroke-width="7" ${J}/>\n  </defs>\n` +
  `  <path d="M140 410 L245 305 M255 295 L360 190" fill="none" stroke="#43A047" stroke-width="11" stroke-linecap="round"/>\n` +
  `  <circle cx="250" cy="300" r="14" fill="${GS}"/>\n` +
  `  <use href="#bl" transform="translate(74 -41) rotate(43 256 256)"/>\n` +
  `  <use href="#bl" transform="translate(34 -81) rotate(18 256 256)"/>\n` +
  `  <use href="#bl" transform="translate(109 -1) rotate(69 256 256)"/>\n` +
  `  <use href="#bl" transform="translate(140 147) scale(0.72) rotate(113 256 256)"/>`;

// 松针：扇形针束 + 基部鳞鞘
F['pine-leaf'] = (() => {
  let s = '';
  for (const [r, color, sw] of [[290, GS, 8], [210, '#43A047', 7]]) {
    for (const a of [-60, -40, -20, 0, 20, 40, 60]) {
      const rad = (a * Math.PI) / 180;
      s += `  <line x1="256" y1="430" x2="${(256 + r * Math.sin(rad)).toFixed(1)}" y2="${(430 - r * Math.cos(rad)).toFixed(1)}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>\n`;
    }
  }
  s += `  <ellipse cx="256" cy="432" rx="34" ry="20" fill="#8D6E63" stroke="#5D4037" stroke-width="7"/>`;
  return s;
})();
// 松果：卵圆球果 + 层叠鳞片弧
F['pine-fruit'] = (() => {
  let s = `  <path d="M256 40 L256 74" fill="none" stroke="#5D4037" stroke-width="10" stroke-linecap="round"/>\n`;
  s += `  <path d="M256 70 C 330 90 380 170 380 280 C 380 390 330 450 256 460 C 182 450 132 390 132 280 C 132 170 182 90 256 70 Z" fill="#A1887F" stroke="#5D4037" stroke-width="9" ${J}/>\n`;
  for (const [y, hw, n] of [[150, 80, 3], [215, 115, 4], [280, 122, 4], [345, 108, 4], [405, 78, 3]]) {
    const step = (2 * hw) / n;
    for (let i = 0; i < n; i++) {
      const x0 = 256 - hw + i * step;
      s += `  <path d="M${x0.toFixed(0)} ${y} C ${(x0 + step * 0.3).toFixed(0)} ${y + 30} ${(x0 + step * 0.7).toFixed(0)} ${y + 30} ${(x0 + step).toFixed(0)} ${y}" fill="none" stroke="#5D4037" stroke-width="6" stroke-linecap="round"/>\n`;
    }
  }
  return s;
})();

// 含羞草：羽状复叶
F['mimosa-leaf'] = (() => {
  let s = `  <defs>\n    <ellipse id="ml" cx="256" cy="256" rx="8" ry="16" fill="${GF}" stroke="${GS}" stroke-width="5" ${J}/>\n  </defs>\n`;
  s += `  <path d="M140 420 C 220 330 300 240 384 138" fill="none" stroke="${GS}" stroke-width="8" stroke-linecap="round"/>\n`;
  const base = [[200, 360], [256, 300], [312, 240]];
  for (const [px, py] of base) {
    for (const dir of [1, -1]) {
      const bx = px + dir * 50 * 0.707, by = py + dir * 50 * 0.707;
      s += `  <path d="M${px} ${py} L${bx.toFixed(1)} ${by.toFixed(1)}" fill="none" stroke="#43A047" stroke-width="5" stroke-linecap="round"/>\n`;
      for (let t = 16; t <= 68; t += 17) {
        for (const side of [1, -1]) {
          const lx = px + dir * (t * 0.707 - side * 8.5);
          const ly = py + dir * (t * 0.707 + side * 8.5);
          s += `  <use href="#ml" transform="translate(${(lx - 256).toFixed(1)} ${(ly - 256).toFixed(1)}) rotate(45 256 256)"/>\n`;
        }
      }
    }
  }
  s += `  <use href="#ml" transform="translate(128 -124) rotate(45 256 256)"/>\n`;
  return s;
})();
// 含羞草花：粉色绒球
F['mimosa-flower'] =
  `  <circle cx="256" cy="256" r="176" fill="#FCE4EC"/>\n` +
  puffball(256, 256, 40, 172, 40, '#F48FB1', '#EC407A') +
  `  <circle cx="256" cy="256" r="40" fill="#F06292" stroke="#D81B60" stroke-width="8"/>`;

// 仙人掌叶（茎片）：掌片 + 刺座
F['cactus-leaf'] = (() => {
  let s = `  <ellipse cx="386" cy="150" rx="58" ry="80" fill="${GF}" stroke="${GS}" stroke-width="8" transform="rotate(25 386 150)"/>\n`;
  s += `  <ellipse cx="246" cy="280" rx="150" ry="190" fill="${GF}" stroke="${GS}" stroke-width="9"/>\n`;
  s += `  <path d="M246 110 C 244 220 244 340 246 450" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n`;
  const areoles = [[180, 200], [310, 200], [160, 300], [330, 300], [190, 390], [300, 390]];
  for (const [x, y] of areoles) {
    s += `  <circle cx="${x}" cy="${y}" r="6" fill="${GV}"/>\n`;
    s += `  <path d="M${x} ${y} L${x - 16} ${y - 14} M${x} ${y} L${x + 16} ${y - 14} M${x} ${y} L${x} ${y - 20}" fill="none" stroke="${GV}" stroke-width="4" stroke-linecap="round"/>\n`;
  }
  return s;
})();
// 仙人掌花：双层尖瓣 + 黄心
F['cactus-flower'] =
  petalRing({ rx: 34, ry: 118, dist: 120, fill: '#F48FB1', stroke: '#D81B60', sw: 8, angles: [0, 45, 90, 135, 180, 225, 270, 315], id: 'op' }) + '\n' +
  petalRing({ rx: 26, ry: 76, dist: 78, fill: '#F06292', stroke: '#AD1457', sw: 7, angles: [30, 90, 150, 210, 270, 330], id: 'ip' }) + '\n' +
  `  <circle cx="256" cy="256" r="44" fill="#FFCA28" stroke="#F9A825" stroke-width="8"/>\n` + centerDots(256, 256, '#FF6F00', 26, 6);

// 香蕉：月牙弯果 + 棱线
F['banana-fruit'] =
  `  <path d="M134 318 C 160 396 280 416 350 350 C 400 306 424 240 428 190 C 430 172 408 168 402 184 C 396 236 372 296 326 336 C 268 386 176 372 150 306 C 142 288 126 300 134 318 Z" fill="#FFEB3B" stroke="#F9A825" stroke-width="9" ${J}/>\n` +
  `  <path d="M162 328 C 220 380 300 380 350 322" fill="none" stroke="#FBC02D" stroke-width="5" stroke-linecap="round"/>\n` +
  `  <circle cx="140" cy="312" r="10" fill="#8D6E63"/>\n  <circle cx="415" cy="178" r="10" fill="#8D6E63"/>`;
// 香蕉叶：横展长圆叶 + 平行侧脉
F['banana-leaf'] = (() => {
  let s = `  <path d="M60 256 C 80 160 200 100 330 110 C 430 118 470 180 460 256 C 450 330 340 400 210 392 C 110 386 44 330 60 256 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n`;
  s += `  <path d="M72 256 C 200 240 340 244 452 256" fill="none" stroke="${GV}" stroke-width="7" stroke-linecap="round"/>\n`;
  for (const [x, dy] of [[140, -60], [210, -70], [280, -66], [350, -52], [140, 62], [210, 74], [280, 70], [350, 56]]) {
    s += `  <path d="M${x} 252 L${x + 26} ${252 + dy}" fill="none" stroke="${GV}" stroke-width="5" stroke-linecap="round"/>\n`;
  }
  return s;
})();

// 西瓜：圆果 + 深绿波浪条纹（裁剪）+ 卷须
F['watermelon-fruit'] =
  `  <defs>\n    <clipPath id="wc"><circle cx="256" cy="264" r="188"/></clipPath>\n  </defs>\n` +
  `  <circle cx="256" cy="264" r="192" fill="#A5D6A7" stroke="#2E7D32" stroke-width="9"/>\n` +
  `  <g clip-path="url(#wc)">\n` +
  `    <path d="M150 60 C 130 170 170 300 140 470" fill="none" stroke="#2E7D32" stroke-width="14" stroke-linecap="round"/>\n` +
  `    <path d="M230 60 C 214 170 246 300 222 470" fill="none" stroke="#2E7D32" stroke-width="14" stroke-linecap="round"/>\n` +
  `    <path d="M310 60 C 294 170 326 300 302 470" fill="none" stroke="#2E7D32" stroke-width="14" stroke-linecap="round"/>\n` +
  `    <path d="M390 60 C 374 170 406 300 382 470" fill="none" stroke="#2E7D32" stroke-width="14" stroke-linecap="round"/>\n` +
  `  </g>\n` +
  `  <path d="M256 72 C 268 46 298 44 300 64 C 302 80 282 82 282 66" fill="none" stroke="#6D4C41" stroke-width="8" stroke-linecap="round"/>`;
// 西瓜叶：深裂圆叶
F['watermelon-leaf'] = wavyLeaf(
  'M256 70 C 296 78 322 104 326 140 C 366 130 400 156 402 196 C 436 210 446 250 428 282 C 444 316 428 356 392 366 C 386 408 348 434 308 424 C 292 448 268 452 256 444 C 244 452 220 448 204 424 C 164 434 126 408 120 366 C 84 356 68 316 84 282 C 66 250 76 210 110 196 C 112 156 146 130 186 140 C 190 104 216 78 256 70 Z');

// 葡萄：金字塔果串 + 藤柄
F['grape-fruit'] = (() => {
  const rows = [[[256, 128]], [[212, 200], [300, 200]], [[172, 278], [256, 278], [340, 278]], [[212, 356], [300, 356]], [[256, 428]]];
  let s = `  <path d="M256 60 C 250 82 252 100 256 118" fill="none" stroke="#6D4C41" stroke-width="10" stroke-linecap="round"/>\n`;
  for (const row of rows) for (const [x, y] of row) {
    s += `  <circle cx="${x}" cy="${y}" r="56" fill="#AB47BC" stroke="#7B1FA2" stroke-width="8"/>\n`;
  }
  s += `  <circle cx="238" cy="112" r="10" fill="#CE93D8"/>`;
  return s;
})();
// 葡萄叶：三裂锯齿 + 卷须
F['grape-leaf'] =
  `  <path d="M256 56 C 300 66 330 106 326 146 C 380 136 420 176 410 236 C 440 276 420 336 370 346 C 360 406 300 436 256 416 C 212 436 152 406 142 346 C 92 336 72 276 102 236 C 92 176 132 136 186 146 C 182 106 212 66 256 56 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M256 410 C 254 320 254 200 256 80" fill="none" stroke="${GV}" stroke-width="7" stroke-linecap="round"/>\n` +
  `  <path d="M256 300 C 214 282 178 256 150 222" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 300 C 298 282 334 256 362 222" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 416 C 258 436 259 450 258 466" fill="none" stroke="${GS}" stroke-width="10" stroke-linecap="round"/>\n` +
  `  <path d="M384 396 C 424 406 444 376 428 358 C 416 346 400 356 408 370" fill="none" stroke="${GS}" stroke-width="7" stroke-linecap="round"/>`;

// 橘子：圆果 + 脐点 + 顶叶
F['orange-fruit'] =
  `  <circle cx="250" cy="272" r="184" fill="#FFA726" stroke="#EF6C00" stroke-width="9"/>\n` +
  `  <circle cx="250" cy="92" r="14" fill="none" stroke="#EF6C00" stroke-width="6"/>\n` +
  `  <ellipse cx="352" cy="92" rx="30" ry="58" fill="${GF}" stroke="${GS}" stroke-width="7" transform="rotate(42 352 92)"/>\n` +
  `  <circle cx="180" cy="220" r="5" fill="#F57C00"/>\n  <circle cx="300" cy="200" r="5" fill="#F57C00"/>\n  <circle cx="220" cy="330" r="5" fill="#F57C00"/>\n  <circle cx="330" cy="310" r="5" fill="#F57C00"/>\n  <circle cx="260" cy="260" r="5" fill="#F57C00"/>`;
// 橘子花：白五瓣 + 黄心
F['orange-flower'] =
  petalRing({ rx: 55, ry: 100, dist: 100, fill: '#FFF8E1', stroke: '#FFB300', angles: [0, 72, 144, 216, 288] }) + '\n' +
  `  <circle cx="256" cy="256" r="46" fill="#FFCA28" stroke="#F57F17" stroke-width="8"/>\n` + centerDots(256, 256, '#FF6F00', 26, 6);
// 橘子叶：光亮的翼柄叶
F['orange-leaf'] =
  `  <path d="M256 88 C 340 98 400 190 396 300 C 392 400 330 440 256 440 C 182 440 120 400 116 300 C 112 190 172 98 256 88 Z" fill="${GF}" stroke="${GS}" stroke-width="9" ${J}/>\n` +
  `  <path d="M256 440 C 252 340 252 220 256 110" fill="none" stroke="${GV}" stroke-width="7" stroke-linecap="round"/>\n` +
  `  <path d="M256 330 C 224 322 196 310 172 292" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 330 C 288 322 316 310 340 292" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 230 C 230 224 208 214 190 200" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 230 C 282 224 304 214 322 200" fill="none" stroke="${GV}" stroke-width="6" stroke-linecap="round"/>\n` +
  `  <path d="M256 440 C 238 458 238 478 256 492 C 274 478 274 458 256 440 Z" fill="${GF}" stroke="${GS}" stroke-width="7" ${J}/>`;

// 番茄：红圆果 + 绿星萼 + 柄
F['tomato-fruit'] =
  `  <circle cx="256" cy="286" r="180" fill="#EF5350" stroke="#C62828" stroke-width="9"/>\n` +
  `  <path d="${star(256, 156, 5, 104, 34)}" fill="${GF}" stroke="${GS}" stroke-width="7" ${J}/>\n` +
  `  <path d="M256 140 L256 58" fill="none" stroke="${GS}" stroke-width="10" stroke-linecap="round"/>\n` +
  `  <circle cx="196" cy="220" r="10" fill="#FF8A80"/>`;
// 番茄花：黄色五星
F['tomato-flower'] =
  petalRing({ rx: 24, ry: 105, dist: 105, fill: '#FFEE58', stroke: '#F9A825', sw: 8, angles: [0, 72, 144, 216, 288] }) + '\n' +
  `  <circle cx="256" cy="256" r="32" fill="#FDD835" stroke="#F57F17" stroke-width="7"/>\n` + centerDots(256, 256, '#E65100', 18, 5);
// 番茄叶：羽状不规则复叶
F['tomato-leaf'] =
  `  <defs>\n    <ellipse id="tl" cx="256" cy="256" rx="35" ry="62" fill="${GF}" stroke="${GS}" stroke-width="8" ${J}/>\n  </defs>\n` +
  `  <path d="M256 60 C 250 200 258 340 256 470" fill="none" stroke="${GS}" stroke-width="8" stroke-linecap="round"/>\n` +
  `  <use href="#tl" transform="translate(-88 -76) rotate(-35 256 256)"/>\n` +
  `  <use href="#tl" transform="translate(88 -76) rotate(35 256 256)"/>\n` +
  `  <use href="#tl" transform="translate(-98 48) rotate(-55 256 256)"/>\n` +
  `  <use href="#tl" transform="translate(98 48) rotate(55 256 256)"/>\n` +
  `  <use href="#tl" transform="translate(46.4 176.4) scale(0.6) rotate(-75 256 256)"/>\n` +
  `  <use href="#tl" transform="translate(158.4 176.4) scale(0.6) rotate(75 256 256)"/>\n` +
  `  <use href="#tl" transform="translate(-64 80) scale(1.25)"/>`;

// 梨：葫芦形果 + 褐柄 + 小叶
F['pear-fruit'] =
  `  <path d="M256 70 C 290 74 306 110 300 150 C 340 180 370 240 366 310 C 360 400 310 450 256 452 C 202 450 152 400 146 310 C 142 240 172 180 212 150 C 206 110 222 74 256 70 Z" fill="#DCE775" stroke="#9E9D24" stroke-width="9" ${J}/>\n` +
  `  <path d="M256 70 C 258 50 262 40 270 32" fill="none" stroke="#6D4C41" stroke-width="9" stroke-linecap="round"/>\n` +
  `  <ellipse cx="318" cy="64" rx="24" ry="46" fill="${GF}" stroke="${GS}" stroke-width="7" transform="rotate(52 318 64)"/>\n` +
  `  <circle cx="220" cy="280" r="5" fill="#AFB42B"/>\n  <circle cx="290" cy="330" r="5" fill="#AFB42B"/>\n  <circle cx="250" cy="380" r="5" fill="#AFB42B"/>`;
// 梨花：白圆瓣 + 红蕊点
F['pear-flower'] =
  circleRing({ r: 70, dist: 78, fill: '#FFFDE7', stroke: '#F48FB1', sw: 8, angles: [0, 72, 144, 216, 288] }) + '\n' +
  `  <circle cx="256" cy="256" r="38" fill="#FFF9C4" stroke="#F9A825" stroke-width="7"/>\n` +
  stamens(256, 256, 14, 30, 8, '#F9A825', '#E53935');
// 梨叶：细锯齿卵形叶
F['pear-leaf'] = serratedLeaf({ len: 376, w: 175, teeth: 10 });

// ---- 写出 ----
let count = 0, oversized = [];
for (const [name, body] of Object.entries(F)) {
  const content = wrap(body);
  const kb = Buffer.byteLength(content) / 1024;
  if (kb > 40) oversized.push(`${name}: ${kb.toFixed(1)}KB`);
  writeFileSync(join(OUT, `${name}.svg`), content);
  count++;
}
console.log(`generated ${count} svg files -> ${OUT}`);
if (oversized.length) { console.error('oversized:', oversized); process.exit(1); }
