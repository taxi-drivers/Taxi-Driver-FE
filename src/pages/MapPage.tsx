import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import SegmentDetailPopover, { type SegmentDetailData } from '../components/SegmentDetailPopover';

// 커스텀 원형 마커 (출발 = 파랑, 도착 = 빨강)
const createMarkerIcon = (color: string, materialIcon: string) =>
  L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="
        position: relative;
        width: 40px; height: 40px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05);
        display: flex; align-items: center; justify-content: center;
      ">
        <span class="material-symbols-outlined" style="color: white; font-size: 22px; font-variation-settings: 'FILL' 1;">${materialIcon}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    tooltipAnchor: [0, -22],
  });

const START_ICON = createMarkerIcon('#195de6', 'trip_origin');
const END_ICON = createMarkerIcon('#ef4444', 'flag');

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
  accidentRateScore?: number | null;
  roadShapeScore?: number | null;
  roadScaleScore?: number | null;
  intersectionScore?: number | null;
  trafficVolumeScore?: number | null;
  slope?: number | null;
}

interface RouteResult {
  totalDistanceM: number;
  estimatedMinutes: number;
  avgDifficulty: number;
  segments: RouteSegment[];
}

// ── Utils ──

const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 30.7) return '#22c55e';
  if (difficulty <= 41.5) return '#f59e0b';
  return '#ef4444';
};

const getDifficultyLabel = (difficulty: number): string => {
  if (difficulty <= 30.7) return '쉬움';
  if (difficulty <= 41.5) return '보통';
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
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  }, [map, coordinates]);
  return null;
};

// ── Floating zoom controls ──

