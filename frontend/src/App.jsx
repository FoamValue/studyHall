import { Routes, Route } from 'react-router-dom';
import BookShelfPage from './pages/BookShelfPage';
import BookPage from './pages/BookPage';
import PlantDetailPage from './pages/PlantDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BookShelfPage />} />
      <Route path="/books/:code" element={<BookPage />} />
      <Route path="/plants/:id" element={<PlantDetailPage />} />
    </Routes>
  );
}
