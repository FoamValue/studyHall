import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

// Sprint 17：植物拆分为单部位条目，每条仅一个部位，categories=["plant"]
const SUNFLOWER = {
  id: 'sunflower-flower',
  categories: ['plant'],
  name: {
    zh: '向日葵花',
    pinyin: 'xiàng rì kuí huā',
    en: 'Sunflower',
    ipa: '/ˈsʌnˌflaʊər/',
    audioZh: '/audio/sunflower-flower-zh.m4a',
    audioEn: '/audio/sunflower-flower-en.m4a',
  },
  parts: {
    flower: {
      name: { zh: '花', pinyin: 'huā', en: 'flower', ipa: '/ˈflaʊər/' },
      images: [{ type: 'photo', url: '/images/plants/sunflower-flower.jpg' }],
      description: '大大的花盘像小太阳。',
      allusion: { text: '更无柳絮因风起，惟有葵花向日倾。', source: '《客中初夏》', explain: '葵花总是朝着太阳转。' },
    },
  },
};

// 银杏叶部位
const GINKGO = {
  id: 'ginkgo-leaf',
  categories: ['plant'],
  name: { zh: '银杏叶', pinyin: 'yín xìng yè', en: 'Ginkgo Leaf', ipa: '/ˈɡɪŋkoʊ liːf/' },
  parts: {
    leaf: {
      name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
      images: [{ type: 'photo', url: '/images/plants/ginkgo-leaf.jpg' }],
      description: '叶子像一把把小扇子。',
    },
  },
};

const PEACH = {
  id: 'peach-flower',
  categories: ['plant'],
  name: {
    zh: '桃花',
    pinyin: 'táo huā',
    en: 'Peach Blossom',
    ipa: '/piːtʃ ˈblɒsəm/',
    audioZh: '/audio/peach-flower-zh.m4a',
    audioEn: '/audio/peach-flower-en.m4a',
  },
  parts: {
    flower: {
      name: { zh: '花', pinyin: 'huā', en: 'flower', ipa: '/ˈflaʊər/' },
      images: [{ type: 'photo', url: '/images/plants/peach-flower.jpg' }],
      description: '粉粉的花瓣像小裙子。',
    },
  },
};

const MAPLE = {
  id: 'maple-leaf',
  categories: ['plant'],
  name: { zh: '枫叶', pinyin: 'fēng yè', en: 'Maple Leaf', ipa: '/ˈmeɪpl liːf/' },
  parts: {
    leaf: {
      name: { zh: '叶', pinyin: 'yè', en: 'leaf', ipa: '/liːf/' },
      images: [{ type: 'photo', url: '/images/plants/maple-leaf.jpg' }],
      description: '枫叶像小手掌，秋天变红。',
    },
  },
};

const COCONUT = {
  id: 'coconut-fruit',
  categories: ['plant'],
  name: { zh: '椰子', pinyin: 'yē zi', en: 'Coconut', ipa: '/ˈkoʊkənʌt/' },
  parts: {
    fruit: {
      name: { zh: '果', pinyin: 'guǒ', en: 'fruit', ipa: '/fruːt/' },
      images: [{ type: 'photo', url: '/images/plants/coconut-fruit.jpg' }],
      description: '椰子又大又圆，里面有甜甜的水。',
    },
  },
};

