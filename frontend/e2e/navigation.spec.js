import { test, expect } from '@playwright/test';
import { loadAllCards } from './helpers';

// ===== Sprint 4 新增 E2E（TC-35 ~ TC-40）：沉浸式详情 / 连续换株 / 全屏 / 状态记忆 =====
// Sprint 17：植物取消二级分类，所有部位条目同属 plant 板块（204 条展示，2 条废弃不展示）

// 进入植物板块第一张卡片详情，返回该条目中文名
async function enterFirstPlantDetail(page) {
  await page.goto('/');
  const cards = page.locator('.plant-card');
  await loadAllCards(page, 204);
  await page.evaluate(() => window.scrollTo(0, 0));
  const name = await cards.first().locator('img').getAttribute('alt');
  await cards.first().click();
  await expect(page.locator('.detail-zh')).toBeVisible();
  return name;
}

const detailName = (page) => page.locator('.detail-zh').textContent();

// TC-35 三通道换植物行为一致：按钮 / 键盘 → / 左滑，各切一次后落到同一株
test('TC-35 按钮 / 键盘 / 左滑三种方式换到同一株', async ({ page }) => {
  const startName = await enterFirstPlantDetail(page);

  // ① 点「下一株」按钮
  await page.getByRole('button', { name: '下一株' }).click();
  await expect(page.locator('.detail-zh')).not.toHaveText(startName);
  const viaButton = await detailName(page);

  // ② 键盘 →
  await enterFirstPlantDetail(page);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.detail-zh')).not.toHaveText(startName);
  const viaKeyboard = await detailName(page);

  // ③ 左滑（在沉浸式容器上派发触摸序列）
  await enterFirstPlantDetail(page);
  await page.evaluate(() => {
    const el = document.querySelector('.detail-immersive');
    const touch = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 });
    const fire = (type, x) =>
      el.dispatchEvent(
        new TouchEvent(type, {
          bubbles: true,
          cancelable: true,
          touches: type === 'touchend' ? [] : [touch(x)],
          changedTouches: [touch(x)],
        })
      );
    fire('touchstart', 500);
    fire('touchend', 300); // 向左滑 200px → 下一株
  });
  await expect(page.locator('.detail-zh')).not.toHaveText(startName);
  const viaSwipe = await detailName(page);

  expect(viaKeyboard).toBe(viaButton);
  expect(viaSwipe).toBe(viaButton);
});

// TC-36 首尾循环：植物列表首张的「上一株」= 末张；末张的「下一株」= 首张
test('TC-36 首尾循环（植物板块）', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('.plant-card');
  await loadAllCards(page, 204);
  const firstName = await cards.first().locator('img').getAttribute('alt');
  const lastName = await cards.last().locator('img').getAttribute('alt');
  expect(firstName).not.toBe(lastName);

  // 首张 → 上一株 → 应循环到末张
  await cards.first().click();
  await expect(page.locator('.detail-zh')).toHaveText(firstName);
  await page.getByRole('button', { name: '上一株' }).click();
  await expect(page.locator('.detail-zh')).toHaveText(lastName);

  // 末张 → 下一株 → 应循环回首张
  await page.goto('/');
  await loadAllCards(page, 204);
  await cards.last().click();
  await expect(page.locator('.detail-zh')).toHaveText(lastName);
  await page.getByRole('button', { name: '下一株' }).click();
  await expect(page.locator('.detail-zh')).toHaveText(firstName);
});

// TC-37 系统全屏进出不丢位置
test('TC-37 全屏进出后当前植物不变', async ({ page }) => {
  await enterFirstPlantDetail(page);
  const nameBefore = await detailName(page);

  const supported = await page.evaluate(() => Boolean(document.fullscreenEnabled));
  test.skip(!supported, '当前浏览器不支持 Fullscreen API');

  await page.getByRole('button', { name: '全屏', exact: true }).click();
  await expect(page.getByRole('button', { name: '退出全屏', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);

  // 点「退出全屏」回沉浸式态，植物不变（Esc 为浏览器原生行为，同一 fullscreenchange 路径）
  await page.getByRole('button', { name: '退出全屏', exact: true }).click();
  await expect(page.getByRole('button', { name: '全屏', exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
  expect(await detailName(page)).toBe(nameBefore);
});

// TC-38 沉浸式态：无页面级滚动条，图片完整不裁切
test('TC-38 沉浸式无页面级滚动条且图片完整', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await enterFirstPlantDetail(page);

  const overflow = await page.evaluate(() => {
    const d = document.documentElement;
    return d.scrollHeight - d.clientHeight;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  const img = page.locator('.part-img');
  await expect(img).toBeVisible();
  expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
});

// TC-39 返回首页保住列表滚动位置（Sprint 17：无分类筛选，仅保滚动）
test('TC-39 回花园保住滚动位置', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  const cards = page.locator('.plant-card');
  await loadAllCards(page, 204);

  await page.evaluate(() => window.scrollTo(0, 1200));
  await cards.nth(12).click();
  await expect(page.locator('.detail-zh')).toBeVisible();

  await page.getByRole('link', { name: /回花园/ }).click();
  await expect(cards.first()).toBeVisible({ timeout: 15000 });

  // 列表滚动位置已恢复（未回到顶部）
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY).toBeGreaterThan(0);
});

// TC-40 平板尺寸（1024×768 横屏 / 768×1024 竖屏）适配
for (const viewport of [
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
]) {
  test(`TC-40 平板 ${viewport.width}x${viewport.height} 沉浸式适配`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterFirstPlantDetail(page);

    await expect(page.locator('.part-img')).toBeVisible();

    // 触控目标 ≥56px
    const navHeight = await page
      .getByRole('button', { name: '下一株' })
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(navHeight).toBeGreaterThanOrEqual(56);

    const backHeight = await page
      .getByRole('link', { name: /回花园/ })
      .evaluate((el) => el.getBoundingClientRect().height);
    expect(backHeight).toBeGreaterThanOrEqual(56);

    // 无页面级滚动条
    const overflow = await page.evaluate(() => {
      const d = document.documentElement;
      return d.scrollHeight - d.clientHeight;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
