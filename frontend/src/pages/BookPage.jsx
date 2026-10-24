import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchBook } from '../api/bookCache';
import { getSection, SECTION_BOOK_TITLE } from '../components/SectionNav';
import PlantCard from '../components/PlantCard';

// Sprint 18：首屏与滚动步进条数（沿用 Sprint 10 冻结口径）
const PAGE_SIZE = 16;

// 未知 code 兜底：不发列表请求、不读 sessionStorage、不建哨兵
function UnknownBook() {
  return (
    <main className="page book-page">
      <p className="state-tip">这本书还在路上哦</p>
      <p style={{ textAlign: 'center' }}>
        <Link className="back-btn" to="/" state={{ from: 'book' }}>回书架</Link>
      </p>
    </main>
  );
}

function BookView({ code }) {
  const location = useLocation();

  // 是否从详情返回：只看路由 state，不能用「sessionStorage 是否有值」推断
  const fromDetailRef = useRef(Boolean(location.state?.restoreScroll));

  // 滚动记忆按书隔离（Sprint 18 / Q14）
  const readNum = (name) => {
    try {
      return Number(sessionStorage.getItem(`sh:${name}:${code}`)) || 0;
    } catch {
      return 0;
    }
  };

  const [plants, setPlants] = useState(null); // null 表示加载中
  const [error, setError] = useState(null);
  // 条数：无论从详情还是从书架进入，都恢复该书已读条数（至少首屏 16）
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.max(PAGE_SIZE, readNum('bookVisibleCount'))
  );
  const sentinelRef = useRef(null);
  const restoredRef = useRef(false);

  // 书内列表：数据来自 bookCache（书架已预热时命中缓存，零请求）
  useEffect(() => {
    let alive = true;
    setPlants(null);
    setError(null);
    restoredRef.current = false;
    fetchBook(code)
      .then((data) => {
        if (!alive) return;
        const list = data || [];
        setPlants(list);
        // 环境不支持 IntersectionObserver（jsdom / 极旧浏览器）→ 全量渲染降级
        if (typeof IntersectionObserver === 'undefined') setVisibleCount(list.length);
      })
      .catch((err) => {
        if (alive) setError(err);
      });
    return () => {
      alive = false;
    };
  }, [code]);

  // 滚动增量加载——哨兵进入视口即追加 PAGE_SIZE 条
  useEffect(() => {
    if (plants === null || visibleCount >= plants.length) return undefined;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
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

  // 记录已渲染条数，供再次进入该书时恢复
  useEffect(() => {
    try {
      sessionStorage.setItem(`sh:bookVisibleCount:${code}`, String(visibleCount));
    } catch {
      /* 无 sessionStorage 环境忽略 */
    }
  }, [visibleCount, code]);

  // 恢复：从详情返回恢复滚动位置；从书架进入一律置顶 0（上一本书的滚动会残留，必须显式复位）
  useEffect(() => {
    if (plants === null || restoredRef.current) return;
    const target = fromDetailRef.current ? readNum('bookScroll') : 0;
    try {
      window.scrollTo(0, target);
    } catch {
      /* jsdom 等环境忽略 */
    }
    // 兜底：目标位置超出已渲染高度 → 继续补加载后复位
    let reached = target;
    try {
      reached = window.scrollY;
    } catch {
      reached = target;
    }
    if (fromDetailRef.current && reached < target - 2 && visibleCount < plants.length) {
      setVisibleCount((c) => Math.min(plants.length, c + PAGE_SIZE));
      return;
    }
    restoredRef.current = true;
  }, [plants, visibleCount, code]);

  const title = SECTION_BOOK_TITLE[code];
  // Sprint 19（M19-1）：入场方向由来源派生——从书架进入 = 打开书本，从详情返回 = 合上返回；
  // 直接输入 URL / 刷新 / 书内切换无来源标记，不播动画。
  const routeEnter =
    location.state?.from === 'shelf'
      ? 'shelf-to-book'
      : location.state?.from === 'detail'
        ? 'detail-to-book'
        : undefined;

  return (
    <main className="page book-page" data-route-enter={routeEnter}>
      <div className="book-topbar">
        <Link className="back-btn" to="/" state={{ from: 'book' }}>← 回书架</Link>
        <h1 className="book-title">{title}</h1>
      </div>

      <section className="book-page-body page-block" aria-label={`${title}列表`}>
        {error ? (
          <p className="state-tip">{error.message || '哎呀，出了点小问题，请稍后再试'}</p>
        ) : plants === null ? (
          <div className="state-tip">
            <Spin size="large" />
            <p>加载中…</p>
          </div>
        ) : plants.length === 0 ? (
          <p className="state-tip">这个板块还没有内容哦</p>
        ) : (
          <>
            {/* 总量提示「共 N 种」，口径 = 当前书返回条数 */}
            <p className="list-count">共 {plants.length} 种</p>
            <div className="plant-grid">
              {plants.slice(0, visibleCount).map((p) => (
                <PlantCard key={p.id} plant={p} list={plants} section={code} />
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

// 书内页：仅认 8 个已知板块 code（M18-2 裁决），未知 code 直接兜底
export default function BookPage() {
  const { code } = useParams();
  const section = getSection(code);
  if (!section) return <UnknownBook />;
  return <BookView code={code} />;
}
