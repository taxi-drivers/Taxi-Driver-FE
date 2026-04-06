import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import './MapPage.css';

// Leaflet 기본 마커 아이콘 fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── 타입 정의 ──

interface LocationState {
  startLocation: string;
  endLocation: string;
  startLat?: number;
  startLon?: number;
  endLat?: number;
  endLon?: number;
}

interface RouteSegment {
  edgeId: string;
  name: string | null;
  highway: string;
  lengthM: number;
  difficulty: number;
  coordinatesJson: string;
}

interface RouteResult {
  totalDistanceM: number;
  estimatedMinutes: number;
  avgDifficulty: number;
  segments: RouteSegment[];
}

// ── 유틸 ──

const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 31) return '#00ff88';
  if (difficulty <= 42) return '#ffcc00';
  return '#ff4444';
};

const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 31) return '쉬움';
  if (difficulty <= 42) return '보통';
  return '어려움';
};

const parseCoordinates = (json: string): [number, number][] => {
  try {
    const coords: number[][] = JSON.parse(json);
    return coords.map(c => [c[1], c[0]] as [number, number]);
  } catch {
    return [];
  }
};

// ── 지도 범위 자동 조정 ──

const FitBounds = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates.length > 0) {
      const bounds = L.latLngBounds(coordinates);
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }, [map, coordinates]);
  return null;
};

const GANGNAM_CENTER: [number, number] = [37.5050, 127.0500];
const DEFAULT_ZOOM = 14;

// ── 메인 컴포넌트 ──

const MapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [isLoading, setIsLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<'safe' | 'fast'>('safe');

  const [startLat, setStartLat] = useState('37.4979');
  const [startLon, setStartLon] = useState('127.0276');
  const [endLat, setEndLat] = useState('37.5172');
  const [endLon, setEndLon] = useState('127.0473');

  const searchRoute = useCallback(async (sLat: number, sLon: number, eLat: number, eLon: number, mode: 'safe' | 'fast') => {
    setIsLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        startLat: sLat, startLon: sLon, endLat: eLat, endLon: eLon,
      };
      if (mode === 'safe') {
        body.vulnerabilities = ['AVOID_HIGHWAY', 'AVOID_COMPLEX_INTERSECTION', 'AVOID_ACCIDENT_PRONE'];
      }
      const response = await api.post<RouteResult>('/routes/search', body);
      setRouteResult(response.data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '경로 탐색에 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (state?.startLat && state?.startLon && state?.endLat && state?.endLon) {
      searchRoute(state.startLat, state.startLon, state.endLat, state.endLon, selectedRoute);
    }
  }, [state, selectedRoute, searchRoute]);

  const handleSearch = () => {
    const sLat = parseFloat(startLat);
    const sLon = parseFloat(startLon);
    const eLat = parseFloat(endLat);
    const eLon = parseFloat(endLon);
    if (isNaN(sLat) || isNaN(sLon) || isNaN(eLat) || isNaN(eLon)) {
      setError('유효한 좌표를 입력해주세요.');
      return;
    }
    searchRoute(sLat, sLon, eLat, eLon, selectedRoute);
  };

  const handleRouteChange = (mode: 'safe' | 'fast') => {
    setSelectedRoute(mode);
    if (routeResult) {
      const sLat = state?.startLat ?? parseFloat(startLat);
      const sLon = state?.startLon ?? parseFloat(startLon);
      const eLat = state?.endLat ?? parseFloat(endLat);
      const eLon = state?.endLon ?? parseFloat(endLon);
      searchRoute(sLat, sLon, eLat, eLon, mode);
    }
  };

  const allCoordinates: [number, number][] = routeResult
    ? routeResult.segments.flatMap(s => parseCoordinates(s.coordinatesJson))
    : [];
  const startCoord: [number, number] | null = allCoordinates.length > 0 ? allCoordinates[0] : null;
  const endCoord: [number, number] | null = allCoordinates.length > 0 ? allCoordinates[allCoordinates.length - 1] : null;

  return (
    <div className="map-page">
      {/* ── 왼쪽 사이드바 ── */}
      <aside className="sidebar">
        {/* 헤더 */}
        <div className="sidebar-header">
          <button className="back-button" onClick={() => navigate('/')}>←</button>
          <h2 className="sidebar-title">
            {state ? (
              <>
                {state.startLocation}
                <span className="arrow">→</span>
                {state.endLocation}
              </>
            ) : '경로 탐색'}
          </h2>
        </div>

        {/* 좌표 입력 */}
        {!state && (
          <div className="coord-input">
            <div className="coord-row">
              <label>출발</label>
              <input type="text" value={startLat} onChange={e => setStartLat(e.target.value)} placeholder="위도" />
              <input type="text" value={startLon} onChange={e => setStartLon(e.target.value)} placeholder="경도" />
            </div>
            <div className="coord-row">
              <label>도착</label>
              <input type="text" value={endLat} onChange={e => setEndLat(e.target.value)} placeholder="위도" />
              <input type="text" value={endLon} onChange={e => setEndLon(e.target.value)} placeholder="경도" />
            </div>
            <button className="search-btn" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? '탐색 중...' : '경로 탐색'}
            </button>
          </div>
        )}

        {/* 경로 옵션 */}
        <div className="route-options">
          <button
            className={`route-option ${selectedRoute === 'safe' ? 'active' : ''}`}
            onClick={() => handleRouteChange('safe')}
          >
            안전 경로
          </button>
          <button
            className={`route-option ${selectedRoute === 'fast' ? 'active' : ''}`}
            onClick={() => handleRouteChange('fast')}
          >
            최단 경로
          </button>
        </div>

        {/* 에러 */}
        {error && <div className="error-bar">{error}</div>}

        {/* 경로 정보 */}
        {routeResult && !isLoading && (
          <div className="route-info">
            {/* 요약 통계 */}
            <div className="info-stats">
              <div className="stat">
                <span className="stat-value">{(routeResult.totalDistanceM / 1000).toFixed(1)}<small>km</small></span>
                <span className="stat-label">거리</span>
              </div>
              <div className="stat">
                <span className="stat-value">{routeResult.estimatedMinutes}<small>분</small></span>
                <span className="stat-label">예상 시간</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {routeResult.avgDifficulty}<small>점</small>
                </span>
                <span className="stat-label">평균 난이도</span>
              </div>
            </div>

            <div
              className="difficulty-summary"
              style={{ borderLeftColor: getDifficultyColor(routeResult.avgDifficulty) }}
            >
              <span
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(routeResult.avgDifficulty) }}
              >
                {getDifficultyLabel(routeResult.avgDifficulty)}
              </span>
              <span className="difficulty-text">
                이 경로의 평균 난이도는 <strong>{routeResult.avgDifficulty}점</strong>입니다
              </span>
            </div>

            {/* 구간별 난이도 */}
            <div className="segments-section">
              <h4>주요 구간 <span className="count">{routeResult.segments.length}개</span></h4>
              <div className="segments-list">
                {routeResult.segments
                  .filter(s => s.name)
                  .slice(0, 15)
                  .map((segment) => (
                    <div key={segment.edgeId} className="segment-item">
                      <div
                        className="segment-color"
                        style={{ backgroundColor: getDifficultyColor(segment.difficulty) }}
                      />
                      <span className="segment-name">{segment.name}</span>
                      <span className="segment-highway">{segment.highway}</span>
                      <span className="segment-score">{segment.difficulty}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* 범례 */}
            <div className="legend">
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#00ff88' }} />
                <span>쉬움 (~31)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ffcc00' }} />
                <span>보통 (31~42)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{ backgroundColor: '#ff4444' }} />
                <span>어려움 (42~)</span>
              </div>
            </div>
          </div>
        )}

        {/* 초기 안내 */}
        {!routeResult && !isLoading && !error && (
          <div className="empty-state">
            <p>출발지와 도착지를 입력하고<br />"경로 탐색" 버튼을 눌러주세요</p>
          </div>
        )}

        {isLoading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>경로를 탐색하고 있습니다...</p>
          </div>
        )}
      </aside>

      {/* ── 오른쪽 지도 영역 ── */}
      <main className="map-area">
        <MapContainer
          center={GANGNAM_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          preferCanvas={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {routeResult?.segments.map((segment) => {
            const coords = parseCoordinates(segment.coordinatesJson);
            if (coords.length < 2) return null;
            return (
              <Polyline
                key={segment.edgeId}
                positions={coords}
                pathOptions={{
                  color: getDifficultyColor(segment.difficulty),
                  weight: 6,
                  opacity: 0.85,
                }}
              >
                <Popup>
                  <div>
                    <strong>{segment.name ?? '이름 없음'}</strong><br />
                    도로 유형: {segment.highway}<br />
                    난이도: {segment.difficulty}점<br />
                    거리: {Math.round(segment.lengthM)}m
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {startCoord && (
            <Marker position={startCoord}>
              <Popup>출발</Popup>
            </Marker>
          )}
          {endCoord && (
            <Marker position={endCoord}>
              <Popup>도착</Popup>
            </Marker>
          )}

          {allCoordinates.length > 0 && (
            <FitBounds coordinates={allCoordinates} />
          )}
        </MapContainer>
      </main>
    </div>
  );
};

export default MapPage;
