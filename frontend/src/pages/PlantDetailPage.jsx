import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getPlant, getPlants, getPlantsBySection } from '../api/client';
import usePlantNavigation from '../hooks/usePlantNavigation';
import useAudio from '../hooks/useAudio';
import PartSwitcher, { PART_LABELS, getOrderedParts } from '../components/PartSwitcher';
import AllusionCard from '../components/AllusionCard';
import SpeakButton from '../components/SpeakButton';

// 水平滑动触发换株的最小位移（px）
const SWIPE_THRESHOLD = 60;

// 单图板块部位：parts 恰 1 键且为该板块 code（Sprint 9；Sprint 15 增字母/拼音，预留数字/颜色）
const SINGLE_IMAGE_KEYS = ['animal', 'insect', 'dinosaur', 'letter', 'pinyin', 'number', 'color'];

// 返回入口文案按板块派生（Sprint 12 / EX-7；Sprint 15 增字母/拼音，预留数字/颜色）；未知板块回退「花园」
const SECTION_HOME = {
  plant: '花园',
  animal: '动物世界',
  insect: '昆虫角',
  dinosaur: '恐龙园',
  letter: '字母乐园',
  pinyin: '拼音角',
  number: '数字屋',
  color: '颜色屋',
};

export default function PlantDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  // 路由 state 携带当前板块/分类与列表快照；深链接进入时兜底为「植物 / 全部」
  const section = location.state?.section || 'plant';
  const category = location.state?.category || 'all';
  // 返回文案随板块派生（Sprint 12 / EX-7）
  const homeLabel = SECTION_HOME[section] || '花园';

  const containerRef = useRef(null);
  const touchStart = useRef(null);

  const [list, setList] = useState(() => location.state?.list || null);
  const [plant, setPlant] = useState(null);
  const [part, setPart] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [errorMsg, setErrorMsg] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen] = useState(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenEnabled)
  );

  // 详情：仅首次进入显示加载态；换株时保留上一帧内容，避免白屏
  useEffect(() => {
    let alive = true;
    getPlant(id)
      .then((data) => {
        if (!alive) return;
        setPlant(data);
        // 默认部位：优先跟随入口分类对应的部位（该植物确有才选中），否则退回固定顺序第一个（Sprint 8 / EX-5）
        const ordered = getOrderedParts(data.parts);
        const preferred =
          ['flower', 'leaf', 'fruit'].includes(category) && data.parts?.[category] ? category : null;
        setPart(preferred || ordered[0] || null);
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

  // 深链接兜底：无路由 state 时按当前分类/板块拉一次列表得到邻居
  useEffect(() => {
    if (list) return;
    let alive = true;
    const req = category !== 'all' ? getPlants(category) : getPlantsBySection(section);
    req
      .then((data) => {
        if (alive) setList(data || []);
      })
      .catch(() => {
        if (alive) setList([]);
      });
    return () => {
      alive = false;
    };
  }, [list, category, section]);

  const { prevId, nextId, canPrev, canNext, goPrev, goNext } = usePlantNavigation({
    list,
    currentId: id,
    category,
    section,
  });

  // 名称读音：预生成音频（HTMLAudioElement），中/英各一个喇叭
  const { playingUrl, play, stop } = useAudio();

  // 换株时停止播放（含浏览器前进 / 后退导致的路由变化），避免残音
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    stop();
  }, [id, stop]);

  // 切部位同样停止播放
  const handlePartChange = (nextPart) => {
    stop();
    setPart(nextPart);
  };

  // 互斥：再点同一喇叭即停止，否则播放该音频
  const togglePlay = (url) => {
    if (playingUrl === url) stop();
    else play(url);
  };

  // 键盘 ← / → 换植物（输入控件内忽略）
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext]);

  // 系统全屏状态同步（Esc / 退出按钮都会触发）；全屏进出时停止播放
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
      stop();
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [stop]);

  // 预加载：当前植物全部部位图 + 相邻植物封面图（即其默认部位大图）
  useEffect(() => {
    if (status !== 'ready' || !plant) return;
    Object.values(plant.parts || {}).forEach((p) => {
      (p.images || []).forEach((img) => {
        const el = new Image();
        el.src = img.url;
      });
    });
    [prevId, nextId].forEach((nid) => {
      const card = list?.find((p) => p.id === nid);
      if (card?.coverImage) {
        const el = new Image();
        el.src = card.coverImage;
      }
    });
  }, [plant, status, prevId, nextId, list]);

  const onTouchStart = (e) => {
    if (e.target?.closest?.('button') || e.target?.closest?.('a')) {
      touchStart.current = null;
      return;
    }
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    // 仅水平位移足够且大于纵向位移时判为换株滑动（右滑=上一株，左滑=下一株）
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx > 0) goPrev();
    else goNext();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  };

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
          <Link className="back-btn" to="/">回{homeLabel}看看</Link>
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

  const ordered = getOrderedParts(plant.parts);
  const current = plant.parts?.[part];
  if (!current) return null;

  // 单图分支：parts 恰 1 键且为板块部位（动物/昆虫/恐龙）→ 不渲染部位切换与部位名行
  const isSingleImage = ordered.length === 1 && SINGLE_IMAGE_KEYS.includes(ordered[0]);

  const zhAudio = plant.name.audioZh;
  // 喇叭按实际音频字段渲染：字母仅有 audioEn、拼音仅有 audioZh（Sprint 15 / Q7）
  const enAudio = plant.name.audioEn;

  return (
    <main
      ref={containerRef}
      className="detail-immersive"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="imm-topbar">
        <Link
          className="back-btn"
          to="/"
          state={{ section, category, restoreScroll: true }}
          onClick={stop}
        >
          ← 回{homeLabel}
        </Link>
        {canFullscreen ? (
          <button type="button" className="back-btn fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? '退出全屏' : '全屏'}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="nav-btn nav-prev"
        aria-label="上一株"
        onClick={goPrev}
        disabled={!canPrev}
      >
        ←<span>上一株</span>
      </button>
      <button
        type="button"
        className="nav-btn nav-next"
        aria-label="下一株"
        onClick={goNext}
        disabled={!canNext}
      >
        <span>下一株</span>→
      </button>

      <div className={isSingleImage ? 'detail-body single-image' : 'detail-body'}>
        <header className="detail-header">
          {plant.name.pinyin ? <p className="detail-pinyin">{plant.name.pinyin}</p> : null}
          <div className="detail-name-row">
            <h1 className="detail-zh">{plant.name.zh}</h1>
            {zhAudio ? (
              <SpeakButton
                text={zhAudio}
                lang="zh"
                speaking={playingUrl === zhAudio}
                onToggle={togglePlay}
              />
            ) : null}
          </div>
          {plant.name.en || enAudio ? (
            <div className="detail-name-row">
              {plant.name.en ? (
                <p className="detail-en">
                  {plant.name.en}
                  {plant.name.ipa ? <span className="detail-ipa">{plant.name.ipa}</span> : null}
                </p>
              ) : null}
              {enAudio ? (
                <SpeakButton
                  text={enAudio}
                  lang="en"
                  speaking={playingUrl === enAudio}
                  onToggle={togglePlay}
                />
              ) : null}
            </div>
          ) : null}
        </header>

        {isSingleImage ? null : (
          <PartSwitcher parts={plant.parts} value={part} onChange={handlePartChange} />
        )}

        <div className="detail-main">
          <img
            className="part-img"
            src={current.images?.[0]?.url}
            alt={isSingleImage ? plant.name.zh : `${plant.name.zh}的${PART_LABELS[part]}`}
            loading="lazy"
          />
          <section
            className="part-content"
            aria-label={isSingleImage ? '说明' : `${PART_LABELS[part]}的内容`}
          >
            <p className="part-desc">{current.description}</p>
            <AllusionCard allusion={current.allusion} />
          </section>
        </div>
      </div>
    </main>
  );
}
