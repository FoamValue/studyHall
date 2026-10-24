import BookShelf from '../components/BookShelf';

// Sprint 18（S18-1）：首页 = 书架（两层、一屏放下）。容器用 .bookshelf-page，不与 .page 共用。
export default function BookShelfPage() {
  return (
    <main className="bookshelf-page">
      <header className="site-header">
        <p className="site-title-pinyin">rèn zhī xiǎo tú jiàn</p>
        <h1 className="site-title-zh">认知小图鉴</h1>
        <p className="site-title-en">Cognitive Guide</p>
      </header>

      <BookShelf />
    </main>
  );
}
