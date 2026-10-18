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
  // Sprint 17：植物取消二级分类，合并为单一 plant 分类
  { code: 'plant', nameZh: '植物', pinyin: 'zhí wù', nameEn: 'Plant', order: 1, section: 'plant' },
  { code: 'animal', nameZh: '动物', pinyin: 'dòng wù', nameEn: 'Animal', order: 2, section: 'animal' },
  { code: 'insect', nameZh: '昆虫', pinyin: 'kūn chóng', nameEn: 'Insect', order: 3, section: 'insect' },
  { code: 'dinosaur', nameZh: '恐龙', pinyin: 'kǒng lóng', nameEn: 'Dinosaur', order: 4, section: 'dinosaur' },
  { code: 'letter', nameZh: '英文字母', pinyin: 'yīng wén zì mǔ', nameEn: 'Letter', order: 5, section: 'letter' },
  { code: 'pinyin', nameZh: '汉语拼音', pinyin: 'hàn yǔ pīn yīn', nameEn: 'Pinyin', order: 6, section: 'pinyin' },
];

// 与后端契约一致的卡片结构：{id, name, coverImage, parts}
const card = (id, zh, pinyin, en, cover, parts) => ({
  id,
  name: { zh, pinyin, en },
  coverImage: cover,
  parts,
});

