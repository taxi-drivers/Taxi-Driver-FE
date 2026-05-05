import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SurveyPage from './pages/SurveyPage';
import MapPage from './pages/MapPage';
import MapModePage from './pages/MapModePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/map-mode" element={<MapModePage />} />
      </Routes>
    </Router>
  );
}

export default App;
