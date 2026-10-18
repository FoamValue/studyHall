import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { getCategories, getPlants, getPlantsBySection } from '../api/client';
import CategoryFilter from '../components/CategoryFilter';
import SectionNav, { SECTIONS } from '../components/SectionNav';
import PlantCard from '../components/PlantCard';

// Sprint 10（EX-6）：首屏与滚动步进条数（Q1 冻结）
const PAGE_SIZE = 16;

// 读取回花园时应恢复的已渲染条数（Q4：与 sh:homeScroll 并列的会话内记忆）
function readRestoreCount() {
  try {
    return Number(sessionStorage.getItem('sh:homeVisibleCount')) || 0;
  } catch {
    return 0;
  }
}

export default function HomePage() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [plants, setPlants] = useState(null); // null 表示加载中
  // 从详情返回时恢复此前的板块与分类筛选；首次进入默认「植物 / 全部」
  const [section, setSection] = useState(location.state?.section || 'plant');
  const [category, setCategory] = useState(location.state?.category || 'all');
  const [error, setError] = useState(null);
  // Sprint 10（EX-6）：首屏 + 滚动增量加载；回花园时按记录的条数恢复（至少首屏 16）
  const [visibleCount, setVisibleCount] = useState(() =>
    location.state?.restoreScroll ? Math.max(PAGE_SIZE, readRestoreCount()) : PAGE_SIZE
  );
  const sentinelRef = useRef(null);
  // 区分「首次挂载（可能带恢复态）」与「用户切换板块/分类（须重置分页）」
  const firstFilterRef = useRef(true);

  // 从详情返回时恢复列表滚动位置（等列表渲染完再滚）
  const pendingScroll = useRef(null);
  if (pendingScroll.current === null && location.state?.restoreScroll) {
    let y = 0;
    try {
      y = Number(sessionStorage.getItem('sh:homeScroll')) || 0;
    } catch {
      y = 0;
    }
    pendingScroll.current = y;
  }

  // 分类列表只取一次；失败时筛选按钮退化为仅有「全部」，不阻塞主流程
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // 切换板块/分类即重新拉取列表；alive 标记防止竞态回写
  // 植物板块「全部」走 section 参数限定到板块内；植物二级筛选沿用 category；其余板块平铺走 section
  useEffect(() => {
    let alive = true;
    setPlants(null);
    setError(null);
    // 用户切换筛选（非首次挂载）时重置分页；带恢复态的首屏保留记录的条数
    if (firstFilterRef.current) {
      firstFilterRef.current = false;
    } else {
      setVisibleCount(PAGE_SIZE);
    }
    const req =
      section === 'plant'
        ? category === 'all'
          ? getPlantsBySection('plant')
          : getPlants(category)
        : getPlantsBySection(section);
    req
      .then((data) => {
        if (!alive) return;
        const list = data || [];
        setPlants(list);
        // 环境不支持 IntersectionObserver（jsdom / 极旧浏览器）→ 全量渲染降级（Q2）
        if (typeof IntersectionObserver === 'undefined') setVisibleCount(list.length);
      })
      .catch((err) => {
        if (alive) setError(err);
      });
    return () => {
      alive = false;
    };
  }, [section, category]);

  // Sprint 10（EX-6）：滚动增量加载——哨兵进入视口即追加 PAGE_SIZE 条
  useEffect(() => {
    if (plants === null || visibleCount >= plants.length) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(plants.length, c + PAGE_SIZE));
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [plants, visibleCount]);

  // Sprint 10（EX-6）：记录已渲染条数，供回花园时恢复（Q4）
  useEffect(() => {
    try {
      sessionStorage.setItem('sh:homeVisibleCount', String(visibleCount));
    } catch {
      /* 无 sessionStorage 环境忽略 */
    }
  }, [visibleCount]);

  useEffect(() => {
    if (pendingScroll.current === null || plants === null) return;
    const y = pendingScroll.current;
    try {
      window.scrollTo(0, y);
    } catch {
      /* jsdom 等环境忽略 */
    }
    // 兜底：若恢复条数不足以覆盖目标位置，继续补加载后再复位（Q4）
    let reached = y;
    try {
      reached = window.scrollY;
    } catch {
      reached = y;
    }
    if (reached < y - 2 && visibleCount < plants.length) {
      setVisibleCount((c) => Math.min(plants.length, c + PAGE_SIZE));
      return;
    }
    pendingScroll.current = null;
  }, [plants, visibleCount]);

  // 切换板块时重置二级筛选项（植物回「全部」，其余板块无二级）
  const handleSectionChange = (nextSection) => {
    setSection(nextSection);
    setCategory('all');
  };

  const sectionLabel = SECTIONS.find((s) => s.code === section)?.label || '';
  // 二级分类筛选只展示植物板块内的分类（花朵/树叶/果实），其余板块分类不出现在筛选条
  const plantCategories = categories.filter((c) => c.section === 'plant');

  return (
    <main className="page">
      <header className="site-header page-block">
        <p className="site-title-pinyin">rèn zhī xiǎo tú jiàn</p>
        <h1 className="site-title-zh">认知小图鉴</h1>
        <p className="site-title-en">Cognitive Guide</p>
      </header>

      <SectionNav value={section} onChange={handleSectionChange} />

      {section === 'plant' ? (
        <CategoryFilter categories={plantCategories} value={category} onChange={setCategory} />
      ) : null}

      <section className="page-block" aria-label={`${sectionLabel}列表`}>
        {error ? (
          <p className="state-tip">{error.message || '哎呀，出了点小问题，请稍后再试'}</p>
        ) : plants === null ? (
          <div className="state-tip">
            <Spin size="large" />
            <p>加载中…</p>
          </div>
        ) : plants.length === 0 ? (
          <p className="state-tip">
            {section === 'plant' ? '这个分类还没有植物哦' : '这个板块还没有内容哦'}
          </p>
        ) : (
          <>
            {/* Sprint 10（EX-6）：总量提示「共 N 种」，口径 = 当前板块/分类返回条数 */}
            <p className="list-count">共 {plants.length} 种</p>
            <div className="plant-grid">
              {plants.slice(0, visibleCount).map((p) => (
                <PlantCard key={p.id} plant={p} category={category} list={plants} section={section} />
              ))}
              {/* 增量加载哨兵：进入视口后追加下一页（列表末尾轻量占位） */}
              {visibleCount < plants.length ? (
                <div ref={sentinelRef} className="load-sentinel" aria-hidden="true">
                  <span className="load-hint">加载中…</span>
                </div>
              ) : null}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
