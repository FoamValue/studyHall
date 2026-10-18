import { test, expect } from '@playwright/test';
import { loadAllCards } from './helpers';

// ===== Sprint 10 新增 E2E（TC-109 ~ TC-114，编号依 QA 手册 docs/qa/sprint-10-test-cases.md）=====
// 覆盖：EX-6 首页首屏 + 滚动增量加载 / 「共 N 种」总量口径 / EX-4 小知识可见标题 / EX-5 单图横屏主图占比 / 植物版式不回归

// TC-109 植物板块首屏不满 204，滚动后累计全量 204，总量提示「共 204 种」
test('TC-109 植物增量加载至 204 且总量提示', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });

  // 首屏卡片数明显少于全量（增量加载生效）
  const firstScreen = await page.locator('.plant-card').count();
  expect(firstScreen).toBeLessThan(204);

  // 总量口径 = 当前板块返回条数
  await expect(page.locator('.list-count')).toHaveText('共 204 种');

  // 滚动加载至全量
  await loadAllCards(page, 204);
});

// TC-111 EX-4：小知识卡片渲染用户可见标题「小知识」
test('TC-111 小知识卡片可见标题', async ({ page }) => {
  await page.goto('/plants/giant-panda');
  await expect(page.locator('.detail-zh')).toHaveText('大熊猫');

  const title = page.locator('.allusion-title');
  await expect(title).toBeVisible();
  await expect(title).toHaveText('小知识');
});

// TC-112 EX-5：单图板块（动物）横屏主图占可用高 ≥80% 且完整不裁切
test('TC-112 单图横屏主图占可用高 ≥80%（EX-5）', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/plants/giant-panda');
  await expect(page.locator('.detail-zh')).toHaveText('大熊猫');

  const body = await page.locator('.detail-body').boundingBox();
  const img = page.locator('.part-img');
  await expect(img).toBeVisible();
  const box = await img.boundingBox();

  // 主图高度 / 内容区可用高度 ≥ 0.8
  expect(box.height / body.height).toBeGreaterThanOrEqual(0.8);
  // 完整不裁切，且不溢出内容区
  expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
  expect(box.y).toBeGreaterThanOrEqual(body.y - 1);
  expect(box.y + box.height).toBeLessThanOrEqual(body.y + body.height + 1);
});

// TC-113 Sprint 17：植物详情现为单图模式（含 single-image、无部位切换、溢出 0）
test('TC-113 植物详情单图版式（Sprint 17）', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/plants/apple-flower');
  await expect(page.locator('.detail-zh')).toHaveText('苹果花');

  // 植物容器带单图分支类
  expect(await page.locator('.detail-body').getAttribute('class')).toContain('single-image');
  // 无部位切换
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.part-img')).toBeVisible();

  // 页面级无水平 / 纵向溢出
  const overflow = await page.evaluate(() => {
    const d = document.documentElement;
    return {
      x: d.scrollWidth - d.clientWidth,
      y: d.scrollHeight - d.clientHeight,
    };
  });
  expect(overflow.x).toBeLessThanOrEqual(1);
  expect(overflow.y).toBeLessThanOrEqual(1);
});

// TC-114 板块总量提示：动物 / 昆虫 / 恐龙均「共 50 种」且滚动加载后各渲染 50 张卡
// （Sprint 14 内容扩容：板块由 30 增至 50，断言同步更新）
test('TC-114 板块总量提示「共 50 种」', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('group', { name: '板块导航' });

  for (const label of ['动物', '昆虫', '恐龙']) {
    await nav.getByRole('button', { name: label }).click();
    await expect(page.locator('.list-count')).toHaveText('共 50 种');
    await loadAllCards(page, 50);
  }
});
