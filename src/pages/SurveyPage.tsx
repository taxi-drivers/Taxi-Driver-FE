import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SurveyPage.css';

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
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // 다음 질문으로 자동 이동
    if (currentQuestion < surveyQuestions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
      }, 300);
    }
  };

  const handleSubmit = () => {
    // 모든 질문에 답변했는지 확인
    if (Object.keys(answers).length < surveyQuestions.length) {
      alert('모든 질문에 답변해주세요.');
      return;
    }

    // 점수 계산 (높을수록 숙련)
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

    // 결과 저장 및 메인 페이지로 이동
    localStorage.setItem('skillLevel', skillLevel);
    localStorage.setItem('surveyScore', avgScore.toFixed(2));

    alert(`설문이 완료되었습니다!\n숙련도: ${
      skillLevel === 'BEGINNER' ? '초보' : 
      skillLevel === 'INTERMEDIATE' ? '중급' : '숙련'
    }`);
    navigate('/');
  };

  const progress = (Object.keys(answers).length / surveyQuestions.length) * 100;

  return (
    <div className="survey-page">
      <div className="survey-container">
        <header className="survey-header">
          <h1>운전 숙련도 설문</h1>
          <p>10개의 질문에 답변해주세요 (1: 매우 아니다 ~ 5: 매우 그렇다)</p>
        </header>

        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="progress-text">
          {Object.keys(answers).length} / {surveyQuestions.length} 완료
        </p>

        <div className="questions-container">
          {surveyQuestions.map((q, index) => (
            <div
              key={q.id}
              className={`question-card ${
                currentQuestion === index ? 'active' : ''
              } ${answers[q.id] ? 'answered' : ''}`}
            >
              <div className="question-number">Q{q.id}</div>
              <p className="question-text">{q.question}</p>
              <div className="answer-options">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    className={`answer-btn ${
                      answers[q.id] === value ? 'selected' : ''
                    }`}
                    onClick={() => handleAnswer(q.id, value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="answer-labels">
                <span>매우 아니다</span>
                <span>매우 그렇다</span>
              </div>
            </div>
          ))}
        </div>

        <div className="survey-actions">
          <button className="back-btn" onClick={() => navigate('/')}>
            돌아가기
          </button>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < surveyQuestions.length}
          >
            제출하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurveyPage;
