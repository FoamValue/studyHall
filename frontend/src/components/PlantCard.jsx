import { Link } from 'react-router-dom';

// 植物网格卡片：缩略图 + 中文名 + 拼音 + 英文名，整卡可点进详情
// 进详情时携带当前分类与列表快照（供详情页算相邻植物），并记录首页滚动位置供返回恢复
export default function PlantCard({ plant, category, list }) {
  const rememberScroll = () => {
    try {
      sessionStorage.setItem('sh:homeScroll', String(window.scrollY || 0));
    } catch {
      /* 无 sessionStorage 环境忽略 */
    }
  };

  return (
    <Link
      className="plant-card"
      to={`/plants/${plant.id}`}
      state={{ category, list }}
      onClick={rememberScroll}
    >
      <img className="plant-card-img" src={plant.coverImage} alt={plant.name.zh} loading="lazy" />
      <div className="plant-card-zh">{plant.name.zh}</div>
      <div className="plant-card-pinyin">{plant.name.pinyin}</div>
      <div className="plant-card-en">{plant.name.en}</div>
    </Link>
  );
}
