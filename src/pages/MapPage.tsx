import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

// Leaflet marker icon fix
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── Types ──

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

// ── Utils ──

const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 31) return '#22c55e';
  if (difficulty <= 42) return '#f59e0b';
  return '#ef4444';
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

// ── Map auto-fit ──

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

// ── Map zoom controls ──

const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
      <div className="flex flex-col bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-slate-200">
        <button
          onClick={() => map.zoomIn()}
          className="p-3 text-slate-600 hover:bg-slate-100 border-b border-slate-200"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="p-3 text-slate-600 hover:bg-slate-100"
        >
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>
      <button
        onClick={() => map.setView([37.5050, 127.0500], 14)}
        className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-xl text-primary border border-slate-200 hover:bg-slate-100"
      >
        <span className="material-symbols-outlined">my_location</span>
      </button>
    </div>
  );
};

const GANGNAM_CENTER: [number, number] = [37.5050, 127.0500];
const DEFAULT_ZOOM = 14;

// ── Main Component ──

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
    <div className="flex h-screen w-full overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="flex w-72 flex-col border-r border-slate-200 bg-white shrink-0 overflow-y-auto">
        <div className="flex flex-col h-full p-4 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="bg-primary rounded-lg p-2 text-white">
              <span className="material-symbols-outlined">explore</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900">SafeDrive</h1>
              <p className="text-xs text-slate-400 font-medium">강남구 안전 경로</p>
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>메인으로</span>
          </button>

          {/* Route title */}
          {state && (
            <div className="px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">경로</p>
              <p className="text-sm font-bold text-slate-900">
                {state.startLocation} → {state.endLocation}
              </p>
            </div>
          )}

          {/* Coordinate input */}
          {!state && (
            <div className="flex flex-col gap-3 px-1">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">출발 좌표</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={startLat} onChange={e => setStartLat(e.target.value)}
                    placeholder="위도"
                    className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <input
                    type="text" value={startLon} onChange={e => setStartLon(e.target.value)}
                    placeholder="경도"
                    className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500">도착 좌표</label>
                <div className="flex gap-2">
                  <input
                    type="text" value={endLat} onChange={e => setEndLat(e.target.value)}
                    placeholder="위도"
                    className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <input
                    type="text" value={endLon} onChange={e => setEndLon(e.target.value)}
                    placeholder="경도"
                    className="flex-1 h-9 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full h-10 bg-primary text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all disabled:opacity-50"
              >
                {isLoading ? '탐색 중...' : '경로 탐색'}
              </button>
            </div>
          )}

          {/* Route mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => handleRouteChange('safe')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedRoute === 'safe'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              안전 경로
            </button>
            <button
              onClick={() => handleRouteChange('fast')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedRoute === 'fast'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              최단 경로
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          {/* Route result */}
          {routeResult && !isLoading && (
            <div className="flex flex-col gap-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-lg font-black text-slate-900">
                    {(routeResult.totalDistanceM / 1000).toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">km</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-lg font-black text-slate-900">
                    {routeResult.estimatedMinutes}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">분</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-lg font-black" style={{ color: getDifficultyColor(routeResult.avgDifficulty) }}>
                    {routeResult.avgDifficulty}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">난이도</span>
                </div>
              </div>

              {/* Difficulty badge */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-lg border-l-4"
                style={{ borderLeftColor: getDifficultyColor(routeResult.avgDifficulty), backgroundColor: `${getDifficultyColor(routeResult.avgDifficulty)}10` }}
              >
                <span
                  className="px-2 py-1 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: getDifficultyColor(routeResult.avgDifficulty) }}
                >
                  {getDifficultyLabel(routeResult.avgDifficulty)}
                </span>
                <span className="text-sm text-slate-700">
                  평균 난이도 <strong>{routeResult.avgDifficulty}점</strong>
                </span>
              </div>

              {/* Segments list */}
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  주요 구간 <span className="text-primary">{routeResult.segments.length}개</span>
                </h4>
                <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                  {routeResult.segments
                    .filter(s => s.name)
                    .slice(0, 15)
                    .map((segment) => (
                      <div key={segment.edgeId} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: getDifficultyColor(segment.difficulty) }}
                        />
                        <span className="text-sm text-slate-900 truncate flex-1">{segment.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{segment.highway}</span>
                        <span className="text-xs font-bold" style={{ color: getDifficultyColor(segment.difficulty) }}>
                          {segment.difficulty}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!routeResult && !isLoading && !error && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-slate-400 text-center leading-relaxed">
                출발지와 도착지를 입력하고<br />"경로 탐색" 버튼을 눌러주세요
              </p>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="size-8 border-3 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-slate-400">경로를 탐색하고 있습니다...</p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-auto pt-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">난이도 범례</p>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
                <span className="size-2 rounded-full bg-green-500" /> 쉬움 (~31)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                <span className="size-2 rounded-full bg-amber-500" /> 보통 (31~42)
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                <span className="size-2 rounded-full bg-red-500" /> 어려움 (42~)
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Map Area ── */}
      <main className="flex-1 relative">
        <MapContainer
          center={GANGNAM_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          preferCanvas={true}
          zoomControl={false}
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
                  <div className="font-sans">
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

          {allCoordinates.length > 0 && <FitBounds coordinates={allCoordinates} />}
          <ZoomControls />
        </MapContainer>
      </main>
    </div>
  );
};

export default MapPage;
