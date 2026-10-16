import { test, expect } from '@playwright/test';

// TC-17 浏览主流程冒烟：首页 → 点「花朵」分类 → 点向日葵卡片 → 点「果」部位
// 期望：详情显示向日葵果实内容（葵花籽），全程无控制台错误
test('TC-17 首页→花朵→向日葵→果', async ({ page }) => {
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

  // 2. 点「花朵」→ 仅显示 flower 分类植物（7 种，无银杏）
  await filterGroup.getByText('花朵').click();
  const cards = page.locator('.plant-card');
  await expect(cards).toHaveCount(7, { timeout: 10000 });
  await expect(page.locator('.plant-card', { hasText: '银杏' })).toHaveCount(0);

  // 3. 点向日葵卡片进详情
  await page.locator('.plant-card', { hasText: '向日葵' }).click();
  await expect(page.locator('.detail-zh')).toHaveText('向日葵');

  // 4. 点「果」部位 → 显示果实内容（葵花籽）
  await page.locator('[role="tab"]').filter({ hasText: /^果$/ }).click();
  await expect(page.locator('.part-desc')).toContainText('葵花籽');
  await expect(page.locator('.part-img')).toHaveAttribute('src', /sunflower-fruit\.svg$/);
  await expect(page.locator('.part-img')).toHaveAttribute('alt', '向日葵的果');

  // 5. 页面无报错
  expect(problems).toEqual([]);
});
