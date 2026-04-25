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
    navigate('/map', {
      state: { startLocation, endLocation },
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2.5 text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">explore</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 leading-none">SafeDrive</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">강남구 안전 경로</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/survey')}
          className="flex items-center gap-2 h-11 px-5 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">quiz</span>
          <span>숙련도 설문</span>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Hero Image */}
          <div className="relative h-56 w-full bg-gradient-to-br from-primary/15 via-primary/5 to-transparent flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-primary/10">
                <span className="material-symbols-outlined text-5xl text-primary">directions_car</span>
              </div>
              <p className="text-xs text-primary font-semibold tracking-wider uppercase">Safer routes for novice drivers</p>
            </div>
          </div>

          {/* Form */}
          <div className="px-10 pt-10 pb-12 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <h1 className="text-[32px] font-extrabold tracking-tight text-slate-900 leading-tight">경로 검색</h1>
              <p className="text-sm text-slate-500 leading-relaxed">
                출발지와 목적지를 입력하면<br />
                난이도 기반 안전 경로를 추천합니다.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">출발지</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">trip_origin</span>
                  <input
                    type="text"
                    placeholder="출발지를 입력하세요"
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    className="w-full h-13 pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-900">목적지</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">location_on</span>
                  <input
                    type="text"
                    placeholder="목적지를 입력하세요"
                    value={endLocation}
                    onChange={(e) => setEndLocation(e.target.value)}
                    className="w-full h-13 pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-white transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="mt-2 w-full h-13 py-3.5 bg-primary hover:brightness-110 text-white text-[15px] font-bold rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isLoading ? '검색 중...' : '경로 검색'}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="mx-4 text-[11px] text-slate-400 font-semibold uppercase tracking-widest">또는</span>
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
      <section className="max-w-[960px] mx-auto w-full px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-start gap-4 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 rounded-xl p-3">
              <span className="material-symbols-outlined text-[26px] text-primary">bar_chart</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-slate-900">난이도 분석</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                5개 요소(사고율, 도로형태, 규모, 교차로, 교통량)를 종합한 0~100점 시각화
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 rounded-xl p-3">
              <span className="material-symbols-outlined text-[26px] text-primary">shield</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-slate-900">맞춤형 경로</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                설문 기반 취약특성 분석으로 개인 숙련도에 맞는 안전 경로 추천
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-4 p-8 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-primary/10 rounded-xl p-3">
              <span className="material-symbols-outlined text-[26px] text-primary">route</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-bold text-slate-900">실시간 탐색</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                강남구 7,200개 도로 세그먼트 기반 A* 알고리즘 경로 탐색
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center bg-white">
        <p className="text-xs text-slate-400">© 2026 SafeDrive · 인지 중심 운전 경로 추천 서비스</p>
      </footer>
    </div>
  );
};

export default MainPage;
