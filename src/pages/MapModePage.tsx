import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  fetchEdgesByBounds,
  fetchAreaSummary,
  type MapEdge,
  type AreaSummary,
  type Bounds,
} from '../services/mapMode';
import AreaSummaryPanel from '../components/AreaSummaryPanel';

const GANGNAM_CENTER: [number, number] = [37.5050, 127.0500];
const DEFAULT_ZOOM = 14;
const MIN_ZOOM_FOR_EDGES = 14;
const FETCH_DEBOUNCE_MS = 400;
// bounds를 이 단위로 반올림해서 캐시 키 생성 (약 500m)
const BOUNDS_ROUND = 0.005;
// 모든 Polyline이 공유할 단일 canvas renderer (SVG보다 훨씬 가벼움)
const CANVAS_RENDERER = L.canvas({ padding: 0.5 });

const getDifficultyColor = (difficulty: number): string => {
  if (difficulty <= 30.7) return '#22c55e';
  if (difficulty <= 41.5) return '#f59e0b';
  return '#ef4444';
};

const parseCoordinates = (json: string): [number, number][] => {
  try {
    const coords: number[][] = JSON.parse(json);
    return coords.map((c) => [c[1], c[0]] as [number, number]);
  } catch {
    return [];
  }
};

// ── 화면 영역에 따라 엣지 fetch ──────────────────────────
interface EdgesLoaderProps {
  onEdgesLoaded: (edges: MapEdge[]) => void;
  onZoomTooLow: (tooLow: boolean) => void;
}
const EdgesLoader = ({ onEdgesLoaded, onZoomTooLow }: EdgesLoaderProps) => {
  const map = useMap();
  const cacheRef = useRef<Map<string, MapEdge[]>>(new Map());
  const fetchTokenRef = useRef(0);
  const debounceRef = useRef<number | null>(null);

  const roundDown = (v: number) => Math.floor(v / BOUNDS_ROUND) * BOUNDS_ROUND;
  const roundUp = (v: number) => Math.ceil(v / BOUNDS_ROUND) * BOUNDS_ROUND;

  const reload = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      const zoom = map.getZoom();
      if (zoom < MIN_ZOOM_FOR_EDGES) {
        onZoomTooLow(true);
        onEdgesLoaded([]);
        return;
      }
      onZoomTooLow(false);

      // 화면 bounds를 BOUNDS_ROUND 단위로 확장해 캐시 hit율 향상
      const b = map.getBounds();
      const bounds: Bounds = {
        minLat: roundDown(b.getSouth()),
        maxLat: roundUp(b.getNorth()),
        minLon: roundDown(b.getWest()),
        maxLon: roundUp(b.getEast()),
      };
      // zoom을 캐시 키에 포함 → 줌별 highway 필터링 결과를 별도 캐시
      const cacheKey = `${zoom}|${bounds.minLat}|${bounds.maxLat}|${bounds.minLon}|${bounds.maxLon}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        onEdgesLoaded(cached);
        return;
      }

      const token = ++fetchTokenRef.current;
      try {
        const data = await fetchEdgesByBounds(bounds, zoom);
        if (token !== fetchTokenRef.current) return;
        cacheRef.current.set(cacheKey, data);
        onEdgesLoaded(data);
      } catch {
        // 무시
      }
    }, FETCH_DEBOUNCE_MS);
  }, [map, onEdgesLoaded, onZoomTooLow]);

  useMapEvents({ moveend: reload, zoomend: reload });

  useEffect(() => {
    reload();
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

// ── 폴리라인 렌더링 (좌표 파싱 메모이제이션) ──────────
interface RenderEdgesProps {
  edges: MapEdge[];
}
const RenderEdges = ({ edges }: RenderEdgesProps) => {
  // edges 배열 reference가 같으면 재계산 안 함
  const parsedEdges = useMemo(() => {
    return edges
      .map((e) => ({
        edgeId: e.edgeId,
        color: getDifficultyColor(e.difficulty),
        coords: parseCoordinates(e.coordinatesJson),
      }))
      .filter((e) => e.coords.length >= 2);
  }, [edges]);

  return (
    <>
      {parsedEdges.map((e) => (
        <Polyline
          key={e.edgeId}
          positions={e.coords}
          pathOptions={{
            color: e.color,
            weight: 2.5,
            opacity: 0.7,
            renderer: CANVAS_RENDERER,
          }}
          interactive={false}
        />
      ))}
    </>
  );
};

// ── 영역 드래그 핸들러 ──────────────────────────────────
interface DragSelectorProps {
  enabled: boolean;
  onSelected: (bounds: Bounds) => void;
  onPreview: (latLngBounds: L.LatLngBounds | null) => void;
}
const DragSelector = ({ enabled, onSelected, onPreview }: DragSelectorProps) => {
  const map = useMap();
  const startRef = useRef<L.LatLng | null>(null);

  useEffect(() => {
    if (!enabled) {
      map.dragging.enable();
      return;
    }
    map.dragging.disable();
    map.getContainer().style.cursor = 'crosshair';

    const onDown = (e: L.LeafletMouseEvent) => {
      startRef.current = e.latlng;
    };
    const onMove = (e: L.LeafletMouseEvent) => {
      if (!startRef.current) return;
      onPreview(L.latLngBounds(startRef.current, e.latlng));
    };
    const onUp = (e: L.LeafletMouseEvent) => {
      if (!startRef.current) return;
      const b = L.latLngBounds(startRef.current, e.latlng);
      startRef.current = null;
      onPreview(null);
      // 너무 작은 영역은 무시
      const sizeMeters = b.getSouthWest().distanceTo(b.getNorthEast());
      if (sizeMeters < 50) return;
      onSelected({
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLon: b.getWest(),
        maxLon: b.getEast(),
      });
    };

    map.on('mousedown', onDown);
    map.on('mousemove', onMove);
    map.on('mouseup', onUp);

    return () => {
      map.off('mousedown', onDown);
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      map.dragging.enable();
      map.getContainer().style.cursor = '';
    };
  }, [enabled, map, onPreview, onSelected]);

  return null;
};

// ── 줌 컨트롤 ──────────────────────────────────────────
const ZoomControls = () => {
  const map = useMap();
  return (
    <div className="absolute bottom-8 right-8 z-[1000] flex flex-col gap-3">
      <div className="flex flex-col bg-white/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-slate-200">
        <button
          onClick={() => map.zoomIn()}
          className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 border-b border-slate-200 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
        <button
          onClick={() => map.zoomOut()}
          className="w-11 h-11 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
      </div>
      <button
        onClick={() => map.setView(GANGNAM_CENTER, DEFAULT_ZOOM)}
        className="w-11 h-11 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-xl shadow-lg text-primary border border-slate-200 hover:bg-slate-50 transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">my_location</span>
      </button>
    </div>
  );
};

// ── 메인 페이지 ────────────────────────────────────────
const MapModePage = () => {
  const navigate = useNavigate();
  const [edges, setEdges] = useState<MapEdge[]>([]);
  const [zoomTooLow, setZoomTooLow] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [previewBounds, setPreviewBounds] = useState<L.LatLngBounds | null>(null);
  const [selectedBounds, setSelectedBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [summary, setSummary] = useState<AreaSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handleSelected = useCallback(async (b: Bounds) => {
    setSelectMode(false);
    setSelectedBounds([
      [b.minLat, b.minLon],
      [b.maxLat, b.maxLon],
    ]);
    setSummaryLoading(true);
    try {
      const s = await fetchAreaSummary(b);
      setSummary(s);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setSummary(null);
    setSummaryLoading(false);
    setSelectedBounds(null);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f6f8]">
      {/* Sidebar */}
      <aside className="flex w-[300px] flex-col border-r border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200">
          <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[22px]">layers</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">지도 모드</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-1">강남구 전체 도로 분석</p>
          </div>
        </div>

        <div className="flex flex-col p-6 gap-5 flex-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-2 -mx-3 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-sm font-medium self-start"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>메인으로</span>
          </button>

          <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
            <p className="text-[10px] text-primary font-bold tracking-[0.18em] uppercase mb-1.5">사용 방법</p>
            <ol className="text-xs text-slate-600 leading-relaxed list-decimal pl-4 space-y-1">
              <li>지도를 줌인하면 도로가 색상으로 표시됨</li>
              <li><strong>"영역 선택"</strong> 클릭 후 지도에서 사각형을 드래그</li>
              <li>해당 영역의 도로 분석이 우측에 표시됨</li>
            </ol>
          </div>

          <button
            onClick={() => setSelectMode((v) => !v)}
            className={`flex items-center justify-center gap-2 h-12 rounded-xl font-bold text-sm transition-all ${
              selectMode
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:brightness-110'
                : 'bg-primary text-white shadow-lg shadow-primary/25 hover:brightness-110'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {selectMode ? 'close' : 'crop_square'}
            </span>
            <span>{selectMode ? '선택 취소' : '영역 선택'}</span>
          </button>

          {/* Legend */}
          <div className="pt-2">
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.18em] uppercase mb-3">난이도 색상</p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-green-50 border border-green-100">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-xs text-green-800 font-semibold">쉬움</span>
                <span className="ml-auto text-[10px] text-green-600 tabular-nums">~ 30.7</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs text-amber-800 font-semibold">보통</span>
                <span className="ml-auto text-[10px] text-amber-600 tabular-nums">30.7 ~ 41.5</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="text-xs text-red-800 font-semibold">어려움</span>
                <span className="ml-auto text-[10px] text-red-600 tabular-nums">41.5 ~</span>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>화면 표시 도로</span>
              <span className="tabular-nums font-bold text-slate-700">{edges.length}개</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Map */}
      <main className="flex-1 relative">
        {zoomTooLow && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg shadow-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600">zoom_in</span>
            <span className="text-xs font-semibold text-amber-800">
              도로 표시를 위해 더 확대해주세요
            </span>
          </div>
        )}

        {selectMode && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2.5 bg-primary text-white rounded-lg shadow-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">crop_free</span>
            <span className="text-xs font-semibold">
              지도에서 분석할 영역을 드래그하세요
            </span>
          </div>
        )}

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

          <EdgesLoader onEdgesLoaded={setEdges} onZoomTooLow={setZoomTooLow} />

          {/* 폴리라인 */}
          <RenderEdges edges={edges} />

          {/* 드래그 미리보기 */}
          {previewBounds && (
            <Rectangle
              bounds={previewBounds}
              pathOptions={{ color: '#195de6', weight: 2, fillOpacity: 0.1, dashArray: '6 4' }}
            />
          )}

          {/* 선택 영역 표시 */}
          {selectedBounds && !previewBounds && (
            <Rectangle
              bounds={selectedBounds}
              pathOptions={{ color: '#195de6', weight: 2, fillOpacity: 0.08 }}
            />
          )}

          <DragSelector
            enabled={selectMode}
            onSelected={handleSelected}
            onPreview={setPreviewBounds}
          />

          <ZoomControls />
        </MapContainer>

        {(summary !== null || summaryLoading) && (
          <AreaSummaryPanel
            summary={summary}
            isLoading={summaryLoading}
            onClose={handleClosePanel}
          />
        )}
      </main>
    </div>
  );
};

export default MapModePage;
