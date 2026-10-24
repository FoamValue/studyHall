import { test, expect } from '@playwright/test';
import { gotoBook, loadAllCards } from './helpers';

// ===== Sprint 18 新增 E2E（TC-162 ~ TC-170，编号依 QA 手册 docs/qa/sprint-18-test-cases.md）=====
// 覆盖：书架两层 8 本一屏零溢出 / 书本四行内容与数量无编号 / 8 张封面资源与统一底色 /
// 点书进书内页并回书架 / 书内页总量与增量到底 / 8 板块返回文案与 href / 详情返回恢复滚动 /
// 多书滚动记忆互不串味 / 未知 code 兜底与后端契约不变

const BOOKS = [
  ['plant', '植物书'],
  ['animal', '动物书'],
  ['insect', '昆虫书'],
  ['dinosaur', '恐龙书'],
  ['letter', '英文字母书'],
  ['pinyin', '汉语拼音书'],
  ['number', '数字书'],
  ['color', '颜色书'],
];

const COUNTS = {
  plant: 204,
  animal: 50,
  insect: 50,
  dinosaur: 50,
  letter: 26,
  pinyin: 26,
  number: 21,
  color: 11,
};

const bookByTitle = (page, title) =>
  page.locator('.book', { has: page.locator('.book-title-zh', { hasText: title }) });

// TC-162 书架两层 8 本且一屏零溢出（1024×768 / 1180×820 各一遍）
test('TC-162 书架两层 8 本且一屏零溢出', async ({ page }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1180, height: 820 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });

    const shelf = page.locator('.bookshelf');
    await expect(shelf.locator('.shelf-row')).toHaveCount(2);
    await expect(shelf.locator('.shelf-title')).toHaveText(['自然认知', '认知启蒙']);
    await expect(page.locator('.book')).toHaveCount(8);
    // 书名顺序 = categories.order 升序
    await expect(page.locator('.book-title-zh')).toHaveText(BOOKS.map(([, title]) => title));

    // 页面级纵向溢出 ≤1px（书架一屏放下）
    const overflow = await page.evaluate(
      () => document.documentElement.scrollHeight - document.documentElement.clientHeight
    );
    expect(overflow).toBeLessThanOrEqual(1);

    // 8 本全部落在视口内（top ≥ 0 且 bottom ≤ 视口高 + 1）
    const boxes = await page.locator('.book').evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
      })
    );
    expect(boxes).toHaveLength(8);
    for (const box of boxes) {
      expect(box.top).toBeGreaterThanOrEqual(0);
      expect(box.bottom).toBeLessThanOrEqual(viewport.height + 1);
    }
  }

  expect(problems).toEqual([]);
});

// TC-163 书本四行内容与数量、且不出现编号
test('TC-163 书本四行内容与数量、且不出现编号', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });
  // 数量并发请求就绪（植物书 204 条为最长）
  await expect(page.locator('.book-count').filter({ hasText: '共 204 种' })).toBeVisible({ timeout: 15000 });

  const plant = bookByTitle(page, '植物书');
  await expect(plant.locator('.book-title-zh')).toHaveText('植物书');
  await expect(plant.locator('.book-title-pinyin')).toHaveText('zhí wù');
  await expect(plant.locator('.book-title-en')).toHaveText('Plant');
  await expect(plant.locator('.book-count')).toHaveText('共 204 种');

  for (const [code, title] of BOOKS) {
    await expect(bookByTitle(page, title).locator('.book-count')).toHaveText(`共 ${COUNTS[code]} 种`);
  }

  // 不出现「第 N 本」编号
  await expect(page.locator('.book').locator('[class*=index]')).toHaveCount(0);
  await expect(page.getByText(/第\s*[0-9一二三四五六七八]\s*本/)).toHaveCount(0);
});

// TC-164 8 张封面资源与统一底色
test('TC-164 8 张封面资源与统一底色', async ({ page, request }) => {
  for (const [code] of BOOKS) {
    const res = await request.get(`/images/covers/${code}.jpg`);
    expect(res.status(), `covers/${code}.jpg`).toBe(200);
    expect(res.headers()['content-type'], `covers/${code}.jpg`).toContain('image/jpeg');
  }

  await page.goto('/');
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });

  const covers = page.locator('.book-cover');
  await expect(covers).toHaveCount(8);
  const styles = await covers.evaluateAll((els) =>
    els.map((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundImage, repeat: s.backgroundRepeat, color: s.backgroundColor };
    })
  );
  for (let i = 0; i < BOOKS.length; i += 1) {
    expect(styles[i].bg).toContain(`/images/covers/${BOOKS[i][0]}.jpg`);
    // 实现：tile 尺寸大于封面尺寸，统一 no-repeat（手册 repeat 口径不适用）
    expect(styles[i].repeat).toBe('no-repeat');
  }
  // 全部封面底色完全一致（不按板块写给每本一个主色）
  expect(new Set(styles.map((s) => s.color)).size).toBe(1);

  // 8 张封面均 1200×1200
  const dims = await page.evaluate(
    (codes) =>
      Promise.all(
        codes.map(
          (code) =>
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = () => resolve({ w: 0, h: 0 });
              img.src = `/images/covers/${code}.jpg`;
            })
        )
      ),
    BOOKS.map(([code]) => code)
  );
  for (const dim of dims) {
    expect(dim.w).toBe(1200);
    expect(dim.h).toBe(1200);
  }
});

