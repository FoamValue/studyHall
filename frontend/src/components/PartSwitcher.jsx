import PartIcon from './PartIcon';

// 部位固定展示顺序与中文短标签（部位按钮三处复用：图标 + 文字）
// Sprint 9：尾部追加板块单图部位，植物顺序（flower,leaf,fruit）保持不变
// Sprint 15：再追加认知启蒙字形/数字/颜色板块键（letter/pinyin 本迭代启用）
export const PART_ORDER = [
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
];
export const PART_LABELS = {
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
};

// 按固定顺序返回植物实际存在的部位（缺部位不出现在结果中）
export function getOrderedParts(parts) {
  return PART_ORDER.filter((p) => parts && parts[p]);
}

export default function PartSwitcher({ parts, value, onChange }) {
  const available = getOrderedParts(parts);
  return (
    <div className="part-switcher page-block" role="tablist" aria-label="植物部位切换">
      {available.map((p) => (
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={value === p}
          className={value === p ? 'filter-btn selected' : 'filter-btn'}
          onClick={() => onChange(p)}
        >
          <PartIcon part={p} size={28} />
          <span>{PART_LABELS[p]}</span>
        </button>
      ))}
    </div>
  );
}
