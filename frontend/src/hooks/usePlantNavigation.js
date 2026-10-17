import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 植物前后切换：在当前生效列表（当前分类的有序卡片数组）内计算上一株/下一株，首尾循环。
 * 邻居由同一份列表快照计算，不依赖后端跨请求的顺序稳定。
 */
export default function usePlantNavigation({ list, currentId, category }) {
  const navigate = useNavigate();

  const nav = useMemo(() => {
    const ids = list ? list.map((p) => p.id) : [];
    const n = ids.length;
    const i = ids.indexOf(currentId);
    if (n <= 1 || i < 0) {
      return { prevId: null, nextId: null, canPrev: false, canNext: false };
    }
    return {
      prevId: ids[(i - 1 + n) % n], // 首尾循环
      nextId: ids[(i + 1) % n],
      canPrev: true,
      canNext: true,
    };
  }, [list, currentId]);

  const goto = useCallback(
    (targetId) => {
      if (!targetId) return;
      // 携带列表快照继续连续翻株，邻居来源不丢
      navigate(`/plants/${targetId}`, { state: { category, list } });
    },
    [navigate, category, list]
  );

  const goPrev = useCallback(() => goto(nav.prevId), [goto, nav.prevId]);
  const goNext = useCallback(() => goto(nav.nextId), [goto, nav.nextId]);

  return { ...nav, goPrev, goNext };
}
