import { useMemo, useState } from 'react';
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiInfo, FiShield } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './SurveyPage.css';

type Question = {
  id: string;
  number: number;
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  vulnerabilityScores: Record<number, number>;
};

type Vulnerability = {
  id: number;
  code: string;
  name: string;
  description: string;
};

type SurveyResult = {
  user_id: number;
  skill_level: number;
  vulnerability_type_ids: number[];
  primary_vulnerability_type_id: number | null;
  client_version: string;
  updated_at: string;
  answers: Record<string, number>;
};

const vulnerabilities: Vulnerability[] = [
  {
    id: 1,
    code: 'AVOID_NARROW_ROAD',
    name: '좁은 도로 회피',
    description: '골목길, 산길, 차폭이 좁은 구간에서 부담을 느끼는 유형',
  },
  {
    id: 2,
    code: 'AVOID_BAD_WEATHER',
    name: '악천후 취약',
    description: '비, 눈, 야간처럼 시야가 나빠지는 조건에서 긴장도가 높아지는 유형',
  },
  {
    id: 3,
    code: 'AVOID_HIGHWAY',
    name: '고속 주행 부담',
    description: '고속도로, 합류, 빠른 차선 흐름에서 압박을 느끼는 유형',
  },
  {
    id: 4,
    code: 'AVOID_COMPLEX_INTERSECTION',
    name: '복합 교차로 취약',
    description: '복잡한 교차로, 사각지대, 차선 변경 상황이 어려운 유형',
  },
];

const questions: Question[] = [
  {
    id: 'q1',
    number: 1,
    prompt: 'How confident are you when driving on narrow mountain or rural roads?',
    leftLabel: 'NOT CONFIDENT',
    rightLabel: 'HIGHLY CONFIDENT',
    vulnerabilityScores: { 1: 4 },
  },
  {
    id: 'q2',
    number: 2,
    prompt: 'How comfortable are you with night driving in heavy rain?',
    leftLabel: 'LOW COMFORT',
    rightLabel: 'HIGH COMFORT',
    vulnerabilityScores: { 2: 4 },
  },
  {
    id: 'q3',
    number: 3,
    prompt: 'How strictly do you follow speed limits in urban areas?',
    leftLabel: 'FLEXIBLE',
    rightLabel: 'VERY STRICT',
    vulnerabilityScores: { 3: 1 },
  },
  {
    id: 'q4',
    number: 4,
    prompt: 'How skilled are you at parallel parking in tight spaces?',
    leftLabel: 'LOW SKILL',
    rightLabel: 'HIGH SKILL',
    vulnerabilityScores: { 1: 2 },
  },
  {
    id: 'q5',
    number: 5,
    prompt: 'How comfortable are you driving in heavy highway traffic?',
    leftLabel: 'LOW COMFORT',
    rightLabel: 'HIGH COMFORT',
    vulnerabilityScores: { 3: 4 },
  },
  {
    id: 'q6',
    number: 6,
    prompt: 'How would you rate your awareness of blind spots while merging?',
    leftLabel: 'LOW AWARENESS',
    rightLabel: 'HIGH AWARENESS',
    vulnerabilityScores: { 4: 4 },
  },
  {
    id: 'q7',
    number: 7,
    prompt: 'How likely are you to use your turn signals for every lane change?',
    leftLabel: 'UNLIKELY',
    rightLabel: 'ALWAYS',
    vulnerabilityScores: { 4: 1 },
  },
  {
    id: 'q8',
    number: 8,
    prompt: 'How confident are you handling a vehicle in snowy or icy conditions?',
    leftLabel: 'NOT CONFIDENT',
    rightLabel: 'HIGHLY CONFIDENT',
    vulnerabilityScores: { 2: 4 },
  },
  {
    id: 'q9',
    number: 9,
    prompt: "How patient are you with other drivers' mistakes on the road?",
    leftLabel: 'LOW PATIENCE',
    rightLabel: 'HIGH PATIENCE',
    vulnerabilityScores: { 4: 1, 3: 1 },
  },
  {
    id: 'q10',
    number: 10,
    prompt: 'Overall, how would you rate your general defensive driving skills?',
    leftLabel: 'LOW',
    rightLabel: 'VERY HIGH',
    vulnerabilityScores: { 1: 1, 2: 1, 3: 1, 4: 1 },
  },
];

const SCORE_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const calculateSkillLevel = (answers: Record<string, number>) => {
  const total = Object.values(answers).reduce((sum, value) => sum + value, 0);
  const max = questions.length * 10;
  return Math.round((total / max) * 100);
};

const calculateVulnerabilities = (answers: Record<string, number>) => {
  const totals = new Map<number, number>();

  vulnerabilities.forEach((item) => {
    totals.set(item.id, 0);
  });

  questions.forEach((question) => {
    const answer = answers[question.id];
    if (!answer) {
      return;
    }

    Object.entries(question.vulnerabilityScores).forEach(([id, weight]) => {
      const vulnerabilityId = Number(id);
      const riskScore = (11 - answer) * weight;
      totals.set(vulnerabilityId, (totals.get(vulnerabilityId) ?? 0) + riskScore);
    });
  });

  const ranked = [...totals.entries()]
    .map(([id, score]) => ({
      id,
      score,
    }))
    .sort((left, right) => right.score - left.score);

  const selected = ranked.filter((item) => item.score >= 14).slice(0, 2).map((item) => item.id);
  const fallback = ranked[0]?.id ? [ranked[0].id] : [];

  return {
    vulnerability_type_ids: selected.length > 0 ? selected : fallback,
    primary_vulnerability_type_id: ranked[0]?.id ?? null,
  };
};

