import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../services/auth';
import { fetchSurveyQuestions, submitSurvey, type SurveyQuestion } from '../services/survey';

const SurveyPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchSurveyQuestions();
        if (cancelled) return;
        setQuestions(data.questions);
      } catch {
        if (cancelled) return;
        setLoadError('설문 문항을 불러오지 못했습니다. 백엔드 연결을 확인해주세요.');
      } finally {
        if (!cancelled) setIsLoadingQuestions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAnswer = (code: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [code]: value }));
    const idx = questions.findIndex((q) => q.code === code);
    if (idx !== -1 && idx < questions.length - 1 && currentQuestion === idx) {
      setTimeout(() => setCurrentQuestion(idx + 1), 300);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('모든 질문에 답변해주세요.');
      return;
    }

    if (!isLoggedIn()) {
      const goLogin = confirm('설문 결과를 저장하려면 로그인이 필요합니다.\n로그인 페이지로 이동할까요?');
      if (goLogin) {
        navigate('/login', { state: { from: '/survey' } });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSurvey({
        answers,
        client_version: 'v1',
      });
      alert('설문이 완료되었습니다!\n결과가 계정에 저장되었습니다.');
      navigate('/');
    } catch (err) {
      const errAny = err as { response?: { data?: { message?: string } }; message?: string };
      const detail = errAny?.response?.data?.message ?? errAny?.message ?? '알 수 없는 오류';
      alert(`서버 저장 실패: ${detail}\n잠시 후 다시 시도해주세요.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const isComplete = totalQuestions > 0 && answeredCount === totalQuestions;

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">directions_car</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-none">SafeDrive</h2>
              <p className="text-[11px] text-slate-400 font-medium mt-1">숙련도 설문</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Sticky progress bar */}
      <div className="sticky top-[81px] z-40 bg-[#f6f6f8] border-b border-slate-200">
        <div className="max-w-[820px] mx-auto px-6 md:px-10 py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">진행률</span>
            <span className="text-xs font-bold text-primary tabular-nums">
              {answeredCount} / {totalQuestions || '–'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <main className="px-6 md:px-10 py-10">
        <div className="flex flex-col max-w-[820px] mx-auto w-full gap-8">
          {/* Hero */}
          <div className="flex flex-col gap-5 p-8 md:p-10 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-xl w-12 h-12 flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px] text-primary">psychology</span>
              </div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">Driving Profile Survey</span>
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-3xl md:text-[34px] font-extrabold tracking-tight text-slate-900 leading-tight">
                운전 숙련도 설문
              </h1>
              <p className="text-base text-slate-500 leading-relaxed">
                평소 운전 습관과 자신감 수준을 알려주세요. 10개 문항에 답변하시면,
                여러분의 숙련도에 맞는 <strong className="text-primary">맞춤형 안전 경로</strong>를 추천해드립니다.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-slate-600 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-slate-100 text-[11px] font-bold">1</span>
                <span className="text-slate-400 text-xs">매우 아니다</span>
              </div>
              <span className="text-slate-300">—</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-primary text-white text-[11px] font-bold">5</span>
                <span className="text-slate-400 text-xs">매우 그렇다</span>
              </div>
            </div>
          </div>

          {/* Loading / Error / Questions */}
          {isLoadingQuestions && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-slate-400">설문 문항을 불러오는 중...</p>
            </div>
          )}

          {loadError && (
            <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
              <span>{loadError}</span>
            </div>
          )}

          {!isLoadingQuestions && !loadError && (
            <div className="flex flex-col gap-5">
              {questions.map((q, index) => {
                const isAnswered = answers[q.code] !== undefined;
                const isActive = currentQuestion === index;
                return (
                  <div
                    key={q.code}
                    className={`flex flex-col p-7 md:p-8 bg-white rounded-2xl border shadow-sm transition-all ${
                      isActive
                        ? 'border-primary/40 shadow-md ring-2 ring-primary/10'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-7">
                      <span className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 transition-colors ${
                        isAnswered ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        {isAnswered ? (
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="flex flex-col gap-1.5 pt-1">
                        <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-slate-400">
                          {q.category}
                        </span>
                        <h3 className="text-base md:text-[17px] font-bold text-slate-900 leading-snug">
                          {q.prompt}
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3 md:gap-4 px-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <label key={value} className="cursor-pointer flex justify-center">
                          <input
                            type="radio"
                            name={q.code}
                            value={value}
                            checked={answers[q.code] === value}
                            onChange={() => handleAnswer(q.code, value)}
                            className="peer sr-only"
                          />
                          <div className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-slate-200 text-slate-500 font-bold text-base peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-primary/25 hover:border-primary/50 hover:text-primary transition-all">
                            {value}
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="flex justify-between mt-5 px-1 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      <span>매우 아니다</span>
                      <span>매우 그렇다</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pb-12 pt-2">
            <button
              onClick={() => navigate('/')}
              className="flex-1 h-14 rounded-xl border-2 border-slate-200 bg-white text-slate-600 font-semibold hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              돌아가기
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isComplete || isSubmitting}
              className="flex-[2] h-14 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 text-[15px]"
            >
              {isSubmitting ? (
                <span>제출 중...</span>
              ) : isComplete ? (
                <>
                  <span>설문 제출하기</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              ) : (
                <span>{totalQuestions > 0 ? `${totalQuestions - answeredCount}개 문항 남음` : '문항 로딩 중'}</span>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SurveyPage;
