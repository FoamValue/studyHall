import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BookShelfPage from '../pages/BookShelfPage';
import BookPage from '../pages/BookPage';
import PlantDetailPage from '../pages/PlantDetailPage';
import { getCategories, getPlant, getPlants, getPlantsBySection } from '../api/client';
import { fetchBook } from '../api/bookCache';

vi.mock('../api/client', () => ({
  getCategories: vi.fn(),
  getPlants: vi.fn(),
  getPlantsBySection: vi.fn(),
  getPlant: vi.fn(),
}));

vi.mock('../api/bookCache', () => ({
  fetchBook: vi.fn(),
  clearBookCache: vi.fn(),
}));

const CSS = readFileSync('src/styles.css', 'utf-8');

// ===== 常量：Sprint 19 方案 A（温润纸感）冻结色值，见 ui-style-guide U19-1 / U19-3 =====
const TOKENS_A = {
  '--color-page-bg': '#faf5ec',
  '--color-card-bg': '#fffdf8',
  '--color-text': '#3a2a22',
  '--color-text-light': '#6f5443',
  '--color-primary': '#b45b3e',
  '--color-primary-dark': '#8a3e27',
  '--color-accent-bg': '#fbf0de',
  '--color-accent-border': '#b87a3d',
  '--shelf-wood': '#a87f55',
  '--shelf-wood-dark': '#8a6a47',
  '--shelf-wood-light': '#d3b48d',
  '--book-paper': '#fcf7ed',
  '--book-ink': '#d8c3a2',
  '--book-stack': '#f2e8d8',
  '--book-page-bg': '#fffbf3',
  '--color-detail-bg': '#f6eee2',
  '--color-focus': '#8a3e27',
  '--color-divider': '#e7dac6',
  '--shadow-rgb': '58, 42, 34',
};

// Sprint 19 前旧色（绿 + 木棕 + 奶油黄三系混搭）：换肤后必须零命中
const LEGACY_COLORS = [
  '#4CAF50',
  '#388E3C',
  '#F9A825',
  '#FFF8DC',
  '#C9A876',
  '#A8825A',
  '#E3CBA5',
  '#D9C9AE',
  '#FDFBF6',
];

const tokenRegex = (name) => new RegExp(`${name}\\s*:\\s*([^;]+);`);

// 取选择器块的声明体
const ruleBody = (selector) => {
  const match = CSS.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 's'));
  return match ? match[1] : null;
};

// ===== 页面渲染辅助 =====
const SUNFLOWER = {
  id: 'sunflower-flower',
  categories: ['plant'],
  name: { zh: '向日葵花', pinyin: 'xiàng rì kuí huā', en: 'Sunflower' },
  parts: {
    flower: {
      name: { zh: '花', pinyin: 'huā', en: 'flower' },
      images: [{ type: 'photo', url: '/images/plants/sunflower-flower.jpg' }],
      description: '大大的花盘像小太阳。',
    },
  },
};

const card = (i) => ({
  id: `card-${i}`,
  name: { zh: `条目${i}`, pinyin: `tiáo mù ${i}`, en: `Item ${i}` },
  coverImage: '/images/plants/sunflower-flower.jpg',
  parts: ['plant'],
});

const renderShelf = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
      <Routes>
        <Route path="/" element={<BookShelfPage />} />
      </Routes>
    </MemoryRouter>
  );

const renderBook = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/books/plant', state }]}>
      <Routes>
        <Route path="/books/:code" element={<BookPage />} />
      </Routes>
    </MemoryRouter>
  );