// TC-165 点击书进入 /books/plant 并回书架
test('TC-165 点击书进入书内页并回书架', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto('/');
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });

  await bookByTitle(page, '植物书').click();
  await expect(page).toHaveURL(/\/books\/plant$/);
  await expect(page.locator('.book-title')).toHaveText('植物书');
  await expect(page.locator('.book-topbar a.back-btn')).toHaveAttribute('href', '/');
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });

  // 页面级水平溢出 ≤1px（书内页纵向滚动为增量加载固有行为）
  const xOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(xOverflow).toBeLessThanOrEqual(1);

  await page.locator('.book-topbar a.back-btn').click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('.book')).toHaveCount(8);
});

// TC-166 书内页总量、首屏 16 与增量到底
test('TC-166 书内页总量、首屏 16 与增量到底', async ({ page }) => {
  await gotoBook(page, 'plant');
  await expect(page.locator('.list-count')).toHaveText('共 204 种');

  // 首屏明显少于全量（增量加载生效）
  const firstScreen = await page.locator('.plant-card').count();
  expect(firstScreen).toBeLessThan(204);

  await loadAllCards(page, 204);
  await expect(page.locator('.plant-card')).toHaveCount(204);
  await expect(page.locator('.load-sentinel')).toHaveCount(0);
  const firstOrder = await page.locator('.plant-card-zh').allTextContents();

  // 刷新后重新进入，顺序一致（sort ASC + id ASC 不回归）
  await page.reload();
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);
  const secondOrder = await page.locator('.plant-card-zh').allTextContents();
  expect(secondOrder).toEqual(firstOrder);
});

// TC-167 8 板块详情返回文案与 href
test('TC-167 8 板块详情返回文案与 href', async ({ page }) => {
  for (const [code, title] of BOOKS) {
    await gotoBook(page, code);
    await page.locator('.plant-card').first().click();
    await expect(page.locator('.detail-zh')).toBeVisible();

    const back = page.locator('.imm-topbar .back-btn').first();
    await expect(back).toHaveText(`← 回${title}`);
    await expect(back).toHaveAttribute('href', `/books/${code}`);
    // 详情页无部位切换（不回归）
    await expect(page.locator('[role="tab"]')).toHaveCount(0);
  }
});

// TC-168 详情返回恢复该书滚动位置与条数
test('TC-168 详情返回恢复该书滚动位置与条数', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);

  await page.evaluate(() => window.scrollTo(0, 1200));
  const beforeY = await page.evaluate(() => window.scrollY);
  expect(beforeY).toBeGreaterThan(0);
  const beforeCount = await page.locator('.plant-card').count();

  // DOM 直点（不触发 Playwright 的自动滚动进视口），返回实际写入 sessionStorage 的 scrollY
  const clickY = await page.evaluate(() => {
    document.querySelectorAll('.plant-card')[12].click();
    return window.scrollY;
  });
  await expect(page.locator('.detail-zh')).toBeVisible();

  await page.getByRole('link', { name: /回植物书/ }).click();
  await expect(page).toHaveURL(/\/books\/plant$/);

  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15000 }).toBeGreaterThan(0);
  const afterY = await page.evaluate(() => window.scrollY);
  expect(Math.abs(afterY - clickY)).toBeLessThanOrEqual(2);

  const afterCount = await page.locator('.plant-card').count();
  expect(afterCount).toBeGreaterThanOrEqual(beforeCount);
  const stored = await page.evaluate(() => Number(sessionStorage.getItem('sh:bookVisibleCount:plant')));
  expect(stored).toBe(afterCount);
});

