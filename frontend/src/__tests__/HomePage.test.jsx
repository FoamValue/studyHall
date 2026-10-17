import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import { deriveCardTitle } from '../components/PlantCard';
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

    // 过滤后只剩向日葵，且请求带上 category 参数（Sprint 8：花朵分类下标题派生为「向日葵花」）
    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
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

  it('TC-45e 首页不渲染朗读喇叭（Sprint 5 新增）', async () => {
    getPlants.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderHome();

    expect(await screen.findByText('向日葵')).toBeInTheDocument();
    expect(document.querySelectorAll('.speak-btn')).toHaveLength(0);
  });

  it('TC-59 卡片次级文字（拼音/英文）字号 ≥16px（Sprint 7 新增，样式源文件断言）', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const block = css.match(/\.plant-card-pinyin[\s\S]*?\.plant-card-en\s*\{[^}]*\}/s)[0];
    const fontSize = Number(block.match(/font-size:\s*(\d+)px/)[1]);
    expect(fontSize).toBeGreaterThanOrEqual(16);
  });
});

describe('卡片标题按分类派生 deriveCardTitle（Sprint 8：TC-64）', () => {
  const plant = (id, zh) => ({ id, name: { zh } });

  it('TC-64a 花朵分类：不含「花」的名+「花」，已含「花」保持原名', () => {
    expect(deriveCardTitle(plant('apple', '苹果'), 'flower')).toBe('苹果花');
    expect(deriveCardTitle(plant('sunflower', '向日葵'), 'flower')).toBe('向日葵花');
    expect(deriveCardTitle(plant('rose', '玫瑰'), 'flower')).toBe('玫瑰花');
    expect(deriveCardTitle(plant('dandelion', '蒲公英'), 'flower')).toBe('蒲公英花');
    // 名字已含「花」→ 保持原名
    expect(deriveCardTitle(plant('peach-blossom', '桃花'), 'flower')).toBe('桃花');
    expect(deriveCardTitle(plant('cherry', '樱花'), 'flower')).toBe('樱花');
    expect(deriveCardTitle(plant('chrysanthemum', '菊花'), 'flower')).toBe('菊花');
    expect(deriveCardTitle(plant('azalea', '杜鹃花'), 'flower')).toBe('杜鹃花');
  });

  it('TC-64b 树叶分类：一律 名称+「叶」', () => {
    expect(deriveCardTitle(plant('apple', '苹果'), 'leaf')).toBe('苹果叶');
    expect(deriveCardTitle(plant('maple', '枫树'), 'leaf')).toBe('枫树叶');
    expect(deriveCardTitle(plant('ginkgo', '银杏'), 'leaf')).toBe('银杏叶');
    expect(deriveCardTitle(plant('dandelion', '蒲公英'), 'leaf')).toBe('蒲公英叶');
  });

  it('TC-64c 果实分类：银杏/松树/荷花 特例，其余保持原名', () => {
    expect(deriveCardTitle(plant('ginkgo', '银杏'), 'fruit')).toBe('白果');
    expect(deriveCardTitle(plant('pine', '松树'), 'fruit')).toBe('松果');
    expect(deriveCardTitle(plant('lotus', '荷花'), 'fruit')).toBe('莲蓬');
    expect(deriveCardTitle(plant('apple', '苹果'), 'fruit')).toBe('苹果');
    expect(deriveCardTitle(plant('banana', '香蕉'), 'fruit')).toBe('香蕉');
  });

  it('TC-64d 「全部」/未知分类：保持原名', () => {
    expect(deriveCardTitle(plant('apple', '苹果'), 'all')).toBe('苹果');
    expect(deriveCardTitle(plant('peach-blossom', '桃花'), 'all')).toBe('桃花');
    expect(deriveCardTitle(plant('apple', '苹果'), undefined)).toBe('苹果');
  });
});
