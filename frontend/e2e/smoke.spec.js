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

  // 3. 点桃花卡片进详情（Sprint 8：花朵分类下「桃」也派生为「桃花」，按卡片图 alt 精确定位「桃花」）
  await page.locator('.plant-card').filter({ has: page.locator('img[alt="桃花"]') }).click();
  await expect(page.locator('.detail-zh')).toHaveText('桃花');

  // 4. 切「叶」部位 → 显示叶内容
  await page.locator('[role="tab"]').filter({ hasText: /^叶$/ }).click();
  await expect(page.locator('.part-img')).toHaveAttribute('src', /peach-blossom-leaf\.jpg$/);
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
  await expect(page.locator('.part-img')).toHaveAttribute('src', /maple-leaf\.jpg$/);

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
  await expect(page.locator('.plant-card', { hasText: '白果' })).toHaveCount(1);   // 银杏卡片标题派生为「白果」
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

// TC-63 分类封面跟随分类（Sprint 7 / EX-1）：树叶分类下「苹果」封面为叶图，而非花朵照片
test('TC-63 树叶分类下含花朵植物封面跟随分类', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('group', { name: '植物分类筛选' }).getByText('树叶').click();
  await expect(page.locator('.plant-card')).toHaveCount(100, { timeout: 15000 });

  // 苹果同时含花/叶/果，树叶分类下封面应为叶图（修复前会错误显示花朵照片）
  const appleCover = page.locator('.plant-card', { hasText: '苹果' }).locator('img');
  await expect(appleCover).toHaveAttribute('src', /apple-leaf\.jpg$/);
});

// ===== Sprint 8 新增 E2E（TC-67 ~ TC-70）：卡片标题 + 详情默认部位跟随分类（EX-4 / EX-5） =====

// TC-67 树叶分类：卡片标题「苹果叶」，点进详情默认选中「叶」、大图与卡片图一致
test('TC-67 树叶分类苹果标题「苹果叶」且详情默认选叶', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('group', { name: '植物分类筛选' }).getByText('树叶').click();
  await expect(page.locator('.plant-card')).toHaveCount(100, { timeout: 15000 });

  const appleCard = page.locator('.plant-card', { hasText: '苹果叶' });
  await expect(appleCard.locator('.plant-card-zh')).toHaveText('苹果叶');
  await expect(appleCard.locator('img')).toHaveAttribute('src', /apple-leaf\.jpg$/); // 卡片图=叶

  await appleCard.click();
  await expect(page.locator('.detail-zh')).toHaveText('苹果');
  // 详情默认部位跟随入口分类 → 叶（而非固定首位「花」）
  await expect(page.getByRole('tab', { name: '叶' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: '花' })).toHaveAttribute('aria-selected', 'false');
  await expect(page.locator('.part-img')).toHaveAttribute('src', /apple-leaf\.jpg$/);
  await expect(page.locator('.part-img')).toHaveAttribute('alt', '苹果的叶');
});

// TC-68 花朵分类：苹果卡片标题「苹果花」
test('TC-68 花朵分类苹果标题「苹果花」', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('group', { name: '植物分类筛选' }).getByText('花朵').click();
  await expect(page.locator('.plant-card')).toHaveCount(53, { timeout: 15000 });

  await expect(page.locator('.plant-card', { hasText: '苹果花' }).locator('.plant-card-zh')).toHaveText(
    '苹果花'
  );
});

// TC-69 果实分类：银杏卡片标题「白果」（惯用果名特例）
test('TC-69 果实分类银杏标题「白果」', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('group', { name: '植物分类筛选' }).getByText('果实').click();
  await expect(page.locator('.plant-card')).toHaveCount(53, { timeout: 15000 });

  await expect(page.locator('.plant-card', { hasText: '白果' }).locator('.plant-card-zh')).toHaveText(
    '白果'
  );
});

// TC-70 全部分类：苹果标题保持原名，详情默认仍为「花」（回归）
test('TC-70 全部苹果标题原名且详情默认「花」', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });

  const appleCard = page.locator('.plant-card', { hasText: '苹果' });
  await expect(appleCard.locator('.plant-card-zh')).toHaveText('苹果');

  await appleCard.click();
  await expect(page.locator('.detail-zh')).toHaveText('苹果');
  await expect(page.getByRole('tab', { name: '花' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.part-img')).toHaveAttribute('src', /apple-flower\.jpg$/);
});
