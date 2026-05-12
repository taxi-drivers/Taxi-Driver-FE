import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import SurveyPage from './pages/SurveyPage';
import MapPage from './pages/MapPage';
import MapModePage from './pages/MapModePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AdminPage from './pages/AdminPage';
import MyPage from './pages/MyPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/map-mode" element={<MapModePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/me" element={<MyPage />} />
      </Routes>
    </Router>
  );
}

export default App;
