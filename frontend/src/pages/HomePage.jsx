import { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { getCategories, getPlants } from '../api/client';
import CategoryFilter from '../components/CategoryFilter';
import PlantCard from '../components/PlantCard';

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [plants, setPlants] = useState(null); // null 表示加载中
  const [category, setCategory] = useState('all');
  const [error, setError] = useState(null);

  // 分类列表只取一次；失败时筛选按钮退化为仅有「全部」，不阻塞主流程
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  // 切换分类即重新拉取列表；alive 标记防止竞态回写
  useEffect(() => {
    let alive = true;
    setPlants(null);
    setError(null);
    getPlants(category === 'all' ? undefined : category)
      .then((data) => {
        if (alive) setPlants(data || []);
      })
      .catch((err) => {
        if (alive) setError(err);
      });
    return () => {
      alive = false;
    };
  }, [category]);

  return (
    <main className="page">
      <header className="site-header page-block">
        <p className="site-title-pinyin">zhí wù xiǎo huā yuán</p>
        <h1 className="site-title-zh">植物小花园</h1>
        <p className="site-title-en">Plant Garden</p>
      </header>

      <CategoryFilter categories={categories} value={category} onChange={setCategory} />

      <section className="page-block" aria-label="植物列表">
        {error ? (
          <p className="state-tip">{error.message || '哎呀，出了点小问题，请稍后再试'}</p>
        ) : plants === null ? (
          <div className="state-tip">
            <Spin size="large" />
            <p>加载中…</p>
          </div>
        ) : plants.length === 0 ? (
          <p className="state-tip">这个分类还没有植物哦</p>
        ) : (
          <div className="plant-grid">
            {plants.map((p) => (
              <PlantCard key={p.id} plant={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
