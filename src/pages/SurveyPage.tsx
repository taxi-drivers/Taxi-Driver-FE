import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SurveyQuestion {
  id: number;
  question: string;
}

const surveyQuestions: SurveyQuestion[] = [
  { id: 1, question: '좁은 골목길 운전에 대한 자신감이 있나요?' },
  { id: 2, question: '교차로에서 좌회전할 때 불안감을 느끼나요?' },
  { id: 3, question: '고속도로 합류 시 어려움을 느끼나요?' },
  { id: 4, question: '주차할 때 자신감이 있나요?' },
  { id: 5, question: '야간 운전 시 불편함을 느끼나요?' },
  { id: 6, question: '비 오는 날 운전에 대한 자신감이 있나요?' },
  { id: 7, question: '차선 변경 시 어려움을 느끼나요?' },
  { id: 8, question: '경사로 출발에 대한 자신감이 있나요?' },
  { id: 9, question: '복잡한 교차로에서 혼란을 느끼나요?' },
  { id: 10, question: '전체적인 운전 실력에 대한 자신감이 있나요?' },
];

const SurveyPage = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (currentQuestion < surveyQuestions.length - 1) {
      setTimeout(() => setCurrentQuestion((prev) => prev + 1), 300);
    }
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < surveyQuestions.length) {
      alert('모든 질문에 답변해주세요.');
      return;
    }

    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const avgScore = totalScore / surveyQuestions.length;

    let skillLevel: string;
    if (avgScore <= 2) {
      skillLevel = 'BEGINNER';
    } else if (avgScore <= 3.5) {
      skillLevel = 'INTERMEDIATE';
    } else {
      skillLevel = 'ADVANCED';
    }

    localStorage.setItem('skillLevel', skillLevel);
    localStorage.setItem('surveyScore', avgScore.toFixed(2));

    alert(`설문이 완료되었습니다!\n숙련도: ${
      skillLevel === 'BEGINNER' ? '초보' :
      skillLevel === 'INTERMEDIATE' ? '중급' : '숙련'
    }`);
    navigate('/');
  };

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / surveyQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5 md:px-12">
        <div className="flex items-center gap-3">
          <div className="bg-primary rounded-lg p-2.5 text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">directions_car</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-slate-900 leading-none">SafeDrive</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">숙련도 설문</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center rounded-lg h-11 w-11 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          aria-label="닫기"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </header>

      {/* Sticky progress bar */}
      <div className="sticky top-[77px] z-40 bg-[#f6f6f8] border-b border-slate-200">
        <div className="max-w-[820px] mx-auto px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">진행률</span>
            <span className="text-xs font-bold text-primary">
              {answeredCount} / {surveyQuestions.length}
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

      <main className="flex justify-center px-4 py-10">
        <div className="flex flex-col max-w-[820px] w-full gap-8">
          {/* Hero */}
          <div className="flex flex-col gap-4 p-10 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-xl p-3">
                <span className="material-symbols-outlined text-[26px] text-primary">psychology</span>
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Driving Profile Survey</span>
            </div>
            <h1 className="text-[34px] font-extrabold tracking-tight text-slate-900 leading-tight">운전 숙련도 설문</h1>
            <p className="text-base text-slate-500 leading-relaxed">
              평소 운전 습관과 자신감 수준을 알려주세요. 10개 문항에 답변하시면,
              <br className="hidden md:block" />
              여러분의 숙련도에 맞는 <strong className="text-primary">맞춤형 안전 경로</strong>를 추천해드립니다.
            </p>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
              <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-slate-100 text-[11px] font-bold">1</span>
              <span className="text-slate-400 text-xs">매우 아니다</span>
              <span className="mx-2 text-slate-300">—</span>
              <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-primary text-white text-[11px] font-bold">5</span>
              <span className="text-slate-400 text-xs">매우 그렇다</span>
            </div>
          </div>

          {/* Questions */}
          <div className="flex flex-col gap-5">
            {surveyQuestions.map((q, index) => {
              const isAnswered = answers[q.id] !== undefined;
              const isActive = currentQuestion === index;
              return (
                <div
                  key={q.id}
                  className={`flex flex-col p-8 bg-white rounded-2xl border shadow-sm transition-all ${
                    isActive
                      ? 'border-primary/40 shadow-md ring-2 ring-primary/10'
                      : isAnswered
                      ? 'border-slate-200'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <span className={`flex items-center justify-center size-9 rounded-full text-sm font-bold shrink-0 transition-colors ${
                      isAnswered
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {isAnswered ? (
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      ) : (
                        q.id
                      )}
                    </span>
                    <h3 className="text-[17px] font-bold text-slate-900 leading-snug pt-1">
                      {q.question}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between gap-4 px-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} className="flex-1 cursor-pointer">
                        <input
                          type="radio"
                          name={`q${q.id}`}
                          value={value}
                          checked={answers[q.id] === value}
                          onChange={() => handleAnswer(q.id, value)}
                          className="peer sr-only"
                        />
                        <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full border-2 border-slate-200 text-slate-500 font-bold text-base peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white peer-checked:shadow-lg peer-checked:shadow-primary/25 hover:border-primary/50 hover:text-primary transition-all">
                          {value}
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-between mt-5 px-2 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <span>매우 아니다</span>
                    <span>매우 그렇다</span>
                  </div>
                </div>
              );
            })}
          </div>

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
              disabled={answeredCount < surveyQuestions.length}
              className="flex-[2] h-14 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/25 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 text-[15px]"
            >
              <span>설문 제출하기</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SurveyPage;
