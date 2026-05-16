import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  deleteMyAccount,
  fetchMyProfile,
  fetchMySurveyHistory,
  updateMyNickname,
  type MyProfile,
  type MySurveyHistoryItem,
} from '../services/me';
import { fetchSurveyQuestions, type SurveyQuestion } from '../services/survey';
import { isLoggedIn, logout, saveAuthSession, getCurrentUser } from '../services/auth';

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
};

const skillLabel = (skill: number | null) => {
  if (skill === null) return '미설정';
  if (skill < 30) return '초보';
  if (skill < 70) return '중급';
  return '숙련';
};

// vulnerability_type_id → 라벨 매핑 (vulnerability_type.csv와 동일)
const VULNERABILITY_NAMES: Record<number, string> = {
  1: '고속/간선도로 회피',
  2: '넓은 도로 선호',
  3: '복잡한 교차로 회피',
  4: '교통량 많은 도로 회피',
  5: '사고다발구간 회피',
  6: '급경사 도로 회피',
};
const vulnLabel = (id: number) => VULNERABILITY_NAMES[id] ?? `취약특성 #${id}`;

const MyPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [histories, setHistories] = useState<MySurveyHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNick, setEditingNick] = useState(false);
  const [newNick, setNewNick] = useState('');
  const [savingNick, setSavingNick] = useState(false);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<MySurveyHistoryItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login', { replace: true, state: { from: '/me' } });
      return;
    }
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [p, h, q] = await Promise.all([
        fetchMyProfile(),
        fetchMySurveyHistory(),
        fetchSurveyQuestions().catch(() => ({ survey_version: '', questions: [] as SurveyQuestion[] })),
      ]);
      setProfile(p);
      setNewNick(p.nickname ?? '');
      setHistories(h.histories);
      setQuestions(q.questions);
    } catch {
      setError('정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteMyAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
      navigate('/', { replace: true });
    } catch {
      alert('회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const saveNickname = async () => {
    if (!newNick.trim() || newNick === profile?.nickname) {
      setEditingNick(false);
      return;
    }
    setSavingNick(true);
    try {
      await updateMyNickname(newNick.trim());
      // localStorage의 currentUser도 갱신
      const cur = getCurrentUser();
      if (cur) {
        saveAuthSession({
          user_id: cur.userId,
          nickname: newNick.trim(),
          skill_level: cur.skillLevel,
          primary_vulnerability_type_id: cur.primaryVulnerabilityTypeId,
          access_token: localStorage.getItem('token') ?? '',
          refresh_token: localStorage.getItem('refreshToken') ?? '',
          role: cur.role,
        });
      }
      await load();
      setEditingNick(false);
    } catch {
      alert('닉네임 변경에 실패했습니다.');
    } finally {
      setSavingNick(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[860px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">person</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-slate-900 leading-none">마이페이지</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">프로필 · 설문 이력</p>
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

      <main className="max-w-[860px] mx-auto px-6 md:px-10 py-10 flex flex-col gap-8">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-slate-400">정보를 불러오는 중...</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
            <span>{error}</span>
          </div>
        )}

        {!isLoading && profile && (
          <>
            {/* Profile card */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 flex flex-col gap-6">
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
                  프로필
                </span>

                <div className="flex items-center gap-5">
                  <div className="bg-primary/10 rounded-full w-20 h-20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[40px] text-primary">account_circle</span>
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    {editingNick ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newNick}
                          onChange={(e) => setNewNick(e.target.value)}
                          className="flex-1 h-10 px-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                          placeholder="닉네임"
                          autoFocus
                        />
                        <button
                          onClick={saveNickname}
                          disabled={savingNick}
                          className="h-10 px-4 bg-primary text-white text-xs font-bold rounded-lg hover:brightness-110 disabled:opacity-50"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => {
                            setEditingNick(false);
                            setNewNick(profile.nickname ?? '');
                          }}
                          className="h-10 px-4 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-200"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-extrabold text-slate-900 truncate">
                          {profile.nickname ?? '이름 없음'}
                        </h2>
                        <button
                          onClick={() => setEditingNick(true)}
                          className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
                          aria-label="닉네임 수정"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-slate-500">{profile.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-50 rounded-xl">
                    <span className="text-2xl font-black text-slate-900 tabular-nums leading-none">
                      {profile.skill_level ?? '-'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      숙련도 점수
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-50 rounded-xl">
                    <span className="text-base font-bold text-slate-900 leading-none">
                      {skillLabel(profile.skill_level)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      레벨
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-50 rounded-xl">
                    <span className="text-base font-bold text-slate-900 leading-none">
                      {histories.length}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                      설문 횟수
                    </span>
                  </div>
                </div>

                {(profile.vulnerability_type_ids?.length ?? 0) > 0 && (
                  <div className="px-4 py-3 bg-primary/5 rounded-xl border border-primary/15">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
                        내 취약특성
                      </p>
                      <span className="text-[10px] font-bold text-primary/70 tabular-nums">
                        {profile.vulnerability_type_ids!.length}개
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.vulnerability_type_ids!.map((id) => {
                        const isPrimary = id === profile.primary_vulnerability_type_id;
                        return (
                          <span
                            key={id}
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              isPrimary
                                ? 'bg-primary text-white'
                                : 'bg-white text-primary border border-primary/30'
                            }`}
                          >
                            {vulnLabel(id)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => navigate('/survey')}
                    className="flex-1 h-11 bg-primary text-white text-sm font-bold rounded-lg hover:brightness-110 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">quiz</span>
                    <span>설문 다시 하기</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="h-11 px-5 border border-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-50"
                  >
                    로그아웃
                  </button>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="self-start text-xs text-slate-400 hover:text-red-600 hover:underline"
                >
                  회원 탈퇴
                </button>
              </div>
            </section>

            {/* Survey history */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-8 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-primary">
                    설문 이력
                  </span>
                  <span className="text-xs text-slate-400 tabular-nums">{histories.length}건</span>
                </div>

                {histories.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2 block">
                      assignment
                    </span>
                    <p className="text-sm text-slate-400">아직 제출한 설문이 없습니다</p>
                    <button
                      onClick={() => navigate('/survey')}
                      className="mt-4 text-sm font-bold text-primary hover:underline"
                    >
                      첫 설문 시작하기 →
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {histories.map((h, idx) => (
                      <button
                        key={h.survey_history_id}
                        type="button"
                        onClick={() => setSelectedHistory(h)}
                        className="text-left flex flex-col gap-2 px-4 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 hover:border-slate-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                              {idx === 0 ? '최신' : `#${histories.length - idx}`}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              v {h.survey_version}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 tabular-nums">
                            {formatDate(h.created_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-600">
                          <span>
                            숙련도{' '}
                            <strong className="tabular-nums text-slate-900">{h.skill_level}점</strong>
                            <span className="ml-1 text-slate-400">
                              ({skillLabel(h.skill_level)})
                            </span>
                          </span>
                          {h.vulnerability_type_ids.length > 0 && (
                            <span className="relative group/vuln inline-block">
                              취약특성{' '}
                              <strong className="text-slate-900 cursor-help border-b border-dotted border-slate-400">
                                {h.vulnerability_type_ids.length}개
                              </strong>
                              <span className="pointer-events-none invisible opacity-0 group-hover/vuln:visible group-hover/vuln:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap bg-slate-900 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg">
                                <span className="flex flex-col gap-1 font-medium">
                                  {h.vulnerability_type_ids.map((id) => (
                                    <span key={id}>• {vulnLabel(id)}</span>
                                  ))}
                                </span>
                                <span className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                              </span>
                            </span>
                          )}
                          <span className="ml-auto text-[11px] text-primary font-bold">상세 보기 →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Survey history detail modal */}
      {selectedHistory && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setSelectedHistory(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-[640px] w-full max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-base font-extrabold text-slate-900">설문 응답 상세</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formatDate(selectedHistory.created_at)} · v {selectedHistory.survey_version}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistory(null)}
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="닫기"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="px-6 py-4 flex items-center gap-4 text-xs bg-slate-50 border-b border-slate-100">
              <span>
                숙련도{' '}
                <strong className="tabular-nums text-slate-900">{selectedHistory.skill_level}점</strong>
                <span className="ml-1 text-slate-400">({skillLabel(selectedHistory.skill_level)})</span>
              </span>
              <span>
                취약특성{' '}
                <strong className="text-slate-900">{selectedHistory.vulnerability_type_ids.length}개</strong>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
              {Object.entries(selectedHistory.answers ?? {}).map(([code, value]) => {
                const q = questions.find((qq) => qq.code === code);
                const option = q?.options.find((o) => o.value === value);
                return (
                  <div key={code} className="border border-slate-100 rounded-xl px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {q?.prompt ?? code}
                    </p>
                    {q && (
                      <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{code}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs tabular-nums">
                        {value}점
                      </span>
                      {option && <span className="text-slate-600">{option.label}</span>}
                    </div>
                  </div>
                );
              })}
              {Object.keys(selectedHistory.answers ?? {}).length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">응답 기록이 없습니다.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account deletion confirm modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => !deleting && setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-[400px] w-full p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-50 rounded-full w-12 h-12 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-600">warning</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">회원 탈퇴</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">되돌릴 수 없습니다</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              계정과 모든 설문 이력, 취약특성 정보가 영구적으로 삭제됩니다.
              <br />
              정말 탈퇴하시겠습니까?
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 h-10 border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 h-10 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? '처리 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
