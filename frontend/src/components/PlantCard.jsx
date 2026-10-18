import { Link } from 'react-router-dom';

// 果实惯用名特例：依据语料里该果实本身的说法（银杏的果=白果、松树的果=松果、荷花的果=莲蓬）
export const FRUIT_SPECIAL_NAMES = { ginkgo: '白果', pine: '松果', lotus: '莲蓬' };

// 卡片标题按入口分类派生（Sprint 8 / EX-4）：
// 花→名已含「花」保持原名，否则 名称+「花」；叶→一律 名称+「叶」；果→特例表命中否则原名；全部/未知→原名
export function deriveCardTitle(plant, category) {
  const zh = plant?.name?.zh || '';
  if (category === 'flower') return zh.includes('花') ? zh : `${zh}花`;
  if (category === 'leaf') return `${zh}叶`;
  if (category === 'fruit') return FRUIT_SPECIAL_NAMES[plant?.id] || zh;
  return zh;
}

// 植物网格卡片：缩略图 + 中文名（按分类派生） + 拼音 + 英文名，整卡可点进详情
// 进详情时携带当前板块/分类与列表快照（供详情页算相邻植物），并记录首页滚动位置供返回恢复
export default function PlantCard({ plant, category, list, section }) {
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
      state={{ section, category, list }}
      onClick={rememberScroll}
    >
      <img className="plant-card-img" src={plant.coverImage} alt={plant.name.zh} loading="lazy" />
      <div className="plant-card-zh">{deriveCardTitle(plant, category)}</div>
      {plant.name.pinyin ? <div className="plant-card-pinyin">{plant.name.pinyin}</div> : null}
      {plant.name.en ? <div className="plant-card-en">{plant.name.en}</div> : null}
    </Link>
  );
}