// 苹果花部位（Sprint 17：单部位条目）
const APPLE = {
  id: 'apple-flower',
  categories: ['plant'],
  name: { zh: '苹果花', pinyin: 'píng guǒ huā', en: 'Apple Flower', ipa: '/ˈæpl ˈflaʊər/' },
  parts: {
    flower: {
      name: { zh: '花', pinyin: 'huā', en: 'flower', ipa: '/ˈflaʊər/' },
      images: [{ type: 'photo', url: '/images/plants/apple-flower.jpg' }],
      description: '苹果花白白的，带一点粉。',
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

// 英文字母单图条目（Sprint 15）：名称仅符号本身，省略拼音/英文/音标，音频仅英文
const LETTER_A = {
  id: 'letter-a',
  categories: ['letter'],
  name: { zh: 'Aa', audioEn: '/audio/letter-a-en.m4a' },
  parts: {
    letter: {
      name: { zh: 'Aa' },
      images: [{ type: 'photo', url: '/images/letters/letter-a.jpg' }],
      description: '大写 A 和小写 a，是字母表的第 1 个字母。Apple 苹果就是以 A 开头的。',
      allusion: { text: '字母 A 最早的样子像一头牛的角。', explain: '古人画下牛头的符号，慢慢就变成了 A。' },
    },
  },
};

// 汉语拼音单图条目（Sprint 15）：名称仅小写字母，音频仅中文
const PINYIN_A = {
  id: 'pinyin-a',
  categories: ['pinyin'],
  name: { zh: 'a', audioZh: '/audio/pinyin-a-zh.m4a' },
  parts: {
    pinyin: {
      name: { zh: 'a' },
      images: [{ type: 'photo', url: '/images/pinyin/pinyin-a.jpg' }],
      description: 'a 是单韵母，张大嘴巴就能读出「啊」。',
      allusion: { text: 'a 像一位张大嘴巴唱歌的小朋友。', explain: '嘴巴张得大大的，声音就出来了。' },
    },
  },
};

// 数字单图条目（Sprint 16）：保留完整三语 + 音标，中英双音频
const NUMBER_1 = {
  id: 'number-1',
  categories: ['number'],
  name: { zh: '一', pinyin: 'yī', en: 'One', ipa: '/wʌn/', audioZh: '/audio/number-1-zh.m4a', audioEn: '/audio/number-1-en.m4a' },
  parts: {
    number: {
      name: { zh: '一', pinyin: 'yī', en: 'One', ipa: '/wʌn/' },
      images: [{ type: 'photo', url: '/images/numbers/number-1.jpg' }],
      description: '数一数，这里有 1 个小苹果，就是一。',
      allusion: { text: '一，像一根直直的铅笔。', explain: '一表示只有一个。' },
    },
  },
};

// 颜色单图条目（Sprint 16）：保留完整三语 + 音标，中英双音频
const COLOR_RED = {
  id: 'color-red',
  categories: ['color'],
  name: { zh: '红色', pinyin: 'hóng sè', en: 'Red', ipa: '/red/', audioZh: '/audio/color-red-zh.m4a', audioEn: '/audio/color-red-en.m4a' },
  parts: {
    color: {
      name: { zh: '红色', pinyin: 'hóng sè', en: 'Red', ipa: '/red/' },
      images: [{ type: 'photo', url: '/images/colors/color-red.jpg' }],
      description: '红红的苹果是红色。',
      allusion: { text: '红灯亮了要停下来。', explain: '红灯停、绿灯行，红色最醒目。' },
    },
  },
};

const byId = {
  'sunflower-flower': SUNFLOWER,
  'ginkgo-leaf': GINKGO,
  'peach-flower': PEACH,
  'maple-leaf': MAPLE,
  'coconut-fruit': COCONUT,
  'apple-flower': APPLE,
  'giant-panda': PANDA,
  tyrannosaurus: TREX,
  'letter-a': LETTER_A,
  'pinyin-a': PINYIN_A,
  'number-1': NUMBER_1,
  'color-red': COLOR_RED,
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
  it('TC-14 单图详情：渲染名称、单张大图与说明，无部位切换按钮（Sprint 17）', async () => {
    renderDetail('sunflower-flower');

    // 单图模式：图片 alt = 条目中文名，无部位后缀
    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    expect(screen.getByText('大大的花盘像小太阳。')).toBeInTheDocument();
    // 无部位切换 tab
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('TC-15 单图条目不渲染部位切换与部位名（Sprint 17）', async () => {
    renderDetail('ginkgo-leaf');

    expect(await screen.findByAltText('银杏叶')).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '花' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '叶' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: '果' })).not.toBeInTheDocument();
  });

  it('TC-16 典故：有典故渲染 AllusionCard（Sprint 17：单图，无部位切换）', async () => {
    renderDetail('sunflower-flower');

    // 花部位有典故：原文 + 出处 + 白话解释都渲染
    expect(await screen.findByText('更无柳絮因风起，惟有葵花向日倾。')).toBeInTheDocument();
    expect(screen.getByText('—— 《客中初夏》')).toBeInTheDocument();
    expect(screen.getByText('葵花总是朝着太阳转。')).toBeInTheDocument();
  });

  it('TC-18 单图模式：无部位切换标签（Sprint 17：所有条目均单图）', async () => {
    renderDetail('maple-leaf');

    expect(await screen.findByAltText('枫叶')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('TC-20b 详情大图带 loading="lazy"', async () => {
    renderDetail('sunflower-flower');

    const img = await screen.findByAltText('向日葵花');
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
    renderDetail('sunflower-flower', { category: 'all', list: FLOWER_LIST });

    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '下一株' }));

    expect(await screen.findByRole('heading', { name: '桃花' })).toBeInTheDocument();
    expect(getPlant).toHaveBeenLastCalledWith('peach-flower');
  });

  it('TC-29 首尾循环：末株的下一株回到首株，首株的上一株回到末株', async () => {
    const user = userEvent.setup();
    renderDetail('maple-leaf', { category: 'all', list: FLOWER_LIST });

    expect(await screen.findByRole('heading', { name: '枫叶' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '下一株' }));
    expect(await screen.findByRole('heading', { name: '向日葵花' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '上一株' }));
    expect(await screen.findByRole('heading', { name: '枫叶' })).toBeInTheDocument();
  });

  it('TC-30 换株后内容更新为新条目（Sprint 17：单图，无部位回落）', async () => {
    const user = userEvent.setup();
    const list = [card(SUNFLOWER), card(COCONUT)];
    renderDetail('sunflower-flower', { category: 'all', list });

    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '下一株' }));
    expect(await screen.findByAltText('椰子')).toBeInTheDocument();
  });

  it('TC-31 单株列表：两侧按钮存在但禁用（不隐藏）', async () => {
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '上一株' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '下一株' })).toBeDisabled();
  });

  it('TC-32 全屏不可用时按钮不渲染，沉浸式功能正常', async () => {
    // jsdom 默认 document.fullscreenEnabled 为 undefined
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '全屏' })).not.toBeInTheDocument();
    // Sprint 18：返回文案改为「← 回植物书」
    expect(screen.getByRole('link', { name: /回植物书/ })).toBeInTheDocument();
    // Sprint 17：单图模式无部位切换
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });

  it('TC-32b 全屏可用时点「全屏」调用 requestFullscreen', async () => {
    const user = userEvent.setup();
    Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
    const requestFullscreen = vi.fn();
    Element.prototype.requestFullscreen = requestFullscreen;

    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });

    const btn = await screen.findByRole('button', { name: '全屏' });
    await user.click(btn);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('TC-33 沉浸式详情保留「← 回植物书」入口并指向该书', async () => {
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });

    const back = await screen.findByRole('link', { name: /回植物书/ });
    expect(back).toHaveAttribute('href', '/books/plant');
  });

  it('TC-33b 键盘 → 换植物（ArrowRight）', async () => {
    renderDetail('sunflower-flower', { category: 'all', list: FLOWER_LIST });

    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
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
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵花');

    await user.click(screen.getByRole('button', { name: '朗读中文名' }));

    expect(audio.instances).toHaveLength(1);
    expect(audio.instances[0].src).toBe('/audio/sunflower-flower-zh.m4a');
    expect(audio.instances[0].play).toHaveBeenCalledTimes(1);
  });

  it('TC-42 点英文喇叭播放英文名音频（audioEn）', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵花');

    await user.click(screen.getByRole('button', { name: '朗读英文名' }));

    expect(audio.instances[0].src).toBe('/audio/sunflower-flower-en.m4a');
    expect(audio.instances[0].play).toHaveBeenCalledTimes(1);
  });

  it('TC-43 两喇叭互斥：点英文喇叭先暂停当前再播放英文名', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵花');

    await user.click(screen.getByRole('button', { name: '朗读中文名' }));
    await user.click(screen.getByRole('button', { name: '朗读英文名' }));

    expect(audio.instances).toHaveLength(1); // 单例音频，同一时刻至多一个
    expect(audio.instances[0].src).toBe('/audio/sunflower-flower-en.m4a');
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
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵花');

    const zhBtn = screen.getByRole('button', { name: '朗读中文名' });
    await user.click(zhBtn);
    expect(zhBtn).toHaveAttribute('aria-pressed', 'true');

    await user.click(zhBtn);
    expect(audio.instances[0].pause).toHaveBeenCalledTimes(2); // play 内 1 次 + 停止 1 次
    expect(zhBtn).toHaveAttribute('aria-pressed', 'false');
  });

  it('TC-45 场景自动停止：换株 / 卸载（pause 增加）', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    const totalPause = () => audio.instances.reduce((n, a) => n + a.pause.mock.calls.length, 0);

    // ① 换株
    const second = renderDetail('sunflower-flower', { category: 'all', list: FLOWER_LIST });
    await screen.findByAltText('向日葵花');
    await user.click(screen.getByRole('button', { name: '朗读中文名' }));
    const beforeSwitch = totalPause();
    await user.click(screen.getByRole('button', { name: '下一株' }));
    expect(await screen.findByRole('heading', { name: '桃花' })).toBeInTheDocument();
    expect(totalPause()).toBeGreaterThan(beforeSwitch);
    second.unmount();

    // ② 卸载
    const third = renderDetail('sunflower-flower', { category: 'all', list: FLOWER_LIST });
    await screen.findByAltText('向日葵花');
    await user.click(screen.getByRole('button', { name: '朗读中文名' }));
    const beforeUnmount = totalPause();
    third.unmount();
    expect(totalPause()).toBeGreaterThan(beforeUnmount);
  });

  it('TC-45b 喇叭播放的是名称音频：src 为名称读音而非部位/说明', async () => {
    const user = userEvent.setup();
    const audio = makeAudioMock();
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });
    await screen.findByAltText('向日葵花');

    await user.click(screen.getByRole('button', { name: '朗读中文名' }));

    const src = audio.instances.at(-1).src;
    // 播放的是名称读音（audioZh），而非部位图/说明路径
    expect(src).toBe('/audio/sunflower-flower-zh.m4a');
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
      Promise.resolve({
        ...SUNFLOWER,
        name: { zh: '向日葵花', pinyin: 'xiàng rì kuí huā', en: 'Sunflower' },
      })
    );

    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读中文名' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读英文名' })).not.toBeInTheDocument();
    expect(speak).not.toHaveBeenCalled(); // 绝不回退语音合成
    expect(screen.getByRole('link', { name: /回植物书/ })).toBeInTheDocument();
  });

  it('TC-45d 有英文名但缺 audioEn 时不渲染英文喇叭，中文喇叭仍在', async () => {
    makeAudioMock();
    getPlant.mockImplementation(() =>
      Promise.resolve({
        ...SUNFLOWER,
        name: { zh: '向日葵花', pinyin: 'xiàng rì kuí huā', en: 'Sunflower', audioZh: '/audio/sunflower-flower-zh.m4a' },
      })
    );

    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });

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

