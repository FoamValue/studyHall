import { useEffect, useRef, useState } from 'react';
import { Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { getCategories, getPlants, getPlantsBySection } from '../api/client';
import CategoryFilter from '../components/CategoryFilter';
import SectionNav, { SECTIONS } from '../components/SectionNav';
import PlantCard from '../components/PlantCard';

export default function HomePage() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [plants, setPlants] = useState(null); // null 表示加载中
  // 从详情返回时恢复此前的板块与分类筛选；首次进入默认「植物 / 全部」
  const [section, setSection] = useState(location.state?.section || 'plant');
  const [category, setCategory] = useState(location.state?.category || 'all');
  const [error, setError] = useState(null);

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
    const req =
      section === 'plant'
        ? category === 'all'
          ? getPlantsBySection('plant')
          : getPlants(category)
        : getPlantsBySection(section);
    req
      .then((data) => {
        if (alive) setPlants(data || []);
      })
      .catch((err) => {
        if (alive) setError(err);
      });
    return () => {
      alive = false;
    };
  }, [section, category]);

  useEffect(() => {
    if (pendingScroll.current === null || plants === null) return;
    const y = pendingScroll.current;
    pendingScroll.current = null;
    try {
      window.scrollTo(0, y);
    } catch {
      /* jsdom 等环境忽略 */
    }
  }, [plants]);

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
        <p className="site-title-pinyin">zì rán xiǎo tú jiàn</p>
        <h1 className="site-title-zh">自然小图鉴</h1>
        <p className="site-title-en">Nature Guide</p>
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
          <div className="plant-grid">
            {plants.map((p) => (
              <PlantCard key={p.id} plant={p} category={category} list={plants} section={section} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
