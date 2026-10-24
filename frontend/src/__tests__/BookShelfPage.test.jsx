import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import BookShelfPage from '../pages/BookShelfPage';
import { getCategories } from '../api/client';
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

// 与后端契约一致的 8 条分类（order 升序即书架层内书序）
const CATEGORIES = [
  { code: 'plant', nameZh: '植物', pinyin: 'zhí wù', nameEn: 'Plant', order: 1, section: 'plant' },
  { code: 'animal', nameZh: '动物', pinyin: 'dòng wù', nameEn: 'Animal', order: 2, section: 'animal' },
  { code: 'insect', nameZh: '昆虫', pinyin: 'kūn chóng', nameEn: 'Insect', order: 3, section: 'insect' },
  { code: 'dinosaur', nameZh: '恐龙', pinyin: 'kǒng lóng', nameEn: 'Dinosaur', order: 4, section: 'dinosaur' },
  { code: 'letter', nameZh: '英文字母', pinyin: 'yīng wén zì mǔ', nameEn: 'Letter', order: 5, section: 'letter' },
  { code: 'pinyin', nameZh: '汉语拼音', pinyin: 'hàn yǔ pīn yīn', nameEn: 'Pinyin', order: 6, section: 'pinyin' },
  { code: 'number', nameZh: '数字', pinyin: 'shù zì', nameEn: 'Number', order: 9, section: 'number' },
  { code: 'color', nameZh: '颜色', pinyin: 'yán sè', nameEn: 'Color', order: 10, section: 'color' },
];

// 各书真实条数（plant 204 为语料 206 条中 2 条废弃后展示数）
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

const card = (i) => ({
  id: `card-${i}`,
  name: { zh: `条目${i}`, pinyin: `tiáo mù ${i}`, en: `Item ${i}` },
  coverImage: '/images/plants/sunflower-flower.jpg',
  parts: ['plant'],
});

const makeCards = (n) => Array.from({ length: n }, (_, i) => card(i));

const renderShelf = () =>
  render(
    <MemoryRouter>
      <BookShelfPage />
    </MemoryRouter>
  );

const bookTitles = () =>
  [...document.querySelectorAll('.shelf-row')].map((row) =>
    [...row.querySelectorAll('.book-title-zh')].map((el) => el.textContent)
  );

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  getCategories.mockResolvedValue(CATEGORIES);
  fetchBook.mockImplementation((code) => Promise.resolve(makeCards(COUNTS[code] ?? 0)));
});

afterEach(() => {
  sessionStorage.clear();
});

describe('书架页结构与数量（TC-171 ~ TC-172、TC-79）', () => {
  it('TC-171 两层书架渲染 8 本且顺序正确', async () => {
    renderShelf();

    // 等书单与数量就绪
    expect(await screen.findByText('共 204 种')).toBeInTheDocument();

    const rows = document.querySelectorAll('.shelf-row');
    expect(rows).toHaveLength(2);
    expect([...document.querySelectorAll('.shelf-title')].map((el) => el.textContent)).toEqual([
      '自然认知',
      '认知启蒙',
    ]);

    const books = document.querySelectorAll('.book');
    expect(books).toHaveLength(8);

    // 组内顺序 = categories.order 升序（plant → color）
    expect(bookTitles()).toEqual([
      ['植物书', '动物书', '昆虫书', '恐龙书'],
      ['英文字母书', '汉语拼音书', '数字书', '颜色书'],
    ]);
    // 每组各 4 本
    expect(rows[0].querySelectorAll('.book')).toHaveLength(4);
    expect(rows[1].querySelectorAll('.book')).toHaveLength(4);
  });

  it('TC-172 书本四行文字完整且无编号', async () => {
    renderShelf();
    expect(await screen.findByText('共 204 种')).toBeInTheDocument();

    const books = [...document.querySelectorAll('.book')];
    books.forEach((book) => {
      // 书名 / 拼音 / 英文三行齐全，数量行占位元素存在
      expect(book.querySelector('.book-title-zh').textContent).toBeTruthy();
      expect(book.querySelector('.book-title-pinyin').textContent).toBeTruthy();
      expect(book.querySelector('.book-title-en').textContent).toBeTruthy();
      expect(book.querySelector('.book-count')).toBeTruthy();
    });

    expect(books.map((b) => b.querySelector('.book-title-pinyin').textContent)).toEqual([
      'zhí wù',
      'dòng wù',
      'kūn chóng',
      'kǒng lóng',
      'yīng wén zì mǔ',
      'hàn yǔ pīn yīn',
      'shù zì',
      'yán sè',
    ]);
    expect(books.map((b) => b.querySelector('.book-count').textContent)).toEqual([
      '共 204 种',
      '共 50 种',
      '共 50 种',
      '共 50 种',
      '共 26 种',
      '共 26 种',
      '共 21 种',
      '共 11 种',
    ]);

    // 不出现「第 N 本」编号，也没有 index 类名
    expect(screen.queryByText(/第\s*\d+\s*本/)).not.toBeInTheDocument();
    for (const book of books) {
      expect(book.querySelector('[class*=index]')).toBeNull();
    }
  });

  it('TC-79 站点标题三行「认知小图鉴 / rèn zhī xiǎo tú jiàn / Cognitive Guide」', async () => {
    renderShelf();

    expect(await screen.findByText('rèn zhī xiǎo tú jiàn')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '认知小图鉴' })).toBeInTheDocument();
    expect(screen.getByText('Cognitive Guide')).toBeInTheDocument();
    // 旧站名不再出现
    expect(screen.queryByText('自然小图鉴')).not.toBeInTheDocument();
    expect(screen.queryByText('Nature Guide')).not.toBeInTheDocument();
    // 旧板块按钮导航已被书架取代
    expect(document.querySelector('.section-nav')).toBeNull();
  });
});

