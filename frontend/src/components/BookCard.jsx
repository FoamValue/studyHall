import { Link } from 'react-router-dom';
import { coverPath } from './SectionNav';

// Sprint 18（S18-3 / M18-1）：单本书 = 封面（花纹平铺底 + HTML 文字层）+ 书脊 + 书页厚度。
// 书名 = category.nameZh + '书'，与书内页 h1 同源；数量未就绪时渲染空串但保留元素占位（防布局跳动）。
export default function BookCard({ book, count }) {
  const title = `${book.nameZh}书`;
  const countText = count == null ? '' : `共 ${count} 种`;

  return (
    <Link
      className="book"
      to={`/books/${book.code}`}
      state={{ from: 'shelf' }}
      aria-label={count == null ? title : `${title}，共 ${count} 种`}
    >
      <span className="book-spine" aria-hidden="true" />
      <span className="book-pages" aria-hidden="true" />
      <span className="book-cover" style={{ backgroundImage: `url(${coverPath(book.code)})` }}>
        <span className="book-title-zh">{title}</span>
        {book.pinyin ? <span className="book-title-pinyin">{book.pinyin}</span> : null}
        {book.nameEn ? <span className="book-title-en">{book.nameEn}</span> : null}
        <span className="book-count">{countText}</span>
      </span>
    </Link>
  );
}
