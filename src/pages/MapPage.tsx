import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './MapPage.css';

interface LocationState {
  startLocation: string;
  endLocation: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  avgDifficulty: number;
  segments: RouteSegment[];
}

interface RouteSegment {
  difficulty: number;
  description: string;
  coordinates: [number, number][];
}

const MapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<'safe' | 'fast' | 'short'>('safe');

  // 난이도에 따른 색상 반환
  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 30) return '#00ff88'; // 쉬움 - 초록
    if (difficulty <= 60) return '#ffcc00'; // 보통 - 노랑
    return '#ff4444'; // 어려움 - 빨강
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 30) return '쉬움';
    if (difficulty <= 60) return '보통';
    return '어려움';
  };

  useEffect(() => {
    // T map API 초기화 (실제 구현 시 API 키 필요)
    const initMap = async () => {
      setIsLoading(true);
      
      // 데모용 더미 데이터
      setTimeout(() => {
        setRouteInfo({
          distance: 5.2,
          duration: 18,
          avgDifficulty: 42,
          segments: [
            { difficulty: 25, description: '직진 구간', coordinates: [] },
            { difficulty: 55, description: '좌회전 교차로', coordinates: [] },
            { difficulty: 70, description: '급경사 구간', coordinates: [] },
            { difficulty: 30, description: '일반 도로', coordinates: [] },
          ],
        });
        setIsLoading(false);
      }, 1500);
    };

    initMap();
  }, [state]);

  const handleBack = () => {
    navigate('/');
  };

  const handleFeedback = () => {
    // 피드백 페이지로 이동 또는 모달 표시
    alert('경로 피드백 기능은 추후 구현 예정입니다.');
  };

  if (!state) {
    return (
      <div className="map-page">
        <div className="error-container">
          <p>경로 정보가 없습니다. 메인 페이지에서 검색해주세요.</p>
          <button onClick={handleBack}>메인으로 돌아가기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-page">
      <div className="map-container">
        {/* 헤더 */}
        <header className="map-header">
          <button className="back-button" onClick={handleBack}>
            ← 뒤로
          </button>
          <div className="route-title">
            <span className="location">{state.startLocation}</span>
            <span className="arrow">→</span>
            <span className="location">{state.endLocation}</span>
          </div>
        </header>

        {/* 경로 옵션 */}
        <div className="route-options">
          <button
            className={`route-option ${selectedRoute === 'safe' ? 'active' : ''}`}
            onClick={() => setSelectedRoute('safe')}
          >
            🛡️ 안전 경로
          </button>
          <button
            className={`route-option ${selectedRoute === 'fast' ? 'active' : ''}`}
            onClick={() => setSelectedRoute('fast')}
          >
            ⚡ 빠른 경로
          </button>
          <button
            className={`route-option ${selectedRoute === 'short' ? 'active' : ''}`}
            onClick={() => setSelectedRoute('short')}
          >
            📏 최단 경로
          </button>
        </div>

        {/* 지도 영역 */}
        <div className="map-area" ref={mapRef}>
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>경로를 탐색하고 있습니다...</p>
            </div>
          ) : (
            <div className="map-placeholder">
              <p>🗺️ T map API 연동 영역</p>
              <p className="map-note">
                실제 구현 시 T map API를 연동하여<br />
                난이도별 색상이 표시된 경로가 나타납니다.
              </p>
            </div>
          )}
        </div>

        {/* 경로 정보 패널 */}
        {routeInfo && !isLoading && (
          <div className="info-panel">
            <div className="info-header">
              <h3>경로 정보</h3>
              <div 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(routeInfo.avgDifficulty) }}
              >
                {getDifficultyLabel(routeInfo.avgDifficulty)}
              </div>
            </div>

            <div className="info-stats">
              <div className="stat">
                <span className="stat-value">{routeInfo.distance}km</span>
                <span className="stat-label">거리</span>
              </div>
              <div className="stat">
                <span className="stat-value">{routeInfo.duration}분</span>
                <span className="stat-label">예상 시간</span>
              </div>
              <div className="stat">
                <span className="stat-value">{routeInfo.avgDifficulty}점</span>
                <span className="stat-label">평균 난이도</span>
              </div>
            </div>

            {/* 구간별 난이도 */}
            <div className="segments-section">
              <h4>구간별 난이도</h4>
              <div className="segments-list">
                {routeInfo.segments.map((segment, index) => (
                  <div key={index} className="segment-item">
                    <div 
                      className="segment-color"
                      style={{ backgroundColor: getDifficultyColor(segment.difficulty) }}
                    />
                    <div className="segment-info">
                      <span className="segment-desc">{segment.description}</span>
                      <span className="segment-score">{segment.difficulty}점</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 난이도 범례 */}
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#00ff88' }}></span>
                <span>쉬움 (0-30)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ffcc00' }}></span>
                <span>보통 (31-60)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ff4444' }}></span>
                <span>어려움 (61-100)</span>
              </div>
            </div>

            <button className="feedback-button" onClick={handleFeedback}>
              💬 경로 피드백 남기기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
