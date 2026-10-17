// 顶层板块导航：植物/动物/昆虫/恐龙四板块固定顺序（Sprint 9 一级导航）
export const SECTIONS = [
  { code: 'plant', label: '植物' },
  { code: 'animal', label: '动物' },
  { code: 'insect', label: '昆虫' },
  { code: 'dinosaur', label: '恐龙' },
];

// 板块大按钮组：复用 .filter-btn 视觉，仅植物板块下再渲染二级分类筛选
export default function SectionNav({ value, onChange }) {
  return (
    <div className="section-nav page-block" role="group" aria-label="板块导航">
      {SECTIONS.map((s) => (
        <button
          key={s.code}
          type="button"
          className={value === s.code ? 'filter-btn selected' : 'filter-btn'}
          aria-pressed={value === s.code}
          onClick={() => onChange(s.code)}
        >
          <span>{s.label}</span>
        </button>
      ))}
    </div>
  );
}
