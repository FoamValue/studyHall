import { test, expect } from '@playwright/test';
import { gotoBook, loadAllCards } from './helpers';

// TC-22 浏览主流程冒烟（Sprint 17：植物单图，204 条展示）：首页 → 点桃花卡片 → 详情单图
// 期望：详情显示桃花内容，全程无控制台错误（PRD §7-1/§7-2：无登录、2 次点击到达详情）
test('TC-22 首页→桃花→详情（单图无部位切换）', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  // 1. 进入植物书，无登录/注册元素（§7-1）
  await gotoBook(page, 'plant');
  await expect(page.getByText(/登录|注册/)).toHaveCount(0);

  // 2. 植物书 204 条展示（无二级分类筛选）
  await loadAllCards(page, 204);

  // 3. 点桃花卡片进详情
  await page.locator('.plant-card').filter({ has: page.locator('img[alt="桃花"]') }).click();
  await expect(page.locator('.detail-zh')).toHaveText('桃花');

  // 4. 单图模式：无部位切换标签，大图即桃花图
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.part-img')).toHaveAttribute('src', /peach-flower\.jpg$/);
  await expect(page.locator('.part-img')).toHaveAttribute('alt', '桃花');

  // 5. 页面无报错
  expect(problems).toEqual([]);
});

// TC-23 植物板块规模：204 张卡片展示（语料 206 条中 2 条废弃不展示），含花朵/树叶/果实三类条目
test('TC-23 植物板块 204 条（含桃花/枫叶/白果）', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  // 花朵条目（精确匹配卡片标题）
  await expect(page.getByText('桃花', { exact: true })).toHaveCount(1);
  // 树叶条目（枫树花叶）
  await expect(page.getByText('枫树花叶', { exact: true })).toHaveCount(1);
  // 果实条目（白果 = 银杏果）
  await expect(page.getByText('白果', { exact: true })).toHaveCount(1);

  expect(problems).toEqual([]);
});

// TC-26 植物板块命名校验：桃花/枫叶/白果各自独立条目
test('TC-26 植物部位条目命名独立', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  // 桃的三个部位：桃子（果）、桃花（花）、桃花叶（叶）
  await expect(page.getByText('桃子', { exact: true })).toHaveCount(1);
  await expect(page.getByText('桃花', { exact: true })).toHaveCount(1);
  await expect(page.getByText('桃花叶', { exact: true })).toHaveCount(1);

  expect(problems).toEqual([]);
});

// TC-27 平板横屏布局（1024×768）：网格一行 ≥4 张卡片
test('TC-27 平板横屏网格与触控目标', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await gotoBook(page, 'plant');

  // 等首屏卡片出现
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });

  // 网格首行 ≥4 列：取前 4 张卡片，断言它们 top 相同（同一行）
  const tops = await page.locator('.plant-card').evaluateAll((els) =>
    els.slice(0, 4).map((el) => Math.round(el.getBoundingClientRect().top))
  );
  expect(new Set(tops).size).toBe(1);
});

// TC-63 枫树花叶条目封面即枫叶图
test('TC-63 枫树花叶条目封面即枫叶图', async ({ page }) => {
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  const mapleLeafCard = page.locator('.plant-card', { has: page.getByText('枫树花叶', { exact: true }) });
  await expect(mapleLeafCard.locator('img')).toHaveAttribute('src', /maple-leaf\.jpg$/);
});

// ===== Sprint 8 E2E 改写（TC-67 ~ TC-70）：Sprint 17 起植物为单部位独立条目 =====

// TC-67 苹果花条目：卡片标题「苹果花」，详情单图为苹果花图
test('TC-67 苹果花条目标题与详情图一致', async ({ page }) => {
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  const appleFlowerCard = page.locator('.plant-card', { has: page.getByText('苹果花', { exact: true }) });
  await expect(appleFlowerCard.locator('.plant-card-zh')).toHaveText('苹果花');
  await expect(appleFlowerCard.locator('img')).toHaveAttribute('src', /apple-flower\.jpg$/);

  await appleFlowerCard.click();
  await expect(page.locator('.detail-zh')).toHaveText('苹果花');
  // 单图模式无部位切换
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.part-img')).toHaveAttribute('src', /apple-flower\.jpg$/);
});

// TC-68 苹果叶条目：卡片标题「苹果花叶」（不叫「树叶」）
test('TC-68 苹果叶条目命名「苹果花叶」', async ({ page }) => {
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  await expect(page.locator('.plant-card', { has: page.getByText('苹果花叶', { exact: true }) }).locator('.plant-card-zh')).toHaveText(
    '苹果花叶'
  );
});

// TC-69 银杏果条目：标题「白果」（惯用果名特例）
test('TC-69 银杏果条目标题「白果」', async ({ page }) => {
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  await expect(page.locator('.plant-card', { has: page.getByText('白果', { exact: true }) }).locator('.plant-card-zh')).toHaveText(
    '白果'
  );
});

// TC-70 详情名称字号调大（Sprint 17 新增需求：方便幼儿识字）
test('TC-70 详情页名称字号加大', async ({ page }) => {
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  const peachCard = page.locator('.plant-card', { has: page.getByText('桃花', { exact: true }) });
  await peachCard.click();

  const zhFontSize = await page
    .locator('.detail-zh')
    .evaluate((el) => getComputedStyle(el).fontSize);
  // 横屏详情中文名 ≥52px（默认 56px）
  expect(parseFloat(zhFontSize)).toBeGreaterThanOrEqual(48);

  const enFontSize = await page
    .locator('.detail-en')
    .evaluate((el) => getComputedStyle(el).fontSize);
  // 英文名 ≥24px（默认 30px）
  expect(parseFloat(enFontSize)).toBeGreaterThanOrEqual(24);
});
