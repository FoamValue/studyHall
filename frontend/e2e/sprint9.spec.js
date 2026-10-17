import { test, expect } from '@playwright/test';
import { loadAllCards } from './helpers';

// ===== Sprint 9 新增 E2E（TC-89 ~ TC-95，编号依 QA 手册 docs/qa/sprint-9-test-cases.md）=====
// 覆盖：站点改名 / 四板块两级导航 / 单图详情无部位切换 / 恐龙骨架 / 预生成音频请求 / 排序稳定 / 植物「全部」限定板块

// TC-89 站点改名「自然小图鉴 / zì rán xiǎo tú jiàn / Nature Guide」
test('TC-89 站点标题改名为「自然小图鉴」', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.site-title-zh')).toHaveText('自然小图鉴');
  await expect(page.locator('.site-title-pinyin')).toHaveText('zì rán xiǎo tú jiàn');
  await expect(page.locator('.site-title-en')).toHaveText('Nature Guide');
  await expect(page.getByText('植物小花园')).toHaveCount(0);
});

// TC-90 四板块一级导航；仅植物板块渲染二级分类筛选（二级筛选只有植物 3 分类 + 全部 = 4 钮）
test('TC-90 板块导航四钮且二级筛选仅植物板块', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('group', { name: '板块导航' });
  await expect(nav.locator('.filter-btn')).toHaveCount(4);
  for (const label of ['植物', '动物', '昆虫', '恐龙']) {
    await expect(nav.getByRole('button', { name: label })).toBeVisible();
  }
  // 默认植物板块：二级分类筛选可见，四钮（全部/花朵/树叶/果实），不含板块分类
  const filterGroup = page.getByRole('group', { name: '植物分类筛选' });
  await expect(filterGroup.locator('.filter-btn')).toHaveCount(4);
  await expect(filterGroup.getByRole('button', { name: '动物' })).toHaveCount(0);

  // 切到动物板块：二级筛选消失，渲染 30 种动物卡片（Sprint 11 扩容：10 → 30）
  await nav.getByRole('button', { name: '动物' }).click();
  await expect(page.getByRole('group', { name: '植物分类筛选' })).toHaveCount(0);
  await loadAllCards(page, 30);

  // 昆虫 / 恐龙板块同样平铺 30 种
  await nav.getByRole('button', { name: '昆虫' }).click();
  await loadAllCards(page, 30);
  await nav.getByRole('button', { name: '恐龙' }).click();
  await loadAllCards(page, 30);
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

// TC-91b 植物详情仍保留部位切换（单图分支不误伤），横竖屏均正常
for (const viewport of [
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
]) {
  test(`TC-91b 植物详情 ${viewport.width}x${viewport.height} 保留部位切换`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/plants/apple');
    await expect(page.locator('.detail-zh')).toHaveText('苹果');
    await expect(page.locator('[role="tab"]')).toHaveCount(3);
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

// TC-94 排序稳定性：动物板块列表按 sort ASC + id ASC，刷新后顺序一致
test('TC-94 板块列表顺序稳定（sort ASC）', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('group', { name: '板块导航' });

  await nav.getByRole('button', { name: '动物' }).click();
  await loadAllCards(page, 30);
  const first = await page.locator('.plant-card-zh').allTextContents();

  await page.reload();
  await page.getByRole('group', { name: '板块导航' }).getByRole('button', { name: '动物' }).click();
  await loadAllCards(page, 30);
  const second = await page.locator('.plant-card-zh').allTextContents();

  expect(first).toEqual(second);
  expect(first[0]).toBe('大熊猫'); // sort=1
});

// TC-95 植物板块「全部」限定板块内（不混入动物/昆虫/恐龙）
test('TC-95 植物板块「全部」仅植物条目', async ({ page }) => {
  await page.goto('/');
  // Sprint 10（EX-6）：植物「全部」改为增量加载，滚动至全量后再断言恰好 100 张
  await loadAllCards(page, 100);
  await expect(page.locator('.plant-card-zh', { hasText: '大熊猫' })).toHaveCount(0);
  await expect(page.locator('.plant-card-zh', { hasText: '霸王龙' })).toHaveCount(0);
});
