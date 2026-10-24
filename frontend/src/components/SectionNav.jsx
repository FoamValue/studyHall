// Sprint 18：板块常量唯一来源（原顶层板块按钮组件已移除，板块入口由书架 /books/{code} 取代）。
// 两大组：自然认知（植物/动物/昆虫/恐龙）+ 认知启蒙（英文字母/汉语拼音/数字/颜色）。
export const COVER_DIR = '/images/covers/';

export const coverPath = (code) => `${COVER_DIR}${code}.jpg`;

export const SECTIONS = [
  { code: 'plant', label: '植物', group: 'nature', cover: coverPath('plant') },
  { code: 'animal', label: '动物', group: 'nature', cover: coverPath('animal') },
  { code: 'insect', label: '昆虫', group: 'nature', cover: coverPath('insect') },
  { code: 'dinosaur', label: '恐龙', group: 'nature', cover: coverPath('dinosaur') },
  { code: 'letter', label: '英文字母', group: 'enlightenment', cover: coverPath('letter') },
  { code: 'pinyin', label: '汉语拼音', group: 'enlightenment', cover: coverPath('pinyin') },
  { code: 'number', label: '数字', group: 'enlightenment', cover: coverPath('number') },
  { code: 'color', label: '颜色', group: 'enlightenment', cover: coverPath('color') },
];

// 书内页标题 + 详情页返回文案的唯一来源
export const SECTION_BOOK_TITLE = {
  plant: '植物书',
  animal: '动物书',
  insect: '昆虫书',
  dinosaur: '恐龙书',
  letter: '英文字母书',
  pinyin: '汉语拼音书',
  number: '数字书',
  color: '颜色书',
};

// 两组元数据（顺序即书架层序）
export const SECTION_GROUPS = [
  { key: 'nature', title: '自然认知', codes: ['plant', 'animal', 'insect', 'dinosaur'] },
  { key: 'enlightenment', title: '认知启蒙', codes: ['letter', 'pinyin', 'number', 'color'] },
];

// 按 code 反查板块；未知 code 返回 null（调用方一律 if (!section) 判定）
export const getSection = (code) => SECTIONS.find((s) => s.code === code) || null;
