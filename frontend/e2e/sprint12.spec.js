import { test, expect } from '@playwright/test';
import { gotoBook } from './helpers';

// ===== Sprint 12 新增 E2E（TC-125 ~ TC-127，编号依 QA 手册 docs/qa/sprint-12-test-cases.md）=====
// 覆盖 EX-7：详情返回文案按板块派生（动物 / 昆虫 / 恐龙；植物沿用既有「回植物书」用例）。
// Sprint 18 迁移：返回目标由首页改为该书书内页 /books/{code}，文案「← 回{板块名}书」。

const CASES = [
  ['animal', '动物书'],
  ['insect', '昆虫书'],
  ['dinosaur', '恐龙书'],
];

for (const [code, title] of CASES) {
  test(`TC-125~127 ${title}详情返回文案「回${title}」且指向书内页`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await gotoBook(page, code);

    // 进入该书首张卡片详情（携带 section 路由 state）
    const firstCard = page.locator('.plant-card').first();
    await firstCard.click();
    await expect(page.locator('.detail-zh')).toBeVisible();

    // 返回按钮文案随板块派生，href 指向该书
    const back = page.locator('.imm-topbar a.back-btn');
    await expect(back).toHaveAttribute('href', `/books/${code}`);
    await expect(back).toContainText(`回${title}`);

    // 点击返回：回到该书的书内页
    await back.click();
    await expect(page).toHaveURL(`/books/${code}`);
    await expect(page.locator('.book-title')).toHaveText(title);
    await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  });
}