describe('植物单图详情（Sprint 17：取消部位切换）', () => {
  it('TC-65 植物条目为单图模式：不渲染部位切换，大图 alt = 条目名', async () => {
    renderDetail('apple-flower', { category: 'all', list: [card(APPLE)] });

    expect(await screen.findByAltText('苹果花')).toBeInTheDocument();
    expect(screen.getByAltText('苹果花')).toHaveAttribute('src', '/images/plants/apple-flower.jpg');
    // 无部位切换
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('TC-66 银杏叶条目：单图，无部位切换', async () => {
    renderDetail('ginkgo-leaf', { category: 'all', list: [card(GINKGO)] });

    expect(await screen.findByAltText('银杏叶')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});

describe('单图板块详情分支（Sprint 9：TC-82a / TC-82b / TC-83；Sprint 15：TC-147）', () => {
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

  it('TC-83 植物条目现为单图模式（Sprint 17）：不渲染部位切换', async () => {
    renderDetail('sunflower-flower', { section: 'plant', category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('TC-82b 恐龙单图条目 + 缺 audioEn：不渲染部位切换与英文喇叭', async () => {
    makeAudioMock();
    renderDetail('tyrannosaurus', { section: 'dinosaur', list: [card(TREX)] });

    expect(await screen.findByAltText('霸王龙')).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '朗读中文名' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读英文名' })).not.toBeInTheDocument();
  });

  it('TC-147a 英文字母单图详情：名称仅 Aa，无拼音/英文行，仅英文喇叭', async () => {
    makeAudioMock();
    renderDetail('letter-a', { section: 'letter', list: [card(LETTER_A)] });

    // 大图以名称（Aa）作 alt，单图分支容器带 single-image
    expect(await screen.findByAltText('Aa')).toBeInTheDocument();
    expect(document.querySelector('.detail-body').className).toBe('detail-body single-image');
    expect(document.querySelector('.detail-zh').textContent).toBe('Aa');
    // 不渲染部位切换
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    // 字母条目省略拼音/英文，故两行均不渲染
    expect(document.querySelector('.detail-pinyin')).toBeNull();
    expect(document.querySelector('.detail-en')).toBeNull();
    // 音频仅英文 → 只渲染英文喇叭
    expect(screen.getByRole('button', { name: '朗读英文名' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读中文名' })).not.toBeInTheDocument();
    // 说明与小知识卡片渲染
    expect(screen.getByText('大写 A 和小写 a，是字母表的第 1 个字母。Apple 苹果就是以 A 开头的。')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '小知识' })).toBeInTheDocument();
  });

  it('TC-147b 汉语拼音单图详情：名称仅 a，无拼音/英文行，仅中文喇叭', async () => {
    makeAudioMock();
    renderDetail('pinyin-a', { section: 'pinyin', list: [card(PINYIN_A)] });

    expect(await screen.findByAltText('a')).toBeInTheDocument();
    expect(document.querySelector('.detail-body').className).toBe('detail-body single-image');
    expect(document.querySelector('.detail-zh').textContent).toBe('a');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(document.querySelector('.detail-pinyin')).toBeNull();
    expect(document.querySelector('.detail-en')).toBeNull();
    expect(screen.getByRole('button', { name: '朗读中文名' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '朗读英文名' })).not.toBeInTheDocument();
  });
});

describe('小知识卡片称谓（Sprint 9：TC-88）', () => {
  it('TC-88 典故/小知识卡片 aria-label 为「小知识」，无内容不渲染', async () => {
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });

    expect(await screen.findByRole('region', { name: '小知识' })).toBeInTheDocument();

    // 无小知识的条目 → 卡片整体不渲染
    cleanup();
    getPlant.mockImplementation(() =>
      Promise.resolve({
        ...SUNFLOWER,
        parts: { flower: { ...SUNFLOWER.parts.flower, allusion: undefined } },
      })
    );
    renderDetail('sunflower-flower', { category: 'all', list: [card(SUNFLOWER)] });
    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: '小知识' })).not.toBeInTheDocument();
  });
});

describe('PART_ORDER / PART_LABELS 扩展（Sprint 9：TC-84）', () => {
  it('TC-84a 板块部位尾部追加，植物顺序（flower,leaf,fruit）保持不变', () => {
    expect(PART_ORDER).toEqual([
      'flower',
      'leaf',
      'fruit',
      'animal',
      'insect',
      'dinosaur',
      'letter',
      'pinyin',
      'number',
      'color',
    ]);
    expect(PART_LABELS).toMatchObject({
      flower: '花',
      leaf: '叶',
      fruit: '果',
      animal: '动物',
      insect: '昆虫',
      dinosaur: '恐龙',
      letter: '字母',
      pinyin: '拼音',
      number: '数字',
      color: '颜色',
    });
  });

  it('TC-84b getOrderedParts 支持单键板块部位', () => {
    expect(getOrderedParts({ animal: {} })).toEqual(['animal']);
    expect(getOrderedParts({ insect: {}, animal: {} })).toEqual(['animal', 'insect']);
    expect(getOrderedParts({ flower: {}, leaf: {}, fruit: {} })).toEqual(['flower', 'leaf', 'fruit']);
    // Sprint 15：字母 / 拼音单键部位同样按固定顺序返回
    expect(getOrderedParts({ letter: {} })).toEqual(['letter']);
    expect(getOrderedParts({ pinyin: {} })).toEqual(['pinyin']);
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

  it('TC-104 单图分支容器类：所有单部位条目均含 single-image（Sprint 17：植物亦单图）', async () => {
    const single = renderDetail('giant-panda', { section: 'animal', list: [card(PANDA)] });
    await screen.findByAltText('大熊猫');
    expect(document.querySelector('.detail-body').className).toBe('detail-body single-image');
    single.unmount();

    renderDetail('sunflower-flower', { section: 'plant', category: 'all', list: [card(SUNFLOWER)] });
    expect(await screen.findByAltText('向日葵花')).toBeInTheDocument();
    // Sprint 17：植物条目改为单图，亦含 single-image
    expect(document.querySelector('.detail-body').className).toBe('detail-body single-image');
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

describe('PlantDetailPage 返回文案按板块派生 + 横屏拼音字号（Sprint 12：TC-119 ~ TC-122；Sprint 18 文案改「回{板块名}书」）', () => {
  it('TC-119 返回文案按板块派生（植物/动物/昆虫/恐龙）且指向对应书', async () => {
    const cases = [
      ['plant', /回植物书/, '/books/plant'],
      ['animal', /回动物书/, '/books/animal'],
      ['insect', /回昆虫书/, '/books/insect'],
      ['dinosaur', /回恐龙书/, '/books/dinosaur'],
    ];
    for (const [section, name, href] of cases) {
      const { unmount } = renderDetail('sunflower-flower', { section, category: 'all', list: [card(SUNFLOWER)] });
      const back = await screen.findByRole('link', { name });
      expect(back).toHaveAttribute('href', href);
      // 反向校验：非本板块文案不得出现
      unmount();
    }
  });

  it('TC-120 异常兜底文案按板块派生（动物 → 回动物书看看）', async () => {
    getPlant.mockImplementation(() =>
      Promise.reject(Object.assign(new Error('not found'), { code: 40401 }))
    );
    renderDetail('__not_exist__', { section: 'animal', category: 'all' });

    const back = await screen.findByRole('link', { name: /回动物书看看/ });
    expect(back).toHaveAttribute('href', '/books/animal');
  });

  it('TC-121 未知 section 回退植物书', async () => {
    renderDetail('sunflower-flower', { section: 'xunknown', category: 'all', list: [card(SUNFLOWER)] });
    const back = await screen.findByRole('link', { name: /回植物书/ });
    expect(back).toHaveAttribute('href', '/books/plant');
  });

  it('TC-122 EX-8 横屏详情拼音字号 ≥20px（样式源断言）', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const landscape = css.match(/@media\s*\(orientation:\s*landscape\)\s*\{[\s\S]*?\n\}/)[0];
    const pinyin = landscape.match(/\.detail-header \.detail-pinyin\s*\{[^}]*\}/s)[0];
    expect(Number(pinyin.match(/font-size:\s*(\d+)px/)[1])).toBeGreaterThanOrEqual(20);
  });
});

describe('数字 / 颜色单图详情分支（Sprint 16：TC-159 / TC-160）', () => {
  it('TC-159 数字单图详情：单图分支无部位切换，三行名称齐全，中英喇叭各一', async () => {
    makeAudioMock();
    renderDetail('number-1', { section: 'number', list: [card(NUMBER_1)] });

    expect(await screen.findByAltText('一')).toBeInTheDocument();
    expect(document.querySelector('.detail-body').className).toBe('detail-body single-image');
    expect(document.querySelector('.detail-zh').textContent).toBe('一');
    // 数字保留完整三语：拼音行与英文行均渲染
    expect(document.querySelector('.detail-pinyin').textContent).toBe('yī');
    expect(document.querySelector('.detail-en').textContent).toContain('One');
    // 不渲染部位切换
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    // 中英双音频 → 两喇叭各一
    expect(screen.getByRole('button', { name: '朗读中文名' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '朗读英文名' })).toBeInTheDocument();
    // 说明与小知识卡片渲染
    expect(screen.getByText('数一数，这里有 1 个小苹果，就是一。')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '小知识' })).toBeInTheDocument();
  });

  it('TC-160 颜色单图详情：单图分支无部位切换，三行名称齐全，中英喇叭各一', async () => {
    makeAudioMock();
    renderDetail('color-red', { section: 'color', list: [card(COLOR_RED)] });

    expect(await screen.findByAltText('红色')).toBeInTheDocument();
    expect(document.querySelector('.detail-body').className).toBe('detail-body single-image');
    expect(document.querySelector('.detail-zh').textContent).toBe('红色');
    expect(document.querySelector('.detail-pinyin').textContent).toBe('hóng sè');
    expect(document.querySelector('.detail-en').textContent).toContain('Red');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '朗读中文名' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '朗读英文名' })).toBeInTheDocument();
  });
});

// Sprint 18：原 HomePage.test.jsx 中与页面无关的样式断言迁入（随详情页样式一起保护）
describe('触控目标与部位按钮字号（TC-25 / TC-124 迁入）', () => {
  it('TC-25 样式表 .filter-btn 的 min-height ≥ 44px（部位/板块按钮共用）', () => {
    const css = readFileSync('src/styles.css', 'utf-8');
    const block = css.match(/\.filter-btn\s*\{[^}]*\}/s)[0];
    const minHeight = Number(block.match(/min-height:\s*(\d+)px/)[1]);
    expect(minHeight).toBeGreaterThanOrEqual(44);
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
