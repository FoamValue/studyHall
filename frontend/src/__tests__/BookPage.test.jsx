import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import BookPage from '../pages/BookPage';
import { deriveCardTitle } from '../components/PlantCard';
import { SECTION_BOOK_TITLE } from '../components/SectionNav';
import { fetchBook } from '../api/bookCache';

vi.mock('../api/bookCache', () => ({
  fetchBook: vi.fn(),
  clearBookCache: vi.fn(),
}));

// 与后端契约一致的列表卡片结构：{id, name, coverImage, parts}
const card = (id, zh, pinyin, en, cover, parts) => ({
  id,
  name: { zh, pinyin, en },
  coverImage: cover,
  parts,
});

// Sprint 17：植物拆分为单部位条目，每条仅一个部位
const SUNFLOWER_CARD = card('sunflower-flower', '向日葵花', 'xiàng rì kuí huā', 'Sunflower', '/images/plants/sunflower-flower.jpg', ['flower']);
const GINKGO_CARD = card('ginkgo-leaf', '银杏叶', 'yín xìng yè', 'Ginkgo Leaf', '/images/plants/ginkgo-leaf.jpg', ['leaf']);

const makeCards = (n) =>
  Array.from({ length: n }, (_, i) =>
    card(`plant-${i}`, `植物${i}`, `zhí wù ${i}`, `Plant ${i}`, '/images/plants/sunflower-flower.jpg', ['flower'])
  );

const renderBook = (code, state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: `/books/${code}`, state }]}>
      <Routes>
        <Route path="/books/:code" element={<BookPage />} />
      </Routes>
    </MemoryRouter>
  );

