import { test, expect } from '@playwright/test';

// ===== Sprint 12 新增 E2E（TC-125 ~ TC-127，编号依 QA 手册 docs/qa/sprint-12-test-cases.md）=====
// 覆盖 EX-7：详情返回文案按板块派生（动物 / 昆虫 / 恐龙；植物沿用既有「回花园」用例）。

const CASES = [
  ['动物', '回动物世界'],
  ['昆虫', '回昆虫角'],
  ['恐龙', '回恐龙园'],
];

for (const [label, backText] of CASES) {
  test(`TC-125~127 ${label}详情返回文案派生「${backText}」且指向首页`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');

    // 切到目标板块（一级板块导航）
    await page
      .getByRole('group', { name: '板块导航' })
      .getByRole('button', { name: label })
      .click();

    // 进入该板块首张卡片详情（携带 section 路由 state）
    const firstCard = page.locator('.plant-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();
    await expect(page.locator('.detail-zh')).toBeVisible();

    // 返回按钮文案随板块派生，href 仍为 /
    const back = page.locator('.imm-topbar a.back-btn');
    await expect(back).toHaveAttribute('href', '/');
    await expect(back).toContainText(backText);

    // 点击返回：回到首页且板块仍为目标板块
    await back.click();
    await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole('group', { name: '板块导航' }).getByRole('button', { name: label })
    ).toHaveAttribute('aria-pressed', 'true');
  });
}
