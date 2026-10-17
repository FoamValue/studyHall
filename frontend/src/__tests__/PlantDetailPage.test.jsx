import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlantDetailPage from '../pages/PlantDetailPage';
import { getPlant, getPlants } from '../api/client';

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
      images: [{ type: 'photo', url: '/images/plants/sunflower-flower.jpg' }],
      description: '大大的花盘像小太阳。',
      allusion: { text: '更无柳絮因风起，惟有葵花向日倾。', source: '《客中初夏》', explain: '葵花总是朝着太阳转。' },
    },
    leaf: {
      name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
      images: [{ type: 'photo', url: '/images/plants/sunflower-leaf.jpg' }],
      description: '叶子绿绿的，像大手掌。',
    },
    fruit: {
      name: { zh: '果', pinyin: 'guǒ', en: 'fruit', ipa: '/fruːt/' },
      images: [{ type: 'photo', url: '/images/plants/sunflower-fruit.jpg' }],
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
      images: [{ type: 'photo', url: '/images/plants/ginkgo-leaf.jpg' }],
      description: '叶子像一把把小扇子。',
    },
    fruit: {
      name: { zh: '果', pinyin: 'guǒ', en: 'fruit', ipa: '/fruːt/' },
      images: [{ type: 'photo', url: '/images/plants/ginkgo-fruit.jpg' }],
      description: '白果圆圆的，穿着黄衣裳。',
    },
  },
};

const PEACH = {
  id: 'peach',
  categories: ['flower'],
  name: { zh: '桃花', pinyin: 'táo huā', en: 'Peach blossom', ipa: '/piːtʃ/' },
  parts: {
    flower: {
      name: { zh: '花', pinyin: 'huā', en: 'flower', ipa: '/ˈflaʊər/' },
      images: [{ type: 'photo', url: '/images/plants/peach-blossom-flower.jpg' }],
      description: '粉粉的花瓣像小裙子。',
    },
  },
};

const MAPLE = {
  id: 'maple',
  categories: ['leaf'],
  name: { zh: '枫树', pinyin: 'fēng shù', en: 'Maple', ipa: '/ˈmeɪpl/' },
  parts: {
    leaf: {
      name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
      images: [{ type: 'photo', url: '/images/plants/maple-leaf.jpg' }],
      description: '枫叶像小手掌，秋天变红。',
    },
  },
};

const COCONUT = {
  id: 'coconut',
  categories: ['fruit'],
  name: { zh: '椰子', pinyin: 'yē zi', en: 'Coconut', ipa: '/ˈkoʊkənʌt/' },
  parts: {
    fruit: {
      name: { zh: '果', pinyin: 'guǒ', en: 'fruit', ipa: '/fruːt/' },
      images: [{ type: 'photo', url: '/images/plants/coconut-fruit.jpg' }],
      description: '椰子又大又圆，里面有甜甜的水。',
    },
  },
};

const byId = {
  sunflower: SUNFLOWER,
  ginkgo: GINKGO,
  peach: PEACH,
  maple: MAPLE,
  coconut: COCONUT,
};

// 列表卡片（后端契约：{id, name, coverImage, parts}）
const card = (p) => ({
  id: p.id,
  name: p.name,
  coverImage: p.parts[Object.keys(p.parts)[0]].images[0].url,
  parts: Object.keys(p.parts),
});

const renderDetail = (id, state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: `/plants/${id}`, state }]}>
      <Routes>
        <Route path="/plants/:id" element={<PlantDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  // 详情页无路由 state 时会兜底拉邻居列表，默认给空列表
  getPlants.mockResolvedValue([]);
  getPlant.mockImplementation((id) => Promise.resolve(byId[id]));
});

afterEach(() => {
  delete Element.prototype.requestFullscreen;
  delete document.fullscreenEnabled;
});

describe('PlantDetailPage（TC-14 ~ TC-16）', () => {
  it('TC-14 详情显示花/叶/果大按钮，点击切换内容区（图/名称/说明）', async () => {
    const user = userEvent.setup();
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
    renderDetail('maple');

    expect(await screen.findByAltText('枫树的叶')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByRole('tab', { name: '叶' })).toBeInTheDocument();
  });

  it('TC-20b 详情大图带 loading="lazy"', async () => {
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

describe('PlantDetailPage 连续浏览（Sprint 4：TC-28 ~ TC-34）', () => {
  const FLOWER_LIST = [card(SUNFLOWER), card(PEACH), card(MAPLE)];

  it('TC-28 点「下一株」切到相邻植物并更新内容', async () => {
    const user = userEvent.setup();
    renderDetail('sunflower', { category: 'flower', list: FLOWER_LIST });

    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '下一株' }));

    expect(await screen.findByRole('heading', { name: '桃花' })).toBeInTheDocument();
    expect(getPlant).toHaveBeenLastCalledWith('peach');
  });

  it('TC-29 首尾循环：末株的下一株回到首株，首株的上一株回到末株', async () => {
    const user = userEvent.setup();
    renderDetail('maple', { category: 'flower', list: FLOWER_LIST });

    expect(await screen.findByRole('heading', { name: '枫树' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '下一株' }));
    expect(await screen.findByRole('heading', { name: '向日葵' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '上一株' }));
    expect(await screen.findByRole('heading', { name: '枫树' })).toBeInTheDocument();
  });

  it('TC-30 换株后部位回落：新植物无当前部位时落到它自己的第一个部位', async () => {
    const user = userEvent.setup();
    const list = [card(SUNFLOWER), card(COCONUT)];
    renderDetail('sunflower', { category: 'all', list });

    // 当前选中「叶」，下一株椰子只有「果」
    await user.click(await screen.findByRole('tab', { name: '叶' }));
    expect(await screen.findByAltText('向日葵的叶')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '下一株' }));
    expect(await screen.findByAltText('椰子的果')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '果' })).toHaveAttribute('aria-selected', 'true');
  });

  it('TC-31 单株列表：两侧按钮存在但禁用（不隐藏）', async () => {
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '上一株' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一株' })).toBeDisabled();
  });

  it('TC-32 全屏不可用时按钮不渲染，沉浸式功能正常', async () => {
    // jsdom 默认 document.fullscreenEnabled 为 undefined
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '全屏' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /回花园/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '花' })).toBeInTheDocument();
  });

  it('TC-32b 全屏可用时点「全屏」调用 requestFullscreen', async () => {
    const user = userEvent.setup();
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const requestFullscreen = vi.fn();
    Element.prototype.requestFullscreen = requestFullscreen;

    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });

    const btn = await screen.findByRole('button', { name: '全屏' });
    await user.click(btn);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('TC-33 沉浸式详情保留「← 回花园」入口并指向首页', async () => {
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });

    const back = await screen.findByRole('link', { name: /回花园/ });
    expect(back).toHaveAttribute('href', '/');
  });

  it('TC-33b 键盘 → 换植物（ArrowRight）', async () => {
    renderDetail('sunflower', { category: 'flower', list: FLOWER_LIST });

    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(await screen.findByRole('heading', { name: '桃花' })).toBeInTheDocument();
  });

  it('TC-34 样式断言：.nav-btn 热区 ≥56px、.part-img 不裁切', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const navBlock = css.match(/\.nav-btn\s*\{[^}]*\}/s)[0];
    const minHeight = Number(navBlock.match(/min-height:\s*(\d+)px/)[1]);
    expect(minHeight).toBeGreaterThanOrEqual(56);

    const imgBlock = css.match(/\.part-img\s*\{[^}]*\}/s)[0];
    expect(imgBlock).toContain('object-fit: contain');
  });
});
