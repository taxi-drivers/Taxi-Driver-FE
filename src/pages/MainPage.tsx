import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';

const MainPage = () => {
  const navigate = useNavigate();
  const [startLocation, setStartLocation] = useState<string>('');
  const [endLocation, setEndLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!startLocation.trim() || !endLocation.trim()) {
      alert('출발지와 목적지를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    
    // MapPage로 이동하면서 검색 정보 전달
    navigate('/map', {
      state: {
        startLocation,
        endLocation,
      },
    });
  };

  const handleSurvey = () => {
    navigate('/survey');
  };

  return (
    <div className="main-page">
      <div className="main-container">
        <header className="main-header">
          <h1 className="main-title">🚗 안전 경로 추천</h1>
          <p className="main-subtitle">
            초보 운전자를 위한 인지 중심 경로 안내 서비스
          </p>
        </header>

        <div className="search-section">
          <div className="input-group">
            <label htmlFor="start-location">출발지</label>
            <input
              id="start-location"
              type="text"
              placeholder="출발지를 입력하세요"
              value={startLocation}
              onChange={(e) => setStartLocation(e.target.value)}
              className="location-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="end-location">목적지</label>
            <input
              id="end-location"
              type="text"
              placeholder="목적지를 입력하세요"
              value={endLocation}
              onChange={(e) => setEndLocation(e.target.value)}
              className="location-input"
            />
          </div>

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="search-button"
          >
            {isLoading ? '검색 중...' : '경로 검색'}
          </button>
        </div>

        <div className="feature-section">
          <h2>주요 기능</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3>난이도 분석</h3>
              <p>도로별 난이도를 0~100점으로 시각화</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🛡️</span>
              <h3>맞춤형 경로</h3>
              <p>숙련도에 맞는 안전 경로 추천</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💬</span>
              <h3>피드백 시스템</h3>
              <p>실제 운전 경험 기반 정보 업데이트</p>
            </div>
          </div>
        </div>

        <div className="survey-section">
          <button onClick={handleSurvey} className="survey-button">
            운전 숙련도 설문하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
