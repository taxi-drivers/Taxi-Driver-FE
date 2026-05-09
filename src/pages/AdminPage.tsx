import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminSurveyHistoryItem, AdminUserDetail, AdminUserSummary } from '../services/admin';
import {
  getAdminSurveyHistory,
  getAdminUser,
  getAdminUsers,
} from '../services/admin';

const formatDate = (value: string | null) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('ko-KR');
};

const AdminPage = () => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [histories, setHistories] = useState<AdminSurveyHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers();
      setUsers(data.users);
    } catch {
      setError('유저 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetail = async (userId: number) => {
    setError(null);
    try {
      const [user, history] = await Promise.all([getAdminUser(userId), getAdminSurveyHistory(userId)]);
      setSelectedUser(user);
      setHistories(history.histories);
    } catch {
      setError('유저 상세 정보를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f6f8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">Admin</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">유저 및 설문 이력 관리</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadUsers}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              새로고침
            </button>
            <Link
              to="/"
              className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold flex items-center justify-center"
            >
              메인
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1240px] mx-auto px-6 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-[1fr_390px] gap-6">
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">유저 목록</h2>
              <p className="text-xs text-slate-400 mt-1">{users.length}명</p>
            </div>
          </div>

          {error && (
            <div className="m-5 px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="p-10 text-center text-sm text-slate-400">불러오는 중...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3">ID</th>
                    <th className="text-left px-4 py-3">이메일</th>
                    <th className="text-left px-4 py-3">닉네임</th>
                    <th className="text-left px-4 py-3">숙련도</th>
                    <th className="text-left px-4 py-3">취약특성</th>
                    <th className="text-left px-4 py-3">설문</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.user_id}
                      onClick={() => loadDetail(user.user_id)}
                      className="border-t border-slate-100 cursor-pointer hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 font-mono">{user.user_id}</td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">{user.nickname ?? '-'}</td>
                      <td className="px-4 py-3 font-mono">{user.skill_level ?? '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {user.vulnerability_types.length === 0 ? (
                            <span className="text-slate-400">없음</span>
                          ) : (
                            user.vulnerability_types.map((type) => (
                              <span
                                key={type.vulnerability_type_id}
                                className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold"
                              >
                                {type.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{user.survey_history_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900">상세 정보</h2>
          </div>

          {!selectedUser ? (
            <div className="p-8 text-center text-sm text-slate-400">유저를 선택하세요.</div>
          ) : (
            <div className="p-5 flex flex-col gap-5">
              <div className="grid grid-cols-[90px_1fr] gap-3 text-sm">
                <span className="text-slate-400 font-bold">이메일</span>
                <span>{selectedUser.email}</span>
                <span className="text-slate-400 font-bold">닉네임</span>
                <span>{selectedUser.nickname ?? '-'}</span>
                <span className="text-slate-400 font-bold">숙련도</span>
                <span>{selectedUser.skill_level ?? '-'}</span>
                <span className="text-slate-400 font-bold">가입일</span>
                <span>{formatDate(selectedUser.created_at)}</span>
                <span className="text-slate-400 font-bold">최근 설문</span>
                <span>{formatDate(selectedUser.latest_survey_at)}</span>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="text-sm font-extrabold text-slate-900 mb-3">설문 이력</h3>
                <div className="flex flex-col gap-3">
                  {histories.length === 0 ? (
                    <div className="text-sm text-slate-400">설문 이력이 없습니다.</div>
                  ) : (
                    histories.map((history) => (
                      <div key={history.survey_history_id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <strong className="text-sm">#{history.survey_history_id}</strong>
                          <span className="text-xs text-slate-400">{formatDate(history.created_at)}</span>
                        </div>
                        <div className="text-xs text-slate-500 leading-6">
                          <div>버전: {history.survey_version}</div>
                          <div>숙련도: {history.skill_level}</div>
                          <div>취약특성 ID: {history.vulnerability_type_ids.join(', ') || '-'}</div>
                        </div>
                        <pre className="mt-3 max-h-40 overflow-auto rounded bg-slate-50 p-3 text-xs text-slate-600">
                          {JSON.stringify(history.answers ?? {}, null, 2)}
                        </pre>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
};

export default AdminPage;
