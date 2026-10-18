import { test, expect } from '@playwright/test';
import { loadAllCards } from './helpers';

// ===== Sprint 6 新增 E2E（TC-48 ~ TC-52）：详情页整屏不滚动（iPad 为基准设备） =====

// 进入植物板块第一张卡片详情（先滚动加载全量，再点首张）
async function enterFirstPlantDetail(page) {
  await page.goto('/');
  await loadAllCards(page, 204);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator('.plant-card').first().click();
  await expect(page.locator('.detail-zh')).toBeVisible();
}

// 页面级纵向溢出（文档高度 - 视口高度）
const pageOverflow = (page) =>
  page.evaluate(
    () => document.documentElement.scrollHeight - document.documentElement.clientHeight
  );

// 内容区纵向溢出（内容区自身可滚动量）
const bodyOverflow = (page) =>
  page.evaluate(() => {
    const db = document.querySelector('.detail-body');
    return db ? db.scrollHeight - db.clientHeight : null;
  });

// TC-48 iPad 横屏（1024×768 / 1180×820）沉浸式态整屏不滚动
for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1180, height: 820 },
]) {
  test(`TC-48 iPad 横屏 ${viewport.width}x${viewport.height} 沉浸式整屏不滚动`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterFirstPlantDetail(page);

    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
    expect(await bodyOverflow(page)).toBeLessThanOrEqual(1);
  });
}

// TC-49 iPad 竖屏（768×1024 / 820×1180）沉浸式态整屏不滚动
for (const viewport of [
  { width: 768, height: 1024 },
  { width: 820, height: 1180 },
]) {
  test(`TC-49 iPad 竖屏 ${viewport.width}x${viewport.height} 沉浸式整屏不滚动`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterFirstPlantDetail(page);

    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
    expect(await bodyOverflow(page)).toBeLessThanOrEqual(1);
  });
}

// TC-50 全屏态整屏不滚动，且滚动不改变文档滚动位置
test('TC-50 全屏态整屏不滚动且滚动不改变文档滚动位置', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await enterFirstPlantDetail(page);

  const supported = await page.evaluate(() => Boolean(document.fullscreenEnabled));
  test.skip(!supported, '当前浏览器不支持 Fullscreen API');

  await page.getByRole('button', { name: '全屏', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);

  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

  const pos = () =>
    page.evaluate(() => ({
      win: Math.round(window.scrollY),
      doc: Math.round(document.documentElement.scrollTop),
    }));
  const before = await pos();

  // 在内容区与页面各派发一次滚动
  await page.mouse.move(512, 384);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(200);
  await page.mouse.move(12, 12);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(200);

  const after = await pos();
  expect(after.win).toBe(before.win);
  expect(after.doc).toBe(before.doc);
  expect(after.win).toBe(0);
});

// TC-51 图片完整不裁切且不溢出容器/视口
test('TC-51 图片完整不裁切且不溢出视口', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await enterFirstPlantDetail(page);

  const img = page.locator('.part-img');
  await expect(img).toBeVisible();
  expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');

  const box = await img.boundingBox();
  const vp = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
});

// TC-52 长文案植物（含典故）不产生页面滚动且文字完整
test('TC-52 长文案植物（含典故）不产生页面滚动且文字完整', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto('/plants/azalea-flower');
  await expect(page.locator('.detail-zh')).toBeVisible();

  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

  await expect(page.locator('.part-desc')).toBeVisible();
  const allusion = page.locator('.allusion-text');
  await expect(allusion).toBeVisible();
  // 文字完整落在视口内（未被裁切/推出屏幕）
  const box = await allusion.boundingBox();
  expect(box.y + box.height).toBeLessThanOrEqual(1024 + 1);
});

// ===== Sprint 7 新增 E2E（TC-61 ~ TC-62）：横屏详情图片放大（EX-2） =====

// 页面级水平溢出（文档宽度 - 视口宽度）
const hOverflow = (page) =>
  page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );

// TC-61 横屏详情「左图 + 右文字」两栏：图片占满左栏且无溢出
for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1180, height: 820 },
]) {
  test(`TC-61 横屏 ${viewport.width}x${viewport.height} 左图右文两栏且无溢出`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await enterFirstPlantDetail(page);

    // 细节：横屏下 .detail-body 已改为 grid，图片占左栏约 48% 宽（旧规则上限 40%）
    const bodyWidth = (await page.locator('.detail-body').boundingBox()).width;
    const box = await page.locator('.part-img').boundingBox();
    expect(box.width).toBeGreaterThan(bodyWidth * 0.42);

    // 右栏文字确实排在图片右侧（两栏不重叠）
    const content = await page.locator('.part-content').boundingBox();
    expect(content.x).toBeGreaterThanOrEqual(box.x + box.width);

    // 图片完整落在视口内（无水平/纵向溢出）
    const vp = page.viewportSize();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
    expect(await hOverflow(page)).toBeLessThanOrEqual(1);
    expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  });
}

// TC-62 横屏长文案植物（杜鹃花）放大图片后文字仍不溢出
test('TC-62 横屏长文案植物（杜鹃花）图片放大后不溢出', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/plants/azalea-flower');
  await expect(page.locator('.detail-zh')).toBeVisible();

  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  expect(await hOverflow(page)).toBeLessThanOrEqual(1);

  await expect(page.locator('.part-desc')).toBeVisible();
  const allusion = page.locator('.allusion-text');
  await expect(allusion).toBeVisible();
  const box = await allusion.boundingBox();
  expect(box.x + box.width).toBeLessThanOrEqual(1024 + 1);
});