// 可手动触发的 IntersectionObserver 桩：记录回调，测试中显式派发进入视口
function stubIO() {
  const callbacks = [];
  class MockIO {
    constructor(cb) {
      callbacks.push(cb);
    }
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', MockIO);
  return callbacks;
}

const cardCount = () => document.querySelectorAll('.plant-card').length;

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  // jsdom 未实现 window.scrollTo，桩掉避免 stderr 噪音（不改变被测逻辑）
  vi.stubGlobal('scrollTo', vi.fn());
  // 默认空书，具体用例按需覆盖
  fetchBook.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('书内页结构与请求（TC-179、TC-11、TC-12、TC-20）', () => {
  it('TC-179 8 个 code 的标题「{板块名}书」+ 回书架入口', async () => {
    const cases = [
      ['plant', '植物书'],
      ['animal', '动物书'],
      ['insect', '昆虫书'],
      ['dinosaur', '恐龙书'],
      ['letter', '英文字母书'],
      ['pinyin', '汉语拼音书'],
      ['number', '数字书'],
      ['color', '颜色书'],
    ];
    for (const [code, title] of cases) {
      const view = renderBook(code);
      expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument();
      const back = screen.getByRole('link', { name: /← 回书架/ });
      expect(back).toHaveAttribute('href', '/');
      expect(screen.queryByText(/第\s*\d+\s*本/)).not.toBeInTheDocument();
      // 标题唯一来源与 SECTION_BOOK_TITLE 一致
      expect(title).toBe(SECTION_BOOK_TITLE[code]);
      view.unmount();
      sessionStorage.clear();
    }
  });

  it('TC-11 植物书无二级分类筛选条（Sprint 17：取消花朵/树叶/果实分类）', async () => {
    fetchBook.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderBook('plant');

    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
    for (const name of ['全部', '花朵', '树叶', '果实']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
    expect(screen.queryByRole('group', { name: '植物分类筛选' })).not.toBeInTheDocument();
    expect(document.querySelector('.category-filter')).toBeNull();
    // 旧板块按钮导航已移除
    expect(document.querySelector('.section-nav')).toBeNull();
  });

  it('TC-12 植物书统一按 code 请求（fetchBook("plant")），不走 category 筛选', async () => {
    fetchBook.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderBook('plant');

    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
    expect(screen.getByText('银杏叶')).toBeInTheDocument();
    expect(fetchBook).toHaveBeenCalledWith('plant');
    // 只请求当前书一本，不做额外分类请求
    expect(fetchBook).toHaveBeenCalledTimes(1);
  });

  it('TC-20 卡片图片带 loading="lazy"', async () => {
    fetchBook.mockResolvedValue([SUNFLOWER_CARD]);
    renderBook('plant');

    const img = await screen.findByAltText('向日葵花');
    expect(img).toHaveAttribute('loading', 'lazy');
  });
});

describe('书内页列表行为（TC-21、TC-12b、TC-45e、TC-59、TC-146）', () => {
  it('TC-21 100 条数据渲染无异常（无 IO 时全量降级）', async () => {
    fetchBook.mockResolvedValue(makeCards(100));
    renderBook('plant');

    expect(await screen.findByText('植物0')).toBeInTheDocument();
    expect(await screen.findByText('植物99')).toBeInTheDocument();
    expect(document.querySelectorAll('.plant-card')).toHaveLength(100);
  });

  it('TC-12b 卡片链接携带当前书与列表快照（section=plant，无 category）', async () => {
    const user = userEvent.setup();
    fetchBook.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);

    // 探针路由：把详情页收到的 location.state 渲染成可断言文本
    const StateProbe = () => {
      const loc = useLocation();
      return (
        <div data-testid="probe">{`${loc.state?.section}|${loc.state?.category}|${loc.state?.list?.length}`}</div>
      );
    };

    render(
      <MemoryRouter initialEntries={['/books/plant']}>
        <Routes>
          <Route path="/books/:code" element={<BookPage />} />
          <Route path="/plants/:id" element={<StateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('link', { name: /向日葵花/ }));

    expect(await screen.findByTestId('probe')).toHaveTextContent('plant|undefined|2');
  });

  it('TC-45e 列表不渲染朗读喇叭', async () => {
    fetchBook.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderBook('plant');

    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
    expect(document.querySelectorAll('.speak-btn')).toHaveLength(0);
  });

  it('TC-59 卡片次级文字（拼音/英文）字号 ≥16px（样式源文件断言）', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const block = css.match(/\.plant-card-pinyin[\s\S]*?\.plant-card-en\s*\{[^}]*\}/s)[0];
    expect(Number(block.match(/font-size:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(16);
  });

  it('TC-146 字母书卡片名称条件渲染：缺 pinyin/en 字段不渲染空白行', async () => {
    const LETTER_CARD = card('letter-a', 'Aa', undefined, undefined, '/images/letters/letter-a.jpg', ['letter']);
    fetchBook.mockResolvedValue([LETTER_CARD]);
    renderBook('letter');

    expect(await screen.findByText('Aa')).toBeInTheDocument();
    const cardEl = document.querySelector('.plant-card');
    expect(cardEl.querySelector('.plant-card-zh')).toHaveTextContent('Aa');
    expect(cardEl.querySelector('.plant-card-pinyin')).toBeNull();
    expect(cardEl.querySelector('.plant-card-en')).toBeNull();
  });
});

describe('卡片标题纯函数（TC-64）', () => {
  const plant = (id, zh) => ({ id, name: { zh } });

  it('TC-64 deriveCardTitle 直接返回条目 name.zh，不再按分类派生', () => {
    expect(deriveCardTitle(plant('peach-fruit', '桃子'))).toBe('桃子');
    expect(deriveCardTitle(plant('peach-flower', '桃花'))).toBe('桃花');
    expect(deriveCardTitle(plant('peach-leaf', '桃花叶'))).toBe('桃花叶');
    expect(deriveCardTitle(plant('ginkgo-fruit', '白果'))).toBe('白果');
    expect(deriveCardTitle(plant('giant-panda', '大熊猫'))).toBe('大熊猫');
    expect(deriveCardTitle(plant('letter-a', 'Aa'))).toBe('Aa');
  });
});

describe('书内页增量加载与总量提示（TC-106 ~ TC-108、TC-180 ~ TC-181）', () => {
  it('TC-106 「共 N 种」口径：植物书 40 / 动物书 10（两次渲染）', async () => {
    fetchBook.mockResolvedValue(makeCards(40));
    const plant = renderBook('plant');
    expect(await screen.findByText('共 40 种')).toBeInTheDocument();
    plant.unmount();
    sessionStorage.clear();

    fetchBook.mockResolvedValue(makeCards(10));
    renderBook('animal');
    expect(await screen.findByText('共 10 种')).toBeInTheDocument();
  });

  it('TC-107 无 IntersectionObserver 时首屏全量渲染（降级），不渲染哨兵', async () => {
    fetchBook.mockResolvedValue(makeCards(40));
    renderBook('plant');

    expect(await screen.findByText('植物39')).toBeInTheDocument();
    expect(cardCount()).toBe(40);
    expect(document.querySelector('.load-sentinel')).not.toBeInTheDocument();
  });

  it('TC-108 哨兵进入视口逐页追加：16 → 32 → 40 后哨兵消失', async () => {
    const callbacks = stubIO();
    fetchBook.mockResolvedValue(makeCards(40));
    renderBook('plant');

    expect(await screen.findByText('共 40 种')).toBeInTheDocument();
    expect(cardCount()).toBe(16);
    expect(document.querySelector('.load-sentinel')).toBeInTheDocument();

    await act(async () => {
      callbacks.at(-1)([{ isIntersecting: true }]);
    });
    expect(cardCount()).toBe(32);

    await act(async () => {
      callbacks.at(-1)([{ isIntersecting: true }]);
    });
    expect(cardCount()).toBe(40);
    expect(document.querySelector('.load-sentinel')).not.toBeInTheDocument();
  });

  it('TC-180 书内页首屏 16 + 「共 40 种」+ 哨兵，两次触发到底', async () => {
    const callbacks = stubIO();
    fetchBook.mockResolvedValue(makeCards(40));
    renderBook('plant');

    expect(await screen.findByText('共 40 种')).toBeInTheDocument();
    expect(cardCount()).toBe(16);
    expect(document.querySelector('.load-sentinel')).toBeInTheDocument();

    for (const expected of [32, 40]) {
      await act(async () => {
        callbacks.at(-1)([{ isIntersecting: true }]);
      });
      expect(cardCount()).toBe(expected);
    }
    expect(document.querySelector('.load-sentinel')).not.toBeInTheDocument();
  });

  it('TC-181 植物书 204 条可完整加载到底', async () => {
    const callbacks = stubIO();
    fetchBook.mockResolvedValue(makeCards(204));
    renderBook('plant');

    expect(await screen.findByText('共 204 种')).toBeInTheDocument();
    expect(cardCount()).toBe(16);

    // 反复派发哨兵进入视口，直到哨兵消失（每页 +16）
    for (let i = 0; i < 20 && document.querySelector('.load-sentinel'); i += 1) {
      await act(async () => {
        callbacks.at(-1)([{ isIntersecting: true }]);
      });
    }

    expect(cardCount()).toBe(204);
    expect(document.querySelector('.load-sentinel')).toBeNull();
    expect(screen.getByText('共 204 种')).toBeInTheDocument();
  });
});

describe('书内页兜底 / 空态 / 滚动记忆（TC-182 ~ TC-184、TC-13、TC-80b）', () => {
  it('TC-182 未知 code 兜底「这本书还在路上哦」，不发列表请求', async () => {
    renderBook('unknown');

    expect(await screen.findByText('这本书还在路上哦')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '回书架' })).toHaveAttribute('href', '/');
    expect(document.querySelector('.plant-grid')).toBeNull();
    // M18-2：未知 code 不回落查分类/列表
    expect(fetchBook).not.toHaveBeenCalled();
  });

  it('TC-183 书内页空态（恐龙书）', async () => {
    fetchBook.mockResolvedValue([]);
    renderBook('dinosaur');

    expect(await screen.findByText('这个板块还没有内容哦')).toBeInTheDocument();
    expect(document.querySelector('.list-count')).toBeNull();
    expect(document.querySelector('.plant-grid')).toBeNull();
    expect(screen.getByRole('heading', { name: '恐龙书' })).toBeInTheDocument();
  });

  it('TC-13 植物书空态文案（原首页空态语义，Sprint 18 统一为空板块文案）', async () => {
    fetchBook.mockResolvedValue([]);
    renderBook('plant');

    expect(await screen.findByText('这个板块还没有内容哦')).toBeInTheDocument();
    expect(screen.queryByText('向日葵花')).not.toBeInTheDocument();
  });

  it('TC-80b 非植物书空态文案（动物书）', async () => {
    fetchBook.mockResolvedValue([]);
    renderBook('animal');

    expect(await screen.findByText('这个板块还没有内容哦')).toBeInTheDocument();
    expect(document.querySelector('.plant-grid')).toBeNull();
  });

  it('TC-184 滚动记忆按书隔离且恢复条数', async () => {
    stubIO();
    sessionStorage.setItem('sh:bookVisibleCount:plant', '32');
    sessionStorage.setItem('sh:bookVisibleCount:animal', '16');
    fetchBook.mockResolvedValue(makeCards(40));

    // ① 从详情返回植物书：恢复 32 条，不退回首屏 16
    const plant = renderBook('plant', { restoreScroll: true });
    expect(await screen.findByText('共 40 种')).toBeInTheDocument();
    expect(cardCount()).toBe(32);
    expect(sessionStorage.getItem('sh:bookVisibleCount:plant')).toBe('32');
    plant.unmount();

    // ② 动物书按自己的 key 恢复 16 条
    renderBook('animal');
    expect(await screen.findByText('共 40 种')).toBeInTheDocument();
    expect(cardCount()).toBe(16);
    expect(sessionStorage.getItem('sh:bookVisibleCount:animal')).toBe('16');

    // ③ 多书互不串味：植物书的 key 未被动物书覆写
    expect(sessionStorage.getItem('sh:bookVisibleCount:plant')).toBe('32');
  });
});
