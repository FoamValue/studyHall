import { test, expect } from '@playwright/test';

// TC-22 浏览主流程冒烟（100 种规模）：首页 → 点「花朵」分类 → 点桃花卡片 → 切「叶」部位
// 期望：详情显示桃花叶内容，全程无控制台错误（PRD §7-1/§7-2：无登录、2 次点击到达详情）
test('TC-22 首页→花朵→桃花→叶', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  // 1. 首页加载，四个分类按钮可见，无登录/注册元素（§7-1）
  await page.goto('/');
  const filterGroup = page.getByRole('group', { name: '植物分类筛选' });
  await expect(filterGroup.getByText('全部')).toBeVisible();
  await expect(filterGroup.getByText('花朵')).toBeVisible();
  await expect(filterGroup.getByText('树叶')).toBeVisible();
  await expect(filterGroup.getByText('果实')).toBeVisible();
  await expect(page.getByText(/登录|注册/)).toHaveCount(0);

  // 2. 点「花朵」→ 显示 flower 分类植物（53 种，无银杏、无枫树）
  await filterGroup.getByText('花朵').click();
  const cards = page.locator('.plant-card');
  await expect(cards).toHaveCount(53, { timeout: 15000 });
  await expect(page.locator('.plant-card', { hasText: '银杏' })).toHaveCount(0);
  await expect(page.locator('.plant-card', { hasText: '枫树' })).toHaveCount(0);

  // 3. 点桃花卡片进详情
  await page.locator('.plant-card', { hasText: '桃花' }).click();
  await expect(page.locator('.detail-zh')).toHaveText('桃花');

  // 4. 切「叶」部位 → 显示叶内容
  await page.locator('[role="tab"]').filter({ hasText: /^叶$/ }).click();
  await expect(page.locator('.part-img')).toHaveAttribute('src', /peach-blossom-leaf\.svg$/);
  await expect(page.locator('.part-img')).toHaveAttribute('alt', '桃花的叶');

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

  // 「树叶」分类 100 种全部可见
  await filterGroup.getByText('树叶').click();
  await expect(page.locator('.plant-card')).toHaveCount(100, { timeout: 15000 });

  // 点枫树进详情：只有「叶」一个部位标签，无花/果
  await page.locator('.plant-card', { hasText: '枫树' }).click();
  await expect(page.locator('.detail-zh')).toHaveText('枫树');
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(1);
  await expect(tabs.first()).toHaveText(/^叶$/);
  await expect(page.locator('.part-img')).toHaveAttribute('src', /maple-leaf\.svg$/);

  expect(problems).toEqual([]);
});

// TC-26 果实分类规模：首页 → 点「果实」→ 53 张卡片，无银杏、无枫树
test('TC-26 首页→果实（53 种）', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await page.goto('/');
  await page.getByRole('group', { name: '植物分类筛选' }).getByText('果实').click();
  await expect(page.locator('.plant-card')).toHaveCount(53, { timeout: 15000 });
  await expect(page.locator('.plant-card', { hasText: '银杏' })).toHaveCount(1);   // 白果
  await expect(page.locator('.plant-card', { hasText: '枫树' })).toHaveCount(0);
  await expect(page.locator('.plant-card', { hasText: '火龙果' })).toHaveCount(1);

  expect(problems).toEqual([]);
});

// TC-27 平板横屏布局（1024×768）：网格一行 ≥4 张卡片，分类按钮高度 ≥44px
test('TC-27 平板横屏网格与触控目标', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');

  // 等首屏卡片出现
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });

  // 网格首行 ≥4 列：取前 4 张卡片，断言它们 top 相同（同一行）
  const tops = await page.locator('.plant-card').evaluateAll((els) =>
    els.slice(0, 4).map((el) => Math.round(el.getBoundingClientRect().top))
  );
  expect(new Set(tops).size).toBe(1);

  // 分类按钮高度 ≥44px（getByRole 命中按钮，而非内部 span）
  const btn = page.getByRole('button', { name: '花朵' });
  const height = await btn.evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeGreaterThanOrEqual(44);
});
