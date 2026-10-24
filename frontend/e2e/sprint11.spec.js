import { test, expect } from '@playwright/test';
import { gotoBook, loadAllCards } from './helpers';

// ===== Sprint 11 新增 E2E（TC-115 ~ TC-118，编号依 QA 手册 docs/qa/sprint-11-test-cases.md）=====
// 覆盖：动物/昆虫/恐龙三板块扩容至 30 的可浏览性、新增条目单图详情与音频、恐龙骨架图可加载、新图片资产契约

const ANIMAL_IDS = [
  'bear', 'cat', 'dog', 'cow', 'horse', 'pig', 'sheep', 'goat', 'chicken', 'duck',
  'owl', 'fox', 'deer', 'squirrel', 'camel', 'hippo', 'kangaroo', 'koala', 'wolf', 'whale',
];
const INSECT_IDS = [
  'moth', 'grasshopper', 'caterpillar', 'silkworm', 'wasp', 'bumblebee', 'stick-insect', 'termite', 'locust', 'damselfly',
  'fly', 'mosquito', 'spider', 'snail', 'earthworm', 'centipede', 'aphid', 'weevil', 'mayfly', 'hornet',
];
const DINOSAUR_IDS = [
  'allosaurus', 'apatosaurus', 'archaeopteryx', 'baryonyx', 'carnotaurus', 'ceratosaurus', 'compsognathus', 'deinonychus', 'dilophosaurus', 'elasmosaurus',
  'gallimimus', 'iguanodon', 'maiasaura', 'megalosaurus', 'mosasaurus', 'oviraptor', 'pachycephalosaurus', 'protoceratops', 'plateosaurus', 'styracosaurus',
];

// TC-115 动物板块扩容：可滚动加载至 50 卡 → 新增条目「鲸鱼」详情（单图分支 + 音频喇叭）
test('TC-115 动物板块扩容至 50 且新增条目详情正常', async ({ page }) => {
  await gotoBook(page, 'animal');
  await expect(page.locator('.list-count')).toHaveText('共 50 种');
  await loadAllCards(page, 50);

  // 抽查末尾新增条目卡片可见
  for (const name of ['猫', '狗', '鲸鱼']) {
    await expect(page.locator('.plant-card-zh', { hasText: name }).first()).toBeVisible();
  }

  await page.locator('.plant-card', { hasText: '鲸鱼' }).first().click();
  await expect(page.locator('.detail-zh')).toHaveText('鲸鱼');
  expect(await page.locator('.detail-body').getAttribute('class')).toContain('single-image');
  await expect(page.locator('[role="tab"]')).toHaveCount(0); // 单图分支无部位切换
  await expect(page.getByRole('button', { name: '朗读中文名' })).toBeVisible();
});

// TC-116 昆虫板块扩容：含并入的常见「小虫」（蜘蛛/蜗牛/蚯蚓/蜈蚣）
test('TC-116 昆虫板块扩容至 50 且「小虫」并入', async ({ page }) => {
  await gotoBook(page, 'insect');
  await expect(page.locator('.list-count')).toHaveText('共 50 种');
  await loadAllCards(page, 50);

  for (const name of ['蜘蛛', '蜗牛', '蚯蚓', '蜈蚣', '大胡蜂']) {
    await expect(page.locator('.plant-card-zh', { hasText: name }).first()).toBeVisible();
  }

  await page.goto('/plants/spider');
  await expect(page.locator('.detail-zh')).toHaveText('蜘蛛');
  expect(await page.locator('.detail-body').getAttribute('class')).toContain('single-image');
  await expect(page.locator('[role="tab"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '朗读中文名' })).toBeVisible();
});

// TC-117 恐龙板块扩容：完整骨架化石图可真实加载
test('TC-117 恐龙板块扩容至 50 且骨架图可加载', async ({ page }) => {
  await gotoBook(page, 'dinosaur');
  await expect(page.locator('.list-count')).toHaveText('共 50 种');
  await loadAllCards(page, 50);

  for (const name of ['戟龙', '原角龙', '翼龙']) {
    await expect(page.locator('.plant-card-zh', { hasText: name }).first()).toBeVisible();
  }

  await page.goto('/plants/styracosaurus');
  await expect(page.locator('.detail-zh')).toHaveText('戟龙');
  const img = page.locator('.part-img');
  await expect(img).toBeVisible();
  expect(await img.getAttribute('src')).toMatch(/dinosaurs\/styracosaurus\.jpg$/);
  expect(await img.evaluate((el) => el.naturalWidth)).toBeGreaterThan(0); // 图片真实可加载
  expect(await img.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
});

// TC-118 新图片资产契约：新增 60 个 id 的 .jpg 均 HTTP 200（已随 --build 进入 nginx）
test('TC-118 新增图片资产全部可取（HTTP 200）', async ({ request }) => {
  const groups = [
    ['animals', ANIMAL_IDS],
    ['insects', INSECT_IDS],
    ['dinosaurs', DINOSAUR_IDS],
  ];
  for (const [dir, ids] of groups) {
    for (const id of ids) {
      const res = await request.get(`http://localhost/images/${dir}/${id}.jpg`);
      expect(res.status(), `${dir}/${id}.jpg`).toBe(200);
    }
  }
});
