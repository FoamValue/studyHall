import { useEffect, useMemo, useState } from 'react';
import { Spin } from 'antd';
import { getCategories } from '../api/client';
import { fetchBook } from '../api/bookCache';
import { SECTION_GROUPS, getSection } from './SectionNav';
import BookCard from './BookCard';

// 组内排序：order 数值升序；order 相同或缺失时按 code 字符串升序兜底（不依赖接口顺序）
const orderRank = (value) =>
  typeof value === 'number' && Number.isFinite(value) ? value : Number.POSITIVE_INFINITY;

const byOrder = (a, b) =>
  orderRank(a.order) - orderRank(b.order) || String(a.code).localeCompare(String(b.code));

// Sprint 18（S18-3）：两层书架，书单唯一来源 GET /api/categories（不硬编码 8 本）
export default function BookShelf() {
  const [categories, setCategories] = useState(null); // null 表示加载中
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let alive = true;
    getCategories()
      .then((data) => {
        if (alive) setCategories(data || []);
      })
      .catch((err) => {
        if (alive) setError(err);
      });
    return () => {
      alive = false;
    };
  }, []);

  // 按板块归组（未知板块忽略），组序取 SECTION_GROUPS，空组不渲染
  const rows = useMemo(() => {
    if (categories === null) return [];
    const buckets = new Map(SECTION_GROUPS.map((group) => [group.key, []]));
    categories.forEach((category) => {
      const meta = getSection(category.section) || getSection(category.code);
      if (!meta) return;
      const bucket = buckets.get(meta.group);
      if (bucket) bucket.push(category);
    });
    return SECTION_GROUPS.map((group) => ({
      key: group.key,
      title: group.title,
      books: (buckets.get(group.key) || []).slice().sort(byOrder),
    })).filter((row) => row.books.length > 0);
  }, [categories]);

  // 数量：书单就绪后并发取每本列表长度；失败不影响书名展示
  useEffect(() => {
    if (rows.length === 0) return undefined;
    let alive = true;
    const books = rows.flatMap((row) => row.books);
    Promise.allSettled(books.map((book) => fetchBook(book.code))).then((results) => {
      if (!alive) return;
      const next = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') next[books[index].code] = (result.value || []).length;
      });
      setCounts(next);
    });
    return () => {
      alive = false;
    };
  }, [rows]);

  if (error) {
    return <p className="state-tip">{error.message || '哎呀，出了点小问题，请稍后再试'}</p>;
  }

  if (categories === null) {
    return (
      <div className="state-tip">
        <Spin size="large" />
        <p>加载中…</p>
      </div>
    );
  }

  return (
    <div className="bookshelf">
      {rows.map((row) => (
        <div className="shelf-row" key={row.key}>
          <h2 className="shelf-title">{row.title}</h2>
          <div className="bookshelf-grid">
            {row.books.map((book) => (
              <BookCard key={book.code} book={book} count={counts[book.code]} />
            ))}
          </div>
          <div className="shelf-plank" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