// Sprint 17：植物拆分为单部位条目，每条仅一个部位
const SUNFLOWER_CARD = card('sunflower-flower', '向日葵花', 'xiàng rì kuí huā', 'Sunflower', '/images/plants/sunflower-flower.jpg', ['flower']);
const GINKGO_CARD = card('ginkgo-leaf', '银杏叶', 'yín xìng yè', 'Ginkgo Leaf', '/images/plants/ginkgo-leaf.jpg', ['leaf']);
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
  it('TC-11 植物板块无二级筛选条（Sprint 17：取消花朵/树叶/果实分类）', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderHome();

    // 植物板块不再渲染分类筛选按钮（全部/花朵/树叶/果实）
    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '全部' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '花朵' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '树叶' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '果实' })).not.toBeInTheDocument();
  });

  it('TC-12 植物板块统一走 section 请求，无 category 筛选', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderHome();

    // 初始「植物」列表渲染两条
    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
    expect(screen.getByText('银杏叶')).toBeInTheDocument();
    // 植物板块只用 getPlantsBySection('plant')，不调用 getPlants(category)
    expect(getPlantsBySection).toHaveBeenCalledWith('plant');
    expect(getPlants).not.toHaveBeenCalled();
  });

  it('TC-13 空板块显示空态文案「这里还没有植物哦」', async () => {
    getPlantsBySection.mockResolvedValue([]);
    renderHome();

    expect(await screen.findByText('这里还没有植物哦')).toBeInTheDocument();
    expect(screen.queryByText('向日葵花')).not.toBeInTheDocument();
  });

  it('TC-20 卡片图片带 loading="lazy"', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    const img = await screen.findByAltText('向日葵花');
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

  it('TC-25 触控目标：样式表 .filter-btn 的 min-height ≥ 44px（部位/板块按钮共用）', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();
    await screen.findByText('向日葵花');

    // 样式表规则断言：.filter-btn 的 min-height ≥ 44px（jsdom 不计算级联样式，直接读源文件）
    const css = readFileSync('src/styles.css', 'utf-8');
    const block = css.match(/\.filter-btn\s*\{[^}]*\}/s)[0];
    const minHeight = Number(block.match(/min-height:\s*(\d+)px/)[1]);
    expect(minHeight).toBeGreaterThanOrEqual(44);
  });

  it('TC-12b 点击卡片进详情时携带当前板块与列表快照（Sprint 4 新增；Sprint 17 无 category）', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);

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

    await user.click(await screen.findByRole('link', { name: /向日葵花/ }));

    // 详情页拿到 section=plant 及其列表快照（2 条），无 category（Sprint 17 取消二级筛选）
    expect(await screen.findByTestId('probe')).toHaveTextContent('plant|undefined|2');
  });

  it('TC-45e 首页不渲染朗读喇叭（Sprint 5 新增）', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD, GINKGO_CARD]);
    renderHome();

    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
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
  it('TC-79 站点标题三行改名为「认知小图鉴 / rèn zhī xiǎo tú jiàn / Cognitive Guide」', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    expect(await screen.findByText('rèn zhī xiǎo tú jiàn')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '认知小图鉴' })).toBeInTheDocument();
    expect(screen.getByText('Cognitive Guide')).toBeInTheDocument();
    // 旧站名不再出现
    expect(screen.queryByText('自然小图鉴')).not.toBeInTheDocument();
    expect(screen.queryByText('Nature Guide')).not.toBeInTheDocument();
  });

  it('TC-80a 板块导航渲染两组 8 个按钮（自然认知 / 认知启蒙）', async () => {
    getPlantsBySection.mockResolvedValue([SUNFLOWER_CARD]);
    renderHome();

    const nav = await screen.findByRole('group', { name: '板块导航' });
    expect(nav.querySelectorAll('.filter-btn')).toHaveLength(8);
    for (const label of ['植物', '动物', '昆虫', '恐龙', '英文字母', '汉语拼音', '数字', '颜色']) {
      expect(within(nav).getByRole('button', { name: label })).toBeInTheDocument();
    }
    // 两组组标题可见（Sprint 15）
    const groupTitles = [...nav.querySelectorAll('.section-group-title')].map((el) => el.textContent);
    expect(groupTitles).toEqual(['自然认知', '认知启蒙']);
    // 默认选中「植物」
    expect(within(nav).getByRole('button', { name: '植物' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('TC-146 字母卡片名称条件渲染：缺 pinyin/en 字段不渲染空白行（Sprint 15）', async () => {
    const LETTER_CARD = card('letter-a', 'Aa', undefined, undefined, '/images/letters/letter-a.jpg', ['letter']);
    getPlantsBySection.mockResolvedValue([LETTER_CARD]);
    renderHome();

    // 切到「英文字母」板块（该板块无二级筛选）
    const user = userEvent.setup();
    getPlantsBySection.mockImplementation((section) =>
      section === 'letter' ? Promise.resolve([LETTER_CARD]) : Promise.resolve([])
    );
    await user.click(screen.getByRole('button', { name: '英文字母' }));

    expect(await screen.findByText('Aa')).toBeInTheDocument();
    const cardEl = document.querySelector('.plant-card');
    // 主标题渲染，拼音 / 英文行缺失即不渲染（消除空白行）
    expect(cardEl.querySelector('.plant-card-zh')).toHaveTextContent('Aa');
    expect(cardEl.querySelector('.plant-card-pinyin')).toBeNull();
    expect(cardEl.querySelector('.plant-card-en')).toBeNull();
  });

  it('TC-81 切换板块触发 section 请求（Sprint 17：植物无二级筛选）', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockImplementation((section) =>
      section === 'animal' ? Promise.resolve([PANDA_CARD]) : Promise.resolve([SUNFLOWER_CARD])
    );
    renderHome();

    // 默认植物板块：渲染植物列表，无二级筛选
    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: '植物分类筛选' })).not.toBeInTheDocument();

    // 切到动物板块：请求 ?section=animal，渲染板块列表
    await user.click(screen.getByRole('button', { name: '动物' }));
    expect(await screen.findByText('大熊猫')).toBeInTheDocument();
    expect(getPlantsBySection).toHaveBeenLastCalledWith('animal');

    // 切回植物板块：请求 ?section=plant
    await user.click(screen.getByRole('button', { name: '植物' }));
    expect(await screen.findByText('向日葵花')).toBeInTheDocument();
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

describe('卡片标题 deriveCardTitle（Sprint 17：植物拆分后 name.zh 即展示名）', () => {
  const plant = (id, zh) => ({ id, name: { zh } });

  it('TC-64 直接返回条目 name.zh，不再按分类派生', () => {
    // 植物拆分后每条 name.zh 已是最终展示名（桃子/桃花/桃花叶等）
    expect(deriveCardTitle(plant('peach-fruit', '桃子'))).toBe('桃子');
    expect(deriveCardTitle(plant('peach-flower', '桃花'))).toBe('桃花');
    expect(deriveCardTitle(plant('peach-leaf', '桃花叶'))).toBe('桃花叶');
    expect(deriveCardTitle(plant('ginkgo-fruit', '白果'))).toBe('白果');
    // 其他板块同理
    expect(deriveCardTitle(plant('giant-panda', '大熊猫'))).toBe('大熊猫');
    expect(deriveCardTitle(plant('letter-a', 'Aa'))).toBe('Aa');
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

  it('TC-106 「共 N 种」口径：植物板块 40 / 动物板块 10（Sprint 17：无分类筛选）', async () => {
    const user = userEvent.setup();
    getPlantsBySection.mockImplementation((section) =>
      section === 'animal' ? Promise.resolve(makeCards(10)) : Promise.resolve(makeCards(40))
    );
    renderHome();

    // 默认植物板块 40 条
    expect(await screen.findByText('共 40 种')).toBeInTheDocument();

    // 切到动物板块 10 条
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

describe('首页板块 / 分类按钮字号（Sprint 12：TC-123 ~ TC-124）', () => {
  it('TC-123 首页板块 / 分类按钮字号 ≥22px（样式源断言）', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const rule = css.match(
      /\.section-nav \.filter-btn,\s*\.category-filter \.filter-btn\s*\{[^}]*\}/s
    )[0];
    expect(Number(rule.match(/font-size:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(22);
  });

  it('TC-124 EX-9 不误伤详情部位按钮：.filter-btn 基础块仍 20px', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    // 基础块（不含后代选择器）字号保持 20px
    const base = css.match(/\.filter-btn\s*\{[^}]*\}/s)[0];
    expect(Number(base.match(/font-size:\s*(\d+)px/)[1])).toBe(20);
    // 不存在 .part-switcher .filter-btn 的字号覆盖规则（保持继承基础 20px）
    expect(css).not.toMatch(/\.part-switcher \.filter-btn\s*\{[^}]*font-size/s);
  });
});
