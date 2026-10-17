import { test, expect } from '@playwright/test';

// ===== Sprint 5 新增 E2E（TC-46 ~ TC-47）：详情页名称朗读喇叭 =====

// 进入「花朵」分类下的第一张卡片详情，返回该植物的中文名（Sprint 8 起卡片标题按分类派生，故取卡片图 alt 的原名）
async function enterFirstFlowerDetail(page) {
  await page.goto('/');
  const filterGroup = page.getByRole('group', { name: '植物分类筛选' });
  await filterGroup.getByText('花朵').click();
  const cards = page.locator('.plant-card');
  await expect(cards).toHaveCount(53, { timeout: 15000 }); // 等花朵列表渲染完成
  const name = await cards.first().locator('img').getAttribute('alt');
  await cards.first().click();
  await expect(page.locator('.detail-zh')).toBeVisible();
  return name;
}

// TC-46 中/英喇叭存在且热区 ≥56px
test('TC-46 详情页中/英朗读喇叭存在且热区 ≥56px', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await enterFirstFlowerDetail(page);

  const zh = page.getByRole('button', { name: '朗读中文名' });
  const en = page.getByRole('button', { name: '朗读英文名' });
  await expect(zh).toBeVisible();
  await expect(en).toBeVisible();

  for (const btn of [zh, en]) {
    const box = await btn.boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(56);
    expect(box.height).toBeGreaterThanOrEqual(56);
  }
});

// TC-47 点喇叭触发朗读调用；离开详情页时停止
test('TC-47 点喇叭触发朗读，离开详情页时停止', async ({ page }) => {
  // headless 环境无真实语音：stub 语音合成，记录被朗读的文本与 cancel 次数
  await page.addInitScript(() => {
    window.__spoken = [];
    window.__cancelCount = 0;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speak: (u) => {
          window.__spoken.push(u.text);
        },
        cancel: () => {
          window.__cancelCount += 1;
        },
        getVoices: () => [],
      },
    });
    window.SpeechSynthesisUtterance = function SpeechSynthesisUtterance(text) {
      this.text = text;
    };
  });

  const name = await enterFirstFlowerDetail(page);
  await page.getByRole('button', { name: '朗读中文名' }).click();

  await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => window.__spoken[window.__spoken.length - 1])).toBe(name);

  // 播放中离开详情页 → 立即停止
  const cancelBefore = await page.evaluate(() => window.__cancelCount);
  await page.getByRole('link', { name: /回花园/ }).click();
  await expect.poll(() => page.evaluate(() => window.__cancelCount)).toBeGreaterThan(cancelBefore);
});
