import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    navigate('/map', { state: { startLocation, endLocation } });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">explore</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">SafeDrive</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">강남구 안전 경로</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/survey')}
            className="flex items-center gap-2 h-11 px-5 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">quiz</span>
            <span className="hidden sm:inline">숙련도 설문</span>
          </button>
        </div>
      </header>

      {/* Main Content - centered container */}
      <div className="flex-1 max-w-[1200px] w-full mx-auto px-6 md:px-10 py-12 md:py-16 flex flex-col gap-12 md:gap-16">
        {/* Search card */}
        <main className="flex justify-center">
          <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Hero */}
            <div className="relative h-52 w-full bg-gradient-to-br from-primary/20 via-primary/8 to-transparent flex items-center justify-center border-b border-slate-100">
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200">
                  <span className="material-symbols-outlined text-5xl text-primary">directions_car</span>
                </div>
                <p className="text-[11px] text-primary font-bold tracking-[0.18em] uppercase">
                  Safer Routes for Novice Drivers
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="px-8 md:px-10 pt-10 pb-10 flex flex-col gap-7">
              <div className="flex flex-col gap-3">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  경로 검색
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  출발지와 목적지를 입력하면 난이도 기반 안전 경로를 추천합니다.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label htmlFor="start" className="text-sm font-semibold text-slate-900">출발지</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                      trip_origin
                    </span>
                    <input
                      id="start"
                      type="text"
                      placeholder="출발지를 입력하세요"
                      value={startLocation}
                      onChange={(e) => setStartLocation(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="end" className="text-sm font-semibold text-slate-900">목적지</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                      location_on
                    </span>
                    <input
                      id="end"
                      type="text"
                      placeholder="목적지를 입력하세요"
                      value={endLocation}
                      onChange={(e) => setEndLocation(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="mt-2 w-full h-12 bg-primary hover:brightness-110 text-white text-[15px] font-bold rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isLoading ? '검색 중...' : '경로 검색'}</span>
                  {!isLoading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                </button>
              </div>

              <div className="relative flex items-center">
                <div className="flex-grow border-t border-slate-200" />
                <span className="mx-4 text-[11px] text-slate-400 font-bold uppercase tracking-[0.18em]">또는</span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <button
                onClick={() => navigate('/map')}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 rounded-xl h-12 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px] text-primary">map</span>
                <span>좌표로 직접 탐색하기</span>
              </button>
            </div>
          </div>
        </main>

        {/* Feature cards */}
        <section className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
            {[
              { icon: 'bar_chart', title: '난이도 분석', desc: '5개 요소(사고율/도로형태/규모/교차로/교통량)를 종합한 0~100점 시각화' },
              { icon: 'shield', title: '맞춤형 경로', desc: '설문 기반 취약특성 분석으로 개인 숙련도에 맞는 안전 경로 추천' },
              { icon: 'route', title: '실시간 탐색', desc: '강남구 23,471개 도로 엣지 기반 A* 알고리즘 경로 탐색' },
            ].map((f) => (
              <div
                key={f.title}
                className="flex flex-col items-start gap-4 p-7 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
              >
                <div className="bg-primary/10 rounded-xl w-12 h-12 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] text-primary">{f.icon}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 bg-white">
        <p className="text-xs text-slate-400 text-center">
          © 2026 SafeDrive · 인지 중심 운전 경로 추천 서비스
        </p>
      </footer>
    </div>
  );
};

export default MainPage;
