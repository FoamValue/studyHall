import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PlantDetailPage from './pages/PlantDetailPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/plants/:id" element={<PlantDetailPage />} />
    </Routes>
  );
}