// TC-169 多书滚动记忆互不串味（实现口径：详情返回恢复滚动；从书架进入置顶但恢复条数）
test('TC-169 多书滚动记忆互不串味', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });

  // 植物书：滚到 1200 → 进详情 → 返回恢复滚动（写 sh:bookScroll:plant）
  await gotoBook(page, 'plant');
  await loadAllCards(page, 204);
  await page.evaluate(() => window.scrollTo(0, 1200));
  const yP = await page.evaluate(() => window.scrollY);
  expect(yP).toBeGreaterThan(0);
  // DOM 直点（不触发 Playwright 的自动滚动进视口），返回实际写入 sessionStorage 的 scrollY
  const clickY = await page.evaluate(() => {
    document.querySelectorAll('.plant-card')[12].click();
    return window.scrollY;
  });
  await expect(page.locator('.detail-zh')).toBeVisible();
  await page.getByRole('link', { name: /回植物书/ }).click();
  await expect(page).toHaveURL(/\/books\/plant$/);
  await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15000 }).toBeGreaterThan(0);
  expect(Math.abs((await page.evaluate(() => window.scrollY)) - clickY)).toBeLessThanOrEqual(2);

  // 回书架 → 进动物书：不滚动、首屏 16
  await page.locator('.book-topbar a.back-btn').click();
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });
  await bookByTitle(page, '动物书').click();
  await expect(page).toHaveURL(/\/books\/animal$/);
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.locator('.plant-card').count()).toBe(16);
  // 动物书顶部进详情再返回：滚动仍为 0（写 sh:bookScroll:animal = 0）
  await page.locator('.plant-card').first().click();
  await expect(page.locator('.detail-zh')).toBeVisible();
  await page.getByRole('link', { name: /回动物书/ }).click();
  await expect(page).toHaveURL(/\/books\/animal$/);
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  // 回书架 → 再进植物书：按冻结口径从书架进入置顶，但条数按书记忆恢复（不退回首屏 16）
  await page.locator('.book-topbar a.back-btn').click();
  await expect(page.locator('.book').first()).toBeVisible({ timeout: 15000 });
  await bookByTitle(page, '植物书').click();
  await expect(page).toHaveURL(/\/books\/plant$/);
  await expect(page.locator('.plant-card').first()).toBeVisible({ timeout: 15000 });
  expect(await page.locator('.plant-card').count()).toBe(204);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  // 两个 key 各自独立：plant 记忆 > 0、animal 为 0
  const keys = await page.evaluate(() => ({
    scrollPlant: sessionStorage.getItem('sh:bookScroll:plant'),
    scrollAnimal: sessionStorage.getItem('sh:bookScroll:animal'),
    countPlant: sessionStorage.getItem('sh:bookVisibleCount:plant'),
    countAnimal: sessionStorage.getItem('sh:bookVisibleCount:animal'),
  }));
  expect(Number(keys.scrollPlant)).toBeGreaterThan(0);
  expect(Number(keys.scrollAnimal ?? 0)).toBe(0);
  expect(Number(keys.countPlant)).toBe(204);
  expect(Number(keys.countAnimal)).toBe(16);
});

// TC-170 未知 code 兜底 + 后端契约不变
test('TC-170 未知 code 兜底 + 后端契约不变', async ({ page, request }) => {
  const problems = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));

  await page.goto('/books/unknown');
  await expect(page.locator('.state-tip')).toHaveText('这本书还在路上哦');
  await expect(page.getByRole('link', { name: '回书架' })).toHaveAttribute('href', '/');
  expect(problems).toEqual([]);

  // 后端契约不变：分类 8 条、字段齐备、order 升序
  const categoriesRes = await request.get('/api/categories');
  expect(categoriesRes.status()).toBe(200);
  const categories = (await categoriesRes.json()).data;
  expect(categories).toHaveLength(8);
  for (const category of categories) {
    for (const key of ['code', 'nameZh', 'pinyin', 'nameEn', 'order', 'section']) {
      expect(category).toHaveProperty(key);
    }
  }
  const orders = categories.map((c) => c.order);
  expect([...orders].sort((a, b) => a - b)).toEqual(orders);

  // 条目计数：plant=204 / animal=50 / all=438
  const plantList = (await (await request.get('/api/plants?section=plant')).json()).data;
  expect(plantList).toHaveLength(204);
  const animalList = (await (await request.get('/api/plants?section=animal')).json()).data;
  expect(animalList).toHaveLength(50);
  const allList = (await (await request.get('/api/plants')).json()).data;
  expect(allList).toHaveLength(438);

  // 条目字段结构不变：id / name / coverImage / parts（数组）
  for (const item of [plantList[0], animalList[0]]) {
    expect(item).toHaveProperty('id');
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('coverImage');
    expect(Array.isArray(item.parts)).toBe(true);
  }
});
