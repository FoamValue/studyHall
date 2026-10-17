import { test, expect } from '@playwright/test';
import { loadAllCards } from './helpers';

// ===== Sprint 9：详情页名称预生成音频（.m4a）播放 =====

// 进入「花朵」分类下的第一张卡片详情，返回该植物的中文名（Sprint 8 起卡片标题按分类派生，故取卡片图 alt 的原名）
async function enterFirstFlowerDetail(page) {
  await page.goto('/');
  const filterGroup = page.getByRole('group', { name: '植物分类筛选' });
  await filterGroup.getByText('花朵').click();
  const cards = page.locator('.plant-card');
  await loadAllCards(page, 53); // 增量加载：滚动至全量
  await page.evaluate(() => window.scrollTo(0, 0));
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

// TC-47 点喇叭播放预生成音频；离开详情页时停止（pause）
test('TC-47 点喇叭播放预生成音频，离开详情页时暂停', async ({ page }) => {
  // headless 环境无真实音频：桩 HTMLAudioElement，记录被播放的 src 与 pause 次数
  await page.addInitScript(() => {
    window.__played = [];
    window.__pauseCount = 0;
    window.Audio = function MockAudio(src) {
      this.src = src || '';
      this.currentTime = 0;
      this.play = () => {
        window.__played.push(this.src);
        return Promise.resolve();
      };
      this.pause = () => {
        window.__pauseCount += 1;
      };
    };
  });

  await enterFirstFlowerDetail(page);
  await page.getByRole('button', { name: '朗读中文名' }).click();

  await expect.poll(() => page.evaluate(() => window.__played.length)).toBeGreaterThan(0);
  // 播放的是名称读音（.m4a），而非语音合成
  expect(await page.evaluate(() => window.__played[window.__played.length - 1])).toMatch(
    /-zh\.m4a$/
  );

  // 播放中离开详情页 → 立即停止（pause）
  const pauseBefore = await page.evaluate(() => window.__pauseCount);
  await page.getByRole('link', { name: /回花园/ }).click();
  await expect.poll(() => page.evaluate(() => window.__pauseCount)).toBeGreaterThan(pauseBefore);
});
