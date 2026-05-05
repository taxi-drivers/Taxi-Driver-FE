import type { AreaSummary } from '../services/mapMode';

interface Props {
  summary: AreaSummary | null;
  isLoading: boolean;
  onClose: () => void;
}

const safetyLabel = (score: number): string => {
  if (score >= 7) return 'GOOD';
  if (score >= 5) return 'FAIR';
  if (score >= 3) return 'CAUTION';
  return 'HIGH RISK';
};

const safetyColor = (score: number): string => {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#84cc16';
  if (score >= 3) return '#f59e0b';
  return '#ef4444';
};

const AreaSummaryPanel = ({ summary, isLoading, onClose }: Props) => {
  return (
    <div className="absolute top-6 right-6 z-[1000] w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
            Selected Area Analysis
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <h3 className="text-base font-bold text-slate-900">Area Summary</h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
          <p className="text-xs text-slate-400">영역 분석 중...</p>
        </div>
      ) : summary === null ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          지도에서 사각형을 그려<br />영역을 선택해주세요
        </div>
      ) : summary.edgeCount === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-slate-400">
          선택한 영역에 도로 데이터가 없습니다
        </div>
      ) : (
        <>
          {/* Difficulty Overview */}
          <div className="px-5 pt-4 pb-3 border-b border-slate-100">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-2">
              Road Difficulty Overview
            </p>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100">
              <div
                style={{ width: `${summary.difficultyDistribution.lowPct}%`, backgroundColor: '#22c55e' }}
              />
              <div
                style={{ width: `${summary.difficultyDistribution.midPct}%`, backgroundColor: '#f59e0b' }}
              />
              <div
                style={{ width: `${summary.difficultyDistribution.highPct}%`, backgroundColor: '#ef4444' }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-slate-500 tabular-nums">
              <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />Low {summary.difficultyDistribution.lowPct}%</span>
              <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1" />Mid {summary.difficultyDistribution.midPct}%</span>
              <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1" />High {summary.difficultyDistribution.highPct}%</span>
            </div>
          </div>

          {/* Safety Score */}
          <div className="px-5 py-5 border-b border-slate-100 flex items-center gap-5">
            <div
              className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-[6px]"
              style={{ borderColor: safetyColor(summary.safetyScore) }}
            >
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: safetyColor(summary.safetyScore) }}>
                {summary.safetyScore.toFixed(1)}
              </span>
              <span className="text-[9px] font-bold text-slate-400 mt-0.5">/ 10</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">Safety Score</span>
              <span className="text-base font-bold" style={{ color: safetyColor(summary.safetyScore) }}>
                {safetyLabel(summary.safetyScore)}
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                평균 난이도 {summary.avgDifficulty.toFixed(1)}점
              </span>
              <span className="text-[11px] text-slate-500 tabular-nums">
                도로 {summary.edgeCount}개
              </span>
            </div>
          </div>

          {/* Warning Indicators */}
          {summary.warningIndicators.length > 0 && (
            <div className="px-5 pt-4 pb-3 border-b border-slate-100">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-2.5">
                Warning Indicators
              </p>
              <div className="flex flex-col gap-2">
                {summary.warningIndicators.map((w) => (
                  <div key={w.type} className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                    <span className="material-symbols-outlined text-[16px] text-red-600 shrink-0 mt-0.5">warning</span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-red-800">{w.label}</span>
                        <span className="text-xs font-bold text-red-700 tabular-nums">{w.count}</span>
                      </div>
                      <span className="text-[11px] text-red-700/70 leading-snug">{w.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Summary */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400 mb-2">
              Analysis Summary
            </p>
            <p className="text-xs text-slate-700 leading-relaxed">
              {summary.summary}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default AreaSummaryPanel;