const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-3">
      <div className="flex flex-col bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <button
          onClick={() => map.zoomIn()}
          className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 border-b border-slate-200 transition-colors"
          aria-label="확대"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
          aria-label="축소"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
      </div>
      <button
        onClick={() => map.setView([37.5050, 127.0500], 14)}
        className="w-11 h-11 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl shadow-lg text-primary border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-label="강남구 중심"
      >
        <span className="material-symbols-outlined text-[20px]">my_location</span>
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
  const [hoveredGroupKey, setHoveredGroupKey] = useState<string | null>(null);

  const [startLat, setStartLat] = useState('37.4979');
  const [startLon, setStartLon] = useState('127.0276');
  const [endLat, setEndLat] = useState('37.5172');
  const [endLon, setEndLon] = useState('127.0473');

  const searchRoute = useCallback(async (sLat: number, sLon: number, eLat: number, eLon: number, mode: 'safe' | 'fast') => {
    setIsLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { startLat: sLat, startLon: sLon, endLat: eLat, endLon: eLon };
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

  // 같은 도로명 연속 엣지를 하나로 묶음 (가중평균 + edgeIds Set)
  const groupedRoute = useMemo(() => {
    if (!routeResult) return [];
    interface Group {
      key: string;
      name: string;
      highway: string;
      edgeIds: string[];
      totalLength: number;
      difficulty: number;
      accidentRateScore: number | null;
      roadShapeScore: number | null;
      roadScaleScore: number | null;
      intersectionScore: number | null;
      trafficVolumeScore: number | null;
      slope: number | null;
    }
    const groups: Group[] = [];

    interface Acc {
      sumLen: number;
      sumLenDiff: number;
      score: { sumLen: number; sumWeighted: number }[];
      slope: { sumLen: number; sumWeighted: number };
    }
    const accs = new Map<number, Acc>();

    const scoreFields = [
      'accidentRateScore',
      'roadShapeScore',
      'roadScaleScore',
      'intersectionScore',
      'trafficVolumeScore',
    ] as const;

    routeResult.segments.forEach((s) => {
      if (!s.name) return;
      const last = groups[groups.length - 1];
      const sameAsLast = last && last.name === s.name && last.highway === s.highway;

      let group: Group;
      let acc: Acc;
      if (sameAsLast) {
        group = last!;
        acc = accs.get(groups.length - 1)!;
      } else {
        group = {
          key: `${s.name}-${groups.length}`,
          name: s.name,
          highway: s.highway,
          edgeIds: [],
          totalLength: 0,
          difficulty: 0,
          accidentRateScore: null,
          roadShapeScore: null,
          roadScaleScore: null,
          intersectionScore: null,
          trafficVolumeScore: null,
          slope: null,
        };
        groups.push(group);
        acc = {
          sumLen: 0,
          sumLenDiff: 0,
          score: scoreFields.map(() => ({ sumLen: 0, sumWeighted: 0 })),
          slope: { sumLen: 0, sumWeighted: 0 },
        };
        accs.set(groups.length - 1, acc);
      }

      group.edgeIds.push(s.edgeId);
      acc.sumLen += s.lengthM;
      acc.sumLenDiff += s.lengthM * s.difficulty;

      scoreFields.forEach((f, i) => {
        const v = s[f];
        if (v !== null && v !== undefined) {
          acc.score[i].sumLen += s.lengthM;
          acc.score[i].sumWeighted += s.lengthM * v;
        }
      });
      if (s.slope !== null && s.slope !== undefined) {
        acc.slope.sumLen += s.lengthM;
        acc.slope.sumWeighted += s.lengthM * s.slope;
      }
    });

    groups.forEach((g, idx) => {
      const acc = accs.get(idx)!;
      g.totalLength = acc.sumLen;
      g.difficulty = acc.sumLen > 0 ? acc.sumLenDiff / acc.sumLen : 0;
      scoreFields.forEach((f, i) => {
        const a = acc.score[i];
        g[f] = a.sumLen > 0 ? a.sumWeighted / a.sumLen : null;
      });
      g.slope = acc.slope.sumLen > 0 ? acc.slope.sumWeighted / acc.slope.sumLen : null;
    });

    return groups;
  }, [routeResult]);

  const hoveredGroup = useMemo(
    () => groupedRoute.find((g) => g.key === hoveredGroupKey) ?? null,
    [groupedRoute, hoveredGroupKey]
  );
  const hoveredEdgeIds = useMemo(
    () => new Set(hoveredGroup?.edgeIds ?? []),
    [hoveredGroup]
  );
  const popoverData: SegmentDetailData | null = hoveredGroup
    ? {
        edgeId: hoveredGroup.key,
        name: hoveredGroup.name,
        highway: hoveredGroup.highway,
        lengthM: hoveredGroup.totalLength,
        difficulty: hoveredGroup.difficulty,
        accidentRateScore: hoveredGroup.accidentRateScore,
        roadShapeScore: hoveredGroup.roadShapeScore,
        roadScaleScore: hoveredGroup.roadScaleScore,
        intersectionScore: hoveredGroup.intersectionScore,
        trafficVolumeScore: hoveredGroup.trafficVolumeScore,
        slope: hoveredGroup.slope,
      }
    : null;

  const allCoordinates: [number, number][] = routeResult
    ? routeResult.segments.flatMap(s => parseCoordinates(s.coordinatesJson))
    : [];
  const startCoord: [number, number] | null = allCoordinates.length > 0 ? allCoordinates[0] : null;
  const endCoord: [number, number] | null = allCoordinates.length > 0 ? allCoordinates[allCoordinates.length - 1] : null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f6f8]">
      {/* ── Sidebar ── */}
      <aside className="flex w-[340px] flex-col border-r border-slate-200 bg-white shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
          <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[22px]">explore</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">SafeDrive</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">강남구 안전 경로</p>
          </div>
        </div>

        <div className="flex flex-col p-6 gap-6 flex-1">
          {/* Back navigation */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 -mx-3 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-sm font-medium self-start"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>메인으로</span>
          </button>

          {/* Route title (when state exists) */}
          {state && (
            <div className="px-4 py-3 bg-primary/5 rounded-xl border border-primary/15">
              <p className="text-[10px] text-primary font-bold tracking-[0.18em] uppercase mb-1.5">현재 경로</p>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {state.startLocation} → {state.endLocation}
              </p>
            </div>
          )}

          {/* Coordinate input (when no state) */}
          {!state && (
            <div className="flex flex-col gap-4">
              <p className="text-[10px] text-slate-400 font-bold tracking-[0.18em] uppercase">좌표 직접 입력</p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">출발 (위도, 경도)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={startLat}
                      onChange={e => setStartLat(e.target.value)}
                      placeholder="위도"
                      className="h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                    />
                    <input
                      type="text"
                      value={startLon}
                      onChange={e => setStartLon(e.target.value)}
                      placeholder="경도"
                      className="h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-700">도착 (위도, 경도)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={endLat}
                      onChange={e => setEndLat(e.target.value)}
                      placeholder="위도"
                      className="h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                    />
                    <input
                      type="text"
                      value={endLon}
                      onChange={e => setEndLon(e.target.value)}
                      placeholder="경도"
                      className="h-10 px-3 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full h-11 mt-1 bg-primary text-white text-sm font-bold rounded-lg hover:brightness-110 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? '탐색 중...' : '경로 탐색'}</span>
                  {!isLoading && <span className="material-symbols-outlined text-[16px]">search</span>}
                </button>
              </div>
            </div>
          )}

          {/* Route mode toggle */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.18em] uppercase">경로 모드</p>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => handleRouteChange('safe')}
                className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRoute === 'safe'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">shield</span>
                <span>안전 경로</span>
              </button>
              <button
                onClick={() => handleRouteChange('fast')}
                className={`flex-1 h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedRoute === 'fast'
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>최단 경로</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs leading-relaxed">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-slate-400">경로를 탐색하고 있습니다...</p>
            </div>
          )}

          {/* Route result */}
          {routeResult && !isLoading && (
            <div className="flex flex-col gap-5">
              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-black text-slate-900 tabular-nums leading-none">
                    {(routeResult.totalDistanceM / 1000).toFixed(1)}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">km</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xl font-black text-slate-900 tabular-nums leading-none">
                    {routeResult.estimatedMinutes}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">분</span>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span
                    className="text-xl font-black tabular-nums leading-none"
                    style={{ color: getDifficultyColor(routeResult.avgDifficulty) }}
                  >
                    {routeResult.avgDifficulty}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">난이도</span>
                </div>
              </div>

              {/* Difficulty summary */}
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl border-l-4"
                style={{
                  borderLeftColor: getDifficultyColor(routeResult.avgDifficulty),
                  backgroundColor: `${getDifficultyColor(routeResult.avgDifficulty)}10`
                }}
              >
                <span
                  className="px-2.5 py-1 rounded-md text-[11px] font-bold text-white"
                  style={{ backgroundColor: getDifficultyColor(routeResult.avgDifficulty) }}
                >
                  {getDifficultyLabel(routeResult.avgDifficulty)}
                </span>
                <span className="text-xs text-slate-700 leading-snug">
                  평균 난이도 <strong className="font-bold">{routeResult.avgDifficulty}점</strong>
                </span>
              </div>

              {/* Segments list (연속 동일 도로명은 하나로 그룹핑) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 font-bold tracking-[0.18em] uppercase">주요 구간</p>
                  <span className="text-[10px] text-primary font-bold">{groupedRoute.length}개</span>
                </div>
                <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1 -mr-1">
                  {groupedRoute.map((group) => {
                    const isHovered = hoveredGroupKey === group.key;
                    const hasMulti = group.edgeIds.length > 1;
                    return (
                      <div
                        key={group.key}
                        onMouseEnter={() => setHoveredGroupKey(group.key)}
                        onMouseLeave={() => setHoveredGroupKey(null)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                          isHovered ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: getDifficultyColor(group.difficulty) }}
                        />
                        <span className="text-xs text-slate-900 truncate flex-1">
                          {group.name}
                          {hasMulti && (
                            <span className="ml-1.5 text-[10px] text-slate-400 font-medium tabular-nums">
                              {Math.round(group.totalLength)}m
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium uppercase">{group.highway}</span>
                        <span
                          className="text-xs font-bold tabular-nums"
                          style={{ color: getDifficultyColor(group.difficulty) }}
                        >
                          {group.difficulty.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!routeResult && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <div className="bg-primary/10 rounded-2xl w-14 h-14 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-primary">route</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[220px]">
                {state ? '경로를 불러오는 중입니다...' : '출발지와 도착지를 입력하고\n"경로 탐색" 버튼을 눌러주세요'}
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Legend */}
          <div className="pt-5 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.18em] uppercase mb-3">난이도 범례</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs text-green-800 font-semibold">쉬움</span>
                <span className="text-[10px] text-green-600 ml-auto tabular-nums">~ 30.7</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs text-amber-800 font-semibold">보통</span>
                <span className="text-[10px] text-amber-600 ml-auto tabular-nums">30.7 ~ 41.5</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                <span className="text-xs text-red-800 font-semibold">어려움</span>
                <span className="text-[10px] text-red-600 ml-auto tabular-nums">41.5 ~</span>
              </div>
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
            const isHovered = hoveredEdgeIds.has(segment.edgeId);
            return (
              <Polyline
                key={segment.edgeId}
                positions={coords}
                pathOptions={{
                  color: getDifficultyColor(segment.difficulty),
                  weight: isHovered ? 12 : 7,
                  opacity: isHovered ? 1 : 0.9,
                  className: isHovered ? 'route-edge-highlighted' : undefined,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Public Sans, system-ui, sans-serif', minWidth: 180 }}>
                    <strong style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
                      {segment.name ?? '이름 없음'}
                    </strong>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                      <div>도로 유형: {segment.highway}</div>
                      <div>난이도: <strong style={{ color: getDifficultyColor(segment.difficulty) }}>{segment.difficulty.toFixed(1)}점</strong></div>
                      <div>거리: {Math.round(segment.lengthM)}m</div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}

          {startCoord && (
            <Marker position={startCoord} icon={START_ICON}>
              <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent className="route-marker-label route-marker-start">
                출발지
              </Tooltip>
              <Popup>{state?.startLocation ?? '출발지'}</Popup>
            </Marker>
          )}
          {endCoord && (
            <Marker position={endCoord} icon={END_ICON}>
              <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent className="route-marker-label route-marker-end">
                목적지
              </Tooltip>
              <Popup>{state?.endLocation ?? '목적지'}</Popup>
            </Marker>
          )}

          {allCoordinates.length > 0 && <FitBounds coordinates={allCoordinates} />}
          <ZoomControls />
        </MapContainer>
      </main>

      <SegmentDetailPopover segment={popoverData} />
    </div>
  );
};

export default MapPage;
