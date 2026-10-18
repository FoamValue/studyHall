import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { getPlantsBySection } from '../api/client';
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
  const [plants, setPlants] = useState(null); // null 表示加载中
  // 从详情返回时恢复此前的板块；首次进入默认「植物」
  const [section, setSection] = useState(location.state?.section || 'plant');
  const [error, setError] = useState(null);
  // Sprint 10（EX-6）：首屏 + 滚动增量加载；回花园时按记录的条数恢复（至少首屏 16）
  const [visibleCount, setVisibleCount] = useState(() =>
    location.state?.restoreScroll ? Math.max(PAGE_SIZE, readRestoreCount()) : PAGE_SIZE
  );
  const sentinelRef = useRef(null);
  // 区分「首次挂载（可能带恢复态）」与「用户切换板块（须重置分页）」
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

  // 切换板块即重新拉取列表；alive 标记防止竞态回写
  // Sprint 17：植物板块取消二级筛选，统一走 section 参数
  useEffect(() => {
    let alive = true;
    setPlants(null);
    setError(null);
    // 用户切换板块（非首次挂载）时重置分页；带恢复态的首屏保留记录的条数
    if (firstFilterRef.current) {
      firstFilterRef.current = false;
    } else {
      setVisibleCount(PAGE_SIZE);
    }
    getPlantsBySection(section)
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
  }, [section]);

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

  // 切换板块时重置二级筛选项（Sprint 17：植物已无二级筛选，保持 'all' 兼容导航态）
  const handleSectionChange = (nextSection) => {
    setSection(nextSection);
    setCategory('all');
  };

  const sectionLabel = SECTIONS.find((s) => s.code === section)?.label || '';

  return (
    <main className="page">
      <header className="site-header page-block">
        <p className="site-title-pinyin">rèn zhī xiǎo tú jiàn</p>
        <h1 className="site-title-zh">认知小图鉴</h1>
        <p className="site-title-en">Cognitive Guide</p>
      </header>

      <SectionNav value={section} onChange={handleSectionChange} />

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
            {section === 'plant' ? '这里还没有植物哦' : '这个板块还没有内容哦'}
          </p>
        ) : (
          <>
            {/* Sprint 10（EX-6）：总量提示「共 N 种」，口径 = 当前板块返回条数 */}
            <p className="list-count">共 {plants.length} 种</p>
            <div className="plant-grid">
              {plants.slice(0, visibleCount).map((p) => (
                <PlantCard key={p.id} plant={p} list={plants} section={section} />
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
