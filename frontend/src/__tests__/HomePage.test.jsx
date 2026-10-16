import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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

const SUNFLOWER_CARD = card('sunflower', '向日葵', 'xiàng rì kuí', 'Sunflower', '/images/plants/sunflower-flower.svg', ['flower', 'leaf', 'fruit']);
const GINKGO_CARD = card('ginkgo', '银杏', 'yín xìng', 'Ginkgo', '/images/plants/ginkgo-leaf.svg', ['leaf', 'fruit']);

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
});
