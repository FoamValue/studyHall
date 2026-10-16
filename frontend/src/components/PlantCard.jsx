import { Link } from 'react-router-dom';

// 植物网格卡片：缩略图 + 中文名 + 拼音 + 英文名，整卡可点进详情
export default function PlantCard({ plant }) {
  return (
    <Link className="plant-card" to={`/plants/${plant.id}`}>
      <img className="plant-card-img" src={plant.coverImage} alt={plant.name.zh} loading="lazy" />
      <div className="plant-card-zh">{plant.name.zh}</div>
      <div className="plant-card-pinyin">{plant.name.pinyin}</div>
      <div className="plant-card-en">{plant.name.en}</div>
    </Link>
  );
}
