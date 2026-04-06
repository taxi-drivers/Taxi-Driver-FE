import { useEffect, useMemo, useState } from 'react';
import {
  FiAlertTriangle,
  FiCompass,
  FiEdit3,
  FiLayers,
  FiLogOut,
  FiMap,
  FiNavigation,
  FiRefreshCcw,
  FiSearch,
  FiSettings,
  FiShield,
  FiTarget,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useLocation, useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './MapPage.css';

type LocationState = {
  startLocation?: string;
  endLocation?: string;
};

type VulnerabilityType = {
  vulnerability_type_id: number;
  code: string;
  name: string;
  description: string;
  icon_key: string;
};

type UserProfile = {
  user_id: number;
  email: string;
  nickname: string;
  skill_level: number;
  primary_vulnerability_type_id: number | null;
  vulnerability_type_ids: number[];
  vulnerability_types: VulnerabilityType[];
  created_at: string;
  updated_at: string;
};

type SegmentItem = {
  id: string;
  name: string;
  score: number;
  level: '쉬움' | '보통' | '어려움';
  explanation: string;
  tags: string[];
  color: string;
  coordinates: [number, number][];
};

type RouteMode = 'safe' | 'fast';
type DifficultyFilter = 'all' | 'easy' | 'moderate' | 'high';
type MockRouteResult = {
  totalDistanceKm: number;
  estimatedMinutes: number;
  avgDifficulty: number;
  segments: SegmentItem[];
};

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const fallbackVulnerabilityTypes: VulnerabilityType[] = [
  {
    vulnerability_type_id: 1,
    code: 'AVOID_NARROW_ROAD',
    name: '좁은 도로 회피',
    description: '차폭이 좁거나 회전 반경이 작은 도로에서 부담을 느끼는 유형',
    icon_key: 'road_narrow',
  },
  {
    vulnerability_type_id: 2,
    code: 'AVOID_BAD_WEATHER',
    name: '악천후 취약',
    description: '야간, 비, 눈 같은 저시야 환경에 민감한 유형',
    icon_key: 'weather_alert',
  },
  {
    vulnerability_type_id: 3,
    code: 'AVOID_HIGHWAY',
    name: '고속도로 회피',
    description: '고속 주행과 합류 구간이 부담스러운 유형',
    icon_key: 'highway_off',
  },
  {
    vulnerability_type_id: 4,
    code: 'AVOID_COMPLEX_INTERSECTION',
    name: '복합 교차로 취약',
    description: '복잡한 교차로와 차선 변경 상황이 어려운 유형',
    icon_key: 'intersection_off',
  },
];

const safeRouteSegments: SegmentItem[] = [
  {
    id: 'SEG_001',
    name: '강남대로 북행',
    score: 32,
    level: '쉬움',
    explanation: '차로 폭이 넓고 도로 선형이 단순해 초심자에게 무난합니다.',
    tags: ['넓은 차로', '단순 직진'],
    color: '#22c55e',
    coordinates: [
      [37.5058, 127.0285],
      [37.5074, 127.0342],
      [37.5091, 127.0405],
    ],
  },
  {
    id: 'SEG_002',
    name: '역삼역 교차로',
    score: 58,
    level: '보통',
    explanation: '신호 대기 차량과 좌회전 진입 차량이 많아 주의가 필요합니다.',
    tags: ['복합 교차로', '차선 변경'],
    color: '#f59e0b',
    coordinates: [
      [37.5008, 127.0368],
      [37.5038, 127.0395],
      [37.5071, 127.0421],
    ],
  },
  {
    id: 'SEG_003',
    name: '테헤란로 혼잡 구간',
    score: 81,
    level: '어려움',
    explanation: '교통량이 많고 버스전용차로 인접 구간이라 긴장도가 높습니다.',
    tags: ['혼잡도 높음', '버스 차로 인접'],
    color: '#ef4444',
    coordinates: [
      [37.4921, 127.0312],
      [37.4924, 127.0408],
      [37.4928, 127.0509],
    ],
  },
];

const fastRouteSegments: SegmentItem[] = [
  {
    id: 'SEG_FAST_001',
    name: '강남대로 직진 구간',
    score: 49,
    level: '보통',
    explanation: '가장 빠른 흐름으로 연결되지만 신호와 합류 교통이 많은 구간입니다.',
    tags: ['직결 경로', '신호 많음'],
    color: '#f59e0b',
    coordinates: [
      [37.4983, 127.0274],
      [37.5019, 127.0348],
      [37.5062, 127.0434],
    ],
  },
  {
    id: 'SEG_FAST_002',
    name: '테헤란로 주행 구간',
    score: 77,
    level: '어려움',
    explanation: '거리상 이득이 있지만 교통량이 많아 평균 난이도가 더 높습니다.',
    tags: ['고속 흐름', '혼잡도 높음'],
    color: '#ef4444',
    coordinates: [
      [37.5062, 127.0434],
      [37.5035, 127.0485],
      [37.5004, 127.0559],
    ],
  },
];

const createMockRouteResult = (mode: RouteMode, coords: { startLat: number; startLon: number; endLat: number; endLon: number }): MockRouteResult => {
  const startPoint: [number, number] = [coords.startLat, coords.startLon];
  const endPoint: [number, number] = [coords.endLat, coords.endLon];

  if (mode === 'safe') {
    return {
      totalDistanceKm: 6.2,
      estimatedMinutes: 21,
      avgDifficulty: 57,
      segments: [
        {
          ...safeRouteSegments[0],
          coordinates: [startPoint, ...safeRouteSegments[0].coordinates.slice(1)],
        },
        safeRouteSegments[1],
        {
          ...safeRouteSegments[2],
          coordinates: [...safeRouteSegments[2].coordinates.slice(0, 2), endPoint],
        },
      ],
    };
  }

  return {
    totalDistanceKm: 4.8,
    estimatedMinutes: 15,
    avgDifficulty: 63,
    segments: [
      {
        ...fastRouteSegments[0],
        coordinates: [startPoint, ...fastRouteSegments[0].coordinates.slice(1)],
      },
      {
        ...fastRouteSegments[1],
        coordinates: [...fastRouteSegments[1].coordinates.slice(0, 2), endPoint],
      },
    ],
  };
};

const iconLabelMap: Record<string, string> = {
  road_narrow: '좁은 도로',
  weather_alert: '악천후',
  highway_off: '고속도로',
  intersection_off: '교차로',
};

const getLevelTone = (score: number) => {
  if (score <= 35) {
    return { label: 'Easy', color: '#22c55e', bg: '#dcfce7' };
  }
  if (score <= 65) {
    return { label: 'Moderate', color: '#f59e0b', bg: '#fef3c7' };
  }
  return { label: 'High', color: '#ef4444', bg: '#fee2e2' };
};

const getStoredProfile = (): UserProfile => {
  const savedUser = JSON.parse(localStorage.getItem('mock_user') ?? '{}');
  const surveyResult = JSON.parse(localStorage.getItem('survey_result') ?? '{}');
  const vulnerabilityIds: number[] = surveyResult.vulnerability_type_ids ?? [];

  const vulnerabilityTypes = fallbackVulnerabilityTypes.filter((item) =>
    vulnerabilityIds.includes(item.vulnerability_type_id),
  );

  return {
    user_id: savedUser.user_id ?? 12,
    email: savedUser.email ?? 'driver@roadsafe.ai',
    nickname: savedUser.nickname ?? 'Alex',
    skill_level: savedUser.skill_level ?? surveyResult.skill_level ?? 73,
    primary_vulnerability_type_id:
      savedUser.vulnerability_type_id ?? surveyResult.primary_vulnerability_type_id ?? null,
    vulnerability_type_ids: vulnerabilityIds,
    vulnerability_types: vulnerabilityTypes,
    created_at: savedUser.created_at ?? new Date().toISOString(),
    updated_at: savedUser.updated_at ?? new Date().toISOString(),
  };
};

const defaultCenter: [number, number] = [37.5019, 127.0382];

const FitToSegments = ({ coordinates }: { coordinates: [number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (coordinates.length === 0) {
      map.setView(defaultCenter, 14);
      return;
    }

    const bounds = L.latLngBounds(coordinates);
    map.fitBounds(bounds, { padding: [48, 48] });
  }, [coordinates, map]);

  return null;
};

const MapPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = (location.state as LocationState) ?? {};
  const [selectedRouteMode, setSelectedRouteMode] = useState<RouteMode>('safe');
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile());
  const [nicknameDraft, setNicknameDraft] = useState(profile.nickname);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [overlayEnabled, setOverlayEnabled] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [coordinateForm, setCoordinateForm] = useState({
    startLat: '37.4979',
    startLon: '127.0276',
    endLat: '37.5312',
    endLon: '127.0418',
  });
  const [routeResult, setRouteResult] = useState<MockRouteResult>(() =>
    createMockRouteResult('safe', {
      startLat: 37.4979,
      startLon: 127.0276,
      endLat: 37.5312,
      endLon: 127.0418,
    }),
  );
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>(safeRouteSegments[1].id);
  const [searchMessage, setSearchMessage] = useState('좌표 기반 mock 경로 검색 결과입니다.');

  const filteredSegments = useMemo(() => {
    return routeResult.segments.filter((segment) => {
      if (difficultyFilter === 'all') {
        return true;
      }
      if (difficultyFilter === 'easy') {
        return segment.score <= 35;
      }
      if (difficultyFilter === 'moderate') {
        return segment.score > 35 && segment.score <= 65;
      }
      return segment.score > 65;
    });
  }, [difficultyFilter, routeResult.segments]);

  const activeSegmentId =
    filteredSegments.find((segment) => segment.id === selectedSegmentId)?.id ?? filteredSegments[0]?.id;

  const selectedSegment = filteredSegments.find((segment) => segment.id === activeSegmentId) ?? filteredSegments[0];

  const routeTitle = {
    start: routeState.startLocation ?? '강남역',
    end: routeState.endLocation ?? '서울숲',
  };

  const topTone = selectedSegment ? getLevelTone(selectedSegment.score) : getLevelTone(50);
  const allCoordinates = filteredSegments.flatMap((segment) => segment.coordinates);
  const routeCoordinates = selectedSegment?.coordinates ?? [];
  const startMarker = routeCoordinates[0] ?? allCoordinates[0] ?? defaultCenter;
  const endMarker = routeCoordinates[routeCoordinates.length - 1] ?? allCoordinates[allCoordinates.length - 1] ?? defaultCenter;

  const handleCoordinateChange = (field: keyof typeof coordinateForm, value: string) => {
    setCoordinateForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRouteSearch = () => {
    const parsed = {
      startLat: Number(coordinateForm.startLat),
      startLon: Number(coordinateForm.startLon),
      endLat: Number(coordinateForm.endLat),
      endLon: Number(coordinateForm.endLon),
    };

    if (Object.values(parsed).some((value) => Number.isNaN(value))) {
      setSearchMessage('유효한 좌표를 입력해주세요. 현재는 mock 경로만 생성합니다.');
      return;
    }

    const nextResult = createMockRouteResult(selectedRouteMode, parsed);
    setRouteResult(nextResult);
    setSelectedSegmentId(nextResult.segments[0]?.id ?? '');
    setSearchMessage(
      selectedRouteMode === 'safe'
        ? '취약 특성을 고려한 안전 경로 mock 결과를 표시 중입니다.'
        : '거리 우선 최단 경로 mock 결과를 표시 중입니다.',
    );
  };

  const handleRouteModeChange = (mode: RouteMode) => {
    setSelectedRouteMode(mode);
    const parsed = {
      startLat: Number(coordinateForm.startLat),
      startLon: Number(coordinateForm.startLon),
      endLat: Number(coordinateForm.endLat),
      endLon: Number(coordinateForm.endLon),
    };

    if (Object.values(parsed).some((value) => Number.isNaN(value))) {
      return;
    }

    const nextResult = createMockRouteResult(mode, parsed);
    setRouteResult(nextResult);
    setSelectedSegmentId(nextResult.segments[0]?.id ?? '');
    setSearchMessage(
      mode === 'safe'
        ? '안전 경로 기준으로 세그먼트 난이도를 재구성했습니다.'
        : '최단 경로 기준으로 더 짧지만 더 어려운 구간을 표시합니다.',
    );
  };

  const handleSaveNickname = () => {
    const trimmed = nicknameDraft.trim();
    if (!trimmed) {
      return;
    }

    const updatedProfile = {
      ...profile,
      nickname: trimmed,
      updated_at: new Date().toISOString(),
    };

    setProfile(updatedProfile);
    setIsEditingNickname(false);
    localStorage.setItem(
      'mock_user',
      JSON.stringify({
        ...JSON.parse(localStorage.getItem('mock_user') ?? '{}'),
        nickname: trimmed,
        updated_at: updatedProfile.updated_at,
      }),
    );
  };

  const handleRetakeSurvey = () => {
    navigate('/survey');
  };

  const handleLogout = () => {
    localStorage.removeItem('mock_access_token');
    localStorage.removeItem('mock_session');
    navigate('/');
  };

  return (
    <div className="map-shell-page">
      <aside className="map-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <FiCompass />
          </div>
          <div>
            <strong>SafeDrive</strong>
            <span>Difficulty Intelligence</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className="nav-item active">
            <FiMap />
            Difficulty Map
          </button>
          <button type="button" className="nav-item">
            <FiNavigation />
            Recent Trips
          </button>
          <button type="button" className="nav-item">
            <FiAlertTriangle />
            Safety Alerts
          </button>
          <button type="button" className="nav-item">
            <FiLayers />
            Route Analytics
          </button>
        </nav>

        <div className="sidebar-preference">
          <span className="sidebar-section-title">Preference</span>
          <button type="button" className="nav-item" onClick={() => setShowProfilePanel(true)}>
            <FiSettings />
            Settings
          </button>
        </div>

        <div className="sidebar-profile-card">
          <div className="avatar-circle">{profile.nickname.slice(0, 1).toUpperCase()}</div>
          <div>
            <strong>{profile.nickname}</strong>
            <p>{profile.email}</p>
          </div>
          <button type="button" className="ghost-icon-button" onClick={() => setShowProfilePanel(true)}>
            <FiUser />
          </button>
        </div>
      </aside>

      <main className="map-stage">
        <div className="map-toolbar">
          <div className="search-box">
            <FiSearch />
            <input defaultValue={`${routeTitle.start} → ${routeTitle.end}`} placeholder="Search destination or road..." />
            <button type="button" className="icon-chip">
              <FiNavigation />
            </button>
          </div>

          <div className="coordinate-card">
            <div className="coordinate-grid">
              <label>
                <span>출발 위도</span>
                <input value={coordinateForm.startLat} onChange={(event) => handleCoordinateChange('startLat', event.target.value)} />
              </label>
              <label>
                <span>출발 경도</span>
                <input value={coordinateForm.startLon} onChange={(event) => handleCoordinateChange('startLon', event.target.value)} />
              </label>
              <label>
                <span>도착 위도</span>
                <input value={coordinateForm.endLat} onChange={(event) => handleCoordinateChange('endLat', event.target.value)} />
              </label>
              <label>
                <span>도착 경도</span>
                <input value={coordinateForm.endLon} onChange={(event) => handleCoordinateChange('endLon', event.target.value)} />
              </label>
            </div>
            <div className="coordinate-actions">
              <div className="route-mode-group">
                <button
                  type="button"
                  className={selectedRouteMode === 'safe' ? 'mode-button active' : 'mode-button'}
                  onClick={() => handleRouteModeChange('safe')}
                >
                  <FiShield />
                  안전 경로
                </button>
                <button
                  type="button"
                  className={selectedRouteMode === 'fast' ? 'mode-button active' : 'mode-button'}
                  onClick={() => handleRouteModeChange('fast')}
                >
                  <FiNavigation />
                  최단 경로
                </button>
              </div>
              <button type="button" className="search-route-button" onClick={handleRouteSearch}>
                좌표로 경로 검색
              </button>
            </div>
            <p className="coordinate-hint">{searchMessage}</p>
          </div>

          <div className="filter-row">
            <div className="pill-control">
              <FiLayers />
              <select
                value={difficultyFilter}
                onChange={(event) => setDifficultyFilter(event.target.value as 'all' | 'easy' | 'moderate' | 'high')}
              >
                <option value="all">Difficulty: All</option>
                <option value="easy">Easy</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>

            <button
              type="button"
              className={overlayEnabled ? 'toggle-chip active' : 'toggle-chip'}
              onClick={() => setOverlayEnabled((prev) => !prev)}
            >
              <FiShield />
              Vulnerability Overlay
            </button>
          </div>
        </div>

        <section className="osm-map-frame">
          <div className="osm-watermark">OSM Preview Shell</div>
          <MapContainer center={defaultCenter} zoom={14} className="leaflet-map" preferCanvas>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {filteredSegments.map((segment) => (
              <Polyline
                key={segment.id}
                positions={segment.coordinates}
                eventHandlers={{
                  click: () => setSelectedSegmentId(segment.id),
                  mouseover: (event) => event.target.setStyle({ weight: 10, opacity: 1 }),
                  mouseout: (event) =>
                    event.target.setStyle({
                      weight: activeSegmentId === segment.id ? 9 : 7,
                      opacity: activeSegmentId === segment.id ? 1 : 0.82,
                    }),
                }}
                pathOptions={{
                  color: segment.color,
                  weight: activeSegmentId === segment.id ? 9 : 7,
                  opacity: activeSegmentId === segment.id ? 1 : 0.82,
                }}
              >
                <Popup>
                  <div className="segment-popup">
                    <strong>{segment.name}</strong>
                    <span>{segment.id}</span>
                    <p>{segment.explanation}</p>
                  </div>
                </Popup>
              </Polyline>
            ))}

            <Marker position={startMarker}>
              <Popup>출발: {routeTitle.start}</Popup>
            </Marker>
            <Marker position={endMarker}>
              <Popup>도착: {routeTitle.end}</Popup>
            </Marker>

            <FitToSegments coordinates={allCoordinates} />
          </MapContainer>

          <div className="map-grid-overlay" />
          <div className="map-city-label">Seoul</div>
          <div className="map-neighborhood">Gangnam District</div>

          <div className="map-legend-card">
            <span className="legend-title">Difficulty Level</span>
            <div className="legend-scale">
              <span><i style={{ background: '#22c55e' }} />Easy</span>
              <span><i style={{ background: '#f59e0b' }} />Moderate</span>
              <span><i style={{ background: '#ef4444' }} />High</span>
            </div>
          </div>

          <div className="map-controls">
            <button type="button">+</button>
            <button type="button">−</button>
            <button type="button">
              <FiTarget />
            </button>
          </div>
        </section>

        <section className="map-floating-footer">
          <div className="summary-strip">
            <div className="summary-chip">
              <span className="summary-chip-label">Route</span>
              <strong>
                {routeTitle.start} → {routeTitle.end}
              </strong>
            </div>
            <div className="summary-chip">
              <span className="summary-chip-label">Mode</span>
              <strong>{selectedRouteMode === 'safe' ? 'Safe Route' : 'Fast Route'}</strong>
            </div>
            <div className="summary-chip">
              <span className="summary-chip-label">Skill Level</span>
              <strong>{profile.skill_level}/100</strong>
            </div>
            <div className="summary-chip">
              <span className="summary-chip-label">ETA</span>
              <strong>{routeResult.estimatedMinutes}분</strong>
            </div>
            <div className="summary-chip">
              <span className="summary-chip-label">Primary Vulnerability</span>
              <strong>
                {profile.vulnerability_types[0]?.name ?? iconLabelMap[fallbackVulnerabilityTypes[0].icon_key]}
              </strong>
            </div>
          </div>

          <div className="floating-actions-card">
            <button type="button" className="outline-cta" onClick={() => setShowPreviewModal(true)}>
              <FiLayers />
              프리뷰 보기
            </button>
            <button type="button" className="outline-cta" onClick={handleRetakeSurvey}>
              <FiRefreshCcw />
              설문 다시하기
            </button>
          </div>
        </section>
      </main>

      {showProfilePanel && (
        <section className="profile-sheet-backdrop" onClick={() => setShowProfilePanel(false)}>
          <div className="profile-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="profile-sheet-header">
              <div>
                <span className="sheet-eyebrow">My Profile</span>
                <h2>{profile.nickname}님의 주행 프로필</h2>
              </div>
              <button type="button" className="ghost-icon-button" onClick={() => setShowProfilePanel(false)}>
                <FiX />
              </button>
            </div>

            <div className="profile-sheet-grid">
              <div className="profile-overview-card">
                <div className="profile-avatar-lg">{profile.nickname.slice(0, 1).toUpperCase()}</div>
                {isEditingNickname ? (
                  <div className="nickname-editor">
                    <input value={nicknameDraft} onChange={(event) => setNicknameDraft(event.target.value)} maxLength={50} />
                    <div className="editor-actions">
                      <button type="button" className="outline-cta compact" onClick={() => setIsEditingNickname(false)}>
                        취소
                      </button>
                      <button type="button" className="primary-cta compact" onClick={handleSaveNickname}>
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-name-row">
                    <div>
                      <strong>{profile.nickname}</strong>
                      <p>{profile.email}</p>
                    </div>
                    <button type="button" className="ghost-icon-button" onClick={() => setIsEditingNickname(true)}>
                      <FiEdit3 />
                    </button>
                  </div>
                )}

                <div className="profile-stats-grid">
                  <div className="mini-stat">
                    <span>skill_level</span>
                    <strong>{profile.skill_level}</strong>
                  </div>
                  <div className="mini-stat">
                    <span>updated_at</span>
                    <strong>{new Date(profile.updated_at).toLocaleDateString('ko-KR')}</strong>
                  </div>
                </div>
              </div>

              <div className="profile-detail-card">
                <div className="section-header compact">
                  <div>
                    <h3>취약 특성 목록</h3>
                    <p>`/users/me/profile` 응답 구조를 기준으로 렌더링한 프론트 목업입니다.</p>
                  </div>
                </div>

                <div className="vulnerability-list">
                  {profile.vulnerability_types.length > 0 ? (
                    profile.vulnerability_types.map((item) => (
                      <article key={item.vulnerability_type_id} className="vulnerability-card">
                        <div className="vulnerability-icon">
                          <FiAlertTriangle />
                        </div>
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.description}</p>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-copy">설문 결과가 없어서 기본 취약 특성이 아직 계산되지 않았습니다.</p>
                  )}
                </div>

                <div className="profile-actions-row">
                  <button type="button" className="outline-cta" onClick={handleRetakeSurvey}>
                    <FiRefreshCcw />
                    설문 다시하기
                  </button>
                  <button type="button" className="outline-cta" onClick={handleLogout}>
                    <FiLogOut />
                    로그아웃
                  </button>
                </div>
              </div>
            </div>

            <div className="profile-context-card">
              <div className="context-copy">
                <span className="sheet-eyebrow">Selected Segment</span>
                <h3>{selectedSegment?.name}</h3>
                <p>{selectedSegment?.explanation}</p>
              </div>
              <div className="context-score">
                <span style={{ color: topTone.color }}>{topTone.label}</span>
                <strong>{selectedSegment?.score}/100</strong>
              </div>
            </div>
          </div>
        </section>
      )}

      {showPreviewModal && (
        <section className="preview-modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="preview-modal-header">
              <div>
                <span className="sheet-eyebrow">Segment Preview</span>
                <h2>도로 세그먼트 프리뷰</h2>
              </div>
              <button type="button" className="ghost-icon-button" onClick={() => setShowPreviewModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="preview-modal-body">
              {filteredSegments.map((segment) => {
                const tone = getLevelTone(segment.score);
                return (
                  <button
                    key={segment.id}
                    type="button"
                    className={activeSegmentId === segment.id ? 'segment-card active' : 'segment-card'}
                    onClick={() => {
                      setSelectedSegmentId(segment.id);
                      setShowPreviewModal(false);
                    }}
                  >
                    <div className="segment-card-main">
                      <div className="segment-card-top">
                        <strong>{segment.name}</strong>
                        <span className="score-badge" style={{ color: tone.color, background: tone.bg }}>
                          {segment.score}점
                        </span>
                      </div>
                      <p>{segment.explanation}</p>
                      <div className="segment-metadata">
                        <span>{selectedRouteMode === 'safe' ? '취약 특성 반영' : '거리 우선'}</span>
                        <span>{segment.coordinates.length - 1}개 링크</span>
                      </div>
                      <div className="tag-row">
                        {segment.tags.map((tag) => (
                          <span key={tag} className="map-tag subtle">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="segment-level-indicator" style={{ background: tone.color }}>
                      {segment.level}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MapPage;
