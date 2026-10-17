import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import { deriveCardTitle } from '../components/PlantCard';
import { getCategories, getPlants, getPlantsBySection } from '../api/client';

vi.mock('../api/client', () => ({
  getCategories: vi.fn(),
  getPlants: vi.fn(),
  getPlantsBySection: vi.fn(),
  getPlant: vi.fn(),
}));

const CATEGORIES = [
  { code: 'flower', nameZh: '花朵', pinyin: 'huā duǒ', nameEn: 'Flower', order: 1, section: 'plant' },
  { code: 'leaf', nameZh: '树叶', pinyin: 'shù yè', nameEn: 'Leaf', order: 2, section: 'plant' },
  { code: 'fruit', nameZh: '果实', pinyin: 'guǒ shí', nameEn: 'Fruit', order: 3, section: 'plant' },
  // Sprint 9：接口新增板块分类，二级筛选（植物）必须过滤掉它们
  { code: 'animal', nameZh: '动物', pinyin: 'dòng wù', nameEn: 'Animal', order: 4, section: 'animal' },
  { code: 'insect', nameZh: '昆虫', pinyin: 'kūn chóng', nameEn: 'Insect', order: 5, section: 'insect' },
  { code: 'dinosaur', nameZh: '恐龙', pinyin: 'kǒng lóng', nameEn: 'Dinosaur', order: 6, section: 'dinosaur' },
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
const PANDA_CARD = card('giant-panda', '大熊猫', 'dà xióng māo', 'Giant Panda', '/images/animals/giant-panda.jpg', ['animal']);

const renderHome = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
  getCategories.mockResolvedValue(CATEGORIES);
  // 植物板块「全部」走 getPlantsBySection('plant')；默认空列表
  getPlantsBySection.mockResolvedValue([]);
  getPlants.mockResolvedValue([]);
});

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('HomePage（TC-11 ~ TC-13）', () => {
  it('TC-11 首页渲染分类按钮：全部/花朵/树叶/果实 四钮可见', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderHome();

    expect(await screen.findByRole('button', { name: '全部' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '花朵' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '树叶' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '果实' })).toBeInTheDocument();
    // Sprint 9：二级筛选只取植物板块分类，板块分类（动物/昆虫/恐龙）不得出现在筛选条内
    const filterGroup = screen.getByRole('group', { name: '植物分类筛选' });
    expect(filterGroup.querySelectorAll('.filter-btn')).toHaveLength(4);
    for (const board of ['动物', '昆虫', '恐龙']) {
      expect(within(filterGroup).queryByRole('button', { name: board })).not.toBeInTheDocument();
    }
  });

  it('TC-12 点击分类触发对应 category 请求并渲染过滤后的卡片列表', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    getPlants.mockImplementation((category) =>
      category === 'flower' ? Promise.resolve([SUNFLOWER_CARD]) : Promise.resolve([])
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
    getPlantsBySection.mockResolvedValue([]);
    getPlants.mockResolvedValue([]);
    renderHome();

    await user.click(await screen.findByRole('button', { name: '树叶' }));

    expect(await screen.findByText('这个分类还没有植物哦')).toBeInTheDocument();
    expect(screen.queryByText('向日葵')).not.toBeInTheDocument();
  });

  it('TC-20 卡片图片带 loading="lazy"', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    const img = await screen.findByAltText('向日葵');
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('TC-21 100 条数据渲染无异常', async () => {
    const cards = Array.from({ length: 100 }, (_, i) =>
      card(`plant-${i}`, `植物${i}`, `zhí wù ${i}`, `Plant ${i}`, '/images/plants/sunflower-flower.jpg', ['flower'])
    );
    getPlantsBySection.mockResolvedValue(cards);
    renderHome();

    expect(await screen.findByText('植物0')).toBeInTheDocument();
    // Sprint 10（EX-6）：jsdom 无 IntersectionObserver → 全量降级渲染；等待末条出现再断言计数
    expect(await screen.findByText('植物99')).toBeInTheDocument();
    expect(document.querySelectorAll('.plant-card')).toHaveLength(100);
  });

  it('TC-25 触控目标：分类按钮使用 .filter-btn，且样式表 min-height ≥ 44px', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
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

  it('TC-12b 点击卡片进详情时携带当前板块/分类与列表快照（Sprint 4 新增）', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    getPlants.mockImplementation((category) =>
      category === 'flower' ? Promise.resolve([SUNFLOWER_CARD]) : Promise.resolve([])
    );

    // 探针路由：把详情页收到的 location.state 渲染成可断言文本
    const StateProbe = () => {
      const loc = useLocation();
      return (
        <div data-testid="probe">{`${loc.state?.section}|${loc.state?.category}|${loc.state?.list?.length}`}</div>
      );
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

    // 详情页拿到 section=plant、category=flower 及其列表快照（1 株）
    expect(await screen.findByTestId('probe')).toHaveTextContent('plant|flower|1');
  });

  it('TC-45e 首页不渲染朗读喇叭（Sprint 5 新增）', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
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

describe('首页板块导航与站点改名（Sprint 9：TC-79 ~ TC-81、TC-80b、TC-25b）', () => {
  it('TC-79 站点标题三行改名为「自然小图鉴 / zì rán xiǎo tú jiàn / Nature Guide」', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    expect(await screen.findByText('zì rán xiǎo tú jiàn')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '自然小图鉴' })).toBeInTheDocument();
    expect(screen.getByText('Nature Guide')).toBeInTheDocument();
    // 旧站名不再出现
    expect(screen.queryByText('植物小花园')).not.toBeInTheDocument();
    expect(screen.queryByText('Plant Garden')).not.toBeInTheDocument();
  });

  it('TC-80a 板块导航渲染植物/动物/昆虫/恐龙 4 个按钮', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    const nav = await screen.findByRole('group', { name: '板块导航' });
    expect(nav.querySelectorAll('.filter-btn')).toHaveLength(4);
    for (const label of ['植物', '动物', '昆虫', '恐龙']) {
      expect(within(nav).getByRole('button', { name: label })).toBeInTheDocument();
    }
    // 默认选中「植物」
    expect(within(nav).getByRole('button', { name: '植物' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('TC-81 切换板块触发 section 请求；二级筛选仅植物板块渲染', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockImplementation((section) =>
      section === 'animal' ? Promise.resolve([PANDA_CARD]) : Promise.resolve([SUNFLOWER_CARD])
    );
    renderHome();

    // 默认植物板块：二级分类筛选渲染
    expect(await screen.findByRole('group', { name: '植物分类筛选' })).toBeInTheDocument();

    // 切到动物板块：请求 ?section=animal，二级筛选消失，渲染板块列表
    await user.click(screen.getByRole('button', { name: '动物' }));
    expect(await screen.findByText('大熊猫')).toBeInTheDocument();
    expect(getPlantsBySection).toHaveBeenLastCalledWith('animal');
    expect(screen.queryByRole('group', { name: '植物分类筛选' })).not.toBeInTheDocument();

    // 切回植物板块：二级筛选恢复且回到「全部」，请求 ?section=plant
    await user.click(screen.getByRole('button', { name: '植物' }));
    expect(await screen.findByRole('group', { name: '植物分类筛选' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '全部' })).toHaveAttribute('aria-pressed', 'true');
    expect(getPlantsBySection).toHaveBeenLastCalledWith('plant');
  });

  it('TC-80b 非植物板块空态文案「这个板块还没有内容哦」', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockResolvedValue([]);
    renderHome();

    await user.click(screen.getByRole('button', { name: '恐龙' }));

    expect(await screen.findByText('这个板块还没有内容哦')).toBeInTheDocument();
  });

  it('TC-25b 样式断言：.section-nav 与分类筛选同组 flex 且 gap ≥16px、热区 ≥56px', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    // 板块导航与二级筛选复用同一 flex 布局规则
    const group = css.match(/\.category-filter,\s*\.part-switcher,\s*\.section-nav\s*\{[^}]*\}/s)[0];
    expect(group).toMatch(/gap:\s*16px/);
    // 板块导航与二级筛选两行间距 ≥16px（独立 margin 规则）
    const sectionBlocks = [...css.matchAll(/\.section-nav\s*\{([^}]*)\}/gs)].map((m) => m[1]);
    const marginBlock = sectionBlocks.find((b) => /margin-bottom/.test(b));
    expect(marginBlock).toBeTruthy();
    expect(Number(marginBlock.match(/margin-bottom:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(16);
    // 热区由 .filter-btn 保证
    const filterBlock = css.match(/\.filter-btn\s*\{[^}]*\}/s)[0];
    expect(Number(filterBlock.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(56);
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

describe('首页增量加载与总量提示（Sprint 10：TC-106 ~ TC-108、TC-108b）', () => {
  const makeCards = (n) =>
    Array.from({ length: n }, (_, i) =>
      card(`plant-${i}`, `植物${i}`, `zhí wù ${i}`, `Plant ${i}`, '/images/plants/sunflower-flower.jpg', ['flower'])
    );

  // 可手动触发的 IntersectionObserver 桩：记录回调与观察元素，测试中显式派发进入视口
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
  const flush = async () => act(async () => {});

  it('TC-106 「共 N 种」口径：全部 40 / 分类 7 / 板块 10', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockImplementation((section) =>
      section === 'animal' ? Promise.resolve(makeCards(10)) : Promise.resolve(makeCards(40))
    );
    getPlants.mockResolvedValue(makeCards(7));
    renderHome();

    expect(await screen.findByText('共 40 种')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '花朵' }));
    expect(await screen.findByText('共 7 种')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '动物' }));
    expect(await screen.findByText('共 10 种')).toBeInTheDocument();
  });

  it('TC-107 无 IntersectionObserver 时首屏全量渲染（降级），不渲染哨兵', async () => {
    // jsdom 默认无 IntersectionObserver → 走降级分支
    getPlantsBySection.mockResolvedValue(makeCards(40));
    renderHome();

    expect(await screen.findByText('植物39')).toBeInTheDocument();
    expect(cardCount()).toBe(40);
    expect(document.querySelector('.load-sentinel')).not.toBeInTheDocument();
  });

  it('TC-108 哨兵进入视口逐页追加：16 → 32 → 40 后哨兵消失', async () => {
    const callbacks = stubIO();
    getPlantsBySection.mockResolvedValue(makeCards(40));
    renderHome();

    expect(await screen.findByText('共 40 种')).toBeInTheDocument();
    // 首屏 16 张 + 哨兵存在
    expect(cardCount()).toBe(16);
    expect(document.querySelector('.load-sentinel')).toBeInTheDocument();

    // 触发一次 → 追加到 32
    await act(async () => {
      callbacks.at(-1)([{ isIntersecting: true }]);
    });
    expect(cardCount()).toBe(32);

    // 再次触发 → 到 40，哨兵消失
    await act(async () => {
      callbacks.at(-1)([{ isIntersecting: true }]);
    });
    expect(cardCount()).toBe(40);
    expect(document.querySelector('.load-sentinel')).not.toBeInTheDocument();
    await flush();
  });

  it('TC-108b 回花园按记录条数恢复，不退回首屏 16', async () => {
    stubIO();
    sessionStorage.setItem('sh:homeVisibleCount', '32');
    getPlantsBySection.mockResolvedValue(makeCards(40));

    render(
      <MemoryRouter initialEntries={[{ pathname: '/', state: { restoreScroll: true } }]}>
        <HomePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('共 40 种')).toBeInTheDocument();
    // 初始渲染条数 = max(16, 32) = 32，而非首屏 16
    expect(cardCount()).toBe(32);
  });
});
