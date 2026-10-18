// 顶层板块导航（Sprint 15）：分两组——自然认知（植物/动物/昆虫/恐龙）+ 认知启蒙（英文字母/汉语拼音/数字/颜色）
// Sprint 16 起 number/color 已补内容（数字 0–20、颜色 11 色），八板块均有可浏览条目
export const SECTIONS = [
  { code: 'plant', label: '植物', group: 'nature' },
  { code: 'animal', label: '动物', group: 'nature' },
  { code: 'insect', label: '昆虫', group: 'nature' },
  { code: 'dinosaur', label: '恐龙', group: 'nature' },
  { code: 'letter', label: '英文字母', group: 'enlightenment' },
  { code: 'pinyin', label: '汉语拼音', group: 'enlightenment' },
  { code: 'number', label: '数字', group: 'enlightenment' },
  { code: 'color', label: '颜色', group: 'enlightenment' },
];

// 两组元数据（顺序即展示顺序）
export const SECTION_GROUPS = [
  { key: 'nature', title: '自然认知', codes: ['plant', 'animal', 'insect', 'dinosaur'] },
  { key: 'enlightenment', title: '认知启蒙', codes: ['letter', 'pinyin', 'number', 'color'] },
];

// 板块大按钮组：两组纵向排列，组内复用 .filter-btn 视觉；仅植物板块下再渲染二级分类筛选
export default function SectionNav({ value, onChange }) {
  return (
    <div className="section-nav page-block" role="group" aria-label="板块导航">
      {SECTION_GROUPS.map((group) => (
        <div className="section-group" key={group.key}>
          <p className="section-group-title" role="presentation">
            {group.title}
          </p>
          <div className="section-group-btns">
            {group.codes.map((code) => {
              const s = SECTIONS.find((item) => item.code === code);
              return (
                <button
                  key={s.code}
                  type="button"
                  className={value === s.code ? 'filter-btn selected' : 'filter-btn'}
                  aria-pressed={value === s.code}
                  onClick={() => onChange(s.code)}
                >
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
