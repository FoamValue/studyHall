import PartIcon from './PartIcon';

// 分类大按钮组：「全部」为虚拟分类固定在最前，其余分类来自 GET /api/categories
export default function CategoryFilter({ categories, value, onChange }) {
  const items = [{ code: 'all', nameZh: '全部' }, ...categories];
  return (
    <div className="category-filter page-block" role="group" aria-label="植物分类筛选">
      {items.map((c) => (
        <button
          key={c.code}
          type="button"
          className={value === c.code ? 'filter-btn selected' : 'filter-btn'}
          aria-pressed={value === c.code}
          onClick={() => onChange(c.code)}
        >
          {c.code !== 'all' && <PartIcon part={c.code} size={28} />}
          <span>{c.nameZh}</span>
        </button>
      ))}
    </div>
  );
}