const renderDetail = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/plants/sunflower-flower', state }]}>
      <Routes>
        <Route path="/plants/:id" element={<PlantDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

const routeEnterOf = (selector) => document.querySelector(selector)?.getAttribute('data-route-enter');

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  // jsdom 未实现 window.scrollTo，桩掉避免 stderr 噪音（不改变被测逻辑）
  vi.stubGlobal('scrollTo', vi.fn());
  getCategories.mockResolvedValue([
    { code: 'plant', nameZh: '植物', pinyin: 'zhí wù', nameEn: 'Plant', order: 1, section: 'plant' },
  ]);
  fetchBook.mockResolvedValue(Array.from({ length: 20 }, (_, i) => card(i)));
  getPlant.mockResolvedValue(SUNFLOWER);
  getPlants.mockResolvedValue([]);
  getPlantsBySection.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('色板 token 静态断言（TC-185 ~ TC-186）', () => {
  it('TC-185 方案 A 全量 token 落地，新增 4 个 token 就位', () => {
    for (const [name, value] of Object.entries(TOKENS_A)) {
      const match = CSS.match(tokenRegex(name));
      expect(match, `${name} 缺失`).not.toBeNull();
      expect(match[1].trim().toLowerCase(), `${name}`).toBe(value);
    }

    // U19-3 新增 token：详情背景 / 聚焦描边 / 分隔线 / 阴影三元组
    for (const name of ['--color-detail-bg', '--color-focus', '--color-divider', '--shadow-rgb']) {
      expect(CSS, name).toContain(name);
    }
  });

  it('TC-186 旧色系零命中，阴影三元组统一走 --shadow-rgb', () => {
    const files = ['src/styles.css', 'src/main.jsx', 'index.html'];
    for (const file of files) {
      const text = readFileSync(file, 'utf-8').toLowerCase();
      for (const legacy of LEGACY_COLORS) {
        expect(text.includes(legacy.toLowerCase()), `${file} 残留 ${legacy}`).toBe(false);
      }
      // 旧阴影棕调 rgba(62, 39, 35, …) 不得残留
      expect(/62\s*,\s*39\s*,\s*35/.test(text), `${file} 残留旧阴影三元组`).toBe(false);
    }

    // antd 主题主色同步为方案 A 主色
    expect(readFileSync('src/main.jsx', 'utf-8')).toContain("colorPrimary: '#B45B3E'");
    // 阴影统一引用变量
    expect(CSS).toContain('rgba(var(--shadow-rgb)');
  });
});

describe('4 处路由过渡动画（TC-187a ~ TC-187d）', () => {
  it('TC-187a 书架 → 书内页：shelf-to-book + 320ms', async () => {
    renderBook({ from: 'shelf' });
    await waitFor(() => expect(document.querySelector('.page.book-page')).not.toBeNull());
    expect(routeEnterOf('.page.book-page')).toBe('shelf-to-book');

    const body = ruleBody("\\[data-route-enter='shelf-to-book'\\]");
    expect(body).not.toBeNull();
    expect(body).toMatch(/animation:\s*sh-enter-book\s+320ms/);
    expect(CSS).toMatch(/@keyframes\s+sh-enter-book\s*\{/);
  });

  it('TC-187b 书内页 → 书架：book-to-shelf + 260ms', async () => {
    renderShelf({ from: 'book' });
    await waitFor(() => expect(document.querySelector('.bookshelf-page')).not.toBeNull());
    expect(routeEnterOf('.bookshelf-page')).toBe('book-to-shelf');

    const body = ruleBody("\\[data-route-enter='book-to-shelf'\\]");
    expect(body).not.toBeNull();
    expect(body).toMatch(/animation:\s*sh-enter-shelf\s+260ms/);
    expect(CSS).toMatch(/@keyframes\s+sh-enter-shelf\s*\{/);
  });

  it('TC-187c 书内页 → 详情：book-to-detail + 340ms', async () => {
    renderDetail({ from: 'book', section: 'plant' });
    await waitFor(() => expect(document.querySelector('.detail-immersive')).not.toBeNull());
    expect(routeEnterOf('.detail-immersive')).toBe('book-to-detail');
    // 详情名称渲染完成（动画标记不影响既有版式）
    expect(await screen.findByText('向日葵花')).toBeInTheDocument();

    const body = ruleBody("\\[data-route-enter='book-to-detail'\\]");
    expect(body).not.toBeNull();
    expect(body).toMatch(/animation:\s*sh-enter-page\s+340ms/);
    expect(CSS).toMatch(/@keyframes\s+sh-enter-page\s*\{/);
  });

  it('TC-187d 详情 → 书内页：detail-to-book + 240ms', async () => {
    renderBook({ from: 'detail', restoreScroll: true });
    await waitFor(() => expect(document.querySelector('.page.book-page')).not.toBeNull());
    expect(routeEnterOf('.page.book-page')).toBe('detail-to-book');

    const body = ruleBody("\\[data-route-enter='detail-to-book'\\]");
    expect(body).not.toBeNull();
    expect(body).toMatch(/animation:\s*sh-enter-book-return\s+240ms/);
    expect(CSS).toMatch(/@keyframes\s+sh-enter-book-return\s*\{/);
  });
});

describe('无来源不播动画（TC-188）', () => {
  it('TC-188 无 state（刷新 / 直接 URL / 书内换株）时不挂 data-route-enter', async () => {
    renderShelf(undefined);
    await waitFor(() => expect(document.querySelector('.bookshelf-page')).not.toBeNull());
    expect(routeEnterOf('.bookshelf-page')).toBeNull();

    const book = renderBook(undefined);
    await waitFor(() => expect(book.container.querySelector('.page.book-page')).not.toBeNull());
    expect(book.container.querySelector('.page.book-page').getAttribute('data-route-enter')).toBeNull();
    book.unmount();

    const detail = renderDetail(undefined);
    await waitFor(() => expect(detail.container.querySelector('.detail-immersive')).not.toBeNull());
    expect(detail.container.querySelector('.detail-immersive').getAttribute('data-route-enter')).toBeNull();
  });
});

describe('reduced-motion 降级（TC-189）', () => {
  it('TC-189 prefers-reduced-motion: reduce 下入场降为 120ms 纯淡入、无位移缩放', () => {
    expect(CSS).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);

    // 媒体查询内 [data-route-enter] 规则：sh-fade 120ms + transform 强制取消
    const reducedRule = CSS.match(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\[data-route-enter\]\s*\{([^}]*)\}/
    );
    expect(reducedRule).not.toBeNull();
    expect(reducedRule[1]).toMatch(/animation:\s*sh-fade\s+120ms/);
    expect(reducedRule[1]).toMatch(/transform:\s*none\s*!important/);
    expect(CSS).toMatch(/@keyframes\s+sh-fade\s*\{/);

    // 降级段内取消 hover 抬升 / 过渡 / 平滑滚动
    const reducedSection = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
    for (const selector of ['.book', '.plant-card', '.speak-btn', '.filter-btn', '.nav-btn']) {
      expect(reducedSection).toContain(selector);
    }
    expect(reducedSection).toMatch(/transition:\s*none/);
    expect(reducedSection).toMatch(/transform:\s*none/);
    expect(reducedSection).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });
});

describe('换肤不改版式（TC-190）', () => {
  it('TC-190 关键尺寸与字号源不变（书本 / 卡片 / 详情名称）', () => {
    // 书本尺寸：1024 档 210×252，1180 档（≥1100px）228×272
    const shelf = ruleBody('\\.bookshelf');
    expect(shelf).toMatch(/--book-w:\s*210px/);
    expect(shelf).toMatch(/--book-h:\s*252px/);
    const wide = CSS.match(/@media\s*\(min-width:\s*1100px\)[\s\S]*?\.bookshelf\s*\{([^}]*)\}/);
    expect(wide).not.toBeNull();
    expect(wide[1]).toMatch(/--book-w:\s*228px/);
    expect(wide[1]).toMatch(/--book-h:\s*272px/);

    // 卡片规格与类名语义不变
    const cardRule = ruleBody('\\.plant-card');
    expect(cardRule).toMatch(/border-radius:\s*20px/);
    expect(cardRule).toMatch(/padding:\s*16px/);

    // 详情名称字号：竖屏 56px、横屏 52px
    expect(ruleBody('\\.detail-zh')).toMatch(/font-size:\s*56px/);
    const landscape = CSS.match(/@media[^{]*\(orientation:\s*landscape\)[\s\S]*?\.detail-header\s+\.detail-zh\s*\{([^}]*)\}/);
    expect(landscape).not.toBeNull();
    expect(landscape[1]).toMatch(/font-size:\s*52px/);
  });
});
