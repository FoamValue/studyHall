import { test, expect } from '@playwright/test';

// TC-22 浏览主流程冒烟（30 种规模）：首页 → 点「花朵」分类 → 点玫瑰卡片 → 切「叶」部位
// 期望：详情显示玫瑰叶内容，全程无控制台错误
test('TC-22 首页→花朵→玫瑰→叶', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  // 1. 首页加载，四个分类按钮可见
  await page.goto('/');
  const filterGroup = page.getByRole('group', { name: '植物分类筛选' });
  await expect(filterGroup.getByText('全部')).toBeVisible();
  await expect(filterGroup.getByText('花朵')).toBeVisible();
  await expect(filterGroup.getByText('树叶')).toBeVisible();
  await expect(filterGroup.getByText('果实')).toBeVisible();

  // 2. 点「花朵」→ 显示 flower 分类植物（22 种，无银杏、无枫树）
  await filterGroup.getByText('花朵').click();
  const cards = page.locator('.plant-card');
  await expect(cards).toHaveCount(22, { timeout: 10000 });
  await expect(page.locator('.plant-card', { hasText: '银杏' })).toHaveCount(0);
  await expect(page.locator('.plant-card', { hasText: '枫树' })).toHaveCount(0);

  // 3. 点玫瑰卡片进详情
  await page.locator('.plant-card', { hasText: '玫瑰' }).click();
  await expect(page.locator('.detail-zh')).toHaveText('玫瑰');

  // 4. 切「叶」部位 → 显示叶内容
  await page.locator('[role="tab"]').filter({ hasText: /^叶$/ }).click();
  await expect(page.locator('.part-img')).toHaveAttribute('src', /rose-leaf\.svg$/);
  await expect(page.locator('.part-img')).toHaveAttribute('alt', '玫瑰的叶');

  // 5. 页面无报错
  expect(problems).toEqual([]);
});

// TC-23 缺部位流程：首页 → 点「树叶」分类 → 点枫树卡片 → 详情仅显示「叶」标签
test('TC-23 首页→树叶→枫树（仅叶标签）', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await page.goto('/');
  const filterGroup = page.getByRole('group', { name: '植物分类筛选' });

  // 「树叶」分类 30 种全部可见
  await filterGroup.getByText('树叶').click();
  await expect(page.locator('.plant-card')).toHaveCount(30, { timeout: 10000 });

  // 点枫树进详情：只有「叶」一个部位标签，无花/果
  await page.locator('.plant-card', { hasText: '枫树' }).click();
  await expect(page.locator('.detail-zh')).toHaveText('枫树');
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(1);
  await expect(tabs.first()).toHaveText(/^叶$/);
  await expect(page.locator('.part-img')).toHaveAttribute('src', /maple-leaf\.svg$/);

  expect(problems).toEqual([]);
});
