import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlantDetailPage from '../pages/PlantDetailPage';
import { getPlant } from '../api/client';

vi.mock('../api/client', () => ({
  getCategories: vi.fn(),
  getPlants: vi.fn(),
  getPlant: vi.fn(),
}));

// 与后端契约一致的完整植物文档
const SUNFLOWER = {
  id: 'sunflower',
  categories: ['flower'],
  name: { zh: '向日葵', pinyin: 'xiàng rì kuí', en: 'Sunflower', ipa: '/ˈsʌnˌflaʊər/' },
  parts: {
    flower: {
      name: { zh: '花', pinyin: 'huā', en: 'flower', ipa: '/ˈflaʊər/' },
      images: [{ type: 'illustration', url: '/images/plants/sunflower-flower.svg' }],
      description: '大大的花盘像小太阳。',
      allusion: { text: '更无柳絮因风起，惟有葵花向日倾。', source: '《客中初夏》', explain: '葵花总是朝着太阳转。' },
    },
    leaf: {
      name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
      images: [{ type: 'illustration', url: '/images/plants/sunflower-leaf.svg' }],
      description: '叶子绿绿的，像大手掌。',
    },
    fruit: {
      name: { zh: '果', pinyin: 'guǒ', en: 'fruit', ipa: '/fruːt/' },
      images: [{ type: 'illustration', url: '/images/plants/sunflower-fruit.svg' }],
      description: '葵花籽香香的，可以吃。',
    },
  },
};

// 银杏无 flower 部位
const GINKGO = {
  id: 'ginkgo',
  categories: ['leaf'],
  name: { zh: '银杏', pinyin: 'yín xìng', en: 'Ginkgo', ipa: '/ˈɡɪŋkoʊ/' },
  parts: {
    leaf: {
      name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
      images: [{ type: 'illustration', url: '/images/plants/ginkgo-leaf.svg' }],
      description: '叶子像一把把小扇子。',
    },
    fruit: {
      name: { zh: '果', pinyin: 'guǒ', en: 'fruit', ipa: '/fruːt/' },
      images: [{ type: 'illustration', url: '/images/plants/ginkgo-fruit.svg' }],
      description: '白果圆圆的，穿着黄衣裳。',
    },
  },
};

const renderDetail = (id) =>
  render(
    <MemoryRouter initialEntries={[`/plants/${id}`]}>
      <Routes>
        <Route path="/plants/:id" element={<PlantDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PlantDetailPage（TC-14 ~ TC-16）', () => {
  it('TC-14 详情显示花/叶/果大按钮，点击切换内容区（图/名称/说明）', async () => {
    const user = userEvent.setup();
    getPlant.mockResolvedValue(SUNFLOWER);
    renderDetail('sunflower');

    // 默认展示花的图片与说明
    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    expect(screen.getByText('大大的花盘像小太阳。')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '花' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '叶' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '果' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '果' }));

    // 内容区切换为果实：图片、部位名称、说明全部更新
    expect(await screen.findByAltText('向日葵的果')).toBeInTheDocument();
    expect(screen.getByText('葵花籽香香的，可以吃。')).toBeInTheDocument();
    expect(screen.getByText('guǒ · fruit /fruːt/')).toBeInTheDocument();
    expect(screen.queryByAltText('向日葵的花')).not.toBeInTheDocument();
    expect(screen.queryByText('大大的花盘像小太阳。')).not.toBeInTheDocument();
  });

  it('TC-15 缺部位隐藏标签：银杏不显示「花」，默认选中叶', async () => {
    getPlant.mockResolvedValue(GINKGO);
    renderDetail('ginkgo');

    expect(await screen.findByAltText('银杏的叶')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '花' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '叶' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '果' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '叶' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '果' })).toHaveAttribute('aria-selected', 'false');
  });

  it('TC-16 典故：有典故渲染 AllusionCard，无典故不渲染', async () => {
    const user = userEvent.setup();
    getPlant.mockResolvedValue(SUNFLOWER);
    renderDetail('sunflower');

    // 花部位有典故：原文 + 出处 + 白话解释都渲染
    expect(await screen.findByText('更无柳絮因风起，惟有葵花向日倾。')).toBeInTheDocument();
    expect(screen.getByText('—— 《客中初夏》')).toBeInTheDocument();
    expect(screen.getByText('葵花总是朝着太阳转。')).toBeInTheDocument();

    // 切到无典故的叶部位：卡片整体不渲染
    await user.click(screen.getByRole('tab', { name: '叶' }));
    expect(await screen.findByAltText('向日葵的叶')).toBeInTheDocument();
    expect(screen.queryByText('更无柳絮因风起，惟有葵花向日倾。')).not.toBeInTheDocument();
    expect(screen.queryByText('葵花总是朝着太阳转。')).not.toBeInTheDocument();
  });

  it('TC-18 仅 leaf 植物只渲染「叶」标签（Sprint 2 新增）', async () => {
    const MAPLE = {
      id: 'maple',
      categories: ['leaf'],
      name: { zh: '枫树', pinyin: 'fēng shù', en: 'Maple', ipa: '/ˈmeɪpl/' },
      parts: {
        leaf: {
          name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
          images: [{ type: 'illustration', url: '/images/plants/maple-leaf.svg' }],
          description: '枫叶像小手掌，秋天变红。',
        },
      },
    };
    getPlant.mockResolvedValue(MAPLE);
    renderDetail('maple');

    expect(await screen.findByAltText('枫树的叶')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: '叶' })).toBeInTheDocument();
  });

  it('TC-20b 详情大图带 loading="lazy"', async () => {
    getPlant.mockResolvedValue(SUNFLOWER);
    renderDetail('sunflower');

    const img = await screen.findByAltText('向日葵的花');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('附加：40401 显示友好提示「这株植物还没准备好哦」', async () => {
    getPlant.mockRejectedValue({ code: 40401, message: '植物不存在' });
    renderDetail('nope');

    expect(await screen.findByText('这株植物还没准备好哦')).toBeInTheDocument();
  });
});
