import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('1234');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch {
      setError('이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] flex items-center justify-center px-6 py-10">
      <main className="w-full max-w-[420px] bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="px-8 py-7 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-7">
            <div className="bg-primary rounded-lg w-10 h-10 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[22px]">login</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">로그인</h1>
              <p className="text-xs text-slate-400 mt-1">SafeDrive 계정으로 계속하기</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">이메일</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                required
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700">비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 px-4 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                required
              />
            </label>

            {error && (
              <div className="px-4 py-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-lg bg-primary text-white font-bold hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>

        <div className="px-8 py-5 flex items-center justify-between text-sm">
          <Link to="/" className="text-slate-500 hover:text-slate-900 font-semibold">
            메인으로
          </Link>
          <Link to="/signup" className="text-primary font-bold hover:underline">
            회원가입
          </Link>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
