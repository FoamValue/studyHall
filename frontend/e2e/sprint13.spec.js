import { test, expect } from '@playwright/test';

// ===== Sprint 13 新增 E2E（TC-128 ~ TC-129，编号依 QA 手册 docs/qa/sprint-13-test-cases.md）=====
// 覆盖：植物 176 处小知识补齐后，详情页「小知识」卡片渲染 + 同株不同部位文案差异化。
// 前端零改动，语料增补后 AllusionCard 数据驱动即渲染。

// TC-128 补齐小知识后详情渲染（选 apple-flower 条目）
test('TC-128 补齐后小知识卡片渲染', async ({ page }) => {
  await page.goto('/plants/apple-flower');
  await expect(page.locator('.detail-zh')).toHaveText('苹果花');

  await expect(page.locator('.allusion-card')).toBeVisible();
  await expect(page.locator('.allusion-title')).toHaveText('小知识');

  const text = page.locator('.allusion-text');
  await expect(text).toBeVisible();
  expect((await text.innerText()).trim().length).toBeGreaterThan(0);
});

// TC-129 同株花 / 叶 / 果三条目小知识互不相同（Sprint 17：每部位独立条目）
test('TC-129 不同部位条目小知识不重复', async ({ page }) => {
  const texts = [];
  for (const id of ['apple-flower', 'apple-leaf', 'apple-fruit']) {
    await page.goto(`/plants/${id}`);
    await expect(page.locator('.detail-zh')).toBeVisible();
    const t = (await page.locator('.allusion-text').innerText()).trim();
    expect(t.length).toBeGreaterThan(0);
    texts.push(t);
  }

  // 三部位文案两两不同
  expect(new Set(texts).size).toBe(texts.length);
});
