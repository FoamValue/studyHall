import PartIcon from './PartIcon';

// 部位固定展示顺序与中文短标签（部位按钮三处复用：图标 + 文字）
export const PART_ORDER = ['flower', 'leaf', 'fruit'];
export const PART_LABELS = { flower: '花', leaf: '叶', fruit: '果' };

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
