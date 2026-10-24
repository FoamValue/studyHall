import { expect } from '@playwright/test';

// Sprint 18（v2.9 书本集合）：首页改为书架，板块内容移入书内页 /books/:code。
// 进入指定书内页并等首卡出现、滚动回顶，便于后续 loadAllCards 判定。
export async function gotoBook(page, code) {
  await page.goto(`/books/${code}`);
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => window.scrollTo(0, 0));
}

// Sprint 10（EX-6）：首页植物板块（全部 / 各级分类）改为「首屏 + 滚动增量加载」。
// 断言全量条数或定位靠后卡片前，先滚动把哨兵加载完（哨兵消失 = 全量渲染）。
//
// 稳健性说明：数据到达、IO 挂载、滚动三者存在竞态，故循环终止条件为
// 「哨兵消失 且 已渲染条数达到预期」，仅凭其一判定可能早退。
export async function loadAllCards(page, expectedCount) {
  const cards = page.locator('.plant-card');
  const sentinel = page.locator('.load-sentinel');
  await expect(cards.first()).toBeVisible({ timeout: 15000 });

  // 切换板块后滚动回顶，避免上一板块的滚动位置导致 IO 哨兵竞态（Sprint 17）
  await page.evaluate(() => window.scrollTo(0, 0));

  const target = expectedCount ?? Infinity;
  for (let i = 0; i < 60; i += 1) {
    const n = await cards.count();
    const sentinelPresent = (await sentinel.count()) > 0;
    if (!sentinelPresent && n >= target) break;
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
  }

  await expect(sentinel).toHaveCount(0, { timeout: 10000 });
  if (expectedCount != null) {
    await expect(cards).toHaveCount(expectedCount, { timeout: 20000 });
  }
}
