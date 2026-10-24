import { test, expect } from '@playwright/test';
import { gotoBook, loadAllCards } from './helpers';

// ===== Sprint 16 新增 E2E（TC-148 ~ TC-155，编号依 QA 手册 docs/qa/sprint-16-test-cases.md）=====
// 覆盖：数字 0–20 / 颜色 11 色 两板块导航与列表 / 单图详情名称三行 / 返回文案派生 / 中英双音频契约 / 32 图 64 音频可达

const NUMBERS = Array.from({ length: 21 }, (_, n) => n);
const COLORS = ['black', 'white', 'red', 'green', 'yellow', 'blue', 'brown', 'purple', 'pink', 'orange', 'grey'];

// TC-148 数字书：21 张卡，首「零」末「二十」，共 21 种
test('TC-148 数字板块导航与列表', async ({ page }) => {
  await gotoBook(page, 'number');
  await expect(page.locator('.plant-card-zh').first()).toHaveText('零');

  await loadAllCards(page, 21);
  await expect(page.locator('.list-count')).toHaveText('共 21 种');
  await expect(page.locator('.plant-card')).toHaveCount(21);
  const zh = await page.locator('.plant-card-zh').allTextContents();
  expect(zh[0]).toBe('零');
  expect(zh[zh.length - 1]).toBe('二十');
});

// TC-149 颜色书：11 张卡，首「黑色」末「灰色」，共 11 种
test('TC-149 颜色板块导航与列表', async ({ page }) => {
  await gotoBook(page, 'color');
  await expect(page.locator('.plant-card-zh').first()).toHaveText('黑色');

  await loadAllCards(page, 11);
  await expect(page.locator('.list-count')).toHaveText('共 11 种');
  await expect(page.locator('.plant-card')).toHaveCount(11);
  const zh = await page.locator('.plant-card-zh').allTextContents();
  expect(zh[0]).toBe('黑色');
  expect(zh[zh.length - 1]).toBe('灰色');
});

// TC-150 数字详情：单图分支、三行名称齐全、中英喇叭各一
test('TC-150 数字单图详情与名称', async ({ page }) => {
  await page.goto('/plants/number-1');
  await expect(page.locator('.detail-zh')).toHaveText('一');
  await expect(page.locator('.detail-body')).toHaveClass(/single-image/);
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.detail-pinyin')).toHaveText('yī');
  await expect(page.locator('.detail-en')).toBeVisible();
  await expect(page.locator('.part-img')).toHaveAttribute('src', /numbers\/number-1\.jpg$/);
  await expect(page.getByRole('button', { name: '朗读中文名' })).toBeVisible();
  await expect(page.getByRole('button', { name: '朗读英文名' })).toBeVisible();
});

// TC-151 颜色详情：单图分支、无部位切换、三行名称齐全
test('TC-151 颜色单图详情', async ({ page }) => {
  await page.goto('/plants/color-red');
  await expect(page.locator('.detail-zh')).toHaveText('红色');
  await expect(page.locator('.detail-body')).toHaveClass(/single-image/);
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.detail-pinyin')).toHaveText('hóng sè');
  await expect(page.locator('.detail-en')).toBeVisible();
  await expect(page.locator('.part-img')).toHaveAttribute('src', /colors\/color-red\.jpg$/);
});

// TC-152 返回按钮文案按板块派生：数字→回数字书，颜色→回颜色书（Sprint 18 迁移）
test('TC-152 返回文案派生（数字/颜色）', async ({ page }) => {
  await gotoBook(page, 'number');
  await page.locator('.plant-card').first().click();
  const numberBack = page.locator('.imm-topbar .back-btn').first();
  await expect(numberBack).toHaveText(/回数字书/);
  await expect(numberBack).toHaveAttribute('href', '/books/number');

  // 点返回回数字书，再点「← 回书架」回书架
  await numberBack.click();
  await expect(page).toHaveURL('/books/number');
  await page.getByRole('link', { name: '← 回书架' }).click();
  await expect(page).toHaveURL('/');

  await gotoBook(page, 'color');
  await page.locator('.plant-card').first().click();
  const colorBack = page.locator('.imm-topbar .back-btn').first();
  await expect(colorBack).toHaveText(/回颜色书/);
  await expect(colorBack).toHaveAttribute('href', '/books/color');
});

// TC-153 中英双音频请求契约：number-1 zh/en、color-red zh
test('TC-153 音频请求契约', async ({ page }) => {
  await page.route('**/audio/*.m4a', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/mp4', body: '' })
  );

  await page.goto('/plants/number-1');
  const zhReq = page.waitForRequest(/\/audio\/number-1-zh\.m4a$/);
  await page.getByRole('button', { name: '朗读中文名' }).click();
  await zhReq;

  const enReq = page.waitForRequest(/\/audio\/number-1-en\.m4a$/);
  await page.getByRole('button', { name: '朗读英文名' }).click();
  await enReq;

  await page.goto('/plants/color-red');
  const colorReq = page.waitForRequest(/\/audio\/color-red-zh\.m4a$/);
  await page.getByRole('button', { name: '朗读中文名' }).click();
  await colorReq;
});

// TC-154 新增 32 张图片契约可取（HTTP 200）
test('TC-154 新增 32 图 HTTP 200', async ({ request }) => {
  for (const n of NUMBERS) {
    const res = await request.get(`/images/numbers/number-${n}.jpg`);
    expect(res.status(), `numbers/number-${n}.jpg`).toBe(200);
  }
  for (const c of COLORS) {
    const res = await request.get(`/images/colors/color-${c}.jpg`);
    expect(res.status(), `colors/color-${c}.jpg`).toBe(200);
  }
});

// TC-155 新增 64 个音频契约可取（HTTP 200）
test('TC-155 新增 64 音频 HTTP 200', async ({ request }) => {
  for (const n of NUMBERS) {
    for (const lang of ['zh', 'en']) {
      const res = await request.get(`/audio/number-${n}-${lang}.m4a`);
      expect(res.status(), `number-${n}-${lang}.m4a`).toBe(200);
    }
  }
  for (const c of COLORS) {
    for (const lang of ['zh', 'en']) {
      const res = await request.get(`/audio/color-${c}-${lang}.m4a`);
      expect(res.status(), `color-${c}-${lang}.m4a`).toBe(200);
    }
  }
});
