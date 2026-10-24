import { test, expect } from '@playwright/test';
import { gotoBook } from './helpers';

// ===== Sprint 19 新增 E2E（TC-171 ~ TC-175，编号依 QA 手册 docs/qa/sprint-19-test-cases.md）=====
// 覆盖：4 个方向 data-route-enter 实测 / 无来源不播动画 / 换肤后书架尺寸与零溢出不回归 /
// 详情页整屏不滚动不回归 / 8 张新色板封面资源与尺寸。
// 全量配置 use.reducedMotion='reduce'（M19-3）：过渡降级为 120ms 纯淡入，属性与结构不变。

const BOOKS = ['plant', 'animal', 'insect', 'dinosaur', 'letter', 'pinyin', 'number', 'color'];

const bookByTitle = (page, title) =>
  page.locator('.book', { has: page.locator('.book-title-zh', { hasText: title }) });

// 读取页面根容器上的入场方向标记（未挂标记返回 null）
const routeEnterOf = (page, selector) =>
  page.evaluate(
    (sel) => document.querySelector(sel)?.getAttribute('data-route-enter') ?? null,
    selector
  );

// 读取根容器 computed animation-name（无标记时应为 none）
const animationNameOf = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? getComputedStyle(el).animationName : 'missing';
  }, selector);

// TC-171 4 个方向 data-route-enter 实测（reduced-motion 下仍挂标记、直切可交互）
test('TC-171 4 个方向 data-route-enter 实测', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });

  // ① 书架 → 书内页（打开书本）320ms
  await bookByTitle(page, '植物书').click();
  await expect(page).toHaveURL(/\/books\/plant$/);
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  expect(await routeEnterOf(page, '.page.book-page')).toBe('shelf-to-book');

  // ② 书内页 → 详情（翻开一页）340ms
  await page.locator('.plant-card').first().click();
  await expect(page.locator('.detail-zh')).toBeVisible();
  expect(await routeEnterOf(page, '.detail-immersive')).toBe('book-to-detail');

  // ③ 详情 → 书内页（合上返回）240ms
  await page.getByRole('link', { name: /回植物书/ }).click();
  await expect(page).toHaveURL(/\/books\/plant$/);
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  expect(await routeEnterOf(page, '.page.book-page')).toBe('detail-to-book');

  // ④ 书内页 → 书架（关闭书本）260ms
  await page.locator('.book-topbar a.back-btn').click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });
  expect(await routeEnterOf(page, '.bookshelf-page')).toBe('book-to-shelf');

  expect(problems).toEqual([]);
});

// TC-172 直接访问 / 刷新无来源标记且无动画
test('TC-172 直接访问三页不挂标记且无动画', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  // 书架
  await page.goto('/');
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });
  expect(await routeEnterOf(page, '.bookshelf-page')).toBeNull();
  expect(await animationNameOf(page, '.bookshelf-page')).toBe('none');

  // 书内页（直接 URL）
  await gotoBook(page, 'plant');
  expect(await routeEnterOf(page, '.page.book-page')).toBeNull();
  expect(await animationNameOf(page, '.page.book-page')).toBe('none');

  // 刷新后仍无标记
  await page.reload();
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  expect(await routeEnterOf(page, '.page.book-page')).toBeNull();
  expect(await animationNameOf(page, '.page.book-page')).toBe('none');

  // 详情页（深链接）
  await page.goto('/plants/azalea-flower');
  await expect(page.locator('.detail-zh')).toBeVisible({ timeout: 15000 });
  expect(await routeEnterOf(page, '.detail-immersive')).toBeNull();
  expect(await animationNameOf(page, '.detail-immersive')).toBe('none');

  expect(problems).toEqual([]);
});

// TC-173 换肤后书架 8 本、书本尺寸不变、页面零溢出
test('TC-173 书架 8 本与书本尺寸不变、页面零溢出', async ({ page }) => {
  for (const viewport of [
    { width: 1024, height: 768, w: 210, h: 252 },
    { width: 1180, height: 820, w: 228, h: 272 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });

    await expect(page.locator('.book')).toHaveCount(8);
    await expect(page.locator('.shelf-row')).toHaveCount(2);

    // 书本尺寸 = 换肤前基线（210×252 / 228×272），换肤不改版式
    const boxes = await page.locator('.book').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      })
    );
    expect(boxes).toHaveLength(8);
    for (const box of boxes) {
      expect(box.w).toBe(viewport.w);
      expect(box.h).toBe(viewport.h);
    }

    // 页面级纵向 / 横向溢出 ≤1px
    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      y: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    }));
    expect(overflow.x).toBeLessThanOrEqual(1);
    expect(overflow.y).toBeLessThanOrEqual(1);
  }
});

// TC-174 详情页整屏不滚动不回归（U6-1）
test('TC-174 详情页整屏不滚动不回归', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await gotoBook(page, 'plant');
  await page.locator('.plant-card').first().click();
  await expect(page.locator('.detail-zh')).toBeVisible({ timeout: 15000 });

  // 页面高度恒等于视口 → 永无页面级滚动条
  const metrics = await page.evaluate(() => ({
    scrollH: document.documentElement.scrollHeight,
    clientH: document.documentElement.clientHeight,
    overflowY: document.documentElement.scrollHeight - document.documentElement.clientHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    position: getComputedStyle(document.querySelector('.detail-immersive')).position,
  }));
  expect(metrics.position).toBe('fixed');
  expect(metrics.overflowY).toBeLessThanOrEqual(1);
  expect(metrics.overflowX).toBeLessThanOrEqual(1);

  // 滚动不改变文档滚动位置（滚动链已被阻断）
  const beforeY = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => window.scrollY)).toBe(beforeY);
});

// TC-175 8 张新色板封面 HTTP 200 且 1200×1200
test('TC-175 8 张封面资源与尺寸', async ({ page, request }) => {
  for (const code of BOOKS) {
    const res = await request.get(`/images/covers/${code}.jpg`);
    expect(res.status(), `covers/${code}.jpg`).toBe(200);
    expect(res.headers()['content-type'], `covers/${code}.jpg`).toContain('image/jpeg');
  }

  await page.goto('/');
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });

  const dims = await page.evaluate(
    (codes) =>
      Promise.all(
        codes.map(
          (code) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = () => resolve({ w: 0, h: 0 });
              img.src = `/images/covers/${code}.jpg`;
            })
        )
      ),
    BOOKS
  );
  expect(dims).toHaveLength(8);
  for (const dim of dims) {
    expect(dim.w).toBe(1200);
    expect(dim.h).toBe(1200);
  }
});
