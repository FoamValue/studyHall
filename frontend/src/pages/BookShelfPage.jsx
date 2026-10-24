import { useLocation } from 'react-router-dom';
import BookShelf from '../components/BookShelf';

// Sprint 18（S18-1）：首页 = 书架（两层、一屏放下）。容器用 .bookshelf-page，不与 .page 共用。
// Sprint 19（M19-1）：仅从书内页返回时挂入场动画标记（书架 ← 书内页 = 关闭书本），
// 刷新 / 直接输入 URL / 首次进入不挂，避免每次进入都「莫名缩放」。
export default function BookShelfPage() {
  const location = useLocation();
  const routeEnter = location.state?.from === 'book' ? 'book-to-shelf' : undefined;

  return (
    <main className="bookshelf-page" data-route-enter={routeEnter}>
      <header className="site-header">
        <p className="site-title-pinyin">rèn zhī xiǎo tú jiàn</p>
        <h1 className="site-title-zh">认知小图鉴</h1>
        <p className="site-title-en">Cognitive Guide</p>
      </header>

      <BookShelf />
    </main>
  );
}
