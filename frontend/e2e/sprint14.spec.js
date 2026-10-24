import { test, expect } from '@playwright/test';
import { gotoBook, loadAllCards } from './helpers';

// ===== Sprint 14 新增 E2E（TC-130 ~ TC-133，编号依 QA 手册 docs/qa/sprint-14-test-cases.md）=====
// 覆盖：动物/昆虫/恐龙三板块扩容至 50 的可浏览性、新增条目单图详情与音频、新图片/音频资产契约

const NEW_ANIMAL_IDS = [
  'leopard', 'rhinoceros', 'gorilla', 'chimpanzee', 'crocodile', 'snake', 'turtle', 'frog', 'shark', 'seal',
  'otter', 'hedgehog', 'bat', 'mouse', 'hamster', 'donkey', 'swan', 'eagle', 'peacock', 'ostrich',
];
const NEW_INSECT_IDS = [
  'cockroach', 'scorpion', 'millipede', 'slug', 'rhinoceros-beetle', 'stag-beetle', 'dung-beetle', 'katydid', 'water-strider', 'woodlouse',
  'hermit-crab', 'flea', 'leech', 'antlion', 'silverfish', 'lacewing', 'leafhopper', 'stink-bug', 'diving-beetle', 'shrimp',
];
const NEW_DINOSAUR_IDS = [
  'brontosaurus', 'camarasaurus', 'mamenchisaurus', 'argentinosaurus', 'amargasaurus', 'corythosaurus', 'lambeosaurus', 'edmontosaurus', 'stegoceras', 'centrosaurus',
  'euoplocephalus', 'edmontonia', 'therizinosaurus', 'giganotosaurus', 'acrocanthosaurus', 'utahraptor', 'microraptor', 'troodon', 'plesiosaurus', 'pterodactyl',
];

// TC-130 三板块扩容至 50：各「共 50 种」→ 滚动加载至 50 卡 → 末位新增条目可见
test('TC-130 三板块扩容至 50 且末位新增条目可见', async ({ page }) => {
  // first = 该板块首屏（sort 升序首条）专属卡片：进入每本书后先等它出现，
  // 避免残留竞态导致 loadAllCards 早退。
  const cases = [
    ['animal', '大熊猫', '鸵鸟'],
    ['insect', '蝴蝶', '小虾'],
    ['dinosaur', '霸王龙', '翼手龙'],
  ];
  for (const [code, first, last] of cases) {
    await gotoBook(page, code);
    await expect(page.locator('.list-count')).toHaveText('共 50 种');
    await expect(page.locator('.plant-card-zh', { hasText: first }).first()).toBeVisible();
    await loadAllCards(page, 50);
    await expect(page.locator('.plant-card-zh', { hasText: last }).first()).toBeVisible();
  }
});

// TC-131 新增条目详情抽查：单图分支（无部位切换）+ 音频喇叭渲染
test('TC-131 新增条目单图详情与音频喇叭', async ({ page }) => {
  const cases = [
    ['ostrich', '鸵鸟'],
    ['shrimp', '小虾'],
    ['pterodactyl', '翼手龙'],
  ];
  for (const [id, zh] of cases) {
    await page.goto(`/plants/${id}`);
    await expect(page.locator('.detail-zh')).toHaveText(zh);
    expect(await page.locator('.detail-body').getAttribute('class')).toContain('single-image');
    await expect(page.locator('[role="tab"]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '朗读中文名' })).toBeVisible();
  }
});

// TC-132 新图片资产契约：新增 60 个 id 的 .jpg 均 HTTP 200（已随 --build 进入 nginx）
test('TC-132 新增图片资产全部可取（HTTP 200）', async ({ request }) => {
  const groups = [
    ['animals', NEW_ANIMAL_IDS],
    ['insects', NEW_INSECT_IDS],
    ['dinosaurs', NEW_DINOSAUR_IDS],
  ];
  for (const [dir, ids] of groups) {
    for (const id of ids) {
      const res = await request.get(`http://localhost/images/${dir}/${id}.jpg`);
      expect(res.status(), `${dir}/${id}.jpg`).toBe(200);
    }
  }
});

// TC-133 新音频资产契约：新增 60 条 zh/en 音频（120 个 .m4a）均 HTTP 200
test('TC-133 新增音频资产全部可取（HTTP 200）', async ({ request }) => {
  const ids = [...NEW_ANIMAL_IDS, ...NEW_INSECT_IDS, ...NEW_DINOSAUR_IDS];
  for (const id of ids) {
    for (const lang of ['zh', 'en']) {
      const res = await request.get(`http://localhost/audio/${id}-${lang}.m4a`);
      expect(res.status(), `${id}-${lang}.m4a`).toBe(200);
    }
  }
});
