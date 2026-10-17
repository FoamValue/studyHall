import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PlantDetailPage from '../pages/PlantDetailPage';
import AllusionCard from '../components/AllusionCard';
import { PART_ORDER, PART_LABELS, getOrderedParts } from '../components/PartSwitcher';
import { getPlant, getPlants, getPlantsBySection } from '../api/client';

vi.mock('../api/client', () => ({
  getCategories: vi.fn(),
  getPlants: vi.fn(),
  getPlantsBySection: vi.fn(),
  getPlant: vi.fn(),
}));

// 与后端契约一致的完整植物文档（Sprint 9：name 可带预生成音频路径 audioZh/audioEn）
const SUNFLOWER = {
  id: 'sunflower',
  categories: ['flower'],
  name: {
    zh: '向日葵',
    pinyin: 'xiàng rì kuí',
    en: 'Sunflower',
    ipa: '/ˈsʌnˌflaʊər/',
    audioZh: '/audio/sunflower-zh.m4a',
    audioEn: '/audio/sunflower-en.m4a',
  },
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
  name: {
    zh: '桃花',
    pinyin: 'táo huā',
    en: 'Peach blossom',
    ipa: '/piːtʃ/',
    audioZh: '/audio/peach-blossom-zh.m4a',
    audioEn: '/audio/peach-blossom-en.m4a',
  },
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

// 苹果：花/叶/果三部位齐全，固定顺序首个部位为「花」（验证默认部位是否跟随分类）
const APPLE = {
  id: 'apple',
  categories: ['flower', 'leaf', 'fruit'],
  name: { zh: '苹果', pinyin: 'píng guǒ', en: 'Apple', ipa: '/ˈæpl/' },
  parts: {
    flower: {
      name: { zh: '花', pinyin: 'huā', en: 'flower', ipa: '/ˈflaʊər/' },
      images: [{ type: 'photo', url: '/images/plants/apple-flower.jpg' }],
      description: '苹果花白白的，带一点粉。',
    },
    leaf: {
      name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
      images: [{ type: 'photo', url: '/images/plants/apple-leaf.jpg' }],
      description: '苹果叶椭圆椭圆的，绿油油。',
    },
    fruit: {
      name: { zh: '果', pinyin: 'guǒ', en: 'fruit', ipa: '/fruːt/' },
      images: [{ type: 'photo', url: '/images/plants/apple-fruit.jpg' }],
      description: '苹果圆滚滚、红红的。',
    },
  },
};

// 动物单图条目（Sprint 9）：parts 恰 1 键且为板块 code `animal`
const PANDA = {
  id: 'giant-panda',
  categories: ['animal'],
  name: {
    zh: '大熊猫',
    pinyin: 'dà xióng māo',
    en: 'Giant Panda',
    ipa: '/ˈdʒaɪənt ˈpændə/',
    audioZh: '/audio/giant-panda-zh.m4a',
    audioEn: '/audio/giant-panda-en.m4a',
  },
  parts: {
    animal: {
      name: { zh: '动物', pinyin: 'dòng wù', en: 'animal' },
      images: [{ type: 'photo', url: '/images/animals/giant-panda.jpg' }],
      description: '大熊猫胖乎乎的，最爱吃竹子。',
      allusion: { text: '大熊猫是我们中国的国宝。', explain: '它们只住在中国的竹林里。' },
    },
  },
};

// 恐龙单图条目（有英文名但缺 audioEn，验证英文喇叭按音频缺失不渲染）
const TREX = {
  id: 'tyrannosaurus',
  categories: ['dinosaur'],
  name: { zh: '霸王龙', pinyin: 'bà wáng lóng', en: 'Tyrannosaurus', audioZh: '/audio/tyrannosaurus-zh.m4a' },
  parts: {
    dinosaur: {
      name: { zh: '恐龙', pinyin: 'kǒng lóng', en: 'dinosaur' },
      images: [{ type: 'photo', url: '/images/dinosaurs/tyrannosaurus.jpg' }],
      description: '霸王龙的牙齿又大又尖。',
    },
  },
};

const byId = {
  sunflower: SUNFLOWER,
  ginkgo: GINKGO,
  peach: PEACH,
  maple: MAPLE,
  coconut: COCONUT,
  apple: APPLE,
  'giant-panda': PANDA,
  tyrannosaurus: TREX,
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

// 预生成音频 mock：桩掉全局 Audio，记录每个实例的 src / play / pause 调用
function makeAudioMock() {
  const instances = [];
  class MockAudio {
    constructor(src) {
      this.src = src || '';
      this.currentTime = 0;
      this.paused = true;
      this.onended = null;
      this.onerror = null;
      this.play = vi.fn(() => {
        this.paused = false;
        return Promise.resolve();
      });
      this.pause = vi.fn(() => {
        this.paused = true;
      });
      instances.push(this);
    }
  }
  vi.stubGlobal('Audio', MockAudio);
  return { instances };
}

beforeEach(() => {
  vi.clearAllMocks();
  // 详情页无路由 state 时会兜底拉邻居列表，默认给空列表
  getPlants.mockResolvedValue([]);
  getPlantsBySection.mockResolvedValue([]);
  getPlant.mockImplementation((id) => Promise.resolve(byId[id]));
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete Element.prototype.requestFullscreen;
  delete document.fullscreenEnabled;
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
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
    // 部位名行（中文/拼音/英文/音标）已移除，部位语义只由切换按钮承载
    expect(screen.queryByText('guǒ · fruit /fruːt/')).not.toBeInTheDocument();
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

describe('PlantDetailPage 名称预生成音频播放（Sprint 9：TC-41 ~ TC-45f）', () => {
  const FLOWER_LIST = [card(SUNFLOWER), card(PEACH), card(MAPLE)];

  it('TC-41 点中文喇叭播放中文名音频（audioZh）', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵的花');

    await user.click(screen.getByRole('button', { name: '朗读中文名' }));

    expect(audio.instances).toHaveLength(1);
    expect(audio.instances[0].src).toBe('/audio/sunflower-zh.m4a');
    expect(audio.instances[0].play).toHaveBeenCalledTimes(1);
  });

  it('TC-42 点英文喇叭播放英文名音频（audioEn）', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵的花');

    await user.click(screen.getByRole('button', { name: '朗读英文名' }));

    expect(audio.instances[0].src).toBe('/audio/sunflower-en.m4a');
    expect(audio.instances[0].play).toHaveBeenCalledTimes(1);
  });

  it('TC-43 两喇叭互斥：点英文喇叭先暂停当前再播放英文名', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵的花');

    await user.click(screen.getByRole('button', { name: '朗读中文名' }));
    await user.click(screen.getByRole('button', { name: '朗读英文名' }));

    expect(audio.instances).toHaveLength(1); // 单例音频，同一时刻至多一个
    expect(audio.instances[0].src).toBe('/audio/sunflower-en.m4a');
    expect(audio.instances[0].play).toHaveBeenCalledTimes(2);
    expect(audio.instances[0].pause).toHaveBeenCalled(); // 互斥：播放前先暂停当前
    expect(screen.getByRole('button', { name: '朗读英文名' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '朗读中文名' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('TC-44 再点同一喇叭即停止', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵的花');

    const zhBtn = screen.getByRole('button', { name: '朗读中文名' });
    await user.click(zhBtn);
    expect(zhBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(zhBtn);
    expect(audio.instances[0].pause).toHaveBeenCalledTimes(2); // play 内 1 次 + 停止 1 次
    expect(zhBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC-45 场景自动停止：切部位 / 换株 / 卸载（pause 增加）', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    const totalPause = () => audio.instances.reduce((n, a) => n + a.pause.mock.calls.length, 0);

    // ① 切部位
    const first = renderDetail('sunflower', { category: 'flower', list: FLOWER_LIST });
    await screen.findByAltText('向日葵的花');
    await user.click(screen.getByRole('button', { name: '朗读中文名' }));
    const afterSpeak = totalPause();
    await user.click(screen.getByRole('tab', { name: '叶' }));
    expect(await screen.findByAltText('向日葵的叶')).toBeInTheDocument();
    expect(totalPause()).toBeGreaterThan(afterSpeak);
    first.unmount();

    // ② 换株
    const second = renderDetail('sunflower', { category: 'flower', list: FLOWER_LIST });
    await screen.findByAltText('向日葵的花');
    await user.click(screen.getByRole('button', { name: '朗读中文名' }));
    const beforeSwitch = totalPause();
    await user.click(screen.getByRole('button', { name: '下一株' }));
    expect(await screen.findByRole('heading', { name: '桃花' })).toBeInTheDocument();
    expect(totalPause()).toBeGreaterThan(beforeSwitch);
    second.unmount();

    // ③ 卸载
    const third = renderDetail('sunflower', { category: 'flower', list: FLOWER_LIST });
    await screen.findByAltText('向日葵的花');
    await user.click(screen.getByRole('button', { name: '朗读中文名' }));
    const beforeUnmount = totalPause();
    third.unmount();
    expect(totalPause()).toBeGreaterThan(beforeUnmount);
  });

  it('TC-45b 喇叭播放的是名称音频：src 为名称读音而非部位/说明', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵的花');

    await user.click(screen.getByRole('button', { name: '朗读中文名' }));

    const src = audio.instances.at(-1).src;
    // 播放的是名称读音（audioZh），而非部位图/说明路径
    expect(src).toBe('/audio/sunflower-zh.m4a');
    expect(src).toMatch(/-zh\.m4a$/);
  });

  it('TC-45c 无预生成音频时喇叭不渲染，且不调用 speechSynthesis（降级）', async () => {
    const speak = vi.fn();
    Object.defineProperty(window, 'speechSynthesis', {
      value: { speak, cancel: vi.fn(), getVoices: () => [] },
      configurable: true,
    });
    makeAudioMock();
    // 语料无 audioZh/audioEn（仅中文名/拼音/英文名）
    getPlant.mockImplementation(() =>
      Promise.resolve({ ...SUNFLOWER, name: { zh: '向日葵', pinyin: 'xiàng rì kuí', en: 'Sunflower' } })
    );

    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读中文名' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读英文名' })).not.toBeInTheDocument();
    expect(speak).not.toHaveBeenCalled(); // 绝不回退语音合成
    expect(screen.getByRole('tab', { name: '花' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /回花园/ })).toBeInTheDocument();
  });

  it('TC-45d 有英文名但缺 audioEn 时不渲染英文喇叭，中文喇叭仍在', async () => {
    makeAudioMock();
    getPlant.mockImplementation(() =>
      Promise.resolve({
        ...SUNFLOWER,
        name: { zh: '向日葵', pinyin: 'xiàng rì kuí', en: 'Sunflower', audioZh: '/audio/sunflower-zh.m4a' },
      })
    );

    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByRole('button', { name: '朗读中文名' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读英文名' })).not.toBeInTheDocument();
  });

  it('TC-45f 样式断言：.speak-btn 热区 ≥56px', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const block = css.match(/\.speak-btn\s*\{[^}]*\}/s)[0];
    expect(Number(block.match(/min-height:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(56);
    expect(Number(block.match(/min-width:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(56);
  });
});

describe('详情页整屏不滚动（Sprint 6：TC-53 ~ TC-56，样式源文件断言）', () => {
  const css = readFileSync('src/styles.css', 'utf-8');
  const blocks = (sel) => [...css.matchAll(new RegExp(`${sel}\\s*\\{[^}]*\\}`, 'gs'))].map((m) => m[0]);

  it('TC-53 沉浸式容器脱离文档流并铺满视口', () => {
    const block = blocks('\\.detail-immersive')[0];
    expect(block).toContain('position: fixed');
    expect(block).toContain('inset: 0');
    expect(block).not.toContain('100dvh');
  });

  it('TC-54 内容区不可滚动（overflow: hidden 而非 auto）', () => {
    const block = blocks('\\.detail-body')[0];
    expect(block).toContain('overflow: hidden');
    expect(block).not.toMatch(/overflow:\s*auto/);
  });

  it('TC-55 滚动链式传递被阻断', () => {
    expect(blocks('\\.detail-immersive')[0]).toContain('overscroll-behavior');
    expect(blocks('\\.detail-body')[0]).toContain('overscroll-behavior: contain');
  });

  it('TC-56 图片按剩余空间自适应且完整不裁切', () => {
    const imgAll = blocks('\\.part-img').join('\n');
    expect(imgAll).toMatch(/flex:\s*0\s+1\s+auto/); // 可随剩余空间收缩
    expect(imgAll).toContain('object-fit: contain');
    expect(imgAll).toContain('max-height: 100%'); // 横屏覆盖：随容器高度
  });
});

describe('横屏详情版式（Sprint 7 TC-60 / Sprint 9 左图右文，样式源文件断言）', () => {
  const css = readFileSync('src/styles.css', 'utf-8');

  it('TC-60 横屏为「左图 + 右文字」两栏，图片占 48% 栏宽且完整不裁切', () => {
    const landscape = css.match(/@media\s*\(orientation:\s*landscape\)\s*\{[\s\S]*?\n\}/)[0];
    // 两栏骨架：左 48% 图栏 + 右自适应文字栏
    const bodyBlock = landscape.match(/\.detail-body\s*\{[^}]*\}/s)[0];
    expect(bodyBlock).toMatch(/grid-template-columns:\s*48%\s+minmax\(0,\s*1fr\)/);
    // 拆掉中间层，让图片与文字直接落进两栏
    expect(landscape.match(/\.detail-main\s*\{[^}]*\}/s)[0]).toContain('display: contents');
    // 图片吃满左栏且完整不裁切
    const imgBlock = landscape.match(/\.part-img\s*\{[^}]*\}/s)[0];
    expect(imgBlock).toMatch(/max-width:\s*100%/);
    expect(imgBlock).toContain('max-height: 100%');
    expect(imgBlock).toContain('object-fit: contain');
    // 不再出现旧版上限
    expect(landscape).not.toMatch(/max-width:\s*40%/);
  });
});

describe('详情默认部位跟随入口分类（Sprint 8：TC-65 / TC-66）', () => {
  it('TC-65 来自「树叶」分类：苹果默认选中「叶」，大图与卡片图一致', async () => {
    const user = userEvent.setup();
    renderDetail('apple', { category: 'leaf', list: [card(APPLE), card(GINKGO)] });

    // 默认选中「叶」，而非固定顺序首位「花」
    expect(await screen.findByAltText('苹果的叶')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '叶' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '花' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByAltText('苹果的叶')).toHaveAttribute('src', '/images/plants/apple-leaf.jpg');

    // 仍可手动切到花 / 果
    await user.click(screen.getByRole('tab', { name: '花' }));
    expect(await screen.findByAltText('苹果的花')).toBeInTheDocument();
  });

  it('TC-66a 来自「全部」分类：苹果仍默认「花」（固定顺序首位）', async () => {
    renderDetail('apple', { category: 'all', list: [card(APPLE)] });

    expect(await screen.findByAltText('苹果的花')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '花' })).toHaveAttribute('aria-selected', 'true');
  });

  it('TC-66b 来自「花朵」分类：苹果默认「花」', async () => {
    renderDetail('apple', { category: 'flower', list: [card(APPLE)] });

    expect(await screen.findByAltText('苹果的花')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '花' })).toHaveAttribute('aria-selected', 'true');
  });

  it('TC-66c 来自「果实」分类：银杏默认「果」', async () => {
    renderDetail('ginkgo', { category: 'fruit', list: [card(GINKGO)] });

    // 银杏固定顺序首位为「叶」，果实分类应默认选中「果」
    expect(await screen.findByAltText('银杏的果')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '果' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByAltText('银杏的果')).toHaveAttribute('src', '/images/plants/ginkgo-fruit.jpg');
  });

  it('TC-66d 换株后默认部位仍跟随当前分类', async () => {
    const user = userEvent.setup();
    renderDetail('apple', { category: 'fruit', list: [card(APPLE), card(GINKGO)] });

    expect(await screen.findByAltText('苹果的果')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '下一株' }));
    // 新植物（银杏）默认部位也应跟随「果实」分类 → 果，而非其固定首位的「叶」
    expect(await screen.findByAltText('银杏的果')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '果' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('单图板块详情分支（Sprint 9：TC-82a / TC-82b / TC-83）', () => {
  it('TC-82a 动物单图条目：不渲染 PartSwitcher，渲染大图与说明 + 小知识', async () => {
    renderDetail('giant-panda', { section: 'animal', list: [card(PANDA)] });

    // 大图以名称作 alt（无部位三语名行）
    expect(await screen.findByAltText('大熊猫')).toBeInTheDocument();
    expect(screen.getByAltText('大熊猫')).toHaveAttribute('src', '/images/animals/giant-panda.jpg');
    // 不渲染部位切换条
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    // 说明与小知识卡片渲染
    expect(screen.getByText('大熊猫胖乎乎的，最爱吃竹子。')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '小知识' })).toBeInTheDocument();
    expect(screen.getByText('大熊猫是我们中国的国宝。')).toBeInTheDocument();
  });

  it('TC-83 植物条目仍渲染部位切换（单图分支不误伤）', async () => {
    renderDetail('sunflower', { section: 'plant', category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '花' })).toBeInTheDocument();
  });

  it('TC-82b 恐龙单图条目 + 缺 audioEn：不渲染部位切换与英文喇叭', async () => {
    makeAudioMock();
    renderDetail('tyrannosaurus', { section: 'dinosaur', list: [card(TREX)] });

    expect(await screen.findByAltText('霸王龙')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '朗读中文名' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读英文名' })).not.toBeInTheDocument();
  });
});

describe('小知识卡片称谓（Sprint 9：TC-88）', () => {
  it('TC-88 典故/小知识卡片 aria-label 为「小知识」，无内容不渲染', async () => {
    const user = userEvent.setup();
    renderDetail('sunflower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByRole('region', { name: '小知识' })).toBeInTheDocument();

    // 切到无小知识的叶部位 → 卡片整体不渲染
    await user.click(screen.getByRole('tab', { name: '叶' }));
    expect(await screen.findByAltText('向日葵的叶')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '小知识' })).not.toBeInTheDocument();
  });
});

describe('PART_ORDER / PART_LABELS 扩展（Sprint 9：TC-84）', () => {
  it('TC-84a 板块部位尾部追加，植物顺序（flower,leaf,fruit）保持不变', () => {
    expect(PART_ORDER).toEqual(['flower', 'leaf', 'fruit', 'animal', 'insect', 'dinosaur']);
    expect(PART_LABELS).toMatchObject({
      flower: '花',
      leaf: '叶',
      fruit: '果',
      animal: '动物',
      insect: '昆虫',
      dinosaur: '恐龙',
    });
  });

  it('TC-84b getOrderedParts 支持单键板块部位', () => {
    expect(getOrderedParts({ animal: {} })).toEqual(['animal']);
    expect(getOrderedParts({ insect: {}, animal: {} })).toEqual(['animal', 'insect']);
    expect(getOrderedParts({ flower: {}, leaf: {}, fruit: {} })).toEqual(['flower', 'leaf', 'fruit']);
  });
});

describe('小知识可见标题与单图横屏版式（Sprint 10：TC-101 ~ TC-105）', () => {
  const css = readFileSync('src/styles.css', 'utf-8');

  it('TC-101 小知识卡片渲染用户可见标题「小知识」', () => {
    render(<AllusionCard allusion={{ text: '大熊猫是我们中国的国宝。' }} />);

    // 可见标题（此前仅 aria-label）
    expect(screen.getByText('小知识')).toBeInTheDocument();
    expect(screen.getByText('小知识')).toHaveClass('allusion-title');
    // 无障碍名沿用「小知识」
    expect(screen.getByRole('region', { name: '小知识' })).toBeInTheDocument();
  });

  it('TC-102 小知识标题字号 ≥20px（样式源文件断言）', () => {
    const block = css.match(/\.allusion-title\s*\{[^}]*\}/s)[0];
    expect(Number(block.match(/font-size:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(20);
  });

  it('TC-103 无内容不渲染（不回归）', () => {
    const first = render(<AllusionCard allusion={null} />);
    expect(first.container.querySelector('.allusion-card')).toBeNull();
    first.unmount();

    const second = render(<AllusionCard allusion={{}} />);
    expect(second.container.querySelector('.allusion-card')).toBeNull();
    expect(screen.queryByText('小知识')).not.toBeInTheDocument();
  });

  it('TC-104 单图分支容器类：单图含 single-image，植物三部位不含', async () => {
    const single = renderDetail('giant-panda', { section: 'animal', list: [card(PANDA)] });
    await screen.findByAltText('大熊猫');
    expect(document.querySelector('.detail-body').className).toBe('detail-body single-image');
    single.unmount();

    renderDetail('sunflower', { section: 'plant', category: 'all', list: [card(SUNFLOWER)] });
    expect(await screen.findByAltText('向日葵的花')).toBeInTheDocument();
    expect(document.querySelector('.detail-body').className).toBe('detail-body');
  });

  it('TC-105 单图横屏栏宽 64%，植物横屏栏宽仍 48%（不回归）', () => {
    const landscape = css.match(/@media\s*\(orientation:\s*landscape\)\s*\{[\s\S]*?\n\}/)[0];
    const singleBlock = landscape.match(/\.detail-body\.single-image\s*\{[^}]*\}/s)[0];
    expect(singleBlock).toMatch(/grid-template-columns:\s*64%\s+minmax\(0,\s*1fr\)/);

    // 植物版式（不带 single-image）栏宽保持 48%
    const baseBlock = landscape.match(/\.detail-body\s*\{[^}]*\}/s)[0];
    expect(baseBlock).toMatch(/grid-template-columns:\s*48%\s+minmax\(0,\s*1fr\)/);
  });
});