const SurveyPage = () => {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submittedResult, setSubmittedResult] = useState<SurveyResult | null>(null);

  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;
  const isComplete = answeredCount === questions.length;

  const preview = useMemo(() => {
    if (!isComplete) {
      return null;
    }

    const skill_level = calculateSkillLevel(answers);
    const vulnerability = calculateVulnerabilities(answers);

    return {
      skill_level,
      ...vulnerability,
    };
  }, [answers, isComplete]);

  const handleSelect = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = () => {
    if (!isComplete || !preview) {
      return;
    }

    const savedUser = JSON.parse(localStorage.getItem('mock_user') ?? '{"user_id":12}');
    const updated_at = new Date().toISOString();

    const result: SurveyResult = {
      user_id: savedUser.user_id ?? 12,
      skill_level: preview.skill_level,
      vulnerability_type_ids: preview.vulnerability_type_ids,
      primary_vulnerability_type_id: preview.primary_vulnerability_type_id,
      client_version: 'survey-v1',
      updated_at,
      answers,
    };

    localStorage.setItem('survey_result', JSON.stringify(result));
    localStorage.setItem('survey_skill_level', String(result.skill_level));
    localStorage.setItem(
      'survey_vulnerability_type_ids',
      JSON.stringify(result.vulnerability_type_ids),
    );
    localStorage.setItem(
      'survey_primary_vulnerability_type_id',
      String(result.primary_vulnerability_type_id ?? ''),
    );

    localStorage.setItem(
      'mock_user',
      JSON.stringify({
        ...savedUser,
        skill_level: result.skill_level,
        vulnerability_type_id: result.primary_vulnerability_type_id,
        updated_at,
      }),
    );

    setSubmittedResult(result);

    window.setTimeout(() => {
      navigate('/map', {
        state: {
          startLocation: '강남역',
          endLocation: '서울숲',
        },
      });
    }, 900);
  };

  const topVulnerabilities = preview
    ? vulnerabilities.filter((item) => preview.vulnerability_type_ids.includes(item.id))
    : [];

  return (
    <div className="survey-page">
      <header className="survey-topbar">
        <div className="survey-brand">
          <FiShield />
          <span>DriveSafe Profile</span>
        </div>
        <button type="button" className="close-pill" onClick={() => navigate('/')}>
          ×
        </button>
      </header>

      <main className="survey-shell">
        <section className="survey-intro-card">
          <h1>Driving Behavior Survey</h1>
          <p>
            Helps understand your driving style. Please rate your comfort and confidence across
            various scenarios on a scale of <strong>1</strong> to <strong>10</strong>.
          </p>
        </section>

        <div className="survey-layout">
          <section className="survey-questions">
            {questions.map((question) => (
              <article key={question.id} className="question-card">
                <div className="question-head">
                  <span className="question-index">{question.number}</span>
                  <h2>{question.prompt}</h2>
                </div>

                <div className="answer-row">
                  {SCORE_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={answers[question.id] === value ? 'score-button selected' : 'score-button'}
                      onClick={() => handleSelect(question.id, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                <div className="answer-scale">
                  <span>{question.leftLabel}</span>
                  <span>{question.rightLabel}</span>
                </div>
              </article>
            ))}

            <div className="survey-notice">
              <FiInfo />
              <p>
                By completing this survey, your responses are stored only in this browser for the
                current prototype.
              </p>
            </div>

            <button type="button" className="submit-survey-button" disabled={!isComplete} onClick={handleSubmit}>
              Complete Survey
              <FiArrowRight />
            </button>
          </section>

          <aside className="survey-summary">
            <div className="summary-card sticky">
              <div className="summary-head">
                <span className="summary-label">Progress</span>
                <strong>
                  {answeredCount}/{questions.length}
                </strong>
              </div>
              <div className="summary-progress-track">
                <div className="summary-progress-fill" style={{ width: `${progress}%` }} />
              </div>

              <div className="summary-block">
                <span className="summary-title">Skill Level Preview</span>
                <strong>{preview ? `${preview.skill_level} / 100` : '답변을 완료하면 계산됩니다'}</strong>
              </div>

              <div className="summary-block">
                <span className="summary-title">Primary Vulnerability</span>
                {preview ? (
                  <div className="tag-stack">
                    {topVulnerabilities.map((item) => (
                      <span key={item.id} className="summary-tag">
                        {item.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="summary-muted">설문 완료 후 취약 특성이 계산됩니다.</p>
                )}
              </div>

              <div className="summary-guide">
                <FiAlertTriangle />
                <p>
                  프론트 MVP에서는 설문 응답을 기반으로 `skill_level`과
                  `vulnerability_type_ids`를 계산해 로컬에 저장합니다.
                </p>
              </div>

              {submittedResult && (
                <div className="summary-success">
                  <FiCheckCircle />
                  <div>
                    <strong>저장 완료</strong>
                    <p>{submittedResult.updated_at}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SurveyPage;