describe('书架数据驱动与数量容错（TC-173 ~ TC-176）', () => {
  it('TC-173 书单数据驱动：第 9 条分类零改码上架，未知 section 忽略', async () => {
    // M18-3：书 code 取 category.code，归组取 getSection(category.section)；
    // 新增书只要 section 指向已知板块即可上架（M18-2「零改码上架」）
    getCategories.mockResolvedValue([
      ...CATEGORIES,
      { code: 'vehicle', nameZh: '交通工具', pinyin: 'jiāo tōng gōng jù', nameEn: 'Vehicle', order: 11, section: 'plant' },
      { code: 'ghost', nameZh: '幽灵', pinyin: 'yōu líng', nameEn: 'Ghost', order: 12, section: 'mystery' },
    ]);

    renderShelf();
    expect(await screen.findByText('交通工具书')).toBeInTheDocument();

    expect(document.querySelectorAll('.book')).toHaveLength(9);
    // 「交通工具」排在「自然认知」组末尾（order 11）
    expect(bookTitles()[0]).toEqual(['植物书', '动物书', '昆虫书', '恐龙书', '交通工具书']);
    expect(bookTitles()[1]).toEqual(['英文字母书', '汉语拼音书', '数字书', '颜色书']);

    // 未知 section 的分类被忽略，不崩溃也不渲染
    expect(screen.queryByText('幽灵书')).not.toBeInTheDocument();

    // 封面路径按 code 派生
    const vehicleBook = screen.getByRole('link', { name: /交通工具书/ });
    expect(vehicleBook.querySelector('.book-cover').style.backgroundImage).toContain(
      '/images/covers/vehicle.jpg'
    );
  });

  it('TC-174 数量未就绪不显示「N 种」，就绪后补显且占位高度固定', async () => {
    const deferred = {};
    fetchBook.mockImplementation(
      (code) =>
        new Promise((resolve, reject) => {
          deferred[code] = { resolve, reject };
        })
    );

    renderShelf();

    // 未决时 8 个书名可见，数量区为空文本但元素保留（占位防跳动）
    expect(await screen.findByText('植物书')).toBeInTheDocument();
    expect(document.querySelectorAll('.book')).toHaveLength(8);
    for (const book of document.querySelectorAll('.book')) {
      expect(book.querySelector('.book-title-zh')).toBeTruthy();
      expect(book.querySelector('.book-count').textContent).toBe('');
    }
    expect(screen.queryByText(/共 \d+ 种/)).not.toBeInTheDocument();
    // 数量行固定高度占位（jsdom 无布局计算，故以样式源断言防跳动）
    const css = readFileSync('src/styles.css', 'utf-8');
    expect(css.match(/\.book-cover \.book-count\s*\{[^}]*\}/s)[0]).toMatch(/height:\s*\d+px/);

    // 全部 resolve → 8 个数量文本出现
    await act(async () => {
      Object.entries(deferred).forEach(([code, d]) => d.resolve(makeCards(COUNTS[code])));
    });
    await waitFor(() => expect(screen.getByText('共 204 种')).toBeInTheDocument());
    expect(document.querySelectorAll('.book-count').length).toBe(8);
    expect([...document.querySelectorAll('.book-count')].every((el) => /共 \d+ 种/.test(el.textContent))).toBe(true);
  });

  it('TC-175 单本数量失败隔离（Promise.allSettled）：动物书无数量，其余 7 本正常', async () => {
    fetchBook.mockImplementation((code) =>
      code === 'animal'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve(makeCards(COUNTS[code]))
    );

    renderShelf();
    await waitFor(() => expect(screen.getByText('共 204 种')).toBeInTheDocument());

    // 失败不影响书单：8 本与书名齐全
    expect(document.querySelectorAll('.book')).toHaveLength(8);
    for (const title of ['植物书', '动物书', '昆虫书', '恐龙书']) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }

    // 失败书（动物）数量区为空，其余 7 本正常
    const animalBook = screen.getByRole('link', { name: /动物书/ });
    expect(animalBook.querySelector('.book-count').textContent).toBe('');
    const otherCounts = [...document.querySelectorAll('.book')]
      .filter((b) => !/动物书/.test(b.querySelector('.book-title-zh').textContent))
      .map((b) => b.querySelector('.book-count').textContent);
    expect(otherCounts).toHaveLength(7);
    expect(otherCounts.every((t) => /共 \d+ 种/.test(t))).toBe(true);
  });

  it('TC-176 分类接口失败显示友好提示，不渲染书本', async () => {
    // 无 message 的错误 → 走友好兜底文案
    getCategories.mockRejectedValue({});

    renderShelf();

    expect(await screen.findByText('哎呀，出了点小问题，请稍后再试')).toBeInTheDocument();
    expect(document.querySelectorAll('.book')).toHaveLength(0);
    expect(fetchBook).not.toHaveBeenCalled();
  });
});

