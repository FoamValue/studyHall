import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import { getCategories, getPlants } from '../api/client';

vi.mock('../api/client', () => ({
  getCategories: vi.fn(),
  getPlants: vi.fn(),
  getPlant: vi.fn(),
}));

const CATEGORIES = [
  { code: 'flower', nameZh: '花朵', pinyin: 'huā duǒ', nameEn: 'Flower', order: 1 },
  { code: 'leaf', nameZh: '树叶', pinyin: 'shù yè', nameEn: 'Leaf', order: 2 },
  { code: 'fruit', nameZh: '果实', pinyin: 'guǒ shí', nameEn: 'Fruit', order: 3 },
];

// 与后端契约一致的卡片结构：{id, name, coverImage, parts}
const card = (id, zh, pinyin, en, cover, parts) => ({
  id,
  name: { zh, pinyin, en },
  coverImage: cover,
  parts,
});

const SUNFLOWER_CARD = card('sunflower', '向日葵', 'xiàng rì kuí', 'Sunflower', '/images/plants/sunflower-flower.jpg', ['flower', 'leaf', 'fruit']);
const GINKGO_CARD = card('ginkgo', '银杏', 'yín xìng', 'Ginkgo', '/images/plants/ginkgo-leaf.jpg', ['leaf', 'fruit']);

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  getCategories.mockResolvedValue(CATEGORIES);
});

describe('HomePage（TC-11 ~ TC-13）', () => {
  it('TC-11 首页渲染分类按钮：全部/花朵/树叶/果实 四钮可见', async () => {
    getPlants.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderHome();

    expect(await screen.findByRole('button', { name: '全部' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '花朵' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '树叶' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '果实' })).toBeInTheDocument();
  });

  it('TC-12 点击分类触发对应 category 请求并渲染过滤后的卡片列表', async () => {
    const user = userEvent.setup();
    getPlants.mockImplementation((category) =>
      category === 'flower'
        ? Promise.resolve([SUNFLOWER_CARD])
        : Promise.resolve([SUNFLOWER_CARD, GINKGO_CARD])
    );
    renderHome();

    // 初始「全部」列表渲染两株植物
    expect(await screen.findByText('向日葵')).toBeInTheDocument();
    expect(screen.getByText('银杏')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '花朵' }));

    // 过滤后只剩向日葵，且请求带上 category 参数
    expect(await screen.findByText('向日葵')).toBeInTheDocument();
    expect(screen.queryByText('银杏')).not.toBeInTheDocument();
    expect(getPlants).toHaveBeenLastCalledWith('flower');
  });

  it('TC-13 空分类显示空态文案「这个分类还没有植物哦」', async () => {
    const user = userEvent.setup();
    getPlants.mockResolvedValue([]);
    renderHome();

    await user.click(await screen.findByRole('button', { name: '树叶' }));

    expect(await screen.findByText('这个分类还没有植物哦')).toBeInTheDocument();
    expect(screen.queryByText('向日葵')).not.toBeInTheDocument();
  });

  it('TC-20 卡片图片带 loading="lazy"', async () => {
    getPlants.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    const img = await screen.findByAltText('向日葵');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('TC-21 100 条数据渲染无异常', async () => {
    const cards = Array.from({ length: 100 }, (_, i) =>
      card(`plant-${i}`, `植物${i}`, `zhí wù ${i}`, `Plant ${i}`, '/images/plants/sunflower-flower.jpg', ['flower'])
    );
    getPlants.mockResolvedValue(cards);
    renderHome();

    expect(await screen.findByText('植物0')).toBeInTheDocument();
    expect(screen.getByText('植物99')).toBeInTheDocument();
    expect(document.querySelectorAll('.plant-card')).toHaveLength(100);
  });

  it('TC-25 触控目标：分类按钮使用 .filter-btn，且样式表 min-height ≥ 44px', async () => {
    getPlants.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    // 结构断言：分类按钮全部带 filter-btn 类（部位按钮复用同类，见 PartSwitcher）
    expect(await screen.findByRole('button', { name: '全部' })).toHaveClass('filter-btn');
    expect(screen.getByRole('button', { name: '花朵' })).toHaveClass('filter-btn');

    // 样式表规则断言：.filter-btn 的 min-height ≥ 44px（jsdom 不计算级联样式，直接读源文件）
    const css = readFileSync('src/styles.css', 'utf-8');
    const block = css.match(/\.filter-btn\s*\{[^}]*\}/s)[0];
    const minHeight = Number(block.match(/min-height:\s*(\d+)px/)[1]);
    expect(minHeight).toBeGreaterThanOrEqual(44);
  });

  it('TC-12b 点击卡片进详情时携带当前分类与列表快照（Sprint 4 新增）', async () => {
    const user = userEvent.setup();
    getPlants.mockImplementation((category) =>
      category === 'flower' ? Promise.resolve([SUNFLOWER_CARD]) : Promise.resolve([SUNFLOWER_CARD, GINKGO_CARD])
    );

    // 探针路由：把详情页收到的 location.state 渲染成可断言文本
    const StateProbe = () => {
      const loc = useLocation();
      return <div data-testid="probe">{`${loc.state?.category}|${loc.state?.list?.length}`}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/plants/:id" element={<StateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: '花朵' }));
    await user.click(await screen.findByRole('link', { name: /向日葵/ }));

    // 详情页拿到 category=flower 与其列表快照（1 株）
    expect(await screen.findByTestId('probe')).toHaveTextContent('flower|1');
  });
});
