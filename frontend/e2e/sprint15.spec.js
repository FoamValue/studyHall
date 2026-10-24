import { test, expect } from '@playwright/test';
import { gotoBook, loadAllCards } from './helpers';

// ===== Sprint 15 新增 E2E（TC-134 ~ TC-142，编号依 QA 手册 docs/qa/sprint-15-test-cases.md）=====
// 覆盖：站点更名 + 书架两层八本 / 字母·拼音各 26 卡 / 单图详情 / 单语音频请求契约 / 返回文案派生 / 新增 52 图 52 音频契约

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const PINYINS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// TC-134 更名「认知小图鉴」+ 书架两层八本（Sprint 18 迁移）
test('TC-134 站点更名与书架两层八本', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-title-pinyin')).toHaveText('rèn zhī xiǎo tú jiàn');
  await expect(page.locator('.site-title-zh')).toHaveText('认知小图鉴');
  await expect(page.locator('.site-title-en')).toHaveText('Cognitive Guide');

  const shelf = page.locator('.bookshelf');
  await expect(shelf.locator('.shelf-title')).toHaveText(['自然认知', '认知启蒙']);
  await expect(page.locator('.book')).toHaveCount(8);
  await expect(page.locator('.book-title-zh', { hasText: '英文字母书' })).toHaveCount(1);
  await expect(page.locator('.book-title-zh', { hasText: '汉语拼音书' })).toHaveCount(1);
});

// TC-135 英文字母书：26 张卡，首 Aa 末 Zz
test('TC-135 英文字母板块 26 张卡', async ({ page }) => {
  await gotoBook(page, 'letter');
  await expect(page.locator('.plant-card-zh').first()).toHaveText('Aa');

  await loadAllCards(page, 26);
  await expect(page.locator('.list-count')).toHaveText('共 26 种');
  await expect(page.locator('.plant-card')).toHaveCount(26);
  const zh = await page.locator('.plant-card-zh').allTextContents();
  expect(zh[0]).toBe('Aa');
  expect(zh[zh.length - 1]).toBe('Zz');
});

// TC-136 汉语拼音书：26 张卡，首 a 末 z
test('TC-136 汉语拼音板块 26 张卡', async ({ page }) => {
  await gotoBook(page, 'pinyin');
  await expect(page.locator('.plant-card-zh').first()).toHaveText('a');

  await loadAllCards(page, 26);
  await expect(page.locator('.list-count')).toHaveText('共 26 种');
  await expect(page.locator('.plant-card')).toHaveCount(26);
  const zh = await page.locator('.plant-card-zh').allTextContents();
  expect(zh[0]).toBe('a');
  expect(zh[zh.length - 1]).toBe('z');
});

// TC-137 字母详情：单图分支、名称仅 Aa、无拼音/英文行、仅英文喇叭
test('TC-137 英文字母单图详情', async ({ page }) => {
  await page.goto('/plants/letter-a');
  await expect(page.locator('.detail-zh')).toHaveText('Aa');
  await expect(page.locator('.detail-body')).toHaveClass(/single-image/);
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.detail-pinyin')).toHaveCount(0);
  await expect(page.locator('.detail-en')).toHaveCount(0);
  await expect(page.locator('.part-img')).toHaveAttribute('src', /letters\/letter-a\.jpg$/);
  await expect(page.getByRole('button', { name: '朗读英文名' })).toBeVisible();
  await expect(page.getByRole('button', { name: '朗读中文名' })).toHaveCount(0);
});

// TC-138 拼音详情：单图分支、名称仅 a、无拼音/英文行、仅中文喇叭
test('TC-138 汉语拼音单图详情', async ({ page }) => {
  await page.goto('/plants/pinyin-a');
  await expect(page.locator('.detail-zh')).toHaveText('a');
  await expect(page.locator('.detail-body')).toHaveClass(/single-image/);
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.detail-pinyin')).toHaveCount(0);
  await expect(page.locator('.detail-en')).toHaveCount(0);
  await expect(page.locator('.part-img')).toHaveAttribute('src', /pinyin\/pinyin-a\.jpg$/);
  await expect(page.getByRole('button', { name: '朗读中文名' })).toBeVisible();
  await expect(page.getByRole('button', { name: '朗读英文名' })).toHaveCount(0);
});

// TC-139 单语音频请求契约：字母 en / 拼音 zh
test('TC-139 单语音频请求契约', async ({ page }) => {
  await page.route('**/audio/*.m4a', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/mp4', body: '' })
  );

  await page.goto('/plants/letter-a');
  const enReq = page.waitForRequest(/\/audio\/letter-a-en\.m4a$/);
  await page.getByRole('button', { name: '朗读英文名' }).click();
  await enReq;

  await page.goto('/plants/pinyin-a');
  const zhReq = page.waitForRequest(/\/audio\/pinyin-a-zh\.m4a$/);
  await page.getByRole('button', { name: '朗读中文名' }).click();
  await zhReq;
});

// TC-140 返回按钮文案按板块派生：字母→回英文字母书，拼音→回汉语拼音书（Sprint 18 迁移）
test('TC-140 返回文案派生（字母/拼音）', async ({ page }) => {
  await gotoBook(page, 'letter');
  await page.locator('.plant-card').first().click();
  const letterBack = page.locator('.imm-topbar .back-btn').first();
  await expect(letterBack).toHaveText(/回英文字母书/);
  await expect(letterBack).toHaveAttribute('href', '/books/letter');

  // 点返回回字母书，再点「← 回书架」回书架
  await letterBack.click();
  await expect(page).toHaveURL('/books/letter');
  await page.getByRole('link', { name: '← 回书架' }).click();
  await expect(page).toHaveURL('/');

  await gotoBook(page, 'pinyin');
  await page.locator('.plant-card').first().click();
  const pinyinBack = page.locator('.imm-topbar .back-btn').first();
  await expect(pinyinBack).toHaveText(/回汉语拼音书/);
  await expect(pinyinBack).toHaveAttribute('href', '/books/pinyin');
});

// TC-141 新增 52 张图片契约可取（HTTP 200）
test('TC-141 新增 52 图 HTTP 200', async ({ request }) => {
  for (const x of LETTERS) {
    const res = await request.get(`/images/letters/letter-${x}.jpg`);
    expect(res.status(), `letters/letter-${x}.jpg`).toBe(200);
  }
  for (const x of PINYINS) {
    const res = await request.get(`/images/pinyin/pinyin-${x}.jpg`);
    expect(res.status(), `pinyin/pinyin-${x}.jpg`).toBe(200);
  }
});

// TC-142 新增 52 个音频契约可取（HTTP 200）
test('TC-142 新增 52 音频 HTTP 200', async ({ request }) => {
  for (const x of LETTERS) {
    const res = await request.get(`/audio/letter-${x}-en.m4a`);
    expect(res.status(), `letter-${x}-en.m4a`).toBe(200);
  }
  for (const x of PINYINS) {
    const res = await request.get(`/audio/pinyin-${x}-zh.m4a`);
    expect(res.status(), `pinyin-${x}-zh.m4a`).toBe(200);
  }
});
