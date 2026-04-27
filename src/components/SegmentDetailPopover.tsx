export interface SegmentDetailData {
  edgeId: string;
  name: string | null;
  highway: string;
  lengthM: number;
  difficulty: number;
  accidentRateScore?: number | null;
  roadShapeScore?: number | null;
  roadScaleScore?: number | null;
  intersectionScore?: number | null;
  trafficVolumeScore?: number | null;
  slope?: number | null;
}

interface Props {
  segment: SegmentDetailData | null;
}

const HIGHWAY_NAMES: Record<string, string> = {
  primary: '주간선도로',
  primary_link: '간선도로 연결로',
  secondary: '보조간선도로',
  secondary_link: '보조간선 연결로',
  tertiary: '집산도로',
  tertiary_link: '집산도로 연결로',
  trunk: '도시고속도로',
  trunk_link: '고속도로 연결로',
  residential: '주거지역 도로',
  service: '서비스 도로',
  unclassified: '미분류 도로',
};

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

interface ScoreRowProps {
  label: string;
  value: number | null | undefined;
  description?: string;
}

const ScoreRow = ({ label, value, description }: ScoreRowProps) => {
  const v = value ?? 0;
  const isNull = value === null || value === undefined;
  const barColor =
    v >= 70 ? '#ef4444' : v >= 50 ? '#f59e0b' : v >= 30 ? '#facc15' : '#22c55e';
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold tabular-nums" style={{ color: isNull ? '#94a3b8' : '#0f172a' }}>
          {isNull ? '—' : `${v.toFixed(0)}점`}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${isNull ? 0 : Math.min(v, 100)}%`, backgroundColor: barColor }}
        />
      </div>
      {description && <p className="text-[10px] text-slate-400 leading-snug">{description}</p>}
    </div>
  );
};

const formatSlope = (slope: number | null | undefined): string => {
  if (slope === null || slope === undefined) return '—';
  const pct = slope * 100;
  const sign = pct > 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
};

const slopeRiskLabel = (slope: number | null | undefined): string => {
  if (slope === null || slope === undefined) return '데이터 없음';
  const abs = Math.abs(slope);
  if (abs < 0.03) return '평지';
  if (abs < 0.06) return '약간 경사';
  if (abs < 0.10) return '눈에 띄는 경사';
  return '가파른 경사';
};

const buildRiskTags = (s: SegmentDetailData): string[] => {
  const tags: string[] = [];
  if ((s.accidentRateScore ?? 0) >= 50) tags.push('사고다발구간');
  if ((s.roadScaleScore ?? 0) >= 70) tags.push('좁은 도로');
  if ((s.intersectionScore ?? 0) >= 50) tags.push('복잡한 교차로');
  if ((s.trafficVolumeScore ?? 0) >= 60) tags.push('교통량 많음');
  if (s.slope !== null && s.slope !== undefined && Math.abs(s.slope) >= 0.06) tags.push('경사 있음');
  if (s.highway === 'service') tags.push('주차장/골목');
  if (s.highway === 'trunk' || s.highway === 'trunk_link') tags.push('간선도로');
  return tags;
};

const SegmentDetailPopover = ({ segment }: Props) => {
  if (!segment) return null;

  const color = getDifficultyColor(segment.difficulty);
  const label = getDifficultyLabel(segment.difficulty);
  const highwayKr = HIGHWAY_NAMES[segment.highway] ?? segment.highway;
  const tags = buildRiskTags(segment);

  return (
    <div
      className="fixed z-[1500] left-[348px] top-1/2 -translate-y-1/2 w-[320px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden pointer-events-none animate-[fadeIn_0.15s_ease-out]"
      style={{ boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.04)' }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">
          {highwayKr}
        </span>
        <h3 className="text-base font-bold text-slate-900 leading-tight mt-1 truncate">
          {segment.name ?? '이름 없는 도로'}
        </h3>
        <div
          className="mt-3 flex items-center gap-2.5 px-3 py-2 rounded-lg border-l-4"
          style={{ borderLeftColor: color, backgroundColor: `${color}10` }}
        >
          <span
            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </span>
          <span className="text-xs text-slate-700">
            <strong className="tabular-nums">{segment.difficulty.toFixed(1)}점</strong>
          </span>
          <span className="ml-auto text-[10px] text-slate-400 tabular-nums">
            {Math.round(segment.lengthM)}m
          </span>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="px-5 py-4">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-3">
          점수 구성요소
        </p>
        <div className="flex flex-col gap-2.5">
          <ScoreRow label="사고율" value={segment.accidentRateScore} />
          <ScoreRow label="도로 형태" value={segment.roadShapeScore} />
          <ScoreRow label="도로 규모" value={segment.roadScaleScore} />
          <ScoreRow label="교차로" value={segment.intersectionScore} />
          <ScoreRow label="교통량" value={segment.trafficVolumeScore} />
        </div>

        {/* Slope */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-700">경사도</span>
            <span className="text-[10px] text-slate-400">{slopeRiskLabel(segment.slope)}</span>
          </div>
          <span
            className="text-sm font-bold tabular-nums"
            style={{
              color:
                segment.slope == null
                  ? '#94a3b8'
                  : Math.abs(segment.slope) >= 0.06
                  ? '#ef4444'
                  : Math.abs(segment.slope) >= 0.03
                  ? '#f59e0b'
                  : '#22c55e',
            }}
          >
            {formatSlope(segment.slope)}
          </span>
        </div>
      </div>

      {/* Risk tags */}
      {tags.length > 0 && (
        <div className="px-5 pb-5 -mt-1">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-2">
            주요 위험 요소
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 border border-red-100 text-[10px] font-semibold text-red-700"
              >
                <span className="material-symbols-outlined text-[11px]">warning</span>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SegmentDetailPopover;