describe('封面与交互（TC-177 ~ TC-178）', () => {
  it('TC-177 封面路径、平铺与统一底色（样式源断言）', async () => {
    renderShelf();
    expect(await screen.findByText('共 204 种')).toBeInTheDocument();

    // 8 个封面路径 = /images/covers/{code}.jpg（单图 tile 平铺，文字层为 HTML）
    const covers = [...document.querySelectorAll('.book-cover')];
    expect(covers).toHaveLength(8);
    // jsdom 会为 URL 加引号，比较时统一去掉引号
    const bgOf = (el) => el.style.backgroundImage.replace(/["']/g, '');
    expect(covers.map(bgOf)).toEqual(
      CATEGORIES.map((c) => `url(/images/covers/${c.code}.jpg)`)
    );

    const css = readFileSync('src/styles.css', 'utf-8');
    const coverRule = css.match(/\.book-cover\s*\{[^}]*\}/s)[0];
    // U18-3：tile 尺寸 > 封面尺寸，故 no-repeat；底色单一（纸白）
    expect(coverRule).toMatch(/background-repeat:\s*no-repeat/);
    expect(coverRule).toMatch(/background-size:/);
    expect(coverRule.match(/background-color:/g)).toHaveLength(1);
    expect(coverRule).toMatch(/background-color:\s*var\(--book-paper\)/);
    // 不存在按板块覆写封面底色的「每本一个主色」规则
    expect(css).not.toMatch(/\[data-section="[^"]+"\]\s+\.book-cover/);
    expect(css).not.toMatch(/\.book-(plant|animal|insect|dinosaur|letter|pinyin|number|color)\s+\.book-cover/);
    expect(css).not.toMatch(/\.book-cover\s*\{[^}]*background-color:\s*#[0-9a-fA-F]{3,6}[^}]*\}/s);
  });

  it('TC-178 点击跳转、可访问名与 hover 规则', async () => {
    const user = userEvent.setup();
    // 探针路由：把书架点击后的路径渲染成可断言文本
    const Probe = () => {
      const loc = useLocation();
      return <div data-testid="probe">{loc.pathname}</div>;
    };
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<BookShelfPage />} />
          <Route path="/books/:code" element={<Probe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('共 204 种')).toBeInTheDocument();
    const plantBook = screen.getByRole('link', { name: /植物书/ });
    // 语义为链接，无障碍名同时含书名与数量
    expect(plantBook.getAttribute('aria-label')).toContain('植物');
    expect(plantBook.getAttribute('aria-label')).toContain('共 204 种');

    await user.click(plantBook);
    expect(await screen.findByTestId('probe')).toHaveTextContent('/books/plant');

    // 样式源：书本热区高度 ≥56px（U18-2：--book-h 252 / 竖屏 216），hover 微抬升 ≤4px
    const css = readFileSync('src/styles.css', 'utf-8');
    const bookRule = css.match(/\.book\s*\{[^}]*\}/s)[0];
    expect(bookRule).toMatch(/height:\s*var\(--book-h\)/);
    for (const block of css.matchAll(/--book-h:\s*(\d+)px/g)) {
      expect(Number(block[1])).toBeGreaterThanOrEqual(56);
    }
    const hoverRule = css.match(/\.book:hover,\s*\.book:focus-visible\s*\{[^}]*\}/s)[0];
    const lift = Number(hoverRule.match(/translateY\(-(\d+)px\)/)[1]);
    expect(lift).toBeGreaterThan(0);
    expect(lift).toBeLessThanOrEqual(4);
  });
});
