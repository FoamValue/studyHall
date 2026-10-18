import { Link } from 'react-router-dom';

// Sprint 17：植物已拆分为单部位条目，每条 name.zh 即展示名（桃子/桃花/桃花叶等），
// 无需再按分类派生标题。其他板块同理，name.zh 直接作为卡片标题。
export function deriveCardTitle(plant) {
  return plant?.name?.zh || '';
}

// 植物网格卡片：缩略图 + 中文名 + 拼音 + 英文名，整卡可点进详情
// 进详情时携带当前板块与列表快照（供详情页算相邻植物），并记录首页滚动位置供返回恢复
export default function PlantCard({ plant, list, section }) {
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
      state={{ section, list }}
      onClick={rememberScroll}
    >
      <img className="plant-card-img" src={plant.coverImage} alt={plant.name.zh} loading="lazy" />
      <div className="plant-card-zh">{deriveCardTitle(plant)}</div>
      {plant.name.pinyin ? <div className="plant-card-pinyin">{plant.name.pinyin}</div> : null}
      {plant.name.en ? <div className="plant-card-en">{plant.name.en}</div> : null}
    </Link>
  );
}
