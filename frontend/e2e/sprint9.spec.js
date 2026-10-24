import { test, expect } from '@playwright/test';
import { gotoBook, loadAllCards } from './helpers';

// ===== Sprint 9 新增 E2E（TC-89 ~ TC-95，编号依 QA 手册 docs/qa/sprint-9-test-cases.md）=====
// 覆盖：站点改名 / 书架两层八本 / 单图详情无部位切换 / 恐龙骨架 / 预生成音频请求 / 排序稳定 / 植物书限定板块

// TC-89 站点改名「认知小图鉴 / rèn zhī xiǎo tú jiàn / Cognitive Guide」（Sprint 15 更名）
test('TC-89 站点标题改名为「认知小图鉴」', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-title-zh')).toHaveText('认知小图鉴');
  await expect(page.locator('.site-title-pinyin')).toHaveText('rèn zhī xiǎo tú jiàn');
  await expect(page.locator('.site-title-en')).toHaveText('Cognitive Guide');
  await expect(page.getByText('自然小图鉴')).toHaveCount(0);
});

// TC-90 书架两层八本（Sprint 18 迁移：原板块导航八钮改写）；各书内列表可浏览
test('TC-90 书架两层八本且各书可浏览', async ({ page }) => {
  await page.goto('/');
  const shelf = page.locator('.bookshelf');
  // 两层：自然认知 4 + 认知启蒙 4
  await expect(shelf.locator('.shelf-row')).toHaveCount(2);
  await expect(shelf.locator('.shelf-title')).toHaveText(['自然认知', '认知启蒙']);
  await expect(page.locator('.book')).toHaveCount(8);
  for (const name of ['植物书', '动物书', '昆虫书', '恐龙书', '英文字母书', '汉语拼音书', '数字书', '颜色书']) {
    await expect(page.locator('.book-title-zh', { hasText: name })).toHaveCount(1);
  }

  // 植物书 204 条展示（语料 206 条中 2 条命名冲突废弃不展示）
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  // 动物 / 昆虫 / 恐龙书各 50 种（Sprint 14 扩容：30 → 50）
  for (const code of ['animal', 'insect', 'dinosaur']) {
    await gotoBook(page, code);
    await loadAllCards(page, 50);
  }
});

// TC-91 动物单图详情：不渲染部位切换，渲染大图与说明 + 小知识
test('TC-91a 动物单图详情无部位切换', async ({ page }) => {
  await page.goto('/plants/giant-panda');
  await expect(page.locator('.detail-zh')).toHaveText('大熊猫');
  // 无部位切换条
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  // 大图 + 说明 + 小知识卡片
  await expect(page.locator('.part-img')).toHaveAttribute('src', /giant-panda\.jpg$/);
  await expect(page.locator('.part-desc')).toBeVisible();
  await expect(page.getByRole('region', { name: '小知识' })).toBeVisible();
});

// TC-91b 植物详情现为单图模式（Sprint 17）：无部位切换，横竖屏均正常
for (const viewport of [
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
]) {
  test(`TC-91b 植物详情 ${viewport.width}x${viewport.height} 单图无部位切换`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/plants/apple-flower');
    await expect(page.locator('.detail-zh')).toHaveText('苹果花');
    await expect(page.locator('[role="tab"]')).toHaveCount(0);
    await expect(page.locator('.part-img')).toBeVisible();
  });
}

// TC-92 恐龙板块：完整骨架化石图片 + 单图详情
test('TC-92 恐龙详情为完整骨架化石单图', async ({ page }) => {
  await page.goto('/plants/tyrannosaurus');
  await expect(page.locator('.detail-zh')).toHaveText('霸王龙');
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.locator('.part-img')).toHaveAttribute('src', /dinosaurs\/tyrannosaurus\.jpg$/);
  await expect(page.getByRole('region', { name: '小知识' })).toBeVisible();
});

// TC-93 预生成音频：点中文喇叭向后端请求 /audio/{id}-zh.m4a（AAC .m4a）
test('TC-93 点中文喇叭请求预生成 m4a 音频', async ({ page }) => {
  // 用 route 桩住音频响应，断言请求 URL 契约（不依赖 headless 是否解码 AAC）
  await page.route('**/audio/*.m4a', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/mp4', body: '' })
  );
  await page.goto('/plants/giant-panda');
  const zhReq = page.waitForRequest(/\/audio\/giant-panda-zh\.m4a$/);
  await page.getByRole('button', { name: '朗读中文名' }).click();
  await zhReq;

  const enReq = page.waitForRequest(/\/audio\/giant-panda-en\.m4a$/);
  await page.getByRole('button', { name: '朗读英文名' }).click();
  await enReq;
});

// TC-94 排序稳定性：动物书列表按 sort ASC + id ASC，刷新后顺序一致
test('TC-94 板块列表顺序稳定（sort ASC）', async ({ page }) => {
  await gotoBook(page, 'animal');
  await loadAllCards(page, 50);
  const first = await page.locator('.plant-card-zh').allTextContents();

  await page.reload();
  await gotoBook(page, 'animal');
  await loadAllCards(page, 50);
  const second = await page.locator('.plant-card-zh').allTextContents();

  expect(first).toEqual(second);
  expect(first[0]).toBe('大熊猫'); // sort=1
});

// TC-95 植物书仅植物条目（不混入动物/昆虫/恐龙）
test('TC-95 植物板块仅植物条目', async ({ page }) => {
  await gotoBook(page, 'plant');
  // Sprint 17：植物 100 株拆为 206 条部位条目（2 条废弃不展示，页面 204 条）
  await loadAllCards(page, 204);
  await expect(page.locator('.plant-card-zh', { hasText: '大熊猫' })).toHaveCount(0);
  await expect(page.locator('.plant-card-zh', { hasText: '霸王龙' })).toHaveCount(0);
});
