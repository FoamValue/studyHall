import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPlant } from '../api/client';
import PartSwitcher, { PART_LABELS, getOrderedParts } from '../components/PartSwitcher';
import AllusionCard from '../components/AllusionCard';

export default function PlantDetailPage() {
  const { id } = useParams();
  const [plant, setPlant] = useState(null);
  const [part, setPart] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    getPlant(id)
      .then((data) => {
        if (!alive) return;
        setPlant(data);
        setPart(getOrderedParts(data.parts)[0] || null); // 默认选中第一个存在部位
        setStatus('ready');
      })
      .catch((err) => {
        if (!alive) return;
        if (err && err.code === 40401) {
          setStatus('notfound');
        } else {
          setErrorMsg(err?.message || '哎呀，出了点小问题，请稍后再试');
          setStatus('error');
        }
      });
    return () => {
      alive = false;
    };
  }, [id]);

  // 预加载同植物全部部位图片，切换部位即时显示
  useEffect(() => {
    if (status !== 'ready' || !plant) return;
    Object.values(plant.parts || {}).forEach((p) => {
      (p.images || []).forEach((img) => {
        const el = new Image();
        el.src = img.url;
      });
    });
  }, [plant, status]);

  if (status === 'loading') {
    return (
      <main className="page">
        <p className="state-tip">加载中…</p>
      </main>
    );
  }
  if (status === 'notfound') {
    return (
      <main className="page">
        <p className="state-tip">这株植物还没准备好哦</p>
        <p style={{ textAlign: 'center' }}>
          <Link className="back-btn" to="/">回花园看看</Link>
        </p>
      </main>
    );
  }
  if (status === 'error') {
    return (
      <main className="page">
        <p className="state-tip">{errorMsg}</p>
      </main>
    );
  }

  const current = plant.parts?.[part];
  if (!current) return null;

  return (
    <main className="page">
      <p className="page-block">
        <Link className="back-btn" to="/">← 回花园</Link>
      </p>

      <header className="detail-header page-block">
        <p className="detail-pinyin">{plant.name.pinyin}</p>
        <h1 className="detail-zh">{plant.name.zh}</h1>
        <p className="detail-en">
          {plant.name.en}
          {plant.name.ipa ? <span className="detail-ipa">{plant.name.ipa}</span> : null}
        </p>
      </header>

      <PartSwitcher parts={plant.parts} value={part} onChange={setPart} />

      <section className="page-block part-content" aria-label={`${PART_LABELS[part]}的内容`}>
        <img
          className="part-img"
          src={current.images?.[0]?.url}
          alt={`${plant.name.zh}的${PART_LABELS[part]}`}
        />
        <p className="part-name-zh">{current.name?.zh}</p>
        <p className="part-name-sub">
          {current.name?.pinyin} · {current.name?.en}
          {current.name?.ipa ? ` ${current.name.ipa}` : ''}
        </p>
        <p className="part-desc">{current.description}</p>
      </section>

      <AllusionCard allusion={current.allusion} />
    </main>
  );
}
